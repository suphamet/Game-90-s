import test from "node:test";
import assert from "node:assert/strict";
import { advanceState, createInitialState, randomEmptyCell, setDirection } from "./snake-logic.mjs";

test("snake moves one cell per tick", () => {
  const initial = createInitialState({ width: 10, height: 10, rng: () => 0.99 });
  const moved = advanceState(initial);

  assert.deepEqual(moved.snake[0], { x: initial.snake[0].x + 1, y: initial.snake[0].y });
  assert.equal(moved.score, 0);
  assert.equal(moved.status, "running");
});

test("snake cannot immediately reverse direction", () => {
  const initial = createInitialState({ width: 10, height: 10, rng: () => 0.99 });
  const updated = setDirection(initial, "left");

  assert.equal(updated.nextDirection.x, 1);
  assert.equal(updated.nextDirection.y, 0);
});

test("snake grows and score increments after eating", () => {
  const initial = createInitialState({ width: 15, height: 15, rng: () => 0.95 });
  const head = initial.snake[0];

  const setup = {
    ...initial,
    food: { x: head.x + 1, y: head.y },
  };

  const moved = advanceState(setup);

  assert.equal(moved.snake.length, setup.snake.length + 1);
  assert.equal(moved.score, 1);
  assert.equal(moved.status, "running");
  assert.notDeepEqual(moved.food, moved.snake[0]);
});

test("wall collision ends game", () => {
  const state = {
    ...createInitialState({ width: 4, height: 4, rng: () => 0.9 }),
    snake: [{ x: 3, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 1 }],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
  };

  const moved = advanceState(state);
  assert.equal(moved.status, "gameover");
});

test("self collision ends game", () => {
  const state = {
    ...createInitialState({ width: 6, height: 6, rng: () => 0.9 }),
    snake: [
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 1, y: 3 },
      { x: 1, y: 2 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    direction: { x: 0, y: 1 },
    nextDirection: { x: -1, y: 0 },
    food: { x: 5, y: 5 },
  };

  const moved = advanceState(state);
  assert.equal(moved.status, "gameover");
});

test("food placement never chooses occupied cells", () => {
  const rngValues = [0, 0, 0.5, 0.5];
  let index = 0;
  const rng = () => {
    const value = rngValues[index] ?? 0.8;
    index += 1;
    return value;
  };

  const state = {
    width: 4,
    height: 4,
    snake: [{ x: 0, y: 0 }, { x: 2, y: 2 }],
    rng,
  };

  const food = randomEmptyCell(state, rng);
  assert.notDeepEqual(food, { x: 0, y: 0 });
  assert.notDeepEqual(food, { x: 2, y: 2 });
});