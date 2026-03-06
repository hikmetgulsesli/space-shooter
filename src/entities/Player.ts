import { Bullet } from './Bullet';
import { InputHandler } from '../input/InputHandler';

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
    private shootCooldownMax: number = 15;
    private invulnerable: number = 0;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
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

    public shoot(): Bullet {
        this.shootCooldown = this.shootCooldownMax;
        const bulletSpeed = 8;
        const vx = Math.cos(this.angle) * bulletSpeed;
        const vy = Math.sin(this.angle) * bulletSpeed;
        return new Bullet(
            this.x + Math.cos(this.angle) * 20,
            this.y + Math.sin(this.angle) * 20,
            vx,
            vy
        );
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
