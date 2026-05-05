"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Camera, 
  History, 
  Zap, 
  Activity, 
  ChevronRight,
  ChevronLeft,
  Flame,
  Sparkles,
  PiggyBank,
  Scale,
  Trash2,
  Copy,
  Edit3,
  Shield
} from "lucide-react";
import Link from "next/link";
import { getFlexBankStatus } from "@/lib/actions/activity.actions";
import { createClient } from "@/lib/supabase/client";
import MacroSuggestion from "@/components/dashboard/MacroSuggestion";

export default function DashboardPage() {
  const router = useRouter();
  const [meals, setMeals] = useState<any[]>([]);
  const [bankStatus, setBankStatus] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);
  const [userWeight, setUserWeight] = useState<number | null>(null);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [editingMeal, setEditingMeal] = useState<any>(null);

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
      setSelectedMealId(null);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    const meal = meals.find(m => m.id === mealId);
    if (meal && isToday(selectedDate)) {
      setBankStatus((prev: any) => prev ? { ...prev, balance: prev.balance + meal.calories } : null);
    }
    
    const supabase = createClient();
    await supabase.from("meals").delete().eq("id", mealId);
    setMeals(meals.filter(m => m.id !== mealId));
    setSelectedMealId(null);
  };

  const handleUpdateMeal = (updatedMeal: any) => {
    const oldMeal = meals.find(m => m.id === updatedMeal.id);
    if (oldMeal && isToday(selectedDate)) {
      const diff = updatedMeal.calories - oldMeal.calories;
      setBankStatus((prev: any) => prev ? { ...prev, balance: prev.balance - diff } : null);
    }
    
    setMeals(meals.map(m => m.id === updatedMeal.id ? updatedMeal : m));
    setEditingMeal(null);
  };

  const handlePortionChange = async (meal: any, delta: number) => {
    const currentName = meal.food_name || meal.name || "";
    const match = currentName.match(/ \[x(\d+)\]$/);
    const currentPortions = match ? parseInt(match[1]) : 1;
    const newPortions = currentPortions + delta;
    
    if (newPortions < 1) return; // Use delete instead of 0
  
    const baseName = currentName.replace(/ \[x\d+\]$/, '');
    const newName = newPortions === 1 ? baseName : `${baseName} [x${newPortions}]`;
    
    const ratio = newPortions / currentPortions;
  
    const newMeal = {
      ...meal, // Keep ID and other fields for optimistic update
      food_name: newName,
      calories: Math.round((meal.calories || 0) * ratio),
      protein: Math.round((meal.protein || 0) * ratio),
      carbs: Math.round((meal.carbs || 0) * ratio),
      fat: Math.round((meal.fat || 0) * ratio),
      serving_size_g: Math.round((meal.serving_size_g || 0) * ratio),
    };
  
    // 1. Optimistic UI Update (Instant feedback)
    setMeals(prev => prev.map(m => m.id === meal.id ? newMeal : m));
    
    if (isToday(selectedDate)) {
      const diff = newMeal.calories - meal.calories;
      setBankStatus((prev: any) => prev ? { ...prev, balance: prev.balance - diff } : null);
    }
  
    // 2. Background DB Update
    const supabase = createClient();
    const { data, error } = await supabase.from("meals").update({
      food_name: newMeal.food_name,
      calories: newMeal.calories,
      protein: newMeal.protein,
      carbs: newMeal.carbs,
      fat: newMeal.fat,
      serving_size_g: newMeal.serving_size_g
    }).eq("id", meal.id).select();
    
    // 3. Rollback on error or silent failure (No RLS UPDATE policy)
    if (error || !data || data.length === 0) {
      console.error("Portion update failed silently or errored:", error);
      alert("⚠️ SUPABASE RLS ALERT: No se puede editar esta comida. Asegúrate de que tienes una política RLS 'UPDATE' en la tabla 'meals' para tu usuario.");
      
      setMeals(prev => prev.map(m => m.id === meal.id ? meal : m)); // Revert
      if (isToday(selectedDate)) {
        const diff = newMeal.calories - meal.calories;
        setBankStatus((prev: any) => prev ? { ...prev, balance: prev.balance + diff } : null); // Revert bank
      }
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23,59,59,999);

        const [mealsRes, profileRes, bankRes] = await Promise.all([
          supabase.from("meals").select("*").eq("user_id", user.id).gte("created_at", startOfDay.toISOString()).lte("created_at", endOfDay.toISOString()).order("created_at", { ascending: false }),
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          getFlexBankStatus()
        ]);

        setMeals(mealsRes.data || []);
        setProfile(profileRes.data);
        setUserWeight(profileRes.data?.current_weight || 75.0);
        setBankStatus(bankRes);

        // Si el perfil está incompleto, mandar a onboarding
        const p = profileRes.data;
        if (!p || !p.age || !p.height || !p.fitness_goal) {
          router.push("/onboarding");
          return;
        }

        // Lógica de "Finalizar Semana" (Los lunes)
        const today = new Date();
        if (today.getDay() === 1) { // 1 = Lunes
          const localStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
          const lastWeighIn = localStorage.getItem('last_weigh_in_date');
          if (lastWeighIn !== localStr) {
            setShowWeeklyReview(true);
          }
        }
      }
      setLoading(false);
    }
    loadData();
  }, [selectedDate]);

  const handleWeighIn = async (newWeight: number) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ current_weight: newWeight }).eq('id', user.id);
    }
    
    const today = new Date();
    const localStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    localStorage.setItem('last_weigh_in_date', localStr);
    
    setUserWeight(newWeight);
    setShowWeeklyReview(false);
  };

  const targetCalories = profile?.target_calories || 2000;
  const targetProtein = profile?.target_protein || 150;
  const targetCarbs = profile?.target_carbs || 200;
  const targetFat = profile?.target_fat || 60;

  const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const totalProtein = meals.reduce((sum, m) => sum + (m.protein || 0), 0);
  const totalCarbs = meals.reduce((sum, m) => sum + (m.carbs || 0), 0);
  const totalFat = meals.reduce((sum, m) => sum + (m.fat || 0), 0);

  const remainingCals = Math.max(0, targetCalories - totalCalories);
  const progressPercent = Math.min((totalCalories / targetCalories) * 100, 100);

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <AnimatePresence>
        {showWeeklyReview && (
          <WeeklyReviewModal 
            currentWeight={userWeight || 75.0} 
            onClose={handleWeighIn} 
          />
        )}
      </AnimatePresence>

      <div className="p-6 max-w-lg mx-auto space-y-8 pt-10">
        
        {/* Header with Persistent Piggy & Scale */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-10 w-auto mb-1">
              <img src="/logo.png" alt="DAIL Nutrition" className="h-full w-auto object-contain" />
            </div>
            <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Status: Operativo</p>
          </div>
          <div className="flex gap-2">
            <div className="h-14 px-4 bg-zinc-950 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-zinc-400">
              <Scale className="h-5 w-5 text-zinc-500" />
              <span className="text-lg font-black text-white">{userWeight?.toFixed(1) || '--'}<span className="text-[10px] text-zinc-500 ml-1">kg</span></span>
            </div>
            <Link href="/bank" className="h-14 w-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center relative active:scale-95 transition-all">
              <PiggyBank className={`h-7 w-7 text-brand`} />
              {bankStatus?.balance > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-brand rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(220,38,38,0.8)]">
                  <Plus className="h-2 w-2 text-white" />
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Day Navigator */}
        <div className="flex items-center justify-between bg-zinc-950 p-2 rounded-[24px] border border-white/5">
          <button onClick={() => changeDate(-1)} className="p-3 text-zinc-500 hover:text-white bg-white/5 rounded-2xl active:scale-95 transition-all">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-widest text-white">
              {isToday(selectedDate) ? "Hoy" : selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>
          <button onClick={() => changeDate(1)} disabled={isToday(selectedDate)} className="p-3 text-zinc-500 hover:text-white bg-white/5 rounded-2xl active:scale-95 transition-all disabled:opacity-20 disabled:active:scale-100">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-10 w-10 border-2 border-red-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Energy Circle */}
            <div className="relative aspect-square max-w-[280px] mx-auto flex items-center justify-center">
              <div className="absolute inset-0 bg-brand/5 rounded-full blur-[60px] animate-pulse" />
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="4" className="text-zinc-900" />
                <motion.circle 
                  cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="4" 
                  strokeDasharray="289" 
                  initial={{ strokeDashoffset: 289 }}
                  animate={{ strokeDashoffset: 289 - (progressPercent / 100) * 289 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="text-brand drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]" 
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center relative z-10">
                <span className="text-7xl font-mono font-black tracking-tighter leading-none italic">{remainingCals}</span>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-2">kcal restantes</p>
              </div>
            </div>

            {/* Macros Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-950 p-5 rounded-[28px] border border-white/5 text-center relative overflow-hidden group">
                <div className="absolute -top-2 -right-2 bg-brand/10 h-10 w-10 rounded-full blur-xl group-hover:bg-brand/20 transition-all" />
                <Shield className="h-4 w-4 text-brand mx-auto mb-2" />
                <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Proteína</p>
                <p className="text-xl font-mono font-black italic">{Math.round(totalProtein)}<span className="text-[10px] text-zinc-700 not-italic ml-0.5">g</span></p>
              </div>
              <div className="bg-zinc-950 p-5 rounded-[28px] border border-white/5 text-center relative overflow-hidden group">
                <div className="absolute -top-2 -right-2 bg-brand/10 h-10 w-10 rounded-full blur-xl group-hover:bg-brand/20 transition-all" />
                <Zap className="h-4 w-4 text-brand mx-auto mb-2" />
                <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Carbos</p>
                <p className="text-xl font-mono font-black italic">{Math.round(totalCarbs)}<span className="text-[10px] text-zinc-700 not-italic ml-0.5">g</span></p>
              </div>
              <div className="bg-zinc-950 p-5 rounded-[28px] border border-white/5 text-center relative overflow-hidden group">
                <div className="absolute -top-2 -right-2 bg-brand/10 h-10 w-10 rounded-full blur-xl group-hover:bg-brand/20 transition-all" />
                <Flame className="h-4 w-4 text-brand mx-auto mb-2" />
                <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Grasas</p>
                <p className="text-xl font-mono font-black italic">{Math.round(totalFat)}<span className="text-[10px] text-zinc-700 not-italic ml-0.5">g</span></p>
              </div>
            </div>

            {/* AI Suggestions Section (Only for Today) */}
            {isToday(selectedDate) && (
              <MacroSuggestion 
                remaining={{ calories: remainingCals, protein: targetProtein - totalProtein, carbs: targetCarbs - totalCarbs, fat: targetFat - totalFat }} 
                coachType={profile?.coach_personality || 'casual'} 
              />
            )}

            {/* Meals Section */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Combustible del Día</h3>
                <span className="text-[10px] font-mono font-bold text-brand">{meals.length} REGISTROS</span>
              </div>
              
              {meals.length === 0 ? (
                <div className="py-16 text-center bg-zinc-950/30 rounded-[40px] border border-dashed border-zinc-900">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700 italic">No hay datos de combate hoy</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {meals.map((meal) => (
                    <div key={meal.id} className="space-y-2">
                      <div 
                        onClick={() => setSelectedMealId(selectedMealId === meal.id ? null : meal.id)}
                        className={`bg-zinc-950 border rounded-[32px] p-5 flex items-center justify-between group hover:border-brand/20 transition-all cursor-pointer ${selectedMealId === meal.id ? 'border-brand/50 bg-brand/5 shadow-[0_10px_30px_rgba(220,38,38,0.1)]' : 'border-white/5'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-2xl bg-zinc-900 flex items-center justify-center overflow-hidden border border-white/5">
                            {meal.image_url ? (
                              <img src={meal.image_url} alt="" className="h-full w-full object-cover transition-all duration-500" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xl bg-brand/5">🍽️</div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white italic uppercase tracking-tight flex items-center gap-2">
                              {(meal.food_name || meal.name || "").replace(/ \[x\d+\]$/, '').replace(/\p{Emoji}/gu, '').trim()}
                              {(meal.food_name || meal.name || "").match(/ \[x(\d+)\]$/) && (
                                <span className="text-[10px] bg-brand/20 text-brand px-1.5 py-0.5 rounded-md font-black">
                                  x{(meal.food_name || meal.name).match(/ \[x(\d+)\]$/)[1]}
                                </span>
                              )}
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-1">
                                <Shield className="h-2.5 w-2.5 text-zinc-600" />
                                <span className="text-[9px] font-mono font-bold text-zinc-500">{Math.round(meal.protein)}g</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Zap className="h-2.5 w-2.5 text-zinc-600" />
                                <span className="text-[9px] font-mono font-bold text-zinc-500">{Math.round(meal.carbs)}g</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Flame className="h-2.5 w-2.5 text-zinc-600" />
                                <span className="text-[9px] font-mono font-bold text-zinc-500">{Math.round(meal.fat)}g</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-mono font-black italic text-brand leading-none">{meal.calories}</p>
                          <p className="text-[8px] font-black text-zinc-700 uppercase mt-1">kcal</p>
                        </div>
                      </div>
                      
                      {/* Accordion Actions */}
                      <AnimatePresence>
                        {selectedMealId === meal.id && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2 overflow-hidden px-1"
                          >
                            <button 
                              onClick={() => setEditingMeal(meal)}
                              className="flex-1 h-12 bg-zinc-900/50 border border-white/5 rounded-[20px] flex items-center justify-center gap-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all text-[10px] font-bold uppercase tracking-widest active:scale-95"
                            >
                              <Edit3 className="h-4 w-4" /> Editar
                            </button>
                            
                            <button 
                              onClick={() => handleDeleteMeal(meal.id)}
                              className="flex-1 h-12 bg-red-950/20 border border-red-900/30 rounded-[20px] flex items-center justify-center gap-2 text-brand hover:text-white hover:bg-brand transition-all text-[10px] font-bold uppercase tracking-widest active:scale-95"
                            >
                              <Trash2 className="h-4 w-4" /> Borrar
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {editingMeal && (
          <EditMealModal meal={editingMeal} onClose={() => setEditingMeal(null)} onSave={handleUpdateMeal} />
        )}
      </AnimatePresence>
    </div>
  );
}

// --------------------------------------------------------------------------------------
// MODAL DE REVISIÓN SEMANAL (EL "CIERRE DE CICLO")
// --------------------------------------------------------------------------------------
function WeeklyReviewModal({ onClose, currentWeight }: { onClose: (w: number) => void, currentWeight: number }) {
  const [weight, setWeight] = useState(currentWeight || 75.0);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
    >
      <Scale className="h-16 w-16 text-brand mb-6 animate-pulse" />
      <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white mb-2">Fin de Ciclo</h2>
      <p className="text-sm font-bold text-zinc-400 mb-8 max-w-xs">
        Es Lunes. Consolida tus ganancias y actualiza tu chasis para el nuevo ciclo de entrenamiento.
      </p>

      <div className="bg-zinc-950 border border-white/10 p-8 rounded-[40px] w-full max-w-sm mb-8 shadow-[0_20px_50px_rgba(220,38,38,0.1)]">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">Tu Peso Actual</p>
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setWeight(w => w - 0.5)} className="h-16 w-16 bg-white/5 rounded-full text-white text-3xl font-bold active:scale-90 transition-transform">-</button>
          <div className="text-7xl font-black font-mono w-40 text-white">{weight.toFixed(1)}</div>
          <button onClick={() => setWeight(w => w + 0.5)} className="h-16 w-16 bg-white/5 rounded-full text-white text-3xl font-bold active:scale-90 transition-transform">+</button>
        </div>
        <p className="text-[12px] font-bold text-zinc-600 mt-6 uppercase">Kilogramos</p>
      </div>

      <button 
        onClick={() => onClose(weight)} 
        className="w-full max-w-sm h-16 bg-brand text-white font-black uppercase tracking-widest rounded-3xl shadow-[0_0_30px_rgba(220,38,38,0.3)] active:scale-95 transition-transform"
      >
        Finalizar Semana
      </button>
    </motion.div>
  );
}

// --------------------------------------------------------------------------------------
// MODAL DE EDICIÓN DE COMIDA
// --------------------------------------------------------------------------------------
function EditMealModal({ meal, onClose, onSave }: { meal: any, onClose: () => void, onSave: (updated: any) => void }) {
  const currentName = meal.food_name || meal.name || "";
  const match = currentName.match(/ \[x(\d+)\]$/);
  const initialPortions = match ? parseInt(match[1]) : 1;

  const [portions, setPortions] = useState(initialPortions);
  const [formData, setFormData] = useState({
    food_name: currentName,
    calories: meal.calories || 0,
    protein: meal.protein || 0,
    carbs: meal.carbs || 0,
    fat: meal.fat || 0,
    serving_size_g: meal.serving_size_g || 0,
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'food_name' ? value : Number(value)
    }));
  };

  const handlePortionChange = (delta: number) => {
    const newPortions = portions + delta;
    if (newPortions < 1) return;
    
    const ratio = newPortions / portions;
    setPortions(newPortions);
    
    const baseName = formData.food_name.replace(/ \[x\d+\]$/, '');
    const newName = newPortions === 1 ? baseName : `${baseName} [x${newPortions}]`;
    
    setFormData(prev => ({
      ...prev,
      food_name: newName,
      calories: Math.round(prev.calories * ratio),
      protein: Math.round(prev.protein * ratio),
      carbs: Math.round(prev.carbs * ratio),
      fat: Math.round(prev.fat * ratio),
      serving_size_g: Math.round(prev.serving_size_g * ratio),
    }));
  };

  const handleSave = async () => {
    const supabase = createClient();
    
    // We must ensure we're updating the correct ID
    const { data, error } = await supabase.from('meals').update(formData).eq('id', meal.id).select();
    
    if (error) {
      alert("Error en la base de datos: " + error.message);
      onClose();
      return;
    }

    if (!data || data.length === 0) {
      alert("⚠️ FALLO SILENCIOSO DE SUPABASE: No se ha actualizado nada. Esto ocurre cuando la tabla 'meals' NO tiene activada la política RLS para UPDATE. Ve a Supabase -> Authentication -> Policies -> 'meals' y añade una política para UPDATE (usando auth.uid() = user_id).");
      onClose();
      return;
    }

    // Success
    onSave({ ...meal, ...formData });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
    >
      <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white mb-6">Editar Registro</h2>
      
      <div className="w-full max-w-sm space-y-4 text-left">
        {/* Multiplicador de Raciones Integrado */}
        <div className="flex items-center justify-between bg-zinc-900 border border-white/10 rounded-2xl p-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Multiplicador (Raciones)</span>
          <div className="flex items-center gap-2">
            <button onClick={() => handlePortionChange(-1)} className="h-10 w-10 bg-white/5 rounded-xl text-white font-black active:scale-90 transition-transform">-</button>
            <span className="text-xl font-mono font-black text-white w-10 text-center">{portions}</span>
            <button onClick={() => handlePortionChange(1)} className="h-10 w-10 bg-white/5 rounded-xl text-white font-black active:scale-90 transition-transform">+</button>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Nombre o Emoji</label>
          <input type="text" name="food_name" value={formData.food_name} onChange={handleChange} className="w-full h-14 bg-zinc-900 border border-white/10 rounded-2xl px-4 text-white font-bold" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Calorías</label>
            <input type="number" name="calories" value={formData.calories} onChange={handleChange} className="w-full h-14 bg-zinc-900 border border-white/10 rounded-2xl px-4 text-white font-mono font-bold" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Peso (g)</label>
            <input type="number" name="serving_size_g" value={formData.serving_size_g} onChange={handleChange} className="w-full h-14 bg-zinc-900 border border-white/10 rounded-2xl px-4 text-white font-mono font-bold" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Prot (g)</label>
            <input type="number" name="protein" value={formData.protein} onChange={handleChange} className="w-full h-14 bg-zinc-900 border border-white/10 rounded-2xl px-4 text-white font-mono font-bold" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Carbs (g)</label>
            <input type="number" name="carbs" value={formData.carbs} onChange={handleChange} className="w-full h-14 bg-zinc-900 border border-white/10 rounded-2xl px-4 text-white font-mono font-bold" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Fat (g)</label>
            <input type="number" name="fat" value={formData.fat} onChange={handleChange} className="w-full h-14 bg-zinc-900 border border-white/10 rounded-2xl px-4 text-white font-mono font-bold" />
          </div>
        </div>
      </div>

      <div className="flex gap-4 w-full max-w-sm mt-8">
        <button onClick={onClose} className="flex-1 h-14 bg-white/5 text-white font-bold uppercase tracking-widest rounded-2xl active:scale-95 transition-transform">
          Cancelar
        </button>
        <button onClick={handleSave} className="flex-1 h-14 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-95 transition-transform">
          Guardar
        </button>
      </div>
    </motion.div>
  );
}
