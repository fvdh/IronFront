import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Build id for telemetry exports (Fun Pass 20.4): version + git commit (+ "-dirty" with uncommitted changes in src);
 *  without git, a hash of the source tree. */
function buildId(command: string) {
  try {
    const sha = execSync('git rev-parse --short=8 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    const dirty = execSync('git status --porcelain -- src', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() ? '-dirty' : '';
    const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
    return `${version}+${sha}${dirty}${command === 'serve' && !process.env.VITEST ? '-dev' : ''}`;
  } catch { /* no git (or no commit yet): hash the source tree */ }
  const h = createHash('sha1');
  const walk = (d: string) => { for (const f of readdirSync(d, { withFileTypes: true }).filter((f) => !f.name.startsWith('.')).sort((a, b) => a.name.localeCompare(b.name))) f.isDirectory() ? walk(join(d, f.name)) : h.update(f.name).update(readFileSync(join(d, f.name))); };
  walk('src');
  const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
  return `${version}+${h.digest('hex').slice(0, 8)}${command === 'serve' && !process.env.VITEST ? '-dev' : ''}`; // hidden files (.DS_Store) left out: Finder changes them
}

export default defineConfig(({ command }) => ({
  define: { __BUILD__: JSON.stringify(buildId(command)) },
  plugins: [react()],
  build: {
    // three.js (~650 KB minified) is only loaded on demand when a game starts (see App.tsx) and lives in its
    // own chunk so it stays cached across app updates; it alone exceeds Vite's 500 KB default warning.
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        codeSplitting: { groups: [{ name: 'three', test: /node_modules[\\/]three[\\/]/ }] },
      },
    },
  },
}));
