import { Question, EvaluationResult } from '@shared/types'
import { OpenAI } from 'openai'

export interface LLMAdapter {
  evaluateAnswer(
    question: Question,
    expectedOutline: string,
    userAnswer: string,
    context?: EvaluationContext
  ): Promise<EvaluationResult>
  generateQuestions(
    count: number,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    category?: string
  ): Promise<Question[]>
  testLLM(): Promise<void>
}

export interface EvaluationContext {
  previousAnswers?: string[]
  followUpQuestions?: string[]
  userLevel?: 'beginner' | 'intermediate' | 'advanced'
  sessionHistory?: {
    correctAnswers: number
    totalAnswers: number
    averageScore: number
  }
}

// Rubric-first evaluator: deterministic checks then LLM call
export class RubricFirstEvaluator implements LLMAdapter {
  private nvidiaClient: NvidiaAdapter

  constructor(nvidiaApiKey: string) {
    this.nvidiaClient = new NvidiaAdapter(nvidiaApiKey)
  }

  async evaluateAnswer(
    question: Question,
    expectedOutline: string,
    userAnswer: string,
    context?: EvaluationContext
  ): Promise<EvaluationResult> {
    console.log('[LLM DEBUG] Starting evaluation for question:', question.id)

    // Deterministic checks
    const keywordScore = this.keywordMatchScore(question, userAnswer)
    const formulaScore = this.formulaMentionScore(userAnswer)
    const numericScore = this.numericCheckScore(userAnswer)

    // Aggregate deterministic score (weighted)
    const deterministicScore = Math.min(100, Math.round(
      keywordScore * 0.6 + formulaScore * 0.3 + numericScore * 0.1
    ))

    console.log(`[LLM DEBUG] Deterministic scores - Keyword: ${keywordScore}, Formula: ${formulaScore}, Numeric: ${numericScore}, Total: ${deterministicScore}`)

    // If deterministic score is high enough, pass immediately
    if (deterministicScore >= 85) {
      console.log('[LLM DEBUG] Using deterministic result - high score, no LLM call needed')
      return {
        score: deterministicScore,
        pass: true,
        feedback: 'Excellent coverage of key concepts and formulas.',
        followUps: []
      }
    }

    console.log('[LLM DEBUG] Deterministic score below threshold, calling LLM for evaluation')

    // Otherwise, call LLM for nuanced evaluation
    const llmResult = await this.nvidiaClient.evaluateAnswer(
      question,
      expectedOutline,
      userAnswer,
      context
    )

    // Combine scores conservatively
    const finalScore = Math.max(deterministicScore, llmResult.score)
    const pass = finalScore >= 60

    console.log(`[LLM DEBUG] LLM result - Score: ${llmResult.score}, Final combined score: ${finalScore}, Pass: ${pass}`)

    return {
      score: finalScore,
      pass,
      feedback: llmResult.feedback,
      followUps: llmResult.followUps.slice(0, 3)
    }
  }

  private keywordMatchScore(question: Question, answer: string): number {
    const answerLower = answer.toLowerCase()
    const keywords = [...question.keywords, ...question.expectedAnswer.toLowerCase().split(/[\s,.;]+/)]
      .filter(word => word.length > 3)
    
    const matches = keywords.filter(word => answerLower.includes(word.toLowerCase()))
    return Math.min(100, Math.round((matches.length / Math.max(keywords.length, 1)) * 100))
  }

  private formulaMentionScore(answer: string): number {
    const formulaKeywords = ['vlookup', 'index', 'match', 'sum', 'if', 'count', 'average', 'pivot', 'chart', 'formula', 'function']
    const answerLower = answer.toLowerCase()
    const matches = formulaKeywords.filter(f => answerLower.includes(f))
    return Math.min(100, Math.round((matches.length / formulaKeywords.length) * 100))
  }

  private numericCheckScore(answer: string): number {
    const numericPatterns = /\d+(\.\d+)?/g
    const matches = answer.match(numericPatterns)
    return matches ? Math.min(100, matches.length * 10) : 0
  }

  async generateQuestions(
    count: number,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    category?: string
  ): Promise<Question[]> {
    return await this.nvidiaClient.generateQuestions(count, difficulty, category)
  }

  async testLLM(): Promise<void> {
    await this.nvidiaClient.testLLM()
  }
}

export class NvidiaAdapter implements LLMAdapter {
  private client: OpenAI

  constructor(apiKey: string) {
    console.log('NVIDIA_API_KEY env var:', apiKey ? 'set' : 'not set')
    if (!apiKey) {
      console.error('NVIDIA API key not configured. Please set NVIDIA_API_KEY in .env file to enable LLM features.')
    }
    this.client = new OpenAI({
      baseURL: 'https://integrate.api.nvidia.com/v1',
      apiKey: apiKey || 'dummy-key'
    })
    console.log('[LLM DEBUG] NvidiaAdapter initialized with API key')
  }

