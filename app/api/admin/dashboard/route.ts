import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/api/auth'

// GET /api/admin/dashboard - ダッシュボードサマリ取得
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

    // Get statistics
    const [usersResult, projectsResult, jobsResult] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('projects').select('id', { count: 'exact', head: true }),
      supabase.from('jobs').select('id, status', { count: 'exact' }),
    ])

    const totalUsers = usersResult.count || 0
    const totalProjects = projectsResult.count || 0
    const jobs = jobsResult.data || []
    const jobStats = {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      running: jobs.filter(j => j.status === 'running').length,
      success: jobs.filter(j => j.status === 'success').length,
      failed: jobs.filter(j => j.status === 'failed').length,
    }

    return successResponse({
      users: { total: totalUsers },
      projects: { total: totalProjects },
      jobs: jobStats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    console.error('Error in GET /api/admin/dashboard:', error)
    return serverErrorResponse()
  }
}
