// shared/types.ts
export interface Question {
  id: string
  text: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  expectedAnswer: string
  keywords: string[]
  hints: string[]
}

export interface Answer {
  questionId: string
  text: string
  submittedAt: Date
  attempt: number
  timeSpent?: number
}

export interface QuestionScore {
  questionId: string
  score: number
  feedback: string
  strengths: string[]
  improvements: string[]
}

export interface SessionEvaluation {
  sessionId: string
  overallScore: number
  questionScores: QuestionScore[]
  completedAt: Date
  feedback: string
  recommendations: string[]
}

export interface EvaluationResult {
  score: number
  pass: boolean
  feedback: string
  followUps: string[]
}

export type SessionStatus = 'in_progress' | 'completed' | 'paused' | 'expired'

export interface Session {
  id: string
  userId: string
  questions: Question[]
  currentQuestionIndex: number
  answers: Answer[]
  evaluation?: SessionEvaluation | null
  status: SessionStatus
  startedAt: Date
  completedAt?: Date
  overallScore?: number
}