import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAzureClient, AZURE_DEPLOYMENT } from "@/lib/azure/openai";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { remaining, coachType } = await req.json();

    const coachPrompts: any = {
      tactical: "Eres el Coach Vital de DAIL. Tu misión es la precisión absoluta en la dieta base. Tono directo, elite y motivador.",
      casual: "Eres el Coach Nexo de DAIL. Ayuda al usuario a cerrar sus macros de forma fácil y rica. Tono moderno y profesional.",
      scientific: "Eres la Dra. Elena de DAIL. Enfoque en densidad nutricional y evidencia científica para completar el plan base."
    };

    const systemPrompt = `
      ${coachPrompts[coachType] || coachPrompts.casual}
      Contexto DAIL Elite: La dieta es el plan base inamovible. El ejercicio es un extra gestionado aparte.
      El usuario debe completar estos macros de su PLAN BASE para cerrar el día:
      - Calorías: ${remaining.calories} kcal
      - Proteínas: ${remaining.protein}g
      - Carbohidratos: ${remaining.carbs}g
      - Grasas: ${remaining.fat}g

      Instrucciones CRÍTICAS:
      1. Sugiere alimentos de DESPENSA (rápido, 'apañao') para cuadrar estos números.
      2. Enfócate 100% en el PLAN BASE. Ignora cualquier gasto calórico extra por ejercicio.
      3. El tono debe ser directo, premium y centrado en la disciplina nutricional.
      4. Cada alimento debe incluir su EMOJI correspondiente.
      5. Responde SIEMPRE en formato JSON:
      {
        "title": "Ajuste Pro",
        "suggestion": "Frase corta y disciplinada del coach",
        "foods": [
          {"name": "Alimento + Emoji", "amount": "Cantidad estimada"}
        ]
      }
    `;

    const azure = createAzureClient();
    const response = await azure.chat.completions.create({
      model: AZURE_DEPLOYMENT,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "¿Qué alimentos me sugieres para cerrar mis macros hoy?" }
      ],
      response_format: { type: "json_object" }
    });

    const content = JSON.parse(response.choices[0].message.content || "{}");

    return NextResponse.json(content);
  } catch (error: any) {
    console.error("Error en sugerencia:", error);
    return NextResponse.json({ error: "No se pudo generar la sugerencia" }, { status: 500 });
  }
}
