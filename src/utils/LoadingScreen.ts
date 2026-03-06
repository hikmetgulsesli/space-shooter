/**
 * Loading Screen manager
 * Displays while game assets initialize
 */
export class LoadingScreen {
    private element: HTMLElement | null = null;
    private progressBar: HTMLElement | null = null;
    private progressText: HTMLElement | null = null;

    constructor() {
        this.createElement();
    }

    /**
     * Create the loading screen element
     */
    private createElement(): void {
        this.element = document.createElement('div');
        this.element.id = 'loading-screen';
        this.element.style.cssText = `
            position: fixed;
            inset: 0;
            background: #000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            transition: opacity 0.5s ease;
        `;

        const container = document.createElement('div');
        container.style.cssText = `
            text-align: center;
            color: #0ff;
            font-family: monospace;
        `;

        const title = document.createElement('h1');
        title.textContent = 'ASTRO BLASTER';
        title.style.cssText = `
            font-size: 2.5rem;
            margin-bottom: 2rem;
            text-shadow: 0 0 20px #0ff;
            letter-spacing: 4px;
        `;

        const subtitle = document.createElement('p');
        subtitle.textContent = 'INITIALIZING SYSTEMS...';
        subtitle.style.cssText = `
            font-size: 1rem;
            margin-bottom: 2rem;
            opacity: 0.8;
        `;

        // Progress bar container
        const progressContainer = document.createElement('div');
        progressContainer.style.cssText = `
            width: 300px;
            height: 4px;
            background: rgba(0, 212, 255, 0.2);
            border-radius: 2px;
            overflow: hidden;
            margin-bottom: 1rem;
        `;

        this.progressBar = document.createElement('div');
        this.progressBar.style.cssText = `
            width: 0%;
            height: 100%;
            background: #0ff;
            box-shadow: 0 0 10px #0ff;
            transition: width 0.3s ease;
        `;
        progressContainer.appendChild(this.progressBar);

        this.progressText = document.createElement('p');
        this.progressText.textContent = '0%';
        this.progressText.style.cssText = `
            font-size: 0.875rem;
            opacity: 0.7;
        `;

        container.appendChild(title);
        container.appendChild(subtitle);
        container.appendChild(progressContainer);
        container.appendChild(this.progressText);
        this.element.appendChild(container);

        document.body.appendChild(this.element);
    }

    /**
     * Update loading progress
     * @param progress Progress from 0 to 100
     * @param message Optional status message
     */
    public updateProgress(progress: number, message?: string): void {
        if (!this.progressBar || !this.progressText) return;

        const clampedProgress = Math.max(0, Math.min(100, progress));
        this.progressBar.style.width = `${clampedProgress}%`;
        this.progressText.textContent = message || `${Math.round(clampedProgress)}%`;
    }

    /**
     * Hide and remove the loading screen
     */
    public hide(): void {
        if (!this.element) return;

        this.element.style.opacity = '0';
        
        setTimeout(() => {
            if (this.element) {
                this.element.remove();
                this.element = null;
            }
        }, 500);
    }

    /**
     * Simulate loading with async tasks
     */
    public async simulateLoading(tasks: Array<() => Promise<void>>): Promise<void> {
        const totalTasks = tasks.length;
        
        for (let i = 0; i < tasks.length; i++) {
            const progress = ((i + 1) / totalTasks) * 100;
            this.updateProgress(progress, `Loading module ${i + 1}/${totalTasks}...`);
            
            try {
                await tasks[i]();
            } catch (error) {
                console.warn('Loading task failed:', error);
            }
            
            // Small delay for visual feedback
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.updateProgress(100, 'Ready!');
        await new Promise(resolve => setTimeout(resolve, 300));
        this.hide();
    }
}