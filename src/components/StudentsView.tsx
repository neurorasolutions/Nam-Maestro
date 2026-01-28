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

  // --- STATO VALIDAZIONE ---
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Definizione campi obbligatori con etichette e tab di appartenenza
  const REQUIRED_FIELDS: { field: keyof Student; label: string; tab: number }[] = [
    // Tab 0 - Anagrafica
    { field: 'first_name', label: 'Nome', tab: 0 },
    { field: 'last_name', label: 'Cognome', tab: 0 },
    { field: 'gender', label: 'Genere', tab: 0 },
    { field: 'date_of_birth', label: 'Data di Nascita', tab: 0 },
    { field: 'birth_place', label: 'Luogo di Nascita', tab: 0 },
    { field: 'birth_province', label: 'Provincia di Nascita', tab: 0 },
    { field: 'birth_country', label: 'Paese di Nascita', tab: 0 },
    { field: 'fiscal_code', label: 'Codice Fiscale', tab: 0 },
    { field: 'citizenship', label: 'Cittadinanza', tab: 0 },
    { field: 'education_level', label: 'Grado di Istruzione', tab: 0 },
    // Tab 1 - Contatti & Residenza
    { field: 'email', label: 'Email', tab: 1 },
    { field: 'mobile_phone', label: 'Cellulare', tab: 1 },
    { field: 'phone', label: 'Telefono', tab: 1 },
    { field: 'address', label: 'Indirizzo', tab: 1 },
    { field: 'zip_code', label: 'CAP', tab: 1 },
    { field: 'city', label: 'Città', tab: 1 },
    { field: 'province', label: 'Provincia di Residenza', tab: 1 },
    { field: 'country', label: 'Paese di Residenza', tab: 1 },
    // Tab 2 - Didattica & Corsi
    { field: 'course_1', label: 'Primo Corso di Interesse', tab: 2 },
    { field: 'course_2', label: 'Secondo Corso di Interesse', tab: 2 },
    { field: 'course_type', label: 'Tipologia Corso', tab: 2 },
    { field: 'enrolled_course', label: 'Corso di Iscrizione (Effettivo)', tab: 2 },
    { field: 'marketing_source', label: 'Come ci hai conosciuto', tab: 2 },
    { field: 'lead_source', label: 'Fonte Lead', tab: 2 },
    { field: 'enrollment_status', label: 'Stato Iscrizione', tab: 2 },
    { field: 'open_day_status', label: 'Open Day', tab: 2 },
    { field: 'location', label: 'Sede di Riferimento', tab: 2 },
  ];

  // Funzione di validazione
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    REQUIRED_FIELDS.forEach(({ field, label }) => {
      const value = formData[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors[field] = `${label} è obbligatorio`;
      }
    });

    // Validazione privacy consent (checkbox)
    if (!formData.privacy_consent) {
      errors['privacy_consent'] = 'Il Consenso Privacy è obbligatorio';
    }

    // Validazione email formato
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors['email'] = 'Formato email non valido';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Trova il primo tab con errori
  const getFirstTabWithError = (): number => {
    const errorFields = Object.keys(validationErrors);
    for (const { field, tab } of REQUIRED_FIELDS) {
      if (errorFields.includes(field)) return tab;
    }
    if (errorFields.includes('privacy_consent')) return 3;
    return 0;
  };

  // --- STATO MESSAGGISTICA ---
  const [showCommModal, setShowCommModal] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [commChannel, setCommChannel] = useState<'email' | 'push' | 'whatsapp'>('email');
  const [emailSubject, setEmailSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [commMessage, setCommMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [targetMode, setTargetMode] = useState<'manual' | 'course'>('manual');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [modalSelectedIds, setModalSelectedIds] = useState<Set<string>>(new Set());
  const [studentSearch, setStudentSearch] = useState('');

  // --- STATO MODAL INVITO ---
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteStudentId, setInviteStudentId] = useState<string>('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const defaultInviteEmailContent = `<h2>Benvenuto in NAM!</h2>
<p>La tua iscrizione è stata confermata.</p>

<p>Per iniziare il tuo percorso, segui questi due passaggi obbligatori:</p>

<ol>
  <li>
    <strong>Imposta la tua Password:</strong><br/>
    <a href="{{ .ConfirmationURL }}">Clicca qui per creare la tua password segreta</a>
  </li>
  <li>
    <strong>Scarica l'App Studenti:</strong><br/>
    <a href="https://maestro-app-smoky.vercel.app/">Clicca qui per accedere all'App Web</a>
  </li>
</ol>

<p>A presto,<br/>Lo Staff NAM</p>`;
  const [inviteEmailContent, setInviteEmailContent] = useState(defaultInviteEmailContent);

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

  // --- LOGICA SELEZIONE ---
  const toggleSelectAll = () => {
    if (selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map(s => s.id!).filter(Boolean)));
    }
  };

  const toggleSelectStudent = (id: string) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedStudentIds(newSet);
  };

  // --- LOGICA FORM ---

  const handleEdit = (student: Student) => {
    setFormData(student);
    setViewMode('form');
    setActiveTab(0);
    setMessage(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo studente? L'azione è irreversibile.\n\nVerrà cancellato sia dalla lista studenti che dal sistema di autenticazione.")) return;

    try {
      // Chiama la Edge Function che cancella sia da students che da auth.users
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { student_id: id }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setStudents(prev => prev.filter(s => s.id !== id));
      setMessage({ type: 'success', text: 'Studente eliminato completamente dal sistema.' });
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

  // Helper per classi CSS con errore
  const getInputClass = (fieldName: string, baseClass: string = 'w-full p-2 border border-gray-400 rounded') => {
    return validationErrors[fieldName]
      ? `${baseClass} border-red-500 bg-red-50`
      : baseClass;
  };

  // Pulisce errore quando l'utente modifica il campo
  const handleChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    handleChange(e);
    // Rimuovi l'errore per questo campo
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // --- FUNZIONE INVIO INVITO ---
  const handleSendInvite = async () => {
    if (!inviteStudentId) {
      setInviteMessage({ type: 'error', text: 'Seleziona uno studente' });
      return;
    }

    const student = students.find(s => s.id === inviteStudentId);
    if (!student || !student.email) {
      setInviteMessage({ type: 'error', text: 'Studente non trovato o email mancante' });
      return;
    }

    setInviteLoading(true);
    setInviteMessage(null);

    try {
      const response = await fetch('/api/invite-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: student.email,
          studentId: student.id,
          firstName: student.first_name
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Errore invio invito');
      }

      setInviteMessage({ type: 'success', text: `Invito inviato con successo a ${student.email}!` });

      // Chiudi il modal dopo 2 secondi
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteStudentId('');
        setInviteMessage(null);
        setInviteEmailContent(defaultInviteEmailContent);
      }, 2000);

    } catch (error: any) {
      setInviteMessage({ type: 'error', text: error.message });
    } finally {
      setInviteLoading(false);
    }
  };

  // --- INVIO MESSAGGI (Email/Push/WhatsApp) ---
  const handleSendMessage = async () => {
    // Determina i destinatari in base alla modalità selezionata
    let targetStudents: Student[] = [];

    if (targetMode === 'manual') {
      // Selezione manuale dal modal
      if (modalSelectedIds.size === 0) {
        setCommMessage({ type: 'error', text: 'Seleziona almeno uno studente dalla lista' });
        return;
      }
      targetStudents = students.filter(s => modalSelectedIds.has(s.id!));
    } else {
      // Per corso
      if (!selectedCourse) {
        setCommMessage({ type: 'error', text: 'Seleziona un corso' });
        return;
      }
      targetStudents = students.filter(s =>
        s.enrolled_course === selectedCourse || s.course_1 === selectedCourse
      );
    }

    if (targetStudents.length === 0) {
      setCommMessage({ type: 'error', text: 'Nessun destinatario trovato per la selezione' });
      return;
    }

    // Validazione campi
    if (commChannel === 'email') {
      if (!emailSubject.trim()) {
        setCommMessage({ type: 'error', text: 'Inserisci l\'oggetto dell\'email' });
        return;
      }
      if (!messageContent.trim()) {
        setCommMessage({ type: 'error', text: 'Inserisci il contenuto del messaggio' });
        return;
      }

      // Filtra studenti con email
      const studentsWithEmail = targetStudents.filter(s => s.email);
      if (studentsWithEmail.length === 0) {
        setCommMessage({ type: 'error', text: 'Nessuno studente selezionato ha un\'email valida' });
        return;
      }

      setSendingMessage(true);
      setCommMessage(null);

      try {
        const emails = studentsWithEmail.map(s => s.email!);

        // Template HTML semplice per l'email
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
            ${messageContent.replace(/\n/g, '<br/>')}
            <br/><br/>
            <p style="color: #666; font-size: 13px; margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee;">
              Segreteria NAM - Nuova Audio Musicmedia<br/>
              <a href="https://www.nam.it" style="color: #1a365d;">www.nam.it</a>
            </p>
          </div>
        `;

        const { data, error } = await supabase.functions.invoke('send-email', {
          body: {
            to: emails,
            subject: emailSubject,
            body: htmlBody,
            isHtml: true
          }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setCommMessage({
          type: 'success',
          text: `Email inviata con successo a ${studentsWithEmail.length} studente/i!`
        });

        // Reset e chiudi dopo 2 secondi
        setTimeout(() => {
          setShowCommModal(false);
          setEmailSubject('');
          setMessageContent('');
          setCommMessage(null);
          setModalSelectedIds(new Set());
          setTargetMode('manual');
          setSelectedCourse('');
          setStudentSearch('');
        }, 2000);

      } catch (error: any) {
        setCommMessage({ type: 'error', text: 'Errore invio: ' + error.message });
      } finally {
        setSendingMessage(false);
      }

    } else if (commChannel === 'whatsapp') {
      // WhatsApp: apre WhatsApp Web con il messaggio
      const studentsWithPhone = targetStudents.filter(s => s.mobile_phone || s.phone);
      if (studentsWithPhone.length === 0) {
        setCommMessage({ type: 'error', text: 'Nessuno studente selezionato ha un numero di telefono' });
        return;
      }

      // Per ora apriamo WhatsApp per il primo studente (multi-invio richiede WhatsApp Business API)
      const phone = (studentsWithPhone[0].mobile_phone || studentsWithPhone[0].phone || '').replace(/\D/g, '');
      const text = encodeURIComponent(messageContent);
      window.open(`https://wa.me/${phone}?text=${text}`, '_blank');

      setCommMessage({ type: 'success', text: 'WhatsApp aperto. Nota: per invio multiplo serve WhatsApp Business API.' });

    } else if (commChannel === 'push') {
      setCommMessage({ type: 'error', text: 'Push notifications: funzionalità in arrivo!' });
    }
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
    setMessage(null);

    // Validazione prima del submit
    if (!validateForm()) {
      const firstErrorTab = getFirstTabWithError();
      setActiveTab(firstErrorTab);
      setMessage({
        type: 'error',
        text: 'Compila tutti i campi obbligatori prima di procedere. I campi mancanti sono evidenziati in rosso.'
      });
      return;
    }

    setLoading(true);

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
            <input name="first_name" value={formData.first_name} onChange={handleChangeWithValidation} className={getInputClass('first_name')} />
            {validationErrors.first_name && <span className="text-xs text-red-500">{validationErrors.first_name}</span>}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Cognome *</label>
            <input name="last_name" value={formData.last_name} onChange={handleChangeWithValidation} className={getInputClass('last_name')} />
            {validationErrors.last_name && <span className="text-xs text-red-500">{validationErrors.last_name}</span>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase">Genere *</label>
          <select name="gender" value={formData.gender} onChange={handleChangeWithValidation} className={getInputClass('gender')}>
            <option value="">Seleziona...</option>
            {LISTS.GENDER.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          {validationErrors.gender && <span className="text-xs text-red-500">{validationErrors.gender}</span>}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase">Data di Nascita *</label>
          <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChangeWithValidation} className={getInputClass('date_of_birth')} />
          {validationErrors.date_of_birth && <span className="text-xs text-red-500">{validationErrors.date_of_birth}</span>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Luogo Nascita *</label>
            <input name="birth_place" value={formData.birth_place} onChange={handleChangeWithValidation} className={getInputClass('birth_place')} />
            {validationErrors.birth_place && <span className="text-xs text-red-500">{validationErrors.birth_place}</span>}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Provincia Nascita *</label>
            <input name="birth_province" value={formData.birth_province} onChange={handleChangeWithValidation} className={getInputClass('birth_province')} maxLength={2} />
            {validationErrors.birth_province && <span className="text-xs text-red-500">{validationErrors.birth_province}</span>}
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase">Paese Nascita *</label>
          <input name="birth_country" value={formData.birth_country} onChange={handleChangeWithValidation} className={getInputClass('birth_country')} />
          {validationErrors.birth_country && <span className="text-xs text-red-500">{validationErrors.birth_country}</span>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Codice Fiscale *</label>
            <input name="fiscal_code" value={formData.fiscal_code} onChange={handleChangeWithValidation} className={getInputClass('fiscal_code')} />
            {validationErrors.fiscal_code && <span className="text-xs text-red-500">{validationErrors.fiscal_code}</span>}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Cittadinanza *</label>
            <input name="citizenship" value={formData.citizenship} onChange={handleChangeWithValidation} className={getInputClass('citizenship')} />
            {validationErrors.citizenship && <span className="text-xs text-red-500">{validationErrors.citizenship}</span>}
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase">Grado di Istruzione *</label>
          <select name="education_level" value={formData.education_level} onChange={handleChangeWithValidation} className={getInputClass('education_level')}>
            <option value="">Seleziona...</option>
            {LISTS.EDUCATION_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          {validationErrors.education_level && <span className="text-xs text-red-500">{validationErrors.education_level}</span>}
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
          <input type="email" name="email" value={formData.email} onChange={handleChangeWithValidation} className={getInputClass('email', 'w-full p-2 border rounded bg-yellow-50')} />
          {validationErrors.email && <span className="text-xs text-red-500">{validationErrors.email}</span>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Cellulare *</label>
            <input name="mobile_phone" value={formData.mobile_phone} onChange={handleChangeWithValidation} className={getInputClass('mobile_phone')} />
            {validationErrors.mobile_phone && <span className="text-xs text-red-500">{validationErrors.mobile_phone}</span>}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Telefono *</label>
            <input name="phone" value={formData.phone} onChange={handleChangeWithValidation} className={getInputClass('phone')} />
            {validationErrors.phone && <span className="text-xs text-red-500">{validationErrors.phone}</span>}
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
          <label className="block text-xs font-bold text-gray-700 uppercase">Indirizzo *</label>
          <input name="address" value={formData.address} onChange={handleChangeWithValidation} className={getInputClass('address')} />
          {validationErrors.address && <span className="text-xs text-red-500">{validationErrors.address}</span>}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1">
            <label className="block text-xs font-bold text-gray-700 uppercase">CAP *</label>
            <input name="zip_code" value={formData.zip_code} onChange={handleChangeWithValidation} className={getInputClass('zip_code')} />
            {validationErrors.zip_code && <span className="text-xs text-red-500">{validationErrors.zip_code}</span>}
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-700 uppercase">Città *</label>
            <input name="city" value={formData.city} onChange={handleChangeWithValidation} className={getInputClass('city')} />
            {validationErrors.city && <span className="text-xs text-red-500">{validationErrors.city}</span>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Provincia *</label>
            <input name="province" value={formData.province} onChange={handleChangeWithValidation} className={getInputClass('province')} />
            {validationErrors.province && <span className="text-xs text-red-500">{validationErrors.province}</span>}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Paese *</label>
            <input name="country" value={formData.country} onChange={handleChangeWithValidation} className={getInputClass('country')} />
            {validationErrors.country && <span className="text-xs text-red-500">{validationErrors.country}</span>}
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
          <label className="block text-xs font-bold text-gray-700 uppercase">Primo Corso di Interesse *</label>
          <select name="course_1" value={formData.course_1} onChange={handleChangeWithValidation} className={getInputClass('course_1')}>
            <option value="">Seleziona...</option>
            {LISTS.INTEREST_AREAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {validationErrors.course_1 && <span className="text-xs text-red-500">{validationErrors.course_1}</span>}
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase">Secondo Corso di Interesse *</label>
          <select name="course_2" value={formData.course_2} onChange={handleChangeWithValidation} className={getInputClass('course_2')}>
            <option value="">Seleziona...</option>
            {LISTS.INTEREST_AREAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {validationErrors.course_2 && <span className="text-xs text-red-500">{validationErrors.course_2}</span>}
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase">Tipologia Corso *</label>
          <select name="course_type" value={formData.course_type} onChange={handleChangeWithValidation} className={getInputClass('course_type')}>
            <option value="">Seleziona...</option>
            {LISTS.COURSE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {validationErrors.course_type && <span className="text-xs text-red-500">{validationErrors.course_type}</span>}
        </div>

        {/* CORSO DI ISCRIZIONE EFFETTIVO - scrive in enrolled_course */}
        <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(11, 19, 43, 0.05)', border: '2px solid #0B132B' }}>
          <label className="block text-xs font-bold uppercase mb-1" style={{ color: '#0B132B' }}>
            📌 Corso di Iscrizione (Effettivo) *
          </label>
          <p className="text-xs mb-2" style={{ color: '#0B132B' }}>
            Seleziona il corso specifico a cui lo studente si iscrive. Questo campo collega lo studente alle lezioni.
          </p>
          <select
            name="enrolled_course"
            value={formData.enrolled_course || ''}
            onChange={handleChangeWithValidation}
            className={`w-full p-2 rounded font-bold bg-white ${validationErrors.enrolled_course ? 'border-red-500 bg-red-50' : ''}`}
            style={{ border: validationErrors.enrolled_course ? '2px solid #ef4444' : '2px solid #0B132B', color: '#0B132B' }}
          >
            <option value="">-- Seleziona Corso Effettivo --</option>
            {COURSES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {validationErrors.enrolled_course && <span className="text-xs text-red-500">{validationErrors.enrolled_course}</span>}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-nam-blue border-b pb-1">Origine & Workflow</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Come ci hai conosciuto *</label>
            <select name="marketing_source" value={formData.marketing_source} onChange={handleChangeWithValidation} className={getInputClass('marketing_source')}>
              <option value="">Seleziona...</option>
              {LISTS.MARKETING_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {validationErrors.marketing_source && <span className="text-xs text-red-500">{validationErrors.marketing_source}</span>}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Fonte Lead *</label>
            <select name="lead_source" value={formData.lead_source} onChange={handleChangeWithValidation} className={getInputClass('lead_source')}>
              <option value="">Seleziona...</option>
              {LISTS.LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {validationErrors.lead_source && <span className="text-xs text-red-500">{validationErrors.lead_source}</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Stato Iscrizione *</label>
            <select name="enrollment_status" value={formData.enrollment_status} onChange={handleChangeWithValidation} className={`${getInputClass('enrollment_status')} font-bold text-nam-red`}>
              <option value="">Seleziona...</option>
              {LISTS.ENROLLMENT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {validationErrors.enrollment_status && <span className="text-xs text-red-500">{validationErrors.enrollment_status}</span>}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Open Day *</label>
            <select name="open_day_status" value={formData.open_day_status} onChange={handleChangeWithValidation} className={getInputClass('open_day_status')}>
              <option value="">Seleziona...</option>
              {LISTS.OPEN_DAY.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {validationErrors.open_day_status && <span className="text-xs text-red-500">{validationErrors.open_day_status}</span>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase">Sede di Riferimento *</label>
          <select name="location" value={formData.location} onChange={handleChangeWithValidation} className={getInputClass('location')}>
            <option value="">Seleziona...</option>
            {LISTS.LOCATIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {validationErrors.location && <span className="text-xs text-red-500">{validationErrors.location}</span>}
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

        <div className={`p-4 border rounded ${validationErrors.privacy_consent ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-200'}`}>
          <label className="flex items-center space-x-3">
            <input type="checkbox" name="privacy_consent" checked={formData.privacy_consent} onChange={handleChangeWithValidation} className={`h-5 w-5 ${validationErrors.privacy_consent ? 'text-red-500' : 'text-nam-green'}`} />
            <div>
              <span className="block font-bold text-sm text-gray-800">Consenso Privacy Firmato *</span>
              <span className="text-xs text-gray-500">Il modulo cartaceo deve essere archiviato in amministrazione.</span>
              {validationErrors.privacy_consent && <span className="block text-xs text-red-500 mt-1">{validationErrors.privacy_consent}</span>}
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
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowInviteModal(true);
                setInviteMessage(null);
                setInviteStudentId('');
                setInviteEmailContent(defaultInviteEmailContent);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 flex items-center transition-colors"
            >
              <i className="fas fa-envelope-open-text mr-2"></i> Invia Invito
            </button>
            <button
              onClick={() => setShowCommModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 flex items-center transition-colors"
            >
              <i className="fas fa-paper-plane mr-2"></i> Invia Messaggio
            </button>
            <button
              onClick={() => {
                setFormData(initialFormState);
                setValidationErrors({});
                setViewMode('form');
              }}
              className="bg-nam-red text-white px-4 py-2 rounded shadow hover:bg-red-700 flex items-center transition-colors"
            >
              <i className="fas fa-plus mr-2"></i> Nuovo Iscritto
            </button>
          </div>
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
                  <th className="p-4 border-b w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredStudents.length > 0 && selectedStudentIds.size === filteredStudents.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                    />
                  </th>
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
                    <tr key={student.id} className={`hover:bg-gray-50 border-b last:border-0 transition-colors ${selectedStudentIds.has(student.id!) ? 'bg-indigo-50' : ''}`}>
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.has(student.id!)}
                          onChange={() => toggleSelectStudent(student.id!)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                        />
                      </td>
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

        {/* COMMUNICATION MODAL */}
        {
          showCommModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                <div className="bg-indigo-600 p-4 flex justify-between items-center text-white flex-shrink-0">
                  <h3 className="font-bold text-lg"><i className="fas fa-paper-plane mr-2"></i> Invia Comunicazione</h3>
                  <button onClick={() => setShowCommModal(false)} className="hover:bg-indigo-700 p-1 rounded transition-colors">
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <div className="p-6 overflow-y-auto">
                  {/* Target Selection Mode */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Destinatari</label>
                    <div className="flex gap-4 p-3 bg-gray-50 rounded border border-gray-200 mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="targetMode"
                          checked={targetMode === 'manual'}
                          onChange={() => setTargetMode('manual')}
                        />
                        <span className="text-gray-700 font-medium">
                          Selezione Manuale ({modalSelectedIds.size} selezionati)
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="targetMode"
                          checked={targetMode === 'course'}
                          onChange={() => setTargetMode('course')}
                        />
                        <span className="text-gray-700 font-medium">
                          Per Corso
                        </span>
                      </label>
                    </div>

                    {/* Selezione Manuale */}
                    {targetMode === 'manual' && (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Search */}
                        <div className="p-2 bg-gray-50 border-b">
                          <input
                            type="text"
                            placeholder="Cerca studente..."
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                          />
                        </div>
                        {/* Student List */}
                        <div className="max-h-48 overflow-y-auto">
                          {students
                            .filter(s => s.email) // Solo studenti con email
                            .filter(s =>
                              studentSearch === '' ||
                              `${s.first_name} ${s.last_name}`.toLowerCase().includes(studentSearch.toLowerCase()) ||
                              s.email?.toLowerCase().includes(studentSearch.toLowerCase())
                            )
                            .map(s => (
                              <label
                                key={s.id}
                                className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                              >
                                <input
                                  type="checkbox"
                                  checked={modalSelectedIds.has(s.id!)}
                                  onChange={(e) => {
                                    const newSet = new Set(modalSelectedIds);
                                    if (e.target.checked) {
                                      newSet.add(s.id!);
                                    } else {
                                      newSet.delete(s.id!);
                                    }
                                    setModalSelectedIds(newSet);
                                  }}
                                  className="w-4 h-4 text-indigo-600"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm text-gray-800 truncate">
                                    {s.first_name} {s.last_name}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">{s.email}</div>
                                </div>
                                {s.enrolled_course && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                    {s.enrolled_course}
                                  </span>
                                )}
                              </label>
                            ))}
                        </div>
                        {/* Select All / Deselect All */}
                        <div className="p-2 bg-gray-50 border-t flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const allIds = students.filter(s => s.email).map(s => s.id!);
                              setModalSelectedIds(new Set(allIds));
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Seleziona tutti
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={() => setModalSelectedIds(new Set())}
                            className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                          >
                            Deseleziona tutti
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Selezione per Corso */}
                    {targetMode === 'course' && (
                      <div>
                        <select
                          value={selectedCourse}
                          onChange={(e) => setSelectedCourse(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                        >
                          <option value="">-- Seleziona un corso --</option>
                          {COURSES_LIST.map(course => {
                            const count = students.filter(s =>
                              s.enrolled_course === course || s.course_1 === course
                            ).length;
                            return (
                              <option key={course} value={course} disabled={count === 0}>
                                {course} ({count} studenti)
                              </option>
                            );
                          })}
                        </select>
                        {selectedCourse && (
                          <p className="mt-2 text-sm text-gray-600">
                            <i className="fas fa-users mr-1"></i>
                            {students.filter(s =>
                              (s.enrolled_course === selectedCourse || s.course_1 === selectedCourse) && s.email
                            ).length} studenti con email in questo corso
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Channel Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Canale di Invio</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setCommChannel('email')}
                        className={`p-3 rounded border text-center transition-all ${commChannel === 'email' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold ring-2 ring-blue-200 shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                      >
                        <i className="fas fa-envelope mb-2 block text-2xl"></i>
                        Email
                      </button>
                      <button
                        onClick={() => setCommChannel('push')}
                        className={`p-3 rounded border text-center transition-all ${commChannel === 'push' ? 'bg-purple-50 border-purple-500 text-purple-700 font-bold ring-2 ring-purple-200 shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                      >
                        <i className="fas fa-mobile-alt mb-2 block text-2xl"></i>
                        Push Notify
                      </button>
                      <button
                        onClick={() => setCommChannel('whatsapp')}
                        className={`p-3 rounded border text-center transition-all ${commChannel === 'whatsapp' ? 'bg-green-50 border-green-500 text-green-700 font-bold ring-2 ring-green-200 shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                      >
                        <i className="fab fa-whatsapp mb-2 block text-2xl"></i>
                        WhatsApp
                      </button>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Messaggio</label>
                    {commChannel === 'email' && (
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Oggetto dell'email..."
                        className="w-full p-2 border border-gray-300 rounded mb-3 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                      />
                    )}
                    <textarea
                      rows={5}
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder={commChannel === 'whatsapp' ? "Scrivi il messaggio WhatsApp..." : "Scrivi il contenuto..."}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none resize-none"
                    ></textarea>
                    <p className="text-xs text-gray-500 mt-2 text-right">
                      {commChannel === 'whatsapp' ? 'Nota: Verrà aperta l\'app WhatsApp Web per l\'invio.' :
                        commChannel === 'email' ? 'Verrà inviata una email HTML con il template della scuola.' :
                          'La notifica arriverà su tutti i dispositivi registrati degli studenti.'}
                    </p>
                  </div>

                  {/* Messaggio di feedback */}
                  {commMessage && (
                    <div className={`mt-4 p-3 rounded ${commMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      <i className={`fas ${commMessage.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
                      {commMessage.text}
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 flex justify-end gap-3 border-t flex-shrink-0">
                  <button
                    onClick={() => {
                      setShowCommModal(false);
                      setEmailSubject('');
                      setMessageContent('');
                      setCommMessage(null);
                      setModalSelectedIds(new Set());
                      setTargetMode('manual');
                      setSelectedCourse('');
                      setStudentSearch('');
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMessage}
                    className={`px-6 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 font-bold flex items-center gap-2 transition-colors ${sendingMessage ? 'opacity-70 cursor-wait' : ''}`}
                  >
                    {sendingMessage ? (
                      <><i className="fas fa-spinner fa-spin"></i> Connessione al server email... (può richiedere alcuni secondi)</>
                    ) : (
                      <><i className="fas fa-paper-plane"></i> Invia a {
                        targetMode === 'manual'
                          ? `${modalSelectedIds.size} studente/i`
                          : selectedCourse
                            ? `${students.filter(s => (s.enrolled_course === selectedCourse || s.course_1 === selectedCourse) && s.email).length} studente/i`
                            : '0 studenti'
                      }</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* INVITE MODAL */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
              <div className="bg-green-600 p-4 flex justify-between items-center text-white flex-shrink-0">
                <h3 className="font-bold text-lg"><i className="fas fa-envelope-open-text mr-2"></i> Invia Invito App</h3>
                <button onClick={() => setShowInviteModal(false)} className="hover:bg-green-700 p-1 rounded transition-colors">
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                {/* Messaggio di feedback */}
                {inviteMessage && (
                  <div className={`mb-4 p-3 rounded ${inviteMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <i className={`fas ${inviteMessage.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
                    {inviteMessage.text}
                  </div>
                )}

                {/* Selezione Studente */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Seleziona Studente *</label>
                  <select
                    value={inviteStudentId}
                    onChange={(e) => setInviteStudentId(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none"
                  >
                    <option value="">-- Seleziona uno studente --</option>
                    {students.filter(s => s.email).map(s => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name} - {s.email}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Vengono mostrati solo gli studenti con email registrata.
                  </p>
                </div>

                {/* Anteprima Email Visiva */}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <i className="fas fa-eye mr-2"></i>Anteprima Email
                  </label>
                  <div
                    className="p-5 border-2 border-green-200 rounded-lg bg-white shadow-inner prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: inviteEmailContent.replace('{{ .ConfirmationURL }}', '#') }}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    <i className="fas fa-info-circle mr-1"></i>
                    Il link di conferma verrà generato automaticamente da Supabase per ogni studente.
                  </p>
                </div>

                {/* Toggle Modifica Avanzata */}
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800 flex items-center gap-2 p-2 bg-gray-100 rounded">
                    <i className="fas fa-code"></i>
                    Modifica HTML avanzata
                    <span className="text-xs text-gray-400">(opzionale)</span>
                  </summary>
                  <div className="mt-2">
                    <textarea
                      value={inviteEmailContent}
                      onChange={(e) => setInviteEmailContent(e.target.value)}
                      rows={10}
                      className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none font-mono text-xs bg-gray-900 text-green-400"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      <i className="fas fa-exclamation-triangle mr-1 text-yellow-500"></i>
                      Usa <code className="bg-gray-100 px-1 rounded">{'{{ .ConfirmationURL }}'}</code> per inserire il link di conferma.
                    </p>
                  </div>
                </details>
              </div>

              <div className="bg-gray-50 p-4 flex justify-end gap-3 border-t flex-shrink-0">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSendInvite}
                  disabled={inviteLoading || !inviteStudentId}
                  className={`px-6 py-2 rounded shadow font-bold flex items-center gap-2 transition-colors ${inviteLoading || !inviteStudentId
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                  {inviteLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Invio in corso...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i> Invia Invito
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div >
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

      {/* Riepilogo errori di validazione */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="mb-4 p-4 rounded bg-red-50 border-2 border-red-300">
          <div className="flex items-center mb-2">
            <i className="fas fa-exclamation-triangle text-red-600 mr-2"></i>
            <span className="font-bold text-red-700">Campi obbligatori mancanti:</span>
          </div>
          <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
            {Object.entries(validationErrors).map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
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