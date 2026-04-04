// ═══════════════════════════════════════════
// BitWet — Scoring Engine
// ═══════════════════════════════════════════

import type { Crag, Forecast, ModelForecast, ScoreResult, WindShelter } from './types';
import {
  TIME_WEIGHTS,
  ORIENTATION_DEGREES,
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
