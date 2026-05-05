"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dumbbell, 
  Target, 
  User, 
  ChevronRight, 
  Zap, 
  Activity, 
  Flame,
  PersonStanding,
  Shield,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/actions/profile.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const GOALS = [
  { id: "lose", label: "Perder Grasa", desc: "Déficit calórico táctico", icon: Target },
  { id: "maintain", label: "Mantener", desc: "Optimización de rendimiento", icon: Activity },
  { id: "gain", label: "Ganar Músculo", desc: "Superávit para fuerza", icon: Dumbbell },
];

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showRealityCheck, setShowRealityCheck] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    age: 25,
    weight: 75,
    height: 175,
    gender: "male" as "male" | "female",
    sport_type: "gym",
    activity_level: "moderate",
    goal: "",
    target_weight: 70,
    target_weeks: 12,
    coach_personality: "tactical"
  });

  const nextStep = () => {
    if (step === 3 && formData.goal === "maintain") {
      setFormData(prev => ({ ...prev, target_weight: prev.weight, target_weeks: 1 }));
      handleSubmit();
      return;
    }
    setStep(s => s + 1);
  };
  const prevStep = () => setStep(s => s - 1);

  const handlePlanSelect = (rate: number) => {
    const weightDiff = Math.abs(formData.weight - formData.target_weight);
    const calculatedWeeks = Math.ceil(weightDiff / rate);
    
    if (rate >= 1.5) {
      setShowRealityCheck(true);
      setFormData({ ...formData, target_weeks: calculatedWeeks });
    } else {
      setFormData({ ...formData, target_weeks: calculatedWeeks });
    }
  };

  const handleSubmit = async () => {
    setIsSyncing(true);
    const result = await updateProfile(formData);
    
    if (result.success) {
      setTimeout(() => {
        router.push("/dashboard?welcome=true");
      }, 2000);
    } else {
      toast.error("Error al sincronizar perfil");
      setIsSyncing(false);
    }
  };

  if (showRealityCheck) {
    return (
      <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 backdrop-blur-xl">
        <div className="max-w-sm w-full bg-zinc-900 border border-red-500/30 p-8 rounded-[40px] text-center shadow-[0_0_50px_rgba(230,32,32,0.2)]">
          <div className="h-20 w-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <Shield className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 italic">Aviso de Realidad</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            Has seleccionado el límite físico de <span className="text-white font-bold">1,5 kg/semana</span>. Seamos honestos: ¿Tienes una disciplina de hierro? 
            <br/><br/>
            El 90% de los usuarios que eligen esta velocidad abandonan pronto debido al hambre extrema y la fatiga. Tu cuerpo entrará en modo alerta.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => { setShowRealityCheck(false); }}
              className="w-full h-14 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl"
            >
              TENÉIS RAZÓN, BAJAR RITMO
            </Button>
            <Button 
              variant="ghost"
              onClick={() => { setShowRealityCheck(false); }}
              className="w-full h-14 text-zinc-500 hover:text-red-500 font-bold uppercase text-[10px] tracking-widest"
            >
              ACEPTO EL RIESGO, CONTINUAR
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] z-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full mb-8"
        />
        <h2 className="text-2xl font-black tracking-tighter text-white mb-2 uppercase">Configurando tu plan de salud...</h2>
        <p className="text-zinc-500 font-mono text-sm">Personalizando la experiencia para {formData.full_name}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center p-6 pb-24">
      {/* Brand Logo */}
      <div className="mb-10 mt-4">
        <img src="/logo.png" alt="DAIL Nutrition" className="h-10 w-auto object-contain" />
      </div>

      {/* Stepper */}
      <div className="w-full max-w-md mb-12">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={`h-1 flex-1 mx-0.5 rounded-full transition-colors duration-500 ${s <= step ? 'bg-red-600' : 'bg-zinc-800'}`} 
            />
          ))}
        </div>
        <div className="flex justify-between px-1 text-[9px] font-black uppercase tracking-[0.05em] text-zinc-600">
          <span>Identidad</span>
          <span>Medidas</span>
          <span>Meta</span>
          <span>Plan</span>
        </div>
      </div>

      <div className="w-full max-w-md flex-1">
        <AnimatePresence mode="wait">
          {/* Step 1: Identity */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">¿Cómo te <span className="text-red-600">llamas?</span></h1>
                <p className="text-zinc-500 font-medium">Empecemos por lo más importante: tú.</p>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 h-5 w-5" />
                  <Input 
                    placeholder="Tu nombre" 
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="bg-zinc-900 border-zinc-800 h-16 pl-12 text-xl font-bold rounded-2xl focus:border-red-600 transition-colors"
                  />
                </div>
                <Button 
                  onClick={nextStep} 
                  disabled={!formData.full_name}
                  className="w-full h-16 bg-red-600 hover:bg-red-700 text-white font-black text-lg rounded-2xl border-0 shadow-[0_0_30px_rgba(220,38,38,0.2)]"
                >
                  CONTINUAR <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Biometry */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Tus datos <span className="text-red-600">físicos</span></h1>
                <p className="text-zinc-500 font-medium">Necesarios para calcular tus necesidades diarias.</p>
              </div>
              <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setFormData({...formData, gender: "male"})}
                    className={`h-20 rounded-3xl border transition-all flex flex-col items-center justify-center gap-1 ${formData.gender === "male" ? 'bg-red-600 border-red-600 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                  >
                    <span className="text-xs font-black uppercase tracking-widest">Hombre</span>
                  </button>
                  <button 
                    onClick={() => setFormData({...formData, gender: "female"})}
                    className={`h-20 rounded-3xl border transition-all flex flex-col items-center justify-center gap-1 ${formData.gender === "female" ? 'bg-red-600 border-red-600 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                  >
                    <span className="text-xs font-black uppercase tracking-widest">Mujer</span>
                  </button>
                </div>

                <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                  <Label className="text-zinc-500 uppercase text-xs font-black tracking-widest mb-4 block">Edad</Label>
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-mono font-black">{formData.age}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setFormData({...formData, age: formData.age - 1})} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold">-</button>
                      <button onClick={() => setFormData({...formData, age: formData.age + 1})} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold">+</button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                    <Label className="text-zinc-500 uppercase text-xs font-black tracking-widest mb-4 block">Peso (kg)</Label>
                    <Input 
                      type="number" 
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: Number(e.target.value)})}
                      className="bg-transparent border-0 p-0 text-3xl font-mono font-black focus-visible:ring-0"
                    />
                  </div>
                  <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                    <Label className="text-zinc-500 uppercase text-xs font-black tracking-widest mb-4 block">Altura (cm)</Label>
                    <Input 
                      type="number" 
                      value={formData.height}
                      onChange={(e) => setFormData({...formData, height: Number(e.target.value)})}
                      className="bg-transparent border-0 p-0 text-3xl font-mono font-black focus-visible:ring-0"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={prevStep} variant="ghost" className="h-16 flex-1 text-zinc-500 font-bold border border-zinc-800 rounded-2xl">VOLVER</Button>
                  <Button onClick={nextStep} className="h-16 flex-[2] bg-red-600 hover:bg-red-700 text-white font-black text-lg rounded-2xl border-0">SIGUIENTE</Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Goal */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Tu <span className="text-red-600">Meta</span></h1>
                <p className="text-zinc-500 font-medium">¿Qué te gustaría conseguir?</p>
              </div>
              <div className="space-y-3">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setFormData({...formData, goal: g.id})}
                    className={`w-full flex items-center p-5 rounded-2xl border transition-all ${
                      formData.goal === g.id 
                      ? 'bg-red-600 border-red-600 text-white' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <div className={`p-3 rounded-xl mr-4 ${formData.goal === g.id ? 'bg-white/20' : 'bg-zinc-800'}`}>
                      <g.icon className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <p className={`font-black uppercase tracking-tighter text-lg ${formData.goal === g.id ? 'text-white' : 'text-zinc-300'}`}>{g.label}</p>
                      <p className="text-xs opacity-70">{g.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={prevStep} variant="ghost" className="h-16 flex-1 text-zinc-500 font-bold border border-zinc-800 rounded-2xl">VOLVER</Button>
                <Button onClick={nextStep} disabled={!formData.goal} className="h-16 flex-[2] bg-red-600 hover:bg-red-700 text-white font-black text-lg rounded-2xl border-0">
                  CONTINUAR
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: The Plan */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Ritmo de <span className="text-red-600">Progreso</span></h1>
                <p className="text-zinc-500 font-medium">¿Cómo de rápido quieres ver resultados?</p>
              </div>
              
              <div className="space-y-3">
                {[
                  { rate: 0.5, label: "Poco a poco", desc: "Equilibrado y constante" },
                  { rate: 1.0, label: "Ritmo activo", desc: "Para mentes decididas" },
                  { rate: 1.5, label: "Máximo esfuerzo", desc: "Plan agresivo (Riesgo alto)" },
                ].map((plan) => {
                  const weightDiff = Math.abs(formData.weight - formData.target_weight);
                  const calculatedWeeks = Math.ceil(weightDiff / plan.rate);
                  const isSelected = formData.target_weeks === calculatedWeeks;

                  return (
                    <button
                      key={plan.label}
                      onClick={() => handlePlanSelect(plan.rate)}
                      className={`w-full flex items-center justify-between p-6 rounded-3xl border transition-all ${
                        isSelected
                        ? 'bg-white border-white text-black shadow-xl scale-[1.02]' 
                        : 'bg-zinc-900 border-zinc-800 text-white'
                      }`}
                    >
                      <div className="text-left">
                        <p className="text-xl font-black tracking-tighter">{plan.label}</p>
                        <p className={`text-[10px] font-mono font-bold uppercase tracking-widest mt-1 ${isSelected ? 'text-black/60' : 'text-zinc-500'}`}>
                          {plan.desc}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black tracking-tight">{plan.rate} kg/sem</p>
                      </div>
                    </button>
                  );
                })}

                <div className="pt-4 space-y-4">
                  <div className="bg-zinc-900/50 p-6 rounded-[32px] border border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 px-1">Tu peso objetivo</p>
                    <div className="flex items-center justify-between">
                      <span className="text-5xl font-mono font-black tracking-tighter">{formData.target_weight}kg</span>
                      <div className="flex gap-2">
                        <button onClick={() => setFormData({...formData, target_weight: formData.target_weight - 1})} className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center font-bold border border-zinc-700">-</button>
                        <button onClick={() => setFormData({...formData, target_weight: formData.target_weight + 1})} className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center font-bold border border-zinc-700">+</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={prevStep} variant="ghost" className="h-16 flex-1 text-zinc-500 font-bold border border-zinc-800 rounded-2xl">VOLVER</Button>
                <Button onClick={handleSubmit} className="h-16 flex-[2] bg-red-600 hover:bg-red-700 text-white font-black text-lg rounded-2xl border-0 shadow-[0_0_30px_rgba(220,38,38,0.3)]">
                  ¡EMPECEMOS!
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
