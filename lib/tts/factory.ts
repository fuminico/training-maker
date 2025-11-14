import { TTSProvider } from './types'
import { OpenAITTSProvider } from './providers/openai'

export function createTTSProvider(): TTSProvider {
  const provider = process.env.TTS_PROVIDER || 'openai'

  switch (provider) {
    case 'openai': {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set')
      }
      return new OpenAITTSProvider(apiKey)
    }

    // 他のプロバイダを追加可能
    // case 'google':
    //   return new GoogleTTSProvider(...)

    default:
      throw new Error(`Unknown TTS provider: ${provider}`)
  }
}
