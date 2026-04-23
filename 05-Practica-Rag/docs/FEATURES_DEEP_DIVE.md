# 💎 Las Joyas de la Corona: Deep Dive

[Volver al Inicio](./README.md)

## 🧱 Aislamiento de Datos
**¿Cómo evitamos las fugas?** Todo en la base de datos y en Azure AI Search gira en torno a un particionado lógico mediante `assistant_id` y `thread_id`.
- Cuando se realiza una búsqueda semántica, el filtro `assistant_id eq '{id}'` es inyectado a nivel de SDK.
- Esto significa que matemáticamente, la consulta nunca "ve" los vectores que pertenecen a otro `assistant_id`.

## 🗑️ La Triple Purga
**Algoritmo de borrado síncrono:** Cuando un usuario elimina un documento (o un asistente entero), se dispara un proceso crítico de 3 pasos:
1. **Azure Blob Storage:** El PDF físico se destruye.
2. **Azure AI Search:** Mediante un patrón Regex o filtro exacto, se purgan *todos los fragmentos (chunks)* de los vectores indexados que contengan ese ID.
3. **Azure SQL:** Se actualizan los metadatos (el `document_count` baja).
*¿Por qué?* Porque si dejamos vectores huérfanos, el RAG podría devolver textos de documentos teóricamente borrados, causando una brecha de seguridad.

## 🧠 Inferencia RAG y Deducción
Lejos del *"match and return"*, la IA aplica razonamiento. 
Si el documento dice *"Las proteínas aportan 4 kcal por gramo"* y el usuario pregunta *"¿Cuántas calorías aportan 10 gramos de proteína?"*, el asistente debe multiplicar 10x4.
*¿Por qué lo hicimos así?* Porque en entornos corporativos, las normativas no siempre tienen respuestas directas, sino reglas que hay que cruzar y evaluar. Nuestra Instrucción Base Global fuerza al modelo a realizar estas inferencias explicitamente.

## ⚡ Streaming y el Buffer de 50ms
React tiene problemas de rendimiento si modificas el estado (DOM) cada vez que OpenAI devuelve un *token* (una sílaba). Provoca parpadeos horribles.
**La Solución:** Implementamos un `streamBufferRef` en `Chat.jsx`. Acumulamos los tokens recibidos y los volcamos a la interfaz visual usando un `setInterval` cada 50ms. 
*¿Por qué?* Esto equilibra una respuesta fluida (el usuario ve el texto aparecer palabra a palabra) sin fundir la CPU del navegador.
