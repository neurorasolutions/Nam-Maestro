# Task da Effettuare - NAM Maestro Gestionale

---

## PRIORITA' ALTA - Funzionalita' Core/Bloccanti

### 1. Validazione Dati Obbligatori Iscrizione (COMPLETATO)
- [x] Non permettere alla Segreteria/cliente di procedere con l'iscrizione se mancano dati obbligatori
- [x] Mostrare chiaramente quali campi sono mancanti
- [x] **NUOVO**: Wizard a step sequenziali con validazione per ogni step
- [x] **NUOVO**: Pulsanti navigazione colorati (Indietro rosso, Avanti verde, Annulla al centro)

### 2. Bug Email Invito (COMPLETATO)
- [x] **VERIFICATO** - Configurato API plugin per sviluppo locale
- [x] Debug del flusso `/invite-student` - Funzionante

### 3. Azioni Invito Visibili (COMPLETATO)
- [x] Creato pulsante **"Invia Invito"** con modal per reinvio email
- [x] Permettere di rimandare inviti anche dopo la creazione dello studente

### 4. Apertura Anagrafica Completa (COMPLETATO)
- [x] Doppio click su studente apre popup anagrafica completa
- [x] Scheda anagrafica mostra:
  - [x] Anagrafica completa (CF, nascita, cittadinanza, etc.)
  - [x] Contatti (email, telefoni)
  - [x] Residenza completa
  - [x] Stato iscrizione e corsi
  - [x] Pagamenti (placeholder per futuro)
  - [x] Esami (placeholder per futuro)
  - [x] Info aggiuntive (responsabile, fonte, etc.)
  - [x] Note
- [x] Pulsante "Modifica Anagrafica" nel popup
- [ ] Stesso comportamento per le lead nel CRM (da fare)

---

## PRIORITA' MEDIA - Miglioramenti Strutturali

### 5. Riorganizzazione Corsi in Macro-Categorie
- [ ] Creare struttura gerarchica dei corsi:

```
CANTO
  └─ Propedeutico, Base/Intermedio, Avanzato, 1 Pro, 2 Pro, 3 Pro

STRUMENTO
  └─ Propedeutico, Base/Intermedio, Avanzato, 1 Pro, 2 Pro, 3 Pro

DJ
  └─ Kids, Breve, Pro

MUSIC BUSINESS
  └─ (livelli da definire)

FONICO
  └─ Fonico Full, Fonico Superfull, ecc.

SOUND DESIGN
  └─ Base, Pro

MUSICA PER IMMAGINI
  └─ Base, Pro

PRODUCER & COMPOSER
  └─ Anno Unico, Biennio

PRODUCER & COMPOSER COMPLETO
  └─ Anno Unico, Biennio
```

### 6. Nuovi Campi da Aggiungere

#### Come ci hai conosciuto? (COMPLETATO)
- [x] Passa Parola
- [x] Sito
- [x] Google
- [x] Instagram
- [x] Youtube
- [x] Facebook
- [x] Tik Tok
- [x] ADV
- [x] Volantini

#### Grado di Istruzione (COMPLETATO)
- [x] Licenza Media, Diploma Superiore, Laurea Triennale, Laurea Magistrale, Master, Dottorato, Altro

#### Sesso (COMPLETATO)
- [x] Maschio
- [x] Femmina
- [x] Altro

#### Fonte Lead (COMPLETATO)
- [x] Sito Web
- [x] Passaparola
- [x] Social Media
- [x] Evento
- [x] Altro

#### Sede di Riferimento (COMPLETATO)
- [x] Centrale
- [x] Bovisa
- [x] Online

#### Stato Iscrizione (COMPLETATO - AGGIORNATO)
- [x] Primo contatto
- [x] Colloquio
- [x] Audizioni
- [x] Test di ingresso
- [x] Iscrizione
- [x] Iscritto
- [x] Scomparso
- [x] Non interessato

#### Campo NOTE (COMPLETATO)
- [x] Campo note libero per annotazioni della segreteria

#### Evento Acquisizione (NUOVO - COMPLETATO)
- [x] Open Day (espandibile con altri eventi)

#### Responsabile (NUOVO - COMPLETATO)
- [x] Irene, Silvia, Claire, Simone

### 7. Eventi al posto di Open Day (PARZIALE)
- [x] Aggiunto campo "Evento Acquisizione" con Open Day
- [ ] Possibilita' di aggiungere eventi dinamicamente

### 8. WhatsApp al posto di SMS (PARZIALE)
- [x] Integrazione base WhatsApp Web (apre chat con messaggio precompilato)
- [ ] Integrare WhatsApp Business API per invio massivo

