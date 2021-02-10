interface EnergyTile extends TileEntity {
	energyTypes?: {};
	energyNodes?: {};
	/**
	 * called for each energy type
	 * @param type energy type name
	 * @param src EnergyNode
	 */
	energyTick(type: string, src: EnergyNode): void;
	energyReceive(type: string, amount: number, voltage: number): number;
	canReceiveEnergy(side: number, type: string): boolean;
	canExtractEnergy(side: number, type: string): boolean;
	canConductEnergy(type: string, side?: number): boolean;
}

namespace TileEntityRegistry {
	// adds energy type for tile entity prototype
	export function addEnergyType(Prototype: any, energyType: EnergyType): void {
		if (!Prototype.__energyLibInit) {
			setupInitialParams(Prototype);
		}
		Prototype.__energyTypes[energyType.name] = energyType;
	}

	// same as addEnergyType, but works on already created prototypes, accessing them by id
	export function addEnergyTypeForId(id: number, energyType: EnergyType): void {
		let Prototype = TileEntity.getPrototype(id);
		if (Prototype) {
			addEnergyType(Prototype, energyType);
		}
		else {
			Logger.Log("cannot add energy type no prototype defined for id " + id, "ERROR");
		}
	}

	export function setupInitialParams(Prototype: any): void {
		Prototype.__energyLibInit = true;

		Prototype.__energyTypes = {};

		Prototype.__init = Prototype.init || function() {};
		Prototype.__tick = Prototype.tick || function() {};
		Prototype.__destroy = Prototype.destroy || function() {};

		Prototype.energyTick = Prototype.energyTick || function() {};

		Prototype.energyReceive = Prototype.energyReceive || function() {
			return 0;
		}

		Prototype.canReceiveEnergy = Prototype.canReceiveEnergy || function() {
			return true;
		}

		Prototype.canConductEnergy = Prototype.canConductEnergy || function() {
			return false;
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
		}

		Prototype.init = function() {
			for (let name in this.__energyTypes) {
				this.energyNode = new EnergyNode(this, this.__energyTypes[name]);
				if (this.isEnergySource(name) || this.canConductEnergy(name)) {
					let node = this.getEnergyNode(name);
					if (!node) {
						node = EnergyNetBuilder.createNode(this.tileEntity, this.__energyTypes[name]);
						this.setEnergyNode(name, node);
					}
					this.currentNet = net;
				}
			}
			TileEntityRegistry.addMacineAccessAtCoords(this.x, this.y, this.z, this);
			EnergyNetBuilder.rebuildTileConnections(this.x, this.y, this.z, this);
			this.__init();
		}

		Prototype.destroy = function() {
			TileEntityRegistry.removeMachineAccessAtCoords(this.x, this.y, this.z);
			this.energyNode.destroy();
			this.__destroy();
		}

		Prototype.tick = function() {
			this.__tick();
			for (let name in this.__energyTypes) {
				let node = this.__energyNodes[name];
				node.tick();
			}
		}
	}

	/* machine is tile entity, that uses energy */
	export let machineIDs = {};
	export let quickCoordAccess = {};

	export function isMachine(id: number): boolean {
		return machineIDs[id] ? true : false;
	}

	export function executeForAllInNet(net: EnergyNet, func: Function): void {
		for (let i in net.energyNodes) {
			let mech = net.energyNodes[i].getTileEntity();
			func(mech);
		}
	}
};

Callback.addCallback("LevelLoaded", function() {
    TileEntityRegistry.quickCoordAccess = {};
});
