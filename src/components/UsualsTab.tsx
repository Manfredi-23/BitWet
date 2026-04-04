'use client';

import { useEffect, useCallback, useState } from 'react';
import { useCragStore } from '@/stores/cragStore';
import { useForecastStore } from '@/stores/forecastStore';
import { useUIStore } from '@/stores/uiStore';
import type { SortMode } from '@/stores/uiStore';
import { getTodayScore, getWeekendScore } from '@/lib/scoring';
import CragCard from '@/components/CragCard';
import type { Crag } from '@/lib/types';

const SORT_OPTIONS: { mode: SortMode; label: string }[] = [
  { mode: 'weekend', label: 'This Weekend' },
  { mode: 'score', label: 'Best Today' },
  { mode: 'name', label: 'Name' },
];

interface UsualsTabProps {
  onAddCrag?: () => void;
  onEditCrag?: (id: string) => void;
  onRemoveCrag?: (id: string) => void;
}

export default function UsualsTab({ onAddCrag, onEditCrag, onRemoveCrag }: UsualsTabProps) {
  const crags = useCragStore((s) => s.crags);
  const forecastCache = useForecastStore((s) => s.forecastCache);
  const loading = useForecastStore((s) => s.loading);
  const fetchAllForecasts = useForecastStore((s) => s.fetchAllForecasts);
  const startAutoRefresh = useForecastStore((s) => s.startAutoRefresh);
  const stopAutoRefresh = useForecastStore((s) => s.stopAutoRefresh);
  const currentSort = useUIStore((s) => s.currentSort);
  const setSort = useUIStore((s) => s.setSort);

  const [hasFetched, setHasFetched] = useState(false);

  // Fetch forecasts on mount and when crags change
  useEffect(() => {
    if (crags.length > 0) {
      fetchAllForecasts(crags).then(() => setHasFetched(true));
      startAutoRefresh(crags);
    }
    return () => stopAutoRefresh();
  }, [crags, fetchAllForecasts, startAutoRefresh, stopAutoRefresh]);

  // Sort crags
  const sortedCrags = useCallback((): Crag[] => {
    const list = [...crags];
    switch (currentSort) {
      case 'weekend':
        return list.sort((a, b) => {
          const fcA = forecastCache[a.id];
          const fcB = forecastCache[b.id];
          return (fcB ? getWeekendScore(fcB, b) : -1) - (fcA ? getWeekendScore(fcA, a) : -1);
        });
      case 'score':
        return list.sort((a, b) => {
          const fcA = forecastCache[a.id];
          const fcB = forecastCache[b.id];
          return (fcB ? getTodayScore(fcB, b) : -1) - (fcA ? getTodayScore(fcA, a) : -1);
        });
      case 'name':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return list;
    }
  }, [crags, currentSort, forecastCache]);

  const sorted = sortedCrags();

  return (
    <>
      <div className="sort-bar" id="sortBar">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.mode}
            className={`sort-pill${currentSort === opt.mode ? ' active' : ''}`}
            onClick={() => setSort(opt.mode)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {onAddCrag && (
        <button className="add-crag-btn" onClick={onAddCrag}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Crag
        </button>
      )}
      <div id="cragGrid">
        {sorted.map((crag, i) => (
          <CragCard
            key={crag.id}
            crag={crag}
            forecast={forecastCache[crag.id]}
            index={i}
            onEdit={onEditCrag}
            onRemove={onRemoveCrag}
          />
        ))}
        {crags.length === 0 && hasFetched && !loading && (
          <div className="empty-state">
            <p>No crags yet. Add one to get started!</p>
          </div>
        )}
      </div>
    </>
  );
}
