export type Message = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

export type InterviewState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface TurnResponse {
    transcript: string;
    reply: string;
    audioBase64: string;
    newQuestion?: Question | null;
}

export interface Question {
    title: string;
    description: string;
    constraints: string[];
    examples: Example[];
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface Example {
    input: string;
    output: string;
    explanation?: string;
}

export interface GenerateQuestionResponse {
    question: Question;
}