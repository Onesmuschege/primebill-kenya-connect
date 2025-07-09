
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RouterOSCommand {
  command: string
  arguments?: Record<string, string>
}

class RouterOSAPI {
  private host: string
  private port: number
  private username: string
  private password: string

  constructor(host: string, port: number, username: string, password: string) {
    this.host = host
    this.port = port
    this.username = username
    this.password = password
  }

  async connect(): Promise<WebSocket> {
    const ws = new WebSocket(`ws://${this.host}:${this.port}/`)
    return new Promise((resolve, reject) => {
      ws.onopen = () => resolve(ws)
      ws.onerror = (error) => reject(error)
    })
  }

  async executeCommand(command: RouterOSCommand): Promise<any> {
    try {
      // For demo purposes, simulate RouterOS API calls
      // In production, you'd use actual RouterOS API protocol
      const response = await fetch(`http://${this.host}:${this.port}/rest/${command.command}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${this.username}:${this.password}`)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(command.arguments || {})
      })
      
      if (!response.ok) {
        throw new Error(`RouterOS API error: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('RouterOS API call failed:', error)
      throw error
    }
  }

  async addUser(username: string, password: string, profile: string): Promise<void> {
    await this.executeCommand({
      command: 'ppp/secret/add',
      arguments: {
        name: username,
        password: password,
        profile: profile,
        service: 'pppoe'
      }
    })
  }

  async removeUser(username: string): Promise<void> {
    await this.executeCommand({
      command: 'ppp/secret/remove',
      arguments: { name: username }
    })
  }

  async setUserProfile(username: string, profile: string): Promise<void> {
    await this.executeCommand({
      command: 'ppp/secret/set',
      arguments: {
        name: username,
        profile: profile
      }
    })
  }

  async getUserStats(username: string): Promise<any> {
    return await this.executeCommand({
      command: 'ppp/active/print',
      arguments: { name: username }
    })
  }

  async createProfile(name: string, speedLimitMbps: number): Promise<void> {
    const rateLimit = `${speedLimitMbps}M/${speedLimitMbps}M`
    await this.executeCommand({
      command: 'ppp/profile/add',
      arguments: {
        name: name,
        'rate-limit': rateLimit,
        'only-one': 'yes'
      }
    })
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

    const { action, user_id, router_id, username, profile, speed_limit } = await req.json()

    console.log(`Router control action: ${action} for user: ${user_id}`)

    // Get router details
    const { data: router, error: routerError } = await supabaseClient
      .from('routers')
      .select('*')
      .eq('id', router_id)
      .single()

    if (routerError || !router) {
      console.error('Router not found:', routerError)
      return new Response(
        JSON.stringify({ error: 'Router not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize RouterOS API
    const routerAPI = new RouterOSAPI(
      router.ip_address,
      router.api_port,
      router.username,
      router.password_encrypted // In production, decrypt this
    )

    switch (action) {
      case 'create_user': {
        const { data: user } = await supabaseClient
          .from('users')
          .select('*')
          .eq('id', user_id)
          .single()

        if (!user) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Create user on router
        await routerAPI.addUser(username || user.phone, user.phone, profile)

        // Log connection
        await supabaseClient
          .from('user_connections')
          .insert([{
            user_id: user_id,
            router_id: router_id,
            status: 'active'
          }])

        console.log(`User ${username} created on router ${router.location_name}`)
        break
      }

      case 'update_user_speed': {
        await routerAPI.setUserProfile(username, profile)
        console.log(`User ${username} speed updated to profile ${profile}`)
        break
      }

      case 'disconnect_user': {
        await routerAPI.removeUser(username)

        // Update connection status
        await supabaseClient
          .from('user_connections')
          .update({ 
            status: 'disconnected',
            connection_end: new Date().toISOString()
          })
          .eq('user_id', user_id)
          .eq('router_id', router_id)
          .eq('status', 'active')

        console.log(`User ${username} disconnected from router`)
        break
      }

      case 'get_user_stats': {
        const stats = await routerAPI.getUserStats(username)
        
        // Update usage statistics
        await supabaseClient
          .from('usage_statistics')
          .upsert([{
            user_id: user_id,
            date: new Date().toISOString().split('T')[0],
            bytes_downloaded: stats.bytes_in || 0,
            bytes_uploaded: stats.bytes_out || 0,
            session_duration: Math.floor((Date.now() - new Date(stats.uptime).getTime()) / 60000)
          }])

        return new Response(
          JSON.stringify({ success: true, stats }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'create_profile': {
        await routerAPI.createProfile(`Plan_${speed_limit}M`, speed_limit)
        console.log(`Profile Plan_${speed_limit}M created on router`)
        break
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Log activity
    await supabaseClient.rpc('log_activity', {
      p_user_id: user_id,
      p_action: `router_${action}`,
      p_details: {
        router_id,
        username,
        profile,
        router_location: router.location_name
      }
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Router control error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Router control failed' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
