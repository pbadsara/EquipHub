// A small fixed palette, deterministically assigned per category name (a
// simple string hash) so the same category always gets the same color and
// browsing the catalogue by category becomes easier to scan at a glance.
const PALETTE = [
  { bg: '#eef2ff', text: '#4338ca' }, // indigo
  { bg: '#ecfdf5', text: '#047857' }, // emerald
  { bg: '#fff7ed', text: '#c2410c' }, // orange
  { bg: '#fdf2f8', text: '#be185d' }, // pink
  { bg: '#f0f9ff', text: '#0369a1' }, // sky
  { bg: '#fefce8', text: '#a16207' }, // amber
  { bg: '#f5f3ff', text: '#6d28d9' }, // violet
  { bg: '#f0fdfa', text: '#0f766e' } // teal
];

export function getCategoryColor(name) {
  if (!name) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
