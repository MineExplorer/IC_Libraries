type EnergyBuffer = {[energyName: string]: {amount: number, power: number}};

interface EnergyTile extends TileEntity {
	isEnergyTile?: boolean;
	/**
	 * Allows energy-net to accumulate outcoming energy packets in the buffer for optimization. True by default.
	 */
	enableEnergyBuffer?: boolean;
	/**
	 * Dictionary of energy types registered for tile entity.
	 */
	energyTypes?: {[energyName: string]: EnergyType};
	/**
	 * Tile entity energy node.
	 */
	energyNode: EnergyTileNode;
	/**
	 * This method is called during energy net tick and allows to send energy packets from the tile entity node.
	 * @param type main energy type of the node
	 * @param node energy node reference
	 */
	energyTick(type: string, node: EnergyTileNode): void;
	/**
	 * This method is called when the tile entity receives an energy packet.
	 * @param type energy type
	 * @param amount received energy amount
	 * @param power energy power, indicates original packet energy or the energy of an individual packet if the received amount is a sum of multiple packets.
	 */
	energyReceive(type: string, amount: number, power: number): number;
	/**
	 * @returns true if tile can produce energy, false otherwise
	 */
	canProduceEnergy(): boolean;
	/**
	 * If returns true, the tile node can transfer incoming energy packets to other nodes.
	 * @param type energy type name
	 */
	isConductor(type: string): boolean;
	/**
	 * Specifies from which sides the tile entity can receive energy. The tile entity must recreate its connections if this value changes.
	 * @param side block side
	 * @param type energy type name
	 */
	canReceiveEnergy(side: number, type: string): boolean;
	/**
	 * Specifies from which sides the tile entity can emit energy. The tile entity must recreate its connections if this value changes.
	 * @param side block side
	 * @param type energy type name
	 */
	canEmitEnergy(side: number, type: string): boolean;
	/** @deprecated use canEmitEnergy instead */
	canExtractEnergy?(side: number, type: string): boolean;
}

namespace EnergyTileRegistry {
	/** Adds energy type for tile entity prototype */ 
	export function addEnergyType(Prototype: EnergyTile, energyType: EnergyType): void {
		if (!Prototype.isEnergyTile) {
			setupAsEnergyTile(Prototype);
		}
		Prototype.energyTypes[energyType.name] = energyType;
	}

	/** Same as addEnergyType, but works on already created prototypes, accessing them by id */ 
	export function addEnergyTypeForId(id: number, energyType: EnergyType): void {
		const Prototype = TileEntity.getPrototype(id);
		if (Prototype) {
			addEnergyType(Prototype as EnergyTile, energyType);
		}
		else {
			Logger.Log("cannot add energy type no prototype defined for id " + id, "ERROR");
		}
	}

	/**
	 * Adds default EnergyTile interface implementation for tile entity prototype.
	 * @param Prototype tile entity prototype
	 */
	export function setupAsEnergyTile(Prototype: EnergyTile): void {
		Prototype.isEnergyTile = true;

		Prototype.enableEnergyBuffer ??= true;

		Prototype.energyTypes = {};

		Prototype.energyTick ??= function() {};

		Prototype.energyReceive ??= function() {
			return 0;
		}

		// Returns true for reverse compatibility
		Prototype.canProduceEnergy ??= function() {
			return true;
		}

		Prototype.isConductor ??= function() {
			return false;
		}

		Prototype.canReceiveEnergy ??= function() {
			return true;
		}

		Prototype.canEmitEnergy ??= Prototype.canExtractEnergy || function() {
			return true;
		}
	}
};

Callback.addCallback("TileEntityAdded", function(tileEntity: EnergyTile) {
	if (tileEntity.isEnergyTile && typeof tileEntity.energyTypes == "object") {
		const node = EnergyTileNode.createFor(tileEntity, tileEntity.energyTypes);
		tileEntity.energyNode = node;
		EnergyNet.addEnergyNode(node);
	}
});

Callback.addCallback("TileEntityRemoved", function(tileEntity: EnergyTile) {
    if (tileEntity.energyNode) {
		tileEntity.energyNode.destroy();
	}
});
