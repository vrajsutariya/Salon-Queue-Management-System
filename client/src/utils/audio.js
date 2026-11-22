/**
 * Crown & Blade - Luxury Web Audio API Chime & Haptic System
 * Synthesizes a warm champagne chime without external MP3 dependencies.
 */

export const playLuxuryChime = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Melodic ascending luxury notes: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.50Hz)
    const chord = [
      { freq: 523.25, time: 0.0, dur: 0.9 },
      { freq: 659.25, time: 0.16, dur: 0.9 },
      { freq: 783.99, time: 0.32, dur: 1.1 },
      { freq: 1046.5, time: 0.48, dur: 1.6 },
    ];

    chord.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      // Warm acoustic harmonics with soft attack and decay
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + dur + 0.05);
    });
  } catch (err) {
    console.warn('[Audio] Could not play luxury chime:', err);
  }
};

export const triggerHapticFeedback = () => {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch (err) {
    console.warn('[Haptics] Vibration not available:', err);
  }
};
