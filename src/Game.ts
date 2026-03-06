import { Player } from './entities/Player';
import { Asteroid } from './entities/Asteroid';
import { Bullet } from './entities/Bullet';
import { Particle } from './effects/Particle';
import { InputHandler } from './input/InputHandler';
import { CollisionManager } from './collision/CollisionManager';
import { PowerUp, PowerUpManager } from './entities/PowerUp';
import { SoundManager } from './audio/SoundManager';
import { EnemySpawnSystem } from './entities/enemies';
import { ScoreManager } from './score/ScoreManager';

// Constants for asteroid size thresholds
const SMALL_ASTEROID_MAX_RADIUS = 20;
const MEDIUM_ASTEROID_MAX_RADIUS = 32;

/**
 * Game State Enum
 * Defines all possible states of the game
 */
export enum GameState {
    MENU = 'MENU',
    PLAYING = 'PLAYING',
    PAUSED = 'PAUSED',
    GAMEOVER = 'GAMEOVER',
    HIGHSCORES = 'HIGHSCORES'
}

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private player: Player | null = null;
    private asteroids: Asteroid[] = [];
    private bullets: Bullet[] = [];
    private particles: Particle[] = [];
    private powerUps: PowerUp[] = [];
    private inputHandler: InputHandler;
    private collisionManager: CollisionManager;
    private powerUpManager: PowerUpManager;
    private soundManager: SoundManager;
    private enemySpawnSystem: EnemySpawnSystem | null = null;
    private scoreManager: ScoreManager;

    private score: number = 0;
    private lives: number = 3;
    private wave: number = 1;
    private gameState: GameState = GameState.MENU;
    private asteroidSpawnTimer: number = 0;
    private asteroidSpawnInterval: number = 120;
    private lastFrameTime: number = 0;

    // UI Elements
    private mainMenuScreen: HTMLElement;
    private gameScreen: HTMLElement;
    private pauseMenuScreen: HTMLElement;
    private gameOverScreen: HTMLElement;
    private scoreElement: HTMLElement;
    private livesElement: HTMLElement;
    private highScoreDisplay: HTMLElement;
    private finalScoreElement: HTMLElement;
    private highScoreFinalElement: HTMLElement;
    private totalGamesElement: HTMLElement;
    private totalScoreElement: HTMLElement;
    private newRecordIndicator: HTMLElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        this.ctx = ctx;

        this.scoreManager = new ScoreManager();
        this.inputHandler = new InputHandler();
        this.collisionManager = new CollisionManager();
        this.soundManager = new SoundManager();
        this.powerUpManager = new PowerUpManager();

        // Get UI elements
        this.mainMenuScreen = document.getElementById('mainMenu')!;
        this.gameScreen = document.getElementById('gameScreen')!;
        this.pauseMenuScreen = document.getElementById('pauseMenu')!;
        this.gameOverScreen = document.getElementById('gameOver')!;
        this.scoreElement = document.getElementById('score')!;
        this.livesElement = document.getElementById('lives')!;
        this.highScoreDisplay = document.getElementById('highScoreDisplay')!;
        this.finalScoreElement = document.getElementById('finalScore')!;
        this.highScoreFinalElement = document.getElementById('highScoreFinal')!;
        this.totalGamesElement = document.getElementById('totalGames')!;
        this.totalScoreElement = document.getElementById('totalScore')!;
        this.newRecordIndicator = document.getElementById('newRecordIndicator')!;

        this.setupEventListeners();
        this.setupButtonListeners();
        this.updateHighScoreDisplay();
    }

    private setupEventListeners(): void {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'r' && this.gameState === GameState.GAMEOVER) {
                this.restart();
            }
            if (e.key === 'Escape' && this.gameState === GameState.PLAYING) {
                this.pause();
            }
            if (e.key === 'Escape' && this.gameState === GameState.PAUSED) {
                this.resume();
            }
        });

        // Initialize audio on first user interaction
        const initAudio = (): void => {
            this.soundManager.init();
            window.removeEventListener('click', initAudio);
            window.removeEventListener('keydown', initAudio);
        };
        window.addEventListener('click', initAudio);
        window.addEventListener('keydown', initAudio);
    }

    private setupButtonListeners(): void {
        // Main menu buttons
        const startGameBtn = document.getElementById('startGameBtn');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => this.startGame());
        }

        // Pause menu buttons
        const resumeBtn = document.getElementById('resumeBtn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => this.resume());
        }

        const restartFromPauseBtn = document.getElementById('restartFromPauseBtn');
        if (restartFromPauseBtn) {
            restartFromPauseBtn.addEventListener('click', () => this.restart());
        }

        const quitToMenuBtn = document.getElementById('quitToMenuBtn');
        if (quitToMenuBtn) {
            quitToMenuBtn.addEventListener('click', () => this.returnToMenu());
        }

        // Game over buttons
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restart());
        }

        const mainMenuBtn = document.getElementById('mainMenuBtn');
        if (mainMenuBtn) {
            mainMenuBtn.addEventListener('click', () => this.returnToMenu());
        }
    }

    private updateHighScoreDisplay(): void {
        if (this.highScoreDisplay) {
            this.highScoreDisplay.textContent = this.scoreManager.getHighScore().toString();
        }
    }

    private showScreen(screen: GameState): void {
        this.mainMenuScreen.classList.remove('active');
        this.gameScreen.classList.remove('active');
        this.pauseMenuScreen.classList.remove('active');
        this.gameOverScreen.classList.remove('active');

        switch (screen) {
            case 'menu':
                this.mainMenuScreen.classList.add('active');
                break;
            case 'playing':
                this.gameScreen.classList.add('active');
                break;
            case 'paused':
                this.gameScreen.classList.add('active');
                this.pauseMenuScreen.classList.add('active');
                break;
            case 'gameOver':
                this.gameScreen.classList.add('active');
                this.gameOverScreen.classList.add('active');
                break;
        }
    }

    public start(): void {
        this.showScreen('menu');
        this.updateHighScoreDisplay();
    }

    private startGame(): void {
        this.resetGame();
        this.gameState = 'playing';
        this.showScreen('playing');
        this.soundManager.startBackgroundMusic();
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    private resetGame(): void {
        this.score = 0;
        this.lives = 3;
        this.wave = 1;
        this.asteroids = [];
        this.bullets = [];
        this.particles = [];
        this.powerUps = [];
        this.asteroidSpawnTimer = 0;
        this.asteroidSpawnInterval = 120;
        this.powerUpManager.clear();

        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2, this.powerUpManager);
        this.enemySpawnSystem = new EnemySpawnSystem(this.canvas);

        this.updateUI();
    }

    private restart(): void {
        this.startGame();
    }

    private pause(): void {
        if (this.gameState !== 'playing') return;
        this.gameState = 'paused';
        this.showScreen('paused');
        this.soundManager.stopBackgroundMusic();
    }

    private resume(): void {
        if (this.gameState !== 'paused') return;
        this.gameState = 'playing';
        this.showScreen('playing');
        this.soundManager.startBackgroundMusic();
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    private returnToMenu(): void {
        this.gameState = 'menu';
        this.showScreen('menu');
        this.soundManager.stopBackgroundMusic();
        this.updateHighScoreDisplay();
    }

    private gameLoop(): void {
        if (this.gameState !== 'playing') return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        this.update(deltaTime);
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    private update(deltaTime: number): void {
        if (!this.player || !this.enemySpawnSystem) return;

        this.player.update(this.inputHandler, this.canvas);
        this.powerUpManager.update(deltaTime);

        if (this.inputHandler.isShooting() && this.player.canShoot()) {
            const newBullets = this.player.shoot();
            this.bullets.push(...newBullets);
            this.soundManager.play('laser');
        }

        this.updateAsteroids();
        this.updateBullets();
        this.updateParticles();
        this.updatePowerUps();
        this.updateEnemies();
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

    private updateEnemies(): void {
        if (this.enemySpawnSystem && this.player) {
            this.enemySpawnSystem.update(this.player.x, this.player.y);
        }
    }

    private updatePowerUps(): void {
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.update(this.canvas);
            return powerUp.isActive();
        });
    }

    private checkCollisions(): void {
        if (!this.player || !this.enemySpawnSystem) return;

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
                this.soundManager.play('playerDamage');
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
                    this.playExplosionSound(asteroid);

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

        // Check player-enemy and bullet-enemy collisions
        const enemies = this.enemySpawnSystem.getEnemies();
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];

            if (this.collisionManager.checkPlayerAsteroidCollision(this.player, enemy as unknown as Asteroid)) {
                if (this.powerUpManager.useShield()) {
                    this.createExplosion(enemy.x, enemy.y, '#0ff');
                    this.enemySpawnSystem.removeEnemy(enemy);
                    continue;
                }

                this.lives--;
                this.createExplosion(this.player.x, this.player.y, '#0ff');
                this.soundManager.play('playerDamage');
                this.enemySpawnSystem.removeEnemy(enemy);

                if (this.lives <= 0) {
                    this.endGame();
                }
                continue;
            }

            for (let j = this.bullets.length - 1; j >= 0; j--) {
                const bullet = this.bullets[j];

                if (this.collisionManager.checkBulletAsteroidCollision(bullet, enemy as unknown as Asteroid)) {
                    enemy.takeDamage(10);
                    this.bullets.splice(j, 1);

                    if (!enemy.isActive()) {
                        this.score += enemy.getPoints();
                        this.createExplosion(enemy.x, enemy.y, '#ff6b6b');
                        this.soundManager.play('explosionMedium');
                        this.enemySpawnSystem.removeEnemy(enemy);
                    }
                    break;
                }
            }
        }

        // Check player-enemy bullet collisions
        const enemyBullets = this.enemySpawnSystem.getBullets();
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const enemyBullet = enemyBullets[i];

            if (enemyBullet.checkCollision(this.player.x, this.player.y, this.player.getRadius())) {
                if (this.powerUpManager.useShield()) {
                    enemyBullet.deactivate();
                    this.enemySpawnSystem.removeBullet(enemyBullet);
                    continue;
                }

                this.lives--;
                enemyBullet.deactivate();
                this.enemySpawnSystem.removeBullet(enemyBullet);
                this.createExplosion(this.player.x, this.player.y, '#0ff');
                this.soundManager.play('playerDamage');

                if (this.lives <= 0) {
                    this.endGame();
                }
            }
        }
    }

    private collectPowerUp(powerUp: PowerUp): void {
        const type = powerUp.getType();
        this.powerUpManager.activate(type);
        powerUp.collect();
        this.soundManager.play('powerUp');

        // Create collection effect using PowerUp.COLORS
        const color = PowerUp.COLORS[type];
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(this.player?.x ?? 0, this.player?.y ?? 0, color));
        }
    }

    private playExplosionSound(asteroid: Asteroid): void {
        const radius = asteroid.getRadius();
        if (radius <= SMALL_ASTEROID_MAX_RADIUS) {
            this.soundManager.play('explosionSmall');
        } else if (radius <= MEDIUM_ASTEROID_MAX_RADIUS) {
            this.soundManager.play('explosionMedium');
        } else {
            this.soundManager.play('explosionLarge');
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
        this.gameState = 'gameOver';

        // Record game stats
        const wasNewHighScore = this.score > this.scoreManager.getHighScore();
        this.scoreManager.recordGame(this.score, this.wave);

        // Update game over screen
        this.finalScoreElement.textContent = this.score.toString();
        this.highScoreFinalElement.textContent = this.scoreManager.getHighScore().toString();
        this.totalGamesElement.textContent = this.scoreManager.getTotalGamesPlayed().toString();
        this.totalScoreElement.textContent = this.scoreManager.getTotalScoreAccumulated().toString();

        // Show new record indicator if applicable
        if (wasNewHighScore) {
            this.newRecordIndicator.style.display = 'block';
        } else {
            this.newRecordIndicator.style.display = 'none';
        }

        this.showScreen('gameOver');
        this.soundManager.play('gameOver');
        this.soundManager.stopBackgroundMusic();
    }

    private updateUI(): void {
        this.scoreElement.textContent = this.score.toString();
        this.livesElement.textContent = this.lives.toString();
    }

    private render(): void {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawStars();

        this.player?.render(this.ctx);
        this.asteroids.forEach(asteroid => asteroid.render(this.ctx));
        this.bullets.forEach(bullet => bullet.render(this.ctx));
        this.particles.forEach(particle => particle.render(this.ctx));
        this.powerUps.forEach(powerUp => powerUp.render(this.ctx));
        this.enemySpawnSystem?.render(this.ctx);
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

    // Public getters for testing
    getScore(): number { return this.score; }
    getLives(): number { return this.lives; }
    getGameState(): GameState { return this.gameState; }
    getScoreManager(): ScoreManager { return this.scoreManager; }
}
