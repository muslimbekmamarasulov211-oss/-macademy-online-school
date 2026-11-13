"""Original cinematic score + sound design, synthesised from scratch (no samples).

D minor, follows the 6-scene storyboard:
  s1 0-8    dark drone, candle-like bell motif
  s2 8-18   warm strings  Dm  Bb  F  C
  s3 18-27  rising        Bb  F  Gm A, shimmer, riser into the cut
  s4 27-38  cold, filtered, clock ticks + notification pings (distraction)
  s5 38-49  brightening build with string ostinato, riser
  s6 49-59  brand finale: impact, full chords, final hit and fade-out

Usage:  python3 scripts/music.py
Output: build/music.wav (48 kHz stereo float)
"""

from pathlib import Path

import numpy as np
import scipy.io.wavfile as wavfile
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
DUR = 59.0
N = int(SR * DUR)
rng = np.random.default_rng(7)

# Notification ping times (shared with the visuals in render/scenes.js).
PINGS = [28.3, 29.1, 29.8, 30.4, 31.1, 31.6, 32.2, 32.9]


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def t_axis(n):
    return np.arange(n) / SR


def env_adsr(n, a, r, curve=1.0):
    e = np.ones(n)
    na, nr = min(int(a * SR), n), min(int(r * SR), n)
    if na:
        e[:na] = np.linspace(0, 1, na) ** curve
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr) ** curve
    return e


