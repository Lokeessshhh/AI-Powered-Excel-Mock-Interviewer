export interface Question {
  id: string
  text: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  expectedKeywords?: string[]
  hints?: string[]
}

export const questions: Question[] = [
  {
    id: '1',
    text: 'What is the difference between a workbook and a worksheet in Excel?',
    category: 'Basics',
    difficulty: 'beginner',
    expectedKeywords: ['workbook', 'worksheet', 'tabs', 'file', 'sheets'],
    hints: ['Think about the file structure', 'Consider what you see at the bottom of Excel']
  },
  {
    id: '2',
    text: 'Explain how to use VLOOKUP function with an example.',
    category: 'Functions',
    difficulty: 'intermediate',
    expectedKeywords: ['VLOOKUP', 'lookup_value', 'table_array', 'column_index', 'FALSE'],
    hints: ['Remember the 4 parameters', 'Think about exact vs approximate match']
  },
  {
    id: '3',
    text: 'How would you create a pivot table from raw data?',
    category: 'Data Analysis',
    difficulty: 'intermediate',
    expectedKeywords: ['pivot table', 'insert', 'data range', 'fields', 'rows', 'columns', 'values'],
    hints: ['Start with selecting your data', 'Use the Insert tab']
  },
  {
    id: '4',
    text: 'What are absolute and relative cell references? When would you use each?',
    category: 'Formulas',
    difficulty: 'beginner',
    expectedKeywords: ['absolute', 'relative', '$', 'dollar sign', 'copying'],
    hints: ['Think about what happens when you copy formulas', 'Remember the $ symbol']
  },
  {
    id: '5',
    text: 'Describe how to use conditional formatting to highlight data.',
    category: 'Formatting',
    difficulty: 'beginner',
    expectedKeywords: ['conditional formatting', 'rules', 'highlight', 'criteria', 'format'],
    hints: ['Look in the Home tab', 'Think about setting conditions for formatting']
  },
  {
    id: '6',
    text: 'How do you create and use named ranges in Excel?',
    category: 'Advanced',
    difficulty: 'intermediate',
    expectedKeywords: ['named range', 'name box', 'formulas tab', 'define name'],
    hints: ['Check the Name Box', 'Look in the Formulas tab']
  },
  {
    id: '7',
    text: 'Explain the INDEX and MATCH functions and their advantages over VLOOKUP.',
    category: 'Functions',
    difficulty: 'advanced',
    expectedKeywords: ['INDEX', 'MATCH', 'array', 'lookup', 'left lookup', 'dynamic'],
    hints: ['Think about lookup limitations', 'Consider lookup direction flexibility']
  },
  {
    id: '8',
    text: 'How would you remove duplicates from a dataset?',
    category: 'Data Cleaning',
    difficulty: 'intermediate',
    expectedKeywords: ['remove duplicates', 'data tab', 'unique', 'filter'],
    hints: ['Check the Data tab', 'Think about built-in tools vs formulas']
  },
  {
    id: '9',
    text: 'What is the purpose of Excel macros and how do you create one?',
    category: 'Automation',
    difficulty: 'advanced',
    expectedKeywords: ['macro', 'VBA', 'record', 'automate', 'developer tab'],
    hints: ['Think about repetitive tasks', 'Consider the Developer tab']
  },
  {
    id: '10',
    text: 'How do you protect cells and worksheets in Excel?',
    category: 'Security',
    difficulty: 'intermediate',
    expectedKeywords: ['protect', 'password', 'lock cells', 'review tab', 'unprotect'],
    hints: ['Look in the Review tab', 'Think about two-step process']
  },
  {
    id: '11',
    text: 'Explain how to use data validation in Excel.',
    category: 'Data Quality',
    difficulty: 'intermediate',
    expectedKeywords: ['data validation', 'dropdown', 'criteria', 'input message', 'error alert'],
    hints: ['Find it in the Data tab', 'Think about controlling user input']
  },
  {
    id: '12',
    text: 'What are the different chart types available in Excel and when to use each?',
    category: 'Visualization',
    difficulty: 'beginner',
    expectedKeywords: ['chart', 'column', 'line', 'pie', 'scatter', 'bar'],
    hints: ['Think about data types', 'Consider what story you want to tell']
  },
  {
    id: '13',
    text: 'How do you use Excel\'s Goal Seek feature?',
    category: 'Analysis',
    difficulty: 'advanced',
    expectedKeywords: ['goal seek', 'what-if', 'target value', 'variable cell'],
    hints: ['Look in the Data tab', 'Think about working backwards from a result']
  },
  {
    id: '14',
    text: 'Explain how to create and use Excel tables (ListObjects).',
    category: 'Data Management',
    difficulty: 'intermediate',
    expectedKeywords: ['table', 'structured references', 'filter', 'sort', 'format as table'],
    hints: ['Consider the benefits over regular ranges', 'Think about dynamic ranges']
  },
  {
    id: '15',
    text: 'How would you handle circular references in Excel?',
    category: 'Troubleshooting',
    difficulty: 'advanced',
    expectedKeywords: ['circular reference', 'iterative calculation', 'error', 'trace'],
    hints: ['Think about formulas that reference themselves', 'Consider calculation options']
  }
]

// Utility functions for working with questions
export const getQuestionsByDifficulty = (difficulty: Question['difficulty']): Question[] => {
  return questions.filter(q => q.difficulty === difficulty)
}

export const getQuestionsByCategory = (category: string): Question[] => {
  return questions.filter(q => q.category === category)
}

export const getRandomQuestions = (count: number, difficulty?: Question['difficulty']): Question[] => {
  let pool = difficulty ? getQuestionsByDifficulty(difficulty) : questions
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export const categories = Array.from(new Set(questions.map(q => q.category)))
export const difficulties: Question['difficulty'][] = ['beginner', 'intermediate', 'advanced']