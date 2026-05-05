# AGILE_BACKLOG.md
# NutriSnap AI — Backlog Ágil Completo

> **Versión:** 1.0.0 | **Metodología:** Scrum / Épicas → Historias de Usuario  
> **Estimación:** Story Points (Fibonacci: 1, 2, 3, 5, 8, 13)  
> **Audiencia:** Agentes de código, Tech Lead, Product Manager

---

## RESUMEN EJECUTIVO DE ÉPICAS

| ID | Épica | Historias | SP Total | Prioridad |
|----|-------|-----------|----------|-----------|
| E1 | Autenticación y Perfil de Usuario | 5 | 23 | 🔴 P0 — Bloqueante |
| E2 | Core IA — Análisis Visual de Comida | 4 | 34 | 🔴 P0 — Producto core |
| E3 | Cámara UI — Captura y Flujo Visual | 4 | 21 | 🟠 P1 — UX diferencial |
| E4 | Dashboard — Seguimiento y Estadísticas | 5 | 29 | 🟠 P1 — Retención |
| E5 | Coaching IA — Actividad y Recomendaciones | 3 | 18 | 🟡 P2 — Diferenciador |
| | **TOTAL** | **21 historias** | **125 SP** | |

---

## ÉPICA 1: AUTENTICACIÓN Y PERFIL DE USUARIO

> **Objetivo:** El usuario puede registrarse, iniciar sesión, y configurar su perfil inicial con sus objetivos nutricionales. Es el prerequisito de todo el sistema.

---

### US-1.1 — Registro de Nueva Cuenta

**Historia:** *Como usuario nuevo, quiero registrarme con mi email y contraseña para crear mi cuenta en NutriSnap AI.*

**Story Points:** 5

**Criterios de Aceptación:**

- [ ] El formulario de registro contiene: campo `full_name` (text), `email` (email), `password` (min 8 caracteres), `confirm_password`.
- [ ] La validación del cliente (Zod + React Hook Form) muestra errores inline antes de enviar.
- [ ] Al enviar, se llama a `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`.
- [ ] El trigger `on_auth_user_created` crea automáticamente la fila en `public.profiles` con `full_name` y `onboarding_complete = false`.
- [ ] Al completar el registro exitosamente, el usuario es redirigido a `/onboarding`.
- [ ] Si el email ya existe, se muestra el error: *"Este email ya está registrado. ¿Quieres iniciar sesión?"* con link a `/login`.
- [ ] Supabase envía un email de confirmación (configurable en el dashboard de Supabase).
- [ ] El botón de submit muestra un spinner y se deshabilita durante el proceso.
- [ ] La página es mobile-first, respeta el diseño Health-Tech (fondo blanco/oscuro, verde esmeralda para CTA).

**Implementación Técnica:**
```
Archivo: src/app/(auth)/register/page.tsx
Componentes: <RegisterForm /> (Client Component)
Acción: supabase.auth.signUp()
Redirect: router.push('/onboarding')
```

**Definición de Hecho (DoD):**
- [ ] Código revisado y sin errores de TypeScript (`tsc --noEmit` pasa sin errores)
- [ ] El flujo completo testado en navegador: desktop y mobile (390px)
- [ ] Verificado en Supabase Dashboard que se crea la fila en `profiles`
- [ ] Manejo de errores cubierto (email duplicado, contraseña débil, error de red)
- [ ] Componente accesible: labels vinculados a inputs, navegable por teclado

---

### US-1.2 — Inicio de Sesión

**Historia:** *Como usuario registrado, quiero iniciar sesión con mi email y contraseña para acceder a mi cuenta.*

**Story Points:** 3

**Criterios de Aceptación:**

- [ ] El formulario contiene: `email`, `password`, checkbox "Recordarme".
- [ ] Se llama a `supabase.auth.signInWithPassword({ email, password })`.
- [ ] Sesión persistida via cookies usando `@supabase/ssr` (no localStorage).
- [ ] Redirect post-login: si `profiles.onboarding_complete = false` → `/onboarding`, si `true` → `/dashboard`.
- [ ] Si las credenciales son incorrectas: *"Email o contraseña incorrectos."* (no revelar cuál).
- [ ] Link visible: *"¿Olvidaste tu contraseña?"* → llama a `supabase.auth.resetPasswordForEmail()`.
- [ ] El middleware de Next.js intercepta rutas protegidas y redirige a `/login` automáticamente.

**Implementación Técnica:**
```
Archivo: src/app/(auth)/login/page.tsx
Middleware: src/middleware.ts (ya configurado en TECHNICAL_ARCHITECTURE.md)
Lógica post-login: verificar profiles.onboarding_complete
```

