import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
  errorResponse,
} from '@/lib/api/response'
import { requireAuth } from '@/lib/api/auth'

type Params = {
  params: Promise<{
    projectId: string
  }>
}

// POST /api/projects/[projectId]/video/generate - 動画生成ジョブ起動
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const { projectId } = await params

    const body = await request.json()
    const { regenerate = false } = body

    // プロジェクトの所有者確認
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return errorResponse('NOT_FOUND', 'Project not found', 404)
    }

    // すべてのスライドに音声があるか確認
    const { data: slides, error: slidesError } = await supabase
      .from('slides')
      .select('id, audio_file_path')
      .eq('project_id', projectId)

    if (slidesError) {
      return serverErrorResponse('Failed to fetch slides')
    }

    const slidesWithoutAudio = slides.filter(s => !s.audio_file_path)
    if (slidesWithoutAudio.length > 0) {
      return errorResponse(
        'VALIDATION_ERROR',
        `${slidesWithoutAudio.length} slide(s) do not have audio yet. Please generate audio first.`,
        400
      )
    }

    // ジョブを作成
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        project_id: projectId,
        job_type: 'video_generation',
        status: 'pending',
        payload: { regenerate },
      })
      .select()
      .single()

    if (jobError) {
      console.error('Error creating job:', jobError)
      return serverErrorResponse('Failed to create video generation job')
    }

    // プロジェクトステータスを更新
    await supabase
      .from('projects')
      .update({ status: 'video_generating' })
      .eq('id', projectId)

    return successResponse({ jobId: job.id })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    console.error('Error in POST /api/projects/[projectId]/video/generate:', error)
    return serverErrorResponse()
  }
}
