// ═══════════════════════════════════════════
// BitWet — Region definitions
// ═══════════════════════════════════════════

export const REGIONS = [
  'Ticino',
  'Wallis/Valais',
  'Berner Oberland',
  'Zentralschweiz',
  'Jura',
  'Ostschweiz/Graubünden',
  'Gotthard/Uri',
  'Voralpen',
] as const;

export type Region = (typeof REGIONS)[number];
