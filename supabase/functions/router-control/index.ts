
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    const { user_id, action, router_id } = await req.json()

    console.log(`Router control request: ${action} for user ${user_id} on router ${router_id}`)

    // Get user subscription status
    const { data: subscription, error: subError } = await supabaseClient
      .from('subscriptions')
      .select(`
        *,
        plans (*)
      `)
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single()

    if (subError) {
      console.error('Error fetching subscription:', subError)
      return new Response(
        JSON.stringify({ error: 'No active subscription found' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get router details
    const { data: router, error: routerError } = await supabaseClient
      .from('routers')
      .select('*')
      .eq('id', router_id)
      .single()

    if (routerError) {
      console.error('Error fetching router:', routerError)
      return new Response(
        JSON.stringify({ error: 'Router not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Here you would implement actual MikroTik RouterOS API calls
    // This is a placeholder for the router control logic
    let result = {}
    
    switch (action) {
      case 'enable':
        // Enable user access on router
        result = await enableUserAccess(router, user_id, subscription)
        break
      case 'disable':
        // Disable user access on router
        result = await disableUserAccess(router, user_id)
        break
      case 'set_bandwidth':
        // Set bandwidth limits based on plan
        result = await setBandwidthLimit(router, user_id, subscription.plans.speed_limit_mbps)
        break
      default:
        throw new Error('Invalid action')
    }

    // Log the activity
    await supabaseClient.from('activity_logs').insert({
      user_id: user_id,
      action: `router_${action}`,
      details: {
        router_id: router_id,
        router_location: router.location_name,
        action: action,
        result: result
      }
    })

    return new Response(
      JSON.stringify({ success: true, result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Router control error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Placeholder functions for MikroTik RouterOS API integration
async function enableUserAccess(router: any, userId: string, subscription: any) {
  // This would connect to MikroTik RouterOS API and enable user access
  console.log(`Enabling access for user ${userId} on router ${router.location_name}`)
  
  // Example: Add user to active users list, set bandwidth limits, etc.
  return {
    action: 'enable',
    user_id: userId,
    router: router.location_name,
    bandwidth_limit: subscription.plans.speed_limit_mbps,
    status: 'enabled'
  }
}

async function disableUserAccess(router: any, userId: string) {
  // This would connect to MikroTik RouterOS API and disable user access
  console.log(`Disabling access for user ${userId} on router ${router.location_name}`)
  
  return {
    action: 'disable',
    user_id: userId,
    router: router.location_name,
    status: 'disabled'
  }
}

async function setBandwidthLimit(router: any, userId: string, speedLimitMbps: number) {
  // This would connect to MikroTik RouterOS API and set bandwidth limits
  console.log(`Setting bandwidth limit to ${speedLimitMbps}Mbps for user ${userId} on router ${router.location_name}`)
  
  return {
    action: 'set_bandwidth',
    user_id: userId,
    router: router.location_name,
    speed_limit_mbps: speedLimitMbps,
    status: 'applied'
  }
}
