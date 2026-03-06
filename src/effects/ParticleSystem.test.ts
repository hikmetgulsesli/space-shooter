import { Particle, ParticleSystem } from './ParticleSystem';

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

        it('should emit in specified direction', () => {
            const direction = Math.PI / 2;
            let avgVy = 0;
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
                const prevY = particle.y;
                particle.update();
                avgVy += particle.y - prevY;
            }
            expect(avgVy / count).toBeGreaterThan(0);
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
                color: '#ffaa00',
                direction: Math.PI / 2,
                spread: 0.1
            });
            const initialY = particle.y;
            for (let i = 0; i < 30; i++) {
                particle.update();
            }
            expect(particle.y).toBeGreaterThan(initialY);
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
                ellipse: jest.fn(),
                translate: jest.fn(),
                rotate: jest.fn(),
                fillRect: jest.fn(),
            } as unknown as CanvasRenderingContext2D;
            particle.render(mockCtx);
            expect(mockCtx.save).toHaveBeenCalled();
            expect(mockCtx.restore).toHaveBeenCalled();
        });
    });
});

describe('ParticleSystem', () => {
    let system: ParticleSystem;

    beforeEach(() => {
        system = new ParticleSystem();
    });

    it('should emit single particle', () => {
        system.emit({ type: 'explosion', x: 100, y: 100, color: '#ff0000' });
        expect(system.getParticleCount()).toBe(1);
    });

    it('should emit multiple particles with count parameter', () => {
        system.emit({ type: 'explosion', x: 100, y: 100, color: '#ff0000', count: 20 });
        expect(system.getParticleCount()).toBe(20);
    });

    it('should emit particles of different types', () => {
        system.emit({ type: 'explosion', x: 100, y: 100, color: '#ff0000', count: 10 });
        system.emit({ type: 'thruster', x: 200, y: 200, color: '#00aaff', count: 5 });
        system.emit({ type: 'spark', x: 300, y: 300, color: '#ffaa00', count: 15 });
        expect(system.getParticleCount()).toBe(30);
        expect(system.getActiveParticlesByType('explosion').length).toBe(10);
        expect(system.getActiveParticlesByType('thruster').length).toBe(5);
        expect(system.getActiveParticlesByType('spark').length).toBe(15);
    });

    it('should update all particles', () => {
        system.emit({ type: 'explosion', x: 100, y: 100, color: '#ff0000', count: 10 });
        const initialCount = system.getParticleCount();
        system.update();
        expect(system.getParticleCount()).toBeLessThanOrEqual(initialCount);
    });

    it('should remove inactive particles', () => {
        system.emit({ type: 'explosion', x: 100, y: 100, color: '#ff0000', count: 10, life: 0.01 });
        expect(system.getParticleCount()).toBe(10);
        for (let i = 0; i < 100; i++) {
            system.update();
        }
        expect(system.getParticleCount()).toBe(0);
    });

    it('should clear all particles', () => {
        system.emit({ type: 'explosion', x: 100, y: 100, color: '#ff0000', count: 20 });
        expect(system.getParticleCount()).toBe(20);
        system.clear();
        expect(system.getParticleCount()).toBe(0);
    });
});
