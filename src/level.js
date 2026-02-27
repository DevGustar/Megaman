export class Level {
    constructor(canvas) {
        this.ctx = canvas.getContext('2d');
        this.platforms = [
            { x: 0, y: 440, width: 2400, height: 40 }, // Ground
            { x: 400, y: 350, width: 200, height: 20 },
            { x: 700, y: 300, width: 200, height: 20 },
            { x: 1000, y: 250, width: 200, height: 20 },
            { x: 1300, y: 350, width: 200, height: 20 }
        ];

        this.collectibles = [
            { x: 800, y: 410, width: 24, height: 24, type: 'health', collected: false }, // 1/3
            { x: 1600, y: 410, width: 24, height: 24, type: 'health', collected: false }, // 2/3
            { x: 2300, y: 410, width: 24, height: 24, type: 'health', collected: false }  // Before Boss
        ];

        this.checkpoints = [
            { x: 600, y: 390, width: 30, height: 50, active: false },
            { x: 1200, y: 390, width: 30, height: 50, active: false },
            { x: 1800, y: 390, width: 30, height: 50, active: false }
        ];

        this.lastCheckpoint = { x: 100, y: 340 };
        this.bossRoomX = 2200;
        this.cameraX = 0;
    }

    update(player) {
        // Camera logic
        if (player.x > this.cameraX + 400) {
            this.cameraX = Math.min(player.x - 400, 2400 - 800);
        } else if (player.x < this.cameraX + 200) {
            this.cameraX = Math.max(player.x - 200, 0);
        }

        // Collectibles check - heal player 50%
        this.collectibles.forEach(c => {
            if (!c.collected && this.checkCollision(player, c)) {
                c.collected = true;
                player.health = Math.min(player.health + player.maxHealth * 0.5, player.maxHealth);
            }
        });

        // Checkpoints check
        this.checkpoints.forEach(chk => {
            if (this.checkCollision(player, chk)) {
                chk.active = true;
                this.lastCheckpoint = { x: chk.x, y: chk.y };
            }
        });

        // Platform collision logic
        player.platforms = this.platforms;
        this.platforms.forEach(p => {
            if (this.checkCollision(player, p)) {
                // Grounding logic
                if (player.vy > 0 && player.y + player.height - player.vy <= p.y) {
                    player.y = p.y - player.height;
                    player.vy = 0;
                    player.isGrounded = true;
                    player.jumpCount = 0;
                }
            }
        });
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y;
    }

    draw() {
        this.ctx.save();
        this.ctx.translate(-this.cameraX, 0);

        // Draw Platforms
        this.ctx.fillStyle = '#2c3e50';
        this.platforms.forEach(p => this.ctx.fillRect(p.x, p.y, p.width, p.height));

        // Draw Collectibles
        this.ctx.fillStyle = '#2ecc71';
        this.collectibles.forEach(c => {
            if (!c.collected) {
                this.ctx.fillRect(c.x, c.y, c.width, c.height);
                // Pulse effect
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(c.x - 2, c.y - 2, c.width + 4, c.height + 4);
            }
        });

        // Draw Checkpoints
        this.checkpoints.forEach(chk => {
            this.ctx.fillStyle = chk.active ? '#f1c40f' : '#7f8c8d';
            this.ctx.fillRect(chk.x, chk.y, chk.width, chk.height);
        });

        // Draw Boss Door (End of Level)
        this.ctx.fillStyle = '#c0392b';
        this.ctx.fillRect(this.bossRoomX + 180, 340, 20, 100);

        this.ctx.restore();
    }

    respawn(player) {
        player.x = this.lastCheckpoint.x;
        player.y = this.lastCheckpoint.y;
        player.health = player.maxHealth;
        player.vx = 0;
        player.vy = 0;
    }
}
