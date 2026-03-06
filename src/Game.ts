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
import { WaveSystem } from './waves';

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
    private waveSystem: WaveSystem;

    private score: number = 0;
    private lives: number = 3;
    private gameState: GameState = GameState.MENU;
    private asteroidSpawnTimer: number = 0;
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
    private highScoreFinalElement: HTMLElement;
    private totalGamesElement: HTMLElement;
    private totalScoreElement: HTMLElement;
    private newRecordIndicator: HTMLElement;
    private waveCompleteMessage: HTMLElement;
    private waveBonusMessage: HTMLElement;

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
        this.waveSystem = new WaveSystem();

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
        this.highScoreFinalElement = document.getElementById('highScoreFinal')!;
        this.totalGamesElement = document.getElementById('totalGames')!;
        this.totalScoreElement = document.getElementById('totalScore')!;
        this.newRecordIndicator = document.getElementById('newRecordIndicator')!;
        this.waveCompleteMessage = document.getElementById('waveCompleteMessage')!;
        this.waveBonusMessage = document.getElementById('waveBonusMessage')!;

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
        this.updateHighScoreDisplay();
    }

    private startGame(): void {
        this.resetGame();
        this.gameState = GameState.PLAYING;
        this.showScreen(GameState.PLAYING);
        this.soundManager.startBackgroundMusic();
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    private showHighScores(): void {
        this.gameState = GameState.HIGHSCORES;
        this.renderHighScoresTable();
        this.showScreen(GameState.HIGHSCORES);
    }

    private renderHighScoresTable(): void {
        const tbody = document.getElementById('highScoresTableBody');
        if (!tbody) return;

        // Generate default high scores
        const defaultScores = [
            { rank: 1, name: 'ACE', score: 999999 },
            { rank: 2, name: 'JAX', score: 850000 },
            { rank: 3, name: 'NEO', score: 750000 },
            { rank: 4, name: 'ZED', score: 600000 },
            { rank: 5, name: 'MAX', score: 500000 },
            { rank: 6, name: 'SAM', score: 450000 },
            { rank: 7, name: 'LEO', score: 400000 },
            { rank: 8, name: 'ROY', score: 350000 },
            { rank: 9, name: 'BEN', score: 300000 },
            { rank: 10, name: 'DAN', score: 250000 }
        ];

        const highScore = this.scoreManager.getHighScore();
        const playerInTop10 = highScore > 0 && highScore >= defaultScores[9].score;

        tbody.innerHTML = defaultScores.map((entry, index) => {
            const isTop3 = index < 3;
            const isPlayer = playerInTop10 && highScore === entry.score;
            
            return `
                <tr class="hs-row ${isPlayer ? 'hs-current' : ''}">
                    <td class="hs-rank">
                        <span class="hs-rank-num ${isTop3 ? 'hs-top3' : ''}">${String(entry.rank).padStart(2, '0')}</span>
                        ${isTop3 ? '<span class="hs-trophy">🏆</span>' : ''}
                    </td>
                    <td class="hs-name ${isTop3 ? 'hs-top3-name' : ''}">${entry.name}</td>
                    <td class="hs-score ${isTop3 ? 'hs-top3-score' : ''}">${entry.score.toLocaleString()}</td>
                </tr>
            `;
        }).join('');
    }

    private resetGame(): void {
        this.score = 0;
        this.lives = 3;
        this.asteroids = [];
        this.bullets = [];
        this.particles = [];
        this.powerUps = [];
        this.asteroidSpawnTimer = 0;
        this.powerUpManager.clear();
        this.waveSystem.reset();

        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2, this.powerUpManager);
        this.enemySpawnSystem = new EnemySpawnSystem(this.canvas);

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
        this.soundManager.stopBackgroundMusic();
    }

    private resume(): void {
        if (this.gameState !== GameState.PAUSED) return;
        this.gameState = GameState.PLAYING;
        this.showScreen(GameState.PLAYING);
        this.soundManager.startBackgroundMusic();
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    private returnToMenu(): void {
        this.gameState = GameState.MENU;
        this.showScreen(GameState.MENU);
        this.soundManager.stopBackgroundMusic();
        this.updateHighScoreDisplay();
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
        this.updateWaveSystem();

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
        if (!this.enemySpawnSystem) return;
        this.enemySpawnSystem.update(this.player?.x ?? 0, this.player?.y ?? 0);
    }

    private updatePowerUps(): void {
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.update(this.canvas);
            return powerUp.isActive();
        });
    }

    private updateWaveSystem(): void {
        if (!this.enemySpawnSystem) return;
        
        const activeAsteroids = this.asteroids.length;
        const activeEnemies = this.enemySpawnSystem.getActiveEnemyCount();
        const waveBonus = this.waveSystem.update(activeAsteroids, activeEnemies);
        
        if (waveBonus > 0) {
            this.score += waveBonus;
            this.showWaveCompleteMessage(waveBonus);
            this.soundManager.play('powerUp');
        }

        // Hide message when display duration expires
        if (!this.waveSystem.shouldShowWaveCompleteMessage()) {
            this.hideWaveCompleteMessage();
        }
    }

    private showWaveCompleteMessage(bonus: number): void {
        if (this.waveCompleteMessage) {
            this.waveCompleteMessage.textContent = this.waveSystem.getWaveCompleteMessage();
            this.waveCompleteMessage.style.display = 'block';
        }
        if (this.waveBonusMessage) {
            this.waveBonusMessage.textContent = `+${bonus} BONUS`;
            this.waveBonusMessage.style.display = 'block';
        }
    }

    private hideWaveCompleteMessage(): void {
        if (this.waveCompleteMessage) {
            this.waveCompleteMessage.style.display = 'none';
        }
        if (this.waveBonusMessage) {
            this.waveBonusMessage.style.display = 'none';
        }
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
        const enemies = this.enemySpawnSystem?.getEnemies() ?? [];
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];

            if (this.collisionManager.checkPlayerEnemyCollision(this.player, enemy)) {
                if (this.powerUpManager.useShield()) {
                    this.createExplosion(enemy.x, enemy.y, '#0ff');
                    this.enemySpawnSystem?.removeEnemy(enemy);
                    continue;
                }

                this.lives--;
                this.createExplosion(this.player.x, this.player.y, '#0ff');
                this.soundManager.play('playerDamage');
                this.enemySpawnSystem?.removeEnemy(enemy);

                if (this.lives <= 0) {
                    this.endGame();
                }
                continue;
            }

            for (let j = this.bullets.length - 1; j >= 0; j--) {
                const bullet = this.bullets[j];

                if (this.collisionManager.checkBulletEnemyCollision(bullet, enemy)) {
                    enemy.takeDamage(10);
                    this.bullets.splice(j, 1);

                    if (!enemy.isActive()) {
                        this.score += enemy.getPoints();
                        this.createExplosion(enemy.x, enemy.y, '#ff6b6b');
                        this.soundManager.play('explosionMedium');
                        this.enemySpawnSystem?.removeEnemy(enemy);
                    }
                    break;
                }
            }
        }

        // Check player-enemy bullet collisions
        const enemyBullets = this.enemySpawnSystem?.getBullets() ?? [];
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const enemyBullet = enemyBullets[i];

            if (this.collisionManager.checkPlayerEnemyBulletCollision(this.player, enemyBullet)) {
                if (this.powerUpManager.useShield()) {
                    enemyBullet.deactivate();
                    this.enemySpawnSystem?.removeBullet(enemyBullet);
                    continue;
                }

                this.lives--;
                enemyBullet.deactivate();
                this.enemySpawnSystem?.removeBullet(enemyBullet);
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

        const spawnInterval = this.waveSystem.getAsteroidSpawnInterval();
        if (this.asteroidSpawnTimer >= spawnInterval) {
            this.asteroidSpawnTimer = 0;
            this.asteroids.push(Asteroid.spawn(this.canvas));
        }
    }

    private createExplosion(x: number, y: number, color: string): void {
        for (let i = 0; i < 20; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    private endGame(): void {
        this.gameState = GameState.GAMEOVER;

        // Record game stats
        const wasNewHighScore = this.score > this.scoreManager.getHighScore();
        this.scoreManager.recordGame(this.score, this.waveSystem.getCurrentWave());

        // Update game over screen
        this.finalScoreElement.textContent = this.score.toString();
        this.finalWaveElement.textContent = this.waveSystem.getCurrentWave().toString();
        this.highScoreFinalElement.textContent = this.scoreManager.getHighScore().toString();
        this.totalGamesElement.textContent = this.scoreManager.getTotalGamesPlayed().toString();
        this.totalScoreElement.textContent = this.scoreManager.getTotalScoreAccumulated().toString();

        // Show new record indicator if applicable
        if (wasNewHighScore) {
            this.newRecordIndicator.style.display = 'block';
        } else {
            this.newRecordIndicator.style.display = 'none';
        }

        this.showScreen(GameState.GAMEOVER);
        this.soundManager.play('gameOver');
        this.soundManager.stopBackgroundMusic();
    }

    private updateUI(): void {
        this.scoreElement.textContent = this.score.toString();
        this.livesElement.textContent = this.lives.toString();
        this.waveElement.textContent = this.waveSystem.getCurrentWave().toString();
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
    getWaveSystem(): WaveSystem { return this.waveSystem; }
}
