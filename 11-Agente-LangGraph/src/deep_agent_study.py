import os
from datetime import datetime
from pathlib import Path

from deepagents import create_deep_agent
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI


load_dotenv()

OUTPUT_DIR = Path("outputs")


def get_required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(f"Falta la variable {name} en .env")
    return value


def get_model() -> ChatOpenAI:
    return ChatOpenAI(
        model=get_required_env("AZURE_OPENAI_DEPLOYMENT_NAME"),
        api_key=get_required_env("OPENAI_API_KEY"),
        base_url=get_required_env("OPENAI_BASE_URL").rstrip("/"),
        temperature=0.4,
    )


def estimate_study_blocks(topic: str, minutes: int) -> str:
    """Create a practical time distribution for studying a topic."""
    warmup = max(5, int(minutes * 0.15))
    practice = max(10, int(minutes * 0.55))
    review = max(5, minutes - warmup - practice)

    return (
        f"Tema: {topic}\n"
        f"Tiempo total: {minutes} minutos\n"
        f"- Activacion: {warmup} min para entender conceptos clave.\n"
        f"- Practica: {practice} min para hacer ejemplos o ejercicios.\n"
        f"- Repaso: {review} min para resumir, detectar dudas y cerrar."
    )


def create_checklist(topic: str) -> str:
    """Create a short checklist for preparing and reviewing a study session."""
    items = [
        f"Definir el objetivo concreto de {topic}.",
        "Anotar 3 conceptos clave.",
        "Hacer al menos 1 ejemplo practico.",
        "Escribir dudas pendientes.",
        "Cerrar con un resumen de 5 lineas.",
    ]
    return "\n".join(f"- [ ] {item}" for item in items)


def save_study_report(title: str, content: str) -> str:
    """Save a study plan or report as a Markdown file inside the outputs folder."""
    OUTPUT_DIR.mkdir(exist_ok=True)
    safe_title = "".join(char if char.isalnum() else "-" for char in title.lower())
    safe_title = "-".join(part for part in safe_title.split("-") if part)
    filename = f"{datetime.now().strftime('%Y%m%d-%H%M%S')}-{safe_title[:40]}.md"
    path = OUTPUT_DIR / filename
    path.write_text(content, encoding="utf-8")
    return f"Informe guardado en {path}"


SYSTEM_PROMPT = """Eres Profe10, un deep agent de estudio.

Tu funcion es ayudar a preparar una mini sesion de aprendizaje clara y accionable.

Debes:
- Entender el objetivo del usuario.
- Planificar antes de responder cuando la tarea tenga varios pasos.
- Usar herramientas cuando aporten valor.
- Crear planes breves, utiles y faciles de seguir.
- Si generas un plan completo, puedes guardarlo con save_study_report.

Herramientas disponibles:
- estimate_study_blocks: reparte el tiempo de estudio.
- create_checklist: genera una checklist practica.
- save_study_report: guarda el resultado en Markdown.

Responde siempre en espanol claro y con tono cercano.
"""


def build_deep_agent():
    return create_deep_agent(
        model=get_model(),
        tools=[estimate_study_blocks, create_checklist, save_study_report],
        system_prompt=SYSTEM_PROMPT,
        name="profe10_deep_agent",
    )


def print_langsmith_status() -> None:
    tracing = os.getenv("LANGSMITH_TRACING", "false").lower() == "true"
    project = os.getenv("LANGSMITH_PROJECT", "default")
    endpoint = os.getenv("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com")

    if tracing:
        print(f"LangSmith tracing activo. Proyecto: {project}. Endpoint: {endpoint}")
    else:
        print("LangSmith tracing desactivado")


def extract_last_text(result: dict) -> str:
    message = result["messages"][-1]
    content = getattr(message, "content", message)

    if isinstance(content, list):
        return "\n".join(
            block.get("text", str(block)) if isinstance(block, dict) else str(block)
            for block in content
        )

    return str(content)


def main() -> None:
    agent = build_deep_agent()
    config = {
        "run_name": "profe10_deep_agent_demo",
        "tags": ["optional-practice", "deepagents", "langgraph"],
        "metadata": {"agent_name": "Profe10", "practice": "deep-agents"},
        "configurable": {"thread_id": "profe10-demo"},
    }

    print("Profe10: deep agent opcional listo. Escribe 'salir' para terminar.")
    print_langsmith_status()
    print("Prueba: prepara una sesion de 45 minutos para aprender LangGraph.")

    while True:
        user_input = input("\nTu: ").strip()
        if user_input.lower() in {"salir", "exit", "quit"}:
            print("Profe10: practica cerrada.")
            break

        result = agent.invoke(
            {"messages": [{"role": "user", "content": user_input}]},
            config=config,
        )
        print(f"\nProfe10:\n{extract_last_text(result)}")


if __name__ == "__main__":
    main()
