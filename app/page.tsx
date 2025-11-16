'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [isConfigured, setIsConfigured] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Supabaseが正しく設定されているかチェック
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (!supabaseUrl || supabaseUrl === 'your-project-url.supabase.co') {
          setIsConfigured(false)
          setIsChecking(false)
          return
        }

        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          router.push('/projects')
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setIsConfigured(false)
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [router])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Training Maker</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">研修動画自動生成ツール</p>
          <p className="mt-4 text-sm text-gray-500">リダイレクト中...</p>
        </div>
      </div>
    )
  }

  // Supabase未設定の場合のランディングページ
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-5xl font-bold mb-6 text-gray-900">Training Maker</h1>
        <p className="text-xl text-gray-600 mb-4">
          研修動画自動生成ツール
        </p>
        <p className="text-base text-gray-500 mb-8">
          PowerPointから研修動画を自動生成します
        </p>

        {!isConfigured && (
          <div className="mb-8 rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Supabaseの設定が必要です</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>.env.localファイルにSupabaseの認証情報を設定してください。</p>
                  <p className="mt-1">設定後、開発サーバーを再起動してください。</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <Link
            href="/projects"
            className="inline-block rounded-md bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            プロジェクト一覧
          </Link>
          <Link
            href="/login"
            className="inline-block rounded-md bg-white px-6 py-3 text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            ログイン
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">1. PPTXアップロード</h3>
            <p className="text-sm text-gray-600">PowerPointファイルをアップロードして解析</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">2. 音声生成</h3>
            <p className="text-sm text-gray-600">各スライドのノートから自動でナレーション生成</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">3. 動画出力</h3>
            <p className="text-sm text-gray-600">スライドと音声を組み合わせて動画を生成</p>
          </div>
        </div>
      </div>
    </div>
  )
}
