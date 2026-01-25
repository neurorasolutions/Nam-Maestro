# 📈 Diario dei Progressi - NAM Maestro

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
