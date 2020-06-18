var EnergyRegistry = {
	energyTypes: {},

	/**
	 * name - name of this energy type
	 * value - value of one unit in [Eu] (Industrial Energy)
	*/
	createEnergyType: function(name, value, wireParams) {
		if (this.energyTypes[name]) {
			alert("WARNING: duplicate energy types for name: " + name + "!");
			Logger.Log("duplicate energy types for name: " + name + "!", "ERROR");
		}
		
		var energyType = new EnergyType(name);
		energyType.value = value || 1;

		this.energyTypes[name] = energyType;
		
		return energyType;
	},

	assureEnergyType: function(name, value, wireParams) {
		if (this.getEnergyType(name)) {
			return this.getEnergyType(name);
		}
		else {
			return this.createEnergyType(name, value, wireParams);
		}
	},

	getEnergyType: function(name) {
		return this.energyTypes[name];
	},

	getValueRatio: function(name1, name2) {
		var type1 = this.getEnergyType(name1);
		var type2 = this.getEnergyType(name2);
		
		if (type1 && type2) {
			return type1.value / type2.value;
		}
		else {
			Logger.Log("get energy value ratio failed: some of this 2 energy types is not defiled: " + [name1, name2], "ERROR");
			return -1;
		}
	},

	wireData: {},
	
	getWireData: function(id) {
		return this.wireData[id];
	},
	
	isWire: function(id, type) {
		var wireData = this.getWireData(id);
		if (wireData) {
			if (!type || wireData.type == type) return true;
		}
		return false;
	},
	
	onWirePlaced: function(x, y, z) {
		var block = World.getBlock(x, y, z);
		var wireData = this.getWireData(block.id);
		var coord1 = {x: x, y: y, z: z};
		for (var side = 0; side < 6; side++) {
			var coord2 = EnergyNetBuilder.getRelativeCoords(x, y, z, side);
			var net = EnergyNetBuilder.getNetByBlock(coord2.x, coord2.y, coord2.z, block.id);
			if(net && wireData.canConnect(block, coord1, coord2, side)) {
				EnergyNetBuilder.rebuildRecursive(net, block.id, x, y, z);
				return;
			}
		}
		
		EnergyNetBuilder.buildForWire(x, y, z, block.id);
	},

	onWireDestroyed: function(x, y, z, id) {
		var net = EnergyNetBuilder.getNetOnCoords(x, y, z);
		if (net) {
			EnergyNetBuilder.removeNet(net);
			EnergyNetBuilder.rebuildForWire(x-1, y, z, id);
			EnergyNetBuilder.rebuildForWire(x+1, y, z, id);
			EnergyNetBuilder.rebuildForWire(x, y-1, z, id);
			EnergyNetBuilder.rebuildForWire(x, y+1, z, id);
			EnergyNetBuilder.rebuildForWire(x, y, z-1, id);
			EnergyNetBuilder.rebuildForWire(x, y, z+1, id);
		}
	}
}

Callback.addCallback("DestroyBlock", function(coords, block) {
    if (EnergyRegistry.isWire(block.id)) {
        EnergyRegistry.onWireDestroyed(coords.x, coords.y, coords.z, block.id);
    }
});
