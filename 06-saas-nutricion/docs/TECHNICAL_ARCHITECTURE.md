# TECHNICAL_ARCHITECTURE.md
# NutriSnap AI — Arquitectura Técnica Completa

> **Versión:** 1.0.0 | **Stack:** Next.js 14+ · Azure OpenAI · Supabase · Tailwind + Shadcn/UI  
> **Audiencia:** Agentes de código (Cursor/Copilot). Este documento es suficiente para implementar sin preguntas adicionales.

---

## 1. CONFIGURACIÓN DEL ENTORNO

### 1.1 Archivo `.env.local` (Completo y Verificado)

```bash
# ============================================================
# SUPABASE — Backend, Auth y Base de Datos
# ============================================================
# Obtenidos en: https://supabase.com/dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxx

# Solo para operaciones server-side privilegiadas (NO exponer al cliente)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxx

# ============================================================
# AZURE OPENAI — Motor de Visión y Análisis IA
# ============================================================
# Obtenidos en: Azure Portal → tu recurso OpenAI → Keys and Endpoint
AZURE_OPENAI_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AZURE_OPENAI_ENDPOINT=https://tu-recurso.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-02-01
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini-1

# ============================================================
# NEXT.JS — Configuración de la aplicación
# ============================================================
NEXTAUTH_URL=http://localhost:3000          # Cambiar a dominio en producción
NEXTAUTH_SECRET=genera-con-openssl-rand-hex-32  # openssl rand -hex 32

# ============================================================
# SUPABASE STORAGE — Para guardar imágenes de comidas
# ============================================================
# El bucket se crea desde el dashboard de Supabase
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=meal-images
```

> ⚠️ **REGLA CRÍTICA:** Solo las variables con prefijo `NEXT_PUBLIC_` son accesibles en el cliente. `AZURE_OPENAI_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY` NUNCA deben exponerse al navegador.

### 1.2 Inicialización del Proyecto

```bash
# Crear proyecto Next.js 14 con App Router
npx create-next-app@latest nutrisnap-ai \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd nutrisnap-ai

# Instalar dependencias core
npm install @supabase/supabase-js @supabase/ssr
npm install openai                          # SDK oficial Azure/OpenAI compatible
npm install @radix-ui/react-dialog @radix-ui/react-progress @radix-ui/react-tabs
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react                    # Iconos
npm install recharts                        # Gráficas del dashboard
npm install react-dropzone                  # Upload de imágenes drag&drop
npm install zod                             # Validación de schemas
npm install sonner                          # Toast notifications

# Instalar Shadcn/UI
npx shadcn-ui@latest init
# Seleccionar: Style=Default, BaseColor=Neutral, CSSVariables=Yes

# Añadir componentes Shadcn necesarios
npx shadcn-ui@latest add button card dialog progress badge avatar
npx shadcn-ui@latest add input label tabs skeleton toast sheet
```

---

## 2. ESTRUCTURA DE CARPETAS

