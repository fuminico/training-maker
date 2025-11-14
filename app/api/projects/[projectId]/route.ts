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

// GET /api/projects/[projectId] - プロジェクト詳細取得
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const { projectId } = await params

    // プロジェクト取得（RLSで自動的に所有者チェックされる）
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_settings (*)
      `)
      .eq('id', projectId)
      .single()

    if (error || !project) {
      return notFoundResponse('Project not found')
    }

    return successResponse(project)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    console.error('Error in GET /api/projects/[projectId]:', error)
    return serverErrorResponse()
  }
}

// PATCH /api/projects/[projectId] - プロジェクト更新
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const { projectId } = await params

    const body = await request.json()
    const { title, description, status } = body

    const updates: Record<string, unknown> = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (status !== undefined) updates.status = status

    if (Object.keys(updates).length === 0) {
      return errorResponse('VALIDATION_ERROR', 'No fields to update', 400)
    }

    const { data: project, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single()

    if (error || !project) {
      return notFoundResponse('Project not found or update failed')
    }

    return successResponse(project)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    console.error('Error in PATCH /api/projects/[projectId]:', error)
    return serverErrorResponse()
  }
}
