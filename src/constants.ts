import { Lead, Course, Event, Payment, InventoryItem } from './types';

// --- LISTE ESISTENTI (NON TOCCATE) ---

export const TEACHERS_LIST = [
  "Fasoli Daniele", "Fedele Laura", "Ferrara Fabrizio", "Ferri Max", "Fincato Camilla",
  "Flaminio Claudio", "Folli Paola", "Furian Maxx", "Meneghello Luca", "Merlo Simone",
  "Mezza Andrea", "Mezzadra Antonio", "Novali Ermanno", "Nuzzi Federica", "Odone Alberto",
  "Pagani Davide", "Pantaleo Davide", "Paulovich Federico", "Pecchenini Patrick", "Perini Daniele",
  "Pini Beppe", "Pirovano Simone", "Pizzetti Cesare", "Pontini Simone", "Prestigiacomo Davide",
  "Quilichini Pietro", "Raimondo Walter", "Renteria Gabriel", "Renteria Linda Gabriel",
  "Ricci Marco", "Ricci Tullio", "Risola Gianfranco", "Rizzo Cascio Joseph", "Romano Giacomo",
  "Rossi Pacho", "Rozza Simone", "Sabatino Francesca", "Salati Ralph", "Segreto Ivan",
  "Siliotto Francesco", "Slaviero Federico", "Sottilotta Giulia", "Tavoldini Francesco",
  "Tempesta Jenny", "Torella Antonio", "Tosi Riccardo", "Tumiati Stefano"
];

export const ROOMS_LIST = [
  "Canto piano terra",
  "Strumento piano terra",
  "Auditorium",
  "Studio A",
  "Studio B",
  "Aula Digital",
  "Teoria 1",
  "Teoria 2",
  "Strumento Secondo Piano"
];

// --- CORSI PRINCIPALI (per iscrizione studenti) ---
export const MAIN_COURSES = [
  "Fonico Anno Unico",
  // Altri corsi principali da aggiungere...
];

// --- MATERIE PER CORSO PRINCIPALE (con ore totali) ---
export const COURSE_SUBJECTS: Record<string, { name: string; hours: number; type: 'collettivo' | 'individuale' }[]> = {
  "Fonico Anno Unico": [
    { name: "Teoria e Tecnica AU", hours: 34, type: 'collettivo' },
    { name: "Pro Tools AU", hours: 26, type: 'collettivo' },
    { name: "Informatica AU", hours: 24, type: 'collettivo' },
    { name: "Teoria Musicale per Fonici AU", hours: 28, type: 'collettivo' },
    { name: "Pratica Studio AU", hours: 78, type: 'collettivo' },
    { name: "Fisica della Fonotecnica AU", hours: 30, type: 'collettivo' },
    { name: "Rec AU", hours: 15, type: 'collettivo' },
    { name: "Mixaggio AU", hours: 16, type: 'collettivo' },
    { name: "Music Business", hours: 8, type: 'collettivo' },
    { name: "Seminario Mastering", hours: 6, type: 'collettivo' },
    { name: "Seminario Sound Design", hours: 4, type: 'collettivo' },
    { name: "Riunione Preliminare Anno Unico Fonico", hours: 0, type: 'collettivo' },
  ],
};

// --- STRUTTURA CORSI PER MACRO-CATEGORIE ---
export const CORSI_STRUTTURA = {
  'CANTO': {
    icon: 'fa-microphone',
    color: 'bg-pink-500',
    corsi: ['Propedeutico', 'Base/Intermedio', 'Avanzato', '1 Pro', '2 Pro', '3 Pro']
  },
  'STRUMENTO': {
    icon: 'fa-guitar',
    color: 'bg-amber-500',
    sottocategorie: {
      'Chitarra': ['Propedeutico', 'Base/Intermedio', 'Avanzato', '1 Pro', '2 Pro', '3 Pro'],
      'Basso': ['Propedeutico', 'Base/Intermedio', 'Avanzato', '1 Pro', '2 Pro', '3 Pro'],
      'Pianoforte': ['Propedeutico', 'Base/Intermedio', 'Avanzato', '1 Pro', '2 Pro'],
      'Batteria': ['Propedeutico', 'Base/Intermedio', 'Avanzato', '1 Pro', '2 Pro', '3 Pro'],
      'Batteria Maxxima': ['Anno 1', 'Anno 2', 'Anno 3', 'Quarto Anno'],
      'Sax': ['Base', 'Intermedio']
    }
  },
  'DJ': {
    icon: 'fa-compact-disc',
    color: 'bg-purple-500',
    corsi: ['Kids', 'Breve', 'Pro']
  },
  'MUSIC BUSINESS': {
    icon: 'fa-briefcase',
    color: 'bg-gray-500',
    corsi: ['Breve', 'Full']
  },
  'FONICO': {
    icon: 'fa-sliders-h',
    color: 'bg-blue-500',
    corsi: ['Fonico Full', 'Fonico Superfull', 'Biennio Anno 1', 'Biennio Anno 2']
  },
  'SOUND DESIGN': {
    icon: 'fa-wave-square',
    color: 'bg-cyan-500',
    corsi: ['Base', 'Pro']
  },
  'MUSICA PER IMMAGINI': {
    icon: 'fa-film',
    color: 'bg-indigo-500',
    corsi: ['Base', 'Pro']
  },
  'PRODUCER & COMPOSER': {
    icon: 'fa-music',
    color: 'bg-green-500',
    corsi: ['Anno Unico', 'Biennio']
  },
  'PRODUCER & COMPOSER COMPLETO': {
    icon: 'fa-layer-group',
    color: 'bg-emerald-600',
    corsi: ['Anno Unico', 'Biennio']
  },
  'EMP PRO': {
    icon: 'fa-star',
    color: 'bg-yellow-500',
    corsi: ['EMP Pro 1', 'EMP Pro 2', 'EMP Pro 3']
  },
  'GIOVANISSIMI': {
    icon: 'fa-child',
    color: 'bg-orange-500',
    corsi: ['Canto', 'Chitarra', 'Basso', 'Batteria', 'Pianoforte']
  }
};

