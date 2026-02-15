-- Migration: Create Study Plans Tables
-- Description: Sistema di gestione piani di studio con calendarizzazione automatica

-- =====================================================
-- 1. TABELLA: study_plans
-- =====================================================
CREATE TABLE IF NOT EXISTS study_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    subcategory TEXT,
    is_active BOOLEAN DEFAULT true,
    total_hours INTEGER DEFAULT 0,
    total_individual_hours INTEGER DEFAULT 0,
    total_collective_hours INTEGER DEFAULT 0,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX idx_study_plans_category ON study_plans(category);
CREATE INDEX idx_study_plans_is_active ON study_plans(is_active);
CREATE INDEX idx_study_plans_created_at ON study_plans(created_at DESC);

-- =====================================================
-- 2. TABELLA: study_plan_subjects
-- =====================================================
CREATE TABLE IF NOT EXISTS study_plan_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    subject_name TEXT NOT NULL,
    subject_type TEXT NOT NULL CHECK (subject_type IN ('individual', 'collective')),
    total_hours INTEGER NOT NULL CHECK (total_hours > 0),
    teacher_name TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX idx_study_plan_subjects_plan_id ON study_plan_subjects(study_plan_id);
CREATE INDEX idx_study_plan_subjects_type ON study_plan_subjects(subject_type);
CREATE INDEX idx_study_plan_subjects_order ON study_plan_subjects(study_plan_id, order_index);

-- =====================================================
-- 3. TRIGGER: Calcolo automatico ore totali
-- =====================================================
CREATE OR REPLACE FUNCTION update_study_plan_hours()
RETURNS TRIGGER AS $$
BEGIN
    -- Ricalcola tutte le ore per il piano di studio
    UPDATE study_plans
    SET
        total_hours = (
            SELECT COALESCE(SUM(total_hours), 0)
            FROM study_plan_subjects
            WHERE study_plan_id = COALESCE(NEW.study_plan_id, OLD.study_plan_id)
        ),
        total_individual_hours = (
            SELECT COALESCE(SUM(total_hours), 0)
            FROM study_plan_subjects
            WHERE study_plan_id = COALESCE(NEW.study_plan_id, OLD.study_plan_id)
            AND subject_type = 'individual'
        ),
        total_collective_hours = (
            SELECT COALESCE(SUM(total_hours), 0)
            FROM study_plan_subjects
            WHERE study_plan_id = COALESCE(NEW.study_plan_id, OLD.study_plan_id)
            AND subject_type = 'collective'
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.study_plan_id, OLD.study_plan_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger su INSERT/UPDATE/DELETE delle materie
CREATE TRIGGER trigger_update_study_plan_hours_insert
AFTER INSERT ON study_plan_subjects
FOR EACH ROW
EXECUTE FUNCTION update_study_plan_hours();

CREATE TRIGGER trigger_update_study_plan_hours_update
AFTER UPDATE ON study_plan_subjects
FOR EACH ROW
EXECUTE FUNCTION update_study_plan_hours();

CREATE TRIGGER trigger_update_study_plan_hours_delete
AFTER DELETE ON study_plan_subjects
FOR EACH ROW
EXECUTE FUNCTION update_study_plan_hours();

-- =====================================================
-- 4. MODIFICA TABELLA students
-- =====================================================
-- Aggiungi colonna study_plan_id per collegare studenti ai nuovi piani
ALTER TABLE students
ADD COLUMN IF NOT EXISTS study_plan_id UUID REFERENCES study_plans(id) ON DELETE SET NULL;

-- Indice per performance
CREATE INDEX IF NOT EXISTS idx_students_study_plan_id ON students(study_plan_id);

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

-- Abilita RLS sulle nuove tabelle
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plan_subjects ENABLE ROW LEVEL SECURITY;

-- Policy per study_plans: tutti gli utenti autenticati possono vedere/creare/modificare
CREATE POLICY "Allow all authenticated users to view study plans"
ON study_plans FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow all authenticated users to insert study plans"
ON study_plans FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to update study plans"
ON study_plans FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow all authenticated users to delete study plans"
ON study_plans FOR DELETE
TO authenticated
USING (true);

-- Policy per study_plan_subjects: tutti gli utenti autenticati possono vedere/creare/modificare
CREATE POLICY "Allow all authenticated users to view study plan subjects"
ON study_plan_subjects FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow all authenticated users to insert study plan subjects"
ON study_plan_subjects FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to update study plan subjects"
ON study_plan_subjects FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow all authenticated users to delete study plan subjects"
ON study_plan_subjects FOR DELETE
TO authenticated
USING (true);

-- =====================================================
-- 6. COMMENTI DOCUMENTAZIONE
-- =====================================================

COMMENT ON TABLE study_plans IS 'Piani di studio creati dalla segreteria con materie individuali/collettive';
COMMENT ON TABLE study_plan_subjects IS 'Materie associate a ciascun piano di studio';
COMMENT ON COLUMN study_plans.total_hours IS 'Ore totali calcolate automaticamente dal trigger';
COMMENT ON COLUMN study_plans.total_individual_hours IS 'Ore individuali calcolate automaticamente dal trigger';
COMMENT ON COLUMN study_plans.total_collective_hours IS 'Ore collettive calcolate automaticamente dal trigger';
COMMENT ON COLUMN study_plan_subjects.subject_type IS 'Tipo materia: individual o collective';
COMMENT ON COLUMN study_plan_subjects.order_index IS 'Ordinamento materie nel piano';
COMMENT ON COLUMN students.study_plan_id IS 'Collegamento opzionale ai nuovi piani di studio (retrocompatibilità con enrolled_course)';
