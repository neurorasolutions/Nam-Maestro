import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, AlertCircle, Calculator } from 'lucide-react';
import { StudyPlanSubject } from '../types';
import { calculateEndDate, getHolidaysInRange } from '../utils/holidays';

interface SubjectSchedule {
  subjectId: string;
  subjectName: string;
  startDate: string; // Data inizio per questa materia
  endDate: string; // Data fine per questa materia (calcolata automaticamente)
  hoursPerLesson: number; // Ore per lezione per questa materia
  daysOfWeek: number[]; // 0=Domenica, 1=Lunedì, ..., 6=Sabato
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  room: string;
}

interface CalendarWizardProps {
  subjects: StudyPlanSubject[];
  onComplete: (schedules: SubjectSchedule[]) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domenica' },
  { value: 1, label: 'Lunedì' },
  { value: 2, label: 'Martedì' },
  { value: 3, label: 'Mercoledì' },
  { value: 4, label: 'Giovedì' },
  { value: 5, label: 'Venerdì' },
  { value: 6, label: 'Sabato' },
];

const ROOMS = [
  'Auditorium',
  'Aula Canto',
  'Aula Canto e strumento 1° Piano',
  'Aula Digital',
  'Aula Online',
  'Aula Strumento Piano Terra',
  'Aula Teoria 1',
  'Aula Teoria 2',
  'Aula X',
  'Studio A',
  'Studio B',
];

