'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import SlideEditor from '@/components/slides/SlideEditor'

interface Slide {
  id: string
  project_id: string
  slide_index: number
  title: string | null
  original_text: string | null
  generated_script: string | null
  edited_script: string | null
  char_count: number
  estimated_seconds: number
  tts_voice_override: string | null
  tts_speed_override: number | null
  audio_file_path: string | null
  slide_image_path: string | null
  status: string
}

export default function SlidesPage() {
  const params = useParams()
  const projectId = params.projectId as string

  const [slides, setSlides] = useState<Slide[]>([])
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchSlides = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/slides`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'スライドの取得に失敗しました')
      }

      const slidesData = result.data || []
      setSlides(slidesData)

      // 初回は最初のスライドを選択
      if (slidesData.length > 0 && !selectedSlideId) {
        setSelectedSlideId(slidesData[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSlides()
  }, [projectId])

  const handleSlideUpdate = (updatedSlide: Slide) => {
    setSlides(prevSlides =>
      prevSlides.map(slide =>
        slide.id === updatedSlide.id ? updatedSlide : slide
      )
    )
  }

  const selectedSlide = slides.find(s => s.id === selectedSlideId)

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 sm:px-0">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
        <div className="mt-4">
          <Link href={`/projects/${projectId}`} className="text-indigo-600 hover:text-indigo-900">
            ← プロジェクト詳細に戻る
          </Link>
        </div>
      </div>
    )
  }

  if (slides.length === 0) {
    return (
      <div className="px-4 sm:px-0">
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">スライドがありません</h3>
          <p className="mt-1 text-sm text-gray-500">PPTXファイルをアップロードしてください</p>
          <div className="mt-6">
            <Link
              href={`/projects/${projectId}/upload`}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              PPTXアップロード
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Link href={`/projects/${projectId}`} className="text-sm text-indigo-600 hover:text-indigo-900">
              ← プロジェクト詳細に戻る
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">スライド編集</h1>
          </div>
          <div className="text-sm text-gray-500">
            {slides.length}スライド
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex overflow-hidden">
        {/* スライド一覧（左サイドバー） */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setSelectedSlideId(slide.id)}
                className={`w-full text-left p-3 mb-2 rounded-lg transition-colors ${
                  selectedSlideId === slide.id
                    ? 'bg-indigo-100 border-2 border-indigo-500'
                    : 'bg-white border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-200 rounded text-xs font-medium text-gray-700">
                    {index + 1}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {slide.title || `スライド ${index + 1}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {slide.char_count}文字 · {slide.estimated_seconds}秒
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* スライド編集エリア */}
        <div className="flex-1 overflow-y-auto bg-white">
          {selectedSlide && (
            <SlideEditor
              slide={selectedSlide}
              projectId={projectId}
              onUpdate={handleSlideUpdate}
            />
          )}
        </div>
      </div>
    </div>
  )
}
