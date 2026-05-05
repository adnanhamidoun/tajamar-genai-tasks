"use client";

import { motion } from "framer-motion";
import { 
  PiggyBank, 
  TrendingUp, 
  Lock, 
  AlertCircle,
  ArrowUpRight,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FlexBankStatus {
  balance: number;
  auditWeek: number;
  isBlocked: boolean;
  daysRemaining: number;
}

export default function FlexBankCard({ status }: { status: FlexBankStatus }) {
  const isAudit = status.auditWeek > 0;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 border border-white/5 rounded-[32px] overflow-hidden relative"
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-[50px] -mr-10 -mt-10" />

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <PiggyBank className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tighter italic">Hucha de Salud</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Balance de Bienestar</p>
            </div>
          </div>
          {isAudit && (
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[8px] font-black uppercase">
              Periodo de Inicio
            </Badge>
          )}
        </div>

        <div className="mb-6">
          <div className="flex items-end gap-2 mb-1">
            <span className="text-5xl font-mono font-black tracking-tighter">
              {status.balance.toLocaleString()}
            </span>
            <span className="text-zinc-500 font-black uppercase text-xs mb-1.5 italic">kcal</span>
          </div>
          <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
            Energía ahorrada a través de tu actividad.
          </p>
        </div>

        {/* Audit Status Message */}
        {status.auditWeek === 1 ? (
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 mb-4">
            <div className="flex gap-3">
              <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-200 leading-normal font-medium">
                Estamos conociendo tu ritmo metabólico. Sigue registrando tu actividad; tu hucha se está llenando. <span className="font-black text-white">{status.daysRemaining} días para completar el inicio.</span>
              </p>
            </div>
          </div>
        ) : status.isBlocked ? (
          <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4 mb-4">
            <div className="flex gap-3">
              <AlertCircle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-orange-200 leading-normal font-medium">
                <span className="font-black text-white block mb-1 uppercase tracking-widest">Aviso de Registro</span>
                Para que tu hucha sea precisa, necesitamos que registres también tus comidas. ¡Un último esfuerzo!
              </p>
            </div>
          </div>
        ) : status.balance > 1000 && !isAudit ? (
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 mb-4">
            <div className="flex gap-3">
              <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-400 leading-normal font-medium italic">
                "Has ahorrado {status.balance} kcal con tu actividad. Tienes margen para un capricho hoy. ¡Te lo has ganado cuidándote!"
              </p>
            </div>
          </div>
        ) : null}

        <Button 
          className="w-full h-12 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black uppercase tracking-widest text-[10px]"
          onClick={() => {}} // Opens activity modal
        >
          <TrendingUp className="h-3 w-3 mr-2" />
          Añadir actividad (Ahorrar)
        </Button>
      </div>
    </motion.div>
  );
}
