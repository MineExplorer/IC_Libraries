class EnergyPacket {
	amount: number;
	voltage: number;
	source: EnergyNode;
	netMap: object = {};

	constructor(amount: number, voltage: number, source: EnergyNode) {
		this.amount = amount;
		this.voltage = voltage;
		this.source = source;
		this.netMap[source.id] = true;
	}
}