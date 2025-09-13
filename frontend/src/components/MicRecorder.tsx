import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, Square, RotateCcw, Upload, Volume2 } from 'lucide-react'
import { sttService } from './STTService'
import { ttsService } from './TTSService'

interface MicRecorderProps {
  onTranscript: (text: string, isFinal: boolean) => void
  onRecordingComplete?: (audioBlob: Blob) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioBlob: Blob | null
}

export const MicRecorder: React.FC<MicRecorderProps> = ({
  onTranscript,
  onRecordingComplete,
  placeholder = "Click the microphone to start recording...",
  className = "",
  disabled = false
}) => {
  // State for speech recognition
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  // State for audio recording fallback
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null
  })

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  // Check if Web Speech API is available
  const speechSupported = sttService.isSupported()

  // Timer for recording duration
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setRecordingState(prev => ({
        ...prev,
        duration: Math.floor((Date.now() - startTimeRef.current) / 1000)
      }))
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Speech Recognition Handlers
  useEffect(() => {
    if (!speechSupported) return

    const handleResult = (text: string, isFinal: boolean) => {
      if (isFinal) {
        setTranscript(prev => prev + (prev ? ' ' : '') + text)
        setInterimTranscript('')
        onTranscript(text, true)
      } else {
        setInterimTranscript(text)
        onTranscript(text, false)
      }
    }

    const handleError = (error: string) => {
      setError(error)
      setIsListening(false)
    }

    const unsubscribeResult = sttService.onResult(handleResult)
    const unsubscribeError = sttService.onError(handleError)

    return () => {
      unsubscribeResult()
      unsubscribeError()
    }
  }, [speechSupported, onTranscript])

  // Start speech recognition
  const startSpeechRecognition = useCallback(async () => {
    try {
      setError(null)
      await sttService.startListening()
      setIsListening(true)
    } catch (err) {
      setError('Failed to start speech recognition')
      console.error('Speech recognition error:', err)
    }
  }, [])

  // Stop speech recognition
  const stopSpeechRecognition = useCallback(() => {
    sttService.stopListening()
    setIsListening(false)
    setInterimTranscript('')
  }, [])

  // Audio Recording Fallback Methods
  const startAudioRecording = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      audioChunksRef.current = []
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setRecordingState(prev => ({
          ...prev,
          audioBlob,
          isRecording: false
        }))

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())

        if (onRecordingComplete) {
          onRecordingComplete(audioBlob)
        }
      }

      mediaRecorder.start(1000) // Collect data every second
      setRecordingState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
        audioBlob: null
      }))

      startTimer()
    } catch (err) {
      setError('Failed to access microphone')
      console.error('Audio recording error:', err)
    }
  }, [onRecordingComplete, startTimer])

  const stopAudioRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop()
      stopTimer()
    }
  }, [recordingState.isRecording, stopTimer])

  // Main recording control
  const handleRecordToggle = useCallback(() => {
    if (disabled) return

    if (speechSupported) {
      if (isListening) {
        stopSpeechRecognition()
      } else {
        startSpeechRecognition()
      }
    } else {
      if (recordingState.isRecording) {
        stopAudioRecording()
      } else {
        startAudioRecording()
      }
    }
  }, [
    disabled,
    speechSupported,
    isListening,
    recordingState.isRecording,
    startSpeechRecognition,
    stopSpeechRecognition,
    startAudioRecording,
    stopAudioRecording
  ])

  // Handle file upload (alternative to recording)
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('audio/')) {
      setRecordingState(prev => ({
        ...prev,
        audioBlob: file,
        duration: 0 // Reset duration for uploaded files
      }))

      if (onRecordingComplete) {
        onRecordingComplete(file)
      }
    }
  }, [onRecordingComplete])

  // Retry recording
  const handleRetry = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null
    })
  }, [])

  // Play TTS for current transcript
  const handlePlayTranscript = useCallback(() => {
    const textToPlay = transcript || interimTranscript
    if (textToPlay.trim()) {
      ttsService.speak(textToPlay)
    }
  }, [transcript, interimTranscript])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer()
      if (mediaRecorderRef.current && recordingState.isRecording) {
        mediaRecorderRef.current.stop()
      }
      sttService.stopListening()
    }
  }, [recordingState.isRecording, stopTimer])

  const displayText = transcript + (interimTranscript ? ` ${interimTranscript}` : '')
  const hasContent = displayText.trim() || recordingState.audioBlob

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main input area */}
      <div className="relative">
        <div
          className={`w-full min-h-[120px] p-4 border-2 border-dashed rounded-lg transition-colors ${
            isListening || recordingState.isRecording
              ? 'border-red-300 bg-red-50'
              : hasContent
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}`}
        >
          {displayText ? (
            <div className="space-y-2">
              <div className="text-gray-900 whitespace-pre-wrap">{displayText}</div>
              {interimTranscript && (
                <div className="text-gray-500 italic">{interimTranscript}</div>
              )}
            </div>
          ) : recordingState.audioBlob ? (
            <div className="text-gray-600 italic">
              Audio file uploaded: {recordingState.audioBlob.size} bytes
            </div>
          ) : (
            <div className="text-gray-500 italic">{placeholder}</div>
          )}

          {/* Recording indicator */}
          {(isListening || recordingState.isRecording) && (
            <div className="absolute top-2 right-2 flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-red-600 font-medium">REC</span>
              </div>
              {recordingState.duration > 0 && (
                <span className="text-xs text-gray-600 font-mono">
                  {formatDuration(recordingState.duration)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Control buttons */}
        <div className="absolute bottom-2 right-2 flex items-center space-x-2">
          {/* Play transcript button */}
          {hasContent && (
            <button
              onClick={handlePlayTranscript}
              className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-full transition-colors"
              title="Play transcript"
              disabled={disabled}
            >
              <Volume2 size={16} />
            </button>
          )}

          {/* Record/Stop button */}
          <button
            onClick={handleRecordToggle}
            className={`p-2 rounded-full transition-colors ${
              isListening || recordingState.isRecording
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
            title={
              speechSupported
                ? (isListening ? 'Stop recording' : 'Start voice recording')
                : (recordingState.isRecording ? 'Stop recording' : 'Start audio recording')
            }
            disabled={disabled}
          >
            {isListening || recordingState.isRecording ? (
              <Square size={16} />
            ) : (
              <Mic size={16} />
            )}
          </button>

          {/* File upload button (fallback) */}
          {!speechSupported && (
            <label className="p-2 bg-gray-200 text-gray-600 hover:bg-gray-300 rounded-full cursor-pointer transition-colors">
              <Upload size={16} />
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={disabled}
              />
            </label>
          )}

          {/* Retry button */}
          {hasContent && (
            <button
              onClick={handleRetry}
              className="p-2 bg-gray-200 text-gray-600 hover:bg-gray-300 rounded-full transition-colors"
              title="Clear and retry"
              disabled={disabled}
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-800">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Status information */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div>
          {speechSupported ? (
            <span>Using speech recognition</span>
          ) : (
            <span>Using audio recording (speech recognition not supported)</span>
          )}
        </div>

        {recordingState.audioBlob && (
          <div>
            Audio: {(recordingState.audioBlob.size / 1024).toFixed(1)} KB
          </div>
        )}
      </div>
    </div>
  )
}

export default MicRecorder
