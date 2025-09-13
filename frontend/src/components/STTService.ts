// Speech-to-Text service with abstraction for easy replacement

export interface STTProvider {
  startListening(): Promise<void>
  stopListening(): void
  isListening(): boolean
  isSupported(): boolean
  onResult(callback: (text: string, isFinal: boolean) => void): void
  onError(callback: (error: string) => void): void
}

class BrowserSTTProvider implements STTProvider {
  private recognition: any = null
  private listening = false
  private resultCallback: ((text: string, isFinal: boolean) => void) | null = null
  private errorCallback: ((error: string) => void) | null = null

  constructor() {
    this.initializeRecognition()
  }

  private initializeRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      this.recognition = new SpeechRecognition()
      
      this.recognition.continuous = true
      this.recognition.interimResults = true
      this.recognition.lang = 'en-US'
      this.recognition.maxAlternatives = 1

      this.recognition.onstart = () => {
        this.listening = true
      }

      this.recognition.onresult = (event: any) => {
        if (!this.resultCallback) return

        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          this.resultCallback(finalTranscript, true)
        } else if (interimTranscript) {
          this.resultCallback(interimTranscript, false)
        }
      }

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        if (this.errorCallback) {
          this.errorCallback(`Speech recognition error: ${event.error}`)
        }
        this.listening = false
      }

      this.recognition.onend = () => {
        this.listening = false
      }
    }
  }

  async startListening(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Speech recognition not supported')
    }

    if (this.listening) {
      this.stopListening()
    }

    try {
      this.recognition.start()
    } catch (error) {
      throw new Error(`Failed to start speech recognition: ${error}`)
    }
  }

  stopListening(): void {
    if (this.recognition && this.listening) {
      this.recognition.stop()
    }
  }

  isListening(): boolean {
    return this.listening
  }

  isSupported(): boolean {
    return !!this.recognition
  }

  onResult(callback: (text: string, isFinal: boolean) => void): void {
    this.resultCallback = callback
  }

  onError(callback: (error: string) => void): void {
    this.errorCallback = callback
  }
}

// Mock STT for testing
class MockSTTProvider implements STTProvider {
  private listening = false
  private resultCallback: ((text: string, isFinal: boolean) => void) | null = null
  private errorCallback: ((error: string) => void) | null = null

  async startListening(): Promise<void> {
    this.listening = true
    console.log('[Mock STT] Started listening')
    
    // Simulate speech recognition after a delay
    setTimeout(() => {
      if (this.listening && this.resultCallback) {
        this.resultCallback('This is mock speech recognition text', true)
        this.listening = false
      }
    }, 3000)
  }

  stopListening(): void {
    this.listening = false
    console.log('[Mock STT] Stopped listening')
  }

  isListening(): boolean {
    return this.listening
  }

  isSupported(): boolean {
    return true
  }

  onResult(callback: (text: string, isFinal: boolean) => void): void {
    this.resultCallback = callback
  }

  onError(callback: (error: string) => void): void {
    this.errorCallback = callback
  }
}

// STT Service class that manages the provider
export class STTService {
  private provider: STTProvider
  private resultHandlers: Set<(text: string, isFinal: boolean) => void> = new Set()
  private errorHandlers: Set<(error: string) => void> = new Set()

  constructor(provider?: STTProvider) {
    this.provider = provider || new BrowserSTTProvider()
    this.setupProviderCallbacks()
  }

  private setupProviderCallbacks() {
    this.provider.onResult((text, isFinal) => {
      this.resultHandlers.forEach(handler => handler(text, isFinal))
    })

    this.provider.onError((error) => {
      this.errorHandlers.forEach(handler => handler(error))
    })
  }

  async startListening(): Promise<void> {
    try {
      await this.provider.startListening()
    } catch (error) {
      console.error('STT Error:', error)
      // Fallback to mock provider if browser STT fails
      if (!(this.provider instanceof MockSTTProvider)) {
        console.log('Falling back to mock STT')
        this.provider = new MockSTTProvider()
        this.setupProviderCallbacks()
        await this.provider.startListening()
      }
      throw error
    }
  }

  stopListening(): void {
    this.provider.stopListening()
  }

  isListening(): boolean {
    return this.provider.isListening()
  }

  isSupported(): boolean {
    return this.provider.isSupported()
  }

  // Event handlers
  onResult(callback: (text: string, isFinal: boolean) => void): () => void {
    this.resultHandlers.add(callback)
    return () => this.resultHandlers.delete(callback)
  }

  onError(callback: (error: string) => void): () => void {
    this.errorHandlers.add(callback)
    return () => this.errorHandlers.delete(callback)
  }

  // Replace provider (useful for testing or switching to API-based STT)
  setProvider(provider: STTProvider): void {
    this.stopListening()
    this.provider = provider
    this.setupProviderCallbacks()
  }
}

// Export singleton instance
export const sttService = new STTService()

// Export provider classes for custom implementations
export { BrowserSTTProvider, MockSTTProvider }