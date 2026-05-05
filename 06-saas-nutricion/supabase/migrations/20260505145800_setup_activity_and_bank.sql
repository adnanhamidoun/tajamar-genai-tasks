-- 1. Crear tabla de actividades
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sport_type TEXT NOT NULL,
  duration_mins INTEGER NOT NULL,
  intensity TEXT NOT NULL,
  calories_burned INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Añadir columnas de saldo y auditoría a profiles (si no existen)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS flex_bank_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS audit_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 3. Habilitar RLS en activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de seguridad para activities
CREATE POLICY "Usuarios pueden ver sus propias actividades" 
ON activities FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propias actividades" 
ON activities FOR INSERT 
WITH CHECK (auth.uid() = user_id);
