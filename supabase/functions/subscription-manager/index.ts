
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { action } = await req.json().catch(() => ({ action: 'expire_subscriptions' }))

    if (action === 'create_subscription') {
      // This is called after successful payment to create subscription
      const { user_id, plan_id, payment_id } = await req.json()
      
      console.log(`Creating subscription for user ${user_id}, plan ${plan_id}`)

      // Get plan details
      const { data: plan, error: planError } = await supabaseClient
        .from('plans')
        .select('*')
        .eq('id', plan_id)
        .single()

      if (planError || !plan) {
        console.error('Plan not found:', planError)
        return new Response(
          JSON.stringify({ error: 'Plan not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calculate dates
      const startDate = new Date()
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + plan.validity_days)

      // Create subscription
      const { data: subscription, error: subError } = await supabaseClient
        .from('subscriptions')
        .insert([{
          user_id,
          plan_id,
          payment_id,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          status: 'active',
          auto_renew: false
        }])
        .select()
        .single()

      if (subError) {
        console.error('Error creating subscription:', subError)
        return new Response(
          JSON.stringify({ error: 'Failed to create subscription' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Log activity
      await supabaseClient.rpc('log_activity', {
        p_user_id: user_id,
        p_action: 'subscription_created',
        p_details: {
          subscription_id: subscription.id,
          plan_name: plan.name,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          payment_id
        }
      })

      console.log(`Subscription created successfully: ${subscription.id}`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          subscription_id: subscription.id,
          end_date: endDate.toISOString().split('T')[0]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Default action: expire subscriptions (cron job)
      console.log('Running subscription expiry check...')

      // Get all active subscriptions that have expired
      const today = new Date().toISOString().split('T')[0]
      
      const { data: expiredSubs, error: fetchError } = await supabaseClient
        .from('subscriptions')
        .select('id, user_id, end_date, plans(name)')
        .eq('status', 'active')
        .lt('end_date', today)

      if (fetchError) {
        console.error('Error fetching expired subscriptions:', fetchError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch subscriptions' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!expiredSubs || expiredSubs.length === 0) {
        console.log('No expired subscriptions found')
        return new Response(
          JSON.stringify({ message: 'No expired subscriptions found', expired_count: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Found ${expiredSubs.length} expired subscriptions`)

      // Update expired subscriptions
      const expiredIds = expiredSubs.map(sub => sub.id)
      
      const { error: updateError } = await supabaseClient
        .from('subscriptions')
        .update({ 
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .in('id', expiredIds)

      if (updateError) {
        console.error('Error updating expired subscriptions:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update subscriptions' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Log activities for each expired subscription
      for (const sub of expiredSubs) {
        await supabaseClient.rpc('log_activity', {
          p_user_id: sub.user_id,
          p_action: 'subscription_expired',
          p_details: {
            subscription_id: sub.id,
            plan_name: sub.plans?.name || 'Unknown Plan',
            end_date: sub.end_date
          }
        })
      }

      console.log(`Successfully expired ${expiredSubs.length} subscriptions`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Expired ${expiredSubs.length} subscriptions`,
          expired_count: expiredSubs.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Subscription manager error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
