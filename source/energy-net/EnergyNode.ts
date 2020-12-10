class EnergyNode {
	id: number;
	energyType: EnergyType;
	energyName: string;
	tileEntity: EnergyTile;
	connections: {
		[key: number]: EnergyNode;
	};
	connectionsCount: number = 0;
	receivers: EnergyNode[];

	constructor(parent: EnergyTile, energyType: EnergyType) {
		this.energyType = energyType;
		this.energyName = energyType.name;
		this.tileEntity = parent;
		this.connections = {};
		this.receivers = [];
	}

	getParent(): EnergyTile {
		return this.tileEntity;
	}

	addConnection(node: EnergyNode) {
		if (!this.connections[node.id]) {
			this.connections[node.id] = node;
			this.connectionsCount++;
		}
	}

	removeConnection(node: EnergyNode) {
		delete this.connections[node.id];
		this.connectionsCount--;
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
		}
	}

	receiveEnergy(type: string, amount: number, voltage: number): number {
		return this.tileEntity.energyReceive(type, amount, voltage);
	}
	
	add(amount: number, voltage: number = amount): number {
		let add = this.addEnergy(amount, voltage, this, {});
		return amount - add;
	}
	
	addAll(amount: number, voltage: number = amount): void {
		let net = this.currentNet;
		if (net.connectionsCount == 1 && net.energyNodes.length == 0) {
			for (let i in net.connectedNets) {
				net.connectedNets[i].addToBuffer(amount, voltage);
			}
			net.transfered = amount;
			net.voltage = voltage;
		}
		else {
			net.addToBuffer(amount, voltage);
		}
	}

	getEnergyTypes(): object {
		return this.tileEntity.__energyTypes;
	}

	getEnergyNet(type: string): EnergyNet {
		return this.energyNets[type];
	}

	setEnergyNet(type: string, net: EnergyNet): void {
		this.energyNets[type] = net;
	}

	tick(): void {
		let energyTypes = this.getEnergyTypes();
		for (var name in energyTypes) {
			if (this.tileEntity.isEnergySource(name) || this.tileEntity.canConductEnergy(name)) {
				var net = this.getEnergyNet(name);
				if (!net || net.removed) {
					net = EnergyNetBuilder.buildForTile(this.tileEntity, energyTypes[name]);
					this.setEnergyNet(name, net);
				}
				this.currentNet = net;
			}
			this.tileEntity.energyTick(name, this);
		}
	}

	destroy(): void {
		for (let i in this.connectedNets) {
			this.connectedNets[i].removeEnergyNode(this);
		}
		for (let i in this.energyNets) {
			EnergyNetBuilder.removeNet(this.energyNets[i]);
		}
	}
}