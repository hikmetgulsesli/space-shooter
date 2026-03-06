import { LoadingScreen } from './LoadingScreen';

describe('LoadingScreen', () => {
    let loadingScreen: LoadingScreen;

    afterEach(() => {
        if (loadingScreen) {
            const element = document.getElementById('loading-screen');
            if (element) {
                element.remove();
            }
        }
    });

    describe('constructor', () => {
        it('should create loading screen element', () => {
            loadingScreen = new LoadingScreen();
            
            const element = document.getElementById('loading-screen');
            expect(element).not.toBeNull();
            expect(element?.style.display).not.toBe('none');
        });

        it('should have correct styling', () => {
            loadingScreen = new LoadingScreen();
            
            const element = document.getElementById('loading-screen');
            expect(element?.style.position).toBe('fixed');
            expect(element?.style.backgroundColor).toBe('rgb(0, 0, 0)');
        });
    });

    describe('updateProgress', () => {
        beforeEach(() => {
            loadingScreen = new LoadingScreen();
        });

        it('should update progress bar width', () => {
            loadingScreen.updateProgress(50);
            
            const progressBar = document.querySelector('#loading-screen div > div > div') as HTMLElement;
            expect(progressBar).not.toBeNull();
        });

        it('should clamp progress between 0 and 100', () => {
            loadingScreen.updateProgress(-10);
            // Should not throw
            
            loadingScreen.updateProgress(150);
            // Should not throw
        });

        it('should display custom message', () => {
            loadingScreen.updateProgress(75, 'Custom message');
            
            const element = document.getElementById('loading-screen');
            expect(element?.textContent).toContain('Custom message');
        });
    });

    describe('hide', () => {
        beforeEach(() => {
            loadingScreen = new LoadingScreen();
        });

        it('should fade out and remove element', (done) => {
            const element = document.getElementById('loading-screen');
            expect(element).not.toBeNull();
            
            loadingScreen.hide();
            
            // Element should have opacity transition
            expect(element?.style.opacity).toBe('0');
            
            // After transition, element should be removed
            setTimeout(() => {
                expect(document.getElementById('loading-screen')).toBeNull();
                done();
            }, 600);
        });
    });

    describe('simulateLoading', () => {
        beforeEach(() => {
            loadingScreen = new LoadingScreen();
        });

        it('should execute all tasks', async () => {
            const task1 = jest.fn().mockResolvedValue(undefined);
            const task2 = jest.fn().mockResolvedValue(undefined);
            
            await loadingScreen.simulateLoading([task1, task2]);
            
            expect(task1).toHaveBeenCalled();
            expect(task2).toHaveBeenCalled();
        });

        it('should handle task failures gracefully', async () => {
            const failingTask = jest.fn().mockRejectedValue(new Error('Task failed'));
            const successTask = jest.fn().mockResolvedValue(undefined);
            
            // Should not throw even with failing task
            await expect(loadingScreen.simulateLoading([failingTask, successTask])).resolves.not.toThrow();
            
            expect(failingTask).toHaveBeenCalled();
            expect(successTask).toHaveBeenCalled();
        });

        it('should update progress for each task', async () => {
            const tasks = [
                jest.fn().mockResolvedValue(undefined),
                jest.fn().mockResolvedValue(undefined),
                jest.fn().mockResolvedValue(undefined),
            ];
            
            const updateSpy = jest.spyOn(loadingScreen, 'updateProgress');
            
            await loadingScreen.simulateLoading(tasks);
            
            expect(updateSpy).toHaveBeenCalledWith(33.333333333333336, expect.any(String));
            expect(updateSpy).toHaveBeenCalledWith(66.66666666666667, expect.any(String));
            expect(updateSpy).toHaveBeenCalledWith(100, 'Ready!');
        });
    });
});