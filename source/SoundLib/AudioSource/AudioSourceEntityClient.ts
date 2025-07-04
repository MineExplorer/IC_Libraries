class AudioSourceEntityClient extends AudioSourceClient {
    constructor(public entity: number) {
        super(Entity.getPosition(entity));
        this.entity = entity;
    }

    onUpdate(): void {
        if (Entity.isExist(this.entity)) {
            this.position = Entity.getPosition(this.entity);
        }
        super.onUpdate();
    }

    protected updateVolume(): void {
        if (this.entity != Player.get()) {
            super.updateVolume();
        }
    }
}