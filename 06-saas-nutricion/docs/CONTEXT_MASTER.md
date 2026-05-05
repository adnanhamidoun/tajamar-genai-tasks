# CONTEXT_MASTER.md
# NutriSnap AI — Documento Maestro de Contexto de Producto

> **Versión:** 1.0.0 | **Estado:** Activo | **Propietario:** Product & Architecture Team  
> **Última actualización:** 2025-Q2  
> **Audiencia:** Agentes de código (Cursor/Copilot), Desarrolladores, Stakeholders

---

## 1. VISIÓN DEL PRODUCTO

### 1.1 Declaración de Misión

> **"Convertir cualquier comida en conocimiento accionable en menos de 10 segundos."**

NutriSnap AI es un SaaS de nutrición de **fricción cero**. Elimina la barrera más grande del seguimiento nutricional —el logging manual— reemplazándola con un único gesto: **fotografiar la comida**. La IA hace el resto: identifica ingredientes, calcula macronutrientes y genera recomendaciones de ejercicio personalizadas en tiempo real.

### 1.2 Propuesta de Valor Central

| Dimensión | Propuesta |
|-----------|-----------|
| **Velocidad** | Análisis completo de macros en < 10 segundos |
| **Simplicidad** | 1 foto = datos completos. Sin formularios, sin búsqueda manual |
| **Inteligencia** | Coach IA que aprende tus patrones y adapta recomendaciones |
| **Privacidad** | Row-Level Security en Supabase. Tus datos, solo tuyos |
| **Diseño** | Health-Tech minimalista. Sin ruido visual, solo información útil |

### 1.3 Público Objetivo

**Segmento Primario: Usuario Individual Consciente de la Salud**

- **Perfil:** 25-45 años, profesional ocupado, smartphone-first
- **Pain Point:** Quiere controlar su nutrición pero no tiene tiempo de registrar manualmente cada alimento en apps complejas
- **Motivación:** Perder peso, ganar músculo, o simplemente mantener hábitos saludables
- **Comportamiento:** Usa el teléfono constantemente, come fuera de casa frecuentemente, prefiere soluciones visuales

**Segmento Secundario: Entusiasta del Fitness**

- **Perfil:** 20-35 años, entrena 3-5 días/semana
- **Pain Point:** Necesita correlacionar ingesta calórica con rendimiento de entrenamiento
- **Motivación:** Optimizar composición corporal y rendimiento atlético

---

## 2. ANÁLISIS COMPETITIVO

### 2.1 Mapa del Mercado

| Competidor | Modelo de Tracking | IA Visión | Coaching IA | Clics hasta Log | Precio/mes |
|------------|-------------------|-----------|-------------|-----------------|------------|
| **MyFitnessPal** | Manual (búsqueda texto) | ❌ Limitada | ❌ No | 6-8 clics | $19.99 |
| **Lose It!** | Manual + escáner cód. barras | ❌ Básica | ❌ No | 5-7 clics | $39.99/año |
| **Cronometer** | Manual (base de datos) | ❌ No | ❌ No | 7-10 clics | $8.99 |
| **Noom** | Manual + cuestionarios | ❌ No | ✅ Humano | 8-12 clics | $59-79 |
| **Calorie Mama** | Visión básica | ✅ Básica | ❌ No | 3-4 clics | $4.99 |
| **🌟 NutriSnap AI** | **Foto automática** | **✅ GPT-4o Vision** | **✅ IA Tiempo Real** | **1-2 clics** | **TBD** |

### 2.2 Ventajas Competitivas Sostenibles

#### 🥇 Ventaja 1: Fricción Mínima Absoluta
- **Ellos:** El usuario abre la app → busca "pollo a la plancha" → selecciona de 40 variantes → ajusta gramos → confirma. **~6-8 pasos.**
- **Nosotros:** El usuario abre la app → fotografía → confirma. **2 pasos.**
- **Impacto:** Tasa de retención +40% esperada (correlación directa entre pasos de onboarding y churn)

#### 🥇 Ventaja 2: Análisis Visual con GPT-4o Vision
- Reconocimiento contextual de alimentos (platos combinados, comida casera, restaurantes)
- Estimación de porciones por tamaño visual comparativo
- Identificación de métodos de cocción (frito vs. hervido impacta macros significativamente)

