import { Player } from './entities/Player';
import { Asteroid } from './entities/Asteroid';
import { Bullet, bulletPool } from './entities/Bullet';
import { Particle, particlePool } from './effects/Particle';
import { InputHandler } from './input/InputHandler';
import { CollisionManager } from './collision/CollisionManager';
import { PowerUp, PowerUpManager, PowerUpType } from './entities/PowerUp';
import { SoundManager } from './audio/SoundManager';
import { FPSCounter } from './utils/FPSCounter';
import { LoadingScreen } from './utils/LoadingScreen';

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
    HIGHSCORES = 'HIGHSCORES',
    LOADING = 'LOADING'
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
    private fpsCounter: FPSCounter;
    private loadingScreen: LoadingScreen | null = null;

    private score: number = 0;
    private lives: number = 3;
    private gameState: GameState = GameState.LOADING;
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
    private powerUpsElement: HTMLElement | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        this.ctx = ctx;

        this.inputHandler = new InputHandler();
        this.collisionManager = new CollisionManager(true); // Enable spatial grid
        this.powerUpManager = new PowerUpManager();
        this.soundManager = new SoundManager();
        this.fpsCounter = new FPSCounter();

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
        this.powerUpsElement = document.getElementById('powerUps');

        this.setupEventListeners();
        this.setupMuteButton();
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

        // Initialize audio on first user interaction
        const initAudio = (): void => {
            this.soundManager.init();
            this.soundManager.startBackgroundMusic();
            window.removeEventListener('click', initAudio);
            window.removeEventListener('keydown', initAudio);
        };
        window.addEventListener('click', initAudio);
        window.addEventListener('keydown', initAudio);
    }

    private setupMuteButton(): void {
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
            this.updateMuteButtonState(muteBtn);
            muteBtn.addEventListener('click', () => {
                this.soundManager.toggleMute();
                this.updateMuteButtonState(muteBtn);
            });
        }
    }

    private updateMuteButtonState(button: HTMLElement): void {
        const isMuted = this.soundManager.getIsMuted();
        button.classList.toggle('muted', isMuted);
        button.setAttribute('aria-label', isMuted ? 'Unmute audio' : 'Mute audio');
        button.textContent = isMuted ? '🔇' : '🔊';
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

    public async start(): Promise<void> {
        // Show loading screen
        this.loadingScreen = new LoadingScreen();
        
        // Simulate initialization tasks
        await this.loadingScreen.simulateLoading([
            () => this.initializePool(),
            () => this.initializeCollisionSystem(),
            () => this.initializeInputSystem(),
        ]);

        this.gameState = GameState.MENU;
        this.showScreen(GameState.MENU);
    }

    private async initializePool(): Promise<void> {
        // Pre-warm object pools
        for (let i = 0; i < 50; i++) {
            bulletPool.release(bulletPool.acquire());
        }
        for (let i = 0; i < 100; i++) {
            particlePool.release(particlePool.acquire());
        }
        return Promise.resolve();
    }

    private async initializeCollisionSystem(): Promise<void> {
        // Collision system is ready
        return Promise.resolve();
    }

    private async initializeInputSystem(): Promise<void> {
        // Input system is ready
        return Promise.resolve();
    }

    private startGame(): void {
        this.resetGame();
        this.gameState = GameState.PLAYING;
        this.showScreen(GameState.PLAYING);
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
        
        // Return bullets to pool
        this.bullets.forEach(b => bulletPool.release(b));
        this.bullets = [];
        
        // Return particles to pool
        this.particles.forEach(p => particlePool.release(p));
        this.particles = [];
        
        this.asteroids = [];
        this.powerUps = [];
        this.asteroidSpawnTimer = 0;
        this.asteroidSpawnInterval = 120;
        this.powerUpManager.clear();

        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2, this.powerUpManager);

        this.updateUI();
        this.soundManager.startBackgroundMusic();
    }

    private restart(): void {
        this.startGame();
    }

    private pause(): void {
        if (this.gameState !== GameState.PLAYING) return;
        this.gameState = GameState.PAUSED;
        this.showScreen(GameState.PAUSED);
    }

    private resume(): void {
        if (this.gameState !== GameState.PAUSED) return;
        this.gameState = GameState.PLAYING;
        this.showScreen(GameState.PLAYING);
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    private returnToMenu(): void {
        this.gameState = GameState.MENU;
        this.showScreen(GameState.MENU);
    }

    private gameLoop(): void {
        if (this.gameState !== GameState.PLAYING) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        this.update(deltaTime);
        this.render();
        this.fpsCounter.update();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    private update(deltaTime: number): void {
        if (!this.player) return;

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
        // Update bullets and return inactive ones to pool
        let writeIndex = 0;
        for (const bullet of this.bullets) {
            bullet.update();
            if (bullet.isActive(this.canvas)) {
                this.bullets[writeIndex++] = bullet;
            } else {
                bulletPool.release(bullet);
            }
        }
        this.bullets.length = writeIndex;
    }

    private updateParticles(): void {
        // Update particles and return inactive ones to pool
        let writeIndex = 0;
        for (const particle of this.particles) {
            particle.update();
            if (particle.isActive()) {
                this.particles[writeIndex++] = particle;
            } else {
                particlePool.release(particle);
            }
        }
        this.particles.length = writeIndex;
    }

    private updatePowerUps(): void {
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.update(this.canvas);
            return powerUp.isActive();
        });
    }

    private checkCollisions(): void {
        if (!this.player) return;

        // Build spatial grid for this frame
        this.collisionManager.buildSpatialGrid(this.player, this.asteroids);

        // Check player-powerup collisions
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (powerUp.checkCollision(this.player.x, this.player.y, this.player.getRadius())) {
                this.collectPowerUp(powerUp);
                this.powerUps.splice(i, 1);
            }
        }

        // Get spatial grid candidates for efficient collision detection
        const playerAsteroidCandidates = this.collisionManager.getAsteroidsNearPlayer(this.player);
        const bulletAsteroidCandidates: Map<number, number[]> = new Map();
        for (let j = 0; j < this.bullets.length; j++) {
            bulletAsteroidCandidates.set(j, this.collisionManager.getAsteroidsNearBullet(this.bullets[j]));
        }

        // Check player-asteroid collisions using spatial grid
        const asteroidsToCheck = playerAsteroidCandidates.length > 0 
            ? playerAsteroidCandidates 
            : this.asteroids.map((_, i) => i);
        
        for (const i of asteroidsToCheck) {
            if (i >= this.asteroids.length) continue;
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
        }

        // Check bullet-asteroid collisions using spatial grid
        for (let j = this.bullets.length - 1; j >= 0; j--) {
            const bullet = this.bullets[j];
            const candidateIndices = bulletAsteroidCandidates.get(j) || [];
            const asteroidsToCheckForBullet = candidateIndices.length > 0 
                ? candidateIndices 
                : this.asteroids.map((_, i) => i);

            for (const i of asteroidsToCheckForBullet) {
                if (i >= this.asteroids.length) continue;
                const asteroid = this.asteroids[i];

                if (this.collisionManager.checkBulletAsteroidCollision(bullet, asteroid)) {
                    this.score += asteroid.getPoints();
                    this.createExplosion(asteroid.x, asteroid.y, '#888');
                    this.playExplosionSound(asteroid);

                    // Spawn power-up with 15% chance
                    if (PowerUp.shouldSpawn()) {
                        this.powerUps.push(new PowerUp(asteroid.x, asteroid.y, PowerUp.getRandomType()));
                    }

                    this.asteroids.splice(i, 1);
                    
                    // Return bullet to pool
                    bulletPool.release(this.bullets[j]);
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
        this.soundManager.play('powerUp');

        // Create collection effect using PowerUp.COLORS
        const color = PowerUp.COLORS[type];
        for (let i = 0; i < 10; i++) {
            const particle = particlePool.acquire();
            particle.reset(this.player?.x ?? 0, this.player?.y ?? 0, color);
            this.particles.push(particle);
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
            const particle = particlePool.acquire();
            particle.reset(x, y, color);
            this.particles.push(particle);
        }
    }

    private endGame(): void {
        this.gameState = GameState.GAMEOVER;
        this.finalScoreElement.textContent = this.score.toString();
        this.showScreen(GameState.GAMEOVER);
        this.soundManager.play('gameOver');
        this.soundManager.stopBackgroundMusic();
    }

    private updateUI(): void {
        this.scoreElement.textContent = this.score.toString();
        this.livesElement.textContent = this.lives.toString();
        this.waveElement.textContent = '1';
        this.renderPowerUpIndicators();
    }

    private renderPowerUpIndicators(): void {
        if (!this.powerUpsElement) return;

        const activePowerUps = this.powerUpManager.getActivePowerUps();

        // Clear existing indicators safely
        this.powerUpsElement.textContent = '';

        // Add indicators for each active power-up
        for (const powerUp of activePowerUps) {
            const indicator = document.createElement('div');
            indicator.className = 'power-up-indicator';

            const name = this.getPowerUpDisplayName(powerUp.type);
            const seconds = Math.ceil(powerUp.remainingTime / 1000);

            const nameSpan = document.createElement('span');
            nameSpan.textContent = `${name} `;

            const timerSpan = document.createElement('span');
            timerSpan.className = 'power-up-timer';
            timerSpan.textContent = `${seconds}s`;

            indicator.appendChild(nameSpan);
            indicator.appendChild(timerSpan);

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
    getFPSCounter(): FPSCounter { return this.fpsCounter; }
    getCollisionManager(): CollisionManager { return this.collisionManager; }
    getBulletCount(): number { return this.bullets.length; }
    getParticleCount(): number { return this.particles.length; }
}