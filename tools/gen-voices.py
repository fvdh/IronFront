#!/usr/bin/env python3
"""Generate the announcer and unit voice lines (offline, run once; output is committed).

Needs: `pip install piper-tts numpy`, the Piper voice models listed in src/game/data/voicelines.json
(public-domain / CC0 trained voices only, see docs/asset-register.md) in $VOICE_DIR, and macOS `afconvert`.

    VOICE_DIR=~/piper-voices python3 tools/gen-voices.py            # everything
    VOICE_DIR=~/piper-voices python3 tools/gen-voices.py --missing  # only new lines

Writes public/assets/audio/voice/<group>/<slug>.m4a (AAC; the local toolchain has no Ogg encoder).
"""
import io, json, os, re, subprocess, sys, tempfile, wave
from pathlib import Path

import numpy as np
from piper import PiperVoice, SynthesisConfig

ROOT = Path(__file__).resolve().parent.parent
LINES = json.loads((ROOT / 'src/game/data/voicelines.json').read_text())
OUT = ROOT / 'public/assets/audio/voice'
VOICE_DIR = Path(os.environ.get('VOICE_DIR', '.')).expanduser()
SR = 22050
MISSING = '--missing' in sys.argv
rng = np.random.default_rng(7)  # deterministic noise: re-running gives the same files

def slug(t: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')

_voices: dict = {}
def synth(voice: str, text: str, length: float, noise: float) -> np.ndarray:
    v = _voices.get(voice) or _voices.setdefault(voice, PiperVoice.load(str(VOICE_DIR / f'{voice}.onnx')))
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as w:
        v.synthesize_wav(text + '.', w, syn_config=SynthesisConfig(length_scale=length, noise_scale=noise, noise_w_scale=noise + 0.1))
    buf.seek(0)
    with wave.open(buf, 'rb') as w:
        assert w.getframerate() == SR, w.getframerate()
        return trim(np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768)

def tts(voice: str, text: str, length=1.0) -> np.ndarray:
    """Very short lines sometimes come out with trailing babble: retry calmer and keep the shortest take."""
    limit = (0.75 + 0.07 * len(text)) * length * SR
    takes = []
    for noise in (0.5, 0.33, 0.2, 0.1):
        x = synth(voice, text, length, noise)
        if len(x) <= limit: return x
        takes.append(x)
    return min(takes, key=len)

def trim(x, thr=0.01):
    idx = np.where(np.abs(x) > thr)[0]
    return x[max(0, idx[0] - 200): idx[-1] + 600] if len(idx) else x

def pitched(voice, text, p, length=1.0):
    """Lower (p < 1) or raise the pitch by resampling; the TTS tempo is pre-scaled so the duration stays put."""
    x = tts(voice, text, length * p)
    n = int(len(x) / p)
    return np.interp(np.arange(n) * p, np.arange(len(x)), x)

def band(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    m = 1 / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4)  # 4th-order-ish soft edges
    return np.fft.irfft(X * m, len(x))

def sat(x, drive):
    return np.tanh(x * drive) / np.tanh(drive)

def echo(x, taps):
    n = len(x) + int(max(d for d, _ in taps) * SR)
    y = np.zeros(n); y[:len(x)] += x
    for d, g in taps:
        k = int(d * SR); y[k:k + len(x)] += x * g
    return y

def noise(sec, lo, hi, gain, n=None):
    return band(rng.standard_normal(n or int(sec * SR)), lo, hi) * gain

def squelch(x, lo, hi, hiss=0.0):
    """Radio key-up click + short static, the line, then the static tail; optional hiss under the voice."""
    head = noise(0.045, lo, hi, 0.25) * np.linspace(1, 0, int(0.045 * SR)) ** 2
    head[:40] += np.hanning(80)[:40] * 0.6
    tail = noise(0.11, lo, hi, 0.18) * np.linspace(1, 0, int(0.11 * SR))
    if hiss: x = x + noise(0, lo, hi, hiss, len(x))
    return np.concatenate([head, np.zeros(int(0.02 * SR)), x, tail])

def tone(sec=0.07, f=990):
    t = np.arange(int(sec * SR)) / SR
    return np.sin(2 * np.pi * f * t) * np.hanning(len(t)) * 0.18

def mix(*parts):
    """Sum (signal, gain) pairs of different lengths."""
    y = np.zeros(max(len(x) for x, _ in parts))
    for x, g in parts: y[:len(x)] += norm(x) * g
    return y

def norm(x, peak=0.89):
    return x / (np.max(np.abs(x)) + 1e-9) * peak

FX = {
    # announcers
    'aegis': lambda v, t: squelch(sat(band(pitched(v, t, 0.98), 260, 4200), 1.4), 300, 3800),
    'kommand': lambda v, t: squelch(sat(band(pitched(v, t, 0.86, 1.05), 300, 3200), 2.6), 300, 3200, hiss=0.012),
    'choir': lambda v, t: np.concatenate([tone(), echo(band(mix((tts(v, t), 0.75), (pitched(v, t, 0.75), 0.45)), 180, 5200), [(0.11, 0.32), (0.23, 0.16)])]),
    # unit acknowledgements: infantry dry, the rest over the radio
    'dry': lambda v, t, p=1.0: sat(band(pitched(v, t, p), 120, 7000), 1.2),
    'radio': lambda v, t, p=1.0: squelch(sat(band(pitched(v, t, p), 350, 3000), 2.2), 350, 3000, hiss=0.008),
    'psi': lambda v, t, p=1.0: echo(band(pitched(v, t, p), 180, 5500), [(0.09, 0.28)]),
    # heroes
    'hero': lambda v, t, p=1.0: sat(band(pitched(v, t, 1.03), 120, 7500), 1.3),
    'grom': lambda v, t, p=1.0: sat(band(pitched(v, t, 0.78, 1.05), 90, 6000), 2.0),
    'oracle': lambda v, t, p=1.0: echo(band(mix((tts(v, t, 1.1), 0.8), (pitched(v, t, 0.8, 1.1), 0.4)), 150, 6000), [(0.13, 0.3), (0.27, 0.15)]),
}

def write(path: Path, x):
    if MISSING and path.exists(): return  # --missing: only lines that have no file yet
    x = x()  # synthesised only when needed
    path.parent.mkdir(parents=True, exist_ok=True)
    pcm = (np.clip(norm(x), -1, 1) * 32767).astype(np.int16)
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        tmp = f.name
    with wave.open(tmp, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '48000', tmp, str(path)], check=True)
    os.unlink(tmp)

