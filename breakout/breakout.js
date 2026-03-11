const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");

const BRICK_ROWS = 6;
const BRICK_COLS = 11;
const BRICK_W = 66;
const BRICK_H = 24;
const BRICK_GAP = 8;
const BRICK_TOP = 72;
const BRICK_LEFT = 46;
const BRICK_COLORS = ["#ff6b6b", "#ffa94d", "#ffd43b", "#69db7c", "#4dabf7", "#b197fc"];

const state = {
  running: false,
  score: 0,
  lives: 3,
  destroyed: 0,
  shake: 0,
  keys: { left: false, right: false },
  paddle: null,
  ball: null,
  bricks: [],
  lastTime: 0,
};

function makePaddle() {
  return { x: canvas.width / 2 - 70, y: canvas.height - 34, width: 140, height: 14, speed: 520 };
}

function makeBall() {
  return { x: canvas.width / 2, y: canvas.height - 52, radius: 9, vx: 240, vy: -240 };
}

function makeBricks() {
  const bricks = [];
  for (let r = 0; r < BRICK_ROWS; r += 1) {
    for (let c = 0; c < BRICK_COLS; c += 1) {
      bricks.push({
        x: BRICK_LEFT + c * (BRICK_W + BRICK_GAP),
        y: BRICK_TOP + r * (BRICK_H + BRICK_GAP),
        width: BRICK_W,
        height: BRICK_H,
        color: BRICK_COLORS[r % BRICK_COLORS.length],
        active: true,
      });
    }
  }
  return bricks;
}

function resetState() {
  state.running = false;
  state.score = 0;
  state.lives = 3;
  state.destroyed = 0;
  state.shake = 0;
  state.paddle = makePaddle();
  state.ball = makeBall();
  state.bricks = makeBricks();
  state.lastTime = 0;
  statusEl.textContent = "ready";
  syncHud();
  draw();
}

function startGame() {
  if (state.running) return;
  resetState();
  state.running = true;
  statusEl.textContent = "running";
  requestAnimationFrame(loop);
}

function syncHud() {
  scoreEl.textContent = String(state.score);
  livesEl.textContent = "❤".repeat(state.lives) || "-";
}

function reflectBallFromPaddle() {
  const p = state.paddle;
  const b = state.ball;
  const hitPoint = (b.x - (p.x + p.width / 2)) / (p.width / 2);
  b.vx = hitPoint * 340;
  b.vy = -Math.abs(b.vy);
}

function increaseSpeedEveryTenBricks() {
  if (state.destroyed > 0 && state.destroyed % 10 === 0) {
    state.ball.vx *= 1.07;
    state.ball.vy *= 1.07;
  }
}

function movePaddle(dt) {
  const p = state.paddle;
  if (state.keys.left) {
    p.x -= p.speed * dt;
  }
  if (state.keys.right) {
    p.x += p.speed * dt;
  }
  p.x = Math.max(0, Math.min(canvas.width - p.width, p.x));
}

function moveBall(dt) {
  const b = state.ball;
  b.x += b.vx * dt;
  b.y += b.vy * dt;

  if (b.x - b.radius <= 0) {
    b.x = b.radius;
    b.vx *= -1;
  }
  if (b.x + b.radius >= canvas.width) {
    b.x = canvas.width - b.radius;
    b.vx *= -1;
  }
  if (b.y - b.radius <= 0) {
    b.y = b.radius;
    b.vy *= -1;
  }

  const p = state.paddle;
  if (
    b.x + b.radius >= p.x &&
    b.x - b.radius <= p.x + p.width &&
    b.y + b.radius >= p.y &&
    b.y - b.radius <= p.y + p.height &&
    b.vy > 0
  ) {
    b.y = p.y - b.radius;
    reflectBallFromPaddle();
  }

  if (b.y - b.radius > canvas.height) {
    loseLife();
  }
}

function loseLife() {
  state.lives -= 1;
  syncHud();
  if (state.lives <= 0) {
    state.running = false;
    statusEl.textContent = "game over";
    return;
  }
  state.ball = makeBall();
  state.paddle = makePaddle();
}

function hitBrick(b, brick) {
  return (
    b.x + b.radius > brick.x &&
    b.x - b.radius < brick.x + brick.width &&
    b.y + b.radius > brick.y &&
    b.y - b.radius < brick.y + brick.height
  );
}

function collideBricks() {
  const b = state.ball;
  for (const brick of state.bricks) {
    if (!brick.active) {
      continue;
    }

    if (hitBrick(b, brick)) {
      brick.active = false;
      b.vy *= -1;
      state.score += 100;
      state.destroyed += 1;
      state.shake = 7;
      increaseSpeedEveryTenBricks();
      syncHud();

      if (state.bricks.every((x) => !x.active)) {
        state.running = false;
        statusEl.textContent = "win";
      }
      return;
    }
  }
}

function update(dt) {
  movePaddle(dt);
  moveBall(dt);
  collideBricks();
  state.shake = Math.max(0, state.shake - 0.8);
}

function drawBackground() {
  ctx.fillStyle = "#0b1221";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawPaddle() {
  const p = state.paddle;
  ctx.fillStyle = "#7eb5ff";
  ctx.fillRect(p.x, p.y, p.width, p.height);
}

function drawBall() {
  const b = state.ball;
  ctx.beginPath();
  ctx.fillStyle = "#ffffff";
  ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawBricks() {
  state.bricks.forEach((brick) => {
    if (!brick.active) {
      return;
    }
    ctx.fillStyle = brick.color;
    ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.strokeRect(brick.x + 1, brick.y + 1, brick.width - 2, brick.height - 2);
  });
}

function draw() {
  const shakeX = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
  const shakeY = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);
  drawBackground();
  drawBricks();
  drawPaddle();
  drawBall();
  ctx.restore();
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

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const mouseX = (event.clientX - rect.left) * scaleX;
  if (state.paddle) {
    state.paddle.x = mouseX - state.paddle.width / 2;
    state.paddle.x = Math.max(0, Math.min(canvas.width - state.paddle.width, state.paddle.x));
  }
});

window.addEventListener("keydown", (event) => {
  if (event.code === "ArrowLeft") {
    event.preventDefault();
    state.keys.left = true;
  } else if (event.code === "ArrowRight") {
    event.preventDefault();
    state.keys.right = true;
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "ArrowLeft") {
    state.keys.left = false;
  } else if (event.code === "ArrowRight") {
    state.keys.right = false;
  }
});

startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetState);

resetState();