### 9. Gestione Duplicati Intelligente
- [ ] Se i dati esistono gia' (es. parenti/genitori con stessi dati), mostrare avviso
- [ ] Aggiungere pulsante **"PROCEDI COMUNQUE"**
- [ ] In caso di conflitto su invio messaggi, chiedere a quale delle 2 anagrafiche inviare

---

## PRIORITA' MEDIA-BASSA - Funzionalita' Avanzate

### 10. Piano di Studi Personalizzabile
- [ ] Permettere alla segreteria di selezionare giorni e orari per corsi collettivi
- [ ] Esempio: Canto Base con Armonia Intermedio e Teoria/Solfeggio Base (orari diversi)
- [ ] **Chiedere a Silvia** i giorni e orari disponibili
- [ ] Stessa logica per corsi Fonico e Audio

### 11. Sezione "Struttura del Tuo Piano di Studi"
- [ ] Creare sezione dedicata nell'App studente
- [ ] Mostrare sunto completo del piano di studi assegnato
- [ ] La segreteria deve avere tutto sotto mano durante l'iscrizione

### 12. Email Reminder Automatico
- [ ] Inviare email ufficiale all'iscritto **una settimana prima** dell'inizio del corso
- [ ] Template professionale con reminder data/ora inizio

### 13. Link Auto-Compilazione Anagrafica
- [ ] Creare link da inviare all'iscritto per compilare autonomamente i propri dati
- [ ] Visibilita' in tempo reale per la segreteria
- [ ] Dare 2 opzioni: via App o via Mail

---

## FUNZIONALITA' DOCUMENTALI

### 14. Gestione Contratti
- [ ] **Opzione 1**: Firma digitale (integrazione YouSign o Aruba/Poste)
- [ ] **Opzione 2**: Invio per mail con firma manuale → scansione → restituzione
- [ ] Valutare firma elettronica come backup

