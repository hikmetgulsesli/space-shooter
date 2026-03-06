/**
 * Wave System - Manages wave-based progression for the space shooter game
 * 
 * Features:
 * - Wave counter with increasing difficulty
 * - Wave completion detection (all enemies destroyed + timer elapsed)
 * - Wave complete bonus points (100 x wave number)
 * - Spawn rate scaling (capped at 30 interval)
 * - Boss waves every 5th wave with 2x enemy spawn rate
 * - Wave completion message display
 */

export interface WaveConfig {
    /** Starting spawn interval for asteroids */
    initialAsteroidSpawnInterval: number;
    /** Minimum spawn interval cap */
    minAsteroidSpawnInterval: number;
    /** Amount to decrease spawn interval per wave */
    spawnIntervalDecrement: number;
    /** Starting spawn interval for enemies */
    initialEnemySpawnInterval: number;
    /** Minimum enemy spawn interval cap */
    minEnemySpawnInterval: number;
    /** Amount to decrease enemy spawn interval per wave */
    enemySpawnIntervalDecrement: number;
    /** Time to wait after clearing enemies before next wave (ms) */
    waveCompleteDelay: number;
    /** Duration to show wave complete message (ms) */
    messageDisplayDuration: number;
    /** Bonus points per wave number */
    waveBonusMultiplier: number;
    /** Boss wave multiplier for enemy spawn rate */
    bossWaveSpawnMultiplier: number;
    /** Waves between boss waves */
    bossWaveInterval: number;
}

export interface WaveState {
    currentWave: number;
    asteroidSpawnInterval: number;
    enemySpawnInterval: number;
    isWaveComplete: boolean;
    isBossWave: boolean;
    waveCompleteTime: number | null;
    messageDisplayEndTime: number | null;
    waveBonusAwarded: boolean;
}

export const DEFAULT_WAVE_CONFIG: WaveConfig = {
    initialAsteroidSpawnInterval: 120,
    minAsteroidSpawnInterval: 30,
    spawnIntervalDecrement: 10,
    initialEnemySpawnInterval: 300,
    minEnemySpawnInterval: 60,
    enemySpawnIntervalDecrement: 20,
    waveCompleteDelay: 1000,
    messageDisplayDuration: 3000,
    waveBonusMultiplier: 100,
    bossWaveSpawnMultiplier: 2,
    bossWaveInterval: 5
};

export class WaveSystem {
    private config: WaveConfig;
    private state: WaveState;

    constructor(config: Partial<WaveConfig> = {}) {
        this.config = { ...DEFAULT_WAVE_CONFIG, ...config };
        this.state = this.createInitialState();
    }

    private createInitialState(): WaveState {
        return {
            currentWave: 1,
            asteroidSpawnInterval: this.config.initialAsteroidSpawnInterval,
            enemySpawnInterval: this.config.initialEnemySpawnInterval,
            isWaveComplete: false,
            isBossWave: false,
            waveCompleteTime: null,
            messageDisplayEndTime: null,
            waveBonusAwarded: false
        };
    }

    /**
     * Reset the wave system to initial state
     */
    public reset(): void {
        this.state = this.createInitialState();
    }

    /**
     * Get the current wave number
     */
    public getCurrentWave(): number {
        return this.state.currentWave;
    }

    /**
     * Get the current asteroid spawn interval
     */
    public getAsteroidSpawnInterval(): number {
        return this.state.asteroidSpawnInterval;
    }

    /**
     * Get the current enemy spawn interval
     */
    public getEnemySpawnInterval(): number {
        return this.state.enemySpawnInterval;
    }

    /**
     * Check if current wave is a boss wave
     */
    public isBossWave(): boolean {
        return this.state.isBossWave;
    }

    /**
     * Check if the current wave is complete
     */
    public isWaveComplete(): boolean {
        return this.state.isWaveComplete;
    }

    /**
     * Check if wave complete message should be displayed
     */
    public shouldShowWaveCompleteMessage(): boolean {
        if (this.state.messageDisplayEndTime === null) return false;
        return Date.now() < this.state.messageDisplayEndTime;
    }

