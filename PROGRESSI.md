# 📈 Diario dei Progressi - NAM Maestro

## 📅 1 Febbraio 2026

### 1. 🧙 Wizard Iscrizione a Step
- **Trasformazione Form**: Il form di iscrizione è ora un wizard sequenziale a 4 step
- **Validazione per Step**: Ogni step valida solo i suoi campi obbligatori prima di procedere
- **Progress Bar**: Indicatore visuale con cerchi numerati (verde=completato, rosso=corrente, grigio=futuro)
- **Navigazione Migliorata**:
  - Pulsante "Indietro" rosso
  - Pulsante "Annulla Iscrizione" grigio al centro (con conferma)
  - Pulsante "Avanti" verde
- **Pulsante Dinamico**: Mostra "SALVA & INVITA" per nuovi studenti, "SALVA MODIFICHE" per esistenti

### 2. 📋 Pipeline Lista Studenti
- **Nuove Colonne**: Nome, Email, Telefono, Stato, Data Creazione, 1° Corso, 2° Corso, Operazioni
- **Badge Colorati**: Ogni stato iscrizione ha un colore distintivo
- **Nuovi Filtri**: Stato, Corso, Evento Acquisizione, Responsabile
- **Doppio Click**: Apre popup anagrafica completa dello studente

### 3. 🎯 Nuovi Campi e Stati
- **Stati Iscrizione Aggiornati**: Primo contatto, Colloquio, Audizioni, Test di ingresso, Iscrizione, Iscritto, Scomparso, Non interessato
- **Evento Acquisizione**: Nuovo campo con "Open Day" (espandibile)
- **Responsabile**: Nuovo campo dropdown (Irene, Silvia, Claire, Simone)
- **Secondo Corso**: Aggiunta opzione "Nessuno"
- **Rimosso**: Checkbox "Abilita Moodle"

### 4. 🔢 Calcolo Automatico Codice Fiscale
- **Libreria Integrata**: `codice-fiscale-js`
- **Calcolo Real-time**: CF generato automaticamente compilando nome, cognome, data nascita, genere, luogo e provincia
- **Fallback**: Se il comune non è riconosciuto, il campo resta modificabile manualmente

### 5. 👁️ Popup Anagrafica Completa
- **Attivazione**: Doppio click su qualsiasi riga della lista studenti
- **Contenuto Completo**:
  - Header con avatar e info principali
  - Dati anagrafici (CF, nascita, cittadinanza, etc.)
  - Contatti (email, telefoni)
  - Residenza completa
  - Stato iscrizione e corsi
  - Pagamenti (placeholder)
  - Esami (placeholder)
  - Info aggiuntive (responsabile, fonte, etc.)
  - Note
- **Azioni**: Pulsante "Modifica Anagrafica" per passare direttamente alla modifica

### 6. 🎨 Miglioramenti UI
- **Campo Email**: Stile uniformato agli altri input (era giallo/poco visibile)
- **Tabella Responsive**: Scroll orizzontale su schermi piccoli

---

## 📅 30 Gennaio 2026

### Push Notifications & Centro Notifiche
- **Edge Function `send-push`**: Invio notifiche via Firebase Cloud Messaging HTTP v1
- **Centro Notifiche Gestionale**: Campanella con dropdown e storico
- **Centro Notifiche PWA**: Studenti vedono le proprie notifiche con possibilità di eliminarle
- **Realtime Updates**: Aggiornamenti automatici via Supabase subscriptions

---

## 📅 26 Gennaio 2026

### 1. 🔐 Ruoli e Permessi
- **Refactoring Ruoli**: Rimossa vista "Studenti" in alto, rimossi ruoli obsoleti.
- **Accesso Condizionale**: La "Segreteria" ora vede un menu ridotto (Dashboard, Didattica, Segreteria), mentre la "Direzione" vede tutto (incluso CRM, Amministrazione, Report).
- **Navbar**: Ottimizzata la barra superiore senza tasti superflui per la segreteria.

### 2. 📅 Calendario (Gestionale & App)
- **Estensione Orari**: Ampliata la griglia oraria dalle 8:00 alle 23:00.
- **Fix UI Settimanale**: Risolto disallineamento colonne/righe riscrivendo il rendering con CSS Grid. Migliorata visibilità righe orizzontali.
- **Fix Timezone (App)**: Risolto bug critico nell'App studenti che mostrava le lezioni nel giorno sbagliato a causa del fuso orario locale.

### 3. 🎓 Segreteria & Iscrizioni
- **Campo "Corso Effettivo"**: Aggiunto campo `enrolled_course` nel DB e form, chiave per linkare studente->lezioni.
- **Interfaccia Messaggistica**: Creata UI completa in "Segreteria & Iscritti":
  - Selezione multipla studenti (checkbox).
  - Tasto "Invia Messaggio".
  - Modale per composizione (Email / Push / WhatsApp).

### 4. 📚 Documentazione & Deploy
- **README.md Completo**: Creata documentazione tecnica dettagliata con diagrammi Mermaid (Architettura, Flussi, DB).
- **Git & GitHub**: Eseguito push del codice aggiornato sui repository `Nam-Maestro` e `maestro-app`.

---

## 📊 Riepilogo Stato Attuale

### Funzionalità Completate ✅
| Modulo | Funzionalità |
|--------|--------------|
| **Iscrizioni** | Wizard a 4 step, validazione, calcolo CF automatico |
| **Lista Studenti** | Pipeline completa, filtri avanzati, popup anagrafica |
| **Messaggistica** | Email, Push Notifications, WhatsApp Web |
| **Notifiche** | Centro notifiche gestionale e PWA studenti |
| **Calendario** | Griglia 8-23, fix timezone, vista settimanale |
| **Auth** | Login, ruoli, cancellazione completa utenti |

### Da Completare 🔄
| Priorità | Task |
|----------|------|
| Alta | Anagrafica completa per Lead CRM |
| Media | Riorganizzazione corsi in macro-categorie |
| Media | WhatsApp Business API |
| Bassa | Pagamenti e Esami (tabelle Supabase) |
| Bassa | Firma digitale contratti |

### Colonne da Aggiungere in Supabase ⚠️
```sql
ALTER TABLE students ADD COLUMN evento_acquisizione TEXT;
ALTER TABLE students ADD COLUMN responsabile TEXT;
```

---

*Ultimo aggiornamento: 1 Febbraio 2026*
