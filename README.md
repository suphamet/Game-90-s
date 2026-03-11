# Collection of Classic Browser Games

This repository contains a set of simple, classic games implemented using HTML, JavaScript, and CSS. Each game is playable directly in a web browser with no additional setup required.

## Included Games

| Game | HTML File | Logic File | Style File | Tests |
|------|-----------|------------|------------|-------|
| Snake | `snake/snake.html` | `snake/snake.mjs`<br>`snake/snake-logic.mjs` | shared `styles.css` | `snake/snake-logic.test.mjs` |
| Tetris | `tetris/tetris.html` | `tetris/tetris.js` | `tetris/tetris.css` | - |
| Breakout | `breakout/breakout.html` | (inline JS) | `breakout/breakout.css` | - |
| Pong | `pong/pong.html` | (inline JS) | `pong/pong.css` | - |
| Minesweeper | `minesweeper/minesweeper.html` | `minesweeper/minesweeper.js` | `minesweeper/minesweeper.css` | - |
| Pacman | `pacman/pacman.html` | (inline JS) | `pacman/pacman.css` | - |
| Platform Fighter | `platform-fighter/platform-fighter.html` | (inline JS) | `platform-fighter/platform-fighter.css` | - |
| Space Invaders | `space-invaders/space-invaders.html` | `space-invaders/space-invaders.js` | `space-invaders/space-invaders.css` | - |

*Note:* each game now lives in its own folder. Most titles have dedicated `.js` and `.css` files pulled in by their HTML, while a few still contain inline scripts/styles.

## Getting Started

1. **Open a game**
   - Navigate to the folder for a particular title and open its `*.html` file in a browser (e.g., `snake/snake.html`).
   - No server or build step is required; everything runs client‑side.

2. **Run tests (Node.js)**
   - If you wish to run the provided logic tests for Snake, ensure you have Node.js installed.
   - From the project root, run:
     ```bash
     node snake-logic.test.mjs
     ```

## Development

- All code is written in plain JavaScript (ES modules) and standard CSS.
- You can edit the HTML/CSS/JS files directly and refresh the browser to see changes.
- No external dependencies or package manager configuration are used.

## Technologies

- HTML5
- JavaScript (ES modules)
- CSS (plain styles)

## License

This project is available under the [MIT License](LICENSE) (or specify appropriate license). If no license file is included, please consider that the code is provided "as-is".

## Contact

Created by [Your Name]. Feel free to open issues or reach out with questions.
