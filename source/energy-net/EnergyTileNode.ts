class EnergyTileNode extends EnergyNode
implements EnergyGraphNode {
	readonly kind: EnergyNodeKind = "tile";
	tileEntity: EnergyTile;
	initialized: boolean = false;
	adjacentLinks: AdjacentNodeLink[] = [];

	constructor(energyType: EnergyType, parent: EnergyTile) {
		super(energyType, parent.dimension);
		this.tileEntity = parent;
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

	isConductor(type: string): boolean {
		return this.tileEntity.isConductor(type);
	}

	canReceiveEnergy(side: number, type: string): boolean {
		return this.tileEntity.canReceiveEnergy(side, type);
	}

	canExtractEnergy(side: number, type: string): boolean {
		return this.tileEntity.canExtractEnergy(side, type);
	}

	resetConnections(): void {
		this.resetAdjacentLinks();
		super.resetConnections();
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
