import { QuizType, Quiz } from './quiz-class.js';

function getTodayQuizData() {
    const dateComponents = getQuizDateComponents();

    const year = dateComponents.year;
    const month = dateComponents.month;
    const dateString = dateComponents.dateString;
    const dateSet = dateComponents.dateSet;
    const isItToday = dateComponents.isItToday;

    removeUrlParameterIf('date', dateSet && isItToday);

    const fileName = `${dateString}.json`;
    const filePath = `quizzes/${year}/${month}/${fileName}?v=${Date.now()}`;

    let quiz;

    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`⚠️ 找不到日期为 ${dateString} 的题目。`);
                    return {
                        missing: true,
                        date: dateString
                    };
                }
                throw new Error(`无法加载文件 (${response.status})：${fileName}`);
            }
            return response.json();
        })
        .then(todayQuiz => {
            if (!todayQuiz) {
                return;
            }
            if (todayQuiz.missing) {
                renderMissingQuiz(todayQuiz.date);
                return;
            }
            const quizType = QuizType[todayQuiz.type] ?? QuizType['UNKNOWN'];
                const quizData = {
                    ...(todayQuiz.data ?? {}),
                    date: todayQuiz.date
                };
                quiz = Quiz.create(quizType, quizData);
                if (!quiz) {
                    console.log('❌ 题目格式有误，请检查:', todayQuiz.type, todayQuiz.data);
                }
                quiz.renderPage();
                if (quiz.submitter) {
                    document.querySelector('.submitted-by').textContent = `此问题由 “${quiz.submitter}” 投稿`;
                }
                if (quiz.quote) {
                    const quoteBlock = document.createElement('div');
                    quoteBlock.appendChild(document.createTextNode('此问题参考了'));
                    quiz.quote.forEach((quote, index, array) => {
                        if (!quote.site) {
                            const quoteElement = document.createTextNode(quote.name);
                            quoteBlock.appendChild(quoteElement);
                        } else {
                            const quoteElement = document.createElement('a');
                            quoteElement.setAttribute('href', quote.site);
                            quoteElement.textContent = quote.name;
                            quoteBlock.appendChild(quoteElement);
                        }
                        if (index <= array.length - 3) {
                            quoteBlock.appendChild(document.createTextNode('、'));
                        } else if (index === array.length - 2) {
                            quoteBlock.appendChild(document.createTextNode('和'));
                        }
                    });
                    quoteBlock.appendChild(document.createTextNode('等内容。'));
                    document.querySelector('.quote').appendChild(quoteBlock);
                }
                if (quiz.available) {
                    document.querySelector('#answer-submit').addEventListener('click', (e) => {
                        const answerInput = quiz.getUserAnswer();
                        if (!quiz.checkAnswer(answerInput)) {
                            quiz.handleWrongAnswer();
                        } else {
                            document.querySelector('#answer-submit').setAttribute('disabled', 'true');
                            quiz.handleCorrectAnswer();
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
                    document.querySelector('#answer-submit').disabled = true;
                }
        })
        .catch(error => {
            console.error('❌ 加载或处理题目数据时出错:', error.message);
        });
}

function renderMissingQuiz(dateString) {
    const quizContainer = document.querySelector('.quiz');
    const answerContainer = document.querySelector('.answer');
    const submitButton = document.querySelector('#answer-submit');

    quizContainer.textContent = '';
    document.querySelector('.submitted-by').textContent = '';
    document.querySelector('.quote').textContent = '';

    const emptyState = document.createElement('div');
    emptyState.classList.add('missing-quiz');

    const statusCode = document.createElement('div');
    statusCode.classList.add('missing-quiz-code');
    statusCode.textContent = '404';

    const title = document.createElement('h1');
    title.textContent = '这一天的题还没有来呀';

    const description = document.createElement('p');
    description.textContent = `${dateString} 的每日一题暂时还没准备好。`;

    const latestLink = document.createElement('a');
    latestLink.href = '#';
    latestLink.textContent = '回到最新问题';
    latestLink.addEventListener('click', (event) => {
        event.preventDefault();
        goToLatestRecordedQuiz();
    });

    emptyState.appendChild(statusCode);
    emptyState.appendChild(title);
    emptyState.appendChild(description);
    emptyState.appendChild(latestLink);
    quizContainer.appendChild(emptyState);

    if (submitButton) {
        submitButton.disabled = true;
    }
    if (answerContainer) {
        answerContainer.classList.add('is-hidden');
    }
}

function goToLatestRecordedQuiz() {
    fetch(`./quizzes/index.json?v=${Date.now()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`无法加载历史索引 (${response.status})`);
            }
            return response.json();
        })
        .then(items => {
            const latest = items
                .filter(item => item.date)
                .sort((a, b) => b.date.localeCompare(a.date))[0];

            window.location.href = latest ? `index.html?date=${latest.date}` : 'index.html';
        })
        .catch(error => {
            console.error('❌ 查找最新题目时出错:', error.message);
            window.location.href = 'index.html';
        });
}

function updateLatestQuizLinks() {
    fetch(`./quizzes/index.json?v=${Date.now()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`无法加载历史索引 (${response.status})`);
            }
            return response.json();
        })
        .then(items => {
            const latest = items
                .filter(item => item.date)
                .sort((a, b) => b.date.localeCompare(a.date))[0];

            document.querySelectorAll('[data-latest-quiz-link]').forEach(link => {
                link.href = latest ? `index.html?date=${latest.date}` : 'index.html';
            });
        })
        .catch(error => {
            console.error('❌ 更新最新题目链接时出错:', error.message);
        });
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
        dateString: `${yearToday}-${monthToday}-${dayOfMonthKeyToday}`,
        dateSet: !!urlDateString,
        isItToday: true
    }

    const setInfo = {
        year: year,
        month: month,
        dayOfMonthKey: dayOfMonthKey,
        dateString: urlDateString,
        dateSet: !!urlDateString,
        isItToday: false
    };

    const isDebug = window.location.hostname === 'localhost';

    if (!isDebug) {
        if (year > yearToday) {
            return todayInfo;
        } else if (year === yearToday) {
            if (month > monthToday) {
                return todayInfo;
            } else if (month === monthToday) {
                if (dayOfMonthKey > dayOfMonthKeyToday) {
                    return todayInfo;
                }
            }
        }
    }
    if (isValidDate) {
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

function removeUrlParameterIfAndReload(paramName, condition) {
    if (!condition) {
        return;
    }

    const url = new URL(window.location.href);
    const params = url.searchParams;

    if (params.has(paramName)) {
        params.delete(paramName);
        const newUrl = url.pathname + url.search + url.hash;
        window.location.replace(newUrl);
    }
}

document.addEventListener('DOMContentLoaded', getTodayQuizData);
document.addEventListener('DOMContentLoaded', updateLatestQuizLinks);
