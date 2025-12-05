import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { Question } from '@/lib/types';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MURF_API_KEY = process.env.MURF_API_KEY;

// Retry helper
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
    let lastError: Error | null = null;
    for (let i = 0; i <= maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
            if (i === maxRetries) return response;
        } catch (error) {
            lastError = error as Error;
            console.log(`TTS attempt ${i + 1} failed, retrying...`);
            await new Promise(r => setTimeout(r, 500 * (i + 1)));
        }
    }
    throw lastError || new Error('Fetch failed after retries');
}

// Type-specific intro prompts
function getIntroPrompt(interviewType: string): string {
    const prompts: Record<string, string> = {
        dsa: `You are a friendly technical interviewer. Generate a brief introduction for a coding interview question. 
Keep it under 3 sentences. Be warm but professional.
Include: A brief greeting, the problem name, a one-line summary, and ask them to share their approach.
Do NOT include full problem details - they can read those themselves.`,

        frontend: `You are a friendly frontend development interviewer. Generate a brief introduction for a technical discussion.
Keep it under 3 sentences. Be conversational and encouraging.
Mention the topic, give context on what you want to discuss, and invite them to share their experience.`,

        backend: `You are a friendly backend development interviewer. Generate a brief introduction for a technical discussion.
Keep it under 3 sentences. Be professional and encouraging.
Mention the topic and invite them to share their knowledge and experience.`,

        fullstack: `You are a friendly fullstack development interviewer. Generate a brief introduction for a technical discussion.
Keep it under 3 sentences. Be conversational.
Mention the topic and set the stage for discussing both frontend and backend aspects.`,

        cybersecurity: `You are a friendly cybersecurity interviewer. Generate a brief introduction for a security-focused discussion.
Keep it under 3 sentences. Be professional.
Mention the topic and invite them to share their security knowledge and experience.`,

        devops: `You are a friendly DevOps interviewer. Generate a brief introduction for a technical discussion.
Keep it under 3 sentences. Be encouraging.
Mention the topic and invite them to share their experience with infrastructure and operations.`
    };

    return prompts[interviewType] || prompts.dsa;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { question, interviewType = 'dsa' } = body as { question: Question; interviewType?: string };

        if (!question) {
            return NextResponse.json({ error: 'No question provided' }, { status: 400 });
        }

        // Generate intro message using LLM
        let introText: string;
        try {
            const completion = await groq.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: getIntroPrompt(interviewType)
                    },
                    {
                        role: 'user',
                        content: `Generate an intro for this ${interviewType === 'dsa' ? 'question' : 'topic'}:
Title: ${question.title}
Description: ${question.description}`
                    }
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                max_tokens: 150,
            });

            introText = completion.choices[0]?.message?.content || '';
        } catch (llmError) {
            console.error('LLM Error:', llmError);
            introText = '';
        }

        // Use fallback if empty
        if (!introText || introText.length < 10) {
            introText = interviewType === 'dsa'
                ? `Hi! Today's problem is "${question.title}". Take a moment to read it, and when you're ready, walk me through your approach.`
                : `Hi! Let's discuss "${question.title}". I'd love to hear your thoughts and experience on this topic.`;
        }

        console.log('Generated intro:', introText);

        // Generate TTS audio with retry
        if (!MURF_API_KEY) {
            console.error('MURF_API_KEY not set');
            return NextResponse.json({ introText, audioBase64: null });
        }

        const murfUrl = 'https://global.api.murf.ai/v1/speech/stream';
        const murfPayload = {
            voiceId: 'en-US-matthew',
            text: introText,
            multiNativeLocale: 'en-US',
            model: 'FALCON',
            format: 'MP3',
            sampleRate: 24000,
            channelType: 'MONO'
        };

        try {
            const murfResponse = await fetchWithRetry(murfUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': MURF_API_KEY
                },
                body: JSON.stringify(murfPayload)
            });

            if (!murfResponse.ok) {
                const errText = await murfResponse.text();
                console.error('Murf TTS Error:', errText);
                return NextResponse.json({ introText, audioBase64: null });
            }

            const audioArrayBuffer = await murfResponse.arrayBuffer();

            if (audioArrayBuffer.byteLength < 1000) {
                console.error('Audio data too small, likely invalid');
                return NextResponse.json({ introText, audioBase64: null });
            }

            const audioBase64 = Buffer.from(audioArrayBuffer).toString('base64');

            return NextResponse.json({
                introText,
                audioBase64
            });
        } catch (ttsError) {
            console.error('TTS Error after retries:', ttsError);
            return NextResponse.json({ introText, audioBase64: null });
        }

    } catch (error) {
        console.error('Intro Generation Error:', error);
        return NextResponse.json({
            introText: "Hi! Let's get started. Tell me about your approach to this topic.",
            audioBase64: null
        });
    }
}
