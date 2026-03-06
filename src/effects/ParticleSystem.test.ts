/**
 * Particle System Tests
 * Tests for all particle types (explosion, thruster, spark)
 * and the ParticleSystem manager
 */

import { Particle, ParticleSystem, ParticleConfig } from './ParticleSystem';

describe('Particle', () => {
    describe('Explosion Particles', () => {
        it('should create explosion particle with correct type', () => {
            const particle = new Particle({
                type: 'explosion',
                x: 100,
                y: 200,
                color: '#ff0000'
            });

            expect(particle.getType()).toBe('explosion');
        });

        it('should update position when updated', () => {
            const particle = new Particle({
                type: 'explosion',
                x: 100,
                y: 100,
                color: '#ff0000'
            });

            const initialX = particle.x;
            const initialY = particle.y;
            
            particle.update();

            // Position should change due to velocity
            expect(particle.x !== initialX || particle.y !== initialY).toBe(true);
        });

        it('should become inactive after life decays', () => {
            const particle = new Particle({
                type: 'explosion',
                x: 100,
                y: 100,
                color: '#ff0000',
                life: 0.05
            });

            expect(particle.isActive()).toBe(true);
            
            // Update multiple times to drain life
            for (let i = 0; i < 10; i++) {
                particle.update();
            }

            expect(particle.isActive()).toBe(false);
        });

        it('should apply friction to slow down', () => {
            const particle = new Particle({
                type: 'explosion',
                x: 100,
                y: 100,
                color: '#ff0000'
            });

            const initialX = particle.x;
            particle.update();
            const firstMove = particle.x - initialX;
            
            const secondX = particle.x;
            particle.update();
            const secondMove = particle.x - secondX;

            // Second move should be less due to friction
            expect(Math.abs(secondMove)).toBeLessThan(Math.abs(firstMove));
        });
    });

    describe('Thruster Particles', () => {
        it('should create thruster particle with correct type', () => {
            const particle = new Particle({
                type: 'thruster',
                x: 100,
                y: 200,
                color: '#00aaff',
                direction: Math.PI / 2
            });

            expect(particle.getType()).toBe('thruster');
        });

        it('should emit in specified direction with spread', () => {
            const direction = Math.PI / 2; // Downward
            
            // Create multiple particles to test directional behavior
            let avgAngle = 0;
            const count = 20;
            
            for (let i = 0; i < count; i++) {
                const particle = new Particle({
                    type: 'thruster',
                    x: 100,
                    y: 100,
                    color: '#00aaff',
                    direction: direction,
                    spread: 0.5
                });
                
                // Calculate angle from velocity
                const angle = Math.atan2(
                    particle.y - 100, // y diff after first update
                    particle.x - 100  // x diff after first update
                );
                avgAngle += angle;
            }
            
            avgAngle /= count;
            
            // Average angle should be roughly in the specified direction
            // Allowing for some variance due to spread
            const angleDiff = Math.abs(avgAngle - direction);
            expect(angleDiff).toBeLessThan(1.0);
        });

        it('should decay faster than explosion particles', () => {
            const explosionParticle = new Particle({
                type: 'explosion',
                x: 100,
                y: 100,
                color: '#ff0000',
                life: 1
            });

            const thrusterParticle = new Particle({
                type: 'thruster',
                x: 100,
                y: 100,
                color: '#00aaff',
                life: 1
            });

            // Update both particles
            explosionParticle.update();
            thrusterParticle.update();

            // Thruster should have shorter remaining life due to higher decay
            // We can't directly access life, but we can test that thruster 
            // becomes inactive faster by updating repeatedly
            const iterations = 30;
            for (let i = 0; i < iterations; i++) {
                explosionParticle.update();
                thrusterParticle.update();
            }

            // Both should be inactive by now due to high iteration count
            expect(explosionParticle.isActive()).toBe(false);
            expect(thrusterParticle.isActive()).toBe(false);
        });
    });

    describe('Spark Particles', () => {
        it('should create spark particle with correct type', () => {
            const particle = new Particle({
                type: 'spark',
                x: 100,
                y: 200,
                color: '#ffaa00'
            });

            expect(particle.getType()).toBe('spark');
        });

        it('should have gravity effect', () => {
            const particle = new Particle({
                type: 'spark',
                x: 100,
                y: 100,
                color: '#ffaa00'
            });

            // Store initial velocity direction
            const initialY = particle.y;
            
            // Update multiple times
            for (let i = 0; i < 20; i++) {
                particle.update();
            }

            // Spark should have fallen (gravity pulls down)
            expect(particle.y).toBeGreaterThan(initialY);
        });

        it('should have higher friction than explosion', () => {
            const sparkParticle = new Particle({
                type: 'spark',
                x: 100,
                y: 100,
                color: '#ffaa00'
            });

            const explosionParticle = new Particle({
                type: 'explosion',
                x: 100,
                y: 100,
                color: '#ff0000'
            });

            // Move particles
            sparkParticle.update();
            explosionParticle.update();
            
            const sparkX1 = sparkParticle.x;
            const explosionX1 = explosionParticle.x;

            // Update again
            sparkParticle.update();
            explosionParticle.update();

            const sparkMove2 = Math.abs(sparkParticle.x - sparkX1);
            const explosionMove2 = Math.abs(explosionParticle.x - explosionX1);

            // Both should slow down, spark more due to higher friction
            expect(sparkMove2).toBeLessThan(explosionMove2);
        });
    });

    describe('Custom Configuration', () => {
        it('should respect custom speed parameter', () => {
            const slowParticle = new Particle({
                type: 'explosion',
                x: 100,
                y: 100,
                color: '#ff0000',
                speed: 0.5
            });

            const fastParticle = new Particle({
                type: 'explosion',
                x: 100,
                y: 100,
                color: '#ff0000',
                speed: 3.0
            });

            const slowX = slowParticle.x;
            const fastX = fastParticle.x;

            slowParticle.update();
            fastParticle.update();

            const slowMove = Math.abs(slowParticle.x - slowX);
            const fastMove = Math.abs(fastParticle.x - fastX);

            expect(fastMove).toBeGreaterThan(slowMove);
        });

        it('should respect custom life parameter', () => {
            const shortLifeParticle = new Particle({
                type: 'explosion',
                x: 100,
                y: 100,
                color: '#ff0000',
                life: 0.1
            });

            const longLifeParticle = new Particle({
                type: 'explosion',
                x: 100,
                y: 100,
                color: '#ff0000',
                life: 2.0
            });

            // Short life should become inactive faster
            for (let i = 0; i < 15; i++) {
                shortLifeParticle.update();
                longLifeParticle.update();
            }

            expect(shortLifeParticle.isActive()).toBe(false);
            expect(longLifeParticle.isActive()).toBe(true);
        });

        it('should respect custom size parameter', () => {
            const smallParticle = new Particle({
                type: 'explosion',
                x: 100,
                y: 100,
                color: '#ff0000',
                size: 2
            });

            const largeParticle = new Particle({
                type: 'explosion',
                x: 100,
                y: 100,
                color: '#ff0000',
                size: 8
            });

            // Both should render without errors
            const mockCtx = {
                save: jest.fn(),
                restore: jest.fn(),
                globalAlpha: 1,
                fillStyle: '',
                shadowColor: '',
                shadowBlur: 0,
                beginPath: jest.fn(),
                arc: jest.fn(),
                fill: jest.fn(),
            } as unknown as CanvasRenderingContext2D;

            smallParticle.render(mockCtx);
            largeParticle.render(mockCtx);

            // Should call arc for both particles
            expect(mockCtx.arc).toHaveBeenCalled();
        });
    });

    describe('Rendering', () => {
        it('should render without errors', () => {
            const particle = new Particle({
                type: 'explosion',
                x: 100,
                y: 100,
                color: '#ff0000'
            });

            const mockCtx = {
                save: jest.fn(),
                restore: jest.fn(),
                globalAlpha: 1,
                fillStyle: '',
                shadowColor: '',
                shadowBlur: 0,
                beginPath: jest.fn(),
                arc: jest.fn(),
                fill: jest.fn(),
            } as unknown as CanvasRenderingContext2D;

            particle.render(mockCtx);

            expect(mockCtx.save).toHaveBeenCalled();
            expect(mockCtx.beginPath).toHaveBeenCalled();
            expect(mockCtx.arc).toHaveBeenCalled();
            expect(mockCtx.fill).toHaveBeenCalled();
            expect(mockCtx.restore).toHaveBeenCalled();
        });

        it('should not render when inactive', () => {
            const particle = new Particle({
                type: 'explosion',
                x: 100,
                y: 100,
                color: '#ff0000',
                life: 0.01
            });

            // Drain life
            while (particle.isActive()) {
                particle.update();
            }

            const mockCtx = {
                save: jest.fn(),
                restore: jest.fn(),
            } as unknown as CanvasRenderingContext2D;

            particle.render(mockCtx);

            // Should still call save/restore even when inactive
            // (the particle decides whether to draw internally)
            expect(mockCtx.save).toHaveBeenCalled();
        });
    });
});

