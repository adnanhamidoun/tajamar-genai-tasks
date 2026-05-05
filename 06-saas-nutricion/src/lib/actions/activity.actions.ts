"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// MET values for calories calculation
const MET_VALUES: Record<string, number> = {
  gym: 6.0,
  calisthenics: 8.0,
  football: 9.0,
  running: 10.0,
  martial_arts: 10.5,
  tennis: 7.0,
  crossfit: 12.0,
  other: 5.0
};

const INTENSITY_MULTIPLIERS: Record<string, number> = {
  low: 0.7,
  moderate: 1.0,
  high: 1.3,
  elite: 1.6
};

export async function logActivity(data: {
  sport_type: string;
  duration_mins: number;
  intensity: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  const { data: profile } = await supabase.from("profiles").select("current_weight").eq("id", user.id).single();
  const weight = profile?.current_weight || 75;
  const baseMet = MET_VALUES[data.sport_type] || 5.0;
  const intensityFactor = INTENSITY_MULTIPLIERS[data.intensity] || 1.0;
  const caloriesBurned = Math.round((baseMet * weight * (data.duration_mins / 60)) * intensityFactor);

  const { error } = await supabase.from("activities").insert({
    user_id: user.id,
    activity_type: data.sport_type,
    duration_min: data.duration_mins,
    intensity: data.intensity as any,
    calories_burned: caloriesBurned
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/bank");
  return { success: true, calories: caloriesBurned };
}

export async function getFlexBankStatus() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return null;

  const now = new Date();
  const currentDay = now.getDay(); 
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0,0,0,0);

  const { data: meals } = await supabase.from("meals").select("calories, created_at").eq("user_id", user.id).gte("created_at", monday.toISOString());
  const { data: activities } = await supabase.from("activities").select("calories_burned, created_at").eq("user_id", user.id).gte("created_at", monday.toISOString());

  // Utilidad para obtener YYYY-MM-DD en hora local
  const getLocalStr = (d: Date) => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  let totalBalance = 0;
  const daysToProcess: string[] = [];
  const daysPassed = currentDay === 0 ? 6 : currentDay - 1;
  
  for (let i = 0; i <= daysPassed; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    daysToProcess.push(getLocalStr(nextDay));
  }

  const todayStr = getLocalStr(now);

  for (const dayStr of daysToProcess) {
    // 1. Calcular totales del día (forzando coincidencia en hora local)
    const dayEaten = meals?.filter(m => getLocalStr(new Date(m.created_at)) === dayStr).reduce((s, m) => s + Number(m.calories), 0) || 0;
    const dayBurned = activities?.filter(a => getLocalStr(new Date(a.created_at)) === dayStr).reduce((s, a) => s + Number(a.calories_burned), 0) || 0;
    
    // 2. Lógica de Ahorro: El ejercicio suma, el exceso de comida resta.
    const target = Number(profile.target_calories);
    const excessFood = Math.max(0, dayEaten - target);
    
    // Saldo del día
    const dayNet = dayBurned - excessFood;
    
    // Acumular saldo (permitiendo deuda técnica si se pasan de comida)
    totalBalance = totalBalance + dayNet;
  }

  // 2. REGLA DE ACCESO (Se desbloquea con comida O ejercicio hoy)
  const isBlocked = false; // La hucha siempre está desbloqueada desde el minuto 1.

  const finalBalance = Math.round(totalBalance);

  return {
    balance: finalBalance,
    isNegative: false,
    isBlocked,
    currentDay: currentDay === 0 ? 7 : currentDay
  };
}
