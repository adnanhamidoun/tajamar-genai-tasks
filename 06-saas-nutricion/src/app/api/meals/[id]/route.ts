import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE /api/meals/[id] - Delete a meal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Security: ensure it's their own meal

    if (error) {
      console.error('[meals-delete] Error:', error)
      return NextResponse.json({ error: 'Error al eliminar la comida' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[meals-delete] Unexpected error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// PATCH /api/meals/[id] - Update a meal (quantity, name, calories, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Only allow updating specific fields
    const { food_name, calories, protein, carbs, fat, quantity } = body
    const updateData: any = {}
    if (food_name !== undefined) updateData.food_name = food_name
    if (calories !== undefined) updateData.calories = calories
    if (protein !== undefined) updateData.protein = protein
    if (carbs !== undefined) updateData.carbs = carbs
    if (fat !== undefined) updateData.fat = fat
    if (quantity !== undefined) updateData.quantity = quantity

    const { error } = await supabase
      .from('meals')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[meals-update] Error:', error)
      return NextResponse.json({ error: 'Error al actualizar la comida' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[meals-update] Unexpected error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
