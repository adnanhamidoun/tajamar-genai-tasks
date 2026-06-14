# 11 - Agente LangGraph: Chispa

Mini agente creado con LangGraph y un modelo desplegado en Azure AI Foundry.

El objetivo de esta practica es demostrar como construir un agente sencillo, modular, observable y facil de ampliar. No es solo una llamada directa al modelo: la aplicacion usa un grafo para decidir que tipo de respuesta debe generar.

Chispa decide automaticamente si la peticion va de:

- `plan`: convierte una tarea en pasos concretos.
- `ideas`: propone ideas utiles y divertidas.
- `resumen`: sintetiza texto y recomienda una accion.

## Que he construido

He creado un agente conversacional por consola que recibe una peticion del usuario, clasifica la intencion y envia la consulta al nodo adecuado del grafo.

La parte interesante es que cada tipo de tarea tiene su propio nodo y su propio prompt de sistema. Esto hace que el agente sea mas ordenado que un script lineal y permite ampliarlo sin romper la estructura principal.

## Arquitectura

Tambien hay un diagrama visual en `docs/flujo-agente.svg` para explicar el flujo durante el video.

```text
Usuario
  |
  v
START
  |
  v
classify_intent
  |
  +--> plan ----+
  |             |
  +--> ideas ---+--> END
  |             |
  +--> resumen -+
```

Cada nodo tiene una responsabilidad clara:

- `classify_intent`: analiza el texto del usuario y decide la ruta.
- `plan_node`: genera un plan breve y accionable.
- `ideas_node`: genera ideas creativas pero realistas.
- `resumen_node`: resume informacion y recomienda un siguiente paso.
- `call_model`: centraliza la llamada al modelo desplegado en Azure AI Foundry.

## Observabilidad con LangSmith

He anadido soporte opcional de LangSmith siguiendo el patron recomendado para LangGraph cuando se usa un SDK externo.

Como este proyecto llama al modelo con el SDK `openai`, se usan dos piezas:

- `wrap_openai`: envuelve el cliente de OpenAI para capturar la llamada al modelo.
- `@traceable`: marca funciones importantes para que aparezcan en la traza.

Si se activan las variables de LangSmith, se puede ver el recorrido completo:

```text
classify_intent -> plan_node | ideas_node | resumen_node -> foundry_chat_completion
```

Esto ayuda a depurar que ruta ha seguido el agente, que entrada ha recibido cada nodo y que respuesta ha generado el modelo.

## Configuracion

Rellena el archivo `.env` con los datos de tu despliegue:

```env
OPENAI_BASE_URL=
OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT_NAME=
```

Ejemplo de endpoint:

```env
OPENAI_BASE_URL=https://<tu-recurso>.services.ai.azure.com/openai/v1
```

Opcionalmente, para activar trazas en LangSmith:

```env
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=<tu-langsmith-api-key>
LANGSMITH_PROJECT=chispa-langgraph
```

Si la cuenta esta en la region EU:

```env
LANGSMITH_ENDPOINT=https://eu.api.smith.langchain.com
```

## Instalacion

```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Ejecucion

```bash
python src/agent.py
```

## Pruebas rapidas

```text
hazme un plan para preparar una demo de IA en 30 minutos
dame ideas divertidas para explicar LangGraph
resume este texto: LangGraph permite crear flujos con estado para agentes...
```

## Detalles tecnicos clave

- Uso `python-dotenv` para cargar las variables del archivo `.env`.
- Uso el SDK `openai` porque Azure AI Foundry expone un endpoint compatible.
- Uso `StateGraph` de LangGraph para definir el flujo del agente.
- Uso un `TypedDict` llamado `AgentState` para mantener el estado entre nodos.
- Uso `configurable.thread_id` al invocar el grafo, como patron habitual para identificar ejecuciones.
- Uso `wrap_openai` y `@traceable` para poder inspeccionar ejecuciones en LangSmith.
- El deployment del modelo no esta escrito en el codigo: se lee desde `AZURE_OPENAI_DEPLOYMENT_NAME`.
- El `.env` esta ignorado por git para no subir claves.

## Por que esta hecho con LangGraph

El flujo se define como un grafo:

```text
START -> classify_intent -> plan | ideas | resumen -> END
```

Esto permite separar la decision inicial de la respuesta final y deja el proyecto listo para ampliarlo con mas nodos, herramientas o memoria.

## Posibles mejoras

- Anadir memoria entre mensajes.
- Conectar herramientas externas, por ejemplo busqueda o calculadora.
- Guardar historico de conversaciones.
- Sustituir la clasificacion simple por una clasificacion hecha por el propio modelo.

## Practica opcional: Deep Agent

Tambien he anadido una practica opcional con Deep Agents:

```powershell
python src/deep_agent_study.py
```

El agente opcional se llama `Profe10` y ayuda a preparar sesiones de estudio. Usa `create_deep_agent`, herramientas propias y trazas en LangSmith.

Mas detalles en `docs/deep-agent-opcional.md`.

Diagramas utiles para explicarlo:

- `docs/flujo-deep-agent.svg`
- `docs/comparativa-agentes.svg`
