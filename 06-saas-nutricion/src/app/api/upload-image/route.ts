import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Inicia sesión primero.' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No se encontró ningún archivo en la petición.' },
        { status: 400 }
      )
    }

    // Validate type and size
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'El archivo debe ser una imagen.' },
        { status: 400 }
      )
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'La imagen es demasiado grande. Máximo 5MB.' },
        { status: 413 }
      )
    }

    // Generate unique path
    const extension = file.type.split('/')[1] || 'jpg'
    const fileName = `${uuidv4()}.${extension}`
    const path = `${user.id}/${fileName}`

    // Upload to 'meals' bucket
    const { error: uploadError } = await supabase.storage
      .from('meals')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('[upload-image] Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Error al subir la imagen a Storage.' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('meals')
      .getPublicUrl(path)

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error) {
    console.error('[upload-image] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    )
  }
}
