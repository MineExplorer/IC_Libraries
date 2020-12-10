namespace EnergyNetBuilder {
	export let energyNets = [];

	export function addEnergyNet(net: EnergyNet): void {
		energyNets.push(net);
	}

	export function removeNet(net: EnergyNet): void {
		for(let node of net.energyNodes) {
			delete node.connectedNets[net.netId];
		};
		
		for (let i in net.connectedNets) {
			net.connectedNets[i].removeConnection(net);
		}
		net.removed = true;
		for (let i = 0; i < energyNets.length; i++) {
			if (energyNets[i] == net) {
				energyNets.splice(i, 1);
				break;
			}
		}
	}

	export function removeNetOnCoords(x: number, y: number, z: number): void {
		let net = getNetOnCoords(x, y, z);
		if (net) {
			removeNet(net);
		}
	}

	export function removeNetByBlock(x: number, y: number, z: number, wireId: number): void {
		if (World.getBlockID(x, y, z) == wireId) {
			EnergyNetBuilder.removeNetOnCoords(x, y, z);
		}
	}

	export function getNetOnCoords(x: number, y: number, z: number): EnergyNet {
		for (let i in energyNets) {
			let net = energyNets[i];
			let key = x + ":" + y + ":" + z;
			if (net.wireMap[key]) return net;
		}
		return null;
	}
	
	export function getNetByBlock(x: number, y: number, z: number, wireId: number): EnergyNet {
		if (World.getBlockID(x, y, z) == wireId) {
			return getNetOnCoords(x, y, z);
		}
		return null;
	}

	export function connectNets(net1: EnergyNet, net2: EnergyNet): void {
		net1.addConnection(net2);
		net2.addConnection(net1);
	}
	
	export function mergeNets(net1: EnergyNet, net2: EnergyNet): void {
		for (let key in net2.wireMap) {
			net1.wireMap[key] = true;
		}
		for (let node of net2.energyNodes) {
			if (node.getEnergyNet(net1.energyName)) {
				node.setEnergyNet(net1.energyName, net1);
			}
			net1.addEnergyNode(node);

		}
		for (let i in net2.connectedNets) {
			let otherNet = net2.connectedNets[i];
			connectNets(net1, otherNet);
		}
		removeNet(net2);
	}
	
	export function buildForTile(tile: EnergyTile, type: EnergyType): EnergyNet {
		let net = new EnergyNet(type);
		net.canSpreadEnergy = tile.canConductEnergy(type.name);
		addEnergyNet(net);
		buildTileNetReqursive(tile, net);
		return net;
	}
	
	export function buildTileNet(net: EnergyNet, x: number, y: number, z: number, side: number): void {
		let type = net.energyName;
		let tile = TileEntityRegistry.accessMachineAtCoords(x, y, z);
		if (tile && tile.__energyTypes[type]) {
			if (tile.canReceiveEnergy(side, type) || tile.canConductEnergy(type, side)) {
				net.addEnergyNode(tile.energyNode);
			}
			if (tile.canConductEnergy(type, side)) {
				let node = tile.energyNode;
				let tileNet = node.getEnergyNet(type);
				if (!tileNet || tileNet.removed) {
					node.setEnergyNet(type, net);
				}
				else if (tileNet != net) {
					mergeNets(net, tileNet);
					node.setEnergyNet(type, net);
					buildTileNetReqursive(tile, net);
				}
			}
		}
		else {
			let wireNet = getNetOnCoords(x, y, z);
			if (wireNet) {
				if (wireNet.energyName == type) {
					connectNets(net, wireNet);
				}
			}
			else {
				let blockID = World.getBlockID(x, y, z);
				if (EnergyRegistry.isWire(blockID, type)) {
					let wireNet = buildForWire(x, y, z, blockID);
					connectNets(net, wireNet);
				}
			}
		}
	}
	
	export function buildTileNetReqursive(tile: EnergyTile, net: EnergyNet) {
		for (let side = 0; side < 6; side++) {
			if (tile.canExtractEnergy(side, net.energyName)) {
				let c = getRelativeCoords(tile.x, tile.y, tile.z, side);
				buildTileNet(net, c.x, c.y, c.z, side ^ 1);
			}
		}
	}
	
	export function buildForWire(x: number, y: number, z: number, id: number): EnergyNet {
		let wireData = EnergyRegistry.getWireData(id);
		if (!wireData) return null;
		let type = EnergyRegistry.getEnergyType(wireData.type);
		let net = new EnergyNet(type, wireData.value, wireData.onOverload);
		net.wireId = id;
		addEnergyNet(net);
		rebuildRecursive(net, id, x, y, z);
		return net;
	}

	export function rebuildForWire(x: number, y: number, z: number, id: number): EnergyNet {
		let blockID = World.getBlockID(x, y, z);
		if (blockID == id && !EnergyNetBuilder.getNetOnCoords(x, y, z)) {
			return buildForWire(x, y, z, blockID);
		}
		return null;
	}
	
	export function rebuildRecursive(net: EnergyNet, wireId: number, x: number, y: number, z: number, side?: number): void {
		if (net.removed) return;
		
		let coordKey = x + ":" + y + ":" + z;
		if (net.wireMap[coordKey]) {
			return;
		}
		
		let type = net.energyName;
		let tileEntity = TileEntityRegistry.accessMachineAtCoords(x, y, z);
		if (tileEntity && tileEntity.__energyTypes[type]) {
			if (tileEntity.canExtractEnergy(side, type) || tileEntity.canConductEnergy(type, side)) {
				let tileNet = tileEntity.energyNode.getEnergyNet(type);
				if (tileNet) {
					connectNets(net, tileNet);
				}
			}
			if (tileEntity.canReceiveEnergy(side, type) && !tileEntity.canConductEnergy(type)) {
				net.addEnergyNode(tileEntity.energyNode);
			}
		}
		else {
			let otherNet = getNetOnCoords(x, y, z);
			if (otherNet == net) return;
			
			let block = World.getBlock(x, y, z);
			if (wireId == block.id) {
				if (otherNet) {
					mergeNets(net, otherNet);
				}
				else {
					net.wireMap[coordKey] = true;
					rebuildFor6Sides(net, block, x, y, z);
				}
			}
			else if (otherNet) {
				if (otherNet.energyName == type) {
					connectNets(net, otherNet);
				}
			}
			else if (EnergyRegistry.isWire(block.id, type)) {
				buildForWire(x, y, z, block.id);
			}
		}
	}

	export function rebuildFor6Sides(net: EnergyNet, wireBlock: Tile, x: number, y: number, z: number): void {
		let wireData = EnergyRegistry.getWireData(wireBlock.id);
		let coord1 = {x: x, y: y, z: z};
		for (let side = 0; side < 6; side++) {
			let coord2 = getRelativeCoords(x, y, z, side);
			if (wireData.canConnect(wireBlock, coord1, coord2, side)) {
				rebuildRecursive(net, wireBlock.id, coord2.x, coord2.y, coord2.z, side ^ 1);
			}
		}
	}
	
	export function rebuildTileNet(tile: EnergyTile): void {
		let node = tile.energyNode;
		let nets = node.energyNets;
		for (let i in nets) {
			EnergyNetBuilder.removeNet(nets[i]);
			delete nets[i];
		}
		
		for (let i in node.connectedNets) {
			node.connectedNets[i].removeEnergyNode(this);
		}
		EnergyNetBuilder.rebuildTileConnections(tile.x, tile.y, tile.z, tile);
	}
	
	export function rebuildTileConnections(x: number, y: number, z: number, tile: EnergyTile): void {
		for (let name in tile.__energyTypes) {
			for (let side = 0; side < 6; side++) {
				if (tile.canReceiveEnergy(side, name)) {
					let c = getRelativeCoords(x, y, z, side);
					let tileSource = TileEntityRegistry.accessMachineAtCoords(c.x, c.y, c.z);
					if (tileSource && tileSource.__energyTypes[name]) {
						if (tileSource.canExtractEnergy(side ^ 1, name)) {
							tileSource.energyNode.getEnergyNet(name).addEnergyNode(tile.energyNode);
						}
					}
					else {
						let net = getNetOnCoords(c.x, c.y, c.z);
						if (net && net.energyName == name) {
							net.addEnergyNode(tile.energyNode);
						}
					}
				}
			}
		}
	}

	export function tickEnergyNets(): void {
		for (let i in energyNets) {
			energyNets[i].tick();
		}
	}
	
	export function getRelativeCoords(x: number, y: number, z: number, side: number): Vector {
		let directions = [
			{x: 0, y: -1, z: 0}, // down
			{x: 0, y: 1, z: 0}, // up
			{x: 0, y: 0, z: -1}, // east
			{x: 0, y: 0, z: 1}, // west
			{x: -1, y: 0, z: 0}, // south
			{x: 1, y: 0, z: 0} // north
		]
		let dir = directions[side];
		return {x: x + dir.x, y: y + dir.y, z: z + dir.z};
	}
}

Callback.addCallback("LevelLoaded", function() {
    EnergyNetBuilder.energyNets = [];
});

Callback.addCallback("tick", function() {
    EnergyNetBuilder.tickEnergyNets();
});
