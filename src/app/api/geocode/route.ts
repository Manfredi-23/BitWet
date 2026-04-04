import { NextRequest, NextResponse } from 'next/server';

const GEOCODING_API =
  'https://geocoding-api.open-meteo.com/v1/search';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');

  if (!q || !q.trim()) {
    return NextResponse.json(
      { error: 'q query parameter is required' },
      { status: 400 },
    );
  }

  const trimmed = q.trim();

  // Try parsing as coordinates: "47.37, 8.55" or "47.37 8.55"
  const parts = trimmed.split(/[,\s]+/).map(Number);
  if (
    parts.length >= 2 &&
    !isNaN(parts[0]) &&
    !isNaN(parts[1]) &&
    Math.abs(parts[0]) <= 90 &&
    Math.abs(parts[1]) <= 180
  ) {
    return NextResponse.json({
      results: [{ lat: parts[0], lon: parts[1], name: trimmed }],
    });
  }

  // Geocode via Open-Meteo
  try {
    const url = `${GEOCODING_API}?name=${encodeURIComponent(trimmed)}&count=1&language=en&format=json`;
    const res = await fetch(url);

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();

    if (!data.results?.length) {
      return NextResponse.json({ results: [] });
    }

    const results = data.results.map(
      (r: { latitude: number; longitude: number; name: string }) => ({
        lat: r.latitude,
        lon: r.longitude,
        name: r.name,
      }),
    );

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
