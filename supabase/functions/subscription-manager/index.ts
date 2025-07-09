
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GRACE_PERIOD_DAYS = 3

serve(async (req) => {
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

      // Get user details
      const { data: user } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', user_id)
        .single()

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

      // Create user on router (call router-control function)
      try {
        const { data: routers } = await supabaseClient
          .from('routers')
          .select('*')
          .eq('status', 'online')
          .limit(1)

        if (routers && routers.length > 0) {
          await supabaseClient.functions.invoke('router-control', {
            body: {
              action: 'create_user',
              user_id: user_id,
              router_id: routers[0].id,
              username: user?.phone,
              profile: `Plan_${plan.speed_limit_mbps}M`
            }
          })
        }
      } catch (routerError) {
        console.error('Router control error:', routerError)
        // Don't fail subscription creation if router fails
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

    } else if (action === 'check_expiring_soon') {
      // Check for subscriptions expiring in 3 days for notifications
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
      
      const { data: expiringSoon, error: expiringError } = await supabaseClient
        .from('subscriptions')
        .select(`
          id, user_id, end_date, auto_renew,
          users(name, email, phone),
          plans(name, price_kes)
        `)
        .eq('status', 'active')
        .eq('end_date', threeDaysFromNow.toISOString().split('T')[0])

      if (expiringSoon && expiringSoon.length > 0) {
        for (const sub of expiringSoon) {
          // Log renewal reminder
          await supabaseClient.rpc('log_activity', {
            p_user_id: sub.user_id,
            p_action: 'renewal_reminder_sent',
            p_details: {
              subscription_id: sub.id,
              expiry_date: sub.end_date,
              plan_name: sub.plans?.name
            }
          })
        }

        console.log(`Sent renewal reminders for ${expiringSoon.length} subscriptions`)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          reminders_sent: expiringSoon?.length || 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else {
      // Default action: expire subscriptions with grace period handling
      console.log('Running subscription expiry check...')

      const today = new Date().toISOString().split('T')[0]
      const gracePeriodDate = new Date()
      gracePeriodDate.setDate(gracePeriodDate.getDate() - GRACE_PERIOD_DAYS)
      const gracePeriodDateStr = gracePeriodDate.toISOString().split('T')[0]
      
      // Get subscriptions that have exceeded grace period
      const { data: expiredSubs, error: fetchError } = await supabaseClient
        .from('subscriptions')
        .select(`
          id, user_id, end_date, 
          users(phone),
          plans(name, speed_limit_mbps)
        `)
        .eq('status', 'active')
        .lt('end_date', gracePeriodDateStr)

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

      console.log(`Found ${expiredSubs.length} expired subscriptions (beyond grace period)`)

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

      // Disconnect users from routers
      for (const sub of expiredSubs) {
        try {
          // Get active router for user
          const { data: connections } = await supabaseClient
            .from('user_connections')
            .select('router_id')
            .eq('user_id', sub.user_id)
            .eq('status', 'active')
            .limit(1)

          if (connections && connections.length > 0) {
            await supabaseClient.functions.invoke('router-control', {
              body: {
                action: 'disconnect_user',
                user_id: sub.user_id,
                router_id: connections[0].router_id,
                username: sub.users?.phone
              }
            })
          }
        } catch (routerError) {
          console.error('Router disconnect error:', routerError)
          // Continue with other users even if one fails
        }

        // Log activity
        await supabaseClient.rpc('log_activity', {
          p_user_id: sub.user_id,
          p_action: 'subscription_expired',
          p_details: {
            subscription_id: sub.id,
            plan_name: sub.plans?.name || 'Unknown Plan',
            end_date: sub.end_date,
            grace_period_exceeded: true
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
