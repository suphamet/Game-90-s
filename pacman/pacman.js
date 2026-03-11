const mapRows = [
  "############################",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#o####.#####.##.#####.####o#",
  "#.####.#####.##.#####.####.#",
  "#..........................#",
  "#.####.##.########.##.####.#",
  "#.####.##.########.##.####.#",
  "#......##....##....##......#",
  "######.##### ## #####.######",
  "######.##### ## #####.######",
  "######.##          ##.######",
  "######.## ###--### ##.######",
  "      .   #      #   .      ",
  "######.## ######## ##.######",
  "######.## ######## ##.######",
  "######.##          ##.######",
  "######.## ######## ##.######",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#o..##................##..o#",
  "###.##.##.########.##.##.###",
  "#......##....##....##......#",
  "#.##########.##.##########.#",
  "#..........................#",
  "############################",
];

const CELL = 32;
const COLS = mapRows[0].length;
const ROWS = mapRows.length;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("scoreValue");
const livesEl = document.getElementById("livesValue");
const statusEl = document.getElementById("statusValue");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");

const DIR = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};

let world = [];
let pelletsRemaining = 0;

function cellCenter(cell) {
  return cell * CELL + CELL / 2;
}

const pacman = {
  x: cellCenter(14),
  y: cellCenter(20),
  dir: { ...DIR.left },
  nextDir: { ...DIR.left },
  speed: 128,
  radius: 13,
  mouthTimer: 0,
  mouthOpen: 0,
  alive: true,
};

const ghostStart = [
  { x: cellCenter(13), y: cellCenter(12), color: "#ff5f7f" },
  { x: cellCenter(14), y: cellCenter(12), color: "#63e2ff" },
  { x: cellCenter(15), y: cellCenter(12), color: "#ff9f4f" },
];

let ghosts = [];

const state = {
  running: false,
  score: 0,
  lives: 3,
  status: "ready",
  frightTimer: 0,
  lastTime: 0,
};

function cloneMap() {
  return mapRows.map((row) => row.split(""));
}

function resetWorld() {
  world = cloneMap();
  pelletsRemaining = 0;
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (world[y][x] === "." || world[y][x] === "o") {
        pelletsRemaining += 1;
      }
    }
  }
}

function resetCharacters() {
  pacman.x = cellCenter(14);
  pacman.y = cellCenter(20);
  pacman.dir = { ...DIR.left };
  pacman.nextDir = { ...DIR.left };
  pacman.alive = true;

  ghosts = ghostStart.map((g, idx) => ({
    x: g.x,
    y: g.y,
    dir: idx % 2 === 0 ? { ...DIR.left } : { ...DIR.right },
    speed: 108,
    radius: 13,
    color: g.color,
    frightened: false,
  }));
}

function fullReset() {
  resetWorld();
  resetCharacters();
  state.score = 0;
  state.lives = 3;
  state.running = false;
  state.status = "ready";
  state.frightTimer = 0;
  state.lastTime = 0;
  syncHud();
  draw();
}

function startGame() {
  if (state.running) {
    return;
  }
  state.running = true;
  state.status = "running";
  syncHud();
}

function syncHud() {
  scoreEl.textContent = String(state.score);
  livesEl.textContent = String(state.lives);
  statusEl.textContent = state.status;
}

function isWallCell(gridX, gridY) {
  if (gridY < 0 || gridY >= ROWS) {
    return true;
  }
  if (gridX < 0 || gridX >= COLS) {
    return false;
  }
  return world[gridY][gridX] === "#";
}

function nearGridCenter(value) {
  const mod = value % CELL;
  return Math.abs(mod - CELL / 2) < 2;
}

