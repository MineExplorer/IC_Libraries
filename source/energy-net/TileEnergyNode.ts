class TileEnergyNode
extends EnergyNode {
	tileEntity: EnergyTile;

	constructor(energyType: EnergyType, parent: EnergyTile) {
		super(energyType);
		this.tileEntity = parent;
	}

	getParent(): EnergyTile {
		return this.tileEntity;
	}

	receiveEnergy(type: string, amount: number, voltage: number): number {
		let add = this.tileEntity.energyReceive(type, amount, voltage);
		this.energy_received += add;
		this.voltage = Math.max(this.voltage, voltage);
		return add;
	}

	tick() {
		this.tileEntity.energyTick(this.energyName, this);
		super.tick();
	}
}