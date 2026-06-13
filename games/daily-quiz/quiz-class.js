import { characterBreak , formatTimeMs , SmoothScrollQueue , removePrefix } from "./utils/string.js";
import { AudioPlayer } from './utils/audioPlayer.js';
import { preloadImages} from "./utils/image.js";

export const QuizType = Object.freeze({
    UNKNOWN: Symbol("UNKNOWN"),
    FLIP: Symbol("FLIP"),
    WADOKAICHIN: Symbol("WADOKAICHIN"),
    HAYAOSHI: Symbol("HAYAOSHI"),
    NAZOTOKI: Symbol("NAZOTOKI"),
    SINGLE_CHOICE: Symbol("SINGLE_CHOICE"),
    MULTIPLE_CHOICE: Symbol("MULTIPLE_CHOICE")
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
            case QuizType.HAYAOSHI:
                return new HayaoshiQuiz(type, data);
            case QuizType.SINGLE_CHOICE:
                return new SingleChoiceQuiz(type, data);
            case QuizType.MULTIPLE_CHOICE:
                return new MultipleChoiceQuiz(type, data);
            case QuizType.UNKNOWN:
                return new UnknownQuiz(type, data);
            default:
                return null;
        }
    }

    /// 处理data，供子类覆写
    configureData() {
        this.date = this.data.date ?? null;
        this.submitter = this.data.submitter ?? null;
        this.quote = this.data.quote ?? null;
        this.available = true;
        this.language = this.data.language ?? "zh-Hans";
        this.correctAudio = new Audio('./assets/audio/correct.mp3');
        this.correctAudio.volume = 0.2;
        this.wrongAudio = new Audio('./assets/audio/wrong.mp3');
        this.wrongAudio.volume = 0.2;
        this.getAnswerPowerAudio = new Audio('./assets/audio/Quiz-Button02-1(Multi).mp3');
        this.getAnswerPowerAudio.volume = 0.2;
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
            case QuizType.HAYAOSHI:
                const inputBox = document.createElement('input');
                inputBox.id = 'answer-input';
                inputBox.lang = this.language;
                inputBox.classList.add('sans');
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
        this.correctAudio.play().then(r => {});
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
        this.wrongAudio.play().then(r => {});
        setTimeout(() => {
            answerInput.classList.remove('error-shake');
            answerInput.style.color = 'var(--secondary-color)';
        }, animationDuration);
    }
}

class ChoiceQuiz extends Quiz {
    configureData() {
        super.configureData();
        this.question = this.data.question ?? null;
        this.options = this.normalizeOptions(this.data.options ?? []);
        this.answerValues = this.normalizeAnswer(this.data.answer);
        this.optionInputs = [];
        this.optionLabels = [];
    }

    normalizeOptions(options) {
        return options.map((option, index) => {
            if (typeof option === 'object' && option !== null) {
                return {
                    value: String(option.value ?? option.id ?? index),
                    label: String(option.label ?? option.text ?? option.value ?? option.id ?? '')
                };
            }

            return {
                value: String(index),
                label: String(option)
            };
        });
    }

    normalizeAnswer(answer) {
        const answers = Array.isArray(answer) ? answer : [answer];
        return answers
            .filter(answerItem => answerItem !== undefined && answerItem !== null)
            .map(answerItem => this.normalizeAnswerItem(answerItem));
    }

    normalizeAnswerItem(answerItem) {
        if (typeof answerItem === 'number') {
            return this.options[answerItem]?.value ?? String(answerItem);
        }

        const answerString = String(answerItem);
        const matchedOption = this.options.find(option => (
            option.value === answerString ||
            option.label === answerString
        ));

        return matchedOption ? matchedOption.value : answerString;
    }

