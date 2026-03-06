import { ObjectPool } from '../utils/ObjectPool';

interface TestObject {
    id: number;
    active: boolean;
    value: number;
}

describe('ObjectPool', () => {
    let pool: ObjectPool<TestObject>;
    
    beforeEach(() => {
        pool = new ObjectPool<TestObject>(
            () => ({ id: 0, active: true, value: 0 }),
            (obj) => { obj.active = false; },
            10
        );
    });

    afterEach(() => {
        pool.clear();
    });

    describe('acquire', () => {
        it('should create new object when pool is empty', () => {
            const obj = pool.acquire();
            expect(obj).toBeDefined();
            expect(obj.active).toBe(true);
        });

        it('should reuse object from pool when available', () => {
            const obj1 = pool.acquire();
            pool.release(obj1);
            const obj2 = pool.acquire();
            
            expect(obj1).toBe(obj2);
        });
    });

    describe('release', () => {
        it('should reset object when released', () => {
            const obj = pool.acquire();
            obj.active = true;
            pool.release(obj);
            
            expect(obj.active).toBe(false);
        });

        it('should not exceed max pool size', () => {
            const objects: TestObject[] = [];
            
            // Acquire more than max size
            for (let i = 0; i < 15; i++) {
                objects.push(pool.acquire());
            }
            
            // Release all
            for (const obj of objects) {
                pool.release(obj);
            }
            
            // Pool should not exceed max size
            expect(pool.size()).toBe(10);
        });
    });

    describe('size', () => {
        it('should return 0 for empty pool', () => {
            expect(pool.size()).toBe(0);
        });

        it('should return correct size after acquire and release', () => {
            const obj1 = pool.acquire();
            const obj2 = pool.acquire();
            
            expect(pool.size()).toBe(0);
            
            pool.release(obj1);
            expect(pool.size()).toBe(1);
            
            pool.release(obj2);
            expect(pool.size()).toBe(2);
        });
    });

    describe('clear', () => {
        it('should empty the pool', () => {
            const obj = pool.acquire();
            pool.release(obj);
            
            expect(pool.size()).toBe(1);
            
            pool.clear();
            
            expect(pool.size()).toBe(0);
        });
    });

    describe('performance', () => {
        it('should reuse objects efficiently without creating new ones', () => {
            // Acquire and release 1000 objects
            for (let i = 0; i < 1000; i++) {
                const obj = pool.acquire();
                pool.release(obj);
            }
            
            // Pool should contain max size objects, all reused
            expect(pool.size()).toBe(10);
        });
    });
});