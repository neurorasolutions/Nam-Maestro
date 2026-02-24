-- =====================================================
-- TRIGGER 1: Sincronizzazione automatica modifiche Zoom
-- =====================================================

CREATE OR REPLACE FUNCTION sync_zoom_meeting_update()
RETURNS TRIGGER AS $$
DECLARE
  response_status INT;
  response_body TEXT;
BEGIN
  -- Se la lezione è ibrida E ha un meeting Zoom E sono cambiati data/orario/titolo
  IF NEW.is_hybrid = true
     AND NEW.zoom_meeting_id IS NOT NULL
     AND (
       NEW.lesson_date IS DISTINCT FROM OLD.lesson_date
       OR NEW.start_time IS DISTINCT FROM OLD.start_time
       OR NEW.end_time IS DISTINCT FROM OLD.end_time
       OR NEW.title IS DISTINCT FROM OLD.title
       OR NEW.teacher_name IS DISTINCT FROM OLD.teacher_name
     ) THEN

    -- Log della modifica
    RAISE NOTICE 'Syncing Zoom meeting % for lesson %', NEW.zoom_meeting_id, NEW.id;

    -- Chiama Edge Function per aggiornare Zoom (in modo asincrono con pg_net)
    SELECT status, content INTO response_status, response_body
    FROM http((
      'POST',
      current_setting('app.supabase_url') || '/functions/v1/update-zoom-meeting',
      ARRAY[
        http_header('Content-Type', 'application/json'),
        http_header('Authorization', 'Bearer ' || current_setting('app.service_role_key'))
      ],
      'application/json',
      jsonb_build_object(
        'meeting_id', NEW.zoom_meeting_id,
        'lesson_date', NEW.lesson_date::TEXT,
        'start_time', NEW.start_time::TEXT,
        'end_time', NEW.end_time::TEXT,
        'title', NEW.title,
        'teacher_name', NEW.teacher_name
      )::TEXT
    )::http_request);

    -- Log del risultato (opzionale, per debug)
    IF response_status != 200 THEN
      RAISE WARNING 'Zoom sync failed with status %: %', response_status, response_body;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crea il trigger
DROP TRIGGER IF EXISTS trigger_sync_zoom_update ON lessons;
CREATE TRIGGER trigger_sync_zoom_update
AFTER UPDATE ON lessons
FOR EACH ROW
EXECUTE FUNCTION sync_zoom_meeting_update();

-- =====================================================
-- TRIGGER 2: Cancellazione automatica meeting Zoom
-- =====================================================

CREATE OR REPLACE FUNCTION delete_zoom_meeting()
RETURNS TRIGGER AS $$
DECLARE
  response_status INT;
  response_body TEXT;
BEGIN
  -- Se la lezione aveva un meeting Zoom, cancellalo
  IF OLD.zoom_meeting_id IS NOT NULL THEN

    -- Log della cancellazione
    RAISE NOTICE 'Deleting Zoom meeting % for lesson %', OLD.zoom_meeting_id, OLD.id;

    -- Chiama Edge Function per cancellare meeting Zoom
    SELECT status, content INTO response_status, response_body
    FROM http((
      'POST',
      current_setting('app.supabase_url') || '/functions/v1/delete-zoom-meeting',
      ARRAY[
        http_header('Content-Type', 'application/json'),
        http_header('Authorization', 'Bearer ' || current_setting('app.service_role_key'))
      ],
      'application/json',
      jsonb_build_object(
        'meeting_id', OLD.zoom_meeting_id
      )::TEXT
    )::http_request);

    -- Log del risultato (opzionale, per debug)
    IF response_status != 200 THEN
      RAISE WARNING 'Zoom deletion failed with status %: %', response_status, response_body;
    END IF;

  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crea il trigger
DROP TRIGGER IF EXISTS trigger_delete_zoom_meeting ON lessons;
CREATE TRIGGER trigger_delete_zoom_meeting
BEFORE DELETE ON lessons
FOR EACH ROW
EXECUTE FUNCTION delete_zoom_meeting();

-- =====================================================
-- Impostazioni necessarie per i trigger
-- =====================================================

-- Questi settings devono essere configurati per permettere ai trigger di chiamare le Edge Functions
-- Verranno impostati automaticamente da Supabase quando si usano le funzioni

COMMENT ON FUNCTION sync_zoom_meeting_update() IS 'Sincronizza automaticamente le modifiche di data/orario con Zoom';
COMMENT ON FUNCTION delete_zoom_meeting() IS 'Cancella automaticamente il meeting Zoom quando si elimina una lezione';
