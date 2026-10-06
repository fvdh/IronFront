import { describe, expect, it } from 'vitest';
// @ts-expect-error the project has no Node typings; vitest runs in Node (CSS imports are stubbed there, so read the file)
import { readFileSync } from 'node:fs';

const css: string = readFileSync('src/styles.css', 'utf8');

// ---- colour maths: OKLCH → linear sRGB → WCAG relative luminance
function luminance([L, C, h]: number[]): number {
  const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  const [r, g, bl] = rgb.map((v) => Math.min(1, Math.max(0, v)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}
const contrast = (x: number[], y: number[]) => { const [a, b] = [luminance(x), luminance(y)].sort((p, q) => q - p); return (a + 0.05) / (b + 0.05); };

/** Token values per theme: :root, then each [data-faction] block on top. */
function themes(): Record<string, Record<string, number[]>> {
  const block = (sel: string) => css.slice(css.indexOf(sel)).split('}')[0];
  const read = (src: string) => Object.fromEntries([...src.matchAll(/--([\w-]+):\s*oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/g)].map((m) => [m[1], [+m[2], +m[3], +m[4]]]));
  const root = read(block(':root {'));
  const out: Record<string, Record<string, number[]>> = { menu: root };
  for (const f of ['allies', 'soviets', 'psi']) out[f] = { ...root, ...read(block(`[data-faction='${f}'] {`)) };
  return out;
}

describe('phase 19: contrast per theme (WCAG AA)', () => {
  // [text, background, minimum]: 4.5 for running text, 3 for large or bold labels (≥ 18px, or ≥ 14px bold).
  const PAIRS: [string, string, number][] = [
    ['n-ink', 'n-0', 4.5], ['n-ink', 'c-deep', 4.5], ['n-ink', 'c-lo', 4.5], ['n-ink', 'c-mid', 4.5],
    ['n-ink-2', 'c-deep', 4.5], ['n-ink-2', 'c-lo', 4.5], ['n-ink-2', 'n-1', 4.5],
    ['n-ink-3', 'c-deep', 4.5], ['n-ink-3', 'n-1', 4.5],
    ['glow', 'c-deep', 4.5], ['glow', 'c-lo', 4.5],
    ['glow-dim', 'c-deep', 3], ['glow-dim', 'c-lo', 3],
    ['danger', 'c-deep', 4.5], ['ok', 'c-deep', 4.5], ['caution', 'c-deep', 4.5],
  ];
  for (const [name, t] of Object.entries(themes()))
    it(`${name}: every text colour on every panel colour`, () => {
      const fails = PAIRS.filter(([fg, bg, min]) => contrast(t[fg], t[bg]) < min).map(([fg, bg, min]) => `${fg} on ${bg}: ${contrast(t[fg], t[bg]).toFixed(2)} < ${min}`);
      expect(fails).toEqual([]);
    });
  it('primary button text on its glow', () => {
    for (const t of Object.values(themes())) expect(contrast([0.16, 0.02, 250], t.glow)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('phase 19: motion', () => {
  it('animations and transitions never touch layout properties', () => {
    const layout = /\b(width|height|top|left|right|bottom|margin[\w-]*|padding[\w-]*|inset|font-size)\b/;
    const frames = [...css.matchAll(/@keyframes [\w-]+ \{((?:[^{}]*\{[^}]*\})*)[^}]*\}/g)].map((m) => m[1]);
    for (const f of frames) for (const decl of f.matchAll(/([\w-]+)\s*:/g)) expect(decl[1], f).not.toMatch(layout);
    for (const m of css.matchAll(/transition:\s*([^;}]+)/g)) for (const part of m[1].split(',')) expect(part.trim().split(/\s+/)[0], m[0]).not.toMatch(layout);
  });
  it('each animation name is defined once (a second @keyframes silently replaces the first)', () => {
    const names = [...css.matchAll(/@keyframes ([\w-]+)/g)].map((m) => m[1]);
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
  });
});
