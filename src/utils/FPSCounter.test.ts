import { FPSCounter } from './FPSCounter';

describe('FPSCounter', () => {
    let fpsCounter: FPSCounter;

    afterEach(() => {
        if (fpsCounter) {
            fpsCounter.destroy();
        }
    });

    describe('constructor', () => {
        it('should create FPS counter element when dev=true', () => {
            // Mock location.search
            const originalLocation = window.location;
            Object.defineProperty(window, 'location', {
                value: { search: '?dev=true' },
                writable: true
            });
            
            fpsCounter = new FPSCounter();
            
            const element = document.getElementById('fps-counter');
            expect(element).not.toBeNull();
            expect(fpsCounter.isEnabled()).toBe(true);
            
            // Restore
            Object.defineProperty(window, 'location', {
                value: originalLocation,
                writable: true
            });
        });

        it('should not create FPS counter element when dev is not set', () => {
            const originalLocation = window.location;
            Object.defineProperty(window, 'location', {
                value: { search: '' },
                writable: true
            });
            
            fpsCounter = new FPSCounter();
            
            expect(fpsCounter.isEnabled()).toBe(false);
            
            Object.defineProperty(window, 'location', {
                value: originalLocation,
                writable: true
            });
        });
    });

    describe('update', () => {
        it('should update FPS calculation when enabled', () => {
            const originalLocation = window.location;
            Object.defineProperty(window, 'location', {
                value: { search: '?dev=true' },
                writable: true
            });
            
            fpsCounter = new FPSCounter();
            
            // Simulate frames
            fpsCounter.update();
            fpsCounter.update();
            fpsCounter.update();
            
            // Should not crash
            expect(() => fpsCounter.update()).not.toThrow();
            
            Object.defineProperty(window, 'location', {
                value: originalLocation,
                writable: true
            });
        });
    });

    describe('getFPS', () => {
        it('should return 0 initially', () => {
            fpsCounter = new FPSCounter();
            expect(fpsCounter.getFPS()).toBe(0);
        });
    });

    describe('destroy', () => {
        it('should remove FPS counter element', () => {
            const originalLocation = window.location;
            Object.defineProperty(window, 'location', {
                value: { search: '?dev=true' },
                writable: true
            });
            
            fpsCounter = new FPSCounter();
            expect(document.getElementById('fps-counter')).not.toBeNull();
            
            fpsCounter.destroy();
            expect(document.getElementById('fps-counter')).toBeNull();
            
            Object.defineProperty(window, 'location', {
                value: originalLocation,
                writable: true
            });
        });
    });
});