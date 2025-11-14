import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/api/auth'

// GET /api/admin/users - ユーザー一覧取得
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

    // Get all users with project counts
    const { data: users, error } = await supabase
      .from('profiles')
      .select(`
        *,
        projects:projects(count)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return serverErrorResponse('Failed to fetch users')
    }

    return successResponse(users)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    console.error('Error in GET /api/admin/users:', error)
    return serverErrorResponse()
  }
}
