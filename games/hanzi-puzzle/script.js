document.addEventListener('DOMContentLoaded', () => {
    // 国际化支持
    const i18n = {
        'zh-CN': {
            'game-title': '汉字拼图猜字游戏',
            'game-subtitle': '拼出汉字，猜出它是什么',
            'puzzle-size': '拼图大小:',
            'custom-size': '自定义',
            'custom-size-title': '自定义拼图大小',
            'custom-size-desc': '请选择2-8之间的数字',
            'start-game': '开始游戏',
            'moves': '步',
            'cancel': '取消',
            'confirm': '确认',
            'puzzle-complete': '拼图完成！',
            'guess-prompt': '请猜一猜这个汉字是什么？',
            'enter-character': '输入汉字',
            'confirm-guess': '确认',
            'correct-guess': '正确！',
            'incorrect-guess': '不正确，请再试一次',
            'congratulations': '恭喜！挑战成功！',
            'correct-character': '正确汉字:',
            'time-spent': '用时:',
            'total-moves': '步数:',
            'play-again': '再玩一次',
            'game-hint': '提示：完成拼图后，需要猜出正确的汉字才能获胜'
        },
        'zh-TW': {
            'game-title': '漢字拼圖猜字遊戲',
            'game-subtitle': '拼出漢字，猜出它是什麼',
            'puzzle-size': '拼圖大小:',
            'custom-size': '自定義',
            'custom-size-title': '自定義拼圖大小',
            'custom-size-desc': '請選擇2-8之間的數字',
            'start-game': '開始遊戲',
            'moves': '步',
            'cancel': '取消',
            'confirm': '確認',
            'puzzle-complete': '拼圖完成！',
            'guess-prompt': '請猜一猜這個漢字是什麼？',
            'enter-character': '輸入漢字',
            'confirm-guess': '確認',
            'correct-guess': '正確！',
            'incorrect-guess': '不正確，請再試一次',
            'congratulations': '恭喜！挑戰成功！',
            'correct-character': '正確漢字:',
            'time-spent': '用時:',
            'total-moves': '步數:',
            'play-again': '再玩一次',
            'game-hint': '提示：完成拼圖後，需要猜出正確的漢字才能獲勝'
        },
        'ja': {
            'game-title': '漢字パズル当てゲーム',
            'game-subtitle': '漢字を完成させて、何の字か当ててみよう',
            'puzzle-size': 'パズルサイズ:',
            'custom-size': 'カスタム',
            'custom-size-title': 'カスタムサイズ設定',
            'custom-size-desc': '2から8の間で選んでください',
            'start-game': 'ゲーム開始',
            'moves': '手',
            'cancel': 'キャンセル',
            'confirm': '確認',
            'puzzle-complete': 'パズル完成！',
            'guess-prompt': 'この漢字は何でしょうか？',
            'enter-character': '漢字を入力',
            'confirm-guess': '確認',
            'correct-guess': '正解！',
            'incorrect-guess': '不正解、もう一度お試しください',
            'congratulations': 'おめでとうございます！',
            'correct-character': '正解の漢字:',
            'time-spent': '所要時間:',
            'total-moves': '手数:',
            'play-again': 'もう一度プレイ',
            'game-hint': 'ヒント：パズルを完成させた後、正しい漢字を当てると勝利です'
        },
        'ko': {
            'game-title': '한자 퍼즐 맞추기 게임',
            'game-subtitle': '한자를 완성하고 무슨 글자인지 맞춰보세요',
            'puzzle-size': '퍼즐 크기:',
            'custom-size': '사용자 지정',
            'custom-size-title': '사용자 지정 퍼즐 크기',
            'custom-size-desc': '2에서 8 사이의 숫자를 선택하세요',
            'start-game': '게임 시작',
            'moves': '이동',
            'cancel': '취소',
            'confirm': '확인',
            'puzzle-complete': '퍼즐 완성!',
            'guess-prompt': '이 한자가 무엇인지 맞춰보세요?',
            'enter-character': '한자 입력',
            'confirm-guess': '확인',
            'correct-guess': '정답!',
            'incorrect-guess': '틀렸습니다. 다시 시도하세요',
            'congratulations': '축하합니다! 성공했습니다!',
            'correct-character': '정답 한자:',
            'time-spent': '소요 시간:',
            'total-moves': '이동 횟수:',
            'play-again': '다시 하기',
            'game-hint': '힌트: 퍼즐을 완성한 후 정확한 한자를 맞춰야 승리합니다'
        },
        'en': {
            'game-title': 'Chinese Character Puzzle Game',
            'game-subtitle': 'Complete the puzzle and guess the character',
            'puzzle-size': 'Puzzle Size:',
            'custom-size': 'Custom',
            'custom-size-title': 'Custom Puzzle Size',
            'custom-size-desc': 'Please select a number between 2 and 8',
            'start-game': 'Start Game',
            'moves': 'moves',
            'cancel': 'Cancel',
            'confirm': 'Confirm',
            'puzzle-complete': 'Puzzle Complete!',
            'guess-prompt': 'Can you guess what this Chinese character is?',
            'enter-character': 'Enter character',
            'confirm-guess': 'Submit',
            'correct-guess': 'Correct!',
            'incorrect-guess': 'Incorrect, please try again',
            'congratulations': 'Congratulations! Challenge completed!',
            'correct-character': 'Correct Character:',
            'time-spent': 'Time Spent:',
            'total-moves': 'Total Moves:',
            'play-again': 'Play Again',
            'game-hint': 'Hint: After completing the puzzle, you need to guess the correct character to win'
        }
    };

    // DOM元素
    const customSizeModal = document.getElementById('custom-size-modal');
    const customSizeSlider = document.getElementById('custom-size-slider');
    const sizePreviewValue = document.getElementById('size-preview-value');
    const sizePreviewValue2 = document.getElementById('size-preview-value-2');
    const cancelCustomSizeBtn = document.getElementById('cancel-custom-size');
    const confirmCustomSizeBtn = document.getElementById('confirm-custom-size');
    const sizeBtns = document.querySelectorAll('.size-btn');
    const customSizeBtn = document.querySelector('.custom-size');
    const startGameButton = document.getElementById('start-game');
    const puzzleGrid = document.getElementById('puzzle-grid');
    const moveCountSpan = document.getElementById('move-count');
    const timerSpan = document.getElementById('timer');
    const guessModal = document.getElementById('guess-modal');
    const characterGuessInput = document.getElementById('character-guess');
    const submitGuessButton = document.getElementById('submit-guess');
    const guessFeedback = document.getElementById('guess-feedback');
    const completeMessage = document.getElementById('complete-message');
    const correctCharacterSpan = document.getElementById('correct-character');
    const finalTimeSpan = document.getElementById('final-time');
    const finalMovesSpan = document.getElementById('final-moves');
    const playAgainButton = document.getElementById('play-again');
    const langButtons = document.querySelectorAll('.lang-btn');

    // 游戏状态
    let gameState = {
        gridSize: 4,
        character: '',
        characterCode: '',
        tiles: [],
        emptyTileIndex: null,
        moveCount: 0,
        isComplete: false,
        isPuzzleFinished: false,
        originalImageUrl: '',
        startTime: null,
        timerInterval: null,
        elapsedTime: 0,
        currentLanguage: 'zh-CN' // 默认语言
    };

    // 初始化语言
    initializeLanguage();

    // 自定义大小滑块事件
    customSizeSlider.addEventListener('input', () => {
        const value = customSizeSlider.value;
        sizePreviewValue.textContent = value;
        sizePreviewValue2.textContent = value;
    });

    // 打开自定义大小模态框
    customSizeBtn.addEventListener('click', () => {
        customSizeModal.classList.remove('hidden');
    });

    // 取消自定义大小
    cancelCustomSizeBtn.addEventListener('click', () => {
        customSizeModal.classList.add('hidden');
    });

    // 确认自定义大小
    confirmCustomSizeBtn.addEventListener('click', () => {
        const newSize = parseInt(customSizeSlider.value);
        gameState.gridSize = newSize;
        
        // 更新按钮状态
        sizeBtns.forEach(btn => btn.classList.remove('active'));
        customSizeBtn.classList.add('active');

        // 更新自定义按钮文本
        updateCustomSizeButtonText(newSize);
        
        customSizeModal.classList.add('hidden');
    });

    function updateCustomSizeButtonText(size) {
        // 检查是否是预设尺寸
        const isPresetSize = [3, 4, 5].includes(size);
        
        // 如果是预设尺寸且不是通过自定义按钮设置的，显示"自定义"文本
        if (isPresetSize && !customSizeBtn.classList.contains('active')) {
            customSizeBtn.textContent = i18n[gameState.currentLanguage]['custom-size'];
        } else {
            // 否则显示尺寸
            customSizeBtn.textContent = `${size}×${size}`;
        }
    }

    // 预设大小按钮
    document.querySelectorAll('.preset-size').forEach(btn => {
        btn.addEventListener('click', () => {
            const size = parseInt(btn.dataset.size);
            gameState.gridSize = size;
            
            // 更新按钮状态
            sizeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 重置自定义按钮文本
            customSizeBtn.textContent = i18n[gameState.currentLanguage]['custom-size'];
        });
    });

    // 语言选择器
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            changeLanguage(btn.dataset.lang);
        });
    });

    // 开始新游戏
    startGameButton.addEventListener('click', startNewGame);
    
    // 再玩一次
    playAgainButton.addEventListener('click', () => {
        completeMessage.classList.add('hidden');
        startNewGame();
    });
    
    // 提交汉字猜测
    submitGuessButton.addEventListener('click', checkCharacterGuess);
    
    // 允许按Enter提交猜测
    characterGuessInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkCharacterGuess();
        }
    });

    // 初始化语言设置
    function initializeLanguage() {
        // 获取用户浏览器语言
        const userLanguage = navigator.language || navigator.userLanguage;
        
        // 确定要使用的语言
        let detectedLanguage;
        
        if (userLanguage.startsWith('zh-CN') || userLanguage.startsWith('zh-Hans')) {
            detectedLanguage = 'zh-CN'; // 简体中文
        } else if (userLanguage.startsWith('zh-TW') || userLanguage.startsWith('zh-Hant') || userLanguage === 'zh-HK') {
            detectedLanguage = 'zh-TW'; // 繁体中文
        } else if (userLanguage.startsWith('ja')) {
            detectedLanguage = 'ja'; // 日语
        } else if (userLanguage.startsWith('ko')) {
            detectedLanguage = 'ko'; // 韩语
        } else {
            detectedLanguage = 'en'; // 默认英语
        }
        
        // 设置当前语言
        changeLanguage(detectedLanguage);
    }

    // 切换语言
    function changeLanguage(lang) {
        // 更新当前语言
        gameState.currentLanguage = lang;
      
        document.documentElement.setAttribute("lang", lang);
        
        // 更新按钮状态
        langButtons.forEach(btn => {
            if (btn.dataset.lang === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // 更新所有带有data-i18n属性的元素
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (i18n[lang] && i18n[lang][key]) {
                element.textContent = i18n[lang][key];
            }
        });
        
        // 更新placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            if (i18n[lang] && i18n[lang][key]) {
                element.placeholder = i18n[lang][key];
            }
        });

        // 检查自定义按钮是否处于活动状态
        if (customSizeBtn.classList.contains('active')) {
            // 如果活动，显示当前尺寸
            customSizeBtn.textContent = `${gameState.gridSize}×${gameState.gridSize}`;
        } else {
            // 否则显示新语言的"自定义"文本
            customSizeBtn.textContent = i18n[lang]['custom-size'];
        }
        
        // 更新页面标题
        document.title = i18n[lang]['game-title'];
    }

    // 开始新游戏
    async function startNewGame() {
        // 重置游戏状态
        gameState.moveCount = 0;
        gameState.isComplete = false;
        gameState.isPuzzleFinished = false;
        gameState.elapsedTime = 0;
        moveCountSpan.textContent = '0';
        timerSpan.textContent = '00:00';
        completeMessage.classList.add('hidden');
        guessModal.classList.add('hidden');

        // 更新自定义按钮文本
        if (customSizeBtn.classList.contains('active')) {
            customSizeBtn.textContent = `${gameState.gridSize}×${gameState.gridSize}`;
        } else {
            customSizeBtn.textContent = i18n[gameState.currentLanguage]['custom-size'];
        }
        
        // 清除之前的计时器
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
        }
        
        // 随机生成汉字
        await generateRandomCharacter();
        
        // 生成拼图
        createPuzzle();
        
        // 开始计时
        startTimer();
    }

    // 开始计时器
    function startTimer() {
        gameState.startTime = Date.now();
        gameState.timerInterval = setInterval(() => {
            if (!gameState.isPuzzleFinished) {
                gameState.elapsedTime = Math.floor((Date.now() - gameState.startTime) / 1000);
                updateTimerDisplay();
            }
        }, 1000);
        updateTimerDisplay();
    }

    // 更新计时器显示
    function updateTimerDisplay() {
        const minutes = Math.floor(gameState.elapsedTime / 60);
        const seconds = gameState.elapsedTime % 60;
        timerSpan.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // 生成随机汉字
    async function generateRandomCharacter() {
        // 汉字Unicode范围：4E00-9FFF
        const min = 0x4E00;
        const max = 0x9FFF;
        
        // 生成随机Unicode码点
        const codePoint = Math.floor(Math.random() * (max - min + 1)) + min;
        
        // 将码点转换为字符
        gameState.character = String.fromCodePoint(codePoint);
        
        // 获取十六进制表示
        gameState.characterCode = codePoint.toString(16).toLowerCase();
      
        let suffix;
        switch (gameState.currentLanguage) {
          case 'zh-CN':
            suffix = '-g';
            break;
          case 'zh-TW':
            suffix = '-t';
            break;
          case 'ja':
            suffix = '-j';
            break;
          case 'ko':
            suffix = '-k';
            break;
          default:
            suffix='';
        }
        
        // 构造GlyphWiki URL
        gameState.originalImageUrl = `https://glyphwiki.org/glyph/u${gameState.characterCode}${suffix}.svg`;
        
        // 确保图像加载成功
        try {
            const response = await fetch(gameState.originalImageUrl);
            if (!response.ok) throw new Error('无法加载汉字图像');
        } catch (error) {
            console.error('加载汉字图像失败:', error);
            // 如果加载失败，重新尝试
            return generateRandomCharacter();
        }
    }

    // 创建拼图
    function createPuzzle() {
        // 清空拼图容器
        puzzleGrid.innerHTML = '';
        
        // 设置网格样式
        const tileSize = 300 / gameState.gridSize;
        puzzleGrid.style.gridTemplateColumns = `repeat(${gameState.gridSize}, ${tileSize}px)`;
        puzzleGrid.style.gridTemplateRows = `repeat(${gameState.gridSize}, ${tileSize}px)`;
        
        // 创建拼图数组
        gameState.tiles = Array.from({ length: gameState.gridSize * gameState.gridSize }, (_, index) => index);
        
        // 移除最后一个块作为空位
        gameState.emptyTileIndex = gameState.tiles.length - 1;
        
        // 打乱拼图（确保可解）
        shufflePuzzle();
        
        // 渲染拼图
        renderPuzzle();
    }

    // 打乱拼图（确保可解）
    function shufflePuzzle() {
        const size = gameState.gridSize;
        const totalTiles = size * size;
        
        // 执行一系列有效的移动来打乱拼图
        // 这确保了拼图一定是可解的
        for (let i = 0; i < totalTiles * 20; i++) {
            const emptyRow = Math.floor(gameState.emptyTileIndex / size);
            const emptyCol = gameState.emptyTileIndex % size;
            
            // 确定可以移动的方向
            const directions = [];
            
            if (emptyRow > 0) directions.push('up');
            if (emptyRow < size - 1) directions.push('down');
            if (emptyCol > 0) directions.push('left');
            if (emptyCol < size - 1) directions.push('right');
            
            // 随机选择一个方向
            const direction = directions[Math.floor(Math.random() * directions.length)];
            
            // 移动空格
            let newEmptyIndex;
            
            switch (direction) {
                case 'up':
                    newEmptyIndex = gameState.emptyTileIndex - size;
                    break;
                case 'down':
                    newEmptyIndex = gameState.emptyTileIndex + size;
                    break;
                case 'left':
                    newEmptyIndex = gameState.emptyTileIndex - 1;
                    break;
                case 'right':
                    newEmptyIndex = gameState.emptyTileIndex + 1;
                    break;
            }
            
            // 交换空格和目标位置的值
            [gameState.tiles[gameState.emptyTileIndex], gameState.tiles[newEmptyIndex]] = 
            [gameState.tiles[newEmptyIndex], gameState.tiles[gameState.emptyTileIndex]];
            
            // 更新空格位置
            gameState.emptyTileIndex = newEmptyIndex;
        }
    }

    // 渲染拼图
    function renderPuzzle() {
        puzzleGrid.innerHTML = '';
        const size = gameState.gridSize;
        
        for (let i = 0; i < size * size; i++) {
            const tileElement = document.createElement('div');
            const tileValue = gameState.tiles[i];
            
            if (tileValue === size * size - 1) {
                // 空格
                tileElement.classList.add('puzzle-tile', 'empty-tile');
            } else {
                // 拼图块
                tileElement.classList.add('puzzle-tile');
                
                // 如果拼图已经完成但还未通过字符猜测，添加锁定类
                if (gameState.isPuzzleFinished) {
                    tileElement.classList.add('locked');
                }
                
                // 计算原始位置
                const originalRow = Math.floor(tileValue / size);
                const originalCol = tileValue % size;
                
                // 设置背景位置以显示正确的图像部分
                tileElement.style.backgroundImage = `url(${gameState.originalImageUrl})`;
                tileElement.style.backgroundSize = `${size * 100}%`;
                tileElement.style.backgroundPosition = `-${originalCol * 100}% -${originalRow * 100}%`;
                
                // 添加序号提示元素
                const tileNumber = document.createElement('div');
                tileNumber.classList.add('tile-number');
                // 计算原始序号 (从1开始)
                const originalNumber = tileValue + 1;
                tileNumber.textContent = originalNumber;
                tileElement.appendChild(tileNumber);
                
                // 添加悬停事件来显示序号
                let hoverTimer;
                tileElement.addEventListener('mouseenter', () => {
                    hoverTimer = setTimeout(() => {
                        tileNumber.classList.add('visible');
                    }, 500); // 悬停0.5秒后显示
                });
                
                tileElement.addEventListener('mouseleave', () => {
                    clearTimeout(hoverTimer);
                    tileNumber.classList.remove('visible');
                });
                
                // 为移动设备添加触摸事件支持
                if ('ontouchstart' in window) {
                    tileElement.addEventListener('touchstart', () => {
                        hoverTimer = setTimeout(() => {
                            tileNumber.classList.add('visible');
                        }, 500);
                    });
                    
                    tileElement.addEventListener('touchend', () => {
                        clearTimeout(hoverTimer);
                        setTimeout(() => {
                            tileNumber.classList.remove('visible');
                        }, 1000); // 触摸结束后保留显示1秒
                    });
                    
                    tileElement.addEventListener('touchmove', () => {
                        clearTimeout(hoverTimer);
                        tileNumber.classList.remove('visible');
                    });
                }
                
                // 添加点击事件（如果拼图未完成）
                if (!gameState.isPuzzleFinished) {
                    tileElement.addEventListener('click', () => {
                        if (isAdjacentToEmpty(i)) {
                            moveTile(i);
                        }
                    });
                }
            }
            
            puzzleGrid.appendChild(tileElement);
        }
    }

    // 检查是否与空格相邻
    function isAdjacentToEmpty(index) {
        const size = gameState.gridSize;
        const row = Math.floor(index / size);
        const col = index % size;
        const emptyRow = Math.floor(gameState.emptyTileIndex / size);
        const emptyCol = gameState.emptyTileIndex % size;
        
        // 检查是否在同一行或同一列，并且相邻
        return (row === emptyRow && Math.abs(col - emptyCol) === 1) || 
               (col === emptyCol && Math.abs(row - emptyRow) === 1);
    }

    // 移动拼图块
    function moveTile(index) {
        // 如果拼图已完成，不允许移动
        if (gameState.isPuzzleFinished) return;
        
        // 交换拼图块和空格的值
        [gameState.tiles[index], gameState.tiles[gameState.emptyTileIndex]] = 
        [gameState.tiles[gameState.emptyTileIndex], gameState.tiles[index]];
        
        // 更新空格位置
        gameState.emptyTileIndex = index;
        
        // 增加移动次数
        gameState.moveCount++;
        moveCountSpan.textContent = gameState.moveCount;
        
        // 重新渲染拼图
        renderPuzzle();
        
        // 检查是否完成拼图
        if (checkPuzzleComplete()) {
            // 拼图完成，但还需要猜字
            gameState.isPuzzleFinished = true;
            
            // 暂停计时器
            if (gameState.timerInterval) {
                clearInterval(gameState.timerInterval);
            }
            
            // 重新渲染以锁定拼图
            renderPuzzle();
            
            // 显示猜字弹窗
            showGuessModal();
        }
    }

    // 检查拼图是否完成
    function checkPuzzleComplete() {
        const size = gameState.gridSize;
        const totalTiles = size * size;
        
        // 检查每个位置的值是否正确
        for (let i = 0; i < totalTiles; i++) {
            if (gameState.tiles[i] !== i) {
                return false;
            }
        }
        
        return true;
    }

    // 显示猜字弹窗
    function showGuessModal() {
        // 显示模态框
        guessModal.classList.remove('hidden');
        characterGuessInput.value = '';
        guessFeedback.classList.add('hidden');
        
        // 在猜字弹窗中显示完整的拼图结果
        const completedCharacterImage = document.getElementById('completed-character-image');
        completedCharacterImage.style.backgroundImage = `url(${gameState.originalImageUrl})`;
        
        // 聚焦输入框
        setTimeout(() => {
            characterGuessInput.focus();
        }, 300);
    }

    // 检查汉字猜测
    function checkCharacterGuess() {
        const guess = characterGuessInput.value.trim();
        
        // 如果为空，不处理
        if (!guess) return;
        
        // 检查是否匹配
        if (guess === gameState.character) {
            // 猜测正确
            const lang = gameState.currentLanguage;
            guessFeedback.textContent = i18n[lang]['correct-guess'];
            guessFeedback.className = '';
            guessFeedback.classList.add('correct');
            guessFeedback.classList.remove('hidden');
            
            // 短暂延迟后显示完成消息
            setTimeout(() => {
                showCompletionMessage();
            }, 1000);
        } else {
            // 猜测错误
            const lang = gameState.currentLanguage;
            guessFeedback.textContent = i18n[lang]['incorrect-guess'];
            guessFeedback.className = '';
            guessFeedback.classList.add('error');
            guessFeedback.classList.remove('hidden');
            
            // 清空输入框
            characterGuessInput.value = '';
            characterGuessInput.focus();
        }
    }

    // 显示完成消息
    function showCompletionMessage() {
        guessModal.classList.add('hidden');
        completeMessage.classList.remove('hidden');
        
        // 更新完成信息
        correctCharacterSpan.textContent = gameState.character;
        finalTimeSpan.textContent = timerSpan.textContent;
        finalMovesSpan.textContent = gameState.moveCount;
        
        // 标记游戏完成
        gameState.isComplete = true;
    }

    // 初始化游戏
    startNewGame();
});
