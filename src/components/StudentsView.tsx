import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LISTS, COURSES_LIST } from '../constants';
import { Student } from '../types';

const StudentsView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stato per la Lista
  const [students, setStudents] = useState<Student[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    course: '',
    type: ''
  });

  // Stato iniziale vuoto per il form
  const initialFormState: Partial<Student> = {
    first_name: '', last_name: '', email: '',
    country: 'Italia', billing_country: 'Italia',
    is_web_access_enabled: false, is_moodle_access_enabled: false,
    privacy_consent: false, billing_different: false
  };

  const [formData, setFormData] = useState<Partial<Student>>(initialFormState);

  // --- LOGICA DI CARICAMENTO (READ) ---
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      console.error('Errore fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carica i dati quando si apre la lista
  useEffect(() => {
    if (viewMode === 'list') {
      fetchStudents();
    }
  }, [viewMode]);

  // --- LOGICA FILTRI ---
  const filteredStudents = students.filter(student => {
    const searchLower = filters.search.toLowerCase();
    const matchesSearch =
      (student.first_name?.toLowerCase().includes(searchLower) || '') ||
      (student.last_name?.toLowerCase().includes(searchLower) || '') ||
      (student.email?.toLowerCase().includes(searchLower) || '') ||
      (student.city?.toLowerCase().includes(searchLower) || '');

    const matchesCourse = filters.course ? (student.course_1 === filters.course || student.course_2 === filters.course) : true;
    const matchesType = filters.type ? student.course_type === filters.type : true;

    return matchesSearch && matchesCourse && matchesType;
  });

  // --- LOGICA FORM ---

  const handleEdit = (student: Student) => {
    setFormData(student);
    setViewMode('form');
    setActiveTab(0);
    setMessage(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo studente? L'azione è irreversibile.")) return;

    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (error: any) {
      alert("Errore cancellazione: " + error.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `student-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      setLoading(true);
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
    } catch (error: any) {
      alert('Errore upload: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- IL CUORE DEL SISTEMA: SALVATAGGIO & INVITO ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // 1. MODIFICA (Se l'ID esiste già, aggiorniamo solo i dati senza rimandare l'invito)
      if (formData.id) {
        const { error } = await supabase
          .from('students')
          .update(formData)
          .eq('id', formData.id);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Dati studente aggiornati correttamente.' });
      }
      // 2. NUOVO INSERIMENTO (Creazione DB + Email Invito)
      else {
        // A. Creiamo prima la scheda nel database
        const { data: newStudent, error: insertError } = await supabase
          .from('students')
          .insert([formData])
          .select()
          .single();

        if (insertError) throw insertError;

        // B. Se c'è la mail, chiamiamo la API per invitare l'utente
        if (formData.email) {
          setMessage({ type: 'success', text: 'Scheda creata. Invio email di benvenuto in corso...' });

          const response = await fetch('/api/invite-student', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: formData.email,
              studentId: newStudent.id,
              firstName: formData.first_name
            })
          });

          if (!response.ok) {
            const errData = await response.json();
            console.error('Errore email:', errData);
            // Non blocchiamo il successo, ma avvisiamo dell'errore mail
            setMessage({ type: 'error', text: 'Studente salvato, ma errore invio email: ' + (errData.error || 'Errore server') });
          } else {
            setMessage({ type: 'success', text: 'Studente iscritto e Email di Invito inviata!' });
            // Reset del form solo se tutto è andato bene
            setFormData(initialFormState);
          }
        } else {
          setMessage({ type: 'success', text: 'Studente salvato (Nessuna email inserita, invito non inviato).' });
          setFormData(initialFormState);
        }
      }

      // Torna alla lista dopo 2 secondi
      setTimeout(() => {
        setViewMode('list');
        setMessage(null);
      }, 2500);

    } catch (error: any) {
      setMessage({ type: 'error', text: 'Errore salvataggio: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER TABS (Uguale a prima) ---

  const renderTab1_Anagrafica = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 bg-gray-200 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center cursor-pointer hover:bg-gray-100 overflow-hidden relative"
          >
            {formData.avatar_url ? (
              <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-500 text-xs text-center p-2">Carica<br />Foto</span>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
          <div className="text-sm text-gray-500">
            <p className="font-bold text-gray-700">Immagine Profilo</p>
            <p>Clicca per caricare</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Nome *</label>
            <input name="first_name" required value={formData.first_name} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Cognome *</label>
            <input name="last_name" required value={formData.last_name} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase">Genere</label>
          <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded">
            <option value="">Seleziona...</option>
            {LISTS.GENDER.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase">Data di Nascita</label>
          <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Luogo Nascita</label>
            <input name="birth_place" value={formData.birth_place} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Provincia</label>
            <input name="birth_province" value={formData.birth_province} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded" maxLength={2} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase">Paese Nascita</label>
          <input name="birth_country" value={formData.birth_country} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Codice Fiscale</label>
            <input name="fiscal_code" value={formData.fiscal_code} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Cittadinanza</label>
            <input name="citizenship" value={formData.citizenship} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTab2_Contatti = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="font-bold text-nam-blue border-b pb-1">Recapiti</h3>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase">Email *</label>
          <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full p-2 border rounded bg-yellow-50" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Cellulare</label>
            <input name="mobile_phone" value={formData.mobile_phone} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Telefono</label>
            <input name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded" />
          </div>
        </div>

        <h3 className="font-bold text-nam-blue border-b pb-1 mt-6">Credenziali Sistema</h3>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="is_web_access_enabled" checked={formData.is_web_access_enabled} onChange={handleChange} className="rounded text-nam-red" />
            <span className="text-sm">Abilita Area Web</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="is_moodle_access_enabled" checked={formData.is_moodle_access_enabled} onChange={handleChange} className="rounded text-nam-red" />
            <span className="text-sm">Abilita Moodle</span>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-nam-blue border-b pb-1">Residenza</h3>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase">Indirizzo</label>
          <input name="address" value={formData.address} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1">
            <label className="block text-xs font-bold text-gray-700 uppercase">CAP</label>
            <input name="zip_code" value={formData.zip_code} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-700 uppercase">Città</label>
            <input name="city" value={formData.city} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Provincia</label>
            <input name="province" value={formData.province} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Paese</label>
            <input name="country" value={formData.country} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTab3_Didattica = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="font-bold text-nam-blue border-b pb-1">Interessi & Corsi</h3>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase">Primo Corso di Interesse</label>
          <select name="course_1" value={formData.course_1} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded">
            <option value="">Seleziona...</option>
            {LISTS.INTEREST_AREAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase">Secondo Corso di Interesse</label>
          <select name="course_2" value={formData.course_2} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded">
            <option value="">Seleziona...</option>
            {LISTS.INTEREST_AREAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase">Tipologia Corso</label>
          <select name="course_type" value={formData.course_type} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded">
            <option value="">Seleziona...</option>
            {LISTS.COURSE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* CORSO DI ISCRIZIONE EFFETTIVO - scrive in enrolled_course */}
        <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(11, 19, 43, 0.05)', border: '2px solid #0B132B' }}>
          <label className="block text-xs font-bold uppercase mb-1" style={{ color: '#0B132B' }}>
            📌 Corso di Iscrizione (Effettivo)
          </label>
          <p className="text-xs mb-2" style={{ color: '#0B132B' }}>
            Seleziona il corso specifico a cui lo studente si iscrive. Questo campo collega lo studente alle lezioni.
          </p>
          <select
            name="enrolled_course"
            value={formData.enrolled_course || ''}
            onChange={handleChange}
            className="w-full p-2 rounded font-bold bg-white"
            style={{ border: '2px solid #0B132B', color: '#0B132B' }}
          >
            <option value="">-- Seleziona Corso Effettivo --</option>
            {COURSES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-nam-blue border-b pb-1">Origine & Workflow</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Come ci hai conosciuto</label>
            <select name="marketing_source" value={formData.marketing_source} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded">
              <option value="">Seleziona...</option>
              {LISTS.MARKETING_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Fonte Lead</label>
            <select name="lead_source" value={formData.lead_source} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded">
              <option value="">Seleziona...</option>
              {LISTS.LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Stato Iscrizione</label>
            <select name="enrollment_status" value={formData.enrollment_status} onChange={handleChange} className="w-full p-2 border rounded font-bold text-nam-red">
              <option value="">Seleziona...</option>
              {LISTS.ENROLLMENT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Open Day</label>
            <select name="open_day_status" value={formData.open_day_status} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded">
              <option value="">Seleziona...</option>
              {LISTS.OPEN_DAY.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase">Sede di Riferimento</label>
          <select name="location" value={formData.location} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded">
            <option value="">Seleziona...</option>
            {LISTS.LOCATIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
    </div>
  );

  const renderTab4_Admin = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="font-bold text-nam-blue border-b pb-1">Dati Fiscali</h3>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase">Partita IVA</label>
          <input name="vat_number" value={formData.vat_number} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded" />
        </div>

        <label className="flex items-center space-x-2 bg-gray-100 p-2 rounded">
          <input type="checkbox" name="billing_different" checked={formData.billing_different} onChange={handleChange} />
          <span className="text-sm font-semibold">Indirizzo fatturazione diverso?</span>
        </label>

        {formData.billing_different && (
          <div className="p-3 border rounded bg-gray-50 space-y-2">
            <input name="billing_address" placeholder="Indirizzo" value={formData.billing_address} onChange={handleChange} className="w-full p-2 border rounded text-sm" />
            <div className="grid grid-cols-3 gap-2">
              <input name="billing_zip_code" placeholder="CAP" value={formData.billing_zip_code} onChange={handleChange} className="w-full p-2 border rounded text-sm" />
              <input name="billing_city" placeholder="Città" value={formData.billing_city} onChange={handleChange} className="col-span-2 w-full p-2 border rounded text-sm" />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-nam-blue border-b pb-1">Note & Privacy</h3>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase">Note Interne</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} rows={4} className="w-full p-2 border border-gray-400 rounded" />
        </div>

        <div className="bg-yellow-50 p-4 border border-yellow-200 rounded">
          <label className="flex items-center space-x-3">
            <input type="checkbox" name="privacy_consent" checked={formData.privacy_consent} onChange={handleChange} className="h-5 w-5 text-nam-green" />
            <div>
              <span className="block font-bold text-sm text-gray-800">Consenso Privacy Firmato</span>
              <span className="text-xs text-gray-500">Il modulo cartaceo deve essere archiviato in amministrazione.</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  // --- VISTA LISTA ---
  if (viewMode === 'list') {
    return (
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Segreteria Studenti
            <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {filteredStudents.length} Iscritti
            </span>
          </h1>
          <button
            onClick={() => {
              setFormData(initialFormState);
              setViewMode('form');
            }}
            className="bg-nam-red text-white px-4 py-2 rounded shadow hover:bg-red-700 flex items-center transition-colors"
          >
            <i className="fas fa-plus mr-2"></i> Nuovo Iscritto
          </button>
        </div>

        {/* Filtri */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cerca (Nome, Città, Email)</label>
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
              <input
                type="text"
                placeholder="Cerca..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 p-2 border rounded focus:ring-nam-red focus:border-nam-red"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Filtra per Corso</label>
            <select
              value={filters.course}
              onChange={(e) => setFilters(prev => ({ ...prev, course: e.target.value }))}
              className="w-full p-2 border border-gray-400 rounded"
            >
              <option value="">Tutti i Corsi</option>
              {LISTS.INTEREST_AREAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipologia</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full p-2 border border-gray-400 rounded"
            >
              <option value="">Tutte le Tipologie</option>
              {LISTS.COURSE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Tabella */}
        <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="p-4 border-b font-bold text-gray-600 text-sm">Allievo</th>
                  <th className="p-4 border-b font-bold text-gray-600 text-sm">Corso & Tipo</th>
                  <th className="p-4 border-b font-bold text-gray-600 text-sm hidden md:table-cell">Stato & Città</th>
                  <th className="p-4 border-b font-bold text-gray-600 text-sm text-center">Notifiche</th>
                  <th className="p-4 border-b font-bold text-gray-600 text-sm text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 border-b last:border-0 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-3 flex-shrink-0">
                            {student.avatar_url ? (
                              <img src={student.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-gray-500">{student.first_name[0]}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800">{student.first_name} {student.last_name}</div>
                            <div className="text-xs text-gray-500">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-semibold text-nam-blue">{student.course_1 || 'Nessun corso'}</div>
                        <div className="text-xs text-gray-500 bg-gray-100 inline-block px-1 rounded">
                          {student.course_type || 'N/A'}
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${student.enrollment_status === 'Iscritto' ? 'bg-green-100 text-green-700' :
                          student.enrollment_status === 'Prenotato' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                          {student.enrollment_status || 'Da definire'}
                        </span>
                        <div className="text-xs text-gray-400 mt-1">
                          {student.city ? <><i className="fas fa-map-marker-alt mr-1"></i>{student.city}</> : '-'}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button className="text-gray-300 hover:text-nam-blue" title="Invia Notifica Push (Presto disponibile)">
                            <i className="fas fa-bell"></i>
                          </button>
                          <button className="text-gray-300 hover:text-nam-blue" title="Invia Email (Presto disponibile)">
                            <i className="fas fa-envelope"></i>
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleEdit(student)}
                          className="text-blue-600 hover:text-blue-800 mr-3 text-sm font-semibold"
                        >
                          Modifica
                        </button>
                        <button
                          onClick={() => student.id && handleDelete(student.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-semibold"
                        >
                          Elimina
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-500">
                      Nessun allievo trovato con questi filtri.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA FORM ---
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setViewMode('list')}
            className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-gray-500 hover:text-nam-red hover:bg-gray-50 transition-all"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {formData.id ? 'Modifica Studente' : 'Nuova Iscrizione'}
            </h1>
            <p className="text-xs text-gray-500">
              {formData.id ? `ID: ${formData.id}` : 'Compila la scheda per iscrivere un nuovo allievo'}
            </p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700 font-bold flex items-center"
        >
          {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-save mr-2"></i>}
          {loading ? 'Attendere...' : 'SALVA & INVITA'}
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex border-b mb-6 overflow-x-auto">
        {['Anagrafica', 'Contatti & Residenza', 'Didattica & Corsi', 'Amministrazione'].map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${activeTab === idx
              ? 'border-nam-red text-nam-red font-bold bg-red-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            {idx + 1}. {tab}
          </button>
        ))}
      </div>

      {/* Form Content */}
      <form className="bg-white rounded-lg shadow p-6 min-h-[500px]" style={{ border: '2px solid #1F4FE0' }}>
        {activeTab === 0 && renderTab1_Anagrafica()}
        {activeTab === 1 && renderTab2_Contatti()}
        {activeTab === 2 && renderTab3_Didattica()}
        {activeTab === 3 && renderTab4_Admin()}
      </form>
    </div>
  );
};

export default StudentsView;