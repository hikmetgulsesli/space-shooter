import { Player } from '../entities/Player';
import { Asteroid } from '../entities/Asteroid';
import { Bullet } from '../entities/Bullet';

export class CollisionManager {
    public checkPlayerAsteroidCollision(player: Player, asteroid: Asteroid): boolean {
        const dx = player.x - asteroid.x;
        const dy = player.y - asteroid.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < player.getRadius() + asteroid.getRadius();
    }

    public checkBulletAsteroidCollision(bullet: Bullet, asteroid: Asteroid): boolean {
        const dx = bullet.x - asteroid.x;
        const dy = bullet.y - asteroid.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < bullet.getRadius() + asteroid.getRadius();
    }
}
