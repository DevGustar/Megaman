export class Player {
    constructor(canvas) {
        this.ctx = canvas.getContext('2d');
        this.width = 32;
        this.height = 40;
        this.baseWidth = 32;
        this.baseHeight = 40;
        this.x = 100;
        this.y = canvas.height - 100;
        this.vx = 0;
        this.vy = 0;
        this.speed = 4;
        this.jumpForce = -10;
        this.gravity = 0.5;
        this.jumpCount = 0;
        this.maxJumps = 2;
        this.isGrounded = false;

        // Sliding mechanics
        this.isSliding = false;
        this.slideTimer = 0;
        this.slideDuration = 25; // frames (approx 0.4s)
        this.slideSpeed = 7;
        this.slideCooldown = 30; // frames
        this.slideCooldownTimer = 0;

        // Shooting mechanics
        this.isCharging = false;
        this.chargeTime = 0;
        this.chargeThreshold = 90; // frames (~1.5s at 60fps)
        this.bullets = [];
        this.color = '#3498db';
        this.direction = 1; // 1 for right, -1 for left

        this.maxHealth = 100;
        this.health = 100;
        this.lastShotTime = 0;
        this.shootInterval = 150; // ms
    }

    update(keys, platforms) {
        // Horizontal Movement (Normal or Sliding)
        if (this.isSliding) {
            this.vx = this.direction * this.slideSpeed;
            this.slideTimer--;
            if (this.slideTimer <= 0) {
                this.isSliding = false;
                this.height = this.baseHeight; // Reset hitbox
                this.y -= this.baseHeight / 2; // Adjust position to avoid being stuck in ground
            }
        } else {
            if (keys['ArrowLeft'] || keys['a']) {
                this.vx = -this.speed;
                this.direction = -1;
            } else if (keys['ArrowRight'] || keys['d']) {
                this.vx = this.speed;
                this.direction = 1;
            } else {
                this.vx = 0;
            }

            // Slide logic: Down + Jump or a dedicated key (Shift)
            const canSlide = this.isGrounded && !this.isSliding && this.slideCooldownTimer <= 0;
            if (canSlide && (keys['ArrowDown'] || keys['s']) && (keys['z'] || keys[' '])) {
                this.startSlide();
            }
        }

        // Gravity and Vertical Movement
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;

        // Collision detection (Simple ground for now)
        this.isGrounded = false;
        if (this.y + this.height > 440) { // Temporary floor at y=440
            this.y = 440 - this.height;
            this.vy = 0;
            this.isGrounded = true;
            this.jumpCount = 0;
        }

        // Handle Jump (Z or Space)
        if (keys['z'] || keys[' ']) {
            if (!this.jumpKeyPressed) {
                this.jump();
                this.jumpKeyPressed = true;
            }
        } else {
            this.jumpKeyPressed = false;
        }

        // Handle Shoot (X)
        if (keys['x']) {
            this.isCharging = true;
            this.chargeTime++;
        } else {
            if (this.isCharging) {
                this.shoot();
                this.isCharging = false;
                this.chargeTime = 0;
            }
        }

        // Update charge UI
        const chargeMeter = document.getElementById('charge-meter');
        if (this.isCharging && this.chargeTime > 30) {
            chargeMeter.classList.add('charging');
            const percent = Math.min(this.chargeTime / this.chargeThreshold, 1);
            chargeMeter.style.height = `${percent * 40}px`;
        } else {
            chargeMeter.classList.remove('charging');
        }

        // Cooldowns
        if (this.slideCooldownTimer > 0) this.slideCooldownTimer--;

        // Update Bullets
        this.bullets.forEach((b, i) => {
            b.x += b.vx;
            if (b.x < 0 || b.x > 800) this.bullets.splice(i, 1);
        });

        // Update UI
        const healthFill = document.getElementById('player-hp');
        healthFill.style.height = `${(this.health / this.maxHealth) * 100}%`;
    }

    jump() {
        if (this.jumpCount < this.maxJumps) {
            this.vy = this.jumpForce;
            this.jumpCount++;
            this.isGrounded = false;
            // Interrupt slide if jumping
            if (this.isSliding) {
                this.isSliding = false;
                this.height = this.baseHeight;
            }
        }
    }

    startSlide() {
        this.isSliding = true;
        this.slideTimer = this.slideDuration;
        this.slideCooldownTimer = this.slideCooldown;
        this.height = this.baseHeight / 2; // Halve height
        this.y += this.baseHeight / 2; // Offset position to stay on ground
    }

    shoot() {
        const now = Date.now();
        const isCharged = this.chargeTime >= this.chargeThreshold;

        if (!isCharged && now - this.lastShotTime < this.shootInterval) return;

        const bullet = {
            x: this.x + (this.direction === 1 ? this.width : 0),
            y: this.y + this.height / 2,
            width: isCharged ? 16 : 8,
            height: isCharged ? 16 : 8,
            vx: this.direction * 8,
            isCharged: isCharged,
            damage: isCharged ? 20 : 10
        };

        this.bullets.push(bullet);
        this.lastShotTime = now;
    }

    draw(cameraX) {
        this.ctx.save();
        this.ctx.translate(this.x - cameraX, this.y);

        const isChargedReady = this.isCharging && this.chargeTime >= this.chargeThreshold;
        let mainColor = isChargedReady ? '#f1c40f' : this.color;

        // Flash if charging
        if (this.isCharging && this.chargeTime > 30 && Math.floor(Date.now() / 100) % 2 === 0) {
            mainColor = '#fff';
        }

        // Helmet/Head
        this.ctx.fillStyle = mainColor;
        this.ctx.fillRect(4, 0, 24, 20); // Top
        this.ctx.fillStyle = '#ecf0f1'; // Skin
        this.ctx.fillRect(8, 8, 16, 12); // Face

        // Eyes
        this.ctx.fillStyle = '#2c3e50';
        const eyeX = this.direction === 1 ? 18 : 6;
        this.ctx.fillRect(eyeX, 10, 4, 6);

        // Body
        this.ctx.fillStyle = mainColor;
        this.ctx.fillRect(4, 20, 24, 15); // Torso
        this.ctx.fillStyle = '#2980b9'; // Undergarment/Joints
        this.ctx.fillRect(8, 35, 16, 5); // Legs

        // Arms (simple)
        this.ctx.fillStyle = mainColor;
        const armX = this.direction === 1 ? 26 : -10;
        this.ctx.fillRect(armX + 2, 22, 10, 8);

        this.ctx.restore();

        // Draw Bullets
        this.ctx.fillStyle = '#f1c40f';
        this.bullets.forEach(b => {
            const bx = b.x - cameraX;
            if (b.isCharged) {
                // Charged Bullet Glow
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#f1c40f';
                this.ctx.beginPath();
                this.ctx.arc(bx + b.width / 2, b.y + b.height / 2, b.width / 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            } else {
                this.ctx.fillRect(bx, b.y, b.width, b.height);
            }
        });
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
    }
}
