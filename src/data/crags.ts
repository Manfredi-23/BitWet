// ═══════════════════════════════════════════
// BitWet — Crag database
// Ported verbatim from data.js
// ═══════════════════════════════════════════

import type { Crag } from '@/lib/types';
import type { Region } from './regions';

/** The 6 default "Usuals" crags */
export const DEFAULT_CRAGS: Crag[] = [
  {
    id: 'sobrio', name: 'Sobrio', region: 'Ticino', lat: 46.480, lon: 8.920, alt: 950,
    rock: 'Gneiss', orientation: ['S', 'SE', 'SW'], terrain: 'vertical',
    notes: 'Steep gneiss in the trees above Faido. South-facing keeps it warm in shoulder season. The approach is short enough that you\'ll wonder why you\'re already out of breath. October through April is prime time — summer turns it into a convection oven.',
  },
  {
    id: 'chironico', name: 'Chironico Boulder', region: 'Ticino', lat: 46.445, lon: 8.855, alt: 450,
    rock: 'Gneiss', orientation: ['S', 'SE', 'SW'], terrain: 'overhang',
    notes: 'World-class gneiss bouldering in the Leventina valley. Overhanging crimps, roofs, and arêtes scattered through ancient forest. The rock quality is exceptional — crystalline, featured, and honest. Parking is a bloodsport on weekends. Best: October through May.',
  },
  {
    id: 'salbit-westgrat', name: 'Salbit Westgrat', region: 'Uri / Göschenen', lat: 46.757, lon: 8.542, alt: 2400,
    rock: 'Granite', orientation: ['W', 'SW', 'NW'], terrain: 'vertical',
    notes: 'One of the greatest granite ridges in the Alps. 36 pitches, 1000m of climbing over six towers of bulletproof Uri granite to the 2981m summit. Requires fast, confident climbing to 6b. Access from Salbithütte via the hanging bridge. July–September only.',
  },
  {
    id: 'wintersonne', name: 'Wintersonne', region: 'Zentralschweiz / Pilatus', lat: 46.973, lon: 8.244, alt: 1800,
    rock: 'Limestone', orientation: ['S', 'SW'], terrain: 'slab',
    notes: '175m multipitch on Pilatus limestone, rated 6b+ and appropriately named — the south face catches winter sun when everything else is in shadow. Technical slab and wall climbing with tremendous views over the Vierwaldstättersee. Dries fast after rain thanks to the exposure.',
  },
  {
    id: 'sonnenplattli', name: 'Sonnenplättli', region: 'Schwyz', lat: 46.994, lon: 8.524, alt: 650,
    rock: 'Limestone', orientation: ['S', 'SW'], terrain: 'slab',
    notes: 'Lakeside limestone sport crag near Schwyz with views that almost justify the grades. South-facing and low altitude — perfect for winter cragging, unbearable from June. Parking is an optimistic word for what happens on weekends. Technical slabs and crimpy faces.',
  },
  {
    id: 'plattenkreuz', name: 'Plattenkreuz', region: 'Glarus / Näfels', lat: 47.103, lon: 9.065, alt: 729,
    rock: 'Limestone', orientation: ['S', 'SE'], terrain: 'slab',
    notes: 'Glarnerkalk above Näfels with literally seconds of approach from the car. The rock is technically demanding — partly smooth and splinter-prone, rewarding precise footwork. Beautiful views from the cross. Summer crag; very popular after work and on weekends. Grades 4b–8b across ~85 routes.',
  },
];

