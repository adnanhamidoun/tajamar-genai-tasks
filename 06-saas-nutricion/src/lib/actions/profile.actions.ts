"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface UpdateProfileParams {
  full_name?: string;
  age?: number;
  height?: number;
  weight?: number;
  gender?: "male" | "female";
  sport_type?: string;
  activity_level?: string;
  goal?: string;
  target_weight?: number;
  target_weeks?: number;
  coach_personality?: string;
  target_calories?: number;
}

export async function updateProfile(params: UpdateProfileParams | FormData) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "No autenticado" };
    }

    // Handle FormData if passed
    let data: UpdateProfileParams = {};
    if (params instanceof FormData) {
      data = {
        full_name: params.get("full_name") as string,
        target_calories: Number(params.get("target_calories")),
        age: params.get("age") ? Number(params.get("age")) : undefined,
        height: params.get("height") ? Number(params.get("height")) : undefined,
        weight: params.get("weight") ? Number(params.get("weight")) : undefined,
        gender: params.get("gender") as "male" | "female",
        sport_type: params.get("sport_type") as string,
        activity_level: params.get("activity_level") as string,
        goal: params.get("goal") as string,
        target_weight: params.get("target_weight") ? Number(params.get("target_weight")) : undefined,
        target_weeks: params.get("target_weeks") ? Number(params.get("target_weeks")) : undefined,
        coach_personality: params.get("coach_personality") as string,
      };
    } else {
      data = params;
    }

    // 1. Calcular Calorías Objetivo (TMB + Actividad + Meta)
    // Harris-Benedict Equation
    const age = data.age || 30;
    const weight = data.weight || 70;
    const height = data.height || 170;
    const gender = data.gender || "male";
    
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    if (gender === "male") {
      bmr += 5;
    } else {
      bmr -= 161;
    }
    
    // Activity Factor (More conservative and realistic)
    const activityFactors: Record<string, number> = {
      "sedentary": 1.15, // Poco ejercicio
      "moderate": 1.35,  // 3-4 días
      "active": 1.55,    // 5-6 días
      "athlete": 1.8     // Atleta pro / Trabajo muy físico
    };
    const factor = activityFactors[data.activity_level || "moderate"] || 1.35;
    let tdee = bmr * factor;

    // Plan adjustment (Strict Bio-Safety Caps)
    const weightDiff = (data.weight || 70) - (data.target_weight || data.weight || 70);
    const targetWeeks = data.target_weeks || 12;
    
    // 7700 kcal = 1kg fat roughly
    const totalRequiredDeficit = weightDiff * 7700;
    let weeklyDeficit = totalRequiredDeficit / targetWeeks;
    
    // HARD CAP: Max 1.5kg per week (11550 kcal weekly deficit)
    const maxWeeklyDeficit = 1.5 * 7700;
    if (weeklyDeficit > maxWeeklyDeficit) {
      weeklyDeficit = maxWeeklyDeficit;
    }

    const dailyDeficit = weeklyDeficit / 7;

    // Limit daily deficit to 1650kcal (1.5kg/week equivalent)
    const safeDailyDeficit = Math.max(Math.min(dailyDeficit, 1650), -1650);

    let target_calories = data.target_calories || Math.round(tdee - safeDailyDeficit);

    // Hard Floor: Never below 1200 kcal for basic metabolic functions
    if (target_calories < 1200) target_calories = 1200;
    if (target_calories > 5000) target_calories = 5000;

    // 2. Update DB
    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.full_name) updatePayload.full_name = data.full_name;
    if (data.age) updatePayload.age = data.age;
    if (data.height) updatePayload.height = data.height;
    if (data.weight) updatePayload.current_weight = data.weight;
    if (data.gender) updatePayload.gender = data.gender;
    if (data.sport_type) updatePayload.sport_type = data.sport_type;
    if (data.activity_level) updatePayload.activity_level = data.activity_level;
    if (data.goal) updatePayload.fitness_goal = data.goal;
    if (data.target_weight) updatePayload.target_weight = data.target_weight;
    if (data.target_weeks) updatePayload.target_weeks = data.target_weeks;
    if (data.coach_personality) updatePayload.coach_personality = data.coach_personality;
    updatePayload.target_calories = target_calories;

    const { error: dbError } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", user.id);

    if (dbError) throw dbError;

    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return { success: true, target_calories };
  } catch (error) {
    console.error("[updateOnboardingProfile] Error:", error);
    return { success: false, error: "Error al guardar el perfil" };
  }
}
