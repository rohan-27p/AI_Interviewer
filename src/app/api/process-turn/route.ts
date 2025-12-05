import { NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';
import { Groq } from 'groq-sdk';
import { Message, Question } from '@/lib/types';

// Initialize Clients
const deepgram = createClient(process.env.DEEPGRAM_API_KEY ?? '');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Constants
const MURF_API_KEY = process.env.MURF_API_KEY;

// Keywords that indicate user wants to move to next question
const NEXT_QUESTION_TRIGGERS = [
    'next question',
    'move on',
    'next problem',
    'different question',
    'another question',
    'skip',
    'done with this',
    'let\'s move on',
    'i\'m done',
    'finished'
];

function shouldGenerateNewQuestion(transcript: string, aiReply: string): boolean {
    const lowerTranscript = transcript.toLowerCase();
    const lowerReply = aiReply.toLowerCase();

    // Check if user requested next question
    const userRequestedNext = NEXT_QUESTION_TRIGGERS.some(trigger =>
        lowerTranscript.includes(trigger)
    );

    // Check if AI indicated question is complete
    const aiIndicatedComplete = lowerReply.includes('great job') ||
        lowerReply.includes('correct solution') ||
        lowerReply.includes('well done') ||
        lowerReply.includes('perfect') ||
        lowerReply.includes('optimal solution');

    return userRequestedNext || aiIndicatedComplete;
}

async function generateNewQuestion(previousTopics: string[]): Promise<Question | null> {
    try {
        const QUESTION_PROMPT = `Generate a coding interview question in JSON format:
{
    "title": "Problem Title",
    "description": "Clear problem description.",
    "constraints": ["constraint 1", "constraint 2"],
    "examples": [{"input": "...", "output": "...", "explanation": "..."}],
    "difficulty": "Medium"
}
Focus on: Arrays, Strings, Hash Maps, Two Pointers. Return ONLY valid JSON.`;

        const avoidPrompt = previousTopics.length > 0
            ? `\nAvoid these already asked: ${previousTopics.join(', ')}`
            : '';

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: QUESTION_PROMPT + avoidPrompt },
                { role: 'user', content: 'Generate a Medium difficulty coding interview question.' }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.8,
            max_tokens: 800,
        });

        const content = completion.choices[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]) as Question;
        }
    } catch (error) {
        console.error('Failed to generate new question:', error);
    }
    return null;
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get('audio') as Blob;
        const historyStr = formData.get('history') as string;
        const code = formData.get('code') as string;
        const currentQuestionTitle = formData.get('currentQuestionTitle') as string || '';
        const previousQuestionsStr = formData.get('previousQuestions') as string || '[]';

        if (!audioFile || !historyStr) {
            return NextResponse.json({ error: 'Missing audio or history' }, { status: 400 });
        }

        const conversationHistory: Message[] = JSON.parse(historyStr);
        const previousQuestions: string[] = JSON.parse(previousQuestionsStr);

        // ------------------------------------------------------------------
        // 1. STT: Deepgram SDK (Nova-2)
        // ------------------------------------------------------------------
        const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

        const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
            audioBuffer,
            {
                model: 'nova-2',
                smart_format: true,
                language: 'en-US',
            }
        );

        if (error) {
            console.error('Deepgram Error:', error);
            throw new Error(`Deepgram STT failed: ${error.message}`);
        }

        const userTranscript = result?.results?.channels[0]?.alternatives[0]?.transcript;

        if (!userTranscript) {
            return NextResponse.json({ error: 'No speech detected' }, { status: 400 });
        }

        console.log('User said:', userTranscript);

        // ------------------------------------------------------------------
        // 2. LLM: Groq (Llama 3.3)
        // ------------------------------------------------------------------
        const currentCodeContext = `\n[Current Code State]:\n\`\`\`\n${code}\n\`\`\``;

        const messages = [
            ...conversationHistory,
            { role: 'user', content: userTranscript + currentCodeContext } as Message
        ];

        const completion = await groq.chat.completions.create({
            messages: messages as any[],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.6,
            max_tokens: 200,
        });

        const aiReply = completion.choices[0]?.message?.content || "I didn't catch that.";
        console.log('AI replied:', aiReply);

        // ------------------------------------------------------------------
        // 3. Check if we need a new question
        // ------------------------------------------------------------------
        let newQuestion: Question | null = null;
        if (shouldGenerateNewQuestion(userTranscript, aiReply)) {
            const allPreviousTopics = currentQuestionTitle
                ? [...previousQuestions, currentQuestionTitle]
                : previousQuestions;
            newQuestion = await generateNewQuestion(allPreviousTopics);
        }

        // ------------------------------------------------------------------
        // 4. TTS: Murf AI (Falcon Model)
        // ------------------------------------------------------------------
        const murfUrl = 'https://global.api.murf.ai/v1/speech/stream';
        const murfPayload = {
            voiceId: 'en-US-matthew',
            text: aiReply,
            multiNativeLocale: 'en-US',
            model: 'FALCON',
            format: 'MP3',
            sampleRate: 24000,
            channelType: 'MONO'
        };

        const murfResponse = await fetch(murfUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': MURF_API_KEY!
            },
            body: JSON.stringify(murfPayload)
        });

        if (!murfResponse.ok) {
            const errText = await murfResponse.text();
            console.error('Murf Falcon Error:', errText);
            throw new Error(`Murf TTS failed: ${errText}`);
        }

        const audioArrayBuffer = await murfResponse.arrayBuffer();
        const audioBase64 = Buffer.from(audioArrayBuffer).toString('base64');

        return NextResponse.json({
            transcript: userTranscript,
            reply: aiReply,
            audioBase64: audioBase64,
            newQuestion: newQuestion
        });

    } catch (error) {
        console.error('Processing Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}