# Collection of Classic Browser Games

This repository contains a set of simple, classic games implemented using HTML, JavaScript, and CSS. Each game is playable directly in a web browser with no additional setup required.

## Included Games

| Game | HTML File | Logic File | Style File | Tests |
|------|-----------|------------|------------|-------|
| Snake | `snake.html` | `snake.mjs` / `snake-logic.mjs` | `styles.css` | `snake-logic.test.mjs` |
| Tetris | `tetris.html` | `tetris.js` | `tetris.css` | - |
| Breakout | `breakout.html` | (inline JS) | `styles.css` | - |
| Pong | `pong.html` | (inline JS) | `styles.css` | - |
| Minesweeper | `minesweeper.html` | (inline JS) | `styles.css` | - |
| Pacman | `pacman.html` | (inline JS) | `styles.css` | - |
| Platform Fighter | `platform-fighter.html` | (inline JS) | `styles.css` | - |
| Space Invaders | `space-invaders.html` | (inline JS) | `styles.css` | - |

*Note:* some games keep their logic directly in the HTML file, while others use separate module scripts.

## Getting Started

1. **Open a game**
   - Simply open any of the `*.html` files in your web browser (e.g., double-click or drag into a browser window).
   - No server or build step is required.

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
