// Small sounds, synthesized with WebAudio: no audio files, no network. A coin rings, the
// alarm climbs, being caught thuds, and a getaway chimes. Silent until the player first
// interacts, as browsers require.
export function createAudio() {
  let context = null;

  function ensure() {
    if (context !== null) return context;
    try {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      context = new AudioContext();
    } catch {
      context = null;
    }
    return context;
  }

  function tone(frequency, seconds, type, volume, when) {
    const audio = ensure();
    if (audio === null) return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audio.currentTime + when);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + when + seconds);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(audio.currentTime + when);
    oscillator.stop(audio.currentTime + when + seconds);
  }

  return {
    /** Warm up the audio on first interaction. */
    unlock() {
      ensure();
    },
    coin() {
      tone(1568, 0.12, 'sine', 0.12, 0);
      tone(2093, 0.18, 'sine', 0.1, 0.07);
    },
    spotted() {
      tone(220, 0.16, 'square', 0.08, 0);
      tone(185, 0.2, 'square', 0.08, 0.12);
    },
    caught() {
      tone(110, 0.5, 'sawtooth', 0.14, 0);
      tone(55, 0.6, 'sawtooth', 0.12, 0.1);
    },
    alarm() {
      tone(880, 0.12, 'square', 0.07, 0);
      tone(880, 0.12, 'square', 0.07, 0.2);
    },
    win() {
      tone(523, 0.16, 'sine', 0.12, 0);
      tone(659, 0.16, 'sine', 0.12, 0.14);
      tone(784, 0.22, 'sine', 0.12, 0.28);
      tone(1047, 0.34, 'sine', 0.12, 0.42);
    },
  };
}