#### 🥇 Ventaja 3: Coaching IA Proactivo
- No solo registra: **actúa**. Cada análisis incluye una recomendación de ejercicio personalizada
- Correlaciona historial de comidas con actividad física registrada
- Tips nutricionales contextuales basados en los goals del usuario

#### 🥇 Ventaja 4: Arquitectura Moderna y Escalable
- Next.js 14 App Router: SSR/SSG optimizado para performance
- Supabase: Backend gestionado con RLS nativo, sin vendor lock-in
- Sin deuda técnica desde el día 1

---

## 3. FLUJO DE USUARIO COMPLETO (HAPPY PATH)

### 3.1 Mapa de Flujo General

```
[LANDING PAGE]
     |
     v
[REGISTRO / LOGIN]  →  [ONBOARDING (perfil inicial)]
                                |
                                v
                        [DASHBOARD PRINCIPAL]
                         /              \
                        /                \
              [CAPTURA FOTO]      [VER HISTORIAL]
                    |
                    v
          [ANÁLISIS IA en curso...]
                    |
                    v
          [RESULTADO: Macros + Coach Tip]
                    |
                    v
             [CONFIRMAR MEAL]
                    |
                    v
          [DASHBOARD ACTUALIZADO]
                    |
                    v
      [RECOMENDACIÓN DE EJERCICIO SUGERIDA]
                    |
                    v
          [LOG ACTIVIDAD (opcional)]
```

### 3.2 Flujo Detallado por Pantalla

#### 📍 PASO 1: Landing Page (`/`)
- **Propósito:** Conversión. Comunicar valor en < 5 segundos.
- **Elementos clave:**
  - Hero: Animación de "foto → macros" en loop
  - CTA principal: "Pruébalo Gratis" → `/auth/register`
  - Social proof: Testimonios (placeholder inicial)
  - Sección features: 3 bloques (Foto, Análisis, Coaching)
- **Estado de usuario:** No autenticado

#### 📍 PASO 2: Registro (`/auth/register`)
- **Propósito:** Crear cuenta con mínima fricción
- **Campos requeridos:**
  - Email + Password (Supabase Auth nativo)
  - Nombre completo (guardado en `profiles.full_name` vía trigger)
- **Post-registro:** Redirect automático a `/onboarding`
- **Método:** Supabase `signUp()` → trigger DB crea `profiles` row automáticamente

#### 📍 PASO 3: Login (`/auth/login`)
- **Propósito:** Acceso de usuarios existentes
- **Método:** Supabase `signInWithPassword()`
- **Post-login:** Redirect a `/dashboard`
- **Extras:** Link "Olvidé mi contraseña" → Supabase reset email

#### 📍 PASO 4: Onboarding (`/onboarding`)
- **Propósito:** Personalización inicial del perfil
- **Solo en primer acceso** (verificar `profiles.fitness_goal IS NULL`)
- **Pasos del wizard (3 steps):**
  1. **Step 1 - Objetivo:** Selector visual → `lose` / `maintain` / `gain`
  2. **Step 2 - Datos:** Peso actual (kg/lb), calorías diarias objetivo
  3. **Step 3 - Macros:** Sugerencia automática IA o personalización manual (proteína/carbos/grasa en gramos)
- **Al completar:** UPDATE en `profiles`, redirect a `/dashboard`

#### 📍 PASO 5: Dashboard (`/dashboard`)
- **Propósito:** Centro de operaciones. Vista de hoy.
- **Layout:** Panel principal + sidebar (desktop) / tabs (mobile)
- **Componentes:**
  - **Ring de progreso diario:** Calorías consumidas vs. objetivo (animado)
  - **Barras de macros:** Proteína / Carbos / Grasa (% del objetivo diario)
  - **Botón CTA flotante:** "📷 Snap Meal" → abre cámara/upload
  - **Feed de comidas de hoy:** Cards con foto thumbnail, nombre, macros
  - **Actividades de hoy:** Lista simple con calorías quemadas
  - **Balance neto:** Calorías consumidas - Calorías quemadas
- **Data fetch:** Server Component con Supabase server client

