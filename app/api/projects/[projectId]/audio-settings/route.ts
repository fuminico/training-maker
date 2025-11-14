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
  }>
}

// GET /api/projects/[projectId]/audio-settings - 音声設定取得
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const { projectId } = await params

    const { data: settings, error } = await supabase
      .from('project_settings')
      .select('*')
      .eq('project_id', projectId)
      .single()

    if (error || !settings) {
      return notFoundResponse('Audio settings not found')
    }

    return successResponse(settings)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    console.error('Error in GET /api/projects/[projectId]/audio-settings:', error)
    return serverErrorResponse()
  }
}

// PATCH /api/projects/[projectId]/audio-settings - 音声設定更新
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const { projectId } = await params

    const body = await request.json()
    const {
      default_voice,
      default_speed,
      default_pause_ms,
      video_resolution,
      video_fps,
    } = body

    const updates: Record<string, unknown> = {}

    if (default_voice !== undefined) updates.default_voice = default_voice
    if (default_speed !== undefined) updates.default_speed = default_speed
    if (default_pause_ms !== undefined) updates.default_pause_ms = default_pause_ms
    if (video_resolution !== undefined) updates.video_resolution = video_resolution
    if (video_fps !== undefined) updates.video_fps = video_fps

    if (Object.keys(updates).length === 0) {
      return errorResponse('VALIDATION_ERROR', 'No fields to update', 400)
    }

    const { data: settings, error } = await supabase
      .from('project_settings')
      .update(updates)
      .eq('project_id', projectId)
      .select()
      .single()

    if (error || !settings) {
      return notFoundResponse('Audio settings not found or update failed')
    }

    return successResponse(settings)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    console.error('Error in PATCH /api/projects/[projectId]/audio-settings:', error)
    return serverErrorResponse()
  }
}
