from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import azure.functions as func


CONCEPTOS = {
    "sampling": {
        "nombre": "Sampling",
        "idea": "El servidor MCP pide al cliente que use el modelo para generar una respuesta.",
        "dicho_facil": "Necesito que la IA piense este trozo por mi.",
        "analogia": "Como un profesor que pide a un alumno tres formas de explicar una idea.",
        "ejemplo": "Resume este texto en una frase clara.",
    },
    "elicitation": {
        "nombre": "Elicitation",
        "idea": "El servidor MCP pide al usuario informacion que falta.",
        "dicho_facil": "En vez de inventar, pregunta.",
        "analogia": "Como un camarero que pregunta que bebida quieres antes de servir.",
        "ejemplo": "Para reservar, dime fecha, hora y numero de personas.",
    },
    "roots": {
        "nombre": "Roots",
        "idea": "El cliente indica que carpetas o recursos puede ver el servidor MCP.",
        "dicho_facil": "Marca el terreno de juego permitido.",
        "analogia": "Como dar una llave que abre solo una habitacion, no toda la casa.",
        "ejemplo": "El servidor puede leer /proyecto-clase, pero no todo el ordenador.",
    },
}


def get_current_time(timezone: str = "Europe/Madrid") -> dict:
    """Devuelve la fecha y hora actual para una zona horaria IANA."""
    try:
        tz = ZoneInfo(timezone)
    except ZoneInfoNotFoundError:
        return {
            "ok": False,
            "error": f"Zona horaria no valida: {timezone}",
        }

    return {
        "ok": True,
        "timezone": timezone,
        "datetime": datetime.now(tz).isoformat(timespec="seconds"),
    }

def explain_mcp_concept(concept: str) -> dict:
    """Explica sampling, elicitation o roots con una analogia sencilla."""
    key = str(concept or "").strip().lower()
    if key not in CONCEPTOS:
        return {
            "ok": False,
            "error": "Concepto no valido. Usa: sampling, elicitation o roots.",
        }

    return {
        "ok": True,
        "concept": CONCEPTOS[key],
        "frase_para_recordar": "Sampling genera, Elicitation pregunta, Roots limita.",
    }

def list_mcp_concepts() -> dict:
    """Lista los tres conceptos MCP preparados para la explicacion de clase."""
    return {
        "ok": True,
        "conceptos": CONCEPTOS,
        "frase_para_recordar": "Sampling genera, Elicitation pregunta, Roots limita.",
    }


asgi_middleware = None
asgi_started = False


def get_asgi_middleware():
    global asgi_middleware
    if asgi_middleware is not None:
        return asgi_middleware

    from mcp.server.fastmcp import FastMCP
    from mcp.server.transport_security import TransportSecuritySettings

    mcp = FastMCP(
        "mcp-clase-azure-functions",
        instructions=(
            "Servidor MCP didactico desplegado en Azure Functions. "
            "Expone herramientas para demostrar MCP, Sampling, Elicitation y Roots."
        ),
        stateless_http=False,
        streamable_http_path="/api/mcp",
        json_response=True,
        log_level="ERROR",
        transport_security=TransportSecuritySettings(
            enable_dns_rebinding_protection=False,
        ),
    )

    mcp.tool()(get_current_time)
    mcp.tool()(explain_mcp_concept)
    mcp.tool()(list_mcp_concepts)

    asgi_middleware = func.AsgiMiddleware(mcp.streamable_http_app())
    return asgi_middleware

# Azure Functions indexa de forma muy fiable los triggers decorados. Usamos un
# wildcard HTTP y delegamos la peticion a la app ASGI de FastMCP.
app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)


@app.function_name(name="health")
@app.route(route="health", methods=["GET"])
def health(req: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse(
        '{"ok": true, "server": "FastMCP", "name": "mcp-clase-azure-functions"}',
        mimetype="application/json",
    )


@app.function_name(name="fastmcp_server")
@app.route(route="mcp", methods=["GET", "POST", "DELETE", "OPTIONS"])
async def fastmcp_server(req: func.HttpRequest, context: func.Context) -> func.HttpResponse:
    global asgi_started
    middleware = get_asgi_middleware()
    if not asgi_started:
        await middleware.notify_startup()
        asgi_started = True
    return await middleware.handle_async(req, context)
