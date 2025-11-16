import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database.types'

export function createClient() {
  // 開発環境でSupabaseが未設定の場合のダミー値
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  // プレースホルダー値の場合は警告
  if (supabaseUrl === 'your-project-url.supabase.co' || supabaseUrl === 'https://placeholder.supabase.co') {
    console.warn('Supabase is not configured. Using placeholder values for development.')
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
