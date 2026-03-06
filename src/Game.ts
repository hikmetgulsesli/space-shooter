import { Player } from './entities/Player';
import { Asteroid } from './entities/Asteroid';
import { Bullet } from './entities/Bullet';
import { Particle } from './effects/Particle';
import { InputHandler } from './input/InputHandler';
import { CollisionManager } from './collision/CollisionManager';
import { PowerUp, PowerUpManager } from './entities/PowerUp';

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

    private score: number = 0;
    private lives: number = 3;
    private gameState: GameState = GameState.MENU;
    private asteroidSpawnTimer: number = 0;
    private asteroidSpawnInterval: number = 120;
    private lastFrameTime: number = 0;

    // UI Elements
    private mainMenuScreen: HTMLElement;
    private gameScreen: HTMLElement;
    private pauseMenuScreen: HTMLElement;
    private gameOverScreen: HTMLElement;
    private highScoresScreen: HTMLElement;
    private scoreElement: HTMLElement;
    private livesElement: HTMLElement;
    private waveElement: HTMLElement;
    private highScoreDisplay: HTMLElement;
    private finalScoreElement: HTMLElement;
    private finalWaveElement: HTMLElement;
    private waveCompleteMessage: HTMLElement;
    private waveBonusMessage: HTMLElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        this.ctx = ctx;

        this.inputHandler = new InputHandler(canvas);
        this.collisionManager = new CollisionManager();
        this.powerUpManager = new PowerUpManager();

        // Get UI elements
        this.mainMenuScreen = document.getElementById('mainMenu')!;
        this.gameScreen = document.getElementById('gameScreen')!;
        this.pauseMenuScreen = document.getElementById('pauseMenu')!;
        this.gameOverScreen = document.getElementById('gameOver')!;
        this.highScoresScreen = document.getElementById('highScoresScreen')!;
        this.scoreElement = document.getElementById('score')!;
        this.livesElement = document.getElementById('lives')!;
        this.waveElement = document.getElementById('wave')!;
        this.highScoreDisplay = document.getElementById('highScoreDisplay')!;
        this.finalScoreElement = document.getElementById('finalScore')!;
        this.finalWaveElement = document.getElementById('finalWave')!;
        this.waveCompleteMessage = document.getElementById('waveCompleteMessage')!;
        this.waveBonusMessage = document.getElementById('waveBonusMessage')!;

        this.setupEventListeners();
        this.setupButtonListeners();
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
    }

    private setupButtonListeners(): void {
        // Main menu buttons
        const startGameBtn = document.getElementById('startGameBtn');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => this.startGame());
        }

        const highScoresBtn = document.getElementById('highScoresBtn');
        if (highScoresBtn) {
            highScoresBtn.addEventListener('click', () => this.showHighScores());
        }

        const backFromHighScoresBtn = document.getElementById('backFromHighScoresBtn');
        if (backFromHighScoresBtn) {
            backFromHighScoresBtn.addEventListener('click', () => this.returnToMenu());
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

    private showScreen(screen: GameState): void {
        this.mainMenuScreen.classList.remove('active');
        this.gameScreen.classList.remove('active');
        this.pauseMenuScreen.classList.remove('active');
        this.gameOverScreen.classList.remove('active');
        this.highScoresScreen.classList.remove('active');

        switch (screen) {
            case GameState.MENU:
                this.mainMenuScreen.classList.add('active');
                break;
            case GameState.PLAYING:
                this.gameScreen.classList.add('active');
                break;
            case GameState.PAUSED:
                this.gameScreen.classList.add('active');
                this.pauseMenuScreen.classList.add('active');
                break;
            case GameState.GAMEOVER:
                this.gameScreen.classList.add('active');
                this.gameOverScreen.classList.add('active');
                break;
            case GameState.HIGHSCORES:
                this.highScoresScreen.classList.add('active');
                break;
        }
    }

    public start(): void {
        this.showScreen(GameState.MENU);
    }

    private startGame(): void {
        this.resetGame();
        this.gameState = GameState.PLAYING;
        this.showScreen(GameState.PLAYING);
        this.inputHandler.showTouchControls(true);
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    private showHighScores(): void {
        this.gameState = GameState.HIGHSCORES;
        this.showScreen(GameState.HIGHSCORES);
    }

    private resetGame(): void {
        this.score = 0;
        this.lives = 3;
        this.asteroids = [];
        this.bullets = [];
        this.particles = [];
        this.powerUps = [];
        this.asteroidSpawnTimer = 0;
        this.asteroidSpawnInterval = 120;
        this.powerUpManager.clear();

        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2, this.powerUpManager);

        this.updateUI();
        this.hideWaveCompleteMessage();
    }

    private restart(): void {
        this.startGame();
    }

    private pause(): void {
        if (this.gameState !== GameState.PLAYING) return;
        this.gameState = GameState.PAUSED;
        this.showScreen(GameState.PAUSED);
        this.inputHandler.showTouchControls(false);
    }

    private resume(): void {
        if (this.gameState !== GameState.PAUSED) return;
        this.gameState = GameState.PLAYING;
        this.showScreen(GameState.PLAYING);
        this.inputHandler.showTouchControls(true);
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    private returnToMenu(): void {
        this.gameState = GameState.MENU;
        this.showScreen(GameState.MENU);
        this.inputHandler.showTouchControls(false);
    }

    private gameLoop(): void {
        if (this.gameState !== GameState.PLAYING) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        this.update(deltaTime);
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    private update(deltaTime: number): void {
        if (!this.player) return;

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
        if (!this.player) return;

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
                    this.bullets.splice(j, 1);
                    
                    const isDestroyed = asteroid.takeHit();
                    
                    if (isDestroyed) {
                        this.score += asteroid.getPoints();
                        this.createExplosion(asteroid.x, asteroid.y, '#888');

                        // Break apart if not small
                        const fragments = asteroid.breakApart();
                        this.asteroids.push(...fragments);

                        // Spawn power-up with 15% chance
                        if (PowerUp.shouldSpawn()) {
                            this.powerUps.push(new PowerUp(asteroid.x, asteroid.y, PowerUp.getRandomType()));
                        }

                        this.asteroids.splice(i, 1);
                    } else {
                        // Tank asteroid hit but not destroyed - visual feedback
                        this.createExplosion(asteroid.x, asteroid.y, '#6699ff');
                    }
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
            this.particles.push(new Particle(this.player?.x ?? 0, this.player?.y ?? 0, color));
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
        this.gameState = GameState.GAMEOVER;
        this.finalScoreElement.textContent = this.score.toString();
        this.showScreen(GameState.GAMEOVER);
        this.inputHandler.showTouchControls(false);
    }

    private updateUI(): void {
        this.scoreElement.textContent = this.score.toString();
        this.livesElement.textContent = this.lives.toString();
        this.waveElement.textContent = '1';
    }

    private hideWaveCompleteMessage(): void {
        if (this.waveCompleteMessage) {
            this.waveCompleteMessage.style.display = 'none';
        }
        if (this.waveBonusMessage) {
            this.waveBonusMessage.style.display = 'none';
        }
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
    isTouchEnabled(): boolean { return this.inputHandler.isTouchEnabled(); }
}
