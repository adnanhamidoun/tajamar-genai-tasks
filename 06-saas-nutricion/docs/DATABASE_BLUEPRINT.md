# DATABASE_BLUEPRINT.md
# NutriSnap AI — Blueprint Completo de Base de Datos

> **Motor:** PostgreSQL via Supabase  
> **Seguridad:** Row Level Security (RLS) habilitada en todas las tablas  
> **Audiencia:** Agentes de código. Ejecutar en el SQL Editor de Supabase en el orden exacto presentado.

---

## 1. DIAGRAMA ENTIDAD-RELACIÓN

```
┌─────────────────────────────────┐
│          auth.users              │  ← Gestionado por Supabase Auth
│  id (uuid) PK                   │
│  email                          │
│  raw_user_meta_data (jsonb)      │
└─────────────────┬───────────────┘
                  │ 1:1 (trigger automático)
                  ▼
┌─────────────────────────────────┐
│           public.profiles        │
│  id (uuid) PK, FK → auth.users  │
│  full_name (text)                │
│  target_calories (int)           │
│  current_weight (float)          │
│  fitness_goal (text)             │
│  daily_goal_protein (float)      │
│  daily_goal_carbs (float)        │
│  daily_goal_fat (float)          │
│  updated_at (timestamptz)        │
└────────┬──────────────┬─────────┘
         │              │
         │ 1:N          │ 1:N
         ▼              ▼
┌─────────────────┐  ┌──────────────────────────┐
│  public.meals   │  │   public.activities       │
│  id (uuid) PK   │  │  id (uuid) PK             │
│  user_id FK     │  │  user_id FK               │
│  food_name      │  │  activity_type (text)     │
│  calories (int) │  │  duration_min (int)       │
│  protein (float)│  │  calories_burned (int)    │
│  carbs (float)  │  │  intensity (text)         │
│  fat (float)    │  │  created_at (timestamptz) │
│  image_url      │  └──────────────────────────┘
│  health_tip     │
│  created_at     │
└─────────────────┘
```

---

## 2. ESQUEMA SQL COMPLETO

> ⚠️ **INSTRUCCIÓN PARA AGENTES:** Ejecutar este script completo en el SQL Editor de Supabase (`Database → SQL Editor → New query`). El orden es crítico. No alterar la secuencia.

