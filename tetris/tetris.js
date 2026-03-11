(() => {
  const BOARD_COLS = 10;
  const BOARD_ROWS = 20;
  const BLOCK_SIZE = 32;

  const BASE_DROP_INTERVAL = 900;
  const DROP_ACCELERATION = 70;
  const MIN_DROP_INTERVAL = 100;
  const LEVEL_STEP_LINES = 10;
  const SCORE_BY_LINES = [0, 100, 300, 500, 800];

  const PIECES = {
    I: [[1, 1, 1, 1]],
    J: [[1, 0, 0], [1, 1, 1]],
    L: [[0, 0, 1], [1, 1, 1]],
    O: [[1, 1], [1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    T: [[0, 1, 0], [1, 1, 1]],
    Z: [[1, 1, 0], [0, 1, 1]],
  };

  const PIECE_COLORS = {
    I: "#38e0ff",
    J: "#5f84ff",
    L: "#ff9a4c",
    O: "#ffd84c",
    S: "#64ff9b",
    T: "#ca7bff",
    Z: "#ff6e7f",
  };

  const boardCanvas = document.getElementById("tetrisBoard");
  const boardCtx = boardCanvas.getContext("2d");
  const nextCanvas = document.getElementById("nextBoard");
  const nextCtx = nextCanvas.getContext("2d");

  const startBtn = document.getElementById("startBtn");
  const resetBtn = document.getElementById("resetBtn");

  const scoreEl = document.getElementById("scoreValue");
  const linesEl = document.getElementById("linesValue");
  const levelEl = document.getElementById("levelValue");
  const statusEl = document.getElementById("statusValue");

  let board = createEmptyBoard();
  let currentPiece = null;
  let nextPiece = null;
  let bag = [];

  let score = 0;
  let lines = 0;
  let level = 1;

  let running = false;
  let gameOver = false;

  let previousTime = 0;
  let dropAccumulator = 0;
  let animationId = null;

  function createEmptyBoard() {
    return Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(null));
  }

  function cloneMatrix(matrix) {
    return matrix.map((row) => [...row]);
  }

  function refillBag() {
    bag = Object.keys(PIECES)
      .map((key) => key)
      .sort(() => Math.random() - 0.5);
  }

  function getNextType() {
    if (bag.length === 0) {
      refillBag();
    }
    return bag.pop();
  }

  function createPiece(type) {
    const matrix = cloneMatrix(PIECES[type]);
    return {
      type,
      color: PIECE_COLORS[type],
      matrix,
      x: Math.floor((BOARD_COLS - matrix[0].length) / 2),
      y: 0,
    };
  }

  function isCollision(piece, offsetX = 0, offsetY = 0, matrix = piece.matrix) {
    for (let row = 0; row < matrix.length; row += 1) {
      for (let col = 0; col < matrix[row].length; col += 1) {
        if (!matrix[row][col]) {
          continue;
        }

        const x = piece.x + col + offsetX;
        const y = piece.y + row + offsetY;

        if (x < 0 || x >= BOARD_COLS || y >= BOARD_ROWS) {
          return true;
        }

        if (y >= 0 && board[y][x]) {
          return true;
        }
      }
    }

    return false;
  }

  function rotateMatrixClockwise(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        rotated[col][rows - 1 - row] = matrix[row][col];
      }
    }

    return rotated;
  }

  function rotateCurrentPiece() {
    if (!currentPiece || !running) {
      return;
    }

    const rotated = rotateMatrixClockwise(currentPiece.matrix);
    const kickOffsets = [0, -1, 1, -2, 2];

    for (const offset of kickOffsets) {
      if (!isCollision(currentPiece, offset, 0, rotated)) {
        currentPiece.matrix = rotated;
        currentPiece.x += offset;
        return;
      }
    }
  }

  function moveCurrentPiece(dx, dy) {
    if (!currentPiece || !running) {
      return false;
    }

    if (!isCollision(currentPiece, dx, dy)) {
      currentPiece.x += dx;
      currentPiece.y += dy;
      return true;
    }

    return false;
  }

  function mergePiece() {
    currentPiece.matrix.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (!cell) {
          return;
        }

        const boardX = currentPiece.x + colIndex;
        const boardY = currentPiece.y + rowIndex;

        if (boardY >= 0) {
          board[boardY][boardX] = currentPiece.color;
        }
      });
    });
  }

  function clearLines() {
    let cleared = 0;

    for (let row = BOARD_ROWS - 1; row >= 0; row -= 1) {
      if (board[row].every(Boolean)) {
        board.splice(row, 1);
        board.unshift(Array(BOARD_COLS).fill(null));
        cleared += 1;
        row += 1;
      }
    }

    if (cleared > 0) {
      lines += cleared;
      score += SCORE_BY_LINES[cleared] * level;
      level = Math.floor(lines / LEVEL_STEP_LINES) + 1;
    }
  }

  function getDropInterval() {
    return Math.max(MIN_DROP_INTERVAL, BASE_DROP_INTERVAL - (level - 1) * DROP_ACCELERATION);
  }

  function spawnPiece() {
    if (!nextPiece) {
      nextPiece = createPiece(getNextType());
    }

    currentPiece = nextPiece;
    nextPiece = createPiece(getNextType());

    if (isCollision(currentPiece, 0, 0)) {
      endGame();
    }
  }

  function lockPiece() {
    mergePiece();
    clearLines();
    spawnPiece();
  }

  function softDrop() {
    if (!running) {
      return;
    }

    if (!moveCurrentPiece(0, 1)) {
      lockPiece();
    } else {
      score += 1;
    }
  }

  function hardDrop() {
    if (!running || !currentPiece) {
      return;
    }

    let distance = 0;
    while (moveCurrentPiece(0, 1)) {
      distance += 1;
    }

    score += distance * 2;
    lockPiece();
  }

  function endGame() {
    running = false;
    gameOver = true;
    statusEl.textContent = "game over";
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  function resetState() {
    board = createEmptyBoard();
    bag = [];
    currentPiece = null;
    nextPiece = null;

    score = 0;
    lines = 0;
    level = 1;

    running = false;
    gameOver = false;

    previousTime = 0;
    dropAccumulator = 0;

    statusEl.textContent = "ready";
    draw();
  }

  function startGame() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    board = createEmptyBoard();
    score = 0;
    lines = 0;
    level = 1;
    gameOver = false;
    running = true;
    dropAccumulator = 0;
    previousTime = 0;

    bag = [];
    currentPiece = createPiece(getNextType());
    nextPiece = createPiece(getNextType());

    if (isCollision(currentPiece, 0, 0)) {
      endGame();
      return;
    }

    statusEl.textContent = "running";
    draw();
    animationId = requestAnimationFrame(gameLoop);
  }

  function drawBlock(ctx, x, y, color, size) {
    const px = x * size;
    const py = y * size;

    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.strokeRect(px + 1.5, py + 1.5, size - 3, size - 3);
    ctx.restore();
  }

  function drawBoardGrid() {
    boardCtx.strokeStyle = "rgba(120, 140, 175, 0.16)";
    boardCtx.lineWidth = 1;

    for (let x = 0; x <= BOARD_COLS; x += 1) {
      boardCtx.beginPath();
      boardCtx.moveTo(x * BLOCK_SIZE, 0);
      boardCtx.lineTo(x * BLOCK_SIZE, BOARD_ROWS * BLOCK_SIZE);
      boardCtx.stroke();
    }

    for (let y = 0; y <= BOARD_ROWS; y += 1) {
      boardCtx.beginPath();
      boardCtx.moveTo(0, y * BLOCK_SIZE);
      boardCtx.lineTo(BOARD_COLS * BLOCK_SIZE, y * BLOCK_SIZE);
      boardCtx.stroke();
    }
  }

  function drawCurrentPiece() {
    if (!currentPiece) {
      return;
    }

    currentPiece.matrix.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (!cell) {
          return;
        }
        drawBlock(boardCtx, currentPiece.x + colIndex, currentPiece.y + rowIndex, currentPiece.color, BLOCK_SIZE);
      });
    });
  }

  function drawPlacedBlocks() {
    board.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell) {
          drawBlock(boardCtx, colIndex, rowIndex, cell, BLOCK_SIZE);
        }
      });
    });
  }

  function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    nextCtx.fillStyle = "#0a101b";
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (!nextPiece) {
      return;
    }

    const previewSize = 26;
    const matrix = nextPiece.matrix;
    const width = matrix[0].length * previewSize;
    const height = matrix.length * previewSize;
    const offsetX = Math.floor((nextCanvas.width - width) / 2 / previewSize);
    const offsetY = Math.floor((nextCanvas.height - height) / 2 / previewSize);

    matrix.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell) {
          drawBlock(nextCtx, offsetX + colIndex, offsetY + rowIndex, nextPiece.color, previewSize);
        }
      });
    });
  }

  function draw() {
    boardCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
    boardCtx.fillStyle = "#0a101b";
    boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);

    drawBoardGrid();
    drawPlacedBlocks();
    drawCurrentPiece();
    drawNextPiece();

    if (scoreEl) scoreEl.textContent = String(score);
    if (linesEl) linesEl.textContent = String(lines);
    if (levelEl) levelEl.textContent = String(level);

    if (!running && !gameOver) {
      statusEl.textContent = "ready";
    }
  }

  function update(deltaTime) {
    if (!running) {
      return;
    }

    dropAccumulator += deltaTime;
    const interval = getDropInterval();

    while (dropAccumulator >= interval && running) {
      dropAccumulator -= interval;
      if (!moveCurrentPiece(0, 1)) {
        lockPiece();
      }
    }
  }

  function gameLoop(timestamp) {
    if (!running) {
      return;
    }

    if (!previousTime) {
      previousTime = timestamp;
    }

    const deltaTime = timestamp - previousTime;
    previousTime = timestamp;

    update(deltaTime);
    draw();

    if (running) {
      animationId = requestAnimationFrame(gameLoop);
    }
  }

  function handleKeydown(event) {
    if (event.code === "Space") {
      event.preventDefault();
      hardDrop();
      draw();
      return;
    }

    if (!running) {
      return;
    }

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        moveCurrentPiece(-1, 0);
        break;
      case "ArrowRight":
        event.preventDefault();
        moveCurrentPiece(1, 0);
        break;
      case "ArrowDown":
        event.preventDefault();
        softDrop();
        break;
      case "ArrowUp":
        event.preventDefault();
        rotateCurrentPiece();
        break;
      default:
        return;
    }

    draw();
  }

  startBtn.addEventListener("click", startGame);

  resetBtn.addEventListener("click", () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    resetState();
  });

  window.addEventListener("keydown", handleKeydown);

  resetState();

  // เพิ่มไว้ด้านล่างสุดของไฟล์ tetris.js (ภายในฟังก์ชันหลัก)

function handleMobileInput(action) {
    if (!running && action !== 'start') return;

    switch (action) {
        case 'left': moveCurrentPiece(-1, 0); break;
        case 'right': moveCurrentPiece(1, 0); break;
        case 'down': softDrop(); break;
        case 'up': hardDrop(); break; // Hard Drop
        case 'rotate': rotateCurrentPiece(); break;
    }
    draw();
}

// ผูกเหตุการณ์ Pointer
document.querySelectorAll('.btn-ctrl').forEach(btn => {
    btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const action = btn.dataset.action;
        handleMobileInput(action);
    });
});
})();