// --- FUNZIONE DI GENERAZIONE AUTOMATICA COURSES_LIST DA CORSI_STRUTTURA ---
function generateCoursesList(): string[] {
  const courses: string[] = [];
  
  Object.entries(CORSI_STRUTTURA).forEach(([macroCategoria, config]) => {
    if ('sottocategorie' in config) {
      // Categorie con sottocategorie (es. STRUMENTO)
      Object.entries(config.sottocategorie).forEach(([sottoCat, corsi]) => {
        corsi.forEach(corso => {
          // Gestione speciale per Batteria Maxxima
          if (sottoCat === 'Batteria Maxxima') {
            courses.push(`${sottoCat} ${corso}`);
          } else {
            courses.push(`${sottoCat} ${corso}`);
          }
        });
      });
    } else {
      // Categorie dirette (es. CANTO, DJ, FONICO)
      config.corsi.forEach(corso => {
        // Gestione speciale per GIOVANISSIMI
        if (macroCategoria === 'GIOVANISSIMI') {
          courses.push(`${macroCategoria} ${corso.toLowerCase()}`);
        } else if (macroCategoria === 'FONICO') {
          courses.push(corso); // Già include "Fonico" nel nome
        } else if (macroCategoria === 'SOUND DESIGN') {
          courses.push(`Sound Design ${corso}`);
        } else if (macroCategoria === 'MUSICA PER IMMAGINI') {
          courses.push(`Musica per Immagini ${corso}`);
        } else if (macroCategoria === 'PRODUCER & COMPOSER' || macroCategoria === 'PRODUCER & COMPOSER COMPLETO') {
          const prefix = macroCategoria === 'PRODUCER & COMPOSER COMPLETO' ? 'Producer & Composer Completo' : 'Producer & Composer';
          courses.push(`${prefix} ${corso}`);
        } else if (macroCategoria === 'MUSIC BUSINESS') {
          courses.push(`Music Business ${corso}`);
        } else if (macroCategoria === 'EMP PRO') {
          courses.push(corso); // Già include "EMP PRO" nel nome
        } else if (macroCategoria === 'DJ') {
          courses.push(`DJ ${corso}`);
        } else {
          courses.push(`${macroCategoria} ${corso}`);
        }
      });
    }
  });
  
  return courses.sort();
}

// --- LISTA CORSI GENERATA AUTOMATICAMENTE DA CORSI_STRUTTURA ---
export const COURSES_LIST = generateCoursesList();

export const INITIAL_LEADS: Lead[] = [
  { id: 1, name: 'Marco Rossi', interest: 'Basso Elettrico', source: 'Instagram', status: 'contact' },
  { id: 2, name: 'Giulia Bianchi', interest: 'Canto Jazz', source: 'Sito Web', status: 'interview' },
  { id: 3, name: 'Luca Verdi', interest: 'Music Business', source: 'Passaparola', status: 'audition' },
  { id: 4, name: 'Sofia Neri', interest: 'Pianoforte', source: 'Facebook', status: 'enrolled' },
  { id: 5, name: 'Alessandro Gialli', interest: 'Batteria', source: 'Volantino', status: 'followup' },
];

