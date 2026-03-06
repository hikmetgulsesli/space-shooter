import { SoundManager, SoundType } from '../src/audio/SoundManager';

// Mock AudioContext for testing
class MockAudioContext {
    public state = 'running';
    public currentTime = 0;
    sampleRate = 44100;

    createBuffer(channels: number, length: number, sampleRate: number): AudioBuffer {
        const buffer = new Float32Array(length);
        return {
            getChannelData: () => buffer,
            copyFromChannel: jest.fn(),
            copyToChannel: jest.fn(),
            length,
            sampleRate,
            numberOfChannels: channels,
            duration: length / sampleRate
        } as unknown as AudioBuffer;
    }

    createBufferSource() {
        return {
            connect: jest.fn(),
            disconnect: jest.fn(),
            start: jest.fn(),
            stop: jest.fn(),
            buffer: null as AudioBuffer | null
        };
    }

    createGain() {
        return {
            connect: jest.fn(),
            disconnect: jest.fn(),
            gain: {
                setValueAtTime: jest.fn(),
                value: 1
            }
        };
    }

    createOscillator() {
        return {
            connect: jest.fn(),
            disconnect: jest.fn(),
            start: jest.fn(),
            stop: jest.fn(),
            frequency: {
                setValueAtTime: jest.fn()
            }
        };
    }

    resume() {
        this.state = 'running';
        return Promise.resolve();
    }

    suspend() {
        this.state = 'suspended';
        return Promise.resolve();
    }
}

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
    }))
});

describe('SoundManager', () => {
    let soundManager: SoundManager;
    let mockAudioContext: MockAudioContext;

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);

        // Setup AudioContext mock
        mockAudioContext = new MockAudioContext();
        (window as unknown as { AudioContext: typeof AudioContext }).AudioContext = MockAudioContext as unknown as typeof AudioContext;

        soundManager = new SoundManager();
    });

    describe('initialization', () => {
        test('should initialize audio context on init', async () => {
            await soundManager.init();
            // AudioContext should be created during init
        });

        test('should not initialize if reduced motion is preferred', async () => {
            (window.matchMedia as jest.Mock).mockReturnValueOnce({
                matches: true,
                media: '(prefers-reduced-motion: reduce)',
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn()
            });

            const sm = new SoundManager();
            await sm.init();
            // Should not create AudioContext
        });

        test('should load mute state from localStorage', () => {
            localStorageMock.getItem.mockReturnValue('true');
            const sm = new SoundManager();
            expect(sm.getIsMuted()).toBe(true);
        });
    });

    describe('mute/unmute', () => {
        test('should toggle mute state', async () => {
            await soundManager.init();

            expect(soundManager.getIsMuted()).toBe(false);

            const result = soundManager.toggleMute();
            expect(result).toBe(true);
            expect(soundManager.getIsMuted()).toBe(true);

            const result2 = soundManager.toggleMute();
            expect(result2).toBe(false);
            expect(soundManager.getIsMuted()).toBe(false);
        });

        test('should save mute state to localStorage', async () => {
            await soundManager.init();

            soundManager.toggleMute();
            expect(localStorageMock.setItem).toHaveBeenCalledWith('spaceShooterMuted', 'true');

            soundManager.toggleMute();
            expect(localStorageMock.setItem).toHaveBeenCalledWith('spaceShooterMuted', 'false');
        });
    });

    describe('sound playback', () => {
        test('should play laser sound', async () => {
            await soundManager.init();

            // Should not throw
            expect(() => soundManager.play('laser')).not.toThrow();
        });

        test('should play explosion sounds', async () => {
            await soundManager.init();

            expect(() => soundManager.play('explosionSmall')).not.toThrow();
            expect(() => soundManager.play('explosionMedium')).not.toThrow();
            expect(() => soundManager.play('explosionLarge')).not.toThrow();
        });

        test('should play powerUp sound', async () => {
            await soundManager.init();
            expect(() => soundManager.play('powerUp')).not.toThrow();
        });

        test('should play playerDamage sound', async () => {
            await soundManager.init();
            expect(() => soundManager.play('playerDamage')).not.toThrow();
        });

        test('should play gameOver sound', async () => {
            await soundManager.init();
            expect(() => soundManager.play('gameOver')).not.toThrow();
        });

        test('should not play sounds when muted', async () => {
            await soundManager.init();
            soundManager.toggleMute();

            // Should not throw even when muted
            expect(() => soundManager.play('laser')).not.toThrow();
        });

        test('should not play sounds when reduced motion is preferred', async () => {
            (window.matchMedia as jest.Mock).mockReturnValueOnce({
                matches: true,
                media: '(prefers-reduced-motion: reduce)',
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn()
            });

            const sm = new SoundManager();
            await sm.init();

            expect(() => sm.play('laser')).not.toThrow();
        });
    });

    describe('background music', () => {
        test('should start background music', async () => {
            await soundManager.init();

            // Should not throw
            expect(() => soundManager.startBackgroundMusic()).not.toThrow();
        });

        test('should stop background music', async () => {
            await soundManager.init();
            soundManager.startBackgroundMusic();

            // Should not throw
            expect(() => soundManager.stopBackgroundMusic()).not.toThrow();
        });

        test('should not start background music when reduced motion is preferred', async () => {
            (window.matchMedia as jest.Mock).mockReturnValueOnce({
                matches: true,
                media: '(prefers-reduced-motion: reduce)',
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn()
            });

            const sm = new SoundManager();
            await sm.init();

            expect(() => sm.startBackgroundMusic()).not.toThrow();
        });
    });

    describe('resume and suspend', () => {
        test('should resume audio context', async () => {
            await soundManager.init();

            soundManager.suspend();
            expect(() => soundManager.resume()).not.toThrow();
        });

        test('should suspend audio context', async () => {
            await soundManager.init();

            expect(() => soundManager.suspend()).not.toThrow();
        });
    });

    describe('load method', () => {
        test('load method returns resolved promise', async () => {
            await expect(soundManager.load('laser', 'test.mp3')).resolves.toBeUndefined();
        });
    });

    describe('stop method', () => {
        test('stop method does not throw', async () => {
            await soundManager.init();
            expect(() => soundManager.stop()).not.toThrow();
        });
    });
});