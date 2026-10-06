import { BUILDINGS } from '../data/buildings';
import { UNITS } from '../data/units';
import type { GameState } from '../types';
import { rebuildRuntime } from './entities';
import { SAVE_VERSION } from './state';

/** localStorage key for the quick save. Lives here (not in Game.ts) so the menu can check for a save
 *  without pulling the renderer/three.js into the initial bundle. */
export const SAVE_KEY = 'ironfront.save';

const TYPED = { Uint8Array, Uint16Array, Int32Array } as const;
type TypedName = keyof typeof TYPED;

export function serialize(s: GameState): string {
  const { rt: _rt, ...data } = s;
  return JSON.stringify({ format: 'iron-front-save', ...data }, (_k, v) => {
    if (ArrayBuffer.isView(v)) return { $t: v.constructor.name, d: Array.from(v as Uint8Array) };
    return v;
  });
}

export class SaveError extends Error {}

/** Parse and validate a save. Throws SaveError with a readable message on corrupt/incompatible data. */
export function deserialize(json: string): GameState {
  let raw: any;
  try {
    raw = JSON.parse(json, (_k, v) => {
      if (v && typeof v === 'object' && typeof v.$t === 'string' && Array.isArray(v.d)) {
        const C = TYPED[v.$t as TypedName];
        if (!C) throw new SaveError(`Unknown data type in save: ${v.$t}`);
        return new C(v.d);
      }
      return v;
    });
  } catch (e) {
    throw e instanceof SaveError ? e : new SaveError('Save file is corrupt (invalid JSON).');
  }
  if (raw?.format !== 'iron-front-save') throw new SaveError('This is not an Iron Front save file.');
  if (raw.version !== SAVE_VERSION) throw new SaveError(`Incompatible save version ${raw.version} (expected ${SAVE_VERSION}).`);
  const m = raw.map;
  const n = m?.w * m?.h;
  const arrOk = (a: unknown, C: Function) => a instanceof C && (a as Uint8Array).length === n;
  if (!n || !arrOk(m.terrain, Uint8Array) || !arrOk(m.ore, Uint16Array) || !arrOk(m.gem, Uint8Array) || !arrOk(m.deco, Uint8Array))
    throw new SaveError('Save file is corrupt (invalid map data).');
  if (!Array.isArray(raw.players) || raw.players.length < 1 || !raw.players.every((p: any) => arrOk(p.explored, Uint8Array) && arrOk(p.visible, Uint8Array) && typeof p.credits === 'number'))
    throw new SaveError('Save file is corrupt (invalid player data).');
  if (!Array.isArray(raw.entities) || !raw.entities.every((e: any) => typeof e.id === 'number' && (BUILDINGS[e.def] || UNITS[e.def]) && e.owner >= 0 && e.owner < raw.players.length))
    throw new SaveError('Save file contains unknown units or buildings.');
  if (!Array.isArray(m.oreSources)) m.oreSources = []; // saves from before ore mines
  for (const e of raw.entities) if (typeof e.stuckDist !== 'number') e.stuckDist = 1e9; // older saves stored Infinity, which JSON turns into null
  delete raw.format;
  const s = raw as GameState;
  rebuildRuntime(s);
  return s;
}
