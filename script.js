const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 600;
canvas.height = 400;

// player
const player = { x: 300, y: 200, radius: 15, speed: 0.3, vx:0, vy:0, friction: 0.85 };

// game state
let score = 0;
let highscore = localStorage.getItem("orbHighscore") || 0;
let timeLeft = 60;
let level = 1;

let orbs = [];
let hazards = [];
let powerups = [];

const keys = {};
const scoreEl = document.getElementById("score");
const highscoreEl = document.getElementById("highscore");
const timerEl = document.getElementById("timer");
highscoreEl.textContent = `Highscore: ${highscore}`;

// object generators
function generateOrb() {
  return { x: Math.random()*(canvas.width-20)+10, y: Math.random()*(canvas.height-20)+10, radius: 10, value: Math.floor(Math.random()*5)+1, glow: Math.random()*0.5+0.5 };
}

function generateHazard() {
  return { x: Math.random()*(canvas.width-20)+10, y: Math.random()*(canvas.height-20)+10, radius: 12, speed: 0.5+level*0.1 };
}

function generatePowerup() {
  return { x: Math.random()*(canvas.width-20)+10, y: Math.random()*(canvas.height-20)+10, radius: 8, active: true };
}

function initLevel() {
  orbs = Array.from({length: level+3}, generateOrb);
  hazards = Array.from({length: level+1}, generateHazard);
  powerups = level >= 2 ? [generatePowerup()] : [];
}

initLevel();

// input
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

// movement w/ acceleration
function movePlayer() {
  if(keys["ArrowUp"]) player.vy -= player.speed;
  if(keys["ArrowDown"]) player.vy += player.speed;
  if(keys["ArrowLeft"]) player.vx -= player.speed;
  if(keys["ArrowRight"]) player.vx += player.speed;

  player.vx *= player.friction;
  player.vy *= player.friction;

  player.x += player.vx;
  player.y += player.vy;

  // boundary
  if(player.x < player.radius) player.x = player.radius;
  if(player.x > canvas.width - player.radius) player.x = canvas.width - player.radius;
  if(player.y < player.radius) player.y = player.radius;
  if(player.y > canvas.height - player.radius) player.y = canvas.height - player.radius;
}

// hazards move slowly toward player
function moveHazards() {
  hazards.forEach(h => {
    const dx = player.x - h.x;
    const dy = player.y - h.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if(dist > 0){
      h.x += (dx/dist) * h.speed;
      h.y += (dy/dist) * h.speed;
    }
  });
}

// collision
function checkCollision(a,b) {
  const dx = a.x-b.x, dy = a.y-b.y;
  return Math.sqrt(dx*dx + dy*dy) < a.radius + b.radius;
}

// update
function update() {
  movePlayer();
  moveHazards();

  // collect orbs
  orbs = orbs.filter(orb => {
    if(checkCollision(player, orb)) {
      score += orb.value;
      if(score > highscore){
        highscore = score;
        localStorage.setItem("orbHighscore", highscore);
        highscoreEl.textContent = `Highscore: ${highscore}`;
      }
      return false;
    }
    return true;
  });

  // hazards
  hazards.forEach(h => {
    if(checkCollision(player,h)){
      score = Math.max(score-5,0); // sacrifice
    }
  });

  // powerups
  powerups = powerups.filter(p => {
    if(p.active && checkCollision(player,p)){
      p.active = false;
      player.speed += 0.2;  // reward
      hazards.push(generateHazard()); // cost: extra hazard spawns
      setTimeout(()=>{player.speed -=0.2},5000);
      return false;
    }
    return true;
  });

  // next level
  if(orbs.length === 0){
    level++;
    timeLeft = 60 - Math.min(level*2,30); // faster timer each level
    initLevel();
  }
}

// draw
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // background trail for retro feel
  ctx.fillStyle = "rgba(17,17,17,0.3)";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // orbs
  orbs.forEach(orb => {
    const glowSize = orb.radius + Math.sin(Date.now()/200)*orb.glow*5;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, glowSize, 0, Math.PI*2);
    ctx.fillStyle = "#00ffff";
    ctx.shadowColor = "#00ffff";
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
  });

  // hazards
  hazards.forEach(h => {
    ctx.beginPath();
    ctx.arc(h.x,h.y,h.radius,0,Math.PI*2);
    ctx.fillStyle = "#ff4d4d";
    ctx.shadowColor = "#ff4d4d";
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
  });

  // powerups
  powerups.forEach(p => {
    if(p.active){
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);
      ctx.fillStyle = "#ffd700";
      ctx.shadowColor = "#ffd700";
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.closePath();
      ctx.shadowBlur = 0;
    }
  });

  // Player
  ctx.beginPath();
  ctx.arc(player.x,player.y,player.radius,0,Math.PI*2);
  ctx.fillStyle = "#9cff00";
  ctx.shadowColor = "#9cff00";
  ctx.shadowBlur = 15;
  ctx.fill();
  ctx.closePath();
  ctx.shadowBlur = 0;

  // HUD
  scoreEl.textContent = `Score: ${score}`;
  timerEl.textContent = `Time: ${timeLeft}`;
}

// loop
function loop() { update(); draw(); requestAnimationFrame(loop); }
loop();

// timer
setInterval(()=>{
  if(timeLeft>0){
    timeLeft--;
  } else {
    // time's up: penalty
    score = Math.max(score-10,0);
    timeLeft = 10; // give a small buffer
  }
},1000);
