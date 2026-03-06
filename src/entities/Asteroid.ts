export type AsteroidSize = 'large' | 'medium' | 'small';
export type AsteroidType = 'standard' | 'fast' | 'tank';

interface AsteroidConfig {
    radius: number;
    basePoints: number;
    speedMultiplier: number;
    strokeColor: string;
    maxHits: number;
    pointMultiplier: number;
}

const ASTEROID_CONFIGS: Record<AsteroidSize, AsteroidConfig> = {
    large: { radius: 40, basePoints: 20, speedMultiplier: 1, strokeColor: '#888', maxHits: 1, pointMultiplier: 1 },
    medium: { radius: 25, basePoints: 50, speedMultiplier: 1.5, strokeColor: '#888', maxHits: 1, pointMultiplier: 1 },
    small: { radius: 15, basePoints: 100, speedMultiplier: 2, strokeColor: '#888', maxHits: 1, pointMultiplier: 1 }
};

const TYPE_MODIFIERS: Record<AsteroidType, { speedMultiplier: number; pointMultiplier: number; strokeColor: string; maxHits: number }> = {
    standard: { speedMultiplier: 1, pointMultiplier: 1, strokeColor: '#888888', maxHits: 1 },
    fast: { speedMultiplier: 1.5, pointMultiplier: 1.5, strokeColor: '#ff6666', maxHits: 1 },
    tank: { speedMultiplier: 0.8, pointMultiplier: 2, strokeColor: '#6699ff', maxHits: 2 }
};

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
        type: AsteroidType = 'standard'
    ) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.type = type;
        
        const sizeConfig = ASTEROID_CONFIGS[size];
        const typeMod = TYPE_MODIFIERS[type];
        
        this.maxHits = typeMod.maxHits;
        this.hitsRemaining = this.maxHits;
        
        const angle = Math.random() * Math.PI * 2;
        const baseSpeed = 0.5 + Math.random() * 1.5;
        const speed = baseSpeed * sizeConfig.speedMultiplier * typeMod.speedMultiplier;
        
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.radius = sizeConfig.radius;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        
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
        
        // Random type distribution: 70% standard, 20% fast, 10% tank
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

    public getType(): AsteroidType {
        return this.type;
    }

    public getSize(): AsteroidSize {
        return this.size;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        const typeMod = TYPE_MODIFIERS[this.type];
        ctx.strokeStyle = typeMod.strokeColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = typeMod.strokeColor;
        ctx.shadowBlur = 5;
        
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (let i = 1; i < this.vertices.length; i++) {
            ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        
        // For tank asteroids with remaining hits, show inner ring
        if (this.type === 'tank' && this.hitsRemaining > 1) {
            ctx.strokeStyle = typeMod.strokeColor + '80';
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
        const sizeConfig = ASTEROID_CONFIGS[this.size];
        const typeMod = TYPE_MODIFIERS[this.type];
        return Math.floor(sizeConfig.basePoints * typeMod.pointMultiplier);
    }

    /**
     * Apply a hit to the asteroid
     * @returns true if asteroid is destroyed, false if it survives (tank asteroids)
     */
    public takeHit(): boolean {
        this.hitsRemaining--;
        return this.hitsRemaining <= 0;
    }

    /**
     * Break the asteroid apart into smaller fragments
     * @returns Array of new asteroids (empty if small asteroid)
     */
    public breakApart(): Asteroid[] {
        if (this.size === 'small') return [];
        
        const newSize = this.size === 'large' ? 'medium' : 'small';
        const asteroids: Asteroid[] = [];
        
        for (let i = 0; i < 2; i++) {
            const asteroid = new Asteroid(this.x, this.y, newSize, this.type);
            // Add some random velocity variation
            asteroid.vx = this.vx + (Math.random() - 0.5) * 3;
            asteroid.vy = this.vy + (Math.random() - 0.5) * 3;
            asteroids.push(asteroid);
        }
        
        return asteroids;
    }

    public deactivate(): void {
        this.active = false;
    }
}
