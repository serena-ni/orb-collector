const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const player = { x: 300, y: 200, size: 20, speed: 4, trail: [] };
let score = 0;
let health = 100;
let gameStarted = false;

const instructions = document.getElementById("instructions");
document.getElementById("startButton").onclick = () => {
    instructions.style.display = "none";
    gameStarted = true;
    update();
};

// Generate orbs
const orbs = [];
for (let i = 0; i < 10; i++) {
    orbs.push({
        x: Math.random() * (canvas.width - 20),
        y: Math.random() * (canvas.height - 20),
        size: 15,
        special: Math.random() < 0.3, // 30% chance to be special
        value: 10
    });
}

const keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

function update() {
    if(!gameStarted) return;

    // Player movement
    if (keys["ArrowUp"]) player.y -= player.speed;
    if (keys["ArrowDown"]) player.y += player.speed;
    if (keys["ArrowLeft"]) player.x -= player.speed;
    if (keys["ArrowRight"]) player.x += player.speed;

    // Keep inside canvas
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

    // Trail effect
    player.trail.push({ x: player.x + player.size/2, y: player.y + player.size/2 });
    if (player.trail.length > 10) player.trail.shift();

    // Check collisions
    for (let i = orbs.length - 1; i >= 0; i--) {
        const orb = orbs[i];
        const dx = player.x - orb.x;
        const dy = player.y - orb.y;
        if (Math.sqrt(dx*dx + dy*dy) < player.size/2 + orb.size/2) {
            if (orb.special) {
                const effect = Math.random();
                if(effect < 0.5) {
                    score += orb.value * 2; // big gain
                } else {
                    score -= orb.value; // penalty
                    health -= 10; // risk
                }
            } else {
                score += orb.value;
                health -= 2; // sacrifice for normal orb
            }
            orbs.splice(i,1);
        }
    }

    health -= 0.05;
    if(health <= 0) {
        alert(`Game Over! Final Score: ${score}`);
        resetGame();
        return;
    }

    draw();
    requestAnimationFrame(update);
}

function draw() {
    // Background gradient
    const gradient = ctx.createLinearGradient(0,0,0,canvas.height);
    gradient.addColorStop(0, "#111");
    gradient.addColorStop(1, "#222");
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Draw trail
    for(let i=0;i<player.trail.length;i++){
        const p = player.trail[i];
        ctx.fillStyle = `rgba(255,0,127,${i/player.trail.length*0.5})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, player.size/2,0,Math.PI*2);
        ctx.fill();
    }

    // Draw player
    ctx.fillStyle = "#ff007f";
    ctx.beginPath();
    ctx.arc(player.x + player.size/2, player.y + player.size/2, player.size/2,0,Math.PI*2);
    ctx.fill();

    // Draw orbs
    orbs.forEach(orb => {
        const pulse = Math.sin(Date.now()/200 + orb.x + orb.y)*3;
        ctx.fillStyle = orb.special ? "#ffff00" : "#00ffe0";
        ctx.fillRect(orb.x, orb.y, orb.size + pulse, orb.size + pulse);
    });

    // Health bar
    ctx.fillStyle = `rgb(${255 - health*2.5}, ${health*2.5}, 0)`;
    ctx.fillRect(10,10, health*2, 20);
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(10,10,200,20);

    // Score
    document.getElementById("score").textContent = `Score: ${score}  Health: ${Math.round(health)}`;
}

function resetGame() {
    player.x = 300;
    player.y = 200;
    score = 0;
    health = 100;
    orbs.length = 0;
    for (let i = 0; i < 10; i++) {
        orbs.push({
            x: Math.random() * (canvas.width - 20),
            y: Math.random() * (canvas.height - 20),
            size: 15,
            special: Math.random() < 0.3,
            value: 10
        });
    }
    gameStarted = false;
    instructions.style.display = "block";
}