def announcer_texts():
    for t in LINES['announcer']:
        if t == '@superweapons':
            for sw in LINES['superweapons']:
                for l in LINES['superweaponLines']: yield l.format(sw)
        else: yield t

def main(only=None):
    n = 0
    for fac, a in LINES['announcers'].items():
        for t in announcer_texts():
            spoken = LINES['flavour'].get(fac, {}).get(t, t)
            write(OUT / f'announcer-{fac}' / f'{slug(t)}.m4a', lambda: FX[a['fx']](a['voice'], spoken)); n += 1
            if only and n >= only: return
    pitch = {'infantry': 1.0, 'vehicle': 0.95, 'ship': 0.92, 'aircraft': 1.04}
    for fac, a in LINES['acks'].items():
        for cls, kinds in a.items():
            if cls == 'voice': continue
            fx = 'psi' if fac == 'psi' else 'dry' if cls == 'infantry' else 'radio'
            for kind, texts in kinds.items():
                for i, t in enumerate(texts):
                    write(OUT / f'acks-{fac}' / f'{cls}-{kind}-{i}.m4a', lambda: FX[fx](a['voice'], t, pitch[cls])); n += 1
    for hero, h in LINES['heroes'].items():
        for kind in ('select', 'move', 'attack'):
            for i, t in enumerate(h[kind]):
                write(OUT / f'hero-{hero}' / f'{kind}-{i}.m4a', lambda: FX[h['fx']](h['voice'], t)); n += 1
    print(f'{n} lines written to {OUT}')

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if a != '--missing']
    main(int(args[0]) if args else None)
