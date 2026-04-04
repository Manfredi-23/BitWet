'use client';

import { useEffect, useCallback, useMemo, useState } from 'react';
import { REGION_CRAGS } from '@/data/crags';
import { REGIONS } from '@/data/regions';
import type { Region } from '@/data/regions';
import { useForecastStore } from '@/stores/forecastStore';
import { useUIStore } from '@/stores/uiStore';
import type { SortMode } from '@/stores/uiStore';
import { blendedScore, wxLabel } from '@/lib/scoring';
import { scorePillClass, scoreColorHex } from '@/lib/constants';
import WeatherIcon from '@/components/WeatherIcon';
import type { Crag, Forecast } from '@/lib/types';
import { usePlatform } from '@/hooks/usePlatform';

const SORT_OPTIONS: { mode: SortMode; label: string }[] = [
  { mode: 'weekend', label: 'This Weekend' },
  { mode: 'score', label: 'Best Today' },
  { mode: 'name', label: 'Name' },
];

// ─── Region score helpers ───

function getRegionWeekendScore(region: Region, cache: Record<string, Forecast>): number {
  const crgs = REGION_CRAGS[region] || [];
  let best = -1;
  for (const rc of crgs) {
    const fc = cache[rc.id];
    if (!fc) continue;
    const src = fc.best || fc.ecmwf;
    if (!src?.daily) continue;
    let satBest = -1, sunBest = -1;
    src.daily.time.forEach((ds: string, i: number) => {
      const dow = new Date(ds + 'T00:00:00').getDay();
      const s = blendedScore(fc, i, rc).score;
      if (dow === 6 && s > satBest) satBest = s;
      if (dow === 0 && s > sunBest) sunBest = s;
    });
    let avg = Math.max(satBest, sunBest);
    if (satBest >= 0 && sunBest >= 0) avg = Math.round((satBest + sunBest) / 2);
    if (avg > best) best = avg;
  }
  return best;
}

function getRegionTodayScore(region: Region, cache: Record<string, Forecast>): number {
  const crgs = REGION_CRAGS[region] || [];
  const today = new Date().toISOString().slice(0, 10);
  let best = -1;
  for (const rc of crgs) {
    const fc = cache[rc.id];
    if (!fc) continue;
    const src = fc.best || fc.ecmwf;
    if (!src?.daily) continue;
    const idx = src.daily.time.indexOf(today);
    if (idx < 0) continue;
    const s = blendedScore(fc, idx, rc).score;
    if (s > best) best = s;
  }
  return best;
}

function getRegionBestScore(region: Region, cache: Record<string, Forecast>): number {
  const crgs = REGION_CRAGS[region] || [];
  let best = -1;
  for (const rc of crgs) {
    const fc = cache[rc.id];
    if (!fc) continue;
    const src = fc.best || fc.ecmwf;
    if (!src?.daily) continue;
    src.daily.time.forEach((_: string, di: number) => {
      const s = blendedScore(fc, di, rc).score;
      if (s > best) best = s;
    });
  }
  return best;
}

// ─── Explore Crag Detail (expanded forecast) ───

