import { designTokens } from './designTokens';

export interface StarLayer {
    stars: Star[];
    speed: number;
    size: number;
    count: number;
    opacity: number;
}

export interface Star {
    x: number;
    y: number;
    size: number;
    opacity: number;
}

export class Starfield {
    private layers: StarLayer[] = [];
    private canvasWidth: number = 0;
    private canvasHeight: number = 0;

    constructor(canvasWidth: number, canvasHeight: number) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.initializeLayers();
    }

    private initializeLayers(): void {
        // Layer 1: Distant stars (slowest, smallest, most numerous)
        this.layers.push(this.createLayer({
            count: 150,
            speed: 0.2,
            size: 1,
            opacity: 0.3
        }));

        // Layer 2: Mid-distance stars
        this.layers.push(this.createLayer({
            count: 80,
            speed: 0.5,
            size: 1.5,
            opacity: 0.6
        }));

        // Layer 3: Near stars (fastest, largest, brightest)
        this.layers.push(this.createLayer({
            count: 30,
            speed: 1.0,
            size: 2.5,
            opacity: 1.0
        }));
    }

    private createLayer(config: { count: number; speed: number; size: number; opacity: number }): StarLayer {
        const stars: Star[] = [];
        
        for (let i = 0; i < config.count; i++) {
            stars.push({
                x: Math.random() * this.canvasWidth,
                y: Math.random() * this.canvasHeight,
                size: config.size * (0.8 + Math.random() * 0.4),
                opacity: config.opacity * (0.7 + Math.random() * 0.3)
            });
        }

        return {
            stars,
            speed: config.speed,
            size: config.size,
            count: config.count,
            opacity: config.opacity
        };
    }

    public update(deltaTime: number = 1): void {
        // Move stars from right to left for parallax effect
        for (const layer of this.layers) {
            for (const star of layer.stars) {
                star.x -= layer.speed * (deltaTime / 16);

                // Wrap around when star goes off screen
                if (star.x < 0) {
                    star.x = this.canvasWidth;
                    star.y = Math.random() * this.canvasHeight;
                }
            }
        }
    }

    public render(ctx: CanvasRenderingContext2D): void {
        // Draw stars from furthest to nearest
        for (const layer of this.layers) {
            for (const star of layer.stars) {
                ctx.save();
                ctx.globalAlpha = star.opacity;
                ctx.fillStyle = designTokens.colors.textPrimary;
                ctx.shadowColor = designTokens.colors.primary;
                ctx.shadowBlur = layer.size > 1.5 ? 2 : 0;

                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
    }

    public resize(width: number, height: number): void {
        this.canvasWidth = width;
        this.canvasHeight = height;
        
        // Reinitialize stars for new canvas size
        this.layers = [];
        this.initializeLayers();
    }

    public getLayerCount(): number {
        return this.layers.length;
    }

    public getTotalStarCount(): number {
        return this.layers.reduce((sum, layer) => sum + layer.stars.length, 0);
    }
}
