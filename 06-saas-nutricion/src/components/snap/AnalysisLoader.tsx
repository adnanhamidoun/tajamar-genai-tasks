"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

// ============================================================
// Mensajes rotativos divertidos del GOAT mientras analiza
// ============================================================
const LOADING_MESSAGES = [
  { emoji: "🔍", text: "Escaneando composición visual..." },
  { emoji: "🛰️", text: "Sincronizando base de datos nutricional..." },
  { emoji: "📐", text: "Calculando volumen de ración..." },
  { emoji: "🔬", text: "Identificando perfiles macro-bióticos..." },
  { emoji: "⚡", text: "Procesando datos con IA DAIL..." },
  { emoji: "🧠", text: "Consultando protocolos de rendimiento..." },
  { emoji: "📊", text: "Generando desglose de nutrientes..." },
  { emoji: "💡", text: "Preparando veredicto táctico..." },
];

interface AnalysisLoaderProps {
  previewUrl?: string | null;
}

export default function AnalysisLoader({ previewUrl }: AnalysisLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        setIsTransitioning(false);
      }, 200);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  const currentMessage = LOADING_MESSAGES[messageIndex];

  return (
    <div className="relative w-full min-h-[280px] rounded-lg overflow-hidden">
      {/* Background — preview image or gradient */}
      {previewUrl ? (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Analizando..."
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
        </div>
      ) : (
        <div className="absolute inset-0 dail-gradient opacity-20" />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[280px] gap-5 px-6">
        {/* Animated Spinner Ring - Toned down */}
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-zinc-800 animate-pulse absolute inset-0" />
          <div className="h-16 w-16 rounded-full border-4 border-transparent border-t-red-500 border-r-red-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          </div>
        </div>

        {/* Rotating Message */}
        <div
          className={`text-center transition-all duration-200 ease-in-out ${
            isTransitioning
              ? "opacity-0 translate-y-2"
              : "opacity-100 translate-y-0"
          }`}
        >
          <span className="text-2xl block mb-1">{currentMessage.emoji}</span>
          <p className={`text-sm font-semibold ${previewUrl ? "text-white" : "text-foreground"}`}>
            {currentMessage.text}
          </p>
        </div>

        {/* Progress bar — indeterminate - Subtle */}
        <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-zinc-700 via-red-500 to-zinc-700 animate-pulse"
            style={{
              width: "60%",
              animation: "shimmer 1.8s ease-in-out infinite alternate",
            }}
          />
        </div>

        <p className={`text-xs ${previewUrl ? "text-white/50" : "text-muted-foreground"}`}>
          Esto suele tardar 5-8 segundos
        </p>
      </div>

      {/* Shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-80%);
            width: 30%;
          }
          100% {
            transform: translateX(180%);
            width: 60%;
          }
        }
      `}</style>
    </div>
  );
}
