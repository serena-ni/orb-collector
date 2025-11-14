const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 600;
canvas.height = 400;

// Player
const player = { x: 300, y: 200, radius: 15, speed: 4 };

// game state
let score = 0;
let highscore = localStorage.getItem("orbHighscore") || 0;
let timeLeft = 60;
let level = 1;

// objects
let orbs = [];
let hazards = [];
let powerups = [];

// input
let keys = {};

// HUD
const scoreEl = document.getElementById("score");
const highscoreEl = document.getElementById("highscore");
const timerEl = document.getElementById("timer");
highscoreEl.textContent = `Highscore: ${highscore}`;

// orb generator
function generateOrb() {
  return {
    x: Math.random() * (canvas.width-20) + 10,
    y: Math.random() * (canvas.height-20) + 10,
    radius: 10,
    value: Math.floor(Math.random()*5)+1,
    glow: Math.random()*0.5+0.5
  };
}

function generateHazard() {
  return {
    x: Math.random() * (canvas.width-20) + 10,
    y: Math.random() * (canvas.height-20) + 10,
    radius: 12
  };
}

function generatePowerup() {
  return {
    x: Math.random() * (canvas.width-20) + 10,
    y: Math.random() * (canvas.height-20) + 10,
    radius: 8,
    active: true
  };
}

// initialize level
function initLevel() {
  orbs = Array.from({length: level+2}, generateOrb);
  hazards = Array.from({length: level}, generateHazard);
  powerups = level >= 2 ? [generatePowerup()] : [];
}

initLevel();

// input listeners
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

// player movement
function movePlayer() {
  if(keys["ArrowUp"] && player.y-player.radius>0) player.y -= player.speed;
  if(keys["ArrowDown"] && player.y+player.radius<canvas.height) player.y += player.speed;
  if(keys["ArrowLeft"] && player.x-player.radius>0) player.x -= player.speed;
  if(keys["ArrowRight"] && player.x+player.radius<canvas.width) player.x += player.speed;
}

// collision
function checkCollision(a,b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx*dx + dy*dy) < a.radius + b.radius;
}

// update game
function update() {
  movePlayer();

  // collect orbs
  orbs.forEach((orb,i)=>{
    if(checkCollision(player, orb)){
      score += orb.value;
      orbs.splice(i,1);
      if(score > highscore){
        highscore = score;
        localStorage.setItem("orbHighscore", highscore);
        highscoreEl.textContent = `Highscore: ${highscore}`;
      }
    }
  });

  // hazards
  hazards.forEach((hazard,i)=>{
    if(checkCollision(player, hazard)){
      score = Math.max(score - 5, 0);
      hazards.splice(i,1);
    }
  });

  // powerups
  powerups.forEach((p,i)=>{
    if(p.active && checkCollision(player,p)){
      p.active = false;
      player.speed += 2;
      setTimeout(()=>{player.speed -=2},5000);
      powerups.splice(i,1);
    }
  });

  // next level
  if(orbs.length === 0){
    level++;
    initLevel();
  }
}

// draw objects
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // orbs (glow)
  orbs.forEach(orb=>{
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.radius + Math.sin(Date.now()/200)*orb.glow*5, 0, Math.PI*2);
    ctx.fillStyle = "#00ffff";
    ctx.fill();
    ctx.closePath();
  });

  // hazards
  hazards.forEach(h=>{
    ctx.beginPath();
    ctx.arc(h.x,h.y,h.radius,0,Math.PI*2);
    ctx.fillStyle = "#ff4d4d";
    ctx.fill();
    ctx.closePath();
  });

  // powerups
  powerups.forEach(p=>{
    if(p.active){
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);
      ctx.fillStyle = "#ffd700";
      ctx.fill();
      ctx.closePath();
    }
  });

  // player
  ctx.beginPath();
  ctx.arc(player.x,player.y,player.radius,0,Math.PI*2);
  ctx.fillStyle = "#9cff00";
  ctx.fill();
  ctx.closePath();

  // HUD
  scoreEl.textContent = `Score: ${score}`;
}

// game loop
function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();

// timer
setInterval(()=>{
  if(timeLeft>0){
    timeLeft--;
    timerEl.textContent=`Time: ${timeLeft}`;
  }
},1000);