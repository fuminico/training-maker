import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
  notFoundResponse,
} from '@/lib/api/response'
import { requireAuth } from '@/lib/api/auth'

type Params = {
  params: Promise<{
    projectId: string
  }>
}

// GET /api/projects/[projectId]/video/download-url - 動画ダウンロード用署名付きURL取得
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const { projectId } = await params

    // 最新の動画を取得
    const { data: mediaFiles, error } = await supabase
      .from('media_files')
      .select('*')
      .eq('project_id', projectId)
      .eq('file_type', 'video')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error || !mediaFiles || mediaFiles.length === 0) {
      return notFoundResponse('Video not found')
    }

    const video = mediaFiles[0]

    // 署名付きURLを生成（ダウンロード用、有効期限: 1時間）
    const { data: signedUrlData, error: urlError } = await supabase
      .storage
      .from('training-files')
      .createSignedUrl(video.path, 3600)

    if (urlError || !signedUrlData) {
      console.error('Error creating signed URL:', urlError)
      return serverErrorResponse('Failed to create download URL')
    }

    return successResponse({
      downloadUrl: signedUrlData.signedUrl,
      fileName: `training_video_${projectId}.mp4`,
      size: video.size_bytes,
      duration: video.duration_sec,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    console.error('Error in GET /api/projects/[projectId]/video/download-url:', error)
    return serverErrorResponse()
  }
}
