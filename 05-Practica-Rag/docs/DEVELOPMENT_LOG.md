# 📓 La Bitácora de Decisiones

[Volver al Inicio](./README.md)

## 🤔 ¿Por qué FastAPI y React?
- **FastAPI:** Su soporte asíncrono (`async def`) nativo encaja perfectamente con el streaming asíncrono de LangChain (`astream`), permitiendo servir a cientos de usuarios concurrentemente.
- **React (Vite):** Vite nos da Hot-Module-Replacement y builds ultrarrápidos. React nos permite un control modular estricto del estado de las conversaciones a través del ciclo de vida (`useEffect`).

## 🤔 ¿Por qué Azure y no otras nubes?
- **Azure AI Search:** Su capacidad nativa de *Hybrid Search* (combinar vectores semánticos con búsqueda léxica BM25) no tiene rival. Además, la integración empresarial con Entra ID es vital.
- **Azure Container Instances (ACI):** Nos permitirá desplegar Docker de forma rápida sin el *overhead* de orquestar un clúster entero de Kubernetes.

## ⚔️ Retos Superados

### 1. El infierno de la Persistencia al hacer F5
**Problema:** Al hacer F5 en la pestaña, el componente `Chat.jsx` perdía el contexto de la conversación y generaba un ID nuevo (`Date.now()`), dejando un "chat fantasma" en la base de datos y la pantalla en blanco.
**Solución:** Guardamos el `thread_id` atado a un `assistant_id` (`thread_{id}`) en el `localStorage` del navegador. Un `useEffect` intercepta la carga inicial de React: si existe el ID en local, hace un GET al endpoint para hidratar el estado `messages` con el historial SQL; si no existe, crea uno nuevo.

### 2. Pánico del CORS en Despliegues Mixtos
**Problema:** React corría en el puerto 5173 y FastAPI en el 8000. Los navegadores bloqueaban el *Streaming Response* de OpenAI.
**Solución:** Modificar el `CORSMiddleware` en `main.py` para permitir métodos y cabeceras dinámicamente (`allow_headers=["*"]`). Esto es esencial para que el `ReadableStream` pasase intacto a través de Fetch API.

### 3. Las Alucinaciones
**Problema:** El LLM inventaba respuestas de su conocimiento global cuando le faltaba contexto en los PDFs.
**Solución:** Se implementó el famoso "Sándwich de Prompts" inyectando la regla *Zero-Hallucination Policy* directamente en el backend.

### 4. Filtrado OData y Esquemas Rígidos en Azure AI Search
**Problema:** Al implementar la exclusión de documentos (los checkboxes de la UI), Azure Search lanzaba errores silenciosos porque el campo `filename` no existía o no era "Filterable" en su esquema. El backend devolvía `[]` y el LLM se quedaba ciego.
**Solución:** Se rediseñó la arquitectura de búsqueda. Primero implementamos un Post-filtrado en Python inyectando `[Fuente: ...]`, y finalmente actualizamos el esquema nativo de Azure añadiendo `filename` y restauramos la consulta OData `(filename eq 'X' or filename eq 'Y')` delegando el peso al motor C#.

### 5. Desincronización React-Backend (Condición de Carrera)
**Problema:** Al cargar la página, si el usuario preguntaba muy rápido, React enviaba `active_documents: []` antes de que el fetch terminase, causando que la búsqueda fallara.
**Solución:** Se implementó un "Fallback de Seguridad" en el backend. Si el array llega vacío, la API ignora el filtro `filename` y aplica un *Bypass* para buscar en **todos** los manuales del asistente, garantizando que el LLM siempre reciba contexto.

### 6. Ranking Bias (El Dominio del Documento Gigante)
**Problema:** En comparativas Multi-Documento, un manual largo (ej. Conceptos Básicos) inundaba el top 5 de resultados, dejando sin representación al manual corto.
**Solución:** Desplegamos **Artillería Híbrida**:
- Se forzó `search_mode="all"`.
- Se disparó la ventana de recuperación de 5 a **50 fragmentos** (`top=50`), creando una avalancha de contexto.
- Se implementaron métricas de *Scoring Debug* en consola para monitorizar el `@search.score`.
- Se reprogramó la *Directiva Cognitiva* del sistema para que el LLM exija activamente la búsqueda de manuales minoritarios.

### 7. Modernización UI (Dark Mode)
**Problema:** Fatiga visual tras pruebas exhaustivas.
**Solución:** Uso avanzado de Tailwind CSS v4 (`@layer utilities`) para sobreescribir la paleta `slate` clara por un gris neutro profundo (`zinc`) de forma dinámica, implementando un Dark Mode global ultrarrápido sin refactorizar JS.
