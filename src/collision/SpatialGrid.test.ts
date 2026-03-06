import { SpatialGrid } from './SpatialGrid';

describe('SpatialGrid', () => {
    let grid: SpatialGrid;

    beforeEach(() => {
        grid = new SpatialGrid(100);
    });

    describe('insert', () => {
        it('should insert entity into correct cell', () => {
            grid.insert(0, 50, 50, 10);
            
            const nearby = grid.getNearby(50, 50, 20);
            expect(nearby).toContain(0);
        });

        it('should insert entity into multiple cells when overlapping', () => {
            // Entity at cell boundary (radius causes overlap)
            grid.insert(0, 100, 100, 50);
            
            // Should be found from adjacent cells
            const nearby1 = grid.getNearby(80, 80, 10);
            const nearby2 = grid.getNearby(120, 120, 10);
            
            expect(nearby1.length + nearby2.length).toBeGreaterThan(0);
        });
    });

    describe('getPotentialCollisions', () => {
        it('should return empty array when no entities nearby', () => {
            grid.insert(0, 0, 0, 10);
            
            const collisions = grid.getPotentialCollisions(1, 500, 500, 10);
            expect(collisions).toEqual([]);
        });

        it('should return nearby entity IDs', () => {
            grid.insert(0, 50, 50, 10);
            grid.insert(1, 60, 60, 10);
            
            const collisions = grid.getPotentialCollisions(2, 55, 55, 10);
            expect(collisions).toContain(0);
            expect(collisions).toContain(1);
        });

        it('should exclude self from collisions', () => {
            grid.insert(0, 50, 50, 10);
            
            const collisions = grid.getPotentialCollisions(0, 50, 50, 10);
            expect(collisions).not.toContain(0);
        });
    });

    describe('getNearby', () => {
        it('should find entities within search radius', () => {
            grid.insert(0, 50, 50, 10);
            grid.insert(1, 500, 500, 10);
            
            const nearby = grid.getNearby(50, 50, 100);
            expect(nearby).toContain(0);
            expect(nearby).not.toContain(1);
        });
    });

    describe('clear', () => {
        it('should remove all entities', () => {
            grid.insert(0, 50, 50, 10);
            grid.clear();
            
            const nearby = grid.getNearby(50, 50, 100);
            expect(nearby).toEqual([]);
        });

        it('should reset entity positions map', () => {
            grid.insert(0, 50, 50, 10);
            grid.clear();
            
            expect(grid.getCellCount()).toBe(0);
        });
    });

    describe('getCellSize', () => {
        it('should return the configured cell size', () => {
            expect(grid.getCellSize()).toBe(100);
        });
    });

    describe('getCellCount', () => {
        it('should return 0 for empty grid', () => {
            expect(grid.getCellCount()).toBe(0);
        });

        it('should return correct cell count after insert', () => {
            grid.insert(0, 50, 50, 10); // Should be in 1 cell
            expect(grid.getCellCount()).toBe(1);
        });
    });

    describe('performance', () => {
        it('should handle many entities efficiently', () => {
            const startTime = performance.now();
            
            // Insert 100 entities
            for (let i = 0; i < 100; i++) {
                grid.insert(i, Math.random() * 800, Math.random() * 600, 10);
            }
            
            // Query for collisions 1000 times
            for (let i = 0; i < 1000; i++) {
                grid.getPotentialCollisions(999, Math.random() * 800, Math.random() * 600, 20);
            }
            
            const endTime = performance.now();
            
            // Should complete in reasonable time (< 100ms)
            expect(endTime - startTime).toBeLessThan(100);
        });
    });
});