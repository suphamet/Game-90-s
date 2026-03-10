const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
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

export function randomEmptyCell(state, rng = state.rng ?? Math.random) {
  const occupied = new Set(state.snake.map(pointKey));
  const total = state.width * state.height;

  if (occupied.size >= total) {
    return null;
  }

  for (let attempt = 0; attempt < total * 2; attempt += 1) {
    const x = Math.floor(rng() * state.width);
    const y = Math.floor(rng() * state.height);
    if (!occupied.has(`${x},${y}`)) {
      return { x, y };
    }
  }

  for (let y = 0; y < state.height; y += 1) {
    for (let x = 0; x < state.width; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        return { x, y };
      }
    }
  }

  return null;
}

export function createInitialState({ width = 20, height = 20, rng = Math.random } = {}) {
  const midX = Math.floor(width / 2);
  const midY = Math.floor(height / 2);
  const snake = [
    { x: midX, y: midY },
    { x: midX - 1, y: midY },
    { x: midX - 2, y: midY },
  ];

  const state = {
    width,
    height,
    snake,
    direction: DIRECTIONS.right,
    nextDirection: DIRECTIONS.right,
    food: { x: 0, y: 0 },
    score: 0,
    status: "running",
    rng,
  };

  state.food = randomEmptyCell(state, rng);
  return state;
}

export function setDirection(state, directionName) {
  const next = DIRECTIONS[directionName];
  if (!next || state.status === "gameover") {
    return state;
  }

  if (state.snake.length > 1 && isOpposite(next, state.direction)) {
    return state;
  }

  return { ...state, nextDirection: next };
}

export function togglePause(state) {
  if (state.status === "gameover") {
    return state;
  }

  return {
    ...state,
    status: state.status === "paused" ? "running" : "paused",
  };
}

export function restartState(state) {
  return createInitialState({ width: state.width, height: state.height, rng: state.rng });
}

export function advanceState(state) {
  if (state.status !== "running") {
    return state;
  }

  const direction = state.nextDirection;
  const head = state.snake[0];
  const nextHead = { x: head.x + direction.x, y: head.y + direction.y };

  if (nextHead.x < 0 || nextHead.x >= state.width || nextHead.y < 0 || nextHead.y >= state.height) {
    return { ...state, status: "gameover", direction };
  }

  const ateFood = state.food ? pointsEqual(nextHead, state.food) : false;
  const bodyToCheck = ateFood ? state.snake : state.snake.slice(0, -1);
  const hitSelf = bodyToCheck.some((segment) => pointsEqual(segment, nextHead));

  if (hitSelf) {
    return { ...state, status: "gameover", direction };
  }

  const snake = [nextHead, ...state.snake];
  if (!ateFood) {
    snake.pop();
  }

  const base = {
    ...state,
    snake,
    direction,
    score: ateFood ? state.score + 1 : state.score,
  };

  if (!ateFood) {
    return base;
  }

  const food = randomEmptyCell(base, state.rng);
  if (!food) {
    return { ...base, food: null, status: "gameover" };
  }

  return { ...base, food };
}