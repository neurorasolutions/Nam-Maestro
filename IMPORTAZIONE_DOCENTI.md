# Gestione Docenti - Guida Completa

## Implementazione Completata ✅

È stata implementata la sezione completa di gestione docenti con:
- Anagrafiche complete
- Importazione da CSV
- Ricerca e filtri
- Integrazione con piani di studio

---

## File Creati/Modificati

### 1. Migrazione Database
**`/supabase/migrations/20260215_create_teachers_table.sql`**
- Crea tabella `teachers` con tutti i campi anagrafici
- Indici per ricerca veloce
- Trigger per updated_at
- RLS policies configurate

### 2. Componenti
**`/src/components/TeachersView.tsx`**
- Vista completa gestione docenti
- Ricerca in tempo reale
- Modal dettaglio docente
- Importazione CSV integrata

### 3. Modifiche File Esistenti
- **`/src/types.ts`**: Aggiunta interfaccia `Teacher`
- **`/src/components/DidacticsView.tsx`**:
  - Aggiunto menu "Docenti" (prima di Piani di Studi)
  - Integrata vista TeachersView
- **`/src/components/CreateStudyPlanModal.tsx`**:
  - Dropdown docenti caricato da database
  - Input con ricerca (datalist HTML5)
  - Nessuna lista hardcoded

---

## ⚠️ AZIONI RICHIESTE

### 1. Eseguire Migrazione Database

**Opzione A: Supabase Dashboard (Consigliata)**
1. Vai su https://supabase.com/dashboard
2. SQL Editor
3. Copia contenuto da `/supabase/migrations/20260215_create_teachers_table.sql`
4. Esegui

**Opzione B: CLI** (se hai Docker)
```bash
supabase db reset
```

### 2. Importare Docenti dal CSV

**Dopo aver eseguito la migrazione:**

1. Vai a **Didattica → Docenti**
2. Clicca **"Importa CSV"**
3. Seleziona il file `/Users/macmini2/Downloads/Docenti.csv`
4. L'importazione processerà automaticamente:
   - Parsing CSV con gestione virgolette
   - Conversione data nascita (skip 0000-00-00)
   - Conversione genere (male → Maschio, female → Femmina)
   - Parsing tariffa oraria (virgola → punto)
   - Inserimento batch in database

5. Verifica messaggio di successo: "✅ Importati X docenti con successo!"

---

## Struttura Tabella Teachers

```sql
CREATE TABLE teachers (
    id UUID PRIMARY KEY,

    -- Anagrafica
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    gender TEXT,
    date_of_birth DATE,
    birth_place TEXT,
    birth_province TEXT,
    fiscal_code TEXT,
    passport_number TEXT,

    -- Residenza
    address TEXT,
    zip_code TEXT,
    city TEXT,
    province TEXT,
    country TEXT DEFAULT 'IT',

    -- Contatti
    mobile_phone TEXT,
    phone TEXT,

    -- Dati Fiscali
    iban TEXT,
    vat_number TEXT,
    hourly_rate DECIMAL(10,2),
    billing_mode TEXT,

    -- Didattica
    subjects_taught TEXT, -- CSV di materie

    -- Flags
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## Funzionalità Implementate

### ✅ Vista Docenti (Didattica → Docenti)

**Ricerca in Tempo Reale:**
- Nome
- Cognome
- Email
- Materie insegnate

**Visualizzazione Grid:**
- Avatar con iniziali
- Nome completo
- Email
- Prime 2 materie + contatore
- Telefono
- Tariffa oraria

**Modal Dettaglio:**
- Anagrafica completa
- Contatti con link mail/tel
- Residenza
- Dati lavorativi (tariffa, P.IVA, IBAN)
- Tutte le materie insegnate (badge)

### ✅ Importazione CSV

**Parser Intelligente:**
- Gestisce virgolette nei campi
- Skip righe vuote
- Conversione automatica formati
- Validazione campi obbligatori
- Inserimento batch ottimizzato

**Mappatura CSV → Database:**
```
Nome → first_name
Cognome → last_name
"Indirizzo e-mail" → email
Genere (male/female) → gender (Maschio/Femmina)
"Data di nascita" → date_of_birth (skip 0000-00-00)
"Tariffa oraria lorda docente" → hourly_rate (parse decimale)
"Materie insegnate" → subjects_taught
...
```

### ✅ Integrazione Piani di Studio

**Dropdown Docenti con Ricerca:**
- Caricamento automatico da database
- Input con datalist HTML5 (ricerca nativa browser)
- Placeholder: "Cerca e seleziona docente..."
- Contatore docenti disponibili

**Sostituita Lista Hardcoded:**
```typescript
// PRIMA ❌
const TEACHERS_LIST = ['Alessandro Rossi', 'Maria Bianchi', ...];

// DOPO ✅
const [teachers, setTeachers] = useState<Teacher[]>([]);
// Fetch da supabase.from('teachers')
```

---

## Test End-to-End

### 1. Verifica Migrazione

```sql
-- Verifica tabella creata
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_name = 'teachers';

