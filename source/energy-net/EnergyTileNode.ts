class EnergyTileNode extends EnergyNode
implements EnergyGraphNode {
	readonly kind: EnergyNodeKind = "tile";
	tileEntity: EnergyTile;
	initialized: boolean = false;
	adjacentLinks: AdjacentNodeLink[] = [];
	energyAmounts: EnergyBuffer = {};

	constructor(energyType: EnergyType, parent: EnergyTile) {
		super(energyType, parent.dimension);
		this.tileEntity = parent;
		if (parent.isEnergyProducer()) {
			parent.data.energyNetBuffer ??= {};
			this.energyAmounts = parent.data.energyNetBuffer;
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
			if (tileEntity.isEnergyProducer()) {
				node.energyAmounts[name] ??= {amount: 0, power: 0};
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
		if (packet.source == this || this.isFull) return 0;
		
		let energyIn = this.tileEntity.energyReceive(packet.energyName, amount, packet.size);
        if (energyIn < amount && this.isConductor(packet.energyName)) {
			energyIn += this.transferEnergy(amount - energyIn, packet);
		}
        if (energyIn > 0) {
        	this.currentPower = Math.max(this.currentPower, packet.size);
        	this.currentIn += energyIn;
	    } else {
			this.isFull = true;
		}
        return energyIn;
	}

	getFreeCapacity(energyName: string) {
		const freeEnergy =  this.isFull ? 0 : this.tileEntity.getFreeEnergyAmount(energyName);
		return this.freeCapacity = freeEnergy;
	}

	canProduceEnergy(): boolean {
		return this.tileEntity.isEnergyProducer();
	}

	isConductor(energyName: string): boolean {
		return this.tileEntity.isConductor(energyName);
	}

	canReceiveEnergy(side: number, energyName: string): boolean {
		return this.tileEntity.canReceiveEnergy(side, energyName);
	}

	canEmitEnergy(side: number, energyName: string): boolean {
		return this.tileEntity.canEmitEnergy(side, energyName);
	}

	resetConnections(): void {
		this.resetAdjacentLinks();
		super.resetConnections();
	}

	add(amount: number, power?: number): number {
		if (amount == 0) return 0;

		let energyOut = 0;
		let leftAmount = amount;
		const activeReceivers = this.getActiveReceivers();
		const tileReceivers = activeReceivers.filter(n => n.kind == "tile");
		const gridConnectionsCount = activeReceivers.length - tileReceivers.length; 
		// try to split energy evenly between grids and direct connections
		if (gridConnectionsCount > 0 && tileReceivers.length > 0) {
			const energyAdd = Math.floor(leftAmount * gridConnectionsCount / activeReceivers.length);
			if (energyAdd > 0) {
				energyOut = this.addToBuffer(this.baseEnergy, energyAdd, amount, power);
				leftAmount -= energyOut;
			}
		}
		if (tileReceivers.length > 0) {
			energyOut += this.addPacket(this.baseEnergy, leftAmount, power, tileReceivers);
			leftAmount -= energyOut;
		}
		if (gridConnectionsCount > 0 && leftAmount > 0) {
			energyOut += this.addToBuffer(this.baseEnergy, leftAmount, amount, power);
		}
		return amount - energyOut;
	}

	addToBuffer(energyName: string, amount: number, cap: number, power: number = amount): number {
		const energyBuffer = this.energyAmounts[energyName];
		if (energyBuffer && energyBuffer.amount < cap) {
			const energyAdd = Math.min(cap - energyBuffer.amount, amount);
			energyBuffer.amount += energyAdd;
			energyBuffer.power = power;
			this.currentPower = Math.max(this.currentPower, power);
			this.currentOut += energyAdd;
			return energyAdd;
		}
		return 0;
	}

	getBuffer(energyName: string) {
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
