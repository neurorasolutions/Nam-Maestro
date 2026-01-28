// Edge Function per invio email via Gmail SMTP
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Gestione preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Metodo non consentito' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { to, subject, body, isHtml = true } = await req.json()

    // Validazione
    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: 'Parametri mancanti: to, subject, body richiesti' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Credenziali Gmail dai secrets
    const gmailUser = Deno.env.get('GMAIL_USER')
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD')

    if (!gmailUser || !gmailPassword) {
      return new Response(
        JSON.stringify({ error: 'Credenziali Gmail non configurate' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Configura client SMTP Gmail
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: gmailUser,
          password: gmailPassword,
        },
      },
    });

    // Gestisci destinatari multipli (array o stringa)
    const recipients = Array.isArray(to) ? to : [to]

    // Invia email
    await client.send({
      from: gmailUser,
      to: recipients,
      subject: subject,
      content: isHtml ? undefined : body,
      html: isHtml ? body : undefined,
    });

    await client.close();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email inviata a ${recipients.length} destinatario/i`,
        recipients: recipients
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Errore invio email:', error)
    return new Response(
      JSON.stringify({ error: 'Errore invio email: ' + error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