function canMove(entity, dir) {
  const nx = entity.x + dir.x * 2;
  const ny = entity.y + dir.y * 2;
  const radius = entity.radius ?? 13;
  const left = nx - radius;
  const right = nx + radius;
  const top = ny - radius;
  const bottom = ny + radius;

  const cells = [
    { x: Math.floor(left / CELL), y: Math.floor(top / CELL) },
    { x: Math.floor(right / CELL), y: Math.floor(top / CELL) },
    { x: Math.floor(left / CELL), y: Math.floor(bottom / CELL) },
    { x: Math.floor(right / CELL), y: Math.floor(bottom / CELL) },
  ];

  return cells.every((c) => !isWallCell(c.x, c.y));
}
function applyWarp(entity) {
  if (entity.x < -CELL / 2) {
    entity.x = COLS * CELL + CELL / 2;
  }
  if (entity.x > COLS * CELL + CELL / 2) {
    entity.x = -CELL / 2;
  }
}

function updatePacman(dt) {
  const centeredX = nearGridCenter(pacman.x);
  const centeredY = nearGridCenter(pacman.y);

  if (centeredX && centeredY && canMove(pacman, pacman.nextDir)) {
    pacman.dir = { ...pacman.nextDir };
  }

  if (!canMove(pacman, pacman.dir)) {
    return;
  }

  pacman.x += pacman.dir.x * pacman.speed * dt;
  pacman.y += pacman.dir.y * pacman.speed * dt;
  applyWarp(pacman);

  pacman.mouthTimer += dt * 10;
  pacman.mouthOpen = (Math.sin(pacman.mouthTimer) + 1) / 2;

  consumePellet();
}
function consumePellet() {
  const gx = Math.floor(pacman.x / CELL);
  const gy = Math.floor(pacman.y / CELL);
  if (gy < 0 || gy >= ROWS || gx < 0 || gx >= COLS) {
    return;
  }

  const tile = world[gy][gx];
  if (tile === ".") {
    world[gy][gx] = " ";
    pelletsRemaining -= 1;
    state.score += 10;
  } else if (tile === "o") {
    world[gy][gx] = " ";
    pelletsRemaining -= 1;
    state.score += 50;
    state.frightTimer = 7;
  }

  if (pelletsRemaining <= 0) {
    state.running = false;
    state.status = "win";
  }

  syncHud();
}

