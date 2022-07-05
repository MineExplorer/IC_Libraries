let GLOBAL_NODE_ID = 0;

class EnergyNode {
	id: number;
	baseEnergy: string;
	energyTypes: object = {};
	dimension: number;
	maxValue: number = 2e9;
	removed: boolean = false;
	blocksMap: object = {};
	entries: EnergyNode[] = [];
	receivers: EnergyNode[] = [];

	energyIn: number = 0;
	currentIn: number = 0;
	energyOut: number = 0;
	currentOut: number = 0;
	energyPower: number = 0;
	currentPower: number = 0;

	constructor(energyType: EnergyType, dimension: number) {
		this.id = GLOBAL_NODE_ID++;
		this.baseEnergy = energyType.name;
		this.addEnergyType(energyType);
		this.dimension = dimension;
	}

	addEnergyType(energyType: EnergyType): void {
		this.energyTypes[energyType.name] = energyType;
	}

	addCoords(x: number, y: number, z: number): void {
		this.blocksMap[x+":"+y+":"+z] = true;
	}

	removeCoords(x: number, y: number, z: number): void {
		this.blocksMap[x+":"+y+":"+z] = false;
	}

	private addEntry(node: EnergyNode): void {
		if (this.entries.indexOf(node) == -1) {
			this.entries.push(node);
		}
	}

	private removeEntry(node: EnergyNode): void {
		const index = this.entries.indexOf(node);
		if (index != -1) {
			this.entries.splice(index, 1);
		}
	}

	/**
	 * @param node receiver node
	 * @returns true if link to the node was added, false if it already exists
	 */
	private addReceiver(node: EnergyNode): boolean {
		if (this.receivers.indexOf(node) == -1) {
			this.receivers.push(node);
			return true;
		}
		return false;
	}

	/**
	 * @param node receiver node
	 * @returns true if link to the node was removed, false if it's already removed
	 */
	private removeReceiver(node: EnergyNode): boolean {
		const index = this.receivers.indexOf(node);
		if (index != -1) {
			this.receivers.splice(index, 1);
			return true;
		}
		return false;
	}

	/**
	 * Adds output connection to specified node
	 * @param node receiver node
	 */
	addConnection(node: EnergyNode): void {
		if (this.addReceiver(node)) {
			node.addEntry(this);
		}
	}

	/**
	 * Removes output connection to specified node
	 * @param node receiver node
	 */
	removeConnection(node: EnergyNode): void {
		if (this.removeReceiver(node)) {
			node.removeEntry(this);
		}
	}

	resetConnections(): void {
		for (let node of this.entries) {
			node.removeReceiver(this);
		}
		this.entries = [];
		for (let node of this.receivers) {
			node.removeEntry(this);
		}
		this.receivers = [];
	}

	receiveEnergy(amount: number, packet: EnergyPacket): number {
		const energyIn = this.transferEnergy(amount, packet);
        if (energyIn > 0) {
        	this.currentPower = Math.max(this.currentPower, packet.size);
        	this.currentIn += energyIn;
	    }
        return energyIn;
	}

	add(amount: number, power?: number): number {
		if (amount == 0) return 0;
		const add = this.addPacket(this.baseEnergy, amount, power);
		return amount - add;
	}

	addPacket(energyName: string, amount: number, size: number = amount): number {
		const packet = new EnergyPacket(energyName, size, this);
		return this.transferEnergy(amount, packet);
	}

	transferEnergy(amount: number, packet: EnergyPacket): number {
		if (this.receivers.length == 0) return 0;

		let leftAmount = amount;
		if (packet.size > this.maxValue) {
			leftAmount = Math.min(leftAmount, packet.size);
			this.onOverload(packet.size);
		}

		const currentNodeList = {...packet.nodeList};
		const receiversCount = this.receivers.length;
		let k = 0;
		for (let i = 0; i < this.receivers.length; i++) {
			if (leftAmount <= 0) break;
			const node = this.receivers[i];
			if (packet.validateNode(node.id)) {
				let receiveAmount = leftAmount;
				if (receiveAmount > 1 && receiversCount - k > 1) {
					receiveAmount = Math.ceil(receiveAmount / (receiversCount - k))
				}
				leftAmount -= node.receiveEnergy(receiveAmount, packet);
				if (node.removed) i--;
			}
			k++;
		}

		packet.nodeList = currentNodeList;
		for (let node of this.receivers) {
			if (leftAmount <= 0) break;
			if (packet.validateNode(node.id)) {
				leftAmount -= node.receiveEnergy(leftAmount, packet);
			}
		}

		const energyOut = amount - leftAmount;
        if (energyOut > 0) {
            this.currentPower = Math.max(this.currentPower, packet.size);
            this.currentOut += energyOut;
        }
        return energyOut;
	}

	/** @deprecated */
	addAll(amount: number, power: number = amount): void {
		this.add(amount, power);
	}

	onOverload(packetSize: number): void {}

	isConductor(type: string): boolean {
		return true;
	}

	canReceiveEnergy(side: number, type: string): boolean {
		return true;
	}

	canExtractEnergy(side: number, type: string): boolean {
		return true;
	}

	canConductEnergy(coord1: Vector, coord2: Vector, side: number): boolean {
		return true;
	}

	isCompatible(node: EnergyNode): boolean {
		for (let energyType in this.energyTypes) {
			if (node.energyTypes[energyType]) return true;
		}
		return false;
	}

	tick(): void {
		this.energyIn = this.currentIn;
		this.currentIn = 0;
		this.energyOut = this.currentOut;
		this.currentOut = 0;
		this.energyPower = this.currentPower;
		this.currentPower = 0;
	}

	destroy(): void {
		this.removed = true;
		this.resetConnections();
		EnergyNet.removeEnergyNode(this);
	}

	toString(): string {
		return `[EnergyNode id=${this.id}, type=${this.baseEnergy}, entries=${this.entries.length}, receivers=${this.receivers.length}, energyIn=${this.energyIn}, energyOut=${this.energyOut}, power=${this.energyPower}]`;
	}
}