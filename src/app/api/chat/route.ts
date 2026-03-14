import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { prompt } from '../../../../prompt';
import { smoothStream } from "ai"
import { mistral } from '@ai-sdk/mistral';
export async function POST(req: Request) {
  const { messages, stylePrompt, temperature, maxTokens, model }: { messages: UIMessage[]; stylePrompt?: string, temperature: number, maxTokens: number, model: string } = await req.json();

  const userMessages = messages.filter((m) => m.role === 'user');
  const lastUserMessage = userMessages[userMessages.length - 1];
  const currentMessages = lastUserMessage ? [lastUserMessage] : [];

  const modelInstance =
    model === 'gpt'
      ? openai("gpt-5.3-chat-latest")
      : model === 'mistral'
        ? mistral("labs-mistral-small-creative")
        : anthropic("claude-sonnet-4-6");

  const systemPrompt = stylePrompt
    ? `${prompt}\n\n---\n\nSTYLE\n\n
    Strictly follow the style instructions:
    ${stylePrompt}`
    : prompt;

  const result = streamText({
    model: modelInstance,
    system: systemPrompt,
    messages: await convertToModelMessages(currentMessages),
    temperature: temperature,
    maxOutputTokens: maxTokens,
    experimental_transform: smoothStream({
      delayInMs: 10, // optional: defaults to 10ms
      chunking: 'word', // optional: defaults to 'word'
    }),
  });

  return result.toUIMessageStreamResponse();
}
