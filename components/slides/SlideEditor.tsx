'use client'

import { useState, useEffect } from 'react'

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

interface SlideEditorProps {
  slide: Slide
  projectId: string
  onUpdate: (updatedSlide: Slide) => void
}

const VOICE_OPTIONS = [
  { value: '', label: 'デフォルト' },
  { value: 'female_bright', label: '女性（明るい）' },
  { value: 'female_calm', label: '女性（落ち着き）' },
  { value: 'male_energetic', label: '男性（元気）' },
  { value: 'male_professional', label: '男性（プロフェッショナル）' },
]

const SPEED_OPTIONS = [
  { value: 0.8, label: '0.8倍速（ゆっくり）' },
  { value: 0.9, label: '0.9倍速' },
  { value: 1.0, label: '1.0倍速（標準）' },
  { value: 1.1, label: '1.1倍速' },
  { value: 1.2, label: '1.2倍速（速め）' },
]

export default function SlideEditor({ slide, projectId, onUpdate }: SlideEditorProps) {
  const [editedScript, setEditedScript] = useState(slide.edited_script || slide.generated_script || '')
  const [voice, setVoice] = useState(slide.tts_voice_override || '')
  const [speed, setSpeed] = useState(slide.tts_speed_override || 1.0)
  const [charCount, setCharCount] = useState(slide.char_count)
  const [estimatedSeconds, setEstimatedSeconds] = useState(slide.estimated_seconds)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    setEditedScript(slide.edited_script || slide.generated_script || '')
    setVoice(slide.tts_voice_override || '')
    setSpeed(slide.tts_speed_override || 1.0)
    setCharCount(slide.char_count)
    setEstimatedSeconds(slide.estimated_seconds)
  }, [slide.id])

  useEffect(() => {
    // 文字数と推定時間をリアルタイム計算
    const count = editedScript.length
    const estimated = Math.ceil(count / 6.67) // 400文字/分 = 6.67文字/秒
    setCharCount(count)
    setEstimatedSeconds(estimated)
  }, [editedScript])

  const handleSave = async () => {
    try {
      setSaving(true)
      setSaveMessage('')

      const response = await fetch(`/api/projects/${projectId}/slides/${slide.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          edited_script: editedScript,
          tts_voice_override: voice || null,
          tts_speed_override: speed !== 1.0 ? speed : null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || '保存に失敗しました')
      }

      onUpdate(result.data)
      setSaveMessage('✅ 保存しました')

      // 2秒後にメッセージを消す
      setTimeout(() => setSaveMessage(''), 2000)
    } catch (err) {
      setSaveMessage(`❌ ${err instanceof Error ? err.message : 'エラーが発生しました'}`)
    } finally {
      setSaving(false)
    }
  }

  const isOverLimit = estimatedSeconds > 40
  const isUnderLimit = estimatedSeconds < 35

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* スライド情報 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900">
            スライド {slide.slide_index}
            {slide.title && `: ${slide.title}`}
          </h2>
          {saveMessage && (
            <span className={`text-sm ${saveMessage.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
              {saveMessage}
            </span>
          )}
        </div>

        {/* 文字数・推定時間の表示 */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <span className="text-gray-500">文字数:</span>
            <span className="ml-1 font-medium text-gray-900">{charCount}文字</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-500">推定時間:</span>
            <span className={`ml-1 font-medium ${
              isOverLimit ? 'text-red-600' :
              isUnderLimit ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {estimatedSeconds}秒
            </span>
          </div>
          {(isOverLimit || isUnderLimit) && (
            <span className="text-xs text-yellow-600">
              {isOverLimit ? '⚠️ 40秒を超えています' : '⚠️ 35秒未満です'}
            </span>
          )}
        </div>
      </div>

      {/* 元のテキスト */}
      {slide.original_text && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">元のテキスト（PPTXから抽出）</h3>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 border border-gray-200">
            {slide.original_text}
          </div>
        </div>
      )}

      {/* 原稿編集エリア */}
      <div className="mb-6">
        <label htmlFor="script" className="block text-sm font-medium text-gray-700 mb-2">
          ナレーション原稿 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="script"
          rows={10}
          value={editedScript}
          onChange={(e) => setEditedScript(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
          placeholder="ナレーション原稿を入力してください"
        />
        <p className="mt-1 text-xs text-gray-500">
          推奨: 35〜40秒（235〜267文字程度）
        </p>
      </div>

      {/* TTS設定 */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
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
            {VOICE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="speed" className="block text-sm font-medium text-gray-700 mb-2">
            話速
          </label>
          <select
            id="speed"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {SPEED_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 音声ファイル */}
      {slide.audio_file_path && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">生成済み音声</h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-green-800">音声ファイルが生成されています</span>
            </div>
          </div>
        </div>
      )}

      {/* 保存ボタン */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={handleSave}
          disabled={saving || !editedScript}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  )
}
