/**
 * Ottiene access token Zoom tramite OAuth Server-to-Server
 * @returns {Promise<string>} Access token valido per 1 ora
 */
export async function getZoomAccessToken(): Promise<string> {
  const accountId = Deno.env.get('ZOOM_ACCOUNT_ID')
  const clientId = Deno.env.get('ZOOM_CLIENT_ID')
  const clientSecret = Deno.env.get('ZOOM_CLIENT_SECRET')

  if (!accountId || !clientId || !clientSecret) {
    throw new Error('Zoom credentials not configured in Supabase secrets')
  }

  // Codifica credenziali in Base64
  const credentials = btoa(`${clientId}:${clientSecret}`)

  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Zoom OAuth failed: ${error}`)
  }

  const data = await response.json()
  return data.access_token
}

/**
 * Calcola durata in minuti tra due orari
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  return (endH * 60 + endM) - (startH * 60 + startM)
}
