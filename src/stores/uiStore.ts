// ═══════════════════════════════════════════
// BitWet — Zustand UI Store
// ═══════════════════════════════════════════

import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { Theme } from '@/lib/storage';

export type TabId = 'usuals' | 'explore' | 'planner';
export type SortMode = 'weekend' | 'score' | 'name';

interface ExpandedExploreRegion {
  open: boolean;
  crags: Record<string, boolean>;
}

interface UIState {
  /** Currently active tab */
  activeTab: TabId;
  /** Sort mode for Usuals tab */
  currentSort: SortMode;
  /** Sort mode for Explore tab */
  exploreSort: SortMode;
  /** Expanded day index per crag id (Usuals tab) */
  expandedDays: Record<string, number | undefined>;
  /** Expanded state for Explore regions and their crags */
  expandedExplore: Record<string, ExpandedExploreRegion>;
  /** Current theme */
  theme: Theme;

  setActiveTab: (tab: TabId) => void;
  setSort: (sort: SortMode) => void;
  setExploreSort: (sort: SortMode) => void;
  toggleDayExpanded: (cragId: string, dayIdx: number) => void;
  toggleExploreRegion: (region: string) => void;
  toggleExploreCrag: (region: string, cragName: string) => void;
  setTheme: (theme: Theme) => void;
}

function getInitialTheme(): Theme {
  const saved = storage.getTheme();
  if (saved) return saved;
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export const useUIStore = create<UIState>((set, get) => ({
  activeTab: 'usuals',
  currentSort: 'weekend',
  exploreSort: 'weekend',
  expandedDays: {},
  expandedExplore: {},
  theme: getInitialTheme(),

  setActiveTab(tab) {
    set({ activeTab: tab });
  },

  setSort(sort) {
    set({ currentSort: sort });
  },

  setExploreSort(sort) {
    set({ exploreSort: sort });
  },

  toggleDayExpanded(cragId, dayIdx) {
    const expanded = { ...get().expandedDays };
    expanded[cragId] = expanded[cragId] === dayIdx ? undefined : dayIdx;
    set({ expandedDays: expanded });
  },

  toggleExploreRegion(region) {
    const explore = { ...get().expandedExplore };
    if (!explore[region]) {
      explore[region] = { open: true, crags: {} };
    } else {
      explore[region] = { ...explore[region], open: !explore[region].open };
    }
    set({ expandedExplore: explore });
  },

  toggleExploreCrag(region, cragName) {
    const explore = { ...get().expandedExplore };
    if (!explore[region]) {
      explore[region] = { open: true, crags: { [cragName]: true } };
    } else {
      const crags = { ...explore[region].crags };
      crags[cragName] = !crags[cragName];
      explore[region] = { ...explore[region], crags };
    }
    set({ expandedExplore: explore });
  },

  setTheme(theme) {
    storage.setTheme(theme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    set({ theme });
  },
}));
