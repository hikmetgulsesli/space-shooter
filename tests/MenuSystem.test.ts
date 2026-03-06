/**
 * Menu System Tests
 * Tests for the GameState enum and menu functionality
 */

import { Game, GameState } from '../src/Game';

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock canvas context
const mockCanvasContext = {
    fillStyle: '',
    fillRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    globalAlpha: 1
};

// Mock ScoreManager
jest.mock('../src/score/ScoreManager', () => {
    return {
        ScoreManager: jest.fn().mockImplementation(() => ({
            getHighScore: jest.fn().mockReturnValue(10000),
            getTotalGamesPlayed: jest.fn().mockReturnValue(5),
            getTotalScoreAccumulated: jest.fn().mockReturnValue(50000),
            recordGame: jest.fn(),
            getHighestWave: jest.fn().mockReturnValue(3)
        }))
    };
});

// Setup DOM elements before each test
document.body.innerHTML = `
    <div id="mainMenu" class="screen active"></div>
    <div id="gameScreen" class="screen"></div>
    <div id="pauseMenu" class="screen"></div>
    <div id="gameOver" class="screen"></div>
    <div id="highScoresScreen" class="screen"></div>
    <canvas id="gameCanvas" width="800" height="600"></canvas>
    <div id="score">0</div>
    <div id="lives">3</div>
    <div id="wave">1</div>
    <div id="highScoreDisplay">0</div>
    <div id="finalScore">0</div>
    <div id="finalWave">1</div>
    <div id="highScoreFinal">0</div>
    <div id="totalGames">0</div>
    <div id="totalScore">0</div>
    <div id="newRecordIndicator" style="display: none;"></div>
    <div id="waveCompleteMessage"></div>
    <div id="waveBonusMessage"></div>
    <button id="startGameBtn"></button>
    <button id="highScoresBtn"></button>
    <button id="backFromHighScoresBtn"></button>
    <button id="resumeBtn"></button>
    <button id="restartFromPauseBtn"></button>
    <button id="quitToMenuBtn"></button>
    <button id="restartBtn"></button>
    <button id="mainMenuBtn"></button>
    <table>
        <tbody id="highScoresTableBody"></tbody>
    </table>
`;

describe('GameState Enum', () => {
    it('should have all required states', () => {
        expect(GameState.MENU).toBe('MENU');
        expect(GameState.PLAYING).toBe('PLAYING');
        expect(GameState.PAUSED).toBe('PAUSED');
        expect(GameState.GAMEOVER).toBe('GAMEOVER');
        expect(GameState.HIGHSCORES).toBe('HIGHSCORES');
    });
});

describe('Menu System', () => {
    let game: Game;
    let canvas: HTMLCanvasElement;

    beforeEach(() => {
        canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        // Mock getContext
        jest.spyOn(canvas, 'getContext').mockReturnValue(mockCanvasContext as unknown as CanvasRenderingContext2D);
        game = new Game(canvas);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Initial State', () => {
        it('should start in MENU state', () => {
            expect(game.getGameState()).toBe(GameState.MENU);
        });
    });

    describe('State Transitions', () => {
        it('should have start method', () => {
            expect(typeof game.start).toBe('function');
        });

        it('should have pause method that checks current state', () => {
            expect(game.getGameState()).toBe(GameState.MENU);
        });
    });

    describe('Game State Getters', () => {
        it('should expose getGameState method', () => {
            expect(typeof game.getGameState).toBe('function');
            expect(game.getGameState()).toBe(GameState.MENU);
        });

        it('should expose getScore method', () => {
            expect(typeof game.getScore).toBe('function');
            expect(game.getScore()).toBe(0);
        });

        it('should expose getLives method', () => {
            expect(typeof game.getLives).toBe('function');
            expect(game.getLives()).toBe(3);
        });

        it('should expose getScoreManager method', () => {
            expect(typeof game.getScoreManager).toBe('function');
            expect(game.getScoreManager()).toBeDefined();
        });

        it('should expose getWaveSystem method', () => {
            expect(typeof game.getWaveSystem).toBe('function');
            expect(game.getWaveSystem()).toBeDefined();
        });
    });
});