    shuffleOptions() {
        for (let i = this.options.length - 1; i > 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1));
            [this.options[i], this.options[randomIndex]] = [this.options[randomIndex], this.options[i]];
        }
    }

    isMultiple() {
        return false;
    }

    checkAnswer(userAnswer) {
        const selectedValues = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
        const normalizedSelected = selectedValues
            .filter(value => value !== undefined && value !== null && value !== '')
            .map(value => String(value))
            .sort();
        const normalizedAnswer = [...this.answerValues].sort();

        return (
            normalizedSelected.length === normalizedAnswer.length &&
            normalizedSelected.every((value, index) => value === normalizedAnswer[index])
        );
    }

    renderPage() {
        this.shuffleOptions();

        const container = document.createElement('div');
        container.classList.add('choice-quiz');

        const badge = document.createElement('div');
        badge.classList.add('choice-quiz-badge');
        badge.textContent = this.isMultiple() ? '多选题' : '单选题';

        const question = document.createElement('div');
        question.classList.add('choice-quiz-question');
        question.lang = this.language;
        question.textContent = this.question;

        const optionList = document.createElement('div');
        optionList.classList.add('choice-quiz-options');

        const inputType = this.isMultiple() ? 'checkbox' : 'radio';
        const inputName = `choice-${this.date ?? Date.now()}`;

        this.options.forEach((option, index) => {
            const optionId = `${inputName}-${index}`;
            const label = document.createElement('label');
            label.classList.add('choice-quiz-option');
            label.setAttribute('for', optionId);
            label.dataset.value = option.value;
            label.isAnswerCorrect = this.answerValues.includes(option.value);

            const input = document.createElement('input');
            input.type = inputType;
            input.id = optionId;
            input.name = inputName;
            input.value = option.value;
            input.addEventListener('change', () => this.updateSubmitState());

            const marker = document.createElement('span');
            marker.classList.add('choice-quiz-marker');
            marker.textContent = this.optionMarker(index);

            const text = document.createElement('span');
            text.classList.add('choice-quiz-option-text');
            text.textContent = option.label;

            label.appendChild(input);
            label.appendChild(marker);
            label.appendChild(text);
            optionList.appendChild(label);

            this.optionInputs.push(input);
            this.optionLabels.push(label);
        });

        container.appendChild(badge);
        container.appendChild(question);
        container.appendChild(optionList);
        document.querySelector('.quiz').append(container);

        this.updateSubmitState();
    }

    optionMarker(index) {
        return String.fromCharCode(65 + index);
    }

    updateSubmitState() {
        const submitButton = document.querySelector('#answer-submit');
        if (!submitButton) {
            return;
        }
        submitButton.disabled = this.getSelectedValues().length === 0;
    }

    getSelectedValues() {
        return this.optionInputs
            .filter(input => input.checked)
            .map(input => input.value);
    }

    getUserAnswer() {
        return this.getSelectedValues();
    }

    selectedOptionLabels() {
        const selectedValues = new Set(this.getSelectedValues());
        return this.options
            .filter(option => selectedValues.has(option.value))
            .map(option => option.label);
    }

    disableOptions() {
        this.optionInputs.forEach(input => {
            input.disabled = true;
        });
    }

    revealResult() {
        this.optionLabels.forEach(label => {
            const input = label.querySelector('input');
            if (label.isAnswerCorrect) {
                label.classList.add('is-correct-answer');
            }
            if (input.checked && !label.isAnswerCorrect) {
                label.classList.add('is-wrong-answer');
            }
        });
    }

    clearSelection() {
        this.optionInputs.forEach(input => {
            input.checked = false;
        });
        this.updateSubmitState();
    }

    copyInfo() {
        const url = new URL(window.location.href);
        const params = url.searchParams;
        let showUrl = window.location.href;
        if (!params.has('date')) {
            params.set('date', this.date);
            showUrl = url.toString();
        }

        return `${this.date}

${this.isMultiple() ? '多选题' : '单选题'}

${showUrl}`;
    }

    handleCorrectAnswer() {
        this.disableOptions();
        this.optionLabels.forEach(label => {
            const input = label.querySelector('input');
            if (input.checked && label.isAnswerCorrect) {
                label.classList.add('is-correct-answer');
            }
        });
        document.querySelector('.choice-quiz').classList.add('correct-pulse');
        this.correctAudio.play().then(r => {});
    }

    handleWrongAnswer() {
        const selectedLabels = this.optionLabels.filter(label => label.querySelector('input').checked);
        selectedLabels.forEach(label => {
            label.classList.add('is-wrong-answer', 'error-shake');
        });
        this.wrongAudio.play().then(r => {});
        setTimeout(() => {
            selectedLabels.forEach(label => {
                label.classList.remove('is-wrong-answer', 'error-shake');
            });
            this.clearSelection();
        }, 500);
    }
}

class SingleChoiceQuiz extends ChoiceQuiz {
    getUserAnswer() {
        return this.getSelectedValues()[0] ?? '';
    }
}

