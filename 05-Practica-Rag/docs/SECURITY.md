# Seguridad y Aislamiento Multi-Tenant 🛡️

En entornos empresariales donde la Inteligencia Artificial gestiona documentos críticos (recursos humanos, auditorías, datos financieros), la seguridad no es una característica opcional, es la fundación del producto. 

El punto estrella de **Aisla-RAG** es su arquitectura de **Aislamiento Multi-Asistente**.

[Volver al Inicio](../README.md) | [Ver Arquitectura](ARCHITECTURE.md) | [Ver Base de Datos](DATABASE.md)

---

## El Riesgo Crítico: Data Leakage (Fuga de Datos)

En un sistema RAG tradicional que comparte un único índice vectorial, el mayor riesgo es que al interrogar a un "Asistente de Marketing", el motor de búsqueda semántica devuelva fragmentos pertenecientes a documentos subidos al "Asistente de Recursos Humanos" (como nóminas o despidos), provocando una fuga de datos masiva e imperceptible a nivel de infraestructura.

Aisla-RAG soluciona este problema desde el núcleo de Azure AI Search.

## La Solución: Aislamiento OData Nativo

En lugar de confiar en que el LLM discrimine a qué asistente pertenece un documento, **bloqueamos el acceso físicamente en la fase de recuperación de la Base de Datos Vectorial**.

### Flujo de Protección:
1. Durante la **Ingesta**, cada pequeño fragmento de texto subido a Azure AI Search lleva sellado herméticamente el campo inmutable `assistant_id`.
2. En el esquema del índice, declaramos el campo `assistant_id` como `Filterable`. Esto ordena a los clústeres subyacentes de Azure indexarlo de forma tabular.
3. Durante la **Consulta**, el `RAGService` aplica forzosamente el filtro OData a nivel de la API de Azure: `$filter=assistant_id eq 'TU-UUID-ID'`.
4. **Resultado:** Matemáticamente y por restricciones del propio motor de base de datos de Microsoft, la consulta vectorial (`k_nearest_neighbors`) se ejecuta *única y exclusivamente* sobre la partición lógica del asistente correspondiente. Es decir, los documentos de otros asistentes **físicamente no existen** durante esa búsqueda.

---

## Prevención de Enumeración (UUIDs)

En diseños legados, los identificadores de recursos suelen ser numéricos (`id=1`, `id=2`). Esto abre la puerta a ataques tipo **IDOR (Insecure Direct Object Reference)** o escaneos de enumeración, donde un atacante puede deducir iterando que existen más registros de los debidos.

### Implementación en Aisla-RAG
Toda la persistencia (tanto en Azure SQL como en Azure AI Search) utiliza identificadores **UUID v4** de 128 bits:

- Ejemplo: `2ba21bcb-ce3f-4e71-abf8-c18d10fd00bd`
- **Justificación:** El espacio de colisión y adivinación es de $2^{122}$. Un atacante no puede escanear iterativamente nuestra API para descubrir otros asistentes o hilos de chat, porque predecir el siguiente `id` válido es criptográficamente inviable. Esto blinda los endpoints `/assistants/{id}` y las sesiones de chat ante observadores no autorizados.
