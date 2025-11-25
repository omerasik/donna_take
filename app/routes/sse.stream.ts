import { generateAIResponse } from '../lib/ai';
import { getRuleBasedDonnaResponse, MEETINGS } from '../lib/donnaLogic.js';
import { getSSEHeaders, streamText } from '../lib/sse.js';

type RequestPayload = {
  message?: string;
  state?: string;
  reportData?: Record<string, unknown>;
};

const SYSTEM_INSTRUCTION = `You are Donna, a professional sales assistant.
Keep responses short, structured, and helpful.
If the user is logging a meeting report, ask guiding questions.`;

export async function action({ request }: { request: Request }) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let payload: RequestPayload;
  try {
    payload = await request.json();
  } catch (error) {
    console.error('Invalid JSON payload for /sse/stream:', error);
    return new Response('Invalid request body', { status: 400 });
  }

  const message = payload.message ?? '';
  const state = payload.state ?? 'IDLE';
  const reportData =
    typeof payload.reportData === 'object' && payload.reportData !== null
      ? payload.reportData
      : {};

  const ruleBasedResult = getRuleBasedDonnaResponse(message, state, reportData);
  const prompt = buildPrompt(message, ruleBasedResult);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const writeEvent = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      writeEvent({
        type: 'state',
        newState: ruleBasedResult.newState,
        reportData: ruleBasedResult.reportData,
      });

      const fallbackWritable = {
        write(chunk: string) {
          controller.enqueue(encoder.encode(chunk));
        },
      };

      try {
        const aiResult = await generateAIResponse({
          prompt,
          stream: (chunk) => {
            if (chunk) {
              writeEvent({ content: chunk, done: false });
            }
          },
        });

        if (!aiResult) {
          console.log('AI response success: false (fallback triggered)');
          await streamText(ruleBasedResult.response, fallbackWritable);
        } else {
          writeEvent({ content: '', done: true });
        }
      } catch (error) {
        console.error('Donna SSE streaming error:', error);
        writeEvent({
          content: 'Sorry, I had trouble responding. Please try again.',
          done: true,
          error: true,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: getSSEHeaders() });
}

function buildPrompt(message: string, ruleResult: ReturnType<typeof getRuleBasedDonnaResponse>) {
  const meetingSummary = ['Available meetings today:', ...MEETINGS.map(
    (meeting) =>
      `- ${meeting.time} with ${meeting.client} from ${meeting.company} (Topic: ${meeting.topic})`,
  )].join('\n');

  const flowContext = `Current report logging state: ${ruleResult.newState}\nCollected report data: ${JSON.stringify(ruleResult.reportData)}`;

  return `${SYSTEM_INSTRUCTION}\n\n${meetingSummary}\n\n${flowContext}\n\nUser: ${message}`;
}
