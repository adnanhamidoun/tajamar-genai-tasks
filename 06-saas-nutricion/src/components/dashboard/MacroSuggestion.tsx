"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, RefreshCw, ChevronRight, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MacroSuggestionProps {
  remaining: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  coachType: string;
}

export default function MacroSuggestion({ remaining, coachType }: MacroSuggestionProps) {
  const [suggestion, setSuggestion] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const getSuggestion = async () => {
    setLoading(true);
    setIsOpen(true);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        body: JSON.stringify({ remaining, coachType }),
      });
      const data = await res.json();
      setSuggestion(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <button
        onClick={getSuggestion}
        className="w-full p-5 rounded-[32px] bg-white/[0.02] border border-white/[0.05] flex items-center justify-between group hover:bg-white/[0.04] transition-all active:scale-[0.98]"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-center group-hover:border-red-500/30 transition-all">
            <Lightbulb className="h-5 w-5 text-red-500" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase text-red-500 tracking-[0.2em] mb-0.5">Ajuste de Macros</p>
            <p className="text-sm font-bold text-white tracking-tight">¿Qué como ahora?</p>
          </div>
        </div>
        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-white/5 group-hover:bg-red-600 group-hover:text-white transition-all">
          <ChevronRight className="h-4 w-4" />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-0 bottom-0 z-50 p-4"
          >
            <div className="bg-[#0A0A0A] border border-white/10 rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.9)] p-8 pb-32 max-w-md mx-auto relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-red-600 blur-lg opacity-50" />
              
              {/* Minimal Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                  <h3 className="text-xl font-black uppercase tracking-tighter italic">Recomendación</h3>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-6">
                  <RefreshCw className="h-8 w-8 text-red-600 animate-spin" />
                  <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest animate-pulse">Buscando en la despensa...</p>
                </div>
              ) : suggestion && (
                <div className="space-y-8">
                  <div>
                    <h4 className="text-sm font-black text-red-500 uppercase tracking-widest mb-2">{suggestion.title}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed font-medium italic">
                      "{suggestion.suggestion}"
                    </p>
                  </div>

                  <div className="space-y-3">
                    {suggestion?.foods?.map((food: any, i: number) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="bg-white/[0.03] border border-white/[0.03] p-5 rounded-3xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-xl">{food.name.split(' ').pop()}</span>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-black text-white uppercase tracking-tight">
                              {food.name.replace(/[^\w\s]/gi, '').trim()}
                            </span>
                            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                              {food.amount}
                            </span>
                          </div>
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-red-600/30" />
                      </motion.div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={getSuggestion}
                      disabled={loading}
                      variant="outline"
                      className="h-16 bg-white/5 border-white/10 text-white font-black rounded-3xl uppercase tracking-widest text-[10px]"
                    >
                      {loading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        "Dame otra"
                      )}
                    </Button>
                    <Button 
                      onClick={() => setIsOpen(false)}
                      className="h-16 bg-red-600 text-white hover:bg-red-700 font-black rounded-3xl border-0 shadow-2xl uppercase tracking-widest text-xs"
                    >
                      Entendido
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