### 15. Upload Documenti
- [ ] Foto Carta ID fronte e retro (verificare leggibilita')
- [ ] Autocertificazione titolo di studio (per corsi PRO)
- [ ] IBAN NAM per ricevere pagamenti

### 16. Sistema Archiviazione Cloud
- [ ] Tutti i dati e file devono essere archiviati
- [ ] Collegamento con SERVER DATINAM → CONDIVISA UFFICIO
- [ ] **Chiedere a Baragiola** backup automatico cloud → server scolastico

---

## INTEGRAZIONI ESTERNE

### 17. Integrazioni da Implementare
- [ ] **YouSign** - Firma digitale contratti
- [ ] **WhatsApp API** - Comunicazioni
- [ ] **Mailchimp** - Email marketing
- [ ] **Banca** - Gestione pagamenti
- [ ] **Heylight** - (da definire)

### 18. Integrazioni Future (NAM Shop)
- [ ] PayPal
- [ ] Stripe

---

## INFRASTRUTTURA

### 19. Doppio Dominio di Sicurezza
- [ ] Configurare 2 domini come backup plan
- [ ] **ULTIMA COSA DA FARE**

### 20. Backup Automatico
- [ ] Configurare backup automatico dal cloud Supabase al server scolastico

---

## APP STUDENTI

### 21. Installazione PWA (COMPLETATO)
- [x] Bottone "Installa App sul Telefono" per Android al primo accesso
- [x] Istruzioni installazione per iOS (Condividi > Aggiungi a Home)
- [x] Prompt mostrato nella schermata impostazione password

### 24. Push Notifications (COMPLETATO)
- [x] Edge Function `send-push` per invio via Firebase Cloud Messaging HTTP v1
- [x] Salvataggio token FCM degli studenti nel database
- [x] Invio notifiche push a singoli studenti o gruppi
- [x] Notifiche ricevute su dispositivi Android e iOS

### 25. Centro Notifiche Gestionale (COMPLETATO)
- [x] Campanella nell'header con badge notifiche non lette
- [x] Dropdown con storico notifiche inviate
- [x] Possibilita' di segnare come lette singolarmente o tutte
- [x] Tabella `notifications` per storico gestionale
- [x] Aggiornamenti realtime via Supabase

### 26. Centro Notifiche PWA Studenti (COMPLETATO)
- [x] Campanella nell'header dell'app con badge animato
- [x] Schermata notifiche con lista dinamica dal database
- [x] Tabella `student_notifications` per notifiche personali
- [x] Ogni studente vede solo le sue notifiche (RLS policy)
- [x] Possibilita' di segnare come lette
- [x] Possibilita' di eliminare notifiche (icona cestino)
- [x] Sottoscrizione realtime per nuove notifiche
- [x] Contatore notifiche non lette nella dashboard

---

## FUNZIONALITA' GESTIONALE COMPLETATE

### 22. Sistema Messaggistica Email (COMPLETATO - validare ipotesi Resend per migliorare velocità)
- [x] Edge Function `send-email` per invio via Gmail SMTP
- [x] Template HTML professionale per le email
- [x] Modal "Invia Messaggio" con selezione destinatari:
  - [x] Selezione Manuale con lista checkbox e ricerca
  - [x] Selezione Per Corso con dropdown
  - [x] Bottoni Seleziona tutti / Deseleziona tutti
- [x] Email visibili nella cartella "Inviate" di Gmail
- [x] Supporto invio a destinatari multipli

### 23. Cancellazione Utenti Completa (COMPLETATO)
- [x] Edge Function `delete-user` per cancellazione da students E auth.users
- [x] Risolto problema utenti "orfani" nel sistema di autenticazione
- [x] Possibilita' di reinviare inviti alla stessa email dopo cancellazione

### 27. Wizard Iscrizione a Step (NUOVO - COMPLETATO)
- [x] Form iscrizione trasformato in wizard sequenziale a 4 step
- [x] Validazione campi obbligatori per ogni step prima di procedere
- [x] Progress bar visuale con step completati/corrente/futuri
- [x] Pulsanti navigazione: Indietro (rosso), Annulla (grigio), Avanti (verde)
- [x] Pulsante dinamico: "SALVA & INVITA" per nuovi, "SALVA MODIFICHE" per esistenti

### 28. Pipeline Lista Studenti Migliorata (NUOVO - COMPLETATO)
- [x] Nuove colonne: Nome, Email, Telefono, Stato, Data Creazione, 1° Corso, 2° Corso, Operazioni
- [x] Badge colorati per ogni stato iscrizione
- [x] Filtri: Cerca, Stato, Corso, Evento, Responsabile
- [x] Doppio click per aprire anagrafica completa

### 29. Calcolo Automatico Codice Fiscale (NUOVO - COMPLETATO)
- [x] Libreria `codice-fiscale-js` integrata
- [x] CF calcolato automaticamente da: nome, cognome, data nascita, genere, luogo, provincia
- [x] Aggiornamento in tempo reale nel form

---

## NOTE PROCEDURA ISCRIZIONE IDEALE

1. Mandare link per compilare anagrafica **OPPURE** far compilare alla segreteria
2. L'iscritto si collega all'App
3. Riceve tutte le info del suo piano di studi

---

## Completati

- [x] **Task 1** - Validazione Dati Obbligatori Iscrizione (30 campi obbligatori + wizard a step)
- [x] **Task 2** - Bug Email Invito (API plugin configurato)
- [x] **Task 3** - Azioni Invito Visibili (pulsante "Invia Invito" con modal)
- [x] **Task 4** - Apertura Anagrafica Completa (popup con doppio click)
- [x] **Task 6** - Nuovi campi completati (Come ci hai conosciuto, Grado Istruzione, Sesso, Fonte Lead, Sede, Stato, Note, Evento, Responsabile)
- [x] **Task 21** - Installazione PWA App Studenti (Android + iOS)
- [x] **Task 22** - Sistema Messaggistica Email (Gmail SMTP + selezione destinatari)
- [x] **Task 23** - Cancellazione Utenti Completa (Edge Function delete-user)
- [x] **Task 8 parziale** - WhatsApp Web integration base
- [x] **Task 24** - Push Notifications via Firebase Cloud Messaging
- [x] **Task 25** - Centro Notifiche Gestionale (campanella + dropdown)
- [x] **Task 26** - Centro Notifiche PWA Studenti (campanella + lista + elimina)
- [x] **Task 27** - Wizard Iscrizione a Step sequenziali
- [x] **Task 28** - Pipeline Lista Studenti Migliorata
- [x] **Task 29** - Calcolo Automatico Codice Fiscale

---

## CAMPI DA AGGIUNGERE IN SUPABASE

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `evento_acquisizione` | text | Evento tramite cui è arrivato (Open Day, etc.) |
| `responsabile` | text | Operatore segreteria assegnato |

---

## UTENTI GESTIONALE

| Email | Ruolo | Note |
|-------|-------|------|
| claire@nam.it | Direzione | Admin principale |
| irene@nam.it | Direzione | Aggiunto 30/01/2026 |

---

*Ultimo aggiornamento: 1 Febbraio 2026*
