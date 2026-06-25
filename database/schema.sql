-- SQL Schema for Elder Navigator
-- Prepared for Supabase / PostgreSQL database design (Phase 2 and beyond)

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES TABLE
-- Stores the basic emergency and medical information of the elder.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    age INT CHECK (age >= 0 AND age <= 130),
    blood_group VARCHAR(10), -- e.g., A+, O-, B+
    allergies TEXT,          -- comma-separated or free text description of allergies
    conditions TEXT,         -- chronic illnesses / current medical conditions
    insurance_policy VARCHAR(255),
    insurance_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- EMERGENCY CONTACTS TABLE
-- Stores emergency contacts associated with each elder's profile.
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100) NOT NULL, -- e.g., Son, Daughter, Spouse, Neighbor
    phone_number VARCHAR(20) NOT NULL,
    priority INT DEFAULT 1,             -- 1 = primary, 2 = secondary, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- MEDICATIONS TABLE
-- Stores the medication list for the elder.
CREATE TABLE IF NOT EXISTS public.medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,         -- Medication name (e.g., Metformin)
    dosage VARCHAR(100) NOT NULL,       -- Dosage (e.g., 500mg, 1 tablet)
    frequency VARCHAR(100) NOT NULL,    -- Frequency (e.g., Twice a day, Once in morning)
    instructions TEXT,                  -- Optional special instructions (e.g., After meals)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- TRIGGER FOR UPDATING updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ROW LEVEL SECURITY (RLS) POLICIES (Prepared for multi-user authentication in Phase 3)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be defined in Phase 3 when Supabase Auth is integrated.
-- For local usage in Phase 1, we save all states in HTML5 LocalStorage on the client device.
