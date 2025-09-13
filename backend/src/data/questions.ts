import { Question } from '@shared/types'

export const questions: Question[] = []

export const getQuestionsByDifficulty = (difficulty: Question['difficulty']): Question[] => {
  return questions.filter(q => q.difficulty === difficulty)
}

export const getQuestionsByIds = (ids: string[]): Question[] => {
  return questions.filter(q => ids.includes(q.id))
}

export const getRandomQuestions = (count: number, difficulty?: Question['difficulty']): Question[] => {
  let pool = difficulty ? getQuestionsByDifficulty(difficulty) : questions
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}