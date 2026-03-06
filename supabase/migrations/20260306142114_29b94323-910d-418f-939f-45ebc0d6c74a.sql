-- Add active status and deactivation date to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fecha_desactivacion timestamp with time zone DEFAULT NULL;