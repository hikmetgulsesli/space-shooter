/**
 * PowerUp Entity - Drifts across screen and can be collected by player
 * Implements three power-up types: Rapid Fire, Shield, and Multi-Shot
 */

export type PowerUpType = 'rapidFire' | 'shield' | 'multiShot';

export interface ActivePowerUp {
    type: PowerUpType;
    remainingTime: number;
    duration: number;
}

export class PowerUp {
    public x: number;
    public y: number;
    private vx: number;
    private vy: number;
    private radius: number = 12;
    private type: PowerUpType;
    private active: boolean = true;
    private rotation: number = 0;
    private pulsePhase: number = 0;

    private static readonly DRIFT_SPEED = 0.8;
    private static readonly COLORS: Record<PowerUpType, string> = {
        rapidFire: '#ff6b35', // Orange
        shield: '#00d4ff',    // Cyan
        multiShot: '#a3e635'  // Lime
    };

    private static readonly SYMBOLS: Record<PowerUpType, string> = {
        rapidFire: '⚡',
        shield: '🛡️',
        multiShot: '✦'
    };

    constructor(x: number, y: number, type: PowerUpType) {
        this.x = x;
        this.y = y;
        this.type = type;

        // Random drift direction
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * PowerUp.DRIFT_SPEED;
        this.vy = Math.sin(angle) * PowerUp.DRIFT_SPEED;
    }

    public static getRandomType(): PowerUpType {
        const types: PowerUpType[] = ['rapidFire', 'shield', 'multiShot'];
        return types[Math.floor(Math.random() * types.length)];
    }

    public static shouldSpawn(): boolean {
        // 15% chance to spawn from destroyed asteroids
        return Math.random() < 0.15;
    }

    public update(canvas: HTMLCanvasElement): void {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += 0.02;
        this.pulsePhase += 0.1;

        // Deactivate if off screen
        if (this.x < -50 || this.x > canvas.width + 50 ||
            this.y < -50 || this.y > canvas.height + 50) {
            this.active = false;
        }
    }

    public isActive(): boolean {
        return this.active;
    }

    public getType(): PowerUpType {
        return this.type;
    }

    public getRadius(): number {
        return this.radius;
    }

    public collect(): void {
        this.active = false;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        const color = PowerUp.COLORS[this.type];
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.15;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(pulse, pulse);

        // Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;

        // Outer ring
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner circle
        ctx.fillStyle = color + '40'; // 25% opacity
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Center dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Draw icon (non-rotated)
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(PowerUp.SYMBOLS[this.type], 0, 1);
        ctx.restore();
    }

    /**
     * Check collision with player
     */
    public checkCollision(playerX: number, playerY: number, playerRadius: number): boolean {
        const dx = this.x - playerX;
        const dy = this.y - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + playerRadius;
    }
}

/**
 * PowerUp Manager - Handles active power-ups and their durations
 */
export class PowerUpManager {
    private activePowerUps: Map<PowerUpType, ActivePowerUp> = new Map();
    private shieldActive: boolean = false;

    public static readonly POWER_UP_DURATION = 10000; // 10 seconds in ms
    public static readonly RAPID_FIRE_MULTIPLIER = 2; // 2x fire rate

    /**
     * Activate a power-up with its duration
     */
    public activate(type: PowerUpType): void {
        this.activePowerUps.set(type, {
            type,
            remainingTime: PowerUpManager.POWER_UP_DURATION,
            duration: PowerUpManager.POWER_UP_DURATION
        });

        if (type === 'shield') {
            this.shieldActive = true;
        }
    }

    /**
     * Update all active power-ups (decrement timers)
     */
    public update(deltaTime: number): void {
        for (const [type, powerUp] of this.activePowerUps) {
            powerUp.remainingTime -= deltaTime;

            if (powerUp.remainingTime <= 0) {
                this.activePowerUps.delete(type);
                if (type === 'shield') {
                    this.shieldActive = false;
                }
            }
        }
    }

    /**
     * Check if a power-up is currently active
     */
    public isActive(type: PowerUpType): boolean {
        return this.activePowerUps.has(type);
    }

    /**
     * Get all active power-ups for HUD display
     */
    public getActivePowerUps(): ActivePowerUp[] {
        return Array.from(this.activePowerUps.values());
    }

    /**
     * Check if shield is active and consume it if hit
     * Returns true if shield absorbed the hit
     */
    public useShield(): boolean {
        if (this.shieldActive) {
            this.shieldActive = false;
            this.activePowerUps.delete('shield');
            return true;
        }
        return false;
    }

    /**
     * Get fire rate multiplier (for rapid fire)
     */
    public getFireRateMultiplier(): number {
        return this.isActive('rapidFire') ? PowerUpManager.RAPID_FIRE_MULTIPLIER : 1;
    }

    /**
     * Check if multi-shot is active
     */
    public isMultiShotActive(): boolean {
        return this.isActive('multiShot');
    }

    /**
     * Clear all active power-ups
     */
    public clear(): void {
        this.activePowerUps.clear();
        this.shieldActive = false;
    }
}
