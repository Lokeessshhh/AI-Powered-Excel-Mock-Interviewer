import { Router, Request, Response } from 'express'
import multer from 'multer'
import { z } from 'zod'
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
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('beginner'),
  questionCount: z.number().min(1).max(20).optional().default(10)
})

const submitAnswerSchema = z.object({
  text: z.string().optional()
})

const generateQuestionsSchema = z.object({
  count: z.number().min(1).max(20).optional().default(5),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('beginner'),
  category: z.string().optional()
})

// POST /api/questions/generate - Generate questions using AI
router.post('/questions/generate', async (req: Request, res: Response) => {
  try {
    const validatedData = generateQuestionsSchema.parse(req.body)

    console.log('[API] Generating questions:', validatedData)
    const generatedQuestions = await llmAdapter.generateQuestions(
      validatedData.count,
      validatedData.difficulty,
      validatedData.category
    )

    console.log('[API] Generated questions count:', generatedQuestions.length)
    res.json({
      questions: generatedQuestions,
      total: generatedQuestions.length
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      })
    } else {
      console.error('[API] Error generating questions:', error)
      res.status(500).json({ error: 'Failed to generate questions' })
    }
  }
})

// POST /api/sessions
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const validatedData = createSessionSchema.parse(req.body)
    
    console.log('[API] Creating session with data:', validatedData)
    const session = await sessionManager.createSession(
      validatedData.userId,
      validatedData.difficulty,
      validatedData.questionCount
    )
    
    const firstQuestion = session.questions[0]
    if (!firstQuestion) {
      throw new Error('No questions available for session')
    }

    console.log('[API] Session created:', session.id)
    const response: CreateSessionResponse = {
      sessionId: session.id,
      currentQuestion: firstQuestion
    }
    
    res.status(201).json(response)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      })
    } else {
      console.error('[API] Error creating session:', error)
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
        console.log('[API] Audio file received:', req.file.originalname, req.file.size, 'bytes')
      }

      if (!answerText.trim()) {
        return res.status(400).json({ error: 'Answer text is required' })
      }

      console.log('[API] Submitting answer for session:', sessionId)
      const session = await sessionManager.getSession(sessionId)
      if (!session) {
        return res.status(404).json({ error: 'Session not found' })
      }

      if (session.status !== 'in_progress') {
        return res.status(400).json({ error: 'Session is not in progress' })
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
      console.log('[API] Evaluating answer...')
      const { evaluation } = await sessionManager.evaluateCurrentAnswer(
        sessionId,
        answerText
      )

      console.log('[API] Answer evaluated. Score:', evaluation.score, 'Pass:', evaluation.pass)

      let nextQuestion: any = null
      let completed = false

      // Move to next question if answer passes or meets criteria
      if (evaluation.pass || evaluation.score >= 60) {
        const updatedSession = await sessionManager.moveToNextQuestion(sessionId)
        completed = updatedSession.status === 'completed'

        if (!completed) {
          nextQuestion = updatedSession.questions[updatedSession.currentQuestionIndex]
        }
        console.log('[API] Moved to next question. Completed:', completed)
      } else {
        console.log('[API] Answer needs improvement, staying on current question')
      }

      const response: SubmitAnswerResponse = {
        correct: evaluation.pass,
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
        console.error('[API] Error submitting answer:', error)
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
      
      console.log('[API] Processing audio transcription:', req.file.originalname)
      
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
      console.error('[API] Error transcribing audio:', error)
      res.status(500).json({ error: 'Failed to transcribe audio' })
    }
  }
)

// GET /api/sessions/:sessionId/report
router.get('/sessions/:sessionId/report', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params
    
    console.log('[API] Generating report for session:', sessionId)
    const report = await sessionManager.getSessionReport(sessionId)
    
    const response: SessionReportResponse = report
    
    res.json(response)
  } catch (error) {
    if (error instanceof Error && error.message === 'Session not found') {
      res.status(404).json({ error: 'Session not found' })
    } else {
      console.error('[API] Error generating report:', error)
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
    
    const currentQuestion = session.status === 'in_progress'
      ? session.questions[session.currentQuestionIndex]
      : null

    res.json({
      sessionId: session.id,
      status: session.status,
      currentQuestionIndex: session.currentQuestionIndex,
      totalQuestions: session.questions.length,
      currentQuestion,
      answersCount: session.answers.length,
      overallScore: session.evaluation?.overallScore || session.overallScore,
      createdAt: session.startedAt,
      completedAt: session.completedAt
    })
  } catch (error) {
    console.error('[API] Error fetching session status:', error)
    res.status(500).json({ error: 'Failed to fetch session status' })
  }
})

// GET /api/sessions/:sessionId/current-question
router.get('/sessions/:sessionId/current-question', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params
    
    const session = await sessionManager.getSession(sessionId)
    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }
    
    if (session.status !== 'in_progress') {
      return res.status(400).json({ error: 'Session is not in progress' })
    }

    const currentQuestion = session.questions[session.currentQuestionIndex]
    if (!currentQuestion) {
      return res.status(404).json({ error: 'No current question available' })
    }

    res.json({
      question: currentQuestion,
      questionIndex: session.currentQuestionIndex,
      totalQuestions: session.questions.length
    })
  } catch (error) {
    console.error('[API] Error fetching current question:', error)
    res.status(500).json({ error: 'Failed to fetch current question' })
  }
})

// Test LLM endpoint
router.get('/test-llm', async (req: Request, res: Response) => {
  try {
    console.log('[API] Testing LLM connection...')
    await llmAdapter.testLLM()
    res.json({ message: 'LLM test successful' })
  } catch (error) {
    console.error('[API] LLM test failed:', error)
    res.status(500).json({ error: 'LLM test failed', details: error })
  }
})

export default router