class MultipleChoiceQuiz extends ChoiceQuiz {
    isMultiple() {
        return true;
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
            if (i === 2) {
                element.textContent = this.from[0];
                element.classList.add('wadokaichin-quiz-character');
            } else if (i === 7 || i === 17) {
                element.textContent = '↓';
                element.classList.add('wadokaichin-quiz-character');
            } else if (i === 10) {
                element.textContent = this.from[1];
                element.classList.add('wadokaichin-quiz-character');
            } else if (i === 11 || i === 13) {
                element.textContent = '→';
                element.classList.add('wadokaichin-quiz-character');
            } else if (i === 12) {
                element.classList.add('wadokaichin-quiz-character-missing');
                element.textContent = '?';
                element.classList.add('wadokaichin-quiz-character');
                this.answerBlock = element;
            } else if (i === 14) {
                element.textContent = this.to[0];
                element.classList.add('wadokaichin-quiz-character');
            } else if (i === 22) {
                element.textContent = this.to[1];
                element.classList.add('wadokaichin-quiz-character');
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

    handleCorrectAnswer() {
        super.handleCorrectAnswer();
        this.answerBlock.textContent = this.getUserAnswer();
        this.answerBlock.classList.add('wadokaichin-quiz-character-correct');
    }
}

class HayaoshiQuiz extends Quiz {
    configureData() {
        super.configureData();
        this.originalQuestion = this.data.originalQuestion;
        this.answer = this.data.answer;
        this.answerInRegex = this.data.answerInRegex;
        // 解析
        this.audioPlayer = new AudioPlayer(this.data.audio, this.data.question, (obj) => {
            this.handleUpdate(obj);
        });
        this.timeUsed = 0.0;
        this.duration = 0.0;
        this.onGlobalSpace = this.onGlobalSpace.bind(this);

        const images = [
            './assets/images/hayaoshi_on.png',
            './assets/images/hayaoshi_off.png'
        ];
        preloadImages(Object.values(images)).then(() => {});
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

        const inputBox = document.querySelector('#answer-input');
        inputBox.disabled = true;

        const submitButton = document.querySelector('#answer-submit');
        submitButton.disabled = true;

        const quizDiv = document.querySelector('.quiz');

        this.progressElement = document.createElement('progress');
        this.progressElement.max = 1;
        this.progressElement.value = 0;
        this.progressElement.style.width = '300px';
        this.progressElement.style.height = '12px';
        this.progressElement.style.marginBottom = '20px';

        /* ========= 时长显示 ========= */
        this.timeLabel = document.createElement('div');
        this.timeLabel.style.fontSize = '14px';
        this.timeLabel.style.marginBottom = '8px';
        this.timeLabel.style.color = '#666';
        this.timeLabel.textContent = '00:00.000 / 00:00.000';

        this.userHint = document.createElement('div');
        this.userHint.style.fontSize = '16px';
        this.userHint.style.marginBottom = '8px';
        this.userHint.innerHTML = '点击<span style="color: #b91c1c;">下方按钮</span>或按下<span style="color: #b91c1c;">键盘空格键</span><u>播放</u>或<u>抢答</u>';

        /* ========= 图片按钮 ========= */
        this.controlButton = document.createElement('button');

        // 清除按钮默认样式
        Object.assign(this.controlButton.style, {
            width: '96px',
            height: '96px',
            border: 'none',
            padding: '0',
            background: 'url("./assets/images/hayaoshi_off.png") bottom / contain no-repeat',
            cursor: 'pointer'
        });

        this.controlButton.addEventListener('click', () => {
            this.handleButtonClicked();
        });

        this.textBox = document.createElement('div');
        this.textBox.lang = this.language;
        this.textBox.classList.add('sans');
        Object.assign(this.textBox.style, {
            width: '90%',
            height: '200px',
            /* 文本 */
            color: '#b91c1c', // 深红，比纯 red 柔和
            fontSize: 'max(min(32px, 4vw), 20px)',
            fontWeight: '700',
            lineHeight: '1.4',
            letterSpacing: '0.04em',
            /* 容器 */
            backgroundColor: '#f5f5f5',
            border: '2px solid #d1d1d1',
            borderRadius: '12px',
            padding: '1rem 1.2rem',
            /* 滚动 */
            overflowY: 'auto',
            /* 位置 */
            marginTop: '2rem',
            /* 体验 */
            boxSizing: 'border-box',
            userSelect: 'none',
        });
        const scroller = new SmoothScrollQueue(this.textBox, {
            duration: 600,
            easing: 'easeInOutQuad'
        });

        quizDiv.appendChild(this.progressElement);
        quizDiv.appendChild(this.timeLabel);
        quizDiv.appendChild(this.userHint);
        quizDiv.appendChild(this.controlButton);
        quizDiv.appendChild(this.textBox);

        document.addEventListener('keydown', this.onGlobalSpace);
    }

    handleUpdate(obj) {
        const current = obj.current ?? null;
        const duration = obj.duration ?? null;
        const questionShown = obj.questionShown ?? "";
        
        if (current !== undefined && current !== null && duration !== undefined && duration !== null) {
            if (!this.duration) {
                this.duration = duration;
            }
            this.timeLabel.textContent = `${formatTimeMs(current)} / ${formatTimeMs(duration)}`;
            if (obj.isComplete) {
                this.progressElement.value = 1;
            } else {
                this.progressElement.value = current / duration;
            }
        }
        const inputBox = document.querySelector('#answer-input');
        const submitButton = document.querySelector('#answer-submit');
        if (obj.isStarted || obj.isPaused) {
            this.timeUsed = current;
            if (obj.isStarted) {
                inputBox.disabled = true;
                submitButton.disabled = true;
            } else {
                inputBox.disabled = false;
                submitButton.disabled = false;
            }
        }
        if(obj.isPaused || obj.isComplete) {
            inputBox.disabled = false;
            submitButton.disabled = false;
        }
        if (obj.isComplete) {
            this.timeUsed = duration;
        }

        this.textBox.textContent = questionShown;
    }

    copyInfo() {
        const url = new URL(window.location.href);
        const params = url.searchParams;
        let showUrl = window.location.href;
        if (!params.has('date')) {
            params.set('date', this.date);
            showUrl = url.toString();
        }
        const usedRate = this.timeUsed / this.duration;
        const showText = `用时 ${this.timeUsed.toFixed(3)}s / ${this.duration.toFixed(3)}s
得分 ${((1 - usedRate) * 10).toFixed(3)} / 10
[${'#'.repeat(Math.round(usedRate * 15))}${'='.repeat(15 - Math.round(usedRate * 15))}]`;
        return `${this.date}

${showText}

${showUrl}`;
    }

    getUserAnswer() {
        return document.querySelector('#answer-input').value;
    }

    handleCorrectAnswer() {
        super.handleCorrectAnswer();
        document.removeEventListener('keydown', this.onGlobalSpace);
        this.controlButton.disabled = true;
        const remainedTextBox = document.createElement('span');
        remainedTextBox.style.color = 'var(--correct-color)';
        const showResult = removePrefix(this.originalQuestion.trim(), this.textBox.textContent.trim());
        remainedTextBox.textContent = showResult[0];
        this.textBox.textContent = showResult[1];
        this.textBox.appendChild(remainedTextBox);
    }

    handleButtonClicked() {
        let active;
        if (this.audioPlayer.isPlaying()) {
            active = true;
            this.audioPlayer.pauseAudio();
            this.getAnswerPowerAudio.play().then(r => {});
        } else {
            active = false;
            this.audioPlayer.playAudio();
        }
        this.controlButton.style.background = `url("./assets/images/hayaoshi_${active ? 'on' : 'off'}.png") bottom / contain no-repeat`;
        this.controlButton.blur();
    }

    onGlobalSpace(e) {
        if (e.code !== 'Space') return;

        const active = document.activeElement;
        if (
            active &&
            (
                active.tagName === 'INPUT' ||
                active.tagName === 'TEXTAREA' ||
                active.tagName === 'SELECT' ||
                active.isContentEditable
            )
        ) {
            return;
        }

        e.preventDefault();
        this.handleButtonClicked();
    }
}

class UnknownQuiz extends Quiz{
    configureData() {
        this.available = false;
    }

    renderPage() {
        super.renderPage();
        const container = document.createElement('div');
        container.textContent = '今日不营业，向您致歉！'
        container.style.fontSize = '1.5em';
        document.querySelector('.quiz').append(container);
    }
}
