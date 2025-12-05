'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Trophy, Target, MessageSquare, Lightbulb, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface FeedbackData {
    overallScore: number;
    overallVerdict: string;
    summary: string;
    strengths: string[];
    areasForImprovement: string[];
    technicalSkills: { score: number; feedback: string };
    problemSolving: { score: number; feedback: string };
    communication: { score: number; feedback: string };
    recommendations: string[];
}

function ScoreCircle({ score, label }: { score: number; label: string }) {
    const getColor = (s: number) => {
        if (s >= 8) return 'text-green-400 border-green-400';
        if (s >= 6) return 'text-yellow-400 border-yellow-400';
        return 'text-red-400 border-red-400';
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center ${getColor(score)}`}>
                <span className="text-2xl font-bold">{score}</span>
            </div>
            <span className="text-sm text-[#b8b8bc]">{label}</span>
        </div>
    );
}

function FeedbackContent() {
    const searchParams = useSearchParams();
    const [feedback, setFeedback] = useState<FeedbackData | null>(null);
    const [loading, setLoading] = useState(true);
    const [uid, setUid] = useState<string>('');

    useEffect(() => {
        const feedbackData = searchParams.get('data');
        const feedbackUid = searchParams.get('uid');

        if (feedbackData) {
            try {
                const parsed = JSON.parse(decodeURIComponent(feedbackData));
                setFeedback(parsed);
                setUid(feedbackUid || '');
            } catch (e) {
                console.error('Failed to parse feedback:', e);
            }
        }
        setLoading(false);
    }, [searchParams]);

    const getVerdictColor = (verdict: string) => {
        if (verdict.includes('Strong Hire') || verdict.includes('Hire')) return 'text-green-400 bg-green-500/20';
        if (verdict.includes('Lean')) return 'text-yellow-400 bg-yellow-500/20';
        return 'text-red-400 bg-red-500/20';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!feedback) {
        return (
            <div className="min-h-screen bg-[#0d0d0f] flex flex-col items-center justify-center text-white">
                <p className="text-xl mb-4">No feedback data found</p>
                <Link href="/" className="text-orange-500 hover:text-orange-400">
                    ← Return to Interview
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0d0d0f] text-white">
            {/* Header */}
            <div className="border-b border-[#2a2a2e] px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-[#6b6b70] hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span>New Interview</span>
                    </Link>
                    <div className="text-xs text-[#6b6b70]">
                        Feedback ID: {uid}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Overall Score Card */}
                <div className="bg-gradient-to-br from-[#1a1a1e] to-[#141416] rounded-2xl p-8 mb-8 border border-[#2a2a2e]">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="flex flex-col items-center">
                            <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center ${feedback.overallScore >= 8 ? 'border-green-400 text-green-400' :
                                    feedback.overallScore >= 6 ? 'border-yellow-400 text-yellow-400' :
                                        'border-red-400 text-red-400'
                                }`}>
                                <span className="text-5xl font-bold">{feedback.overallScore}</span>
                            </div>
                            <span className="text-sm text-[#6b6b70] mt-2">out of 10</span>
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${getVerdictColor(feedback.overallVerdict)}`}>
                                {feedback.overallVerdict}
                            </span>
                            <h1 className="text-2xl font-bold mt-4 mb-2">Interview Feedback</h1>
                            <p className="text-[#b8b8bc] leading-relaxed">{feedback.summary}</p>
                        </div>
                    </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-[#1a1a1e] rounded-xl p-6 border border-[#2a2a2e]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <Target className="w-5 h-5 text-blue-400" />
                            </div>
                            <h3 className="font-semibold">Technical Skills</h3>
                        </div>
                        <ScoreCircle score={feedback.technicalSkills.score} label="Score" />
                        <p className="text-sm text-[#b8b8bc] mt-4 leading-relaxed">{feedback.technicalSkills.feedback}</p>
                    </div>

                    <div className="bg-[#1a1a1e] rounded-xl p-6 border border-[#2a2a2e]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <Lightbulb className="w-5 h-5 text-purple-400" />
                            </div>
                            <h3 className="font-semibold">Problem Solving</h3>
                        </div>
                        <ScoreCircle score={feedback.problemSolving.score} label="Score" />
                        <p className="text-sm text-[#b8b8bc] mt-4 leading-relaxed">{feedback.problemSolving.feedback}</p>
                    </div>

                    <div className="bg-[#1a1a1e] rounded-xl p-6 border border-[#2a2a2e]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-green-400" />
                            </div>
                            <h3 className="font-semibold">Communication</h3>
                        </div>
                        <ScoreCircle score={feedback.communication.score} label="Score" />
                        <p className="text-sm text-[#b8b8bc] mt-4 leading-relaxed">{feedback.communication.feedback}</p>
                    </div>
                </div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-[#1a1a1e] rounded-xl p-6 border border-[#2a2a2e]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                            </div>
                            <h3 className="font-semibold">Strengths</h3>
                        </div>
                        <ul className="space-y-3">
                            {feedback.strengths.map((strength, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 flex-shrink-0"></span>
                                    <span className="text-sm text-[#b8b8bc]">{strength}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-[#1a1a1e] rounded-xl p-6 border border-[#2a2a2e]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-yellow-400" />
                            </div>
                            <h3 className="font-semibold">Areas for Improvement</h3>
                        </div>
                        <ul className="space-y-3">
                            {feedback.areasForImprovement.map((area, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0"></span>
                                    <span className="text-sm text-[#b8b8bc]">{area}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Recommendations */}
                <div className="bg-gradient-to-br from-orange-500/10 to-[#1a1a1e] rounded-xl p-6 border border-orange-500/20">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-orange-400" />
                        </div>
                        <h3 className="font-semibold">Recommendations for Improvement</h3>
                    </div>
                    <ul className="space-y-3">
                        {feedback.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-xs text-orange-400 flex-shrink-0">
                                    {i + 1}
                                </span>
                                <span className="text-sm text-[#b8b8bc]">{rec}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-400 rounded-lg font-medium transition-colors"
                    >
                        <Trophy className="w-5 h-5" />
                        Start New Interview
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function FeedbackPage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"></div>
            </div>
        }>
            <FeedbackContent />
        </React.Suspense>
    );
}
