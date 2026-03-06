import { Player } from '../entities/Player';
import { Asteroid } from '../entities/Asteroid';
import { Bullet } from '../entities/Bullet';
import { SpatialGrid } from './SpatialGrid';

export class CollisionManager {
    private spatialGrid: SpatialGrid;
    private useSpatialGrid: boolean;
    private entityIdCounter: number = 0;

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
        asteroids: Asteroid[]
    ): void {
        if (!this.useSpatialGrid) return;
        
        this.spatialGrid.clear();
        this.entityIdCounter = 0;
        
        // Insert player
        this.spatialGrid.insert(
            this.entityIdCounter++,
            player.x,
            player.y,
            player.getRadius()
        );
        
        // Insert asteroids (offset IDs to avoid collision with player/bullets)
        for (let i = 0; i < asteroids.length; i++) {
            const asteroid = asteroids[i];
            this.spatialGrid.insert(
                this.entityIdCounter++,
                asteroid.x,
                asteroid.y,
                asteroid.getRadius()
            );
        }
    }

    public checkPlayerAsteroidCollision(player: Player, asteroid: Asteroid): boolean {
        if (this.useSpatialGrid) {
            // Spatial grid already has entities, just do distance check
            return this.distanceCheck(
                player.x, player.y, player.getRadius(),
                asteroid.x, asteroid.y, asteroid.getRadius()
            );
        }
        
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