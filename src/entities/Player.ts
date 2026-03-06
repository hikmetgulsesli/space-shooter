import { Bullet } from './Bullet';
import { InputHandler } from '../input/InputHandler';
import { PowerUpManager } from './PowerUp';

export class Player {
    public x: number;
    public y: number;
    private angle: number = -Math.PI / 2;
    private velocity: { x: number; y: number } = { x: 0, y: 0 };
    private radius: number = 15;
    private speed: number = 0.3;
    private friction: number = 0.98;
    private rotationSpeed: number = 0.08;
    private shootCooldown: number = 0;
    private baseShootCooldownMax: number = 15;
    private invulnerable: number = 0;
    private powerUpManager: PowerUpManager;

    constructor(x: number, y: number, powerUpManager: PowerUpManager) {
        this.x = x;
        this.y = y;
        this.powerUpManager = powerUpManager;
    }

    public update(input: InputHandler, canvas: HTMLCanvasElement): void {
        if (input.isLeft()) {
            this.angle -= this.rotationSpeed;
        }
        if (input.isRight()) {
            this.angle += this.rotationSpeed;
        }

        if (input.isUp()) {
            this.velocity.x += Math.cos(this.angle) * this.speed;
            this.velocity.y += Math.sin(this.angle) * this.speed;
        }

        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;

        this.x += this.velocity.x;
        this.y += this.velocity.y;

        this.wrapAround(canvas);

        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
        if (this.invulnerable > 0) {
            this.invulnerable--;
        }
    }

    private wrapAround(canvas: HTMLCanvasElement): void {
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
    }

    public canShoot(): boolean {
        return this.shootCooldown === 0;
    }

    /**
     * Get current shoot cooldown max based on power-ups
     */
    private getShootCooldownMax(): number {
        const multiplier = this.powerUpManager.getFireRateMultiplier();
        return Math.floor(this.baseShootCooldownMax / multiplier);
    }

    /**
     * Shoot bullets - returns array to support multi-shot
     */
    public shoot(): Bullet[] {
        const bullets: Bullet[] = [];
        const cooldownMax = this.getShootCooldownMax();
        this.shootCooldown = cooldownMax;

        const bulletSpeed = 8;

        if (this.powerUpManager.isMultiShotActive()) {
            // Multi-shot: 3 bullets in spread pattern (-15°, 0°, +15°)
            const spreadAngles = [-0.26, 0, 0.26]; // ~-15°, 0°, +15° in radians
            for (const spread of spreadAngles) {
                const angle = this.angle + spread;
                const vx = Math.cos(angle) * bulletSpeed;
                const vy = Math.sin(angle) * bulletSpeed;
                bullets.push(new Bullet(
                    this.x + Math.cos(angle) * 20,
                    this.y + Math.sin(angle) * 20,
                    vx,
                    vy
                ));
            }
        } else {
            // Normal single shot
            const vx = Math.cos(this.angle) * bulletSpeed;
            const vy = Math.sin(this.angle) * bulletSpeed;
            bullets.push(new Bullet(
                this.x + Math.cos(this.angle) * 20,
                this.y + Math.sin(this.angle) * 20,
                vx,
                vy
            ));
        }

        return bullets;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        if (this.invulnerable > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-15, 12);
        ctx.lineTo(-10, 0);
        ctx.lineTo(-15, -12);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }

    public getRadius(): number {
        return this.radius;
    }
}