```sql
-- ##########################################################
-- NUTRISNAP AI — DATABASE SCHEMA v1.0.0
-- Ejecutar completo en Supabase SQL Editor
-- ##########################################################

-- ==========================================
-- SECCIÓN 1: EXTENSIONES
-- ==========================================
-- Habilita la generación de UUIDs automáticos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- SECCIÓN 2: TABLA PROFILES
-- ==========================================
-- Almacena datos personales y objetivos nutricionales.
-- Tiene relación 1:1 con auth.users (mismo id).
-- Se crea automáticamente al registrarse (ver trigger, sección 6).

CREATE TABLE public.profiles (
  -- PK que referencia a auth.users para garantizar integridad con el sistema de auth
  id                  uuid        REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at          timestamptz DEFAULT now(),
  full_name           text,
  avatar_url          text,                      -- URL de foto de perfil (Supabase Storage)
  target_calories     int         DEFAULT 2000,  -- Objetivo calórico diario (kcal)
  current_weight      float,                     -- Peso en kg
  fitness_goal        text        CHECK (fitness_goal IN ('lose', 'maintain', 'gain')),
  daily_goal_protein  float       DEFAULT 0,     -- Gramos de proteína objetivo/día
  daily_goal_carbs    float       DEFAULT 0,     -- Gramos de carbohidratos objetivo/día
  daily_goal_fat      float       DEFAULT 0,     -- Gramos de grasa objetivo/día
  onboarding_complete boolean     DEFAULT false  -- Flag para controlar el wizard de onboarding
);

-- Comentario de tabla para documentación
COMMENT ON TABLE public.profiles IS 'Perfil del usuario con objetivos nutricionales. Relación 1:1 con auth.users.';
COMMENT ON COLUMN public.profiles.fitness_goal IS 'Objetivo: lose=perder peso, maintain=mantener, gain=ganar músculo';
COMMENT ON COLUMN public.profiles.onboarding_complete IS 'True cuando el usuario completó el wizard inicial';

-- ==========================================
-- SECCIÓN 3: TABLA MEALS
-- ==========================================
-- Registro de comidas analizadas por la IA.
-- Cada fila representa un análisis confirmado por el usuario.

CREATE TABLE public.meals (
  id          uuid        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     uuid        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at  timestamptz DEFAULT now(),
  food_name   text        NOT NULL,               -- Nombre del plato detectado por IA
  calories    int         NOT NULL CHECK (calories >= 0),
  protein     float       DEFAULT 0 CHECK (protein >= 0),    -- Gramos
  carbs       float       DEFAULT 0 CHECK (carbs >= 0),      -- Gramos
  fat         float       DEFAULT 0 CHECK (fat >= 0),        -- Gramos
  image_url   text,                               -- URL pública en Supabase Storage (nullable)
  health_tip  text,                               -- Consejo generado por el coach IA
  meal_type   text        CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'other'))
                          DEFAULT 'other'         -- Tipo de comida para agrupación
);

COMMENT ON TABLE public.meals IS 'Registro de comidas analizadas por la IA y confirmadas por el usuario.';
COMMENT ON COLUMN public.meals.image_url IS 'URL pública de la foto en Supabase Storage. NULL si el usuario no guardó la imagen.';
COMMENT ON COLUMN public.meals.health_tip IS 'Consejo personalizado generado por GPT-4o basado en los goals del usuario.';

-- ==========================================
-- SECCIÓN 4: TABLA ACTIVITIES
-- ==========================================
-- Registro de actividades físicas para calcular balance calórico neto.

CREATE TABLE public.activities (
  id              uuid        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         uuid        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at      timestamptz DEFAULT now(),
  activity_type   text        NOT NULL,           -- Ej: 'running', 'gym', 'yoga', 'cycling'
  duration_min    int         NOT NULL CHECK (duration_min > 0),
  calories_burned int         DEFAULT 0 CHECK (calories_burned >= 0),
  intensity       text        CHECK (intensity IN ('low', 'medium', 'high')) DEFAULT 'medium',
  notes           text                            -- Campo libre para notas del usuario
);

COMMENT ON TABLE public.activities IS 'Registro de entrenamientos y actividad física del usuario.';
COMMENT ON COLUMN public.activities.calories_burned IS 'Calculado automáticamente en frontend: MET * peso_kg * (duracion_min / 60)';

-- ==========================================
-- SECCIÓN 5: ÍNDICES DE RENDIMIENTO
-- ==========================================
-- Optimiza las queries más frecuentes (listado por usuario + fecha)

-- Índice para filtrar meals por usuario y fecha (query del dashboard)
CREATE INDEX idx_meals_user_id_created_at
  ON public.meals(user_id, created_at DESC);

-- Índice para filtrar activities por usuario y fecha
CREATE INDEX idx_activities_user_id_created_at
  ON public.activities(user_id, created_at DESC);

-- Índice parcial para meals de hoy (query más frecuente)
CREATE INDEX idx_meals_today
  ON public.meals(user_id, created_at)
  WHERE created_at >= CURRENT_DATE;

-- ==========================================
-- SECCIÓN 6: ROW LEVEL SECURITY (RLS)
-- ==========================================
-- CRÍTICO: Garantiza que cada usuario SOLO puede ver y modificar sus propios datos.
-- Sin esto, cualquier usuario autenticado podría leer datos de otros.

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- ----- POLÍTICAS PARA: profiles -----

CREATE POLICY "profiles: SELECT propio"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: UPDATE propio"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT lo maneja el trigger automáticamente (no necesita política de usuario)
-- Si se desea permitir INSERT manual también:
CREATE POLICY "profiles: INSERT propio"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ----- POLÍTICAS PARA: meals -----

CREATE POLICY "meals: SELECT propias"
  ON public.meals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "meals: INSERT propias"
  ON public.meals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meals: UPDATE propias"
  ON public.meals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meals: DELETE propias"
  ON public.meals
  FOR DELETE
  USING (auth.uid() = user_id);

-- ----- POLÍTICAS PARA: activities -----

CREATE POLICY "activities: SELECT propias"
  ON public.activities
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "activities: INSERT propias"
  ON public.activities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "activities: UPDATE propias"
  ON public.activities
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "activities: DELETE propias"
  ON public.activities
  FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- SECCIÓN 7: TRIGGER — CREACIÓN AUTOMÁTICA DE PERFIL
-- ==========================================
-- Cuando un usuario se registra en Supabase Auth,
-- este trigger crea automáticamente una fila en public.profiles.
-- Garantiza que no existe usuario sin perfil.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER                  -- Se ejecuta con permisos de superuser
SET search_path = public          -- Previene ataques de search_path injection
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    -- El email se extrae de los metadatos del registro
    -- full_name viene del campo que enviamos en signUp({ data: { full_name: '...' } })
    onboarding_complete
  )
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)  -- Fallback: usar parte del email como nombre
    ),
    false
  );
  RETURN new;
END;
$$;

-- Crear el trigger que llama a la función después de cada INSERT en auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- SECCIÓN 8: TRIGGER — AUTO-UPDATE updated_at
-- ==========================================
-- Actualiza automáticamente el campo updated_at en profiles
-- cada vez que se modifica una fila.

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- ==========================================
-- SECCIÓN 9: STORAGE — Bucket para imágenes
-- ==========================================
-- Ejecutar en Supabase Storage (o via SQL)

INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-images', 'meal-images', true)
ON CONFLICT (id) DO NOTHING;

-- Política: usuarios autenticados pueden subir sus propias imágenes
CREATE POLICY "meal-images: upload propio"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'meal-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política: cualquiera puede ver imágenes (bucket público)
CREATE POLICY "meal-images: lectura pública"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'meal-images');

-- Política: usuarios solo pueden borrar sus propias imágenes
CREATE POLICY "meal-images: delete propio"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'meal-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## 3. QUERIES FRECUENTES (REFERENCIA RÁPIDA)

### 3.1 Dashboard — Macros de Hoy

```sql
-- Suma de macros de hoy para un usuario específico
SELECT
  COALESCE(SUM(calories), 0)   AS total_calories,
  COALESCE(SUM(protein), 0)    AS total_protein,
  COALESCE(SUM(carbs), 0)      AS total_carbs,
  COALESCE(SUM(fat), 0)        AS total_fat,
  COUNT(*)                      AS meal_count
