import { designTokens } from './designTokens';

export interface TrailPoint { x: number; y: number; alpha: number; size: number; }
export interface BulletTrailConfig {
    maxLength?: number;
    decayRate?: number;
    color?: string;
    minSize?: number;
    maxSize?: number;
}

export class BulletTrail {
    private points: TrailPoint[] = [];
    private maxLength: number;
    private decayRate: number;
    private color: string;
    private minSize: number;
    private maxSize: number;

    constructor(config: BulletTrailConfig = {}) {
        this.maxLength = config.maxLength ?? 8;
        this.decayRate = config.decayRate ?? 0.15;
        this.color = config.color ?? designTokens.colors.bullet;
        this.minSize = config.minSize ?? 1;
        this.maxSize = config.maxSize ?? 3;
    }

    public addPoint(x: number, y: number): void {
        this.points.push({ x, y, alpha: 1.0, size: this.maxSize });
        if (this.points.length > this.maxLength) {
            this.points.shift();
        }
    }

    public update(): void {
        for (let i = this.points.length - 1; i >= 0; i--) {
            const point = this.points[i];
            point.alpha -= this.decayRate;
            point.size = Math.max(this.minSize, point.size - 0.2);
            if (point.alpha <= 0) {
                this.points.splice(i, 1);
            }
        }
    }

    public render(ctx: CanvasRenderingContext2D): void {
        if (this.points.length < 2) return;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let i = 0; i < this.points.length - 1; i++) {
            const point = this.points[i];
            const nextPoint = this.points[i + 1];
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(nextPoint.x, nextPoint.y);
            const progress = i / (this.points.length - 1);
            const alpha = point.alpha * (0.3 + progress * 0.7);
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = point.size;
            ctx.shadowColor = designTokens.colors.bulletGlow;
            ctx.shadowBlur = 4;
            ctx.stroke();
        }
        ctx.restore();
    }

    public clear(): void { this.points = []; }
    public getLength(): number { return this.points.length; }
    public isActive(): boolean { return this.points.length > 0; }
}

export class BulletTrailManager {
    private trails: Map<string, BulletTrail> = new Map();
    private trailIdCounter: number = 0;

    public createTrail(config?: BulletTrailConfig): string {
        const id = `trail_${this.trailIdCounter++}`;
        this.trails.set(id, new BulletTrail(config));
        return id;
    }

    public addPoint(trailId: string, x: number, y: number): void {
        const trail = this.trails.get(trailId);
        if (trail) trail.addPoint(x, y);
    }

    public update(): void {
        for (const [id, trail] of this.trails) {
            trail.update();
            if (!trail.isActive()) this.trails.delete(id);
        }
    }

    public render(ctx: CanvasRenderingContext2D): void {
        for (const trail of this.trails.values()) trail.render(ctx);
    }

    public removeTrail(trailId: string): void { this.trails.delete(trailId); }
    public clear(): void { this.trails.clear(); }
    public getActiveTrailCount(): number { return this.trails.size; }
}
