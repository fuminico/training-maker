import { supabase } from '../lib/supabase'

interface TTSGenerationOptions {
  projectId: string
  slideId: string
  slideIndex: number
  text: string
  voice: string
  speed: number
}

/**
 * TTS音声生成サービス
 *
 * 注: この実装は簡略化されたモックです。
 * 実際の実装では、OpenAI TTS APIまたはGoogle Cloud TTSを使用して
 * 音声を生成し、Supabase Storageにアップロードする必要があります。
 */
export async function generateTTS(options: TTSGenerationOptions): Promise<string> {
  const { projectId, slideId, slideIndex, text, voice, speed } = options

  console.log(`Generating TTS for slide ${slideIndex}: ${text.substring(0, 50)}...`)

  // TODO: 実際のTTS APIを呼び出す
  // const audioBuffer = await callTTSAPI(text, voice, speed)

  // モック: 短い待機時間
  await new Promise(resolve => setTimeout(resolve, 500))

  // モック音声データ（実際にはTTS APIからの結果を使用）
  const mockAudioBuffer = Buffer.from('mock-audio-data')

  // Supabase Storageにアップロード
  const audioPath = `projects/${projectId}/audio/slide_${slideIndex}_${Date.now()}.mp3`

  const { error: uploadError } = await supabase
    .storage
    .from('training-files')
    .upload(audioPath, mockAudioBuffer, {
      contentType: 'audio/mpeg',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Failed to upload audio: ${uploadError.message}`)
  }

  console.log(`Audio generated and uploaded: ${audioPath}`)

  return audioPath
}
