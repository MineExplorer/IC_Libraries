interface EnergyTile extends TileEntity {
	isEnergyTile: boolean;
	energyTypes: {};
	energyNode: EnergyTileNode;
	energyTick(type: string, node: EnergyTileNode): void;
	energyReceive(type: string, amount: number, voltage: number): number;
	canReceiveEnergy(side: number, type: string): boolean;
	canExtractEnergy(side: number, type: string): boolean;
	canConductEnergy(type: string): boolean;
}

namespace EnergyTileRegistry {
	// adds energy type for tile entity prototype
	export function addEnergyType(Prototype: EnergyTile, energyType: EnergyType): void {
		if (!Prototype.isEnergyTile) {
			setupAsEnergyTile(Prototype);
		}
		Prototype.energyTypes[energyType.name] = energyType;
	}

	// same as addEnergyType, but works on already created prototypes, accessing them by id
	export function addEnergyTypeForId(id: number, energyType: EnergyType): void {
		let Prototype = TileEntity.getPrototype(id);
		if (Prototype) {
			addEnergyType(Prototype as EnergyTile, energyType);
		}
		else {
			Logger.Log("cannot add energy type no prototype defined for id " + id, "ERROR");
		}
	}

	export function setupAsEnergyTile(Prototype: EnergyTile): void {
		Prototype.isEnergyTile = true;

		Prototype.energyTypes = {};

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

		if (!Prototype.canExtractEnergy) {
			if (Prototype.isEnergySource) {
				Prototype.canExtractEnergy = function() {
					return true;
				}
			} else {
				Prototype.canExtractEnergy = function() {
					return false;
				}
			}
		}
	}

	/* machine is tile entity, that uses energy */
	export let machineIDs = {};

	export function isMachine(id: number): boolean {
		return machineIDs[id] ? true : false;
	}
};

Callback.addCallback("TileEntityAdded", function(tileEntity: TileEntity) {
    if (tileEntity.isEnergyTile) {
		let node: EnergyNode;
		for (let name in tileEntity.energyTypes) {
			let type = tileEntity.energyTypes[name];
			if (!node) node = new EnergyTileNode(type, tileEntity as EnergyTile);
			else node.addEnergyType(type);
		}
		tileEntity.energyNode = node;
		EnergyNet.addEnergyNode(node);
	}
});

Callback.addCallback("TileEntityRemoved", function(tileEntity: TileEntity) {
    if (tileEntity.energyNode) {
		tileEntity.energyNode.destroy();
	}
});
