SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Enable extensions that are commonly available in Supabase
-- Note: Enable these in Supabase Dashboard > Database > Extensions first
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- These extensions may not be available or need special setup:
-- CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";
-- CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
-- CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
-- CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";
-- CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE OR REPLACE FUNCTION "public"."create_user_on_signup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$begin
    insert into public.profiles(id,email,display_name,image_url)
    values(
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data ->> 'user_name',new.raw_user_meta_data ->> 'name'),
      new.raw_user_meta_data ->> 'avatar_url'
    );
    insert into public.subscription(email)
    values(
      new.email
    );
    return new;
end;$$;

ALTER FUNCTION "public"."create_user_on_signup"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."is_sub_active"() RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$declare
  var_end_at date;

begin

  select end_at into var_end_at from public.subscription where email = auth.jwt() ->> 'email';

  return var_end_at > CURRENT_DATE;

end;$$;

ALTER FUNCTION "public"."is_sub_active"() OWNER TO "postgres";

SET default_tablespace = '';
SET default_table_access_method = "heap";

-- Create post table
CREATE TABLE IF NOT EXISTS "public"."post" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "text" "text"
);

ALTER TABLE "public"."post" OWNER TO "postgres";

-- Add primary key constraint only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'post_pkey' AND conrelid = 'public.post'::regclass
    ) THEN
        ALTER TABLE ONLY "public"."post"
            ADD CONSTRAINT "post_pkey" PRIMARY KEY ("id");
    END IF;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text" NOT NULL,
    "display_name" "text",
    "image_url" "text"
);

ALTER TABLE "public"."profiles" OWNER TO "postgres";

-- Add constraints to profiles only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_email_key' AND conrelid = 'public.profiles'::regclass
    ) THEN
        ALTER TABLE ONLY "public"."profiles"
            ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_pkey' AND conrelid = 'public.profiles'::regclass
    ) THEN
        ALTER TABLE ONLY "public"."profiles"
            ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id", "email");
    END IF;
END $$;

-- Create subscription table
CREATE TABLE IF NOT EXISTS "public"."subscription" (
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "customer_id" "text",
    "subscription_id" "text",
    "end_at" "date"
);

ALTER TABLE "public"."subscription" OWNER TO "postgres";

-- Add primary key constraint only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subscription_pkey' AND conrelid = 'public.subscription'::regclass
    ) THEN
        ALTER TABLE ONLY "public"."subscription"
            ADD CONSTRAINT "subscription_pkey" PRIMARY KEY ("email");
    END IF;
END $$;

-- Add foreign key constraints only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_id_fkey'
    ) THEN
        ALTER TABLE ONLY "public"."profiles"
            ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") 
            REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'public_subscription_email_fkey'
    ) THEN
        ALTER TABLE ONLY "public"."subscription"
            ADD CONSTRAINT "public_subscription_email_fkey" FOREIGN KEY ("email") 
            REFERENCES "public"."profiles"("email") ON UPDATE CASCADE ON DELETE CASCADE;
    END IF;
END $$;

-- Drop and recreate policies (idempotent)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."profiles";
CREATE POLICY "Enable insert for authenticated users only" 
ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."post";
CREATE POLICY "Enable read access for all users" 
ON "public"."post" FOR SELECT TO "authenticated" USING ("public"."is_sub_active"());

DROP POLICY IF EXISTS "Enable read for users based on email" ON "public"."subscription";
CREATE POLICY "Enable read for users based on email" 
ON "public"."subscription" FOR SELECT TO "authenticated" 
USING ((("auth"."jwt"() ->> 'email'::"text") = "email"));

ALTER TABLE "public"."post" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."subscription" ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."create_user_on_signup"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_on_signup"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_on_signup"() TO "service_role";

GRANT ALL ON FUNCTION "public"."is_sub_active"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_sub_active"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_sub_active"() TO "service_role";

GRANT ALL ON TABLE "public"."post" TO "anon";
GRANT ALL ON TABLE "public"."post" TO "authenticated";
GRANT ALL ON TABLE "public"."post" TO "service_role";

GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";

GRANT ALL ON TABLE "public"."subscription" TO "anon";
GRANT ALL ON TABLE "public"."subscription" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription" TO "service_role";

