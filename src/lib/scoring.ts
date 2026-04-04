// ═══════════════════════════════════════════
// BitWet — Scoring Engine
// ═══════════════════════════════════════════

import type {
  Crag,
  Forecast,
  ModelForecast,
  ScoreResult,
  BlendedScoreResult,
  WindShelter,
  FrictionLabel,
  TimeSlot,
  TrendIndicator,
} from './types';
import {
  TIME_WEIGHTS,
  TIME_SLOTS,
  ORIENTATION_DEGREES,
  getScoreLabel,
  getSeasonProfile,
  rockDryingFactor,
  terrainRainFactor,
} from './constants';

// ─── Helper: extract single day from daily arrays ───
function extractDay(fc: ModelForecast, i: number) {
  return {
    temperature_2m_max: fc.daily.temperature_2m_max[i],
    temperature_2m_min: fc.daily.temperature_2m_min[i],
    precipitation_sum: fc.daily.precipitation_sum[i],
    precipitation_probability_max: fc.daily.precipitation_probability_max[i],
    wind_speed_10m_max: fc.daily.wind_speed_10m_max[i],
    wind_gusts_10m_max: fc.daily.wind_gusts_10m_max[i],
    weather_code: fc.daily.weather_code[i],
    sunshine_duration: fc.daily.sunshine_duration?.[i],
    uv_index_max: fc.daily.uv_index_max?.[i],
  };
}

// ─── Drying hours: look back from 9am for last rain ───
export function calcDryingHours(
  fc: Forecast,
  dayIndex: number,
  rock: string,
): number | null {
  const src = fc.best || fc.ecmwf;
  if (!src?.hourly?.precipitation || !src?.hourly?.time || !src?.daily?.time) return null;
  const dayStr = src.daily.time[dayIndex];
  const targetTime = dayStr + 'T09:00';
  const times = src.hourly.time;
  const targetIdx = times.findIndex(t => t >= targetTime);
  if (targetIdx < 0) return null;
  const precip = src.hourly.precipitation;
  for (let i = targetIdx; i >= 0; i--) {
    if (precip[i] > 0.1) {
      const rawHours = targetIdx - i;
      return rawHours / rockDryingFactor(rock);
    }
  }
  return targetIdx > 0 ? targetIdx : 72;
}

// ─── Dry streak: consecutive dry days before this day ───
export function calcDryStreak(fc: Forecast, dayIndex: number): number {
  const src = fc.best || fc.ecmwf;
  if (!src?.daily?.precipitation_sum || !src?.daily?.time) return 0;
  let streak = 0;
  for (let i = dayIndex - 1; i >= 0; i--) {
    if ((src.daily.precipitation_sum[i] || 0) < 0.5) streak++;
    else break;
  }
  return streak;
}

// ─── Wind direction circular mean (9am–6pm) ───
export function getDayWindDirection(fc: Forecast, dayIndex: number): number | null {
  const src = fc.best || fc.ecmwf;
  if (!src?.hourly?.wind_direction_10m || !src?.hourly?.time || !src?.daily?.time) return null;
  const dayStr = src.daily.time[dayIndex];
  const times = src.hourly.time;
  const dirs = src.hourly.wind_direction_10m;
  let sinSum = 0, cosSum = 0, count = 0;
  for (let i = 0; i < times.length; i++) {
    if (times[i] >= dayStr + 'T09:00' && times[i] <= dayStr + 'T18:00' && dirs[i] != null) {
      const rad = dirs[i] * Math.PI / 180;
      sinSum += Math.sin(rad);
      cosSum += Math.cos(rad);
      count++;
    }
  }
  if (count === 0) return null;
  let avg = Math.atan2(sinSum / count, cosSum / count) * 180 / Math.PI;
  if (avg < 0) avg += 360;
  return Math.round(avg);
}

// ─── Wind shelter based on crag orientation vs wind direction ───
export function calcWindShelter(
  windDeg: number | null,
  orientations: string[],
): WindShelter {
  if (windDeg == null || !orientations?.length) return { label: 'unknown', factor: 1.0 };
  let minExposure = 180;
  for (const dir of orientations) {
    const faceDeg = ORIENTATION_DEGREES[dir] ?? null;
    if (faceDeg == null) continue;
    const exposedWindDir = (faceDeg + 180) % 360;
    let angleDiff = Math.abs(windDeg - exposedWindDir);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;
    minExposure = Math.min(minExposure, angleDiff);
  }
  if (minExposure <= 30) return { label: 'Exposed', factor: 1.0 };
  if (minExposure <= 60) return { label: 'Crosswind', factor: 0.6 };
  if (minExposure >= 120) return { label: 'Sheltered', factor: 0.15 };
  return { label: 'Partial', factor: 0.35 };
}