export const COURSES: Course[] = [
  { id: 1, name: 'Teoria e Solfeggio 1 PRO', type: 'Collettivo', teacher: 'Prof. Allevi', day: 'Lunedì' },
  { id: 2, name: 'Laboratorio Chitarristico', type: 'Collettivo', teacher: 'Prof. Satriani', day: 'Martedì' },
  { id: 3, name: 'Music Business', type: 'Collettivo', teacher: 'Dott. Manager', day: 'Mercoledì' },
  { id: 4, name: 'Albero del Canto', type: 'Individuale', teacher: 'M. Callas', day: 'Giovedì' },
  { id: 5, name: 'Canto Pro 1', type: 'Individuale', teacher: 'M. Pavarotti', day: 'Venerdì' },
];

export const EVENTS: Event[] = [
  { id: 1, title: 'Batteria Maxxima Anno 1 - Furian Maxx', room: 'Strumento piano terra', type: 'lesson', time: '10:00 - 11:00' },
  { id: 2, title: 'Canto Pro Anno 1 - Folli Paola', room: 'Canto piano terra', type: 'lesson', time: '11:00 - 12:00', isHybrid: true },
  { id: 3, title: 'Teoria Collettiva', room: 'Auditorium', type: 'collective', time: '14:00 - 16:00' },
  { id: 4, title: 'Music Business', room: 'Teoria 1', type: 'collective', time: '16:00 - 18:00' },
  { id: 5, title: 'Chitarra Pro Anno 1 (Esame)', room: 'Studio A', type: 'exam', time: '18:00 - 19:00' },
];

export const PAYMENTS: Payment[] = [
  { id: 1, student: 'Marco Rossi', amount: 150, dueDate: '2023-11-01', status: 'paid' },
  { id: 2, student: 'Giulia Bianchi', amount: 180, dueDate: '2023-11-05', status: 'overdue' },
  { id: 3, student: 'Luca Verdi', amount: 150, dueDate: '2023-11-15', status: 'pending' },
  { id: 4, student: 'Sofia Neri', amount: 200, dueDate: '2023-11-20', status: 'pending' },
];

export const INVENTORY: InventoryItem[] = [
  { id: 1, name: 'Manuale Armonia Vol. 1', category: 'Libri', stock: 45, royalties: 225.00 },
  { id: 2, name: 'T-shirt NAM Official', category: 'Gadget', stock: 12, royalties: 0 },
  { id: 3, name: 'Metodo Batteria Rock', category: 'Libri', stock: 8, royalties: 40.00 },
  { id: 4, name: 'Quaderno Pentagrammato', category: 'Cancelleria', stock: 100, royalties: 0 },
];


// --- NUOVE LISTE PER SCHEDA ISCRIZIONE STUDENTE ---

export const LISTS = {
  GENDER: ['Maschio', 'Femmina'],

  // Per il menù "Corso di interesse"
  INTEREST_AREAS: [
    "Albero del Canto",
    "Basso",
    "Canto",
    "Chitarra",
    "Coro",
    "Corsi Producer",
    "FUSSI",
    "Mix e Mastering",
    "Musica per Immagini",
    "Pianoforte",
    "Post Produzione Audio",
    "Producer",
    "Sound Design",
    "Batteria",
    "Batteria Maxxima",
    "Corso Giovanissimi",
    "DJ",
    "Fonico",
    "Music Business",
    "Sax"
  ],

  COURSE_TYPES: ['Carnet', 'Corso Base', 'Corso Pro', 'Masterclass'],

  LOCATIONS: ['Centrale', 'Bovisa'],

  OPEN_DAY: ['Prenotato', 'Non Prenotato'],

  ENROLLMENT_STATUS: [
    'Primo contatto',
    'Colloquio',
    'Audizioni',
    'Test di ingresso',
    'Iscrizione',
    'Iscritto',
    'Scomparso',
    'Non interessato'
  ],

  // Eventi di acquisizione
  EVENTI_ACQUISIZIONE: [
    'Open Day'
  ],

  // Responsabili/Operatori segreteria
  RESPONSABILI: [
    'Irene',
    'Silvia',
    'Claire',
    'Simone'
  ],

  // Marketing & Lead Sources (usate per "Come ci hai conosciuto" e "Da dove arriva il contatto")
  LEAD_SOURCES: ['Sito Web', 'Passaparola', 'Social Media', 'Evento', 'Altro'],

  // Come ci hai conosciuto?
  MARKETING_SOURCES: [
    'Passa Parola',
    'Sito',
    'Google',
    'Instagram',
    'Youtube',
    'Facebook',
    'Tik Tok',
    'ADV',
    'Volantini'
  ],

  // Grado di Istruzione
  EDUCATION_LEVELS: [
    'Licenza Media',
    'Diploma Superiore',
    'Laurea Triennale',
    'Laurea Magistrale',
    'Master',
    'Dottorato',
    'Altro'
  ]
};