// Main menu background: a live AI-vs-AI skirmish on a small map, slowed down; the camera drifts between the bases.
// Silent (events are dropped, nothing goes to the audio engine). Stops baking and ticking as soon as it unmounts.
import { useEffect, useRef, useState } from 'react';
import { tick } from '../game/core/sim';
import { createGame, DEFAULT_SETTINGS } from '../game/core/state';
import { TICK_RATE } from '../game/data/config';
import { prepareArt } from '../game/render/art';
import { bakeBridges } from '../game/render/bridge';
import { Camera } from '../game/render/iso';
import { Renderer, type ViewState } from '../game/render/renderer';
import { createAI } from '../game/systems/ai';
import type { FactionId, GameState } from '../game/types';
import { MAP_PRESETS } from '../game/world/mapgen';
import { reducedMotion } from '../settings';

const MAPS = ['plains', 'rivers', 'highlands', 'coast'];
const FACTIONS: FactionId[] = ['allies', 'soviets', 'psi'];
const SPEED = 0.6; // fraction of normal game speed

function demoGame(): GameState {
  const r = (n: number) => Math.floor(Math.random() * n);
  const a = r(3), b = (a + 1 + r(2)) % 3;
  const s = createGame({ ...DEFAULT_SETTINGS, mapPreset: MAPS[r(MAPS.length)], mapSize: 'small', seed: r(1e9), faction: FACTIONS[a], enemyFaction: FACTIONS[b], difficulty: 'hard', startCredits: 10000, aiCount: 1, town: true });
  s.players[0].ai = true;
  s.ai.unshift(createAI(0, 'hard'));
  return s;
}

export function Attract({ tag = false }: { tag?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState('');
  useEffect(() => {
    let dead = false, raf = 0;
    const s = demoGame();
    const still = reducedMotion();
    // Start a moment later: the menu itself comes first, and a quick click-through never bakes anything.
    const delay = setTimeout(() => {
      prepareArt(s.players.filter((p) => !p.neutral), undefined, { abort: () => dead }).then(() => {
        if (dead) return;
        bakeBridges(s.map);
        const c = ref.current!, renderer = new Renderer(c), cam = new Camera(s.map.w, s.map.h);
        const fit = () => { cam.vw = c.clientWidth; cam.vh = c.clientHeight; renderer.resize(cam.vw, cam.vh); };
        fit(); addEventListener('resize', fit);
        cam.zoom = 0.9;
        const view: ViewState = { me: 0, selected: new Set(), hover: 0, drag: null, ghost: null, markers: [], floats: [] };
        const [p0, p1] = s.players;
        let acc = 0, last = performance.now(), time = 0;
        const frame = (now: number) => {
          if (dead) { removeEventListener('resize', fit); return; }
          const dt = Math.min(0.1, (now - last) / 1000); last = now; time += dt;
          if (!still && s.winner === -1) {
            acc += dt * TICK_RATE * SPEED;
            while (acc >= 1) { tick(s); acc -= 1; }
            s.rt.events.length = 0;
          }
          p0.visible.fill(1); p0.explored.fill(1); // the demo shows everything
          const k = still ? 0.5 : 0.5 - 0.5 * Math.cos(time * 0.035); // drift base → base and back, ~3 min per round trip
          cam.centerOn(p0.startX + (p1.startX - p0.startX) * k, p0.startY + (p1.startY - p0.startY) * k);
          renderer.render(s, cam, view, still ? 1 : acc, time);
          if (!still) raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
        setLive(MAP_PRESETS.find((m) => m.id === s.settings.mapPreset)!.name);
      });
    }, 600);
    return () => { dead = true; clearTimeout(delay); cancelAnimationFrame(raf); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <canvas ref={ref} className={`attract-bg ${live ? 'live' : ''}`} aria-hidden="true" />
      {tag && live && <div className="attract-tag"><i />Live · AI vs AI · {live}</div>}
    </>
  );
}
