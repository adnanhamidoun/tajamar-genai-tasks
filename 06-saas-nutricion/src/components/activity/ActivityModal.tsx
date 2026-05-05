"use client";

import { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Dumbbell, 
  Zap, 
  Trophy, 
  Bike, 
  Sword, 
  Target,
  Activity as ActivityIcon,
  ChevronRight,
  Minus,
  Plus,
  PersonStanding
} from "lucide-react";
import { logActivity } from "@/lib/actions/activity.actions";
import { toast } from "sonner";

const SPORTS = [
  { id: "gym", label: "Gym", icon: Dumbbell },
  { id: "calisthenics", label: "Cali", icon: PersonStanding },
  { id: "football", label: "Deporte", icon: Trophy },
  { id: "running", label: "Cardio", icon: Bike },
  { id: "martial_arts", label: "Yoga", icon: Sword },
  { id: "crossfit", label: "Cross", icon: Zap },
  { id: "tennis", label: "Pádel", icon: Target },
  { id: "other", label: "Otro", icon: ActivityIcon },
];

const INTENSITIES = [
  { id: "low", label: "Baja", color: "bg-zinc-900 text-zinc-600" },
  { id: "moderate", label: "Media", color: "bg-red-600/10 text-red-600" },
  { id: "high", label: "Alta", color: "bg-red-600/20 text-red-500" },
  { id: "elite", label: "Élite", color: "bg-red-600 text-white" },
];

export default function ActivityModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    sport_type: "gym",
    duration_mins: 60,
    intensity: "moderate"
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const result = await logActivity(formData);
    setIsSubmitting(false);

    if (result.success) {
      toast.success(`+${result.calories} kcal a la hucha.`);
      onOpenChange(false);
    } else {
      toast.error(result.error || "Error al registrar");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[40px] bg-[#050505] border-white/5 p-0 max-h-[85vh] overflow-hidden flex flex-col">
        {/* Handle */}
        <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mt-4 shrink-0" />
        
        <div className="flex-1 overflow-y-auto px-8 pt-6 pb-32">
          <SheetHeader className="mb-8">
            <SheetTitle className="text-3xl font-black uppercase tracking-tighter italic">
              Registrar <span className="text-red-600">Esfuerzo</span>
            </SheetTitle>
            <SheetDescription className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-600 mt-1">
              Sincronizar gasto calórico activo
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-8">
            {/* Sport Selection */}
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-700 ml-1">Disciplina</Label>
              <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
                {SPORTS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setFormData({ ...formData, sport_type: s.id })}
                    className={`shrink-0 h-20 w-20 rounded-[24px] border flex flex-col items-center justify-center transition-all ${
                      formData.sport_type === s.id 
                        ? 'bg-red-600 border-red-500 text-white shadow-xl shadow-red-600/20' 
                        : 'bg-zinc-950 border-zinc-900 text-zinc-700 hover:border-zinc-800'
                    }`}
                  >
                    <s.icon className="h-6 w-6 mb-1.5" />
                    <span className="text-[9px] font-black uppercase">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-700 ml-1">Tiempo (Minutos)</Label>
              <div className="bg-zinc-950 rounded-[32px] p-6 flex items-center justify-between border border-zinc-900 shadow-inner">
                <button 
                  onClick={() => setFormData({...formData, duration_mins: Math.max(15, formData.duration_mins - 15)})}
                  className="h-12 w-12 rounded-2xl bg-zinc-900 flex items-center justify-center border border-white/5 hover:bg-zinc-800 transition-all active:scale-90"
                >
                  <Minus className="h-5 w-5 text-zinc-400" />
                </button>
                <div className="text-center">
                  <span className="text-5xl font-mono font-black text-white">{formData.duration_mins}</span>
                  <span className="text-[10px] font-black text-zinc-600 ml-2 uppercase tracking-widest">min</span>
                </div>
                <button 
                  onClick={() => setFormData({...formData, duration_mins: formData.duration_mins + 15})}
                  className="h-12 w-12 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/20 hover:bg-red-500 transition-all active:scale-90"
                >
                  <Plus className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Intensity */}
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-700 ml-1">Nivel de Intensidad</Label>
              <div className="grid grid-cols-2 gap-3">
                {INTENSITIES.map((i) => (
                  <button
                    key={i.id}
                    onClick={() => setFormData({ ...formData, intensity: i.id })}
                    className={`h-14 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all ${
                      formData.intensity === i.id 
                        ? 'bg-white border-white text-black' 
                        : 'bg-zinc-950 border-zinc-900 text-zinc-700'
                    }`}
                  >
                    {i.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent pt-12">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-16 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-3xl border-0 shadow-2xl shadow-red-600/20"
          >
            {isSubmitting ? "Sincronizando ADN..." : "Finalizar Registro"}
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
