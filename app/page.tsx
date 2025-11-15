'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        // 認証済みの場合はプロジェクト一覧へリダイレクト
        router.push('/projects')
      } else {
        // 未認証の場合はログインページへリダイレクト
        router.push('/login')
      }
    }

    checkAuth()
  }, [router, supabase])

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
