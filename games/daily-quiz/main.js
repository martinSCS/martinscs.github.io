import { Quiz } from './quiz-class.js';

function getTodayQuizData() {
    const dateComponents = getQuizDateComponents();

    const year = dateComponents.year;
    const month = dateComponents.month;
    const dayOfMonthKey = dateComponents.dayOfMonthKey;
    const dateSet = dateComponents.dateSet;
    const isItToday = dateComponents.isItToday;

    removeUrlParameterIf('date', dateSet && isItToday);

    const fileName = `${year}-${month}.json`;
    const filePath = `quizzes/${fileName}`;

    let quiz;

    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`无法加载文件 (${response.status})：${fileName}`);
            }
            return response.json();
        })
        .then(monthData => {
            const todayQuiz = monthData[dayOfMonthKey];

            if (todayQuiz) {
                quiz = new Quiz(todayQuiz.question, todayQuiz.answer, todayQuiz.answerInRegex, `${year}-${month}-${dayOfMonthKey}`);
                quiz.renderPage();
                quiz.elementArray.forEach(ele => {
                    document.querySelector('.quiz-question').appendChild(ele);
                });
                document.querySelector('#answer-submit').addEventListener('click', (e) => {
                    const answerInput = document.querySelector('#answer-input').value;
                    if (!quiz.checkAnswer(answerInput)) {
                        triggerErrorShake();
                    } else {
                        document.querySelector('#answer-submit').setAttribute('disabled', 'true');
                        triggerCorrectPulse();
                        quiz.showAll();
                        const shareButton = document.createElement('button');
                        shareButton.setAttribute('id', 'share-button');
                        shareButton.textContent = '分享';
                        document.querySelector('#answer-submit').after(shareButton);
                        shareButton.addEventListener('click', () => {
                            navigator.clipboard.writeText(quiz.copyInfo())
                                .then(() => {
                                    shareButton.textContent = '已复制';
                                })
                                .catch(err => {
                                    shareButton.textContent = '复制失败';
                                });
                        });
                    }
                });
            } else {
                console.warn(`⚠️ 文件 ${fileName} 中找不到日期为 ${dayOfMonthKey} 的题目。`);
            }
        })
        .catch(error => {
            console.error('❌ 加载或处理题目数据时出错:', error.message);
        });
}

function triggerErrorShake() {
    const answerInput = document.querySelector('#answer-input');
    answerInput.classList.add('error-shake');
    const animationDuration = 500;
    setTimeout(() => {
        answerInput.classList.remove('error-shake');
        answerInput.style.color = 'var(--secondary-color)';
    }, animationDuration);
}

function triggerCorrectPulse() {
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

function getQuizDateComponents() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlDateString = urlParams.get('date');

    const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;

    let isValidDate = false;
    let _, year, month, dayOfMonthKey;

    if (urlDateString && dateRegex.test(urlDateString)) {
        const match = urlDateString.match(dateRegex);
        [_, year, month, dayOfMonthKey] = match;

        const checkDate = new Date(Number(year), Number(month) - 1, Number(dayOfMonthKey));

        isValidDate = (
            !isNaN(checkDate) && // 必须是有效日期
            checkDate.getFullYear() === Number(year) &&
            checkDate.getMonth() === Number(month) - 1 &&
            checkDate.getDate() === Number(dayOfMonthKey)
        );
    }

    const today = new Date();
    const options = {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    };

    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(today);

    const yearToday = parts.find(p => p.type === 'year').value;
    const monthToday = parts.find(p => p.type === 'month').value;
    const dayOfMonthKeyToday = parts.find(p => p.type === 'day').value;

    const todayInfo = {
        year: yearToday,
        month: monthToday,
        dayOfMonthKey: dayOfMonthKeyToday,
        dateSet: !!urlDateString,
        isItToday: true
    }

    const setInfo = {
        year: year,
        month: month,
        dayOfMonthKey: dayOfMonthKey,
        dateSet: !!urlDateString,
        isItToday: false
    };

    const isDebug = window.location.hostname === 'localhost';

    if (year > yearToday && !isDebug) {
        return todayInfo;
    } else if (month > monthToday && !isDebug) {
        return todayInfo;
    } else if (dayOfMonthKey > dayOfMonthKeyToday && !isDebug) {
        return todayInfo;
    } else if (isValidDate) {
        return setInfo;
    } else {
        return todayInfo;
    }
}

/**
 * 检查条件是否满足，如果满足，则从当前 URL 中移除指定的参数。
 *
 * @param {string} paramName - 要移除的参数名称 (例如: 'date')。
 * @param {boolean} condition - 移除参数的条件 (如果为 true 则移除)。
 */
function removeUrlParameterIf(paramName, condition) {
    if (!condition) {
        return;
    }
    const url = new URL(window.location.href);
    const params = url.searchParams;
    if (params.has(paramName)) {
        params.delete(paramName);
        const newUrl = url.pathname + url.search + url.hash;
        window.history.replaceState(null, '', newUrl);
    }
}

document.addEventListener('DOMContentLoaded', getTodayQuizData);
document.addEventListener('DOMContentLoaded', () => {
    let link = window.location.origin + window.location.pathname;
    const latestLink = document.createElement('a');
    latestLink.textContent = '最新问题';
    latestLink.setAttribute('href', link);
    latestLink.classList.add('latest-link');
    document.querySelector('.header').appendChild(latestLink);
})