-- Dovrebbe mostrare tutte le colonne
```

### 2. Importa Docenti

1. Didattica → Docenti
2. "Importa CSV"
3. Seleziona Docenti.csv
4. Attendi messaggio: "✅ Importati 128 docenti con successo!"

### 3. Verifica Database

```sql
-- Conta docenti importati
SELECT COUNT(*) FROM teachers WHERE is_active = true;
-- Dovrebbe mostrare ~128

-- Visualizza alcuni docenti
SELECT
  first_name,
  last_name,
  email,
  hourly_rate,
  subjects_taught
FROM teachers
ORDER BY last_name
LIMIT 5;
```

### 4. Test Ricerca

1. Nel campo ricerca digita: "luca"
2. Dovrebbe filtrare tutti i docenti con "Luca" nel nome
3. Clicca su un docente → Modal con dettagli completi

### 5. Test Integrazione Piani di Studio

1. Didattica → Piani di Studi
2. "Crea Piano di Studio"
3. Step 2 → Aggiungi Materia
4. Campo "Docente":
   - Vedi placeholder "Cerca e seleziona docente..."
   - Vedi contatore "128 docenti disponibili"
   - Digita "rossi" → Suggerimenti filtrati
   - Seleziona un docente

---

## Campi CSV e Mappatura

| Colonna CSV | Campo DB | Tipo | Note |
|------------|----------|------|------|
| Nome | first_name | TEXT | Obbligatorio |
| Cognome | last_name | TEXT | Obbligatorio |
| Indirizzo e-mail | email | TEXT | |
| Genere | gender | TEXT | male→Maschio, female→Femmina |
| Data di nascita | date_of_birth | DATE | Skip 0000-00-00 |
| Luogo di nascita | birth_place | TEXT | |
| Provincia di nascita | birth_province | TEXT | |
| CAP | zip_code | TEXT | |
| Città | city | TEXT | |
| Provincia | province | TEXT | |
| Indirizzo | address | TEXT | |
| Paese di residenza | country | TEXT | Default 'IT' |
| Cellulare | mobile_phone | TEXT | |
| Telefono | phone | TEXT | |
| Codice Fiscale | fiscal_code | TEXT | |
| IBAN | iban | TEXT | |
| Partita IVA | vat_number | TEXT | |
| Numero passaporto | passport_number | TEXT | |
| Tariffa oraria | hourly_rate | DECIMAL | Parse "20,00" → 20.00 |
| Materie insegnate | subjects_taught | TEXT | CSV separato da virgole |
| Modalità fatturazione | billing_mode | TEXT | |

---

## Esempio Query Utili

### Trova Docenti per Materia

```sql
SELECT first_name, last_name, email, hourly_rate
FROM teachers
WHERE subjects_taught ILIKE '%CHITARRA%'
  AND is_active = true
ORDER BY hourly_rate;
```

### Statistiche Tariffe

```sql
SELECT
  ROUND(AVG(hourly_rate), 2) as tariffa_media,
  MIN(hourly_rate) as tariffa_min,
  MAX(hourly_rate) as tariffa_max,
  COUNT(*) as num_docenti
FROM teachers
WHERE hourly_rate IS NOT NULL;
```

### Docenti Senza Email

```sql
SELECT first_name, last_name, mobile_phone
FROM teachers
WHERE email IS NULL OR email = ''
  AND is_active = true;
```

### Materie Più Insegnate

```sql
SELECT
  UNNEST(string_to_array(subjects_taught, ',')) as materia,
  COUNT(*) as num_docenti
FROM teachers
WHERE subjects_taught IS NOT NULL
GROUP BY materia
ORDER BY num_docenti DESC
LIMIT 10;
```

---

## Troubleshooting

### Errore: "relation teachers does not exist"
**Causa**: Migrazione non eseguita
**Soluzione**: Esegui migrazione SQL

### Nessun docente nel dropdown
**Causa**: Tabella vuota
**Soluzione**: Importa CSV

### Importazione fallita
**Causa**: Formato CSV non valido
**Soluzione**:
- Verifica che il file sia UTF-8
- Controlla header colonne
- Apri console browser (F12) per vedere errore dettagliato

### Ricerca non funziona
**Causa**: Browser non supporta datalist
**Soluzione**: Usa browser moderno (Chrome, Firefox, Edge)

---

## Prossimi Sviluppi (Non Implementati)

Possibili miglioramenti futuri:
- CRUD completo docenti (aggiungi, modifica, elimina via UI)
- Export docenti in CSV/PDF
- Statistiche ore insegnate per docente
- Calendario disponibilità docenti
- Notifiche assegnazione lezioni
- Upload documenti (contratti, CV)
- Gestione pagamenti/compensi

---

**Implementazione completata il 2026-02-15**

Migrazione database: ⚠️ DA ESEGUIRE MANUALMENTE
Importazione CSV: ⚠️ DA ESEGUIRE DA UI DOPO MIGRAZIONE
