import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { getZoomAccessToken } from '../_shared/zoom-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteMeetingRequest {
  meeting_id: string
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: DeleteMeetingRequest = await req.json()
    const { meeting_id } = body

    console.log(`Deleting Zoom meeting ${meeting_id}`)

    // 1. Ottieni access token Zoom
    const zoomToken = await getZoomAccessToken()

    // 2. DELETE meeting
    const response = await fetch(
      `https://api.zoom.us/v2/meetings/${meeting_id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${zoomToken}`
        }
      }
    )

    // 404 = meeting già cancellato, consideriamo OK
    if (!response.ok && response.status !== 404) {
      const error = await response.text()
      throw new Error(`Zoom API error: ${error}`)
    }

    console.log(`Meeting ${meeting_id} deleted successfully`)

    return new Response(
      JSON.stringify({ success: true, meeting_id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error deleting Zoom meeting:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
