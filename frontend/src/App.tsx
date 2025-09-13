import React, { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { Play, Mic, MicOff, ChevronRight, ChevronDown, Check, X, Volume2, Upload } from 'lucide-react'

// Types
interface Question {
  id: string
  text: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

interface Answer {
  questionId: string
  text: string
  isCorrect?: boolean
  followUp?: string
}

interface SessionState {
  currentQuestionIndex: number
  questions: Question[]
  answers: Answer[]
  sessionId: string | null
  isLoading: boolean
}

// Sample questions data
const sampleQuestions: Question[] = [
  { id: '1', text: 'What is the difference between a workbook and a worksheet in Excel?', category: 'Basics', difficulty: 'beginner' },
  { id: '2', text: 'Explain how to use VLOOKUP function with an example.', category: 'Functions', difficulty: 'intermediate' },
  { id: '3', text: 'How would you create a pivot table from raw data?', category: 'Data Analysis', difficulty: 'intermediate' },
  { id: '4', text: 'What are absolute and relative cell references? When would you use each?', category: 'Formulas', difficulty: 'beginner' },
  { id: '5', text: 'Describe how to use conditional formatting to highlight data.', category: 'Formatting', difficulty: 'beginner' },
  { id: '6', text: 'How do you create and use named ranges in Excel?', category: 'Advanced', difficulty: 'intermediate' },
  { id: '7', text: 'Explain the INDEX and MATCH functions and their advantages over VLOOKUP.', category: 'Functions', difficulty: 'advanced' },
  { id: '8', text: 'How would you remove duplicates from a dataset?', category: 'Data Cleaning', difficulty: 'intermediate' },
  { id: '9', text: 'What is the purpose of Excel macros and how do you create one?', category: 'Automation', difficulty: 'advanced' },
  { id: '10', text: 'How do you protect cells and worksheets in Excel?', category: 'Security', difficulty: 'intermediate' },
  { id: '11', text: 'Explain how to use data validation in Excel.', category: 'Data Quality', difficulty: 'intermediate' },
  { id: '12', text: 'What are the different chart types available in Excel and when to use each?', category: 'Visualization', difficulty: 'beginner' },
]

// Context
const SessionContext = createContext<{
  state: SessionState
  dispatch: React.Dispatch<any>
}>({
  state: {
    currentQuestionIndex: 0,
    questions: [],
    answers: [],
    sessionId: null,
    isLoading: false,
  },
  dispatch: () => {},
})

// API wrapper
const api = {
  createSession: async (): Promise<{ sessionId: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { sessionId: `session-${Date.now()}` }
  },
  
  submitAnswer: async (sessionId: string, questionId: string, answer: string) => {
    await new Promise(resolve => setTimeout(resolve, 800))
    const isCorrect = Math.random() > 0.3
    const followUp = !isCorrect && Math.random() > 0.5 ? 'Can you provide more detail about this concept?' : undefined
    return { isCorrect, followUp }
  },
  
  transcribeAudio: async (audioBlob: Blob): Promise<{ text: string }> => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return { text: 'Transcribed audio text would appear here...' }
  }
}

// TTS Service
class TTSService {
  private synth = window.speechSynthesis
  
  speak(text: string) {
    if (this.synth) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.8
      utterance.pitch = 1
      this.synth.speak(utterance)
    }
  }
  
  stop() {
    if (this.synth) {
      this.synth.cancel()
    }
  }
}

const ttsService = new TTSService()

// STT Hook
const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [recognition, setRecognition] = useState<any>(null)

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      
      recognitionInstance.continuous = true
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'en-US'
      
      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + ' ' + finalTranscript)
        }
      }
      
      recognitionInstance.onend = () => {
        setIsListening(false)
      }
      
      setRecognition(recognitionInstance)
    }
  }, [])

  const startListening = useCallback(() => {
    if (recognition) {
      setIsListening(true)
      recognition.start()
    }
  }, [recognition])

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop()
      setIsListening(false)
    }
  }, [recognition, isListening])

  return { isListening, transcript, startListening, stopListening, isSupported: !!recognition }
}

