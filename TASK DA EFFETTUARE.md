# Task da Effettuare - NAM Maestro Gestionale

---

## PRIORITA' ALTA - Funzionalita' Core/Bloccanti

### 1. Validazione Dati Obbligatori Iscrizione (COMPLETATO)
- [x] Non permettere alla Segreteria/cliente di procedere con l'iscrizione se mancano dati obbligatori
- [x] Mostrare chiaramente quali campi sono mancanti

### 2. Bug Email Invito (COMPLETATO)
- [x] **VERIFICATO** - Configurato API plugin per sviluppo locale
- [x] Debug del flusso `/invite-student` - Funzionante

### 3. Azioni Invito Visibili (COMPLETATO)
- [x] Creato pulsante **"Invia Invito"** con modal per reinvio email
- [x] Permettere di rimandare inviti anche dopo la creazione dello studente

### 4. Apertura Anagrafica Completa
- [ ] Cliccando su uno studente deve aprirsi la sua anagrafica completa (non solo modifica)
- [ ] Stesso comportamento per le lead nel CRM
- [ ] Scheda anagrafica deve mostrare:
  - Anagrafica completa
  - Corsi a cui e' iscritto
  - Pagamenti effettuati/pending
  - Elenco esami

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

#### Sesso
- [ ] Uomo
- [ ] Donna
- [ ] Preferisco non dichiarare
- [ ] Altro

#### Fonte Lead (Da dove arriva)
- [ ] Form Sito → **automatizzare**
- [ ] Mail → **automatizzare**
- [ ] Whatsapp
- [ ] Telefonata
- [ ] Social DM
- [ ] Fisicamente in sede

#### Sede di Riferimento
- [ ] Centrale
- [ ] Bovisa
- [ ] Online

#### Stato Iscrizione
- [ ] Audizione Prenotata
- [ ] Audizione avvenuta
- [ ] Colloquio prenotato
- [ ] Colloquio avvenuto
- [ ] Test ingresso mandato
- [ ] Test ingresso effettuato
- [ ] Prenotato iscrizione
- [ ] Non interessato

#### Campo NOTE
- [ ] Aggiungere campo note libero per annotazioni della segreteria

### 7. Eventi al posto di Open Day
- [ ] Sostituire "Open Day" con lista dinamica di **EVENTI**
- [ ] Possibilita' di aggiungere:
  - Open Day (con date specifiche)
  - Workshop specifici
  - Altri eventi personalizzabili

### 8. WhatsApp al posto di SMS
- [ ] Integrare WhatsApp per le comunicazioni (SMS troppo costoso)

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

## NOTE PROCEDURA ISCRIZIONE IDEALE

1. Mandare link per compilare anagrafica **OPPURE** far compilare alla segreteria
2. L'iscritto si collega all'App
3. Riceve tutte le info del suo piano di studi

---

## Completati

- [x] **Task 1** - Validazione Dati Obbligatori Iscrizione (30 campi obbligatori)
- [x] **Task 2** - Bug Email Invito (API plugin configurato)
- [x] **Task 3** - Azioni Invito Visibili (pulsante "Invia Invito" con modal)
- [x] **Task 6 parziale** - Aggiunto campo "Come ci hai conosciuto?" e "Grado di Istruzione"

---

*Ultimo aggiornamento: 27 Gennaio 2026*
