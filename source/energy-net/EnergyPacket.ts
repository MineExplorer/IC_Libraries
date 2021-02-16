class EnergyPacket {
	energyName: string;
	size: number;
	source: EnergyNode;
	passedNodes: object = {};

	constructor(energyName: string, size: number, source: EnergyNode) {
		this.energyName = energyName;
		this.size = size;
		this.source = source;
		this.passedNodes[source.id] = true;
	}
}