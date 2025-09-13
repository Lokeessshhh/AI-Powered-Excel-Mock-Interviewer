// Text-to-Speech service with abstraction for easy replacement

export interface TTSProvider {
  speak(text: string): Promise<void>
  stop(): void
  isSupported(): boolean
  setVoice?(voiceIndex: number): void
  setRate?(rate: number): void
  setPitch?(pitch: number): void
}

class BrowserTTSProvider implements TTSProvider {
  private synth: SpeechSynthesis
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private voices: SpeechSynthesisVoice[] = []
  private rate = 0.8
  private pitch = 1
  private selectedVoiceIndex = 0

  constructor() {
    this.synth = window.speechSynthesis
    this.loadVoices()
  }

  private loadVoices() {
    this.voices = this.synth.getVoices()
    if (this.voices.length === 0) {
      // Chrome loads voices asynchronously
      this.synth.onvoiceschanged = () => {
        this.voices = this.synth.getVoices()
      }
    }
  }

  async speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('Speech synthesis not supported'))
        return
      }

      this.stop() // Stop any ongoing speech

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = this.rate
      utterance.pitch = this.pitch
      
      // Set voice if available
      if (this.voices.length > 0 && this.selectedVoiceIndex < this.voices.length) {
        utterance.voice = this.voices[this.selectedVoiceIndex]
      }

      utterance.onend = () => {
        this.currentUtterance = null
        resolve()
      }

      utterance.onerror = (event) => {
        this.currentUtterance = null
        reject(new Error(`Speech synthesis error: ${event.error}`))
      }

      this.currentUtterance = utterance
      this.synth.speak(utterance)
    })
  }

  stop(): void {
    if (this.synth && this.currentUtterance) {
      this.synth.cancel()
      this.currentUtterance = null
    }
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window
  }

  setVoice(voiceIndex: number): void {
    if (voiceIndex >= 0 && voiceIndex < this.voices.length) {
      this.selectedVoiceIndex = voiceIndex
    }
  }

  setRate(rate: number): void {
    this.rate = Math.max(0.1, Math.min(2, rate))
  }

  setPitch(pitch: number): void {
    this.pitch = Math.max(0, Math.min(2, pitch))
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices
  }
}

// Mock TTS for testing or when browser TTS is not available
class MockTTSProvider implements TTSProvider {
  async speak(text: string): Promise<void> {
    console.log(`[Mock TTS] Speaking: ${text}`)
    return new Promise(resolve => {
      setTimeout(resolve, text.length * 50) // Simulate speaking time
    })
  }

  stop(): void {
    console.log('[Mock TTS] Stopping speech')
  }

  isSupported(): boolean {
    return true
  }

  setRate(rate: number): void {
    console.log(`[Mock TTS] Rate set to: ${rate}`)
  }

  setPitch(pitch: number): void {
    console.log(`[Mock TTS] Pitch set to: ${pitch}`)
  }
}

// TTS Service class that manages the provider
export class TTSService {
  private provider: TTSProvider

  constructor(provider?: TTSProvider) {
    this.provider = provider || new BrowserTTSProvider()
  }

  async speak(text: string): Promise<void> {
    try {
      await this.provider.speak(text)
    } catch (error) {
      console.error('TTS Error:', error)
      // Fallback to mock provider if browser TTS fails
      if (!(this.provider instanceof MockTTSProvider)) {
        console.log('Falling back to mock TTS')
        this.provider = new MockTTSProvider()
        await this.provider.speak(text)
      }
    }
  }

  stop(): void {
    this.provider.stop()
  }

  isSupported(): boolean {
    return this.provider.isSupported()
  }

  // Configuration methods
  setVoice(voiceIndex: number): void {
    if (this.provider.setVoice) {
      this.provider.setVoice(voiceIndex)
    }
  }

  setRate(rate: number): void {
    if (this.provider.setRate) {
      this.provider.setRate(rate)
    }
  }

  setPitch(pitch: number): void {
    if (this.provider.setPitch) {
      this.provider.setPitch(pitch)
    }
  }

  // Get available voices (only for browser TTS)
  getVoices(): SpeechSynthesisVoice[] {
    if (this.provider instanceof BrowserTTSProvider) {
      return this.provider.getVoices()
    }
    return []
  }

  // Replace provider (useful for testing or switching to API-based TTS)
  setProvider(provider: TTSProvider): void {
    this.stop() // Stop current speech before switching
    this.provider = provider
  }
}

// Export singleton instance
export const ttsService = new TTSService()

// Export provider classes for custom implementations
export { BrowserTTSProvider, MockTTSProvider }