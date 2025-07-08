
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MPESACallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
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

    // Parse the callback data
    const callbackData: MPESACallbackBody = await req.json()
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown'
    
    console.log('MPESA Callback received:', JSON.stringify(callbackData, null, 2))
    console.log('Client IP:', clientIP)

    const { stkCallback } = callbackData.Body
    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata
    } = stkCallback

    // Find the original payment record
    const { data: payment, error: paymentFetchError } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('checkout_request_id', CheckoutRequestID)
      .single()

    if (paymentFetchError || !payment) {
      console.error('Payment record not found:', paymentFetchError)
      
      // Log the error for debugging
      await supabaseClient
        .from('mpesa_callback_errors')
        .insert([{
          callback_payload: callbackData,
          error_message: 'Payment record not found',
          error_details: { checkout_request_id: CheckoutRequestID },
          ip_address: clientIP
        }])

      return new Response(
        JSON.stringify({ ResultCode: 1, ResultDesc: "Payment record not found" }),
        { 
          status: 200, // Return 200 to acknowledge receipt
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    let updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Parse callback metadata if payment was successful
    let amount = 0
    let mpesaReceiptNumber = null
    let phoneNumber = null

    if (ResultCode === 0 && CallbackMetadata?.Item) {
      // Payment successful - extract metadata
      for (const item of CallbackMetadata.Item) {
        switch (item.Name) {
          case 'Amount':
            amount = Number(item.Value)
            break
          case 'MpesaReceiptNumber':
            mpesaReceiptNumber = String(item.Value)
            break
          case 'PhoneNumber':
            phoneNumber = String(item.Value)
            break
        }
      }

      updateData = {
        ...updateData,
        status: 'success',
        mpesa_receipt_number: mpesaReceiptNumber,
        paid_at: new Date().toISOString()
      }

      console.log(`Payment successful: ${amount} from ${phoneNumber}, Receipt: ${mpesaReceiptNumber}`)
    } else {
      // Payment failed
      updateData.status = 'failed'
      console.log(`Payment failed: ${ResultDesc}`)
    }

    // Update the payment record
    const { error: updateError } = await supabaseClient
      .from('payments')
      .update(updateData)
      .eq('id', payment.id)

    if (updateError) {
      console.error('Error updating payment:', updateError)
      throw updateError
    }

    // Log activity
    await supabaseClient.rpc('log_activity', {
      p_user_id: payment.user_id,
      p_action: 'mpesa_payment_callback',
      p_details: {
        payment_id: payment.id,
        status: updateData.status,
        amount: amount || payment.amount_kes,
        mpesa_receipt_number: mpesaReceiptNumber,
        phone_number: phoneNumber || payment.phone_number,
        result_code: ResultCode,
        result_desc: ResultDesc
      }
    })

    // If payment was successful, create subscription
    if (ResultCode === 0) {
      console.log('Payment successful, creating subscription...')
      
      // Extract plan ID from account reference
      const accountRef = payment.checkout_request_id ? 
        await supabaseClient
          .from('payments')
          .select('*')
          .eq('checkout_request_id', CheckoutRequestID)
          .single()
          .then(({ data }) => data?.merchant_request_id || '') 
        : ''

      // Try to extract plan ID from the payment record or account reference
      // For now, we'll need to find the plan based on the amount paid
      const { data: matchingPlan, error: planError } = await supabaseClient
        .from('plans')
        .select('*')
        .eq('price_kes', amount || payment.amount_kes)
        .eq('is_active', true)
        .limit(1)
        .single()

      if (planError || !matchingPlan) {
        console.error('Could not find matching plan for amount:', amount || payment.amount_kes)
      } else {
        // Create subscription via the subscription manager
        try {
          const { data: subscriptionResponse, error: subError } = await supabaseClient.functions.invoke('subscription-manager', {
            body: {
              action: 'create_subscription',
              user_id: payment.user_id,
              plan_id: matchingPlan.id,
              payment_id: payment.id
            }
          })

          if (subError) {
            console.error('Error creating subscription:', subError)
          } else {
            console.log('Subscription created successfully:', subscriptionResponse)
          }
        } catch (error) {
          console.error('Error calling subscription manager:', error)
        }
      }
    }

    console.log(`Payment callback processed successfully for CheckoutRequestID: ${CheckoutRequestID}`)

    // Return success response to Safaricom
    return new Response(
      JSON.stringify({ 
        ResultCode: 0,
        ResultDesc: "Callback processed successfully" 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('MPESA Callback error:', error)

    // Log the error
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      )

      await supabaseClient
        .from('mpesa_callback_errors')
        .insert([{
          callback_payload: await req.json().catch(() => ({})),
          error_message: error.message || 'Unknown error',
          error_details: { stack: error.stack },
          ip_address: req.headers.get('x-forwarded-for') || 'unknown'
        }])
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    return new Response(
      JSON.stringify({ 
        ResultCode: 1,
        ResultDesc: "Internal server error" 
      }),
      { 
        status: 200, // Still return 200 to acknowledge receipt
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
