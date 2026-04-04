'use client';

import { useState, useMemo, useCallback } from 'react';
import type { RockType, TerrainType, Orientation } from '@/lib/types';

export type PlannerSource = 'both' | 'usuals' | 'explore';

export interface PlannerFilters {
  location: string;
  selectedDays: string[];
  selectedRocks: RockType[];
  selectedTerrain: TerrainType[];
  selectedFacing: Orientation[];
  minScore: number;
  maxResults: number;
  source: PlannerSource;
}

interface PlannerFormProps {
  onSearch: (filters: PlannerFilters) => void;
  searching: boolean;
}

const ROCK_OPTIONS: RockType[] = ['Granite', 'Gneiss', 'Limestone', 'Sandstone'];
const TERRAIN_OPTIONS: TerrainType[] = ['slab', 'vertical', 'overhang'];
const FACING_OPTIONS: Orientation[] = ['S', 'SW', 'SE', 'W', 'E', 'NW', 'NE', 'N'];
const DEFAULT_FACING: Orientation[] = ['S', 'SW', 'SE'];

function buildDays(): { label: string; date: string; isWeekend: boolean }[] {
  const days: { label: string; date: string; isWeekend: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    const ds = d.toISOString().slice(0, 10);
    const dow = d.getDay();
    days.push({ label: `${dayName} ${dayNum}`, date: ds, isWeekend: dow === 0 || dow === 6 });
  }
  return days;
}

export default function PlannerForm({ onSearch, searching }: PlannerFormProps) {
  const days = useMemo(() => buildDays(), []);

  const [location, setLocation] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>(() =>
    days.filter(d => d.isWeekend).map(d => d.date)
  );
  const [selectedRocks, setSelectedRocks] = useState<RockType[]>([...ROCK_OPTIONS]);
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainType[]>([...TERRAIN_OPTIONS]);
  const [selectedFacing, setSelectedFacing] = useState<Orientation[]>([...DEFAULT_FACING]);
  const [minScore, setMinScore] = useState(40);
  const [maxResults, setMaxResults] = useState(5);
  const [source, setSource] = useState<PlannerSource>('both');

  const toggleDay = useCallback((date: string) => {
    setSelectedDays(prev =>
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    );
  }, []);

  const toggleRock = useCallback((rock: RockType) => {
    setSelectedRocks(prev =>
      prev.includes(rock) ? prev.filter(r => r !== rock) : [...prev, rock]
    );
  }, []);

  const toggleTerrain = useCallback((t: TerrainType) => {
    setSelectedTerrain(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  }, []);

  const toggleFacing = useCallback((f: Orientation) => {
    setSelectedFacing(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    );
  }, []);

  const handleSearch = useCallback(() => {
    onSearch({
      location,
      selectedDays,
      selectedRocks,
      selectedTerrain,
      selectedFacing,
      minScore,
      maxResults,
      source,
    });
  }, [onSearch, location, selectedDays, selectedRocks, selectedTerrain, selectedFacing, minScore, maxResults, source]);

  return (
    <div className="planner-filters">
      <div className="planner-card">
        {/* Location */}
        <div className="planner-row">
          <div className="field planner-field">
            <label>Your location</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Zürich, or 47.37, 8.55"
            />
          </div>
        </div>

        {/* Day selector */}
        <div className="planner-row">
          <div className="field planner-field">
            <label>Days</label>
            <div className="planner-days">
              {days.map(d => (
                <button
                  key={d.date}
                  type="button"
                  className={`planner-day-btn${selectedDays.includes(d.date) ? ' sel' : ''}`}
                  onClick={() => toggleDay(d.date)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rock type + Terrain */}
        <div className="planner-row planner-row--multi">
          <div className="field planner-field">
            <label>Rock type</label>
            <div className="orient-grid">
              {ROCK_OPTIONS.map(r => (
                <button
                  key={r}
                  type="button"
                  className={`orient-btn${selectedRocks.includes(r) ? ' sel' : ''}`}
                  onClick={() => toggleRock(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="field planner-field">
            <label>Terrain</label>
            <div className="orient-grid">
              {TERRAIN_OPTIONS.map(t => (
                <button
                  key={t}
                  type="button"
                  className={`orient-btn${selectedTerrain.includes(t) ? ' sel' : ''}`}
                  onClick={() => toggleTerrain(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Facing */}
        <div className="planner-row planner-row--multi">
          <div className="field planner-field">
            <label>Facing</label>
            <div className="orient-grid">
              {FACING_OPTIONS.map(f => (
                <button
                  key={f}
                  type="button"
                  className={`orient-btn${selectedFacing.includes(f) ? ' sel' : ''}`}
                  onClick={() => toggleFacing(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Min score, Max results, Source */}
        <div className="planner-row planner-row--multi">
          <div className="field planner-field">
            <label>Min score</label>
            <input
              type="range"
              min={0}
              max={80}
              value={minScore}
              onChange={e => setMinScore(parseInt(e.target.value))}
            />
            <span className="planner-range-val">{minScore}</span>
          </div>
          <div className="field planner-field">
            <label>Results</label>
            <input
              type="range"
              min={3}
              max={10}
              value={maxResults}
              onChange={e => setMaxResults(parseInt(e.target.value))}
            />
            <span className="planner-range-val">{maxResults}</span>
          </div>
          <div className="field planner-field">
            <label>Search in</label>
            <select
              className="explore-sel"
              value={source}
              onChange={e => setSource(e.target.value as PlannerSource)}
            >
              <option value="both">Both</option>
              <option value="usuals">Usuals only</option>
              <option value="explore">Explore only</option>
            </select>
          </div>
        </div>

        <button
          className="btn-primary planner-go"
          onClick={handleSearch}
          disabled={searching}
        >
          {searching ? 'Searching...' : 'Find crags'}
        </button>
      </div>
    </div>
  );
}
