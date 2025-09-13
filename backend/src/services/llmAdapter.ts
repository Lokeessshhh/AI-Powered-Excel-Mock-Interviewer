import { Question, EvaluationResult } from '@shared/types'

export interface LLMAdapter {
  evaluateAnswer(
    question: Question,
    answer: string,
    context?: EvaluationContext
  ): Promise<EvaluationResult>
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

class MockLLMAdapter implements LLMAdapter {
  async evaluateAnswer(
    question: Question,
    answer: string,
    context?: EvaluationContext
  ): Promise<EvaluationResult> {
    // Placeholder implementation - replace with actual LLM integration
    return evaluateWithLLM(question, answer, context)
  }
}

// Placeholder function for LLM integration
async function evaluateWithLLM(
  question: Question,
  answer: string,
  context?: EvaluationContext
): Promise<EvaluationResult> {
  // TODO: Replace with actual LLM API call (OpenAI, Claude, etc.)
  
  // Simple keyword matching for demo
  const answerLower = answer.toLowerCase()
  const keywordMatches = question.keywords.filter(keyword => 
    answerLower.includes(keyword.toLowerCase())
  )
  
  const matchPercentage = keywordMatches.length / question.keywords.length
  const score = Math.round(matchPercentage * 100)
  
  let correct = score >= 60
  let feedback = ''
  let followUps: string[] = []
  
  if (score >= 80) {
    feedback = 'Excellent answer! You covered all the key concepts.'
  } else if (score >= 60) {
    feedback = 'Good answer, but could be more comprehensive.'
    followUps = ['Can you provide a specific example?']
  } else {
    feedback = 'Your answer is missing some key concepts.'
    followUps = [
      'Can you explain this concept in more detail?',
      'What are the main components involved?'
    ]
    correct = false
  }
  
  const missingConcepts = question.keywords.filter(keyword => 
    !keywordMatches.includes(keyword)
  )

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

  return {
    correct,
    score,
    feedback,
    followUps: followUps.length > 0 ? followUps : undefined,
    keywordMatches,
    missingConcepts
  }
}

// Example of how to integrate with OpenAI
class OpenAIAdapter implements LLMAdapter {
  constructor(private apiKey: string) {}

  async evaluateAnswer(
    question: Question,
    answer: string,
    context?: EvaluationContext
  ): Promise<EvaluationResult> {
    // TODO: Implement OpenAI integration
    // const prompt = this.buildEvaluationPrompt(question, answer, context)
    // const response = await this.callOpenAI(prompt)
    // return this.parseResponse(response)
    
    // Fallback to mock for now
    return evaluateWithLLM(question, answer, context)
  }

  private buildEvaluationPrompt(
    question: Question,
    answer: string,
    context?: EvaluationContext
  ): string {
    return `
You are an Excel expert evaluating interview answers. Please evaluate this answer:

Question: ${question.text}
Expected Answer: ${question.expectedAnswer}
Key Concepts: ${question.keywords.join(', ')}

User's Answer: ${answer}

Provide evaluation in this JSON format:
{
  "correct": boolean,
  "score": number (0-100),
  "feedback": "detailed feedback string",
  "followUps": ["follow-up question 1", "follow-up question 2"],
  "keywordMatches": ["matched concepts"],
  "missingConcepts": ["missing concepts"]
}
    `.trim()
  }
}

// Export the adapter interface and implementations
export const llmAdapter: LLMAdapter = new MockLLMAdapter()

// Factory function for different adapters
export function createLLMAdapter(type: 'mock' | 'openai', config?: any): LLMAdapter {
  switch (type) {
    case 'openai':
      return new OpenAIAdapter(config?.apiKey)
    case 'mock':
    default:
      return new MockLLMAdapter()
  }
}