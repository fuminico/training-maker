import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/api/auth'

type Params = {
  params: Promise<{
    projectId: string
  }>
}

// GET /api/projects/[projectId]/slides - スライド一覧取得
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const { projectId } = await params

    const { data: slides, error } = await supabase
      .from('slides')
      .select('*')
      .eq('project_id', projectId)
      .order('slide_index', { ascending: true })

    if (error) {
      console.error('Error fetching slides:', error)
      return serverErrorResponse('Failed to fetch slides')
    }

    return successResponse(slides)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    console.error('Error in GET /api/projects/[projectId]/slides:', error)
    return serverErrorResponse()
  }
}
