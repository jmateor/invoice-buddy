-- Dedupe user_roles: el bug en admin-create-user (upsert con onConflict
-- 'user_id,role' sobre una tabla con UNIQUE(user_id, role)) dejaba filas
-- duplicadas por usuario (p.ej. cajero + admin), lo que rompía
-- usePermissions.maybeSingle() y hacía que un admin creado desde el panel
-- se comportara como cajero.
--
-- El contrato de la app es UN rol por usuario. Esta migración deja exactamente
-- una fila por user_id, priorizando el rol de mayor privilegio:
--   admin > contador > supervisor > cajero
-- Los cajeros legítimos (fila única) no se ven afectados.

WITH ranked AS (
  SELECT
    id,
    user_id,
    role,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY CASE role
        WHEN 'admin' THEN 1
        WHEN 'contador' THEN 2
        WHEN 'supervisor' THEN 3
        WHEN 'cajero' THEN 4
        ELSE 5
      END
    ) AS rn
  FROM public.user_roles
)
DELETE FROM public.user_roles
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Índice único por user_id para garantizar un solo rol por usuario a futuro
-- y prevenir recursión del bug. Antes había UNIQUE(user_id, role); añadimos
-- UNIQUE(user_id) que es la restricción real del modelo de la app.
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_roles_user_id
  ON public.user_roles (user_id);