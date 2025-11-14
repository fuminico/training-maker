import { TTSProvider, TTSOptions } from '../types'

export class OpenAITTSProvider implements TTSProvider {
  name = 'OpenAI TTS'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateSpeech(options: TTSOptions): Promise<Buffer> {
    const { text, voice = 'alloy', speed = 1.0 } = options

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: this.mapVoice(voice),
        speed: speed,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI TTS API error: ${error}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  private mapVoice(voice: string): string {
    const voiceMap: Record<string, string> = {
      female_bright: 'nova',
      female_calm: 'shimmer',
      male_deep: 'onyx',
      male_friendly: 'echo',
    }

    return voiceMap[voice] || 'alloy'
  }
}
