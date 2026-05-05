-- ##########################################
-- 1. LIMPIEZA (Opcional, por si quieres empezar de cero)
-- ##########################################
-- DROP TABLE IF EXISTS public.activities;
-- DROP TABLE IF EXISTS public.meals;
-- DROP TABLE IF EXISTS public.profiles;

-- ##########################################
-- 2. EXTENSIONES
-- ##########################################
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ##########################################
-- 3. TABLA: PROFILES
-- ##########################################
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at timestamp WITH TIME ZONE DEFAULT now(),
  full_name text,
  target_calories int DEFAULT 2000,
  current_weight float,
  fitness_goal text, -- 'lose', 'gain', 'maintain'
  daily_goal_protein float,
  daily_goal_carbs float,
  daily_goal_fat float
);

-- ##########################################
-- 4. TABLA: MEALS (Incluye la columna meal_type)
-- ##########################################
CREATE TABLE public.meals (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp WITH TIME ZONE DEFAULT now(),
  food_name text NOT NULL,
  calories int NOT NULL,
  protein float DEFAULT 0,
  carbs float DEFAULT 0,
  fat float DEFAULT 0,
  meal_type text DEFAULT 'snack', -- 'breakfast', 'lunch', 'dinner', 'snack'
  image_url text, 
  health_tip text 
);

-- ##########################################
-- 5. TABLA: ACTIVITIES
-- ##########################################
CREATE TABLE public.activities (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp WITH TIME ZONE DEFAULT now(),
  activity_type text NOT NULL, 
  duration_min int NOT NULL,
  calories_burned int DEFAULT 0,
  intensity text -- 'low', 'medium', 'high'
);

-- ##########################################
-- 6. SEGURIDAD (RLS)
-- ##########################################
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Políticas Profiles
CREATE POLICY "Profiles: view own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles: update own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas Meals
CREATE POLICY "Meals: view own" ON public.meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Meals: insert own" ON public.meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Meals: delete own" ON public.meals FOR DELETE USING (auth.uid() = user_id);

-- Políticas Activities
CREATE POLICY "Activities: view own" ON public.activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Activities: insert own" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ##########################################
-- 7. TRIGGERS AUTOMÁTICOS
-- ##########################################

-- A. Crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- B. Auto-confirmar email (Solo para desarrollo/comodidad)
CREATE OR REPLACE FUNCTION public.force_confirm_user() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at := now();
  NEW.confirmed_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_force_confirm_user ON auth.users;
CREATE TRIGGER tr_force_confirm_user
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.force_confirm_user();