def lp(x, f, order=2):
    return sosfilt(butter(order, min(f, SR / 2 - 100), "low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


class Bus:
    def __init__(self):
        self.L = np.zeros(N)
        self.R = np.zeros(N)

    def add(self, x, t0, pan=0.0, gain=1.0):
        i = int(t0 * SR)
        if i >= N:
            return
        x = x[: N - i] * gain
        self.L[i : i + len(x)] += x * np.sqrt(0.5 * (1 - pan))
        self.R[i : i + len(x)] += x * np.sqrt(0.5 * (1 + pan))


def saw_voice(f, n, harmonics=16, phase=0.0):
    t = t_axis(n)
    out = np.zeros(n)
    for k in range(1, harmonics + 1):
        if f * k > 9000:
            break
        out += np.sin(2 * np.pi * f * k * t + phase * k) / k
    return out


def string_pad(midis, dur, cutoff=1800, attack=1.2, release=1.4, detune=0.006):
    n = int(dur * SR)
    L, R = np.zeros(n), np.zeros(n)
    for m in midis:
        f = hz(m)
        for d, pan in ((-detune, -0.6), (0.0, 0.0), (detune, 0.6)):
            v = saw_voice(f * (1 + d), n, phase=rng.uniform(0, 6.28))
            L += v * (1 - pan) / 2
            R += v * (1 + pan) / 2
    # gentle vibrato-like movement via slow amplitude wobble
    wob = 1 + 0.05 * np.sin(2 * np.pi * 0.23 * t_axis(n) + rng.uniform(0, 6))
    e = env_adsr(n, attack, release, 1.5) * wob / (len(midis) * 2.2)
    return lp(L * e, cutoff), lp(R * e, cutoff)


def bell(m, dur=3.0):
    n = int(dur * SR)
    t = t_axis(n)
    f = hz(m)
    x = np.zeros(n)
    for ratio, amp, dec in ((1, 1, 1.6), (2.0, 0.5, 0.9), (3.01, 0.25, 0.5), (4.2, 0.12, 0.3), (0.5, 0.2, 2.2)):
        x += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / dec)
    x *= env_adsr(n, 0.004, 0.3)
    return x * 0.35


def low_note(m, dur, cutoff=500):
    n = int(dur * SR)
    x = saw_voice(hz(m), n, 10) + 0.6 * np.sin(2 * np.pi * hz(m - 12) * t_axis(n))
    return lp(x * env_adsr(n, 0.6, 0.8, 1.3), cutoff) * 0.35


def stacc(m, dur=0.22, cutoff=1400):
    n = int(dur * SR)
    t = t_axis(n)
    x = saw_voice(hz(m), n, 12) * np.exp(-t / 0.09) * env_adsr(n, 0.006, 0.04)
    return lp(x, cutoff) * 0.5


def impact(size=1.0, dur=4.0):
    n = int(dur * SR)
    t = t_axis(n)
    f = 30 + 70 * np.exp(-t / 0.12)
    ph = 2 * np.pi * np.cumsum(f) / SR
    boom = np.sin(ph) * np.exp(-t / (0.9 * size))
    noise = lp(rng.standard_normal(n), 2500) * np.exp(-t / 0.08)
    crack = hp(rng.standard_normal(n), 3000) * np.exp(-t / 0.02) * 0.3
    return (boom * 1.0 + noise * 0.5 + crack) * size


def riser(dur=2.0, lo=300, hi=6000):
    n = int(dur * SR)
    t = t_axis(n)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    seg = int(0.05 * SR)
    for i in range(0, n, seg):
        p = i / n
        fc = lo * (hi / lo) ** p
        blk = noise[max(0, i - 2000) : i + seg]
        y = bp(blk, fc * 0.7, min(fc * 1.4, SR / 2 - 200))
        out[i : i + seg] = y[-len(out[i : i + seg]) :]
    return out * (t / dur) ** 2.2 * 0.6


def whoosh(dur=1.0):
    n = int(dur * SR)
    t = t_axis(n)
    e = np.sin(np.pi * t / dur) ** 2
    return bp(rng.standard_normal(n), 400, 3000) * e * 0.35


def tick(hi=True):
    n = int(0.05 * SR)
    t = t_axis(n)
    x = hp(rng.standard_normal(n), 2500) * np.exp(-t / 0.004)
    x += np.sin(2 * np.pi * (2200 if hi else 1700) * t) * np.exp(-t / 0.01) * 0.5
    return x * 0.25


def ping():
    n = int(0.6 * SR)
    t = t_axis(n)
    x = np.sin(2 * np.pi * 1318.5 * t) * np.exp(-t / 0.12)
    x[int(0.09 * SR) :] += np.sin(2 * np.pi * 1975.5 * t[: n - int(0.09 * SR)]) * np.exp(-t[: n - int(0.09 * SR)] / 0.15)
    return x * 0.16


def heartbeat():
    n = int(0.5 * SR)
    t = t_axis(n)
    x = np.sin(2 * np.pi * 55 * t) * np.exp(-t / 0.08)
    j = int(0.18 * SR)
    x[j:] += 0.7 * np.sin(2 * np.pi * 50 * t[: n - j]) * np.exp(-t[: n - j] / 0.08)
    return x * 0.5


def reverb_ir(seconds=3.2):
    n = int(seconds * SR)
    t = t_axis(n)
    irs = []
    for _ in range(2):
        ir = rng.standard_normal(n) * np.exp(-t / (seconds / 6.5))
        ir = lp(ir, 6000)
        ir[: int(0.012 * SR)] = 0
        irs.append(ir / np.sqrt((ir**2).sum()))
    return irs


def main():
    dry, wet = Bus(), Bus()

    def pad(midis, t0, t1, cutoff=1800, gain=1.0, attack=1.2, release=1.4, send=0.6):
        l, r = string_pad(midis, t1 - t0 + release * 0.5, cutoff, attack, release)
        for bus, g in ((dry, gain), (wet, gain * send)):
            i = int(t0 * SR)
            ln = min(len(l), N - i)
            bus.L[i : i + ln] += l[:ln] * g
            bus.R[i : i + ln] += r[:ln] * g

    D = 50  # D3
    # --- s1: dark opening -------------------------------------------------
    drone = low_note(D - 12, 9.0, 220)
    dry.add(drone, 0.0, gain=0.9)
    pad([D + 12, D + 15, D + 19], 1.0, 8.4, cutoff=900, gain=0.5, attack=3.5)
    for t0, m, pan in ((1.6, 74, -0.3), (2.8, 77, 0.2), (4.0, 81, -0.1), (5.2, 76, 0.3), (6.4, 74, 0)):
        b = bell(m)
        dry.add(b, t0, pan, 0.45)
        wet.add(b, t0, pan, 0.6)
    wet.add(whoosh(1.4), 6.9, 0, 0.6)

    # --- s2: scholars ------------------------------------------------------
    s2 = [(8.0, [D, D + 3, D + 7, D + 12], D - 12), (10.5, [D - 4, D, D + 5, D + 10], D - 16),
          (13.0, [D - 9, D - 5, D, D + 7], D - 21), (15.5, [D - 2, D + 2, D + 5, D + 10], D - 14)]
    for t0, ch, root in s2:
        pad(ch, t0, t0 + 2.6, cutoff=2200, gain=0.85, attack=0.8)
        dry.add(low_note(root, 2.8, 400), t0, 0, 0.8)
    for k, t0 in enumerate((8.0, 11.3, 14.6)):
        dry.add(impact(0.45, 3.0), t0, 0, 0.55)
        wet.add(bell(81 + (0, 3, 7)[k], 2.5), t0 + 0.05, 0, 0.5)

    # --- s3: what made them different -------------------------------------
    s3 = [(18.0, [D - 4, D, D + 5, D + 10], D - 16), (20.25, [D - 9, D - 5, D, D + 7], D - 21),
          (22.5, [D - 7, D - 2, D + 2, D + 9], D - 19), (24.75, [D - 5, D - 1, D + 4, D + 11], D - 17)]
    for t0, ch, root in s3:
        pad(ch, t0, t0 + 2.35, cutoff=2800, gain=0.9, attack=0.6)
        pad([c + 12 for c in ch[1:]], t0, t0 + 2.35, cutoff=5000, gain=0.25, attack=0.9, send=1.0)
        dry.add(low_note(root, 2.4, 450), t0, 0, 0.9)
    for k, t0 in enumerate(np.arange(18.0, 26.6, 0.375)):
        m = [74, 77, 81, 86][k % 4]
        wet.add(bell(m, 1.5), t0, (-0.5, 0.5)[k % 2], 0.22)
    wet.add(riser(2.2, 300, 7000), 24.9, 0, 0.9)
    dry.add(impact(0.8), 27.0, 0, 0.8)

    # --- s4: modern distraction (cold) ------------------------------------
    pad([D - 12, D - 5, D + 3, D + 4], 27.0, 37.4, cutoff=700, gain=0.75, attack=1.0, release=1.0)
    dry.add(low_note(D - 24, 10.8, 160), 27.0, 0, 0.9)
    t = 27.4
    while t < 37.2:
        rate = 0.5 if t < 33 else max(0.18, 0.5 - (t - 33) * 0.08)
        dry.add(tick((round((t - 27.4) / 0.5)) % 2 == 0), t, 0.25, 0.9)
        t += rate
    for p in PINGS:
        dry.add(ping(), p, rng.uniform(-0.6, 0.6), 1.0)
        wet.add(ping(), p, 0, 0.5)
    for hb in np.arange(33.0, 37.3, 0.85):
        dry.add(heartbeat(), hb, 0, 0.7)
    wet.add(riser(1.0, 200, 3000), 37.0, 0, 0.5)

    # --- s5: the solution (build) ------------------------------------------
    s5 = [(38.0, [D - 9, D - 5, D, D + 7], D - 21), (40.75, [D - 2, D + 2, D + 5, D + 10], D - 14),
          (43.5, [D, D + 3, D + 7, D + 12], D - 12), (46.25, [D - 4, D, D + 5, D + 10], D - 16)]
    for k, (t0, ch, root) in enumerate(s5):
        pad(ch, t0, t0 + 2.85, cutoff=1500 + 900 * k, gain=0.8 + 0.08 * k, attack=0.8 if k else 2.0)
        dry.add(low_note(root, 2.9, 420), t0, 0, 0.9)
        if k >= 1:
            for j, tt in enumerate(np.arange(t0, t0 + 2.75, 0.3125)):
                m = root + 12 + (0, 7, 12, 7)[j % 4]
                dry.add(stacc(m, cutoff=1200 + 500 * k), tt, (-0.3, 0.3)[j % 2], 0.55 + 0.1 * k)
    for t0 in np.arange(43.5, 49.0, 0.625):
        wet.add(bell(86 if int(t0 * 8) % 2 else 81, 1.2), t0, 0, 0.15)
    wet.add(riser(2.4, 250, 9000), 46.6, 0, 1.0)

    # --- s6: finale ----------------------------------------------------------
    dry.add(impact(1.2), 49.0, 0, 1.0)
    wet.add(impact(1.0), 49.0, 0, 0.6)
    s6 = [(49.0, [D - 4, D, D + 5, D + 10, D + 14], D - 16), (51.5, [D - 9, D - 5, D, D + 7, D + 12], D - 21),
          (54.0, [D - 2, D + 2, D + 5, D + 10, D + 14], D - 14), (56.5, [D, D + 3, D + 7, D + 12, D + 15], D - 12)]
    for k, (t0, ch, root) in enumerate(s6):
        last = k == 3
        pad(ch, t0, 59.0 if last else t0 + 2.6, cutoff=3200, gain=0.95, attack=0.5, release=2.2 if last else 1.2)
        dry.add(low_note(root, 3.5 if last else 2.7, 500), t0, 0, 1.0)
        for j, tt in enumerate(np.arange(t0, t0 + 2.4, 0.3125)):
            dry.add(stacc(root + 12 + (0, 7, 12, 15)[j % 4], cutoff=2200), tt, (-0.3, 0.3)[j % 2], 0.6)
    for t0 in (51.5, 54.0, 56.5):
        dry.add(impact(0.5, 2.0), t0, 0, 0.5)
    # Final powerful hit, then a long tail into the fade.
    dry.add(impact(1.6, 3.0), 57.7, 0, 1.2)
    wet.add(impact(1.4, 3.0), 57.7, 0, 0.8)
    wet.add(bell(86, 3.0), 57.7, 0, 0.6)
    wet.add(bell(74, 3.0), 57.7, 0, 0.6)

    # --- reverb + master ---------------------------------------------------
    irL, irR = reverb_ir()
    L = dry.L + fftconvolve(wet.L, irL)[:N] * 1.4
    R = dry.R + fftconvolve(wet.R, irR)[:N] * 1.4
    st = np.stack([L, R], 1)
    st = np.tanh(st / (np.abs(st).max() + 1e-9) * 1.6) / np.tanh(1.6)
    # master fade in/out
    fade = np.ones(N)
    fade[: int(0.4 * SR)] = np.linspace(0, 1, int(0.4 * SR))
    fo = int(1.6 * SR)
    fade[-fo:] = np.linspace(1, 0, fo) ** 1.6
    st *= fade[:, None] * 0.9
    out = ROOT / "build" / "music.wav"
    out.parent.mkdir(exist_ok=True)
    wavfile.write(out, SR, st.astype(np.float32))
    print("music.wav", st.shape[0] / SR, "s")


if __name__ == "__main__":
    main()
