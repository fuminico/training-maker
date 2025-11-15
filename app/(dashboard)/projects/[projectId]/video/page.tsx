'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import JobMonitor from '@/components/jobs/JobMonitor'

interface VideoInfo {
  id: string
  path: string
  duration_sec: number
  size_bytes: number
  created_at: string
}

export default function VideoGenerationPage() {
  const params = useParams()
  const projectId = params.projectId as string

  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchVideoInfo()
  }, [projectId])

  const fetchVideoInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/video`)
      const result = await response.json()

      if (response.ok && result.data) {
        setVideoInfo(result.data)
        // ダウンロードURLも取得
        await fetchDownloadUrl()
      }
    } catch (err) {
      console.error('Failed to fetch video info:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDownloadUrl = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/video/download-url`)
      const result = await response.json()

      if (response.ok && result.data) {
        setDownloadUrl(result.data.downloadUrl)
      }
    } catch (err) {
      console.error('Failed to fetch download URL:', err)
    }
  }

  const handleGenerateVideo = async () => {
    try {
      setGenerating(true)
      setError('')
      setSuccess(false)

      const response = await fetch(`/api/projects/${projectId}/video/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          regenerate: false,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || '動画生成の開始に失敗しました')
      }

      setJobId(result.data.jobId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
      setGenerating(false)
    }
  }

  const handleJobComplete = async () => {
    setGenerating(false)
    setSuccess(true)
    setJobId(null)
    // 動画情報を再取得
    await fetchVideoInfo()
  }

  const handleJobError = (errorMessage: string) => {
    setGenerating(false)
    setError(errorMessage)
    setJobId(null)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-0 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={`/projects/${projectId}`} className="text-sm text-indigo-600 hover:text-indigo-900 mb-2 inline-block">
          ← プロジェクト詳細に戻る
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">動画生成</h1>
        <p className="mt-2 text-gray-600">スライドと音声から研修動画を生成します</p>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">
            ✅ 動画生成が完了しました！
          </p>
        </div>
      )}

      {/* ジョブモニター */}
      {jobId && (
        <div className="mb-6">
          <JobMonitor
            jobId={jobId}
            onComplete={handleJobComplete}
            onError={handleJobError}
          />
        </div>
      )}

      {/* 既存の動画がある場合 */}
      {videoInfo && downloadUrl && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">完成動画</h2>

          {/* 動画情報 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">再生時間</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {formatDuration(videoInfo.duration_sec)}
              </dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">ファイルサイズ</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {formatFileSize(videoInfo.size_bytes)}
              </dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">作成日</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {new Date(videoInfo.created_at).toLocaleDateString('ja-JP')}
              </dd>
            </div>
          </div>

          {/* 動画プレビュー */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">プレビュー</h3>
            <div className="bg-black rounded-lg overflow-hidden aspect-video">
              <video
                controls
                className="w-full h-full"
                src={downloadUrl}
              >
                お使いのブラウザは動画タグをサポートしていません。
              </video>
            </div>
          </div>

          {/* ダウンロードボタン */}
          <div className="flex space-x-3">
            <a
              href={downloadUrl}
              download
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              動画をダウンロード
            </a>

            <button
              onClick={handleGenerateVideo}
              disabled={generating}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 再生成
            </button>
          </div>
        </div>
      )}

      {/* 動画がまだない場合 */}
      {!videoInfo && !generating && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">動画生成</h2>
          <p className="text-sm text-gray-600 mb-6">
            スライドと音声を結合して、研修動画を生成します。この処理には数分かかる場合があります。
          </p>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  動画生成を行う前に、全てのスライドの音声が生成されていることを確認してください。
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateVideo}
            disabled={generating}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? '生成中...' : '🎬 動画生成を開始'}
          </button>
        </div>
      )}
    </div>
  )
}
