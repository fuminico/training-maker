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
    userId: string
  }>
}

// PATCH /api/admin/users/[userId] - ユーザー更新（権限変更など）
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const { userId } = await params

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return unauthorizedResponse('Admin access required')
    }

    const body = await request.json()
    const { role } = body

    if (!role || !['trainer', 'admin'].includes(role)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid role', 400)
    }

    const { data: updatedUser, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single()

    if (error || !updatedUser) {
      return notFoundResponse('User not found or update failed')
    }

    return successResponse(updatedUser)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    console.error('Error in PATCH /api/admin/users/[userId]:', error)
    return serverErrorResponse()
  }
}
