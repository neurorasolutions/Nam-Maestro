-- Tabella per salvare lo storico delle notifiche push inviate dal gestionale
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_by TEXT, -- nome/email di chi ha inviato
  recipients_count INT DEFAULT 0,
  recipient_names TEXT[], -- array con i nomi dei destinatari
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ
);

-- Indice per ordinare per data e filtrare per letto/non letto
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy per permettere lettura a tutti gli utenti autenticati
CREATE POLICY "Allow read for authenticated users" ON notifications
  FOR SELECT TO authenticated USING (true);

-- Policy per permettere insert a tutti gli utenti autenticati
CREATE POLICY "Allow insert for authenticated users" ON notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- Policy per permettere update a tutti gli utenti autenticati
CREATE POLICY "Allow update for authenticated users" ON notifications
  FOR UPDATE TO authenticated USING (true);

-- Policy per anon (per il service role)
CREATE POLICY "Allow all for anon" ON notifications
  FOR ALL TO anon USING (true) WITH CHECK (true);
