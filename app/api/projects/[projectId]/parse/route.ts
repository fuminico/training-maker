import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, unauthorizedResponse, serverErrorResponse, errorResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/api/auth'

type Params = {
  params: Promise<{
    projectId: string
  }>
}

// POST /api/projects/[projectId]/parse - PPTX解析ジョブを起動
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const { projectId } = await params

    const body = await request.json()
    const { reparse = false } = body

    // プロジェクトの所有者確認
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return errorResponse('NOT_FOUND', 'Project not found', 404)
    }

    if (!project.pptx_file_path) {
      return errorResponse('VALIDATION_ERROR', 'PPTX file not uploaded yet', 400)
    }

    // ジョブを作成
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        project_id: projectId,
        job_type: 'pptx_parse',
        status: 'pending',
        payload: { reparse },
      })
      .select()
      .single()

    if (jobError) {
      console.error('Error creating job:', jobError)
      return serverErrorResponse('Failed to create parse job')
    }

    // プロジェクトステータスを更新
    await supabase
      .from('projects')
      .update({ status: 'editing' })
      .eq('id', projectId)

    return successResponse({ jobId: job.id })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    console.error('Error in POST /api/projects/[projectId]/parse:', error)
    return serverErrorResponse()
  }
}
