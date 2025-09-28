const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const player = { x: 300, y: 200, size: 20, speed: 4, trail: [] };
let score = 0;
let health = 100;
let gameStarted = false;
const floatingTexts = []; // for +10 points effects

const instructions = document.getElementById("instructions");
document.getElementById("startButton").onclick = () => {
    instructions.style.display = "none";
    gameStarted = true;
    lastTime = performance.now();
    update();
};

// Orbs array
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

// Difficulty tracking
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
    draw();

    if(health > 0) {
        requestAnimationFrame(update);
    } else {
        endGame();
    }
}

function updateDifficulty(deltaTime) {
    difficultyTimer += deltaTime;
    if(difficultyTimer > 10000) { // every 10 seconds
        difficultyTimer = 0;
        spawnOrb(); // spawn extra orb
        player.speed += 0.2; // slightly faster
        health -= 1; // extra drain
    }
}

function movePlayer() {
    if(keys["ArrowUp"]) player.y -= player.speed;
    if(keys["ArrowDown"]) player.y += player.speed;
    if(keys["ArrowLeft"]) player.x -= player.speed;
    if(keys["ArrowRight"]) player.x += player.speed;

    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

    // Trail
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

            if(orb.special){ // yellow orbs
                // Multiply by random between -5 and +5
                points *= (Math.random()*10 - 5);
                health -= 10; // risk effect
            } else { // blue orbs
                // Multiply by random between 0.5 and 1.5
                points *= (Math.random() + 0.5);
                health -= 2; // normal drain
            }

            score += points;

            // Add floating text
            floatingTexts.push({
                x: orb.x,
                y: orb.y,
                text: points > 0 ? `+${Math.round(points)}` : `${Math.round(points)}`,
                opacity: 1,
                lifetime: Math.random()*5000 // 0–5 seconds
            });

            orbs.splice(i,1);
        }
    }

    health -= 0.05; // constant drain
}

function draw() {
    // background gradient
    const gradient = ctx.createLinearGradient(0,0,0,canvas.height);
    gradient.addColorStop(0, "#111");
    gradient.addColorStop(1, "#222");
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // draw trail
    player.trail.forEach((p,i)=>{
        ctx.fillStyle = `rgba(255,0,127,${i/player.trail.length*0.5})`;
        ctx.beginPath();
        ctx.arc(p.x,p.y,player.size/2,0,Math.PI*2);
        ctx.fill();
    });

    // draw player
    ctx.fillStyle = "#ff007f";
    ctx.beginPath();
    ctx.arc(player.x + player.size/2, player.y + player.size/2, player.size/2,0,Math.PI*2);
    ctx.fill();

    // draw orbs with pulsing effect
    orbs.forEach(orb=>{
        const pulse = Math.sin(Date.now()/200 + orb.x + orb.y)*3;
        ctx.fillStyle = orb.special ? "#ffff00" : "#00ffe0";
        ctx.fillRect(orb.x, orb.y, orb.size + pulse, orb.size + pulse);
    });

    // draw floating text
    for(let i=floatingTexts.length-1;i>=0;i--){
        const t = floatingTexts[i];
        ctx.fillStyle = `rgba(255,255,255,${t.opacity})`;
        ctx.font = "16px monospace";
        ctx.fillText(t.text, t.x, t.y);
        t.y -= 0.5; // move up slowly
        t.opacity -= 0.005;
        t.lifetime -= 16;
        if(t.opacity <= 0 || t.lifetime <=0){
            floatingTexts.splice(i,1);
        }
    }

    // health bar
    ctx.fillStyle = `rgb(${255 - health*2.5}, ${health*2.5}, 0)`;
    ctx.fillRect(10,10, health*2, 20);
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(10,10,200,20);

    // score
    document.getElementById("score").textContent = `Score: ${score}  Health: ${Math.round(health)}`;
}

function endGame() {
    gameStarted = false;
    canvas.style.display = "none";
    document.getElementById("score").style.display = "none";

    const endScreen = document.createElement("div");
    endScreen.style.position = "absolute";
    endScreen.style.top = "50%";
    endScreen.style.left = "50%";
    endScreen.style.transform = "translate(-50%,-50%)";
    endScreen.style.color = "#ff007f";
    endScreen.style.fontSize = "32px";
    endScreen.style.textAlign = "center";
    endScreen.style.fontFamily = "monospace";
    endScreen.innerHTML = `
        Game Over!<br>
        Final Score: ${score}<br>
        Refresh the page to play again.
    `;
    document.body.appendChild(endScreen);
}