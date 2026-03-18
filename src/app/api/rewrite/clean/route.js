/** Whitespace Cleaner - removes double spaces, weird unicode, fixes tabs & line breaks */

/**
 * Clean text: double spaces, normalize tabs, fix Unicode, reduce line breaks, optional quote/dash unification
 */
export function cleanText(text, options = {}) {
  const { unifyQuotesAndDashes = true } = options;
  if (typeof text !== 'string') return '';

  let result = text;

  // 1. Seltsame Unicode-Zeichen fixen (vor anderen Schritten)
  result = fixStrangeUnicode(result, unifyQuotesAndDashes);

  // 2. Tabs normalisieren: Tabs → einzelnes Leerzeichen
  result = result.replace(/\t+/g, ' ');

  // 3. Doppelte Leerzeichen + trim pro Zeile (leading/trailing space)
  result = result
  .split('\n')
  .map(line => {
    // Code-artige Zeilen überspringen
    if (/[{};=<>]/.test(line)) return line;

    return line
      .replace(/ {2,}/g, ' ') // mehrere spaces → ein Space
      .trim(); // pro Zeile: führende und trailing Spaces entfernen
  })
  .join('\n');

  // 4. Leerzeichen vor Satzzeichen entfernen: "text ," → "text,"
  result = result.replace(/\s+([,.;:!?])/g, '$1');


  // 6. Unnötige Leerzeilen reduzieren: 3+ Newlines → max 2 (1 leere Zeile)
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}

function fixStrangeUnicode(text, unifyQuotesAndDashes) {
  let result = text;

  // Zero-width und unsichtbare Zeichen entfernen
  const invisible = [
    '\u200B', // Zero-width space
    '\u200C', // Zero-width non-joiner
    '\u200D', // Zero-width joiner
    '\u200E', // Left-to-right mark
    '\u200F', // Right-to-left mark
    '\u2028', // Line separator
    '\u2029', // Paragraph separator
    '\u2060', // Word joiner
    '\uFEFF', // BOM / Zero-width no-break space
  ];
  invisible.forEach((char) => {
    result = result.split(char).join('');
  });

  // Non-breaking space → normales Leerzeichen
  result = result.replace(/\u00A0/g, ' ');
  // Narrow no-break space
  result = result.replace(/\u202F/g, ' ');
  // Thin space
  result = result.replace(/\u2009/g, ' ');

  if (unifyQuotesAndDashes) {
    // Deutsche Anführungszeichen → Standard
    result = result.replace(/[\u201E\u201C]/g, '"'); // „ "
    result = result.replace(/[\u201A\u2018]/g, "'"); // ‚ '
    result = result.replace(/[\u201D\u201F]/g, '"'); // " bzw. ‟
    result = result.replace(/\u2019/g, "'");        // ’

    // Gedankenstriche vereinheitlichen: Em dash (—), En dash (–) etc. → einheitlich -
    result = result.replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-');
  }

  return result;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = body.text ?? '';
    const unifyQuotesAndDashes = body.unifyQuotesAndDashes !== false;

    const cleaned = cleanText(text, { unifyQuotesAndDashes });
    return Response.json({ text: cleaned });
  } catch (e) {
    return Response.json({ text: '', error: e?.message }, { status: 500 });
  }
}