FROM public.meals
WHERE
  user_id = auth.uid() AND
  created_at::date = CURRENT_DATE;
```

### 3.2 Dashboard — Calorías Quemadas Hoy

```sql
SELECT COALESCE(SUM(calories_burned), 0) AS total_burned
FROM public.activities
WHERE
  user_id = auth.uid() AND
  created_at::date = CURRENT_DATE;
```

### 3.3 Historial — Comidas de los Últimos 7 Días

```sql
SELECT
  created_at::date AS day,
  SUM(calories)    AS daily_calories,
  COUNT(*)         AS meal_count
FROM public.meals
WHERE
  user_id = auth.uid() AND
  created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY created_at::date
ORDER BY day DESC;
```

### 3.4 Perfil Completo con Balance de Hoy

```sql
SELECT
  p.*,
  COALESCE(m.today_calories, 0)   AS today_calories,
  COALESCE(m.today_protein, 0)    AS today_protein,
  COALESCE(m.today_carbs, 0)      AS today_carbs,
  COALESCE(m.today_fat, 0)        AS today_fat,
  COALESCE(a.today_burned, 0)     AS today_burned
FROM public.profiles p
LEFT JOIN (
  SELECT
    user_id,
    SUM(calories) AS today_calories,
    SUM(protein)  AS today_protein,
    SUM(carbs)    AS today_carbs,
    SUM(fat)      AS today_fat
  FROM public.meals
  WHERE created_at::date = CURRENT_DATE
  GROUP BY user_id
) m ON m.user_id = p.id
LEFT JOIN (
  SELECT user_id, SUM(calories_burned) AS today_burned
  FROM public.activities
  WHERE created_at::date = CURRENT_DATE
  GROUP BY user_id
) a ON a.user_id = p.id
WHERE p.id = auth.uid();
```

---

## 4. ESTRUCTURA DE PATHS EN SUPABASE STORAGE

Las imágenes deben guardarse siguiendo esta convención para que las políticas de RLS del storage funcionen correctamente:

```
meal-images/
  └── {user_id}/
        └── {meal_id}_{timestamp}.jpg

