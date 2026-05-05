import { NextRequest, NextResponse } from 'next/server'
import { createAzureClient, AZURE_DEPLOYMENT } from '@/lib/azure/openai'
import { createClient } from '@/lib/supabase/server'
import { saveMeal } from '@/lib/actions/meal.actions'
import { z } from 'zod'

// ============================================================
// SCHEMA ZOD — Contrato de respuesta de la IA
// ============================================================
const MealAnalysisSchema = z.object({
  name: z.string().min(1),
  calories: z.number().int().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  serving_size_g: z.number().nonnegative(),
  health_score: z.number().int().min(1).max(10),
  feedback: z.string().min(1),
})

export type MealAnalysis = z.infer<typeof MealAnalysisSchema>

// ============================================================
// THE GOAT PROMPT — Nutricionista experto, directo y sarcástico
// ============================================================
const PERSONALITIES = {
  tactical: {
    name: "Coach Vital",
    style: "Amigable, motivador y cercano. Usa un lenguaje sencillo y enfocado en la salud y el bienestar integral. Evita tecnicismos innecesarios y términos militares. Trata al usuario con respeto y calidez.",
    suffix: "¡Sigue así, lo estás haciendo genial! 🌱"
  },
  casual: {
    name: "Coach Nexo",
    style: "Directo, moderno y con un toque de humor ligero. Como un buen amigo que sabe de nutrición. No es excesivamente serio, pero sí profesional. Usa comparaciones cotidianas.",
    suffix: "¡A disfrutar del día! ✌️"
  },
  scientific: {
    name: "Dra. Elena",
    style: "Profesional, basada en evidencia científica y muy clara. Explica el porqué de las cosas de forma educativa. Su objetivo es que aprendas a comer mejor, no solo que cuentes calorías.",
    suffix: "La constancia es la clave del éxito saludable."
  }
};

const getSystemPrompt = (personalityKey: string = 'tactical') =>  {
  const p = PERSONALITIES[personalityKey as keyof typeof PERSONALITIES] || PERSONALITIES.tactical;
  
  return `You are a dual-process AI Nutritionist. 
  
  PROCESS 1: SCIENTIFIC ANALYSIS (Strictly Objective)
  1. Identify all food/drink items in the image.
  2. Estimate volumes in grams using standard visual references.
  3. Calculate Calories, Protein, Carbs, and Fat using standard nutritional databases (USDA/FDC style).
  4. DATA INTEGRITY: These numbers must be scientifically accurate and MUST NOT change regardless of the coaching style. 100g of chicken is ALWAYS ~165kcal, 31g protein.
  
  PROCESS 2: COACHING VERDICT (Subjective Style: ${p.name})
  1. Based on the objective data from Process 1, provide a verdict in Spanish.
  2. The style must be: ${p.style}
  3. Use exactly 1 or 2 sentences.
  
  OUTPUT FORMAT (Strict JSON):
  {
    "name": "Food name in Spanish",
    "calories": number (integer),
    "protein": number (float),
    "carbs": number (float),
    "fat": number (float),
    "serving_size_g": number (integer),
    "health_score": number (1-10),
    "feedback": "Your verdict in Spanish here"
  }`;
};

// ============================================================
// HANDLER PRINCIPAL — POST /api/analyze
// ============================================================
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. AUTENTICACIÓN
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Inicia sesión primero.' },
        { status: 401 }
      )
    }

    // 2. PARSEAR BODY
    let body: { image?: string; text?: string; imageType?: string; imageUrl?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Body inválido.' },
        { status: 400 }
      )
    }

    const { image, text, imageType = 'image/jpeg', imageUrl } = body

    if (!image && !text) {
      return NextResponse.json(
        { error: 'Se requiere una imagen o una descripción de texto.' },
        { status: 400 }
      )
    }

    // 3. VALIDAR TAMAÑO (Si hay imagen)
    if (image) {
      const estimatedBytes = (image.length * 3) / 4
      if (estimatedBytes > 4 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Imagen demasiado grande. Máximo 4MB.' },
          { status: 413 }
        )
      }
    }

    // 4. OBTENER PERSONALIDAD DEL PERFIL
    const { data: profile } = await supabase
      .from('profiles')
      .select('coach_personality')
      .eq('id', user.id)
      .single()

    // 5. LLAMADA A AZURE OPENAI
    const azure = createAzureClient()
    
    // Preparar contenido según si es imagen o texto
    const userContent: any[] = []
    
    if (image) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: `data:${imageType};base64,${image}`,
          detail: 'low',
        },
      })
      userContent.push({
        type: 'text',
        text: 'Analiza esta comida y devuelve el JSON.',
      })
    } else {
      userContent.push({
        type: 'text',
        text: `El usuario ha ingerido lo siguiente: "${text}". Analiza nutricionalmente esta descripción y devuelve el JSON.`,
      })
    }

    const response = await azure.chat.completions.create({
      model: AZURE_DEPLOYMENT,
      max_tokens: 500,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(profile?.coach_personality),
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
    })

    // 5. EXTRAER Y PARSEAR RESPUESTA
    const rawContent = response.choices[0]?.message?.content
    if (!rawContent) {
      return NextResponse.json(
        { error: 'El modelo no devolvió respuesta. Intenta de nuevo.' },
        { status: 502 }
      )
    }

    let parsedData: unknown
    try {
      parsedData = JSON.parse(rawContent)
    } catch {
      console.error('[analyze] JSON parse error:', rawContent)
      return NextResponse.json(
        { error: 'Respuesta del modelo en formato inválido.' },
        { status: 502 }
      )
    }

    // 6. VALIDAR CON ZOD
    const validation = MealAnalysisSchema.safeParse(parsedData)
    if (!validation.success) {
      console.error('[analyze] Zod validation error:', validation.error.issues)
      return NextResponse.json(
        { error: 'Los datos del análisis no pasaron la validación.', raw: parsedData },
        { status: 502 }
      )
    }

    const mealData = validation.data

    // 7. PERSISTIR VIA SERVER ACTION — saveMeal()
    const saveResult = await saveMeal({
      food_name: mealData.name,
      calories: mealData.calories,
      protein: mealData.protein,
      carbs: mealData.carbs,
      fat: mealData.fat,
      serving_size_g: mealData.serving_size_g,
      health_tip: `[${mealData.health_score}/10] ${mealData.feedback}`,
      image_url: imageUrl,
    })

    if (!saveResult.success) {
      console.error('[analyze] saveMeal error:', saveResult.error)
      // Devolvemos el análisis aunque falle el guardado
      return NextResponse.json({
        success: true,
        data: mealData,
        saved: false,
        db_error: saveResult.error,
        response_time_ms: Date.now() - startTime,
      })
    }

    // 8. RESPUESTA EXITOSA
    return NextResponse.json({
      success: true,
      data: mealData,
      saved: true,
      meal_id: saveResult.meal_id,
      response_time_ms: Date.now() - startTime,
      usage: {
        prompt_tokens: response.usage?.prompt_tokens ?? 0,
        completion_tokens: response.usage?.completion_tokens ?? 0,
      },
    })

  } catch (error) {
    console.error('[analyze] Unexpected error:', error)

    if (error instanceof Error) {
      if (error.message.includes('content_filter')) {
        return NextResponse.json(
          { error: 'Imagen bloqueada por filtros de contenido.' },
          { status: 400 }
        )
      }
      if (error.message.includes('rate_limit')) {
        return NextResponse.json(
          { error: 'Demasiadas peticiones. Espera unos segundos.' },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Error interno del servidor. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
