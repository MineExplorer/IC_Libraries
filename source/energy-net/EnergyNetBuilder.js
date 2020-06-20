var EnergyNetBuilder = {
	energyNets: [],
	addEnergyNet: function(net) {
		this.energyNets.push(net);
	},

	removeNet: function(net) {
		TileEntityRegistry.executeForAllInNet(net, function(tileEntity) {
			delete tileEntity.__connectedNets[net.netId];
		});
		
		for (var i in net.connectedNets) {
			net.connectedNets[i].removeConnection(net);
		}
		net.removed = true;
		for (var i in this.energyNets) {
			if (this.energyNets[i] == net) {
				this.energyNets.splice(i, 1);
				break;
			}
		}
	},

	removeNetOnCoords: function(x, y, z) {
		var net = this.getNetOnCoords(x, y, z);
		if (net) {
			this.removeNet(net);
		}
	},

	removeNetByBlock: function(x, y, z, wireId) {
		if (World.getBlockID(x, y, z) == wireId) {
			EnergyNetBuilder.removeNetOnCoords(x, y, z);
		}
	},
	
	mergeNets: function(net1, net2) {
		for (var key in net2.wireMap) {
			net1.wireMap[key] = true;
		}
		for (var i in net2.tileEntities) {
			net1.addTileEntity(net2.tileEntities[i]);
		}
		for (var i in net2.connectedNets) {
			var otherNet = net2.connectedNets[i];
			net1.addConnection(otherNet);
			otherNet.addConnection(net1);
		}
		this.removeNet(net2);
	},
	
	buildForTile: function(tile, type) {
		var net = new EnergyNet(type);
		net.sourceTile = tile;
		this.addEnergyNet(net);
		
		for (var side = 0; side < 6; side++) {
			if (tile.canExtractEnergy(side, type.name)) {
				var c = this.getRelativeCoords(tile.x, tile.y, tile.z, side);
				this.buildTileNet(net, c.x, c.y, c.z, side ^ 1);
			}
		}
		
		return net;
	},
	
	buildTileNet: function(net, x, y, z, side) {
		var type = net.energyName;
		var tile = TileEntityRegistry.accessMachineAtCoords(x, y, z);
		if (tile && tile.__energyTypes[type]) {
			if (tile.canReceiveEnergy(side, type)) {
				net.addTileEntity(tile);
			}
		}
		else {
			var wireNet = this.getNetOnCoords(x, y, z);
			if (wireNet) {
				if (wireNet.energyName == type) {
					net.addConnection(wireNet);
					wireNet.addConnection(net);
				}
			}
			else {
				var blockID = World.getBlockID(x, y, z);
				if (EnergyRegistry.isWire(blockID, type)) {
					var wireNet = this.buildForWire(x, y, z, blockID);
					net.addConnection(wireNet);
					wireNet.addConnection(net);
				}
			}
		}
	},
	
	
	buildForWire: function(x, y, z, id) {
		var wireData = EnergyRegistry.getWireData(id);
		if (!wireData) return null;
		var type = EnergyRegistry.getEnergyType(wireData.type);
		var net = new EnergyNet(type, wireData.value, wireData.onOverload);
		net.wireId = id;
		this.addEnergyNet(net);
		this.rebuildRecursive(net, id, x, y, z);
		return net;
	},

	rebuildForWire: function(x, y, z, id) {
		var blockID = World.getBlock(x, y, z);
		if (blockID == id && !EnergyNetBuilder.getNetOnCoords(x, y, z)) {
			this.buildForWire(x, y, z, blockID);
		}
	},
	
	rebuildRecursive: function(net, wireId, x, y, z, side) {
		if (net.removed) return;
		
		var coordKey = x + ":" + y + ":" + z;
		if (net.wireMap[coordKey]) {
			return;
		}
		
		var type = net.energyName;
		var tileEntity = TileEntityRegistry.accessMachineAtCoords(x, y, z);
		if (tileEntity && tileEntity.__energyTypes[type]) {
			if (tileEntity.isEnergySource(type) && tileEntity.canExtractEnergy(side, type)) {
				var tnet = tileEntity.__energyNets[type];
				if (tnet) {
					tnet.addConnection(net);
					net.addConnection(tnet);
				}
			}
			if (tileEntity.canReceiveEnergy(side, type)) {
				net.addTileEntity(tileEntity);
			}
		}
		else {
			var otherNet = this.getNetOnCoords(x, y, z);
			if (otherNet == net) {
				return;
			}
			
			var block = World.getBlock(x, y, z);
			if (wireId == block.id) {
				if (otherNet) {
					this.mergeNets(net, otherNet);
				}
				else {
					net.wireMap[coordKey] = true;
					this.rebuildFor6Sides(net, block, x, y, z);
				}
			}
			else if (otherNet) {
				if (otherNet.energyName == type) {
					net.addConnection(otherNet);
					otherNet.addConnection(net);
				}
			}
			else if (EnergyRegistry.isWire(block.id, type)) {
				this.buildForWire(x, y, z, block.id);
			}
		}
	},

	rebuildFor6Sides: function(net, wireBlock, x, y, z) {
		var wireData = EnergyRegistry.getWireData(wireBlock.id);
		var coord1 = {x: x, y: y, z: z};
		for(var side = 0; side < 6; side++) {
			var coord2 = this.getRelativeCoords(x, y, z, side);
			if(wireData.canConnect(wireBlock, coord1, coord2, side)) {
				this.rebuildRecursive(net, wireBlock.id, coord2.x, coord2.y, coord2.z, side ^ 1);
			}
		}
	},
	
	
	rebuildTileNet: function(tile) {
		var nets = tile.__energyNets;
		for (var i in nets) {
			EnergyNetBuilder.removeNet(nets[i]);
			delete nets[i];
		}
		
		for(var i in tile.__connetedNets) {
			tile.__connetedNets[i].removeTileEntity();
		}
		EnergyNetBuilder.rebuildTileConnections(tile.x, tile.y, tile.z, tile);
	},
	
	rebuildTileConnections: function(x, y, z, tile) {
		for (var name in tile.__energyTypes) {
			for (var side = 0; side < 6; side++) {
				if (tile.canReceiveEnergy(side, name)) {
					var c = this.getRelativeCoords(x, y, z, side);
					var tileSource = TileEntityRegistry.accessMachineAtCoords(c.x, c.y, c.z);
					if (tileSource && tileSource.__energyTypes[name]) {
						if (tileSource.canExtractEnergy(side ^ 1, name)) {
							var net = tileSource.__energyNets[name];
							if (net) net.addTileEntity(tile);
						}
					}
					else {
						var net = this.getNetOnCoords(c.x, c.y, c.z);
						if (net && net.energyName == name) {
							net.addTileEntity(tile);
						}
					}
				}
			}
		}
	},

	getNetOnCoords: function(x, y, z) {
		for (var i in this.energyNets) {
			var net = this.energyNets[i];
			var key = x + ":" + y + ":" + z;
			if (net.wireMap[key]) return net;
		}
		return null;
	},
	
	getNetByBlock: function(x, y, z, wireId) {
		if (World.getBlockID(x, y, z) == wireId) {
			return this.getNetOnCoords(x, y, z);
		}
		return null;
	},

	tickEnergyNets: function() {
		for (var i in this.energyNets) {
			this.energyNets[i].tick();
		}
	},
	
	getRelativeCoords: function(x, y, z, side) {
		var directions = [
			{x: 0, y: -1, z: 0}, // down
			{x: 0, y: 1, z: 0}, // up
			{x: 0, y: 0, z: -1}, // east
			{x: 0, y: 0, z: 1}, // west
			{x: -1, y: 0, z: 0}, // south
			{x: 1, y: 0, z: 0} // north
		]
		var dir = directions[side];
		return {x: x + dir.x, y: y + dir.y, z: z + dir.z};
	},
}

Callback.addCallback("LevelLoaded", function() {
    EnergyNetBuilder.energyNets = [];
});

Callback.addCallback("tick", function() {
    EnergyNetBuilder.tickEnergyNets();
});
