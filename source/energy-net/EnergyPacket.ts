const enum TransferMode {
	Split = 1,
	Full = 2
}

class EnergyPacket {
	energyName: string;
	size: number;
	source: EnergyNode;
	transferMode: TransferMode;
	nodeList: { [key: number]: true } = {};

	constructor(energyName: string, size: number, source: EnergyNode, transferMode: TransferMode = TransferMode.Split) {
		this.energyName = energyName;
		this.size = size;
		this.source = source;
		this.transferMode = transferMode;
	}

	validateNode(nodeId: number): boolean {
		const passed = this.nodeList[nodeId];
		if (!passed) {
			this.setNodePassed(nodeId);
			return true;
		}
		return false;
	}

	setNodePassed(nodeId: number) {
		this.nodeList[nodeId] = true;
	}
}
