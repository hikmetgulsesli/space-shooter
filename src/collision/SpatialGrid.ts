/**
 * Spatial Grid for efficient collision detection
 * Divides game world into cells for O(1) neighbor lookup
 */
export class SpatialGrid {
    private cellSize: number;
    private grid: Map<string, Set<number>> = new Map();
    private entityPositions: Map<number, { x: number; y: number; cellKeys: string[] }> = new Map();

    constructor(cellSize: number = 100) {
        this.cellSize = cellSize;
    }

    /**
     * Clear the grid for a new frame
     */
    public clear(): void {
        this.grid.clear();
        this.entityPositions.clear();
    }

    /**
     * Insert an entity into the spatial grid
     * @param id Unique entity identifier
     * @param x Entity x position
     * @param y Entity y position
     * @param radius Entity radius for cell coverage
     */
    public insert(id: number, x: number, y: number, radius: number): void {
        const cellKeys = this.getCellKeysForEntity(x, y, radius);
        
        for (const key of cellKeys) {
            if (!this.grid.has(key)) {
                this.grid.set(key, new Set());
            }
            this.grid.get(key)!.add(id);
        }
        
        this.entityPositions.set(id, { x, y, cellKeys });
    }

    /**
     * Get all entity IDs that could potentially collide with the given entity
     * @param id Entity ID to check
     * @param x Entity x position
     * @param y Entity y position
     * @param radius Entity radius
     */
    public getPotentialCollisions(id: number, x: number, y: number, radius: number): number[] {
        const cellKeys = this.getCellKeysForEntity(x, y, radius);
        const potentialCollisions = new Set<number>();
        
        for (const key of cellKeys) {
            const cell = this.grid.get(key);
            if (cell) {
                for (const entityId of cell) {
                    if (entityId !== id) {
                        potentialCollisions.add(entityId);
                    }
                }
            }
        }
        
        return Array.from(potentialCollisions);
    }

    /**
     * Get nearby entities within a radius
     */
    public getNearby(x: number, y: number, radius: number): number[] {
        return this.getPotentialCollisions(-1, x, y, radius);
    }

    /**
     * Calculate cell keys that an entity overlaps with
     */
    private getCellKeysForEntity(x: number, y: number, radius: number): string[] {
        const minCellX = Math.floor((x - radius) / this.cellSize);
        const maxCellX = Math.floor((x + radius) / this.cellSize);
        const minCellY = Math.floor((y - radius) / this.cellSize);
        const maxCellY = Math.floor((y + radius) / this.cellSize);
        
        const keys: string[] = [];
        for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
            for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
                keys.push(`${cellX},${cellY}`);
            }
        }
        return keys;
    }

    /**
     * Get cell size for debugging
     */
    public getCellSize(): number {
        return this.cellSize;
    }

    /**
     * Get total cell count for debugging
     */
    public getCellCount(): number {
        return this.grid.size;
    }
}