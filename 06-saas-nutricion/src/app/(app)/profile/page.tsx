import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Shield, User, LogOut, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "./ProfileForm";
import { signOut } from "@/lib/actions/auth.actions";
import { ThemeMarketplace } from "@/components/theme-marketplace";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Si no hay perfil, podría redirigir al onboarding, pero mostramos form por defecto.
    // Esto es un edge case, handle_new_user ya lo crea.
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-32">
      <div className="max-w-md mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="h-10 w-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center hover:bg-zinc-800 transition-colors">
              <ArrowLeft className="h-5 w-5 text-zinc-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">Ajustes</h1>
              <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest mt-1">Configuración de Perfil</p>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="space-y-6">
          <div className="bg-[#111111] rounded-[32px] border border-white/[0.03] p-8">
            <div className="flex items-center gap-6 mb-10">
              <div className="h-20 w-20 rounded-3xl bg-red-600/10 flex items-center justify-center border border-red-600/20">
                <User className="h-10 w-10 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-black uppercase tracking-tight truncate">{profile?.full_name || "Usuario"}</h2>
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest truncate">{user.email}</p>
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
                  <Shield className="h-3 w-3 text-red-600" />
                  <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-400">Rango: Saludable</span>
                </div>
              </div>
            </div>

            <ProfileForm profile={profile} />
          </div>

          {/* Theme Marketplace */}
          <div className="bg-[#111111] rounded-[32px] border border-white/[0.03] p-8">
            <ThemeMarketplace />
          </div>



          {/* Settings Section */}
          <div className="bg-[#111111] rounded-[32px] border border-white/[0.03] p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4 px-2">Sesión y Seguridad</p>
            <form action={signOut}>
              <Button 
                type="submit"
                variant="ghost" 
                className="w-full h-16 bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-between px-6"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="h-5 w-5" />
                  <span>Cerrar Sesión</span>
                </div>
                <div className="h-6 w-6 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <span className="text-[10px]">SALIR</span>
                </div>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
