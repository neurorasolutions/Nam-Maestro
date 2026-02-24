-- Aggiungi campi per Zoom
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS zoom_meeting_id TEXT,
ADD COLUMN IF NOT EXISTS zoom_link TEXT,
ADD COLUMN IF NOT EXISTS zoom_host_link TEXT,
ADD COLUMN IF NOT EXISTS zoom_password TEXT,
ADD COLUMN IF NOT EXISTS zoom_created_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS zoom_error TEXT,
ADD COLUMN IF NOT EXISTS zoom_retry_count INTEGER DEFAULT 0;

-- Indice per query veloci
CREATE INDEX IF NOT EXISTS idx_lessons_zoom_meeting_id
ON lessons(zoom_meeting_id);

-- Indice per trovare lezioni con errori
CREATE INDEX IF NOT EXISTS idx_lessons_zoom_error
ON lessons(zoom_error)
WHERE zoom_error IS NOT NULL;

-- Commenti per documentazione
COMMENT ON COLUMN lessons.zoom_meeting_id IS 'ID univoco meeting Zoom (es: 87654321098)';
COMMENT ON COLUMN lessons.zoom_link IS 'Link join per studenti (es: https://zoom.us/j/...)';
COMMENT ON COLUMN lessons.zoom_host_link IS 'Link start per docente (es: https://zoom.us/s/...)';
COMMENT ON COLUMN lessons.zoom_password IS 'Password meeting Zoom';
COMMENT ON COLUMN lessons.zoom_created_at IS 'Timestamp creazione meeting Zoom';
COMMENT ON COLUMN lessons.zoom_error IS 'Messaggio errore se creazione Zoom fallisce';
COMMENT ON COLUMN lessons.zoom_retry_count IS 'Numero tentativi creazione Zoom';
