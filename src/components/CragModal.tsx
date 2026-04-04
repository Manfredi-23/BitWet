'use client';

import { useState, useCallback } from 'react';
import type { Crag, RockType, TerrainType, Orientation } from '@/lib/types';

const ORIENTATIONS: Orientation[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const TERRAINS: TerrainType[] = ['slab', 'vertical', 'overhang'];
const ROCK_TYPES: RockType[] = ['Granite', 'Gneiss', 'Limestone', 'Sandstone', 'Conglomerate'];

interface CragModalProps {
  open: boolean;
  editCrag?: Crag | null;
  onClose: () => void;
  onSave: (data: Omit<Crag, 'id'>) => void;
}

interface FormState {
  name: string;
  region: string;
  lat: string;
  lon: string;
  alt: string;
  rock: RockType;
  orientation: Orientation[];
  terrain: TerrainType;
  notes: string;
}

function getInitialState(crag?: Crag | null): FormState {
  if (crag) {
    return {
      name: crag.name,
      region: crag.region,
      lat: String(crag.lat),
      lon: String(crag.lon),
      alt: String(crag.alt),
      rock: crag.rock,
      orientation: [...crag.orientation],
      terrain: crag.terrain,
      notes: crag.notes || '',
    };
  }
  return {
    name: '', region: '', lat: '', lon: '', alt: '',
    rock: 'Limestone', orientation: [], terrain: 'vertical', notes: '',
  };
}

function CragForm({ editCrag, onClose, onSave }: Omit<CragModalProps, 'open'>) {
  const [form, setForm] = useState<FormState>(() => getInitialState(editCrag));

  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleOrientation = useCallback((dir: Orientation) => {
    setForm(prev => ({
      ...prev,
      orientation: prev.orientation.includes(dir)
        ? prev.orientation.filter(d => d !== dir)
        : [...prev.orientation, dir],
    }));
  }, []);

  const handleSave = useCallback(() => {
    const trimmedName = form.name.trim();
    if (!trimmedName) return;
    onSave({
      name: trimmedName,
      region: form.region.trim(),
      lat: parseFloat(form.lat) || 0,
      lon: parseFloat(form.lon) || 0,
      alt: parseInt(form.alt) || 0,
      rock: form.rock,
      orientation: form.orientation,
      terrain: form.terrain,
      notes: form.notes.trim() || undefined,
    });
  }, [form, onSave]);

  return (
    <>
      <div className="modal-handle" />
      <h2>{editCrag ? 'Edit crag' : 'Add a crag'}</h2>

      <div className="field">
        <label>Name</label>
        <input type="text" value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Sobrio" />
      </div>

      <div className="field">
        <label>Region</label>
        <input type="text" value={form.region} onChange={e => update('region', e.target.value)} placeholder="e.g. Ticino" />
      </div>

      <div className="form-row">
        <div className="field">
          <label>Latitude</label>
          <input type="number" step="any" value={form.lat} onChange={e => update('lat', e.target.value)} placeholder="46.480" />
        </div>
        <div className="field">
          <label>Longitude</label>
          <input type="number" step="any" value={form.lon} onChange={e => update('lon', e.target.value)} placeholder="8.920" />
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label>Altitude (m)</label>
          <input type="number" value={form.alt} onChange={e => update('alt', e.target.value)} placeholder="950" />
        </div>
        <div className="field">
          <label>Rock type</label>
          <select value={form.rock} onChange={e => update('rock', e.target.value as RockType)}>
            {ROCK_TYPES.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label>Wall orientation</label>
        <div className="orient-grid">
          {ORIENTATIONS.map(dir => (
            <button
              key={dir}
              type="button"
              className={`orient-btn${form.orientation.includes(dir) ? ' sel' : ''}`}
              onClick={() => toggleOrientation(dir)}
            >
              {dir}
            </button>
          ))}
        </div>
        <p className="field-hint">Which directions catch sun</p>
      </div>

      <div className="field">
        <label>Terrain</label>
        <div className="orient-grid">
          {TERRAINS.map(t => (
            <button
              key={t}
              type="button"
              className={`orient-btn${form.terrain === t ? ' sel' : ''}`}
              onClick={() => update('terrain', t)}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="field-hint">Slab, vertical, or overhang — affects rain scoring</p>
      </div>

      <div className="field">
        <label>Notes</label>
        <textarea
          value={form.notes}
          onChange={e => update('notes', e.target.value)}
          placeholder="Approach info, parking, best sectors…"
        />
      </div>

      <div className="modal-btns">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSave}>Save</button>
      </div>
    </>
  );
}

export default function CragModal({ open, editCrag, onClose, onSave }: CragModalProps) {
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!open) return null;

  // Key forces remount when switching between add/edit or different crags
  const formKey = editCrag ? editCrag.id : '__add__';

  return (
    <div className="modal-overlay open" onClick={handleOverlayClick}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <CragForm key={formKey} editCrag={editCrag} onClose={onClose} onSave={onSave} />
      </div>
    </div>
  );
}
