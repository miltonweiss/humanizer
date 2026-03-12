import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, smoothStream, streamText, UIMessage } from 'ai';
import { prompt } from '../../../../prompt';

type RewriteOperation =
  | 'humanize'
  | 'shorten'
  | 'expand'
  | 'professional'
  | 'casual'
  | 'regenerate';

type RewriteOptions = {
  tone?: string;
  length?: 'shorter' | 'same' | 'longer';
  audience?: string;
  preserveFormatting?: boolean;
  customInstruction?: string;
};

type ChatRequestBody = {
  messages: UIMessage[];
  stylePrompt?: string;
  operation?: RewriteOperation;
  rewriteOptions?: RewriteOptions;
};

const OPERATION_GUIDANCE: Record<RewriteOperation, string> = {
  humanize:
    'Humanize the text with natural cadence while preserving meaning exactly.',
  shorten:
    'Make the rewrite shorter while preserving important details and intent.',
  expand:
    'Expand with useful context while preserving original meaning.',
  professional:
    'Shift tone to professional and polished while staying clear and direct.',
  casual: 'Shift tone to casual and approachable without losing clarity.',
  regenerate:
    'Produce a distinct alternative rewrite with different phrasing and rhythm.',
};

function buildSystemPrompt({
  stylePrompt,
  operation,
  rewriteOptions,
}: {
  stylePrompt?: string;
  operation: RewriteOperation;
  rewriteOptions?: RewriteOptions;
}) {
  const sections = [prompt];

  if (stylePrompt?.trim()) {
    sections.push(
      [
        '---',
        'STYLE',
        '',
        'Strictly follow the style instructions:',
        stylePrompt.trim(),
      ].join('\n')
    );
  }

  const controlLines: string[] = [];

  if (operation !== 'humanize') {
    controlLines.push(`Operation: ${OPERATION_GUIDANCE[operation]}`);
  }

  if (rewriteOptions?.tone?.trim()) {
    controlLines.push(`Tone preference: ${rewriteOptions.tone.trim()}`);
  }

  if (rewriteOptions?.length) {
    controlLines.push(`Length preference: ${rewriteOptions.length}`);
  }

  if (rewriteOptions?.audience?.trim()) {
    controlLines.push(`Audience: ${rewriteOptions.audience.trim()}`);
  }

  if (rewriteOptions?.customInstruction?.trim()) {
    controlLines.push(
      `Additional instruction: ${rewriteOptions.customInstruction.trim()}`
    );
  }

  if (rewriteOptions?.preserveFormatting === false) {
    controlLines.push('Formatting may be adjusted for better flow if needed.');
  }

  if (controlLines.length) {
    sections.push(['---', 'REWRITE PREFERENCES', '', ...controlLines].join('\n'));
  }

  return sections.join('\n\n');
}

export async function POST(req: Request) {
  const {
    messages,
    stylePrompt,
    operation = 'humanize',
    rewriteOptions,
  }: ChatRequestBody = await req.json();

  const systemPrompt = buildSystemPrompt({
    stylePrompt,
    operation,
    rewriteOptions,
  });

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    temperature: 0.9,
    experimental_transform: smoothStream({
      delayInMs: 10,
      chunking: 'word',
    }),
  });

  return result.toUIMessageStreamResponse();
}
