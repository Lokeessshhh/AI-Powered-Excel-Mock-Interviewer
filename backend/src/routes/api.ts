import { Router, Request, Response } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { questions } from '../data/questions'
import { sessionManager } from '../services/SessionManager'
import { llmAdapter } from '../services/llmAdapter'
import type {
  CreateSessionRequest,
  CreateSessionResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  TranscribeResponse,
  SessionReportResponse
} from '../types'

const router = Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true)
    } else {
      cb(new Error('Only audio files are allowed'))
    }
  }
})

// Validation schemas
const createSessionSchema = z.object({
  userId: z.string().optional().default('anonymous'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  questionIds: z.array(z.string()).optional()
})

const submitAnswerSchema = z.object({
  text: z.string().optional()
})

// GET /api/questions
router.get('/questions', (req: Request, res: Response) => {
  try {
    const { difficulty, category } = req.query
    
    let filteredQuestions = questions
    
    if (difficulty) {
      filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty)
    }
    
    if (category) {
      filteredQuestions = filteredQuestions.filter(q => q.category === category)
    }
    
    res.json({
      questions: filteredQuestions,
      total: filteredQuestions.length
    })
  } catch (error) {
    console.error('Error fetching questions:', error)
    res.status(500).json({ error: 'Failed to fetch questions' })
  }
})

// POST /api/sessions
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const validatedData = createSessionSchema.parse(req.body)
    
    const session = await sessionManager.createSession(
      validatedData.userId,
      validatedData.questionIds,
      validatedData.difficulty
    )
    
    const response: CreateSessionResponse = {
      sessionId: session.id,
      currentQuestion: session.questions[0]
    }
    
    res.status(201).json(response)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      })
    } else {
      console.error('Error creating session:', error)
      res.status(500).json({ error: 'Failed to create session' })
    }
  }
})

// POST /api/sessions/:sessionId/answer
router.post('/sessions/:sessionId/answer', 
  upload.single('audio'),
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params
      const validatedData = submitAnswerSchema.parse(req.body)
      
      let answerText = validatedData.text || ''
      
      // Handle audio file if provided
      if (req.file && !answerText) {
        // TODO: Implement actual audio transcription
        // For now, return placeholder text
        answerText = 'Audio transcription would be processed here'
      }
      
      if (!answerText.trim()) {
        return res.status(400).json({ error: 'Answer text is required' })
      }
      
      const session = await sessionManager.getSession(sessionId)
      if (!session) {
        return res.status(404).json({ error: 'Session not found' })
      }
      
      if (session.status !== 'active') {
        return res.status(400).json({ error: 'Session is not active' })
      }
      
      const currentQuestion = session.questions[session.currentQuestionIndex]
      if (!currentQuestion) {
        return res.status(400).json({ error: 'No current question' })
      }
      
      // Add answer to session
      const { answer } = await sessionManager.addAnswer(
        sessionId,
        currentQuestion.id,
        answerText
      )
      
      // Evaluate the answer
      const evaluation = await llmAdapter.evaluateAnswer(currentQuestion, answerText)
      
      // Store evaluation
      await sessionManager.addEvaluation(sessionId, evaluation)
      
      let nextQuestion: any = null
      let completed = false
      
      // Move to next question if answer is correct or no follow-ups
      if (evaluation.correct || !evaluation.followUps || evaluation.followUps.length === 0) {
        const updatedSession = await sessionManager.moveToNextQuestion(sessionId)
        completed = updatedSession.status === 'completed'
        
        if (!completed) {
          nextQuestion = updatedSession.questions[updatedSession.currentQuestionIndex]
        }
      }
      
      const response: SubmitAnswerResponse = {
        correct: evaluation.correct,
        feedback: evaluation.feedback,
        followUps: evaluation.followUps,
        nextQuestion,
        completed
      }
      
      res.json(response)
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: 'Validation error', 
          details: error.errors 
        })
      } else {
        console.error('Error submitting answer:', error)
        res.status(500).json({ error: 'Failed to submit answer' })
      }
    }
  }
)

// POST /api/transcribe
router.post('/transcribe', 
  upload.single('audio'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Audio file is required' })
      }
      
      // TODO: Implement actual transcription service
      // This could integrate with:
      // - OpenAI Whisper API
      // - Google Speech-to-Text
      // - AWS Transcribe
      // - Azure Speech Services
      
      // Placeholder implementation
      const mockTranscription = `This is a placeholder transcription of the uploaded audio file. 
      In a real implementation, this would process the ${req.file.originalname} file 
      (${req.file.size} bytes) and return the actual transcribed text.`
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
      
      const response: TranscribeResponse = {
        text: mockTranscription
      }
      
      res.json(response)
    } catch (error) {
      console.error('Error transcribing audio:', error)
      res.status(500).json({ error: 'Failed to transcribe audio' })
    }
  }
)

// GET /api/sessions/:sessionId/report
router.get('/sessions/:sessionId/report', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params
    
    const report = await sessionManager.getSessionReport(sessionId)
    
    const response: SessionReportResponse = report
    
    res.json(response)
  } catch (error) {
    if (error instanceof Error && error.message === 'Session not found') {
      res.status(404).json({ error: 'Session not found' })
    } else {
      console.error('Error generating report:', error)
      res.status(500).json({ error: 'Failed to generate report' })
    }
  }
})

// GET /api/sessions/:sessionId/status
router.get('/sessions/:sessionId/status', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params
    
    const session = await sessionManager.getSession(sessionId)
    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }
    
    const currentQuestion = session.status === 'active' 
      ? session.questions[session.currentQuestionIndex] 
      : null
    
    res.json({
      sessionId: session.id,
      status: session.status,
      currentQuestionIndex: session.currentQuestionIndex,
      totalQuestions: session.questions.length,
      currentQuestion,
      answersCount: session.answers.length,
      overallScore: session.overallScore,
      createdAt: session.createdAt,
      completedAt: session.completedAt
    })
  } catch (error) {
    console.error('Error fetching session status:', error)
    res.status(500).json({ error: 'Failed to fetch session status' })
  }
})

export default router