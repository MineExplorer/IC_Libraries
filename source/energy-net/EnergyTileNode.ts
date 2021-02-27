class EnergyTileNode
extends EnergyNode {
	tileEntity: EnergyTile;

	constructor(energyType: EnergyType, parent: EnergyTile) {
		super(energyType, parent.dimension);
		this.tileEntity = parent;
		this.addCoords(parent.x, parent.y, parent.z);
	}

	getParent(): EnergyTile {
		return this.tileEntity;
	}

	receiveEnergy(amount: number, packet: EnergyPacket): number {
		if (packet.passedNodes[this.id]) {
			return 0;
		}
		packet.passedNodes[this.id] = true;
		if (!this.tileEntity.isLoaded) return 0;
		this.tileEntity.energyReceive(packet.energyName, amount, packet.size);
		return this.transferEnergy(amount, packet);
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