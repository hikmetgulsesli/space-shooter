export type ParticleType = 'explosion' | 'thruster' | 'spark';

export interface ParticleConfig {
    type: ParticleType;
    x: number;
    y: number;
    color: string;
    count?: number;
    speed?: number;
    life?: number;
    size?: number;
    spread?: number;
    direction?: number;
}

export class Particle {
    public x: number;
    public y: number;
    private vx: number;
    private vy: number;
    private life: number;
    private maxLife: number;
    private decay: number;
    private color: string;
    private size: number;
    private type: ParticleType;
    private gravity: number = 0;

    constructor(config: ParticleConfig) {
        this.x = config.x;
        this.y = config.y;
        this.color = config.color;
        this.type = config.type;
        this.maxLife = config.life ?? 1;
        this.life = this.maxLife;

        const angle = this.calculateInitialAngle(config);
        const speed = this.calculateInitialSpeed(config);
        
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.decay = this.calculateDecay();
        this.size = this.calculateSize(config);
        this.gravity = this.calculateGravity();
    }

    private calculateInitialAngle(config: ParticleConfig): number {
        const spread = config.spread ?? Math.PI * 2;
        const direction = config.direction ?? 0;
        
        switch (config.type) {
            case 'explosion':
                return Math.random() * Math.PI * 2;
            case 'thruster':
                return direction + (Math.random() - 0.5) * spread;
            case 'spark':
                return direction + (Math.random() - 0.5) * spread;
            default:
                return Math.random() * Math.PI * 2;
        }
    }

    private calculateInitialSpeed(config: ParticleConfig): number {
        const baseSpeed = config.speed ?? 2;
        
        switch (config.type) {
            case 'explosion':
                return (1 + Math.random() * 4) * baseSpeed;
            case 'thruster':
                return (2 + Math.random() * 3) * baseSpeed;
            case 'spark':
                return (3 + Math.random() * 5) * baseSpeed;
            default:
                return baseSpeed;
        }
    }

    private calculateDecay(): number {
        switch (this.type) {
            case 'explosion':
                return 0.015 + Math.random() * 0.02;
            case 'thruster':
                return 0.03 + Math.random() * 0.04;
            case 'spark':
                return 0.02 + Math.random() * 0.03;
            default:
                return 0.02;
        }
    }

    private calculateSize(config: ParticleConfig): number {
        const baseSize = config.size ?? 3;
        
        switch (this.type) {
            case 'explosion':
                return baseSize * (0.8 + Math.random() * 1.5);
            case 'thruster':
                return baseSize * (0.5 + Math.random() * 0.8);
            case 'spark':
                return baseSize * (0.3 + Math.random() * 0.7);
            default:
                return baseSize;
        }
    }

    private calculateGravity(): number {
        switch (this.type) {
            case 'spark':
                return 0.05;
            default:
                return 0;
        }
    }

    public update(): void {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        
        const friction = this.type === 'spark' ? 0.96 : 0.98;
        this.vx *= friction;
        this.vy *= friction;
        
        this.life -= this.decay;
    }

    public isActive(): boolean {
        return this.life > 0;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        const alpha = this.life / this.maxLife;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        
        switch (this.type) {
            case 'explosion':
                ctx.shadowBlur = 8 * alpha;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * (0.5 + alpha * 0.5), 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'thruster':
                ctx.shadowBlur = 5;
                const stretch = 1 + (1 - alpha) * 2;
                ctx.beginPath();
                ctx.ellipse(
                    this.x, this.y,
                    this.size * stretch, this.size,
                    Math.atan2(this.vy, this.vx),
                    0, Math.PI * 2
                );
                ctx.fill();
                break;
            case 'spark':
                ctx.shadowBlur = 3;
                const length = this.size * (1 + Math.abs(this.vx + this.vy) * 0.1);
                const angle = Math.atan2(this.vy, this.vx);
                ctx.translate(this.x, this.y);
                ctx.rotate(angle);
                ctx.fillRect(-length / 2, -this.size / 2, length, this.size);
                break;
        }
        
        ctx.restore();
    }

    public getType(): ParticleType {
        return this.type;
    }
}

export class ParticleSystem {
    private particles: Particle[] = [];

    public emit(config: ParticleConfig): void {
        const count = config.count ?? 1;
        
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(config));
        }
    }

    public update(): void {
        this.particles = this.particles.filter(particle => {
            particle.update();
            return particle.isActive();
        });
    }

    public render(ctx: CanvasRenderingContext2D): void {
        this.particles.forEach(particle => particle.render(ctx));
    }

    public clear(): void {
        this.particles = [];
    }

    public getParticleCount(): number {
        return this.particles.length;
    }

    public getActiveParticlesByType(type: ParticleType): Particle[] {
        return this.particles.filter(p => p.getType() === type);
    }
}
