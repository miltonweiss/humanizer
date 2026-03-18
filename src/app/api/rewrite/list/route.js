/** List Normalizer - unify bullets, fix numbering, repair spacing & indentation */

// Bullet-Zeichen → einheitlich "- "
const BULLET_CHARS = /^(\s*)([-*•◦▪○●∙]\s*|\*+\s*)/;

// Nummerierung: 1. 1) 1 ] 3 ) etc. – flexibel mit optionalen Spaces
// Fix-Regel: ^\s*(\d+)\s*[\)\.]?\s* → normalize to "$1. "
const NUMBERED_MATCH = /^(\s*)(\d+)\s*[.)\]\:]?\s*/;

// Buchstaben-Nummerierung: a. a) A. A)
const LETTER_MATCH = /^(\s*)([a-zA-Z])([.)\]\:])\s*/;

function getIndentLevel(line) {
  const m = line.match(/^[\s\t]*/);
  if (!m) return 0;
  const s = m[0].replace(/\t/g, '  ');
  return Math.floor(s.length / 2) * 2;
}

function normalizeListLine(line) {
  const trimmed = line.trimStart();
  if (!trimmed) return { type: 'empty', line };

  let indent = line.length - trimmed.length;
  let indentStr = line.slice(0, indent).replace(/\t/g, '  ');
  indentStr = indentStr.replace(/  +/g, (m) => '  '.repeat(Math.ceil(m.length / 2)));

  let rest = trimmed;
  let prefix = '';

  const collapseSpaces = (s) => s.replace(/\s+/g, ' ').trim();

  const numM = rest.match(NUMBERED_MATCH);
  if (numM) {
    const num = parseInt(numM[2], 10);
    prefix = `${num}. `;
    rest = collapseSpaces(rest.slice(numM[0].length));
    return { type: 'numbered', prefix, rest, indentStr, line: indentStr + prefix + rest };
  }

  const letterM = rest.match(LETTER_MATCH);
  if (letterM) {
    const letter = letterM[2].toLowerCase();
    prefix = `${letter}. `;
    rest = collapseSpaces(rest.slice(letterM[0].length));
    return { type: 'letter', prefix, rest, indentStr, line: indentStr + prefix + rest };
  }

  const bulletM = rest.match(BULLET_CHARS);
  if (bulletM) {
    prefix = '- ';
    rest = collapseSpaces(rest.slice(bulletM[0].length));
    return { type: 'bullet', prefix, rest, indentStr, line: indentStr + prefix + rest };
  }

  return { type: 'text', line };
}

export function normalizeList(text) {
  if (typeof text !== 'string') return '';
  const lines = text.split('\n');
  const result = [];
  let i = 0;
  let inList = false;
  let listType = null;
  let numberCounter = 0;
  let letterCounter = 0;

  while (i < lines.length) {
    const line = lines[i];
    const parsed = normalizeListLine(line);

    if (parsed.type === 'empty') {
      result.push('');
      inList = false;
      numberCounter = 0;
      letterCounter = 0;
      i++;
      continue;
    }

    if (parsed.type === 'text') {
      inList = false;
      numberCounter = 0;
      letterCounter = 0;
      result.push(line);
      i++;
      continue;
    }

    if (!inList) {
      const upcoming = [];
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        const p = normalizeListLine(lines[j]);
        if (p.type !== 'empty' && p.type !== 'text') upcoming.push(p.type);
      }
      if (upcoming.some((t) => t === 'numbered')) listType = 'numbered';
      else if (upcoming.some((t) => t === 'letter')) listType = 'letter';
      else listType = 'bullet';
      inList = true;
      numberCounter = 0;
      letterCounter = 0;
    }

    const indent = getIndentLevel(line);
    const indentStr = '  '.repeat(Math.floor(indent / 2));

    if (listType === 'numbered') {
      numberCounter++;
      result.push(indentStr + `${numberCounter}. ` + parsed.rest);
    } else if (listType === 'letter') {
      letterCounter++;
      const letters = 'abcdefghijklmnopqrstuvwxyz';
      const letter = letters[(letterCounter - 1) % 26] || 'a';
      result.push(indentStr + `${letter}. ` + parsed.rest);
    } else {
      result.push(indentStr + '- ' + parsed.rest);
    }

    i++;
  }

  return result.join('\n').trim();
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = body.text ?? '';
    const normalized = normalizeList(text);
    return Response.json({ text: normalized });
  } catch (e) {
    return Response.json({ text: '', error: e?.message }, { status: 500 });
  }
}
