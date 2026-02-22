export const playAudioBeep = (
    frequency = 440,
    duration = 0.1,
    type: OscillatorType = 'sine',
    volume = 0.5
) => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
        console.warn('Audio play failed', e);
    }
};

export const playWarningBeep = () => {
    playAudioBeep(880, 0.1, 'sine', 0.5); // High pitched short beep
};

export const playLevelUpSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const audioCtx = new AudioContext();

        // Play a sequence of 3 ascending notes
        const notes = [440, 554.37, 659.25]; // A4, C#5, E5

        notes.forEach((freq, i) => {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.15);

            gainNode.gain.setValueAtTime(0, audioCtx.currentTime + i * 0.15);
            gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + i * 0.15 + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.15 + 0.4);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start(audioCtx.currentTime + i * 0.15);
            oscillator.stop(audioCtx.currentTime + i * 0.15 + 0.4);
        });
    } catch (e) {
        console.warn('Level up sound failed', e);
    }
};