// ─── Main scoring function ───
export function computeScoreV2(
  fc: Forecast,
  dayIndex: number,
  crag: Crag,
): ScoreResult | null {
  const src = fc.best || fc.ecmwf;
  if (!src?.hourly?.time || !src?.daily?.time) return null;
  const dayStr = src.daily.time[dayIndex];
  const times = src.hourly.time;
  const precip = src.hourly.precipitation;
  const wxCodes = src.hourly.weather_code;
  const temps = src.hourly.temperature_2m;
  const winds = src.hourly.wind_speed_10m;
  const gusts = src.hourly.wind_gusts_10m;
  const dd = extractDay(src, dayIndex);
  const orientation = crag.orientation || [];
  const terrain = crag.terrain || 'vertical';
  const rock = crag.rock || '';
  const alt = crag.alt || 0;
  const sn = getSeasonProfile(dayStr);

  // --- Compute weighted hourly metrics within climbing window ---
  let totalWeight = 0;
  let wRainMm = 0, wTemp = 0, wWind = 0, wGusts = 0, wMaxWx = 0;
  let hasSevere = false;

  for (const block of TIME_WEIGHTS) {
    const bs = dayStr + block.start;
    const be = dayStr + block.end;
    let blockPrecip = 0, blockMaxWx = 0, blockTempSum = 0, blockWindMax = 0, blockGustMax = 0, cnt = 0;

    for (let i = 0; i < times.length; i++) {
      if (times[i] >= bs && times[i] < be) {
        blockPrecip += (precip?.[i] || 0);
        const wx = wxCodes?.[i] || 0;
        if (wx > blockMaxWx) blockMaxWx = wx;
        if (wx >= 95) hasSevere = true;
        blockTempSum += (temps?.[i] || 0);
        const ws = winds?.[i] || 0;
        const gs = gusts?.[i] || 0;
        if (ws > blockWindMax) blockWindMax = ws;
        if (gs > blockGustMax) blockGustMax = gs;
        cnt++;
      }
    }
    if (cnt === 0) continue;

    const w = block.weight;
    totalWeight += w;
    wRainMm += blockPrecip * w;
    wTemp += (blockTempSum / cnt) * w;
    wWind += blockWindMax * w;
    wGusts += blockGustMax * w;
    if (blockMaxWx > wMaxWx) wMaxWx = blockMaxWx;
  }

  if (totalWeight === 0) return null;

  // Normalize weighted values
  const avgRainMm = wRainMm / totalWeight;
  const avgTemp = wTemp / totalWeight;
  const avgWind = wWind / totalWeight;
  const avgGusts = wGusts / totalWeight;
  const rainProb = dd.precipitation_probability_max || 0;

  // === START SCORING (from 100) ===
  let s = 100;

  // 1. RAIN — probability weighted heavier, terrain-adjusted
  const rainFactor = terrainRainFactor(terrain);
  const effectiveRain = avgRainMm * rainFactor;
  // Probability penalty (heavier weight): up to -25
  s -= (rainProb / 100) * 25;
  // Amount penalty (lighter weight): up to -35
  if (effectiveRain > 4) s -= 35;
  else if (effectiveRain > 2) s -= 25;
  else if (effectiveRain > 0.5) s -= 15;
  else if (effectiveRain > 0.1) s -= 5;

  // 2. TEMPERATURE — season-adjusted
  if (avgTemp < sn.idealMin - 10) s -= 25;
  else if (avgTemp < sn.idealMin - 5) s -= 15;
  else if (avgTemp < sn.idealMin) s -= 6;
  else if (avgTemp > sn.idealMax + 8) s -= 20;
  else if (avgTemp > sn.idealMax + 3) s -= 10;
  else if (avgTemp > sn.idealMax) s -= 3;
  else s += 3; // sweet spot bonus

  // 3. WIND — lenient, heavily modified by shelter
  const windDeg = getDayWindDirection(fc, dayIndex);
  const shelter = calcWindShelter(windDeg, orientation);
  const effectiveGusts = avgGusts * shelter.factor;
  const effectiveWind = avgWind * shelter.factor;
  if (effectiveGusts > 50) s -= 15;
  else if (effectiveGusts > 35) s -= 8;
  else if (effectiveWind > 25) s -= 4;
  // Small bonus for calm + sheltered
  if (avgWind < 10 && shelter.factor < 0.5) s += 2;

  // 4. SEVERE WEATHER — thunderstorm/snow only (no double-counting rain)
  if (hasSevere) s -= 20; // thunderstorm in climbing window = serious
  else if (wMaxWx >= 71 && wMaxWx <= 77) s -= 12; // snow

  // 5. FOG — altitude-aware
  if (wMaxWx >= 45 && wMaxWx <= 48) {
    if (alt < 800) s -= 10;       // valley fog, bad
    else if (alt < 1400) s -= 5;  // might be in it
    else s -= 1;                   // likely above
  }

  // 6. DRYING TIME — rock-type adjusted
  const dryHours = calcDryingHours(fc, dayIndex, rock);
  if (dryHours != null) {
    if (dryHours < 3) s -= 18;
    else if (dryHours < 6) s -= 10;
    else if (dryHours < 12) s -= 4;
    else if (dryHours < 24) s -= 1;
  }

  // 7. DRY STREAK BONUS
  const dryStreak = calcDryStreak(fc, dayIndex);
  if (dryStreak >= 5) s += 5;
  else if (dryStreak >= 3) s += 3;
  else if (dryStreak >= 2) s += 1;

  // 8. SUNSHINE bonus (if available)
  const sunH = dd.sunshine_duration ? dd.sunshine_duration / 3600 : null;
  if (sunH != null) {
    if (sunH > 8) s += 2;
    else if (sunH < 2) s -= 3;
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(s))),
    dryHours,
    dryStreak,
    windDeg,
    windShelter: shelter,
    effectiveRain: avgRainMm,
    avgTemp: Math.round(avgTemp),
    avgWind: Math.round(avgWind),
    avgGusts: Math.round(avgGusts),
  };
}

