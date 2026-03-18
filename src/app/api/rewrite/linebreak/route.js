/** Line Break Fixer - merge artificial breaks, preserve semantic structure */

// Wörter, die typischerweise Satzfortsetzung sind (klein geschrieben am Zeilenende)
const CONTINUATION_WORDS = new Set([
  // Deutsch
  'und', 'oder', 'aber', 'sondern', 'dass', 'weil', 'wenn', 'ob',
  'als', 'nachdem', 'bevor', 'bis', 'seit', 'während', 'obwohl',
  'denn', 'sowie', 'bzw', 'bzw.', 'evtl', 'evtl.', 'z.b', 'z.b.',
  // Englisch – koordinierende/subordinierende Konjunktionen am Zeilenende
  'and', 'or', 'but', 'nor', 'so', 'yet', 'for',
  'that', 'which', 'because', 'since', 'while', 'although', 'though',
  'if', 'when', 'as', 'after', 'before', 'until', 'unless',
  'however', 'therefore', 'thus', 'hence', 'moreover', 'furthermore',
  'nevertheless', 'nonetheless', 'meanwhile', 'otherwise',
]);

// List-Item-Pattern: am Zeilenanfang (inkl. "3 )", "3. ", "a)", "a." etc.)
const LIST_ITEM_START = /^(\s*)([-*•◦▪]\s+|\d+\s*[.)]\s*|[a-zA-Z]\s*[.)]\s*)/;

function isListLine(line) {
  return LIST_ITEM_START.test(line.trimStart());
}

function looksLikeHeading(line) {
  const t = line.trim();
  if (!t) return false;
  // Zeile endet mit Doppelpunkt → Überschrift
  if (t.endsWith(':') && t.length < 80) return true;
  // Nur 1–2 Wörter, kurz, kein Komma – typische Überschrift wie "Einleitung"
  const wordCount = t.split(/\s+/).filter(Boolean).length;
  if (wordCount <= 2 && t.length < 25 && !t.endsWith(',') && !/[.!?]/.test(t)) {
    return true;
  }
  return false;
}

function endsSentence(line) {
  const t = line.trimEnd();
  if (!t) return false;
  const last = t.slice(-1);
  if (['.', '?', '!'].includes(last)) return true;
  if (last === ':' && t.length > 3) return true;
  return false;
}

function endsMidSentence(line) {
  const t = line.trimEnd();
  if (!t) return false;
  const last = t.slice(-1);
  if (['.', '?', '!', ':'].includes(last)) return false;
  if (last === ',') return true;
  if (last === '(' || last === '[') return true;
  const lastWord = t.split(/\s+/).pop()?.toLowerCase().replace(/[,;:]$/, '');
  if (lastWord && CONTINUATION_WORDS.has(lastWord)) return true;
  if (/[a-zäöüß]$/.test(t)) return true;
  return false;
}

