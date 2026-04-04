// ═══════════════════════════════════════════
// BitWet — Constants
// ═══════════════════════════════════════════

import type { ScoreLabel, SeasonProfile } from './types';

// ─── Score label thresholds ───
// 95+ = Send It, 85-94 = Atta Boy, 75-84 = Decent, 65-74 = Alright,
// 55-64 = Maybe, 45-54 = Meh, 35-44 = Bit Wet, 25-34 = Nicht Gut,
// 15-24 = Hopeless, 0-14 = Stay Home

export function getScoreLabel(score: number): ScoreLabel {
  if (score >= 95) return 'Send It';
  if (score >= 85) return 'Atta Boy';
  if (score >= 75) return 'Decent';
  if (score >= 65) return 'Alright';
  if (score >= 55) return 'Maybe';
  if (score >= 45) return 'Meh';
  if (score >= 35) return 'Bit Wet';
  if (score >= 25) return 'Nicht Gut';
  if (score >= 15) return 'Hopeless';
  return 'Stay Home';
}

// ─── Rock drying factors ───
// Lower = dries faster, higher = dries slower
export const ROCK_DRYING_FACTORS: Record<string, number> = {
  granite: 0.6,       // Non-porous, excellent drainage
  gneiss: 0.8,        // Crystalline, some foliation moisture
  limestone: 1.2,     // Porous, seepage, crack moisture
  sandstone: 2.0,     // Highly porous, absorbs deeply, 24-72h drying
  conglomerate: 1.6,  // Sedimentary, absorbs like sandstone but with better cement
};

export function rockDryingFactor(rock: string): number {
  const r = (rock || '').toLowerCase();
  if (r.includes('granite')) return ROCK_DRYING_FACTORS.granite;
  if (r.includes('gneiss')) return ROCK_DRYING_FACTORS.gneiss;
  if (r.includes('limestone')) return ROCK_DRYING_FACTORS.limestone;
  if (r.includes('sandstone')) return ROCK_DRYING_FACTORS.sandstone;
  if (r.includes('conglomerate') || r.includes('nagelfluh')) return ROCK_DRYING_FACTORS.conglomerate;
  return 1.0;
}

// ─── Terrain rain reduction factors ───
export function terrainRainFactor(terrain: string): number {
  if (terrain === 'overhang') return 0.3;  // 70% rain reduction
  if (terrain === 'vertical') return 0.7;
  return 1.0; // slab: full rain impact
}

// ─── Season temperature profiles ───
export function getSeasonProfile(dateStr?: string): SeasonProfile {
  const m = dateStr ? new Date(dateStr + 'T00:00:00').getMonth() : new Date().getMonth();
  if (m >= 11 || m <= 1) return { idealMin: 4, idealMax: 16 };   // Winter (Dec-Feb)
  if (m >= 2 && m <= 4) return { idealMin: 8, idealMax: 22 };    // Spring (Mar-May)
  if (m >= 5 && m <= 7) return { idealMin: 14, idealMax: 28 };   // Summer (Jun-Aug)
  return { idealMin: 10, idealMax: 24 };                          // Autumn (Sep-Nov)
}

// ─── Climbing window time weights ───
export const TIME_WEIGHTS = [
  { start: 'T09:00', end: 'T10:00', weight: 0.7, label: 'early' },
  { start: 'T10:00', end: 'T14:00', weight: 1.0, label: 'peak' },
  { start: 'T14:00', end: 'T17:00', weight: 0.8, label: 'afternoon' },
  { start: 'T17:00', end: 'T18:00', weight: 0.5, label: 'last burns' },
] as const;

// ─── Time-of-day display slots ───
export const TIME_SLOTS = [
  { label: 'Sunrise', start: 'T05:00', end: 'T08:00' },
  { label: 'Morning', start: 'T08:00', end: 'T11:00' },
  { label: 'Midday', start: 'T11:00', end: 'T14:00' },
  { label: 'Afternoon', start: 'T14:00', end: 'T17:00' },
  { label: 'Evening', start: 'T17:00', end: 'T20:00' },
] as const;

// ─── Orientation to degrees mapping ───
export const ORIENTATION_DEGREES: Record<string, number> = {
  N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315,
};

// ─── Score color helpers ───
export function scorePillClass(score: number): string {
  if (score >= 80) return 's-great';
  if (score >= 60) return 's-good';
  if (score >= 40) return 's-ok';
  if (score >= 20) return 's-poor';
  return 's-bad';
}

export function scoreColorHex(score: number): string {
  if (score >= 80) return '#5BAD6A';
  if (score >= 60) return '#7EC98A';
  if (score >= 40) return '#D4A843';
  if (score >= 20) return '#E8725A';
  return '#9A9490';
}

// ─── Storage keys ───
export const STORAGE_KEY = 'bitWet_v1';
export const THEME_KEY = 'bitWet_theme';
