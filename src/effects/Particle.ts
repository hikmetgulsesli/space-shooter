export class Particle {
    public x: number;
    public y: number;
    private vx: number;
    private vy: number;
    private life: number = 1;
    private decay: number;
    private color: string;
    private size: number;

    constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.color = color;
        
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.decay = 0.02 + Math.random() * 0.03;
        this.size = 2 + Math.random() * 3;
    }

    public update(): void {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life -= this.decay;
    }

    public isActive(): boolean {
        return this.life > 0;
    }

    public render(ctx: CanvasRenderingContext2D): void {
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
}
