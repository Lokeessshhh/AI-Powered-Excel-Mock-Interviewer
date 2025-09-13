import { Session, Question, Answer, EvaluationResult } from '@shared/types'
import { questions } from '../data/questions'

export class SessionManager {
  private sessions = new Map<string, Session>()
  
  // TODO: Replace with Redis implementation
  // private redis = new Redis({
  //   host: process.env.REDIS_HOST || 'localhost',
  //   port: parseInt(process.env.REDIS_PORT || '6379'),
  //   db: parseInt(process.env.REDIS_DB || '0')
  // })

  async createSession(
    userId: string,
    questionIds?: string[],
    difficulty?: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<Session> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    let sessionQuestions: Question[]
    if (questionIds && questionIds.length > 0) {
      sessionQuestions = questions.filter(q => questionIds.includes(q.id))
    } else if (difficulty) {
      sessionQuestions = questions.filter(q => q.difficulty === difficulty).slice(0, 10)
    } else {
      // Default: mix of difficulties
      sessionQuestions = [
        ...questions.filter(q => q.difficulty === 'beginner').slice(0, 4),
        ...questions.filter(q => q.difficulty === 'intermediate').slice(0, 4),
        ...questions.filter(q => q.difficulty === 'advanced').slice(0, 2)
      ]
    }

    const session: Session = {
      id: sessionId,
      userId,
      questions: sessionQuestions,
      currentQuestionIndex: 0,
      answers: [],
      evaluations: [],
      status: 'active',
      createdAt: new Date()
    }

    this.sessions.set(sessionId, session)
    
    // TODO: Redis implementation
    // await this.redis.setex(
    //   `session:${sessionId}`,
    //   3600, // 1 hour TTL
    //   JSON.stringify(session)
    // )

    return session
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const session = this.sessions.get(sessionId)
    if (session) {
      return session
    }

    // TODO: Redis implementation
    // const sessionData = await this.redis.get(`session:${sessionId}`)
    // if (sessionData) {
    //   const session = JSON.parse(sessionData) as Session
    //   // Restore Date objects
    //   session.createdAt = new Date(session.createdAt)
    //   if (session.completedAt) {
    //     session.completedAt = new Date(session.completedAt)
    //   }
    //   session.answers = session.answers.map(a => ({
    //     ...a,
    //     submittedAt: new Date(a.submittedAt)
    //   }))
    //   this.sessions.set(sessionId, session) // Cache locally
    //   return session
    // }

    return null
  }

  async updateSession(session: Session): Promise<void> {
    this.sessions.set(session.id, session)
    
    // TODO: Redis implementation
    // await this.redis.setex(
    //   `session:${session.id}`,
    //   3600,
    //   JSON.stringify(session)
    // )
  }

  async addAnswer(
    sessionId: string,
    questionId: string,
    answerText: string
  ): Promise<{ session: Session; answer: Answer }> {
    const session = await this.getSession(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const currentQuestion = session.questions[session.currentQuestionIndex]
    if (!currentQuestion || currentQuestion.id !== questionId) {
      throw new Error('Question mismatch')
    }

    const attempt = session.answers.filter(a => a.questionId === questionId).length + 1
    const answer: Answer = {
      questionId,
      text: answerText,
      submittedAt: new Date(),
      attempt
    }

    session.answers.push(answer)
    await this.updateSession(session)

    return { session, answer }
  }

  async addEvaluation(
    sessionId: string,
    evaluation: EvaluationResult
  ): Promise<Session> {
    const session = await this.getSession(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    session.evaluations.push(evaluation)
    await this.updateSession(session)

    return session
  }

  async moveToNextQuestion(sessionId: string): Promise<Session> {
    const session = await this.getSession(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    if (session.currentQuestionIndex < session.questions.length - 1) {
      session.currentQuestionIndex++
    } else {
      session.status = 'completed'
      session.completedAt = new Date()
      session.overallScore = this.calculateOverallScore(session)
    }

    await this.updateSession(session)
    return session
  }

  private calculateOverallScore(session: Session): number {
    if (session.evaluations.length === 0) return 0
    
    const scores = session.evaluations.map(e => e.score)
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  }

  async getSessionReport(sessionId: string) {
    const session = await this.getSession(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const questionScores = session.questions.map(question => {
      const questionAnswers = session.answers.filter(a => a.questionId === question.id)
      const questionEvals = session.evaluations.filter(e => 
        questionAnswers.some(a => a.questionId === question.id)
      )
      
      const bestEval = questionEvals.reduce((best, current) => 
        current.score > (best?.score || 0) ? current : best, questionEvals[0]
      )
      
      const lastAnswer = questionAnswers[questionAnswers.length - 1]

      return {
        questionId: question.id,
        question: question.text,
        answer: lastAnswer?.text || '',
        score: bestEval?.score || 0,
        feedback: bestEval?.feedback || 'No feedback available'
      }
    })

    const duration = session.completedAt 
      ? Math.round((session.completedAt.getTime() - session.createdAt.getTime()) / 1000)
      : 0

    return {
      sessionId: session.id,
      overallScore: session.overallScore || 0,
      questionsAnswered: session.answers.length,
      totalQuestions: session.questions.length,
      questionScores,
      completedAt: session.completedAt || new Date(),
      duration
    }
  }

  // Cleanup methods
  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId)
    
    // TODO: Redis implementation
    // await this.redis.del(`session:${sessionId}`)
  }

  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date()
    const expiredSessions: string[] = []

    for (const [sessionId, session] of this.sessions) {
      const hoursSinceCreated = (now.getTime() - session.createdAt.getTime()) / (1000 * 60 * 60)
      if (hoursSinceCreated > 24) { // 24 hour expiry
        expiredSessions.push(sessionId)
      }
    }

    expiredSessions.forEach(sessionId => this.sessions.delete(sessionId))
    
    // TODO: Redis implementation would handle TTL automatically
  }
}

export const sessionManager = new SessionManager()