**Definición de Hecho (DoD):**
- [ ] Sesión persiste al recargar la página
- [ ] Middleware bloquea acceso a `/dashboard` sin sesión activa
- [ ] Redirect condicional según `onboarding_complete` funciona correctamente
- [ ] Reset de contraseña: email de Supabase llega y permite cambiar contraseña

---

### US-1.3 — Wizard de Onboarding

**Historia:** *Como usuario recién registrado, quiero configurar mis objetivos nutricionales en un wizard guiado para personalizar mi experiencia desde el primer día.*

**Story Points:** 8

**Criterios de Aceptación:**

- [ ] El wizard tiene exactamente **3 pasos** con indicador de progreso visual (stepper).
- [ ] **Step 1 — Objetivo Fitness:** 3 tarjetas visuales seleccionables (solo una): "Perder Peso 🔥", "Mantener 💪", "Ganar Músculo 🏋️". Mapea a `fitness_goal: 'lose' | 'maintain' | 'gain'`.
- [ ] **Step 2 — Datos Personales:** Input de peso actual (con selector kg/lb), target de calorías diarias (input numérico con sugerencia automática según fitness_goal: lose=1800, maintain=2000, gain=2500).
- [ ] **Step 3 — Objetivos de Macros:** 3 sliders (proteína, carbos, grasa en gramos). Los sliders tienen valores sugeridos calculados según el fitness_goal y calorías objetivo. Opción "Usar sugerencia IA" que los autocompletá.
- [ ] Navegación: botones "Atrás" y "Siguiente". El botón "Siguiente" en el Step 3 dice "¡Empezar!".
- [ ] Al completar: se ejecuta `updateProfile()` Server Action que hace UPDATE en `profiles` + establece `onboarding_complete = true`.
- [ ] El wizard solo es accesible si `onboarding_complete = false`. Si ya completó el onboarding, `/onboarding` redirige a `/dashboard`.
- [ ] El estado del wizard se persiste en `useState` (no es necesario persistir en DB hasta el final).

**Implementación Técnica:**
```
Archivo: src/app/onboarding/page.tsx
Componente wizard: src/components/onboarding/OnboardingWizard.tsx
Server Action: src/actions/profile.actions.ts → updateProfile()
```

**Definición de Hecho (DoD):**
- [ ] Los 3 pasos renderizan correctamente en mobile (390px) y desktop
- [ ] Navegación atrás/adelante funciona sin perder datos del paso anterior
- [ ] Al completar, `profiles.onboarding_complete = true` en Supabase
- [ ] Redirect exitoso a `/dashboard` post-onboarding
- [ ] Si el usuario recarga en mitad del wizard, no pierde los datos del step actual

---

### US-1.4 — Edición de Perfil

**Historia:** *Como usuario, quiero editar mis datos de perfil y objetivos nutricionales para actualizar mi información cuando cambie mi peso o mis metas.*

**Story Points:** 5

**Criterios de Aceptación:**

- [ ] Página `/profile` accesible desde el sidebar/navbar.
- [ ] Muestra el formulario prellenado con datos actuales del perfil (fetch con Server Component).
- [ ] Campos editables: `full_name`, `current_weight`, `target_calories`, `fitness_goal`, `daily_goal_protein`, `daily_goal_carbs`, `daily_goal_fat`.
- [ ] Upload de avatar: usa `react-dropzone` + upload a Supabase Storage en `avatars/{user_id}.jpg`. Muestra preview inmediato.
- [ ] Al guardar: Server Action `updateProfile()` hace UPDATE en `profiles` + `revalidatePath('/profile')` y `revalidatePath('/dashboard')`.
- [ ] Toast de confirmación: *"✅ Perfil actualizado correctamente"* usando `sonner`.
- [ ] Si hay error: Toast de error con mensaje descriptivo.

**Definición de Hecho (DoD):**
- [ ] Los datos se precargan correctamente desde Supabase
- [ ] El avatar se sube y muestra sin recargar la página
- [ ] El dashboard refleja inmediatamente los cambios de objetivos post-guardado
- [ ] Validaciones: peso > 0, calorías entre 500-5000, nombre no vacío

---

### US-1.5 — Cierre de Sesión

**Historia:** *Como usuario, quiero cerrar sesión de forma segura para proteger mi cuenta en dispositivos compartidos.*

**Story Points:** 2

**Criterios de Aceptación:**

