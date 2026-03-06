import { designTokens } from './designTokens';

export interface HitFlashConfig {
    x: number;
    y: number;
    radius: number;
    color?: string;
    duration?: number;
}

export class HitFlash {
    private x: number;
    private y: number;
    private radius: number;
    private color: string;
    private duration: number;
    private maxDuration: number;
    private active: boolean = true;

    constructor(config: HitFlashConfig) {
        this.x = config.x;
        this.y = config.y;
        this.radius = config.radius;
        this.color = config.color ?? designTokens.colors.danger;
        this.maxDuration = config.duration ?? 10;
        this.duration = this.maxDuration;
    }

    public update(): void {
        if (!this.active) return;

        this.duration--;
        
        if (this.duration <= 0) {
            this.active = false;
        }
    }

    public render(ctx: CanvasRenderingContext2D): void {
        if (!this.active) return;

        const progress = this.duration / this.maxDuration;
        const currentRadius = this.radius * (1 + (1 - progress) * 0.5);
        const alpha = progress;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Draw expanding ring
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3 * progress;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10 * progress;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw filled center
        ctx.fillStyle = this.color;
        ctx.globalAlpha = alpha * 0.3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    public isActive(): boolean {
        return this.active;
    }

    public getPosition(): { x: number; y: number } {
        return { x: this.x, y: this.y };
    }
}

/**
 * Manager for all hit flashes in the game
 */
export class HitFlashManager {
    private flashes: HitFlash[] = [];

    public createFlash(config: HitFlashConfig): void {
        this.flashes.push(new HitFlash(config));
    }

    public update(): void {
        this.flashes = this.flashes.filter(flash => {
            flash.update();
            return flash.isActive();
        });
    }

    public render(ctx: CanvasRenderingContext2D): void {
        for (const flash of this.flashes) {
            flash.render(ctx);
        }
    }

    public clear(): void {
        this.flashes = [];
    }

    public getActiveFlashCount(): number {
        return this.flashes.length;
    }
}
