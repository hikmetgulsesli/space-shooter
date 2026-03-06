import { Enemy } from './Enemy';
import { BasicEnemy } from './BasicEnemy';
import { HunterEnemy } from './HunterEnemy';
import { EnemyBullet } from './EnemyBullet';

export type EnemyType = 'basic' | 'hunter';

export class EnemySpawnSystem {
    private spawnTimer: number = 0;
    private spawnInterval: number = 300; // 5 seconds at 60fps
    private enemies: Enemy[] = [];
    private enemyBullets: EnemyBullet[] = [];
    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    public update(playerX: number, playerY: number): void {
        this.spawnTimer++;

        // Spawn new enemy
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnEnemy();
            
            // Gradually decrease spawn interval (cap at 120 frames = 2 seconds)
            if (this.spawnInterval > 120) {
                this.spawnInterval -= 5;
            }
        }

        // Update all enemies and collect their bullets
        this.enemyBullets = [];
        
        this.enemies = this.enemies.filter(enemy => {
            enemy.update(playerX, playerY, this.canvas);
            
            // Collect bullets from BasicEnemy
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
            // Basic enemy spawns from top, moves horizontally
            const x = 50 + Math.random() * (this.canvas.width - 100);
            const y = -30;
            const direction = Math.random() < 0.5 ? 1 : -1;
            this.enemies.push(new BasicEnemy(x, y, direction));
        } else {
            // Hunter enemy spawns from top corners
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
            // Clear bullets from BasicEnemy before removal
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
    }

    public getActiveEnemyCount(): number {
        return this.enemies.length;
    }
}

export { Enemy, BasicEnemy, HunterEnemy, EnemyBullet };
