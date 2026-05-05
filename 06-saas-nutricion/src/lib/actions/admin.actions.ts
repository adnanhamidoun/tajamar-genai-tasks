"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function adminCheat(command: string, value?: any) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) return { success: false, error: "No autorizado" };
  const user = authData.user;

  console.log(`[ADMIN] Ejecutando comando: ${command}`, value);

  switch (command) {
    case "set_balance":
      await supabase.from("profiles").update({ flex_bank_balance: Number(value) }).eq("id", user.id);
      break;

    case "add_balance":
      const { data: pAdd } = await supabase.from("profiles").select("flex_bank_balance").eq("id", user.id).single();
      await supabase.from("profiles").update({ flex_bank_balance: (pAdd?.flex_bank_balance || 0) + Number(value) }).eq("id", user.id);
      break;

    case "unlock_bank":
      await supabase.from("profiles").update({ 
        audit_period_start: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString()
      }).eq("id", user.id);
      break;

    case "reset_audit":
      await supabase.from("profiles").update({ 
        audit_period_start: new Date().toISOString(),
        flex_bank_balance: 0
      }).eq("id", user.id);
      break;

    case "time_travel":
      const days = Number(value) || 7;
      await supabase.from("profiles").update({ 
        audit_period_start: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString() 
      }).eq("id", user.id);
      break;

    case "seed_history":
      console.log("[ADMIN] Generando historial de 3 semanas...");
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 21);
      
      // Limpieza
      await supabase.from("meals").delete().eq("user_id", user.id).gte("created_at", startDate.toISOString());
      await supabase.from("activities").delete().eq("user_id", user.id).gte("created_at", startDate.toISOString());

      const foodPool = [
        { name: "Desayuno Avena 🥣", cals: 450, p: 15, c: 65, f: 10 },
        { name: "Pechuga con Arroz 🍗", cals: 650, p: 45, c: 50, f: 12 },
        { name: "Ensalada Completa 🥗", cals: 350, p: 20, c: 20, f: 25 },
        { name: "Salmón Plancha 🐟", cals: 550, p: 40, c: 5, f: 35 },
        { name: "Bowl de Yogur 🍦", cals: 300, p: 25, c: 30, f: 8 },
        { name: "Pasta Boloñesa 🍝", cals: 750, p: 30, c: 85, f: 20 },
      ];

      const activityPool = [
        { type: "gym", duration: 60, intensity: "high", cals: 450 },
        { type: "running", duration: 40, intensity: "moderate", cals: 400 },
        { type: "padel", duration: 90, intensity: "high", cals: 600 },
      ];

      for (let i = 0; i < 21; i++) {
        const day = new Date();
        day.setDate(day.getDate() - i);
        
        const dailyMeals = foodPool.sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 2));
        for (const m of dailyMeals) {
          const { error: mErr } = await supabase.from("meals").insert({
            user_id: user.id,
            food_name: m.name, // Schema usa 'food_name'
            calories: m.cals,
            protein: m.p,
            carbs: m.c,
            fat: m.f,
            created_at: day.toISOString()
          });
          if (mErr) console.error("[ADMIN] Error insertando comida:", mErr);
        }

        if (i % 2 === 0) {
          const act = activityPool[Math.floor(Math.random() * activityPool.length)];
          const { error: aErr } = await supabase.from("activities").insert({
            user_id: user.id,
            sport_type: act.type,
            duration_mins: act.duration,
            intensity: act.intensity,
            calories_burned: act.cals,
            created_at: day.toISOString()
          });
          if (aErr) console.error("[ADMIN] Error insertando actividad:", aErr);
        }
      }

      await supabase.from("profiles").update({ 
        audit_period_start: startDate.toISOString(),
        flex_bank_balance: 0 
      }).eq("id", user.id);
      
      console.log("[ADMIN] Historial generado con éxito");
      break;

    default:
      return { success: false, error: `Comando '${command}' no reconocido` };
  }

  revalidatePath("/");
  return { success: true };
}
