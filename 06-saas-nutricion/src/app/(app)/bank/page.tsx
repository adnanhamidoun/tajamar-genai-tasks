"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PiggyBank, 
  ArrowLeft, 
  Zap, 
  Trophy,
  Coffee,
  Utensils,
  Pizza,
  PartyPopper,
  AlertTriangle,
  Lock
} from "lucide-react";
import Link from "next/link";
import { getFlexBankStatus } from "@/lib/actions/activity.actions";
import { Button } from "@/components/ui/button";

export default function BankPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    const data = await getFlexBankStatus();
    setStatus(data);
    setLoading(false);
  }

  if (loading || !status) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-8 w-8 border-2 border-red-500 border-t-transparent rounded-full" />
    </div>
  );

  const isBlocked = status.isBlocked;
  const balance = status.balance || 0;

  const getNpcFeedback = () => {
    if (isBlocked) return { text: "Registra tu comida de hoy para desbloquear el cajero.", icon: Lock };
    
    if (balance < 0) return { text: "¡ALERTA ROJA! Estás en DEUDA metabólica. Tienes que moverte o recortar calorías YA para salir de los números rojos.", icon: AlertTriangle };
    if (balance === 0) return { text: "Hucha vacía. Toca generar crédito con algo de ejercicio o ahorrando en tu próxima comida.", icon: Zap };
    if (balance < 300) return { text: "Ahorro inicial. Tienes para un café especial o una pieza de fruta extra.", icon: Coffee };
    if (balance < 600) return { text: "¡Buen ritmo! Tienes presupuesto para una merienda Pro o un postre de nivel.", icon: Utensils };
    if (balance < 1200) return { text: "¡Cuidado! Tienes crédito para una hamburguesa premium o una pizza mediana.", icon: Pizza };
    if (balance >= 1200) return { text: "¡MODO ELITE! Tienes barra libre para una cena épica o un festival este finde.", icon: PartyPopper };
    
    return { text: "Hucha operativa. ¿En qué vamos a invertir hoy?", icon: Trophy };
  };

  const feedback = getNpcFeedback();

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-32">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <Link href="/dashboard" className="h-12 w-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="text-right">
          <h1 className="text-xs font-black uppercase tracking-widest text-zinc-600">Bóveda de Salud</h1>
          <p className="text-sm font-black text-white italic tracking-tighter">Dail <span className="text-red-600">Elite</span></p>
        </div>
      </div>

      <div className="max-w-md mx-auto space-y-10">
        
        {/* The Piggy Visual */}
        <div className="relative h-64 flex flex-col items-center justify-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            <PiggyBank className={`h-48 w-48 transition-all duration-700 ${balance < 0 ? 'text-red-900 drop-shadow-[0_0_80px_rgba(255,0,0,0.8)] animate-pulse' : balance === 0 ? 'text-zinc-800 grayscale' : 'text-red-600 drop-shadow-[0_0_60px_rgba(230,32,32,0.5)]'}`} />
            <AnimatePresence>
              {!isBlocked && balance !== 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className={`absolute -top-4 -right-4 h-12 w-12 rounded-full flex items-center justify-center shadow-2xl border-4 border-black ${balance < 0 ? 'bg-red-900 text-white' : 'bg-white text-black'}`}
                >
                  <feedback.icon className="h-6 w-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Balance Display */}
        <div className="text-center space-y-2">
          <div className="flex items-baseline justify-center gap-2">
            <motion.span 
              key={balance}
              className={`text-8xl font-mono font-black tracking-tighter ${balance < 0 ? 'text-red-600' : 'text-white'}`}
            >
              {balance.toLocaleString()}
            </motion.span>
            <span className={`text-sm font-black uppercase tracking-widest ${balance < 0 ? 'text-red-900' : 'text-zinc-600'}`}>kcal</span>
          </div>
          <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.5em]">
            Crédito Metabólico
          </p>
        </div>

        {/* Gamified NPC Box - BIG GAME MODE */}
        <div className={`bg-[#0A0A0A] border p-8 rounded-[40px] flex flex-col gap-6 relative overflow-hidden transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/10 mt-8`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl -mr-10 -mt-10" />
          
          <div className="flex items-center gap-4 border-b border-white/5 pb-4">
            <div className={`h-16 w-16 rounded-[24px] flex-shrink-0 flex items-center justify-center border transition-all bg-zinc-900 border-white/10 text-red-500 shadow-inner`}>
               <feedback.icon className="h-8 w-8" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Coach Elite</p>
              <p className="text-sm font-bold text-white tracking-tight">Análisis de Crédito</p>
            </div>
          </div>
          
          <p className="text-sm md:text-base font-black leading-relaxed text-zinc-300 italic relative z-10">
            "{feedback.text}"
          </p>
        </div>

        {/* Weekly Reset Info Card */}
        <div className="bg-zinc-950 border border-dashed border-red-900/20 rounded-[32px] p-8 text-center">
          <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4">Ciclo de Renovación</h4>
          <p className="text-[10px] text-zinc-700 font-bold leading-relaxed uppercase tracking-tight">
            Recuerda: El lunes a las 00:00 el banco se reinicia. <br/>
            <span className="text-red-900 font-black">¡Gástate el saldo antes de que desaparezca!</span>
          </p>
        </div>
      </div>
    </div>
  );
}
