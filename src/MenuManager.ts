/**
 * Game State Enum
 * Manages the different states of the game
 */
export enum GameState {
    MENU = 'MENU',
    PLAYING = 'PLAYING',
    PAUSED = 'PAUSED',
    GAMEOVER = 'GAMEOVER',
    HIGHSCORES = 'HIGHSCORES',
    SETTINGS = 'SETTINGS'
}

/**
 * High Score Entry
 */
export interface HighScoreEntry {
    rank: number;
    name: string;
    score: number;
}

/**
 * Local Storage Keys
 */
const STORAGE_KEYS = {
    HIGH_SCORES: 'spaceShooter_highScores',
    SETTINGS: 'spaceShooter_settings'
};

/**
 * Menu Manager - Handles all game menu states and UI
 */
export class MenuManager {
    private currentState: GameState = GameState.MENU;
    private onStateChange: (state: GameState) => void;
    private onStartGame: () => void;
    private onResumeGame: () => void;
    private onRestartGame: () => void;
    private onQuitToMenu: () => void;
    private highScores: HighScoreEntry[] = [];
    private finalScore: number = 0;
    private wave: number = 1;
    private isNewHighScore: boolean = false;

    // UI Elements
    private menuScreen: HTMLElement | null = null;
    private pauseScreen: HTMLElement | null = null;
    private gameOverScreen: HTMLElement | null = null;
    private highScoresScreen: HTMLElement | null = null;
    private hudElement: HTMLElement | null = null;
    private canvas: HTMLCanvasElement | null = null;

    constructor(
        onStateChange: (state: GameState) => void,
        onStartGame: () => void,
        onResumeGame: () => void,
        onRestartGame: () => void,
        onQuitToMenu: () => void
    ) {
        this.onStateChange = onStateChange;
        this.onStartGame = onStartGame;
        this.onResumeGame = onResumeGame;
        this.onRestartGame = onRestartGame;
        this.onQuitToMenu = onQuitToMenu;
        
        this.loadHighScores();
        this.createMenuElements();
        this.setupKeyboardHandlers();
    }

    /**
     * Create all menu DOM elements
     */
    private createMenuElements(): void {
        // Create main menu
        this.menuScreen = this.createMainMenu();
        document.body.appendChild(this.menuScreen);

        // Create pause menu
        this.pauseScreen = this.createPauseMenu();
        document.body.appendChild(this.pauseScreen);

        // Create game over screen
        this.gameOverScreen = this.createGameOverScreen();
        document.body.appendChild(this.gameOverScreen);

        // Create high scores screen
        this.highScoresScreen = this.createHighScoresScreen();
        document.body.appendChild(this.highScoresScreen);

        // Get HUD element
        this.hudElement = document.getElementById('gameUI');
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    }

