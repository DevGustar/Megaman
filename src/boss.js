export class Boss {
    constructor(canvas) {
        this.ctx = canvas.getContext('2d');
        this.width = 32;
        this.height = 40;
        this.x = 2000; // Far end of the level
        this.y = 400; // Near ground
        this.vx = 0;
        this.vy = 0;
        this.speed = 3;
        this.gravity = 0.5;
        this.color = '#e74c3c'; // Red Clone
        this.maxHealth = 200;
        this.health = 200;
        this.bullets = [];
        this.state = 'idle'; // idle, chase, attack, slide
        this.shootTimer = 0;
        this.isGrounded = false;

        // IA Parameters
        this.safeDistance = 250;
        this.aggroThreshold = 0.5; // Slide below 50% HP
        this.direction = -1; // Facing left
    }

    update(player, cameraX) {
        // Gravity
        this.vy += this.gravity;
        this.y += this.vy;

        // Ground collision (Same as player)
        if (this.y + this.height > 440) {
            this.y = 440 - this.height;
            this.vy = 0;
            this.isGrounded = true;
        }

        // Logic based on Distance and Health
        const dx = player.x - this.x;
        this.direction = dx > 0 ? 1 : -1;

        const dist = Math.abs(dx);

        // State Machine logic
        if (dist > this.safeDistance) {
            this.state = 'chase';
        } else {
            this.state = 'attack';
        }

        // Behavior: Chase
        if (this.state === 'chase') {
            this.vx = this.direction * this.speed;
        } else if (this.state === 'attack') {
            this.vx = 0;
        }

        // Behavior: Slide (Aggressiveness below 50% HP)
        if (this.health < this.maxHealth * this.aggroThreshold) {
            if (dist < 100 && this.isGrounded && Math.random() < 0.05) {
                this.state = 'slide';
                this.vx = this.direction * (this.speed * 2.5);
            }
        }

        // Move
        this.x += this.vx;

        // Reactive Jump (30% chance if player jumps)
        if (player.vy < -5 && this.isGrounded && Math.random() < 0.3) {
            this.vy = -10;
        }

        // Shooting logic (0.5s to 2s)
        this.shootTimer++;
        if (this.shootTimer > 60 + Math.random() * 120) {
            this.shoot();
            this.shootTimer = 0;
        }

        // Bullets update
        this.bullets.forEach((b, i) => {
            b.x += b.vx;
            if (b.x < cameraX || b.x > cameraX + 800) this.bullets.splice(i, 1);

            // Player collision
            if (this.checkCollision(b, player)) {
                player.takeDamage(10);
                this.bullets.splice(i, 1);
            }
        });

        // Boss UI update
        const bossHpBar = document.getElementById('boss-hp');
        bossHpBar.style.height = `${(this.health / this.maxHealth) * 100}%`;
    }

    shoot() {
        this.bullets.push({
            x: this.x + (this.direction === 1 ? this.width : 0),
            y: this.y + this.height / 2,
            width: 8,
            height: 8,
            vx: this.direction * 6
        });
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y;
    }

    draw(cameraX) {
        this.ctx.save();
        this.ctx.translate(this.x - cameraX, this.y);

        // Body Elements
        this.ctx.fillStyle = this.color;
        this.ctx.fillRect(4, 0, 24, 20); // Head
        this.ctx.fillStyle = '#fce4ec'; // Pale Face
        this.ctx.fillRect(8, 8, 16, 12);

        this.ctx.fillStyle = '#000'; // Eyes
        const eyeX = this.direction === 1 ? 18 : 6;
        this.ctx.fillRect(eyeX, 10, 4, 6);

        this.ctx.fillStyle = this.color;
        this.ctx.fillRect(4, 20, 24, 15); // Torso
        this.ctx.fillStyle = '#c0392b'; // Darker Red for joints/legs
        this.ctx.fillRect(8, 35, 16, 5);  // Feet

        // Busters
        const armX = this.direction === 1 ? 28 : -10;
        this.ctx.fillStyle = '#c0392b';
        this.ctx.fillRect(armX, 22, 12, 10);

        this.ctx.restore();

        // Draw Bullets
        this.ctx.fillStyle = '#ff5e57';
        this.bullets.forEach(b => {
            this.ctx.fillRect(b.x - cameraX, b.y, b.width, b.height);
        });
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
    }
}
