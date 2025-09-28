document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const startButton = document.getElementById("startButton");
    const instructions = document.getElementById("instructions");

    const scoreDisplay = document.getElementById("score");
    let gameStarted = false;
    let lastTime = 0;
    let score = 0;
    let health = 100;

    const player = { x: 300, y: 200, radius: 15, speed: 4 };

    const keys = {};
    document.addEventListener("keydown", e => keys[e.key] = true);
    document.addEventListener("keyup", e => keys[e.key] = false);

    const orbs = [];
    function spawnOrb() {
        const isSpecial = Math.random() < 0.3; // 30% chance
        const multiplier = isSpecial ? Math.random() * 20 - 10 : Math.random() * 3 - 1;
        orbs.push({
            x: Math.random() * (canvas.width - 20) + 10,
            y: Math.random() * (canvas.height - 20) + 10,
            radius: 10,
            color: isSpecial ? "yellow" : "blue",
            multiplier: multiplier,
            lifetime: Math.random() * 5
        });
    }

    for(let i=0;i<5;i++) spawnOrb();

    function update() {
        if (!gameStarted) return;

        const now = performance.now();
        const delta = (now - lastTime)/1000;
        lastTime = now;

        ctx.clearRect(0,0,canvas.width,canvas.height);

        // move player
        if(keys["ArrowUp"]) player.y -= player.speed;
        if(keys["ArrowDown"]) player.y += player.speed;
        if(keys["ArrowLeft"]) player.x -= player.speed;
        if(keys["ArrowRight"]) player.x += player.speed;

        // keep in bounds
        player.x = Math.max(player.radius, Math.min(canvas.width-player.radius, player.x));
        player.y = Math.max(player.radius, Math.min(canvas.height-player.radius, player.y));

        // draw player
        ctx.fillStyle = "pink";
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI*2);
        ctx.fill();

        // draw orbs and check collisions
        for(let i=orbs.length-1;i>=0;i--) {
            const o = orbs[i];
            ctx.fillStyle = o.color;
            ctx.beginPath();
            ctx.arc(o.x,o.y,o.radius,0,Math.PI*2);
            ctx.fill();

            o.lifetime -= delta;
            const dx = o.x - player.x;
            const dy = o.y - player.y;
            if(Math.sqrt(dx*dx+dy*dy)<player.radius+o.radius) {
                score += o.multiplier;
                orbs.splice(i,1);
                spawnOrb();
            } else if(o.lifetime <=0){
                orbs.splice(i,1);
                spawnOrb();
            }
        }

        scoreDisplay.textContent = `Score: ${Math.round(score)}  Health: ${Math.round(health)}`;

        requestAnimationFrame(update);
    }

    startButton.addEventListener("click", () => {
        instructions.style.display = "none";
        document.querySelector(".center-container").style.display = "none";
        gameStarted = true;
        lastTime = performance.now();
        update();
    });
});