function ExploreCragDetail({ crag, forecast, onAddToUsuals, alreadyAdded, prominent }: {
  crag: Crag;
  forecast: Forecast;
  onAddToUsuals?: (crag: Crag) => void;
  alreadyAdded: boolean;
  prominent?: boolean;
}) {
  const [justAdded, setJustAdded] = useState(false);
  const src = forecast.best || forecast.ecmwf;
  if (!src?.daily) return null;
  const todayStr = new Date().toISOString().slice(0, 10);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToUsuals) {
      onAddToUsuals(crag);
      setJustAdded(true);
    }
  };

  return (
    <div className="explore-crag-detail open">
      <div className="forecast-area">
        <div className="forecast-scroll">
          <div className="forecast-track">
            {src.daily.time.map((ds: string, di: number) => {
              if (ds < todayStr) return null;
              const bl = blendedScore(forecast, di, crag);
              const dayName = new Date(ds + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
              const dayNum = new Date(ds + 'T00:00:00').getDate();
              const wc = src.daily.weather_code[di];
              const tMin = src.daily.temperature_2m_min[di];
              const tMax = src.daily.temperature_2m_max[di];
              return (
                <div className="fday" key={ds}>
                  <div className="fday-name">{dayName} {dayNum}</div>
                  <div className="fday-icon"><WeatherIcon weatherCode={wc} /></div>
                  <div className="fday-wx-label">{wxLabel(wc)}</div>
                  <div className="fday-temp">[ {tMin != null ? Math.round(tMin) : '?'}° / {tMax != null ? Math.round(tMax) : '?'}° ]</div>
                  <div className={`score-pill ${scorePillClass(bl.score)}`}>{bl.score}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {onAddToUsuals && (
        (alreadyAdded || justAdded) ? (
          <button className={`add-to-usuals-btn added${prominent ? ' prominent' : ''}`} disabled>
            {justAdded && !alreadyAdded ? 'Added!' : 'Already in Usuals'}
          </button>
        ) : (
          <button className={`add-to-usuals-btn${prominent ? ' prominent' : ''}`} onClick={handleAdd}>
            {prominent ? '★ Save to Usuals' : '+ Add to Usuals'}
          </button>
        )
      )}
    </div>
  );
}

// ─── Explore Crag Row ───

function ExploreCragRow({ crag, forecast, isOpen, onToggle, onAddToUsuals, alreadyAdded, prominent }: {
  crag: Crag;
  forecast: Forecast | undefined;
  isOpen: boolean;
  onToggle: () => void;
  onAddToUsuals?: (crag: Crag) => void;
  alreadyAdded: boolean;
  prominent?: boolean;
}) {
  const todayStr = new Date().toISOString().slice(0, 10);

  let scoreHTML: React.ReactNode = null;
  if (forecast) {
    const src = forecast.best || forecast.ecmwf;
    if (src?.daily) {
      const scores = src.daily.time
        .map((ds: string, di: number) => {
          if (ds < todayStr) return null;
          const bl = blendedScore(forecast, di, crag);
          const dayName = new Date(ds + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
          return (
            <span key={ds} style={{ color: scoreColorHex(bl.score), fontWeight: 700 }}>
              {dayName} {bl.score}
            </span>
          );
        })
        .filter(Boolean)
        .slice(0, 4);
      if (scores.length > 0) {
        scoreHTML = (
          <div style={{ fontFamily: 'var(--font-data)', fontSize: '10px', marginTop: '4px' }}>
            {scores.map((s, i) => (
              <span key={i}>{i > 0 ? ' · ' : ''}{s}</span>
            ))}
          </div>
        );
      }
    }
  } else {
    scoreHTML = (
      <div style={{ fontFamily: 'var(--font-data)', fontSize: '10px', color: 'var(--ink-faint)', marginTop: '4px' }}>
        loading...
      </div>
    );
  }

  return (
    <div className="explore-crag" onClick={onToggle}>
      <div className="explore-crag-head">
        <span className="explore-crag-name">{crag.name}</span>
        <span className="explore-crag-meta">{crag.alt}m · {crag.rock}</span>
      </div>
      {scoreHTML}
      {isOpen && forecast && (
        <ExploreCragDetail
          crag={crag}
          forecast={forecast}
          onAddToUsuals={onAddToUsuals}
          alreadyAdded={alreadyAdded}
          prominent={prominent}
        />
      )}
    </div>
  );
}

// ─── Region Card ───

function RegionCard({ region, cache, isOpen, onToggle, expandedCrags, onToggleCrag, onAddToUsuals, usualsCrags, sortMode, prominent }: {
  region: Region;
  cache: Record<string, Forecast>;
  isOpen: boolean;
  onToggle: () => void;
  expandedCrags: Record<string, boolean>;
  onToggleCrag: (cragName: string) => void;
  onAddToUsuals?: (crag: Crag) => void;
  usualsCrags: Crag[];
  sortMode: SortMode;
  prominent?: boolean;
}) {
  const crgs = REGION_CRAGS[region] || [];

  // Region score for badge
  let regionScore: number;
  if (sortMode === 'weekend') {
    regionScore = getRegionWeekendScore(region, cache);
  } else if (sortMode === 'score') {
    regionScore = getRegionTodayScore(region, cache);
  } else {
    regionScore = getRegionBestScore(region, cache);
  }

  return (
    <div className="region-card">
      <div className="region-head" onClick={onToggle}>
        {region}{' '}
        {regionScore >= 0 && (
          <span className={`region-score-badge ${scorePillClass(regionScore)}`}>{regionScore}</span>
        )}
      </div>
      <div className={`region-crags${isOpen ? ' open' : ''}`}>
        {isOpen && crgs.map(rc => {
          const cragOpen = expandedCrags[rc.name] ?? false;
          const alreadyAdded = usualsCrags.some(uc => uc.name === rc.name && Math.abs(uc.lat - rc.lat) < 0.01);
          return (
            <ExploreCragRow
              key={rc.id}
              crag={rc}
              forecast={cache[rc.id]}
              isOpen={cragOpen}
              onToggle={() => onToggleCrag(rc.name)}
              onAddToUsuals={onAddToUsuals}
              alreadyAdded={alreadyAdded}
              prominent={prominent}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── ExploreTab ───

interface ExploreTabProps {
  onAddToUsuals?: (crag: Crag) => void;
}

export default function ExploreTab({ onAddToUsuals }: ExploreTabProps) {
  const platform = usePlatform();
  const prominent = platform === 'ios';
  const exploreFcCache = useForecastStore((s) => s.exploreFcCache);
  const fetchForecast = useForecastStore((s) => s.fetchForecast);
  const exploreSort = useUIStore((s) => s.exploreSort);
  const setExploreSort = useUIStore((s) => s.setExploreSort);
  const expandedExplore = useUIStore((s) => s.expandedExplore);
  const toggleExploreRegion = useUIStore((s) => s.toggleExploreRegion);
  const toggleExploreCrag = useUIStore((s) => s.toggleExploreCrag);

  // Import usuals crags for "Already in Usuals" check
  const [usualsCrags, setUsualsCrags] = useState<Crag[]>([]);
  useEffect(() => {
    // Dynamic import to avoid circular dependency
    import('@/stores/cragStore').then(({ useCragStore }) => {
      setUsualsCrags(useCragStore.getState().crags);
      return useCragStore.subscribe((s) => setUsualsCrags(s.crags));
    });
  }, []);

  const [hasFetched, setHasFetched] = useState(false);

  // Lazy-load: fetch all explore forecasts when tab first opens
  useEffect(() => {
    if (hasFetched) return;
    const allCrags = Object.values(REGION_CRAGS).flat();
    const anyLoaded = allCrags.some(rc => exploreFcCache[rc.id]);
    if (!anyLoaded) {
      useForecastStore.getState().fetchExploreForecast(allCrags).then(() => setHasFetched(true));
    } else {
      setHasFetched(true);
    }
  }, [hasFetched, exploreFcCache]);

  // Fetch forecasts for a region when it's expanded (for crags not yet in cache)
  const handleToggleRegion = useCallback((region: Region) => {
    toggleExploreRegion(region);
    // After toggling open, fetch any missing forecasts
    const isCurrentlyOpen = expandedExplore[region]?.open ?? false;
    if (!isCurrentlyOpen) {
      // Will be open after toggle
      const crgs = REGION_CRAGS[region] || [];
      crgs.forEach(async (rc) => {
        if (exploreFcCache[rc.id]) return;
        const fc = await fetchForecast(rc.lat, rc.lon);
        useForecastStore.setState(s => ({
          exploreFcCache: { ...s.exploreFcCache, [rc.id]: fc },
        }));
      });
    }
  }, [toggleExploreRegion, expandedExplore, exploreFcCache, fetchForecast]);

  const handleToggleCrag = useCallback((region: Region, cragName: string) => {
    toggleExploreCrag(region, cragName);
  }, [toggleExploreCrag]);

  // Sort regions
  const sortedRegions = useMemo((): Region[] => {
    const list = [...REGIONS];
    switch (exploreSort) {
      case 'weekend':
        return list.sort((a, b) => getRegionWeekendScore(b, exploreFcCache) - getRegionWeekendScore(a, exploreFcCache));
      case 'score':
        return list.sort((a, b) => getRegionTodayScore(b, exploreFcCache) - getRegionTodayScore(a, exploreFcCache));
      case 'name':
        return list.sort((a, b) => a.localeCompare(b));
      default:
        return list;
    }
  }, [exploreSort, exploreFcCache]);

  return (
    <>
      <div className="sort-bar" id="exploreSortBar">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.mode}
            className={`sort-pill${exploreSort === opt.mode ? ' active' : ''}`}
            onClick={() => setExploreSort(opt.mode)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div id="exploreGrid">
        {sortedRegions.map(region => (
          <RegionCard
            key={region}
            region={region}
            cache={exploreFcCache}
            isOpen={expandedExplore[region]?.open ?? false}
            onToggle={() => handleToggleRegion(region)}
            expandedCrags={expandedExplore[region]?.crags ?? {}}
            onToggleCrag={(name) => handleToggleCrag(region, name)}
            onAddToUsuals={onAddToUsuals}
            usualsCrags={usualsCrags}
            sortMode={exploreSort}
            prominent={prominent}
          />
        ))}
      </div>
    </>
  );
}
