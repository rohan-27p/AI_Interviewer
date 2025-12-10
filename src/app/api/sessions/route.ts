import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Create a new interview session
export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { interviewType, difficulty, topics, numQuestions } = body;

        // Validate input
        if (!interviewType || !difficulty || !topics || !numQuestions) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create new session
        const { data: session, error } = await supabase
            .from('interview_sessions')
            .insert({
                user_id: user.id,
                interview_type: interviewType,
                difficulty,
                topics,
                num_questions: numQuestions,
                status: 'active',
                messages: [],
                current_question_index: 0,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating session:', error);
            return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
        }

        return NextResponse.json({ session });
    } catch (error) {
        console.error('Session creation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Get session by ID
export async function GET(req: Request) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('id');

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }

        const { data: session, error } = await supabase
            .from('interview_sessions')
            .select('*')
            .eq('id', sessionId)
            .eq('user_id', user.id)
            .single();

        if (error) {
            console.error('Error fetching session:', error);
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json({ session });
    } catch (error) {
        console.error('Session fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Update session (messages, status, etc.)
export async function PATCH(req: Request) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { sessionId, messages, status, currentQuestionIndex } = body;

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }

        const updateData: any = {};
        if (messages !== undefined) updateData.messages = messages;
        if (status !== undefined) updateData.status = status;
        if (currentQuestionIndex !== undefined) updateData.current_question_index = currentQuestionIndex;

        const { data: session, error } = await supabase
            .from('interview_sessions')
            .update(updateData)
            .eq('id', sessionId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating session:', error);
            return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
        }

        return NextResponse.json({ session });
    } catch (error) {
        console.error('Session update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
