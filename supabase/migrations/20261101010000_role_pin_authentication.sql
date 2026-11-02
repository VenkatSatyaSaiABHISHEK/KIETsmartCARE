-- ============================================================================
-- Migration: 20261101010000_role_pin_authentication.sql
-- Role-based PIN authentication, rate limiting, and access credential management
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.access_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('doctor', 'officer', 'admin')),
    pin_hash TEXT NOT NULL,
    pin_length INTEGER NOT NULL CHECK (pin_length IN (5, 8)),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('doctor', 'officer', 'admin')),
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    success BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_access_credentials_role_active 
    ON public.access_credentials(role, is_active);

CREATE INDEX IF NOT EXISTS idx_login_attempts_rate_limit 
    ON public.login_attempts(ip_address, role, attempted_at);

-- Row Level Security
ALTER TABLE public.access_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Service role bypass for server action / API execution
CREATE POLICY service_role_access_credentials ON public.access_credentials
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_login_attempts ON public.login_attempts
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Admin read/write policy for credentials
CREATE POLICY admin_manage_credentials ON public.access_credentials
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Insert initial seeds if empty
INSERT INTO public.access_credentials (name, role, pin_hash, pin_length, is_active)
SELECT 'Master Administrator', 'admin', '$2b$10$btORtiHoQd93x5Hoe5RwJ.CKWODh./OR5k6mhqOHtrr1MXEkEbStO', 8, true
WHERE NOT EXISTS (SELECT 1 FROM public.access_credentials WHERE role = 'admin');

INSERT INTO public.access_credentials (name, role, pin_hash, pin_length, is_active)
SELECT 'Dr. Alok Verma (OPD Clinic)', 'doctor', '$2b$10$uQdPG1wR984/n9CRcPoOEuxKPSbLgByXsRdfdmqKZb0McpRELz/jC', 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.access_credentials WHERE role = 'doctor');

INSERT INTO public.access_credentials (name, role, pin_hash, pin_length, is_active)
SELECT 'Health Officer Sharma', 'officer', '$2b$10$uQdPG1wR984/n9CRcPoOEuxKPSbLgByXsRdfdmqKZb0McpRELz/jC', 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.access_credentials WHERE role = 'officer');

