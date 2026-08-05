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
 * True when a block of copy is the pipeline apologising for having nothing to
 * say rather than saying something. The analyser fills an uncovered side with
 * prose ("There were no posts specifically about X in the available X or TikTok
 * data, so verified fan reaction cannot be summarized here yet") instead of
 * omitting the field, and that text is long enough to clear any length check.
 * Rendering it puts a paragraph about the absence of content where content
 * belongs, so callers drop these blocks and fall back to something real.
 */
export function isPlaceholderProse(text: string | undefined | null): boolean {
  if (!text) return false;
  const t = text.trim();
  return (
    // Opens by denying: "No X posts…", "There were no posts…", "None of the…"
    /^(?:there\s+(?:were|are|is|was)\s+)?(?:no|none|nothing|not)\b/i.test(t) ||
    // A denial anywhere, with up to a few words between it and what is missing:
    // "No X or TikTok posts", "no Bears-specific reaction"
    /\bno\b(?:\s+\S+){0,4}\s+(?:posts?|tweets?|clips?|videos?|footage|reactions?|comments?|coverage|sources?|discussion|mentions?)\b/i.test(t) ||
    /\b(?:not enough|insufficient|little to no)\s+(?:\S+\s+){0,2}(?:coverage|data|sources?|posts?|reporting|footage)\b/i.test(t) ||
    // Describes its own inputs rather than the story: "in the available X data",
    // "the provided posts", "the collected data"
    /\b(?:in|from|within)\s+the\s+(?:available|provided|collected)\b/i.test(t) ||
    /\b(?:available|provided|collected|supplied)\s+(?:\S+\s+){0,3}(?:posts?|clips?|data|dataset)\b/i.test(t) ||
    // "the available X posts do not address this" — the subject has to be the
    // source material, so reporting like "the order does not address the
    // provision" is left alone.
    /\b(?:posts?|tweets?|clips?|sources?|coverage|outlets?|data|dataset)\b(?:\s+\S+){0,3}\s+(?:do|does|did)\s+not\s+(?:\S+\s+){0,2}(?:address|discuss|mention|reference|cover|relate)\b/i.test(t) ||
    /\bunrelated\s+(?:topics|subjects|matters|clips|posts)\b/i.test(t) ||
    /\bsits?\s+outside\b/i.test(t) ||
    // Declines to say: "cannot be summarized here yet"
    /\bcan(?:not|'t|no)\s*t?\s+be\s+(?:summari[sz]ed|verified|shown|reported|confirmed|assessed)\b/i.test(t) ||
    /\b(?:remains?|is)\s+unconfirmed\s+here\b/i.test(t) ||
    /\bcheck back soon\b/i.test(t)
  );
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
