"use client";

import { useState } from "react";
import { Flame, Beef, Wheat, Droplets, Trash2, Edit2, Minus, Plus, Sparkles, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteMeal, updateMeal } from "@/lib/actions/meal.actions";

interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity?: number;
  serving_size_g?: number;
  image_url?: string;
}

export default function MealItem({ meal }: { meal: Meal }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [quantity, setQuantity] = useState(meal.quantity || 1);
  const [isUpdating, setIsUpdating] = useState(false);

  // Editable fields state
  const [editName, setEditName] = useState(meal.name);
  const [editCalories, setEditCalories] = useState(meal.calories);
  const [editProtein, setEditProtein] = useState(meal.protein);
  const [editCarbs, setEditCarbs] = useState(meal.carbs);
  const [editFat, setEditFat] = useState(meal.fat);
  const [editWeight, setEditWeight] = useState(meal.serving_size_g || 0);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      const result = await deleteMeal(meal.id);
      if (result.success) {
        toast.success("Comida eliminada");
      } else {
        toast.error("Error al eliminar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const result = await updateMeal(meal.id, {
        food_name: editName,
        calories: Number(editCalories),
        protein: Number(editProtein),
        carbs: Number(editCarbs),
        fat: Number(editFat),
        quantity: quantity,
        serving_size_g: Number(editWeight)
      });
      if (result.success) {
        toast.success("Comida actualizada");
        setIsEditing(false);
      } else {
        toast.error("Error al actualizar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div 
        onClick={() => setIsEditing(true)}
        className="group relative bg-[#111111] rounded-[28px] p-4 border border-white/[0.03] inner-glow transition-all duration-300 hover:border-white/10 hover:scale-[1.02] cursor-pointer active:scale-[0.98]"
      >
        <div className="flex gap-4 items-center">
          {/* Image/Icon Placeholder */}
          <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 flex-shrink-0">
            {meal.image_url ? (
              <img src={meal.image_url} alt={meal.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-zinc-800">
                <Flame className="h-8 w-8 text-zinc-600" />
              </div>
            )}
            {meal.quantity && meal.quantity > 1 && (
              <div className="absolute top-1 right-1 bg-brand text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-lg">
                x{meal.quantity}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-black text-lg text-white truncate pr-2 uppercase tracking-tighter">{meal.name}</h3>
              <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                <span className="text-sm font-mono font-black text-white">{Math.round(meal.calories * (meal.quantity || 1))}</span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase">kcal</span>
              </div>
            </div>

            {/* Tags Row */}
            <div className="flex flex-wrap gap-2 mb-3">
              {meal.serving_size_g && (
                <div className="flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded-md border border-white/[0.02]">
                  <Sparkles className="h-3 w-3 text-yellow-500" />
                  <span className="text-[10px] font-bold text-zinc-400">{meal.serving_size_g}g</span>
                </div>
              )}
            </div>

            {/* Macros Row */}
            <div className="grid grid-cols-3 gap-2">
              <MacroMini icon={Beef} value={meal.protein * (meal.quantity || 1)} color="text-red-500" label="PRO" />
              <MacroMini icon={Wheat} value={meal.carbs * (meal.quantity || 1)} color="text-blue-400" label="CAR" />
              <MacroMini icon={Droplets} value={meal.fat * (meal.quantity || 1)} color="text-yellow-500" label="FAT" />
            </div>
          </div>
          
          <div className="pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="h-5 w-5 text-zinc-600" />
          </div>
        </div>
      </div>

      {/* Edit Sheet */}
      <Sheet open={isEditing} onOpenChange={setIsEditing}>
        <SheetContent side="bottom" className="rounded-t-[40px] bg-[#0A0A0A] border-t-white/10 p-8 h-[90vh] overflow-y-auto">
          <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-8" />
          <SheetHeader className="mb-8">
            <SheetTitle className="text-3xl font-black uppercase tracking-tighter text-white">Ajustar Registro</SheetTitle>
            <SheetDescription className="text-zinc-500">Optimiza los datos de tu ingesta táctica.</SheetDescription>
          </SheetHeader>

          <div className="space-y-8">
            {/* Main Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Nombre del Alimento</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-zinc-900 border-zinc-800 h-14 rounded-2xl text-lg font-bold uppercase" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Cantidad (Unidades)</Label>
                  <div className="flex items-center gap-3 bg-zinc-900 p-2 rounded-2xl border border-zinc-800">
                    <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-10 w-10 rounded-xl hover:bg-zinc-800"><Minus className="h-4 w-4" /></Button>
                    <span className="flex-1 text-center font-mono font-black text-xl">{quantity}</span>
                    <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)} className="h-10 w-10 rounded-xl hover:bg-zinc-800"><Plus className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Peso Neto (g)</Label>
                  <div className="relative">
                    <Input type="number" value={editWeight} onChange={(e) => setEditWeight(Number(e.target.value))} className="bg-zinc-900 border-zinc-800 h-14 rounded-2xl font-mono text-xl pl-12" />
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Macros Grid */}
            <div className="grid grid-cols-2 gap-4">
              <EditMacroField label="Calorías" icon={Flame} value={editCalories} onChange={setEditCalories} unit="kcal" />
              <EditMacroField label="Proteínas" icon={Beef} value={editProtein} onChange={setEditProtein} unit="g" />
              <EditMacroField label="Carbos" icon={Wheat} value={editCarbs} onChange={setEditCarbs} unit="g" />
              <EditMacroField label="Grasas" icon={Droplets} value={editFat} onChange={setEditFat} unit="g" />
            </div>
          </div>

          <SheetFooter className="mt-12 flex-col gap-4">
            <Button onClick={handleUpdate} disabled={isUpdating} className="w-full h-16 bg-white text-black hover:bg-zinc-200 rounded-[20px] font-black uppercase tracking-widest text-lg shadow-[0_10px_30px_rgba(255,255,255,0.1)]">
              {isUpdating ? "Sincronizando..." : "GUARDAR CAMBIOS"}
            </Button>
            <Button variant="ghost" onClick={handleDelete} disabled={isDeleting} className="w-full h-14 text-zinc-500 hover:text-red-500 hover:bg-red-500/5 rounded-[20px] font-black uppercase tracking-widest text-xs">
              <Trash2 className="mr-2 h-4 w-4" /> ELIMINAR REGISTRO
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

function MacroMini({ icon: Icon, value, color, label }: { icon: any, value: number, color: string, label: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/[0.02] p-1.5 rounded-lg border border-white/[0.03]">
      <Icon className={`h-3 w-3 ${color}`} />
      <div className="flex flex-col">
        <span className="text-[10px] font-mono font-black leading-none text-zinc-300">{Math.round(value)}g</span>
      </div>
    </div>
  );
}

function EditMacroField({ label, icon: Icon, value, onChange, unit }: { label: string, icon: any, value: number, onChange: (v: number) => void, unit: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 ml-1 flex items-center gap-1.5">
        <Icon className="h-3 w-3" /> {label}
      </Label>
      <div className="relative">
        <Input 
          type="number" 
          value={value} 
          onChange={(e) => onChange(Number(e.target.value))} 
          className="bg-zinc-900 border-zinc-800 h-14 rounded-2xl font-mono text-lg pr-12" 
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-600 uppercase">{unit}</span>
      </div>
    </div>
  );
}
