document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const settingsPanel = document.getElementById('settings-panel');
    const gameStats = document.getElementById('game-stats');
    const boardContainer = document.getElementById('board-container');
    const gameBoard = document.getElementById('game-board');
    const resultModal = document.getElementById('result-modal');
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    const flagsCount = document.getElementById('flags-count');
    const timerDisplay = document.getElementById('timer');
    const resetButton = document.getElementById('reset-game');
    const mobileInstructions = document.getElementById('mobile-instructions');
    
    // 获取设置输入
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const minesInput = document.getElementById('mines');
    const startGameButton = document.getElementById('start-game');
    const presetButtons = document.querySelectorAll('.preset-btn');
    
    // 获取结果按钮
    const restartSameButton = document.getElementById('restart-same');
    const restartNewButton = document.getElementById('restart-new');
    
    // 游戏状态变量
    let board = [];
    let width = 10;
    let height = 10;
    let totalMines = 10;
    let flaggedCount = 0;
    let revealedCount = 0;
    let gameOver = false;
    let firstClick = true;
    let timerInterval;
    let seconds = 0;
    let currentSettings = {
        width: 10,
        height: 10,
        mines: 10
    };
    
    // 检测是否为移动设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // 长按相关变量
    let longPressTimer;
    const longPressDuration = 300; // 毫秒
    let isLongPress = false; // 标记是否为长按
    
    // 预设按钮事件
    presetButtons.forEach(button => {
        button.addEventListener('click', function() {
            const presetWidth = parseInt(this.dataset.width);
            const presetHeight = parseInt(this.dataset.height);
            const presetMines = parseInt(this.dataset.mines);
            
            widthInput.value = presetWidth;
            heightInput.value = presetHeight;
            minesInput.value = presetMines;
        });
    });
    
    // 验证并限制输入
    function validateInputs() {
        let w = parseInt(widthInput.value);
        let h = parseInt(heightInput.value);
        let m = parseInt(minesInput.value);
        
        // 限制范围
        w = Math.min(Math.max(w, 5), 30);
        h = Math.min(Math.max(h, 5), 30);
        
        // 地雷数不能超过格子总数的一半
        const maxMines = Math.floor((w * h) / 2);
        m = Math.min(Math.max(m, 1), maxMines);
        
        // 更新输入框
        widthInput.value = w;
        heightInput.value = h;
        minesInput.value = m;
        
        return { width: w, height: h, mines: m };
    }
    
    // 输入值变化时验证
    [widthInput, heightInput, minesInput].forEach(input => {
        input.addEventListener('change', validateInputs);
    });
    
    // 开始游戏
    startGameButton.addEventListener('click', function() {
        const settings = validateInputs();
        currentSettings = settings;
        setupGame(settings.width, settings.height, settings.mines);
    });
    
    // 重置游戏按钮
    resetButton.addEventListener('click', function() {
        resetGame(true);
    });
    
    // 重玩本局
    restartSameButton.addEventListener('click', function() {
        resultModal.classList.add('hidden');
        resetGame(false);
    });
    
    // 新游戏
    restartNewButton.addEventListener('click', function() {
        resultModal.classList.add('hidden');
        showSettings();
    });
    
    // 显示设置面板
    function showSettings() {
        stopTimer();
        boardContainer.classList.add('hidden');
        gameStats.classList.add('hidden');
        mobileInstructions.classList.add('hidden');
        settingsPanel.classList.remove('hidden');
    }
    
    // 设置游戏
    function setupGame(w, h, m) {
        width = w;
        height = h;
        totalMines = m;
        flaggedCount = 0;
        revealedCount = 0;
        gameOver = false;
        firstClick = true;
        seconds = 0;
        
        // 更新UI
        settingsPanel.classList.add('hidden');
        gameStats.classList.remove('hidden');
        boardContainer.classList.remove('hidden');
        flagsCount.textContent = totalMines;
        timerDisplay.textContent = '0';
        resetButton.textContent = '😊';
        
        // 在移动设备上显示操作提示
        if (isMobile) {
            mobileInstructions.classList.remove('hidden');
        }
        
        // 创建游戏板
        createBoard();
    }
    
    // 计算单元格大小
    function calculateCellSize() {
        // 基于屏幕宽度和游戏板宽度计算合适的单元格大小
        const screenWidth = window.innerWidth;
        const containerPadding = 40; // 容器左右padding总和
        const maxBoardWidth = screenWidth - containerPadding;
        
        // 计算合适的单元格大小
        let cellSize = 30; // 默认大小
        
        if (screenWidth <= 350) {
            cellSize = 25;
        } else if (screenWidth <= 480) {
            cellSize = 30;
        } else if (screenWidth <= 768) {
            cellSize = 35;
        }
        
        // 确保整个游戏板能在屏幕上显示
        const totalWidth = cellSize * width;
        if (totalWidth > maxBoardWidth) {
            cellSize = Math.floor(maxBoardWidth / width);
        }
        
        return cellSize;
    }
    
    // 创建游戏板
    function createBoard() {
        // 清空游戏板
        gameBoard.innerHTML = '';
        
        // 计算合适的单元格大小
        const cellSize = calculateCellSize();
        
        // 设置网格样式
        gameBoard.style.gridTemplateColumns = `repeat(${width}, ${cellSize}px)`;
        
        // 初始化空板
        board = [];
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                row.push({
                    x,
                    y,
                    mine: false,
                    revealed: false,
                    flagged: false,
                    count: 0
                });
            }
            board.push(row);
        }
        
        // 渲染单元格
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                // 设置单元格大小
                cell.style.width = `${cellSize}px`;
                cell.style.height = `${cellSize}px`;
                
                if (isMobile) {
                    // 移动设备使用长按来插旗
                    
                    // 触摸开始 - 开始计时长按
                    cell.addEventListener('touchstart', function(e) {
                        if (gameOver) return;
                        
                        const x = parseInt(this.dataset.x);
                        const y = parseInt(this.dataset.y);
                        isLongPress = false;
                        
                        // 开始长按计时
                        longPressTimer = setTimeout(() => {
                            isLongPress = true;
                            toggleFlag(x, y);
                        }, longPressDuration);
                    }, { passive: true });
                    
                    // 触摸结束 - 如果不是长按，则揭示单元格
                    cell.addEventListener('touchend', function(e) {
                        if (gameOver) return;
                        
                        // 清除长按计时器
                        clearTimeout(longPressTimer);
                        
                        // 如果不是长按，则揭示单元格
                        if (!isLongPress) {
                            const x = parseInt(this.dataset.x);
                            const y = parseInt(this.dataset.y);
                            
                            // 检查是否已标记旗帜
                            const cellData = board[y][x];
                            if (!cellData.flagged) {
                                if (firstClick) {
                                    firstClick = false;
                                    placeMines(x, y);
                                    startTimer();
                                }
                                revealCell(x, y);
                            }
                        }
                    });
                    
                    // 触摸移动 - 取消长按计时
                    cell.addEventListener('touchmove', function(e) {
                        clearTimeout(longPressTimer);
                    }, { passive: true });
                } else {
                    // 桌面设备使用左右键
                    
                    // 左键点击（揭示）
                    cell.addEventListener('click', function() {
                        if (gameOver) return;
                        
                        const x = parseInt(this.dataset.x);
                        const y = parseInt(this.dataset.y);
                        
                        if (firstClick) {
                            firstClick = false;
                            placeMines(x, y);
                            startTimer();
                        }
                        
                        revealCell(x, y);
                    });
                    
                    // 右键点击（标记）
                    cell.addEventListener('contextmenu', function(e) {
                        e.preventDefault();
                        if (gameOver) return;
                        
                        const x = parseInt(this.dataset.x);
                        const y = parseInt(this.dataset.y);
                        toggleFlag(x, y);
                    });
                }
                
                gameBoard.appendChild(cell);
            }
        }
    }
    
    // 放置地雷（确保第一次点击不是地雷）
    function placeMines(safeX, safeY) {
        let minesPlaced = 0;
        
        // 创建安全区域（3x3）
        const safeZone = [];
        for (let y = Math.max(0, safeY - 1); y <= Math.min(height - 1, safeY + 1); y++) {
            for (let x = Math.max(0, safeX - 1); x <= Math.min(width - 1, safeX + 1); x++) {
                safeZone.push(`${x},${y}`);
            }
        }
        
        // 放置地雷
        while (minesPlaced < totalMines) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            
            // 确保不在安全区域内且不是已有地雷
            if (!safeZone.includes(`${x},${y}`) && !board[y][x].mine) {
                board[y][x].mine = true;
                minesPlaced++;
                
                // 更新周围单元格的计数
                updateAdjacentCounts(x, y);
            }
        }
    }
    
    // 更新邻近单元格的地雷计数
    function updateAdjacentCounts(mineX, mineY) {
        for (let y = Math.max(0, mineY - 1); y <= Math.min(height - 1, mineY + 1); y++) {
            for (let x = Math.max(0, mineX - 1); x <= Math.min(width - 1, mineX + 1); x++) {
                if (!(x === mineX && y === mineY)) {
                    board[y][x].count++;
                }
            }
        }
    }
    
    // 揭示单元格
    function revealCell(x, y) {
        const cell = board[y][x];
        
        // 如果已揭示或已标记，不做任何操作
        if (cell.revealed || cell.flagged) return;
        
        // 标记为已揭示
        cell.revealed = true;
        revealedCount++;
        
        // 更新UI
        const cellElement = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
        cellElement.classList.add('revealed');
        
        // 如果是地雷，游戏结束
        if (cell.mine) {
            cellElement.classList.add('mine');
            cellElement.textContent = '💣';
            endGame(false);
            return;
        }
        
        // 如果有邻近地雷，显示数字
        if (cell.count > 0) {
            cellElement.textContent = cell.count;
            cellElement.dataset.count = cell.count;
        } else {
            // 如果没有邻近地雷，自动揭示邻近单元格
            for (let ny = Math.max(0, y - 1); ny <= Math.min(height - 1, y + 1); ny++) {
                for (let nx = Math.max(0, x - 1); nx <= Math.min(width - 1, x + 1); nx++) {
                    if (!(nx === x && ny === y)) {
                        revealCell(nx, ny);
                    }
                }
            }
        }
        
        // 检查是否胜利
        checkWin();
    }
    
    // 切换旗帜
    function toggleFlag(x, y) {
        const cell = board[y][x];
        
        // 如果单元格已被揭示，不做任何操作
        if (cell.revealed) return;
        
        const cellElement = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
        
        if (cell.flagged) {
            // 移除旗帜
            cell.flagged = false;
            cellElement.classList.remove('flagged');
            cellElement.textContent = '';
            flaggedCount--;
        } else {
            // 如果还有旗帜可用
            if (flaggedCount < totalMines) {
                // 添加旗帜
                cell.flagged = true;
                cellElement.classList.add('flagged');
                cellElement.textContent = '🚩';
                flaggedCount++;
            }
        }
        
        // 更新旗帜计数
        flagsCount.textContent = totalMines - flaggedCount;
        
        // 检查是否胜利
        checkWin();
    }
    
    // 检查是否胜利
    function checkWin() {
        // 胜利条件：所有非地雷单元格都被揭示
        const totalCells = width * height;
        const nonMineCells = totalCells - totalMines;
        
        if (revealedCount === nonMineCells) {
            endGame(true);
        }
    }
    
    // 游戏结束
    function endGame(isWin) {
        gameOver = true;
        stopTimer();
        
        // 更新表情
        resetButton.textContent = isWin ? '😎' : '😵';
        
        // 如果输了，显示所有地雷
        if (!isWin) {
            revealAllMines();
        }
        
        // 显示结果弹窗
        setTimeout(() => {
            resultTitle.textContent = isWin ? '恭喜你赢了！' : '游戏结束';
            resultMessage.textContent = isWin 
                ? `你用了${seconds}秒完成了游戏！` 
                : '很遗憾，你触发了地雷。';
            resultModal.classList.remove('hidden');
        }, 1000);
    }
    
    // 显示所有地雷
    function revealAllMines() {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cell = board[y][x];
                if (cell.mine && !cell.flagged) {
                    const cellElement = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
                    cellElement.classList.add('revealed');
                    cellElement.classList.add('mine');
                    cellElement.textContent = '💣';
                } else if (!cell.mine && cell.flagged) {
                    // 标记错误的旗帜
                    const cellElement = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
                    cellElement.textContent = '❌';
                }
            }
        }
    }
    
    // 重置游戏
    function resetGame(showSettingsPanel) {
        stopTimer();
        if (showSettingsPanel) {
            showSettings();
        } else {
            setupGame(currentSettings.width, currentSettings.height, currentSettings.mines);
        }
    }
    
    // 计时器函数
    function startTimer() {
        seconds = 0;
        timerDisplay.textContent = seconds;
        
        timerInterval = setInterval(() => {
            seconds++;
            timerDisplay.textContent = seconds;
        }, 1000);
    }
    
    function stopTimer() {
        clearInterval(timerInterval);
    }
    
    // 监听窗口大小变化，调整棋盘
    window.addEventListener('resize', function() {
        if (!gameOver && !firstClick) {
            // 只有在游戏进行中才重新调整棋盘大小
            const cellSize = calculateCellSize();
            
            // 更新棋盘样式
            gameBoard.style.gridTemplateColumns = `repeat(${width}, ${cellSize}px)`;
            
            // 更新所有单元格大小
            const cells = document.querySelectorAll('.cell');
            cells.forEach(cell => {
                cell.style.width = `${cellSize}px`;
                cell.style.height = `${cellSize}px`;
            });
        }
    });
});
