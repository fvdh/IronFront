// Sound effects are open-licensed samples (CC0 / CC-BY, see docs/asset-register.md and
// public/assets/licenses/CREDITS.txt) loaded from public/assets/audio/. Every sound also has a
// Web Audio synthesized version that plays while the samples are still loading or when a file
// fails to decode. Background music is a shuffled playlist with crossfades.
// Announcements use the browser's built-in speech synthesis.
import { settings } from '../settings';
import { ackUrl, announcerUrl, hasLine, SpeechQueue, type AckClass, type AckKind } from './announcer';
import type { FactionId } from './types';

export type SoundId =
  | 'click' | 'select' | 'move' | 'error' | 'gun' | 'cannon' | 'zap' | 'rocket'
  | 'explode' | 'bigExplode' | 'place' | 'ready' | 'alert' | 'victory' | 'defeat'
  // Extra cues (exported for gameplay code to wire up):
  | 'capture' | 'promote' | 'mindcontrol';

const UI_SOUNDS = new Set<SoundId>(['click', 'select', 'move', 'error', 'place', 'ready', 'alert', 'victory', 'defeat', 'capture', 'promote']);

const BASE = `${import.meta.env.BASE_URL}assets/audio/`;

/** Sample variants per sound (one is picked at random), relative to assets/audio/sfx/. */
const SAMPLES: Record<SoundId, string[]> = {
  click: ['ui-click.ogg'],
  select: ['ui-select-1.ogg', 'ui-select-2.ogg'],
  move: ['ui-move.ogg'],
  error: ['ui-error.ogg'],
  gun: ['gun-chaingun.wav', 'gun-pistol.wav', 'gun-shot.ogg'],
  cannon: ['cannon-fire.wav', 'cannon-rifle.wav', 'cannon-shotgun.wav'],
  zap: ['zap-1.ogg', 'zap-2.ogg'],
  rocket: ['rocket-launch.wav'],
  explode: ['explode-1.ogg', 'explode-2.ogg', 'explode-3.ogg', 'explode-baradari.wav'],
  bigExplode: ['bigexplode-baradari.wav', 'bigexplode-lowfreq.ogg'],
  place: ['place-1.ogg', 'place-2.ogg'],
  ready: ['ui-ready.ogg'],
  alert: ['ui-alert.ogg'],
  victory: ['victory.ogg'],
  defeat: ['defeat.ogg'],
  capture: ['capture.ogg'],
  promote: ['ui-promote.ogg'],
  mindcontrol: ['mindcontrol.ogg'],
};

/** Per-sound level trim for samples, so mass fire doesn't drown out explosions. */
const LEVEL: Partial<Record<SoundId, number>> = {
  gun: 0.4, cannon: 0.65, zap: 0.5, rocket: 0.55, explode: 0.75, bigExplode: 1,
  click: 0.5, select: 0.6, move: 0.6, error: 0.6, place: 0.8, ready: 0.7, alert: 0.8, victory: 0.9, defeat: 0.9,
  capture: 0.7, promote: 0.7, mindcontrol: 0.7,
};

/** Random playback-rate spread (±) so repeated shots don't sound identical. */
const JITTER: Partial<Record<SoundId, number>> = {
  gun: 0.08, cannon: 0.06, zap: 0.06, rocket: 0.06, explode: 0.08, bigExplode: 0.05, place: 0.04, mindcontrol: 0.03,
};

const MUSIC = ['act-of-war.m4a', 'escape-from-metal-city.m4a', 'iron-wasteland.m4a'];
const CROSSFADE = 4; // seconds

