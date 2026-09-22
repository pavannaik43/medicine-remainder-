// Web Audio API synthesizer for medicine reminder alarm chime

let audioCtx = null;
let alarmInterval = null;
let isMuted = false;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
}

export function isMuteEnabled() {
  return isMuted;
}

export function toggleMute() {
  isMuted = !isMuted;
  if (isMuted) {
    stopAlarm();
  }
  return isMuted;
}

export function playChimePattern() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [
    { freq: 587.33, start: 0, duration: 0.15 },    // D5
    { freq: 739.99, start: 0.15, duration: 0.15 }, // F#5
    { freq: 880.00, start: 0.30, duration: 0.2 },  // A5
    { freq: 1174.66, start: 0.50, duration: 0.45 },// D6
  ];

  const now = ctx.currentTime;

  notes.forEach(({ freq, start, duration }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + start);

    gain.gain.setValueAtTime(0.001, now + start);
    gain.gain.exponentialRampToValueAtTime(0.25, now + start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + start);
    osc.stop(now + start + duration);
  });
}

export function startAlarm() {
  if (isMuted) return;
  unlockAudio();
  stopAlarm(); // clear any existing

  // Play immediately
  playChimePattern();

  // Repeat every 1.6 seconds
  alarmInterval = setInterval(() => {
    playChimePattern();
  }, 1600);
}

export function stopAlarm() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
}

export function playTestChime() {
  unlockAudio();
  playChimePattern();
}
