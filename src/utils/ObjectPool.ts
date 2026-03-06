/**
 * Generic Object Pool for reusing game entities
 * Reduces garbage collection pressure by recycling objects
 */
export class ObjectPool<T> {
    private pool: T[] = [];
    private createFn: () => T;
    private resetFn: (obj: T) => void;
    private maxSize: number;

    constructor(createFn: () => T, resetFn: (obj: T) => void, maxSize: number = 100) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.maxSize = maxSize;
    }

    /**
     * Get an object from the pool or create a new one
     */
    public acquire(): T {
        if (this.pool.length > 0) {
            return this.pool.pop()!;
        }
        return this.createFn();
    }

    /**
     * Return an object to the pool for reuse
     */
    public release(obj: T): void {
        if (this.pool.length < this.maxSize) {
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }

    /**
     * Get current pool size
     */
    public size(): number {
        return this.pool.length;
    }

    /**
     * Clear the pool
     */
    public clear(): void {
        this.pool.length = 0;
    }
}