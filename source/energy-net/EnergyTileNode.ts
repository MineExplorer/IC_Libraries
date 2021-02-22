class EnergyTileNode
extends EnergyNode {
	tileEntity: EnergyTile;

	constructor(energyType: EnergyType, parent: EnergyTile) {
		super(energyType);
		this.tileEntity = parent;
		this.dimension = parent.dimension;
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
		if (!this.initialized) {
			this.init();
		}
		this.tileEntity.energyTick(this.baseEnergy, this);
		super.tick();
	}
}