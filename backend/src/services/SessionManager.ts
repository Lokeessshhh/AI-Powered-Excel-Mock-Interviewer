import { Session, Question, Answer, EvaluationResult, SessionEvaluation } from '@shared/types'
import { llmAdapter } from './llmAdapter'

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
    difficulty?: 'beginner' | 'intermediate' | 'advanced',
    count: number = 10
  ): Promise<Session> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Generate questions using AI instead of hardcoded data
    const sessionQuestions = await llmAdapter.generateQuestions(
      count,
      difficulty || 'beginner'
    )

    if (sessionQuestions.length === 0) {
      throw new Error('Failed to generate questions for session')
    }

    const session: Session = {
      id: sessionId,
      userId,
      questions: sessionQuestions,
      currentQuestionIndex: 0,
      answers: [],
      evaluation: null,
      status: 'in_progress',
      startedAt: new Date()
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
    //   session.startedAt = new Date(session.startedAt)
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

  async evaluateCurrentAnswer(
    sessionId: string,
    answerText: string
  ): Promise<{ session: Session; evaluation: EvaluationResult }> {
    const session = await this.getSession(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const currentQuestion = session.questions[session.currentQuestionIndex]
    if (!currentQuestion) {
      throw new Error('No current question')
    }

    // Evaluate the answer using LLM
    const evaluation = await llmAdapter.evaluateAnswer(
      currentQuestion,
      currentQuestion.expectedAnswer,
      answerText
    )

    return { session, evaluation }
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
      
      // Create final evaluation
      session.evaluation = this.generateSessionEvaluation(session)
    }

    await this.updateSession(session)
    return session
  }

  private calculateOverallScore(session: Session): number {
    if (session.answers.length === 0) return 0
    
    // For now, we'll use a simple average
    // In a real implementation, you might weight recent answers more heavily
    // or use the evaluation scores stored separately
    return Math.round(Math.random() * 40 + 60) // Placeholder calculation
  }

  private generateSessionEvaluation(session: Session): SessionEvaluation {
    const questionScores = session.questions.map((question, index) => {
      const questionAnswers = session.answers.filter(a => a.questionId === question.id)
      const lastAnswer = questionAnswers[questionAnswers.length - 1]
      
      // Placeholder scoring - in real implementation, use stored evaluation results
      const score = Math.round(Math.random() * 40 + 50)
      
      return {
        questionId: question.id,
        score,
        feedback: `Answer for ${question.text.substring(0, 50)}...`,
        strengths: ['Good understanding of concepts'],
        improvements: ['Could provide more specific examples']
      }
    })

    return {
      sessionId: session.id,
      overallScore: session.overallScore || 0,
      questionScores,
      completedAt: new Date(),
      feedback: 'Overall good performance with room for improvement',
      recommendations: [
        'Practice more advanced Excel functions',
        'Focus on data analysis techniques',
        'Review pivot table creation'
      ]
    }
  }

  async getSessionReport(sessionId: string) {
    const session = await this.getSession(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const questionScores = session.questions.map((question, index) => {
      const questionAnswers = session.answers.filter(a => a.questionId === question.id)
      const lastAnswer = questionAnswers[questionAnswers.length - 1]
      
      // Placeholder scoring
      const score = Math.round(Math.random() * 40 + 50)
      
      return {
        questionId: question.id,
        question: question.text,
        answer: lastAnswer?.text || 'No answer provided',
        score,
        feedback: 'Good understanding demonstrated'
      }
    })

    const duration = session.completedAt 
      ? Math.round((session.completedAt.getTime() - session.startedAt.getTime()) / 1000)
      : Math.round((new Date().getTime() - session.startedAt.getTime()) / 1000)

    return {
      sessionId: session.id,
      overallScore: session.overallScore || this.calculateOverallScore(session),
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
      const hoursSinceCreated = (now.getTime() - session.startedAt.getTime()) / (1000 * 60 * 60)
      if (hoursSinceCreated > 24) { // 24 hour expiry
        expiredSessions.push(sessionId)
      }
    }

    expiredSessions.forEach(sessionId => this.sessions.delete(sessionId))
    
    // TODO: Redis implementation would handle TTL automatically
  }
}

export const sessionManager = new SessionManager()