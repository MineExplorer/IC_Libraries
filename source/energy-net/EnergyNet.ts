let GLOBAL_WEB_ID = 0;

class EnergyNet extends EnergyNode {
	maxPacketSize: number;
	netId: number;
	wireMap: {};
	connectedNets: {
		[key: number]: EnergyNet;
	};
	connectionsCount: number = 0;
	energyNodes: Array<EnergyNode> = [];
	onOverload: Function;
	wireId: number;
	canSpreadEnergy: boolean;
	removed: boolean = false;

	store: number = 0;
	transfered: number = 0;
	voltage: number = 0;
	lastStore: number = 0;
	lastTransfered: number = 0;
	lastVoltage: number = 0;

	constructor(energyType: EnergyType, maxPacketSize?: number, overloadFunc?: Function) {
		super(energyType, maxPacketSize);
		this.maxPacketSize = maxPacketSize;
		this.onOverload = overloadFunc || function() {};

		this.canSpreadEnergy = true;
		this.netId = GLOBAL_WEB_ID++;
		this.wireMap = {};
		this.connectedNets = {};

		this.energyNodes = [];
	}

	addEnergy(amount: number, voltage: number, source: EnergyNode, explored: {}) {
		if (explored[this.netId]) {
			return 0;
		}
		explored[this.netId] = true;

		let inVoltage = voltage;
		if (voltage > this.maxPacketSize) {
			voltage = this.maxPacketSize;
			amount = Math.min(amount, voltage);
		}
		let inAmount = amount;
		let n = this.energyNodes.length;
		for (let node of this.energyNodes) {
			if (amount <= 0) break;
			if (node != source) {
				amount -= node.receiveEnergy(this.energyName, Math.ceil(amount/n), voltage);
			}
			n--;
		}
		for (let node of this.energyNodes) {
			if (amount <= 0) break;
			if (node != source) {
				amount -= node.receiveEnergy(this.energyName, amount, voltage);
			}
		}

		for (let i in this.connectedNets) {
			if (amount <= 0) break;
			let net = this.connectedNets[i];
			if (net.canSpreadEnergy) {
				amount -= net.addEnergy(amount, voltage, source, explored);
			}
		}

		if (inAmount > amount) {
			if (inVoltage > voltage) {
				this.onOverload(inVoltage);
			}
			this.voltage = Math.max(this.voltage, voltage);
			this.transfered += inAmount - amount;
		}
		return inAmount - amount;
	}

	addToBuffer(amount: number, voltage: number = amount) {
		this.store += amount;
		this.voltage = Math.max(this.voltage, voltage);
	}

	tick() {
		this.lastStore = this.store;
		if (this.store > 0) {
			this.addEnergy(this.store, this.voltage, null, {});
			this.store = 0;
		}
		this.lastTransfered = this.transfered;
		this.lastVoltage = this.voltage;
		this.transfered = 0;
		this.voltage = 0;
	}

	toString() {
		let r = function(x) {return Math.round(x * 100) / 100};
		return "[EnergyNet id=" + this.netId + " type=" + this.energyName + "| stored =" + this.lastStore + "| connections=" + this.connectionsCount + " units=" + this.energyNodes.length + " | transfered=" + r(this.lastTransfered) + " | voltage=" + r(this.lastVoltage) + "]";
	}
}


EXPORT("EnergyTypeRegistry", EnergyRegistry);
EXPORT("EnergyNetBuilder", EnergyNetBuilder);
EXPORT("EnergyTileRegistry", TileEntityRegistry);