  async evaluateAnswer(
    question: Question,
    expectedOutline: string,
    userAnswer: string,
    context?: EvaluationContext
  ): Promise<EvaluationResult> {
    console.log('[LLM DEBUG] NvidiaAdapter.evaluateAnswer called for question:', question.id)
    
    if (!process.env.NVIDIA_API_KEY) {
      console.log('[LLM DEBUG] No API key, using fallback evaluation')
      return this.fallbackEvaluation(question, userAnswer)
    }
    
    try {
      const prompt = this.buildPrompt(question, expectedOutline, userAnswer, context)
      console.log('[LLM DEBUG] Built prompt for evaluation')
      const response = await this.callNvidiaAPI(prompt)
      console.log('[LLM DEBUG] Received response from Nvidia API')
      return this.parseResponse(response)
    } catch (error) {
      console.error('[LLM DEBUG] Error in evaluation, using fallback:', error)
      return this.fallbackEvaluation(question, userAnswer)
    }
  }

  private fallbackEvaluation(question: Question, userAnswer: string): EvaluationResult {
    const answerLength = userAnswer.trim().length
    const hasKeywords = question.keywords.some(keyword => 
      userAnswer.toLowerCase().includes(keyword.toLowerCase())
    )
    
    let score = 40 // Base score
    if (answerLength > 50) score += 20
    if (answerLength > 100) score += 10
    if (hasKeywords) score += 20
    if (answerLength > 200) score += 10
    
    score = Math.min(100, score)
    
    return {
      score,
      pass: score >= 60,
      feedback: score >= 80 ? 
        'Good comprehensive answer covering key concepts.' :
        score >= 60 ?
        'Adequate answer but could include more detail and examples.' :
        'Answer needs more depth and coverage of key concepts.',
      followUps: score < 70 ? [
        'Can you provide a specific example?',
        'What are the key benefits of this approach?'
      ] : []
    }
  }

  async generateQuestions(
    count: number,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    category?: string
  ): Promise<Question[]> {
    console.log('[LLM DEBUG] Generating questions:', { count, difficulty, category })
    
    if (!process.env.NVIDIA_API_KEY) {
      console.log('[LLM DEBUG] No API key, using fallback question generation')
      return this.generateFallbackQuestions(count, difficulty, category)
    }
    
    try {
      const prompt = this.buildGenerationPrompt(count, difficulty, category)
      console.log('[LLM DEBUG] generateQuestions prompt built')
      const response = await this.callNvidiaAPI(prompt)
      console.log('[LLM DEBUG] generateQuestions response received')
      return this.parseGenerationResponse(response)
    } catch (error) {
      console.error('[LLM DEBUG] Error generating questions, using fallback:', error)
      return this.generateFallbackQuestions(count, difficulty, category)
    }
  }

  private generateFallbackQuestions(
    count: number,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    category?: string
  ): Question[] {
    const templates = {
      beginner: [
        'What is the difference between a formula and a function in Excel?',
        'How do you create a basic chart in Excel?',
        'Explain how to use the SUM function.',
        'What are cell references and how do you use them?',
        'How do you format cells in Excel?'
      ],
      intermediate: [
        'Explain the VLOOKUP function and provide an example.',
        'How do you create and use pivot tables?',
        'What is conditional formatting and how is it used?',
        'Explain the INDEX and MATCH functions.',
        'How do you use data validation in Excel?'
      ],
      advanced: [
        'Explain array formulas and their applications.',
        'How do you use Power Query for data transformation?',
        'What are advanced pivot table features?',
        'Explain macro creation and VBA basics.',
        'How do you perform statistical analysis in Excel?'
      ]
    }

    const questionTexts = templates[difficulty] || templates.beginner
    const selectedQuestions = questionTexts.slice(0, count)
    
    return selectedQuestions.map((text, index) => ({
      id: `fallback_${difficulty}_${index}_${Date.now()}`,
      text,
      category: category || 'Excel Fundamentals',
      difficulty,
      expectedAnswer: `A comprehensive answer covering the key concepts and practical applications of ${text.toLowerCase()}.`,
      keywords: this.extractKeywords(text),
      hints: [
        'Think about practical applications',
        'Consider step-by-step procedures',
        'Include specific examples where relevant'
      ]
    }))
  }

  private extractKeywords(text: string): string[] {
    const commonWords = new Set(['what', 'how', 'the', 'and', 'or', 'in', 'to', 'a', 'an', 'is', 'are', 'do', 'does'])
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter(word => word.length > 2 && !commonWords.has(word))
      .slice(0, 5)
  }

  async testLLM(): Promise<void> {
    console.log('[LLM DEBUG] Testing LLM with small prompt')
    
    if (!process.env.NVIDIA_API_KEY) {
      console.log('[LLM DEBUG] No API key configured, LLM features will use fallback responses')
      return
    }
    
    try {
      const testPrompt = 'Say "Hello, LLM is working!" in JSON format: {"message": "Hello, LLM is working!"}'
      const response = await this.callNvidiaAPI(testPrompt)
      console.log('[LLM DEBUG] Test LLM response:', response)
      console.log('[LLM DEBUG] LLM test successful')
    } catch (error) {
      console.error('[LLM DEBUG] LLM test failed, will use fallback responses:', error)
    }
  }

