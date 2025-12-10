'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mic, Trophy, Target, Clock, ArrowRight, LogOut, User, BookOpen, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    total_interviews: number;
    total_questions_solved: number;
    average_score: number;
    created_at: string;
}

interface InterviewSession {
    id: string;
    interview_type: string;
    difficulty: string;
    status: string;
    started_at: string;
    completed_at: string | null;
    duration_seconds: number | null;
}

interface FeedbackReport {
    id: string;
    overall_score: number;
    overall_verdict: string;
    created_at: string;
    session_id: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const supabase = createClient();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [feedback, setFeedback] = useState<FeedbackReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Load user profile
            const { data: profileData } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            setProfile(profileData);

            // Load recent sessions (last 5)
            const { data: sessionsData } = await supabase
                .from('interview_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            setSessions(sessionsData || []);

            // Load recent feedback
            const { data: feedbackData } = await supabase
                .from('feedback_reports')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            setFeedback(feedbackData || []);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0b] text-white flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white">
            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Header */}
            <nav className="relative z-10 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                            <Mic className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold">InterviewAI</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                {/* Welcome Section */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold mb-2">
                        Welcome back, {profile?.full_name || 'there'}! 👋
                    </h1>
                    <p className="text-[#a0a0a5]">Track your progress and continue practicing</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <StatCard
                        icon={<Trophy className="w-6 h-6" />}
                        label="Total Interviews"
                        value={profile?.total_interviews || 0}
                        color="orange"
                    />
                    <StatCard
                        icon={<Target className="w-6 h-6" />}
                        label="Questions Solved"
                        value={profile?.total_questions_solved || 0}
                        color="purple"
                    />
                    <StatCard
                        icon={<TrendingUp className="w-6 h-6" />}
                        label="Average Score"
                        value={`${profile?.average_score?.toFixed(1) || '0.0'}/10`}
                        color="blue"
                    />
                    <StatCard
                        icon={<BookOpen className="w-6 h-6" />}
                        label="Active Sessions"
                        value={sessions.filter(s => s.status === 'active').length}
                        color="green"
                    />
                </div>

                {/* Quick Actions */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link
                            href="/setup"
                            className="group p-6 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 hover:border-orange-500/40 rounded-2xl transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold mb-1 group-hover:text-orange-400 transition-colors">
                                        Start New Interview
                                    </h3>
                                    <p className="text-sm text-[#a0a0a5]">Practice with AI interviewer</p>
                                </div>
                                <ArrowRight className="w-6 h-6 text-orange-400 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                        <Link
                            href="/feedback"
                            className="group p-6 bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold mb-1 group-hover:text-purple-400 transition-colors">
                                        View Feedback
                                    </h3>
                                    <p className="text-sm text-[#a0a0a5]">Review your performance</p>
                                </div>
                                <ArrowRight className="w-6 h-6 text-purple-400 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Recent Sessions */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">Recent Interview Sessions</h2>
                    {sessions.length === 0 ? (
                        <div className="p-12 bg-white/5 border border-white/10 rounded-2xl text-center">
                            <Clock className="w-12 h-12 text-[#6b6b70] mx-auto mb-4" />
                            <p className="text-[#a0a0a5] mb-4">No interviews yet</p>
                            <Link
                                href="/setup"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 rounded-xl font-semibold transition-all"
                            >
                                Start Your First Interview
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sessions.map((session) => (
                                <SessionCard key={session.id} session={session} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Feedback */}
                {feedback.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Recent Feedback</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {feedback.map((fb) => (
                                <FeedbackCard key={fb.id} feedback={fb} />
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
    const colorClasses = {
        orange: 'bg-orange-500/20 text-orange-400 border-orange-500/20',
        purple: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
        blue: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
        green: 'bg-green-500/20 text-green-400 border-green-500/20',
    };

    return (
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
                {icon}
            </div>
            <div className="text-3xl font-bold mb-1">{value}</div>
            <div className="text-sm text-[#a0a0a5]">{label}</div>
        </div>
    );
}

function SessionCard({ session }: { session: InterviewSession }) {
    const statusColors = {
        active: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        completed: 'bg-green-500/10 text-green-400 border-green-500/20',
        abandoned: 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return 'N/A';
        const mins = Math.floor(seconds / 60);
        return `${mins} min`;
    };

    return (
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="font-semibold text-lg mb-1">{session.interview_type}</h3>
                    <p className="text-sm text-[#a0a0a5]">{session.difficulty} • {new Date(session.started_at).toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[session.status as keyof typeof statusColors]}`}>
                    {session.status}
                </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-[#a0a0a5]">
                <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuration(session.duration_seconds)}
                </div>
            </div>
        </div>
    );
}

function FeedbackCard({ feedback }: { feedback: FeedbackReport }) {
    const verdictColors = {
        'Strong Hire': 'text-green-400',
        'Hire': 'text-green-500',
        'Lean Hire': 'text-blue-400',
        'Lean No Hire': 'text-orange-400',
        'No Hire': 'text-red-400',
    };

    return (
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <div className="text-4xl font-bold mb-2">{feedback.overall_score}/10</div>
            <div className={`text-sm font-medium mb-2 ${verdictColors[feedback.overall_verdict as keyof typeof verdictColors]}`}>
                {feedback.overall_verdict}
            </div>
            <div className="text-xs text-[#6b6b70]">
                {new Date(feedback.created_at).toLocaleDateString()}
            </div>
        </div>
    );
}
