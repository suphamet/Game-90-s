const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("resultOverlay");
const winnerText = document.getElementById("winnerText");
const playAgainBtn = document.getElementById("playAgainBtn");

const WIN_SCORE = 5;

const paddle = {
  width: 14,
  height: 100,
  margin: 24,
  playerY: canvas.height / 2 - 50,
  cpuY: canvas.height / 2 - 50,
  speed: 420,
};

const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 9,
  vx: 0,
  vy: 0,
  baseSpeed: 320,
  speedStep: 1.035,
  maxSpeed: 760,
};

const state = {
  playerScore: 0,
  cpuScore: 0,
  running: true,
  keys: { w: false, s: false },
  mouseY: canvas.height / 2,
  lastTime: 0,
  aiTargetY: canvas.height / 2,
  aiRetargetCooldown: 0,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resetBall(direction = 1) {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  const angle = (Math.random() * 0.6 - 0.3);
  ball.vx = Math.cos(angle) * ball.baseSpeed * direction;
  ball.vy = Math.sin(angle) * ball.baseSpeed;
}

function resetGame() {
  state.playerScore = 0;
  state.cpuScore = 0;
  state.running = true;
  state.lastTime = 0;
  paddle.playerY = canvas.height / 2 - paddle.height / 2;
  paddle.cpuY = canvas.height / 2 - paddle.height / 2;
  overlay.classList.remove("show");
  resetBall(Math.random() > 0.5 ? 1 : -1);
  requestAnimationFrame(loop);
}

function drawGlowRect(x, y, w, h) {
  ctx.save();
  ctx.shadowBlur = 12;
  ctx.shadowColor = "#19f28f";
  ctx.fillStyle = "#19f28f";
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function drawBall() {
  ctx.save();
  ctx.beginPath();
  ctx.shadowBlur = 14;
  ctx.shadowColor = "#e7fff7";
  ctx.fillStyle = "#e7fff7";
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCenterLine() {
  ctx.save();
  ctx.strokeStyle = "rgba(25, 242, 143, 0.4)";
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 16]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.restore();
}

function drawScore() {
  ctx.save();
  ctx.fillStyle = "#dffff3";
  ctx.font = "bold 44px Segoe UI";
  ctx.textAlign = "center";
  ctx.shadowBlur = 10;
  ctx.shadowColor = "rgba(25, 242, 143, 0.8)";
  ctx.fillText(`${state.playerScore}  :  ${state.cpuScore}`, canvas.width / 2, 64);
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#020707";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawCenterLine();
  drawScore();

  drawGlowRect(paddle.margin, paddle.playerY, paddle.width, paddle.height);
  drawGlowRect(canvas.width - paddle.margin - paddle.width, paddle.cpuY, paddle.width, paddle.height);
  drawBall();
}

function movePlayer(dt) {
  if (state.keys.w) {
    paddle.playerY -= paddle.speed * dt;
  }
  if (state.keys.s) {
    paddle.playerY += paddle.speed * dt;
  }

  const mouseTarget = state.mouseY - paddle.height / 2;
  const diff = mouseTarget - paddle.playerY;
  if (Math.abs(diff) > 1) {
    paddle.playerY += diff * 0.16;
  }

  paddle.playerY = clamp(paddle.playerY, 0, canvas.height - paddle.height);
}

function moveCpu(dt) {
  state.aiRetargetCooldown -= dt;
  if (state.aiRetargetCooldown <= 0) {
    state.aiTargetY = ball.y + (Math.random() * 50 - 25);
    state.aiRetargetCooldown = 0.09 + Math.random() * 0.08;
  }

  const target = state.aiTargetY - paddle.height / 2;
  const diff = target - paddle.cpuY;
  const aiSpeed = 330;
  const step = clamp(diff, -aiSpeed * dt, aiSpeed * dt);
  paddle.cpuY += step;
  paddle.cpuY = clamp(paddle.cpuY, 0, canvas.height - paddle.height);
}

function speedUpBall() {
  const speed = Math.hypot(ball.vx, ball.vy);
  const next = Math.min(ball.maxSpeed, speed * ball.speedStep);
  const factor = next / speed;
  ball.vx *= factor;
  ball.vy *= factor;
}

function reflectFromPaddle(paddleY, isPlayer) {
  const rel = (ball.y - (paddleY + paddle.height / 2)) / (paddle.height / 2);
  const speed = Math.hypot(ball.vx, ball.vy);
  const angle = rel * 0.95;
  const dir = isPlayer ? 1 : -1;
  ball.vx = Math.cos(angle) * speed * dir;
  ball.vy = Math.sin(angle) * speed;
  speedUpBall();
}

function checkWallCollision() {
  if (ball.y - ball.radius <= 0) {
    ball.y = ball.radius;
    ball.vy *= -1;
  }
  if (ball.y + ball.radius >= canvas.height) {
    ball.y = canvas.height - ball.radius;
    ball.vy *= -1;
  }
}

function checkPaddleCollision() {
  const playerX = paddle.margin;
  const cpuX = canvas.width - paddle.margin - paddle.width;

  if (
    ball.vx < 0 &&
    ball.x - ball.radius <= playerX + paddle.width &&
    ball.x + ball.radius >= playerX &&
    ball.y >= paddle.playerY &&
    ball.y <= paddle.playerY + paddle.height
  ) {
    ball.x = playerX + paddle.width + ball.radius;
    reflectFromPaddle(paddle.playerY, true);
  }

  if (
    ball.vx > 0 &&
    ball.x + ball.radius >= cpuX &&
    ball.x - ball.radius <= cpuX + paddle.width &&
    ball.y >= paddle.cpuY &&
    ball.y <= paddle.cpuY + paddle.height
  ) {
    ball.x = cpuX - ball.radius;
    reflectFromPaddle(paddle.cpuY, false);
  }
}

function checkScore() {
  if (ball.x + ball.radius < 0) {
    state.cpuScore += 1;
    if (state.cpuScore >= WIN_SCORE) {
      finishGame("CPU Wins");
      return;
    }
    resetBall(1);
  }

  if (ball.x - ball.radius > canvas.width) {
    state.playerScore += 1;
    if (state.playerScore >= WIN_SCORE) {
      finishGame("Player Wins");
      return;
    }
    resetBall(-1);
  }
}

function finishGame(message) {
  state.running = false;
  winnerText.textContent = message;
  overlay.classList.add("show");
}

function update(dt) {
  movePlayer(dt);
  moveCpu(dt);

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  checkWallCollision();
  checkPaddleCollision();
  checkScore();
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
  const scaleY = canvas.height / rect.height;
  state.mouseY = (event.clientY - rect.top) * scaleY;
});

window.addEventListener("keydown", (event) => {
  if (event.key === "w" || event.key === "W") {
    state.keys.w = true;
  }
  if (event.key === "s" || event.key === "S") {
    state.keys.s = true;
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key === "w" || event.key === "W") {
    state.keys.w = false;
  }
  if (event.key === "s" || event.key === "S") {
    state.keys.s = false;
  }
});

playAgainBtn.addEventListener("click", resetGame);

resetGame();