    /**
     * Create Main Menu Screen
     */
    private createMainMenu(): HTMLElement {
        const menu = document.createElement('div');
        menu.id = 'mainMenu';
        menu.className = 'game-menu main-menu';
        menu.innerHTML = `
            <div class="menu-grid-bg"></div>
            <div class="menu-scanlines"></div>
            <div class="menu-space-elements">
                <div class="space-asteroid asteroid-1"></div>
                <div class="space-asteroid asteroid-2"></div>
                <div class="space-asteroid asteroid-3"></div>
                <div class="space-star star-1"></div>
                <div class="space-star star-2"></div>
                <div class="space-star star-3"></div>
            </div>
            <header class="menu-header">
                <div class="header-left">
                    <span class="header-icon">🚀</span>
                    <span class="header-status">SYS_INIT_OK</span>
                </div>
                <div class="header-right">
                    <span>v1.0.4</span>
                    <span class="status-dot"></span>
                </div>
            </header>
            <main class="menu-content">
                <div class="title-container">
                    <div class="corner corner-tl"></div>
                    <div class="corner corner-br"></div>
                    <h1 class="game-title glitch-text" data-text="ASTRO BLASTER">ASTRO BLASTER</h1>
                    <div class="title-underline"></div>
                </div>
                <div class="menu-layout">
                    <div class="menu-buttons">
                        <button class="menu-btn btn-primary" data-action="start">
                            <span class="btn-indicator"></span>
                            <span class="btn-text">NEW GAME</span>
                            <span class="btn-indicator"></span>
                        </button>
                        <button class="menu-btn" data-action="highscores">
                            <span class="btn-indicator"></span>
                            <span class="btn-text">HIGH SCORES</span>
                            <span class="btn-indicator"></span>
                        </button>
                    </div>
                    <div class="controls-panel">
                        <div class="controls-corner controls-tl"></div>
                        <div class="controls-corner controls-tr"></div>
                        <div class="controls-corner controls-bl"></div>
                        <div class="controls-corner controls-br"></div>
                        <div class="controls-header">
                            <span class="controls-icon">⚙️</span>
                            <span class="controls-title">SYS.CONTROLS</span>
                            <span class="controls-version">v1.0.4</span>
                        </div>
                        <div class="controls-content">
                            <div class="control-row">
                                <div class="control-keys">
                                    <kbd>W</kbd>
                                    <div class="control-keys-row">
                                        <kbd>A</kbd>
                                        <kbd>S</kbd>
                                        <kbd>D</kbd>
                                    </div>
                                </div>
                                <div class="control-desc">
                                    <p class="control-name">THRUST VECTORS</p>
                                    <p class="control-detail">N/S/E/W Adjustments</p>
                                </div>
                            </div>
                            <div class="control-row control-fire">
                                <kbd class="control-key-wide">SPACE</kbd>
                                <div class="control-desc">
                                    <p class="control-name">MAIN WEAPON <span class="weapon-indicator"></span></p>
                                    <p class="control-detail">Plasma Caster</p>
                                </div>
                            </div>
                        </div>
                        <div class="controls-footer">
                            <span>STATUS: <span class="status-online">ONLINE</span></span>
                            <span>MEM: 0x4F2A</span>
                        </div>
                    </div>
                </div>
            </main>
            <footer class="menu-footer">
                <span>A.B. ENGINE v2.4 // INITIALIZING...</span>
                <span class="connection-status">&gt; CONNECTION ESTABLISHED</span>
            </footer>
        `;

        // Add event listeners
        const startBtn = menu.querySelector('[data-action="start"]');
        const highScoresBtn = menu.querySelector('[data-action="highscores"]');

        startBtn?.addEventListener('click', () => this.startGame());
        highScoresBtn?.addEventListener('click', () => this.showHighScores());

        return menu;
    }

    /**
     * Create Pause Menu Screen
     */
    private createPauseMenu(): HTMLElement {
        const menu = document.createElement('div');
        menu.id = 'pauseMenu';
        menu.className = 'game-menu pause-menu';
        menu.innerHTML = `
            <div class="pause-blur-bg"></div>
            <div class="pause-overlay"></div>
            <div class="pause-grid"></div>
            <div class="pause-scanlines"></div>
            <div class="pause-container">
                <div class="pause-panel">
                    <div class="pause-corner pause-tl"></div>
                    <div class="pause-corner pause-tr"></div>
                    <div class="pause-corner pause-bl"></div>
                    <div class="pause-corner pause-br"></div>
                    <div class="pause-header">
                        <div class="pause-top-line"></div>
                        <p class="pause-subtitle">System Interrupt // 0x4A2</p>
                        <h2 class="pause-title">PAUSED</h2>
                    </div>
                    <div class="pause-buttons">
                        <button class="pause-btn" data-action="resume">
                            <span class="pause-btn-icon">▶</span>
                            <span class="pause-btn-text">RESUME</span>
                            <span class="pause-btn-key">[ENTER]</span>
                        </button>
                        <button class="pause-btn" data-action="restart">
                            <span class="pause-btn-icon">↻</span>
                            <span class="pause-btn-text">RESTART</span>
                            <span class="pause-btn-key">[R]</span>
                        </button>
                        <button class="pause-btn" data-action="quit">
                            <span class="pause-btn-icon">⏻</span>
                            <span class="pause-btn-text">QUIT TO MENU</span>
                            <span class="pause-btn-key">[ESC]</span>
                        </button>
                    </div>
                    <div class="pause-footer">
                        <span>V.1.04.88</span>
                        <span class="pause-status">
                            <span class="status-dot-pulse"></span>
                            STATUS: OFFLINE
                        </span>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        menu.querySelector('[data-action="resume"]')?.addEventListener('click', () => this.resumeGame());
        menu.querySelector('[data-action="restart"]')?.addEventListener('click', () => this.restartGame());
        menu.querySelector('[data-action="quit"]')?.addEventListener('click', () => this.quitToMenu());

        return menu;
    }

    /**
     * Create Game Over Screen
     */
    private createGameOverScreen(): HTMLElement {
        const screen = document.createElement('div');
        screen.id = 'gameOverScreen';
        screen.className = 'game-menu game-over-screen';
        screen.innerHTML = `
            <div class="go-bg-gradient"></div>
            <div class="go-grid"></div>
            <div class="go-crt"></div>
            <div class="go-content">
                <h1 class="go-title">GAME OVER</h1>
                <div class="go-score-panel">
                    <p class="go-score-label">FINAL SCORE</p>
                    <p class="go-score-value" id="finalScore">0</p>
                    <div class="go-highscore-badge" id="newHighScoreBadge">
                        <span>🏆</span>
                        <span>NEW PERSONAL BEST</span>
                    </div>
                    <div class="go-stats">
                        <div class="go-stat">
                            <span class="go-stat-label">WAVE</span>
                            <span class="go-stat-value" id="finalWave">1</span>
                        </div>
                        <div class="go-stat">
                            <span class="go-stat-label">HIGH SCORE</span>
                            <span class="go-stat-value" id="displayHighScore">0</span>
                        </div>
                    </div>
                </div>
                <div class="go-buttons">
                    <button class="go-btn go-btn-primary" data-action="restart">
                        <span class="go-btn-line-t"></span>
                        <span class="go-btn-line-b"></span>
                        <span class="go-btn-text">TRY AGAIN</span>
                    </button>
                    <button class="go-btn go-btn-secondary" data-action="menu">
                        <span class="go-btn-line-t"></span>
                        <span class="go-btn-line-b"></span>
                        <span class="go-btn-text">MAIN MENU</span>
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        screen.querySelector('[data-action="restart"]')?.addEventListener('click', () => this.restartGame());
        screen.querySelector('[data-action="menu"]')?.addEventListener('click', () => this.quitToMenu());

        return screen;
    }

