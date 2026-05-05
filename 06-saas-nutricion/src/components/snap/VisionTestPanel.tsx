"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload,
  Loader2,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Heart,
  ImageIcon,
  Sparkles,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface AnalysisResult {
  success: boolean;
  data: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    health_score: number;
    feedback: string;
  };
  saved: boolean;
  meal_id?: string;
  response_time_ms: number;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export default function VisionTestPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes.");
      return;
    }

    // Preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setResult(null);
    setError(null);

    // Convertir a Base64 y enviar
    await analyzeImage(file);
  };

  const analyzeImage = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      // Convertir a Base64
      const base64 = await fileToBase64(file);
      const imageType = file.type || "image/jpeg";

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, imageType }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error desconocido");
        toast.error(data.error || "Error en el análisis");
        return;
      }

      setResult(data);
      if (data.saved) {
        toast.success("🎉 Comida analizada y guardada");
      } else {
        toast.warning("Análisis OK pero no se pudo guardar en la DB");
      }
    } catch {
      setError("Error de conexión. ¿Está el servidor corriendo?");
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // Extraer solo la parte Base64 (quitar "data:image/jpeg;base64,")
        const base64 = dataUrl.split(",")[1];
        if (!base64) {
          reject(new Error("Error convirtiendo a Base64"));
          return;
        }
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Error leyendo archivo"));
      reader.readAsDataURL(file);
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-red-500";
    if (score >= 5) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 9) return "🏆";
    if (score >= 7) return "💪";
    if (score >= 5) return "😐";
    if (score >= 3) return "😬";
    return "💀";
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return "bg-red-500/10 text-red-600 border-red-500/20";
    if (score >= 5) return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    return "bg-red-500/10 text-red-600 border-red-500/20";
  };

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <Card className="border-dashed border-2 hover:border-red-500/50 transition-colors">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-red-500" />
            Vision Engine Test
          </CardTitle>
          <CardDescription>
            Sube una foto de comida y la IA la analizará al instante
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id="vision-test-input"
          />

          {/* Drop zone / Preview */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative cursor-pointer rounded-lg border border-border bg-muted/30 overflow-hidden transition-all hover:bg-muted/50 min-h-[200px] flex items-center justify-center"
          >
            {preview ? (
              <div className="relative w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Preview de comida"
                  className="w-full max-h-[300px] object-contain"
                />
                {loading && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                    <Loader2 className="h-8 w-8 animate-spin text-red-400" />
                    <div className="text-center">
                      <p className="text-white font-semibold text-sm">
                        🐐 The GOAT está analizando...
                      </p>
                      <p className="text-white/60 text-xs mt-1 animate-pulse">
                        Calculando macros con precisión quirúrgica
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8 px-4">
                <div className="h-14 w-14 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <ImageIcon className="h-7 w-7 text-red-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Haz clic para subir una foto
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG o WebP · Máximo 4MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Retry button */}
          {preview && !loading && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Subir otra imagen
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-red-500/30 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              ❌ {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Resultado */}
      {result && result.success && (
        <Card className="border-red-500/30 shadow-lg shadow-red-500/5 overflow-hidden">
          {/* Header con score */}
          <div className="dail-gradient px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">
                  {result.data.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-white/80" />
                  <span className="text-white/80 text-xs">
                    Guardado automáticamente
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl">
                  {getScoreEmoji(result.data.health_score)}
                </span>
                <p className="text-white/90 text-xs font-semibold mt-0.5">
                  {result.data.health_score}/10
                </p>
              </div>
            </div>
          </div>

          <CardContent className="pt-5 space-y-5">
            {/* Macros Grid */}
            <div className="grid grid-cols-2 gap-3">
              <MacroCard
                icon={Flame}
                label="Calorías"
                value={result.data.calories}
                unit="kcal"
                color="text-orange-500"
                bg="bg-orange-500/10"
              />
              <MacroCard
                icon={Beef}
                label="Proteína"
                value={result.data.protein}
                unit="g"
                color="text-red-500"
                bg="bg-red-500/10"
              />
              <MacroCard
                icon={Wheat}
                label="Carbos"
                value={result.data.carbs}
                unit="g"
                color="text-amber-500"
                bg="bg-amber-500/10"
              />
              <MacroCard
                icon={Droplets}
                label="Grasa"
                value={result.data.fat}
                unit="g"
                color="text-blue-500"
                bg="bg-blue-500/10"
              />
            </div>

            {/* Health Score Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5" />
                  Health Score
                </span>
                <Badge
                  variant="outline"
                  className={getScoreBg(result.data.health_score)}
                >
                  {result.data.health_score}/10
                </Badge>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    result.data.health_score >= 8
                      ? "bg-red-500"
                      : result.data.health_score >= 5
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${result.data.health_score * 10}%` }}
                />
              </div>
            </div>

            {/* Feedback */}
            <div className="rounded-lg bg-muted/50 p-4 border border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                🐐 The GOAT dice:
              </p>
              <p className="text-sm leading-relaxed font-medium">
                {result.data.feedback}
              </p>
            </div>

            {/* Meta info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {(result.response_time_ms / 1000).toFixed(1)}s
              </span>
              {result.usage && (
                <span>
                  {result.usage.prompt_tokens + result.usage.completion_tokens}{" "}
                  tokens
                </span>
              )}
              {result.meal_id && (
                <span className="font-mono text-[10px]">
                  {result.meal_id.slice(0, 8)}...
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// Sub-component: Macro Card
// ============================================================
function MacroCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
  bg,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  unit: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-lg border border-border p-3 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold leading-tight">
          {typeof value === "number" && !Number.isInteger(value)
            ? value.toFixed(1)
            : value}
          <span className="text-xs font-normal text-muted-foreground ml-0.5">
            {unit}
          </span>
        </p>
      </div>
    </div>
  );
}
