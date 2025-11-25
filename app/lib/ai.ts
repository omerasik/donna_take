type GenerateAIParams = {
  prompt: string;
  stream: (chunk: string) => void;
};

type Provider = 'gemini' | 'openai' | 'none';

function resolveProvider(): Provider {
  const provider = (process.env.AI_PROVIDER || 'none').toLowerCase();
  if (provider === 'gemini' || provider === 'openai') {
    return provider;
  }
  return 'none';
}

export async function generateAIResponse({ prompt, stream }: GenerateAIParams): Promise<boolean> {
  const provider = resolveProvider();

  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return false;
    }

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const result = await model.generateContentStream({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ]
      });

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          stream(text);
        }
      }
      console.log('AI response success: true');
      return true;
    } catch (error) {
      console.error('Gemini streaming error:', error);
      console.log('AI response success: false');
      return false;
    }
  }

  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return false;
    }

    try {
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey });
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        stream: true,
        messages: [{ role: 'user', content: prompt }]
      });

      for await (const part of response) {
        const delta = part.choices?.[0]?.delta?.content;
        if (!delta) continue;

        stream(delta);
      }
      return true;
    } catch (error) {
      console.error('OpenAI streaming error:', error);
      return false;
    }
  }

  return false;
}
