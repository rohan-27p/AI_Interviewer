import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { createClient } from '@/lib/supabase/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { messages, questions, sessionId } = body;

        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: 'No interview history provided' }, { status: 400 });
        }

        // SessionId is optional for backward compatibility
        // If not provided, we'll create a temporary one or skip database save
        const shouldSaveToDatabase = !!sessionId;

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

        // Only save to database if sessionId is provided
        if (shouldSaveToDatabase && sessionId) {
            try {
                // Save feedback to database
                const { data: feedbackReport, error: feedbackError } = await supabase
                    .from('feedback_reports')
                    .insert({
                        user_id: user.id,
                        session_id: sessionId,
                        overall_score: feedback.overallScore,
                        overall_verdict: feedback.overallVerdict,
                        summary: feedback.summary,
                        strengths: feedback.strengths,
                        areas_for_improvement: feedback.areasForImprovement,
                        recommendations: feedback.recommendations,
                        technical_skills_score: feedback.technicalSkills?.score,
                        technical_skills_feedback: feedback.technicalSkills?.feedback,
                        problem_solving_score: feedback.problemSolving?.score,
                        problem_solving_feedback: feedback.problemSolving?.feedback,
                        communication_score: feedback.communication?.score,
                        communication_feedback: feedback.communication?.feedback,
                        full_feedback_json: feedback,
                    })
                    .select()
                    .single();

                if (feedbackError) {
                    console.error('Error saving feedback:', feedbackError);
                    // Don't fail the request, just log the error and continue
                } else {
                    // Update session status to completed
                    await supabase
                        .from('interview_sessions')
                        .update({ status: 'completed' })
                        .eq('id', sessionId)
                        .eq('user_id', user.id);

                    return NextResponse.json({
                        feedback,
                        feedbackId: feedbackReport.id,
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (dbError) {
                console.error('Database save error:', dbError);
                // Continue to return feedback even if DB save fails
            }
        }

        // Return feedback without database save (backward compatibility)
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

// GET endpoint to retrieve feedback by ID
export async function GET(req: Request) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const feedbackId = searchParams.get('id');
        const sessionId = searchParams.get('sessionId');

        let query = supabase
            .from('feedback_reports')
            .select('*')
            .eq('user_id', user.id);

        if (feedbackId) {
            query = query.eq('id', feedbackId);
        } else if (sessionId) {
            query = query.eq('session_id', sessionId);
        } else {
            // Return all feedback for user
            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            return NextResponse.json({ feedbackReports: data });
        }

        const { data: feedbackReport, error } = await query.single();

        if (error) {
            console.error('Error fetching feedback:', error);
            return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
        }

        return NextResponse.json({ feedback: feedbackReport.full_feedback_json, feedbackReport });
    } catch (error) {
        console.error('Feedback fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