  private buildPrompt(
    question: Question,
    expectedOutline: string,
    userAnswer: string,
    context?: EvaluationContext
  ): string {
    return `
System: You are an expert Excel interviewer and evaluator. Evaluate the user's answer based on the expected answer outline and evaluation criteria.

Question: ${question.text}
Category: ${question.category}
Difficulty: ${question.difficulty}
Expected Answer Outline: ${expectedOutline}
Keywords to look for: ${question.keywords.join(', ')}
Evaluation Criteria: Coverage of key concepts, correctness, clarity, and completeness.
User's Answer: ${userAnswer}

Please respond ONLY with a JSON object in the following format:
{
  "score": number (0-100),
  "pass": boolean,
  "feedback": "Detailed feedback explaining the score and areas for improvement.",
  "followUps": ["Follow-up question 1", "Follow-up question 2"]
}
    `.trim()
  }

  private async callNvidiaAPI(prompt: string): Promise<string> {
    console.log('[LLM DEBUG] Calling Nvidia API with prompt length:', prompt.length)
    
    const response = await this.client.chat.completions.create({
      model: 'nvidia/llama-3.1-nemotron-70b-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
      top_p: 1,
      stream: false
    })

    console.log('[LLM DEBUG] Nvidia API call completed')

    if (!response || !response.choices || response.choices.length === 0) {
      throw new Error('Nvidia API error: No response or empty choices')
    }

    const choice = response.choices[0]
    if (!choice || !choice.message) {
      throw new Error('Nvidia API error: Invalid choice structure')
    }

    const content = choice.message.content
    if (!content) {
      throw new Error('Nvidia API error: Empty response content')
    }

    console.log('[LLM DEBUG] Nvidia API response content length:', content.length)
    return content
  }

  private parseResponse(responseText: string): EvaluationResult {
    try {
      const parsed = JSON.parse(responseText)
      console.log('[LLM DEBUG] Parsed LLM response - Score:', parsed.score, 'Pass:', parsed.pass)
      return {
        score: parsed.score ?? 0,
        pass: parsed.pass ?? false,
        feedback: parsed.feedback ?? 'No feedback provided',
        followUps: parsed.followUps ?? []
      }
    } catch (error) {
      console.error('[LLM DEBUG] Failed to parse Nvidia LLM response:', error)
      console.error('[LLM DEBUG] Raw response:', responseText)
      return {
        score: 50,
        pass: false,
        feedback: 'Unable to evaluate response properly, but some effort shown.',
        followUps: []
      }
    }
  }

  private buildGenerationPrompt(
    count: number,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    category?: string
  ): string {
    const categoryText = category ? ` in the ${category} category` : ''
    return `
System: You are an expert Excel interviewer. Generate ${count} Excel interview questions at ${difficulty} level${categoryText}.

IMPORTANT: Respond with valid JSON only. Do not include newlines, tabs, or control characters within the JSON strings. Keep all text on single lines.

Please respond ONLY with a JSON array of question objects in the following format:
[
  {
    "id": "unique_id",
    "text": "Question text (single line only)",
    "category": "Category name",
    "difficulty": "${difficulty}",
    "expectedAnswer": "Expected answer outline (single line only)",
    "keywords": ["keyword1", "keyword2"],
    "hints": ["Hint 1", "Hint 2"]
  }
]

Requirements:
- Generate exactly ${count} questions
- All questions must be at ${difficulty} difficulty level
- Questions should cover various Excel topics like formulas, functions, data analysis, formatting, etc.
- Each question should have a detailed expected answer
- Include relevant keywords and hints for each question
- Use unique IDs for each question (format: excel_${difficulty}_questionNumber_timestamp)
- Make questions practical and interview-appropriate
- CRITICAL: All text must be single-line with no newlines, tabs, or special characters within JSON strings
    `.trim()
  }

  private parseGenerationResponse(responseText: string): Question[] {
    try {
      const parsed = JSON.parse(responseText)
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array')
      }
      return parsed.map((q: any, index: number) => ({
        id: q.id || `excel_${q.difficulty || 'beginner'}_${index}_${Date.now()}`,
        text: q.text || 'Sample Excel question',
        category: q.category || 'Excel Fundamentals',
        difficulty: q.difficulty || 'beginner',
        expectedAnswer: q.expectedAnswer || 'A comprehensive answer is expected.',
        keywords: Array.isArray(q.keywords) ? q.keywords : [],
        hints: Array.isArray(q.hints) ? q.hints : []
      }))
    } catch (error) {
      console.error('[LLM DEBUG] Failed to parse Nvidia LLM generation response:', error)
      console.error('[LLM DEBUG] Raw response:', responseText)
      return []
    }
  }
}

export const llmAdapter: LLMAdapter = new RubricFirstEvaluator(
  process.env.NVIDIA_API_KEY || ''
)