// ═══════════════════════════════════════════
// Scoring Helpers (US-006)
// ═══════════════════════════════════════════

// ─── Blended score: average CH2 + ECMWF when both available ───
export function blendedScore(
  fc: Forecast,
  dayIndex: number,
  crag: Crag,
): BlendedScoreResult {
  const r1 = fc.best ? computeScoreV2({ best: fc.best, ecmwf: null }, dayIndex, crag) : null;
  const r2 = fc.ecmwf ? computeScoreV2({ best: null, ecmwf: fc.ecmwf }, dayIndex, crag) : null;
  const s1 = r1?.score ?? null;
  const s2 = r2?.score ?? null;
  const meta = r1 || r2;
  const defaults: ScoreResult = {
    score: 0, dryHours: null, dryStreak: 0, windDeg: null,
    windShelter: { label: 'unknown', factor: 1.0 }, effectiveRain: 0,
    avgTemp: 0, avgWind: 0, avgGusts: 0,
  };
  const base = meta || defaults;
  if (s1 !== null && s2 !== null) {
    const avg = Math.round((s1 + s2) / 2);
    const diff = Math.abs(s1 - s2);
    return { ...base, score: avg, confidence: diff <= 10 ? 'high' : diff <= 25 ? 'medium' : 'low', sB: s1, sE: s2 };
  }
  return { ...base, score: s1 ?? s2 ?? 0, confidence: 'single', sB: s1, sE: s2 };
}

// ─── Today score for a crag ───
export function getTodayScore(fc: Forecast, crag: Crag): number {
  const src = fc.best || fc.ecmwf;
  if (!src?.daily) return -1;
  const today = new Date().toISOString().slice(0, 10);
  const idx = src.daily.time.indexOf(today);
  return blendedScore(fc, idx >= 0 ? idx : 0, crag).score;
}

