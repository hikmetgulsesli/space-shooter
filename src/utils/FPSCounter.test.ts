import { FPSCounter } from '../utils/FPSCounter';

describe('FPSCounter', () => {
    let fpsCounter: FPSCounter;
    let originalLocation: Location;

    beforeEach(() => {
        // Save original location
        originalLocation = window.location;
        
        // Mock URLSearchParams for each test
        jest.spyOn(global, 'URLSearchParams').mockImplementation((url: unknown) => {
            const params = new Map<string, string>();
            if (typeof url === 'string') {
                const matches = url.match(/[?&]([^=&]+)=([^&]*)/g);
                if (matches) {
                    matches.forEach(match => {
                        const [key, value] = match.substring(1).split('=');
                        params.set(key, value);
                    });
                }
            }
            return {
                get: (key: string) => params.get(key) || null,
            } as URLSearchParams;
        });
    });

    afterEach(() => {
        if (fpsCounter) {
            fpsCounter.destroy();
        }
        jest.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should create FPS counter element when dev=true', () => {
            // Override search for this test
            Object.defineProperty(window, 'location', {
                value: { search: '?dev=true' },
                writable: true
            });
            
            fpsCounter = new FPSCounter();
            
            const element = document.getElementById('fps-counter');
            expect(element).not.toBeNull();
            expect(fpsCounter.isEnabled()).toBe(true);
        });

        it('should not create FPS counter element when dev is not set', () => {
            Object.defineProperty(window, 'location', {
                value: { search: '' },
                writable: true
            });
            
            fpsCounter = new FPSCounter();
            
            const element = document.getElementById('fps-counter');
            expect(element).toBeNull();
            expect(fpsCounter.isEnabled()).toBe(false);
        });

        it('should not create FPS counter element when dev=false', () => {
            Object.defineProperty(window, 'location', {
                value: { search: '?dev=false' },
                writable: true
            });
            
            fpsCounter = new FPSCounter();
            
            expect(fpsCounter.isEnabled()).toBe(false);
        });
    });

    describe('update', () => {
        it('should update FPS calculation', () => {
            Object.defineProperty(window, 'location', {
                value: { search: '?dev=true' },
                writable: true
            });
            
            fpsCounter = new FPSCounter();
            
            // Simulate 60 frames in 500ms
            for (let i = 0; i < 60; i++) {
                fpsCounter.update();
            }
            
            // Wait for 500ms update interval
            jest.advanceTimersByTime(500);
            
            const fps = fpsCounter.getFPS();
            expect(fps).toBeGreaterThan(0);
        });

        it('should not crash when disabled', () => {
            Object.defineProperty(window, 'location', {
                value: { search: '' },
                writable: true
            });
            
            fpsCounter = new FPSCounter();
            
            expect(() => {
                fpsCounter.update();
            }).not.toThrow();
        });
    });

    describe('getFPS', () => {
        it('should return 0 initially', () => {
            Object.defineProperty(window, 'location', {
                value: { search: '?dev=true' },
                writable: true
            });
            
            fpsCounter = new FPSCounter();
            expect(fpsCounter.getFPS()).toBe(0);
        });
    });

    describe('destroy', () => {
        it('should remove FPS counter element', () => {
            Object.defineProperty(window, 'location', {
                value: { search: '?dev=true' },
                writable: true
            });
            
            fpsCounter = new FPSCounter();
            expect(document.getElementById('fps-counter')).not.toBeNull();
            
            fpsCounter.destroy();
            expect(document.getElementById('fps-counter')).toBeNull();
        });
    });
});