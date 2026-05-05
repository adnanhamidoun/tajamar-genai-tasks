"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Settings as SettingsIcon, 
  Terminal, 
  Bell, 
  Shield, 
  Moon,
  ChevronRight,
  Zap
} from "lucide-react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    // Load dev mode state from localStorage
    const saved = localStorage.getItem("dail_dev_mode") === "true";
    setIsDevMode(saved);
  }, []);

  const toggleDevMode = (val: boolean) => {
    setIsDevMode(val);
    localStorage.setItem("dail_dev_mode", val.toString());
    // Trigger a storage event so other components (like the AdminPanel) know to show/hide
    window.dispatchEvent(new Event("storage"));
    
    if (val) {
      alert("¡MODO DESARROLLADOR ACTIVADO! Busca el rayo verde en la esquina inferior.");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32">
      <div className="max-w-md mx-auto pt-10 px-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link href="/profile" className="h-10 w-10 bg-white/5 rounded-2xl flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-black uppercase tracking-tighter italic">Ajustes</h1>
        </div>

        <div className="space-y-8">
          
          {/* Account Section */}
          <section className="space-y-4">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">General</p>
            <div className="bg-[#111111] rounded-[32px] overflow-hidden border border-white/[0.03]">
              <SettingItem icon={<Bell className="h-4 w-4 text-blue-500" />} title="Notificaciones" />
              <SettingItem icon={<Moon className="h-4 w-4 text-purple-500" />} title="Modo Oscuro" value="Auto" />
              <SettingItem icon={<Shield className="h-4 w-4 text-emerald-500" />} title="Privacidad" />
            </div>
          </section>

          {/* Experimental Section */}
          <section className="space-y-4">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 text-orange-500">Laboratorio (Demo)</p>
            <div className="bg-[#111111] rounded-[32px] p-6 border border-white/[0.03]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                    <Terminal className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Modo Desarrollador</h3>
                    <p className="text-[10px] text-zinc-500">Habilita el panel creativo y trucos.</p>
                  </div>
                </div>
                <Switch 
                  checked={isDevMode} 
                  onCheckedChange={toggleDevMode}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
              
              {isDevMode && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-6 pt-6 border-t border-white/5 space-y-4"
                >
                  <div className="bg-green-500/5 p-4 rounded-2xl border border-green-500/10 flex items-center gap-3">
                    <Zap className="h-4 w-4 text-green-500" />
                    <p className="text-[10px] text-green-200 font-medium leading-tight">
                      El rayo verde flotante ahora es visible en todas las pantallas. Úsalo para saltar semanas o inyectar kcal.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function SettingItem({ icon, title, value }: { icon: React.ReactNode, title: string, value?: string }) {
  return (
    <div className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors border-b border-white/[0.02] last:border-0 cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <span className="font-bold text-sm">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-xs text-zinc-500 font-medium">{value}</span>}
        <ChevronRight className="h-4 w-4 text-zinc-700" />
      </div>
    </div>
  );
}
