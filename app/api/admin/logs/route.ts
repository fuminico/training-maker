import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/api/auth'

// GET /api/admin/logs - エラーログ・ジョブログ取得
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return unauthorizedResponse('Admin access required')
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Get jobs (with filters)
    let query = supabase
      .from('jobs')
      .select(`
        *,
        projects!inner(
          title,
          owner_id,
          profiles!inner(email)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: jobs, error } = await query

    if (error) {
      console.error('Error fetching logs:', error)
      return serverErrorResponse('Failed to fetch logs')
    }

    return successResponse(jobs)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    console.error('Error in GET /api/admin/logs:', error)
    return serverErrorResponse()
  }
}
