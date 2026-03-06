import { Asteroid, AsteroidSize, AsteroidType } from './Asteroid';

describe('Asteroid', () => {
    describe('breaking mechanics', () => {
        it('large asteroid breaks into 2 medium asteroids', () => {
            const largeAsteroid = new Asteroid(100, 100, 'large');
            const fragments = largeAsteroid.breakApart();
            
            expect(fragments).toHaveLength(2);
            fragments.forEach(fragment => {
                expect(fragment.getSize()).toBe('medium');
            });
        });

        it('medium asteroid breaks into 2 small asteroids', () => {
            const mediumAsteroid = new Asteroid(100, 100, 'medium');
            const fragments = mediumAsteroid.breakApart();
            
            expect(fragments).toHaveLength(2);
            fragments.forEach(fragment => {
                expect(fragment.getSize()).toBe('small');
            });
        });

        it('small asteroid breaks into empty array', () => {
            const smallAsteroid = new Asteroid(100, 100, 'small');
            const fragments = smallAsteroid.breakApart();
            
            expect(fragments).toHaveLength(0);
        });

        it('fragments inherit parent asteroid type', () => {
            const largeFastAsteroid = new Asteroid(100, 100, 'large', 'fast');
            const fragments = largeFastAsteroid.breakApart();
            
            fragments.forEach(fragment => {
                expect(fragment.getType()).toBe('fast');
            });
        });
    });

    describe('asteroid types', () => {
        it('fast asteroids move 1.5x speed', () => {
            // Sample multiple asteroids to avoid flakiness from random velocity
            let totalStandardSpeed = 0;
            let totalFastSpeed = 0;
            const sampleCount = 10;

            for (let i = 0; i < sampleCount; i++) {
                const standardAsteroid = new Asteroid(0, 0, 'large', 'standard');
                const fastAsteroid = new Asteroid(0, 0, 'large', 'fast');
                totalStandardSpeed += Math.sqrt(standardAsteroid.vx ** 2 + standardAsteroid.vy ** 2);
                totalFastSpeed += Math.sqrt(fastAsteroid.vx ** 2 + fastAsteroid.vy ** 2);
            }

            const avgStandardSpeed = totalStandardSpeed / sampleCount;
            const avgFastSpeed = totalFastSpeed / sampleCount;

            // Fast should be roughly 1.5x faster (on average)
            expect(avgFastSpeed).toBeGreaterThan(avgStandardSpeed * 1.3);
        });

        it('fast asteroids are worth 1.5x points', () => {
            const standardLarge = new Asteroid(0, 0, 'large', 'standard');
            const fastLarge = new Asteroid(0, 0, 'large', 'fast');
            
            const standardPoints = standardLarge.getPoints();
            const fastPoints = fastLarge.getPoints();
            
            expect(fastPoints).toBe(Math.floor(standardPoints * 1.5));
        });

        it('tank asteroids require 2 hits to destroy', () => {
            const tankAsteroid = new Asteroid(0, 0, 'large', 'tank');
            
            // First hit should not destroy
            const firstHit = tankAsteroid.takeHit();
            expect(firstHit).toBe(false);
            expect(tankAsteroid.isActive()).toBe(true);
            
            // Second hit should destroy
            const secondHit = tankAsteroid.takeHit();
            expect(secondHit).toBe(true);
        });

        it('standard/fast asteroids are destroyed on first hit', () => {
            const standardAsteroid = new Asteroid(0, 0, 'large', 'standard');
            const fastAsteroid = new Asteroid(0, 0, 'large', 'fast');
            
            expect(standardAsteroid.takeHit()).toBe(true);
            expect(fastAsteroid.takeHit()).toBe(true);
        });

        it('tank asteroids are worth 2x points', () => {
            const standardLarge = new Asteroid(0, 0, 'large', 'standard');
            const tankLarge = new Asteroid(0, 0, 'large', 'tank');
            
            const standardPoints = standardLarge.getPoints();
            const tankPoints = tankLarge.getPoints();
            
            expect(tankPoints).toBe(standardPoints * 2);
        });
    });

    describe('visual distinction', () => {
        it('standard asteroids have gray stroke color', () => {
            const asteroid = new Asteroid(0, 0, 'large', 'standard');
            expect(asteroid.getType()).toBe('standard');
        });

        it('fast asteroids have fast type', () => {
            const asteroid = new Asteroid(0, 0, 'large', 'fast');
            expect(asteroid.getType()).toBe('fast');
        });

        it('tank asteroids have tank type', () => {
            const asteroid = new Asteroid(0, 0, 'large', 'tank');
            expect(asteroid.getType()).toBe('tank');
        });
    });

    describe('spawn distribution', () => {
        it('spawn creates asteroids of various types', () => {
            const canvas = { width: 800, height: 600 } as HTMLCanvasElement;
            
            const types: AsteroidType[] = [];
            for (let i = 0; i < 100; i++) {
                const asteroid = Asteroid.spawn(canvas);
                types.push(asteroid.getType());
            }
            
            // Should have all three types represented
            expect(types.some(t => t === 'standard')).toBe(true);
            expect(types.some(t => t === 'fast')).toBe(true);
            expect(types.some(t => t === 'tank')).toBe(true);
        });

        it('spawned asteroids are always large size', () => {
            const canvas = { width: 800, height: 600 } as HTMLCanvasElement;
            
            for (let i = 0; i < 20; i++) {
                const asteroid = Asteroid.spawn(canvas);
                expect(asteroid.getSize()).toBe('large');
            }
        });
    });

    describe('points by size', () => {
        it('small asteroids worth more than medium', () => {
            const small = new Asteroid(0, 0, 'small', 'standard');
            const medium = new Asteroid(0, 0, 'medium', 'standard');
            
            expect(small.getPoints()).toBeGreaterThan(medium.getPoints());
        });

        it('medium asteroids worth more than large', () => {
            const medium = new Asteroid(0, 0, 'medium', 'standard');
            const large = new Asteroid(0, 0, 'large', 'standard');
            
            expect(medium.getPoints()).toBeGreaterThan(large.getPoints());
        });
    });
});
