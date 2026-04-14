/**
 * Instagram-style sound effects using Web Audio API.
 * No external files; works after any user gesture (browser autoplay policy).
 */

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        } catch {
            return null;
        }
    }
    return audioContext;
}

function playTone(options: {
    frequency: number;
    duration: number;
    gain: number;
    type?: OscillatorType;
    fadeOut?: boolean;
}) {
    const ctx = getContext();
    if (!ctx) return;
    try {
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = options.type ?? 'sine';
        osc.frequency.setValueAtTime(options.frequency, ctx.currentTime);
        gainNode.gain.setValueAtTime(options.gain, ctx.currentTime);
        if (options.fadeOut !== false) {
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + options.duration);
        }
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + options.duration);
    } catch {
        // ignore
    }
}

/** Soft, short tone when you send a message (Instagram send style) */
export function playMessageSent() {
    playTone({
        frequency: 520,
        duration: 0.06,
        gain: 0.12,
        type: 'sine',
    });
}

/** Short "ding" when you receive a new message (Instagram receive style) */
export function playMessageReceived() {
    playTone({
        frequency: 880,
        duration: 0.1,
        gain: 0.2,
        type: 'sine',
    });
}

/** Notification sound for bell (new notification) */
export function playNotification() {
    playTone({
        frequency: 660,
        duration: 0.08,
        gain: 0.18,
        type: 'sine',
    });
}
