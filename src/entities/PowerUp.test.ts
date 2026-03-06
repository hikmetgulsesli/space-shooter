/**
 * PowerUp System Tests
 * Tests for all power-up functionality including spawn, collection, and effects
 */

import { PowerUp, PowerUpManager, PowerUpType } from './PowerUp';

describe('PowerUp', () => {
    describe('PowerUp Entity', () => {
        it('should create a power-up with correct type and position', () => {
            const powerUp = new PowerUp(100, 200, 'rapidFire');

            expect(powerUp.x).toBe(100);
            expect(powerUp.y).toBe(200);
            expect(powerUp.getType()).toBe('rapidFire');
            expect(powerUp.isActive()).toBe(true);
        });

        it('should drift when updated', () => {
            const powerUp = new PowerUp(100, 100, 'shield');
            const initialX = powerUp.x;
            const initialY = powerUp.y;

            // Create a mock canvas
            const canvas = { width: 800, height: 600 } as HTMLCanvasElement;

            powerUp.update(canvas);

            // Position should have changed due to drift
            expect(powerUp.x !== initialX || powerUp.y !== initialY).toBe(true);
        });

        it('should become inactive when off screen', () => {
            const powerUp = new PowerUp(-60, 100, 'multiShot');
            const canvas = { width: 800, height: 600 } as HTMLCanvasElement;

            powerUp.update(canvas);

            expect(powerUp.isActive()).toBe(false);
        });

        it('should detect collision with player', () => {
            const powerUp = new PowerUp(100, 100, 'rapidFire');

            // Collision - within radius
            expect(powerUp.checkCollision(110, 100, 15)).toBe(true);

            // No collision - too far
            expect(powerUp.checkCollision(200, 200, 15)).toBe(false);
        });

        it('should become inactive when collected', () => {
            const powerUp = new PowerUp(100, 100, 'shield');

            expect(powerUp.isActive()).toBe(true);
            powerUp.collect();
            expect(powerUp.isActive()).toBe(false);
        });
    });

    describe('PowerUp.spawnChance', () => {
        it('should return a valid random power-up type', () => {
            const types: PowerUpType[] = ['rapidFire', 'shield', 'multiShot'];

            // Run multiple times to ensure we get valid types
            for (let i = 0; i < 20; i++) {
                const type = PowerUp.getRandomType();
                expect(types).toContain(type);
            }
        });

        it('should spawn approximately 15% of the time (statistical)', () => {
            const trials = 1000;
            let spawns = 0;

            for (let i = 0; i < trials; i++) {
                if (PowerUp.shouldSpawn()) {
                    spawns++;
                }
            }

            // With 1000 trials, we expect around 150 spawns (15%)
            // Allow for some variance: between 100 and 200
            expect(spawns).toBeGreaterThan(100);
            expect(spawns).toBeLessThan(200);
        });
    });
});

