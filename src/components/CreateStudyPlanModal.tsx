import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, BookOpen, Plus, Trash2, CheckCircle } from 'lucide-react';
import { StudyPlan, StudyPlanSubject, Teacher } from '../types';
import { supabase } from '../lib/supabaseClient';

interface CreateStudyPlanModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  'CANTO',
  'STRUMENTO',
  'CORSI AUDIO',
  'WEBINAR',
  'MASTERCLASS',
  'EVENTI',
];

type WizardStep = 1 | 2;

interface SubjectForm extends Omit<StudyPlanSubject, 'id' | 'study_plan_id' | 'created_at' | 'updated_at'> {
  tempId: string; // ID temporaneo per gestione UI
  teacherSelectMode?: 'list' | 'search'; // Modalità selezione docente
}

export default function CreateStudyPlanModal({ onClose, onSuccess }: CreateStudyPlanModalProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Info Base
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planCategory, setPlanCategory] = useState(CATEGORIES[0]);
  const [planSubcategory, setPlanSubcategory] = useState('');
  const [planPrice, setPlanPrice] = useState<number>(0);

  // Step 2: Materie
  const [subjects, setSubjects] = useState<SubjectForm[]>([]);

  const [errors, setErrors] = useState<string[]>([]);

  // Docenti dal database
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Fetch docenti dal database
  useEffect(() => {
    const fetchTeachers = async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, first_name, last_name')
        .eq('is_active', true)
        .order('last_name');

      if (!error && data) {
        setTeachers(data);
      }
    };

    fetchTeachers();
  }, []);

  // ========== STEP 1 FUNCTIONS ==========

  const validateStep1 = (): boolean => {
    const newErrors: string[] = [];

    if (!planName.trim()) {
      newErrors.push('Il nome del piano di studio è obbligatorio');
    }

    if (!planCategory) {
      newErrors.push('Seleziona una categoria');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // ========== STEP 2 FUNCTIONS ==========

  const addSubject = () => {
    const newSubject: SubjectForm = {
      tempId: `temp-${Date.now()}`,
      subject_name: '',
      subject_type: 'collective',
      total_hours: 20,
      teacher_name: '', // Ora opzionale
      order_index: subjects.length,
      teacherSelectMode: 'list', // Default: selezione da lista
    };
    setSubjects([...subjects, newSubject]);
  };

  const removeSubject = (tempId: string) => {
    setSubjects(subjects.filter(s => s.tempId !== tempId));
  };

  const updateSubject = (tempId: string, field: keyof SubjectForm, value: any) => {
    setSubjects(subjects.map(s =>
      s.tempId === tempId ? { ...s, [field]: value } : s
    ));
  };

  const validateStep2 = (): boolean => {
    const newErrors: string[] = [];

    if (subjects.length === 0) {
      newErrors.push('Aggiungi almeno una materia al piano di studio');
    }

    subjects.forEach((subject, idx) => {
      if (!subject.subject_name.trim()) {
        newErrors.push(`Materia ${idx + 1}: inserisci un nome`);
      }
      if (subject.total_hours <= 0) {
        newErrors.push(`Materia ${idx + 1}: le ore devono essere maggiori di 0`);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // ========== STEP 3 FUNCTIONS (Calendarizzazione) ==========

  const handleSaveWithoutCalendar = async () => {
    setIsSubmitting(true);
    setErrors([]);

    try {
      console.log('🚀 Inizio creazione piano di studio (senza calendario):', planName);

      // 1. Crea il piano di studio
      const { data: newPlan, error: planError } = await supabase
        .from('study_plans')
        .insert({
          name: planName,
          description: planDescription,
          category: planCategory,
          subcategory: planSubcategory || null,
          price: planPrice > 0 ? planPrice : null,
          is_active: true,
        })
        .select()
        .single();

      if (planError) {
        console.error('❌ Errore creazione piano:', planError);
        throw planError;
      }
      console.log('✅ Piano creato:', newPlan.id);

      // 2. Inserisci le materie
      const subjectsToInsert = subjects.map((subject, idx) => ({
        study_plan_id: newPlan.id,
        subject_name: subject.subject_name,
        subject_type: subject.subject_type,
        total_hours: subject.total_hours,
        teacher_name: subject.teacher_name || null,
        order_index: idx,
      }));

      const { data: insertedSubjects, error: subjectsError } = await supabase
        .from('study_plan_subjects')
        .insert(subjectsToInsert)
        .select();

      if (subjectsError) {
        console.error('❌ Errore inserimento materie:', subjectsError);
        throw subjectsError;
      }
      console.log(`✅ Materie inserite: ${insertedSubjects.length}`);

      // Successo!
      alert(`✅ Piano di studio "${planName}" creato con successo!\n\n📚 Materie: ${insertedSubjects.length}\n\n💡 Potrai generare il calendario in seguito dalla modifica del piano.`);

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('❌ ERRORE COMPLETO:', error);
      const errorMessage = error.message || 'Errore durante la creazione del piano di studio';
      setErrors([errorMessage]);
      alert(`❌ Errore durante la creazione del piano:\n\n${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========== NAVIGATION ==========

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
      setErrors([]);
    } else if (currentStep === 2 && validateStep2()) {
      // Salva direttamente il piano senza calendario
      handleSaveWithoutCalendar();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
      setErrors([]);
    }
  };

  // ========== RENDER ==========

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Crea Piano di Studio</h2>
              <p className="text-sm text-gray-500 mt-1">
                Step {currentStep} di 2
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 flex gap-2">
            {[1, 2].map(step => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full ${
                  step <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Errori di validazione</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* STEP 1: Info Base */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <BookOpen className="w-5 h-5" />
                <h3 className="text-lg font-medium">Informazioni di Base</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Piano di Studio *
                </label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="es. Basso Avanzato, Pianoforte Base, ecc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={planCategory}
                  onChange={(e) => setPlanCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sottocategoria (opzionale)
                </label>
                <input
                  type="text"
                  value={planSubcategory}
                  onChange={(e) => setPlanSubcategory(e.target.value)}
                  placeholder="es. Livello Avanzato, Biennio, ecc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo del Corso (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={planPrice}
                  onChange={(e) => setPlanPrice(parseFloat(e.target.value) || 0)}
                  placeholder="es. 1500.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrizione (opzionale)
                </label>
                <textarea
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  rows={4}
                  placeholder="Descrizione del piano di studio..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Gestione Materie */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <BookOpen className="w-5 h-5" />
                  <h3 className="text-lg font-medium">Gestione Materie</h3>
                </div>
                <button
                  type="button"
                  onClick={addSubject}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi Materia
                </button>
              </div>

              {subjects.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Nessuna materia aggiunta</p>
                  <button
                    type="button"
                    onClick={addSubject}
                    className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Aggiungi la prima materia
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {subjects.map((subject, idx) => (
                    <div key={subject.tempId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-gray-900">Materia {idx + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeSubject(subject.tempId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome Materia
                          </label>
                          <input
                            type="text"
                            value={subject.subject_name}
                            onChange={(e) => updateSubject(subject.tempId, 'subject_name', e.target.value)}
                            placeholder="es. Teoria Musicale, Strumento..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo
                          </label>
                          <select
                            value={subject.subject_type}
                            onChange={(e) => updateSubject(subject.tempId, 'subject_type', e.target.value as 'individual' | 'collective')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="collective">Collettivo</option>
                            <option value="individual">Individuale</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ore Totali
                          </label>
                          <input
                            type="number"
                            value={subject.total_hours}
                            onChange={(e) => updateSubject(subject.tempId, 'total_hours', parseInt(e.target.value) || 0)}
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Docente {teachers.length === 0 && <span className="text-xs text-gray-500">(caricamento...)</span>}
                          </label>

                          {/* Tab per scegliere modalità selezione */}
                          <div className="flex gap-2 mb-2">
                            <button
                              type="button"
                              onClick={() => {
                                const currentMode = (subject as any).teacherSelectMode || 'list';
                                updateSubject(subject.tempId, 'teacherSelectMode' as any, currentMode === 'list' ? 'list' : 'list');
                              }}
                              className={`px-3 py-1 text-xs rounded ${
                                ((subject as any).teacherSelectMode || 'list') === 'list'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              📋 Seleziona da lista
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                updateSubject(subject.tempId, 'teacherSelectMode' as any, 'search');
                              }}
                              className={`px-3 py-1 text-xs rounded ${
                                (subject as any).teacherSelectMode === 'search'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              🔍 Cerca per nome
                            </button>
                          </div>

                          {/* Modalità 1: Seleziona da lista */}
                          {((subject as any).teacherSelectMode || 'list') === 'list' ? (
                            <select
                              value={subject.teacher_name || ''}
                              onChange={(e) => updateSubject(subject.tempId, 'teacher_name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 max-h-48"
                            >
                              <option value="">-- Seleziona un docente --</option>
                              {teachers.map(teacher => (
                                <option
                                  key={teacher.id}
                                  value={`${teacher.first_name} ${teacher.last_name}`}
                                >
                                  {teacher.last_name} {teacher.first_name}
                                  {teacher.subjects_taught && ` • ${teacher.subjects_taught.split(',')[0].trim()}`}
                                </option>
                              ))}
                            </select>
                          ) : (
                            /* Modalità 2: Cerca per nome */
                            <div>
                              <input
                                type="text"
                                value={subject.teacher_name || ''}
                                onChange={(e) => updateSubject(subject.tempId, 'teacher_name', e.target.value)}
                                placeholder="Digita nome o cognome del docente..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                              />
                              {/* Suggerimenti in tempo reale */}
                              {subject.teacher_name && (
                                <div className="mt-1 max-h-32 overflow-y-auto border border-gray-200 rounded-md bg-white shadow-sm">
                                  {teachers
                                    .filter(t =>
                                      `${t.first_name} ${t.last_name}`.toLowerCase().includes((subject.teacher_name || '').toLowerCase())
                                    )
                                    .slice(0, 5)
                                    .map(teacher => (
                                      <button
                                        key={teacher.id}
                                        type="button"
                                        onClick={() => updateSubject(subject.tempId, 'teacher_name', `${teacher.first_name} ${teacher.last_name}`)}
                                        className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm"
                                      >
                                        <span className="font-medium">{teacher.last_name} {teacher.first_name}</span>
                                        {teacher.subjects_taught && (
                                          <span className="text-gray-500 text-xs ml-2">
                                            • {teacher.subjects_taught.split(',')[0].trim()}
                                          </span>
                                        )}
                                      </button>
                                    ))}
                                </div>
                              )}
                            </div>
                          )}

                          <p className="text-xs text-gray-500 mt-1">
                            {teachers.length} docenti disponibili
                            {(subject as any).teacherSelectMode === 'search' && ' • Inizia a digitare per filtrare'}
                          </p>
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>

                  {/* Pulsante Aggiungi in Basso */}
                  <button
                    type="button"
                    onClick={addSubject}
                    className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Aggiungi Altra Materia</span>
                  </button>
                </>
              )}

              {/* Summary */}
              {subjects.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Riepilogo</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Totale Materie:</span>
                      <span className="ml-2 font-medium">{subjects.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Ore Totali:</span>
                      <span className="ml-2 font-medium">
                        {subjects.reduce((sum, s) => sum + s.total_hours, 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Individuali/Collettive:</span>
                      <span className="ml-2 font-medium">
                        {subjects.filter(s => s.subject_type === 'individual').length} / {subjects.filter(s => s.subject_type === 'collective').length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Indietro
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creazione...
              </>
            ) : currentStep === 2 ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Crea Piano di Studio
              </>
            ) : (
              <>
                Avanti
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
