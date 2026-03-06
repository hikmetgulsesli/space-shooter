export class Asteroid {
    public x: number;
    public y: number;
    private vx: number;
    private vy: number;
    private radius: number;
    private vertices: { x: number; y: number }[] = [];
    private rotation: number = 0;
    private rotationSpeed: number;
    private active: boolean = true;
    private size: 'large' | 'medium' | 'small';

    constructor(x: number, y: number, size: 'large' | 'medium' | 'small' = 'large') {
        this.x = x;
        this.y = y;
        this.size = size;
        
        const speedMultiplier = size === 'large' ? 1 : size === 'medium' ? 1.5 : 2;
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.5 + Math.random() * 1.5) * speedMultiplier;
        
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.radius = size === 'large' ? 40 : size === 'medium' ? 25 : 15;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        
        this.generateVertices();
    }

    private generateVertices(): void {
        const numVertices = 8 + Math.floor(Math.random() * 6);
        for (let i = 0; i < numVertices; i++) {
            const angle = (i / numVertices) * Math.PI * 2;
            const variation = 0.8 + Math.random() * 0.4;
            this.vertices.push({
                x: Math.cos(angle) * this.radius * variation,
                y: Math.sin(angle) * this.radius * variation
            });
        }
    }

    public static spawn(canvas: HTMLCanvasElement): Asteroid {
        const side = Math.floor(Math.random() * 4);
        let x: number, y: number;
        
        switch (side) {
            case 0: x = Math.random() * canvas.width; y = -50; break;
            case 1: x = canvas.width + 50; y = Math.random() * canvas.height; break;
            case 2: x = Math.random() * canvas.width; y = canvas.height + 50; break;
            default: x = -50; y = Math.random() * canvas.height; break;
        }
        
        return new Asteroid(x, y, 'large');
    }

    public update(): void {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        
        if (this.x < -100 || this.x > 900 || this.y < -100 || this.y > 700) {
            this.active = false;
        }
    }

    public isActive(): boolean {
        return this.active;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#666';
        ctx.shadowBlur = 5;
        
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (let i = 1; i < this.vertices.length; i++) {
            ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        
        ctx.restore();
    }

    public getRadius(): number {
        return this.radius;
    }

    public getPoints(): number {
        return this.size === 'large' ? 20 : this.size === 'medium' ? 50 : 100;
    }

    public breakApart(): Asteroid[] {
        if (this.size === 'small') return [];
        
        const newSize = this.size === 'large' ? 'medium' : 'small';
        const asteroids: Asteroid[] = [];
        
        for (let i = 0; i < 2; i++) {
            const asteroid = new Asteroid(this.x, this.y, newSize);
            asteroid.vx = this.vx + (Math.random() - 0.5) * 3;
            asteroid.vy = this.vy + (Math.random() - 0.5) * 3;
            asteroids.push(asteroid);
        }
        
        return asteroids;
    }
}
