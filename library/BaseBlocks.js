LIBRARY({
	name: "BaseBlocks",
	version: 1,
	shared: false,
	api: "CoreEngine"
});

let BaseBlocks = {
	createSlab: function(stringID, variants, blockType, doubleSlabID) {
		let defineData = [];
		for (let i = 0; i < 8; i++) {
			if (i < variants.length) {
				defineData.push(variants[i]);
			} else {
				defineData.push({name: variants[0].name, texture: variants[0].texture, inCreative: false});
			}
		}
		for (let i = 0; i < variants.length; i++) {
			defineData.push({name: variants[i].name, texture: variants[i].texture, inCreative: false});
		}
		Block.createBlock(stringID, defineData, blockType);
		for (let i = 0; i < 8; i++) {
			Block.setShape(BlockID[stringID], 0, 0, 0, 1, 0.5, 1);
		}
		for (let i = 8; i < 16; i++) {
			Block.setShape(BlockID[stringID], 0, 0.5, 0, 1, 1, 1, i);
		}
		Block.registerDropFunction(stringID, function(coords, blockID, blockData, level) {
			if (level > 0) {
				return [[BlockID.basaltSlab, 1, blockData%8]];
			}
			return [];
		});
		this.addDropOnExplosion(stringID);

		Block.registerPlaceFunction(stringID, function(coords, item, block) {
			// make double slab
			if (block.id == item.id && block.data%8 == item.data && parseInt(block.data/8) == (coords.side+1)%2) {
				World.setBlock(coords.x, coords.y, coords.z, doubleSlabID, item.data);
				return;
			}
			let place = coords;
			if (!World.canTileBeReplaced(block.id, block.data)) {
				place = coords.relative;
				let tile = World.getBlock(place.x, place.y, place.z);
				if (!World.canTileBeReplaced(tile.id, tile.data)) {
					if (tile.id == item.id && tile.data%8 == item.data) {
						World.setBlock(place.x, place.y, place.z, doubleSlabID, item.data);
					}
					return;
				};
			}
			if (coords.vec.y - place.y < 0.5) {
				World.setBlock(place.x, place.y, place.z, item.id, item.data);
			}
			else {
				World.setBlock(place.x, place.y, place.z, item.id, item.data + 8);
			}
		});
	},

	createDoubleSlab: function(stringID, variants, blockType, slabID) {
		Block.createBlock(stringID, variants, blockType);
		Block.registerDropFunction(stringID, function(coords, blockID, blockData, level) {
			if (level > 0) {
				return [[slabID, 1, blockData], [slabID, 1, blockData]];
			}
			return [];
		});
		this.addDropOnExplosion(stringID);
	},

	addDropOnExplosion: function(blockID) {
		Block.registerPopResourcesFunctionForID(blockID, function(coords, block, f, i) {
			if (Math.random() < 0.25) {
				let dropFunc = Block.getDropFunction(block.id);
				let drop = dropFunc(coords, block.id, block.data, 127, {});
				for (let i in drop) {
					World.drop(coords.x + .5, coords.y + .5, coords.z + .5, drop[i][0], drop[i][1], drop[i][2]);
				}
			}
		});
	}
}

EXPORT("BaseBlocks", BaseBlocks);