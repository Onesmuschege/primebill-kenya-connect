import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SMSRequest {
  phone: string
  message: string
  user_id?: string
  type: 'payment_success' | 'payment_failure' | 'subscription_expiry' | 'subscription_reminder' | 'support_update' | 'network_alert' | 'general'
}

interface AfricasTalkingResponse {
  SMSMessageData: {
    Message: string
    Recipients: Array<{
      statusCode: number
      number: string
      status: string
      cost: string
      messageId: string
    }>
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { phone, message, user_id, type }: SMSRequest = await req.json()

    // Validate required environment variables
    const username = Deno.env.get('AFRICAS_TALKING_USERNAME')
    const apiKey = Deno.env.get('AFRICAS_TALKING_API_KEY')
    
    if (!username || !apiKey) {
      console.error('Missing AfricasTalking credentials')
      return new Response(
        JSON.stringify({ error: 'SMS service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate input
    if (!phone || !message || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: phone, message, type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format phone number for Kenya
    const formattedPhone = formatKenyanPhone(phone)
    if (!formattedPhone) {
      return new Response(
        JSON.stringify({ error: 'Invalid Kenyan phone number format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Sending SMS to ${formattedPhone}: ${type}`)

    // Send SMS via AfricasTalking
    const smsResult = await sendSMS(username, apiKey, formattedPhone, message)

    // Log the SMS attempt
    await supabaseClient
      .from('sms_logs')
      .insert([{
        user_id: user_id,
        phone_number: formattedPhone,
        message: message,
        message_type: type,
        status: smsResult.success ? 'sent' : 'failed',
        provider_response: smsResult.response,
        cost_kes: smsResult.cost || 0
      }])

    // Log activity if user_id is provided
    if (user_id) {
      await supabaseClient.rpc('log_activity', {
        p_user_id: user_id,
        p_action: 'sms_sent',
        p_details: {
          phone: formattedPhone,
          message_type: type,
          status: smsResult.success ? 'sent' : 'failed',
          cost: smsResult.cost
        }
      })
    }

    if (smsResult.success) {
      console.log(`SMS sent successfully to ${formattedPhone}`)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'SMS sent successfully',
          message_id: smsResult.messageId,
          cost: smsResult.cost
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      throw new Error(smsResult.error || 'SMS sending failed')
    }

  } catch (error) {
    console.error('SMS notification error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send SMS',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function sendSMS(username: string, apiKey: string, phone: string, message: string) {
  try {
    const url = 'https://api.africastalking.com/version1/messaging'
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': apiKey
      },
      body: new URLSearchParams({
        username: username,
        to: phone,
        message: message,
        from: username // Use your sender ID if you have one
      })
    })

    if (!response.ok) {
      throw new Error(`AfricasTalking API error: ${response.statusText}`)
    }

    const data: AfricasTalkingResponse = await response.json()
    
    if (data.SMSMessageData.Recipients.length > 0) {
      const recipient = data.SMSMessageData.Recipients[0]
      
      return {
        success: recipient.statusCode === 101 || recipient.statusCode === 102, // Success codes
        response: data,
        messageId: recipient.messageId,
        cost: parseFloat(recipient.cost.replace('KES ', '')),
        error: recipient.statusCode === 101 || recipient.statusCode === 102 ? null : recipient.status
      }
    } else {
      throw new Error('No recipients in response')
    }
  } catch (error) {
    console.error('AfricasTalking API error:', error)
    return {
      success: false,
      response: null,
      messageId: null,
      cost: 0,
      error: error.message
    }
  }
}

function formatKenyanPhone(phone: string): string | null {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // Handle different formats
  if (cleaned.startsWith('+254')) {
    const number = cleaned.slice(4)
    if (number.length === 9 && (number.startsWith('7') || number.startsWith('1'))) {
      return `+254${number}`
    }
  } else if (cleaned.startsWith('254')) {
    const number = cleaned.slice(3)
    if (number.length === 9 && (number.startsWith('7') || number.startsWith('1'))) {
      return `+254${number}`
    }
  } else if (cleaned.startsWith('0')) {
    const number = cleaned.slice(1)
    if (number.length === 9 && (number.startsWith('7') || number.startsWith('1'))) {
      return `+254${number}`
    }
  }
  
  return null
}