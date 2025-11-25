export async function streamText(text, writable, delayMs = 30) {
  const words = text.split(' ');

  for (let index = 0; index < words.length; index++) {
    const word = words[index];
    const chunk = index === words.length - 1 ? word : `${word} `;
    writable.write(`data: ${JSON.stringify({ content: chunk, done: false })}\n\n`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  writable.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
}

export async function streamGemini(prompt, writable, apiKey) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const result = await model.generateContentStream(prompt);

  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    writable.write(`data: ${JSON.stringify({ content: chunkText, done: false })}\n\n`);
  }

  writable.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
}

export function getSSEHeaders() {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };
}
