-- Drop the cross-schema FK that blocks Prisma migrate
ALTER TABLE public."User" DROP CONSTRAINT IF EXISTS "User_id_fkey";

-- Trigger function + trigger on auth.users — only created when auth schema exists
-- (shadow database used by prisma migrate dev does not have auth schema)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
    CREATE OR REPLACE FUNCTION public.handle_auth_user_delete()
    RETURNS TRIGGER AS $fn$
    BEGIN
      DELETE FROM public."User" WHERE id = OLD.id;
      RETURN OLD;
    END;
    $fn$ LANGUAGE plpgsql SECURITY DEFINER;

    CREATE TRIGGER on_auth_user_deleted
      BEFORE DELETE ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_auth_user_delete();
  END IF;
END
$$;
