import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { session, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Sincronizza l'avatar quando si apre il modale o cambia la sessione
  useEffect(() => {
    if (session?.user?.user_metadata?.avatar_url) {
      setAvatarUrl(session.user.user_metadata.avatar_url);
    }
  }, [session, isOpen]);

  if (!isOpen || !session) return null;

  const user = session.user;
  const initialEmail = user.email || '';

  // Gestione Upload Immagine
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    setLoading(true);
    setMessage(null);
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      // 1. Carica il file nel bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Ottieni l'URL pubblico
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Aggiorna i metadati dell'utente
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      setMessage({ type: 'success', text: 'Foto profilo aggiornata!' });
    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: 'Errore upload: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // Gestione Cambio Password
  const handleUpdateProfile = async () => {
    setLoading(true);
    setMessage(null);

    const updates: any = {};
    if (password) updates.password = password;
    
    try {
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.auth.updateUser(updates);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Password aggiornata con successo!' });
        setPassword('');
      } else {
        // Se non c'è password da cambiare, chiudiamo solo (o messaggio info)
        setMessage({ type: 'success', text: 'Nessuna modifica rilevata.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 max-w-full overflow-hidden">
        {/* Header */}
        <div className="bg-nam-login-bg text-white p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold">Gestione Profilo</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white">&times;</button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          {/* Foto Profilo + Upload */}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-2 border-nam-green flex items-center justify-center relative group">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-gray-500">{initialEmail.charAt(0).toUpperCase()}</span>
              )}
              
              {/* Overlay hover per indicare cliccabilità */}
              <div 
                className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="fas fa-camera text-white"></i>
              </div>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              className="hidden"
            />
            
            <button 
              className="text-xs text-blue-600 hover:underline"
              onClick={() => fileInputRef.current?.click()}
            >
              Cambia foto
            </button>
          </div>

          {/* Email (Sola lettura) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              value={initialEmail} 
              disabled 
              className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Nuova Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Nuova Password</label>
            <input 
              type="password" 
              placeholder="Lascia vuoto per non cambiare"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-nam-green focus:border-nam-green"
            />
          </div>

          {/* Messaggi Feedback */}
          {message && (
            <div className={`text-sm p-2 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 p-4 flex justify-between items-center border-t">
          <button 
            onClick={handleLogout}
            className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-2 border border-transparent hover:bg-red-50 rounded"
          >
            Disconnetti
          </button>
          
          <button 
            onClick={handleUpdateProfile}
            disabled={loading}
            className="bg-nam-green text-white px-4 py-2 rounded text-sm font-bold hover:bg-opacity-90 transition-colors"
          >
            {loading ? 'Attendere...' : 'Salva Modifiche'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;