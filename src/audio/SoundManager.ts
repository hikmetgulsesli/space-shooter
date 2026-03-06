export type SoundType = 'laser' | 'explosionSmall' | 'explosionMedium' | 'explosionLarge' | 'powerUp' | 'playerDamage' | 'gameOver';

export interface SoundConfig {
    type: SoundType;
    volume?: number;
}

export class SoundManager {
    private audioContext: AudioContext | null = null;
    private sounds: Map<SoundType, AudioBuffer> = new Map();
    private backgroundOscillator: OscillatorNode | null = null;
    private backgroundGain: GainNode | null = null;
    private isMuted: boolean = false;
    private reducedMotion: boolean = false;
    private masterGain: GainNode | null = null;

    constructor() {
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.loadMuteState();
    }

    public async init(): Promise<void> {
        if (this.reducedMotion) {
            console.log('Audio disabled due to reduced motion preference');
            return;
        }

        try {
            this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.updateMasterVolume();

            await this.generateSounds();
        } catch (error) {
            console.warn('Audio initialization failed:', error);
        }
    }

    private loadMuteState(): void {
        const saved = localStorage.getItem('spaceShooterMuted');
        this.isMuted = saved === 'true';
    }

    private saveMuteState(): void {
        localStorage.setItem('spaceShooterMuted', this.isMuted.toString());
    }