# Ejemplo real:
meal-images/
  └── 550e8400-e29b-41d4-a716-446655440000/
        └── 7c9e6679-7425-40de-944b-e07fc1f90ae7_1704067200000.jpg
```

**URL pública de la imagen:**
```
https://{SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/meal-images/{user_id}/{filename}
```

---

## 5. TIPOS TYPESCRIPT DE LA BASE DE DATOS

> Este bloque es generado por `supabase gen types`. Se incluye aquí como referencia. En producción, usar siempre el generado por el CLI.

```typescript
// src/types/database.types.ts (referencia manual — usar CLI en producción)

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          full_name: string | null
          avatar_url: string | null
          target_calories: number | null
          current_weight: number | null
          fitness_goal: 'lose' | 'maintain' | 'gain' | null
          daily_goal_protein: number | null
          daily_goal_carbs: number | null
          daily_goal_fat: number | null
          onboarding_complete: boolean
        }
        Insert: {
          id: string
          updated_at?: string | null
          full_name?: string | null
          avatar_url?: string | null
          target_calories?: number | null
          current_weight?: number | null
          fitness_goal?: 'lose' | 'maintain' | 'gain' | null
          daily_goal_protein?: number | null
          daily_goal_carbs?: number | null
          daily_goal_fat?: number | null
          onboarding_complete?: boolean
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      meals: {
        Row: {
          id: string
          user_id: string
          created_at: string
          food_name: string
          calories: number
          protein: number
          carbs: number
          fat: number
          image_url: string | null
          health_tip: string | null
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other'
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          food_name: string
          calories: number
          protein?: number
          carbs?: number
          fat?: number
          image_url?: string | null
          health_tip?: string | null
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other'
        }
        Update: Partial<Database['public']['Tables']['meals']['Insert']>
      }
      activities: {
        Row: {
          id: string
          user_id: string
          created_at: string
          activity_type: string
          duration_min: number
          calories_burned: number
          intensity: 'low' | 'medium' | 'high'
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          activity_type: string
          duration_min: number
          calories_burned?: number
          intensity?: 'low' | 'medium' | 'high'
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['activities']['Insert']>
      }
    }
  }
}
```

---

## 6. CHECKLIST DE CONFIGURACIÓN DE SUPABASE

| Paso | Acción | Estado |
|------|--------|--------|
| 1 | Crear proyecto en supabase.com | ⬜ |
| 2 | Copiar `SUPABASE_URL` y `ANON_KEY` al `.env.local` | ⬜ |
| 3 | Ejecutar script SQL completo de la Sección 2 | ⬜ |
| 4 | Verificar que el trigger aparece en `Database → Functions` | ⬜ |
| 5 | Verificar que RLS está activo en las 3 tablas | ⬜ |
| 6 | Crear el bucket `meal-images` con visibilidad pública | ⬜ |
| 7 | Verificar políticas de storage creadas | ⬜ |
| 8 | Configurar Email Templates en `Authentication → Email Templates` | ⬜ |
| 9 | Ejecutar `npx supabase gen types typescript --linked > src/types/database.types.ts` | ⬜ |
| 10 | Registrar usuario de prueba y verificar que se crea su fila en `profiles` | ⬜ |

---

*Siguiente documento: [AGILE_BACKLOG.md](./AGILE_BACKLOG.md)*
