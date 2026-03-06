import { Enemy } from './Enemy';

export class HunterEnemy implements Enemy {
    public x: number;
    public y: number;
    public health: number;
    public active: boolean = true;
    
    private width: number = 35;
    private height: number = 25;
    private speed: number = 1.5;
    private detectionRange: number = 250;
    private chargeSpeed: number = 6;
    private state: 'patrol' | 'charge' | 'retreat' = 'patrol';
    private targetX: number = 0;
    private targetY: number = 0;
    private chargeTimer: number = 0;
    private chargeCooldown: number = 0;
    private patrolAngle: number = 0;
    private color: string = '#9b59b6';
    private chargeColor: string = '#e74c3c';

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.health = 50;
        this.patrolAngle = Math.random() * Math.PI * 2;
    }

    public update(playerX: number, playerY: number, canvas: HTMLCanvasElement): void {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        switch (this.state) {
            case 'patrol':
                this.patrol(canvas);
                
                if (distance < this.detectionRange && this.chargeCooldown <= 0) {
                    this.state = 'charge';
                    this.targetX = playerX;
                    this.targetY = playerY;
                    this.chargeTimer = 0;
                }
                break;

            case 'charge':
                this.charge();
                this.chargeTimer++;
                
                if (this.chargeTimer > 60 || 
                    this.x < -50 || this.x > canvas.width + 50 ||
                    this.y < -50 || this.y > canvas.height + 50) {
                    this.state = 'retreat';
                    this.chargeCooldown = 180;
                }
                break;

            case 'retreat':
                this.retreat(canvas);
                this.chargeCooldown--;
                
                if (this.chargeCooldown <= 0) {
                    this.state = 'patrol';
                }
                break;
        }

        if (this.x < -100 || this.x > canvas.width + 100 ||
            this.y < -100 || this.y > canvas.height + 100) {
            if (this.state !== 'charge') {
                this.active = false;
            }
        }
    }

    private patrol(canvas: HTMLCanvasElement): void {
        this.patrolAngle += 0.02;
        this.x += Math.cos(this.patrolAngle) * this.speed;
        this.y += Math.sin(this.patrolAngle * 2) * this.speed * 0.5 + 0.5;

        if (this.x < 50) this.x = 50;
        if (this.x > canvas.width - 50) this.x = canvas.width - 50;
        if (this.y < 50) this.y = 50;
        if (this.y > canvas.height / 2) this.y = canvas.height / 2;
    }

    private charge(): void {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.x += (dx / distance) * this.chargeSpeed;
            this.y += (dy / distance) * this.chargeSpeed;
        }
    }

    private retreat(canvas: HTMLCanvasElement): void {
        const targetY = 100;
        const dy = targetY - this.y;
        
        this.y += Math.sign(dy) * this.speed;
        
        const centerX = canvas.width / 2;
        const dx = centerX - this.x;
        this.x += (dx / canvas.width) * this.speed;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        const currentColor = this.state === 'charge' ? this.chargeColor : this.color;
        
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = currentColor;
        ctx.shadowBlur = this.state === 'charge' ? 15 : 8;

        ctx.beginPath();
        ctx.moveTo(0, this.height / 2);
        ctx.lineTo(-this.width / 2, 0);
        ctx.lineTo(-this.width / 4, -this.height / 2);
        ctx.lineTo(this.width / 4, -this.height / 2);
        ctx.lineTo(this.width / 2, 0);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, this.height / 4);
        ctx.lineTo(-this.width / 4, 0);
        ctx.lineTo(0, -this.height / 4);
        ctx.lineTo(this.width / 4, 0);
        ctx.closePath();
        ctx.stroke();

        const engineOffset = this.state === 'charge' ? -12 : -6;
        ctx.fillStyle = this.state === 'charge' ? '#ff0000' : '#ffaa00';
        ctx.shadowColor = ctx.fillStyle;
        
        ctx.beginPath();
        ctx.moveTo(-8, -this.height / 2);
        ctx.lineTo(-12, -this.height / 2 + engineOffset);
        ctx.lineTo(-4, -this.height / 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(8, -this.height / 2);
        ctx.lineTo(12, -this.height / 2 + engineOffset);
        ctx.lineTo(4, -this.height / 2);
        ctx.fill();

        if (this.state === 'charge') {
            ctx.strokeStyle = '#ff0000';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(0, 0, this.detectionRange * 0.3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();
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
        return 500;
    }

    public isActive(): boolean {
        return this.active;
    }

    public getState(): string {
        return this.state;
    }
}
