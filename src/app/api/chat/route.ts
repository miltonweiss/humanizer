import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { prompt } from '../../../../prompt';
import { smoothStream } from "ai"
export async function POST(req: Request) {
  const { messages, stylePrompt }: { messages: UIMessage[]; stylePrompt?: string } = await req.json();

  const systemPrompt = stylePrompt
    ? `${prompt}\n\n---\n\nSTYLE\n\n
    Strictly follow the style instructions:
    ${stylePrompt}`
    : prompt;

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    temperature: 0.9,
    experimental_transform: smoothStream({
      delayInMs: 10, // optional: defaults to 10ms
      chunking: 'word', // optional: defaults to 'word'
    }),
  });

  return result.toUIMessageStreamResponse();
}