// ─── Weekend score: average of Saturday + Sunday best scores ───
export function getWeekendScore(fc: Forecast, crag: Crag): number {
  const src = fc.best || fc.ecmwf;
  if (!src?.daily) return -1;
  let satBest = -1;
  let sunBest = -1;
  src.daily.time.forEach((ds, i) => {
    const dow = new Date(ds + 'T00:00:00').getDay();
    const s = blendedScore(fc, i, crag).score;
    if (dow === 6 && s > satBest) satBest = s;
    if (dow === 0 && s > sunBest) sunBest = s;
  });
  if (satBest >= 0 && sunBest >= 0) return Math.round((satBest + sunBest) / 2);
  return Math.max(satBest, sunBest);
}

// ─── Rock temperature estimate ───
export function estimateRockTemp(
  fc: Forecast,
  dayIndex: number,
  crag: Crag,
): number | null {
  const src = fc.best || fc.ecmwf;
  if (!src?.hourly?.time || !src?.daily?.time) return null;
  const dayStr = src.daily.time[dayIndex];
  const times = src.hourly.time;
  const temps = src.hourly.temperature_2m;
  const dd = extractDay(src, dayIndex);
  const orientation = crag.orientation || [];
  const alt = crag.alt || 0;
  const rock = crag.rock || '';

  let airSum = 0;
  let airCount = 0;
  for (let i = 0; i < times.length; i++) {
    if (times[i] >= dayStr + 'T10:00' && times[i] < dayStr + 'T15:00' && temps?.[i] != null) {
      airSum += temps[i];
      airCount++;
    }
  }
  if (airCount === 0) {
    if (dd.temperature_2m_max == null) return null;
    airSum = dd.temperature_2m_max;
    airCount = 1;
  }
  const airTemp = airSum / airCount;

  // Solar gain based on sunshine, orientation, rock type, altitude
  const sunFraction = dd.sunshine_duration ? Math.min(dd.sunshine_duration / (14 * 3600), 1) : 0;
  let orientFactor = 0.3;
  if (orientation.length) {
    const southish = orientation.some(d => ['S', 'SE', 'SW'].includes(d));
    const northOnly = orientation.every(d => ['N', 'NE', 'NW'].includes(d));
    if (northOnly) orientFactor = 0.08;
    else if (southish) orientFactor = 0.85;
    else orientFactor = 0.5;
  }
  let rockFactor = 1.0;
  const r = (rock || '').toLowerCase();
  if (r.includes('granite') || r.includes('gneiss')) rockFactor = 1.15;
  else if (r.includes('limestone')) rockFactor = 0.85;
  const altBoost = 1 + (alt / 1000) * 0.02;
  const solarGain = 15 * sunFraction * orientFactor * rockFactor * altBoost;

  // Wind cooling
  const wind = dd.wind_speed_10m_max || 0;
  const windCooling = wind > 5 ? Math.min((wind - 5) * 0.15, 5) : 0;

  return Math.round(airTemp + solarGain - windCooling);
}

// ─── Friction label based on rock temperature ───
export function frictionLabel(rockTemp: number | null): FrictionLabel {
  if (rockTemp == null) return { text: '—', cls: '' };
  if (rockTemp < 5) return { text: 'Cold rock', cls: 'rain' };
  if (rockTemp < 12) return { text: 'Cool · good friction', cls: '' };
  if (rockTemp < 25) return { text: 'Ideal friction', cls: '' };
  if (rockTemp < 35) return { text: 'Warm · friction ok', cls: 'warn' };
  return { text: 'Hot · sweaty', cls: 'bad' };
}

// ─── Weather code to text label ───
export function wxLabel(code: number | null | undefined): string {
  if (code == null) return '—';
  if (code <= 1) return 'Sunny';
  if (code <= 3) return 'Partially Sunny';
  if (code <= 48) return 'Foggy';
  if (code <= 55) return 'Drizzle';
  if (code <= 57) return 'Freezing Drizzle';
  if (code <= 65) return 'Rain';
  if (code <= 67) return 'Freezing Rain';
  if (code <= 75) return 'Snow';
  if (code <= 77) return 'Snow Grains';
  if (code <= 82) return 'Heavy rain';
  if (code <= 86) return 'Snow showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Cloudy';
}

// ─── Drying label for display ───
export function dryingLabel(hours: number | null): string {
  if (hours == null) return '—';
  if (hours >= 48) return '48h+ (dry)';
  if (hours >= 24) return Math.round(hours) + 'h (good)';
  if (hours >= 12) return Math.round(hours) + 'h (ok)';
  if (hours >= 6) return Math.round(hours) + 'h (damp)';
  return Math.round(hours) + 'h (wet)';
}

