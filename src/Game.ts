import { Player } from './entities/Player';
import { Asteroid } from './entities/Asteroid';
import { Bullet } from './entities/Bullet';
import { Particle } from './effects/Particle';
import { InputHandler } from './input/InputHandler';
import { CollisionManager } from './collision/CollisionManager';
import { PowerUp, PowerUpManager, PowerUpType } from './entities/PowerUp';

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private player: Player;
    private asteroids: Asteroid[] = [];
    private bullets: Bullet[] = [];
    private particles: Particle[] = [];
    private powerUps: PowerUp[] = [];
    private inputHandler: InputHandler;
    private collisionManager: CollisionManager;
    private powerUpManager: PowerUpManager;

    private score: number = 0;
    private lives: number = 3;
    private gameOver: boolean = false;
    private asteroidSpawnTimer: number = 0;
    private asteroidSpawnInterval: number = 120;
    private lastFrameTime: number = 0;

    private scoreElement: HTMLElement;
    private livesElement: HTMLElement;
    private gameOverElement: HTMLElement;
    private powerUpsElement: HTMLElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        this.ctx = ctx;

        this.powerUpManager = new PowerUpManager();
        this.player = new Player(canvas.width / 2, canvas.height / 2, this.powerUpManager);
        this.inputHandler = new InputHandler();
        this.collisionManager = new CollisionManager();

        this.scoreElement = document.getElementById('score')!;
        this.livesElement = document.getElementById('lives')!;
        this.gameOverElement = document.getElementById('gameOver')!;
        this.powerUpsElement = document.getElementById('powerUps')!;

        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'r' && this.gameOver) {
                this.restart();
            }
        });
    }

    public start(): void {
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    private restart(): void {
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.powerUpManager.clear();
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2, this.powerUpManager);
        this.asteroids = [];
        this.bullets = [];
        this.particles = [];
        this.powerUps = [];
        this.asteroidSpawnTimer = 0;
        this.updateUI();
        this.gameOverElement.style.display = 'none';
    }

    private gameLoop(): void {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        this.update(deltaTime);
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    private update(deltaTime: number): void {
        if (this.gameOver) return;

        this.player.update(this.inputHandler, this.canvas);
        this.powerUpManager.update(deltaTime);

        if (this.inputHandler.isShooting() && this.player.canShoot()) {
            const newBullets = this.player.shoot();
            this.bullets.push(...newBullets);
        }

        this.updateAsteroids();
        this.updateBullets();
        this.updateParticles();
        this.updatePowerUps();
        this.checkCollisions();
        this.spawnAsteroids();

        this.updateUI();
    }

    private updateAsteroids(): void {
        this.asteroids = this.asteroids.filter(asteroid => {
            asteroid.update();
            return asteroid.isActive();
        });
    }

    private updateBullets(): void {
        this.bullets = this.bullets.filter(bullet => {
            bullet.update();
            return bullet.isActive(this.canvas);
        });
    }

    private updateParticles(): void {
        this.particles = this.particles.filter(particle => {
            particle.update();
            return particle.isActive();
        });
    }

    private updatePowerUps(): void {
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.update(this.canvas);
            return powerUp.isActive();
        });
    }

    private checkCollisions(): void {
        // Check player-powerup collisions
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (powerUp.checkCollision(this.player.x, this.player.y, this.player.getRadius())) {
                this.collectPowerUp(powerUp);
                this.powerUps.splice(i, 1);
            }
        }

        // Check player-asteroid and bullet-asteroid collisions
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];

            if (this.collisionManager.checkPlayerAsteroidCollision(this.player, asteroid)) {
                // Check if shield absorbs the hit
                if (this.powerUpManager.useShield()) {
                    // Shield absorbed the hit, destroy asteroid but don't lose life
                    this.createExplosion(this.player.x, this.player.y, '#0ff');
                    this.asteroids.splice(i, 1);
                    continue;
                }

                this.lives--;
                this.createExplosion(this.player.x, this.player.y, '#0ff');
                this.asteroids.splice(i, 1);

                if (this.lives <= 0) {
                    this.endGame();
                }
                continue;
            }

            for (let j = this.bullets.length - 1; j >= 0; j--) {
                const bullet = this.bullets[j];

                if (this.collisionManager.checkBulletAsteroidCollision(bullet, asteroid)) {
                    this.score += asteroid.getPoints();
                    this.createExplosion(asteroid.x, asteroid.y, '#888');

                    // Spawn power-up with 15% chance
                    if (PowerUp.shouldSpawn()) {
                        this.powerUps.push(new PowerUp(asteroid.x, asteroid.y, PowerUp.getRandomType()));
                    }

                    this.asteroids.splice(i, 1);
                    this.bullets.splice(j, 1);
                    break;
                }
            }
        }
    }

    private collectPowerUp(powerUp: PowerUp): void {
        const type = powerUp.getType();
        this.powerUpManager.activate(type);
        powerUp.collect();

        // Create collection effect
        const color = type === 'rapidFire' ? '#ff6b35' : type === 'shield' ? '#00d4ff' : '#a3e635';
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(this.player.x, this.player.y, color));
        }
    }

    private spawnAsteroids(): void {
        this.asteroidSpawnTimer++;

        if (this.asteroidSpawnTimer >= this.asteroidSpawnInterval) {
            this.asteroidSpawnTimer = 0;
            this.asteroids.push(Asteroid.spawn(this.canvas));

            if (this.asteroidSpawnInterval > 30) {
                this.asteroidSpawnInterval -= 2;
            }
        }
    }

    private createExplosion(x: number, y: number, color: string): void {
        for (let i = 0; i < 20; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    private endGame(): void {
        this.gameOver = true;
        this.gameOverElement.style.display = 'block';
    }

    private updateUI(): void {
        this.scoreElement.textContent = this.score.toString();
        this.livesElement.textContent = this.lives.toString();

        // Update power-up indicators
        this.renderPowerUpIndicators();
    }

    private renderPowerUpIndicators(): void {
        if (!this.powerUpsElement) return;

        const activePowerUps = this.powerUpManager.getActivePowerUps();

        // Clear existing indicators
        this.powerUpsElement.innerHTML = '';

        // Add indicators for each active power-up
        for (const powerUp of activePowerUps) {
            const indicator = document.createElement('div');
            indicator.className = 'power-up-indicator';

            const name = this.getPowerUpDisplayName(powerUp.type);
            const seconds = Math.ceil(powerUp.remainingTime / 1000);

            indicator.innerHTML = `
                <span>${name}</span>
                <span class="power-up-timer">${seconds}s</span>
            `;

            this.powerUpsElement.appendChild(indicator);
        }
    }

    private getPowerUpDisplayName(type: PowerUpType): string {
        switch (type) {
            case 'rapidFire': return '⚡ Rapid Fire';
            case 'shield': return '🛡️ Shield';
            case 'multiShot': return '✦ Multi-Shot';
            default: return type;
        }
    }

    private render(): void {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawStars();

        this.player.render(this.ctx);
        this.asteroids.forEach(asteroid => asteroid.render(this.ctx));
        this.bullets.forEach(bullet => bullet.render(this.ctx));
        this.particles.forEach(particle => particle.render(this.ctx));
        this.powerUps.forEach(powerUp => powerUp.render(this.ctx));
    }

    private drawStars(): void {
        this.ctx.fillStyle = '#fff';
        for (let i = 0; i < 100; i++) {
            const x = (i * 137) % this.canvas.width;
            const y = (i * 89) % this.canvas.height;
            const size = (i % 3) + 1;
            const opacity = ((i * 31) % 100) / 100;

            this.ctx.globalAlpha = opacity;
            this.ctx.fillRect(x, y, size, size);
        }
        this.ctx.globalAlpha = 1;
    }
}
