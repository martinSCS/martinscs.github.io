(function () {
    const size = 15;
    const stones = [90, 10, 70, 30];
    const starPoints = new Set(["3,3", "3,11", "7,7", "11,3", "11,11"]);

    const boardElement = document.getElementById("board");
    const observeButton = document.getElementById("observe-btn");
    const resetButton = document.getElementById("reset-btn");
    const resultText = document.getElementById("result-text");
    const nextStone = document.getElementById("next-stone");

    let board = createBoard();
    let observedBoard = null;
    let nextIndex = 0;
    let observing = false;

    function createBoard() {
        return Array.from({ length: size }, () => Array(size).fill(null));
    }

    function renderBoard() {
        const displayBoard = observing ? observedBoard : board;
        boardElement.innerHTML = "";
        boardElement.classList.toggle("observing", observing);

        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                const cell = document.createElement("button");
                cell.type = "button";
                cell.className = "cell";
                cell.setAttribute("role", "gridcell");
                cell.setAttribute("aria-label", `${x + 1} 行 ${y + 1} 列`);
                cell.dataset.x = x;
                cell.dataset.y = y;

                if (x === 0) cell.classList.add("edge-top");
                if (x === size - 1) cell.classList.add("edge-bottom");
                if (y === 0) cell.classList.add("edge-left");
                if (y === size - 1) cell.classList.add("edge-right");
                if (starPoints.has(`${x},${y}`)) {
                    cell.classList.add("star");
                    cell.appendChild(document.createElement("span")).className = "star-dot";
                }

                const value = displayBoard[x][y];
                if (value !== null) {
                    cell.appendChild(createStone(value));
                    cell.setAttribute("aria-label", `${x + 1} 行 ${y + 1} 列，${stoneLabel(value)}`);
                }

                cell.addEventListener("click", () => placeStone(x, y));
                boardElement.appendChild(cell);
            }
        }
    }

    function createStone(value) {
        const stone = document.createElement("span");
        stone.className = "stone";
        if (value === 100 || value === 90) {
            stone.classList.add("black");
        } else if (value === 70) {
            stone.classList.add("dark-gray");
        } else if (value === 30) {
            stone.classList.add("light-gray");
        } else {
            stone.classList.add("white");
        }
        stone.textContent = value === 0 || value === 100 ? "" : value;
        return stone;
    }

    function stoneLabel(value) {
        if (value === 100) return "黑棋";
        if (value === 0) return "白棋";
        return `${value}% 黑棋概率`;
    }

    function renderStatus() {
        nextStone.innerHTML = "";
        nextStone.appendChild(createStone(stones[nextIndex]));

        const result = observing ? checkWin(observedBoard) : 0;
        if (!observing) {
            resultText.textContent = "未分胜负";
        } else if (result === 1) {
            resultText.textContent = "黑胜";
        } else if (result === -1) {
            resultText.textContent = "白胜";
        } else {
            resultText.textContent = "未分胜负";
        }

        observeButton.textContent = observing ? "结束观测" : "开始观测";
    }

    function placeStone(x, y) {
        if (observing || board[x][y] !== null) return;
        board[x][y] = stones[nextIndex];
        nextIndex = (nextIndex + 1) % stones.length;
        render();
    }

    function observe() {
        observedBoard = board.map((row) => row.map((value) => {
            if (value === null) return null;
            return Math.random() < value / 100 ? 100 : 0;
        }));
        observing = true;
        render();
    }

    function stopObserving() {
        observing = false;
        observedBoard = null;
        render();
    }

    function checkWin(candidateBoard) {
        const directions = [
            [1, 0],
            [0, 1],
            [1, 1],
            [1, -1],
        ];

        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                const player = candidateBoard[x][y];
                if (player === null) continue;

                for (const [dx, dy] of directions) {
                    let count = 0;
                    for (let i = 0; i < 5; i++) {
                        const nx = x + i * dx;
                        const ny = y + i * dy;
                        if (nx < 0 || nx >= size || ny < 0 || ny >= size) break;
                        if (candidateBoard[nx][ny] !== player) break;
                        count++;
                    }
                    if (count === 5) return player === 100 ? 1 : -1;
                }
            }
        }

        return 0;
    }

    function resetGame() {
        board = createBoard();
        observedBoard = null;
        nextIndex = 0;
        observing = false;
        render();
    }

    function render() {
        renderBoard();
        renderStatus();
    }

    observeButton.addEventListener("click", () => {
        if (observing) {
            stopObserving();
        } else {
            observe();
        }
    });

    resetButton.addEventListener("click", resetGame);

    render();
})();
