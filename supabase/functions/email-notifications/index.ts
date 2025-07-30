import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  email: string
  subject: string
  message: string
  user_id?: string
  type: 'payment_success' | 'payment_failure' | 'subscription_expiry' | 'subscription_reminder' | 'support_update' | 'network_alert' | 'invoice' | 'general'
  html_content?: string
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

    const { email, subject, message, user_id, type, html_content }: EmailRequest = await req.json()

    // Validate required environment variables for SMTP
    const smtpHost = Deno.env.get('SMTP_HOST')
    const smtpPort = Deno.env.get('SMTP_PORT')
    const smtpUser = Deno.env.get('SMTP_USER')
    const smtpPass = Deno.env.get('SMTP_PASS')
    const fromEmail = Deno.env.get('FROM_EMAIL')
    
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !fromEmail) {
      console.error('Missing SMTP configuration')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate input
    if (!email || !subject || !message || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: email, subject, message, type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Sending email to ${email}: ${type}`)

    // Generate HTML content if not provided
    const emailHtml = html_content || generateEmailTemplate(subject, message, type)

    // Send email via SMTP
    const emailResult = await sendEmail({
      host: smtpHost,
      port: parseInt(smtpPort),
      username: smtpUser,
      password: smtpPass,
      from: fromEmail,
      to: email,
      subject: subject,
      html: emailHtml,
      text: message
    })

    // Log the email attempt
    await supabaseClient
      .from('email_logs')
      .insert([{
        user_id: user_id,
        email_address: email,
        subject: subject,
        message: message,
        message_type: type,
        status: emailResult.success ? 'sent' : 'failed',
        provider_response: emailResult.response
      }])

    // Log activity if user_id is provided
    if (user_id) {
      await supabaseClient.rpc('log_activity', {
        p_user_id: user_id,
        p_action: 'email_sent',
        p_details: {
          email: email,
          subject: subject,
          message_type: type,
          status: emailResult.success ? 'sent' : 'failed'
        }
      })
    }

    if (emailResult.success) {
      console.log(`Email sent successfully to ${email}`)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email sent successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      throw new Error(emailResult.error || 'Email sending failed')
    }

  } catch (error) {
    console.error('Email notification error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send email',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function sendEmail(config: {
  host: string
  port: number
  username: string
  password: string
  from: string
  to: string
  subject: string
  html: string
  text: string
}) {
  try {
    // For production, you would use a proper SMTP library
    // This is a simplified implementation using a REST API approach
    
    // Using a service like SendGrid, Mailgun, or similar
    const response = await fetch('https://api.sendgrid.v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.password}`, // Use SendGrid API key as password
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: config.to }]
        }],
        from: { email: config.from },
        subject: config.subject,
        content: [
          {
            type: 'text/plain',
            value: config.text
          },
          {
            type: 'text/html',
            value: config.html
          }
        ]
      })
    })

    if (response.ok) {
      return {
        success: true,
        response: await response.text(),
        error: null
      }
    } else {
      const errorText = await response.text()
      return {
        success: false,
        response: errorText,
        error: `SendGrid API error: ${response.status} ${response.statusText}`
      }
    }
  } catch (error) {
    console.error('Email sending error:', error)
    return {
      success: false,
      response: null,
      error: error.message
    }
  }
}

function generateEmailTemplate(subject: string, message: string, type: string): string {
  const companyName = 'PrimeBill Solutions'
  const primaryColor = '#1F2937'
  const accentColor = '#3B82F6'
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background-color: ${primaryColor}; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .btn { display: inline-block; padding: 12px 24px; background-color: ${accentColor}; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        .alert { padding: 15px; margin: 15px 0; border-radius: 4px; }
        .alert-success { background-color: #d4edda; border-color: #c3e6cb; color: #155724; }
        .alert-warning { background-color: #fff3cd; border-color: #ffeaa7; color: #856404; }
        .alert-danger { background-color: #f8d7da; border-color: #f5c6cb; color: #721c24; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${companyName}</h1>
          <p>Internet Service Provider</p>
        </div>
        <div class="content">
          <h2>${subject}</h2>
          ${getAlertClass(type)}
          <p>${message.replace(/\n/g, '<br>')}</p>
          ${getActionButton(type)}
        </div>
        <div class="footer">
          <p>&copy; 2024 ${companyName}. All rights reserved.</p>
          <p>Nairobi, Kenya | support@primebill.co.ke</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function getAlertClass(type: string): string {
  switch (type) {
    case 'payment_success':
      return '<div class="alert alert-success"><strong>Payment Successful!</strong></div>'
    case 'payment_failure':
      return '<div class="alert alert-danger"><strong>Payment Failed!</strong></div>'
    case 'subscription_expiry':
      return '<div class="alert alert-warning"><strong>Subscription Expiring!</strong></div>'
    case 'network_alert':
      return '<div class="alert alert-warning"><strong>Network Alert!</strong></div>'
    default:
      return ''
  }
}

function getActionButton(type: string): string {
  const baseUrl = 'https://your-domain.com'
  
  switch (type) {
    case 'payment_failure':
      return `<a href="${baseUrl}/payment" class="btn">Retry Payment</a>`
    case 'subscription_expiry':
      return `<a href="${baseUrl}/plans" class="btn">Renew Subscription</a>`
    case 'support_update':
      return `<a href="${baseUrl}/support" class="btn">View Support Ticket</a>`
    default:
      return `<a href="${baseUrl}/dashboard" class="btn">Go to Dashboard</a>`
  }
}