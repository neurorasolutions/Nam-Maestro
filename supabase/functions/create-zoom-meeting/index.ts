import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { getZoomAccessToken, calculateDuration } from '../_shared/zoom-auth.ts'

interface CreateMeetingRequest {
  lesson_id: string
  title: string
  teacher_name: string
  lesson_date: string
  start_time: string
  end_time: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request
    const body: CreateMeetingRequest = await req.json()
    const { lesson_id, title, teacher_name, lesson_date, start_time, end_time } = body

    console.log(`Creating Zoom meeting for lesson ${lesson_id}: ${title}`)

    // 1. Ottieni access token Zoom
    const zoomToken = await getZoomAccessToken()

    // 2. Calcola durata lezione
    const duration = calculateDuration(start_time, end_time)

    // 3. Crea meeting Zoom
    const meetingPayload = {
      topic: `${title} - ${teacher_name}`,
      type: 2, // Scheduled meeting
      start_time: `${lesson_date}T${start_time}:00`, // ISO 8601 format
      duration: duration,
      timezone: 'Europe/Rome', // IMPORTANTE: timezone italiana
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false, // Studenti aspettano il docente
        mute_upon_entry: true,
        waiting_room: true,
        audio: 'both',
        auto_recording: 'none', // Cambia in 'cloud' per registrazione automatica
        alternative_hosts: '', // Opzionale: email altri host
      }
    }

    const meetingResponse = await fetch(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${zoomToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(meetingPayload)
      }
    )

    if (!meetingResponse.ok) {
      const error = await meetingResponse.text()
      throw new Error(`Zoom API error: ${error}`)
    }

    const meeting = await meetingResponse.json()

    console.log(`Zoom meeting created: ${meeting.id}`)

    // 4. Aggiorna lesson nel database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error: updateError } = await supabase
      .from('lessons')
      .update({
        zoom_meeting_id: meeting.id.toString(),
        zoom_link: meeting.join_url,
        zoom_host_link: meeting.start_url,
        zoom_password: meeting.password || null,
        zoom_created_at: new Date().toISOString(),
        zoom_error: null, // Pulisci eventuali errori precedenti
        zoom_retry_count: 0
      })
      .eq('id', lesson_id)

    if (updateError) {
      console.error('Database update error:', updateError)
      throw updateError
    }

    console.log(`Database updated for lesson ${lesson_id}`)

    // 5. Risposta
    return new Response(
      JSON.stringify({
        success: true,
        meeting_id: meeting.id,
        join_url: meeting.join_url,
        start_url: meeting.start_url
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error creating Zoom meeting:', error)

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
