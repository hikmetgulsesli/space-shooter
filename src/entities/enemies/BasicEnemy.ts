import { Enemy } from './Enemy';
import { EnemyBullet } from './EnemyBullet';

export class BasicEnemy implements Enemy {
    public x: number;
    public y: number;
    public health: number;
    public active: boolean = true;
    
    private width: number = 30;
    private height: number = 20;
    private speed: number = 2;
    private direction: number = 1; // 1 = right, -1 = left
    private shootTimer: number = 0;
    private shootInterval: number = 120; // Shoot every 2 seconds (at 60fps)
    private bullets: EnemyBullet[] = [];
    private color: string = '#ff6b6b';

    constructor(x: number, y: number, direction: number = 1) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.health = 30;
    }

    public update(playerX: number, playerY: number, canvas: HTMLCanvasElement): void {
        // Move horizontally
        this.x += this.speed * this.direction;

        // Bounce off walls
        if (this.x <= this.width) {
            this.x = this.width;
            this.direction = 1;
        } else if (this.x >= canvas.width - this.width) {
            this.x = canvas.width - this.width;
            this.direction = -1;
        }

        // Shooting logic
        this.shootTimer++;
        if (this.shootTimer >= this.shootInterval) {
            this.shootTimer = 0;
            this.shoot();
        }

        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.update();
            return bullet.isActive(canvas);
        });

        // Deactivate if off screen
        if (this.y > canvas.height + 50) {
            this.active = false;
        }
    }

    private shoot(): void {
        const bulletSpeed = 4;
        this.bullets.push(new EnemyBullet(
            this.x,
            this.y + this.height,
            0,
            bulletSpeed
        ));
    }

    public render(ctx: CanvasRenderingContext2D): void {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw enemy ship body
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;

        ctx.beginPath();
        // Ship body - triangular shape pointing down
        ctx.moveTo(0, this.height / 2);
        ctx.lineTo(-this.width / 2, -this.height / 2);
        ctx.lineTo(0, -this.height / 4);
        ctx.lineTo(this.width / 2, -this.height / 2);
        ctx.closePath();
        ctx.stroke();

        // Engine glow
        ctx.fillStyle = '#ffaa00';
        ctx.shadowColor = '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(-5, -this.height / 2 - 2);
        ctx.lineTo(0, -this.height / 2 - 8);
        ctx.lineTo(5, -this.height / 2 - 2);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Render bullets
        this.bullets.forEach(bullet => bullet.render(ctx));
    }

    public takeDamage(damage: number): void {
        this.health -= damage;
        if (this.health <= 0) {
            this.active = false;
        }
    }

    public getRadius(): number {
        return Math.max(this.width, this.height) / 2;
    }

    public getPoints(): number {
        return 200;
    }

    public isActive(): boolean {
        return this.active;
    }

    public getBullets(): EnemyBullet[] {
        return this.bullets;
    }

    public clearBullets(): void {
        this.bullets = [];
    }
}
