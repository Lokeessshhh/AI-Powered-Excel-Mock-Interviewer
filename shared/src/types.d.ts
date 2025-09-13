export type QuestionDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type QuestionCategory = 'basics' | 'formulas' | 'analysis' | 'visualization' | 'macros';
export type SessionStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned';
export interface Question {
    id: string;
    text: string;
    category: QuestionCategory;
    difficulty: QuestionDifficulty;
    expectedAnswer: string;
    hints?: string[];
    timeLimit?: number;
}
export interface Answer {
    questionId: string;
    text: string;
    submittedAt: Date;
    timeSpent: number;
}
export interface QuestionScore {
    questionId: string;
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
}
export interface Evaluation {
    sessionId: string;
    overallScore: number;
    questionScores: QuestionScore[];
    completedAt: Date;
    feedback: string;
    recommendations?: string[];
}
export interface Session {
    id: string;
    userId: string;
    questions: Question[];
    currentQuestionIndex: number;
    status: SessionStatus;
    startedAt: Date;
    completedAt?: Date;
    answers: Answer[];
    evaluation: Evaluation | null;
    settings?: SessionSettings;
}
export interface SessionSettings {
    difficulty: QuestionDifficulty;
    categories: QuestionCategory[];
    questionCount: number;
    timeLimit?: number;
}
export interface User {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
    sessions: string[];
}
export interface CreateSessionRequest {
    userId: string;
    settings?: Partial<SessionSettings>;
}
export interface CreateSessionResponse {
    session: Session;
}
export interface SubmitAnswerRequest {
    sessionId: string;
    questionId: string;
    answer: string;
    timeSpent: number;
}
export interface SubmitAnswerResponse {
    success: boolean;
    nextQuestion?: Question;
    isComplete: boolean;
}
export interface GetEvaluationRequest {
    sessionId: string;
}
export interface GetEvaluationResponse {
    evaluation: Evaluation;
}
export interface APIError {
    error: string;
    message: string;
    code?: string;
    details?: unknown;
}
export type SessionSummary = Pick<Session, 'id' | 'status' | 'startedAt' | 'completedAt'> & {
    questionCount: number;
    overallScore?: number;
};
export type QuestionSummary = Pick<Question, 'id' | 'text' | 'category' | 'difficulty'>;
//# sourceMappingURL=types.d.ts.map