- [ ] Botón de logout accesible desde el sidebar y desde el menú de avatar.
- [ ] Al hacer clic: llama a `supabase.auth.signOut()`.
- [ ] Las cookies de sesión se eliminan (manejo automático via `@supabase/ssr`).
- [ ] Redirect a `/login` inmediato post-logout.
- [ ] El middleware bloquea cualquier acceso posterior a rutas protegidas.

**Definición de Hecho (DoD):**
- [ ] Después del logout, el botón "Atrás" del navegador no permite acceder al dashboard
- [ ] Las cookies de Supabase están limpias al inspeccionar DevTools

---

## ÉPICA 2: CORE IA — ANÁLISIS VISUAL DE COMIDA

> **Objetivo:** El corazón del producto. El usuario fotografía su comida y en menos de 10 segundos recibe el análisis completo de macronutrientes más recomendaciones de coaching.

---

### US-2.1 — API Route de Análisis Visual

**Historia:** *Como sistema, necesito un endpoint seguro que reciba una imagen en Base64 y devuelva el análisis nutricional completo usando Azure OpenAI GPT-4o-mini-1.*

**Story Points:** 13

**Criterios de Aceptación:**

- [ ] `POST /api/analyze-meal` implementado exactamente según `TECHNICAL_ARCHITECTURE.md` sección 4.
- [ ] El endpoint verifica sesión activa antes de procesar. Devuelve 401 si no hay sesión.
- [ ] Acepta `{ image: string (Base64), imageType: string, userGoals?: object }` en el body.
- [ ] Valida que `image` no esté vacío y que el tamaño estimado no supere 4MB.
- [ ] Llama a Azure OpenAI con `response_format: { type: 'json_object' }`.
- [ ] El system prompt instruye al modelo para devolver **únicamente** el JSON del contrato definido.
- [ ] La respuesta del LLM es validada con Zod schema `MealAnalysisSchema`.
- [ ] Si `is_food = false`, devuelve HTTP 422 con mensaje amigable.
- [ ] Manejo de errores de Azure: `content_filter` (400), `rate_limit` (429), timeout (502).
- [ ] El endpoint NO guarda datos en la DB. Solo analiza y devuelve. El guardado es responsabilidad del cliente/Server Action.
- [ ] Tiempo de respuesta objetivo: < 10 segundos en el 95% de los casos.
- [ ] Los logs incluyen `userId`, `estimatedTokens` y `responseTimeMs` (sin datos de imagen por privacidad).

**Contrato de datos:** Ver `TECHNICAL_ARCHITECTURE.md` sección 5.

**Definición de Hecho (DoD):**
- [ ] Testado con imágenes reales: foto de pizza, ensalada, plato casero, imagen que NO es comida
- [ ] Todos los escenarios de error devuelven el HTTP status code correcto
- [ ] Zod schema rechaza correctamente respuestas malformadas del LLM
- [ ] No hay ninguna clave de API en logs ni en respuestas al cliente

---

### US-2.2 — Guardado de Comida Post-Análisis

**Historia:** *Como usuario, quiero confirmar y guardar el análisis de mi comida para que quede registrado en mi historial y se actualice mi progreso del día.*

**Story Points:** 5

**Criterios de Aceptación:**

- [ ] Server Action `saveMeal(params: SaveMealParams)` implementado en `src/actions/meal.actions.ts`.
- [ ] Verifica autenticación antes del INSERT.
- [ ] Hace INSERT en `public.meals` con todos los campos del contrato de datos.
- [ ] Llama a `revalidatePath('/dashboard')` y `revalidatePath('/history')` post-INSERT.
- [ ] El usuario puede **editar manualmente** los valores (calorías, macros, nombre) antes de confirmar.
- [ ] Devuelve el `id` de la nueva fila para poder asociar la imagen más tarde.
- [ ] Si el usuario cierra el modal sin confirmar, NO se guarda nada.

**Definición de Hecho (DoD):**
- [ ] Verificado en Supabase que la fila se crea correctamente
- [ ] El dashboard muestra la nueva comida sin recargar manualmente la página
- [ ] La edición manual de valores refleja los cambios editados (no los del LLM) en la DB

---

### US-2.3 — Upload de Imagen a Supabase Storage

**Historia:** *Como usuario, quiero que la foto de mi comida se guarde asociada a mi registro para poder verla en mi historial.*

**Story Points:** 8

**Criterios de Aceptación:**

