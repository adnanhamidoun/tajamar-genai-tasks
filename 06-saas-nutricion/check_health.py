import os
from openai import AzureOpenAI
from supabase import create_client
from dotenv import load_dotenv

# Cargamos el archivo .env.local
# Intentamos cargar .env o .env.local
if os.path.exists(".env.local"):
    load_dotenv(dotenv_path=".env.local")
else:
    load_dotenv(dotenv_path=".env")

def run_diagnostic():
    print("🚀 Iniciando el GOAT Health Check...\n")
    print("-" * 30)

    # --- 1. COMPROBACIÓN SUPABASE ---
    try:
        url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        supabase = create_client(url, key)
        # Intentamos leer la tabla profiles que creamos con el SQL
        response = supabase.table("profiles").select("*").limit(1).execute()
        
        print("✅ SUPABASE: ¡Conexión exitosa! Tabla 'profiles' accesible.")
    except Exception as e:
        print(f"❌ SUPABASE: Error -> {e}")

    print("-" * 30)

    # --- 2. COMPROBACIÓN AZURE OPENAI ---
    try:
        api_key = os.getenv("AZURE_OPENAI_API_KEY")
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
        api_version = os.getenv("AZURE_API_VERSION")

        if not endpoint:
            raise ValueError("AZURE_OPENAI_ENDPOINT no está configurado")

        # Detección de tipo de endpoint
        if "/api/projects/" in endpoint:
            # Es un endpoint de Azure AI Studio / Foundry Project
            # Usamos el cliente OpenAI estándar apuntando al base_url del proyecto
            from openai import OpenAI
            # Limpiamos el endpoint para obtener el base_url (quitamos /responses si existe)
            base_url = endpoint.split("/responses")[0]
            client = OpenAI(api_key=api_key, base_url=base_url)
            model_name = deployment
        else:
            # Es un endpoint estándar de Azure OpenAI (ej: https://res.openai.azure.com/)
            raw_endpoint = endpoint.split("/openai")[0]
            client = AzureOpenAI(
                api_key=api_key,
                api_version=api_version,
                azure_endpoint=raw_endpoint
            )
            model_name = deployment

        response = client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": "Responde solo con la palabra 'GOAT'."}],
            max_tokens=10
        )

        result = response.choices[0].message.content
        print(f"✅ AZURE AI: Respuesta recibida -> {result}")
        
    except Exception as e:
        print(f"❌ AZURE AI: Error -> {e}")
        print("\n💡 Tip: Revisa si el DEPLOYMENT_NAME es exactamente 'gpt-4o-mini-1'")

    print("-" * 30)
    print("\n🏁 Diagnóstico finalizado.")

if __name__ == "__main__":
    run_diagnostic()