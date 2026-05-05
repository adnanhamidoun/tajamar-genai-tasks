"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================================
// TIPOS — Contrato de datos para guardar comidas
// ============================================================
export interface SaveMealParams {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  health_tip?: string;
  image_url?: string;
  serving_size_g?: number;
  meal_type?: "breakfast" | "lunch" | "dinner" | "snack" | "other";
}

export interface SaveMealResult {
  success: boolean;
  meal_id?: string;
  error?: string;
}

// ============================================================
// saveMeal — Inserta una comida en Supabase (seguro, server-side)
// ============================================================
export async function saveMeal(
  params: SaveMealParams
): Promise<SaveMealResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "No autenticado. Inicia sesión." };
    }

    // Determinar tipo de comida según la hora
    const mealType = params.meal_type ?? inferMealType();

    const { data, error: dbError } = await supabase
      .from("meals")
      .insert({
        user_id: user.id,
        food_name: params.food_name,
        calories: params.calories,
        protein: params.protein,
        carbs: params.carbs,
        fat: params.fat,
        health_tip: params.health_tip ?? null,
        image_url: params.image_url ?? null,
        serving_size_g: params.serving_size_g ?? 0,
        meal_type: mealType,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("[saveMeal] DB error:", dbError);
      return { success: false, error: dbError.message };
    }

    // Revalidar rutas para que el dashboard y el historial se actualicen
    revalidatePath("/dashboard");
    revalidatePath("/history");

    return { success: true, meal_id: data.id };
  } catch (err) {
    console.error("[saveMeal] Unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

// ============================================================
// updateMeal — Actualiza los datos de una comida existente
// ============================================================
export async function updateMeal(id: string, updates: Partial<SaveMealParams> & { quantity?: number }) {
  try {
    const supabase = await createClient();
    const { error: dbError } = await supabase
      .from("meals")
      .update({
        food_name: updates.food_name,
        calories: updates.calories,
        protein: updates.protein,
        carbs: updates.carbs,
        fat: updates.fat,
        serving_size_g: updates.serving_size_g,
        quantity: updates.quantity
      })
      .eq("id", id);

    if (dbError) throw dbError;

    revalidatePath("/dashboard");
    revalidatePath("/history");
    return { success: true };
  } catch (err) {
    console.error("[updateMeal] error:", err);
    return { success: false, error: "Error al actualizar" };
  }
}

// ============================================================
// deleteMeal — Elimina una comida por ID
// ============================================================
export async function deleteMeal(id: string) {
  try {
    const supabase = await createClient();
    const { error: dbError } = await supabase
      .from("meals")
      .delete()
      .eq("id", id);

    if (dbError) throw dbError;

    revalidatePath("/dashboard");
    revalidatePath("/history");
    return { success: true };
  } catch (err) {
    console.error("[deleteMeal] error:", err);
    return { success: false, error: "Error al eliminar" };
  }
}

// ============================================================
// Helper — Inferir tipo de comida según hora del servidor
// ============================================================
function inferMealType(): "breakfast" | "lunch" | "dinner" | "snack" | "other" {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 16) return "lunch";
  if (hour >= 16 && hour < 21) return "dinner";
  return "snack";
}
