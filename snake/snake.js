const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const CELL_SIZE = 20;
const TICK_MS = 120;

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");
const dirButtons = document.querySelectorAll("[data-dir]");

let state = {
  width: Math.floor(canvas.width / CELL_SIZE),
  height: Math.floor(canvas.height / CELL_SIZE),
  snake: [],
  direction: DIRECTIONS.right,
  nextDirection: DIRECTIONS.right,
  food: null,
  score: 0,
  status: "running",
};

function pointKey(point) {
  return `${point.x},${point.y}`;
}

function pointsEqual(a, b) {
  return a.x === b.x && a.y === b.y;
}

function isOpposite(a, b) {
  return a.x === -b.x && a.y === -b.y;
}

function randomEmptyCell() {
  const occupied = new Set(state.snake.map(pointKey));
  const total = state.width * state.height;

  if (occupied.size >= total) return null;

  for (let attempt = 0; attempt < total * 2; attempt++) {
    const x = Math.floor(Math.random() * state.width);
    const y = Math.floor(Math.random() * state.height);
    if (!occupied.has(`${x},${y}`)) return { x, y };
  }

  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      if (!occupied.has(`${x},${y}`)) return { x, y };
    }
  }
  return null;
}

function resetGame() {
  const midX = Math.floor(state.width / 2);
  const midY = Math.floor(state.height / 2);
  state.snake = [
    { x: midX, y: midY },
    { x: midX - 1, y: midY },
    { x: midX - 2, y: midY },
  ];
  state.direction = DIRECTIONS.right;
  state.nextDirection = DIRECTIONS.right;
  state.score = 0;
  state.status = "running";
  state.food = randomEmptyCell();
  render();
}

function setDirection(name) {
  const next = DIRECTIONS[name];
  if (!next || state.status === "gameover") return;
  if (state.snake.length > 1 && isOpposite(next, state.direction)) return;
  state.nextDirection = next;
}

function togglePause() {
  if (state.status === "gameover") return;
  state.status = state.status === "paused" ? "running" : "paused";
}

function advanceState() {
  if (state.status !== "running") return;

  const direction = state.nextDirection;
  const head = state.snake[0];
  const nextHead = { x: head.x + direction.x, y: head.y + direction.y };

  if (nextHead.x < 0 || nextHead.x >= state.width || nextHead.y < 0 || nextHead.y >= state.height) {
    state.status = "gameover";
    return;
  }

  const ateFood = state.food && pointsEqual(nextHead, state.food);
  const bodyToCheck = ateFood ? state.snake : state.snake.slice(0, -1);
  if (bodyToCheck.some(s => pointsEqual(s, nextHead))) {
    state.status = "gameover";
    return;
  }

  state.snake.unshift(nextHead);
  state.direction = direction;

  if (ateFood) {
    state.score += 1;
    state.food = randomEmptyCell();
    if (!state.food) state.status = "gameover";
  } else {
    state.snake.pop();
  }
}

function drawCell(point, color) {
  ctx.fillStyle = color;
  ctx.fillRect(point.x * CELL_SIZE, point.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw grid
  ctx.strokeStyle = "rgba(0,0,0,0.05)";
  for (let x = 0; x <= state.width; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL_SIZE, 0);
    ctx.lineTo(x * CELL_SIZE, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= state.height; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL_SIZE);
    ctx.lineTo(canvas.width, y * CELL_SIZE);
    ctx.stroke();
  }

  state.snake.forEach((segment, index) => {
    drawCell(segment, index === 0 ? "#0f380f" : "#2f7a44");
  });

  if (state.food) drawCell(state.food, "#c73e1d");

  scoreEl.textContent = state.score;
  statusEl.textContent = state.status;
  pauseBtn.textContent = state.status === "paused" ? "Resume" : "Pause";
}

function tick() {
  advanceState();
  render();
}

const keyMap = { 
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  w: "up", s: "down", a: "left", d: "right",
  W: "up", S: "down", A: "left", D: "right"
};

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    togglePause();
    render();
    return;
  }
  const input = keyMap[e.key];
  if (input) {
    e.preventDefault();
    setDirection(input);
  }
  if (state.status === "gameover" && e.key === "Enter") resetGame();
});

pauseBtn.addEventListener("click", () => { togglePause(); render(); });
restartBtn.addEventListener("click", () => { resetGame(); });

dirButtons.forEach(btn => {
  btn.addEventListener("click", () => { setDirection(btn.dataset.dir); });
  // Support touch for better response
  btn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    setDirection(btn.dataset.dir);
  }, { passive: false });
});

setInterval(tick, TICK_MS);
resetGame();
