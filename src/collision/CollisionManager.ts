import { Player } from '../entities/Player';
import { Asteroid } from '../entities/Asteroid';
import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/enemies/Enemy';
import { EnemyBullet } from '../entities/enemies/EnemyBullet';
import { SpatialGrid } from './SpatialGrid';

export class CollisionManager {
    private spatialGrid: SpatialGrid;
    private useSpatialGrid: boolean;
    private entityIdCounter: number = 0;
    private asteroidIdToIndex: Map<number, number> = new Map();

    constructor(useSpatialGrid: boolean = true) {
        this.useSpatialGrid = useSpatialGrid;
        this.spatialGrid = new SpatialGrid(100); // 100px cell size
    }

    /**
     * Enable or disable spatial grid optimization
     */
    public setUseSpatialGrid(use: boolean): void {
        this.useSpatialGrid = use;
    }

    /**
     * Build spatial grid for current frame
     * Call this once per frame before collision checks
     */
    public buildSpatialGrid(
        player: Player,
        asteroids: Asteroid[],
        bullets: Bullet[]
    ): void {
        if (!this.useSpatialGrid) return;
        
        this.spatialGrid.clear();
        this.asteroidIdToIndex.clear();
        this.entityIdCounter = 0;
        
        // Insert player (ID 0)
        this.spatialGrid.insert(
            this.entityIdCounter++,
            player.x,
            player.y,
            player.getRadius()
        );
        
        // Insert asteroids (offset IDs to avoid collision with player/bullets)
        for (let i = 0; i < asteroids.length; i++) {
            const asteroid = asteroids[i];
            const asteroidId = this.entityIdCounter++;
            this.asteroidIdToIndex.set(asteroidId, i);
            this.spatialGrid.insert(
                asteroidId,
                asteroid.x,
                asteroid.y,
                asteroid.getRadius()
            );
        }
        
        // Insert bullets
        for (let i = 0; i < bullets.length; i++) {
            const bullet = bullets[i];
            this.spatialGrid.insert(
                this.entityIdCounter++,
                bullet.x,
                bullet.y,
                bullet.getRadius()
            );
        }
    }

    /**
     * Get indices of asteroids that could potentially collide with the player
     */
    public getAsteroidsNearPlayer(player: Player): number[] {
        if (!this.useSpatialGrid) return [];
        
        const nearbyIds = this.spatialGrid.getNearby(
            player.x,
            player.y,
            player.getRadius()
        );
        
        // Filter out player ID (0) and map asteroid IDs to indices
        return nearbyIds
            .filter(id => id !== 0)
            .map(id => this.asteroidIdToIndex.get(id))
            .filter((index): index is number => index !== undefined);
    }

    /**
     * Get indices of asteroids that could potentially collide with a bullet
     */
    public getAsteroidsNearBullet(bullet: Bullet): number[] {
        if (!this.useSpatialGrid) return [];
        
        const nearbyIds = this.spatialGrid.getNearby(
            bullet.x,
            bullet.y,
            bullet.getRadius()
        );
        
        // Filter out player ID (0) and map asteroid IDs to indices
        return nearbyIds
            .filter(id => id !== 0)
            .map(id => this.asteroidIdToIndex.get(id))
            .filter((index): index is number => index !== undefined);
    }

    public checkPlayerAsteroidCollision(player: Player, asteroid: Asteroid): boolean {
        return this.distanceCheck(
            player.x, player.y, player.getRadius(),
            asteroid.x, asteroid.y, asteroid.getRadius()
        );
    }

    public checkBulletAsteroidCollision(bullet: Bullet, asteroid: Asteroid): boolean {
        return this.distanceCheck(
            bullet.x, bullet.y, bullet.getRadius(),
            asteroid.x, asteroid.y, asteroid.getRadius()
        );
    }

    public checkPlayerEnemyCollision(player: Player, enemy: Enemy): boolean {
        return this.distanceCheck(
            player.x, player.y, player.getRadius(),
            enemy.x, enemy.y, enemy.getRadius()
        );
    }

    public checkBulletEnemyCollision(bullet: Bullet, enemy: Enemy): boolean {
        return this.distanceCheck(
            bullet.x, bullet.y, bullet.getRadius(),
            enemy.x, enemy.y, enemy.getRadius()
        );
    }

    public checkPlayerEnemyBulletCollision(player: Player, enemyBullet: EnemyBullet): boolean {
        return enemyBullet.checkCollision(player.x, player.y, player.getRadius());
    }

    /**
     * Check collision between two circles
     */
    private distanceCheck(
        x1: number, y1: number, r1: number,
        x2: number, y2: number, r2: number
    ): boolean {
        const dx = x1 - x2;
        const dy = y1 - y2;
        const distanceSquared = dx * dx + dy * dy;
        const radiusSum = r1 + r2;
        
        return distanceSquared < radiusSum * radiusSum;
    }

    /**
     * Get spatial grid stats for debugging
     */
    public getSpatialGridStats(): { cellSize: number; cellCount: number; enabled: boolean } {
        return {
            cellSize: this.spatialGrid.getCellSize(),
            cellCount: this.spatialGrid.getCellCount(),
            enabled: this.useSpatialGrid
        };
    }
}