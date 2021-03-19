class EnergyPacket {
	energyName: string;
	size: number;
	source: EnergyNode;
	passedNodes: object = {};

	constructor(energyName: string, size: number, source: EnergyNode) {
		this.energyName = energyName;
		this.size = size;
		this.source = source;
		this.setNodePassed(source.id);
	}

	validateNode(nodeId: number): boolean {
		return !this.passedNodes[nodeId];
	}

	setNodePassed(nodeId: number) {
		this.passedNodes[nodeId] = true;
	}
}