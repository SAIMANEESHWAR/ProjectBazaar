/**
 * Real device checks for the live mock interview flow (browser-only, no upload).
 */

export function checkBrowserMediaSupport(): { ok: boolean; reason?: string } {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { ok: false, reason: 'Not running in a browser.' };
  }
  if (!window.isSecureContext) {
    return {
      ok: false,
      reason: 'Use HTTPS or http://localhost so the browser allows camera and microphone.',
    };
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return { ok: false, reason: 'This browser does not support getUserMedia.' };
  }
  return { ok: true };
}

export async function acquireLocalMedia(options: {
  audio: boolean;
  video: boolean;
}): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: options.audio,
    video: options.video ? { facingMode: 'user' } : false,
  });
}

/** True if time-domain signal shows enough variation (user spoke or ambient noise). */
export async function measureMicInput(stream: MediaStream, durationMs = 1800): Promise<boolean> {
  const audioTrack = stream.getAudioTracks()[0];
  if (!audioTrack?.enabled) return false;

  const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return true;

  const ctx = new AudioContextCtor();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.35;
  source.connect(analyser);

  const data = new Uint8Array(analyser.fftSize);
  const start = performance.now();
  let peak = 0;

  try {
    await new Promise<void>((resolve) => {
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        for (let i = 0; i < data.length; i++) {
          const v = Math.abs(data[i] - 128);
          if (v > peak) peak = v;
        }
        if (performance.now() - start >= durationMs) {
          resolve();
        } else {
          requestAnimationFrame(tick);
        }
      };
      tick();
    });
  } finally {
    source.disconnect();
    await ctx.close().catch(() => {});
  }

  return peak >= 4;
}

export async function checkNetworkLatency(): Promise<{ ok: boolean; ms: number }> {
  const url = typeof window !== 'undefined' ? `${window.location.origin}/` : '/';
  const t0 = performance.now();
  try {
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      mode: 'same-origin',
    });
    const ms = performance.now() - t0;
    return { ok: res.ok || res.type === 'opaqueredirect', ms };
  } catch {
    const ms = performance.now() - t0;
    return { ok: false, ms };
  }
}

/** Short audible tone to verify audio output path (user should unmute system volume). */
export async function playSpeakerTestTone(): Promise<void> {
  const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return;

  const ctx = new AudioContextCtor();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  gain.gain.value = 0.06;
  osc.type = 'sine';
  osc.frequency.value = 523.25;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  await new Promise((r) => setTimeout(r, 220));
  osc.stop();
  await ctx.close().catch(() => {});
}
