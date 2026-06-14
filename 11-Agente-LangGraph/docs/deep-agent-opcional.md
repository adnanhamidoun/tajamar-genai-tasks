# Practica opcional: Deep Agent con LangGraph

Archivo principal: `src/deep_agent_study.py`

## Que hace

He creado un segundo agente llamado **Profe10** usando `deepagents`, la libreria de Deep Agents de LangGraph.

Su objetivo es ayudar a preparar sesiones de estudio. El usuario le pide una tarea, por ejemplo:

```text
prepara una sesion de 45 minutos para aprender LangGraph
```

El agente puede:

- Repartir el tiempo de estudio.
- Crear una checklist.
- Generar un plan final.
- Guardar el resultado como archivo Markdown en `outputs/`.
- Registrar la ejecucion en LangSmith si el tracing esta activado.

## Por que es un Deep Agent

No es solo una llamada directa al modelo. Se crea con:

```python
create_deep_agent(...)
```

Deep Agents esta construido sobre LangGraph y aporta capacidades de agente mas avanzadas, como planificacion, uso de herramientas, gestion de contexto y trazabilidad.

## Flujo visual

Puedes ensenar estos diagramas en el video:

- `docs/flujo-deep-agent.svg`: flujo del agente Profe10.
- `docs/comparativa-agentes.svg`: diferencia entre el agente normal y el Deep Agent.

## Herramientas propias

El agente tiene tres herramientas:

- `estimate_study_blocks`: reparte el tiempo de estudio.
- `create_checklist`: crea una checklist practica.
- `save_study_report`: guarda el plan en Markdown.

## Como ejecutarlo

```powershell
python src/deep_agent_study.py
```

## Frase para el video

"Para la practica opcional he creado un agente con Deep Agents de LangGraph. Este agente se llama Profe10 y prepara sesiones de estudio. A diferencia del primer agente, aqui uso `create_deep_agent`, herramientas propias y trazas en LangSmith para observar la planificacion, las llamadas a herramientas y la respuesta final."
