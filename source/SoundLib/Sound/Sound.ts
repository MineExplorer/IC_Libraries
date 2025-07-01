class Sound {
    public name: string;
    public path: string;
    public internalId: number;
    private duration: number;

    /**
     * @param name sound name id
     * @param path file path
     */
    constructor(name: string, path: string) { 
        this.name = name;
        this.path = path;
    }

    load(soundPool: android.media.SoundPool) {
        this.internalId = soundPool.load(this.path, 1);
    }

    getDuration(): number {
        if (!this.duration) {
            const mmr = new android.media.MediaMetadataRetriever();
            mmr.setDataSource(this.path);
            const durationStr = mmr.extractMetadata(android.media.MediaMetadataRetriever.METADATA_KEY_DURATION);
            const duration = parseInt(durationStr);
            this.duration = duration - duration % 50;
            Logger.Log(`Sound ${this.name}: duration ${this.duration} ms`, "DEBUG");
        }
        return this.duration;
    }
}