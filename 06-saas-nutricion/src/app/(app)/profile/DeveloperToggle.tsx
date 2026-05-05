"use client";

import { useState, useEffect } from "react";
import { Wrench, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

export default function DeveloperToggle() {
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("dail_dev_mode") === "true";
    setIsDevMode(saved);
  }, []);

  const toggleDevMode = (val: boolean) => {
    setIsDevMode(val);
    localStorage.setItem("dail_dev_mode", val.toString());
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div className="bg-zinc-950 p-6 rounded-[28px] border border-zinc-900 shadow-inner">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-red-600/10 flex items-center justify-center border border-red-600/20">
            <Wrench className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-black text-sm text-white uppercase tracking-tighter italic">Demo Control</h3>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-black">Presentación Activa</p>
          </div>
        </div>
        <Switch 
          checked={isDevMode} 
          onCheckedChange={toggleDevMode}
        />
      </div>
      
      {isDevMode && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="mt-4 pt-4 border-t border-white/5"
        >
          <div className="bg-red-600/5 p-4 rounded-2xl border border-red-600/10 flex items-center gap-3">
            <Info className="h-4 w-4 text-red-500" />
            <p className="text-[10px] text-red-200/60 font-bold leading-tight uppercase tracking-widest">
              Panel de control habilitado. Usa el icono flotante para gestionar la sesión en tiempo real.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