export default function CalendarWizard({ subjects, onComplete, onCancel, isSubmitting = false }: CalendarWizardProps) {
  const [schedules, setSchedules] = useState<SubjectSchedule[]>(
    subjects.map(subject => ({
      subjectId: subject.id || '',
      subjectName: subject.subject_name,
      startDate: '',
      endDate: '',
      hoursPerLesson: 2, // Default 2 ore per lezione
      daysOfWeek: [],
      startTime: '09:00',
      endTime: '11:00',
      room: ROOMS[0],
    }))
  );
  const [errors, setErrors] = useState<string[]>([]);

  // Calcola automaticamente data fine per ogni materia quando cambiano i parametri
  useEffect(() => {
    const newSchedules = schedules.map((schedule, idx) => {
      const subject = subjects[idx];

      // Se manca la data di inizio o i giorni, non calcolare
      if (!schedule.startDate || schedule.daysOfWeek.length === 0) {
        return schedule;
      }

      // Calcola il numero di lezioni necessarie
      const totalLessons = Math.ceil(subject.total_hours / schedule.hoursPerLesson);

      // Calcola la data fine
      const calculatedEndDate = calculateEndDate(
        schedule.startDate,
        totalLessons,
        schedule.daysOfWeek
      );

      // Aggiorna solo se è cambiata o se era vuota
      if (schedule.endDate !== calculatedEndDate) {
        return { ...schedule, endDate: calculatedEndDate };
      }

      return schedule;
    });

    // Aggiorna solo se ci sono cambiamenti
    if (JSON.stringify(newSchedules) !== JSON.stringify(schedules)) {
      setSchedules(newSchedules);
    }
  }, [schedules.map(s => `${s.startDate}-${s.hoursPerLesson}-${s.daysOfWeek.join(',')}`).join('|')]);

  const handleDayToggle = (subjectIndex: number, dayValue: number) => {
    const newSchedules = [...schedules];
    const currentDays = newSchedules[subjectIndex].daysOfWeek;

    if (currentDays.includes(dayValue)) {
      newSchedules[subjectIndex].daysOfWeek = currentDays.filter(d => d !== dayValue);
    } else {
      newSchedules[subjectIndex].daysOfWeek = [...currentDays, dayValue].sort();
    }

    setSchedules(newSchedules);
  };

  const handleScheduleChange = (subjectIndex: number, field: keyof SubjectSchedule, value: any) => {
    const newSchedules = [...schedules];
    (newSchedules[subjectIndex] as any)[field] = value;
    setSchedules(newSchedules);
  };

  const validateSchedules = (): boolean => {
    const newErrors: string[] = [];

    // Validazione schedules
    schedules.forEach((schedule, idx) => {
      // Validazione date per ogni materia
      if (!schedule.startDate) {
        newErrors.push(`${schedule.subjectName}: seleziona la data di inizio`);
      }
      if (!schedule.endDate) {
        newErrors.push(`${schedule.subjectName}: la data di fine non è stata calcolata`);
      }
      if (schedule.startDate && schedule.endDate && new Date(schedule.startDate) >= new Date(schedule.endDate)) {
        newErrors.push(`${schedule.subjectName}: la data di fine deve essere successiva alla data di inizio`);
      }

      // Validazione giorni e orari
      if (schedule.daysOfWeek.length === 0) {
        newErrors.push(`${schedule.subjectName}: seleziona almeno un giorno della settimana`);
      }
      if (!schedule.startTime || !schedule.endTime) {
        newErrors.push(`${schedule.subjectName}: inserisci orario di inizio e fine`);
      }
      if (schedule.startTime >= schedule.endTime) {
        newErrors.push(`${schedule.subjectName}: l'orario di fine deve essere successivo all'orario di inizio`);
      }
      if (!schedule.room) {
        newErrors.push(`${schedule.subjectName}: seleziona un'aula`);
      }
      if (schedule.hoursPerLesson <= 0) {
        newErrors.push(`${schedule.subjectName}: le ore per lezione devono essere maggiori di 0`);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = () => {
    if (validateSchedules()) {
      onComplete(schedules);
    }
  };

  const calculateEstimatedLessons = (schedule: SubjectSchedule, subject: StudyPlanSubject): number => {
    if (!schedule.startDate || !schedule.endDate || schedule.daysOfWeek.length === 0 || schedule.hoursPerLesson <= 0) return 0;

    const totalLessonsNeeded = Math.ceil(subject.total_hours / schedule.hoursPerLesson);

    return totalLessonsNeeded;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg font-medium text-gray-900">Generazione lezioni in corso...</p>
            <p className="text-sm text-gray-500">Attendere, potrebbero essere necessari alcuni secondi</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Calendarizzazione Automatica</h2>
            <p className="text-sm text-gray-500 mt-1">
              Configura orari e giorni per generare automaticamente le lezioni
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-900 mb-1">Errori di validazione</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {errors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Subject Schedules */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Configurazione Materie</h3>

            {schedules.map((schedule, idx) => {
              const subject = subjects[idx];
              const estimatedLessons = calculateEstimatedLessons(schedule, subject);

              return (
                <div key={idx} className="border-2 border-gray-200 rounded-lg p-4 space-y-4">
                  {/* Subject Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">{schedule.subjectName}</h4>
                      <p className="text-sm text-gray-500">
                        {subject.total_hours} ore totali • {subject.subject_type === 'collective' ? 'Collettivo' : 'Individuale'}
                        {subject.teacher_name && ` • ${subject.teacher_name}`}
                      </p>
                    </div>
                    {estimatedLessons > 0 && (
                      <div className="text-right">
                        <div className="text-sm font-medium text-blue-600">
                          ~{estimatedLessons} lezioni
                        </div>
                        <div className="text-xs text-gray-500">
                          ({schedule.hoursPerLesson} ore/lezione)
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Date and Hours - Nuova sezione */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Date e Durata
                    </h5>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Data Inizio *
                        </label>
                        <input
                          type="date"
                          value={schedule.startDate}
                          onChange={(e) => handleScheduleChange(idx, 'startDate', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Ore per Lezione
                        </label>
                        <input
                          type="number"
                          min="0.5"
                          max="8"
                          step="0.5"
                          value={schedule.hoursPerLesson}
                          onChange={(e) => handleScheduleChange(idx, 'hoursPerLesson', parseFloat(e.target.value))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                          Data Fine *
                          {schedule.endDate && (
                            <Calculator className="w-3 h-3 text-green-600" title="Calcolata automaticamente" />
                          )}
                        </label>
                        <input
                          type="date"
                          value={schedule.endDate}
                          onChange={(e) => handleScheduleChange(idx, 'endDate', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-green-50"
                          title="Data calcolata automaticamente in base a ore totali, giorni settimana e festività"
                        />
                      </div>
                    </div>
                    {schedule.endDate && (
                      <div className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2">
                        💡 Data fine calcolata automaticamente: {new Date(schedule.endDate).toLocaleDateString('it-IT')} (considerando festività)
                      </div>
                    )}
                  </div>

                  {/* Days of Week */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giorni della settimana
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map(day => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => handleDayToggle(idx, day.value)}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            schedule.daysOfWeek.includes(day.value)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time and Room */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Ora Inizio
                      </label>
                      <input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) => handleScheduleChange(idx, 'startTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Ora Fine
                      </label>
                      <input
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) => handleScheduleChange(idx, 'endTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Aula
                      </label>
                      <select
                        value={schedule.room}
                        onChange={(e) => handleScheduleChange(idx, 'room', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        {ROOMS.map(room => (
                          <option key={room} value={room}>{room}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Generazione in corso...' : 'Genera Lezioni'}
          </button>
        </div>
      </div>
    </div>
  );
}
