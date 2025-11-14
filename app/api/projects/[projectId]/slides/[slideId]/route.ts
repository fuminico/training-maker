import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
  notFoundResponse,
  errorResponse,
} from '@/lib/api/response'
import { requireAuth } from '@/lib/api/auth'

type Params = {
  params: Promise<{
    projectId: string
    slideId: string
  }>
}

// GET /api/projects/[projectId]/slides/[slideId] - スライド詳細取得
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const { projectId, slideId } = await params

    const { data: slide, error } = await supabase
      .from('slides')
      .select('*')
      .eq('id', slideId)
      .eq('project_id', projectId)
      .single()

    if (error || !slide) {
      return notFoundResponse('Slide not found')
    }

    return successResponse(slide)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    console.error('Error in GET /api/projects/[projectId]/slides/[slideId]:', error)
    return serverErrorResponse()
  }
}

// PATCH /api/projects/[projectId]/slides/[slideId] - スライド更新
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const { projectId, slideId } = await params

    const body = await request.json()
    const {
      edited_script,
      tts_voice_override,
      tts_speed_override,
    } = body

    const updates: Record<string, unknown> = {}

    if (edited_script !== undefined) {
      updates.edited_script = edited_script
      // 文字数と推定時間を計算（日本語: 約400文字/分 = 6.67文字/秒）
      const charCount = edited_script.length
      updates.char_count = charCount
      updates.estimated_seconds = Math.ceil(charCount / 6.67)
    }

    if (tts_voice_override !== undefined) updates.tts_voice_override = tts_voice_override
    if (tts_speed_override !== undefined) updates.tts_speed_override = tts_speed_override

    if (Object.keys(updates).length === 0) {
      return errorResponse('VALIDATION_ERROR', 'No fields to update', 400)
    }

    const { data: slide, error } = await supabase
      .from('slides')
      .update(updates)
      .eq('id', slideId)
      .eq('project_id', projectId)
      .select()
      .single()

    if (error || !slide) {
      return notFoundResponse('Slide not found or update failed')
    }

    return successResponse(slide)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    console.error('Error in PATCH /api/projects/[projectId]/slides/[slideId]:', error)
    return serverErrorResponse()
  }
}
