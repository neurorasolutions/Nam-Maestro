# INTEGRAZIONE ZOOM - LINK JUST-IN-TIME

## 📋 Indice

1. [Panoramica Sistema](#panoramica-sistema)
2. [Architettura](#architettura)
3. [Prerequisiti](#prerequisiti)
4. [Implementazione](#implementazione)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## Panoramica Sistema

### 🎯 Obiettivo

Implementare un sistema automatico di gestione meeting Zoom "just-in-time":
- **45 minuti prima** della lezione: Crea link Zoom automaticamente
- **Dopo la lezione**: Cancella meeting e recupera registrazione
- **Notte**: Invia registrazioni agli studenti

### 🔄 Flusso Automatico

```
[Lezione schedulata]
         ↓
    (45 min prima)
         ↓
[Cron crea link Zoom] ──→ [Studenti/docenti vedono link]
         ↓
   (Lezione finisce)
         ↓
    (3 ore dopo)
         ↓
[Cron cancella meeting] ──→ [Recupera registrazione]
         ↓
    (Notte, 02:00)
         ↓
[Cron invia email] ──→ [Studenti ricevono registrazione]
```

### ✅ Vantaggi

- ✅ **Link effimeri**: Esistono solo quando servono
- ✅ **Dashboard Zoom pulita**: Solo meeting attivi visibili
- ✅ **Meno sprechi**: Non si creano link per lezioni cancellate in anticipo
- ✅ **Registrazioni automatiche**: Recuperate e inviate senza intervento manuale
- ✅ **Sicurezza**: Link non più validi dopo la lezione

---

## Architettura

### 🏗️ Componenti

```
┌─────────────────────────────────────────────────────────────┐
│                        SUPABASE                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────┐      ┌────────────────────────────────┐  │
│  │   pg_cron     │──────▶│    Edge Functions              │  │
│  │   Scheduler   │      │                                 │  │
│  └───────────────┘      │  1. create-zoom-links-scheduled │  │
│         │               │  2. cleanup-zoom-meetings       │  │
│         │               │  3. fetch-zoom-recordings       │  │
│         │               └────────────────────────────────┘  │
│         │                            │                       │
│         ▼                            ▼                       │
│  ┌───────────────┐           ┌──────────────┐              │
│  │   Database    │           │  Zoom API    │              │
│  │   lessons     │           │              │              │
│  └───────────────┘           └──────────────┘              │
│         │                                                    │
│         ▼                                                    │
│  ┌───────────────┐                                          │
│  │   Frontend    │                                          │
│  │  CalendarView │                                          │
│  └───────────────┘                                          │
└─────────────────────────────────────────────────────────────┘
```

### 📊 Schedule Cron Jobs

| Job | Frequenza | Funzione | Azione |
|-----|-----------|----------|--------|
| **create-zoom-links** | Ogni 5 minuti | Crea link 45 min prima | Cerca lezioni ibride che iniziano tra 40-50 min senza link → Crea meeting Zoom |
| **cleanup-zoom-meetings** | Ogni ora | Cancella meeting terminati | Cerca lezioni finite da 3+ ore con meeting attivo → Cancella meeting Zoom |
| **fetch-zoom-recordings** | Ogni notte 02:00 | Recupera e invia registrazioni | Cerca lezioni di ieri con meeting → Recupera registrazione → Invia email studenti |

---

## Prerequisiti

### 1. ✅ Già Implementato

- [x] Account Zoom Pro attivo
- [x] App Zoom configurata con scopes:
  - `meeting:write:admin`
  - `meeting:read:admin`
  - `meeting:delete:admin`
  - `meeting:update:meeting:admin`
- [x] Secrets Supabase configurati:
  - `ZOOM_ACCOUNT_ID`
  - `ZOOM_CLIENT_ID`
  - `ZOOM_CLIENT_SECRET`
- [x] Tabella `lessons` con campi Zoom
- [x] Edge Functions base (create, update, delete)

### 2. ⚠️ Da Aggiungere

- [ ] Abilitare **pg_cron** su Supabase
- [ ] Aggiungere campi **registrazioni** alla tabella `lessons`
- [ ] Scope Zoom per **registrazioni**: `recording:read:admin`
- [ ] Edge Function per **email** studenti (opzionale)

---

## Implementazione

## FASE 1: Setup Database

### Step 1.1: Aggiungi campi registrazioni

Esegui nel **SQL Editor** di Supabase:

```sql
-- Aggiungi campi per registrazioni
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS recording_url TEXT,
ADD COLUMN IF NOT EXISTS recording_password TEXT,
ADD COLUMN IF NOT EXISTS recording_share_url TEXT,
ADD COLUMN IF NOT EXISTS recording_downloaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS recording_duration INTEGER, -- in minuti
ADD COLUMN IF NOT EXISTS recording_file_size BIGINT; -- in bytes

-- Indice per query veloci
CREATE INDEX IF NOT EXISTS idx_lessons_recording_url
ON lessons(recording_url)
WHERE recording_url IS NOT NULL;

-- Commenti
COMMENT ON COLUMN lessons.recording_url IS 'URL diretto file registrazione Zoom';
COMMENT ON COLUMN lessons.recording_share_url IS 'URL condivisione pubblica registrazione';
COMMENT ON COLUMN lessons.recording_password IS 'Password per accedere alla registrazione';
COMMENT ON COLUMN lessons.recording_downloaded_at IS 'Timestamp recupero registrazione';
```

### Step 1.2: Abilita pg_cron

```sql
-- Abilita estensione pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Verifica che sia attiva
SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_cron';
-- Dovrebbe restituire: pg_cron | 1.x
```

---

## FASE 2: Edge Functions Schedulabili

### Step 2.1: Edge Function - Creazione Link Schedulata

**File:** `supabase/functions/create-zoom-links-scheduled/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { getZoomAccessToken, calculateDuration } from '../_shared/zoom-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log('🔍 Checking for lessons starting in 40-50 minutes...')

    // Calcola finestra temporale: lezioni che iniziano tra 40-50 minuti da ora
    const now = new Date()
    const in40Min = new Date(now.getTime() + 40 * 60 * 1000)
    const in50Min = new Date(now.getTime() + 50 * 60 * 1000)

    const todayDate = now.toISOString().split('T')[0]
    const time40Min = in40Min.toTimeString().split(' ')[0].substring(0, 5)
    const time50Min = in50Min.toTimeString().split(' ')[0].substring(0, 5)

    console.log(`📅 Looking for lessons on ${todayDate} between ${time40Min} and ${time50Min}`)

    // Query: lezioni ibride senza link Zoom che iniziano tra 40-50 minuti
    const { data: lessons, error: queryError } = await supabase
      .from('lessons')
      .select('*')
      .eq('is_hybrid', true)
      .is('zoom_meeting_id', null) // Senza link ancora
      .eq('lesson_date', todayDate)
      .gte('start_time', time40Min)
      .lte('start_time', time50Min)

    if (queryError) throw queryError

    console.log(`📊 Found ${lessons?.length || 0} lessons to process`)

    if (!lessons || lessons.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No lessons to process',
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Ottieni token Zoom una volta sola
    const zoomToken = await getZoomAccessToken()

    let created = 0
    let failed = 0
    const errors: any[] = []

    // Crea meeting Zoom per ogni lezione
    for (const lesson of lessons) {
      try {
        console.log(`🎥 Creating Zoom meeting for lesson ${lesson.id} (${lesson.title})`)

        const duration = calculateDuration(lesson.start_time, lesson.end_time)

        // Crea meeting Zoom
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
                auto_recording: 'cloud' // 🎬 IMPORTANTE: Registrazione automatica su cloud
              }
            })
          }
        )

        if (!meetingResponse.ok) {
          const error = await meetingResponse.text()
          throw new Error(`Zoom API: ${error}`)
        }

        const meeting = await meetingResponse.json()

        // Salva nel database
        const { error: updateError } = await supabase
          .from('lessons')
          .update({
            zoom_meeting_id: meeting.id.toString(),
            zoom_link: meeting.join_url,
            zoom_host_link: meeting.start_url,
            zoom_password: meeting.password || null,
            zoom_created_at: new Date().toISOString(),
            zoom_error: null
          })
          .eq('id', lesson.id)

        if (updateError) throw updateError

        console.log(`✅ Created meeting ${meeting.id} for lesson ${lesson.id}`)
        created++

      } catch (error) {
        console.error(`❌ Failed to create meeting for lesson ${lesson.id}:`, error.message)
        failed++
        errors.push({
          lesson_id: lesson.id,
          title: lesson.title,
          error: error.message
        })

        // Salva errore nel database
        await supabase
          .from('lessons')
          .update({ zoom_error: error.message })
          .eq('id', lesson.id)
      }
    }

    console.log(`📊 Results: ${created} created, ${failed} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: lessons.length,
        created,
        failed,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Scheduled job error:', error)

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
```

**Configurazione:** `supabase/functions/create-zoom-links-scheduled/deno.json`

```json
{
  "imports": {}
}
```

### Step 2.2: Edge Function - Cleanup Meeting Terminati

**File:** `supabase/functions/cleanup-zoom-meetings/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { getZoomAccessToken } from '../_shared/zoom-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log('🧹 Starting cleanup of completed meetings...')

    // Trova lezioni terminate da più di 3 ore con meeting Zoom ancora attivo
    const now = new Date()
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)

    const cutoffDate = threeHoursAgo.toISOString().split('T')[0]
    const cutoffTime = threeHoursAgo.toTimeString().split(' ')[0].substring(0, 5)

    console.log(`📅 Looking for completed lessons before ${cutoffDate} ${cutoffTime}`)

    const { data: lessons, error: queryError } = await supabase
      .from('lessons')
      .select('*')
      .not('zoom_meeting_id', 'is', null) // Con meeting Zoom
      .or(`lesson_date.lt.${cutoffDate},and(lesson_date.eq.${cutoffDate},end_time.lt.${cutoffTime})`)
      .limit(50) // Max 50 per esecuzione per non sovraccaricare

    if (queryError) throw queryError

    console.log(`📊 Found ${lessons?.length || 0} meetings to clean up`)

    if (!lessons || lessons.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No meetings to clean up',
          deleted: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const zoomToken = await getZoomAccessToken()

    let deleted = 0
    let failed = 0
    const errors: any[] = []

    for (const lesson of lessons) {
      try {
        console.log(`🗑️ Deleting Zoom meeting ${lesson.zoom_meeting_id} for lesson ${lesson.id}`)

        // Cancella meeting su Zoom
        const response = await fetch(
          `https://api.zoom.us/v2/meetings/${lesson.zoom_meeting_id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${zoomToken}`
            }
          }
        )

        // 404 = già cancellato, OK
        if (!response.ok && response.status !== 404) {
          const error = await response.text()
          throw new Error(`Zoom API: ${error}`)
        }

        // Svuota campi Zoom nel database (mantieni registrazione se presente)
        const { error: updateError } = await supabase
          .from('lessons')
          .update({
            zoom_meeting_id: null,
            zoom_link: null,
            zoom_host_link: null,
            zoom_password: null
          })
          .eq('id', lesson.id)

        if (updateError) throw updateError

        console.log(`✅ Cleaned up lesson ${lesson.id}`)
        deleted++

      } catch (error) {
        console.error(`❌ Failed to clean up lesson ${lesson.id}:`, error.message)
        failed++
        errors.push({
          lesson_id: lesson.id,
          zoom_meeting_id: lesson.zoom_meeting_id,
          error: error.message
        })
      }
    }

    console.log(`📊 Results: ${deleted} deleted, ${failed} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: lessons.length,
        deleted,
        failed,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Cleanup job error:', error)

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
```

**Configurazione:** `supabase/functions/cleanup-zoom-meetings/deno.json`

```json
{
  "imports": {}
}
```

### Step 2.3: Edge Function - Recupero Registrazioni

**File:** `supabase/functions/fetch-zoom-recordings/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { getZoomAccessToken } from '../_shared/zoom-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log('🎬 Fetching Zoom recordings...')

    // Trova lezioni di ieri/oggi con meeting Zoom ma senza registrazione
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const yesterdayDate = yesterday.toISOString().split('T')[0]
    const todayDate = now.toISOString().split('T')[0]

    console.log(`📅 Looking for recordings from ${yesterdayDate} to ${todayDate}`)

    // Nota: zoom_meeting_id viene rimosso dal cleanup, quindi cerchiamo solo lezioni recenti
    // che potrebbero avere ancora il meeting_id prima del cleanup
    const { data: lessons, error: queryError } = await supabase
      .from('lessons')
      .select('*')
      .gte('lesson_date', yesterdayDate)
      .lte('lesson_date', todayDate)
      .eq('is_hybrid', true)
      .is('recording_url', null) // Senza registrazione ancora recuperata
      .not('zoom_meeting_id', 'is', null) // Con meeting ID (prima del cleanup)
      .limit(50)

    if (queryError) throw queryError

    console.log(`📊 Found ${lessons?.length || 0} lessons to check for recordings`)

    if (!lessons || lessons.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No recordings to fetch',
          fetched: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const zoomToken = await getZoomAccessToken()

    let fetched = 0
    let notFound = 0
    let failed = 0
    const errors: any[] = []

    for (const lesson of lessons) {
      try {
        console.log(`🎥 Checking recordings for meeting ${lesson.zoom_meeting_id}`)

        // Chiama API Zoom per ottenere registrazioni
        const response = await fetch(
          `https://api.zoom.us/v2/meetings/${lesson.zoom_meeting_id}/recordings`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${zoomToken}`
            }
          }
        )

        if (response.status === 404) {
          console.log(`ℹ️ No recording found for meeting ${lesson.zoom_meeting_id}`)
          notFound++
          continue
        }

        if (!response.ok) {
          const error = await response.text()
          throw new Error(`Zoom API: ${error}`)
        }

        const recordingData = await response.json()

        if (!recordingData.recording_files || recordingData.recording_files.length === 0) {
          console.log(`ℹ️ Recording not ready yet for meeting ${lesson.zoom_meeting_id}`)
          notFound++
          continue
        }

        // Prendi la prima registrazione (di solito è la gallery view)
        const recording = recordingData.recording_files[0]

        // Salva info registrazione nel database
        const { error: updateError } = await supabase
          .from('lessons')
          .update({
            recording_url: recording.download_url,
            recording_share_url: recordingData.share_url,
            recording_password: recordingData.password,
            recording_downloaded_at: new Date().toISOString(),
            recording_duration: Math.round(recording.recording_end_ms / 60000), // millisecondi -> minuti
            recording_file_size: recording.file_size
          })
          .eq('id', lesson.id)

        if (updateError) throw updateError

        console.log(`✅ Saved recording for lesson ${lesson.id}`)
        fetched++

        // TODO: Invia email agli studenti del corso con il link
        // await sendRecordingEmail(lesson, recordingData.share_url)

      } catch (error) {
        console.error(`❌ Failed to fetch recording for lesson ${lesson.id}:`, error.message)
        failed++
        errors.push({
          lesson_id: lesson.id,
          zoom_meeting_id: lesson.zoom_meeting_id,
          error: error.message
        })
      }
    }

    console.log(`📊 Results: ${fetched} fetched, ${notFound} not found, ${failed} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: lessons.length,
        fetched,
        notFound,
        failed,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Fetch recordings job error:', error)

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
```

**Configurazione:** `supabase/functions/fetch-zoom-recordings/deno.json`

```json
{
  "imports": {}
}
```

### Step 2.4: Configurazione in config.toml

Aggiungi le nuove funzioni in `supabase/config.toml`:

```toml
[functions.create-zoom-links-scheduled]
enabled = true
verify_jwt = false
import_map = "./functions/create-zoom-links-scheduled/deno.json"
entrypoint = "./functions/create-zoom-links-scheduled/index.ts"

[functions.cleanup-zoom-meetings]
enabled = true
verify_jwt = false
import_map = "./functions/cleanup-zoom-meetings/deno.json"
entrypoint = "./functions/cleanup-zoom-meetings/index.ts"

[functions.fetch-zoom-recordings]
enabled = true
verify_jwt = false
import_map = "./functions/fetch-zoom-recordings/deno.json"
entrypoint = "./functions/fetch-zoom-recordings/index.ts"
```

### Step 2.5: Deploy Edge Functions

```bash
npx supabase@latest functions deploy create-zoom-links-scheduled
npx supabase@latest functions deploy cleanup-zoom-meetings
npx supabase@latest functions deploy fetch-zoom-recordings
```

---

## FASE 3: Configurazione Cron Jobs

### Step 3.1: Crea Cron Jobs in Supabase

Esegui nel **SQL Editor**:

```sql
-- ============================================
-- CRON JOB 1: Crea link Zoom 45 minuti prima
-- Esecuzione: Ogni 5 minuti
-- ============================================

SELECT cron.schedule(
  'create-zoom-links-45min-before',
  '*/5 * * * *', -- Ogni 5 minuti
  $$
  SELECT
    net.http_post(
      url := 'https://kjhynvbwoptdznzordvu.supabase.co/functions/v1/create-zoom-links-scheduled',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- ============================================
-- CRON JOB 2: Cleanup meeting terminati
-- Esecuzione: Ogni ora
-- ============================================

SELECT cron.schedule(
  'cleanup-zoom-meetings-hourly',
  '0 * * * *', -- All'inizio di ogni ora (00:00, 01:00, 02:00...)
  $$
  SELECT
    net.http_post(
      url := 'https://kjhynvbwoptdznzordvu.supabase.co/functions/v1/cleanup-zoom-meetings',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- ============================================
-- CRON JOB 3: Recupera registrazioni
-- Esecuzione: Ogni notte alle 02:00
-- ============================================

SELECT cron.schedule(
  'fetch-zoom-recordings-nightly',
  '0 2 * * *', -- Ogni giorno alle 02:00
  $$
  SELECT
    net.http_post(
      url := 'https://kjhynvbwoptdznzordvu.supabase.co/functions/v1/fetch-zoom-recordings',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

### Step 3.2: Verifica Cron Jobs

```sql
-- Vedi tutti i cron job attivi
SELECT * FROM cron.job;

-- Output atteso:
-- jobid | schedule      | command                              | jobname
-- ------|---------------|--------------------------------------|---------------------------
-- 1     | */5 * * * *   | SELECT net.http_post(...)            | create-zoom-links-45min-before
-- 2     | 0 * * * *     | SELECT net.http_post(...)            | cleanup-zoom-meetings-hourly
-- 3     | 0 2 * * *     | SELECT net.http_post(...)            | fetch-zoom-recordings-nightly
```

### Step 3.3: Monitora esecuzioni

```sql
-- Vedi storico esecuzioni cron (ultime 10)
SELECT
  jobid,
  runid,
  job_name,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

---

## FASE 4: Scope Zoom per Registrazioni

### Step 4.1: Aggiungi Scope Registrazioni

1. Vai su [marketplace.zoom.us](https://marketplace.zoom.us)
2. **Manage** → La tua app **NAM Maestro Integration**
3. Tab **Scopes**
4. Aggiungi:
   - `recording:read:admin`
   - `recording:read:list_user_recordings:admin`
5. **Save** e riattiva se richiesto

---

## Testing

### Test 1: Creazione Manuale Link (Simula Cron)

Testa l'Edge Function manualmente prima di aspettare il cron:

```bash
curl -X POST 'https://kjhynvbwoptdznzordvu.supabase.co/functions/v1/create-zoom-links-scheduled' \
  -H 'Content-Type: application/json'
```

**Verifica:**
- Crea una lezione ibrida che inizia tra 40-50 minuti
- Esegui il comando sopra
- Controlla che il link Zoom sia stato creato nel database
- Verifica su zoom.us che il meeting esista

### Test 2: Cleanup Manuale

```bash
curl -X POST 'https://kjhynvbwoptdznzordvu.supabase.co/functions/v1/cleanup-zoom-meetings' \
  -H 'Content-Type: application/json'
```

**Verifica:**
- Il comando trova lezioni terminate da 3+ ore
- Cancella i meeting su Zoom
- Rimuove `zoom_meeting_id` dal database

### Test 3: Fetch Registrazioni Manuale

```bash
curl -X POST 'https://kjhynvbwoptdznzordvu.supabase.co/functions/v1/fetch-zoom-recordings' \
  -H 'Content-Type: application/json'
```

**Verifica:**
- Trova lezioni di ieri/oggi con meeting
- Recupera registrazioni da Zoom
- Salva `recording_url` nel database

### Test 4: Verifica Cron Automatico

1. **Crea lezione di test** che inizia tra 45 minuti esatti
2. **Aspetta 5-10 minuti** (tempo tra esecuzioni cron)
3. **Controlla database** se il link è stato creato:

```sql
SELECT id, title, lesson_date, start_time, zoom_link, zoom_created_at
FROM lessons
WHERE lesson_date = CURRENT_DATE
AND start_time > NOW()::time
AND is_hybrid = true
ORDER BY start_time;
```

4. **Verifica su Zoom** che il meeting esista

---

## Troubleshooting

### ❌ Cron non si attiva

**Problema:** Il job cron non esegue la funzione.

**Soluzioni:**
1. Verifica che pg_cron sia abilitato:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```
2. Controlla log esecuzioni:
   ```sql
   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
   ```
3. Verifica che l'URL della funzione sia corretto (usa il tuo project_ref)

### ❌ Link non creati a 45 minuti

**Problema:** Le lezioni non ricevono link Zoom.

**Soluzioni:**
1. **Testa manualmente** l'Edge Function:
   ```bash
   curl -X POST 'https://[project].supabase.co/functions/v1/create-zoom-links-scheduled'
   ```
2. Controlla i **log della funzione** nella Dashboard Supabase
3. Verifica che la finestra temporale (40-50 min) sia corretta
4. Controlla timezone: la lezione deve essere in UTC corretto

### ❌ Registrazioni non recuperate

**Problema:** `recording_url` rimane NULL.

**Soluzioni:**
1. Verifica **scope Zoom**: `recording:read:admin`
2. Zoom impiega **alcune ore** dopo la lezione per processare la registrazione
3. Prova a rilanciare il job la sera o il giorno dopo
4. Controlla che la registrazione sia abilitata (`auto_recording: 'cloud'`)

### ❌ Troppi meeting Zoom aperti

**Problema:** Dashboard Zoom piena di meeting vecchi.

**Soluzioni:**
1. Il cleanup gira **ogni ora**, aspetta la prossima esecuzione
2. Esegui **manualmente** il cleanup:
   ```bash
   curl -X POST 'https://[project].supabase.co/functions/v1/cleanup-zoom-meetings'
   ```
3. Riduci il timeout da 3 ore a 1 ora modificando il codice della funzione

---

## Monitoraggio e Manutenzione

### 📊 Dashboard Monitoring

Crea una query per monitorare lo stato del sistema:

```sql
-- Statistiche giornaliere Zoom
SELECT
  lesson_date,
  COUNT(*) as total_hybrid_lessons,
  COUNT(zoom_meeting_id) as with_active_meeting,
  COUNT(zoom_link) as with_link,
  COUNT(recording_url) as with_recording
FROM lessons
WHERE is_hybrid = true
AND lesson_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY lesson_date
ORDER BY lesson_date DESC;
```

### 🔔 Alert su Errori

Monitora lezioni con errori:

```sql
SELECT id, title, lesson_date, start_time, zoom_error
FROM lessons
WHERE zoom_error IS NOT NULL
AND lesson_date >= CURRENT_DATE
ORDER BY lesson_date, start_time;
```

### 🧹 Pulizia Database (Opzionale)

Dopo 30 giorni, svuota campi Zoom di lezioni vecchie:

```sql
-- Cron job mensile per pulizia storico
SELECT cron.schedule(
  'cleanup-old-zoom-data',
  '0 3 1 * *', -- Primo giorno del mese alle 03:00
  $$
  UPDATE lessons
  SET
    zoom_meeting_id = NULL,
    zoom_link = NULL,
    zoom_host_link = NULL,
    zoom_password = NULL
  WHERE lesson_date < CURRENT_DATE - INTERVAL '30 days';
  $$
);
```

---

## Checklist Finale

### ✅ Setup Completato

- [ ] Campi registrazioni aggiunti alla tabella `lessons`
- [ ] pg_cron abilitato
- [ ] 3 Edge Functions create e deployate
- [ ] 3 Cron Jobs schedulati
- [ ] Scope Zoom `recording:read:admin` aggiunto
- [ ] Test manuale funzioni → OK
- [ ] Test automatico cron → Attendi 45 min e verifica

### ✅ Verifica Funzionamento

1. **Crea lezione test** che inizia tra 45 minuti
2. **Aspetta 5-10 minuti** (cron esegue)
3. **Controlla database**: `zoom_link` presente?
4. **Verifica Zoom**: meeting visibile?
5. **Dopo 3h dalla fine**: meeting cancellato?
6. **Giorno dopo**: registrazione recuperata?

---

## 🎉 Sistema Completo

Una volta completato, il sistema funziona completamente in automatico:

```
📅 Lezione schedulata
    ↓
⏰ -45 min → 🎥 Link Zoom creato automaticamente
    ↓
👨‍🏫 Lezione si svolge (registrata su cloud)
    ↓
⏰ +3h → 🗑️ Meeting Zoom cancellato automaticamente
    ↓
⏰ 02:00 notte → 📹 Registrazione recuperata e salvata
    ↓
📧 Email inviata agli studenti con link registrazione
```

**Zero intervento manuale richiesto!** ✨

---

**Data aggiornamento:** 24 Febbraio 2026
**Versione:** 2.0 (Just-in-Time System)
**Autore:** Claude Code Assistant
**Progetto:** NAM Maestro - Gestionale Scuola Musica
