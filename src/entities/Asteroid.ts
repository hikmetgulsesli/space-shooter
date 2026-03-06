export type AsteroidSize = 'large' | 'medium' | 'small';
export type AsteroidType = 'standard' | 'fast' | 'tank';

export class Asteroid {
    public x: number;
    public y: number;
    public vx: number;
    public vy: number;
    private radius: number;
    private vertices: { x: number; y: number }[] = [];
    private rotation: number = 0;
    private rotationSpeed: number;
    private active: boolean = true;
    private size: AsteroidSize;
    private type: AsteroidType;
    private hitsRemaining: number;
    private maxHits: number;

    constructor(
        x: number,
        y: number,
        size: AsteroidSize = 'large',
        type: AsteroidType = 'standard',
        vx?: number,
        vy?: number
    ) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.type = type;

        const baseSpeedMultiplier = size === 'large' ? 1 : size === 'medium' ? 1.5 : 2;
        const typeSpeedMultiplier = type === 'fast' ? 1.5 : 1;
        const speedMultiplier = baseSpeedMultiplier * typeSpeedMultiplier;

        if (vx !== undefined && vy !== undefined) {
            this.vx = vx;
            this.vy = vy;
        } else {
            const angle = Math.random() * Math.PI * 2;
            const speed = (0.5 + Math.random() * 1.5) * speedMultiplier;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
        }

        this.radius = size === 'large' ? 40 : size === 'medium' ? 25 : 15;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;

        // Tank asteroids take 2 hits to destroy
        this.maxHits = type === 'tank' ? 2 : 1;
        this.hitsRemaining = this.maxHits;

        this.generateVertices();
    }

    private generateVertices(): void {
        const numVertices = 8 + Math.floor(Math.random() * 6);
        this.vertices = [];
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

        // Randomly choose asteroid type: 70% standard, 20% fast, 10% tank
        const rand = Math.random();
        let type: AsteroidType;
        if (rand < 0.7) {
            type = 'standard';
        } else if (rand < 0.9) {
            type = 'fast';
        } else {
            type = 'tank';
        }

        return new Asteroid(x, y, 'large', type);
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

    public deactivate(): void {
        this.active = false;
    }

    public getSize(): AsteroidSize {
        return this.size;
    }

    public getType(): AsteroidType {
        return this.type;
    }

    public getHitsRemaining(): number {
        return this.hitsRemaining;
    }

    public takeHit(): boolean {
        this.hitsRemaining--;
        return this.hitsRemaining <= 0;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Set color based on type
        let strokeColor: string;
        let shadowColor: string;
        switch (this.type) {
            case 'fast':
                strokeColor = '#ff6666'; // Red tint for fast
                shadowColor = '#ff3333';
                break;
            case 'tank':
                strokeColor = '#6699ff'; // Blue tint for tank
                shadowColor = '#3366cc';
                break;
            case 'standard':
            default:
                strokeColor = '#888888'; // Gray for standard
                shadowColor = '#666666';
                break;
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = this.type === 'tank' ? 3 : 2;
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = this.type === 'fast' ? 8 : 5;

        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (let i = 1; i < this.vertices.length; i++) {
            ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        ctx.closePath();
        ctx.stroke();

        // Draw inner detail for tank asteroids to show hit points
        if (this.type === 'tank' && this.hitsRemaining > 1) {
            ctx.strokeStyle = '#99ccff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    public getRadius(): number {
        return this.radius;
    }

    public getPoints(): number {
        const basePoints = this.size === 'large' ? 20 : this.size === 'medium' ? 50 : 100;
        const typeMultiplier = this.type === 'fast' ? 1.5 : this.type === 'tank' ? 2 : 1;
        return Math.floor(basePoints * typeMultiplier);
    }

    public breakApart(): Asteroid[] {
        if (this.size === 'small') return [];

        const newSize: AsteroidSize = this.size === 'large' ? 'medium' : 'small';
        const asteroids: Asteroid[] = [];

        for (let i = 0; i < 2; i++) {
            const angle = (i / 2) * Math.PI * 2 + Math.random() * 0.5;
            const speed = 1.5 + Math.random();
            const newVx = Math.cos(angle) * speed;
            const newVy = Math.sin(angle) * speed;

            const asteroid = new Asteroid(this.x, this.y, newSize, this.type, newVx, newVy);
            asteroids.push(asteroid);
        }

        return asteroids;
    }
}
