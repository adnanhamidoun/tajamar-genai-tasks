import os
from typing import Literal, TypedDict

from dotenv import load_dotenv
from langgraph.graph import END, START, StateGraph
from langsmith import traceable
from langsmith.wrappers import wrap_openai
from openai import OpenAI


load_dotenv()

Intent = Literal["plan", "ideas", "resumen"]


class AgentState(TypedDict):
    user_input: str
    intent: Intent
    answer: str


def get_client() -> tuple[OpenAI, str]:
    base_url = os.getenv("OPENAI_BASE_URL", "").rstrip("/")
    api_key = os.getenv("OPENAI_API_KEY")
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")

    missing = [
        name
        for name, value in {
            "OPENAI_BASE_URL": base_url,
            "OPENAI_API_KEY": api_key,
            "AZURE_OPENAI_DEPLOYMENT_NAME": deployment,
        }.items()
        if not value
    ]

    if missing:
        raise ValueError(f"Faltan variables en .env: {', '.join(missing)}")

    client = OpenAI(base_url=base_url, api_key=api_key)
    return wrap_openai(client), deployment


def get_langsmith_status() -> str:
    tracing = os.getenv("LANGSMITH_TRACING", "false").lower() == "true"
    api_key = os.getenv("LANGSMITH_API_KEY")
    project = os.getenv("LANGSMITH_PROJECT", "default")
    endpoint = os.getenv("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com")

    if tracing and api_key:
        return f"LangSmith tracing activo. Proyecto: {project}. Endpoint: {endpoint}"

    if tracing and not api_key:
        return "LangSmith tracing activado, pero falta LANGSMITH_API_KEY"

    return "LangSmith tracing desactivado"


@traceable(name="foundry_chat_completion")
def call_model(system_prompt: str, user_input: str) -> str:
    client, deployment = get_client()
    response = client.chat.completions.create(
        model=deployment,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_input},
        ],
        temperature=0.6,
        max_tokens=550,
    )
    return response.choices[0].message.content or ""


@traceable(name="classify_intent")
def classify_intent(state: AgentState) -> AgentState:
    text = state["user_input"].lower()

    if any(word in text for word in ["resume", "resumen", "sintetiza", "explica"]):
        intent: Intent = "resumen"
    elif any(word in text for word in ["idea", "crea", "inventa", "divertido"]):
        intent = "ideas"
    else:
        intent = "plan"

    return {**state, "intent": intent}


@traceable(name="plan_node")
def plan_node(state: AgentState) -> AgentState:
    prompt = (
        "Eres Chispa, un agente LangGraph de productividad. "
        "Transforma lo que pide el usuario en un plan breve, accionable y motivador. "
        "Responde en espanol con: objetivo, 3 pasos, primer micro-paso y una frase final con humor ligero."
    )
    return {**state, "answer": call_model(prompt, state["user_input"])}


@traceable(name="ideas_node")
def ideas_node(state: AgentState) -> AgentState:
    prompt = (
        "Eres Chispa, un agente creativo. "
        "Da ideas utiles y divertidas, pero realistas. "
        "Responde en espanol con 5 ideas numeradas y marca una como la mejor para empezar hoy."
    )
    return {**state, "answer": call_model(prompt, state["user_input"])}


@traceable(name="resumen_node")
def resumen_node(state: AgentState) -> AgentState:
    prompt = (
        "Eres Chispa, un agente que explica sin enrollarse. "
        "Resume el contenido del usuario en espanol claro. "
        "Devuelve: resumen en 4 lineas, puntos clave y siguiente accion recomendada."
    )
    return {**state, "answer": call_model(prompt, state["user_input"])}


def route(state: AgentState) -> Intent:
    return state["intent"]


def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("classify_intent", classify_intent)
    graph.add_node("plan", plan_node)
    graph.add_node("ideas", ideas_node)
    graph.add_node("resumen", resumen_node)

    graph.add_edge(START, "classify_intent")
    graph.add_conditional_edges(
        "classify_intent",
        route,
        {
            "plan": "plan",
            "ideas": "ideas",
            "resumen": "resumen",
        },
    )
    graph.add_edge("plan", END)
    graph.add_edge("ideas", END)
    graph.add_edge("resumen", END)

    return graph.compile()


def main() -> None:
    app = build_graph()
    config = {
        "run_name": "chispa_langgraph_demo",
        "tags": ["demo", "langgraph", "azure-foundry"],
        "metadata": {
            "thread_id": "chispa-demo",
            "agent_name": "Chispa",
        },
        "configurable": {"thread_id": "chispa-demo"},
    }

    print("Chispa: agente LangGraph listo. Escribe 'salir' para terminar.")
    print(get_langsmith_status())
    print("Prueba con: 'hazme un plan para estudiar LangGraph en 1 hora'")

    while True:
        user_input = input("\nTu: ").strip()
        if user_input.lower() in {"salir", "exit", "quit"}:
            print("Chispa: cerrado. A por ese 10.")
            break

        result = app.invoke(
            {"user_input": user_input, "intent": "plan", "answer": ""},
            config=config,
        )
        print(f"\nChispa [{result['intent']}]:\n{result['answer']}")


if __name__ == "__main__":
    main()
