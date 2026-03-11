// word-game.js
import { WORD_DATA } from './word.js';

let score = 0;
let timeLeft = 0;
let gameActive = false;
let currentWords = [];
let timerInterval = null;

const wordEl = document.getElementById('currentWord');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const overlay = document.getElementById('startOverlay');

function initGame() {
    const lang = document.getElementById('langSelect').value;
    const time = parseInt(document.getElementById('timeSelect').value);

    score = 0;
    timeLeft = time;
    currentWords = [...WORD_DATA[lang]].sort(() => Math.random() - 0.5);
    
    updateUI();
    overlay.style.display = 'none';
    gameActive = false; // ยังไม่เริ่มเกมจริง

    let countdown = 3;
    wordEl.textContent = countdown;
    
    const countInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            wordEl.textContent = countdown;
        } else {
            clearInterval(countInterval);
            startGameActual();
        }
    }, 1000);
}

function startGameActual() {
    gameActive = true;
    nextWord();
    if(timerInterval) clearInterval(timerInterval);
    startTimer();
}

function startTimer() {
    timerInterval = setInterval(() => {
        if (!gameActive) return;
        timeLeft--;
        timerEl.textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function nextWord() {
    if (currentWords.length === 0) {
        // วนซ้ำคำเดิมถ้าหมดชุด
        const lang = document.getElementById('langSelect').value;
        currentWords = [...WORD_DATA[lang]].sort(() => Math.random() - 0.5);
    }
    wordEl.textContent = currentWords.pop();
}

function handleAction(isCorrect) {
    if (!gameActive) return;
    
    if (isCorrect) {
        score++;
        flashBackground("#004400"); // เขียว
    } else {
        flashBackground("#440000"); // แดง
    }
    
    updateUI();
    nextWord();
}

function flashBackground(color) {
    document.body.style.backgroundColor = color;
    setTimeout(() => document.body.style.backgroundColor = "#000", 150);
}

function updateUI() {
    scoreEl.textContent = score;
    timerEl.textContent = timeLeft;
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    alert(`FINISH! SCORE: ${score}`);
    overlay.style.display = 'flex';
}

// Event Listeners
document.getElementById('leftControl').onclick = () => handleAction(false);
document.getElementById('rightControl').onclick = () => handleAction(true);
document.getElementById('startBtn').onclick = initGame;