    /**
     * Create High Scores Screen
     */
    private createHighScoresScreen(): HTMLElement {
        const screen = document.createElement('div');
        screen.id = 'highScoresScreen';
        screen.className = 'game-menu high-scores-screen';
        screen.innerHTML = `
            <div class="hs-bg"></div>
            <div class="hs-crt"></div>
            <div class="hs-content">
                <header class="hs-header">
                    <div class="hs-header-line"></div>
                    <div class="hs-header-box">
                        <span class="hs-icon">🚀</span>
                        <h2 class="hs-title">Astro Blaster</h2>
                    </div>
                </header>
                <div class="hs-heading">
                    <p class="hs-subtitle">Global Rankings</p>
                    <h1 class="hs-main-title">High Scores</h1>
                </div>
                <div class="hs-table-container">
                    <div class="hs-corner hs-corner-tl"></div>
                    <div class="hs-corner hs-corner-br"></div>
                    <table class="hs-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Pilot</th>
                                <th>Score</th>
                            </tr>
                        </thead>
                        <tbody id="highScoresTableBody">
                            <!-- Dynamic content -->
                        </tbody>
                    </table>
                </div>
                <div class="hs-footer">
                    <button class="hs-back-btn" data-action="back">
                        <span>◀</span>
                        <span>Back to Menu</span>
                    </button>
                    <div class="hs-network">
                        <span class="hs-dot"></span>
                        NETWORK: ONLINE
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        screen.querySelector('[data-action="back"]')?.addEventListener('click', () => this.backToMenu());

        return screen;
    }

    /**
     * Setup keyboard handlers
     */
    private setupKeyboardHandlers(): void {
        window.addEventListener('keydown', (e) => {
            const key = e.key;

            switch (this.currentState) {
                case GameState.PLAYING:
                    if (key === 'Escape') {
                        this.pauseGame();
                    }
                    break;

                case GameState.PAUSED:
                    if (key === 'Escape' || key === 'Enter') {
                        this.resumeGame();
                    } else if (key.toLowerCase() === 'r') {
                        this.restartGame();
                    }
                    break;

                case GameState.GAMEOVER:
                    if (key === 'Enter') {
                        this.restartGame();
                    }
                    break;
            }
        });
    }

    /**
     * Get current game state
     */
    public getCurrentState(): GameState {
        return this.currentState;
    }

    /**
     * Set game state and update UI
     */
    private setState(state: GameState): void {
        this.currentState = state;
        this.updateVisibility();
        this.onStateChange(state);
    }

    /**
     * Update visibility of menu elements based on state
     */
    private updateVisibility(): void {
        // Hide all menus first
        if (this.menuScreen) this.menuScreen.style.display = 'none';
        if (this.pauseScreen) this.pauseScreen.style.display = 'none';
        if (this.gameOverScreen) this.gameOverScreen.style.display = 'none';
        if (this.highScoresScreen) this.highScoresScreen.style.display = 'none';
        if (this.hudElement) this.hudElement.style.display = 'none';
        if (this.canvas) {
            this.canvas.style.display = 'none';
            this.canvas.style.filter = 'none';
        }

        // Show based on state
        switch (this.currentState) {
            case GameState.MENU:
                if (this.menuScreen) this.menuScreen.style.display = 'flex';
                break;

            case GameState.PLAYING:
                if (this.canvas) this.canvas.style.display = 'block';
                if (this.hudElement) this.hudElement.style.display = 'block';
                break;

            case GameState.PAUSED:
                if (this.canvas) {
                    this.canvas.style.display = 'block';
                    this.canvas.style.filter = 'blur(4px)';
                }
                if (this.hudElement) this.hudElement.style.display = 'block';
                if (this.pauseScreen) this.pauseScreen.style.display = 'flex';
                break;

            case GameState.GAMEOVER:
                if (this.canvas) {
                    this.canvas.style.display = 'block';
                    this.canvas.style.filter = 'brightness(0.3)';
                }
                if (this.gameOverScreen) this.gameOverScreen.style.display = 'flex';
                break;

            case GameState.HIGHSCORES:
                if (this.highScoresScreen) {
                    this.highScoresScreen.style.display = 'flex';
                    this.renderHighScores();
                }
                break;
        }
    }

    /**
     * Start a new game
     */
    public startGame(): void {
        this.setState(GameState.PLAYING);
        this.onStartGame();
    }

    /**
     * Pause the game
     */
    public pauseGame(): void {
        if (this.currentState === GameState.PLAYING) {
            this.setState(GameState.PAUSED);
        }
    }

    /**
     * Resume the game
     */
    public resumeGame(): void {
        if (this.currentState === GameState.PAUSED) {
            this.setState(GameState.PLAYING);
            this.onResumeGame();
        }
    }

    /**
     * Restart the game
     */
    public restartGame(): void {
        this.setState(GameState.PLAYING);
        this.onRestartGame();
    }

    /**
     * Quit to main menu
     */
    public quitToMenu(): void {
        this.setState(GameState.MENU);
        this.onQuitToMenu();
    }

    /**
     * Show game over screen
     */
    public showGameOver(score: number, wave: number): void {
        this.finalScore = score;
        this.wave = wave;
        this.isNewHighScore = this.checkAndAddHighScore(score);
        
        // Update game over screen with actual values
        const scoreEl = document.getElementById('finalScore');
        const waveEl = document.getElementById('finalWave');
        const highScoreEl = document.getElementById('displayHighScore');
        const badgeEl = document.getElementById('newHighScoreBadge');

        if (scoreEl) scoreEl.textContent = score.toLocaleString();
        if (waveEl) waveEl.textContent = wave.toString();
        if (highScoreEl) highScoreEl.textContent = this.getHighScore().toLocaleString();
        if (badgeEl) {
            badgeEl.style.display = this.isNewHighScore ? 'flex' : 'none';
        }

        this.setState(GameState.GAMEOVER);
    }

    /**
     * Show high scores screen
     */
    public showHighScores(): void {
        this.setState(GameState.HIGHSCORES);
    }

    /**
     * Go back to menu from high scores
     */
    private backToMenu(): void {
        this.setState(GameState.MENU);
    }

    /**
     * Load high scores from local storage
     */
    private loadHighScores(): void {
        const stored = localStorage.getItem(STORAGE_KEYS.HIGH_SCORES);
        if (stored) {
            this.highScores = JSON.parse(stored);
        } else {
            // Default high scores
            this.highScores = [
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
            this.saveHighScores();
        }
    }

    /**
     * Save high scores to local storage
     */
    private saveHighScores(): void {
        localStorage.setItem(STORAGE_KEYS.HIGH_SCORES, JSON.stringify(this.highScores));
    }

    /**
     * Check if score is a new high score and add it
     */
    private checkAndAddHighScore(score: number): boolean {
        const lowestHighScore = this.highScores[this.highScores.length - 1]?.score || 0;
        
        if (score > lowestHighScore) {
            // Add new score and sort
            this.highScores.push({ rank: 0, name: 'YOU', score });
            this.highScores.sort((a, b) => b.score - a.score);
            // Keep only top 10
            this.highScores = this.highScores.slice(0, 10);
            // Update ranks
            this.highScores.forEach((entry, index) => {
                entry.rank = index + 1;
            });
            this.saveHighScores();
            return true;
        }
        return false;
    }

    /**
     * Get the highest score
     */
    public getHighScore(): number {
        return this.highScores[0]?.score || 0;
    }

    /**
     * Render high scores table
     */
    private renderHighScores(): void {
        const tbody = document.getElementById('highScoresTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.highScores.map((entry, index) => {
            const isTop3 = index < 3;
            const isCurrentPlayer = entry.name === 'YOU' && this.isNewHighScore;
            
            return `
                <tr class="hs-row ${isCurrentPlayer ? 'hs-current' : ''}">
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
}
