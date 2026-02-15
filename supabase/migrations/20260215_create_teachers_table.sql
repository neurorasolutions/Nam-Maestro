-- Migration: Create Teachers Table
-- Description: Tabella per gestione anagrafiche docenti

-- =====================================================
-- TABELLA: teachers
-- =====================================================
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

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

    -- Dati Fiscali/Lavorativi
    iban TEXT,
    vat_number TEXT,
    hourly_rate DECIMAL(10,2),
    billing_mode TEXT,

    -- Didattica
    subjects_taught TEXT, -- Array separato da virgole

    -- Flags
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX idx_teachers_last_name ON teachers(last_name);
CREATE INDEX idx_teachers_first_name ON teachers(first_name);
CREATE INDEX idx_teachers_email ON teachers(email);
CREATE INDEX idx_teachers_is_active ON teachers(is_active);
CREATE INDEX idx_teachers_subjects ON teachers USING gin(to_tsvector('italian', COALESCE(subjects_taught, '')));

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_teachers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_teachers_timestamp
BEFORE UPDATE ON teachers
FOR EACH ROW
EXECUTE FUNCTION update_teachers_updated_at();

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Policy: tutti gli utenti autenticati possono vedere i docenti
CREATE POLICY "Allow all authenticated users to view teachers"
ON teachers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow all authenticated users to insert teachers"
ON teachers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to update teachers"
ON teachers FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow all authenticated users to delete teachers"
ON teachers FOR DELETE
TO authenticated
USING (true);

-- =====================================================
-- COMMENTI DOCUMENTAZIONE
-- =====================================================
COMMENT ON TABLE teachers IS 'Anagrafiche complete dei docenti NAM';
COMMENT ON COLUMN teachers.subjects_taught IS 'Materie insegnate separate da virgola';
COMMENT ON COLUMN teachers.hourly_rate IS 'Tariffa oraria lorda in euro';
COMMENT ON COLUMN teachers.billing_mode IS 'Modalità di fatturazione (ritenuta, P.IVA, ecc.)';
