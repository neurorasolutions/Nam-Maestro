// Festività Italiane 2024-2027
// Include festività nazionali + comuni (chiusure accademia)

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  type: 'national' | 'local';
}

// Festività Fisse (ogni anno)
const FIXED_HOLIDAYS = [
  { month: 1, day: 1, name: 'Capodanno' },
  { month: 1, day: 6, name: 'Epifania' },
  { month: 4, day: 25, name: 'Festa della Liberazione' },
  { month: 5, day: 1, name: 'Festa dei Lavoratori' },
  { month: 6, day: 2, name: 'Festa della Repubblica' },
  { month: 8, day: 15, name: 'Ferragosto' },
  { month: 11, day: 1, name: 'Ognissanti' },
  { month: 12, day: 8, name: 'Immacolata Concezione' },
  { month: 12, day: 25, name: 'Natale' },
  { month: 12, day: 26, name: 'Santo Stefano' },
];

// Festività Mobili (Pasqua e relative)
// Fonte: Algoritmo di Meeus/Jones/Butcher per calcolo Pasqua
function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Genera festività mobili per un anno
function getMobileHolidays(year: number): Holiday[] {
  const easter = calculateEaster(year);

  return [
    {
      date: formatDate(addDays(easter, -2)), // Venerdì Santo
      name: 'Venerdì Santo',
      type: 'local',
    },
    {
      date: formatDate(easter),
      name: 'Pasqua',
      type: 'national',
    },
    {
      date: formatDate(addDays(easter, 1)),
      name: 'Lunedì dell\'Angelo (Pasquetta)',
      type: 'national',
    },
  ];
}

// Chiusure Estive (tipiche accademie musicali)
// Ultima settimana di luglio + prime 3 settimane di agosto
function getSummerBreak(year: number): Holiday[] {
  const holidays: Holiday[] = [];

  // Ultima settimana luglio (24-31)
  for (let day = 24; day <= 31; day++) {
    holidays.push({
      date: `${year}-07-${String(day).padStart(2, '0')}`,
      name: 'Chiusura Estiva',
      type: 'local',
    });
  }

  // Prime 3 settimane agosto (1-21, escludendo il 15 già in festività nazionali)
  for (let day = 1; day <= 21; day++) {
    if (day !== 15) { // 15 agosto già in FIXED_HOLIDAYS
      holidays.push({
        date: `${year}-08-${String(day).padStart(2, '0')}`,
        name: 'Chiusura Estiva',
        type: 'local',
      });
    }
  }

  return holidays;
}

// Chiusure Natalizie (24 dic - 6 gen)
function getChristmasBreak(year: number): Holiday[] {
  const holidays: Holiday[] = [];

  // 24, 27-31 dicembre (25-26 già in FIXED_HOLIDAYS)
  const decDays = [24, 27, 28, 29, 30, 31];
  decDays.forEach(day => {
    holidays.push({
      date: `${year}-12-${String(day).padStart(2, '0')}`,
      name: 'Chiusura Natalizia',
      type: 'local',
    });
  });

  // 2-5 gennaio anno successivo (1 e 6 già in FIXED_HOLIDAYS)
  const janDays = [2, 3, 4, 5];
  janDays.forEach(day => {
    holidays.push({
      date: `${year + 1}-01-${String(day).padStart(2, '0')}`,
      name: 'Chiusura Natalizia',
      type: 'local',
    });
  });

  return holidays;
}

// Genera tutte le festività per un anno
function getHolidaysForYear(year: number): Holiday[] {
  const holidays: Holiday[] = [];

  // Festività fisse
  FIXED_HOLIDAYS.forEach(({ month, day, name }) => {
    holidays.push({
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      name,
      type: 'national',
    });
  });

  // Festività mobili (Pasqua)
  holidays.push(...getMobileHolidays(year));

  // Chiusure estive
  holidays.push(...getSummerBreak(year));

  // Chiusure natalizie
  holidays.push(...getChristmasBreak(year));

  return holidays;
}

// Cache festività 2024-2027
const HOLIDAYS_CACHE: Map<number, Holiday[]> = new Map();

// Inizializza cache
[2024, 2025, 2026, 2027].forEach(year => {
  HOLIDAYS_CACHE.set(year, getHolidaysForYear(year));
});

