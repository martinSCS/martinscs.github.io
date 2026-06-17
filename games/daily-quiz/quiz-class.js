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
    MULTIPLE_CHOICE: Symbol("MULTIPLE_CHOICE"),
    IMAGE_TEXT: Symbol("IMAGE_TEXT")
});

export class Quiz {
    static stateStorageKey = 'dailyQuiz.questionStates.v1';

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
            case QuizType.IMAGE_TEXT:
                return new ImageTextQuiz(type, data);
            case QuizType.UNKNOWN:
                return new UnknownQuiz(type, data);
            default:
                return null;
        }
    }

    static readStateStore() {
        try {
            return JSON.parse(window.localStorage.getItem(Quiz.stateStorageKey) ?? '{}') ?? {};
        } catch (error) {
            console.warn('⚠️ 无法读取题目本地状态:', error.message);
            return {};
        }
    }

    static writeStateStore(store) {
        try {
            window.localStorage.setItem(Quiz.stateStorageKey, JSON.stringify(store));
        } catch (error) {
            console.warn('⚠️ 无法写入题目本地状态:', error.message);
        }
    }

    static clearCompletedStates() {
        const store = Quiz.readStateStore();
        let changed = false;

        Object.entries(store).forEach(([key, state]) => {
            if (state?.completed) {
                delete store[key];
                changed = true;
            }
        });

        if (changed) {
            Quiz.writeStateStore(store);
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
            case QuizType.IMAGE_TEXT:
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

    stateKey() {
        const typeName = this.type.description ?? String(this.type);
        return `${this.date ?? 'unknown'}::${typeName}`;
    }

    getSavedState() {
        const store = Quiz.readStateStore();
        const state = store[this.stateKey()];
        return state && typeof state === 'object' ? state : null;
    }

    getPersistableState() {
        const answerInput = document.querySelector('#answer-input');
        return {
            answer: answerInput?.value ?? ''
        };
    }

    applyPersistedState(state) {
        const answerInput = document.querySelector('#answer-input');
        if (answerInput && typeof state.answer === 'string') {
            answerInput.value = state.answer;
        }
    }

    restoreUserState() {
        const state = this.getSavedState();
        if (!state || state.completed) {
            return;
        }

        this.applyPersistedState(state);
    }

    bindUserStatePersistence() {
        const answerInput = document.querySelector('#answer-input');
        if (answerInput) {
            answerInput.addEventListener('input', () => this.saveUserState());
            answerInput.addEventListener('change', () => this.saveUserState());
        }
    }

    saveUserState(extraState = {}) {
        const store = Quiz.readStateStore();
        store[this.stateKey()] = {
            ...store[this.stateKey()],
            date: this.date,
            type: this.type.description ?? String(this.type),
            ...this.getPersistableState(),
            ...extraState,
            updatedAt: new Date().toISOString()
        };
        Quiz.writeStateStore(store);
    }

    markCorrectAnswer(answer) {
        this.saveUserState({
            answer,
            completed: true
        });
    }

    /// 复制分享信息，供子类覆写
    copyInfo() {

    }

    async share() {
        await navigator.clipboard.writeText(this.copyInfo());
        return '已复制';
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

    getPersistableState() {
        return {
            selectedValues: this.getSelectedValues()
        };
    }

    applyPersistedState(state) {
        if (Array.isArray(state.selectedValues)) {
            const selectedValues = new Set(state.selectedValues.map(value => String(value)));
            this.optionInputs.forEach(input => {
                input.checked = selectedValues.has(input.value);
            });
            this.updateSubmitState();
        }
    }

    bindUserStatePersistence() {
        this.optionInputs.forEach(input => {
            input.addEventListener('change', () => this.saveUserState());
        });
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
            this.saveUserState();
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

class ImageTextQuiz extends Quiz {
    configureData() {
        super.configureData();
        this.prompt = this.data.prompt ?? '请打出图片上的文字';
        this.image = this.data.image ?? null;
        this.imageAlt = this.data.imageAlt ?? '题目图片';
        this.answer = this.data.answer ?? null;
        this.answerInRegex = this.data.answerInRegex === true;
        this.shareImageDataUrl = null;
        this.googleCSS = this.data.googleCSS ?? this.data.googleCss ?? this.data.googleFontCSS ?? this.data.googleFontCss ?? null;
        this.fontFamily = this.data.fontFamily ?? null;
    }

    checkAnswer(userAnswer) {
        const normalizedUserAnswer = userAnswer.trim();
        if (this.answerInRegex) {
            const regex = new RegExp(this.answer, 'gui');
            return regex.test(normalizedUserAnswer);
        }

        return normalizedUserAnswer === String(this.answer).trim();
    }

    renderPage() {
        super.renderPage();

        const inputBox = document.querySelector('#answer-input');
        this.loadGoogleFont();
        inputBox.style.fontFamily = this.fontFamily ? this.cssFontFamily(this.fontFamily) : 'inherit';

        const container = document.createElement('div');
        container.classList.add('image-text-quiz');

        const badge = document.createElement('div');
        badge.classList.add('image-text-quiz-badge');
        badge.textContent = '图片题';

        const prompt = document.createElement('div');
        prompt.classList.add('image-text-quiz-prompt');
        prompt.textContent = this.prompt;

        const imageFrame = document.createElement('div');
        imageFrame.classList.add('image-text-quiz-frame');

        container.appendChild(badge);
        container.appendChild(prompt);
        container.appendChild(imageFrame);
        document.querySelector('.quiz').append(container);

        this.renderImage(imageFrame);
    }

    renderImage(imageFrame) {
        if (this.isSvgImage()) {
            this.renderInlineSvg(imageFrame);
            return;
        }

        this.renderImageElement(imageFrame);
    }

    isSvgImage() {
        return this.image?.split('?')[0].toLowerCase().endsWith('.svg');
    }

    renderInlineSvg(imageFrame) {
        fetch(this.withCacheBust(this.image))
            .then(response => {
                if (!response.ok) {
                    throw new Error(`无法加载 SVG (${response.status})`);
                }
                return response.text();
            })
            .then(async svgText => {
                await this.prepareSvgShareImageDataUrl(svgText);

                const parser = new DOMParser();
                const documentSvg = parser.parseFromString(svgText, 'image/svg+xml');
                const parserError = documentSvg.querySelector('parsererror');
                const svg = documentSvg.querySelector('svg');

                if (parserError || !svg) {
                    throw new Error('SVG 格式有误');
                }

                const inlineSvg = document.importNode(svg, true);
                inlineSvg.setAttribute('role', 'img');
                inlineSvg.setAttribute('aria-label', this.imageAlt);
                inlineSvg.classList.add('image-text-quiz-inline-svg');
                imageFrame.textContent = '';
                imageFrame.appendChild(inlineSvg);
            })
            .catch(error => {
                console.error('❌ 内联 SVG 失败，回退到 img:', error.message);
                this.renderImageElement(imageFrame);
            });
    }

    renderImageElement(imageFrame) {
        const image = document.createElement('img');
        image.src = this.withCacheBust(this.image);
        image.alt = this.imageAlt;
        image.loading = 'eager';
        image.decoding = 'async';
        this.prepareShareImageDataUrl();

        imageFrame.textContent = '';
        imageFrame.appendChild(image);
    }

    withCacheBust(url) {
        if (!url) {
            return '';
        }

        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}v=${Date.now()}`;
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

打字题

${showUrl}`;
    }

    async share() {
        const shareText = this.copyInfo();

        if (this.shareImageDataUrl && await this.copyRichContentToClipboard(shareText, this.shareImageDataUrl)) {
            return '已复制';
        }

        await navigator.clipboard.writeText(`${shareText}

图片：${this.absoluteImageUrl()}`);
        return '已复制';
    }

    async prepareShareImageDataUrl() {
        if (!this.image) {
            return;
        }

        try {
            const response = await fetch(this.withCacheBust(this.image));
            if (!response.ok) {
                throw new Error(`无法加载分享图片 (${response.status})`);
            }

            const blob = await response.blob();
            const imageDataUrl = await this.blobToDataUrl(blob);
            this.shareImageDataUrl = await this.imageDataUrlWithBackground(imageDataUrl);
        } catch (error) {
            console.warn('⚠️ 分享图片预加载失败:', error.message);
        }
    }

    async prepareSvgShareImageDataUrl(svgText) {
        try {
            this.shareImageDataUrl = await this.svgTextToPngDataUrl(svgText);
        } catch (error) {
            console.warn('⚠️ SVG 转 PNG 失败，回退到 SVG:', error.message);
            this.shareImageDataUrl = this.svgTextToDataUrl(svgText);
        }
    }

    async copyRichContentToClipboard(shareText, imageDataUrl) {
        if (!window.ClipboardItem || !navigator.clipboard?.write) {
            return false;
        }

        try {
            const clipboardItem = new ClipboardItem({
                'text/html': new Blob([this.richShareHtml(shareText, imageDataUrl)], { type: 'text/html' }),
                'text/plain': new Blob([shareText], { type: 'text/plain' })
            });
            await navigator.clipboard.write([clipboardItem]);
            return true;
        } catch (error) {
            console.warn('⚠️ 图文混排复制不可用，回退到文字链接:', error.name || 'UnknownError', error.message);
            return false;
        }
    }

    richShareHtml(shareText, imageDataUrl) {
        const lines = shareText
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean);
        const paragraphs = lines
            .map(line => `<div style="margin:0 0 0.75em;">${this.escapeHtml(line)}</div>`)
            .join('\n');

        return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.5;margin:0;padding:0;">${paragraphs}<img src="${imageDataUrl}" alt="${this.escapeHtml(this.imageAlt)}" style="display:block;max-width:240px;height:auto;margin:0;padding:0;background:#fff;"></div>`;
    }

    blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });
    }

    imageDataUrlWithBackground(imageDataUrl) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                const width = image.naturalWidth || 240;
                const height = image.naturalHeight || 120;
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const context = canvas.getContext('2d');

                if (!context) {
                    reject(new Error('无法创建 canvas context'));
                    return;
                }

                context.fillStyle = '#fff';
                context.fillRect(0, 0, width, height);
                context.drawImage(image, 0, 0, width, height);
                resolve(canvas.toDataURL('image/png'));
            };
            image.onerror = () => reject(new Error('图片加载失败'));
            image.src = imageDataUrl;
        });
    }

    svgTextToDataUrl(svgText) {
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
    }

    svgTextToPngDataUrl(svgText) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            const svgUrl = this.svgTextToDataUrl(svgText);

            image.onload = () => {
                const width = image.naturalWidth || this.svgDimension(svgText, 'width') || 240;
                const height = image.naturalHeight || this.svgDimension(svgText, 'height') || 120;
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const context = canvas.getContext('2d');

                if (!context) {
                    reject(new Error('无法创建 canvas context'));
                    return;
                }

                context.fillStyle = '#fff';
                context.fillRect(0, 0, width, height);
                context.drawImage(image, 0, 0, width, height);
                resolve(canvas.toDataURL('image/png'));
            };

            image.onerror = () => reject(new Error('SVG 图片加载失败'));
            image.src = svgUrl;
        });
    }

    svgDimension(svgText, attributeName) {
        const parser = new DOMParser();
        const documentSvg = parser.parseFromString(svgText, 'image/svg+xml');
        const value = documentSvg.querySelector('svg')?.getAttribute(attributeName);
        const numberValue = Number.parseFloat(value ?? '');
        return Number.isFinite(numberValue) ? numberValue : null;
    }

    escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    loadGoogleFont() {
        if (!this.googleCSS) {
            return;
        }

        const existingLink = [...document.querySelectorAll('link[data-quiz-google-css]')]
            .some(link => link.dataset.quizGoogleCss === this.googleCSS);
        if (existingLink) {
            return;
        }

        if (this.googleCSS.startsWith('https://fonts.googleapis.com')) {
            this.addGoogleFontPreconnects();
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = this.googleCSS;
        link.dataset.quizGoogleCss = this.googleCSS;
        link.id = `quiz-google-font-${this.safeDomId(this.fontFamily ?? 'font')}`;
        document.head.appendChild(link);
    }

    addGoogleFontPreconnects() {
        [
            ['https://fonts.googleapis.com'],
            ['https://fonts.gstatic.com', 'anonymous']
        ].forEach(([href, crossOrigin]) => {
            const exists = [...document.querySelectorAll('link[rel="preconnect"]')]
                .some(link => link.href === `${href}/` || link.href === href);
            if (exists) {
                return;
            }

            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = href;
            if (crossOrigin) {
                link.crossOrigin = crossOrigin;
            }
            document.head.appendChild(link);
        });
    }

    cssFontFamily(value) {
        if (value.includes(',') || value.startsWith('"') || value.startsWith("'")) {
            return value;
        }

        return JSON.stringify(value);
    }

    safeDomId(value) {
        return String(value).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'font';
    }

    absoluteImageUrl() {
        return new URL(this.image, window.location.href).toString();
    }

    imageFileName() {
        const pathname = new URL(this.image, window.location.href).pathname;
        const fileName = pathname.split('/').pop();
        return fileName || `${this.date}-image${this.imageExtension()}`;
    }

    imageMimeType() {
        const extension = this.imageExtension().toLowerCase();
        switch (extension) {
            case '.svg':
                return 'image/svg+xml';
            case '.png':
                return 'image/png';
            case '.jpg':
            case '.jpeg':
                return 'image/jpeg';
            case '.webp':
                return 'image/webp';
            default:
                return 'application/octet-stream';
        }
    }

    imageExtension() {
        const pathname = new URL(this.image, window.location.href).pathname;
        const fileName = pathname.split('/').pop() ?? '';
        const extensionMatch = fileName.match(/\.[^.]+$/);
        return extensionMatch ? extensionMatch[0] : '';
    }

    getUserAnswer() {
        return document.querySelector('#answer-input').value;
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
                    this.saveUserState();
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

    getPersistableState() {
        return {
            ...super.getPersistableState(),
            guessedList: [...this.guessedList]
        };
    }

    applyPersistedState(state) {
        super.applyPersistedState(state);

        if (!Array.isArray(state.guessedList)) {
            return;
        }

        const questionList = characterBreak(this.question);
        const guessedSet = new Set(
            state.guessedList
                .map(index => Number.parseInt(index))
                .filter(index => Number.isInteger(index) && index >= 0 && index < this.elementArray.length)
        );

        this.guessedList = [...guessedSet];
        this.elementArray.forEach((element, index) => {
            if (!guessedSet.has(index)) {
                return;
            }

            element.setAttribute('data-character', questionList[index]);
            element.classList.add('click-show');
        });
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