interface Deck { el: HTMLAudioElement; gain: GainNode }

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private ui!: GainNode;
  private music!: GainNode;
  private voice!: GainNode;
  private acks!: GainNode;
  private noise!: AudioBuffer;
  private last = new Map<SoundId, number>();
  private buffers = new Map<SoundId, AudioBuffer[]>();

  /** Must be called from a user gesture (browsers block autoplay). */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      this.startMusic();
      return;
    }
    try {
      this.ctx = new AudioContext();
    } catch {
      return; // no audio support: game stays playable
    }
    const c = this.ctx;
    this.master = c.createGain(); this.master.connect(c.destination);
    this.sfx = c.createGain(); this.sfx.connect(this.master);
    this.ui = c.createGain(); this.ui.connect(this.master);
    this.music = c.createGain(); this.music.connect(this.master);
    this.voice = c.createGain(); this.voice.connect(this.master);
    this.acks = c.createGain(); this.acks.connect(this.master);
    this.noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.apply();
    settings.subscribe(() => this.apply());
    this.loadSamples();
    this.startMusic();
  }

  private apply() {
    if (!this.ctx) return;
    const s = settings.get();
    this.master.gain.value = s.muted ? 0 : s.master;
    this.sfx.gain.value = s.sfx;
    this.ui.gain.value = s.ui;
    this.music.gain.value = s.music * (this.ducked ? 0.5 : 1);
    this.voice.gain.value = s.voice ? s.voiceVol : 0;
    this.acks.gain.value = s.acks;
    if (s.music <= 0) this.stopMusic();
    else this.startMusic();
  }

  private loadSamples() {
    const c = this.ctx!;
    for (const [id, files] of Object.entries(SAMPLES) as [SoundId, string[]][]) {
      for (const f of files) {
        fetch(`${BASE}sfx/${f}`)
          .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.arrayBuffer(); })
          .then((data) => c.decodeAudioData(data))
          .then((buf) => {
            const list = this.buffers.get(id) ?? [];
            list.push(buf);
            this.buffers.set(id, list);
          })
          .catch(() => { /* keep the synthesized fallback for this variant */ });
      }
    }
  }

  /** Number of decoded sample variants per sound (diagnostics). */
  loadedSamples(): Partial<Record<SoundId, number>> {
    return Object.fromEntries([...this.buffers].map(([id, b]) => [id, b.length]));
  }

  /**
   * Plays a sound. `vol` is the distance attenuation (0..1) computed by the caller,
   * `pan` an optional stereo position (-1 left .. 1 right).
   */
  play(id: SoundId, vol = 1, pan = 0) {
    const c = this.ctx;
    if (!c || vol <= 0.02 || settings.get().muted) return;
    const now = c.currentTime;
    if (now - (this.last.get(id) ?? -1) < (id === 'gun' ? 0.06 : 0.04)) return; // de-duplicate bursts
    this.last.set(id, now);
    const out = c.createGain();
    out.gain.value = vol;
    let dest: AudioNode = UI_SOUNDS.has(id) ? this.ui : this.sfx;
    if (pan !== 0 && typeof c.createStereoPanner === 'function') {
      const p = c.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      p.connect(dest);
      dest = p;
    }
    out.connect(dest);

    const variants = this.buffers.get(id);
    if (variants?.length) {
      const src = c.createBufferSource();
      src.buffer = variants[Math.floor(Math.random() * variants.length)];
      const j = JITTER[id] ?? 0;
      src.playbackRate.value = 1 + (Math.random() * 2 - 1) * j;
      out.gain.value = vol * (LEVEL[id] ?? 1);
      src.connect(out);
      src.start(now);
      return;
    }
    this.synth(c, id, out, now);
  }

  /** Synthesized fallback (used until samples are decoded, or if they fail to load). */
  private synth(c: AudioContext, id: SoundId, out: GainNode, now: number) {
    const tone = (type: OscillatorType, f0: number, f1: number, t0: number, dur: number, v: number) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, now + t0);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), now + t0 + dur);
      g.gain.setValueAtTime(0.0001, now + t0);
      g.gain.exponentialRampToValueAtTime(v, now + t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + t0 + dur);
      o.connect(g).connect(out);
      o.start(now + t0); o.stop(now + t0 + dur + 0.02);
    };
    const burst = (dur: number, v: number, filter: BiquadFilterType, freq: number, t0 = 0) => {
      const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      src.buffer = this.noise;
      f.type = filter; f.frequency.value = freq;
      g.gain.setValueAtTime(v, now + t0);
      g.gain.exponentialRampToValueAtTime(0.0001, now + t0 + dur);
      src.connect(f).connect(g).connect(out);
      src.start(now + t0, Math.random() * 0.5, dur + 0.05);
    };

    switch (id) {
      case 'click': tone('square', 900, 700, 0, 0.04, 0.12); break;
      case 'select': tone('square', 660, 660, 0, 0.05, 0.1); tone('square', 990, 990, 0.06, 0.05, 0.1); break;
      case 'move': tone('triangle', 520, 780, 0, 0.09, 0.2); break;
      case 'error': tone('sawtooth', 140, 110, 0, 0.22, 0.18); break;
      case 'gun': burst(0.06, 0.35, 'highpass', 1800); break;
      case 'cannon': burst(0.25, 0.7, 'lowpass', 900); tone('sine', 120, 45, 0, 0.25, 0.6); break;
      case 'rocket': burst(0.5, 0.45, 'bandpass', 700); tone('sawtooth', 300, 90, 0, 0.35, 0.08); break;
      case 'zap': tone('sawtooth', 1400, 180, 0, 0.18, 0.18); tone('square', 700, 90, 0.02, 0.16, 0.08); break;
      case 'explode': burst(0.45, 0.8, 'lowpass', 600); tone('sine', 90, 30, 0, 0.4, 0.7); break;
      case 'bigExplode': burst(1.1, 1, 'lowpass', 450); tone('sine', 70, 22, 0, 0.9, 0.9); burst(0.6, 0.4, 'bandpass', 1200, 0.15); break;
      case 'place': burst(0.08, 0.5, 'bandpass', 1500); burst(0.1, 0.5, 'bandpass', 900, 0.12); tone('sine', 180, 90, 0.12, 0.2, 0.4); break;
      case 'ready': [523, 659, 784].forEach((f, k) => tone('triangle', f, f, k * 0.08, 0.12, 0.2)); break;
      case 'alert': tone('square', 880, 880, 0, 0.14, 0.12); tone('square', 660, 660, 0.18, 0.14, 0.12); break;
      case 'victory': [392, 523, 659, 784, 1046].forEach((f, k) => tone('triangle', f, f, k * 0.14, 0.35, 0.22)); break;
      case 'defeat': [392, 330, 262, 196].forEach((f, k) => tone('sawtooth', f, f * 0.98, k * 0.22, 0.4, 0.12)); break;
      case 'capture': tone('triangle', 440, 440, 0, 0.1, 0.18); tone('triangle', 660, 660, 0.1, 0.18, 0.18); break;
      case 'promote': [660, 880, 1320].forEach((f, k) => tone('square', f, f, k * 0.07, 0.09, 0.1)); break;
      case 'mindcontrol': tone('sine', 220, 660, 0, 0.5, 0.25); tone('sine', 330, 990, 0.05, 0.45, 0.12); break;
    }
  }

  // ---- music: shuffled playlist on two decks with crossfade ----
  private decks: Deck[] = [];
  private deck = 0;
  private queue: string[] = [];
  private lastTrack = '';
  private musicOn = false;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private failures = 0;

  private makeDeck(): Deck {
    const c = this.ctx!;
    const el = new Audio();
    el.preload = 'auto';
    const gain = c.createGain();
    gain.gain.value = 0;
    c.createMediaElementSource(el).connect(gain).connect(this.music);
    const deck: Deck = { el, gain };
    el.addEventListener('ended', () => { if (this.musicOn && this.decks[this.deck] === deck) this.nextTrack(0.5); });
    el.addEventListener('error', () => {
      if (!this.musicOn || this.decks[this.deck] !== deck) return;
      if (++this.failures >= MUSIC.length) { this.stopMusic(); return; } // nothing playable: give up quietly
      this.nextTrack(0.5);
    });
    el.addEventListener('playing', () => { this.failures = 0; });
    return deck;
  }

  private startMusic() {
    if (!this.ctx || this.musicOn || settings.get().music <= 0 || typeof Audio === 'undefined') return;
    if (!this.decks.length) this.decks = [this.makeDeck(), this.makeDeck()];
    this.musicOn = true;
    this.failures = 0;
    this.nextTrack(1.5);
    this.musicTimer = setInterval(() => {
      const el = this.decks[this.deck].el;
      if (this.musicOn && el.duration > CROSSFADE * 2 && el.duration - el.currentTime < CROSSFADE) this.nextTrack(CROSSFADE);
    }, 250);
  }

  private stopMusic() {
    if (!this.musicOn) return;
    this.musicOn = false;
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
    for (const d of this.decks) { d.el.pause(); d.gain.gain.cancelScheduledValues(0); d.gain.gain.value = 0; }
  }

  private nextTrack(fade: number) {
    const c = this.ctx!;
    if (!this.queue.length) {
      this.queue = [...MUSIC].sort(() => Math.random() - 0.5);
      if (this.queue.length > 1 && this.queue[0] === this.lastTrack) this.queue.push(this.queue.shift()!);
    }
    const track = this.queue.shift()!;
    this.lastTrack = track;
    const now = c.currentTime;
    const old = this.decks[this.deck];
    this.deck = 1 - this.deck;
    const next = this.decks[this.deck];

    old.gain.gain.cancelScheduledValues(now);
    old.gain.gain.setValueAtTime(old.gain.gain.value, now);
    old.gain.gain.linearRampToValueAtTime(0, now + fade);
    const oldEl = old.el;
    setTimeout(() => { if (this.decks[this.deck] !== old) oldEl.pause(); }, fade * 1000 + 100);

    next.el.src = `${BASE}music/${track}`;
    next.el.currentTime = 0;
    next.gain.gain.cancelScheduledValues(now);
    next.gain.gain.setValueAtTime(0, now);
    next.gain.gain.linearRampToValueAtTime(1, now + fade);
    void next.el.play().catch(() => { /* autoplay refused or decode error: 'error' handler / next gesture retries */ });
  }

  // ------------------------------------------------------------ announcer & unit voices

  private announcer: FactionId = 'allies';
  private speech = new SpeechQueue();
  private voiceBufs = new Map<string, Promise<AudioBuffer | null>>();
  private ducked = false;
  private ackSrc: AudioBufferSourceNode | null = null;
  private ackAt = 0;

  private voiceBuffer(path: string): Promise<AudioBuffer | null> {
    let p = this.voiceBufs.get(path);
    if (!p) {
      const c = this.ctx;
      p = !c ? Promise.resolve(null) : fetch(`${BASE}${path}`)
        .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.arrayBuffer(); })
        .then((d) => c.decodeAudioData(d))
        .catch(() => null);
      if (c) this.voiceBufs.set(path, p);
    }
    return p;
  }

  /** The announcer for this game (the player's faction); its lines are fetched ahead so they play on time. */
  setAnnouncer(f: FactionId, lines: string[]) {
    this.announcer = f;
    for (const t of lines) void this.voiceBuffer(announcerUrl(f, t));
  }

  /** Speak an announcer line: queued by priority, never over another line, at most once per `minGapMs`. */
  say(text: string, minGapMs = 4000) {
    const s = settings.get();
    if (!s.voice || s.muted) return;
    if (!hasLine(text)) { this.speak(text, minGapMs); return; }
    if (this.speech.push(text, performance.now(), minGapMs)) this.pump();
  }

  private pump() {
    const text = this.speech.next(performance.now());
    if (!text) { if (this.speech.size) setTimeout(() => this.pump(), 120); return; }
    const c = this.ctx;
    this.speech.speaking(performance.now(), 3000); // until the buffer is known
    void this.voiceBuffer(announcerUrl(this.announcer, text)).then((buf) => {
      if (!buf || !c) { this.speech.speaking(performance.now(), 0); this.speak(text, 0); this.pump(); return; }
      const src = c.createBufferSource();
      src.buffer = buf;
      src.connect(this.voice);
      this.duck(true);
      src.onended = () => { this.duck(false); this.speech.speaking(performance.now(), 0); this.pump(); };
      this.speech.speaking(performance.now(), buf.duration * 1000 + 150);
      src.start();
    });
  }

  /** Music dips while the announcer talks. */
  private duck(on: boolean) {
    this.ducked = on;
    if (!this.ctx) return;
    const g = this.music.gain, now = this.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setTargetAtTime(settings.get().music * (on ? 0.5 : 1), now, on ? 0.05 : 0.4);
  }

  /** A unit answers when selected or ordered. A new answer cuts off the previous one. */
  ack(faction: FactionId, cls: AckClass, kind: AckKind, hero?: string) {
    const c = this.ctx, s = settings.get();
    if (!c || s.muted || s.acks <= 0) return;
    const now = performance.now();
    if (kind === 'select' && now - this.ackAt < 700) return; // rapid re-selects stay quiet
    this.ackAt = now;
    void this.voiceBuffer(ackUrl(faction, cls, kind, hero)).then((buf) => {
      if (!buf || this.ackAt !== now) return;
      try { this.ackSrc?.stop(); } catch { /* already ended */ }
      const src = c.createBufferSource();
      src.buffer = buf;
      src.connect(this.acks);
      src.start();
      this.ackSrc = src;
    });
  }

  /** Browser speech: only for lines that have no recorded file. */
  private lastSay = new Map<string, number>();
  private speak(text: string, minGapMs: number) {
    const s = settings.get();
    if (typeof speechSynthesis === 'undefined') return;
    const now = performance.now();
    if (now - (this.lastSay.get(text) ?? -1e9) < minGapMs) return;
    this.lastSay.set(text, now);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 1.05; u.pitch = 0.8; u.volume = Math.min(1, s.master * s.voiceVol * 1.6);
    speechSynthesis.speak(u);
  }
}

export const audio = new AudioEngine();

// Start audio (and the music playlist) on the very first user gesture anywhere, e.g. in the menu.
if (typeof window !== 'undefined') {
  const first = () => {
    audio.unlock();
    window.removeEventListener('pointerdown', first, true);
    window.removeEventListener('keydown', first, true);
  };
  window.addEventListener('pointerdown', first, true);
  window.addEventListener('keydown', first, true);
}
