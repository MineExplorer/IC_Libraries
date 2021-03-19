class EnergyPacket {
	energyName: string;
	size: number;
	source: EnergyNode;
	nodeList: object = {};

	constructor(energyName: string, size: number, source: EnergyNode) {
		this.energyName = energyName;
		this.size = size;
		this.source = source;
		this.setNodePassed(source.id);
	}

	validateNode(nodeId: number): boolean {
		if (this.nodeList[nodeId]) {
			return false;
		}
		this.setNodePassed(nodeId);
		return true;
	}

	setNodePassed(nodeId: number) {
		this.nodeList[nodeId] = true;
	}
}