/// <reference path="./Sound.ts" />

class MultiSound {
    constructor(
        public name: string,
        public sounds: string[]
    ) {}

    getRandomSoundId(): string {
        const randomIdx = Math.floor(Math.random() * this.sounds.length);
        return this.sounds[randomIdx];
    }
}