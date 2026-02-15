import React, { useState, useEffect } from 'react';
import { Teacher } from '../types';
import { supabase } from '../lib/supabaseClient';
import { Search, UserPlus, Upload, Mail, Phone, BookOpen, DollarSign } from 'lucide-react';

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
    if (!selectedTeacher) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-blue-600 text-white p-6 rounded-t-lg">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">
                  {selectedTeacher.first_name} {selectedTeacher.last_name}
                </h2>
                {selectedTeacher.subjects_taught && (
                  <p className="text-blue-100 text-sm mt-1">
                    {selectedTeacher.subjects_taught.split(',').slice(0, 3).join(' • ')}
                    {selectedTeacher.subjects_taught.split(',').length > 3 && '...'}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedTeacher(null)}
                className="text-white hover:text-gray-200"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Contatti */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <i className="fas fa-address-book text-blue-600"></i>
                Contatti
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedTeacher.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${selectedTeacher.email}`} className="hover:text-blue-600">
                      {selectedTeacher.email}
                    </a>
                  </div>
                )}
                {selectedTeacher.mobile_phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${selectedTeacher.mobile_phone}`} className="hover:text-blue-600">
                      {selectedTeacher.mobile_phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Anagrafica */}
            {(selectedTeacher.fiscal_code || selectedTeacher.date_of_birth || selectedTeacher.birth_place) && (
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <i className="fas fa-id-card text-blue-600"></i>
                  Anagrafica
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {selectedTeacher.fiscal_code && (
                    <div>
                      <span className="text-gray-500">Codice Fiscale:</span>
                      <div className="font-medium">{selectedTeacher.fiscal_code}</div>
                    </div>
                  )}
                  {selectedTeacher.date_of_birth && (
                    <div>
                      <span className="text-gray-500">Data di Nascita:</span>
                      <div className="font-medium">
                        {new Date(selectedTeacher.date_of_birth).toLocaleDateString('it-IT')}
                      </div>
                    </div>
                  )}
                  {selectedTeacher.birth_place && (
                    <div>
                      <span className="text-gray-500">Luogo di Nascita:</span>
                      <div className="font-medium">
                        {selectedTeacher.birth_place} ({selectedTeacher.birth_province})
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Residenza */}
            {selectedTeacher.address && (
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <i className="fas fa-home text-blue-600"></i>
                  Residenza
                </h3>
                <div className="text-sm text-gray-600">
                  {selectedTeacher.address}<br />
                  {selectedTeacher.zip_code} {selectedTeacher.city} ({selectedTeacher.province})
                </div>
              </div>
            )}

            {/* Dati Lavorativi */}
            {(selectedTeacher.hourly_rate || selectedTeacher.iban || selectedTeacher.billing_mode) && (
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Dati Lavorativi
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {selectedTeacher.hourly_rate && (
                    <div>
                      <span className="text-gray-500">Tariffa Oraria:</span>
                      <div className="font-medium">€ {selectedTeacher.hourly_rate.toFixed(2)}/ora</div>
                    </div>
                  )}
                  {selectedTeacher.billing_mode && (
                    <div>
                      <span className="text-gray-500">Fatturazione:</span>
                      <div className="font-medium">{selectedTeacher.billing_mode}</div>
                    </div>
                  )}
                  {selectedTeacher.vat_number && (
                    <div>
                      <span className="text-gray-500">P. IVA:</span>
                      <div className="font-medium">{selectedTeacher.vat_number}</div>
                    </div>
                  )}
                  {selectedTeacher.iban && (
                    <div className="col-span-2">
                      <span className="text-gray-500">IBAN:</span>
                      <div className="font-medium font-mono text-xs">{selectedTeacher.iban}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Materie Insegnate */}
            {selectedTeacher.subjects_taught && (
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Materie Insegnate
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTeacher.subjects_taught.split(',').map((subject, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                    >
                      {subject.trim()}
                    </span>
                  ))}
                </div>
              </div>
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
