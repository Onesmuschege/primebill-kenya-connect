
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface STKPushRequest {
  amount: number;
  phone: string;
  account_reference: string;
  email?: string;
  user_id: string;
}

interface MPESAAuthResponse {
  access_token: string;
  expires_in: string;
}

interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { amount, phone, account_reference, email, user_id }: STKPushRequest = await req.json()

    // Validate required environment variables
    const requiredEnvVars = [
      'MPESA_CONSUMER_KEY',
      'MPESA_CONSUMER_SECRET', 
      'MPESA_SHORTCODE',
      'MPESA_PASSKEY'
    ]

    for (const envVar of requiredEnvVars) {
      if (!Deno.env.get(envVar)) {
        console.error(`Missing required environment variable: ${envVar}`)
        return new Response(
          JSON.stringify({ error: `Missing configuration: ${envVar}` }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Validate input parameters
    if (!amount || !phone || !account_reference || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: amount, phone, account_reference, user_id' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate and format phone number for Kenya (+254 or 07xx/01xx)
    const formattedPhone = formatKenyanPhone(phone)
    if (!formattedPhone) {
      return new Response(
        JSON.stringify({ error: 'Invalid Kenyan phone number format. Use +254XXXXXXXXX or 07XXXXXXXX/01XXXXXXXX' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate amount (must be positive and format to 2 decimal places)
    const formattedAmount = Math.round(amount * 100) / 100
    if (formattedAmount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Amount must be greater than 0' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Initiating STK Push for user ${user_id}: KES ${formattedAmount} to ${formattedPhone}`)

    // Step 1: Get OAuth token from Safaricom
    const authToken = await getMPESAAuthToken()
    if (!authToken) {
      throw new Error('Failed to get MPESA authentication token')
    }

    // Step 2: Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
    const shortcode = Deno.env.get('MPESA_SHORTCODE')!
    const passkey = Deno.env.get('MPESA_PASSKEY')!
    const password = btoa(`${shortcode}${passkey}${timestamp}`)

    // Step 3: Prepare STK Push request
    const stkPushPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(formattedAmount), // MPESA expects integer amount
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback`, // Callback endpoint
      AccountReference: account_reference,
      TransactionDesc: `Payment for ${account_reference} - PrimeBill Solutions`
    }

    // Step 4: Send STK Push request
    const stkResponse = await sendSTKPush(authToken, stkPushPayload)

    // Step 5: Log the payment attempt to database
    const paymentRecord = {
      user_id: user_id,
      amount_kes: formattedAmount,
      method: 'MPESA',
      phone_number: formattedPhone,
      status: 'pending',
      checkout_request_id: stkResponse.CheckoutRequestID,
      merchant_request_id: stkResponse.MerchantRequestID
    }

    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert([paymentRecord])
      .select()
      .single()

    if (paymentError) {
      console.error('Error saving payment record:', paymentError)
      throw paymentError
    }

    // Step 6: Log activity
    await supabaseClient.rpc('log_activity', {
      p_user_id: user_id,
      p_action: 'mpesa_stk_push_initiated',
      p_details: {
        amount: formattedAmount,
        phone: formattedPhone,
        account_reference: account_reference,
        checkout_request_id: stkResponse.CheckoutRequestID,
        merchant_request_id: stkResponse.MerchantRequestID,
        payment_id: payment.id
      }
    })

    console.log(`STK Push initiated successfully: ${stkResponse.CheckoutRequestID}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: stkResponse.CustomerMessage || 'STK Push sent successfully',
        checkout_request_id: stkResponse.CheckoutRequestID,
        merchant_request_id: stkResponse.MerchantRequestID,
        payment_id: payment.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('MPESA STK Push error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to initiate STK Push',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Get OAuth token from Safaricom Daraja API
 */
async function getMPESAAuthToken(): Promise<string | null> {
  try {
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY')!
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET')!
    const credentials = btoa(`${consumerKey}:${consumerSecret}`)

    // Use sandbox URL for testing, change to production when ready
    const authUrl = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    
    const response = await fetch(authUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Auth response not ok:', response.status, response.statusText)
      return null
    }

    const data: MPESAAuthResponse = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error getting MPESA auth token:', error)
    return null
  }
}

/**
 * Send STK Push request to Safaricom
 */
async function sendSTKPush(authToken: string, payload: any): Promise<STKPushResponse> {
  // Use sandbox URL for testing, change to production when ready
  const stkUrl = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
  
  const response = await fetch(stkUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('STK Push response not ok:', response.status, response.statusText, errorText)
    throw new Error(`STK Push failed: ${response.status} ${response.statusText}`)
  }

  const data: STKPushResponse = await response.json()
  
  // Check if the response indicates success
  if (data.ResponseCode !== '0') {
    throw new Error(`STK Push failed: ${data.ResponseDescription}`)
  }

  return data
}

/**
 * Format and validate Kenyan phone numbers
 * Accepts: +254XXXXXXXXX, 254XXXXXXXXX, 07XXXXXXXX, 01XXXXXXXX
 * Returns: 254XXXXXXXXX format or null if invalid
 */
function formatKenyanPhone(phone: string): string | null {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // Handle different formats
  if (cleaned.startsWith('+254')) {
    const number = cleaned.slice(4)
    if (number.length === 9 && (number.startsWith('7') || number.startsWith('1'))) {
      return `254${number}`
    }
  } else if (cleaned.startsWith('254')) {
    const number = cleaned.slice(3)
    if (number.length === 9 && (number.startsWith('7') || number.startsWith('1'))) {
      return cleaned
    }
  } else if (cleaned.startsWith('0')) {
    const number = cleaned.slice(1)
    if (number.length === 9 && (number.startsWith('7') || number.startsWith('1'))) {
      return `254${number}`
    }
  }
  
  return null
}
