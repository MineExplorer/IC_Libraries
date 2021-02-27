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

	validateNode(nodeId: number): boolean {
		if (this.passedNodes[nodeId])
			return false;
		this.passedNodes[nodeId] = true;
		return true;
	}
}