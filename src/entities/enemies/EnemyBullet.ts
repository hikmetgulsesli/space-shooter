import { Enemy } from './Enemy';

export class EnemyBullet {
    public x: number;
    public y: number;
    private vx: number;
    private vy: number;
    private radius: number = 4;
    private active: boolean = true;
    private color: string = '#ff4444';

    constructor(x: number, y: number, vx: number, vy: number) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
    }

    public update(): void {
        this.x += this.vx;
        this.y += this.vy;
    }

    public isActive(canvas: HTMLCanvasElement): boolean {
        return this.active && 
               this.x > -10 && this.x < canvas.width + 10 &&
               this.y > -10 && this.y < canvas.height + 10;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        ctx.shadowBlur = 0;
    }

    public getRadius(): number {
        return this.radius;
    }

    public deactivate(): void {
        this.active = false;
    }

    public checkCollision(targetX: number, targetY: number, targetRadius: number): boolean {
        const dx = this.x - targetX;
        const dy = this.y - targetY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + targetRadius;
    }
}
