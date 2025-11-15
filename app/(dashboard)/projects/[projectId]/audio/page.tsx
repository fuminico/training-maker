'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import JobMonitor from '@/components/jobs/JobMonitor'

interface AudioSettings {
  default_voice: string | null
  default_speed: number
  default_pause_ms: number
}

export default function AudioGenerationPage() {
  const params = useParams()
  const projectId = params.projectId as string

  const [settings, setSettings] = useState<AudioSettings | null>(null)
  const [voice, setVoice] = useState('female_bright')
  const [speed, setSpeed] = useState(1.0)
  const [pauseMs, setPauseMs] = useState(500)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [projectId])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/audio-settings`)
      const result = await response.json()

      if (response.ok && result.data) {
        const settingsData = result.data
        setSettings(settingsData)
        setVoice(settingsData.default_voice || 'female_bright')
        setSpeed(settingsData.default_speed || 1.0)
        setPauseMs(settingsData.default_pause_ms || 500)
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/audio-settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          default_voice: voice,
          default_speed: speed,
          default_pause_ms: pauseMs,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || '設定の保存に失敗しました')
      }

      alert('設定を保存しました')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    }
  }

  const handleGenerateAudio = async () => {
    try {
      setGenerating(true)
      setError('')
      setSuccess(false)

      const response = await fetch(`/api/projects/${projectId}/audio/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slideIds: [], // 空配列で全スライドを対象
          regenerate: false,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || '音声生成の開始に失敗しました')
      }

      setJobId(result.data.jobId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
      setGenerating(false)
    }
  }

  const handleJobComplete = () => {
    setGenerating(false)
    setSuccess(true)
    setJobId(null)
  }

  const handleJobError = (errorMessage: string) => {
    setGenerating(false)
    setError(errorMessage)
    setJobId(null)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-0 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href={`/projects/${projectId}`} className="text-sm text-indigo-600 hover:text-indigo-900 mb-2 inline-block">
          ← プロジェクト詳細に戻る
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">音声生成</h1>
        <p className="mt-2 text-gray-600">全スライドの音声を一括生成します</p>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">
            ✅ 音声生成が完了しました！
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

      {/* 音声設定 */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">デフォルト音声設定</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="voice" className="block text-sm font-medium text-gray-700 mb-2">
              音声の種類
            </label>
            <select
              id="voice"
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="female_bright">女性（明るい）</option>
              <option value="female_calm">女性（落ち着き）</option>
              <option value="male_energetic">男性（元気）</option>
              <option value="male_professional">男性（プロフェッショナル）</option>
            </select>
          </div>

          <div>
            <label htmlFor="speed" className="block text-sm font-medium text-gray-700 mb-2">
              話速: {speed}倍速
            </label>
            <input
              type="range"
              id="speed"
              min="0.8"
              max="1.2"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="block w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.8（ゆっくり）</span>
              <span>1.0（標準）</span>
              <span>1.2（速め）</span>
            </div>
          </div>

          <div>
            <label htmlFor="pause" className="block text-sm font-medium text-gray-700 mb-2">
              スライド間のポーズ: {pauseMs}ms
            </label>
            <input
              type="range"
              id="pause"
              min="0"
              max="2000"
              step="100"
              value={pauseMs}
              onChange={(e) => setPauseMs(Number(e.target.value))}
              className="block w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0ms</span>
              <span>1000ms</span>
              <span>2000ms</span>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleSaveSettings}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              設定を保存
            </button>
          </div>
        </div>
      </div>

      {/* 音声生成ボタン */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">音声生成</h2>
        <p className="text-sm text-gray-600 mb-4">
          全スライドの原稿から音声ファイルを生成します。この処理には数分かかる場合があります。
        </p>

        <button
          onClick={handleGenerateAudio}
          disabled={generating}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? '生成中...' : '🎤 音声生成を開始'}
        </button>
      </div>
    </div>
  )
}
