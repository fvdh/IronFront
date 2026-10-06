// Dev-only: open /?art to inspect every baked sprite (orientation, scale, team colours).
import type { FactionId } from '../game/types';
import { useEffect, useRef, useState } from 'react';
import { BUILDINGS } from '../game/data/buildings';
import { UNITS } from '../game/data/units';
import { bakedBuilding, buildingTurret, bakedProp, BUILDING_ART, drawAtlas, PROP_ART, prepareArt, texturedTile, UNIT_ART, unitSprites, pivotOffset, rebakeUnit } from '../game/render/art';

const H = 4200;

/** ?art=anim — every animation row of the animated units (rows: idle, walk…, fire, death…; 4 facings each), 2× zoom. */
function drawAnimSheets(g: CanvasRenderingContext2D, team: { faction: FactionId; color: string }) {
  let x = 10, y = 10;
  for (const id of Object.keys(UNIT_ART)) {
    const u = unitSprites(id, team.faction, team.color);
    const r = u?.body.rows;
    if (!u || !r) continue;
    const n = r.death + r.deathN, F = u.body.frame;
    g.save(); g.translate(x, y); g.scale(2, 2);
    for (let row = 0; row < n; row++)
      for (let f = 0; f < 4; f++) drawAtlas(g, u.body, (f / 4) * Math.PI * 2 + Math.PI / 4, row * F * 0.8 + F / 2, f * F * 0.9 + F * 0.8, row);
    g.restore();
    g.fillStyle = '#fff'; g.fillText(id, x, y + 8);
    y += F * 2 * 3.8;
    if (y > H - 300) { y = 10; x += 800; }
  }
}

export function ArtDebug() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState('baking…');
  useEffect(() => {
    const t0 = performance.now();
    const teams = [{ faction: 'allies' as const, color: '#2f7de1' }, { faction: 'soviets' as const, color: '#d8412f' }, { faction: 'psi' as const, color: '#3fbf5a' }];
    prepareArt(teams, (f) => setStatus(`baking ${Math.round(f * 100)}%`), { all: true }).then(() => {
      setStatus(`done in ${Math.round(performance.now() - t0)} ms`);
      const g = ref.current!.getContext('2d')!;
      g.fillStyle = '#3b4a2c'; g.fillRect(0, 0, 1600, H);
      if (location.search.includes('anim')) {
        const redraw = () => { g.fillStyle = '#3b4a2c'; g.fillRect(0, 0, 1600, H); drawAnimSheets(g, teams[0]); };
        redraw();
        // console tuning: edit __artAnim.UNIT_ART[id].parts[n].at/rot, then await __artAnim.rebake(id)
        (window as unknown as Record<string, unknown>).__artAnim = { UNIT_ART, unitSprites, rebake: async (id: string) => { await rebakeUnit(id, teams[0].faction, teams[0].color); redraw(); } };
        return;
      }
      // terrain strip
      for (let t = 0; t < 7; t++) for (let k = 0; k < 4; k++) { const c = texturedTile(t, k, 0); if (c) g.drawImage(c, 20 + t * 140 + k * 32, 20 + k * 16, 64, 32); }
      let y = 120;
      for (const team of teams) {
        let x = 20;
        for (const id of Object.keys(UNIT_ART)) {
          const u = unitSprites(id, team.faction, team.color);
          if (!u) continue;
          for (let f = 0; f < 8; f++) {
            const th = (f / 8) * Math.PI * 2;
            const cx = x + (f % 4) * 70 + 35, cy = y + Math.floor(f / 4) * 70 + 50;
            drawAtlas(g, u.body, th, cx, cy);
            if (u.turret) { const [ox, oy] = pivotOffset(u, th); drawAtlas(g, u.turret, th, cx + ox, cy + oy); }
            g.fillStyle = '#ff0'; g.fillRect(cx - 1, cy - 1, 2, 2);
            g.strokeStyle = '#f0f'; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + (Math.cos(th) - Math.sin(th)) * 20, cy + (Math.cos(th) + Math.sin(th)) * 10); g.stroke();
          }
          g.fillStyle = '#fff'; g.fillText(id, x, y + 150);
          x += 290;
          if (x > 1400) { x = 20; y += 170; }
        }
        y += 170;
        x = 20;
        for (const def of Object.keys(BUILDINGS)) {
          const b = bakedBuilding(BUILDINGS[def].sprite, team.faction, team.color);
          if (!b) continue;
          g.drawImage(b.c, x, y, b.w, b.h);
          const t = buildingTurret(BUILDINGS[def].sprite, team.faction, team.color);
          if (t) drawAtlas(g, t.body, Math.PI * 0.25, x + b.ox, y + b.oy + 16);
          g.fillStyle = '#fff'; g.fillText(def, x, y + b.h + 10);
          x += b.w + 10;
          if (x > 1350) { x = 20; y += 260; }
        }
        y += 260;
      }
      // Enlarged: hull row, turret row, combined row for the soviet tank.
      const u = unitSprites('unit.tank.soviets', 'allies', '#2f7de1')!;
      g.save(); g.translate(0, y); g.scale(2.5, 2.5);
      for (let f = 0; f < 8; f++) {
        const th = (f / 8) * Math.PI * 2, cx = 40 + f * 70;
        drawAtlas(g, u.body, th, cx, 40);
        if (u.turret) drawAtlas(g, u.turret, th, cx, 100);
        const [ox, oy] = pivotOffset(u, th); drawAtlas(g, u.body, th, cx, 160); if (u.turret) drawAtlas(g, u.turret, th, cx + ox, 160 + oy);
        g.strokeStyle = '#f0f'; g.beginPath(); g.moveTo(cx, 40); g.lineTo(cx + (Math.cos(th) - Math.sin(th)) * 20, 40 + (Math.cos(th) + Math.sin(th)) * 10); g.stroke();
      }
      g.restore();
      y += 480;
      let x = 20;
      for (const id of Object.keys(PROP_ART)) { const p = bakedProp(id); if (p) { g.drawImage(p.c, x, y, p.w, p.h); x += p.w; } }
      void BUILDING_ART; void UNITS;
    });
  }, []);
  return (
    <div style={{ overflow: 'auto', height: '100%' }}>
      <p style={{ margin: 8 }}>{status}</p>
      <canvas ref={ref} width={1600} height={H} />
    </div>
  );
}