    /**
     * Update the wave system - check if wave is complete and advance to next wave
     * @param activeAsteroidCount Number of active asteroids on screen
     * @param activeEnemyCount Number of active enemies on screen
     * @returns Wave bonus points if wave just completed, 0 otherwise
     */
    public update(activeAsteroidCount: number, activeEnemyCount: number): number {
        let bonusPoints = 0;

        // Check if wave is complete (no enemies/asteroids and not already complete)
        if (!this.state.isWaveComplete && activeAsteroidCount === 0 && activeEnemyCount === 0) {
            this.state.isWaveComplete = true;
            this.state.waveCompleteTime = Date.now();
            this.state.messageDisplayEndTime = Date.now() + this.config.messageDisplayDuration;
        }

        // Award bonus when wave completes
        if (this.state.isWaveComplete && !this.state.waveBonusAwarded) {
            bonusPoints = this.calculateWaveBonus();
            this.state.waveBonusAwarded = true;
        }

        // Advance to next wave after delay
        if (this.state.isWaveComplete && this.state.waveCompleteTime !== null) {
            const elapsed = Date.now() - this.state.waveCompleteTime;
            if (elapsed >= this.config.waveCompleteDelay + this.config.messageDisplayDuration) {
                this.advanceToNextWave();
            }
        }

        return bonusPoints;
    }

    /**
     * Calculate bonus points for completing current wave
     */
    private calculateWaveBonus(): number {
        return this.state.currentWave * this.config.waveBonusMultiplier;
    }

    /**
     * Advance to the next wave and update difficulty
     */
    private advanceToNextWave(): void {
        this.state.currentWave++;
        this.state.isWaveComplete = false;
        this.state.waveCompleteTime = null;
        this.state.messageDisplayEndTime = null;
        this.state.waveBonusAwarded = false;

        // Update boss wave status
        this.state.isBossWave = this.state.currentWave % this.config.bossWaveInterval === 0;

        // Decrease asteroid spawn interval (increase difficulty)
        this.state.asteroidSpawnInterval = Math.max(
            this.config.minAsteroidSpawnInterval,
            this.state.asteroidSpawnInterval - this.config.spawnIntervalDecrement
        );

        // Decrease enemy spawn interval (increase difficulty)
        let newEnemyInterval = Math.max(
            this.config.minEnemySpawnInterval,
            this.state.enemySpawnInterval - this.config.enemySpawnIntervalDecrement
        );

        // Apply boss wave multiplier
        if (this.state.isBossWave) {
            newEnemyInterval = Math.floor(newEnemyInterval / this.config.bossWaveSpawnMultiplier);
        }

        this.state.enemySpawnInterval = newEnemyInterval;
    }

    /**
     * Get the wave state for display purposes
     */
    public getWaveState(): WaveState {
        return { ...this.state };
    }

    /**
     * Get formatted wave complete message
     */
    public getWaveCompleteMessage(): string {
        if (this.state.isBossWave) {
            return `BOSS WAVE ${this.state.currentWave} COMPLETE!`;
        }
        return `WAVE ${this.state.currentWave} COMPLETE!`;
    }

    /**
     * Get formatted wave start message
     */
    public getWaveStartMessage(): string {
        if (this.state.isBossWave) {
            return `BOSS WAVE ${this.state.currentWave}!`;
        }
        return `WAVE ${this.state.currentWave}`;
    }

    /**
     * Get the bonus amount message for display
     */
    public getBonusMessage(): string {
        return `+${this.calculateWaveBonus()} BONUS`;
    }

    /**
     * Force advance to next wave (for testing/debugging)
     */
    public forceNextWave(): void {
        this.advanceToNextWave();
    }

    /**
     * Set wave directly (for testing)
     */
    public setWave(wave: number): void {
        this.state.currentWave = wave;
        this.state.isWaveComplete = false;
        this.state.waveCompleteTime = null;
        this.state.messageDisplayEndTime = null;
        this.state.waveBonusAwarded = false;
        this.state.isBossWave = wave % this.config.bossWaveInterval === 0;

        // Recalculate spawn intervals based on wave
        const waveDiff = wave - 1;
        this.state.asteroidSpawnInterval = Math.max(
            this.config.minAsteroidSpawnInterval,
            this.config.initialAsteroidSpawnInterval - (waveDiff * this.config.spawnIntervalDecrement)
        );
        
        let enemyInterval = Math.max(
            this.config.minEnemySpawnInterval,
            this.config.initialEnemySpawnInterval - (waveDiff * this.config.enemySpawnIntervalDecrement)
        );
        
        if (this.state.isBossWave) {
            enemyInterval = Math.floor(enemyInterval / this.config.bossWaveSpawnMultiplier);
        }
        
        this.state.enemySpawnInterval = enemyInterval;
    }
}