// ─── Drying CSS class ───
export function dryingClass(hours: number | null): string {
  if (hours == null) return '';
  if (hours >= 24) return '';
  if (hours >= 6) return 'warn';
  return 'bad';
}

// ─── Wind direction degrees to compass label ───
export function windDirLabel(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

// ─── Confidence tag text ───
export function confTag(confidence: string): string {
  if (confidence === 'high') return '';
  if (confidence === 'medium') return 'uncertain';
  if (confidence === 'low') return 'models split';
  return '';
}

// ─── Time-of-day slots with per-slot scoring ───
export function getTimeSlots(
  fc: Forecast,
  dayIndex: number,
  crag: Crag,
): TimeSlot[] | null {
  const src = fc.best || fc.ecmwf;
  if (!src?.hourly?.time || !src?.daily?.time) return null;
  const dayStr = src.daily.time[dayIndex];
  const times = src.hourly.time;
  const precip = src.hourly.precipitation;
  const wxCodes = src.hourly.weather_code;
  const temps = src.hourly.temperature_2m;
  const alt = crag.alt || 0;
  const terrain = crag.terrain || 'vertical';
  const rock = crag.rock || '';

  return TIME_SLOTS.map(slot => {
    const s = dayStr + slot.start;
    const e = dayStr + slot.end;
    let totalPrecip = 0;
    let maxWx = 0;
    let tempMax = -100;

    for (let i = 0; i < times.length; i++) {
      if (times[i] >= s && times[i] < e) {
        totalPrecip += (precip?.[i] || 0);
        if ((wxCodes?.[i] || 0) > maxWx) maxWx = wxCodes[i];
        const t = temps?.[i];
        if (t != null) tempMax = Math.max(tempMax, t);
      }
    }

    // Per-slot drying hours
    let slotDryHours: number | null = null;
    const slotStartIdx = times.findIndex(t => t >= s);
    if (slotStartIdx >= 0) {
      for (let i = slotStartIdx; i >= 0; i--) {
        if ((precip?.[i] || 0) > 0.1) {
          slotDryHours = (slotStartIdx - i) / rockDryingFactor(rock);
          break;
        }
      }
      if (slotDryHours == null) slotDryHours = 48;
    }

    // Simplified per-slot scoring
    const sn = getSeasonProfile(dayStr);
    let slotScore = 100;
    const ep = totalPrecip * terrainRainFactor(terrain);
    slotScore -= ((totalPrecip > 0 ? 80 : 10) / 100) * 25;
    if (ep > 4) slotScore -= 35;
    else if (ep > 2) slotScore -= 25;
    else if (ep > 0.5) slotScore -= 15;
    else if (ep > 0.1) slotScore -= 5;

    const st = tempMax > -100 ? tempMax : null;
    if (st != null) {
      if (st < sn.idealMin - 5) slotScore -= 12;
      else if (st < sn.idealMin) slotScore -= 5;
      else if (st > sn.idealMax + 5) slotScore -= 10;
      else if (st > sn.idealMax) slotScore -= 3;
    }

    if (maxWx >= 95) slotScore -= 20;
    else if (maxWx >= 71) slotScore -= 12;
    if (maxWx >= 45 && maxWx <= 48) {
      if (alt < 800) slotScore -= 8;
      else if (alt < 1400) slotScore -= 3;
    }
    if (slotDryHours != null && slotDryHours < 6) slotScore -= 10;
    slotScore = Math.max(0, Math.min(100, Math.round(slotScore)));

    return {
      label: slot.label,
      wx: wxLabel(maxWx),
      wxCode: maxWx,
      score: slotScore,
      precip: totalPrecip.toFixed(1),
    };
  });
}

// ─── Day trend: Improving / Getting worse / Stable ───
export function getDayTrend(slots: TimeSlot[] | null): TrendIndicator {
  if (!slots || slots.length < 4) return 'Stable';
  const first = (slots[0].score + slots[1].score) / 2;
  const second = (slots[3].score + slots[4].score) / 2;
  if (second - first > 15) return 'Improving';
  if (second - first < -15) return 'Getting worse';
  return 'Stable';
}

// Re-export getScoreLabel from constants for convenience
export { getScoreLabel };
