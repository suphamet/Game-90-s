const SIZE = 10;
const MINES = 15;

const boardEl = document.getElementById("board");
const minesLeftEl = document.getElementById("minesLeft");
const gameStateEl = document.getElementById("gameState");
const resetBtn = document.getElementById("resetBtn");

let board = [];
let gameOver = false;
let openedCells = 0;
let flagsUsed = 0;

function createCell() {
  return { mine: false, revealed: false, flagged: false, nearby: 0 };
}

function initBoard() {
  board = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, createCell));
  gameOver = false;
  openedCells = 0;
  flagsUsed = 0;
  gameStateEl.textContent = "running";

  placeMines();
  calculateNearbyCounts();
  renderBoard();
  updateMinesLeft();
}

function placeMines() {
  let placed = 0;
  while (placed < MINES) {
    const row = Math.floor(Math.random() * SIZE);
    const col = Math.floor(Math.random() * SIZE);
    if (!board[row][col].mine) {
      board[row][col].mine = true;
      placed += 1;
    }
  }
}

function inBounds(row, col) {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

function getNeighbors(row, col) {
  const neighbors = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) {
        continue;
      }
      const nr = row + dr;
      const nc = col + dc;
      if (inBounds(nr, nc)) {
        neighbors.push({ row: nr, col: nc });
      }
    }
  }
  return neighbors;
}

function calculateNearbyCounts() {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (board[row][col].mine) {
        continue;
      }
      const mines = getNeighbors(row, col).filter(({ row: r, col: c }) => board[r][c].mine).length;
      board[row][col].nearby = mines;
    }
  }
}

function revealCell(row, col) {
  const cell = board[row][col];
  if (cell.revealed || cell.flagged || gameOver) {
    return;
  }

  cell.revealed = true;
  openedCells += 1;

  if (cell.mine) {
    triggerGameOver();
    return;
  }

  if (cell.nearby === 0) {
    floodFill(row, col);
  }

  checkWin();
  renderBoard();
}

function floodFill(startRow, startCol) {
  const queue = [{ row: startRow, col: startCol }];
  while (queue.length > 0) {
    const { row, col } = queue.shift();
    getNeighbors(row, col).forEach(({ row: nr, col: nc }) => {
      const next = board[nr][nc];
      if (next.revealed || next.flagged || next.mine) {
        return;
      }

      next.revealed = true;
      openedCells += 1;

      if (next.nearby === 0) {
        queue.push({ row: nr, col: nc });
      }
    });
  }
}

function toggleFlag(row, col) {
  const cell = board[row][col];
  if (cell.revealed || gameOver) {
    return;
  }

  cell.flagged = !cell.flagged;
  flagsUsed += cell.flagged ? 1 : -1;
  updateMinesLeft();
  renderBoard();
}

function updateMinesLeft() {
  minesLeftEl.textContent = String(Math.max(0, MINES - flagsUsed));
}

function triggerGameOver() {
  gameOver = true;
  gameStateEl.textContent = "game over";
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (board[row][col].mine) {
        board[row][col].revealed = true;
      }
    }
  }
  renderBoard();
  alert("Game Over: เจอระเบิด");
}

function checkWin() {
  if (gameOver) {
    return;
  }
  const safeCells = SIZE * SIZE - MINES;
  if (openedCells >= safeCells) {
    gameOver = true;
    gameStateEl.textContent = "win";
    alert("ชนะแล้ว เปิดครบทุกช่องที่ไม่ใช่ระเบิด");
  }
}

function cellContent(cell) {
  if (cell.flagged && !cell.revealed) {
    return "⚑";
  }
  if (!cell.revealed) {
    return "";
  }
  if (cell.mine) {
    return "✹";
  }
  return cell.nearby > 0 ? String(cell.nearby) : "";
}

function renderBoard() {
  boardEl.innerHTML = "";
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const cell = board[row][col];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cell";
      btn.dataset.row = String(row);
      btn.dataset.col = String(col);
      btn.textContent = cellContent(cell);

      if (cell.revealed) {
        btn.classList.add("open");
      }
      if (cell.mine && cell.revealed) {
        btn.classList.add("mine");
      }
      if (cell.flagged) {
        btn.classList.add("flagged");
      }
      if (cell.revealed && cell.nearby > 0) {
        btn.classList.add(`n${cell.nearby}`);
      }

      btn.addEventListener("click", () => revealCell(row, col));
      btn.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        toggleFlag(row, col);
      });

      boardEl.appendChild(btn);
    }
  }
}

resetBtn.addEventListener("click", initBoard);
initBoard();
