class EnergyNode {
	id: number;
	energyType: EnergyType;
	energyName: string;
	dimension: number;
	maxPacketSize: number;
	connections: EnergyNode[] = [];
	receivers: EnergyNode[] = [];

	energy_received: number = 0;
	last_energy_received: number = 0;
	voltage: number = 0;
	last_voltage: number = 0;

	constructor(energyType: EnergyType, maxPacketSize: number = 2e9) {
		this.energyType = energyType;
		this.energyName = energyType.name;
		this.maxPacketSize = maxPacketSize;
	}

	addConnection(node: EnergyNode) {
		if (this.connections.indexOf(node) == -1) {
			this.connections.push(node);
			node.addConnection(this);
		}
	}

	removeConnection(node: EnergyNode) {
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
		}
	}

	receiveEnergy(type: string, amount: number, voltage: number): number {
		let add = this.tileEntity.energyReceive(type, amount, voltage);
		this.energy_received += add;
		this.voltage = Math.max(this.voltage, voltage);
		return add;
	}

	add(amount: number, voltage: number = amount): number {
		let add = this.addPacket(amount, voltage);
		return amount - add;
	}

	addPacket(amount: number, voltage: number): number {
		let packet = new EnergyPacket(amount, voltage, this);
		return this.sendPacket(packet);
	}

	sendPacket(packet: EnergyPacket): number {

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

	canConductEnergy(): boolean {
		return true;
	}

	tick(): void {
		this.last_energy_received = this.energy_received;
		this.energy_received = 0;
		this.last_voltage = this.voltage;
		this.voltage = 0;
	}

	destroy(): void {
		EnergyNetBuilder.removeNode(this);
	}
}