// Demo Overlay Component
const DemoOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0)
  
  const steps = [
    { text: 'Click here to start your interview', position: 'bottom-left' },
    { text: 'Answer questions using voice or text', position: 'center' },
    { text: 'Track your progress in the sidebar', position: 'left' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Demo Walkthrough</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close demo"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2 transform transition-transform duration-300 animate-pulse">
            <ChevronRight className="text-blue-500" size={20} />
            <span className="text-sm">{steps[currentStep].text}</span>
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-3 py-1 text-sm bg-gray-200 disabled:opacity-50 rounded"
            >
              Previous
            </button>
            
            <span className="text-sm text-gray-500">
              {currentStep + 1} / {steps.length}
            </span>
            
            <button
              onClick={() => {
                if (currentStep < steps.length - 1) {
                  setCurrentStep(currentStep + 1)
                } else {
                  onClose()
                }
              }}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Question Sidebar Component
const QuestionSidebar: React.FC = () => {
  const { state } = useContext(SessionContext)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const getQuestionStatus = (questionIndex: number) => {
    if (questionIndex < state.currentQuestionIndex) {
      const answer = state.answers.find(a => a.questionId === state.questions[questionIndex]?.id)
      return answer?.isCorrect ? 'correct' : 'incorrect'
    }
    if (questionIndex === state.currentQuestionIndex) return 'current'
    return 'pending'
  }

  return (
    <div className={`bg-gray-50 border-r transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-80'}`}>
      <div className="p-4 border-b">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center space-x-2 text-sm font-medium"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          {!isCollapsed && <span>Questions ({state.questions.length})</span>}
        </button>
      </div>
      
      {!isCollapsed && (
        <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
          {state.questions.map((question, index) => {
            const status = getQuestionStatus(index)
            return (
              <div
                key={question.id}
                className={`p-3 rounded text-sm border ${
                  status === 'current' 
                    ? 'bg-blue-50 border-blue-200 text-blue-900' 
                    : status === 'correct'
                    ? 'bg-green-50 border-green-200 text-green-900'
                    : status === 'incorrect'
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : 'bg-white border-gray-200 text-gray-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-medium">Q{index + 1}</span>
                  {status === 'correct' && <Check size={16} className="text-green-600 flex-shrink-0" />}
                </div>
                <div className="text-xs text-gray-500 mt-1">{question.category}</div>
                <div className="mt-1 line-clamp-2">{question.text}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Answer Input Component
const AnswerInput: React.FC = () => {
  const { state, dispatch } = useContext(SessionContext)
  const [answer, setAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [followUp, setFollowUp] = useState<string | null>(null)
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition()

  useEffect(() => {
    if (transcript.trim()) {
      setAnswer(prev => prev + (prev ? ' ' : '') + transcript.trim())
    }
  }, [transcript])

  const handleSubmit = async () => {
    if (!answer.trim() || !state.sessionId) return
    
    setIsSubmitting(true)
    try {
      const currentQuestion = state.questions[state.currentQuestionIndex]
      const result = await api.submitAnswer(state.sessionId, currentQuestion.id, answer)
      
      const newAnswer: Answer = {
        questionId: currentQuestion.id,
        text: answer,
        isCorrect: result.isCorrect,
        followUp: result.followUp
      }
      
      dispatch({ type: 'ADD_ANSWER', payload: newAnswer })
      
      if (result.followUp) {
        setFollowUp(result.followUp)
      } else if (result.isCorrect && state.currentQuestionIndex < state.questions.length - 1) {
        dispatch({ type: 'NEXT_QUESTION' })
        setAnswer('')
        setFollowUp(null)
      }
    } catch (error) {
      console.error('Failed to submit answer:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('audio/')) {
      try {
        const result = await api.transcribeAudio(file)
        setAnswer(prev => prev + (prev ? ' ' : '') + result.text)
      } catch (error) {
        console.error('Failed to transcribe audio:', error)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here or use the microphone..."
          className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Answer input"
        />
        
        <div className="absolute bottom-3 right-3 flex space-x-2">
          {isSupported ? (
            <button
              onClick={isListening ? stopListening : startListening}
              className={`p-2 rounded-full ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              aria-label={isListening ? 'Stop recording' : 'Start recording'}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          ) : (
            <label className="p-2 bg-gray-200 text-gray-600 hover:bg-gray-300 rounded-full cursor-pointer">
              <Upload size={16} />
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                aria-label="Upload audio file"
              />
            </label>
          )}
        </div>
      </div>

      {followUp && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm font-medium text-yellow-800 mb-1">Follow-up:</div>
          <div className="text-sm text-yellow-700">{followUp}</div>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={handleSubmit}
          disabled={!answer.trim() || isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Answer'}
        </button>
        
        <button
          onClick={() => {
            if (state.currentQuestionIndex < state.questions.length - 1) {
              dispatch({ type: 'NEXT_QUESTION' })
              setAnswer('')
              setFollowUp(null)
            }
          }}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          disabled={state.currentQuestionIndex >= state.questions.length - 1}
        >
          Skip Question
        </button>
      </div>
    </div>
  )
}

// Main Interview Component
const InterviewView: React.FC = () => {
  const { state } = useContext(SessionContext)
  
  const currentQuestion = state.questions[state.currentQuestionIndex]
  
  const handlePlayTTS = () => {
    if (currentQuestion) {
      ttsService.speak(currentQuestion.text)
    }
  }

  if (!currentQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Interview Complete!</h2>
          <p className="text-gray-600">You have answered all questions.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex">
      <QuestionSidebar />
      
      <div className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-500">
                Question {state.currentQuestionIndex + 1} of {state.questions.length}
              </div>
              <div className="flex space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  currentQuestion.difficulty === 'beginner' 
                    ? 'bg-green-100 text-green-800'
                    : currentQuestion.difficulty === 'intermediate'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {currentQuestion.difficulty}
                </span>
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                  {currentQuestion.category}
                </span>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex-1">
                  {currentQuestion.text}
                </h2>
                <button
                  onClick={handlePlayTTS}
                  className="ml-4 p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-full flex-shrink-0"
                  aria-label="Play question aloud"
                >
                  <Volume2 size={20} />
                </button>
              </div>
            </div>
          </div>
          
          <AnswerInput />
        </div>
      </div>
    </div>
  )
}

// Main App Component
const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'demo' | 'interview'>('home')
  const [showDemo, setShowDemo] = useState(false)
  
  const [state, dispatch] = React.useReducer((state: SessionState, action: any) => {
    switch (action.type) {
      case 'START_SESSION':
        return {
          ...state,
          sessionId: action.payload.sessionId,
          questions: sampleQuestions,
          currentQuestionIndex: 0,
          answers: [],
          isLoading: false,
        }
      case 'ADD_ANSWER':
        return {
          ...state,
          answers: [...state.answers, action.payload],
        }
      case 'NEXT_QUESTION':
        return {
          ...state,
          currentQuestionIndex: state.currentQuestionIndex + 1,
        }
      case 'SET_LOADING':
        return {
          ...state,
          isLoading: action.payload,
        }
      default:
        return state
    }
  }, {
    currentQuestionIndex: 0,
    questions: [],
    answers: [],
    sessionId: null,
    isLoading: false,
  })

  const handleStartInterview = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const result = await api.createSession()
      dispatch({ type: 'START_SESSION', payload: result })
      setView('interview')
    } catch (error) {
      console.error('Failed to start interview:', error)
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  if (view === 'interview') {
    return (
      <SessionContext.Provider value={{ state, dispatch }}>
        <div className="min-h-screen bg-gray-50 flex">
          <InterviewView />
        </div>
      </SessionContext.Provider>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showDemo && <DemoOverlay onClose={() => setShowDemo(false)} />}
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-4rem)]">
          {/* Left Column - Illustrative Image */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md aspect-square bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Play className="text-blue-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Excel Interview Prep</h3>
                <p className="text-gray-600">Practice with AI-powered questions</p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Demo Panel */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Demo</h2>
              <p className="text-gray-600 mb-4">
                Get familiar with the interview interface and see how the AI evaluation works.
              </p>
              <button
                onClick={() => setShowDemo(true)}
                className="w-full py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium transition-colors"
              >
                Try Demo
              </button>
            </div>

            {/* Actual Interview Panel */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Actual Interview</h2>
              <p className="text-gray-600 mb-4">
                Start your Excel skills assessment with personalized questions and real-time feedback.
              </p>
              <button
                onClick={handleStartInterview}
                disabled={state.isLoading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {state.isLoading ? 'Starting Interview...' : 'Start Actual Interview'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App