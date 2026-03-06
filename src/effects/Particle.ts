import { ObjectPool } from '../utils/ObjectPool';

/**
 * Pooled Particle class for reduced GC pressure
 */
export class Particle {
    public x: number = 0;
    public y: number = 0;
    private vx: number = 0;
    private vy: number = 0;
    private life: number = 1;
    private decay: number = 0.02;
    private color: string = '#fff';
    private size: number = 2;
    private active: boolean = false;

    /**
     * Reset the particle for reuse from pool
     */
    public reset(x: number, y: number, color: string): void {
        this.x = x;
        this.y = y;
        this.color = color;
        
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.decay = 0.02 + Math.random() * 0.03;
        this.size = 2 + Math.random() * 3;
        this.life = 1;
        this.active = true;
    }

    public update(): void {
        if (!this.active) return;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life -= this.decay;
        if (this.life <= 0) {
            this.active = false;
        }
    }

    public isActive(): boolean {
        return this.active && this.life > 0;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        if (!this.active) return;
        
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    /**
     * Mark particle as inactive (returns to pool)
     */
    public deactivate(): void {
        this.active = false;
    }
}

/**
 * Global particle pool instance
 */
export const particlePool = new ObjectPool<Particle>(
    () => new Particle(),
    (particle) => { particle.deactivate(); },
    500 // Max pool size for particles (more particles than bullets)
);