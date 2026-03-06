export class InputHandler {
    private keys: Set<string> = new Set();

    constructor() {
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.key.toLowerCase());
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.key.toLowerCase());
        });
    }

    public isUp(): boolean {
        return this.keys.has('w') || this.keys.has('arrowup');
    }

    public isDown(): boolean {
        return this.keys.has('s') || this.keys.has('arrowdown');
    }

    public isLeft(): boolean {
        return this.keys.has('a') || this.keys.has('arrowleft');
    }

    public isRight(): boolean {
        return this.keys.has('d') || this.keys.has('arrowright');
    }

    public isShooting(): boolean {
        return this.keys.has(' ');
    }
}
