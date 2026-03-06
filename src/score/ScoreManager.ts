/** High score and game statistics manager with localStorage persistence */

export interface GameStats {
    highScore: number;
    highestWave: number;
    totalGamesPlayed: number;
    totalScoreAccumulated: number;
}

export interface ScoreManagerConfig {
    storageKey?: string;
}

export class ScoreManager {
    private readonly storageKey: string;
    private stats: GameStats;
    private storageAvailable: boolean;

    constructor(config: ScoreManagerConfig = {}) {
        this.storageKey = config.storageKey ?? 'spaceShooterStats';
        this.storageAvailable = this.checkStorageAvailability();
        this.stats = this.loadStats();
    }

    /**
     * Check if localStorage is available and accessible
     */
    private checkStorageAvailability(): boolean {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Load stats from localStorage or return defaults
     */
    private loadStats(): GameStats {
        if (!this.storageAvailable) {
            return this.getDefaultStats();
        }

        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored) as Partial<GameStats>;
                return {
                    highScore: parsed.highScore ?? 0,
                    highestWave: parsed.highestWave ?? 0,
                    totalGamesPlayed: parsed.totalGamesPlayed ?? 0,
                    totalScoreAccumulated: parsed.totalScoreAccumulated ?? 0,
                };
            }
        } catch {
            // Fall through to defaults
        }

        return this.getDefaultStats();
    }

    /**
     * Get default stats object
     */
    private getDefaultStats(): GameStats {
        return {
            highScore: 0,
            highestWave: 0,
            totalGamesPlayed: 0,
            totalScoreAccumulated: 0,
        };
    }

    /**
     * Save current stats to localStorage
     */
    private saveStats(): void {
        if (!this.storageAvailable) {
            return;
        }

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.stats));
        } catch {
            // Silently fail if storage is unavailable
        }
    }

    /**
     * Get current stats
     */
    getStats(): GameStats {
        return { ...this.stats };
    }

    /**
     * Get high score
     */
    getHighScore(): number {
        return this.stats.highScore;
    }

    /**
     * Get highest wave reached
     */
    getHighestWave(): number {
        return this.stats.highestWave;
    }

    /**
     * Get total games played
     */
    getTotalGamesPlayed(): number {
        return this.stats.totalGamesPlayed;
    }

    /**
     * Get total score accumulated across all games
     */
    getTotalScoreAccumulated(): number {
        return this.stats.totalScoreAccumulated;
    }

    /**
     * Check if localStorage is available
     */
    isStorageAvailable(): boolean {
        return this.storageAvailable;
    }

    /**
     * Record a completed game session
     * @param finalScore - The final score of the game
     * @param waveReached - The highest wave reached (optional)
     */
    recordGame(finalScore: number, waveReached = 1): void {
        this.stats.totalGamesPlayed++;
        this.stats.totalScoreAccumulated += finalScore;

        if (finalScore > this.stats.highScore) {
            this.stats.highScore = finalScore;
        }

        if (waveReached > this.stats.highestWave) {
            this.stats.highestWave = waveReached;
        }

        this.saveStats();
    }

    /**
     * Reset all stats to default values
     */
    resetStats(): void {
        this.stats = this.getDefaultStats();
        this.saveStats();
    }

    /**
     * Clear stored data from localStorage
     */
    clearStorage(): void {
        if (this.storageAvailable) {
            try {
                localStorage.removeItem(this.storageKey);
            } catch {
                // Silently fail
            }
        }
        this.stats = this.getDefaultStats();
    }
}

// Singleton instance for global use
let globalScoreManager: ScoreManager | null = null;

/**
 * Get or create the global ScoreManager instance
 */
export function getScoreManager(): ScoreManager {
    if (!globalScoreManager) {
        globalScoreManager = new ScoreManager();
    }
    return globalScoreManager;
}

/**
 * Reset the global ScoreManager instance (useful for testing)
 */
export function resetScoreManager(): void {
    globalScoreManager = null;
}
