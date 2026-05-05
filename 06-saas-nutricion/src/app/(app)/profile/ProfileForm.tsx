"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/lib/actions/profile.actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  Save, 
  Flame, 
  User, 
  Target, 
  Calendar,
  Zap,
  Check
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function ProfileForm({
  profile
}: {
  profile: any;
}) {
  const [isPending, startTransition] = useTransition();
  const [gender, setGender] = useState<"male" | "female">(profile?.gender || "male");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("gender", gender);

    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.success) {
        toast.success("Perfil actualizado con éxito");
      } else {
        toast.error(result.error || "Error al actualizar");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div className="space-y-8">
        {/* Section: Identidad */}
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 border-b border-zinc-900 pb-2">Identidad</p>
          
          <div className="space-y-2">
            <Label className="text-zinc-600 text-[10px] font-black uppercase tracking-widest ml-1">Tu Nombre</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700" />
              <Input name="full_name" defaultValue={profile?.full_name} className="bg-zinc-950 border-zinc-900 text-white h-12 pl-10 rounded-2xl focus:border-brand" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-600 text-[10px] font-black uppercase tracking-widest ml-1">Género Biológico</Label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => setGender("male")}
                className={`h-12 rounded-2xl border transition-all font-black uppercase text-[10px] tracking-widest ${gender === "male" ? 'bg-brand border-brand text-white' : 'bg-zinc-950 border-zinc-900 text-zinc-600'}`}
              >
                Hombre
              </button>
              <button 
                type="button"
                onClick={() => setGender("female")}
                className={`h-12 rounded-2xl border transition-all font-black uppercase text-[10px] tracking-widest ${gender === "female" ? 'bg-brand border-brand text-white' : 'bg-zinc-950 border-zinc-900 text-zinc-600'}`}
              >
                Mujer
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-zinc-600 text-[10px] font-black uppercase tracking-widest ml-1">Peso (kg)</Label>
              <Input type="number" name="weight" defaultValue={profile?.current_weight} className="bg-zinc-950 border-zinc-900 h-12 font-mono text-white rounded-2xl focus:border-brand" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-600 text-[10px] font-black uppercase tracking-widest ml-1">Altura</Label>
              <Input type="number" name="height" defaultValue={profile?.height} className="bg-zinc-950 border-zinc-900 h-12 font-mono text-white rounded-2xl focus:border-brand" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-600 text-[10px] font-black uppercase tracking-widest ml-1">Edad</Label>
              <Input type="number" name="age" defaultValue={profile?.age} className="bg-zinc-950 border-zinc-900 h-12 font-mono text-white rounded-2xl focus:border-brand" />
            </div>
          </div>
        </div>

        {/* Section: Objetivos */}
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand border-b border-red-900/30 pb-2">Misión Nutricional</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900">
              <Label className="text-zinc-700 text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Target className="h-3 w-3 text-brand" /> Objetivo (kg)
              </Label>
              <Input type="number" name="target_weight" defaultValue={profile?.target_weight} className="bg-transparent border-0 p-0 text-2xl font-mono font-black focus-visible:ring-0 text-white" />
            </div>
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900">
              <Label className="text-zinc-700 text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-brand" /> Semanas
              </Label>
              <Input type="number" name="target_weeks" defaultValue={profile?.target_weeks} className="bg-transparent border-0 p-0 text-2xl font-mono font-black focus-visible:ring-0 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-700 text-[9px] font-black uppercase tracking-widest ml-1">Calorías Diarias Personalizadas</Label>
            <div className="relative">
              <Flame className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand" />
              <Input type="number" name="target_calories" defaultValue={profile?.target_calories} className="bg-zinc-950 border-zinc-900 text-white h-12 pl-10 rounded-2xl font-mono font-black text-xl focus:border-brand" />
            </div>
            <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-tighter ml-1">Cálculo basado en tu TMB, Género y Objetivo de Peso.</p>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-16 bg-brand hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-3xl border-0 shadow-2xl shadow-brand/20 active:scale-95 transition-all"
      >
        <Save className="mr-2 h-4 w-4" />
        {isPending ? "Sincronizando..." : "GUARDAR CAMBIOS"}
      </Button>
    </form>
  );
}
