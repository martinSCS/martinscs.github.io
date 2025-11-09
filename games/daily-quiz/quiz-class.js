export class Quiz {
    constructor(question, answer, date) {
        this.question = question;
        this.answer = answer;
        this.elementArray = [];
        this.guessedList  =[];
        this.date = date;
    }

    checkAnswer(userAnswer) {
        return userAnswer === this.answer;
    }

    renderPage() {
        let textArray = [...this.question];
        textArray.forEach((ch, index) => {
            const chElement = document.createElement('div');
            chElement.classList.add('quiz-character');
            chElement.setAttribute('data-number', index.toString())
            chElement.addEventListener('click', (e) => {
                if (e.target.getAttribute('data-character') === '' || !e.target.getAttribute('data-character')) {
                    e.target.setAttribute('data-character', ch);
                    this.guessedList.push(parseInt(e.target.getAttribute('data-number')));
                }
            });
            this.elementArray.push(chElement);
        });
    }

    copyInfo() {
        let totalLength = this.elementArray.length
        let guessedTimes = this.guessedList.length;
        let score = totalLength - guessedTimes;
        let showText = '';
        console.log(this.guessedList);
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
        return `${this.date}

分数: ${score}/${totalLength} 
${showText}
${window.location.href}`;
    }
}