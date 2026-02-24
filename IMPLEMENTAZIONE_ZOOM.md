# IMPLEMENTAZIONE ZOOM API - NAM MAESTRO

## Indice

1. [Panoramica](#panoramica)
2. [Prerequisiti](#prerequisiti)
3. [Piano di Azione](#piano-di-azione)
4. [Architettura Tecnica](#architettura-tecnica)
5. [Implementazione Dettagliata](#implementazione-dettagliata)
6. [Gestione Insidie](#gestione-insidie)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)
9. [Checklist Finale](#checklist-finale)

---

## Panoramica

### Obiettivo

Implementare la creazione automatica di link Zoom per lezioni ibride:
- L'utente crea una lezione nel gestionale e spunta "Lezione Ibrida"
- Il sistema automaticamente crea un meeting Zoom
- Il link viene salvato nel database e mostrato nel calendario
- Studenti e docenti possono accedere al link direttamente dall'app

### Flusso Utente

```
1. Segreteria crea lezione ibrida → Compila form + spunta "Lezione Ibrida"
2. Sistema salva nel DB → Lezione salvata in tabella `lessons`
3. Sistema chiama Zoom API → Automatico in background
4. Zoom crea meeting → Risponde con link
5. Sistema salva link → UPDATE lessons SET zoom_link = '...'
6. Calendario si aggiorna → Real-time Supabase
7. Studenti vedono link → Nell'app PWA
```

### Difficoltà Generale: ⭐⭐⭐☆☆ (MEDIA)

---

## Prerequisiti

### 1. Account e Credenziali Zoom

#### Setup Account Zoom

- [ ] Account Zoom esistente (o crearne uno)
- [ ] Piano **Zoom Pro** attivo (€13-15/mese)
  - **Perché:** Piano gratuito limita meeting a 40 minuti
  - **Pro:** Meeting illimitati fino a 30 ore
- [ ] Accesso a [marketplace.zoom.us](https://marketplace.zoom.us)

#### Creare Zoom App (GRATUITO)

**Step by step:**

1. Vai su https://marketplace.zoom.us/
2. Click **"Develop"** → **"Build App"**
3. Scegli **"Server-to-Server OAuth"** (NON OAuth standard, NON JWT)
4. Compila form:
   - **App Name:** `NAM Maestro Integration`
   - **Company Name:** Nome scuola
   - **Developer Contact:** Email admin
5. **Scopes (Permessi richiesti):**
   ```
   ✅ meeting:write:admin  - Creare meeting
   ✅ meeting:read:admin   - Leggere info meeting
   ✅ meeting:delete:admin - Cancellare meeting (opzionale)
   ```
6. **Copia e salva** (in luogo sicuro, NON su git):
   ```
   Account ID: abc123xyz...
   Client ID: xyz789abc...
   Client Secret: supersecretkey123... (NON lo rivedi più!)
   ```
7. **Attiva app:** Toggle "Activated" → **ON**

**Costo:** €0 (completamente gratuito)
**Tempo richiesto:** ~5 minuti

### 2. Accesso Supabase

- [ ] Accesso dashboard Supabase
- [ ] Service Role Key disponibile (già in `.env`)
- [ ] Possibilità di creare Edge Functions
- [ ] Possibilità di eseguire migrations SQL

### 3. Ambiente di Sviluppo

- [ ] Node.js installato (per Supabase CLI)
- [ ] Supabase CLI (opzionale ma consigliato):
  ```bash
  npm install -g supabase
  ```
- [ ] Editor di codice (VS Code consigliato)

---

## Piano di Azione

### FASE 1: Verifica e Setup Iniziale

#### Step 1.1: Verificare Struttura Database `lessons`

**Problema attuale:** La tabella `lessons` non ha migration SQL nel repository.

**Azione:**
```sql
-- Eseguire questa query nel dashboard Supabase per vedere lo schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'lessons'
ORDER BY ordinal_position;
```

**Output atteso:**
```
column_name   | data_type | is_nullable
--------------|-----------|------------
id            | uuid      | NO
course_name   | text      | YES
title         | text      | YES
teacher_name  | text      | YES
lesson_date   | date      | YES
start_time    | time      | YES
end_time      | time      | YES
room          | text      | YES
is_hybrid     | boolean   | YES
```

#### Step 1.2: Creare Migration per Campi Zoom

**File:** `supabase/migrations/20260218_add_zoom_fields.sql`

```sql
-- Aggiungi campi per Zoom
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS zoom_meeting_id TEXT,
ADD COLUMN IF NOT EXISTS zoom_link TEXT,
ADD COLUMN IF NOT EXISTS zoom_host_link TEXT,
ADD COLUMN IF NOT EXISTS zoom_password TEXT,
ADD COLUMN IF NOT EXISTS zoom_created_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS zoom_error TEXT,
ADD COLUMN IF NOT EXISTS zoom_retry_count INTEGER DEFAULT 0;

-- Indice per query veloci
CREATE INDEX IF NOT EXISTS idx_lessons_zoom_meeting_id
ON lessons(zoom_meeting_id);

-- Indice per trovare lezioni con errori
CREATE INDEX IF NOT EXISTS idx_lessons_zoom_error
ON lessons(zoom_error)
WHERE zoom_error IS NOT NULL;

-- Commenti per documentazione
COMMENT ON COLUMN lessons.zoom_meeting_id IS 'ID univoco meeting Zoom (es: 87654321098)';
COMMENT ON COLUMN lessons.zoom_link IS 'Link join per studenti (es: https://zoom.us/j/...)';
COMMENT ON COLUMN lessons.zoom_host_link IS 'Link start per docente (es: https://zoom.us/s/...)';
COMMENT ON COLUMN lessons.zoom_password IS 'Password meeting Zoom';
COMMENT ON COLUMN lessons.zoom_created_at IS 'Timestamp creazione meeting Zoom';
COMMENT ON COLUMN lessons.zoom_error IS 'Messaggio errore se creazione Zoom fallisce';
COMMENT ON COLUMN lessons.zoom_retry_count IS 'Numero tentativi creazione Zoom';
```

**Eseguire migration:**
```bash
# Opzione A: Dashboard Supabase
# SQL Editor → Incolla SQL → Run

# Opzione B: Supabase CLI (se configurato)
supabase db push
```

#### Step 1.3: Configurare Secrets Supabase

**⚠️ IMPORTANTE: NON mettere credenziali nel file `.env` del repository!**

**Opzione A: Dashboard Supabase (Consigliata)**

1. Vai su dashboard Supabase → Progetto NAM Maestro
2. **Settings** → **Edge Functions** → **Secrets**
3. Aggiungi 3 secrets:
   ```
   Name: ZOOM_ACCOUNT_ID
   Value: [Incolla Account ID da Zoom App]

   Name: ZOOM_CLIENT_ID
   Value: [Incolla Client ID da Zoom App]

   Name: ZOOM_CLIENT_SECRET
   Value: [Incolla Client Secret da Zoom App]
   ```
4. Click **"Add secret"** per ognuno
5. **Salva**

**Opzione B: Supabase CLI**

```bash
# Solo se usi Supabase CLI locale
supabase secrets set ZOOM_ACCOUNT_ID="abc123xyz"
supabase secrets set ZOOM_CLIENT_ID="xyz789abc"
supabase secrets set ZOOM_CLIENT_SECRET="supersecretkey123"
```

**Verifica secrets:**
```bash
supabase secrets list
# Output:
# ZOOM_ACCOUNT_ID
# ZOOM_CLIENT_ID
# ZOOM_CLIENT_SECRET
```

---

### FASE 2: Implementazione Edge Functions

#### Step 2.1: Creare Edge Function per Autenticazione Zoom

**File:** `supabase/functions/_shared/zoom-auth.ts`

```typescript
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
```

#### Step 2.2: Edge Function - Creazione Meeting Singolo

**File:** `supabase/functions/create-zoom-meeting/index.ts`

```typescript
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

serve(async (req) => {
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
```

#### Step 2.3: Edge Function - Creazione Batch con Rate Limiting

**File:** `supabase/functions/create-zoom-meetings-batch/index.ts`

```typescript
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

serve(async (req) => {
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
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Batch creation error:', error)

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
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
```

#### Step 2.4: Deploy Edge Functions

```bash
# Deploy funzioni singolarmente
supabase functions deploy create-zoom-meeting
supabase functions deploy create-zoom-meetings-batch

# Oppure deploy tutte insieme
supabase functions deploy
```

**Verifica deploy:**
- Dashboard Supabase → Edge Functions
- Dovresti vedere:
  - `create-zoom-meeting`
  - `create-zoom-meetings-batch`
- Status: **Deployed**

---

### FASE 3: Modifiche Frontend

#### Step 3.1: Aggiornare Interfacce TypeScript

**File:** `src/types.ts`

```typescript
// Aggiungi campi Zoom all'interfaccia Event/CalendarEvent

export interface CalendarEvent {
  id: number
  title: string
  room: string
  type: 'lesson' | 'collective' | 'exam'
  time: string
  isHybrid?: boolean
  date: Date
  supabaseId?: string
  courseName?: string

  // Nuovi campi Zoom
  zoom_meeting_id?: string
  zoom_link?: string
  zoom_host_link?: string
  zoom_password?: string
  zoom_created_at?: string
  zoom_error?: string
  zoom_retry_count?: number
}
```

#### Step 3.2: Modificare CalendarView - Creazione Lezione

**File:** `src/components/CalendarView.tsx`

Trova la funzione di salvataggio lezione e modifica così:

```typescript
const handleSaveLesson = async (formData: any) => {
  setLoading(true)
  setError(null)

  try {
    // 1. Salva lezione nel database
    const { data: newLesson, error: insertError } = await supabase
      .from('lessons')
      .insert({
        title: formData.title,
        teacher_name: formData.teacher,
        lesson_date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        room: formData.room,
        course_name: formData.courseName,
        is_hybrid: formData.isHybrid || false
      })
      .select()
      .single()

    if (insertError) throw insertError

    console.log('Lezione salvata:', newLesson.id)

    // 2. Se è ibrida, crea link Zoom automaticamente
    if (formData.isHybrid) {
      setMessage('Creazione link Zoom in corso...')

      const { data: zoomData, error: zoomError } = await supabase.functions.invoke(
        'create-zoom-meeting',
        {
          body: {
            lesson_id: newLesson.id,
            title: formData.title,
            teacher_name: formData.teacher,
            lesson_date: formData.date,
            start_time: formData.startTime,
            end_time: formData.endTime
          }
        }
      )

      if (zoomError) {
        console.error('Errore creazione Zoom:', zoomError)
        setMessage('⚠️ Lezione creata ma link Zoom non generato. Riprova più tardi.')
        // Non bloccare il flusso, la lezione è comunque salvata
      } else {
        console.log('Link Zoom creato:', zoomData.join_url)
        setMessage('✅ Lezione creata con link Zoom')
      }
    } else {
      setMessage('✅ Lezione creata')
    }

    // 3. Ricarica calendario
    await fetchLessons()

    // 4. Chiudi modal
    closeModal()

  } catch (error: any) {
    console.error('Errore salvataggio lezione:', error)
    setError(error.message)
  } finally {
    setLoading(false)
  }
}
```

#### Step 3.3: Modificare CalendarView - Visualizzazione Link

**File:** `src/components/CalendarView.tsx`

Nel modal di dettaglio lezione, aggiungi sezione Zoom:

```typescript
{/* Modal Dettaglio Lezione */}
<div className="lesson-detail-modal">
  <h3>{selectedEvent.title}</h3>
  <p><strong>Docente:</strong> {selectedEvent.teacher_name}</p>
  <p><strong>Orario:</strong> {selectedEvent.start_time} - {selectedEvent.end_time}</p>
  <p><strong>Aula:</strong> {selectedEvent.room}</p>

  {/* SEZIONE ZOOM */}
  {selectedEvent.isHybrid && (
    <div className="zoom-section mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
        <i className="fas fa-video mr-2"></i>
        Lezione Online
      </h4>

      {selectedEvent.zoom_link ? (
        // Link Zoom pronto
        <div className="space-y-3">
          <div className="flex items-center text-green-600 text-sm">
            <i className="fas fa-check-circle mr-2"></i>
            <span>Link Zoom pronto</span>
          </div>

          {/* Link per studenti */}
          <div>
            <label className="text-xs text-gray-600 block mb-1">
              Link per Studenti:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={selectedEvent.zoom_link}
                readOnly
                className="flex-1 px-3 py-2 text-sm border rounded bg-white"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedEvent.zoom_link!)
                  alert('Link copiato!')
                }}
                className="btn-secondary"
              >
                <i className="fas fa-copy"></i>
              </button>
            </div>
          </div>

          {/* Link per docente */}
          {selectedEvent.zoom_host_link && (
            <div>
              <label className="text-xs text-gray-600 block mb-1">
                Link Host (Docente):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={selectedEvent.zoom_host_link}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border rounded bg-white"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedEvent.zoom_host_link!)
                    alert('Link docente copiato!')
                  }}
                  className="btn-secondary"
                >
                  <i className="fas fa-copy"></i>
                </button>
              </div>
            </div>
          )}

          {/* Password */}
          {selectedEvent.zoom_password && (
            <p className="text-sm text-gray-600">
              <strong>Password:</strong> <code className="bg-gray-100 px-2 py-1 rounded">
                {selectedEvent.zoom_password}
              </code>
            </p>
          )}

          {/* Bottoni azione */}
          <div className="flex gap-2 mt-3">
            <a
              href={selectedEvent.zoom_link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <i className="fas fa-external-link-alt mr-2"></i>
              Apri Zoom
            </a>

            <button
              onClick={() => sendZoomLinkToTeacher(selectedEvent)}
              className="btn-secondary"
            >
              <i className="fas fa-envelope mr-2"></i>
              Invia a Docente
            </button>
          </div>
        </div>
      ) : selectedEvent.zoom_error ? (
        // Errore creazione Zoom
        <div className="text-red-600">
          <div className="flex items-center mb-2">
            <i className="fas fa-exclamation-circle mr-2"></i>
            <span>Errore creazione link</span>
          </div>
          <p className="text-sm bg-red-50 p-2 rounded">
            {selectedEvent.zoom_error}
          </p>
          <button
            onClick={() => retryCreateZoomMeeting(selectedEvent.supabaseId!)}
            className="btn-primary mt-3"
          >
            <i className="fas fa-redo mr-2"></i>
            Riprova
          </button>
        </div>
      ) : (
        // Link in generazione
        <div className="text-yellow-600 flex items-center">
          <i className="fas fa-spinner fa-spin mr-2"></i>
          <span>Generazione link Zoom in corso...</span>
        </div>
      )}
    </div>
  )}
</div>

{/* Funzione per inviare link al docente */}
<script>
const sendZoomLinkToTeacher = async (lesson: CalendarEvent) => {
  try {
    await supabase.functions.invoke('send-email', {
      body: {
        to: getTeacherEmail(lesson.teacher_name),
        subject: `Link Zoom - ${lesson.title}`,
        html: `
          <h2>Lezione: ${lesson.title}</h2>
          <p><strong>Data:</strong> ${lesson.lesson_date}</p>
          <p><strong>Orario:</strong> ${lesson.start_time} - ${lesson.end_time}</p>

          <h3>Link Host (per avviare la lezione):</h3>
          <a href="${lesson.zoom_host_link}">${lesson.zoom_host_link}</a>

          <p><strong>Password:</strong> ${lesson.zoom_password || 'Nessuna'}</p>
        `
      }
    })

    alert('Email inviata al docente!')
  } catch (error) {
    alert('Errore invio email: ' + error.message)
  }
}

const retryCreateZoomMeeting = async (lessonId: string) => {
  setLoading(true)

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single()

  const { error } = await supabase.functions.invoke('create-zoom-meeting', {
    body: {
      lesson_id: lesson.id,
      title: lesson.title,
      teacher_name: lesson.teacher_name,
      lesson_date: lesson.lesson_date,
      start_time: lesson.start_time,
      end_time: lesson.end_time
    }
  })

  if (error) {
    alert('Errore: ' + error.message)
  } else {
    alert('Link Zoom creato!')
    fetchLessons()
  }

  setLoading(false)
}
</script>
```

#### Step 3.4: Modificare CalendarWizard - Batch Creation

**File:** `src/components/CalendarWizard.tsx`

```typescript
const handleGenerateCalendar = async () => {
  setLoading(true)
  setError(null)

  try {
    // 1. Genera array lezioni ricorrenti
    const generatedLessons = generateRecurringLessons(formData)

    console.log(`Generating ${generatedLessons.length} lessons...`)

    // 2. Salva tutte nel database
    const { data: savedLessons, error: insertError } = await supabase
      .from('lessons')
      .insert(generatedLessons)
      .select()

    if (insertError) throw insertError

    console.log(`✅ Saved ${savedLessons.length} lessons`)

    // 3. Se sono ibride, crea link Zoom in batch
    const hybridLessons = savedLessons.filter(l => l.is_hybrid)

    if (hybridLessons.length > 0) {
      setMessage(`Creazione ${hybridLessons.length} link Zoom...`)
      setProgress({ current: 0, total: hybridLessons.length })

      // Chiama batch function
      const { data: batchResult, error: batchError } = await supabase.functions.invoke(
        'create-zoom-meetings-batch',
        {
          body: {
            lessons: hybridLessons.map(l => ({
              id: l.id,
              title: l.title,
              teacher_name: l.teacher_name,
              lesson_date: l.lesson_date,
              start_time: l.start_time,
              end_time: l.end_time
            }))
          }
        }
      )

      if (batchError) {
        console.error('Batch error:', batchError)
        setMessage(`⚠️ Lezioni create ma errori nella generazione Zoom`)
      } else {
        console.log('Batch result:', batchResult)
        setMessage(
          `✅ Create ${savedLessons.length} lezioni. ` +
          `Link Zoom: ${batchResult.created} creati, ${batchResult.failed} falliti`
        )
      }

      // Polling per aggiornare progresso real-time
      const pollInterval = setInterval(async () => {
        const { count } = await supabase
          .from('lessons')
          .select('id', { count: 'exact', head: true })
          .not('zoom_link', 'is', null)
          .in('id', hybridLessons.map(l => l.id))

        setProgress(prev => ({ ...prev, current: count || 0 }))

        if (count === hybridLessons.length) {
          clearInterval(pollInterval)
        }
      }, 2000) // Aggiorna ogni 2 secondi
    } else {
      setMessage(`✅ Create ${savedLessons.length} lezioni`)
    }

    // 4. Ricarica calendario
    await fetchLessons()

    // 5. Chiudi wizard
    setTimeout(() => closeWizard(), 3000)

  } catch (error: any) {
    console.error('Error generating calendar:', error)
    setError(error.message)
  } finally {
    setLoading(false)
  }
}

// UI Progresso
{progress.total > 0 && (
  <div className="progress-section mt-4">
    <p className="text-sm text-gray-600 mb-2">
      Creazione link Zoom: {progress.current}/{progress.total}
    </p>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${(progress.current / progress.total) * 100}%` }}
      />
    </div>
  </div>
)}
```

---

### FASE 4: Funzionalità Avanzate (Opzionali)

#### Step 4.1: Sincronizzazione Modifica Lezione

**File:** `supabase/functions/update-zoom-meeting/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { getZoomAccessToken, calculateDuration } from '../_shared/zoom-auth.ts'

serve(async (req) => {
  try {
    const { meeting_id, lesson_date, start_time, end_time } = await req.json()

    const zoomToken = await getZoomAccessToken()
    const duration = calculateDuration(start_time, end_time)

    // PATCH meeting esistente
    const response = await fetch(
      `https://api.zoom.us/v2/meetings/${meeting_id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${zoomToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          start_time: `${lesson_date}T${start_time}:00`,
          duration
        })
      }
    )

    if (!response.ok) {
      throw new Error(await response.text())
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})
```

**Trigger Database:**

```sql
-- supabase/migrations/20260218_trigger_zoom_sync.sql

CREATE OR REPLACE FUNCTION sync_zoom_meeting_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Se cambia data/orario di lezione ibrida con meeting Zoom
  IF NEW.is_hybrid = true
     AND NEW.zoom_meeting_id IS NOT NULL
     AND (NEW.lesson_date != OLD.lesson_date
          OR NEW.start_time != OLD.start_time
          OR NEW.end_time != OLD.end_time) THEN

    -- Chiama Edge Function per aggiornare Zoom
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/update-zoom-meeting',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'meeting_id', NEW.zoom_meeting_id,
        'lesson_date', NEW.lesson_date,
        'start_time', NEW.start_time,
        'end_time', NEW.end_time
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_zoom_update
AFTER UPDATE ON lessons
FOR EACH ROW
EXECUTE FUNCTION sync_zoom_meeting_update();
```

#### Step 4.2: Cancellazione Meeting Zoom

**File:** `supabase/functions/delete-zoom-meeting/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { getZoomAccessToken } from '../_shared/zoom-auth.ts'

serve(async (req) => {
  try {
    const { meeting_id } = await req.json()

    const zoomToken = await getZoomAccessToken()

    // DELETE meeting
    const response = await fetch(
      `https://api.zoom.us/v2/meetings/${meeting_id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${zoomToken}`
        }
      }
    )

    if (!response.ok && response.status !== 404) {
      // 404 = meeting già cancellato, OK
      throw new Error(await response.text())
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})
```

**Trigger Database:**

```sql
CREATE OR REPLACE FUNCTION delete_zoom_meeting()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.zoom_meeting_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/delete-zoom-meeting',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('meeting_id', OLD.zoom_meeting_id)
    );
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_zoom_meeting
BEFORE DELETE ON lessons
FOR EACH ROW
EXECUTE FUNCTION delete_zoom_meeting();
```

---

## Gestione Insidie

### 1. Rate Limiting Zoom (10 richieste/secondo)

**Problema:** Creazione batch di centinaia di lezioni può superare il limite.

**Soluzione Implementata:**
- Batch di 8 meeting alla volta (sotto il limite di 10)
- Delay di 1 secondo tra batch
- Tempo stimato: ~1.500 lezioni in 3 minuti

**Monitoraggio:**
```typescript
// Log in Edge Function
console.log(`Batch ${batchNumber}/${totalBatches}`)
console.log(`Rate: ${BATCH_SIZE} requests per ${DELAY_MS}ms`)
```

### 2. Errori API Zoom

**Problema:** Network timeout, errori 500, credenziali scadute.

**Soluzione Implementata:**
- Retry con exponential backoff (2s, 4s, 8s)
- Salvataggio errore nel database (campo `zoom_error`)
- Contatore tentativi (`zoom_retry_count`)
- Funzione "Riprova" nell'UI

**Esempio errore salvato:**
```sql
SELECT id, title, zoom_error
FROM lessons
WHERE zoom_error IS NOT NULL;

-- Output:
-- id | title | zoom_error
-- 123 | Pianoforte | Zoom API: Invalid access token
```

### 3. Lezioni Create a Inizio Anno

**Problema:** 1.500 lezioni create a settembre per tutto l'anno.

**Limiti Zoom:**
- ✅ Anticipo massimo: 365 giorni (OK)
- ✅ Meeting schedulati: illimitati (Piano Pro)
- ⚠️ Rate limiting: 10/sec (gestito con batch)

**Strategia:**
1. Generazione batch all'inizio anno scolastico
2. Progresso UI in tempo reale
3. Report finale con eventuali errori
4. Possibilità di rigenerare singole lezioni fallite

**Best Practice:**
```typescript
// Genera solo lezioni fino a fine anno scolastico (giugno)
// Non oltre 12 mesi
const endDate = new Date('2027-06-30')
const startDate = new Date('2026-09-01')
const diffDays = (endDate - startDate) / (1000 * 60 * 60 * 24)

if (diffDays > 365) {
  alert('Attenzione: Zoom permette max 365 giorni in anticipo')
}
```

### 4. Timezone Italia

**Problema:** Disallineamento orari per cambio ora legale/solare.

**Soluzione:**
- Sempre specificare `timezone: 'Europe/Rome'` in API Zoom
- Zoom gestisce automaticamente DST (Daylight Saving Time)
- Non convertire manualmente in UTC

**Esempio:**
```javascript
// ✅ CORRETTO
{
  start_time: "2026-03-29T10:00:00", // 29 marzo, cambio ora legale
  timezone: "Europe/Rome" // Zoom sa che alle 2:00 diventa 3:00
}

// ❌ SBAGLIATO
{
  start_time: "2026-03-29T09:00:00Z" // UTC, ignora timezone locale
}
```

### 5. Account Host Unico

**Problema:** Tutti i meeting sono sul tuo account, non del docente.

**Soluzione Scelta: Account Unico**
- Tutti i meeting creati sul tuo account NAM Maestro
- Docente riceve `zoom_host_link` (start URL) via email
- Docente clicca link → diventa host della lezione
- Studenti usano `zoom_link` (join URL)

**Alternativa Futura: Multi-Account**
- Ogni docente ha account Zoom Pro
- Aggiungi campo `teacher_zoom_email` al DB
- Crea meeting su account specifico docente:
  ```typescript
  fetch(`https://api.zoom.us/v2/users/${teacher.zoom_email}/meetings`, ...)
  ```

**Costi confronto:**
- Account unico: €15/mese
- 10 docenti multi-account: €150/mese

**Raccomandazione:** Inizia con account unico, valuta multi-account se necessario.

---

## Testing

### Test Checklist

#### Test Unitari Edge Functions

```bash
# Test autenticazione Zoom
curl -X POST https://your-project.supabase.co/functions/v1/create-zoom-meeting \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "lesson_id": "test-123",
    "title": "Test Pianoforte",
    "teacher_name": "Mario Rossi",
    "lesson_date": "2026-03-01",
    "start_time": "10:00",
    "end_time": "11:00"
  }'

# Risposta attesa:
# {
#   "success": true,
#   "meeting_id": 87654321098,
#   "join_url": "https://zoom.us/j/87654321098?pwd=...",
#   "start_url": "https://zoom.us/s/87654321098?zak=..."
# }
```

#### Test Frontend

- [ ] **Creazione Lezione Singola Ibrida**
  1. Apri calendario
  2. Click "Nuova Lezione"
  3. Compila form
  4. Spunta "Lezione Ibrida"
  5. Salva
  6. Verifica spinner "Creazione link Zoom..."
  7. Verifica messaggio "✅ Lezione creata con link Zoom"
  8. Click sulla lezione
  9. Verifica visualizzazione link Zoom

- [ ] **Creazione Lezione Singola NON Ibrida**
  1. Crea lezione senza spuntare "Lezione Ibrida"
  2. Verifica che NON appaia sezione Zoom
  3. Verifica che `zoom_link` sia NULL nel DB

- [ ] **Calendar Wizard - Batch 7 Lezioni**
  1. Apri Calendar Wizard
  2. Genera 7 lezioni ricorrenti
  3. Spunta "Lezioni Ibride"
  4. Click "Genera"
  5. Verifica barra progresso
  6. Verifica messaggio finale "7 creati, 0 falliti"
  7. Controlla calendario: tutte e 7 hanno link Zoom

- [ ] **Gestione Errori**
  1. Disabilita temporaneamente secrets Zoom
  2. Crea lezione ibrida
  3. Verifica messaggio errore
  4. Verifica che `zoom_error` contenga messaggio
  5. Click "Riprova"
  6. Riabilita secrets
  7. Verifica creazione link

- [ ] **Copia Link**
  1. Click su lezione ibrida
  2. Click "Copia Link"
  3. Verifica alert "Link copiato"
  4. Incolla in browser
  5. Verifica apertura pagina Zoom

- [ ] **Invio Email Docente**
  1. Click "Invia a Docente"
  2. Verifica email ricevuta
  3. Controlla presenza `zoom_host_link`
  4. Click link → verifica apertura Zoom come host

#### Test Database

```sql
-- Verifica campi Zoom aggiunti
\d lessons

-- Verifica lezioni con link Zoom
SELECT id, title, zoom_meeting_id, zoom_link
FROM lessons
WHERE is_hybrid = true
LIMIT 5;

-- Verifica lezioni con errori
SELECT id, title, zoom_error, zoom_retry_count
FROM lessons
WHERE zoom_error IS NOT NULL;

-- Conta lezioni ibride con/senza link
SELECT
  COUNT(*) FILTER (WHERE zoom_link IS NOT NULL) as con_link,
  COUNT(*) FILTER (WHERE zoom_link IS NULL) as senza_link
FROM lessons
WHERE is_hybrid = true;
```

#### Test Performance

- [ ] **Batch 100 Lezioni**
  - Crea 100 lezioni ibride
  - Tempo atteso: ~12 secondi (100/8 batch * 1sec)
  - Verifica: 100 link creati

- [ ] **Batch 1.000 Lezioni**
  - Crea 1.000 lezioni ibride
  - Tempo atteso: ~2 minuti
  - Verifica: nessun errore rate limiting
  - Verifica: progresso UI funzionante

---

## Troubleshooting

### Problema: "Zoom credentials not configured"

**Causa:** Secrets non impostati in Supabase.

**Soluzione:**
```bash
# Verifica secrets
supabase secrets list

# Se mancano, aggiungi
supabase secrets set ZOOM_ACCOUNT_ID="..."
supabase secrets set ZOOM_CLIENT_ID="..."
supabase secrets set ZOOM_CLIENT_SECRET="..."

# Redeploy function
supabase functions deploy create-zoom-meeting
```

### Problema: "HTTP 401 Unauthorized" da Zoom

**Causa:** Credenziali Zoom sbagliate o app non attivata.

**Soluzione:**
1. Vai su marketplace.zoom.us
2. Verifica che l'app sia **Activated** (toggle ON)
3. Controlla che i secrets siano corretti:
   ```typescript
   console.log('Account ID:', Deno.env.get('ZOOM_ACCOUNT_ID'))
   // NON loggare Client Secret in produzione!
   ```

### Problema: "HTTP 429 Too Many Requests"

**Causa:** Superato rate limit Zoom (10 richieste/secondo).

**Soluzione:**
- Verifica che `BATCH_SIZE = 8` (non 10+)
- Verifica che `DELAY_MS = 1000` (1 secondo)
- In Edge Function batch, aggiungi log:
  ```typescript
  console.log(`Batch ${i}: waiting ${DELAY_MS}ms...`)
  ```

### Problema: Link Zoom generato ma non appare nell'UI

**Causa:** Manca refresh calendario o subscription real-time.

**Soluzione:**
```typescript
// CalendarView.tsx - Aggiungi subscription
useEffect(() => {
  const subscription = supabase
    .channel('lessons-updates')
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'lessons' },
      (payload) => {
        console.log('Lesson updated:', payload.new)
        fetchLessons() // Ricarica automaticamente
      }
    )
    .subscribe()

  return () => subscription.unsubscribe()
}, [])
```

### Problema: Timezone sbagliato (meeting 1 ora prima/dopo)

**Causa:** Mancata specifica `timezone: 'Europe/Rome'`.

**Soluzione:**
```typescript
// Verifica payload Zoom
const meetingPayload = {
  start_time: `${lesson_date}T${start_time}:00`,
  timezone: 'Europe/Rome' // ← DEVE ESSERCI
}
```

### Problema: Docente non riesce ad avviare meeting

**Causa:** Usa `join_url` invece di `start_url`.

**Soluzione:**
- Invia al docente `zoom_host_link` (start URL), NON `zoom_link`
- Verifica email template:
  ```html
  <h3>Link Host (per avviare lezione):</h3>
  <a href="${lesson.zoom_host_link}">Avvia Lezione</a>

  <h3>Link Studenti (da condividere):</h3>
  <a href="${lesson.zoom_link}">Accedi Lezione</a>
  ```

### Problema: Meeting Zoom non si cancella quando elimini lezione

**Causa:** Trigger `delete_zoom_meeting` non attivo.

**Soluzione:**
```sql
-- Verifica trigger
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'trigger_delete_zoom_meeting';

