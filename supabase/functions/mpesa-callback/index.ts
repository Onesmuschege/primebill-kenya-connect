
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Safaricom sandbox IP addresses for validation (optional)
const SAFARICOM_IPS = [
  '196.201.214.200',
  '196.201.214.206',
  '196.201.213.114',
  '196.201.214.207',
  '196.201.214.208',
  '196.201.213.44',
  '196.201.212.127',
  '196.201.212.138',
  '196.201.212.129',
  '196.201.212.136'
]

interface CallbackMetadata {
  Item: Array<{
    Name: string
    Value: string | number
  }>
}

interface STKCallback {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResultCode: number
  ResultDesc: string
  CallbackMetadata?: CallbackMetadata
}

interface CallbackPayload {
  Body: {
    stkCallback: STKCallback
  }
}

// Helper function to extract metadata value
function getMetadataValue(metadata: CallbackMetadata, name: string): string | number | null {
  const item = metadata.Item.find(item => item.Name === name)
  return item ? item.Value : null
}

// Helper function to log callback errors
async function logCallbackError(
  payload: any,
  errorMessage: string,
  errorDetails: any = null,
  ipAddress: string | null = null
) {
  try {
    await supabase
      .from('mpesa_callback_errors')
      .insert({
        callback_payload: payload,
        error_message: errorMessage,
        error_details: errorDetails,
        ip_address: ipAddress
      })
  } catch (error) {
    console.error('Failed to log callback error:', error)
  }
}

// Helper function to log activity
async function logActivity(
  userId: string,
  action: string,
  details: any,
  ipAddress: string | null = null
) {
  try {
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action,
        details,
        ip_address: ipAddress
      })
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== MPESA Callback Received ===')
    
    // Get client IP for validation and logging
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-real-ip') || 
                     'unknown'

    console.log('Client IP:', clientIP)

    // Optional: Validate Safaricom IP (uncomment for production)
    // if (clientIP !== 'unknown' && !SAFARICOM_IPS.includes(clientIP)) {
    //   console.log('Invalid IP address:', clientIP)
    //   return new Response(
    //     JSON.stringify({ error: 'Unauthorized IP address' }),
    //     { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    //   )
    // }

    // Parse callback payload
    const payload: CallbackPayload = await req.json()
    console.log('Callback payload:', JSON.stringify(payload, null, 2))

    // Extract callback data
    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata
    } = payload.Body.stkCallback

    console.log('Processing callback for CheckoutRequestID:', CheckoutRequestID)
    console.log('ResultCode:', ResultCode, 'ResultDesc:', ResultDesc)

    // Find the payment record using CheckoutRequestID
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('checkout_request_id', CheckoutRequestID)
      .single()

    if (paymentError || !payment) {
      const errorMsg = `Payment record not found for CheckoutRequestID: ${CheckoutRequestID}`
      console.error(errorMsg)
      
      await logCallbackError(
        payload,
        errorMsg,
        paymentError,
        clientIP
      )

      return new Response(
        JSON.stringify({ status: 'OK', message: 'Payment record not found' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Found payment record:', payment.id)

    // Determine payment status based on ResultCode
    let paymentStatus: 'success' | 'failed' | 'pending' = 'failed'
    let mpesaReceiptNumber: string | null = null
    let amount: number | null = null
    let phoneNumber: string | null = null
    let paidAt: string | null = null

    if (ResultCode === 0) {
      // Payment successful
      paymentStatus = 'success'
      paidAt = new Date().toISOString()

      if (CallbackMetadata) {
        // Extract metadata values
        mpesaReceiptNumber = getMetadataValue(CallbackMetadata, 'MpesaReceiptNumber') as string
        amount = getMetadataValue(CallbackMetadata, 'Amount') as number
        phoneNumber = getMetadataValue(CallbackMetadata, 'PhoneNumber') as string

        console.log('Payment successful - Receipt:', mpesaReceiptNumber, 'Amount:', amount)
      }
    } else {
      // Payment failed
      paymentStatus = 'failed'
      console.log('Payment failed - Code:', ResultCode, 'Desc:', ResultDesc)
    }

    // Update payment record
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: paymentStatus,
        mpesa_receipt_number: mpesaReceiptNumber,
        paid_at: paidAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id)

    if (updateError) {
      console.error('Failed to update payment record:', updateError)
      
      await logCallbackError(
        payload,
        'Failed to update payment record',
        updateError,
        clientIP
      )

      return new Response(
        JSON.stringify({ status: 'OK', message: 'Failed to update payment' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log activity
    const activityDetails = {
      payment_id: payment.id,
      merchant_request_id: MerchantRequestID,
      checkout_request_id: CheckoutRequestID,
      result_code: ResultCode,
      result_desc: ResultDesc,
      status: paymentStatus,
      amount: amount,
      phone_number: phoneNumber,
      mpesa_receipt_number: mpesaReceiptNumber
    }

    await logActivity(
      payment.user_id,
      'MPESA Payment Callback',
      activityDetails,
      clientIP
    )

    console.log('Payment callback processed successfully')

    // Always return OK to Safaricom
    return new Response(
      JSON.stringify({ status: 'OK' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error processing callback:', error)

    // Log the error
    try {
      const payload = await req.json().catch(() => null)
      const clientIP = req.headers.get('x-forwarded-for') || 'unknown'
      
      await logCallbackError(
        payload,
        'Callback processing error',
        { error: error.message, stack: error.stack },
        clientIP
      )
    } catch (logError) {
      console.error('Failed to log callback error:', logError)
    }

    // Always return OK to Safaricom even on error
    return new Response(
      JSON.stringify({ status: 'OK' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