- [ ] `POST /api/upload-image` recibe `FormData` con el archivo de imagen y el `mealId`.
- [ ] Verifica sesión activa.
- [ ] Sube la imagen a Supabase Storage en el path: `meal-images/{user_id}/{meal_id}_{timestamp}.{ext}`.
- [ ] Obtiene la URL pública del archivo subido.
- [ ] Hace UPDATE en `meals.image_url` con la URL pública.
- [ ] Soporta formatos: `image/jpeg`, `image/png`, `image/webp`.
- [ ] Compresión: si la imagen supera 1MB, se comprime en el cliente antes de subir (usando `browser-image-compression` npm).
- [ ] Si el upload falla, el meal ya guardado permanece (imagen es opcional, no crítica).
- [ ] El upload ocurre en paralelo o después de confirmar el meal (no bloquea el flujo principal).

**Definición de Hecho (DoD):**
- [ ] Imagen visible en Supabase Storage Dashboard
- [ ] URL pública accesible desde el navegador sin autenticación
- [ ] Las políticas de storage impiden que usuario A acceda a archivos de usuario B
- [ ] El MealCard en el dashboard muestra el thumbnail de la foto

---

### US-2.4 — Eliminación de Comida

**Historia:** *Como usuario, quiero poder eliminar una comida registrada por error para mantener mi historial limpio y preciso.*

**Story Points:** 3

**Criterios de Aceptación:**

- [ ] Cada `MealCard` tiene un botón/menú de opciones con "Eliminar".
- [ ] Al hacer clic en "Eliminar": se muestra un Dialog de confirmación (`shadcn/ui Dialog`): *"¿Seguro que quieres eliminar esta comida? Esta acción no se puede deshacer."*
- [ ] Al confirmar: Server Action `deleteMeal(mealId)` hace DELETE en `public.meals`.
- [ ] Si la comida tiene `image_url`, también elimina el archivo de Supabase Storage.
- [ ] `revalidatePath('/dashboard')` y `revalidatePath('/history')` post-DELETE.
- [ ] Toast de confirmación: *"🗑️ Comida eliminada"*.
- [ ] Las políticas RLS garantizan que solo el propietario puede eliminar sus comidas (doble seguridad a nivel DB).

**Definición de Hecho (DoD):**
- [ ] La comida desaparece del dashboard en tiempo real (sin F5)
- [ ] El archivo en Storage también es eliminado
- [ ] Un usuario no puede eliminar comidas de otro usuario (testado via API directa)

---

## ÉPICA 3: CÁMARA UI — CAPTURA Y FLUJO VISUAL

> **Objetivo:** La interfaz de captura de comida debe ser el componente más pulido del producto. Debe sentirse instantáneo, fluido y mágico. Es el momento diferencial de NutriSnap AI.

---

### US-3.1 — Botón FAB y Modal de Captura

**Historia:** *Como usuario en el dashboard, quiero acceder al flujo de captura de comida con un solo toque para minimizar la fricción al máximo.*

**Story Points:** 5

**Criterios de Aceptación:**

- [ ] Botón FAB (Floating Action Button) visible y fijo en la esquina inferior derecha del dashboard en mobile.
- [ ] En desktop: botón prominente en el header del dashboard.
- [ ] El FAB tiene el icono de cámara 📷 y el label "Snap Meal".
- [ ] Al hacer clic: abre un `Sheet` (drawer desde abajo en mobile) o `Dialog` (centrado en desktop) con el componente `<SnapModal />`.
- [ ] El modal es draggable en mobile (comportamiento nativo del `Sheet` de Shadcn).
- [ ] El modal se puede cerrar con: botón X, swipe down, o click fuera.
- [ ] El modal tiene el título "¿Qué estás comiendo?" y el subtítulo "Toma una foto o sube una imagen".

**Definición de Hecho (DoD):**
- [ ] El FAB no oculta contenido importante del dashboard
- [ ] El modal abre en < 200ms (sin janks de animación)
- [ ] El modal funciona correctamente en iOS Safari y Chrome Android

---

### US-3.2 — Captura con Cámara del Dispositivo

**Historia:** *Como usuario mobile, quiero usar la cámara de mi teléfono directamente desde la app para capturar mi comida sin salir de la aplicación.*

**Story Points:** 8

**Criterios de Aceptación:**

- [ ] El componente `<ImageCapture />` muestra dos opciones: "Usar Cámara" y "Subir Foto".
- [ ] "Usar Cámara": activa `<input type="file" accept="image/*" capture="environment" />` (cámara trasera por defecto en mobile).
- [ ] "Subir Foto": activa `<input type="file" accept="image/jpeg,image/png,image/webp" />` + zona de drag&drop para desktop.
- [ ] La zona de drag&drop tiene estados visuales: `idle`, `dragover` (borde verde animado), `dropped`.
- [ ] Preview inmediato de la imagen capturada (usando `URL.createObjectURL()`).
- [ ] Sobre el preview: botón "Usar esta foto ✓" (verde) y "Tomar otra 🔄" (ghost).
- [ ] Validación: si el archivo no es imagen → error toast. Si > 4MB → compresión automática antes de análisis.
- [ ] Hook `useCamera.ts` encapsula toda la lógica de acceso a archivos.

