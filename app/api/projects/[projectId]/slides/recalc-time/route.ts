import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/api/auth'

type Params = {
  params: Promise<{
    projectId: string
  }>
}

// POST /api/projects/[projectId]/slides/recalc-time - 全スライドの推定時間を再計算
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const { projectId } = await params

    // 全スライドを取得
    const { data: slides, error: fetchError } = await supabase
      .from('slides')
      .select('*')
      .eq('project_id', projectId)

    if (fetchError) {
      console.error('Error fetching slides:', fetchError)
      return serverErrorResponse('Failed to fetch slides')
    }

    // 各スライドの推定時間を再計算
    const updates = slides.map((slide) => {
      const script = slide.edited_script || slide.generated_script || ''
      const charCount = script.length
      const estimatedSeconds = Math.ceil(charCount / 6.67) // 約400文字/分

      return supabase
        .from('slides')
        .update({
          char_count: charCount,
          estimated_seconds: estimatedSeconds,
        })
        .eq('id', slide.id)
    })

    await Promise.all(updates)

    return successResponse({ message: 'Recalculated successfully', count: slides.length })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    console.error('Error in POST /api/projects/[projectId]/slides/recalc-time:', error)
    return serverErrorResponse()
  }
}
