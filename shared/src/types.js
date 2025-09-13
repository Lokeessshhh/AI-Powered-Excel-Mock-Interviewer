export interface Question {
  id: string
  text: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  expectedAnswer: string
  keywords: string[]
  hints?: string[]
}

export interface Answer {
  questionId: string
  text: string
  submittedAt: Date
  attempt: number
}

export interface EvaluationResult {
  correct: boolean
  score: number // 0-100
  feedback: string
  followUps?: string[]
  keywordMatches: string[]
  missingConcepts: string[]
}

export interface Session {
  id: string
  userId: string
  questions: Question[]
  currentQuestionIndex: number
  answers: Answer[]
  evaluations: EvaluationResult[]
  status: 'active' | 'completed' | 'abandoned'
  createdAt: Date
  completedAt?: Date
  overallScore?: number
}

export interface SessionAttempt {
  questionId: string
  answers: Answer[]
  evaluations: EvaluationResult[]
  completed: boolean
  bestScore: number
}