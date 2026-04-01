type EnergyNodeKind = "grid" | "tile";

abstract class EnergyNode {
	id: number;
	baseEnergy: string;
	abstract readonly kind: EnergyNodeKind;
	energyTypes: {[key: string]: EnergyType} = {};
	dimension: number;
	maxValue: number = Number.MAX_SAFE_INTEGER;
	removed: boolean = false;
	entries: EnergyNode[] = [];
	receivers: EnergyNode[] = [];
	activeReceivers: EnergyNode[] = null;

	energyIn: number = 0;
	currentIn: number = 0;
	energyOut: number = 0;
	currentOut: number = 0;
	energyPower: number = 0;
	currentPower: number = 0;
	isFull: boolean = false;
	freeCapacity: number = -1;

	constructor(energyType: EnergyType, dimension: number) {
		this.id = EnergyNet.globalNodeID++;
		this.baseEnergy = energyType.name;
		this.addEnergyType(energyType);
		this.dimension = dimension;
	}

	addEnergyType(energyType: EnergyType): void {
		this.energyTypes[energyType.name] = energyType;
	}

	abstract hasCoords(x: number, y: number, z: number): boolean;

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
	 * @returns — true if connection was added, false if it already exists
	 */
	addConnection(node: EnergyNode): boolean {
		if (this.addReceiver(node)) {
			node.addEntry(this);
			return true;
		}
		return false;
	}

	/**
	 * Removes output connection to specified node
	 * @param node receiver node
	 * @returns true if connection was removed, false if it's already removed
	 */
	removeConnection(node: EnergyNode): boolean {
		if (this.removeReceiver(node)) {
			node.removeEntry(this);
			return true;
		}
		return false;
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
		if (this.isFull) return 0;

		const energyIn = this.transferEnergy(amount, packet);
        if (energyIn > 0) {
        	this.currentPower = Math.max(this.currentPower, packet.size);
        	this.currentIn += energyIn;
	    } else {
			this.isFull = true;
		}
        return energyIn;
	}

	add(amount: number, power?: number): number {
		if (amount == 0) return 0;
		const add = this.addPacket(this.baseEnergy, amount, power);
		return amount - add;
	}

	addPacket(energyName: string, amount: number, power: number = amount, receivers?: EnergyNode[], transferMode?: TransferMode): number {
		if (amount == 0) return 0;
		
		const packet = new EnergyPacket(energyName, power, this, transferMode);
		let energyOut = this.transferEnergy(amount, packet, receivers);
		return energyOut;
	}

	transferEnergy(amount: number, packet: EnergyPacket, receivers: EnergyNode[] = this.getActiveReceivers()): number {
		if (this.removed || receivers.length == 0 || !packet.validateNode(this.id)) return 0;

		let leftAmount = amount;
		if (packet.size > this.maxValue) {
			// Shrink energy packet proportional to the size ratio if its amount is bigger than its size
			amount = amount > packet.size ? Math.floor(amount * this.maxValue / packet.size) : this.maxValue;
			leftAmount = amount;
			this.onOverload(packet.size);
		}

		const leftReceivers = receivers.filter(n => !packet.nodeList[n.id]);
		if (packet.transferMode == TransferMode.Split) {
			for (let i = 0; i < leftReceivers.length; i++) {
				const node = leftReceivers[i];
				if (node.removed) continue;
				let receiveAmount = leftAmount;
				if (receiveAmount > 1 && leftReceivers.length - i > 1) {
					receiveAmount = Math.ceil(receiveAmount / (leftReceivers.length - i));
				}
				leftAmount -= node.receiveEnergy(receiveAmount, packet);
				if (leftAmount <= 0) break;
			}
		} else {
			for (const node of leftReceivers) {
				if (node.removed) continue;
				leftAmount -= node.receiveEnergy(leftAmount, packet);
				if (leftAmount <= 0) break;
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

	abstract getFreeCapacity(energyName: string): number;

	canProduceEnergy(): boolean {
		return false;
	}

	isConductor(energyName: string): boolean {
		return true;
	}

	canReceiveEnergy(side: number, energyName: string): boolean {
		return true;
	}

	canEmitEnergy(side: number, energyName: string): boolean {
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

	getActiveReceivers() {
		if (this.activeReceivers) return this.activeReceivers;

		const activeReceivers: EnergyNode[] = [];
		for (let node of this.receivers) {
			const freeAmount = node.getFreeCapacity(this.baseEnergy);
			if (freeAmount >= 1) {
				activeReceivers.push(node);
			}
		}
		// Sorting makes energy spread more evenly by distributing leftovers from the first receivers to the next
		this.activeReceivers = activeReceivers.sort((a, b) => a.freeCapacity - b.freeCapacity);
		return activeReceivers;
	}

	tick(): void {
		this.energyIn = this.currentIn;
		this.currentIn = 0;
		this.energyOut = this.currentOut;
		this.currentOut = 0;
		this.energyPower = this.currentPower;
		this.currentPower = 0;
		this.isFull = false;
		this.activeReceivers = null;
	}

	destroy(): void {
		this.removed = true;
		EnergyNet.enqueueRemoval(this);
	}

	toString(): string {
		return `[EnergyNode id=${this.id}, type=${this.baseEnergy}, entries=${this.entries.length}, receivers=${this.receivers.length}, energyIn=${this.energyIn}, energyOut=${this.energyOut}, power=${this.energyPower}]`;
	}
}
