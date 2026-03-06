-- Agregar rol 'supervisor' al enum 'app_role'
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supervisor';

-- Modificar el trigger handle_new_user para que el rol predeterminado sea 'cajero',
-- pero si viene el rol en raw_user_meta_data, lo use (ideal para creación desde panel de admin).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role;
BEGIN
  INSERT INTO public.profiles (user_id, nombre, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre', ''), NEW.email);
  
  -- Intentar obtener el rol de los metadatos. Si no es válido o no existe, usar 'cajero' por defecto.
  BEGIN
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'cajero')::app_role;
  EXCEPTION WHEN OTHERS THEN
    v_role := 'cajero'::app_role;
  END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role);
  
  RETURN NEW;
END;
$$;
