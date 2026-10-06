// Small isometric picture of a generated map with numbered start positions (lobby and briefing).
import { useEffect, useRef } from 'react';
import type { GameMap } from '../game/types';
import { TERRAIN_MINIMAP } from '../game/world/map';

const rgb = TERRAIN_MINIMAP.map((h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16)));

export function MapPreview({ map, starts, colors, width = 340, label }: { map: GameMap; starts: [number, number][]; colors: string[]; width?: number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const height = width / 2;
  useEffect(() => {
    const c = ref.current!, dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = width * dpr; c.height = height * dpr;
    const g = c.getContext('2d')!, { w, h } = map;
    const off = document.createElement('canvas'); off.width = w; off.height = h;
    const og = off.getContext('2d')!, img = og.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const [r, gg, b] = map.ore[i] ? (map.gem[i] ? [90, 210, 230] : [214, 170, 60]) : rgb[map.terrain[i]];
      img.data.set([r, gg, b, 255], i * 4);
    }
    og.putImageData(img, 0, 0);
    const k = width / (w + h), ox = h * k;
    g.imageSmoothingEnabled = false;
    g.setTransform(k * dpr, (k / 2) * dpr, -k * dpr, (k / 2) * dpr, ox * dpr, 0);
    g.drawImage(off, 0, 0);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    starts.forEach(([x, y], i) => {
      const sx = ox + (x - y) * k, sy = ((x + y) * k) / 2;
      g.fillStyle = 'rgba(7,9,11,0.85)'; g.beginPath(); g.arc(sx, sy, 9, 0, Math.PI * 2); g.fill();
      g.strokeStyle = colors[i] ?? '#fff'; g.lineWidth = 2.5; g.stroke();
      g.fillStyle = '#f2f0e8'; g.font = '700 12px "Barlow Condensed", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(i + 1), sx, sy + 0.5);
    });
  }, [map, starts, colors, width, height]);
  return <canvas ref={ref} className="mappreview" style={{ width, height }} role="img" aria-label={label} />;
}
