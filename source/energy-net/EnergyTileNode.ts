class EnergyTileNode extends EnergyNode
implements EnergyGraphNode {
	readonly kind = "tile";
	tileEntity: EnergyTile;
	initialized: boolean = false;
	adjacentLinks: AdjacentNodeLink[] = [];
	energyAmounts: EnergyBuffer = {};

	constructor(energyType: EnergyType, parent: EnergyTile) {
		super(energyType, parent.dimension);
		this.tileEntity = parent;
		if (parent.isGenerator()) {
			parent.data.energyNetBuffer ??= {};
			this.energyAmounts = parent.data.energyNetBuffer;
			this.enableEnergyBuffer = true;
		}
	}

	static createFor(tileEntity: EnergyTile, energyTypes: {[key: string]: EnergyType}) {
		let node: EnergyTileNode;
		for (let name in energyTypes) {
			const type = energyTypes[name];
			if (!node) {
				node = new EnergyTileNode(type, tileEntity as EnergyTile);
			} else {
				node.addEnergyType(type);
			}
		}
		return node;
	}

	getParent(): EnergyTile {
		return this.tileEntity;
	}

	hasCoords(x: number, y: number, z: number): boolean {
		return this.tileEntity.x == x && this.tileEntity.y == y && this.tileEntity.z == z;
	}

	linkTile(tileNode: EnergyTileNode, canInput: boolean, canOutput: boolean): void {
		if (this.addAdjacentLink(tileNode, canInput, canOutput)) {
			tileNode.addAdjacentLink(this, canOutput, canInput);
		}
	}

	unlinkTile(tileNode: EnergyTileNode): void {
		if (this.removeAdjacentLink(tileNode)) {
			tileNode.removeAdjacentLink(this);
		}
	}

	addAdjacentLink(node: EnergyGraphNode, canInput: boolean, canOutput: boolean): boolean {
		for (let link of this.adjacentLinks) {
			if (link.node == node) return false;
		}
		this.adjacentLinks.push({
			node: node,
			canInput: canInput,
			canOutput: canOutput
		});
		return true;
	}

	removeAdjacentLink(node: EnergyGraphNode): boolean {
		const index = this.adjacentLinks.findIndex((link) => link.node == node);
		if (index == -1) return false;
		this.adjacentLinks.splice(index, 1);
		return true;
	}

	resetAdjacentLinks(): void {
		for (let link of this.adjacentLinks) {
			link.node.removeAdjacentLink(this);
		}
		this.adjacentLinks = [];
	}

	receiveEnergy(amount: number, packet: EnergyPacket): number {
		if (packet.source == this) return 0;
		
		let energyIn = this.tileEntity.energyReceive(packet.energyName, amount, packet.size);
		if (energyIn < amount && this.isConductor(packet.energyName)) {
			energyIn += this.transferEnergy(amount - energyIn, packet);
		}
		if (energyIn > 0) {
			this.currentPower = Math.max(this.currentPower, packet.size);
			this.currentIn += energyIn;
		}
		return energyIn;
	}

	getFreeCapacity(energyName: string) {
		const freeEnergy = this.tileEntity.getFreeEnergyAmount(energyName);
		return this.freeCapacity = freeEnergy;
	}

	isConductor(energyName: string): boolean {
		return this.tileEntity.isConductor(energyName);
	}

	canReceiveEnergy(side: number, energyName: string, node: EnergyNode): boolean {
		return this.tileEntity.canReceiveEnergy(side, energyName, node);
	}

	canEmitEnergy(side: number, energyName: string, node: EnergyNode): boolean {
		return this.tileEntity.canEmitEnergy(side, energyName, node);
	}

	resetConnections(): void {
		this.resetAdjacentLinks();
		super.resetConnections();
	}

	add(amount: number, power: number = amount): number {
		if (amount == 0) return 0;

		if (!this.enableEnergyBuffer) {
			return super.add(amount, power);
		}

		let energyOut = 0;
		let leftAmount = amount;
		const activeReceivers = this.getActiveReceivers();
		// Send energy to nearby tiles
		const tileReceivers = activeReceivers.filter(n => n.kind == "tile");
		if (tileReceivers.length > 0) {
			const energyAdded = this.addPacket(this.baseEnergy, leftAmount, power, this.defaultTransferMode, tileReceivers);
			energyOut += energyAdded
			leftAmount -= energyAdded;
		}
		// Add energy to active grid buffers
		if (leftAmount > 0) {
			const gridReceivers = activeReceivers.filter(n => n.kind == "grid");
			if (gridReceivers.length > 0) {
				energyOut += this.addToGridBuffers(leftAmount, amount, power, gridReceivers);
			}
		}
		return amount - energyOut;
	}

	addToGridBuffers(amount: number, size: number, power: number, gridReceivers: EnergyNode[]): number {
		let energyOut = 0;
		for (let energyName in this.energyTypes) {
			const gridReceiversCount = gridReceivers.reduce((count, n) =>
				n.baseEnergy == energyName ? count + 1 : count, 0);
			if (gridReceiversCount == 0) continue;

			let energyAdded: number;
			if (energyName != this.baseEnergy) {
				const energyRatio = EnergyRegistry.getValueRatio(this.baseEnergy, energyName);
				energyAdded = this.addToBuffer(energyName, amount * energyRatio, size * energyRatio, power * energyRatio, gridReceiversCount);
				energyAdded /= energyRatio;
			} else {
				energyAdded = this.addToBuffer(energyName, amount, size, power, gridReceiversCount);
			}
			energyOut += energyAdded
			amount -= energyAdded;
			if (amount <= 0) break;
		}
		return energyOut;
	}

	addToBuffer(energyName: string, amount: number, size: number, power: number, sizeMultiplier: number): number {
		const energyBuffer = this.getBuffer(energyName, true);
		size *= sizeMultiplier // reserve space for 1 packet per connected grid
		if (energyBuffer.amount < size) {
			const energyAdd = Math.min(size - energyBuffer.amount, amount);
			energyBuffer.amount += energyAdd;
			energyBuffer.power = power;
			energyBuffer.packetSize = Math.ceil(energyBuffer.amount / sizeMultiplier);
			this.currentPower = Math.max(this.currentPower, power);
			this.currentOut += energyAdd;
			return energyAdd;
		}
		return 0;
	}

	getBuffer(energyName: string, createIfNotFound?: boolean) {
		if (createIfNotFound) {
			this.energyAmounts[energyName] ??= {amount: 0, power: 0, packetSize: 0};
		}
		return this.energyAmounts[energyName] || null;
	}

	init(): void {
		EnergyGridBuilder.buildGridForTile(this.tileEntity);
		this.initialized = true;
	}

	tick(): void {
		if (!this.tileEntity.__initialized || !this.tileEntity.isLoaded) return;
		if (!this.initialized) {
			this.init();
		}
		this.tileEntity.energyTick(this.baseEnergy, this);
		super.tick();
	}
}
