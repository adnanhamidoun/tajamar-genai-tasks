"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface UpdateProfileParams {
  full_name?: string;
  target_calories?: number;
  current_weight?: number;
  fitness_goal?: "lose" | "maintain" | "gain";
  daily_goal_protein?: number;
  daily_goal_carbs?: number;
  daily_goal_fat?: number;
  onboarding_complete?: boolean;
  avatar_url?: string;
}

export async function updateProfile(params: UpdateProfileParams) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase
    .from("profiles")
    .update(params)
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw new Error(`Error actualizando perfil: ${error.message}`);

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return data;
}
