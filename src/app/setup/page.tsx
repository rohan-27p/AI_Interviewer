'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Code, Server, Globe, Shield, Cloud, Database, Cpu, Layout } from 'lucide-react';
import Link from 'next/link';

// Interview type configurations
const INTERVIEW_TYPES = [
    { id: 'dsa', name: 'DSA', icon: Code, description: 'Data Structures & Algorithms', color: 'orange' },
    { id: 'frontend', name: 'Frontend', icon: Layout, description: 'React, CSS, JavaScript', color: 'blue' },
    { id: 'backend', name: 'Backend', icon: Server, description: 'APIs, Databases, Node.js', color: 'green' },
    { id: 'fullstack', name: 'Fullstack', icon: Globe, description: 'End-to-end development', color: 'purple' },
    { id: 'cybersecurity', name: 'Cybersecurity', icon: Shield, description: 'Security, Pentesting', color: 'red' },
    { id: 'devops', name: 'DevOps', icon: Cloud, description: 'CI/CD, Docker, Kubernetes', color: 'cyan' },
];

// Topics per interview type
const TOPICS_BY_TYPE: Record<string, string[]> = {
    dsa: ['Arrays', 'Strings', 'Hash Maps', 'Two Pointers', 'Sliding Window', 'Binary Search', 'Trees', 'Graphs', 'Dynamic Programming', 'Recursion', 'Linked Lists', 'Stacks & Queues'],
    frontend: ['React', 'JavaScript', 'TypeScript', 'CSS/SCSS', 'HTML5', 'State Management', 'Performance', 'Testing', 'Accessibility', 'Browser APIs', 'Responsive Design', 'Build Tools'],
    backend: ['REST APIs', 'Node.js', 'Python', 'SQL', 'NoSQL', 'Authentication', 'Caching', 'Microservices', 'Message Queues', 'System Design', 'Security', 'Testing'],
    fullstack: ['React', 'Node.js', 'APIs', 'Databases', 'Authentication', 'Deployment', 'State Management', 'Performance', 'TypeScript', 'Testing', 'DevOps Basics', 'System Design'],
    cybersecurity: ['Network Security', 'Web Security', 'OWASP Top 10', 'Cryptography', 'Penetration Testing', 'Incident Response', 'Security Tools', 'Compliance', 'Threat Modeling', 'Secure Coding'],
    devops: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Azure', 'GCP', 'Terraform', 'Monitoring', 'Linux', 'Networking', 'Scripting', 'GitOps'],
};

const DIFFICULTIES = [
    { id: 'easy', name: 'Easy', description: 'Beginner friendly', color: 'green' },
    { id: 'medium', name: 'Medium', description: 'Standard interview level', color: 'yellow' },
    { id: 'hard', name: 'Hard', description: 'Senior/Staff level', color: 'red' },
];

