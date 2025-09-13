import dotenv from 'dotenv'
dotenv.config()
import app from './app'
import { llmAdapter } from './services/llmAdapter'

const PORT = process.env['PORT'] || 3001

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`)

  // Test LLM on startup
  await llmAdapter.testLLM()
})
