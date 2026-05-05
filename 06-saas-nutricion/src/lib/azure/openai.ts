import OpenAI, { AzureOpenAI } from 'openai'

/**
 * Crea un cliente Azure OpenAI configurado para el endpoint del proyecto.
 * 
 * NOTA: El endpoint en .env es de Azure AI Studio / Foundry Project
 * (formato: /api/projects/.../openai/v1/responses).
 * Usamos el cliente OpenAI estándar apuntando al base_url del proyecto,
 * ya que AzureOpenAI no soporta este tipo de endpoint.
 */
export function createAzureClient(): OpenAI {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT!

  // Detectar tipo de endpoint
  if (endpoint.includes('/api/projects/')) {
    // Azure AI Studio / Foundry Project endpoint
    // Limpiar /responses si existe
    const baseUrl = endpoint.replace(/\/responses\/?$/, '')
    return new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY!,
      baseURL: baseUrl,
    })
  }

  // Endpoint estándar de Azure OpenAI
  return new AzureOpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY!,
    endpoint: endpoint.split('/openai')[0],
    apiVersion: process.env.AZURE_API_VERSION!,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
  })
}

export const AZURE_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME!
