-- Tabella per le notifiche individuali degli studenti
-- Ogni studente riceve una copia della notifica quando il gestionale invia un push
CREATE TABLE IF NOT EXISTS student_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ
);

-- Indici per performance
CREATE INDEX idx_student_notifications_student_id ON student_notifications(student_id);
CREATE INDEX idx_student_notifications_created_at ON student_notifications(created_at DESC);
CREATE INDEX idx_student_notifications_is_read ON student_notifications(student_id, is_read);

-- RLS policies
ALTER TABLE student_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Ogni studente può vedere solo le proprie notifiche
CREATE POLICY "Students can view own notifications" ON student_notifications
  FOR SELECT TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Gli studenti possono aggiornare (marcare come lette) solo le proprie notifiche
CREATE POLICY "Students can update own notifications" ON student_notifications
  FOR UPDATE TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Gli studenti possono eliminare solo le proprie notifiche
CREATE POLICY "Students can delete own notifications" ON student_notifications
  FOR DELETE TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Il sistema (service role) può inserire notifiche per qualsiasi studente
CREATE POLICY "Service role can insert notifications" ON student_notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Policy per anon (usata dalle Edge Functions con service_role key)
CREATE POLICY "Allow all for anon" ON student_notifications
  FOR ALL TO anon USING (true) WITH CHECK (true);
