export const QuizType = Object.freeze({
    UNKNOWN: Symbol("UNKNOWN"),
    FLIP: Symbol("FLIP"),
    WADOKAICHIN: Symbol("WADOKAICHIN")
});

export class Quiz {
    constructor(type, data) {
        this.type = type;
        this.data = data;
        this.configureData();
    }

    static create(type, data) {
        switch (type) {
            case QuizType.FLIP:
                return new FlipQuiz(type, data);
            case QuizType.WADOKAICHIN:
                return new WadokaichinQuiz(type, data);
            default:
                return null;
        }
    }

    /// 处理data，供子类覆写
    configureData() {
        this.date = this.data.date ?? null;
        this.submitter = this.data.submitter ?? null;
        this.quote = this.data.quote ?? null;
    }

    /// 答案核验，供子类覆写
    checkAnswer(userAnswer) {
        return false;
    }

    /// 页面渲染，供子类覆写
    renderPage() {
        switch (this.type) {
            case QuizType.FLIP:
            case QuizType.WADOKAICHIN:
                const inputBox = document.createElement('input');
                inputBox.id = 'answer-input';
                document.querySelector('.answer').prepend(inputBox);
                break;
            default:
                return;
        }
    }

    /// 复制分享信息，供子类覆写
    copyInfo() {

    }

    /// 获取用户答案
    getUserAnswer() {
        return '';
    }

    handleCorrectAnswer() {
        const answerInput = document.querySelector('#answer-input');
        answerInput.setAttribute('disabled', 'true');
        answerInput.classList.add('correct-pulse');
        const animationDuration = 700;
        setTimeout(() => {
            answerInput.classList.remove('correct-pulse');
            answerInput.classList.add('correct-static');
            answerInput.style.color = 'var(--correct-color)';
        }, animationDuration);
    }

    handleWrongAnswer() {
        const answerInput = document.querySelector('#answer-input');
        answerInput.classList.add('error-shake');
        const animationDuration = 500;
        setTimeout(() => {
            answerInput.classList.remove('error-shake');
            answerInput.style.color = 'var(--secondary-color)';
        }, animationDuration);
    }
}

class FlipQuiz extends Quiz{
    configureData() {
        super.configureData();
        this.question = this.data.question ?? null;
        this.answer = this.data.answer ?? null;
        this.answerInRegex = this.data.answerInRegex || false;
        this.elementArray = [];
        this.guessedList = [];
    }

    checkAnswer(userAnswer) {
        if (this.answerInRegex) {
            const regex = new RegExp(this.answer, 'gui');
            return regex.test(userAnswer);
        }
        return userAnswer.toLowerCase() === this.answer.toLowerCase();
    }

    renderPage() {
        super.renderPage();
        const container = document.createElement('div');
        container.classList.add('flip-quiz-question');
        let textArray = characterBreak(this.question);
        textArray.forEach((ch, index) => {
            const chElement = document.createElement('div');
            chElement.classList.add('flip-quiz-character');
            chElement.setAttribute('data-number', index.toString());
            chElement.addEventListener('click', (e) => {
                if (e.target.getAttribute('data-character') === '' || !e.target.getAttribute('data-character')) {
                    e.target.setAttribute('data-character', ch);
                    this.guessedList.push(parseInt(e.target.getAttribute('data-number')));
                    e.target.classList.add('click-show');
                }
            });
            this.elementArray.push(chElement);
            container.appendChild(chElement);
        });
        document.querySelector('.quiz').append(container);
    }

    copyInfo() {
        let totalLength = this.elementArray.length
        let guessedTimes = this.guessedList.length;
        let score = totalLength - guessedTimes;
        let showText = '';
        for (let i=0; i < totalLength; i++) {
            if (!this.guessedList.includes(i)) {
                showText += '🎈'
            } else {
                showText += '🗯️'
            }
            if ((i + 1) % 6 === 0 && i + 1 !== totalLength) {
                showText += '\n';
            }
        }

        const url = new URL(window.location.href);
        const params = url.searchParams;
        let showUrl = window.location.href;
        if (!params.has('date')) {
            params.set('date', this.date);
            showUrl = url.toString();
        }

        return `${this.date}

分数: ${score}/${totalLength} 
${showText}
${showUrl}`;
    }

    showAll() {
        let questionList = characterBreak(this.question);
        this.elementArray.forEach((e) => {
            if (e.getAttribute('data-character') === '' || !e.getAttribute('data-character')) {
                let ch = questionList[parseInt(e.getAttribute('data-number'))];
                e.setAttribute('data-character', ch);
            }
        });
    }

    getUserAnswer() {
        return document.querySelector('#answer-input').value;
    }

    handleCorrectAnswer() {
        super.handleCorrectAnswer();
        this.showAll();
    }

    handleWrongAnswer() {
        super.handleWrongAnswer();
    }
}

class WadokaichinQuiz extends Quiz{
    configureData() {
        super.configureData();
        this.from = this.data.from;
        this.to = this.data.to;
        this.answer = this.data.answer ?? null;
        this.answerInRegex = this.data.answerInRegex || false;
    }

    checkAnswer(userAnswer) {
        if (this.answerInRegex) {
            const regex = new RegExp(this.answer, 'gui');
            return regex.test(userAnswer);
        }
        return userAnswer.toLowerCase() === this.answer.toLowerCase();
    }

    renderPage() {
        super.renderPage();
        const container = document.createElement('div');
        container.classList.add('wadokaichin-quiz-question');
        for (let i=0; i < 25; i++) {
            const element = document.createElement('div');
            element.classList.add('wadokaichin-quiz-character');
            if (i === 2) {
                element.textContent = this.from[0];
            } else if (i === 7 || i === 17) {
                element.textContent = '↓';
            } else if (i === 10) {
                element.textContent = this.from[1];
            } else if (i === 11 || i === 13) {
                element.textContent = '→';
            } else if (i === 12) {
                element.classList.add('wadokaichin-quiz-character-missing');
                element.textContent = '?';
            } else if (i === 14) {
                element.textContent = this.to[0];
            } else if (i === 22) {
                element.textContent = this.to[1];
            }
            container.appendChild(element)
        }
        document.querySelector('.quiz').append(container);
    }

    copyInfo() {
        const url = new URL(window.location.href);
        const params = url.searchParams;
        let showUrl = window.location.href;
        if (!params.has('date')) {
            params.set('date', this.date);
            showUrl = url.toString();
        }
        const showText = `　　${this.from[0]}
　　👇
${this.from[1]}👉？\uFE01👉${this.to[0]}
　　👇
　　${this.to[1]}`;
        return `${this.date}

${showText}
${showUrl}`;
    }

    getUserAnswer() {
        return document.querySelector('#answer-input').value;
    }
}

/// 字符串拆分成单字函数
const characterBreak = (p) => {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    const segments = segmenter.segment(p);
    const textArray = Array.from(segments, s => s.segment);

    return textArray;
}