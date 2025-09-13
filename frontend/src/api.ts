// API wrapper for backend communication

interface CreateSessionResponse {
  sessionId: string
}

interface SubmitAnswerResponse {
  isCorrect: boolean
  followUp?: string
}

interface TranscribeResponse {
  text: string
}

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'APIError'
  }
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function fetchJSON<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new APIError(response.status, `API Error: ${response.statusText}`)
  }

  return response.json()
}

export const api = {
  async createSession(): Promise<CreateSessionResponse> {
    // Mock implementation for PoC
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { sessionId: `session-${Date.now()}` }
    
    // Real implementation would be:
    // return fetchJSON<CreateSessionResponse>('/api/sessions', {
    //   method: 'POST',
    //   body: JSON.stringify({ userId: 'user-1' }),
    // })
  },

  async submitAnswer(sessionId: string, questionId: string, answer: string): Promise<SubmitAnswerResponse> {
    // Mock implementation with realistic behavior
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const isCorrect = Math.random() > 0.3 // 70% chance of being correct
    const followUp = !isCorrect && Math.random() > 0.5 
      ? 'Can you provide more detail about this concept?' 
      : undefined
    
    return { isCorrect, followUp }
    
    // Real implementation would be:
    // return fetchJSON<SubmitAnswerResponse>(`/api/session/${sessionId}/answer`, {
    //   method: 'POST',
    //   body: JSON.stringify({ questionId, answer }),
    // })
  },

  async transcribeAudio(audioBlob: Blob): Promise<TranscribeResponse> {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 2000))
    return { text: 'This is transcribed audio text from the uploaded file.' }
    
    // Real implementation would be:
    // const formData = new FormData()
    // formData.append('audio', audioBlob)
    // 
    // const response = await fetch(`${BASE_URL}/api/transcribe`, {
    //   method: 'POST',
    //   body: formData,
    // })
    // 
    // if (!response.ok) {
    //   throw new APIError(response.status, 'Transcription failed')
    // }
    // 
    // return response.json()
  },
}

export { APIError }