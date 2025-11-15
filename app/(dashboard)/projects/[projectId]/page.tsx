'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import EditProjectModal from '@/components/projects/EditProjectModal'
import DeleteProjectDialog from '@/components/projects/DeleteProjectDialog'

interface Project {
  id: string
  title: string
  description: string | null
  status: string
  pptx_file_path: string | null
  slide_count: number
  total_estimated_seconds: number
  created_at: string
  updated_at: string
}

interface Job {
  id: string
  job_type: string
  status: string
  progress: number
  error_message: string | null
  created_at: string
  finished_at: string | null
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [project, setProject] = useState<Project | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const fetchProjectData = async () => {
    try {
      setLoading(true)

      // プロジェクト情報取得
      const projectRes = await fetch(`/api/projects/${projectId}`)
      const projectResult = await projectRes.json()

      if (!projectRes.ok) {
        throw new Error(projectResult.error?.message || 'プロジェクトの取得に失敗しました')
      }

      setProject(projectResult.data)

      // ジョブ一覧取得
      const jobsRes = await fetch(`/api/projects/${projectId}/jobs`)
      const jobsResult = await jobsRes.json()

      if (jobsRes.ok) {
        setJobs(jobsResult.data || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjectData()
  }, [projectId])

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: '下書き',
      editing: '編集中',
      audio_generating: '音声生成中',
      video_generating: '動画生成中',
      completed: '完了',
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      editing: 'bg-blue-100 text-blue-800',
      audio_generating: 'bg-yellow-100 text-yellow-800',
      video_generating: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800'
  }

  const getJobTypeLabel = (jobType: string) => {
    const typeMap: Record<string, string> = {
      pptx_parse: 'PPTX解析',
      tts_generation: '音声生成',
      video_generation: '動画生成',
    }
    return typeMap[jobType] || jobType
  }

  const getJobStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待機中',
      running: '実行中',
      success: '完了',
      failed: '失敗',
    }
    return statusMap[status] || status
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="px-4 sm:px-0">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error || 'プロジェクトが見つかりません'}</p>
        </div>
        <div className="mt-4">
          <Link href="/projects" className="text-indigo-600 hover:text-indigo-900">
            ← プロジェクト一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-0">
      {/* ヘッダー */}
      <div className="mb-6">
        <Link href="/projects" className="text-sm text-indigo-600 hover:text-indigo-900 mb-2 inline-block">
          ← プロジェクト一覧に戻る
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
            {project.description && (
              <p className="mt-2 text-gray-600">{project.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-3 ml-4">
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(project.status)}`}>
              {getStatusLabel(project.status)}
            </span>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              編集
            </button>
            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              削除
            </button>
          </div>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">スライド数</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{project.slide_count}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">推定時間</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {formatDuration(project.total_estimated_seconds)}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">作成日</dt>
            <dd className="mt-1 text-xl font-semibold text-gray-900">
              {new Date(project.created_at).toLocaleDateString('ja-JP')}
            </dd>
          </div>
        </div>
      </div>

      {/* アクションセクション */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">アクション</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* PPTXアップロード */}
          <button
            onClick={() => router.push(`/projects/${projectId}/upload`)}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            📄 PPTXアップロード
          </button>

          {/* スライド編集 */}
          <button
            onClick={() => router.push(`/projects/${projectId}/slides`)}
            disabled={project.slide_count === 0}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✏️ スライド編集
          </button>

          {/* 音声生成 */}
          <button
            onClick={() => router.push(`/projects/${projectId}/audio`)}
            disabled={project.slide_count === 0}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🎤 音声生成
          </button>

          {/* 動画生成 */}
          <button
            onClick={() => router.push(`/projects/${projectId}/video`)}
            disabled={project.slide_count === 0}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🎬 動画生成
          </button>
        </div>
      </div>

      {/* ジョブ履歴 */}
      {jobs.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">処理履歴</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">処理内容</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">ステータス</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">進捗</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">開始時刻</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {getJobTypeLabel(job.job_type)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        job.status === 'success' ? 'bg-green-100 text-green-800' :
                        job.status === 'failed' ? 'bg-red-100 text-red-800' :
                        job.status === 'running' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getJobStatusLabel(job.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {job.progress}%
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {new Date(job.created_at).toLocaleString('ja-JP')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 編集モーダル */}
      <EditProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchProjectData}
        project={project}
      />

      {/* 削除確認ダイアログ */}
      <DeleteProjectDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onSuccess={() => router.push('/projects')}
        project={project}
      />
    </div>
  )
}
