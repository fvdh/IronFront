import type { GameEvent, GameState } from '../types';
import { telemetryOnEvent } from '../systems/telemetry';

/** Every simulation event goes through here: to the runtime queue (sound, messages) and to the telemetry. */
export function emit(s: GameState, ev: GameEvent) {
  s.rt.events.push(ev);
  if (s.telemetry) telemetryOnEvent(s, ev);
}
