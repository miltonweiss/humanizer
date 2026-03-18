/** All-in-one: clean → linebreak → list in sequence */

import { cleanText } from '../clean/route';
import { fixLineBreaks } from '../linebreak/route';
import { normalizeList } from '../list/route';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = body.text ?? '';

    let result = text;
    result = cleanText(result, { unifyQuotesAndDashes: true });
    result = fixLineBreaks(result);
    result = normalizeList(result);
    // Zweiter Durchlauf: robust gegen Paste-Artefakte (Unicode, Zeilenumbrüche) – sehr schnell
    result = fixLineBreaks(result);
    result = normalizeList(result);

    return Response.json({ text: result });
  } catch (e) {
    return Response.json({ text: '', error: e?.message }, { status: 500 });
  }
}
