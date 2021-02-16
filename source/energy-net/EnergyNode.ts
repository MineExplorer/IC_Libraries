class EnergyNode {
	id: number;
	baseEnergy: string;
	energyTypes: object;
	dimension: number;
	maxPacketSize: number;
	initialized: boolean = false;
	removed: boolean = false;
	blockID: number;
	blocksMap: object = {};
	connections: EnergyNode[] = [];
	receivers: EnergyNode[] = [];

	energyIn: number = 0;
	currentIn: number = 0;
	energyOut: number = 0;
	currentOut: number = 0;
	energyPower: number = 0;
	currentPower: number = 0;

	constructor(energyType: EnergyType, maxPacketSize: number = 2e9) {
		this.baseEnergy = energyType.name;
		this.addEnergyType(energyType);
		this.maxPacketSize = maxPacketSize;
	}

	addEnergyType(energyType: EnergyType) {
		this.energyTypes[energyType.name] = energyType;
	}

	private addConnection(node: EnergyNode) {
		if (this.connections.indexOf(node) == -1) {
			this.connections.push(node);
		}
	}

	private removeConnection(node: EnergyNode) {
		let index = this.connections.indexOf(node);
		if (index != -1) {
			this.connections.splice(index, 1);
		}
	}

	addReceiver(node: EnergyNode) {
		if (this.receivers.indexOf(node) == -1) {
			this.receivers.push(node);
			node.addConnection(this);
		}
	}

	removeReceiver(node: EnergyNode) {
		let index = this.receivers.indexOf(node);
		if (index != -1) {
			this.receivers.splice(index, 1);
			node.removeConnection(this);
		}
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
		if (packet.size > this.maxPacketSize) {
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

	onOverload(packetSize: number) {}

	canConductEnergy(block: Tile, coord1: Vector, coord2: Vector, side: number): boolean {
		return true;
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
		EnergyNetBuilder.removeNode(this);
	}

	toString() {
		return `[EnergyNode id=${this.id}, type=${this.baseEnergy}, connections=${this.connections.length}, receivers=${this.receivers.length}, energyIn=${this.energyIn}, energyOut=${this.energyOut}, power=${this.energyPower}]";
	}
}