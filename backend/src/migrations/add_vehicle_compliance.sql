-- ============================================
-- ✅ FIXED MIGRATION - No enum conversion issues
-- ============================================

-- 1. Add columns if they don't exist (with proper defaults)
DO $$ 
BEGIN
    -- Add registration_number
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vehicles' AND column_name = 'registration_number') THEN
        ALTER TABLE vehicles ADD COLUMN registration_number VARCHAR(50);
    END IF;

    -- Add chassis_number
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vehicles' AND column_name = 'chassis_number') THEN
        ALTER TABLE vehicles ADD COLUMN chassis_number VARCHAR(50);
    END IF;

    -- Add engine_number
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vehicles' AND column_name = 'engine_number') THEN
        ALTER TABLE vehicles ADD COLUMN engine_number VARCHAR(50);
    END IF;

    -- Add mileage
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vehicles' AND column_name = 'mileage') THEN
        ALTER TABLE vehicles ADD COLUMN mileage INTEGER;
    END IF;

    -- Add inspection_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vehicles' AND column_name = 'inspection_date') THEN
        ALTER TABLE vehicles ADD COLUMN inspection_date DATE;
    END IF;

    -- Add inspection_notes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vehicles' AND column_name = 'inspection_notes') THEN
        ALTER TABLE vehicles ADD COLUMN inspection_notes TEXT;
    END IF;

    -- ✅ Add compliance_status as VARCHAR (NOT ENUM)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vehicles' AND column_name = 'compliance_status') THEN
        ALTER TABLE vehicles ADD COLUMN compliance_status VARCHAR(50) DEFAULT 'pending';
    END IF;

    -- Add compliance_notes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vehicles' AND column_name = 'compliance_notes') THEN
        ALTER TABLE vehicles ADD COLUMN compliance_notes TEXT;
    END IF;

    -- Add last_compliance_check
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vehicles' AND column_name = 'last_compliance_check') THEN
        ALTER TABLE vehicles ADD COLUMN last_compliance_check TIMESTAMP;
    END IF;

END $$;

-- ============================================
-- ✅ Documents Table Updates
-- ============================================

DO $$ 
BEGIN
    -- Add expiry_date to documents
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'documents' AND column_name = 'expiry_date') THEN
        ALTER TABLE documents ADD COLUMN expiry_date DATE;
    END IF;

    -- Add is_active to documents
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'documents' AND column_name = 'is_active') THEN
        ALTER TABLE documents ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

END $$;

-- ============================================
-- ✅ Update existing records with default values
-- ============================================

-- Set default compliance_status for existing vehicles
UPDATE vehicles 
SET compliance_status = 'pending' 
WHERE compliance_status IS NULL;

-- Set default is_active for existing documents
UPDATE documents 
SET is_active = true 
WHERE is_active IS NULL;

-- ============================================
-- ✅ Create Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_vehicles_compliance_status 
ON vehicles(compliance_status);

CREATE INDEX IF NOT EXISTS idx_vehicles_registration 
ON vehicles(registration_number);

CREATE INDEX IF NOT EXISTS idx_documents_expiry_date 
ON documents(expiry_date);

CREATE INDEX IF NOT EXISTS idx_documents_active 
ON documents(is_active) WHERE is_active = true;

-- ============================================
-- ✅ Update Compliance Service to use VARCHAR
-- ============================================

-- Update existing vehicles with proper status
UPDATE vehicles 
SET compliance_status = 'blocked' 
WHERE status != 'approved';

UPDATE vehicles 
SET compliance_status = 'rental_ready' 
WHERE status = 'approved' 
AND compliance_status = 'pending';

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE '✅ Vehicle compliance migration completed successfully';
END $$;