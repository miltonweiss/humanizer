export function getAssistantText(message) {
  if (!message) return '';
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text ?? '')
      .join('');
  }
  if (typeof message.content === 'string') return message.content;
  return '';
}