export default function SetupPage() {
    const router = useRouter();
    const [interviewType, setInterviewType] = useState<string>('dsa');
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [difficulty, setDifficulty] = useState<string>('medium');
    const [questionCount, setQuestionCount] = useState<number>(3);

    const availableTopics = TOPICS_BY_TYPE[interviewType] || [];

    const toggleTopic = (topic: string) => {
        setSelectedTopics(prev =>
            prev.includes(topic)
                ? prev.filter(t => t !== topic)
                : [...prev, topic]
        );
    };

    const selectAllTopics = () => {
        setSelectedTopics(availableTopics);
    };

    const clearTopics = () => {
        setSelectedTopics([]);
    };

    const handleTypeChange = (typeId: string) => {
        setInterviewType(typeId);
        setSelectedTopics([]); // Reset topics when type changes
    };

    const startInterview = () => {
        const params = new URLSearchParams({
            type: interviewType,
            topics: selectedTopics.join(','),
            difficulty: difficulty,
            questions: questionCount.toString()
        });
        router.push(`/interview?${params.toString()}`);
    };

    const getColorClasses = (color: string, isSelected: boolean) => {
        const colors: Record<string, { selected: string; unselected: string }> = {
            orange: { selected: 'border-orange-500 bg-orange-500/20', unselected: 'border-white/10 hover:border-orange-500/50' },
            blue: { selected: 'border-blue-500 bg-blue-500/20', unselected: 'border-white/10 hover:border-blue-500/50' },
            green: { selected: 'border-green-500 bg-green-500/20', unselected: 'border-white/10 hover:border-green-500/50' },
            purple: { selected: 'border-purple-500 bg-purple-500/20', unselected: 'border-white/10 hover:border-purple-500/50' },
            red: { selected: 'border-red-500 bg-red-500/20', unselected: 'border-white/10 hover:border-red-500/50' },
            cyan: { selected: 'border-cyan-500 bg-cyan-500/20', unselected: 'border-white/10 hover:border-cyan-500/50' },
            yellow: { selected: 'border-yellow-500 bg-yellow-500/20', unselected: 'border-white/10 hover:border-yellow-500/50' },
        };
        return colors[color]?.[isSelected ? 'selected' : 'unselected'] || colors.orange.unselected;
    };

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white">
            {/* Header */}
            <div className="border-b border-white/10">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-[#6b6b70] hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Link>
                    <h1 className="text-lg font-semibold">Configure Your Interview</h1>
                    <div className="w-16"></div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">
                {/* Interview Type Selection */}
                <section>
                    <h2 className="text-xl font-bold mb-2">Interview Type</h2>
                    <p className="text-[#6b6b70] text-sm mb-4">Choose the type of interview you want to practice</p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {INTERVIEW_TYPES.map((type) => {
                            const Icon = type.icon;
                            const isSelected = interviewType === type.id;
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => handleTypeChange(type.id)}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${getColorClasses(type.color, isSelected)}`}
                                >
                                    <Icon className={`w-6 h-6 mb-2 ${isSelected ? `text-${type.color}-400` : 'text-[#6b6b70]'}`} />
                                    <div className="font-medium">{type.name}</div>
                                    <div className="text-xs text-[#6b6b70]">{type.description}</div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Topics Selection */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold mb-1">Topics</h2>
                            <p className="text-[#6b6b70] text-sm">Select specific topics to focus on (leave empty for all topics)</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={selectAllTopics} className="text-xs text-orange-400 hover:text-orange-300">Select All</button>
                            <span className="text-[#3a3a3e]">|</span>
                            <button onClick={clearTopics} className="text-xs text-[#6b6b70] hover:text-white">Clear</button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {availableTopics.map((topic) => {
                            const isSelected = selectedTopics.includes(topic);
                            return (
                                <button
                                    key={topic}
                                    onClick={() => toggleTopic(topic)}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-all border ${isSelected
                                            ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                                            : 'border-white/10 text-[#a0a0a5] hover:border-white/30'
                                        }`}
                                >
                                    {topic}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Difficulty Selection */}
                <section>
                    <h2 className="text-xl font-bold mb-2">Difficulty</h2>
                    <p className="text-[#6b6b70] text-sm mb-4">Choose the difficulty level</p>

                    <div className="flex gap-3">
                        {DIFFICULTIES.map((diff) => {
                            const isSelected = difficulty === diff.id;
                            return (
                                <button
                                    key={diff.id}
                                    onClick={() => setDifficulty(diff.id)}
                                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${getColorClasses(diff.color, isSelected)}`}
                                >
                                    <div className="font-medium capitalize">{diff.name}</div>
                                    <div className="text-xs text-[#6b6b70]">{diff.description}</div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Question Count */}
                <section>
                    <h2 className="text-xl font-bold mb-2">Number of Questions</h2>
                    <p className="text-[#6b6b70] text-sm mb-4">How many questions do you want to practice?</p>

                    <div className="flex items-center gap-6">
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={questionCount}
                            onChange={(e) => setQuestionCount(Number(e.target.value))}
                            className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                        <div className="w-12 h-12 bg-orange-500/20 border border-orange-500/30 rounded-xl flex items-center justify-center">
                            <span className="text-lg font-bold text-orange-400">{questionCount}</span>
                        </div>
                    </div>
                </section>

                {/* Start Button */}
                <div className="pt-6 border-t border-white/10">
                    <button
                        onClick={startInterview}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 rounded-xl font-semibold text-lg transition-all shadow-lg shadow-orange-500/30"
                    >
                        Start Interview
                        <ArrowRight className="w-5 h-5" />
                    </button>

                    <p className="text-center text-[#6b6b70] text-sm mt-4">
                        {interviewType === 'dsa'
                            ? 'You\'ll solve coding problems with an AI interviewer'
                            : 'You\'ll answer technical questions in a conversational interview'
                        }
                    </p>
                </div>
            </main>
        </div>
    );
}
