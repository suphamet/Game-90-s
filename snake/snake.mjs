import { advanceState, createInitialState, restartState, setDirection, togglePause } from "./snake-logic.mjs";

const CELL_SIZE = 20;
const TICK_MS = 120;

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");
const dirButtons = document.querySelectorAll("[data-dir]");

let state = createInitialState({
  width: Math.floor(canvas.width / CELL_SIZE),
  height: Math.floor(canvas.height / CELL_SIZE),
});

function drawCell(point, color) {
  ctx.fillStyle = color;
  ctx.fillRect(point.x * CELL_SIZE, point.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let x = 0; x <= state.width; x += 1) {
    ctx.strokeStyle = "#ececec";
    ctx.beginPath();
    ctx.moveTo(x * CELL_SIZE, 0);
    ctx.lineTo(x * CELL_SIZE, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y <= state.height; y += 1) {
    ctx.strokeStyle = "#ececec";
    ctx.beginPath();
    ctx.moveTo(0, y * CELL_SIZE);
    ctx.lineTo(canvas.width, y * CELL_SIZE);
    ctx.stroke();
  }

  state.snake.forEach((segment, index) => {
    drawCell(segment, index === 0 ? "#2f7a44" : "#4f9b63");
  });

  if (state.food) {
    drawCell(state.food, "#c73e1d");
  }

  scoreEl.textContent = String(state.score);
  statusEl.textContent = state.status;
  pauseBtn.textContent = state.status === "paused" ? "Resume" : "Pause";
}

function tick() {
  state = advanceState(state);
  render();
}

function handleDirectionInput(input) {
  state = setDirection(state, input);
  render();
}

const keyMap = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    state = togglePause(state);
    render();
    return;
  }

  const input = keyMap[event.key] ?? keyMap[event.key.toLowerCase()];
  if (input) {
    event.preventDefault();
    handleDirectionInput(input);
  }

  if (state.status === "gameover" && event.key === "Enter") {
    state = restartState(state);
    render();
  }
});

pauseBtn.addEventListener("click", () => {
  state = togglePause(state);
  render();
});

restartBtn.addEventListener("click", () => {
  state = restartState(state);
  render();
});

dirButtons.forEach((button) => {
  button.addEventListener("click", () => {
    handleDirectionInput(button.dataset.dir);
  });
});

setInterval(tick, TICK_MS);
render();