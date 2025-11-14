import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, unauthorizedResponse, serverErrorResponse, errorResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/api/auth'

// GET /api/projects - プロジェクト一覧取得
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      return serverErrorResponse('Failed to fetch projects')
    }

    return successResponse(projects)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    console.error('Error in GET /api/projects:', error)
    return serverErrorResponse()
  }
}

// POST /api/projects - 新規プロジェクト作成
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const body = await request.json()
    const { title, description } = body

    if (!title) {
      return errorResponse('VALIDATION_ERROR', 'Title is required', 400)
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        owner_id: user.id,
        title,
        description: description || null,
        status: 'draft',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      return serverErrorResponse('Failed to create project')
    }

    return successResponse(project, 201)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    console.error('Error in POST /api/projects:', error)
    return serverErrorResponse()
  }
}