**Definición de Hecho (DoD):**
- [ ] Testado en iPhone (Safari) y Android (Chrome): la cámara se activa correctamente
- [ ] El preview se muestra en menos de 500ms tras seleccionar la imagen
- [ ] La compresión no degrada visiblemente la calidad de la imagen en el preview

---

### US-3.3 — Estado de Carga del Análisis IA

**Historia:** *Como usuario, quiero ver feedback visual claro mientras la IA analiza mi comida para saber que el sistema está procesando y no se ha colgado.*

**Story Points:** 3

**Criterios de Aceptación:**

- [ ] El componente `<AnalysisLoader />` reemplaza al preview de imagen durante el análisis.
- [ ] Muestra la miniatura de la foto capturada con un overlay semitransparente.
- [ ] Sobre el overlay: spinner animado (tailwind `animate-spin`) + texto rotativo cada 2 segundos:
  - *"Identificando ingredientes..."*
  - *"Calculando macronutrientes..."*
  - *"Consultando al coach IA..."*
  - *"Preparando tus recomendaciones..."*
- [ ] Barra de progreso indeterminada animada debajo del spinner.
- [ ] El botón de cancelar permite abortar la request y volver a la pantalla de captura.
- [ ] El estado de carga dura mientras el `fetch` a `/api/analyze-meal` está pendiente.

**Definición de Hecho (DoD):**
- [ ] El texto rotativo cambia suavemente (transición fade in/out)
- [ ] El botón cancelar aborta la fetch request (usando `AbortController`)
- [ ] No hay timeout visual: el spinner sigue hasta que la API responde o el usuario cancela

---

### US-3.4 — Tarjeta de Resultado del Análisis

**Historia:** *Como usuario, quiero ver el resultado del análisis de mi comida en una tarjeta visual clara con la opción de confirmar, editar o cancelar antes de guardar.*

**Story Points:** 5

**Criterios de Aceptación:**

- [ ] El componente `<MealResultCard />` muestra:
  - Miniatura de la foto (esquina superior, 80x80px redondeada)
  - **Nombre del plato** (grande, texto principal)
  - **Badge de confianza:** "Alta confianza ✓" (> 0.8), "Confianza media ⚠️" (0.5-0.8), "Baja confianza ⚡" (< 0.5)
  - Grid 2x2 de macros: Calorías 🔥, Proteína 💪, Carbos 🌾, Grasa 🥑
  - **Health Tip** del coach (texto em verde esmeralda, icono 💡)
  - **Recomendación de ejercicio** (texto secundario, icono 🏃)
- [ ] Cada valor de macro es **editable inline** al hacer clic (se convierte en `<input type="number">`).
- [ ] El nombre del plato también es editable inline.
- [ ] Botón primario: "✅ Guardar Comida" (verde, full-width en mobile).
- [ ] Botón secundario: "✏️ Editar" (abre todos los campos en modo edición simultáneo).
- [ ] Botón terciario: "❌ Cancelar" (ghost, cierra sin guardar).
- [ ] Al guardar: animación de check verde + toast *"🎉 Comida registrada"* + modal se cierra.

**Definición de Hecho (DoD):**
- [ ] La edición inline funciona en touch (mobile) y click (desktop)
- [ ] Los valores editados son los que se guardan en la DB (no los originales del LLM)
- [ ] El badge de confianza usa el `confidence_score` de la respuesta del API
- [ ] La tarjeta es visualmente atractiva y sigue el design system Health-Tech

---

## ÉPICA 4: DASHBOARD — SEGUIMIENTO Y ESTADÍSTICAS

> **Objetivo:** El dashboard es la pantalla que el usuario verá cada día. Debe comunicar el progreso diario de un vistazo, motivar, y dar acceso rápido al snap de comida.

---

### US-4.1 — Vista Principal del Dashboard

**Historia:** *Como usuario autenticado, quiero ver mi progreso nutricional del día actual al abrir la app para saber en qué punto estoy sin tener que buscar la información.*

**Story Points:** 8

**Criterios de Aceptación:**

