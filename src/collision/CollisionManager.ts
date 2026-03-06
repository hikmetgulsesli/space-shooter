import { Player } from '../entities/Player';
import { Asteroid } from '../entities/Asteroid';
import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/enemies/Enemy';
import { EnemyBullet } from '../entities/enemies/EnemyBullet';

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

    public checkPlayerEnemyCollision(player: Player, enemy: Enemy): boolean {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < player.getRadius() + enemy.getRadius();
    }

    public checkBulletEnemyCollision(bullet: Bullet, enemy: Enemy): boolean {
        const dx = bullet.x - enemy.x;
        const dy = bullet.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < bullet.getRadius() + enemy.getRadius();
    }

    public checkPlayerEnemyBulletCollision(player: Player, enemyBullet: EnemyBullet): boolean {
        const dx = player.x - enemyBullet.x;
        const dy = player.y - enemyBullet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < player.getRadius() + enemyBullet.getRadius();
    }
}
