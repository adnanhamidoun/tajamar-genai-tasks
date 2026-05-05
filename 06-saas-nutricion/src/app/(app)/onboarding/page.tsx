import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if profile is already complete to avoid re-onboarding
  const { data: profile } = await supabase
    .from("profiles")
    .select("age, height, fitness_goal")
    .eq("id", user.id)
    .single();

  if (profile?.age && profile?.height && profile?.fitness_goal) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <OnboardingWizard />
    </main>
  );
}
