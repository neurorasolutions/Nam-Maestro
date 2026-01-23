import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Stato per gestire la visibilità dei termini di servizio
  const [showTerms, setShowTerms] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Credenziali non valide. Riprova.');
    }
    setLoading(false);
  };

  return (
    // Sfondo col nuovo colore RGB specifico
    <div className="min-h-screen bg-nam-login-bg flex flex-col items-center justify-center p-4">
      
      {/* LOGO NAM CENTRATO */}
      <div className="mb-8 text-center">
         {/* Assicurati che il file sia in /public/nam-logo-login.png */}
        <img 
          src="/nam-logo-login.png" 
          alt="NAM Logo" 
          className="h-24 mx-auto object-contain" // Altezza regolabile se necessario
        />
      </div>

      {/* CARD DI LOGIN BIANCA */}
      <div className="bg-white p-8 rounded-[20px] shadow-2xl w-full max-w-[400px] text-center">
        <h2 className="text-gray-600 text-lg mb-8 font-light">Accesso utente</h2>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="email"
              placeholder="Nome utente / e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-full bg-gray-100 border-transparent focus:border-gray-300 focus:bg-white focus:ring-0 text-sm transition duration-200 outline-none placeholder-gray-400 text-center"
              required
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-full bg-gray-100 border-transparent focus:border-gray-300 focus:bg-white focus:ring-0 text-sm transition duration-200 outline-none placeholder-gray-400 text-center"
              required
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 px-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" className="form-checkbox rounded text-nam-green focus:ring-nam-green" />
              <span>Ricordati di me</span>
            </label>
            <button type="button" className="text-blue-500 hover:underline focus:outline-none">
              Ripristina password
            </button>
          </div>

          {error && (
            <div className="text-nam-red text-xs bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            // Ho mantenuto il bottone scuro come nello screenshot
            className="w-full bg-[#2c3e50] text-white py-3 px-4 rounded-full hover:bg-opacity-90 transition duration-200 font-medium text-sm shadow-md"
          >
            {loading ? 'Verifica...' : 'Accedi'}
          </button>
        </form>

        {/* SEZIONE TERMINI DI SERVIZIO */}
        <div className="mt-8 pt-6 border-t border-gray-100">
            <button 
                onClick={() => setShowTerms(!showTerms)}
                className="text-xs text-gray-400 hover:text-gray-600 underline focus:outline-none mb-2"
            >
                Termini di servizio
            </button>
            
            {/* Testo a comparsa */}
            {showTerms && (
                <div className="text-xxs text-gray-500 text-left bg-gray-50 p-3 rounded-lg leading-tight space-y-2 animate-fade-in">
                    <p className="font-bold text-nam-red">Attenzione: i dati forniti non hanno alcun valore contrattuale</p>
                    <p>La compilazione dell'anagrafica si intende finalizzata al solo invio dello schema contrattuale da firmare in ogni sua parte.</p>
                    <p>Con la compilazione dell'anagrafica l'utente ha accesso alla piattaforma al fine di: visualizzare il proprio calendario scolastico, il controllo dei registri e lo stato dei pagamenti.</p>
                </div>
            )}
        </div>

      </div>

      {/* NUOVO FOOTER */}
      <div className="mt-8 text-center text-nam-text-light text-sm font-light">
        <p>Powered by Neurora.it - v 1.0</p>
      </div>
    </div>
  );
};

export default LoginView;