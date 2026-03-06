export class Bullet {
    public x: number;
    public y: number;
    private vx: number;
    private vy: number;
    private radius: number = 3;
    private active: boolean = true;

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
               this.x > 0 && this.x < canvas.width &&
               this.y > 0 && this.y < canvas.height;
    }

    public render(ctx: CanvasRenderingContext2D): void {
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

    public deactivate(): void {
        this.active = false;
    }
}
