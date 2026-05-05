"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Lock, Sparkles, Zap, Shield, Flame } from "lucide-react";

const THEMES = [
  {
    id: "red-elite",
    name: "Elite Red",
    color: "#E62020",
    description: "Disciplina absoluta. El estándar de combate.",
    isPremium: false,
  },
  {
    id: "neon-blue",
    name: "Neon Blue",
    color: "#00D1FF",
    description: "Alta tecnología. Enfoque frío y preciso.",
    isPremium: true,
  },
  {
    id: "cyber-green",
    name: "Cyber Green",
    color: "#00FF94",
    description: "Bio-hacking activo. Energía renovable.",
    isPremium: true,
  },
  {
    id: "gold-standard",
    name: "Gold Standard",
    color: "#FFD700",
    description: "Excelencia pura. Solo para campeones.",
    isPremium: true,
  },
  {
    id: "violet-rage",
    name: "Violet Rage",
    color: "#BD00FF",
    description: "Intensidad máxima. Rompe tus límites.",
    isPremium: true,
  },
  {
    id: "pure-stealth",
    name: "Stealth",
    color: "#FFFFFF",
    description: "Minimalismo táctico. Sin distracciones.",
    isPremium: false,
  },
];

export function ThemeMarketplace() {
  const [currentTheme, setCurrentTheme] = useState("red-elite");

  useEffect(() => {
    const saved = localStorage.getItem("dail-custom-theme");
    if (saved) {
      setCurrentTheme(saved);
      applyTheme(saved);
    }
  }, []);

  const applyTheme = (themeId: string) => {
    const theme = THEMES.find((t) => t.id === themeId);
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty("--brand-color", theme.color);
    
    // Also update background shadows if needed
    localStorage.setItem("dail-custom-theme", themeId);
    setCurrentTheme(themeId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-sm font-black uppercase tracking-tighter italic">Marketplace de Temas</h3>
          <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">Personaliza tu interfaz de combate</p>
        </div>
        <div className="px-2 py-1 bg-red-600/10 border border-red-600/20 rounded-md">
          <Sparkles className="h-3 w-3 text-red-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {THEMES.map((theme) => (
          <motion.button
            key={theme.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => applyTheme(theme.id)}
            className={`relative flex items-center gap-4 p-4 rounded-[28px] border transition-all ${
              currentTheme === theme.id
                ? "bg-zinc-900 border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                : "bg-zinc-950/50 border-white/5 hover:border-white/10"
            }`}
          >
            {/* Color Preview */}
            <div 
              className="h-14 w-14 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg"
              style={{ backgroundColor: `${theme.color}20`, border: `1px solid ${theme.color}40` }}
            >
              <div 
                className="h-6 w-6 rounded-full shadow-inner"
                style={{ backgroundColor: theme.color, boxShadow: `0 0 15px ${theme.color}80` }}
              />
            </div>

            {/* Info */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-tight text-white italic">{theme.name}</span>
                {theme.isPremium && (
                  <span className="text-[7px] bg-red-600 text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">Premium</span>
                )}
              </div>
              <p className="text-[10px] text-zinc-500 font-bold leading-tight mt-1">{theme.description}</p>
            </div>

            {/* Status */}
            <div className="flex-shrink-0">
              {currentTheme === theme.id ? (
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-lg">
                  <Check className="h-4 w-4 text-black" />
                </div>
              ) : theme.isPremium ? (
                <div className="h-8 w-8 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5">
                  <Lock className="h-3 w-3 text-zinc-700" />
                </div>
              ) : (
                <div className="h-8 w-8 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5">
                  <div className="h-2 w-2 rounded-full bg-zinc-700" />
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>
      
      <div className="p-4 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800 text-center">
        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-relaxed">
          Nuevos temas tácticos se añaden cada temporada. <br/>
          <span className="text-red-600">Completa desafíos para desbloquear temas Premium.</span>
        </p>
      </div>
    </div>
  );
}
