const NORMALIZE_FORMS = new Set(['NFC', 'NFD', 'NFKC', 'NFKD']);

/// 字符串拆分成单字函数
export const characterBreak = (p) => {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    const segments = segmenter.segment(p);
    return Array.from(segments, s => s.segment);
}

/// 字符串正则性判断
export const normalizedStringCompare = (str1, str2, form) => {
    form = form.toUpperCase();
    if (!NORMALIZE_FORMS.has(form)) {
        return str1.normalize() === str2.normalize();
    }
    return str1.normalize(form) === str2.normalize(form);
}

export const formatTimeMs = (seconds) => {
    if (!Number.isFinite(seconds)) return '00:00.000';

    const totalMs = Math.floor(seconds * 1000);
    const ms = totalMs % 1000;
    const totalSec = Math.floor(totalMs / 1000);
    const s = totalSec % 60;
    const m = Math.floor(totalSec / 60);

    return (
        String(m).padStart(2, '0') +
        ':' +
        String(s).padStart(2, '0') +
        '.' +
        String(ms).padStart(3, '0')
    );
}

export const removePrefix = (A, B) => {
    const max = Math.min(A.length, B.length);
    let i = 0;

    while (i < max && A[i] === B[i]) {
        i++;
    }

    return A.slice(i);
}


export class SmoothScrollQueue {
    constructor(element, options = {}) {
        this.el = element;
        this.queue = Promise.resolve(); // 动画队列起点
        this.duration = options.duration || 500; // 动画时长
        this.easing = options.easing || 'easeInOutQuad'; // 缓动函数

        // 初始化监听
        this._initObserver();
    }

    // 缓动算法
    _easings = {
        linear: t => t,
        easeInQuad: t => t * t,
        easeOutQuad: t => t * (2 - t),
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    };

    _initObserver() {
        // 监听子元素变化或内容变化导致的可滚动高度 (scrollHeight) 改变
        const observer = new MutationObserver(() => {
            this.scrollToBottom();
        });

        observer.observe(this.el, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    scrollToBottom() {
        // 关键点：将新的动画逻辑链入 Promise 队列
        this.queue = this.queue.then(() => {
            return new Promise((resolve) => {
                const start = this.el.scrollTop;
                const end = this.el.scrollHeight - this.el.clientHeight;
                const change = end - start;

                // 如果已经在底部，直接结束
                if (change <= 0) return resolve();

                let startTime = null;

                const animate = (currentTime) => {
                    if (!startTime) startTime = currentTime;
                    const progress = currentTime - startTime;
                    const fraction = Math.min(progress / this.duration, 1);

                    // 计算当前位置
                    const easeProgress = this._easings[this.easing](fraction);
                    this.el.scrollTop = start + change * easeProgress;

                    if (progress < this.duration) {
                        requestAnimationFrame(animate);
                    } else {
                        resolve(); // 动画结束，触发下一个队列
                    }
                };

                requestAnimationFrame(animate);
            });
        });
    }
}