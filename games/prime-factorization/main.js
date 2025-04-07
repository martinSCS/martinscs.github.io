document.addEventListener('DOMContentLoaded', function() {
    // 初始设置
    const numberLeftElement = document.querySelector('.number-left');
    const primeInputElement = document.querySelector('.prime-input');
    const submitButton = document.querySelector('button');
    const equationElement = document.querySelector('.equation');
    const celebrationElement = document.querySelector('.celebration');
    const playAgainButton = document.getElementById('play-again');

    let currentNumber;
    let originalNumber;
    let factors = [];

    // 生成100到999之间的随机合数
    function generateCompositeNumber() {
        let num;
        do {
            num = Math.floor(Math.random() * 900) + 100;
        } while (isPrime(num));
        return num;
    }

    // 判断是否为质数
    function isPrime(num) {
        if (num <= 1) return false;
        if (num <= 3) return true;
        if (num % 2 === 0 || num % 3 === 0) return false;

        let i = 5;
        while (i * i <= num) {
            if (num % i === 0 || num % (i + 2) === 0) return false;
            i += 6;
        }
        return true;
    }

    // 显示提示框
    function showAlert(message) {
        // 移除旧的提示框
        const oldAlert = document.querySelector('.alert');
        if (oldAlert) {
            oldAlert.remove();
        }

        // 创建新的提示框
        const alertElement = document.createElement('div');
        alertElement.className = 'alert';
        alertElement.textContent = message;
        document.body.appendChild(alertElement);

        // 显示提示框
        setTimeout(() => {
            alertElement.classList.add('show');
        }, 10);

        // 3秒后隐藏提示框
        setTimeout(() => {
            alertElement.classList.remove('show');
            setTimeout(() => {
                alertElement.remove();
            }, 300);
        }, 3000);
    }

    // 让元素摇晃
    function shakeElement(element) {
        element.classList.add('shake');
        setTimeout(() => {
            element.classList.remove('shake');
        }, 500);
    }

    // 插入质因数到正确的位置（保持从小到大排序）
    function insertFactorInOrder(factor) {
        // 找到正确的插入位置
        let insertIndex = 0;
        while (insertIndex < factors.length && factors[insertIndex] < factor) {
            insertIndex++;
        }
        // 插入因数到正确位置
        factors.splice(insertIndex, 0, factor);
    }

    // 更新等式
    function updateEquation() {
        let equation = originalNumber + " = ";

        if (factors.length > 0) {
            equation += factors.join(" × ");
            if (currentNumber > 1) {
                equation += " × ?";
            }
        } else {
            equation += "?";
        }

        equationElement.textContent = equation;
    }

    // 创建庆祝动画
    function createConfetti() {
        const colors = ['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f', '#ff9800', '#a777e3', '#6e8efb'];

        for (let i = 0; i < 150; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = -10 + 'px';
            confetti.style.width = Math.random() * 10 + 5 + 'px';
            confetti.style.height = Math.random() * 10 + 5 + 'px';
            document.body.appendChild(confetti);

            // 设置动画
            const duration = Math.random() * 3 + 2;
            confetti.style.animation = `fall ${duration}s linear forwards`;

            // 创建动画
            const keyframes = `
                    @keyframes fall {
                        0% {
                            transform: translateY(0) rotate(0deg);
                            opacity: 1;
                        }
                        100% {
                            transform: translateY(100vh) rotate(${Math.random() * 360}deg);
                            opacity: 0;
                        }
                    }
                `;

            const style = document.createElement('style');
            style.textContent = keyframes;
            document.head.appendChild(style);

            // 动画结束后移除元素
            setTimeout(() => {
                confetti.remove();
                style.remove();
            }, duration * 1000);
        }
    }

    // 完成游戏
    function completeGame() {
        numberLeftElement.textContent = "过关！";
        primeInputElement.disabled = true;
        submitButton.disabled = true;

        // 更新最终等式
        let finalEquation = originalNumber + " = " + factors.join(" × ");
        equationElement.textContent = finalEquation;

        // 显示庆祝动画
        setTimeout(() => {
            celebrationElement.style.display = 'flex';
            createConfetti();
        }, 500);
    }

    // 初始化游戏
    function initGame() {
        originalNumber = generateCompositeNumber();
        currentNumber = originalNumber;
        factors = [];
        numberLeftElement.textContent = currentNumber;
        primeInputElement.value = '';
        primeInputElement.disabled = false;
        submitButton.disabled = false;
        celebrationElement.style.display = 'none';
        updateEquation();

        // 聚焦到输入框
        setTimeout(() => {
            primeInputElement.focus();
        }, 100);
    }

    // 处理提交
    function handleSubmit() {
        const input = parseInt(primeInputElement.value.trim());

        // 验证输入是否为空
        if (isNaN(input) || input <= 0) {
            showAlert("请输入一个正整数！");
            shakeElement(numberLeftElement);
            primeInputElement.value = ''; // 清空输入框
            primeInputElement.focus();
            return;
        }

        // 验证输入是否为质数
        if (!isPrime(input)) {
            showAlert("输入必须是质数！");
            shakeElement(numberLeftElement);
            primeInputElement.value = ''; // 清空输入框
            primeInputElement.focus();
            return;
        }

        // 验证输入是否为当前数的因数
        if (currentNumber % input !== 0) {
            showAlert("该数不是其中一个因数！");
            shakeElement(numberLeftElement);
            primeInputElement.value = ''; // 清空输入框
            primeInputElement.focus();
            return;
        }

        // 更新游戏状态
        const remainder = currentNumber / input;
        // 使用新的排序插入函数替代简单的push
        insertFactorInOrder(input);
        currentNumber = remainder;
        numberLeftElement.textContent = currentNumber;
        primeInputElement.value = '';
        primeInputElement.focus();
        updateEquation();

        // 检查游戏是否完成
        if (currentNumber === 1) {
            completeGame();
        }
    }

    // 事件监听
    submitButton.addEventListener('click', handleSubmit);
    primeInputElement.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    });

    playAgainButton.addEventListener('click', initGame);

    // 开始游戏
    initGame();
});
