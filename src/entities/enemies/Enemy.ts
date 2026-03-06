export interface Enemy {
    x: number;
    y: number;
    health: number;
    active: boolean;
    update(playerX: number, playerY: number, canvas: HTMLCanvasElement): void;
    render(ctx: CanvasRenderingContext2D): void;
    takeDamage(damage: number): void;
    getRadius(): number;
    getPoints(): number;
    isActive(): boolean;
}
