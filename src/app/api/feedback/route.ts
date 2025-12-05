import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, questions } = body;

        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: 'No interview history provided' }, { status: 400 });
        }

        // Format the conversation for the LLM
        const conversationSummary = messages
            .filter((m: { role: string }) => m.role !== 'system')
            .map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n\n');

        const questionsList = questions?.join(', ') || 'Various coding questions';

        // Generate detailed feedback using Groq
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are an expert technical interview coach providing detailed feedback to a candidate after their coding interview.

Analyze the interview conversation and provide structured feedback in the following JSON format:
{
    "overallScore": <number 1-10>,
    "overallVerdict": "<string: Strong Hire / Hire / Lean Hire / Lean No Hire / No Hire>",
    "summary": "<2-3 sentence overall summary>",
    "strengths": ["<strength 1>", "<strength 2>", ...],
    "areasForImprovement": ["<area 1>", "<area 2>", ...],
    "technicalSkills": {
        "score": <number 1-10>,
        "feedback": "<detailed feedback on coding ability, algorithm knowledge, data structures>"
    },
    "problemSolving": {
        "score": <number 1-10>,
        "feedback": "<detailed feedback on approach, breaking down problems, optimization>"
    },
    "communication": {
        "score": <number 1-10>,
        "feedback": "<detailed feedback on explaining thought process, asking clarifying questions>"
    },
    "recommendations": ["<specific actionable recommendation 1>", "<recommendation 2>", ...]
}

Be constructive, specific, and encouraging while being honest about areas for improvement.
If user doesnt answer anything and just clicked end interview then give him score 1 and verdict as No Hire
Return ONLY valid JSON, no markdown or additional text.`
                },
                {
                    role: 'user',
                    content: `Please analyze this technical interview and provide detailed feedback.

QUESTIONS COVERED: ${questionsList}

INTERVIEW TRANSCRIPT:
${conversationSummary}`
                }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 2000,
        });

        const feedbackText = completion.choices[0]?.message?.content || '{}';

        // Parse the JSON response
        let feedback;
        try {
            // Clean up the response in case it has markdown code blocks
            const cleanedText = feedbackText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            feedback = JSON.parse(cleanedText);
        } catch {
            console.error('Failed to parse feedback JSON:', feedbackText);
            feedback = {
                overallScore: 6,
                overallVerdict: 'Lean Hire',
                summary: 'Interview completed. Detailed analysis could not be generated.',
                strengths: ['Completed the interview'],
                areasForImprovement: ['Continue practicing'],
                technicalSkills: { score: 6, feedback: 'Demonstrated technical knowledge.' },
                problemSolving: { score: 6, feedback: 'Showed problem-solving approach.' },
                communication: { score: 6, feedback: 'Communicated throughout the interview.' },
                recommendations: ['Keep practicing coding problems', 'Review data structures and algorithms']
            };
        }

        // Generate a unique ID for this feedback
        const uid = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        return NextResponse.json({
            uid,
            feedback,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Feedback Generation Error:', error);
        return NextResponse.json({ error: 'Failed to generate feedback' }, { status: 500 });
    }
}
