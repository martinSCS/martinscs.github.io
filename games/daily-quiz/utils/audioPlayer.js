export class AudioPlayer {
    constructor(audioLink, question, updateFunction = null) {
        this.audio = new Audio(audioLink);
        this.audio.preload = 'auto';
        this.question = question;

        this.questionShown = '';

        this.updateFunction = updateFunction;
        this.nowId = 0;
        this.pausedWithHand = false;

        this.audio.addEventListener('loadedmetadata', () => {
            if (this.updateFunction) {
                this.updateFunction({current: 0.0, duration: this.audio.duration});
            }
        });
    }

    playAudio() {
        if (!this.audio.duration) {
            alert('音频未加载完成，请稍候');
        }
        if (this.pausedWithHand) {
            this.audio.currentTime = 0;
        }
        this.pausedWithHand = false;
        this.questionShown = '';
        this.nowId = 0;
        if (this.updateFunction) {
            let audioTimeInfo = this.audioTimeInfo();
            this.updateFunction({...audioTimeInfo, isStarted: true, questionShown: this.questionShown});
        }
        let rafId = null;
        const tick = () => {
            if (!this.audio.paused && !this.audio.ended && this.audio.duration) {
                let audioTimeInfo = this.audioTimeInfo();
                this.consumeNextCharacter(audioTimeInfo.current * 1000);

                if (this.updateFunction) {
                    this.updateFunction({...audioTimeInfo, isComplete: false, questionShown: this.questionShown});
                }

                rafId = requestAnimationFrame(tick);
            }
        }

        this.audio.play().then(r => {
            cancelAnimationFrame(rafId);
            tick();
        });

        this.audio.addEventListener('pause', () => {
            cancelAnimationFrame(rafId);
            this.audio.currentTime = 0;
        });

        this.audio.addEventListener('ended', () => {
            cancelAnimationFrame(rafId);
            if (this.updateFunction) {
                let audioTimeInfo = this.audioTimeInfo();
                this.updateFunction({...audioTimeInfo, current: audioTimeInfo.duration, isComplete: true, questionShown: this.questionShown});
            }
        });
    }

    pauseAudio() {
        this.audio.pause();
        this.pausedWithHand = true;
        if (this.updateFunction) {
            let audioTimeInfo = this.audioTimeInfo();
            this.updateFunction({...audioTimeInfo, isPaused: true, questionShown: this.questionShown});
        }
    }

    consumeNextCharacter(currentTimeInMS, autoNext = false) {
        if (this.nowId >= this.question.length) {
            return;
        }
        const character = this.question[this.nowId]
        if (character) {
            if (character["operationTime"] <= currentTimeInMS) {
                character["operation"].forEach((operation) => {
                    if (operation['operationType'] === 'APPEND') {
                        this.questionShown += operation['append'];
                    } else if (operation['operationType'] === 'REMOVE') {
                        this.questionShown = this.questionShown.substring(0, this.questionShown.length - operation['remove']);
                    }
                });

                this.nowId++;
            } else {
                return;
            }

            if (autoNext) {
                this.consumeNextCharacter(currentTimeInMS, true);
            }
        }
    }

    audioTimeInfo() {
        if (!this.audio.duration) {
            return null;
        }
        return {
            current: this.audio.currentTime,
            duration: this.audio.duration
        };
    }

    isPlaying() {
        return !this.audio.paused;
    }
}