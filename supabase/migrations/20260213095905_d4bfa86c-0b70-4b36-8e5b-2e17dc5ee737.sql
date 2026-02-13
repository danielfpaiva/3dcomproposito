
-- Update the trigger function to also assign admin role to danielfonsecapaiva@gmail.com
CREATE OR REPLACE FUNCTION public.assign_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF LOWER(NEW.email) IN ('sempnaproa@gmail.com', 'danielfonsecapaiva@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- Also insert admin role if user already exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE LOWER(email) = 'danielfonsecapaiva@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
