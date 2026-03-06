import { Enemy } from './Enemy';
import { BasicEnemy } from './BasicEnemy';
import { HunterEnemy } from './HunterEnemy';
import { EnemyBullet } from './EnemyBullet';

export type EnemyType = 'basic' | 'hunter';

export class EnemySpawnSystem {
    private spawnTimer: number = 0;
    private spawnInterval: number = 300;
    private enemies: Enemy[] = [];
    private enemyBullets: EnemyBullet[] = [];
    private canvas: HTMLCanvasElement;
    private useExternalSpawnInterval: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    public update(playerX: number, playerY: number, externalSpawnInterval?: number): void {
        this.spawnTimer++;

        // Use external spawn interval from wave system if provided
        const currentInterval = externalSpawnInterval !== undefined 
            ? externalSpawnInterval 
            : this.spawnInterval;

        if (this.spawnTimer >= currentInterval) {
            this.spawnTimer = 0;
            this.spawnEnemy();
            
            // Only auto-adjust if not using external interval
            if (externalSpawnInterval === undefined && this.spawnInterval > 120) {
                this.spawnInterval -= 5;
            }
        }

        this.enemyBullets = [];
        
        this.enemies = this.enemies.filter(enemy => {
            enemy.update(playerX, playerY, this.canvas);
            
            if (enemy instanceof BasicEnemy) {
                const bullets = enemy.getBullets();
                this.enemyBullets.push(...bullets);
            }
            
            return enemy.isActive();
        });
    }

    private spawnEnemy(): void {
        const enemyType: EnemyType = Math.random() < 0.7 ? 'basic' : 'hunter';
        
        if (enemyType === 'basic') {
            const x = 50 + Math.random() * (this.canvas.width - 100);
            const y = -30;
            const direction = Math.random() < 0.5 ? 1 : -1;
            this.enemies.push(new BasicEnemy(x, y, direction));
        } else {
            const x = Math.random() < 0.5 ? 100 : this.canvas.width - 100;
            const y = 50;
            this.enemies.push(new HunterEnemy(x, y));
        }
    }

    public render(ctx: CanvasRenderingContext2D): void {
        this.enemies.forEach(enemy => enemy.render(ctx));
        this.enemyBullets.forEach(bullet => bullet.render(ctx));
    }

    public getEnemies(): Enemy[] {
        return this.enemies;
    }

    public getBullets(): EnemyBullet[] {
        return this.enemyBullets;
    }

    public removeEnemy(enemy: Enemy): void {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            if (enemy instanceof BasicEnemy) {
                enemy.clearBullets();
            }
            this.enemies.splice(index, 1);
        }
    }

    public removeBullet(bullet: EnemyBullet): void {
        const index = this.enemyBullets.indexOf(bullet);
        if (index > -1) {
            this.enemyBullets.splice(index, 1);
        }
    }

    public reset(): void {
        this.enemies = [];
        this.enemyBullets = [];
        this.spawnTimer = 0;
        this.spawnInterval = 300;
        this.useExternalSpawnInterval = false;
    }

    public getActiveEnemyCount(): number {
        return this.enemies.length;
    }

    public setSpawnInterval(interval: number): void {
        this.spawnInterval = interval;
    }
}

export { Enemy, BasicEnemy, HunterEnemy, EnemyBullet };
