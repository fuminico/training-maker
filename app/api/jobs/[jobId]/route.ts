import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, unauthorizedResponse, serverErrorResponse, notFoundResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/api/auth'

type Params = {
  params: Promise<{
    jobId: string
  }>
}

// GET /api/jobs/[jobId] - ジョブ詳細取得
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const { jobId } = await params

    const { data: job, error } = await supabase
      .from('jobs')
      .select(`
        *,
        projects!inner(owner_id)
      `)
      .eq('id', jobId)
      .single()

    if (error || !job) {
      return notFoundResponse('Job not found')
    }

    return successResponse(job)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    console.error('Error in GET /api/jobs/[jobId]:', error)
    return serverErrorResponse()
  }
}