function randomDirection(ghost) {
  const options = [DIR.left, DIR.right, DIR.up, DIR.down].filter((d) => canMove(ghost, d));
  if (options.length === 0) {
    return ghost.dir;
  }

  const reverse = { x: -ghost.dir.x, y: -ghost.dir.y };
  const notReverse = options.filter((d) => d.x !== reverse.x || d.y !== reverse.y);
  const pool = notReverse.length > 0 ? notReverse : options;

  if (state.frightTimer > 0) {
    pool.sort(() => Math.random() - 0.5);
    return pool[0];
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

function updateGhosts(dt) {
  ghosts.forEach((ghost) => {
    const centeredX = nearGridCenter(ghost.x);
    const centeredY = nearGridCenter(ghost.y);

    if ((centeredX && centeredY && Math.random() < 0.25) || !canMove(ghost, ghost.dir)) {
      ghost.dir = { ...randomDirection(ghost) };
    }

    const speed = state.frightTimer > 0 ? ghost.speed * 0.75 : ghost.speed;
    if (canMove(ghost, ghost.dir)) {
      ghost.x += ghost.dir.x * speed * dt;
      ghost.y += ghost.dir.y * speed * dt;
    }

    applyWarp(ghost);
  });
}
function collidePacmanGhost() {
  for (const ghost of ghosts) {
    const dx = ghost.x - pacman.x;
    const dy = ghost.y - pacman.y;
    const dist2 = dx * dx + dy * dy;

    if (dist2 <= (pacman.radius + 13) * (pacman.radius + 13)) {
      if (state.frightTimer > 0) {
        state.score += 200;
        ghost.x = cellCenter(14);
        ghost.y = cellCenter(12);
        ghost.dir = { ...DIR.up };
        syncHud();
      } else {
        loseLife();
      }
      break;
    }
  }
}

function loseLife() {
  state.lives -= 1;
  if (state.lives <= 0) {
    state.running = false;
    state.status = "game over";
  }
  resetCharacters();
  syncHud();
}

function update(dt) {
  if (!state.running) {
    return;
  }

  updatePacman(dt);
  updateGhosts(dt);
  collidePacmanGhost();

  if (state.frightTimer > 0) {
    state.frightTimer -= dt;
    if (state.frightTimer < 0) {
      state.frightTimer = 0;
    }
  }

  syncHud();
}

function drawMap() {
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const tile = world[y][x];
      const px = x * CELL;
      const py = y * CELL;

      if (tile === "#") {
        ctx.strokeStyle = "#2a49ff";
        ctx.lineWidth = 3;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(42, 73, 255, 0.55)";
        ctx.strokeRect(px + 2, py + 2, CELL - 4, CELL - 4);
        ctx.shadowBlur = 0;
      } else if (tile === ".") {
        ctx.fillStyle = "#f3f3f3";
        ctx.beginPath();
        ctx.arc(px + CELL / 2, py + CELL / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (tile === "o") {
        ctx.fillStyle = "#fff4ad";
        ctx.beginPath();
        ctx.arc(px + CELL / 2, py + CELL / 2, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawPacman() {
  const angleBase = Math.atan2(pacman.dir.y, pacman.dir.x);
  const mouth = 0.18 + pacman.mouthOpen * 0.5;

  ctx.fillStyle = "#ffd92f";
  ctx.beginPath();
  ctx.moveTo(pacman.x, pacman.y);
  ctx.arc(pacman.x, pacman.y, pacman.radius, angleBase + mouth, angleBase - mouth + Math.PI * 2, false);
  ctx.closePath();
  ctx.fill();
}

function drawGhost(ghost) {
  const bodyColor = state.frightTimer > 0 ? "#2f72ff" : ghost.color;
  const gx = ghost.x;
  const gy = ghost.y;
  const r = 14;

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(gx, gy - 3, r, Math.PI, 0);
  ctx.lineTo(gx + r, gy + r);
  ctx.lineTo(gx - r, gy + r);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(gx - 5, gy - 4, 3.4, 0, Math.PI * 2);
  ctx.arc(gx + 5, gy - 4, 3.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#001a7a";
  ctx.beginPath();
  ctx.arc(gx - 5, gy - 4, 1.5, 0, Math.PI * 2);
  ctx.arc(gx + 5, gy - 4, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawStatusOverlay() {
  if (state.running) {
    return;
  }

  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 40px Segoe UI";
  ctx.textAlign = "center";

  if (state.status === "ready") {
    ctx.fillText("Press Start", canvas.width / 2, canvas.height / 2);
  } else if (state.status === "win") {
    ctx.fillText("You Win", canvas.width / 2, canvas.height / 2);
  } else if (state.status === "game over") {
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawMap();
  ghosts.forEach(drawGhost);
  drawPacman();
  drawStatusOverlay();
}

function loop(timestamp) {
  if (!state.lastTime) {
    state.lastTime = timestamp;
  }

  const dt = Math.min(0.033, (timestamp - state.lastTime) / 1000);
  state.lastTime = timestamp;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function setNextDirectionFromKey(key) {
  if (key === "ArrowLeft") {
    pacman.nextDir = { ...DIR.left };
  } else if (key === "ArrowRight") {
    pacman.nextDir = { ...DIR.right };
  } else if (key === "ArrowUp") {
    pacman.nextDir = { ...DIR.up };
  } else if (key === "ArrowDown") {
    pacman.nextDir = { ...DIR.down };
  }
}

window.addEventListener("keydown", (event) => {
  if (event.key.startsWith("Arrow")) {
    event.preventDefault();
  }
  setNextDirectionFromKey(event.key);
});

startBtn.addEventListener("click", () => {
  startGame();
});

resetBtn.addEventListener("click", () => {
  fullReset();
});

fullReset();
requestAnimationFrame(loop);
