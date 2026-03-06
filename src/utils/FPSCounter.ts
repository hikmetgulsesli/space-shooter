/**
 * FPS Counter for performance monitoring
 * Only visible when ?dev=true query parameter is present
 */
export class FPSCounter {
    private fps: number = 0;
    private frameCount: number = 0;
    private lastTime: number = performance.now();
    private lastFrameTime: number = performance.now();
    private enabled: boolean = false;
    private element: HTMLElement | null = null;

    constructor() {
        // Check for dev mode query parameter
        const urlParams = new URLSearchParams(window.location.search);
        this.enabled = urlParams.get('dev') === 'true';
        
        if (this.enabled) {
            this.createElement();
        }
    }

    /**
     * Create the FPS display element
     */
    private createElement(): void {
        this.element = document.createElement('div');
        this.element.id = 'fps-counter';
        this.element.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #0ff;
            font-family: monospace;
            font-size: 14px;
            padding: 8px 12px;
            border-radius: 4px;
            border: 1px solid #0ff;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(this.element);
    }

    /**
     * Update FPS counter - call once per frame
     */
    public update(): void {
        if (!this.enabled) return;

        const now = performance.now();
        this.frameCount++;

        // Update FPS every 500ms
        if (now - this.lastTime >= 500) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
            this.frameCount = 0;
            this.lastTime = now;
            
            this.render();
        }

        this.lastFrameTime = now;
    }

    /**
     * Render FPS display
     */
    private render(): void {
        if (!this.element) return;

        const color = this.fps >= 55 ? '#0f0' : this.fps >= 30 ? '#ff0' : '#f00';
        this.element.style.color = color;
        this.element.style.borderColor = color;
        this.element.textContent = `FPS: ${this.fps}`;
    }

    /**
     * Get current FPS
     */
    public getFPS(): number {
        return this.fps;
    }

    /**
     * Check if FPS counter is enabled
     */
    public isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Destroy the FPS counter element
     */
    public destroy(): void {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}