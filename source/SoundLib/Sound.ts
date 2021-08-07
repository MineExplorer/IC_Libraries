class Sound {
    id: number;
    duration: number;

    constructor(
        public name: string,
        public soundPool: android.media.SoundPool,
        public path: string,
        public looping: boolean) {
        this.id = soundPool.load(path, 1);
    }

    getDuration(): number {
        if (!this.duration) {
            let mmr = new android.media.MediaMetadataRetriever();
            mmr.setDataSource(this.path);
            let durationStr = mmr.extractMetadata(android.media.MediaMetadataRetriever.METADATA_KEY_DURATION);
            let duration = parseInt(durationStr);
            this.duration = duration - duration % 50;
            Game.message(this.name+" - "+this.duration);
        }
        return this.duration;
    }
}