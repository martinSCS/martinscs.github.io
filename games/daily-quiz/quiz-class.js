export class Quiz {
    constructor(question, answer, answerInRegex, date, submitter, quote) {
        this.question = question;
        this.answer = answer;
        this.answerInRegex = answerInRegex || false;
        this.elementArray = [];
        this.guessedList = [];
        this.date = date;
        this.submitter = submitter;
        this.quote = quote;
    }

    checkAnswer(userAnswer) {
        if (this.answerInRegex) {
            const regex = new RegExp(this.answer, 'gu');
            return regex.test(userAnswer);
        }
        return userAnswer === this.answer;
    }

    renderPage() {
        let textArray = [...this.question];
        textArray.forEach((ch, index) => {
            const chElement = document.createElement('div');
            chElement.classList.add('quiz-character');
            chElement.setAttribute('data-number', index.toString());
            chElement.addEventListener('click', (e) => {
                if (e.target.getAttribute('data-character') === '' || !e.target.getAttribute('data-character')) {
                    e.target.setAttribute('data-character', ch);
                    this.guessedList.push(parseInt(e.target.getAttribute('data-number')));
                    e.target.classList.add('click-show');
                }
            });
            this.elementArray.push(chElement);
        });
        if (this.submitter) {
            document.querySelector('.submitted-by').textContent = `此问题由 “${this.submitter}” 投稿`;
        }
        if (this.quote) {
            const quoteBlock = document.createElement('div');
            quoteBlock.appendChild(document.createTextNode('此问题参考了'));
            this.quote.forEach((quote, index, array) => {
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
        let questionList = [...this.question];
        this.elementArray.forEach((e) => {
            if (e.getAttribute('data-character') === '' || !e.getAttribute('data-character')) {
                let ch = questionList[parseInt(e.getAttribute('data-number'))];
                e.setAttribute('data-character', ch);
            }
        });
    }
}