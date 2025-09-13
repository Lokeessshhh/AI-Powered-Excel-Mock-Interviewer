import { Question, Session, EvaluationResult } from '@shared/types'

export interface CreateSessionRequest {
  userId?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  questionIds?: string[]
}

export interface CreateSessionResponse {
  sessionId: string
  currentQuestion: Question
}

export interface SubmitAnswerRequest {
  text?: string
  audioFile?: Express.Multer.File
}

export interface SubmitAnswerResponse {
  correct: boolean
  feedback: string
  followUps?: string[]
  nextQuestion?: Question | null
  completed: boolean
}

export interface TranscribeRequest {
  audio: Express.Multer.File
}

export interface TranscribeResponse {
  text: string
}

export interface SessionReportResponse {
  sessionId: string
  overallScore: number
  questionsAnswered: number
  totalQuestions: number
  questionScores: Array<{
    questionId: string
    question: string
    answer: string
    score: number
    feedback: string
  }>
  completedAt: Date
  duration: number // in seconds
}