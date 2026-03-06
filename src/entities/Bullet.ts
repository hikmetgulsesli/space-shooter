import { ObjectPool } from '../utils/ObjectPool';

/**
 * Pooled Bullet class for reduced GC pressure
 */
export class Bullet {
    public x: number = 0;
    public y: number = 0;
    private vx: number = 0;
    private vy: number = 0;
    private radius: number = 3;
    private active: boolean = false;

    constructor(x?: number, y?: number, vx?: number, vy?: number) {
        if (x !== undefined && y !== undefined && vx !== undefined && vy !== undefined) {
            this.reset(x, y, vx, vy);
        }
    }

    /**
     * Reset the bullet for reuse from pool
     */
    public reset(x: number, y: number, vx: number, vy: number): void {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.active = true;
    }

    /**
     * Mark bullet as inactive (returns to pool)
     */
    public deactivate(): void {
        this.active = false;
    }

    public update(): void {
        if (!this.active) return;
        this.x += this.vx;
        this.y += this.vy;
    }

    public isActive(canvas: HTMLCanvasElement): boolean {
        return this.active && 
               this.x > 0 && this.x < canvas.width &&
               this.y > 0 && this.y < canvas.height;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        if (!this.active) return;
        
        ctx.fillStyle = '#ff0';
        ctx.shadowColor = '#ff0';
        ctx.shadowBlur = 5;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }

    public getRadius(): number {
        return this.radius;
    }
}

/**
 * Global bullet pool instance
 */
export const bulletPool = new ObjectPool<Bullet>(
    () => new Bullet(),
    (bullet) => { bullet.deactivate(); },
    200 // Max pool size
);