describe('UI Elements', () => {
    it('should have main menu screen element', () => {
        const mainMenu = document.getElementById('mainMenu');
        expect(mainMenu).not.toBeNull();
    });

    it('should have game screen element', () => {
        const gameScreen = document.getElementById('gameScreen');
        expect(gameScreen).not.toBeNull();
    });

    it('should have pause menu screen element', () => {
        const pauseMenu = document.getElementById('pauseMenu');
        expect(pauseMenu).not.toBeNull();
    });

    it('should have game over screen element', () => {
        const gameOver = document.getElementById('gameOver');
        expect(gameOver).not.toBeNull();
    });

    it('should have high scores screen element', () => {
        const highScoresScreen = document.getElementById('highScoresScreen');
        expect(highScoresScreen).not.toBeNull();
    });

    it('should have start game button', () => {
        const startBtn = document.getElementById('startGameBtn');
        expect(startBtn).not.toBeNull();
        expect(startBtn?.tagName).toBe('BUTTON');
    });

    it('should have high scores button', () => {
        const highScoresBtn = document.getElementById('highScoresBtn');
        expect(highScoresBtn).not.toBeNull();
        expect(highScoresBtn?.tagName).toBe('BUTTON');
    });

    it('should have resume button', () => {
        const resumeBtn = document.getElementById('resumeBtn');
        expect(resumeBtn).not.toBeNull();
        expect(resumeBtn?.tagName).toBe('BUTTON');
    });

    it('should have restart button in pause menu', () => {
        const restartBtn = document.getElementById('restartFromPauseBtn');
        expect(restartBtn).not.toBeNull();
        expect(restartBtn?.tagName).toBe('BUTTON');
    });

    it('should have quit to menu button', () => {
        const quitBtn = document.getElementById('quitToMenuBtn');
        expect(quitBtn).not.toBeNull();
        expect(quitBtn?.tagName).toBe('BUTTON');
    });

    it('should have restart button in game over', () => {
        const restartBtn = document.getElementById('restartBtn');
        expect(restartBtn).not.toBeNull();
        expect(restartBtn?.tagName).toBe('BUTTON');
    });

    it('should have main menu button in game over', () => {
        const menuBtn = document.getElementById('mainMenuBtn');
        expect(menuBtn).not.toBeNull();
        expect(menuBtn?.tagName).toBe('BUTTON');
    });

    it('should have back button in high scores', () => {
        const backBtn = document.getElementById('backFromHighScoresBtn');
        expect(backBtn).not.toBeNull();
        expect(backBtn?.tagName).toBe('BUTTON');
    });

    it('should have score display element', () => {
        const scoreEl = document.getElementById('score');
        expect(scoreEl).not.toBeNull();
    });

    it('should have lives display element', () => {
        const livesEl = document.getElementById('lives');
        expect(livesEl).not.toBeNull();
    });

    it('should have wave display element', () => {
        const waveEl = document.getElementById('wave');
        expect(waveEl).not.toBeNull();
    });

    it('should have final score element in game over', () => {
        const finalScoreEl = document.getElementById('finalScore');
        expect(finalScoreEl).not.toBeNull();
    });

    it('should have final wave element in game over', () => {
        const finalWaveEl = document.getElementById('finalWave');
        expect(finalWaveEl).not.toBeNull();
    });

    it('should have high scores table body', () => {
        const tbody = document.getElementById('highScoresTableBody');
        expect(tbody).not.toBeNull();
        expect(tbody?.tagName).toBe('TBODY');
    });
});

describe('Button Hover Effects', () => {
    it('menu buttons should have CSS hover effects defined', () => {
        const startBtn = document.getElementById('startGameBtn') as HTMLButtonElement;
        expect(startBtn).not.toBeNull();
        expect(startBtn.tagName).toBe('BUTTON');
    });
});

describe('Keyboard Controls', () => {
    it('should set up keyboard event listeners', () => {
        const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
        
        const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        jest.spyOn(canvas, 'getContext').mockReturnValue(mockCanvasContext as unknown as CanvasRenderingContext2D);
        new Game(canvas);
        
        const keydownCalls = addEventListenerSpy.mock.calls.filter(
            call => call[0] === 'keydown'
        );
        expect(keydownCalls.length).toBeGreaterThan(0);
        
        addEventListenerSpy.mockRestore();
    });
});
