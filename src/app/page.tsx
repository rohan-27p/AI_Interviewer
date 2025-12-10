'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Mic, Code, Brain, Zap, Target, Trophy } from 'lucide-react';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Navigation */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                        <Mic className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold">InterviewAI</span>
                </div>
                <Link
                    href="/dashboard"
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-sm font-medium"
                >
                    Get Started
                </Link>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
                <div className="text-center max-w-4xl mx-auto">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full mb-8">
                        <Zap className="w-4 h-4 text-orange-400" />
                        <span className="text-sm text-orange-300">AI-Powered Interview Practice</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
                        Prepare for Interviews
                        <span className="block bg-gradient-to-r from-orange-400 via-orange-500 to-purple-500 bg-clip-text text-transparent">
                            Like Never Before
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-xl text-[#a0a0a5] max-w-2xl mx-auto mb-10">
                        Practice with an AI interviewer that listens, responds, and gives you real-time feedback.
                        Master DSA, Frontend, Backend, and more.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex items-center justify-center gap-4">
                        <Link
                            href="/dashboard"
                            className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40"
                        >
                            Start Practicing
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32">
                    <FeatureCard
                        icon={<Mic className="w-6 h-6" />}
                        title="Voice-Based Interviews"
                        description="Talk naturally with our AI interviewer. Practice explaining your thought process out loud."
                        color="orange"
                    />
                    <FeatureCard
                        icon={<Code className="w-6 h-6" />}
                        title="Live Code Editor"
                        description="Write and test your code in a real editor while the AI watches and provides hints."
                        color="purple"
                    />
                    <FeatureCard
                        icon={<Brain className="w-6 h-6" />}
                        title="Personalized Practice"
                        description="Choose your focus area: DSA, Frontend, Backend, Fullstack, Cybersecurity, and more."
                        color="blue"
                    />
                </div>

                {/* Interview Types Preview */}
                <div className="mt-32 text-center">
                    <h2 className="text-3xl font-bold mb-4">Master Any Interview</h2>
                    <p className="text-[#a0a0a5] mb-12">Practice for the exact role you're targeting</p>

                    <div className="flex flex-wrap justify-center gap-3">
                        {['DSA', 'Frontend', 'Backend', 'Fullstack', 'Cybersecurity', 'DevOps', 'System Design'].map((type) => (
                            <span
                                key={type}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:border-orange-500/50 hover:bg-orange-500/10 transition-all cursor-default"
                            >
                                {type}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-8 mt-32 max-w-3xl mx-auto">
                    <StatCard icon={<Target className="w-8 h-8" />} value="50+" label="Question Types" />
                    <StatCard icon={<Mic className="w-8 h-8" />} value="Real" label="Voice AI" />
                    <StatCard icon={<Trophy className="w-8 h-8" />} value="Instant" label="Feedback" />
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/10 py-8">
                <div className="max-w-7xl mx-auto px-8 text-center text-[#6b6b70] text-sm">
                    Built by Rohan to help you ace your next interview
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) {
    const colorClasses = {
        orange: 'bg-orange-500/20 text-orange-400 border-orange-500/20',
        purple: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
        blue: 'bg-blue-500/20 text-blue-400 border-blue-500/20'
    };

    return (
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all group">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
                {icon}
            </div>
            <h3 className="text-lg font-semibold mb-2 group-hover:text-orange-400 transition-colors">{title}</h3>
            <p className="text-[#a0a0a5] text-sm leading-relaxed">{description}</p>
        </div>
    );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
    return (
        <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 border border-white/10 rounded-2xl mb-3 text-orange-400">
                {icon}
            </div>
            <div className="text-2xl font-bold mb-1">{value}</div>
            <div className="text-sm text-[#6b6b70]">{label}</div>
        </div>
    );
}
