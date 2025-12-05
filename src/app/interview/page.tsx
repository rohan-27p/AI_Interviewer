'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CodeEditor from '@/components/CodeEditor';
import VoiceInterface from '@/components/VoiceInterface';
import { Message, InterviewState, Question } from '@/lib/types';
import { Square, Mic, Loader2, XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Interview config type
interface InterviewConfig {
    type: string;
    topics: string[];
    difficulty: string;
    questionCount: number;
}

// Helper function to safely stringify values for display
const stringify = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
};

// Dynamic system prompts based on interview type
const getSystemPrompt = (question: Question | null, config: InterviewConfig): Message => {
    const basePrompt = config.type === 'dsa'
        ? `You are an expert technical interviewer conducting a live coding interview.

CURRENT QUESTION: ${question ? question.title : 'No question loaded yet'}
${question ? `DESCRIPTION: ${question.description}` : ''}

YOUR ROLE:
- Assess the candidate's problem-solving approach and coding skills
- Be professional, encouraging, and conversational
- If the candidate is stuck, give subtle hints without revealing the answer
- Ask clarifying questions about their approach and complexity analysis
- Keep responses concise (1-2 sentences max) to maintain natural flow
- When they solve correctly, congratulate them and ask about time/space complexity
- If they say "next question", "move on", or "I'm done", acknowledge and prepare to transition`
        : `You are an expert ${config.type.toUpperCase()} technical interviewer.

CURRENT TOPIC: ${question ? question.title : 'General ${config.type} concepts'}
${question ? `FOCUS: ${question.description}` : ''}

YOUR ROLE:
- Conduct a conversational technical interview about ${config.type} development
- Ask conceptual questions, discuss best practices, and explore their experience
- For coding-related answers, you may ask them to explain code snippets verbally
- Be professional, encouraging, and maintain a natural interview flow
- Probe deeper when they give surface-level answers
- Keep responses concise (1-2 sentences max)
- If they want to move on, acknowledge and transition smoothly`;

    return {
        role: 'system',
        content: basePrompt + '\n\nIMPORTANT: Keep your responses SHORT and CONVERSATIONAL like a real interview.'
    };
};

function InterviewContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Parse config from URL
    const config: InterviewConfig = {
        type: searchParams.get('type') || 'dsa',
        topics: searchParams.get('topics')?.split(',').filter(Boolean) || [],
        difficulty: searchParams.get('difficulty') || 'medium',
        questionCount: parseInt(searchParams.get('questions') || '3')
    };

    const isDSA = config.type === 'dsa';

    // State
    const [messages, setMessages] = useState<Message[]>([]);
    const [interviewState, setInterviewState] = useState<InterviewState>('idle');
    const [code, setCode] = useState<string>('# Write your solution here\n\n');
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [previousQuestions, setPreviousQuestions] = useState<string[]>([]);
    const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);
    const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
    const [questionsAnswered, setQuestionsAnswered] = useState(0);

    // Refs for audio handling
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    // Refs to prevent duplicate calls (React StrictMode)
    const hasInitialized = useRef(false);
    const lastPlayedQuestionId = useRef<string | null>(null);
    const isFirstQuestion = useRef(true);

    // Initialize audio player on mount - only run once
    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        fetchNewQuestion();
        if (typeof window !== 'undefined') {
            audioPlayerRef.current = new Audio();
        }
    }, []);

    // When question changes, update system prompt (only play intro on first question)
    useEffect(() => {
        if (!currentQuestion) return;

        // Prevent running for the same question twice
        if (lastPlayedQuestionId.current === currentQuestion.title) return;
        lastPlayedQuestionId.current = currentQuestion.title;

        setMessages(prev => [...prev, getSystemPrompt(currentQuestion, config)]);

        if (isDSA) {
            setCode(`# ${currentQuestion.title}\n# Write your solution here\n\ndef solution():\n    pass`);
        }

        // Only play intro on the FIRST question (page load), never again
        if (isFirstQuestion.current) {
            isFirstQuestion.current = false;
            playIntro(currentQuestion);
        }
    }, [currentQuestion]);

    const fetchNewQuestion = async () => {
        setIsLoadingQuestion(true);
        try {
            const response = await fetch('/api/generate-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    interviewType: config.type,
                    topics: config.topics,
                    difficulty: config.difficulty,
                    previousQuestions: previousQuestions
                })
            });

            const data = await response.json();
            if (data.question) {
                setCurrentQuestion(data.question);
            }
        } catch (error) {
            console.error('Error fetching question:', error);
        } finally {
            setIsLoadingQuestion(false);
        }
    };

    // Helper to play audio and reset state when done
    const playAudio = (audioBase64: string) => {
        if (audioPlayerRef.current && audioBase64 && audioBase64.length > 100) {
            audioPlayerRef.current.src = `data:audio/mp3;base64,${audioBase64}`;
            audioPlayerRef.current.onended = () => {
                setInterviewState('idle');
            };
            audioPlayerRef.current.onerror = () => {
                console.error('Audio playback error');
                setInterviewState('idle');
            };
            setInterviewState('speaking');
            audioPlayerRef.current.play().catch((err) => {
                console.error('Play error:', err);
                setInterviewState('idle');
            });
        } else {
            setInterviewState('idle');
        }
    };

    // Play AI intro when question loads (only called on first question)
    const playIntro = async (question: Question, retryCount = 0) => {
        try {
            setInterviewState('processing');

            const response = await fetch('/api/generate-intro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, interviewType: config.type })
            });

            const data = await response.json();
            const { introText, audioBase64 } = data;

            // Add the intro to messages only on first attempt
            if (introText && retryCount === 0) {
                setMessages(prev => [
                    ...prev,
                    { role: 'assistant', content: introText }
                ]);
            }

            // Play the audio if valid
            if (audioBase64 && audioBase64.length > 100) {
                playAudio(audioBase64);
            } else if (retryCount < 1) {
                console.log('No audio received, retrying...');
                setTimeout(() => playIntro(question, 1), 1000);
            } else {
                setInterviewState('idle');
            }
        } catch (error) {
            console.error('Error playing intro:', error);
            if (retryCount < 1) {
                setTimeout(() => playIntro(question, 1), 1000);
            } else {
                setInterviewState('idle');
            }
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = processAudioTurn;
            mediaRecorder.start();
            setInterviewState('listening');
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && interviewState === 'listening') {
            mediaRecorderRef.current.stop();
            if (mediaRecorderRef.current.stream) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
        }
    };

    const processAudioTurn = async () => {
        setInterviewState('processing');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('history', JSON.stringify(messages));
        formData.append('code', code);
        formData.append('currentQuestionTitle', currentQuestion?.title || '');
        formData.append('previousQuestions', JSON.stringify(previousQuestions));
        formData.append('interviewType', config.type);
        formData.append('topics', config.topics.join(','));

        try {
            const response = await fetch('/api/process-turn', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('API processing failed');

            const data = await response.json();
            const { transcript, reply, audioBase64, newQuestion } = data;

            setMessages(prev => [
                ...prev,
                { role: 'user', content: transcript },
                { role: 'assistant', content: reply }
            ]);

            // Handle new question if generated
            if (newQuestion) {
                setPreviousQuestions(prev =>
                    currentQuestion ? [...prev, currentQuestion.title] : prev
                );
                setCurrentQuestion(newQuestion);
                setQuestionsAnswered(prev => prev + 1);
            }

            // Play the audio response
            playAudio(audioBase64);

        } catch (error) {
            console.error("Turn processing error:", error);
            setInterviewState('idle');
            alert("Something went wrong processing your response.");
        }
    };

    const endInterview = async () => {
        if (!confirm('Are you sure you want to end the interview? This will generate your feedback report.')) {
            return;
        }

        setIsGeneratingFeedback(true);

        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages,
                    questions: [currentQuestion?.title, ...previousQuestions].filter(Boolean),
                    interviewType: config.type
                })
            });

            if (!response.ok) throw new Error('Failed to generate feedback');

            const data = await response.json();
            const { uid, feedback } = data;

            const encodedFeedback = encodeURIComponent(JSON.stringify(feedback));
            router.push(`/feedback?uid=${uid}&data=${encodedFeedback}`);
        } catch (error) {
            console.error('Error generating feedback:', error);
            alert('Failed to generate feedback. Please try again.');
            setIsGeneratingFeedback(false);
        }
    };

    // Format interview type for display
    const formatType = (type: string) => {
        const typeMap: Record<string, string> = {
            dsa: 'DSA',
            frontend: 'Frontend',
            backend: 'Backend',
            fullstack: 'Fullstack',
            cybersecurity: 'Cybersecurity',
            devops: 'DevOps'
        };
        return typeMap[type] || type;
    };

    return (
        <div className="h-screen w-full bg-[#0d0d0f] text-white flex overflow-hidden">
            {/* LEFT: Problem/Question Panel */}
            <div className="w-[320px] min-w-[280px] flex flex-col border-r border-[#2a2a2e] bg-[#0d0d0f]">
                {/* Header */}
                <div className="px-5 py-4 border-b border-[#2a2a2e] flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-[#6b6b70] uppercase tracking-wider">
                            {isDSA ? 'Question' : 'Topic'}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400">
                                {formatType(config.type)}
                            </span>
                            <span className="text-xs text-[#6b6b70]">
                                {questionsAnswered + 1}/{config.questionCount}
                            </span>
                        </div>
                    </div>
                    <Link href="/setup" className="text-[#6b6b70] hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                </div>

                {/* Problem Content */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {isLoadingQuestion ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3">
                            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                            <p className="text-sm text-[#6b6b70]">Generating {isDSA ? 'question' : 'topic'}...</p>
                        </div>
                    ) : currentQuestion ? (
                        <>
                            <div className="flex items-center gap-2 mb-3">
                                <h2 className="text-lg font-semibold text-white">{currentQuestion.title}</h2>
                                <span className={`text-xs px-2 py-0.5 rounded ${currentQuestion.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                                    currentQuestion.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                                    }`}>
                                    {currentQuestion.difficulty}
                                </span>
                            </div>

                            <div className="text-sm text-[#b8b8bc] leading-relaxed space-y-4" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                                <p>{currentQuestion.description}</p>
                            </div>

                            {/* Constraints (DSA only) */}
                            {isDSA && currentQuestion.constraints && currentQuestion.constraints.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-sm font-semibold text-white mb-3">Constraints</h3>
                                    <ul className="text-sm text-[#b8b8bc] space-y-1.5">
                                        {currentQuestion.constraints.map((c, i) => (
                                            <li key={i}>• {stringify(c)}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Examples (DSA only) */}
                            {isDSA && currentQuestion.examples && currentQuestion.examples.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-sm font-semibold text-white mb-3">Examples</h3>
                                    {currentQuestion.examples.map((ex, i) => (
                                        <div key={i} className="bg-[#1a1a1e] rounded-lg p-3 font-mono text-xs text-[#a0a0a5] mb-3">
                                            <div><span className="text-[#6b6b70]">Input:</span> {stringify(ex.input)}</div>
                                            <div className="mt-1"><span className="text-[#6b6b70]">Output:</span> {stringify(ex.output)}</div>
                                            {ex.explanation && (
                                                <div className="mt-1 text-[#6b6b70]">{stringify(ex.explanation)}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Key Points (Non-DSA) */}
                            {!isDSA && (
                                <div className="mt-6 p-4 bg-[#1a1a1e] rounded-lg">
                                    <h3 className="text-sm font-semibold text-white mb-2">Interview Tips</h3>
                                    <ul className="text-xs text-[#6b6b70] space-y-1">
                                        <li>• Explain your thought process clearly</li>
                                        <li>• Use specific examples from your experience</li>
                                        <li>• Ask clarifying questions if needed</li>
                                    </ul>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center text-[#6b6b70] py-8">
                            <p>No question loaded</p>
                            <button
                                onClick={fetchNewQuestion}
                                className="mt-3 text-orange-500 hover:text-orange-400 text-sm"
                            >
                                Generate Question
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* MIDDLE: Code Editor or Conversation Panel */}
            <div className="flex-1 flex flex-col bg-[#1e1e1e]">
                <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3c3c3c]">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-[#cccccc]">
                            {isDSA ? 'Python' : 'Notes (Optional)'}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-[#3dc9b0] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3dc9b0] animate-pulse"></span>
                            Auto-saved
                        </span>
                        <button
                            onClick={endInterview}
                            disabled={isGeneratingFeedback || messages.length < 2}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isGeneratingFeedback
                                ? 'bg-red-500/50 cursor-wait'
                                : messages.length < 2
                                    ? 'bg-[#3a3a3e] text-[#6b6b70] cursor-not-allowed'
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                                }`}
                        >
                            {isGeneratingFeedback ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating Feedback...
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-4 h-4" />
                                    End Interview
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex-1 relative">
                    {isDSA ? (
                        <CodeEditor code={code} onChange={setCode} />
                    ) : (
                        <div className="h-full p-4">
                            <textarea
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Use this space for notes, code snippets, or to organize your thoughts..."
                                className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm resize-none focus:outline-none placeholder-[#6b6b70]"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Interviewer Panel */}
            <div className="w-[280px] min-w-[240px] bg-[#141416] flex flex-col border-l border-[#2a2a2e]">
                {/* Interviewer Avatar */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 border-b border-[#2a2a2e]">
                    <div className="relative">
                        {interviewState === 'speaking' && (
                            <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping"></div>
                        )}

                        <div className={`w-24 h-24 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${interviewState === 'speaking'
                            ? 'border-orange-500 shadow-lg shadow-orange-500/30'
                            : 'border-[#3a3a3e] bg-[#1f1f23]'
                            }`}>
                            <svg className="w-12 h-12 text-[#6b6b70]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                        </div>
                    </div>

                    <p className="mt-4 text-sm font-medium text-white">AI Interviewer</p>
                    <p className="text-xs text-[#6b6b70]">{formatType(config.type)} Expert</p>

                    {interviewState === 'speaking' && (
                        <div className="mt-2 flex items-center gap-0.5">
                            {[1, 2, 3, 4].map((i) => (
                                <span
                                    key={i}
                                    className="w-1 bg-orange-400 rounded-full animate-pulse"
                                    style={{ height: `${8 + (i % 3) * 6}px`, animationDelay: `${i * 0.1}s` }}
                                ></span>
                            ))}
                        </div>
                    )}
                </div>

                {/* User Controls */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#141416] to-[#0d0d0f]">
                    <VoiceInterface state={interviewState} />

                    <div className="mt-6 flex flex-col items-center gap-3">
                        {interviewState === 'listening' ? (
                            <button
                                onClick={stopRecording}
                                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 transition-all hover:scale-105"
                            >
                                <Square className="w-5 h-5 fill-current" />
                            </button>
                        ) : (
                            <button
                                onClick={startRecording}
                                disabled={interviewState === 'processing' || interviewState === 'speaking' || isLoadingQuestion}
                                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 ${interviewState === 'processing' || interviewState === 'speaking' || isLoadingQuestion
                                    ? 'bg-[#3a3a3e] cursor-not-allowed text-[#6b6b70]'
                                    : 'bg-orange-500 hover:bg-orange-400 text-white shadow-orange-500/30'
                                    }`}
                            >
                                <Mic className="w-6 h-6" />
                            </button>
                        )}

                        <p className="text-[#6b6b70] text-xs font-medium">
                            {isLoadingQuestion && "Loading..."}
                            {!isLoadingQuestion && interviewState === 'idle' && "Click to speak"}
                            {interviewState === 'listening' && "Listening..."}
                            {interviewState === 'processing' && "Processing..."}
                            {interviewState === 'speaking' && "Speaking..."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function InterviewPage() {
    return (
        <Suspense fallback={
            <div className="h-screen w-full bg-[#0d0d0f] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        }>
            <InterviewContent />
        </Suspense>
    );
}