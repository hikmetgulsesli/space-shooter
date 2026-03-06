import { WaveSystem, WaveConfig, DEFAULT_WAVE_CONFIG } from '../src/waves/WaveSystem';

describe('WaveSystem', () => {
    let waveSystem: WaveSystem;

    beforeEach(() => {
        waveSystem = new WaveSystem();
    });

    describe('Initialization', () => {
        test('initializes with wave 1', () => {
            expect(waveSystem.getCurrentWave()).toBe(1);
        });

        test('initializes with default asteroid spawn interval', () => {
            expect(waveSystem.getAsteroidSpawnInterval()).toBe(DEFAULT_WAVE_CONFIG.initialAsteroidSpawnInterval);
        });

        test('initializes with default enemy spawn interval', () => {
            expect(waveSystem.getEnemySpawnInterval()).toBe(DEFAULT_WAVE_CONFIG.initialEnemySpawnInterval);
        });

        test('is not a boss wave initially', () => {
            expect(waveSystem.isBossWave()).toBe(false);
        });

        test('is not complete initially', () => {
            expect(waveSystem.isWaveComplete()).toBe(false);
        });

        test('accepts custom config', () => {
            const customConfig: Partial<WaveConfig> = {
                initialAsteroidSpawnInterval: 200,
                waveBonusMultiplier: 50
            };
            const customWaveSystem = new WaveSystem(customConfig);
            expect(customWaveSystem.getAsteroidSpawnInterval()).toBe(200);
        });
    });

    describe('Wave Progression', () => {
        test('wave completes when no asteroids or enemies', () => {
            waveSystem.update(0, 0);
            expect(waveSystem.isWaveComplete()).toBe(true);
        });

        test('wave does not complete when asteroids exist', () => {
            waveSystem.update(1, 0);
            expect(waveSystem.isWaveComplete()).toBe(false);
        });

        test('wave does not complete when enemies exist', () => {
            waveSystem.update(0, 1);
            expect(waveSystem.isWaveComplete()).toBe(false);
        });

        test('awards bonus points when wave completes', () => {
            const bonus = waveSystem.update(0, 0);
            expect(bonus).toBe(100); // Wave 1 * 100 multiplier
        });

        test('bonus is awarded only once per wave', () => {
            waveSystem.update(0, 0); // First call awards bonus
            const secondBonus = waveSystem.update(0, 0); // Second call should not award
            expect(secondBonus).toBe(0);
        });
    });

    describe('Wave Advancement', () => {
        test('advances to next wave after delay', (done) => {
            const fastConfig: Partial<WaveConfig> = {
                waveCompleteDelay: 50,
                messageDisplayDuration: 50
            };
            const fastWaveSystem = new WaveSystem(fastConfig);
            
            expect(fastWaveSystem.getCurrentWave()).toBe(1);
            fastWaveSystem.update(0, 0); // Complete wave 1
            
            setTimeout(() => {
                fastWaveSystem.update(0, 0); // Should advance to wave 2
                expect(fastWaveSystem.getCurrentWave()).toBe(2);
                done();
            }, 150);
        });

        test('advances multiple waves correctly', (done) => {
            const fastConfig: Partial<WaveConfig> = {
                waveCompleteDelay: 10,
                messageDisplayDuration: 10
            };
            const fastWaveSystem = new WaveSystem(fastConfig);
            
            fastWaveSystem.setWave(3);
            expect(fastWaveSystem.getCurrentWave()).toBe(3);
            
            fastWaveSystem.update(0, 0);
            
            setTimeout(() => {
                fastWaveSystem.update(0, 0);
                expect(fastWaveSystem.getCurrentWave()).toBe(4);
                done();
            }, 50);
        });
    });

    describe('Difficulty Scaling', () => {
        test('asteroid spawn interval decreases each wave', (done) => {
            const fastConfig: Partial<WaveConfig> = {
                waveCompleteDelay: 10,
                messageDisplayDuration: 10
            };
            const fastWaveSystem = new WaveSystem(fastConfig);
            
            const initialInterval = fastWaveSystem.getAsteroidSpawnInterval();
            fastWaveSystem.update(0, 0);
            
            setTimeout(() => {
                fastWaveSystem.update(0, 0); // Advance to wave 2
                expect(fastWaveSystem.getAsteroidSpawnInterval()).toBeLessThan(initialInterval);
                done();
            }, 50);
        });

        test('asteroid spawn interval has minimum cap', (done) => {
            const fastConfig: Partial<WaveConfig> = {
                waveCompleteDelay: 10,
                messageDisplayDuration: 10,
                spawnIntervalDecrement: 50,
                minAsteroidSpawnInterval: 30
            };
            const fastWaveSystem = new WaveSystem(fastConfig);
            
            // Set to a high wave
            fastWaveSystem.setWave(10);
            fastWaveSystem.update(0, 0);
            
            setTimeout(() => {
                fastWaveSystem.update(0, 0);
                expect(fastWaveSystem.getAsteroidSpawnInterval()).toBeGreaterThanOrEqual(30);
                done();
            }, 50);
        });

        test('enemy spawn interval decreases each wave', (done) => {
            const fastConfig: Partial<WaveConfig> = {
                waveCompleteDelay: 10,
                messageDisplayDuration: 10
            };
            const fastWaveSystem = new WaveSystem(fastConfig);
            
            const initialInterval = fastWaveSystem.getEnemySpawnInterval();
            fastWaveSystem.update(0, 0);
            
            setTimeout(() => {
                fastWaveSystem.update(0, 0); // Advance to wave 2
                expect(fastWaveSystem.getEnemySpawnInterval()).toBeLessThan(initialInterval);
                done();
            }, 50);
        });
    });

    describe('Boss Waves', () => {
        test('every 5th wave is a boss wave', () => {
            waveSystem.setWave(5);
            expect(waveSystem.isBossWave()).toBe(true);
        });

        test('non-5th waves are not boss waves', () => {
            waveSystem.setWave(3);
            expect(waveSystem.isBossWave()).toBe(false);
        });

        test('wave 10 is a boss wave', () => {
            waveSystem.setWave(10);
            expect(waveSystem.isBossWave()).toBe(true);
        });

        test('boss waves have faster enemy spawn rate', () => {
            const config: Partial<WaveConfig> = {
                bossWaveSpawnMultiplier: 2
            };
            
            // Regular wave 4
            const regularWaveSystem = new WaveSystem(config);
            regularWaveSystem.setWave(4);
            const regularEnemyInterval = regularWaveSystem.getEnemySpawnInterval();
            
            // Boss wave 5
            const bossWaveSystem = new WaveSystem(config);
            bossWaveSystem.setWave(5);
            const bossEnemyInterval = bossWaveSystem.getEnemySpawnInterval();
            
            // Boss wave should have faster (lower) spawn interval
            expect(bossEnemyInterval).toBeLessThan(regularEnemyInterval);
        });

        test('boss wave message indicates boss wave', () => {
            waveSystem.setWave(5);
            const message = waveSystem.getWaveCompleteMessage();
            expect(message).toContain('BOSS');
        });
    });

    describe('Wave Messages', () => {
        test('getWaveCompleteMessage returns correct format', () => {
            const message = waveSystem.getWaveCompleteMessage();
            expect(message).toContain('WAVE');
            expect(message).toContain('1');
            expect(message).toContain('COMPLETE');
        });

        test('getWaveStartMessage returns correct format', () => {
            const message = waveSystem.getWaveStartMessage();
            expect(message).toContain('WAVE');
            expect(message).toContain('1');
        });

        test('getBonusMessage returns correct format', () => {
            waveSystem.setWave(3);
            const message = waveSystem.getBonusMessage();
            expect(message).toContain('+300');
            expect(message).toContain('BONUS');
        });
    });

    describe('Message Display', () => {
        test('shouldShowWaveCompleteMessage returns true after wave completion', () => {
            waveSystem.update(0, 0);
            expect(waveSystem.shouldShowWaveCompleteMessage()).toBe(true);
        });

        test('shouldShowWaveCompleteMessage returns false before wave completion', () => {
            expect(waveSystem.shouldShowWaveCompleteMessage()).toBe(false);
        });

        test('message display expires after duration', (done) => {
            const fastConfig: Partial<WaveConfig> = {
                messageDisplayDuration: 50
            };
            const fastWaveSystem = new WaveSystem(fastConfig);
            
            fastWaveSystem.update(0, 0);
            expect(fastWaveSystem.shouldShowWaveCompleteMessage()).toBe(true);
            
            setTimeout(() => {
                expect(fastWaveSystem.shouldShowWaveCompleteMessage()).toBe(false);
                done();
            }, 100);
        });
    });

    describe('Wave State', () => {
        test('getWaveState returns current state', () => {
            const state = waveSystem.getWaveState();
            expect(state.currentWave).toBe(1);
            expect(state.isWaveComplete).toBe(false);
        });

        test('wave state is immutable (copy returned)', () => {
            const state = waveSystem.getWaveState();
            state.currentWave = 999;
            expect(waveSystem.getCurrentWave()).toBe(1);
        });
    });

    describe('Reset', () => {
        test('reset returns to initial state', () => {
            waveSystem.setWave(10);
            waveSystem.reset();
            expect(waveSystem.getCurrentWave()).toBe(1);
            expect(waveSystem.isWaveComplete()).toBe(false);
        });

        test('reset restores default spawn intervals', () => {
            waveSystem.setWave(10);
            waveSystem.reset();
            expect(waveSystem.getAsteroidSpawnInterval()).toBe(DEFAULT_WAVE_CONFIG.initialAsteroidSpawnInterval);
            expect(waveSystem.getEnemySpawnInterval()).toBe(DEFAULT_WAVE_CONFIG.initialEnemySpawnInterval);
        });
    });

    describe('Set Wave', () => {
        test('setWave changes to specific wave', () => {
            waveSystem.setWave(5);
            expect(waveSystem.getCurrentWave()).toBe(5);
        });

        test('setWave updates boss wave status', () => {
            waveSystem.setWave(5);
            expect(waveSystem.isBossWave()).toBe(true);
        });

        test('setWave updates spawn intervals', () => {
            waveSystem.setWave(10);
            // Higher waves should have lower spawn intervals
            expect(waveSystem.getAsteroidSpawnInterval()).toBeLessThan(DEFAULT_WAVE_CONFIG.initialAsteroidSpawnInterval);
        });

        test('setWave resets wave complete state', () => {
            waveSystem.update(0, 0);
            expect(waveSystem.isWaveComplete()).toBe(true);
            waveSystem.setWave(3);
            expect(waveSystem.isWaveComplete()).toBe(false);
        });
    });

    describe('Force Next Wave', () => {
        test('forceNextWave advances immediately', () => {
            expect(waveSystem.getCurrentWave()).toBe(1);
            waveSystem.forceNextWave();
            expect(waveSystem.getCurrentWave()).toBe(2);
        });

        test('forceNextWave does not wait for delay', () => {
            const slowConfig: Partial<WaveConfig> = {
                waveCompleteDelay: 10000,
                messageDisplayDuration: 10000
            };
            const slowWaveSystem = new WaveSystem(slowConfig);
            
            slowWaveSystem.forceNextWave();
            expect(slowWaveSystem.getCurrentWave()).toBe(2);
        });
    });

    describe('Bonus Calculation', () => {
        test('wave 1 bonus is 100', () => {
            const bonus = waveSystem.update(0, 0);
            expect(bonus).toBe(100);
        });

        test('wave 5 bonus is 500', () => {
            waveSystem.setWave(5);
            const bonus = waveSystem.update(0, 0);
            expect(bonus).toBe(500);
        });

        test('wave 10 bonus is 1000', () => {
            waveSystem.setWave(10);
            const bonus = waveSystem.update(0, 0);
            expect(bonus).toBe(1000);
        });
    });
});
