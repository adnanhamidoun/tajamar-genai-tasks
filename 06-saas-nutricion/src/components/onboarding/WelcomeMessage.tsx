"use client";

import { motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const SPORT_MESSAGES: Record<string, string> = {
  gym: "Protocolo de hipertrofia activado. He ajustado tus macros para maximizar la síntesis proteica en tus sesiones de pesas.",
  calisthenics: "Perfil de control de peso detectado. Ajustando ratios de fuerza-peso para tus sesiones de Calistenia. Vamos a ello.",
  football: "Resistencia y explosividad sincronizadas. Tus carbohidratos están optimizados para aguantar los 90 minutos.",
  basketball: "Modo MVP activo. He priorizado la recuperación glucémica para tus saltos y sprints en la cancha.",
  running: "Motor de resistencia en marcha. Optimizando la carga de glucógeno para tus rutas de fondo.",
  crossfit: "WOD detectado. Ratios de energía rápida y recuperación muscular listos para el castigo.",
  martial_arts: "Disciplina y potencia. Ajustando macros para mantener tu agilidad y fuerza de impacto.",
  tennis: "Precisión y agilidad. He equilibrado tus electrolitos y energía para el próximo set.",
  other: "Bienvenido al sistema DAIL. He configurado tu base nutricional para optimizar tu rendimiento general."
};

export default function WelcomeMessage() {
  const searchParams = useSearchParams();
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (searchParams.get("welcome") === "true") {
      const sport = searchParams.get("sport") || "other";
      setMessage(SPORT_MESSAGES[sport] || SPORT_MESSAGES.other);
      setShow(true);
      const timer = setTimeout(() => setShow(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="mb-10 relative"
        >
          <div className="bg-gradient-to-br from-[#E62020] to-[#990000] rounded-[32px] p-6 shadow-[0_20px_50px_rgba(230,32,32,0.3)] relative z-10 border border-white/20">
            <div className="flex items-start gap-5">
              <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/30">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">Transmisión de DAIL AI</p>
                <p className="text-white text-lg font-bold leading-tight tracking-tight">{message}</p>
              </div>
              <button 
                onClick={() => setShow(false)}
                className="bg-black/20 p-1.5 rounded-full text-white/50 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Shimmer Effect */}
            <div className="absolute inset-0 shimmer rounded-[32px] pointer-events-none" />
          </div>
          
          {/* Pulse Decor */}
          <div className="absolute -inset-1 bg-brand/20 blur-2xl rounded-[40px] animate-pulse" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { AnimatePresence } from "framer-motion";
