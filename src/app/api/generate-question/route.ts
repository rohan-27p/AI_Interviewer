import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { Question } from '@/lib/types';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Prompts for different interview types
const PROMPTS: Record<string, string> = {
    dsa: `You are a technical interview question generator. Generate a coding interview question in the following JSON format:

{
    "title": "Problem Title",
    "description": "Clear problem description explaining what the candidate needs to solve.",
    "constraints": ["constraint 1", "constraint 2"],
    "examples": [
        {
            "input": "input description",
            "output": "expected output",
            "explanation": "optional explanation"
        }
    ],
    "difficulty": "Easy" | "Medium" | "Hard"
}

RULES:
- Generate questions similar to LeetCode/HackerRank style
- Focus on: Arrays, Strings, Hash Maps, Two Pointers, Sliding Window, Binary Search, Trees, Graphs, Dynamic Programming
- Keep difficulty appropriate for a 30-minute interview
- Provide 1-2 clear examples
- Return ONLY valid JSON, no markdown or extra text`,

    frontend: `Generate a frontend development interview topic in JSON format:
{
    "title": "Topic Name",
    "description": "Detailed description of what the interviewer will ask about. Include 2-3 specific questions or discussion points.",
    "difficulty": "Easy" | "Medium" | "Hard"
}

Focus on: React, JavaScript fundamentals, CSS, TypeScript, State Management, Performance, Testing, Web APIs, Accessibility.
Return ONLY valid JSON.`,

    backend: `Generate a backend development interview topic in JSON format:
{
    "title": "Topic Name",
    "description": "Detailed description including 2-3 specific questions to discuss about the topic.",
    "difficulty": "Easy" | "Medium" | "Hard"
}

Focus on: REST APIs, Databases (SQL/NoSQL), Authentication, Caching, Microservices, System Design, Security, Node.js/Python.
Return ONLY valid JSON.`,

    fullstack: `Generate a fullstack development interview topic in JSON format:
{
    "title": "Topic Name",
    "description": "Detailed description covering both frontend and backend aspects with 2-3 discussion points.",
    "difficulty": "Easy" | "Medium" | "Hard"
}

Focus on: Full application architecture, API integration, State management, Database design, Deployment, Performance.
Return ONLY valid JSON.`,

    cybersecurity: `Generate a cybersecurity interview topic in JSON format:
{
    "title": "Topic Name",
    "description": "Detailed description with 2-3 specific security-related questions or scenarios.",
    "difficulty": "Easy" | "Medium" | "Hard"
}

Focus on: Network Security, Web Security, OWASP Top 10, Cryptography, Penetration Testing, Incident Response, Secure Coding.
Return ONLY valid JSON.`,

    devops: `Generate a DevOps interview topic in JSON format:
{
    "title": "Topic Name",
    "description": "Detailed description with 2-3 specific DevOps questions or scenarios.",
    "difficulty": "Easy" | "Medium" | "Hard"
}

Focus on: Docker, Kubernetes, CI/CD, AWS/Azure/GCP, Infrastructure as Code, Monitoring, Linux, Networking.
Return ONLY valid JSON.`
};

// Fallback questions for each type
const FALLBACKS: Record<string, Question[]> = {
    dsa: [
        {
            title: "Two Sum",
            description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
            constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
            examples: [{ input: "nums = [2,7,11,15], target = 9", output: "[0,1]" }],
            difficulty: "Easy"
        },
        {
            title: "Valid Parentheses",
            description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
            constraints: ["1 <= s.length <= 10^4"],
            examples: [{ input: 's = "()"', output: "true" }],
            difficulty: "Easy"
        }
    ],
    frontend: [
        {
            title: "React Component Lifecycle",
            description: "Explain the React component lifecycle. When would you use useEffect with different dependency arrays? How do you handle cleanup?",
            difficulty: "Medium",
            constraints: [],
            examples: []
        },
        {
            title: "CSS Box Model & Flexbox",
            description: "Explain the CSS box model. How does Flexbox work? When would you use Flexbox vs Grid?",
            difficulty: "Easy",
            constraints: [],
            examples: []
        }
    ],
    backend: [
        {
            title: "REST API Design",
            description: "Design a RESTful API for a social media platform. How would you handle authentication, pagination, and rate limiting?",
            difficulty: "Medium",
            constraints: [],
            examples: []
        },
        {
            title: "Database Indexing",
            description: "Explain database indexing. When should you use indexes? What are the tradeoffs?",
            difficulty: "Medium",
            constraints: [],
            examples: []
        }
    ],
    fullstack: [
        {
            title: "Full Application Architecture",
            description: "Design the architecture for a real-time chat application. Consider both frontend state management and backend scalability.",
            difficulty: "Hard",
            constraints: [],
            examples: []
        }
    ],
    cybersecurity: [
        {
            title: "OWASP Top 10",
            description: "Explain the OWASP Top 10 vulnerabilities. How would you prevent SQL injection and XSS attacks?",
            difficulty: "Medium",
            constraints: [],
            examples: []
        }
    ],
    devops: [
        {
            title: "Docker & Kubernetes",
            description: "Explain containerization with Docker. How does Kubernetes orchestration work? What problems does it solve?",
            difficulty: "Medium",
            constraints: [],
            examples: []
        }
    ]
};

function getFallback(type: string, previousQuestions: string[]): Question {
    const fallbacks = FALLBACKS[type] || FALLBACKS.dsa;
    const available = fallbacks.filter(q => !previousQuestions.includes(q.title));
    return available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

export async function POST(req: Request) {
    let previousQuestions: string[] = [];
    let interviewType = 'dsa';

    try {
        const body = await req.json();
        const { difficulty = 'Medium', topics = [] } = body;
        previousQuestions = body.previousQuestions || [];
        interviewType = body.interviewType || 'dsa';

        const basePrompt = PROMPTS[interviewType] || PROMPTS.dsa;

        const contextPrompt = previousQuestions.length > 0
            ? `\n\nAVOID these topics already covered: ${previousQuestions.join(', ')}`
            : '';

        const topicsPrompt = topics.length > 0
            ? `\n\nFocus specifically on these topics: ${topics.join(', ')}`
            : '';

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: basePrompt + contextPrompt + topicsPrompt
                },
                {
                    role: 'user',
                    content: `Generate a ${difficulty} difficulty ${interviewType.toUpperCase()} interview ${interviewType === 'dsa' ? 'question' : 'topic'}.`
                }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.8,
            max_tokens: 800,
        });

        const content = completion.choices[0]?.message?.content || '';

        if (!content || content.length < 50) {
            throw new Error('Invalid LLM response');
        }

        // Parse JSON from response
        let question: Question;
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }
            question = JSON.parse(jsonMatch[0]);

            if (!question.title || !question.description) {
                throw new Error('Missing required fields');
            }
        } catch (parseError) {
            console.error('Failed to parse question JSON:', content);
            throw new Error('Failed to parse generated question');
        }

        return NextResponse.json({ question });

    } catch (error) {
        console.error('Question Generation Error:', error);

        const fallbackQuestion = getFallback(interviewType, previousQuestions);
        return NextResponse.json({
            question: fallbackQuestion,
            fallback: true
        });
    }
}
