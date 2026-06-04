-- ============================================================
-- CRIA O USUÁRIO ADMIN (trainer)
-- Rode DEPOIS do setup-supabase-novo.sql, no mesmo SQL Editor.
-- Login:  chrafaelfaria@chrafaelfaria.com.br
-- Senha:  Senha123@
-- O trigger on_auth_user_created cria profile + user_roles(role=trainer)
-- automaticamente, pois passamos role=trainer no raw_user_meta_data.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  v_email text := 'chrafaelfaria@chrafaelfaria.com.br';
  v_pass  text := 'Senha123@';
  v_uid   uuid := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change,
      email_change_token_new, reauthentication_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      v_email, extensions.crypt(v_pass, extensions.gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"role":"trainer","display_name":"Rafael Faria"}'::jsonb,
      '', '', '', '', ''
    );
  END IF;

  -- Garante papel trainer mesmo que o usuário já existisse como aluno
  UPDATE public.user_roles
     SET role = 'trainer'
   WHERE user_id = (SELECT id FROM auth.users WHERE email = v_email);

  INSERT INTO public.user_roles (user_id, role)
  SELECT id, 'trainer' FROM auth.users WHERE email = v_email
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

-- Confere o resultado:
SELECT u.email, r.role
FROM auth.users u
JOIN public.user_roles r ON r.user_id = u.id
WHERE u.email = 'chrafaelfaria@chrafaelfaria.com.br';
