import { Player } from './player.js';
import { Level } from './level.js';
import { Boss } from './boss.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = 'playing'; // 'playing', 'win', 'game-over'
let player = new Player(canvas);
let level = new Level(canvas);
let boss = new Boss(canvas);

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => (keys[e.key.toLowerCase()] = true));
window.addEventListener('keyup', (e) => (keys[e.key.toLowerCase()] = false));

function update() {
    if (gameState !== 'playing') return;

    player.update(keys, level.platforms);
    level.update(player);
    boss.update(player, level.cameraX);

    // Collision Player Bullets vs Boss
    player.bullets.forEach((b, i) => {
        if (level.checkCollision(b, boss)) {
            boss.takeDamage(b.damage);
            player.bullets.splice(i, 1);
        }
    });

    // Check Boss Activation
    const bossHud = document.getElementById('boss-hud');
    if (player.x > level.bossRoomX) {
        bossHud.style.display = 'flex';
    }

    // Game states
    if (player.health <= 0) {
        level.respawn(player);
    }

    if (boss.health <= 0) {
        gameState = 'win';
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dynamic Background
    const scrollFactor = level.cameraX * 0.2;
    ctx.fillStyle = '#161b22';
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(-scrollFactor + i * 400, 100, 200, 200);
    }

    level.draw();
    boss.draw(level.cameraX);
    player.draw(level.cameraX);

    if (gameState === 'win') {
        drawMessage('MISSION ACCOMPLISHED!', '#2ecc71');
    } else if (gameState === 'game-over') {
        drawMessage('GAME OVER', '#e74c3c');
    }

    requestAnimationFrame(gameLoop);
}

function drawMessage(text, color) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = color;
    ctx.font = '24px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = '#fff';
    ctx.font = '12px "Press Start 2P"';
    ctx.fillText('PRESS F5 TO RESTART', canvas.width / 2, canvas.height / 2 + 50);
}

function gameLoop() {
    update();
    draw();
}

// Ensure the game starts when imports are ready
gameLoop();
