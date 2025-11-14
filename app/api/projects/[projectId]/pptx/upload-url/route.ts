import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, unauthorizedResponse, serverErrorResponse, errorResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/api/auth'

type Params = {
  params: Promise<{
    projectId: string
  }>
}

// POST /api/projects/[projectId]/pptx/upload-url - アップロード用署名付きURL生成
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const { projectId } = await params

    const body = await request.json()
    const { fileName } = body

    if (!fileName) {
      return errorResponse('VALIDATION_ERROR', 'fileName is required', 400)
    }

    // プロジェクトの所有者確認
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return errorResponse('NOT_FOUND', 'Project not found', 404)
    }

    // Storage パスを生成
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const objectPath = `projects/${projectId}/source/${timestamp}_${sanitizedFileName}`

    // 署名付きURLを生成（アップロード用）
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('training-files')
      .createSignedUploadUrl(objectPath)

    if (uploadError) {
      console.error('Error creating signed upload URL:', uploadError)
      return serverErrorResponse('Failed to create upload URL')
    }

    return successResponse({
      uploadUrl: uploadData.signedUrl,
      objectPath: objectPath,
      token: uploadData.token,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    console.error('Error in POST /api/projects/[projectId]/pptx/upload-url:', error)
    return serverErrorResponse()
  }
}
