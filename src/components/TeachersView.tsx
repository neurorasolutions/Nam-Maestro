import React, { useState, useEffect } from 'react';
import { Teacher } from '../types';
import { supabase } from '../lib/supabaseClient';
import { Search, UserPlus, Upload, Mail, Phone, BookOpen, DollarSign, Edit2, Save, X as XIcon } from 'lucide-react';

const TeachersView: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    // Filtra docenti in base al termine di ricerca
    if (searchTerm.trim() === '') {
      setFilteredTeachers(teachers);
    } else {
      const search = searchTerm.toLowerCase();
      const filtered = teachers.filter(t =>
        t.first_name?.toLowerCase().includes(search) ||
        t.last_name?.toLowerCase().includes(search) ||
        t.email?.toLowerCase().includes(search) ||
        t.subjects_taught?.toLowerCase().includes(search)
      );
      setFilteredTeachers(filtered);
    }
  }, [searchTerm, teachers]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('is_active', true)
        .order('last_name', { ascending: true });

      if (error) throw error;
      setTeachers(data || []);
      setFilteredTeachers(data || []);
    } catch (error: any) {
      console.error('Errore caricamento docenti:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportCSV = async (file: File) => {
    setLoading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

      const teachersToImport: Partial<Teacher>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Parse CSV con gestione virgolette
        const values: string[] = [];
        let currentValue = '';
        let insideQuotes = false;

        for (let char of line) {
          if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim());

        const teacher: Partial<Teacher> = {
          first_name: values[0] || '',
          last_name: values[1] || '',
          email: values[2] || null,
          gender: values[3] === 'male' ? 'Maschio' : values[3] === 'female' ? 'Femmina' : null,
          date_of_birth: values[4] && values[4] !== '0000-00-00' ? values[4] : null,
          birth_place: values[5] || null,
          birth_province: values[6] || null,
          zip_code: values[7] || null,
          city: values[8] || null,
          province: values[9] || null,
          address: values[10] || null,
          country: values[11] || 'IT',
          mobile_phone: values[12] || null,
          phone: values[13] || null,
          fiscal_code: values[14] || null,
          iban: values[15] || null,
          vat_number: values[16] || null,
          passport_number: values[17] || null,
          hourly_rate: values[18] ? parseFloat(values[18].replace(',', '.')) : null,
          subjects_taught: values[19] || null,
          billing_mode: values[20] || null,
          is_active: true,
        };

        if (teacher.first_name && teacher.last_name) {
          teachersToImport.push(teacher);
        }
      }

      // Inserisci in batch
      const { error } = await supabase
        .from('teachers')
        .insert(teachersToImport);

      if (error) throw error;

      alert(`✅ Importati ${teachersToImport.length} docenti con successo!`);
      setShowImportModal(false);
      fetchTeachers();
    } catch (error: any) {
      console.error('Errore importazione:', error);
      alert('❌ Errore durante l\'importazione: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const ImportModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Importa Docenti da CSV</h3>
        <p className="text-sm text-gray-600 mb-4">
          Seleziona il file CSV con i dati dei docenti. Il file deve avere la stessa struttura di Docenti.csv.
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImportCSV(file);
          }}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => setShowImportModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );

  const TeacherDetailModal = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTeacher, setEditedTeacher] = useState<Teacher | null>(null);
    const [saving, setSaving] = useState(false);

    if (!selectedTeacher) return null;

    const teacherToShow = isEditing && editedTeacher ? editedTeacher : selectedTeacher;

    const handleEdit = () => {
      setEditedTeacher({ ...selectedTeacher });
      setIsEditing(true);
    };

    const handleCancel = () => {
      setEditedTeacher(null);
      setIsEditing(false);
    };

    const handleSave = async () => {
      if (!editedTeacher) return;

      setSaving(true);
      try {
        const { error } = await supabase
          .from('teachers')
          .update(editedTeacher)
          .eq('id', editedTeacher.id);

        if (error) throw error;

        alert('✅ Docente aggiornato con successo!');
        setSelectedTeacher(editedTeacher);
        setIsEditing(false);
        fetchTeachers(); // Refresh lista
      } catch (error: any) {
        console.error('Errore salvataggio:', error);
        alert('❌ Errore durante il salvataggio: ' + error.message);
      } finally {
        setSaving(false);
      }
    };

    const handleChange = (field: keyof Teacher, value: any) => {
      if (!editedTeacher) return;
      setEditedTeacher({ ...editedTeacher, [field]: value });
    };

    const handleClickOutside = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        setSelectedTeacher(null);
        setIsEditing(false);
      }
    };

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleClickOutside}
      >
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="sticky top-0 bg-blue-600 text-white p-6 rounded-t-lg">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={teacherToShow.first_name}
                        onChange={(e) => handleChange('first_name', e.target.value)}
                        className="flex-1 px-3 py-2 text-gray-900 rounded"
                        placeholder="Nome"
                      />
                      <input
                        type="text"
                        value={teacherToShow.last_name}
                        onChange={(e) => handleChange('last_name', e.target.value)}
                        className="flex-1 px-3 py-2 text-gray-900 rounded"
                        placeholder="Cognome"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold">
                      {teacherToShow.first_name} {teacherToShow.last_name}
                    </h2>
                    {teacherToShow.subjects_taught && (
                      <p className="text-blue-100 text-sm mt-1">
                        {teacherToShow.subjects_taught.split(',').slice(0, 3).join(' • ')}
                        {teacherToShow.subjects_taught.split(',').length > 3 && '...'}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedTeacher(null);
                  setIsEditing(false);
                }}
                className="text-white hover:text-gray-200 ml-4"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Contatti */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Contatti
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={teacherToShow.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  ) : (
                    <a href={`mailto:${teacherToShow.email}`} className="text-blue-600 hover:underline">
                      {teacherToShow.email || '-'}
                    </a>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Cellulare</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={teacherToShow.mobile_phone || ''}
                      onChange={(e) => handleChange('mobile_phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  ) : (
                    <a href={`tel:${teacherToShow.mobile_phone}`} className="text-blue-600 hover:underline">
                      {teacherToShow.mobile_phone || '-'}
                    </a>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Telefono</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={teacherToShow.phone || ''}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  ) : (
                    <div>{teacherToShow.phone || '-'}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Anagrafica */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <i className="fas fa-id-card text-blue-600"></i>
                Anagrafica
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Codice Fiscale</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={teacherToShow.fiscal_code || ''}
                      onChange={(e) => handleChange('fiscal_code', e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  ) : (
                    <div>{teacherToShow.fiscal_code || '-'}</div>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Data di Nascita</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={teacherToShow.date_of_birth || ''}
                      onChange={(e) => handleChange('date_of_birth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  ) : (
                    <div>
                      {teacherToShow.date_of_birth
                        ? new Date(teacherToShow.date_of_birth).toLocaleDateString('it-IT')
                        : '-'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Luogo di Nascita</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={teacherToShow.birth_place || ''}
                      onChange={(e) => handleChange('birth_place', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  ) : (
                    <div>{teacherToShow.birth_place || '-'}</div>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Provincia di Nascita</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={teacherToShow.birth_province || ''}
                      onChange={(e) => handleChange('birth_province', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  ) : (
                    <div>{teacherToShow.birth_province || '-'}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Residenza */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <i className="fas fa-home text-blue-600"></i>
                Residenza
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Indirizzo</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={teacherToShow.address || ''}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  ) : (
                    <div>{teacherToShow.address || '-'}</div>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">CAP</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={teacherToShow.zip_code || ''}
                      onChange={(e) => handleChange('zip_code', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  ) : (
                    <div>{teacherToShow.zip_code || '-'}</div>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Città</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={teacherToShow.city || ''}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  ) : (
                    <div>{teacherToShow.city || '-'}</div>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Provincia</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={teacherToShow.province || ''}
                      onChange={(e) => handleChange('province', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  ) : (
                    <div>{teacherToShow.province || '-'}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Dati Lavorativi */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Dati Lavorativi
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tariffa Oraria (€)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={teacherToShow.hourly_rate || ''}
                      onChange={(e) => handleChange('hourly_rate', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  ) : (
                    <div>
                      {teacherToShow.hourly_rate ? `€ ${teacherToShow.hourly_rate.toFixed(2)}/ora` : '-'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">P. IVA</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={teacherToShow.vat_number || ''}
                      onChange={(e) => handleChange('vat_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  ) : (
                    <div>{teacherToShow.vat_number || '-'}</div>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">IBAN</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={teacherToShow.iban || ''}
                      onChange={(e) => handleChange('iban', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded font-mono"
                    />
                  ) : (
                    <div className="font-mono text-sm">{teacherToShow.iban || '-'}</div>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Modalità Fatturazione</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={teacherToShow.billing_mode || ''}
                      onChange={(e) => handleChange('billing_mode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  ) : (
                    <div>{teacherToShow.billing_mode || '-'}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Materie Insegnate */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Materie Insegnate
              </h3>
              {isEditing ? (
                <textarea
                  value={teacherToShow.subjects_taught || ''}
                  onChange={(e) => handleChange('subjects_taught', e.target.value)}
                  rows={3}
                  placeholder="Materie separate da virgola (es. CHITARRA, BASSO, TEORIA MUSICALE)"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {teacherToShow.subjects_taught ? (
                    teacherToShow.subjects_taught.split(',').map((subject, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                      >
                        {subject.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer con pulsanti */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salva Modifiche
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Edit2 className="w-4 h-4" />
                Modifica
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Docenti</h2>
          <p className="text-gray-500 text-sm mt-1">
            {teachers.length} docenti attivi • {filteredTeachers.length} visualizzati
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Upload className="w-4 h-4" />
            Importa CSV
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per nome, email o materia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Teachers Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-2">Caricamento...</p>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <i className="fas fa-user-slash text-4xl text-gray-400 mb-3"></i>
          <p className="text-gray-500">
            {searchTerm ? 'Nessun docente trovato con questi criteri' : 'Nessun docente nel database'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowImportModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Importa docenti da CSV
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTeachers.map((teacher) => (
            <div
              key={teacher.id}
              onClick={() => setSelectedTeacher(teacher)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* Avatar & Name */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {teacher.first_name?.[0]}{teacher.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {teacher.first_name} {teacher.last_name}
                  </h3>
                  {teacher.email && (
                    <p className="text-xs text-gray-500 truncate">{teacher.email}</p>
                  )}
                </div>
              </div>

              {/* Subjects */}
              {teacher.subjects_taught && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {teacher.subjects_taught.split(',').slice(0, 2).map((subject, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {subject.trim()}
                      </span>
                    ))}
                    {teacher.subjects_taught.split(',').length > 2 && (
                      <span className="px-2 py-0.5 text-gray-500 text-xs">
                        +{teacher.subjects_taught.split(',').length - 2}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Info Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                {teacher.mobile_phone ? (
                  <span className="text-gray-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {teacher.mobile_phone.replace('+39', '')}
                  </span>
                ) : (
                  <span></span>
                )}
                {teacher.hourly_rate && (
                  <span className="font-medium text-blue-600">
                    € {teacher.hourly_rate.toFixed(0)}/h
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showImportModal && <ImportModal />}
      {selectedTeacher && <TeacherDetailModal />}
    </div>
  );
};

export default TeachersView;
