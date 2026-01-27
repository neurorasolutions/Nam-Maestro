import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createClient } from '@supabase/supabase-js';

// Plugin per gestire le API in sviluppo locale
function apiPlugin(env: Record<string, string>) {
  return {
    name: 'api-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/invite-student', async (req: any, res: any, next: any) => {
        if (req.method !== 'POST') {
          return next();
        }

        let body = '';
        req.on('data', (chunk: any) => { body += chunk; });
        req.on('end', async () => {
          try {
            const { email, studentId, firstName } = JSON.parse(body);

            if (!email || !studentId) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Dati mancanti: email o studentId necessari.' }));
              return;
            }

            const supabaseAdmin = createClient(
              env.VITE_SUPABASE_URL,
              env.SUPABASE_SERVICE_ROLE_KEY
            );

            // Invia l'invito via email
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
              email,
              {
                data: { full_name: firstName },
                redirectTo: 'https://maestro-app-smoky.vercel.app/update-password'
              }
            );

            if (authError) throw authError;

            const newUserId = authData.user.id;

            // Collega l'utente alla scheda studente
            const { error: updateError } = await supabaseAdmin
              .from('students')
              .update({ auth_user_id: newUserId })
              .eq('id', studentId);

            if (updateError) throw updateError;

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, userId: newUserId }));

          } catch (error: any) {
            console.error('Errore API Invito:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: error.message }));
          }
        });
      });
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), apiPlugin(env)],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      }
    };
});
