var TileEntityRegistry = {
	// adds energy type for tile entity prototype
	addEnergyType: function(Prototype, energyType) {
		if (!Prototype.__energyLibInit) {
			this.setupInitialParams(Prototype);
		}
		
		Prototype.__energyTypes[energyType.name] = energyType;
	},

	//same as addEnergyType, but works on already created prototypes, accessing them by id
	addEnergyTypeForId: function(id, energyType) {
		var Prototype = TileEntity.getPrototype(id);
		if (Prototype) {
			this.addEnergyType(Prototype, energyType);
		}
		else {
			Logger.Log("cannot add energy type no prototype defined for id " + id, "ERROR");
		}
	},

	setupInitialParams: function(Prototype) {
		Prototype.__energyLibInit = true;
		
		Prototype.__energyTypes = {};
		Prototype.__energyNets = {};
		Prototype.__connectedNets = {};

		Prototype.__init = Prototype.init || function() {};
		Prototype.__tick = Prototype.tick || function() {};
		Prototype.__destroy = Prototype.destroy || function() {};
		
		if (!Prototype.energyTick) {
			Prototype.energyTick = function(type, src) {
				// called for each energy type
			}
		}
		
		Prototype.energyReceive = Prototype.energyReceive || function() {
			return 0;
		}
		
		Prototype.canReceiveEnergy = Prototype.canReceiveEnergy || function() {
			return true;
		}
		
		if (Prototype.isEnergySource) {
			Prototype.canExtractEnergy = Prototype.canExtractEnergy || function() {
				return true;
			}
		}
		else {
			Prototype.canExtractEnergy = function() {
				return false;
			}
			Prototype.isEnergySource = function(type) {
				return false;
			}
		}
		
		Prototype.init = function() {
			this.__energyNets = {};
			this.__connectedNets = {};
			TileEntityRegistry.addMacineAccessAtCoords(this.x, this.y, this.z, this);
			
			EnergyNetBuilder.rebuildTileConnections(this.x, this.y, this.z, this);
			
			this.__init();
		}
		
		Prototype.destroy = function() {
			TileEntityRegistry.removeMachineAccessAtCoords(this.x, this.y, this.z);
			
			for (var i in this.__connectedNets) {
				this.__connectedNets[i].removeTileEntity(this);
			}
			for (var i in this.__energyNets) {
				EnergyNetBuilder.removeNet(this.__energyNets[i]);
			}
			
			this.__destroy();
		}
			
		Prototype.tick = function() {
			this.__tick();
			for (var name in this.__energyTypes) {
				if (this.isEnergySource(name)) {
					var net = this.__energyNets[name];
					if (!net) {
						net = EnergyNetBuilder.buildForTile(this, this.__energyTypes[name]);
						this.__energyNets[name] = net;
					}
					var src = net.source;
					this.energyTick(name, src);
				} else {
					this.energyTick(name, null);
				}
			}
		}
	},



	/* machine is tile entity, that uses energy */
	machineIDs: {},

	isMachine: function(id) {
		return this.machineIDs[id];
	},

	quickCoordAccess: {},

	addMacineAccessAtCoords: function(x, y, z, machine) {
		this.quickCoordAccess[x + ":" + y + ":" + z] = machine;
	},

	removeMachineAccessAtCoords: function(x, y, z) {
		delete this.quickCoordAccess[x + ":" + y + ":" + z];
	},

	accessMachineAtCoords: function(x, y, z) {
		return this.quickCoordAccess[x + ":" + y + ":" + z];
	},

	executeForAllInNet: function(net, func) {
		for (var i in net.tileEntities) {
			var mech = net.tileEntities[i];
			func(mech);
		}
	},
};

Callback.addCallback("LevelLoaded", function() {
    TileEntityRegistry.quickCoordAccess = {};
});