```
nutrisnap-ai/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── (auth)/                       # Route Group: páginas sin navbar
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx               # Layout minimalista para auth
│   │   │
│   │   ├── (app)/                        # Route Group: páginas autenticadas
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx             # Server Component — carga datos
│   │   │   │   └── loading.tsx          # Skeleton del dashboard
│   │   │   ├── history/
│   │   │   │   ├── page.tsx
│   │   │   │   └── loading.tsx
│   │   │   ├── activity/
│   │   │   │   └── page.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx               # Layout con Navbar + Sidebar
│   │   │
│   │   ├── onboarding/
│   │   │   ├── page.tsx                 # Wizard de configuración inicial
│   │   │   └── loading.tsx
│   │   │
│   │   ├── api/                          # API Routes (Server-side only)
│   │   │   ├── analyze-meal/
│   │   │   │   └── route.ts             # ⭐ Core: Visión IA → Macros
│   │   │   └── upload-image/
│   │   │       └── route.ts             # Upload a Supabase Storage
│   │   │
│   │   ├── globals.css                  # Tailwind base + CSS variables Shadcn
│   │   ├── layout.tsx                   # Root layout (fonts, providers)
│   │   └── page.tsx                     # Landing page (/)
│   │
│   ├── components/
│   │   ├── ui/                          # Componentes Shadcn (auto-generados)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   │
│   │   ├── dashboard/                   # Componentes específicos del dashboard
│   │   │   ├── CalorieRing.tsx          # Anillo de progreso animado
│   │   │   ├── MacrosBars.tsx           # Barras proteína/carbos/grasa
│   │   │   ├── MealCard.tsx             # Card individual de comida
│   │   │   ├── MealFeed.tsx             # Lista de comidas de hoy
│   │   │   ├── ActivityCard.tsx
│   │   │   └── DailyBalance.tsx         # Balance calórico neto
│   │   │
│   │   ├── snap/                        # Componentes del flujo de captura
│   │   │   ├── SnapButton.tsx           # Botón FAB de la cámara
│   │   │   ├── ImageCapture.tsx         # Cámara + upload drag&drop
│   │   │   ├── AnalysisLoader.tsx       # Estado de carga con animación
│   │   │   ├── MealResultCard.tsx       # Card de resultado del análisis
│   │   │   └── SnapModal.tsx            # Modal contenedor del flujo completo
│   │   │
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MobileTabBar.tsx
│   │   │   └── ThemeToggle.tsx
│   │   │
│   │   └── shared/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── EmptyState.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Cliente Supabase para Browser
│   │   │   ├── server.ts               # Cliente Supabase para Server Components
│   │   │   └── middleware.ts           # Cliente para Middleware de Next.js
│   │   │
│   │   ├── azure/
│   │   │   └── openai.ts              # Configuración del cliente Azure OpenAI
│   │   │
│   │   ├── validations/
│   │   │   ├── meal.schema.ts          # Zod schema para validar respuesta IA
│   │   │   └── profile.schema.ts
│   │   │
│   │   └── utils.ts                    # cn(), formatCalories(), etc.
│   │
│   ├── hooks/
│   │   ├── useCamera.ts               # Hook: acceso a cámara del dispositivo
│   │   ├── useMealAnalysis.ts         # Hook: orquesta el flujo de análisis
│   │   └── useProfile.ts              # Hook: datos del perfil del usuario
│   │
│   ├── actions/                        # Next.js Server Actions
│   │   ├── meal.actions.ts            # saveMeal(), deleteMeal()
│   │   ├── activity.actions.ts        # saveActivity(), deleteActivity()
│   │   └── profile.actions.ts         # updateProfile()
│   │
│   └── types/
│       ├── database.types.ts          # Tipos generados por Supabase CLI
│       ├── meal.types.ts
│       └── api.types.ts               # Tipos de request/response de la API
│
├── middleware.ts                        # ⭐ Auth guard global de Next.js
├── next.config.js
├── tailwind.config.ts
├── components.json                      # Config de Shadcn/UI
└── .env.local
```

---

## 3. CONFIGURACIÓN DE CLIENTES

### 3.1 Cliente Supabase — Browser (`src/lib/supabase/client.ts`)

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 3.2 Cliente Supabase — Server (`src/lib/supabase/server.ts`)

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // En Server Components, set puede lanzar error (ignorar)
          }
        },
      },
    }
  )
}
```

### 3.3 Middleware de Auth (`middleware.ts` — raíz del proyecto)

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refrescar sesión — SIEMPRE antes de cualquier lógica
  const { data: { user } } = await supabase.auth.getUser()

  // Rutas protegidas: redirigir a login si no hay sesión
  const protectedRoutes = ['/dashboard', '/history', '/activity', '/profile', '/onboarding']
  const isProtected = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Rutas de auth: redirigir al dashboard si ya hay sesión
  const authRoutes = ['/login', '/register']
  const isAuthRoute = authRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 3.4 Cliente Azure OpenAI (`src/lib/azure/openai.ts`)

```typescript
import { AzureOpenAI } from 'openai'

export function createAzureClient(): AzureOpenAI {
  return new AzureOpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY!,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION!,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
  })
}

