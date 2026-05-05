// src/types/database.types.ts
// Tipos manuales desde DATABASE_BLUEPRINT.md §5
// En producción, usar: npx supabase gen types typescript --linked

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          full_name: string | null
          avatar_url: string | null
          target_calories: number | null
          current_weight: number | null
          fitness_goal: 'lose' | 'maintain' | 'gain' | null
          daily_goal_protein: number | null
          daily_goal_carbs: number | null
          daily_goal_fat: number | null
          onboarding_complete: boolean
          age: number | null
          height: number | null
          gender: 'male' | 'female' | null
          target_weight: number | null
          target_weeks: number | null
          sport_type: string | null
          activity_level: string | null
          coach_personality: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          full_name?: string | null
          avatar_url?: string | null
          target_calories?: number | null
          current_weight?: number | null
          fitness_goal?: 'lose' | 'maintain' | 'gain' | null
          daily_goal_protein?: number | null
          daily_goal_carbs?: number | null
          daily_goal_fat?: number | null
          onboarding_complete?: boolean
          age?: number | null
          height?: number | null
          gender?: 'male' | 'female' | null
          target_weight?: number | null
          target_weeks?: number | null
          sport_type?: string | null
          activity_level?: string | null
          coach_personality?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          full_name?: string | null
          avatar_url?: string | null
          target_calories?: number | null
          current_weight?: number | null
          fitness_goal?: 'lose' | 'maintain' | 'gain' | null
          daily_goal_protein?: number | null
          daily_goal_carbs?: number | null
          daily_goal_fat?: number | null
          onboarding_complete?: boolean
          age?: number | null
          height?: number | null
          gender?: 'male' | 'female' | null
          target_weight?: number | null
          target_weeks?: number | null
          sport_type?: string | null
          activity_level?: string | null
          coach_personality?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      meals: {
        Row: {
          id: string
          user_id: string
          created_at: string
          food_name: string
          calories: number
          protein: number
          carbs: number
          fat: number
          image_url: string | null
          health_tip: string | null
          serving_size_g: number | null
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other'
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          food_name: string
          calories: number
          protein?: number
          carbs?: number
          fat?: number
          image_url?: string | null
          health_tip?: string | null
          serving_size_g?: number | null
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other'
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          food_name?: string
          calories?: number
          protein?: number
          carbs?: number
          fat?: number
          image_url?: string | null
          health_tip?: string | null
          serving_size_g?: number | null
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other'
        }
        Relationships: [
          {
            foreignKeyName: "meals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      activities: {
        Row: {
          id: string
          user_id: string
          created_at: string
          activity_type: string
          duration_min: number
          calories_burned: number
          intensity: 'low' | 'medium' | 'high'
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          activity_type: string
          duration_min: number
          calories_burned?: number
          intensity?: 'low' | 'medium' | 'high'
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          activity_type?: string
          duration_min?: number
          calories_burned?: number
          intensity?: 'low' | 'medium' | 'high'
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
