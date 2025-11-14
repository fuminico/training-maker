import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/api/auth'

type Params = {
  params: Promise<{
    projectId: string
  }>
}

// GET /api/projects/[projectId]/video - 動画情報取得
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const { projectId } = await params

    const { data: mediaFiles, error } = await supabase
      .from('media_files')
      .select('*')
      .eq('project_id', projectId)
      .eq('file_type', 'video')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching video:', error)
      return serverErrorResponse('Failed to fetch video')
    }

    const video = mediaFiles && mediaFiles.length > 0 ? mediaFiles[0] : null

    return successResponse(video)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    console.error('Error in GET /api/projects/[projectId]/video:', error)
    return serverErrorResponse()
  }
}