export const AZURE_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME!
```

---

## 4. API ROUTE DE VISIÓN — LÓGICA COMPLETA

### 4.1 Archivo: `src/app/api/analyze-meal/route.ts`

Este es el componente más crítico del sistema. Procesa la imagen y devuelve el análisis nutricional.

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createAzureClient, AZURE_DEPLOYMENT } from '@/lib/azure/openai'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ============================================================
// SCHEMA DE VALIDACIÓN — Contrato de datos de respuesta IA
// ============================================================
const MealAnalysisSchema = z.object({
  food_name: z.string().min(1),
  calories: z.number().int().positive(),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  health_tip: z.string().min(1),
  exercise_recommendation: z.string().min(1),
  confidence_score: z.number().min(0).max(1),
  is_food: z.boolean(),
})

export type MealAnalysis = z.infer<typeof MealAnalysisSchema>

// ============================================================
// TIPOS DE REQUEST/RESPONSE
// ============================================================
interface AnalyzeMealRequest {
  image: string           // Base64 string (sin el prefijo data:image/...)
  imageType: string       // 'image/jpeg' | 'image/png' | 'image/webp'
  userGoals?: {
    target_calories?: number
    fitness_goal?: string  // 'lose' | 'maintain' | 'gain'
    daily_goal_protein?: number
  }
}

// ============================================================
// SISTEMA PROMPT — Instruye al modelo
// ============================================================
const SYSTEM_PROMPT = `Eres NutriSnap AI, un nutricionista y coach de fitness de élite.
Tu tarea es analizar imágenes de comida y devolver datos nutricionales precisos.

REGLAS ESTRICTAS:
1. Responde SOLO con un objeto JSON válido. Sin texto adicional, sin markdown, sin explicaciones.
2. Si la imagen NO contiene comida, devuelve is_food: false y zeros en los macros.
3. Estima porciones basándote en el tamaño visual relativo a elementos de referencia.
4. El campo health_tip debe ser personalizado según el fitness_goal del usuario.
5. El exercise_recommendation debe indicar actividad física específica para "quemar" esas calorías.
6. Todos los valores numéricos son en unidades métricas (gramos, kilocalorías).

