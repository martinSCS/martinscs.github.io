import { Quiz } from './quiz-class.js';

function getTodayQuizData() {
    const today = new Date();

    const options = {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    };

    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(today);

    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const dayOfMonthKey = parts.find(p => p.type === 'day').value;

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
                quiz = new Quiz(todayQuiz.question, todayQuiz.answer, `${year}-${month}-${dayOfMonthKey}`);
                quiz.renderPage();
                quiz.elementArray.forEach(ele => {
                    document.querySelector('.quiz-question').appendChild(ele);
                });
                document.querySelector('#answer-submit').addEventListener('click', (e) => {
                    const answerInput = document.querySelector('#answer-input').value;
                    if (!quiz.checkAnswer(answerInput)) {
                        triggerErrorShake();
                    } else {
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

document.addEventListener('DOMContentLoaded', getTodayQuizData);