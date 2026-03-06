export interface ScreenShakeConfig {
    intensity?: number;
    duration?: number;
    decay?: number;
}

export class ScreenShake {
    private intensity: number = 0;
    private duration: number = 0;
    private decay: number = 0.9;
    private active: boolean = false;
    private offsetX: number = 0;
    private offsetY: number = 0;

    public shake(config: ScreenShakeConfig = {}): void {
        this.intensity = config.intensity ?? 10;
        this.duration = config.duration ?? 30;
        this.decay = config.decay ?? 0.9;
        this.active = true;
        
        this.generateOffset();
    }

    private generateOffset(): void {
        if (!this.active || this.intensity <= 0.5) {
            this.offsetX = 0;
            this.offsetY = 0;
            this.active = false;
            return;
        }

        this.offsetX = (Math.random() - 0.5) * 2 * this.intensity;
        this.offsetY = (Math.random() - 0.5) * 2 * this.intensity;
    }

    public update(): void {
        if (!this.active) return;

        this.duration--;
        
        if (this.duration <= 0) {
            this.intensity *= this.decay;
        }

        if (this.intensity <= 0.5) {
            this.active = false;
            this.offsetX = 0;
            this.offsetY = 0;
        } else {
            this.generateOffset();
        }
    }

    public apply(ctx: CanvasRenderingContext2D): void {
        if (this.active) {
            ctx.save();
            ctx.translate(this.offsetX, this.offsetY);
        }
    }

    public restore(ctx: CanvasRenderingContext2D): void {
        if (this.active) {
            ctx.restore();
        }
    }

    public isActive(): boolean {
        return this.active;
    }

    public getOffsetX(): number {
        return this.offsetX;
    }

    public getOffsetY(): number {
        return this.offsetY;
    }

    public getIntensity(): number {
        return this.intensity;
    }
}
