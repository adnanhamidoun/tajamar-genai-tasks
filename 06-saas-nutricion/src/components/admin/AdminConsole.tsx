"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  X, 
  Clock, 
  Unlock, 
  RotateCcw, 
  Utensils, 
  Coins, 
  Wrench,
  Rocket
} from "lucide-react";
import { adminCheat } from "@/lib/actions/admin.actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkVisibility = () => {
      const saved = localStorage.getItem("dail_dev_mode") === "true";
      setIsVisible(saved);
    };

    checkVisibility();
    window.addEventListener("storage", checkVisibility);
    return () => window.removeEventListener("storage", checkVisibility);
  }, []);

  const runCheat = async (name: string, cmd: string, val?: any) => {
    setLoading(name);
    const res = await adminCheat(cmd, val);
    if (res?.success) {
      toast.success(`${name}: Completado`);
    } else {
      toast.error(`Fallo: ${res?.error}`);
    }
    setLoading(null);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Trigger Button - Minimal Red */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 right-6 h-12 w-12 bg-zinc-950 border border-white/10 rounded-full flex items-center justify-center text-red-600 shadow-2xl active:scale-95 transition-all z-50"
      >
        <Wrench className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-0 bottom-0 z-50 p-6"
          >
            <div className="bg-[#050505] border border-white/10 rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.8)] p-8 max-w-md mx-auto relative overflow-hidden">
              {/* Subtle Red Line at Top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-red-600 rounded-full blur-[2px] opacity-30" />
              
              {/* Header */}
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-red-600" /> Demo <span className="text-red-600">Control</span>
                  </h2>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1">Herramientas Pro</p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5 text-zinc-500" />
                </button>
              </div>

              {/* Controls Grid */}
              <div className="grid grid-cols-1 gap-8 text-center">
                <div className="py-10 border border-dashed border-white/10 rounded-3xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                    En construcción
                  </p>
                  <p className="text-[12px] font-bold text-zinc-500 mt-2">
                    Preparando la nueva experiencia interactiva...
                  </p>
                </div>
              </div>

              {/* Footer Info */}
              <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between opacity-30">
                <div className="flex items-center gap-2">
                  <Rocket className="h-3 w-3 text-red-600" />
                  <span className="text-[8px] font-mono uppercase font-bold tracking-widest">Dail Demo Engine</span>
                </div>
                <span className="text-[8px] font-mono uppercase font-bold tracking-widest text-zinc-500">v2.0.0-PRO</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