/**
 * Verifica se una data è festiva
 * @param dateStr Data in formato YYYY-MM-DD
 * @returns true se è festività, false altrimenti
 */
export function isHoliday(dateStr: string): boolean {
  const year = parseInt(dateStr.substring(0, 4));
  const holidays = HOLIDAYS_CACHE.get(year) || getHolidaysForYear(year);

  return holidays.some(h => h.date === dateStr);
}

/**
 * Ottiene il nome della festività (se presente)
 * @param dateStr Data in formato YYYY-MM-DD
 * @returns Nome festività o null
 */
export function getHolidayName(dateStr: string): string | null {
  const year = parseInt(dateStr.substring(0, 4));
  const holidays = HOLIDAYS_CACHE.get(year) || getHolidaysForYear(year);

  const holiday = holidays.find(h => h.date === dateStr);
  return holiday ? holiday.name : null;
}

/**
 * Ottiene tutte le festività per un range di date
 * @param startDate Data inizio (YYYY-MM-DD)
 * @param endDate Data fine (YYYY-MM-DD)
 * @returns Array di festività nel range
 */
export function getHolidaysInRange(startDate: string, endDate: string): Holiday[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  const allHolidays: Holiday[] = [];

  for (let year = startYear; year <= endYear; year++) {
    const yearHolidays = HOLIDAYS_CACHE.get(year) || getHolidaysForYear(year);
    allHolidays.push(...yearHolidays);
  }

  return allHolidays.filter(h => h.date >= startDate && h.date <= endDate);
}

/**
 * Calcola il prossimo giorno lavorativo (non festivo, non weekend)
 * @param dateStr Data di partenza (YYYY-MM-DD)
 * @returns Prossimo giorno lavorativo (YYYY-MM-DD)
 */
export function getNextWorkingDay(dateStr: string): string {
  let currentDate = new Date(dateStr);

  // Massimo 30 tentativi per evitare loop infiniti
  for (let i = 0; i < 30; i++) {
    currentDate.setDate(currentDate.getDate() + 1);
    const formatted = formatDate(currentDate);
    const dayOfWeek = currentDate.getDay();

    // Skip weekend (0 = domenica, 6 = sabato)
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // Skip festività
    if (isHoliday(formatted)) continue;

    // Giorno lavorativo trovato
    return formatted;
  }

  // Fallback (non dovrebbe mai succedere)
  return dateStr;
}

/**
 * Calcola data fine corso considerando festività
 * @param startDate Data inizio (YYYY-MM-DD)
 * @param totalLessons Numero totale lezioni
 * @param daysOfWeek Giorni settimana (0=dom, 1=lun, 2=mar, ..., 6=sab)
 * @returns Data fine stimata (YYYY-MM-DD)
 */
export function calculateEndDate(
  startDate: string,
  totalLessons: number,
  daysOfWeek: number[]
): string {
  const startDayOfWeek = new Date(startDate).getDay();
  let currentDate = new Date(startDate);
  let lessonsScheduled = 0;
  let iterations = 0;
  const maxIterations = 1000; // Safety limit

  while (lessonsScheduled < totalLessons && iterations < maxIterations) {
    iterations++;
    const dayOfWeek = currentDate.getDay();
    const dateStr = formatDate(currentDate);

    // Verifica se è un giorno valido
    if (
      daysOfWeek.includes(dayOfWeek) && // Giorno settimana selezionato (include domenica se selezionata)
      !isHoliday(dateStr) // Non festività
    ) {
      lessonsScheduled++;
    }

    // Avanza al giorno successivo
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Retrocedi di 1 giorno perché siamo avanzati dopo l'ultima lezione
  currentDate.setDate(currentDate.getDate() - 1);

  // IMPORTANTE: Assicurati che la data finale sia lo stesso giorno della settimana della data di inizio
  const finalDayOfWeek = currentDate.getDay();
  if (finalDayOfWeek !== startDayOfWeek) {
    // Avanza fino al prossimo giorno che corrisponde al giorno di inizio
    let daysToAdd = (startDayOfWeek - finalDayOfWeek + 7) % 7;
    if (daysToAdd === 0) daysToAdd = 7; // Se già lo stesso giorno, vai alla prossima settimana
    currentDate.setDate(currentDate.getDate() + daysToAdd);
  }

  return formatDate(currentDate);
}
