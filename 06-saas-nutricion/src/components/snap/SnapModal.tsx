"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import imageCompression from 'browser-image-compression';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Upload,
  Camera,
  Flame,
  Beef,
  Wheat,
  Droplets,
  X,
  Sparkles,
  ChevronRight,
  Mic
} from "lucide-react";
import AnalysisLoader from "./AnalysisLoader";

interface AnalysisData {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  health_score: number;
  feedback: string;
}

interface AnalysisResult {
  success: boolean;
  data: AnalysisData;
  saved: boolean;
}

type ModalMode = "camera" | "text" | "voice";
type ModalState = "idle" | "captured" | "loading" | "result" | "error";

export default function SnapModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [state, setState] = useState<ModalState>("idle");
  const [mode, setMode] = useState<ModalMode>("camera");
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const resetAll = () => {
    setState("idle");
    setMode("camera");
    setPreview(null);
    setSelectedFile(null);
    setTextInput("");
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setTimeout(resetAll, 300);
    }
    onOpenChange(isOpen);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setSelectedFile(file);
    setState("captured");
  };

  const handleAnalyze = async () => {
    if (!selectedFile && !textInput) return;
    setState("loading");
    
    try {
      let payload: any = {};
      if (selectedFile) {
        const compressed = await imageCompression(selectedFile, { maxSizeMB: 0.4, maxWidthOrHeight: 1024 });
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
          reader.readAsDataURL(compressed);
        });
        
        const b64 = await base64Promise;
        payload = { 
          image: b64, 
          imageType: selectedFile.type,
          imageUrl: `data:${selectedFile.type};base64,${b64}` // Guardado directo en base de datos
        };
      } else {
        payload = { text: textInput };
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error en el análisis");

      setResult(data);
      setState("result");
      // Eliminado el router.refresh() oculto aquí. La recarga se hará al confirmar.
    } catch (err: any) {
      setError(err.message);
      setState("error");
      toast.error(err.message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[40px] max-h-[92vh] overflow-hidden p-0 bg-black border-white/5 flex flex-col">
        <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mt-4 shrink-0" />
        
        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32">
          {/* Mode Selector */}
          {state === "idle" && (
            <div className="flex bg-zinc-950 p-1 rounded-2xl mb-8 border border-white/5 shadow-inner">
              {[
                { id: "camera", label: "Cámara", icon: Camera },
                { id: "text", label: "Texto", icon: Sparkles },
                { id: "voice", label: "Voz", icon: Mic }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setMode(t.id as ModalMode)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    mode === t.id ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-zinc-600 hover:text-zinc-400"
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <SheetHeader className="mb-8">
            <SheetTitle className="text-3xl font-black text-center uppercase tracking-tighter italic">
              {state === "result" ? "Veredicto" : state === "loading" ? "Analizando" : "Registrar"}
            </SheetTitle>
          </SheetHeader>

          {state === "idle" && (
            <div className="space-y-6">
              {mode === "camera" && (
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => cameraInputRef.current?.click()} className="aspect-square rounded-[32px] bg-zinc-950 border border-white/5 flex flex-col items-center justify-center gap-4 hover:border-red-600/30 transition-all group">
                    <div className="h-16 w-16 rounded-3xl bg-red-600/10 flex items-center justify-center border border-red-600/20 group-active:scale-90 transition-transform">
                      <Camera className="h-8 w-8 text-red-600" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Hacer Foto</span>
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-[32px] bg-zinc-950 border border-white/5 flex flex-col items-center justify-center gap-4 hover:border-white/10 transition-all group">
                    <div className="h-16 w-16 rounded-3xl bg-zinc-900 flex items-center justify-center border border-white/5">
                      <Upload className="h-8 w-8 text-zinc-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Galería</span>
                  </button>
                </div>
              )}

              {mode === "text" && (
                <div className="space-y-4">
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Describe lo que vas a comer..."
                    className="w-full h-48 bg-zinc-950 border border-white/5 rounded-[32px] p-6 text-white placeholder:text-zinc-800 focus:border-red-600/50 transition-all resize-none font-bold text-lg leading-tight"
                  />
                  <Button disabled={!textInput} onClick={handleAnalyze} className="w-full h-16 bg-red-600 text-white font-black uppercase tracking-widest rounded-3xl border-0 shadow-2xl shadow-red-600/20">
                    Sincronizar Plato
                  </Button>
                </div>
              )}

              {mode === "voice" && (
                <div className="flex flex-col items-center py-12 space-y-8">
                  <button className="h-36 w-36 rounded-full bg-red-600/10 border-4 border-red-600/20 flex items-center justify-center animate-pulse">
                    <Mic className="h-12 w-12 text-red-600" />
                  </button>
                  <div className="text-center">
                    <p className="text-2xl font-black uppercase tracking-tighter italic">Escuchando...</p>
                    <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-2">Dime qué has comido</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {state === "captured" && preview && (
            <div className="space-y-6">
              <div className="relative rounded-[40px] overflow-hidden border border-white/5 bg-zinc-950 shadow-2xl">
                <img src={preview} alt="Preview" className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1 h-16 rounded-3xl border-white/5 bg-zinc-950 text-zinc-500 font-black uppercase" onClick={() => setState("idle")}>
                  Repetir
                </Button>
                <Button className="flex-1 h-16 bg-red-600 text-white rounded-3xl border-0 shadow-2xl shadow-red-600/20 font-black uppercase" onClick={handleAnalyze}>
                  Analizar
                </Button>
              </div>
            </div>
          )}

          {state === "loading" && <AnalysisLoader previewUrl={preview} />}

          {state === "result" && result?.data && (
            <div className="space-y-6">
              <div className="bg-zinc-950 rounded-[40px] border border-white/5 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8">
                  <div className="h-16 w-16 rounded-3xl bg-zinc-900 border border-white/5 flex flex-col items-center justify-center">
                    <span className="text-2xl">{getScoreEmoji(result.data.health_score)}</span>
                    <span className="text-[10px] font-black text-zinc-600 mt-1">{result.data.health_score}/10</span>
                  </div>
                </div>
                
                <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-8 max-w-[70%] leading-none">{result.data.name}</h3>

                <div className="grid grid-cols-2 gap-3 mb-8">
                  <MacroMini icon={Flame} label="Calorías" value={result.data.calories} unit="kcal" />
                  <MacroMini icon={Beef} label="Proteína" value={result.data.protein} unit="g" />
                  <MacroMini icon={Wheat} label="Carbos" value={result.data.carbs} unit="g" />
                  <MacroMini icon={Droplets} label="Grasas" value={result.data.fat} unit="g" />
                </div>

                <div className="bg-white/[0.02] rounded-3xl p-5 border border-white/[0.05]">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">Veredicto del Coach</p>
                  <p className="text-sm font-bold leading-relaxed italic text-zinc-300">"{result.data.feedback}"</p>
                </div>
              </div>

              <Button 
                className="w-full h-16 bg-white text-black hover:bg-zinc-200 rounded-3xl font-black uppercase tracking-widest text-xs" 
                onClick={() => {
                  resetAll();
                  onOpenChange(false);
                  window.location.reload(); // 🔥 Recarga forzada y limpia
                }}
              >
                Confirmar Registro
              </Button>
            </div>
          )}
        </div>


        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
      </SheetContent>
    </Sheet>
  );
}

function MacroMini({ icon: Icon, label, value, unit }: any) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3 w-3 text-red-600" />
        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">{label}</span>
      </div>
      <p className="text-lg font-mono font-black">{value}<span className="text-[9px] ml-0.5 text-zinc-700">{unit}</span></p>
    </div>
  );
}

const getScoreEmoji = (score: number) => {
  if (score >= 9) return "🏆";
  if (score >= 7) return "💪";
  if (score >= 5) return "😐";
  if (score >= 3) return "😬";
  return "💀";
};
