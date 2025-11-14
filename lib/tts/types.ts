export interface TTSOptions {
  text: string
  voice?: string
  speed?: number
  pitch?: number
}

export interface TTSProvider {
  name: string
  generateSpeech(options: TTSOptions): Promise<Buffer>
}

export const AVAILABLE_VOICES = {
  female_bright: 'Female Bright',
  female_calm: 'Female Calm',
  male_deep: 'Male Deep',
  male_friendly: 'Male Friendly',
} as const

export type VoiceType = keyof typeof AVAILABLE_VOICES
