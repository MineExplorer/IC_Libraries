class EnergyTileNode
extends EnergyNode {
	tileEntity: EnergyTile;

	constructor(energyType: EnergyType, parent: EnergyTile) {
		super(energyType, parent.dimension);
		this.tileEntity = parent;
	}

	getParent(): EnergyTile {
		return this.tileEntity;
	}

	receiveEnergy(amount: number, packet: EnergyPacket): number {
		let energyIn = this.tileEntity.energyReceive(packet.energyName, amount, packet.size);
        if (energyIn < amount && this.isConductor(packet.energyName)) {
			energyIn += this.transferEnergy(amount - energyIn, packet);
		}
        if (energyIn > 0) {
        	this.currentPower = Math.max(this.currentPower, packet.size);
        	this.currentIn += energyIn;
	    }
        return energyIn;
	}

	isConductor(type: string): boolean {
		return this.tileEntity.isConductor(type);
	}

	canReceiveEnergy(side: number, type: string): boolean {
		return this.tileEntity.canReceiveEnergy(side, type);
	}

	canExtractEnergy(side: number, type: string): boolean {
		return this.tileEntity.canExtractEnergy(side, type);
	}

	init(): void {
		EnergyGridBuilder.buildGridForTile(this.tileEntity);
		this.initialized = true;
	}

	tick(): void {
		if (!this.tileEntity.__initialized || !this.tileEntity.isLoaded) return;
		if (!this.initialized) {
			this.init();
		}
		this.tileEntity.energyTick(this.baseEnergy, this);
		super.tick();
	}
}