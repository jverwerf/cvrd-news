// Verify CVRD's ad rotation maths without a build.
// Extracts the REAL SPONSORED / HOUSE / buildRotation / deal / plannerRank out
// of AdBanners.tsx, stubs RENDERERS from the placements each brand actually
// declares, and prints per-brand share by country and category.
//
//   node rotation-check.mjs "/Volumes/X10 Pro/CVRD/web-portal/src/components/AdBanners.tsx"
import fs from 'node:fs';

const path = process.argv[2];
const src = fs.readFileSync(path, 'utf8');

function cut(startRe, endMarker) {
  const m = src.match(startRe);
  if (!m) throw new Error('not found: ' + startRe);
  const from = m.index;
  const to = src.indexOf(endMarker, from);
  if (to < 0) throw new Error('end not found for ' + startRe);
  return src.slice(from, to + endMarker.length);
}

const strip = s => s
  // Type annotations, stripped by hand: there are only a few and they are
  // stable. A generic regex mangled `Array<{ brand: Brand; n: number }>`.
  .replace('function deal(counts: Array<{ brand: Brand; n: number }>): Brand[] {', 'function deal(counts) {')
  .replace('function plannerRank(plan: AdPlan | null, brand: Brand, categories: string[]): number {', 'function plannerRank(plan, brand, categories) {')
  .replace(/function buildRotation\([\s\S]*?\): Brand\[\] \{/, 'function buildRotation(placement, categories, country, plan) {')
  .replace('(b: Brand)', '(b)')
  .replace(/ as (Category|Brand|Placement)\b/g, '')
  .replace(/\bconst (\w+): [^=]+=/g, 'const $1 =')
  .replace(/\blet (\w+): [^=]+=/g, 'let $1 =');

// Real data + logic, lifted verbatim.
const sponsoredSrc = cut(/const SPONSORED[^=]*=\s*\[/, '\n];');
const houseSrc = cut(/const HOUSE[^=]*=\s*\[/, '];');
const constsSrc = [
  cut(/const FALLBACK_COUNTRY\s*=/, ';'),
  cut(/const HOUSE_SHARE\s*=/, ';'),
  cut(/const AFFINITY_BOOST\s*=/, ';'),
  cut(/const PLANNER_BOOST\s*=/, ';'),
  cut(/const ROTATION_SLOTS\s*=/, ';'),
].join('\n');
const dealSrc = cut(/function deal\(/, '\n}');
const rankSrc = cut(/function plannerRank\(/, '\n}');
const buildSrc = cut(/function buildRotation\(/, '\n}');

// RENDERERS, reduced to which placements each brand can fill.
const rendMatch = src.match(/const RENDERERS[^=]*=\s*\{([\s\S]*?)\n\};/);
const RENDERERS = {};
for (const line of rendMatch[1].split('\n')) {
  const m = line.match(/^\s*([a-z0-9]+):\s*\{(.*)\},\s*$/i);
  if (!m) continue;
  RENDERERS[m[1]] = {
    horizontal: /horizontal:/.test(m[2]) ? true : undefined,
    tile: /tile:/.test(m[2]) ? true : undefined,
  };
}

const body = [
  constsSrc,
  houseSrc.replace(/const HOUSE[^=]*=/, 'const HOUSE ='),
  sponsoredSrc.replace(/const SPONSORED[^=]*=/, 'const SPONSORED ='),
  dealSrc, rankSrc, buildSrc,
  'return { buildRotation, SPONSORED, HOUSE };',
].join('\n\n');

const factory = new Function('RENDERERS', strip(body));
const { buildRotation, SPONSORED, HOUSE } = factory(RENDERERS);

const CATEGORIES = ['world', 'politics', 'markets', 'sports', 'trending'];
const COUNTRIES = ['GB', 'US', 'IE', 'DE', 'AU', 'BR', null];

let fails = 0;
const fail = m => { fails++; console.log('  ✗ ' + m); };

function share(placement, categories, country, plan = null) {
  const rot = buildRotation(placement, categories, country, plan);
  const counts = {};
  for (const b of rot) counts[b] = (counts[b] || 0) + 1;
  return { rot, pct: Object.fromEntries(Object.entries(counts).map(([b, n]) => [b, Math.round(n / rot.length * 100)])) };
}

console.log('ROSTER: ' + SPONSORED.map(s => s.brand).join(', '));
console.log('HOUSE:  ' + HOUSE.join(', ') + '\n');

for (const placement of ['horizontal', 'tile']) {
  console.log('── ' + placement + ' ─ mixed page (all categories today)');
  for (const c of COUNTRIES) {
    const { rot, pct } = share(placement, CATEGORIES, c);
    if (rot.length === 0) fail('empty rotation for ' + c);
    const paid = Object.entries(pct).filter(([b]) => !HOUSE.includes(b));
    if (paid.length === 0) fail('no paid demand at all for country ' + (c ?? 'unknown'));
    console.log('   ' + String(c ?? 'unknown').padEnd(8) + paid.map(([b, p]) => b + ' ' + p + '%').join('  '));
  }
  console.log('');
}

console.log('── single-story pages (tile, US reader)');
for (const cat of CATEGORIES) {
  const { pct } = share('tile', [cat], 'US');
  console.log('   ' + cat.padEnd(9) + Object.entries(pct).filter(([b]) => !HOUSE.includes(b)).map(([b, p]) => b + ' ' + p + '%').join('  '));
}

console.log('\n── assertions');
// Every advertiser must be able to reach at least one slot somewhere.
for (const s of SPONSORED) {
  const reached = ['horizontal', 'tile'].some(p =>
    COUNTRIES.some(c => CATEGORIES.some(cat => share(p, [cat], c).rot.includes(s.brand))));
  if (!reached) fail(s.brand + ' can never appear anywhere');
}
// `avoid` must bite on a single-story page and NOT on a mixed page.
for (const s of SPONSORED.filter(x => x.avoid?.length)) {
  for (const cat of s.avoid) {
    for (const p of ['horizontal', 'tile']) {
      if (!RENDERERS[s.brand][p]) continue;
      if (share(p, [cat], 'US').rot.includes(s.brand)) fail(s.brand + ' appeared on avoided ' + cat + ' (' + p + ')');
    }
  }
  if (!share('tile', CATEGORIES, 'US').rot.includes(s.brand) && RENDERERS[s.brand].tile) {
    fail(s.brand + ' excluded from a MIXED page by avoid — over-gating');
  }
}
// A garbage/empty plan must never empty a rotation.
for (const plan of [null, { channels: {}, suppress: [] }, { channels: { sports: ['nope'] }, suppress: [] }]) {
  if (share('tile', CATEGORIES, 'US', plan).rot.length === 0) fail('empty rotation for plan ' + JSON.stringify(plan));
}
// Tile-only brands must never enter a horizontal rotation.
for (const s of SPONSORED.filter(x => !RENDERERS[x.brand].horizontal)) {
  if (share('horizontal', CATEGORIES, 'US').rot.includes(s.brand)) fail(s.brand + ' entered a horizontal rotation with no wide creative');
}

console.log(fails === 0 ? '  ✓ all passed' : '  ' + fails + ' FAILURE(S)');
process.exit(fails === 0 ? 0 : 1);