- [ ] Página `/dashboard` es un Server Component que fetcha datos del día actual con una sola query optimizada (ver `DATABASE_BLUEPRINT.md` sección 3.4).
- [ ] Datos del día mostrados: calorías consumidas, proteína, carbos, grasa, calorías quemadas, balance neto.
- [ ] **Componente CalorieRing:** Anillo SVG circular animado que muestra `(calorías_consumidas / target_calories) * 100`. Colores: verde (< 90%), naranja (90-110%), rojo (> 110% = excedido). Número grande en el centro.
- [ ] **Componente MacrosBars:** 3 barras de progreso horizontales (Shadcn `Progress`) para proteína, carbos y grasa. Porcentaje del objetivo diario.
- [ ] **Componente MealFeed:** Lista de comidas del día actual (cards compactas con foto thumbnail, nombre, calorías). Orden cronológico descendente.
- [ ] **Componente DailyBalance:** Balance neto = `calorías consumidas - calorías quemadas`. Color verde si positivo, rojo si negativo.
- [ ] Si no hay comidas del día: `<EmptyState />` con mensaje motivacional y CTA "📷 Registra tu primera comida".
- [ ] Skeleton loading (`loading.tsx`) mientras se cargan los datos del servidor.
- [ ] Greeting personalizado: "Buenos días, {first_name} 👋" (según hora del servidor).

**Definición de Hecho (DoD):**
- [ ] El dashboard carga en < 1.5 segundos (medido en Lighthouse)
- [ ] Los datos son correctos (testeado manualmente añadiendo comidas y verificando sumas)
- [ ] El skeleton se muestra en la transición de carga
- [ ] Responsive: se ve correctamente en 390px, 768px y 1280px

---

### US-4.2 — Feed de Comidas del Día

**Historia:** *Como usuario, quiero ver todas las comidas que he registrado hoy en una lista clara para revisar mi ingesta y gestionar mis registros.*

**Story Points:** 5

**Criterios de Aceptación:**

- [ ] El componente `<MealFeed />` lista todas las comidas del día actual.
- [ ] Cada `<MealCard />` muestra: foto thumbnail (o placeholder emoji 🍽️), nombre del plato, timestamp (ej: "14:32"), calorías, badge del tipo de comida (Desayuno/Almuerzo/Cena/Snack).
- [ ] Al hacer clic en una MealCard: abre un Sheet con el detalle completo (todos los macros + health tip).
- [ ] Opción de eliminar en cada card (icono papelera → Dialog de confirmación).
- [ ] Si hay más de 5 comidas: botón "Ver todas" que expande la lista o navega a `/history`.
- [ ] Animación de entrada cuando se añade una nueva comida (sin recargar la página, via revalidatePath).

**Definición de Hecho (DoD):**
- [ ] La eliminación actualiza la lista y el CalorieRing en tiempo real (sin F5)
- [ ] Las fotos cargan con lazy loading (`loading="lazy"`)
- [ ] El placeholder emoji se muestra si `image_url` es null

---

### US-4.3 — Historial de Comidas

**Historia:** *Como usuario, quiero acceder a mi historial completo de comidas con filtros por fecha para revisar mis patrones nutricionales pasados.*

**Story Points:** 8

**Criterios de Aceptación:**

- [ ] Página `/history` muestra las comidas agrupadas por día.
- [ ] Paginación: carga 7 días por defecto, botón "Cargar más" para semanas anteriores.
- [ ] Filtro por tipo de comida: dropdown "Todas / Desayuno / Almuerzo / Cena / Snack".
- [ ] Cada grupo de día muestra: fecha (ej: "Lunes 15 de enero"), suma de calorías del día, lista de meals.
- [ ] Gráfico de barras semanal (Recharts `BarChart`): calorías por día vs. objetivo. Últimos 7 días.
- [ ] El gráfico tiene tooltip al hover con el desglose de macros de ese día.
- [ ] En mobile: el gráfico es scrollable horizontalmente.

**Definición de Hecho (DoD):**
- [ ] El historial carga correctamente cuando hay 0, 1, 7 y 30+ días de datos
- [ ] El gráfico muestra correctamente la línea objetivo (target_calories del perfil)
- [ ] La paginación no recarga la página completa (append de datos)

---

### US-4.4 — Navegación y Layout Principal

**Historia:** *Como usuario, quiero una navegación clara e intuitiva para acceder a todas las secciones de la app desde cualquier pantalla.*

**Story Points:** 5

**Criterios de Aceptación:**

