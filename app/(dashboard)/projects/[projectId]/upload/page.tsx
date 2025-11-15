'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function UploadPPTXPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (validateFile(droppedFile)) {
        setFile(droppedFile)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (validateFile(selectedFile)) {
        setFile(selectedFile)
      }
    }
  }

  const validateFile = (file: File): boolean => {
    const validExtensions = ['.pptx', '.ppt']
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    if (!validExtensions.includes(fileExtension)) {
      setError('PowerPointファイル（.pptx または .ppt）を選択してください')
      return false
    }

    // ファイルサイズチェック（50MB制限）
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      setError('ファイルサイズは50MB以下にしてください')
      return false
    }

    setError('')
    return true
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setUploading(true)
      setError('')

      // 1. 署名付きURLを取得
      const urlResponse = await fetch(`/api/projects/${projectId}/pptx/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
        }),
      })

      const urlResult = await urlResponse.json()

      if (!urlResponse.ok) {
        throw new Error(urlResult.error?.message || 'アップロードURLの取得に失敗しました')
      }

      const { uploadUrl, objectPath } = urlResult.data

      // 2. ファイルをSupabase Storageにアップロード
      setUploadProgress(10)
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        },
        body: file,
      })

      if (!uploadResponse.ok) {
        throw new Error('ファイルのアップロードに失敗しました')
      }

      setUploadProgress(50)

      // 3. プロジェクトのpptx_file_pathを更新
      const updateResponse = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pptx_file_path: objectPath,
        }),
      })

      if (!updateResponse.ok) {
        throw new Error('プロジェクトの更新に失敗しました')
      }

      setUploadProgress(70)

      // 4. PPTX解析ジョブを起動
      setParsing(true)
      const parseResponse = await fetch(`/api/projects/${projectId}/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reparse: false,
        }),
      })

      if (!parseResponse.ok) {
        throw new Error('PPTX解析の起動に失敗しました')
      }

      setUploadProgress(100)
      setSuccess(true)

      // 3秒後にプロジェクト詳細ページにリダイレクト
      setTimeout(() => {
        router.push(`/projects/${projectId}`)
      }, 3000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="px-4 sm:px-0 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href={`/projects/${projectId}`} className="text-sm text-indigo-600 hover:text-indigo-900 mb-2 inline-block">
          ← プロジェクト詳細に戻る
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">PPTXアップロード</h1>
        <p className="mt-2 text-gray-600">PowerPointファイルをアップロードして、研修動画の作成を開始します</p>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">
            ✅ アップロード完了！PPTX解析を開始しました。プロジェクト詳細ページにリダイレクトします...
          </p>
        </div>
      )}

      {/* ドラッグ&ドロップエリア */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center ${
            dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pptx,.ppt"
            onChange={handleFileChange}
            className="hidden"
          />

          {!file ? (
            <div>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="mt-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  ファイルを選択
                </button>
                <p className="text-gray-500 mt-1">またはここにドラッグ&ドロップ</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">PPTX, PPT (最大50MB)</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-center">
                <svg
                  className="h-12 w-12 text-indigo-600"
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
              </div>
              <p className="mt-2 text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500 mt-1">{formatFileSize(file.size)}</p>
              <button
                onClick={() => setFile(null)}
                className="mt-2 text-sm text-red-600 hover:text-red-500"
              >
                削除
              </button>
            </div>
          )}
        </div>
      </div>

      {/* アップロード進捗 */}
      {uploading && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="mb-2 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              {parsing ? 'PPTX解析中...' : 'アップロード中...'}
            </span>
            <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* アップロードボタン */}
      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!file || uploading || success}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'アップロード中...' : 'アップロード開始'}
        </button>
      </div>
    </div>
  )
}
