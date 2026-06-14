# Comparativa visual: agente normal vs Deep Agent

Archivos visuales:

- `docs/comparativa-agentes.svg`
- `docs/flujo-deep-agent.svg`

## Diferencia principal

El primer agente, `src/agent.py`, es un agente LangGraph normal. Yo defino el grafo a mano:

```text
START -> classify_intent -> plan | ideas | resumen -> END
```

Eso significa que el flujo es muy claro y controlado. Primero clasifica la intencion y luego va a una ruta fija.

El segundo agente, `src/deep_agent_study.py`, es un Deep Agent creado con:

```python
create_deep_agent(...)
```

En este caso el agente tiene mas autonomia: puede planificar, decidir si usa herramientas y ejecutar pasos internos para resolver la tarea.

## Tabla rapida

| Punto | Agente normal | Deep Agent |
| --- | --- | --- |
| Archivo | `src/agent.py` | `src/deep_agent_study.py` |
| Construccion | `StateGraph` | `create_deep_agent` |
| Flujo | Lo defino yo manualmente | Lo gestiona el agente con herramientas |
| Rutas | `plan`, `ideas`, `resumen` | Planificacion + tools |
| Herramientas | No usa herramientas propias | Usa 3 tools propias |
| Ideal para | Flujo simple y explicable | Tareas mas abiertas |
| LangSmith | Veo nodos del grafo | Veo planificacion y llamadas a tools |

## Frase para el video

"La diferencia principal es que en el agente normal yo diseno el grafo de forma explicita: clasifico la intencion y mando la ejecucion a una ruta fija. En el Deep Agent uso `create_deep_agent`, y el propio agente tiene mas autonomia para planificar y decidir que herramientas necesita usar."
