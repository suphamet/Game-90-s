const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");

const STORAGE_KEY = "space_invaders_high_score";

const state = {
  running: false,
  score: 0,
  highScore: Number(localStorage.getItem(STORAGE_KEY)) || 0,
  player: null,
  bullets: [],
  aliens: [],
  alienDirection: 1,
  alienSpeed: 55,
  lastTime: 0,
  shootCooldown: 0,
  keys: { left: false, right: false, shoot: false },
};

function makePlayer() {
  return {
    x: canvas.width / 2 - 25,
    y: canvas.height - 50,
    width: 50,
    height: 24,
    speed: 420,
  };
}

function makeAliens() {
  const aliens = [];
  const rows = 5;
  const cols = 10;
  const startX = 120;
  const startY = 80;
  const gapX = 62;
  const gapY = 48;
  const colors = ["#4df3ff", "#8fff5f", "#ff6de1", "#ffe45c", "#9d8cff"];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      aliens.push({
        x: startX + col * gapX,
        y: startY + row * gapY,
        width: 34,
        height: 24,
        color: colors[row % colors.length],
        alive: true,
      });
    }
  }
  return aliens;
}

function resetState() {
  state.running = false;
  state.score = 0;
  state.player = makePlayer();
  state.bullets = [];
  state.aliens = makeAliens();
  state.alienDirection = 1;
  state.alienSpeed = 55;
  state.lastTime = 0;
  state.shootCooldown = 0;
  statusEl.textContent = "ready";
  syncHud();
  draw();
}

function startGame() {
  resetState();
  state.running = true;
  statusEl.textContent = "running";
  requestAnimationFrame(loop);
}

function syncHud() {
  scoreEl.textContent = String(state.score);
  highScoreEl.textContent = String(state.highScore);
}

function drawBackground() {
  ctx.fillStyle = "#05070d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 65; i += 1) {
    const x = (i * 137) % canvas.width;
    const y = (i * 71) % canvas.height;
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillRect(x, y, 1.5, 1.5);
  }
}

function drawPlayer() {
  const p = state.player;
  ctx.save();
  ctx.shadowBlur = 16;
  ctx.shadowColor = "#6fa8ff";
  ctx.fillStyle = "#7ab1ff";
  ctx.fillRect(p.x, p.y, p.width, p.height);
  ctx.fillStyle = "#9cc4ff";
  ctx.fillRect(p.x + p.width / 2 - 6, p.y - 8, 12, 10);
  ctx.restore();
}

function drawAliens() {
  state.aliens.forEach((alien) => {
    if (!alien.alive) {
      return;
    }
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = alien.color;
    ctx.fillStyle = alien.color;
    ctx.fillRect(alien.x, alien.y, alien.width, alien.height);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillRect(alien.x + 6, alien.y + 6, 5, 5);
    ctx.fillRect(alien.x + alien.width - 11, alien.y + 6, 5, 5);
    ctx.restore();
  });
}

function drawBullets() {
  ctx.save();
  ctx.shadowBlur = 10;
  ctx.shadowColor = "#ffffff";
  ctx.fillStyle = "#ffffff";
  state.bullets.forEach((b) => ctx.fillRect(b.x, b.y, b.width, b.height));
  ctx.restore();
}

function draw() {
  drawBackground();
  drawPlayer();
  drawAliens();
  drawBullets();
}

function movePlayer(dt) {
  const p = state.player;
  if (state.keys.left) {
    p.x -= p.speed * dt;
  }
  if (state.keys.right) {
    p.x += p.speed * dt;
  }
  p.x = Math.max(0, Math.min(canvas.width - p.width, p.x));
}

function shoot(dt) {
  state.shootCooldown -= dt;
  if (!state.keys.shoot || state.shootCooldown > 0) {
    return;
  }

  const p = state.player;
  state.bullets.push({
    x: p.x + p.width / 2 - 2,
    y: p.y - 12,
    width: 4,
    height: 12,
    speed: 520,
  });
  state.shootCooldown = 0.2;
}

function moveBullets(dt) {
  state.bullets.forEach((b) => { b.y -= b.speed * dt; });
  state.bullets = state.bullets.filter((b) => b.y + b.height > 0);
}

function updateAlienSpeedByRemaining() {
  const remaining = state.aliens.filter((a) => a.alive).length;
  state.alienSpeed = 55 + (50 - remaining) * 5;
}

function moveAliens(dt) {
  let hitEdge = false;
  state.aliens.forEach((alien) => {
    if (!alien.alive) {
      return;
    }

    alien.x += state.alienDirection * state.alienSpeed * dt;
    if (alien.x <= 0 || alien.x + alien.width >= canvas.width) {
      hitEdge = true;
    }
  });

  if (hitEdge) {
    state.alienDirection *= -1;
    state.aliens.forEach((alien) => {
      if (alien.alive) {
        alien.y += 22;
      }
    });
  }
}

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function checkBulletHits() {
  state.bullets = state.bullets.filter((bullet) => {
    for (const alien of state.aliens) {
      if (alien.alive && intersects(bullet, alien)) {
        alien.alive = false;
        state.score += 100;
        updateAlienSpeedByRemaining();
        syncHud();
        return false;
      }
    }
    return true;
  });
}

function checkGameOver() {
  const player = state.player;
  for (const alien of state.aliens) {
    if (!alien.alive) {
      continue;
    }
    if (alien.y + alien.height >= player.y || intersects(alien, player)) {
      endGame("game over");
      return true;
    }
  }

  if (state.aliens.every((a) => !a.alive)) {
    endGame("win");
    return true;
  }

  return false;
}

function endGame(status) {
  state.running = false;
  statusEl.textContent = status;
  if (state.score > state.highScore) {
    state.highScore = state.score;
    localStorage.setItem(STORAGE_KEY, String(state.highScore));
  }
  syncHud();
}

function update(dt) {
  movePlayer(dt);
  shoot(dt);
  moveBullets(dt);
  moveAliens(dt);
  checkBulletHits();
  checkGameOver();
}

function loop(timestamp) {
  if (!state.running) {
    draw();
    return;
  }

  if (!state.lastTime) {
    state.lastTime = timestamp;
  }

  const dt = (timestamp - state.lastTime) / 1000;
  state.lastTime = timestamp;

  update(dt);
  draw();

  if (state.running) {
    requestAnimationFrame(loop);
  }
}

window.addEventListener("keydown", (event) => {
  if (event.code === "ArrowLeft") {
    event.preventDefault();
    state.keys.left = true;
  } else if (event.code === "ArrowRight") {
    event.preventDefault();
    state.keys.right = true;
  } else if (event.code === "Space") {
    event.preventDefault();
    state.keys.shoot = true;
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "ArrowLeft") {
    state.keys.left = false;
  } else if (event.code === "ArrowRight") {
    state.keys.right = false;
  } else if (event.code === "Space") {
    state.keys.shoot = false;
  }
});

startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetState);

syncHud();
resetState();