#### 📍 PASO 6: Captura de Comida (`/snap` o Modal)
- **Propósito:** El momento mágico. Foto → Análisis.
- **UI States:**

| Estado | UI |
|--------|----|
| `idle` | Cámara activa o botón upload con drag&drop |
| `captured` | Preview de foto + botón "Analizar" |
| `loading` | Spinner animado + texto "La IA está analizando tu comida..." |
| `result` | Card de resultados expandida |
| `error` | Toast de error + botón reintentar |

- **Flujo técnico interno:**
  1. Usuario toma foto o sube imagen
  2. Frontend: convierte a Base64
  3. POST a `/api/analyze-meal` con `{ image: "base64...", userId, userGoals }`
  4. Server Action llama Azure OpenAI GPT-4o-mini con imagen
  5. LLM responde JSON estructurado (ver `TECHNICAL_ARCHITECTURE.md`)
  6. Frontend muestra resultado en < 10 segundos
  7. Usuario confirma → INSERT en tabla `meals`
  8. Opcionalmente sube imagen a Supabase Storage → actualiza `meals.image_url`

#### 📍 PASO 7: Resultado del Análisis (Modal/Card)
- **Propósito:** Mostrar datos y conseguir confirmación del usuario
- **Contenido del resultado:**
  - 🍽️ Nombre del plato detectado
  - 🔥 Calorías estimadas
  - 📊 Macros: Proteína / Carbos / Grasa (g)
  - 💡 Health Tip del Coach IA
  - 🏃 Recomendación de ejercicio (ej: "30 min de caminata quemaría estas calorías")
- **Acciones:**
  - ✅ "Guardar Comida" → INSERT en `meals`
  - ✏️ "Editar valores" → inputs editables inline
  - ❌ "Cancelar" → volver al dashboard

#### 📍 PASO 8: Log de Actividad (`/activity`)
- **Propósito:** Registrar ejercicio para calcular balance calórico real
- **Flujo:**
  - Selector de tipo de actividad (iconos visuales)
  - Duración en minutos
  - Intensidad (low/medium/high)
  - Cálculo automático de calorías quemadas (fórmula simple: MET × peso × tiempo)
  - INSERT en `activities`

#### 📍 PASO 9: Historial (`/history`)
- **Propósito:** Revisión de datos históricos y tendencias
- **Vistas:**
  - Calendario con indicadores visuales por día
  - Lista paginada de comidas (con filtros: fecha, tipo)
  - Gráfico de tendencia calórica semanal/mensual (Recharts o Chart.js)

### 3.3 Estados de Error y Edge Cases

| Escenario | Comportamiento |
|-----------|----------------|
| Imagen no reconocible (no es comida) | Error amigable: "No pudimos identificar comida en esta imagen. ¿Intentas con otra foto?" |
| Sin conexión a internet | Toast: "Sin conexión. Los datos se guardarán cuando vuelvas online" |
| API Azure timeout (> 15s) | Retry automático 1 vez → error con opción de log manual |
| Usuario sin perfil completado | Redirect forzado a `/onboarding` |
| Sesión expirada | Middleware de Next.js intercepta → redirect a `/auth/login` |
| Imagen > 4MB | Validación frontend antes de enviar → mensaje de compresión |

---

## 4. PRINCIPIOS DE DISEÑO

### 4.1 Design Tokens Core

| Token | Valor | Uso |
|-------|-------|-----|
| `emerald-500` | `#10b981` | CTA principal, acentos activos |
| `emerald-600` | `#059669` | Hover states |
| `emerald-50` | `#ecfdf5` | Backgrounds de cards (light mode) |
| `neutral-950` | `#0a0a0a` | Background (dark mode) |
| `neutral-100` | `#f5f5f5` | Background (light mode) |
| `white` | `#ffffff` | Superficies de cards |

### 4.2 Reglas de UX No Negociables

1. **Máximo 2 clics** para registrar una comida desde el dashboard
2. **Zero loading screens** sin feedback visual. Siempre skeletons o spinners
3. **Mobile-first.** Toda decisión de diseño parte del viewport de 390px
4. **Dark mode nativo** desde el día 1 (Tailwind `dark:` classes)
5. **Accesibilidad WCAG AA** en elementos interactivos

---

*Siguiente documento: [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)*