/** Helper to generate a stable id from crag name */
function cragId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** All explore crags grouped by region, ported from REGION_CRAGS in data.js */
export const REGION_CRAGS: Record<Region, Crag[]> = {
  'Ticino': [
    { id: cragId('Cresciano Boulder'), name: 'Cresciano Boulder', region: 'Ticino', lat: 46.432, lon: 8.940, alt: 400, rock: 'Gneiss', orientation: ['S', 'SW'], terrain: 'vertical' },
    { id: cragId('Chironico Boulder'), name: 'Chironico Boulder', region: 'Ticino', lat: 46.445, lon: 8.855, alt: 750, rock: 'Gneiss', orientation: ['S', 'SE'], terrain: 'vertical' },
    { id: cragId('Brione'), name: 'Brione', region: 'Ticino', lat: 46.375, lon: 8.805, alt: 350, rock: 'Gneiss', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Ponte Brolla'), name: 'Ponte Brolla', region: 'Ticino', lat: 46.190, lon: 8.745, alt: 280, rock: 'Gneiss', orientation: ['S', 'SW'], terrain: 'vertical' },
    { id: cragId('Lodrino'), name: 'Lodrino', region: 'Ticino', lat: 46.300, lon: 8.970, alt: 310, rock: 'Gneiss', orientation: ['SE'], terrain: 'vertical' },
    { id: cragId('Lavorgo'), name: 'Lavorgo', region: 'Ticino', lat: 46.455, lon: 8.835, alt: 630, rock: 'Gneiss', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Osogna'), name: 'Osogna', region: 'Ticino', lat: 46.320, lon: 8.990, alt: 280, rock: 'Gneiss', orientation: ['SW'], terrain: 'vertical' },
    { id: cragId('Arcegno'), name: 'Arcegno', region: 'Ticino', lat: 46.175, lon: 8.730, alt: 330, rock: 'Gneiss', orientation: ['S', 'SE'], terrain: 'vertical' },
    { id: cragId('Personico'), name: 'Personico', region: 'Ticino', lat: 46.363, lon: 8.932, alt: 330, rock: 'Gneiss', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Claro'), name: 'Claro', region: 'Ticino', lat: 46.330, lon: 9.020, alt: 350, rock: 'Gneiss', orientation: ['S', 'SW'], terrain: 'vertical' },
  ],
  'Wallis/Valais': [
    { id: cragId('Saillon'), name: 'Saillon', region: 'Wallis/Valais', lat: 46.170, lon: 7.190, alt: 480, rock: 'Gneiss', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Nax'), name: 'Nax', region: 'Wallis/Valais', lat: 46.220, lon: 7.430, alt: 1300, rock: 'Gneiss', orientation: ['S', 'SE'], terrain: 'vertical' },
    { id: cragId('Evolène'), name: 'Evolène', region: 'Wallis/Valais', lat: 46.115, lon: 7.495, alt: 1400, rock: 'Gneiss', orientation: ['S', 'SW'], terrain: 'vertical' },
    { id: cragId('Raron'), name: 'Raron', region: 'Wallis/Valais', lat: 46.310, lon: 7.810, alt: 680, rock: 'Limestone', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Brig Schallberg'), name: 'Brig (Schallberg)', region: 'Wallis/Valais', lat: 46.310, lon: 8.020, alt: 1350, rock: 'Gneiss', orientation: ['S', 'SE'], terrain: 'vertical' },
    { id: cragId('Vercorin'), name: 'Vercorin', region: 'Wallis/Valais', lat: 46.260, lon: 7.530, alt: 1340, rock: 'Gneiss', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Zermatt Furi'), name: 'Zermatt (Furi)', region: 'Wallis/Valais', lat: 46.005, lon: 7.745, alt: 1850, rock: 'Gneiss', orientation: ['SE'], terrain: 'vertical' },
    { id: cragId('Dorénaz'), name: 'Dorénaz', region: 'Wallis/Valais', lat: 46.140, lon: 7.045, alt: 500, rock: 'Limestone', orientation: ['S', 'SW'], terrain: 'vertical' },
    { id: cragId('Martigny La Bâtiaz'), name: 'Martigny (La Bâtiaz)', region: 'Wallis/Valais', lat: 46.105, lon: 7.075, alt: 510, rock: 'Limestone', orientation: ['SW'], terrain: 'vertical' },
    { id: cragId('Stalden'), name: 'Stalden', region: 'Wallis/Valais', lat: 46.230, lon: 7.870, alt: 800, rock: 'Gneiss', orientation: ['S', 'SE'], terrain: 'vertical' },
  ],
  'Berner Oberland': [
    { id: cragId('Gimmelwald'), name: 'Gimmelwald', region: 'Berner Oberland', lat: 46.548, lon: 7.895, alt: 1380, rock: 'Limestone', orientation: ['S', 'SW'], terrain: 'vertical' },
    { id: cragId('Oeschinensee'), name: 'Oeschinensee', region: 'Berner Oberland', lat: 46.505, lon: 7.725, alt: 1600, rock: 'Limestone', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Gastlosen'), name: 'Gastlosen', region: 'Berner Oberland', lat: 46.605, lon: 7.242, alt: 1800, rock: 'Limestone', orientation: ['S', 'SW'], terrain: 'vertical' },
    { id: cragId('Kandersteg'), name: 'Kandersteg', region: 'Berner Oberland', lat: 46.490, lon: 7.675, alt: 1200, rock: 'Limestone', orientation: ['S', 'SE'], terrain: 'vertical' },
    { id: cragId('Innertkirchen'), name: 'Innertkirchen', region: 'Berner Oberland', lat: 46.710, lon: 8.220, alt: 640, rock: 'Granite', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Bätterich'), name: 'Bätterich', region: 'Berner Oberland', lat: 46.683, lon: 7.850, alt: 850, rock: 'Limestone', orientation: ['S', 'SW'], terrain: 'vertical' },
    { id: cragId('Rinderhorn'), name: 'Rinderhorn', region: 'Berner Oberland', lat: 46.405, lon: 7.700, alt: 2100, rock: 'Limestone', orientation: ['SE'], terrain: 'vertical' },
    { id: cragId('Guttannen'), name: 'Guttannen', region: 'Berner Oberland', lat: 46.660, lon: 8.280, alt: 1100, rock: 'Granite', orientation: ['S', 'SE'], terrain: 'vertical' },
    { id: cragId('Erstfeld Resti'), name: 'Erstfeld (Resti)', region: 'Berner Oberland', lat: 46.830, lon: 8.650, alt: 600, rock: 'Granite', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Meiringen'), name: 'Meiringen', region: 'Berner Oberland', lat: 46.725, lon: 8.185, alt: 600, rock: 'Limestone', orientation: ['S', 'SW'], terrain: 'vertical' },
  ],
  'Zentralschweiz': [
    { id: cragId('Engelberg'), name: 'Engelberg', region: 'Zentralschweiz', lat: 46.820, lon: 8.410, alt: 1050, rock: 'Limestone', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Gersau'), name: 'Gersau', region: 'Zentralschweiz', lat: 46.994, lon: 8.524, alt: 500, rock: 'Limestone', orientation: ['S', 'SW'], terrain: 'vertical' },
    { id: cragId('Melchsee-Frutt'), name: 'Melchsee-Frutt', region: 'Zentralschweiz', lat: 46.775, lon: 8.270, alt: 1920, rock: 'Limestone', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Brunnen'), name: 'Brunnen', region: 'Zentralschweiz', lat: 46.995, lon: 8.610, alt: 440, rock: 'Limestone', orientation: ['S', 'SE'], terrain: 'vertical' },
    { id: cragId('Stoos'), name: 'Stoos', region: 'Zentralschweiz', lat: 46.980, lon: 8.665, alt: 1300, rock: 'Limestone', orientation: ['SW'], terrain: 'vertical' },
    { id: cragId('Pilatus'), name: 'Pilatus', region: 'Zentralschweiz', lat: 46.960, lon: 8.260, alt: 1800, rock: 'Limestone', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Rigi'), name: 'Rigi', region: 'Zentralschweiz', lat: 47.050, lon: 8.480, alt: 1000, rock: 'Limestone', orientation: ['S', 'SW'], terrain: 'vertical' },
    { id: cragId('Sisikon'), name: 'Sisikon', region: 'Zentralschweiz', lat: 46.955, lon: 8.650, alt: 500, rock: 'Limestone', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Beckenried'), name: 'Beckenried', region: 'Zentralschweiz', lat: 46.965, lon: 8.475, alt: 440, rock: 'Limestone', orientation: ['S', 'SE'], terrain: 'vertical' },
    { id: cragId('Schwyz'), name: 'Schwyz', region: 'Zentralschweiz', lat: 47.020, lon: 8.650, alt: 600, rock: 'Limestone', orientation: ['S', 'SW'], terrain: 'vertical' },
  ],
  'Jura': [
    { id: cragId('Biel Frinvillier'), name: 'Biel / Frinvillier', region: 'Jura', lat: 47.170, lon: 7.230, alt: 500, rock: 'Limestone', orientation: ['S', 'SW'], terrain: 'vertical' },
    { id: cragId('Moutier'), name: 'Moutier', region: 'Jura', lat: 47.280, lon: 7.370, alt: 550, rock: 'Limestone', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Delémont'), name: 'Delémont', region: 'Jura', lat: 47.365, lon: 7.345, alt: 430, rock: 'Limestone', orientation: ['SE'], terrain: 'vertical' },
    { id: cragId('Péry'), name: 'Péry', region: 'Jura', lat: 47.190, lon: 7.250, alt: 580, rock: 'Limestone', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Roches Gorges Court'), name: 'Roches (Gorges Court)', region: 'Jura', lat: 47.282, lon: 7.360, alt: 520, rock: 'Limestone', orientation: ['S', 'SW'], terrain: 'vertical' },
    { id: cragId('Crémines'), name: 'Crémines', region: 'Jura', lat: 47.295, lon: 7.395, alt: 600, rock: 'Limestone', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Balsthal'), name: 'Balsthal', region: 'Jura', lat: 47.320, lon: 7.690, alt: 500, rock: 'Limestone', orientation: ['S', 'SE'], terrain: 'vertical' },
    { id: cragId('Gänsbrunnen'), name: 'Gänsbrunnen', region: 'Jura', lat: 47.280, lon: 7.430, alt: 750, rock: 'Limestone', orientation: ['SW'], terrain: 'vertical' },
    { id: cragId('Liesberg'), name: 'Liesberg', region: 'Jura', lat: 47.400, lon: 7.430, alt: 460, rock: 'Limestone', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Vermes'), name: 'Vermes', region: 'Jura', lat: 47.330, lon: 7.325, alt: 680, rock: 'Limestone', orientation: ['S', 'SW'], terrain: 'vertical' },
  ],
  'Ostschweiz/Graubünden': [
    { id: cragId('Chur Haldenstein'), name: 'Chur (Haldenstein)', region: 'Ostschweiz/Graubünden', lat: 46.880, lon: 9.520, alt: 600, rock: 'Limestone', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Flims'), name: 'Flims', region: 'Ostschweiz/Graubünden', lat: 46.835, lon: 9.280, alt: 1100, rock: 'Limestone', orientation: ['S', 'SW'], terrain: 'vertical' },
    { id: cragId('Avers'), name: 'Avers', region: 'Ostschweiz/Graubünden', lat: 46.470, lon: 9.555, alt: 2000, rock: 'Gneiss', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Bergün'), name: 'Bergün', region: 'Ostschweiz/Graubünden', lat: 46.630, lon: 9.745, alt: 1380, rock: 'Granite', orientation: ['S', 'SE'], terrain: 'vertical' },
    { id: cragId('Zillis'), name: 'Zillis', region: 'Ostschweiz/Graubünden', lat: 46.630, lon: 9.440, alt: 950, rock: 'Gneiss', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('San Bernardino'), name: 'San Bernardino', region: 'Ostschweiz/Graubünden', lat: 46.460, lon: 9.170, alt: 1600, rock: 'Gneiss', orientation: ['S', 'SW'], terrain: 'vertical' },
    { id: cragId('Mesocco'), name: 'Mesocco', region: 'Ostschweiz/Graubünden', lat: 46.395, lon: 9.225, alt: 780, rock: 'Gneiss', orientation: ['SE'], terrain: 'vertical' },
    { id: cragId('Poschiavo'), name: 'Poschiavo', region: 'Ostschweiz/Graubünden', lat: 46.325, lon: 10.060, alt: 1000, rock: 'Granite', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Davos'), name: 'Davos', region: 'Ostschweiz/Graubünden', lat: 46.800, lon: 9.830, alt: 1560, rock: 'Gneiss', orientation: ['S', 'SW'], terrain: 'vertical' },
    { id: cragId('Splügen'), name: 'Splügen', region: 'Ostschweiz/Graubünden', lat: 46.545, lon: 9.320, alt: 1460, rock: 'Gneiss', orientation: ['S'], terrain: 'vertical' },
  ],
  'Gotthard/Uri': [
    { id: cragId('Göschenen'), name: 'Göschenen', region: 'Gotthard/Uri', lat: 46.665, lon: 8.590, alt: 1100, rock: 'Granite', orientation: ['S', 'SE'], terrain: 'vertical' },
    { id: cragId('Andermatt'), name: 'Andermatt', region: 'Gotthard/Uri', lat: 46.635, lon: 8.595, alt: 1440, rock: 'Granite', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Wassen'), name: 'Wassen', region: 'Gotthard/Uri', lat: 46.710, lon: 8.600, alt: 930, rock: 'Granite', orientation: ['S', 'SW'], terrain: 'vertical' },
    { id: cragId('Realp'), name: 'Realp', region: 'Gotthard/Uri', lat: 46.600, lon: 8.505, alt: 1550, rock: 'Granite', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Hospental'), name: 'Hospental', region: 'Gotthard/Uri', lat: 46.620, lon: 8.570, alt: 1500, rock: 'Granite', orientation: ['SE'], terrain: 'vertical' },
    { id: cragId('Silenen'), name: 'Silenen', region: 'Gotthard/Uri', lat: 46.790, lon: 8.680, alt: 500, rock: 'Granite', orientation: ['S', 'SE'], terrain: 'vertical' },
    { id: cragId('Gurtnellen'), name: 'Gurtnellen', region: 'Gotthard/Uri', lat: 46.740, lon: 8.625, alt: 750, rock: 'Granite', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Airolo'), name: 'Airolo', region: 'Gotthard/Uri', lat: 46.530, lon: 8.610, alt: 1200, rock: 'Granite', orientation: ['S', 'SW'], terrain: 'vertical' },
    { id: cragId('Attinghausen'), name: 'Attinghausen', region: 'Gotthard/Uri', lat: 46.860, lon: 8.620, alt: 470, rock: 'Granite', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Bürglen'), name: 'Bürglen', region: 'Gotthard/Uri', lat: 46.875, lon: 8.680, alt: 550, rock: 'Limestone', orientation: ['S', 'SE'], terrain: 'vertical' },
  ],
  'Voralpen': [
    { id: cragId('Gantrisch'), name: 'Gantrisch', region: 'Voralpen', lat: 46.725, lon: 7.440, alt: 1550, rock: 'Limestone', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Stockhorn'), name: 'Stockhorn', region: 'Voralpen', lat: 46.695, lon: 7.540, alt: 1600, rock: 'Limestone', orientation: ['S', 'SW'], terrain: 'vertical' },
    { id: cragId('Justistal'), name: 'Justistal', region: 'Voralpen', lat: 46.705, lon: 7.720, alt: 1000, rock: 'Limestone', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Niederhorn'), name: 'Niederhorn', region: 'Voralpen', lat: 46.730, lon: 7.770, alt: 1500, rock: 'Limestone', orientation: ['S', 'SE'], terrain: 'vertical' },
    { id: cragId('Sigriswil'), name: 'Sigriswil', region: 'Voralpen', lat: 46.715, lon: 7.720, alt: 800, rock: 'Limestone', orientation: ['S', 'SW'], terrain: 'vertical' },
    { id: cragId('Niesen'), name: 'Niesen', region: 'Voralpen', lat: 46.645, lon: 7.650, alt: 1400, rock: 'Limestone', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Eriz'), name: 'Eriz', region: 'Voralpen', lat: 46.770, lon: 7.800, alt: 1100, rock: 'Limestone', orientation: ['S', 'SE'], terrain: 'vertical' },
    { id: cragId('Saxeten'), name: 'Saxeten', region: 'Voralpen', lat: 46.650, lon: 7.835, alt: 1000, rock: 'Limestone', orientation: ['S'], terrain: 'vertical' },
    { id: cragId('Habkern'), name: 'Habkern', region: 'Voralpen', lat: 46.740, lon: 7.870, alt: 950, rock: 'Limestone', orientation: ['S', 'SW'], terrain: 'vertical' },
    { id: cragId('Gurnigel'), name: 'Gurnigel', region: 'Voralpen', lat: 46.730, lon: 7.460, alt: 1500, rock: 'Limestone', orientation: ['SW'], terrain: 'vertical' },
  ],
};

/** Flat array of all explore crags across all regions */
export const ALL_EXPLORE_CRAGS: Crag[] = Object.values(REGION_CRAGS).flat();