describe('PowerUpManager', () => {
    let manager: PowerUpManager;

    beforeEach(() => {
        manager = new PowerUpManager();
    });

    describe('Activation', () => {
        it('should activate rapid fire power-up', () => {
            manager.activate('rapidFire');
            expect(manager.isActive('rapidFire')).toBe(true);
        });

        it('should activate shield power-up', () => {
            manager.activate('shield');
            expect(manager.isActive('shield')).toBe(true);
        });

        it('should activate multi-shot power-up', () => {
            manager.activate('multiShot');
            expect(manager.isActive('multiShot')).toBe(true);
        });
    });

    describe('Duration', () => {
        it('should expire rapid fire after 10 seconds', () => {
            manager.activate('rapidFire');
            expect(manager.isActive('rapidFire')).toBe(true);

            // Update with 10 seconds of time
            manager.update(10000);

            expect(manager.isActive('rapidFire')).toBe(false);
        });

        it('should expire shield after 10 seconds', () => {
            manager.activate('shield');
            expect(manager.isActive('shield')).toBe(true);

            // Update with 10 seconds of time
            manager.update(10000);

            expect(manager.isActive('shield')).toBe(false);
        });

        it('should expire multi-shot after 10 seconds', () => {
            manager.activate('multiShot');
            expect(manager.isActive('multiShot')).toBe(true);

            // Update with 10 seconds of time
            manager.update(10000);

            expect(manager.isActive('multiShot')).toBe(false);
        });

        it('should track remaining time correctly', () => {
            manager.activate('rapidFire');

            // Pass 3 seconds
            manager.update(3000);

            const activePowerUps = manager.getActivePowerUps();
            expect(activePowerUps).toHaveLength(1);
            expect(activePowerUps[0].remainingTime).toBe(7000);
        });
    });

    describe('Fire Rate Multiplier', () => {
        it('should return 1x when rapid fire is inactive', () => {
            expect(manager.getFireRateMultiplier()).toBe(1);
        });

        it('should return 2x when rapid fire is active', () => {
            manager.activate('rapidFire');
            expect(manager.getFireRateMultiplier()).toBe(2);
        });
    });

    describe('Multi-Shot', () => {
        it('should return false when multi-shot is inactive', () => {
            expect(manager.isMultiShotActive()).toBe(false);
        });

        it('should return true when multi-shot is active', () => {
            manager.activate('multiShot');
            expect(manager.isMultiShotActive()).toBe(true);
        });
    });

    describe('Shield', () => {
        it('should return false for useShield when shield is inactive', () => {
            expect(manager.useShield()).toBe(false);
        });

        it('should return true and consume shield when active', () => {
            manager.activate('shield');
            expect(manager.isActive('shield')).toBe(true);

            const shieldUsed = manager.useShield();

            expect(shieldUsed).toBe(true);
            expect(manager.isActive('shield')).toBe(false);
        });

        it('should only allow shield to be used once', () => {
            manager.activate('shield');

            expect(manager.useShield()).toBe(true);
            expect(manager.useShield()).toBe(false);
        });
    });

    describe('Multiple Power-ups', () => {
        it('should track multiple active power-ups', () => {
            manager.activate('rapidFire');
            manager.activate('shield');
            manager.activate('multiShot');

            expect(manager.getActivePowerUps()).toHaveLength(3);
        });

        it('should expire power-ups independently', () => {
            manager.activate('rapidFire');
            manager.activate('shield');

            // Expire all
            manager.update(10000);

            expect(manager.isActive('rapidFire')).toBe(false);
            expect(manager.isActive('shield')).toBe(false);
        });

        it('should refresh duration when same power-up is activated again', () => {
            manager.activate('rapidFire');
            manager.update(5000); // Pass 5 seconds

            // Re-activate rapid fire
            manager.activate('rapidFire');

            const activePowerUps = manager.getActivePowerUps();
            expect(activePowerUps[0].remainingTime).toBe(10000);
        });
    });

    describe('Clear', () => {
        it('should clear all active power-ups', () => {
            manager.activate('rapidFire');
            manager.activate('shield');
            manager.activate('multiShot');

            expect(manager.getActivePowerUps()).toHaveLength(3);

            manager.clear();

            expect(manager.getActivePowerUps()).toHaveLength(0);
            expect(manager.isActive('rapidFire')).toBe(false);
            expect(manager.isActive('shield')).toBe(false);
            expect(manager.isActive('multiShot')).toBe(false);
        });
    });

    describe('HUD Display', () => {
        it('should return empty array when no power-ups active', () => {
            expect(manager.getActivePowerUps()).toEqual([]);
        });

        it('should return correct power-up info for HUD', () => {
            manager.activate('rapidFire');
            manager.update(2000); // Pass 2 seconds

            const powerUps = manager.getActivePowerUps();
            expect(powerUps).toHaveLength(1);
            expect(powerUps[0].type).toBe('rapidFire');
            expect(powerUps[0].duration).toBe(10000);
            expect(powerUps[0].remainingTime).toBe(8000);
        });
    });
});