FORMATO DE RESPUESTA (JSON estricto):
{
  "food_name": "Nombre descriptivo del plato en español",
  "calories": 450,
  "protein": 35.5,
  "carbs": 42.0,
  "fat": 12.3,
  "health_tip": "Consejo personalizado de 1-2 oraciones sobre este alimento",
  "exercise_recommendation": "Descripción específica de ejercicio para compensar estas calorías",
  "confidence_score": 0.87,
  "is_food": true
}`

// ============================================================
// HANDLER PRINCIPAL
// ============================================================
export async function POST(request: NextRequest) {
  try {
    // 1. AUTENTICACIÓN — Verificar que el usuario está autenticado
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Sesión inválida.' },
        { status: 401 }
      )
    }

    // 2. VALIDACIÓN DEL BODY DE LA REQUEST
    let body: AnalyzeMealRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Body de la request inválido o malformado.' },
        { status: 400 }
      )
    }

    const { image, imageType = 'image/jpeg', userGoals } = body

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'El campo "image" es requerido y debe ser un string Base64.' },
        { status: 400 }
      )
    }

    // 3. VALIDAR TAMAÑO DE IMAGEN (Base64 ~= 4/3 * bytes originales)
    const estimatedSizeBytes = (image.length * 3) / 4
    const maxSizeBytes = 4 * 1024 * 1024 // 4MB

    if (estimatedSizeBytes > maxSizeBytes) {
      return NextResponse.json(
        { error: 'La imagen supera el límite de 4MB.' },
        { status: 413 }
      )
    }

    // 4. CONSTRUIR EL USER PROMPT PERSONALIZADO
    const userPrompt = buildUserPrompt(userGoals)

    // 5. LLAMADA A AZURE OPENAI CON VISIÓN
    const azure = createAzureClient()

    const response = await azure.chat.completions.create({
      model: AZURE_DEPLOYMENT,
      max_tokens: 500,
      temperature: 0.1,    // Baja temperatura para respuestas consistentes
      response_format: { type: 'json_object' },  // Forzar respuesta JSON
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                // Azure acepta Base64 directamente con el prefijo data:
                url: `data:${imageType};base64,${image}`,
                detail: 'low',  // 'low' para velocidad, 'high' para precisión máxima
              },
            },
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
    })

    // 6. EXTRAER Y PARSEAR LA RESPUESTA
    const rawContent = response.choices[0]?.message?.content

    if (!rawContent) {
      return NextResponse.json(
        { error: 'El modelo no devolvió respuesta. Intenta de nuevo.' },
        { status: 502 }
      )
    }

    let parsedData: unknown
    try {
      parsedData = JSON.parse(rawContent)
    } catch {
      console.error('[analyze-meal] JSON parse error:', rawContent)
      return NextResponse.json(
        { error: 'Respuesta del modelo en formato inválido.' },
        { status: 502 }
      )
    }

    // 7. VALIDAR CON ZOD — Garantizar contrato de datos
    const validationResult = MealAnalysisSchema.safeParse(parsedData)

    if (!validationResult.success) {
      console.error('[analyze-meal] Schema validation error:', validationResult.error)
      return NextResponse.json(
        { error: 'Los datos de análisis no pasaron la validación.' },
        { status: 502 }
      )
    }

    const mealData = validationResult.data

    // 8. VERIFICAR QUE ES COMIDA
    if (!mealData.is_food) {
      return NextResponse.json(
        {
          error: 'No pudimos identificar comida en esta imagen. ¿Intentas con otra foto más clara?',
          is_food: false
        },
        { status: 422 }
      )
    }

    // 9. RESPUESTA EXITOSA
    return NextResponse.json({
      success: true,
      data: mealData,
      usage: {
        prompt_tokens: response.usage?.prompt_tokens ?? 0,
        completion_tokens: response.usage?.completion_tokens ?? 0,
      }
    })

  } catch (error) {
    console.error('[analyze-meal] Unexpected error:', error)

    // Manejo específico de errores de Azure OpenAI
    if (error instanceof Error) {
      if (error.message.includes('content_filter')) {
        return NextResponse.json(
          { error: 'La imagen fue bloqueada por filtros de contenido.' },
          { status: 400 }
        )
      }
      if (error.message.includes('rate_limit')) {
        return NextResponse.json(
          { error: 'Límite de velocidad alcanzado. Espera unos segundos.' },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Error interno del servidor. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}

// ============================================================
// HELPER: Construir prompt personalizado según goals del usuario
// ============================================================
function buildUserPrompt(userGoals?: AnalyzeMealRequest['userGoals']): string {
  let basePrompt = 'Analiza la comida en esta imagen y devuelve el JSON de análisis nutricional.'

  if (userGoals?.fitness_goal) {
    const goalMap: Record<string, string> = {
      lose: 'El usuario quiere PERDER peso. Enfatiza el déficit calórico en tus consejos.',
      gain: 'El usuario quiere GANAR músculo. Enfatiza el aporte proteico y el superávit calórico.',
      maintain: 'El usuario quiere MANTENER su peso. Enfatiza el balance calórico.',
    }
    basePrompt += ` Contexto: ${goalMap[userGoals.fitness_goal] ?? ''}`
  }

  if (userGoals?.target_calories) {
    basePrompt += ` El objetivo calórico diario del usuario es ${userGoals.target_calories} kcal.`
  }

  return basePrompt
}
```

---

## 5. CONTRATO DE DATOS JSON — LLM ↔ BACKEND

### 5.1 Request del Cliente al API Route

```json
{
  "image": "iVBORw0KGgoAAAANSUhEUgAAAAEAA...",
  "imageType": "image/jpeg",
  "userGoals": {
    "target_calories": 2000,
    "fitness_goal": "lose",
    "daily_goal_protein": 150
  }
}
```

**Reglas de la Request:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `image` | `string` | ✅ Sí | Base64 puro, SIN prefijo `data:image/...;base64,` |
| `imageType` | `string` | ❌ No | Default: `image/jpeg`. Acepta: `jpeg`, `png`, `webp` |
| `userGoals` | `object` | ❌ No | Personaliza los consejos del coach |

### 5.2 Response Exitosa del API Route (HTTP 200)

```json
{
  "success": true,
  "data": {
    "food_name": "Pechuga de pollo a la plancha con arroz integral y brócoli",
    "calories": 520,
    "protein": 48.5,
    "carbs": 45.0,
    "fat": 8.2,
    "health_tip": "Excelente elección para tu objetivo de pérdida de peso. Alta proteína y fibra te mantendrán saciado por más tiempo.",
    "exercise_recommendation": "30 minutos de carrera moderada o 45 minutos de caminata a paso rápido compensarán estas calorías.",
    "confidence_score": 0.92,
    "is_food": true
  },
  "usage": {
    "prompt_tokens": 1247,
    "completion_tokens": 118
  }
}
```