function nextStartsContinuation(nextLine) {
  const t = nextLine.trimStart();
  if (!t) return false;
  // Klare Fortsetzung: beginnt mit Kleinbuchstabe
  if (/^[a-zäöüß]/.test(t)) return true;
  // Öffnende Klammer/Anführungszeichen – könnte Fortsetzung sein
  if (/^["'(\[]/.test(t)) return true;
  return false;
}

/** Prüft ob die nächste Zeile einen echten neuen Satz/Absatz beginnt */
function nextStartsNewSentence(nextLine) {
  const t = nextLine.trimStart();
  if (!t) return false;
  // Beginnt mit Großbuchstabe → potenziell neuer Satz
  if (/^[A-ZÄÖÜ]/.test(t)) return true;
  return false;
}

/** Heuristik: Zeile sieht nach Code aus → nicht mergen */
function looksLikeCode(line) {
  const t = line.trim();
  if (!t) return false;
  if (t.startsWith('npm ') || t.includes('install')) return true;
  // "from" NICHT allein – zu häufig in normalem Text ("from a PDF"); nur "from 'x'" (Import)
  if (/^(import|const|let|var|export)\s/.test(t)) return true;
  if (/^from\s+['"]/.test(t)) return true; // "from 'react'" etc.
  if (t.includes(';') && t.length < 80) return true;
  if (/^[{}[\]]\s*$/.test(t)) return true;
  return false;
}

function shouldMerge(currentLine, nextLine, currentIndex, allLines) {
  if (!currentLine.trim() || !nextLine.trim()) return false;

  if (looksLikeCode(currentLine) || looksLikeCode(nextLine)) return false;

  // List Continuation – Zeile ohne Bullet an vorherige Bullet-Zeile anhängen
  if (isListLine(currentLine) && !isListLine(nextLine)) {
    // Nicht mergen wenn nächste Zeile wie ein neuer Absatz/Satz aussieht
    // (beginnt mit Großbuchstabe UND endet aktuelle Zeile nicht mid-sentence)
    if (nextStartsNewSentence(nextLine) && endsSentence(currentLine)) return false;
    return true;
  }
  // Nächste Zeile ist Bullet → nicht mergen (neuer Listenpunkt)
  if (isListLine(nextLine)) return false;

  // Safe Merge – kurze abgeschlossene Zeile nicht mergen
  if (currentLine.trim().length < 30 && !endsMidSentence(currentLine)) return false;

  if (looksLikeHeading(currentLine) && !nextStartsContinuation(nextLine)) return false;
  if (endsSentence(currentLine)) return false;

  // Merge nur wenn nächste Zeile klein beginnt (echte Continuation)
  // Bei Großbuchstabe: nur mergen wenn aktuelle Zeile KLAR mid-sentence endet (Komma, Klammer)
  if (endsMidSentence(currentLine)) {
    if (nextStartsContinuation(nextLine)) return true;
    // Nächste Zeile beginnt mit Großbuchstabe: nur mergen wenn aktuelle auf Komma/Klammer endet
    // NICHT bei Konjunktion am Ende (but, and, however) + Großbuchstabe = neuer Absatz
    const endsOnConjunction = (() => {
      const lastWord = currentLine.trimEnd().split(/\s+/).pop()?.toLowerCase().replace(/[,;:]$/, '');
      return lastWord && CONTINUATION_WORDS.has(lastWord);
    })();
    if (nextStartsNewSentence(nextLine) && endsOnConjunction) return false;
    return false;
  }

  // Zeile < ~80 chars + nächste beginnt klein → merge
  const currentShort = currentLine.trim().length < 80;
  const nextIsContinuation = nextStartsContinuation(nextLine);
  if (currentShort && nextIsContinuation && !endsSentence(currentLine)) {
    return true;
  }

  return false;
}

/** Zeile mit mehreren zusammengeklebten Listenpunkten aufteilen: "- A -B" → "- A\n- B" */
function splitConcatenatedListItems(line) {
  if (!isListLine(line)) return line;
  // Schutz: echte Bindestriche in Wörtern haben KEINEN Leerzeichen davor ("well-known").
  // Eingebettete Bullets haben immer mindestens einen Space davor.
  // Pattern: Leerzeichen + Bullet + optionaler Space + nicht-Leerzeichen → Split
  return line.replace(/(\s)([-*•◦▪])\s*(?=\S)/g, '\n$2 ');
}

export function fixLineBreaks(text) {
  if (typeof text !== 'string') return '';
  // \r\n normalisieren
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  let lines = normalized.split('\n');

  // Fix: zusammengeklebte Listenpunkte zuerst aufteilen (auch bei nur 1 Zeile!)
  lines = lines.flatMap((line) => splitConcatenatedListItems(line).split('\n'));

  if (lines.length <= 1) return lines.join('\n').trim();

  let changed = true;
  while (changed) {
    changed = false;
    const nextLines = [];
    let i = 0;

    while (i < lines.length) {
      const current = lines[i];
      const next = lines[i + 1];

      if (i === lines.length - 1) {
        nextLines.push(current);
        break;
      }

      if (shouldMerge(current, next, i, lines)) {
        const merged = (current.trimEnd() + ' ' + next.trimStart()).replace(/\s+/g, ' ');
        nextLines.push(merged);
        i += 2;
        changed = true;
        continue;
      }

      nextLines.push(current);
      i += 1;
    }
    lines = nextLines;
  }

  return lines.join('\n').trim();
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = body.text ?? '';
    const fixed = fixLineBreaks(text);
    return Response.json({ text: fixed });
  } catch (e) {
    return Response.json({ text: '', error: e?.message }, { status: 500 });
  }
}
