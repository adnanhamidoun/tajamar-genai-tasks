"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, LogIn, Mail, Lock, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error("Email o contraseña incorrectos.");
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Error de conexión. Inténtalo de nuevo.");
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="text-center">
        <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Bienvenido</h2>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">Introduce tus credenciales de acceso</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-2">Email de Combate</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-700" />
              <Input
                type="email"
                placeholder="nombre@mision.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-16 bg-zinc-950 border-zinc-900 focus:border-brand rounded-[24px] pl-12 text-white font-bold transition-all"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Contraseña Segura</Label>
              <button
                type="button"
                onClick={() => toast.info("Funcionalidad próximamente.")}
                className="text-[10px] text-brand font-black uppercase tracking-widest hover:underline transition-all"
              >
                ¿Perdida?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-700" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-16 bg-zinc-950 border-zinc-900 focus:border-brand rounded-[24px] pl-12 pr-12 text-white font-mono font-bold transition-all"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-18 bg-brand hover:bg-brand text-white font-black uppercase tracking-widest rounded-[32px] shadow-[0_15px_40px_rgba(220,38,38,0.2)] active:scale-[0.98] transition-all text-base"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
          ) : (
            <LogIn className="h-6 w-6 mr-3" />
          )}
          {loading ? "Sincronizando..." : "ACCEDER A LA RED"}
        </Button>
      </form>

      <div className="text-center pt-4">
        <p className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest">
          ¿Sin acceso operativo?{" "}
          <Link
            href="/register"
            className="text-white hover:text-brand font-black transition-colors underline underline-offset-4"
          >
            Únete a la Élite
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
