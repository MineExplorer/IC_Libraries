let GLOBAL_NODE_ID = 0;

class EnergyNode {
	id: number;
	baseEnergy: string;
	energyTypes: object = {};
	dimension: number;
	maxValue: number;
	initialized: boolean = false;
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

	constructor(energyType: EnergyType, maxValue: number = 2e9) {
		this.id = GLOBAL_NODE_ID++;
		this.baseEnergy = energyType.name;
		this.addEnergyType(energyType);
		this.maxValue = maxValue;
		EnergyNet.addEnergyNode(this);
	}

	addEnergyType(energyType: EnergyType): void {
		this.energyTypes[energyType.name] = energyType;
	}

	private addEntry(node: EnergyNode): void {
		if (this.entries.indexOf(node) == -1) {
			this.entries.push(node);
		}
	}

	private removeEntry(node: EnergyNode): void {
		let index = this.entries.indexOf(node);
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
	 * @returns true if link to the node was removed, false if it already removed
	 */
	private removeReceiver(node: EnergyNode): boolean {
		let index = this.receivers.indexOf(node);
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
			node.removeConnection(this);
		}
		this.receivers = [];
	}

	receiveEnergy(amount: number, packet: EnergyPacket): number {
		if (packet.passedNodes[this.id]) {
			return 0;
		}
		packet.passedNodes[this.id] = true;
		return this.transferEnergy(amount, packet);
	}

	add(amount: number, power: number = amount): number {
		let add = this.addPacket(this.baseEnergy, amount, power);
		return amount - add;
	}

	addPacket(energyName: string, amount: number, size: number): number {
		let packet = new EnergyPacket(energyName, size, this);
		return this.transferEnergy(amount, packet);
	}

	transferEnergy(amount: number, packet: EnergyPacket): number {
		if (this.receivers.length == 0) return 0;

		let receivedAmount = amount;
		if (packet.size > this.maxValue) {
			amount = Math.min(amount, packet.size);
			this.onOverload(packet.size);
		}

		let receiversLeft = this.receivers.length;
		for (let node of this.receivers) {
			if (amount <= 0) break;
			amount -= node.receiveEnergy(Math.ceil(amount / receiversLeft), packet);
			receiversLeft--;
		}
		for (let node of this.receivers) {
			if (amount <= 0) break;
			amount -= node.receiveEnergy(amount, packet);
		}

		let transferedAmount = receivedAmount - amount;
		if (transferedAmount > 0) {
			this.currentPower = Math.max(this.currentPower, packet.size);
			this.currentIn += transferedAmount;
			this.currentOut += transferedAmount;
		}
		return transferedAmount;
	}

	/** @deprecated */
	addAll(amount: number, power: number = amount): void {
		this.add(amount, power);
	}

	onOverload(packetSize: number): void {}

	canConductEnergy(coord1: Vector, coord2: Vector, side: number): boolean {
		return true;
	}

	isCompatible(node: EnergyNode): boolean {
		for (let energyType in this.energyTypes) {
			if (node.energyTypes[energyType]) return true;
		}
		return false;
	}

	init(): void {

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