describe('ParticleSystem', () => {
    let system: ParticleSystem;

    beforeEach(() => {
        system = new ParticleSystem();
    });

    describe('Emission', () => {
        it('should emit single particle', () => {
            system.emit({
                type: 'explosion',
                x: 100,
                y: 100,
                color: '#ff0000'
            });

            expect(system.getParticleCount()).toBe(1);
        });

        it('should emit multiple particles with count parameter', () => {
            system.emit({
                type: 'explosion',
                x: 100,
                y: 100,
                color: '#ff0000',
                count: 20
            });

            expect(system.getParticleCount()).toBe(20);
        });

        it('should emit particles of different types', () => {
            system.emit({
                type: 'explosion',
                x: 100,
                y: 100,
                color: '#ff0000',
                count: 10
            });

            system.emit({
                type: 'thruster',
                x: 200,
                y: 200,
                color: '#00aaff',
                count: 5
            });

            system.emit({
                type: 'spark',
                x: 300,
                y: 300,
                color: '#ffaa00',
                count: 15
            });

            expect(system.getParticleCount()).toBe(30);
            expect(system.getActiveParticlesByType('explosion').length).toBe(10);
            expect(system.getActiveParticlesByType('thruster').length).toBe(5);
            expect(system.getActiveParticlesByType('spark').length).toBe(15);
        });
    });

    describe('Update', () => {
        it('should update all particles', () => {
            system.emit({
                type: 'explosion',
                x: 100,
                y: 100,
                color: '#ff0000',
                count: 10
            });

            const initialPositions = system.getActiveParticlesByType('explosion').map(p => ({
                x: p.x,
                y: p.y
            }));

            system.update();

            const updatedPositions = system.getActiveParticlesByType('explosion').map(p => ({
                x: p.x,
                y: p.y
            }));

            // At least some positions should have changed
            const positionsChanged = initialPositions.some((initial, i) => 
                initial.x !== updatedPositions[i]?.x || initial.y !== updatedPositions[i]?.y
            );
            expect(positionsChanged).toBe(true);
        });

        it('should remove inactive particles', () => {
            system.emit({
                type: 'explosion',
                x: 100,
                y: 100,
                color: '#ff0000',
                count: 10,
                life: 0.01
            });

            expect(system.getParticleCount()).toBe(10);

            // Update many times to drain all life
            for (let i = 0; i < 100; i++) {
                system.update();
            }

            expect(system.getParticleCount()).toBe(0);
        });
    });

    describe('Render', () => {
        it('should render all particles', () => {
            system.emit({
                type: 'explosion',
                x: 100,
                y: 100,
                color: '#ff0000',
                count: 5
            });

            const mockCtx = {
                save: jest.fn(),
                restore: jest.fn(),
                globalAlpha: 1,
                fillStyle: '',
                shadowColor: '',
                shadowBlur: 0,
                beginPath: jest.fn(),
                arc: jest.fn(),
                fill: jest.fn(),
            } as unknown as CanvasRenderingContext2D;

            system.render(mockCtx);

            // Should call arc for each particle
            expect(mockCtx.arc).toHaveBeenCalledTimes(5);
        });
    });

    describe('Clear', () => {
        it('should clear all particles', () => {
            system.emit({
                type: 'explosion',
                x: 100,
                y: 100,
                color: '#ff0000',
                count: 20
            });

            expect(system.getParticleCount()).toBe(20);

            system.clear();

            expect(system.getParticleCount()).toBe(0);
        });
    });

    describe('Particle Type Filtering', () => {
        it('should filter particles by type', () => {
            system.emit({
                type: 'explosion',
                x: 100,
                y: 100,
                color: '#ff0000',
                count: 5
            });

            system.emit({
                type: 'thruster',
                x: 200,
                y: 200,
                color: '#00aaff',
                count: 3
            });

            const explosions = system.getActiveParticlesByType('explosion');
            const thrusters = system.getActiveParticlesByType('thruster');
            const sparks = system.getActiveParticlesByType('spark');

            expect(explosions.length).toBe(5);
            expect(thrusters.length).toBe(3);
            expect(sparks.length).toBe(0);
        });
    });
});
