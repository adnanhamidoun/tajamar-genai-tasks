import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Shield, Clock, CalendarDays, ArrowLeft, Flame, Zap, Target, TrendingDown } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch meals and profile for target comparison
  const [{ data: meals }, { data: profile }] = await Promise.all([
    supabase.from("meals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("profiles").select("target_calories").eq("id", user.id).single()
  ]);

  const safeMeals = meals ?? [];
  const targetCalories = profile?.target_calories || 2000;

  // Group meals by date
  const groupedMeals = safeMeals.reduce((acc, meal) => {
    const date = new Date(meal.created_at).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (!acc[date]) {
      acc[date] = { meals: [], totalCals: 0 };
    }
    acc[date].meals.push(meal);
    acc[date].totalCals += (meal.calories || 0);
    return acc;
  }, {} as Record<string, { meals: any[], totalCals: number }>);

  const getDayStatus = (total: number) => {
    const diff = total - targetCalories;
    if (Math.abs(diff) < 100) return { label: "PERFECTO", color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20", icon: Target };
    if (total < targetCalories) return { label: "DÉFICIT", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: TrendingDown };
    return { label: "EXCESO", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", icon: Flame };
  };

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <div className="max-w-md mx-auto px-6 pt-12">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="h-10 w-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center hover:bg-zinc-800 transition-colors">
              <ArrowLeft className="h-5 w-5 text-zinc-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">Historial</h1>
              <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest mt-1">Archivado de Combate</p>
            </div>
          </div>
          <div className="h-10 w-10 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center justify-center">
            <Zap className="h-5 w-5 text-red-600" />
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-12">
          {Object.entries(groupedMeals).length === 0 ? (
            <div className="text-center py-20 rounded-[40px] border border-dashed border-zinc-800 bg-zinc-950/30">
              <CalendarDays className="h-12 w-12 text-zinc-800 mx-auto mb-4" />
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">Sin registros previos</h3>
              <p className="text-[10px] text-zinc-700 mt-2 uppercase font-bold">Inicia tu primera misión nutricional</p>
            </div>
          ) : (
            Object.entries(groupedMeals).map(([date, data]) => {
              const status = getDayStatus(data.totalCals);
              const progress = Math.min((data.totalCals / targetCalories) * 100, 100);

              return (
                <div key={date} className="space-y-6 relative">
                  {/* Date Sticky Header */}
                  <div className="flex items-center justify-between sticky top-4 z-20 bg-black/80 backdrop-blur-md py-2 -mx-2 px-2 rounded-xl border border-white/5">
                    <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <CalendarDays className="h-3 w-3 text-red-600" />
                      {date}
                    </h2>
                    <div className={`px-2 py-0.5 rounded-md border ${status.bg} ${status.border} ${status.color} text-[8px] font-black tracking-widest uppercase`}>
                      {status.label}
                    </div>
                  </div>

                  {/* Day Summary Card */}
                  <div className="bg-zinc-950 rounded-[32px] border border-white/5 p-6 space-y-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Total Día</p>
                        <p className="text-3xl font-mono font-black italic tracking-tighter">
                          {data.totalCals} <span className="text-xs text-zinc-600 not-italic ml-1">kcal</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Meta</p>
                        <p className="text-sm font-mono font-bold text-zinc-400">{targetCalories} kcal</p>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${data.totalCals > targetCalories ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-white'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Meals List */}
                  <div className="space-y-4 pl-4 border-l border-zinc-900 ml-2">
                    {data.meals.map((meal) => (
                      <div
                        key={meal.id}
                        className="group relative flex gap-4 p-4 rounded-[24px] bg-zinc-900/30 border border-white/[0.03] hover:border-red-600/30 transition-all active:scale-[0.98]"
                      >
                        {/* Image Thumbnail */}
                        <div className="h-16 w-16 shrink-0 rounded-2xl bg-zinc-900 overflow-hidden relative border border-white/5">
                          {meal.image_url ? (
                            <img
                              src={meal.image_url}
                              alt={meal.food_name}
                              className="object-cover w-full h-full transition-all duration-500"
                              loading="lazy"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-lg">🍽️</span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 py-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-black text-sm uppercase tracking-tight truncate pr-4 italic">
                              {meal.food_name}
                            </h3>
                            <span className="text-[10px] font-mono font-bold text-zinc-600">
                              {new Date(meal.created_at).toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-red-600 italic">{meal.calories} KCAL</span>
                            <div className="flex gap-2 text-[8px] font-mono font-bold text-zinc-700 uppercase">
                              <span>P: {Math.round(meal.protein ?? 0)}g</span>
                              <span>C: {Math.round(meal.carbs ?? 0)}g</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
