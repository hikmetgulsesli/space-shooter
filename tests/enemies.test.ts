import { BasicEnemy } from '../src/entities/enemies/BasicEnemy';
import { HunterEnemy } from '../src/entities/enemies/HunterEnemy';
import { EnemySpawnSystem } from '../src/entities/enemies/EnemySpawnSystem';
import { EnemyBullet } from '../src/entities/enemies/EnemyBullet';

describe('Enemy System', () => {
    let canvas: HTMLCanvasElement;

    beforeEach(() => {
        canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
    });

    describe('BasicEnemy', () => {
        test('has correct initial properties', () => {
            const enemy = new BasicEnemy(100, 100);
            expect(enemy.x).toBe(100);
            expect(enemy.y).toBe(100);
            expect(enemy.health).toBe(30);
            expect(enemy.active).toBe(true);
        });

        test('moves horizontally based on direction', () => {
            const enemy = new BasicEnemy(100, 100, 1);
            enemy.update(0, 0, canvas);
            expect(enemy.x).toBeGreaterThan(100);
        });

        test('bounces off walls', () => {
            const enemyLeft = new BasicEnemy(10, 100, -1);
            enemyLeft.update(0, 0, canvas);
            expect(enemyLeft.x).toBe(30);

            const enemyRight = new BasicEnemy(790, 100, 1);
            enemyRight.update(0, 0, canvas);
            expect(enemyRight.x).toBeLessThan(790);
        });

        test('shoots bullets periodically', () => {
            const enemy = new BasicEnemy(100, 100);
            expect(enemy.getBullets().length).toBe(0);
            
            for (let i = 0; i < 120; i++) {
                enemy.update(0, 0, canvas);
            }
            
            expect(enemy.getBullets().length).toBeGreaterThan(0);
        });

        test('takes damage correctly', () => {
            const enemy = new BasicEnemy(100, 100);
            expect(enemy.health).toBe(30);
            enemy.takeDamage(10);
            expect(enemy.health).toBe(20);
        });

        test('dies when health reaches zero', () => {
            const enemy = new BasicEnemy(100, 100);
            enemy.takeDamage(30);
            expect(enemy.isActive()).toBe(false);
        });

        test('returns 200 points', () => {
            const enemy = new BasicEnemy(100, 100);
            expect(enemy.getPoints()).toBe(200);
        });

        test('has correct radius', () => {
            const enemy = new BasicEnemy(100, 100);
            expect(enemy.getRadius()).toBe(15);
        });
    });

    describe('HunterEnemy', () => {
        test('has correct initial properties', () => {
            const enemy = new HunterEnemy(100, 100);
            expect(enemy.x).toBe(100);
            expect(enemy.y).toBe(100);
            expect(enemy.health).toBe(50);
            expect(enemy.active).toBe(true);
            expect(enemy.getState()).toBe('patrol');
        });

        test('takes damage correctly', () => {
            const enemy = new HunterEnemy(100, 100);
            expect(enemy.health).toBe(50);
            enemy.takeDamage(10);
            expect(enemy.health).toBe(40);
        });

        test('dies when health reaches zero', () => {
            const enemy = new HunterEnemy(100, 100);
            enemy.takeDamage(50);
            expect(enemy.isActive()).toBe(false);
        });

        test('returns 500 points', () => {
            const enemy = new HunterEnemy(100, 100);
            expect(enemy.getPoints()).toBe(500);
        });

        test('has correct radius', () => {
            const enemy = new HunterEnemy(100, 100);
            expect(enemy.getRadius()).toBe(17.5);
        });

        test('charges when player is in detection range', () => {
            const enemy = new HunterEnemy(400, 100);
            for (let i = 0; i < 10; i++) {
                enemy.update(400, 300, canvas);
            }
            expect(enemy.y).not.toBe(100);
        });

        test('stays in patrol when player is far', () => {
            const enemy = new HunterEnemy(100, 100);
            for (let i = 0; i < 100; i++) {
                enemy.update(600, 500, canvas);
            }
            expect(enemy.getState()).toBe('patrol');
        });
    });

    describe('EnemyBullet', () => {
        test('moves according to velocity', () => {
            const bullet = new EnemyBullet(100, 100, 2, 3);
            bullet.update();
            expect(bullet.x).toBe(102);
            expect(bullet.y).toBe(103);
        });

        test('checks collision with target', () => {
            const bullet = new EnemyBullet(100, 100, 0, 0);
            expect(bullet.checkCollision(100, 100, 10)).toBe(true);
            expect(bullet.checkCollision(200, 200, 10)).toBe(false);
        });

        test('deactivates correctly', () => {
            const bullet = new EnemyBullet(100, 100, 0, 0);
            bullet.deactivate();
            expect(bullet.isActive(canvas)).toBe(false);
        });

        test('is inactive when off canvas', () => {
            const bullet = new EnemyBullet(-20, 100, 0, 0);
            expect(bullet.isActive(canvas)).toBe(false);
        });
    });

    describe('EnemySpawnSystem', () => {
        test('initializes with empty enemies', () => {
            const spawnSystem = new EnemySpawnSystem(canvas);
            expect(spawnSystem.getEnemies().length).toBe(0);
            expect(spawnSystem.getBullets().length).toBe(0);
        });

        test('spawns enemies over time', () => {
            const spawnSystem = new EnemySpawnSystem(canvas);
            expect(spawnSystem.getEnemies().length).toBe(0);
            
            for (let i = 0; i < 310; i++) {
                spawnSystem.update(400, 300);
            }
            
            expect(spawnSystem.getEnemies().length).toBeGreaterThan(0);
        });

        test('removes enemy correctly', () => {
            const spawnSystem = new EnemySpawnSystem(canvas);
            
            for (let i = 0; i < 310; i++) {
                spawnSystem.update(400, 300);
            }
            
            const enemies = spawnSystem.getEnemies();
            if (enemies.length > 0) {
                const initialCount = enemies.length;
                const enemy = enemies[0];
                spawnSystem.removeEnemy(enemy);
                expect(spawnSystem.getEnemies().length).toBeLessThan(initialCount);
            }
        });

        test('reset clears all enemies and bullets', () => {
            const spawnSystem = new EnemySpawnSystem(canvas);
            
            for (let i = 0; i < 1000; i++) {
                spawnSystem.update(400, 300);
            }
            
            expect(spawnSystem.getEnemies().length).toBeGreaterThan(0);
            
            spawnSystem.reset();
            
            expect(spawnSystem.getEnemies().length).toBe(0);
            expect(spawnSystem.getBullets().length).toBe(0);
        });
    });
});
