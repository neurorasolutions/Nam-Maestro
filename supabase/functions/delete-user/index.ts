// Edge Function per cancellare utenti da auth.users
// Richiede service_role per operazioni admin

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
    // Verifica che sia una richiesta POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Metodo non consentito' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Estrai i dati dalla richiesta
    const { auth_user_id, student_id } = await req.json()

    if (!auth_user_id && !student_id) {
      return new Response(
        JSON.stringify({ error: 'auth_user_id o student_id richiesto' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Crea client Supabase con service_role (permessi admin)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    let userIdToDelete = auth_user_id

    // Se abbiamo solo student_id, recupera auth_user_id dalla tabella students
    if (!userIdToDelete && student_id) {
      const { data: student, error: fetchError } = await supabaseAdmin
        .from('students')
        .select('auth_user_id')
        .eq('id', student_id)
        .single()

      if (fetchError || !student?.auth_user_id) {
        // Lo studente potrebbe non avere un auth_user_id (non ha mai accettato l'invito)
        // In questo caso, cancelliamo solo dalla tabella students
        const { error: deleteStudentError } = await supabaseAdmin
          .from('students')
          .delete()
          .eq('id', student_id)

        if (deleteStudentError) {
          return new Response(
            JSON.stringify({ error: 'Errore cancellazione studente: ' + deleteStudentError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Studente cancellato (nessun utente auth associato)'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      userIdToDelete = student.auth_user_id
    }

    // 1. Prima cancella dalla tabella students (se presente)
    if (student_id) {
      const { error: deleteStudentError } = await supabaseAdmin
        .from('students')
        .delete()
        .eq('id', student_id)

      if (deleteStudentError) {
        console.error('Errore cancellazione da students:', deleteStudentError)
        // Continua comunque per cancellare da auth
      }
    }

    // 2. Cancella l'utente da auth.users
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete)

    if (deleteAuthError) {
      return new Response(
        JSON.stringify({ error: 'Errore cancellazione auth: ' + deleteAuthError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Utente cancellato completamente da students e auth.users'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Errore interno: ' + error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