### 5.3 Responses de Error

```json
// HTTP 401 — No autenticado
{ "error": "No autorizado. Sesión inválida." }

// HTTP 400 — Imagen inválida
{ "error": "El campo \"image\" es requerido y debe ser un string Base64." }

// HTTP 413 — Imagen demasiado grande
{ "error": "La imagen supera el límite de 4MB." }

// HTTP 422 — No es comida
{ "error": "No pudimos identificar comida en esta imagen.", "is_food": false }

// HTTP 429 — Rate limit
{ "error": "Límite de velocidad alcanzado. Espera unos segundos." }

// HTTP 502 — Error del modelo
{ "error": "El modelo no devolvió respuesta. Intenta de nuevo." }

// HTTP 500 — Error interno
{ "error": "Error interno del servidor. Intenta de nuevo." }
```

### 5.4 Estructura del INSERT a Supabase (tabla `meals`)

Cuando el usuario confirma el análisis, el cliente hace un Server Action:

```typescript
// src/actions/meal.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface SaveMealParams {
  food_name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  health_tip: string
  image_url?: string  // URL del Supabase Storage (opcional)
}

export async function saveMeal(params: SaveMealParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('meals')
    .insert({
      user_id: user.id,
      food_name: params.food_name,
      calories: params.calories,
      protein: params.protein,
      carbs: params.carbs,
      fat: params.fat,
      health_tip: params.health_tip,
      image_url: params.image_url ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(`Error guardando comida: ${error.message}`)

  revalidatePath('/dashboard')  // Invalidar caché del dashboard
  return data
}
```

---

## 6. FLUJO DE PROCESAMIENTO DE IMAGEN (End-to-End)

```
CLIENTE (Browser)
│
├─ 1. Usuario selecciona/captura imagen
│   └─ Validar: tipo (jpg/png/webp), tamaño (< 4MB)
│
├─ 2. Convertir a Base64
│   └─ FileReader.readAsDataURL() → extraer solo la parte Base64
│
├─ 3. POST /api/analyze-meal
│   └─ Body: { image: "base64...", imageType, userGoals }
│
SERVER (Next.js API Route)
│
├─ 4. Verificar sesión Supabase
├─ 5. Validar tamaño estimado de imagen
├─ 6. Construir mensaje para Azure OpenAI con imagen en Base64
├─ 7. Llamada a Azure OpenAI (GPT-4o-mini-1 Vision)
├─ 8. Parsear JSON de respuesta
├─ 9. Validar con Zod schema
└─ 10. Devolver respuesta al cliente
│
CLIENTE (Browser)
│
├─ 11. Mostrar MealResultCard con datos
├─ 12. Usuario confirma (o edita valores)
│
├─ 13. [Opcional] Upload imagen a Supabase Storage
│   └─ POST /api/upload-image → devuelve URL pública
│
└─ 14. Server Action: saveMeal()
    └─ INSERT en tabla `meals` + revalidatePath('/dashboard')
```

---

## 7. CONVERSIÓN BASE64 — Implementación en el Cliente

```typescript
// src/hooks/useMealAnalysis.ts

export function imageFileToBase64(file: File): Promise<{ base64: string; type: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onloadend = () => {
      const dataUrl = reader.result as string
      // dataUrl = "data:image/jpeg;base64,iVBORw0KGgo..."
      // Extraemos SOLO el contenido después de la coma
      const [prefix, base64] = dataUrl.split(',')
      const type = prefix.split(':')[1].split(';')[0]  // "image/jpeg"

      if (!base64) {
        reject(new Error('Error al convertir imagen a Base64'))
        return
      }

      resolve({ base64, type })
    }

    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsDataURL(file)
  })
}
```

---

## 8. GENERACIÓN DE TIPOS SUPABASE

```bash
# Instalar CLI de Supabase
npm install -D supabase

# Login y vincular proyecto
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF

# Generar tipos TypeScript desde el schema de la DB
npx supabase gen types typescript --linked > src/types/database.types.ts
```

---

*Siguiente documento: [DATABASE_BLUEPRINT.md](./DATABASE_BLUEPRINT.md)*
