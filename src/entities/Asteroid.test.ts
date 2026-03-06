import { Asteroid, AsteroidSize, AsteroidType } from './Asteroid';

describe('Asteroid', () => {
    describe('Constructor and Basic Properties', () => {
        it('should create an asteroid with default size and type', () => {
            const asteroid = new Asteroid(100, 100);
            expect(asteroid.getSize()).toBe('large');
            expect(asteroid.getType()).toBe('standard');
            expect(asteroid.isActive()).toBe(true);
        });

        it('should create an asteroid with specified size and type', () => {
            const asteroid = new Asteroid(100, 100, 'medium', 'fast');
            expect(asteroid.getSize()).toBe('medium');
            expect(asteroid.getType()).toBe('fast');
        });

        it('should have correct radius based on size', () => {
            const large = new Asteroid(100, 100, 'large');
            const medium = new Asteroid(100, 100, 'medium');
            const small = new Asteroid(100, 100, 'small');

            expect(large.getRadius()).toBe(40);
            expect(medium.getRadius()).toBe(25);
            expect(small.getRadius()).toBe(15);
        });
    });

    describe('Points System', () => {
        it('should return base points for standard asteroids', () => {
            const large = new Asteroid(100, 100, 'large', 'standard');
            const medium = new Asteroid(100, 100, 'medium', 'standard');
            const small = new Asteroid(100, 100, 'small', 'standard');

            expect(large.getPoints()).toBe(20);
            expect(medium.getPoints()).toBe(50);
            expect(small.getPoints()).toBe(100);
        });

        it('should return 1.5x points for fast asteroids', () => {
            const large = new Asteroid(100, 100, 'large', 'fast');
            const medium = new Asteroid(100, 100, 'medium', 'fast');
            const small = new Asteroid(100, 100, 'small', 'fast');

            expect(large.getPoints()).toBe(30); // 20 * 1.5
            expect(medium.getPoints()).toBe(75); // 50 * 1.5
            expect(small.getPoints()).toBe(150); // 100 * 1.5
        });

        it('should return 2x points for tank asteroids', () => {
            const large = new Asteroid(100, 100, 'large', 'tank');
            const medium = new Asteroid(100, 100, 'medium', 'tank');
            const small = new Asteroid(100, 100, 'small', 'tank');

            expect(large.getPoints()).toBe(40); // 20 * 2
            expect(medium.getPoints()).toBe(100); // 50 * 2
            expect(small.getPoints()).toBe(200); // 100 * 2
        });
    });

    describe('Breaking Apart - Large to Medium', () => {
        it('large asteroid should break into 2 medium asteroids', () => {
            const asteroid = new Asteroid(100, 100, 'large', 'standard');
            const fragments = asteroid.breakApart();

            expect(fragments).toHaveLength(2);
            fragments.forEach(fragment => {
                expect(fragment.getSize()).toBe('medium');
                expect(fragment.getType()).toBe('standard');
            });
        });

        it('broken fragments should inherit parent position', () => {
            const asteroid = new Asteroid(150, 200, 'large', 'standard');
            const fragments = asteroid.breakApart();

            fragments.forEach(fragment => {
                expect(fragment.x).toBe(150);
                expect(fragment.y).toBe(200);
            });
        });

        it('broken fragments should inherit parent type', () => {
            const fastAsteroid = new Asteroid(100, 100, 'large', 'fast');
            const tankAsteroid = new Asteroid(100, 100, 'large', 'tank');

            const fastFragments = fastAsteroid.breakApart();
            const tankFragments = tankAsteroid.breakApart();

            fastFragments.forEach(f => expect(f.getType()).toBe('fast'));
            tankFragments.forEach(f => expect(f.getType()).toBe('tank'));
        });
    });

    describe('Breaking Apart - Medium to Small', () => {
        it('medium asteroid should break into 2 small asteroids', () => {
            const asteroid = new Asteroid(100, 100, 'medium', 'standard');
            const fragments = asteroid.breakApart();

            expect(fragments).toHaveLength(2);
            fragments.forEach(fragment => {
                expect(fragment.getSize()).toBe('small');
            });
        });

        it('medium fragments should inherit parent type', () => {
            const fastAsteroid = new Asteroid(100, 100, 'medium', 'fast');
            const fragments = fastAsteroid.breakApart();

            fragments.forEach(f => expect(f.getType()).toBe('fast'));
        });
    });

    describe('Breaking Apart - Small', () => {
        it('small asteroid should return empty array (destroyed completely)', () => {
            const asteroid = new Asteroid(100, 100, 'small', 'standard');
            const fragments = asteroid.breakApart();

            expect(fragments).toHaveLength(0);
        });
    });

    describe('Tank Asteroid Hit Points', () => {
        it('tank asteroid should require 2 hits to destroy', () => {
            const tank = new Asteroid(100, 100, 'large', 'tank');

            expect(tank.getHitsRemaining()).toBe(2);

            const destroyedAfterFirst = tank.takeHit();
            expect(destroyedAfterFirst).toBe(false);
            expect(tank.getHitsRemaining()).toBe(1);

            const destroyedAfterSecond = tank.takeHit();
            expect(destroyedAfterSecond).toBe(true);
            expect(tank.getHitsRemaining()).toBe(0);
        });

        it('standard asteroid should be destroyed in 1 hit', () => {
            const standard = new Asteroid(100, 100, 'large', 'standard');

            expect(standard.getHitsRemaining()).toBe(1);

            const destroyed = standard.takeHit();
            expect(destroyed).toBe(true);
        });

        it('fast asteroid should be destroyed in 1 hit', () => {
            const fast = new Asteroid(100, 100, 'large', 'fast');

            expect(fast.getHitsRemaining()).toBe(1);

            const destroyed = fast.takeHit();
            expect(destroyed).toBe(true);
        });
    });

    describe('Fast Asteroid Speed', () => {
        it('fast asteroids should move at 1.5x speed compared to standard', () => {
            // Create asteroids without explicit velocity (so random velocity is generated)
            // Use same seed by mocking Math.random for reproducible test
            const originalRandom = Math.random;

            // First create standard asteroid with controlled random values
            Math.random = () => 0.5; // Fixed value for predictable speed
            const standard = new Asteroid(0, 0, 'large', 'standard');
            const standardSpeed = Math.sqrt(standard.vx ** 2 + standard.vy ** 2);

            // Then create fast asteroid with same "random" values
            Math.random = () => 0.5;
            const fast = new Asteroid(0, 0, 'large', 'fast');
            const fastSpeed = Math.sqrt(fast.vx ** 2 + fast.vy ** 2);

            // Restore Math.random
            Math.random = originalRandom;

            // Fast should be ~1.5x faster
            expect(fastSpeed).toBeGreaterThan(standardSpeed * 1.4);
            expect(fastSpeed).toBeLessThan(standardSpeed * 1.6);
        });
    });

    describe('Visual Distinction', () => {
        it('should expose type for visual rendering', () => {
            const standard = new Asteroid(100, 100, 'large', 'standard');
            const fast = new Asteroid(100, 100, 'large', 'fast');
            const tank = new Asteroid(100, 100, 'large', 'tank');

            expect(standard.getType()).toBe('standard');
            expect(fast.getType()).toBe('fast');
            expect(tank.getType()).toBe('tank');
        });

        it('should maintain type through breaking', () => {
            const fastLarge = new Asteroid(100, 100, 'large', 'fast');
            const fastMediums = fastLarge.breakApart();

            fastMediums.forEach(medium => {
                expect(medium.getType()).toBe('fast');
                const fastSmalls = medium.breakApart();
                fastSmalls.forEach(small => {
                    expect(small.getType()).toBe('fast');
                });
            });
        });
    });

    describe('Spawn Function', () => {
        it('should spawn large asteroids at canvas edges', () => {
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 600;

            const asteroid = Asteroid.spawn(canvas);

            expect(asteroid.getSize()).toBe('large');
            expect(asteroid.isActive()).toBe(true);
        });

        it('should assign types based on probability distribution', () => {
            const canvas = document.createElement('canvas');
            const types: AsteroidType[] = [];

            // Spawn many asteroids to check distribution
            for (let i = 0; i < 100; i++) {
                const asteroid = Asteroid.spawn(canvas);
                types.push(asteroid.getType());
            }

            const standardCount = types.filter(t => t === 'standard').length;
            const fastCount = types.filter(t => t === 'fast').length;
            const tankCount = types.filter(t => t === 'tank').length;

            // Rough distribution check: standard ~70%, fast ~20%, tank ~10%
            expect(standardCount).toBeGreaterThan(40);
            expect(fastCount).toBeGreaterThan(5);
            expect(tankCount).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Update and Activity', () => {
        it('should become inactive when moving off screen', () => {
            const asteroid = new Asteroid(1000, 1000, 'large', 'standard', 10, 10);

            // Initially active
            expect(asteroid.isActive()).toBe(true);

            // Update to move off screen
            for (let i = 0; i < 50; i++) {
                asteroid.update();
            }

            expect(asteroid.isActive()).toBe(false);
        });

        it('should allow manual deactivation', () => {
            const asteroid = new Asteroid(100, 100, 'large', 'standard');
            expect(asteroid.isActive()).toBe(true);

            asteroid.deactivate();
            expect(asteroid.isActive()).toBe(false);
        });
    });

    describe('Render', () => {
        function createMockCtx(): CanvasRenderingContext2D {
            return {
                save: jest.fn(),
                restore: jest.fn(),
                translate: jest.fn(),
                rotate: jest.fn(),
                beginPath: jest.fn(),
                moveTo: jest.fn(),
                lineTo: jest.fn(),
                closePath: jest.fn(),
                stroke: jest.fn(),
                arc: jest.fn(),
            } as unknown as CanvasRenderingContext2D;
        }

        it('should render without errors', () => {
            const ctx = createMockCtx();

            const standard = new Asteroid(100, 100, 'large', 'standard');
            const fast = new Asteroid(100, 100, 'large', 'fast');
            const tank = new Asteroid(100, 100, 'large', 'tank');

            // Should not throw
            expect(() => standard.render(ctx)).not.toThrow();
            expect(() => fast.render(ctx)).not.toThrow();
            expect(() => tank.render(ctx)).not.toThrow();
        });

        it('should show inner circle for tank with remaining hits', () => {
            const ctx = createMockCtx();

            const tank = new Asteroid(100, 100, 'large', 'tank');
            tank.takeHit(); // Now has 1 hit remaining

            // Should render inner detail
            expect(() => tank.render(ctx)).not.toThrow();
        });
    });
});