-- Se mancante, crea trigger (vedi Step 4.2)
```

---

## Checklist Finale

### Pre-Deploy

- [ ] Account Zoom Pro attivo
- [ ] App Zoom creata su marketplace
- [ ] Credenziali Zoom copiate (Account ID, Client ID, Client Secret)
- [ ] Secrets configurati in Supabase
- [ ] Migration database eseguita (`zoom_*` campi aggiunti)
- [ ] Edge Functions deployate
- [ ] Frontend modificato (CalendarView, CalendarWizard, types)
- [ ] Testing completato su ambiente di sviluppo

### Post-Deploy

- [ ] Test creazione lezione singola ibrida in produzione
- [ ] Test batch 10 lezioni
- [ ] Verifica email invio link a docente funzionante
- [ ] Verifica app studenti visualizza link Zoom
- [ ] Monitoraggio errori per 24h
- [ ] Backup database pre-migrazione salvato

### Documentazione

- [ ] README aggiornato con sezione Zoom
- [ ] Documentazione per segreteria (come creare lezioni ibride)
- [ ] Documentazione per docenti (come usare link host)
- [ ] Procedura recupero errori (riprova creazione link)

### Manutenzione

- [ ] Monitoring settimanale lezioni con `zoom_error`
- [ ] Verifica mensile scadenza credenziali Zoom
- [ ] Backup lista meeting Zoom (export da dashboard Zoom)
- [ ] Aggiornamento Edge Functions se Zoom cambia API

---

## Riepilogo Costi

| Voce | Costo Mensile | Note |
|------|---------------|------|
| Zoom Pro | €13-15 | Piano base, meeting 30h |
| Supabase | €0 | Edge Functions gratis fino a 2M invocazioni |
| **TOTALE** | **€13-15** | Per account unico |

**Multi-account (futuro):**
- 10 docenti × €15 = €150/mese
- Considerare solo se necessario

---

## Contatti e Supporto

### Risorse Utili

- **Zoom API Docs:** https://developers.zoom.us/docs/api/
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Supabase Secrets:** https://supabase.com/docs/guides/functions/secrets

### Debugging

```typescript
// Abilitare log dettagliati in Edge Function
console.log('=== ZOOM DEBUG ===')
console.log('Lesson ID:', lesson_id)
console.log('Meeting payload:', JSON.stringify(meetingPayload, null, 2))
console.log('Zoom response:', await response.text())
```

---

**Data creazione documento:** 18 Febbraio 2026
**Versione:** 1.0
**Autore:** Claude Code Assistant
**Progetto:** NAM Maestro - Gestionale Scuola Musica