    public toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        this.saveMuteState();
        this.updateMasterVolume();
        return this.isMuted;
    }

    public getIsMuted(): boolean {
        return this.isMuted;
    }

    private updateMasterVolume(): void {
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.audioContext!.currentTime);
        }
        if (this.backgroundGain) {
            const targetVolume = this.isMuted ? 0 : 0.3;
            this.backgroundGain.gain.setValueAtTime(targetVolume, this.audioContext!.currentTime);
        }
    }

    private async generateSounds(): Promise<void> {
        if (!this.audioContext) return;

        // Generate laser shoot sound
        this.sounds.set('laser', this.createLaserSound());

        // Generate explosion sounds
        this.sounds.set('explosionSmall', this.createExplosionSound(0.3));
        this.sounds.set('explosionMedium', this.createExplosionSound(0.5));
        this.sounds.set('explosionLarge', this.createExplosionSound(0.8));

        // Generate power-up sound
        this.sounds.set('powerUp', this.createPowerUpSound());

        // Generate player damage sound
        this.sounds.set('playerDamage', this.createDamageSound());

        // Generate game over sound
        this.sounds.set('gameOver', this.createGameOverSound());
    }

    private createLaserSound(): AudioBuffer {
        if (!this.audioContext) throw new Error('AudioContext not initialized');

        const duration = 0.15;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const frequency = 800 - t * 3000; // Frequency sweep down
            data[i] = Math.sin(2 * Math.PI * frequency * t) * (1 - t / duration);
        }

        return buffer;
    }

    private createExplosionSound(intensity: number): AudioBuffer {
        if (!this.audioContext) throw new Error('AudioContext not initialized');

        const duration = 0.5 * intensity;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const noise = (Math.random() * 2 - 1);
            const envelope = Math.exp(-t * 5 / intensity);
            data[i] = noise * envelope * intensity;
        }

        return buffer;
    }

    private createPowerUpSound(): AudioBuffer {
        if (!this.audioContext) throw new Error('AudioContext not initialized');

        const duration = 0.4;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const frequency = 400 + t * 1000; // Frequency sweep up
            data[i] = Math.sin(2 * Math.PI * frequency * t) * (1 - t / duration) * 0.5;
        }

        return buffer;
    }

    private createDamageSound(): AudioBuffer {
        if (!this.audioContext) throw new Error('AudioContext not initialized');

        const duration = 0.3;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const frequency = 200 - t * 200;
            const noise = (Math.random() * 2 - 1) * 0.5;
            data[i] = (Math.sin(2 * Math.PI * frequency * t) + noise) * (1 - t / duration);
        }

        return buffer;
    }

    private createGameOverSound(): AudioBuffer {
        if (!this.audioContext) throw new Error('AudioContext not initialized');

        const duration = 1.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        const notes = [220, 196, 174.61, 130.81]; // A3, G3, F3, C3
        const noteDuration = duration / notes.length;

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const noteIndex = Math.min(Math.floor(t / noteDuration), notes.length - 1);
            const frequency = notes[noteIndex];
            const noteTime = t % noteDuration;
            const envelope = Math.exp(-noteTime * 3);
            data[i] = Math.sin(2 * Math.PI * frequency * noteTime) * envelope * 0.5;
        }

        return buffer;
    }

    public play(type: SoundType): void {
        if (!this.audioContext || this.isMuted || this.reducedMotion) return;

        const buffer = this.sounds.get(type);
        if (!buffer) return;

        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;

            const gain = this.audioContext.createGain();
            const volume = this.getVolumeForType(type);
            gain.gain.setValueAtTime(volume, this.audioContext.currentTime);

            source.connect(gain);
            gain.connect(this.masterGain!);
            source.start();
        } catch (error) {
            console.warn('Failed to play sound:', error);
        }
    }

    private getVolumeForType(type: SoundType): number {
        const volumes: Record<SoundType, number> = {
            laser: 0.3,
            explosionSmall: 0.4,
            explosionMedium: 0.5,
            explosionLarge: 0.6,
            powerUp: 0.5,
            playerDamage: 0.5,
            gameOver: 0.5
        };
        return volumes[type] || 0.5;
    }

    public startBackgroundMusic(): void {
        if (!this.audioContext || this.reducedMotion) return;

        this.stopBackgroundMusic();

        try {
            // Create ambient space drone using multiple oscillators
            this.backgroundOscillator = this.audioContext.createOscillator();
            this.backgroundGain = this.audioContext.createGain();

            const osc2 = this.audioContext.createOscillator();
            const gain2 = this.audioContext.createGain();

            // Primary drone - low frequency with subtle movement
            this.backgroundOscillator.type = 'sine';
            this.backgroundOscillator.frequency.setValueAtTime(60, this.audioContext.currentTime);

            // Secondary drone - slightly detuned
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(62, this.audioContext.currentTime);

            // Low volume for ambient background
            const volume = this.isMuted ? 0 : 0.3;
            this.backgroundGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gain2.gain.setValueAtTime(volume * 0.5, this.audioContext.currentTime);

            // Add subtle LFO for movement
            const lfo = this.audioContext.createOscillator();
            lfo.frequency.setValueAtTime(0.1, this.audioContext.currentTime);
            const lfoGain = this.audioContext.createGain();
            lfoGain.gain.setValueAtTime(5, this.audioContext.currentTime);
            lfo.connect(lfoGain);
            lfoGain.connect(this.backgroundOscillator.frequency);
            lfo.start();

            this.backgroundOscillator.connect(this.backgroundGain);
            this.backgroundGain.connect(this.masterGain!);
            osc2.connect(gain2);
            gain2.connect(this.masterGain!);

            this.backgroundOscillator.start();
            osc2.start();

            // Store secondary oscillator reference on primary for cleanup
            (this.backgroundOscillator as unknown as { osc2: OscillatorNode }).osc2 = osc2;
        } catch (error) {
            console.warn('Failed to start background music:', error);
        }
    }

    public stopBackgroundMusic(): void {
        if (this.backgroundOscillator) {
            try {
                this.backgroundOscillator.stop();
                const osc2 = (this.backgroundOscillator as unknown as { osc2?: OscillatorNode }).osc2;
                if (osc2) osc2.stop();
            } catch (error) {
                // Oscillator may already be stopped
            }
            this.backgroundOscillator = null;
            this.backgroundGain = null;
        }
    }

    public resume(): void {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    public suspend(): void {
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public load(type: SoundType, url: string): Promise<void> {
        // This method is for future use if we want to load external audio files
        // Currently all sounds are generated procedurally
        return Promise.resolve();
    }

    public stop(): void {
        // Stop all playing sounds (not implemented for generated sounds)
        // Background music can be stopped separately
    }
}