export function formatHighlightReflectionNote(excerpt: string, initialPoint?: string): string {
  const cleanExcerpt = excerpt.trim();
  const base = `Highlighted: "${cleanExcerpt}"`;
  const cleanPoint = (initialPoint || '').trim();
  if (!cleanPoint) return base;
  return `${base}\n• ${cleanPoint}`;
}

export function appendPointToReflectionNote(existingNote: string, newPoint: string): string {
  const cleanExisting = existingNote.trimEnd();
  const cleanPoint = newPoint.trim();
  if (!cleanPoint) return cleanExisting;
  const normalizedPoint = cleanPoint.startsWith('•') ? cleanPoint : `• ${cleanPoint}`;
  if (!cleanExisting) return normalizedPoint;
  return `${cleanExisting}\n${normalizedPoint}`;
}

export interface ParsedReflection {
  isHighlight: boolean;
  mainText: string;
  points: string[];
}

export function parseReflectionLines(note: string): ParsedReflection {
  const lines = note
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { isHighlight: false, mainText: '', points: [] };
  }

  const first = lines[0];
  const isHighlight = first.startsWith('Highlighted:');
  const points: string[] = [];
  const mainLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('•')) {
      const cleaned = line.replace(/^•\s*/, '').trim();
      if (cleaned) points.push(cleaned);
    } else if (mainLines.length === 0) {
      mainLines.push(line);
    } else {
      points.push(line);
    }
  }

  return {
    isHighlight,
    mainText: mainLines.join(' '),
    points,
  };
}
