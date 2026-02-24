import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { getZoomAccessToken, calculateDuration } from '../_shared/zoom-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdateMeetingRequest {
  meeting_id: string
  lesson_date: string
  start_time: string
  end_time: string
  title?: string
  teacher_name?: string
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: UpdateMeetingRequest = await req.json()
    const { meeting_id, lesson_date, start_time, end_time, title, teacher_name } = body

    console.log(`Updating Zoom meeting ${meeting_id}`)

    // 1. Ottieni access token Zoom
    const zoomToken = await getZoomAccessToken()

    // 2. Calcola durata
    const duration = calculateDuration(start_time, end_time)

    // 3. Prepara payload di aggiornamento
    const updatePayload: any = {
      start_time: `${lesson_date}T${start_time}:00`,
      duration,
      timezone: 'Europe/Rome'
    }

    // Se forniti, aggiorna anche titolo
    if (title && teacher_name) {
      updatePayload.topic = `${title} - ${teacher_name}`
    }

    // 4. PATCH meeting esistente
    const response = await fetch(
      `https://api.zoom.us/v2/meetings/${meeting_id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${zoomToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Zoom API error: ${error}`)
    }

    console.log(`Meeting ${meeting_id} updated successfully`)

    return new Response(
      JSON.stringify({ success: true, meeting_id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error updating Zoom meeting:', error)

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
