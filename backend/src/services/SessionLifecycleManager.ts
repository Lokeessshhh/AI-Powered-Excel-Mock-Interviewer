import { Session, Question, EvaluationResult, SessionStatus } from '@shared/types'
import { llmAdapter } from './llmAdapter'

interface SessionState extends Session {
  attempts: Record<string, number> // questionId -> attempts count
  remedialQuestions: Set<string>
}

interface EventCallbacks {
  onQuestionPassed?: (sessionId: string, questionId: string) => void
  onFollowUpNeeded?: (sessionId: string, questionId: string, followUps: string[]) => void
  onRemedialNeeded?: (sessionId: string, questionId: string, followUps: string[]) => void
  onSessionCompleted?: (sessionId: string) => void
}

export class SessionLifecycleManager {
  private sessions = new Map<string, SessionState>()
  private eventCallbacks: EventCallbacks = {}

  constructor(eventCallbacks?: EventCallbacks) {
    if (eventCallbacks) {
      this.eventCallbacks = eventCallbacks
    }
  }

  /**
   * Set event callbacks for handling session events
   */
  setEventCallbacks(callbacks: EventCallbacks) {
    this.eventCallbacks = { ...this.eventCallbacks, ...callbacks }
  }

  /**
   * Initialize a new session with AI-generated questions
   */
  async initSession(
    userId: string, 
    difficulty?: 'beginner' | 'intermediate' | 'advanced',
    questionCount: number = 10
  ): Promise<Session> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Generate questions using AI
    const sessionQuestions = await llmAdapter.generateQuestions(
      questionCount,
      difficulty || 'beginner'
    )

    if (sessionQuestions.length === 0) {
      throw new Error('Failed to generate questions for session')
    }

    const session: SessionState = {
      id: sessionId,
      userId,
      questions: sessionQuestions,
      currentQuestionIndex: 0,
      answers: [],
      evaluation: null,
      status: 'in_progress' as SessionStatus,
      startedAt: new Date(),
      attempts: {},
      remedialQuestions: new Set()
    }

    this.sessions.set(sessionId, session)
    return session
  }

  /**
   * Get the current question for a session
   */
  getCurrentQuestion(sessionId: string): Question | null {
    const session = this.sessions.get(sessionId)
    if (!session || session.status !== 'in_progress') return null
    return session.questions[session.currentQuestionIndex] || null
  }

  /**
   * Submit an answer for the current question and get evaluation
   */
  async submitAnswer(
    sessionId: string, 
    answerText: string
  ): Promise<{ session: Session; evaluation: EvaluationResult } | null> {
    const session = this.sessions.get(sessionId)
    if (!session || session.status !== 'in_progress') return null

    const currentQuestion = session.questions[session.currentQuestionIndex]
    if (!currentQuestion) return null

    // Track attempts
    const attempts = session.attempts[currentQuestion.id] || 0
    if (attempts >= 3) {
      // Max attempts reached, move on
      this.moveToNextQuestion(session)
      return { session, evaluation: { score: 0, pass: false, feedback: 'Max attempts reached', followUps: [] } }
    }
    session.attempts[currentQuestion.id] = attempts + 1

    // Record answer
    session.answers.push({
      questionId: currentQuestion.id,
      text: answerText,
      submittedAt: new Date(),
      attempt: attempts + 1
    })

    // Evaluate answer using LLM
    const evaluation = await llmAdapter.evaluateAnswer(
      currentQuestion,
      currentQuestion.expectedAnswer,
      answerText
    )

    // Apply agentic rules
    if (evaluation.score >= 70) {
      this.eventCallbacks.onQuestionPassed?.(sessionId, currentQuestion.id)
      this.moveToNextQuestion(session)
    } else if (evaluation.score >= 50 && evaluation.score < 70) {
      this.eventCallbacks.onFollowUpNeeded?.(sessionId, currentQuestion.id, evaluation.followUps?.slice(0, 2) || [])
      // Allow up to 2 follow-ups, attempts limit applies
    } else {
      this.eventCallbacks.onRemedialNeeded?.(sessionId, currentQuestion.id, evaluation.followUps?.slice(0, 2) || [])
      session.remedialQuestions.add(currentQuestion.id)
      // Allow up to 3 attempts total
    }

    return { session, evaluation }
  }

  /**
   * Move to the next question in the session
   */
  private moveToNextQuestion(session: SessionState) {
    if (session.currentQuestionIndex < session.questions.length - 1) {
      session.currentQuestionIndex += 1
    } else {
      session.status = 'completed'
      session.completedAt = new Date()
      session.overallScore = this.calculateOverallScore(session)
      this.eventCallbacks.onSessionCompleted?.(session.id)
    }
  }

  /**
   * Calculate overall session score
   */
  private calculateOverallScore(session: SessionState): number {
    if (session.answers.length === 0) return 0
    
    // Simple scoring based on completion and attempt efficiency
    const completionRate = (session.currentQuestionIndex + 1) / session.questions.length
    const averageAttempts = Object.values(session.attempts).reduce((sum, attempts) => sum + attempts, 0) / Math.max(Object.keys(session.attempts).length, 1)
    const attemptEfficiency = Math.max(0, (4 - averageAttempts) / 3) // Better score for fewer attempts
    
    return Math.round((completionRate * 70) + (attemptEfficiency * 30))
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): Session | null {
    return this.sessions.get(sessionId) || null
  }

  /**
   * Get a report for the session
   */
  getReport(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    // Ensure we have calculated the final score
    if (session.status === 'completed' && !session.overallScore) {
      session.overallScore = this.calculateOverallScore(session)
    }

    return session
  }

  /**
   * Force move to next question (for testing or admin purposes)
   */
  forceNextQuestion(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    this.moveToNextQuestion(session)
    return session
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string) {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    const totalAttempts = Object.values(session.attempts).reduce((sum, attempts) => sum + attempts, 0)
    const questionsAttempted = Object.keys(session.attempts).length
    const remedialCount = session.remedialQuestions.size

    return {
      sessionId,
      questionsAttempted,
      totalQuestions: session.questions.length,
      totalAttempts,
      averageAttempts: questionsAttempted > 0 ? totalAttempts / questionsAttempted : 0,
      remedialQuestionsCount: remedialCount,
      completionRate: (session.currentQuestionIndex + 1) / session.questions.length,
      status: session.status,
      overallScore: session.overallScore
    }
  }
}