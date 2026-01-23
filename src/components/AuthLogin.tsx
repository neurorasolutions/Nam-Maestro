import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Stato per gestire la vista: 'login' oppure 'reset'
  const [view, setView] = useState<'login' | 'reset'>('login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      // Il redirect è gestito automaticamente dall'AuthContext che rileva la sessione
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' 
        ? 'Credenziali non valide.' 
        : 'Errore durante il login. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Invia il link di reset all'indirizzo specificato
      // redirectTo punta alla home, dove l'utente sarà loggato e potrà cambiare pass
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (error) throw error;
      setSuccessMsg('Controlla la tua email. Ti abbiamo inviato un link per accedere.');
    } catch (err: any) {
      setError('Errore nell\'invio della mail: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nam-login-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden">
        
        {/* Header con Logo */}
        <div className="bg-nam-login-bg p-8 flex justify-center border-b border-gray-700">
           <img 
            src="/nam-logo-login.png" 
            alt="NAM Logo" 
            className="h-16 object-contain filter drop-shadow-lg"
          />
        </div>

        {/* Form Body */}
        <div className="p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            {view === 'login' ? 'Accedi a NAM Maestro' : 'Recupera Password'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-700 text-sm">
              {successMsg}
            </div>
          )}

          {view === 'login' ? (
            // --- FORM DI LOGIN ---
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-nam-red focus:border-transparent outline-none transition-all"
                  placeholder="nome@nam.it"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-nam-red focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <button 
                    type="button"
                    onClick={() => {
                      setView('reset');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="font-medium text-nam-red hover:text-red-700"
                  >
                    Password dimenticata?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-nam-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nam-red transition-colors disabled:opacity-50"
              >
                {loading ? 'Accesso in corso...' : 'Accedi'}
              </button>
            </form>
          ) : (
            // --- FORM DI RESET PASSWORD ---
            <form onSubmit={handleResetPassword} className="space-y-6">
              <p className="text-sm text-gray-600 mb-4">
                Inserisci la tua email. Ti invieremo un link magico per accedere immediatamente e reimpostare la password.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-nam-red focus:border-transparent outline-none transition-all"
                  placeholder="nome@nam.it"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-nam-blue hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nam-blue transition-colors disabled:opacity-50"
              >
                {loading ? 'Invio in corso...' : 'Invia Link di Accesso'}
              </button>

              <div className="text-center">
                <button 
                  type="button"
                  onClick={() => {
                    setView('login');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Torna al Login
                </button>
              </div>
            </form>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 p-4 text-center text-xs text-gray-500 border-t">
          &copy; {new Date().getFullYear()} NAM Maestro - Gestionale Scolastico
        </div>
      </div>
    </div>
  );
};

export default AuthLogin;