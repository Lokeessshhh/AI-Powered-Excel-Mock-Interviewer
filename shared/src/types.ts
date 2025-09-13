// Core domain types for the AI Excel Mock Interviewer

export type QuestionDifficulty = 'beginner' | 'intermediate' | 'advanced'
export type QuestionCategory = 'basics' | 'formulas' | 'analysis' | 'visualization' | 'macros'
export type SessionStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned'

export interface Question {
  id: string
  text: string
  category: QuestionCategory
  difficulty: QuestionDifficulty
  expectedAnswer: string
  hints?: string[]
  timeLimit?: number // in seconds
}

export interface Answer {
  questionId: string
  text: string
  submittedAt: Date
  timeSpent: number // in seconds
}

export interface QuestionScore {
  questionId: string
  score: number // 0-100
  feedback: string
  strengths: string[]
  improvements: string[]
}

export interface Evaluation {
  sessionId: string
  overallScore: number // 0-100
  questionScores: QuestionScore[]
  completedAt: Date
  feedback: string
  recommendations?: string[]
}

export interface Session {
  id: string
  userId: string
  questions: Question[]
  currentQuestionIndex: number
  status: SessionStatus
  startedAt: Date
  completedAt?: Date
  answers: Answer[]
  evaluation: Evaluation | null
  settings?: SessionSettings
}

export interface SessionSettings {
  difficulty: QuestionDifficulty
  categories: QuestionCategory[]
  questionCount: number
  timeLimit?: number // total time limit in seconds
}

export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
  sessions: string[] // session IDs
}

// API Request/Response types
export interface CreateSessionRequest {
  userId: string
  settings?: Partial<SessionSettings>
}

export interface CreateSessionResponse {
  session: Session
}

export interface SubmitAnswerRequest {
  sessionId: string
  questionId: string
  answer: string
  timeSpent: number
}

export interface SubmitAnswerResponse {
  success: boolean
  nextQuestion?: Question
  isComplete: boolean
}

export interface GetEvaluationRequest {
  sessionId: string
}

export interface GetEvaluationResponse {
  evaluation: Evaluation
}

// Error types
export interface APIError {
  error: string
  message: string
  code?: string
  details?: unknown
}

// Utility types
export type SessionSummary = Pick<Session, 'id' | 'status' | 'startedAt' | 'completedAt'> & {
  questionCount: number
  overallScore?: number
}

export type QuestionSummary = Pick<Question, 'id' | 'text' | 'category' | 'difficulty'>