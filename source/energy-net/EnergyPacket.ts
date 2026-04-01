const enum TransferMode {
	/**
	 * Fetches free amount for all receivers and tries to split energy evenly between them
	 */
	Split = 1,
	/**
	 * Dumps energy into the first available receiver
	 */
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

	/**
	 * Returns true if the node has not yet been passed by this packet.
	 * @param nodeId node id
	 */
	validateNode(nodeId: number): boolean {
		return !this.nodeList[nodeId];
	}

	/**
	 * Marks node as passed by this packet.
	 * @param nodeId node id.
	 */
	setNodePassed(nodeId: number): void {
		this.nodeList[nodeId] = true;
	}
}
