import { ScoreManager, GameStats, getScoreManager, resetScoreManager } from './ScoreManager';

describe('ScoreManager', () => {
    let scoreManager: ScoreManager;
    const testStorageKey = 'testSpaceShooterStats';

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        resetScoreManager();
        scoreManager = new ScoreManager({ storageKey: testStorageKey });
    });

    afterEach(() => {
        localStorage.clear();
        resetScoreManager();
    });

    describe('initialization', () => {
        it('should initialize with default stats', () => {
            const stats = scoreManager.getStats();
            expect(stats.highScore).toBe(0);
            expect(stats.highestWave).toBe(0);
            expect(stats.totalGamesPlayed).toBe(0);
            expect(stats.totalScoreAccumulated).toBe(0);
        });

        it('should detect localStorage availability', () => {
            expect(scoreManager.isStorageAvailable()).toBe(true);
        });

        it('should use default storage key if not provided', () => {
            const defaultManager = new ScoreManager();
            expect(defaultManager.isStorageAvailable()).toBe(true);
        });
    });

    describe('load and save', () => {
        it('should load existing stats from localStorage', () => {
            const existingStats: GameStats = {
                highScore: 5000,
                highestWave: 5,
                totalGamesPlayed: 10,
                totalScoreAccumulated: 25000,
            };
            localStorage.setItem(testStorageKey, JSON.stringify(existingStats));

            const newManager = new ScoreManager({ storageKey: testStorageKey });
            const stats = newManager.getStats();

            expect(stats.highScore).toBe(5000);
            expect(stats.highestWave).toBe(5);
            expect(stats.totalGamesPlayed).toBe(10);
            expect(stats.totalScoreAccumulated).toBe(25000);
        });

        it('should save stats to localStorage after recording game', () => {
            scoreManager.recordGame(1000, 3);

            const stored = localStorage.getItem(testStorageKey);
            expect(stored).not.toBeNull();

            const parsed = JSON.parse(stored!);
            expect(parsed.highScore).toBe(1000);
            expect(parsed.highestWave).toBe(3);
            expect(parsed.totalGamesPlayed).toBe(1);
            expect(parsed.totalScoreAccumulated).toBe(1000);
        });

        it('should handle corrupted localStorage data gracefully', () => {
            localStorage.setItem(testStorageKey, 'invalid json');

            const newManager = new ScoreManager({ storageKey: testStorageKey });
            const stats = newManager.getStats();

            expect(stats.highScore).toBe(0);
            expect(stats.highestWave).toBe(0);
        });

        it('should handle partial localStorage data', () => {
            localStorage.setItem(testStorageKey, JSON.stringify({ highScore: 500 }));

            const newManager = new ScoreManager({ storageKey: testStorageKey });
            const stats = newManager.getStats();

            expect(stats.highScore).toBe(500);
            expect(stats.highestWave).toBe(0);
            expect(stats.totalGamesPlayed).toBe(0);
        });
    });

    describe('recordGame', () => {
        it('should update high score when new score is higher', () => {
            scoreManager.recordGame(1000, 1);
            expect(scoreManager.getHighScore()).toBe(1000);

            scoreManager.recordGame(1500, 1);
            expect(scoreManager.getHighScore()).toBe(1500);
        });

        it('should not update high score when new score is lower', () => {
            scoreManager.recordGame(2000, 1);
            scoreManager.recordGame(1000, 1);

            expect(scoreManager.getHighScore()).toBe(2000);
        });

        it('should update high score when new score equals current high score', () => {
            scoreManager.recordGame(1000, 1);
            scoreManager.recordGame(1000, 1);

            expect(scoreManager.getHighScore()).toBe(1000);
        });

        it('should update highest wave when new wave is higher', () => {
            scoreManager.recordGame(100, 3);
            expect(scoreManager.getHighestWave()).toBe(3);

            scoreManager.recordGame(100, 5);
            expect(scoreManager.getHighestWave()).toBe(5);
        });

        it('should not update highest wave when new wave is lower', () => {
            scoreManager.recordGame(100, 5);
            scoreManager.recordGame(100, 3);

            expect(scoreManager.getHighestWave()).toBe(5);
        });

        it('should increment total games played', () => {
            scoreManager.recordGame(100, 1);
            expect(scoreManager.getTotalGamesPlayed()).toBe(1);

            scoreManager.recordGame(200, 1);
            expect(scoreManager.getTotalGamesPlayed()).toBe(2);
        });

        it('should accumulate total score', () => {
            scoreManager.recordGame(1000, 1);
            expect(scoreManager.getTotalScoreAccumulated()).toBe(1000);

            scoreManager.recordGame(500, 1);
            expect(scoreManager.getTotalScoreAccumulated()).toBe(1500);
        });

        it('should default wave to 1 if not provided', () => {
            scoreManager.recordGame(100);
            expect(scoreManager.getHighestWave()).toBe(1);
        });
    });

    describe('resetStats', () => {
        it('should reset all stats to zero', () => {
            scoreManager.recordGame(5000, 10);
            scoreManager.resetStats();

            expect(scoreManager.getHighScore()).toBe(0);
            expect(scoreManager.getHighestWave()).toBe(0);
            expect(scoreManager.getTotalGamesPlayed()).toBe(0);
            expect(scoreManager.getTotalScoreAccumulated()).toBe(0);
        });

        it('should persist reset stats to localStorage', () => {
            scoreManager.recordGame(5000, 10);
            scoreManager.resetStats();

            const newManager = new ScoreManager({ storageKey: testStorageKey });
            expect(newManager.getHighScore()).toBe(0);
        });
    });

    describe('clearStorage', () => {
        it('should remove data from localStorage', () => {
            scoreManager.recordGame(1000, 1);
            scoreManager.clearStorage();

            expect(localStorage.getItem(testStorageKey)).toBeNull();
        });

        it('should reset stats after clearing', () => {
            scoreManager.recordGame(1000, 1);
            scoreManager.clearStorage();

            expect(scoreManager.getHighScore()).toBe(0);
            expect(scoreManager.getTotalGamesPlayed()).toBe(0);
        });
    });

    describe('getStats', () => {
        it('should return a copy of stats, not a reference', () => {
            const stats = scoreManager.getStats();
            stats.highScore = 9999;

            expect(scoreManager.getHighScore()).toBe(0);
        });
    });

    describe('graceful degradation', () => {
        let originalLocalStorage: Storage;

        beforeEach(() => {
            originalLocalStorage = window.localStorage;
        });

        afterEach(() => {
            Object.defineProperty(window, 'localStorage', {
                value: originalLocalStorage,
                writable: true,
            });
        });

        it('should handle localStorage being unavailable', () => {
            // Simulate unavailable localStorage
            Object.defineProperty(window, 'localStorage', {
                value: {
                    getItem: () => { throw new Error('Storage disabled'); },
                    setItem: () => { throw new Error('Storage disabled'); },
                    removeItem: () => { throw new Error('Storage disabled'); },
                },
                writable: true,
            });

            const manager = new ScoreManager({ storageKey: testStorageKey });
            expect(manager.isStorageAvailable()).toBe(false);
            expect(manager.getHighScore()).toBe(0);

            // Should not throw when recording game
            expect(() => manager.recordGame(1000, 1)).not.toThrow();
        });
    });
});

describe('getScoreManager', () => {
    beforeEach(() => {
        localStorage.clear();
        resetScoreManager();
    });

    afterEach(() => {
        localStorage.clear();
        resetScoreManager();
    });

    it('should return the same instance on multiple calls', () => {
        const manager1 = getScoreManager();
        const manager2 = getScoreManager();

        expect(manager1).toBe(manager2);
    });

    it('should share state between calls', () => {
        const manager1 = getScoreManager();
        manager1.recordGame(1000, 1);

        const manager2 = getScoreManager();
        expect(manager2.getHighScore()).toBe(1000);
    });
});
