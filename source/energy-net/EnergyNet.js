var GLOBAL_WEB_ID = 0;

class EnergyNet {
	constructor(energyType, maxPacketSize, overloadFunc) {
		this.energyType = energyType;
		this.energyName = energyType.name;
		this.maxPacketSize = maxPacketSize || 2e9;
		
		this.netId = GLOBAL_WEB_ID++;
		
		this.wireMap = {};
		this.onOverload = overloadFunc || function() {};
		
		this.store = 0;
		this.transfered = 0;
		this.voltage = 0;
		this.lastStore = 0;
		this.lastTransfered = 0;
		this.lastVoltage = 0;
		
		var self = this;
		this.source = {
			parent: function() {
				return self;
			},
			
			add: function(amount, voltage) {
				var add = self.addEnergy(amount, voltage || amount, self.sourceTile, {});
				return amount - add;
			},
			
			addAll: function(amount, voltage) {
				if (!voltage) voltage = amount;
				if(self.connectionsCount == 1 && self.tileEntities.length == 0) {
					for(var i in self.connectedNets)
					self.connectedNets[i].addToBuffer(amount, voltage);
					self.transfered = amount;
					self.voltage = voltage;
				}
				else {
					self.addToBuffer(amount, voltage);
				}
			}
		}

		this.connectedNets = {};
		this.connectionsCount = 0;
		this.tileEntities = [];
	}
	
	addConnection(net) {
		if(!this.connectedNets[net.netId]) {
			this.connectedNets[net.netId] = net;
			this.connectionsCount++;
		}
	}

	removeConnection(net) {
		delete this.connectedNets[net.netId];
		this.connectionsCount--;
	}

	addTileEntity(tileEntity) {
		if (!tileEntity.__connectedNets[this.netId]) {
			this.tileEntities.push(tileEntity);
			tileEntity.__connectedNets[this.netId] = this;
		}
	}

	removeTileEntity(tileEntity) {
		for (var i in this.tileEntities) {
			if (this.tileEntities[i] == tileEntity) {
				this.tileEntities.splice(i, 1);
				break;
			}
		}
	}

	addEnergy(amount, voltage, source, explored) {
		if (explored[this.netId]) {
			return 0;
		}
		explored[this.netId] = true;
		
		var inVoltage = voltage;
		if (voltage > this.maxPacketSize) {
			voltage = this.maxPacketSize;
			amount = Math.min(amount, voltage);
		}
		var inAmount = amount;
		var n = this.tileEntities.length;
		for (var i in this.tileEntities) {
			if (amount <= 0) break;
			var tile = this.tileEntities[i];
			if (tile != source) {
				amount -= tile.energyReceive(this.energyName, Math.ceil(amount/n), voltage);
			}
			n--;
		}
		for (var i in this.tileEntities) {
			if (amount <= 0) break;
			var tile = this.tileEntities[i];
			if (tile != source) {
				amount -= tile.energyReceive(this.energyName, amount, voltage);
			}
		}
		
		for (var i in this.connectedNets) {
			if (amount <= 0) break;
			var net = this.connectedNets[i];
			if (!net.sourceTile) {
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
	
	addToBuffer(amount, voltage) {
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
		var r = function(x) {return Math.round(x * 100) / 100};
		return "[EnergyNet id=" + this.netId + " type=" + this.energyName + "| stored =" + this.lastStore + "| connections=" + this.connectionsCount + " units=" + this.tileEntities.length + " | transfered=" + r(this.lastTransfered) + " | voltage=" + r(this.lastVoltage) + "]";
	}
}


EXPORT("EnergyTypeRegistry", EnergyRegistry);
EXPORT("EnergyNetBuilder", EnergyNetBuilder);
EXPORT("EnergyTileRegistry", TileEntityRegistry);
