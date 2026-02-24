import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { getZoomAccessToken, calculateDuration } from '../_shared/zoom-auth.ts'

const BATCH_SIZE = 8 // Sotto il limite di 10/sec per sicurezza
const DELAY_MS = 1000 // 1 secondo tra batch

interface Lesson {
  id: string
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
    const { lessons }: { lessons: Lesson[] } = await req.json()

    console.log(`Starting batch creation for ${lessons.length} lessons`)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const results = {
      total: lessons.length,
      created: 0,
      failed: 0,
      errors: [] as any[]
    }

    // Processa in batch
    for (let i = 0; i < lessons.length; i += BATCH_SIZE) {
      const batch = lessons.slice(i, i + BATCH_SIZE)
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(lessons.length / BATCH_SIZE)

      console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} lessons)`)

      // Processa batch in parallelo
      const batchPromises = batch.map(lesson =>
        createMeetingWithRetry(lesson, supabase)
      )

      const batchResults = await Promise.allSettled(batchPromises)

      // Conta risultati
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          results.created++
        } else {
          results.failed++
          results.errors.push({
            lesson_id: batch[index].id,
            error: result.status === 'rejected' ? result.reason : result.value.error
          })
        }
      })

      // Delay prima del prossimo batch (tranne l'ultimo)
      if (i + BATCH_SIZE < lessons.length) {
        console.log(`Waiting ${DELAY_MS}ms before next batch...`)
        await new Promise(resolve => setTimeout(resolve, DELAY_MS))
      }
    }

    console.log(`Batch completed: ${results.created} created, ${results.failed} failed`)

    return new Response(
      JSON.stringify(results),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Batch creation error:', error)

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

/**
 * Crea meeting Zoom con retry automatico
 */
async function createMeetingWithRetry(
  lesson: Lesson,
  supabase: any,
  maxRetries = 3
): Promise<{ success: boolean; error?: string }> {

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Ottieni token
      const zoomToken = await getZoomAccessToken()

      // Calcola durata
      const duration = calculateDuration(lesson.start_time, lesson.end_time)

      // Crea meeting
      const meetingResponse = await fetch(
        'https://api.zoom.us/v2/users/me/meetings',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${zoomToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            topic: `${lesson.title} - ${lesson.teacher_name}`,
            type: 2,
            start_time: `${lesson.lesson_date}T${lesson.start_time}:00`,
            duration,
            timezone: 'Europe/Rome',
            settings: {
              host_video: true,
              participant_video: true,
              join_before_host: false,
              mute_upon_entry: true,
              waiting_room: true,
              audio: 'both',
              auto_recording: 'none'
            }
          })
        }
      )

      if (!meetingResponse.ok) {
        const error = await meetingResponse.text()
        throw new Error(`Zoom API: ${error}`)
      }

      const meeting = await meetingResponse.json()

      // Salva nel DB
      await supabase
        .from('lessons')
        .update({
          zoom_meeting_id: meeting.id.toString(),
          zoom_link: meeting.join_url,
          zoom_host_link: meeting.start_url,
          zoom_password: meeting.password || null,
          zoom_created_at: new Date().toISOString(),
          zoom_error: null,
          zoom_retry_count: attempt
        })
        .eq('id', lesson.id)

      return { success: true }

    } catch (error) {
      console.error(`Attempt ${attempt}/${maxRetries} failed for lesson ${lesson.id}:`, error.message)

      if (attempt === maxRetries) {
        // Ultimo tentativo fallito, salva errore
        await supabase
          .from('lessons')
          .update({
            zoom_error: error.message,
            zoom_retry_count: attempt
          })
          .eq('id', lesson.id)

        return { success: false, error: error.message }
      }

      // Exponential backoff: 2s, 4s, 8s
      const delayMs = Math.pow(2, attempt) * 1000
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  return { success: false, error: 'Max retries exceeded' }
}
