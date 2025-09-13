import { Question } from '@shared/types'

export const questions: Question[] = [
  {
    id: 'q1',
    text: 'What is the difference between a workbook and a worksheet in Excel?',
    category: 'Basics',
    difficulty: 'beginner',
    expectedAnswer: 'A workbook is the entire Excel file that can contain multiple worksheets. A worksheet is an individual tab/sheet within the workbook containing cells, rows, and columns.',
    keywords: ['workbook', 'worksheet', 'file', 'tab', 'sheet', 'multiple', 'container'],
    hints: ['Think about the file structure', 'Consider what you see at the bottom tabs']
  },
  {
    id: 'q2',
    text: 'Explain how to use VLOOKUP function with an example.',
    category: 'Functions',
    difficulty: 'intermediate',
    expectedAnswer: 'VLOOKUP searches for a value in the first column of a range and returns a corresponding value from another column. Syntax: =VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])',
    keywords: ['VLOOKUP', 'lookup_value', 'table_array', 'col_index_num', 'range_lookup', 'FALSE', 'TRUE', 'exact match'],
    hints: ['Remember the 4 parameters', 'Think about exact vs approximate match']
  },
  {
    id: 'q3',
    text: 'How would you create a pivot table from raw data?',
    category: 'Data Analysis',
    difficulty: 'intermediate',
    expectedAnswer: 'Select the data range, go to Insert tab > PivotTable, choose data source and destination, then drag fields to Rows, Columns, Values, and Filters areas as needed.',
    keywords: ['pivot table', 'Insert', 'data range', 'fields', 'rows', 'columns', 'values', 'filters', 'drag'],
    hints: ['Start with selecting your data', 'Use the Insert tab']
  },
  {
    id: 'q4',
    text: 'What are absolute and relative cell references? When would you use each?',
    category: 'Formulas',
    difficulty: 'beginner',
    expectedAnswer: 'Relative references (A1) change when copied to other cells. Absolute references ($A$1) stay fixed. Use relative for formulas that should adjust, absolute for fixed references like constants.',
    keywords: ['absolute', 'relative', 'references', '$', 'dollar sign', 'copying', 'fixed', 'adjust'],
    hints: ['Think about what happens when you copy formulas', 'Remember the $ symbol']
  },
  {
    id: 'q5',
    text: 'Describe how to use conditional formatting to highlight data.',
    category: 'Formatting',
    difficulty: 'beginner',
    expectedAnswer: 'Select the data range, go to Home tab > Conditional Formatting, choose a rule type (highlight cells, data bars, color scales, etc.), set the condition and format.',
    keywords: ['conditional formatting', 'Home tab', 'rules', 'highlight', 'criteria', 'format', 'condition'],
    hints: ['Look in the Home tab', 'Think about setting conditions for formatting']
  },
  {
    id: 'q6',
    text: 'How do you create and use named ranges in Excel?',
    category: 'Advanced',
    difficulty: 'intermediate',
    expectedAnswer: 'Select the range, use the Name Box or Formulas tab > Define Name. Named ranges make formulas more readable and easier to manage, like =SUM(SalesData) instead of =SUM(A1:A10).',
    keywords: ['named range', 'Name Box', 'Formulas tab', 'Define Name', 'readable', 'manage'],
    hints: ['Check the Name Box', 'Look in the Formulas tab']
  },
  {
    id: 'q7',
    text: 'Explain the INDEX and MATCH functions and their advantages over VLOOKUP.',
    category: 'Functions',
    difficulty: 'advanced',
    expectedAnswer: 'INDEX returns a value at a specific position, MATCH finds the position of a value. Together they can lookup left, are more flexible than VLOOKUP, and perform better on large datasets.',
    keywords: ['INDEX', 'MATCH', 'position', 'lookup left', 'flexible', 'performance', 'combination'],
    hints: ['Think about lookup limitations', 'Consider lookup direction flexibility']
  },
  {
    id: 'q8',
    text: 'How would you remove duplicates from a dataset?',
    category: 'Data Cleaning',
    difficulty: 'intermediate',
    expectedAnswer: 'Use Data tab > Remove Duplicates tool, or use advanced filtering with "Unique records only", or create a pivot table to see unique values.',
    keywords: ['remove duplicates', 'Data tab', 'unique', 'advanced filter', 'pivot table'],
    hints: ['Check the Data tab', 'Think about built-in tools vs formulas']
  },
  {
    id: 'q9',
    text: 'What is the purpose of Excel macros and how do you create one?',
    category: 'Automation',
    difficulty: 'advanced',
    expectedAnswer: 'Macros automate repetitive tasks using VBA code. Create by enabling Developer tab, clicking Record Macro, performing actions, then stopping recording. Can also write VBA code directly.',
    keywords: ['macro', 'VBA', 'automate', 'repetitive', 'Developer tab', 'Record Macro', 'code'],
    hints: ['Think about repetitive tasks', 'Consider the Developer tab']
  },
  {
    id: 'q10',
    text: 'How do you protect cells and worksheets in Excel?',
    category: 'Security',
    difficulty: 'intermediate',
    expectedAnswer: 'First unlock cells you want editable (Format Cells > Protection), then protect the worksheet (Review tab > Protect Sheet) with a password. This locks all cells except unlocked ones.',
    keywords: ['protect', 'unlock', 'Format Cells', 'Protection', 'Review tab', 'Protect Sheet', 'password', 'lock'],
    hints: ['Look in the Review tab', 'Think about two-step process']
  },
  {
    id: 'q11',
    text: 'Explain how to use data validation in Excel.',
    category: 'Data Quality',
    difficulty: 'intermediate',
    expectedAnswer: 'Select cells, go to Data tab > Data Validation, set validation criteria (list, number range, date, etc.), add input message and error alert to guide users.',
    keywords: ['data validation', 'Data tab', 'criteria', 'list', 'range', 'input message', 'error alert'],
    hints: ['Find it in the Data tab', 'Think about controlling user input']
  },
  {
    id: 'q12',
    text: 'What are the different chart types available in Excel and when to use each?',
    category: 'Visualization',
    difficulty: 'beginner',
    expectedAnswer: 'Column charts for comparisons, Line charts for trends over time, Pie charts for parts of a whole, Scatter plots for correlation, Bar charts for horizontal comparisons.',
    keywords: ['column chart', 'line chart', 'pie chart', 'scatter plot', 'bar chart', 'comparison', 'trends', 'correlation'],
    hints: ['Think about data types', 'Consider what story you want to tell']
  },
  {
    id: 'q13',
    text: 'How do you use Excel\'s Goal Seek feature?',
    category: 'Analysis',
    difficulty: 'advanced',
    expectedAnswer: 'Data tab > What-If Analysis > Goal Seek. Specify the formula cell, desired result value, and variable cell to change. Excel will find the input value needed to achieve the target.',
    keywords: ['Goal Seek', 'What-If Analysis', 'Data tab', 'formula cell', 'target value', 'variable cell'],
    hints: ['Look in the Data tab under What-If Analysis', 'Think about working backwards from a result']
  },
  {
    id: 'q14',
    text: 'Explain how to create and use Excel tables (ListObjects).',
    category: 'Data Management',
    difficulty: 'intermediate',
    expectedAnswer: 'Select data and press Ctrl+T or Insert tab > Table. Tables provide structured references, automatic filtering, easy formatting, and dynamic ranges that expand with new data.',
    keywords: ['table', 'Ctrl+T', 'Insert tab', 'structured references', 'filtering', 'dynamic range', 'expand'],
    hints: ['Think about Ctrl+T shortcut', 'Consider the benefits over regular ranges']
  },
  {
    id: 'q15',
    text: 'How would you handle circular references in Excel?',
    category: 'Troubleshooting',
    difficulty: 'advanced',
    expectedAnswer: 'Identify circular references using Formulas tab > Error Checking. Fix by breaking the circular logic, or enable iterative calculation in File > Options > Formulas if intentional.',
    keywords: ['circular reference', 'Formulas tab', 'Error Checking', 'iterative calculation', 'File Options'],
    hints: ['Check Formulas tab for error tools', 'Consider if the circular reference is intentional']
  }
]

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