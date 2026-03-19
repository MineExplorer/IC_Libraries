const enum TransferMode {
	Split = 1,
	Full = 2
}

class EnergyPacket {
	energyName: string;
	size: number;
	source: EnergyNode;
	transferMode: TransferMode;
	nodeList: { [key: number]: TransferMode } = {};

	constructor(energyName: string, size: number, source: EnergyNode, transferMode: TransferMode = TransferMode.Split) {
		this.energyName = energyName;
		this.size = size;
		this.source = source;
		this.transferMode = transferMode;
		this.setNodePassed(source.id, transferMode);
	}

	validateNode(nodeId: number): boolean {
		const passedMode = this.nodeList[nodeId];
		if (passedMode == undefined || passedMode < this.transferMode) {
			this.setNodePassed(nodeId, this.transferMode);
			return true;
		}
		return false;
	}

	setNodePassed(nodeId: number, mode: TransferMode = this.transferMode) {
		this.nodeList[nodeId] = mode;
	}
}
