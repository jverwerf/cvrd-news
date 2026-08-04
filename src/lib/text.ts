/**
 * Trim text to the last complete sentence that fits within `max` characters,
 * so copy always ends on a full stop rather than an ellipsis mid-thought.
 * Falls back to the last whole word when there is no sentence break to use.
 */
export function toSentence(text: string | undefined | null, max: number): string {
  if (!text) return '';
  const t = text.trim();
  if (t.length <= max) return t;

  const cut = t.slice(0, max);
  // Greedy up to the last sentence terminator followed by a space, i.e. a real
  // sentence break rather than a decimal point or an abbreviation. Any complete
  // sentence beats a mid-sentence cut, however short it leaves the text.
  const match = cut.match(/^[\s\S]*[.!?](?=["')\]]?\s)/);
  if (match && match[0].trim()) return match[0].trim();

  const space = cut.lastIndexOf(' ');
  return (space > 0 ? cut.slice(0, space) : cut).replace(/[,;:\-–—]$/, '').trim();
}

/**
 * Break a long run-on write-up into readable paragraphs of roughly
 * `perParagraph` sentences. The pipeline emits one unbroken string, which reads
 * as a wall of text in a narrow column.
 */
export function toParagraphs(text: string | undefined | null, perParagraph = 3): string[] {
  if (!text) return [];
  const sentences = text.trim().match(/[^.!?]+[.!?]+(?:["')\]]+)?\s*/g);
  if (!sentences || sentences.length <= perParagraph) return [text.trim()];

  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += perParagraph) {
    out.push(sentences.slice(i, i + perParagraph).join('').trim());
  }
  return out;
}
