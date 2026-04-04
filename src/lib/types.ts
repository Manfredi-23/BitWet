// ═══════════════════════════════════════════
// BitWet — TypeScript types
// ═══════════════════════════════════════════

export type RockType = 'Granite' | 'Gneiss' | 'Limestone' | 'Sandstone' | 'Conglomerate';

export type TerrainType = 'slab' | 'vertical' | 'overhang';

export type Orientation = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export interface Crag {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  alt: number;
  rock: RockType;
  orientation: Orientation[];
  terrain: TerrainType;
  notes?: string;
}

/** Hourly data arrays from Open-Meteo */
export interface HourlyData {
  time: string[];
  temperature_2m: number[];
  precipitation: number[];
  weather_code: number[];
  wind_speed_10m: number[];
  wind_gusts_10m: number[];
  wind_direction_10m: number[];
}

/** Daily summary arrays from Open-Meteo */
export interface DailyData {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  wind_speed_10m_max: number[];
  wind_gusts_10m_max: number[];
  weather_code: number[];
  sunshine_duration?: number[];
  uv_index_max?: number[];
}

/** Single model forecast response */
export interface ModelForecast {
  hourly: HourlyData;
  daily: DailyData;
}

/** Combined forecast with both model sources */
export interface Forecast {
  best: ModelForecast | null;
  ecmwf: ModelForecast | null;
}

export interface WindShelter {
  label: 'Sheltered' | 'Partial' | 'Crosswind' | 'Exposed' | 'unknown';
  factor: number;
}

export interface ScoreResult {
  score: number;
  dryHours: number | null;
  dryStreak: number;
  windDeg: number | null;
  windShelter: WindShelter;
  effectiveRain: number;
  avgTemp: number;
  avgWind: number;
  avgGusts: number;
}

export type ScoreLabel =
  | 'Send It'
  | 'Atta Boy'
  | 'Decent'
  | 'Alright'
  | 'Maybe'
  | 'Meh'
  | 'Bit Wet'
  | 'Nicht Gut'
  | 'Hopeless'
  | 'Stay Home';

export type Confidence = 'high' | 'medium' | 'low' | 'single';

export interface BlendedScoreResult extends ScoreResult {
  confidence: Confidence;
  sB: number | null;
  sE: number | null;
}

export interface FrictionLabel {
  text: string;
  cls: string;
}

export interface SeasonProfile {
  idealMin: number;
  idealMax: number;
}

export interface TimeSlot {
  label: string;
  wx: string;
  wxCode: number;
  score: number;
  precip: string;
}

export type TrendIndicator = 'Improving' | 'Getting worse' | 'Stable';
