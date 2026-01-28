// Edge Function per invio Push Notifications via Firebase Cloud Messaging (HTTP v1)
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { encode as base64Encode } from "https://deno.land/std@0.177.0/encoding/base64url.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Funzione per creare JWT firmato con RS256
async function createSignedJWT(serviceAccount: any): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT"
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.messaging"
  };

  const encodedHeader = base64Encode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64Encode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Import della chiave privata
  const pemContents = serviceAccount.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const encodedSignature = base64Encode(new Uint8Array(signature));
  return `${unsignedToken}.${encodedSignature}`;
}

// Funzione per ottenere access token OAuth2
async function getAccessToken(serviceAccount: any): Promise<string> {
  const jwt = await createSignedJWT(serviceAccount);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`OAuth error: ${data.error_description || data.error}`);
  }
  return data.access_token;
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

    const { tokens, title, body, data } = await req.json()

    // Validazione
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return new Response(
        JSON.stringify({ error: 'tokens (array) richiesto' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'title e body richiesti' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Carica service account dai secrets
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')
    if (!serviceAccountJson) {
      return new Response(
        JSON.stringify({ error: 'Firebase service account non configurato' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const serviceAccount = JSON.parse(serviceAccountJson)
    const accessToken = await getAccessToken(serviceAccount)
    const projectId = serviceAccount.project_id

    // Invia notifica a ogni token
    const results = await Promise.all(tokens.map(async (token: string) => {
      try {
        const response = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: {
                token: token,
                notification: {
                  title: title,
                  body: body
                },
                webpush: {
                  notification: {
                    icon: '/pwa-192x192.png'
                  },
                  fcm_options: {
                    link: data?.url || 'https://maestro-app-smoky.vercel.app'
                  }
                },
                data: data || {}
              }
            })
          }
        );

        const result = await response.json();
        if (response.ok) {
          return { token, success: true };
        } else {
          return { token, success: false, error: result.error?.message || 'Errore sconosciuto' };
        }
      } catch (err) {
        return { token, success: false, error: err.message };
      }
    }));

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Push inviate: ${successCount} riuscite, ${failCount} fallite`,
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Errore invio push:', error)
    return new Response(
      JSON.stringify({ error: 'Errore invio push: ' + error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
