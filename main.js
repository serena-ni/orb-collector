document.addEventListener("DOMContentLoaded", () => {
    const startButton = document.getElementById("startButton");
    const instructions = document.getElementById("instructions");
    startButton.onclick = () => {
        instructions.style.display = "none";
        document.querySelector(".center-container").style.display = "none";
        gameStarted = true;
        lastTime = performance.now();
        update();
    };
});

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const player = { x: 300, y: 200, size: 20, speed: 4, trail: [] };
let score = 0;
let health = 100;
let gameStarted = false;
const floatingTexts = [];

const instructions = document.getElementById("instructions");
document.getElementById("startButton").onclick = () => {
    instructions.style.display = "none";
    document.querySelector(".center-container").style.display = "none";
    gameStarted = true;
    lastTime = performance.now();
    update();
};

const orbs = [];
function spawnOrb() {
    orbs.push({
        x: Math.random() * (canvas.width - 20),
        y: Math.random() * (canvas.height - 20),
        size: 15,
        special: Math.random() < 0.3,
        value: 10
    });
}

// initial orbs
for(let i=0;i<10;i++) spawnOrb();

const keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

let difficultyTimer = 0;
let lastTime = 0;

function update() {
    if(!gameStarted) return;

    const now = performance.now();
    const deltaTime = now - lastTime;
    lastTime = now;

    updateDifficulty(deltaTime);
    movePlayer();
    checkCollisions();
    maintainOrbs();
    draw();

    if(health > 0) {
        requestAnimationFrame(update);
    } else {
        endGame();
    }
}

function updateDifficulty(deltaTime) {
    difficultyTimer += deltaTime;
    if(difficultyTimer > 10000) {
        difficultyTimer = 0;
        spawnOrb();
        player.speed += 0.2;
        health -= 1;
    }
}

function movePlayer() {
    if(keys["ArrowUp"]) player.y -= player.speed;
    if(keys["ArrowDown"]) player.y += player.speed;
    if(keys["ArrowLeft"]) player.x -= player.speed;
    if(keys["ArrowRight"]) player.x += player.speed;

    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

    player.trail.push({ x: player.x + player.size/2, y: player.y + player.size/2 });
    if(player.trail.length > 15) player.trail.shift();
}

function checkCollisions() {
    for(let i=orbs.length-1;i>=0;i--){
        const orb = orbs[i];
        const dx = player.x - orb.x;
        const dy = player.y - orb.y;
        if(Math.sqrt(dx*dx + dy*dy) < player.size/2 + orb.size/2){
            let points = orb.value;

            if(orb.special){
                points *= (Math.random() * 20 - 10); // [-10,10]
                health -= 10;
            } else {
                points *= (Math.random() * 3 - 1); // [-1,2]
                health -= 2;
            }

            score += points;

            floatingTexts.push({
                x: orb.x,
                y: orb.y,
                text: points > 0 ? `+${Math.round(points)}` : `${Math.round(points)}`,
                opacity: 1,
                lifetime: Math.random()*5000
            });

            orbs.splice(i,1);
            spawnOrb(); // respawn immediately
        }
    }

    health -= 0.05;
}

function maintainOrbs() {
    while(orbs.length < 10){
        spawnOrb();
    }
}

function draw() {
    const gradient = ctx.createLinearGradient(0,0,0,canvas.height);
    gradient.addColorStop(0, "#111");
    gradient.addColorStop(1, "#222");
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    player.trail.forEach((p,i)=>{
        ctx.fillStyle = `rgba(255,0,127,${i/player.trail.length*0.5})`;
        ctx.beginPath();
        ctx.arc(p.x,p.y,player.size/2,0,Math.PI*2);
        ctx.fill();
    });

    ctx.fillStyle = "#ff007f";
    ctx.beginPath();
    ctx.arc(player.x + player.size/2, player.y + player.size/2, player.size/2,0,Math.PI*2);
    ctx.fill();

    orbs.forEach(orb=>{
        const pulse = Math.sin(Date.now()/200 + orb.x + orb.y)*3;
        ctx.fillStyle = orb.special ? "#ffff00" : "#00ffe0";
        ctx.fillRect(orb.x, orb.y, orb.size + pulse, orb.size + pulse);
    });

    for(let i=floatingTexts.length-1;i>=0;i--){
        const t = floatingTexts[i];
        ctx.fillStyle = `rgba(255,255,255,${t.opacity})`;
        ctx.font = "16px monospace";
        ctx.fillText(t.text, t.x, t.y);
        t.y -= 0.5;
        t.opacity -= 0.005;
        t.lifetime -= 16;
        if(t.lifetime <= 0 || t.opacity <= 0) floatingTexts.splice(i,1);
    }

    document.getElementById("score").textContent = `Score: ${Math.round(score)}  Health: ${Math.round(health)}`;
}

function endGame() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "30px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`Game Over! Final Score: ${Math.round(score)}`, canvas.width/2, canvas.height/2);
}