- [ ] **Desktop (>768px):** Sidebar fijo izquierdo con: Logo NutriSnap, links de navegación (Dashboard, Historial, Actividad, Perfil), toggle dark/light mode, avatar del usuario + nombre, botón Logout.
- [ ] **Mobile (<768px):** Tab bar fija en la parte inferior con 4 iconos: Dashboard, Historial, Snap (botón central prominente, verde), Actividad, Perfil.
- [ ] El link activo tiene estilos visuales distintos (fondo verde esmeralda, texto blanco).
- [ ] Dark mode toggle: persiste en `localStorage` y respeta `prefers-color-scheme` del sistema.
- [ ] El avatar del usuario usa la foto de perfil si existe, o las iniciales del nombre sobre fondo esmeralda.
- [ ] El layout envuelve todas las rutas del grupo `(app)/`.

**Definición de Hecho (DoD):**
- [ ] La navegación funciona sin recargar la página (Next.js Link)
- [ ] El dark mode se aplica globalmente sin parpadeo al cargar
- [ ] El tab bar no oculta contenido scrolleable (padding-bottom adecuado)

---

### US-4.5 — Modo Oscuro

**Historia:** *Como usuario, quiero poder usar la app en modo oscuro para reducir el cansancio visual en condiciones de poca luz.*

**Story Points:** 3

**Criterios de Aceptación:**

- [ ] El modo oscuro se implementa con Tailwind `dark:` classes + clase `dark` en el elemento `<html>`.
- [ ] Persiste la preferencia en `localStorage` key `nutrisnap-theme`.
- [ ] Al primer acceso, detecta `window.matchMedia('(prefers-color-scheme: dark)')` para el default.
- [ ] El toggle está en el sidebar (desktop) y en el menú de perfil (mobile).
- [ ] Todos los componentes tienen sus variantes `dark:` definidas (fondos, textos, bordes, cards).
- [ ] Las variables CSS de Shadcn/UI están configuradas para ambos modos en `globals.css`.
- [ ] No hay parpadeo de tema al recargar (script inline de detección de tema antes del render).

**Definición de Hecho (DoD):**
- [ ] Ningún componente tiene fondos blancos hardcoded: todos usan variables CSS o `dark:` classes
- [ ] El CalorieRing y MacrosBars son visibles en ambos modos
- [ ] No hay FOUC (Flash Of Unstyled Content) de tema al recargar

---

## ÉPICA 5: COACHING IA — ACTIVIDAD Y RECOMENDACIONES

> **Objetivo:** El diferenciador premium. NutriSnap no solo registra: recomienda y motiva. El coaching IA correlaciona comida con ejercicio para cerrar el círculo nutricional.

---

### US-5.1 — Registro de Actividad Física

**Historia:** *Como usuario, quiero registrar mi actividad física del día para ver el balance calórico real entre lo que consumo y lo que quemo.*

**Story Points:** 8

**Criterios de Aceptación:**

- [ ] Página `/activity` con formulario de registro de actividad.
- [ ] Selector de tipo de actividad con iconos visuales (grid de botones): 🏃 Correr, 🚴 Ciclismo, 🏋️ Gym, 🧘 Yoga, 🏊 Natación, ⚽ Fútbol, 🚶 Caminar, 💪 Otro.
- [ ] Input de duración en minutos (slider + input numérico).
- [ ] Selector de intensidad: Baja / Media / Alta (3 botones toggle).
- [ ] **Cálculo automático de calorías quemadas** (fórmula MET simplificada):
  ```
  Calorías = MET_factor × peso_usuario_kg × (duración_min / 60)
  
  MET_factor según intensidad:
  - low: 3.5
  - medium: 6.0
  - high: 9.0
  ```
- [ ] El resultado de calorías quemadas se muestra en tiempo real mientras el usuario ajusta duración e intensidad.
- [ ] Al guardar: Server Action `saveActivity()` hace INSERT en `activities`.
- [ ] El dashboard refleja las calorías quemadas inmediatamente.
- [ ] Lista de actividades del día debajo del formulario.

**Definición de Hecho (DoD):**
- [ ] El cálculo en tiempo real es correcto (verificado con calculadoras externas)
- [ ] El peso usado en el cálculo es `profiles.current_weight` (no hardcoded)
- [ ] Si `current_weight` es null: se usa 70kg como valor por defecto con aviso al usuario

---

### US-5.2 — Health Tips del Coach IA

**Historia:** *Como usuario, quiero recibir consejos de salud personalizados en cada análisis de comida para aprender a mejorar mis hábitos nutricionales progresivamente.*

**Story Points:** 5

**Criterios de Aceptación:**

