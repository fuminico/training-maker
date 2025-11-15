'use client'

import { useEffect, useState } from 'react'

interface Job {
  id: string
  job_type: string
  status: string
  progress: number
  error_message: string | null
  created_at: string
  started_at: string | null
  finished_at: string | null
}

interface JobMonitorProps {
  jobId: string | null
  onComplete: () => void
  onError: (error: string) => void
}

export default function JobMonitor({ jobId, onComplete, onError }: JobMonitorProps) {
  const [job, setJob] = useState<Job | null>(null)
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    if (!jobId) {
      setJob(null)
      setPolling(false)
      return
    }

    setPolling(true)
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`)
        const result = await response.json()

        if (response.ok) {
          const jobData = result.data
          setJob(jobData)

          if (jobData.status === 'success') {
            setPolling(false)
            clearInterval(pollInterval)
            onComplete()
          } else if (jobData.status === 'failed') {
            setPolling(false)
            clearInterval(pollInterval)
            onError(jobData.error_message || 'ジョブが失敗しました')
          }
        }
      } catch (err) {
        console.error('Failed to poll job status:', err)
      }
    }, 2000) // 2秒ごとにポーリング

    return () => clearInterval(pollInterval)
  }, [jobId, onComplete, onError])

  if (!job) return null

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待機中',
      running: '実行中',
      success: '完了',
      failed: '失敗',
    }
    return statusMap[status] || status
  }

  const getJobTypeLabel = (jobType: string) => {
    const typeMap: Record<string, string> = {
      pptx_parse: 'PPTX解析',
      tts_generation: '音声生成',
      video_generation: '動画生成',
    }
    return typeMap[jobType] || jobType
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          {getJobTypeLabel(job.job_type)}
        </h3>
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
          job.status === 'success' ? 'bg-green-100 text-green-800' :
          job.status === 'failed' ? 'bg-red-100 text-red-800' :
          job.status === 'running' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {getStatusLabel(job.status)}
        </span>
      </div>

      {/* 進捗バー */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-700">進捗</span>
          <span className="text-sm font-medium text-gray-900">{job.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              job.status === 'success' ? 'bg-green-600' :
              job.status === 'failed' ? 'bg-red-600' :
              'bg-blue-600'
            }`}
            style={{ width: `${job.progress}%` }}
          ></div>
        </div>
      </div>

      {/* エラーメッセージ */}
      {job.error_message && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{job.error_message}</p>
        </div>
      )}

      {/* 実行中の場合、アニメーション */}
      {job.status === 'running' && (
        <div className="mt-4 flex items-center text-sm text-gray-600">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          処理中...
        </div>
      )}

      {/* 完了の場合、チェックマーク */}
      {job.status === 'success' && (
        <div className="mt-4 flex items-center text-sm text-green-600">
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          処理が完了しました
        </div>
      )}
    </div>
  )
}
