import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Sicurezza: Accettiamo solo richieste POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, studentId, firstName } = req.body;

  if (!email || !studentId) {
    return res.status(400).json({ error: 'Dati mancanti: email o studentId necessari.' });
  }

  // Inizializza Supabase con diritti di AMMINISTRATORE (Service Role)
  // Questo permette di inviare inviti e modificare utenti
  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Invia l'invito via email (Usa il template che hai appena configurato su Supabase)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      { 
        data: { full_name: firstName }, // Salva il nome nei metadati dell'utente
        redirectTo: 'https://maestro-app-smoky.vercel.app/update-password' // Link dove atterra l'utente dopo il click
      }
    );

    if (authError) throw authError;

    const newUserId = authData.user.id;

    // 2. Collega l'utente appena creato alla scheda studente esistente nel DB
    const { error: updateError } = await supabaseAdmin
      .from('students')
      .update({ auth_user_id: newUserId })
      .eq('id', studentId);

    if (updateError) throw updateError;

    // Successo
    return res.status(200).json({ success: true, userId: newUserId });

  } catch (error: any) {
    console.error('Errore API Invito:', error);
    return res.status(500).json({ error: error.message });
  }
}