- [ ] Los `health_tip` generados por el LLM se muestran en la `<MealResultCard />` con icono 💡.
- [ ] Los tips son personalizados según `fitness_goal` del usuario (configurado en el system prompt, ver `TECHNICAL_ARCHITECTURE.md`).
- [ ] Los tips guardados en `meals.health_tip` son accesibles en el historial.
- [ ] En el dashboard: muestra el último health tip recibido en una card dedicada "Consejo del día 💡".
- [ ] Los tips nunca son genéricos. El prompt fuerza especificidad: mencionar el alimento analizado y el objetivo del usuario.
- [ ] Máximo 2 oraciones por tip (controlado en el system prompt con `max_tokens`).

**Definición de Hecho (DoD):**
- [ ] Testado con los 3 fitness_goals: lose/maintain/gain generan tips diferentes
- [ ] Los tips se guardan correctamente en la DB y se recuperan en el historial
- [ ] El "Consejo del día" en dashboard muestra el tip más reciente del día

---

### US-5.3 — Recomendación de Ejercicio Post-Comida

**Historia:** *Como usuario, quiero recibir una recomendación de ejercicio específica después de cada análisis de comida para saber cómo compensar las calorías ingeridas.*

**Story Points:** 5

**Criterios de Aceptación:**

- [ ] El campo `exercise_recommendation` del análisis IA se muestra en la `<MealResultCard />` con icono 🏃.
- [ ] La recomendación es específica: incluye tipo de ejercicio, duración estimada y calorías a quemar.
  - Ejemplo: *"Una sesión de 25 minutos de ciclismo a intensidad media quemaría aproximadamente estas 450 calorías."*
- [ ] Botón "Registrar este ejercicio →" en la `MealResultCard` que lleva a `/activity` con los valores pre-rellenados (tipo y duración sugeridos).
- [ ] El tipo de ejercicio sugerido está correlacionado con el historial de actividades del usuario (el prompt incluye las últimas 3 actividades del usuario).
- [ ] En mobile: el botón de "Registrar ejercicio" es un link que abre el Sheet de actividad.

**Definición de Hecho (DoD):**
- [ ] Las recomendaciones incluyen datos numéricos específicos (no vagas)
- [ ] El botón de pre-relleno funciona: al ir a `/activity`, los campos tipo y duración están pre-seleccionados
- [ ] Testado que las últimas actividades del usuario influyen en la sugerencia (prompt engineering verificado)

---

## RESUMEN DE VELOCIDAD POR SPRINT (REFERENCIA)

| Sprint | Épicas | Historias | SP | Entregable |
|--------|--------|-----------|-----|------------|
| Sprint 1 (2 sem) | E1 | US-1.1, 1.2, 1.3, 1.5 | 18 | Auth completa + Onboarding |
| Sprint 2 (2 sem) | E2, E3 | US-2.1, 2.2, 3.1, 3.2, 3.3, 1.4 | 37 | MVP: Snap + Análisis IA |
| Sprint 3 (2 sem) | E3, E4 | US-2.3, 2.4, 3.4, 4.1, 4.2, 4.5 | 32 | Dashboard completo + Upload |
| Sprint 4 (2 sem) | E4, E5 | US-4.3, 4.4, 5.1, 5.2, 5.3 | 31 | Historial + Coaching + Actividad |
| **Total** | | **21** | **118** | **Producto completo v1.0** |

> *Los 7 SP restantes (US-1.4 ya incluida en Sprint 1 como deuda, y margen de buffer) se distribuyen entre sprints según capacidad del equipo.*

---

## DEFINICIÓN DE HECHO GLOBAL (DoD UNIVERSAL)

Todo ticket se considera **Done** cuando:

1. ✅ El código compila sin errores TypeScript (`tsc --noEmit`)
2. ✅ No hay warnings de ESLint con las reglas del proyecto
3. ✅ El componente/feature funciona en Chrome, Safari y Firefox (últimas 2 versiones)
4. ✅ Responsive verificado en 390px (iPhone 14), 768px (iPad), 1280px (Desktop)
5. ✅ Dark mode funciona correctamente
6. ✅ Los errores son manejados con toasts descriptivos (no console.error en producción)
7. ✅ Las variables de entorno requeridas están documentadas en `.env.local.example`
8. ✅ El código sigue la estructura de carpetas definida en `TECHNICAL_ARCHITECTURE.md`
9. ✅ Los Server Components usan el cliente Supabase server-side (no el de browser)
10. ✅ Las rutas protegidas no son accesibles sin sesión activa

---

*Fin del backlog. Documentos relacionados:*  
*[CONTEXT_MASTER.md](./CONTEXT_MASTER.md) · [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) · [DATABASE_BLUEPRINT.md](./DATABASE_BLUEPRINT.md)*
