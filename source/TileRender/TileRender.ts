LIBRARY({
	name: "TileRender",
	version: 21,
	shared: true,
	api: "CoreEngine"
});

namespace TileRenderer {
	export type BoxVertexes = [number, number, number, number, number, number];

	const EntityGetYaw = ModAPI.requireGlobal("Entity.getYaw");
	const EntityGetPitch = ModAPI.requireGlobal("Entity.getPitch");

	export const modelData = {};

	export function createBlockModel(id: string | number, data: number, boxes: BoxVertexes[]): ICRender.Model;
	export function createBlockModel(id: any, data: number, boxes: BoxVertexes[]): ICRender.Model {
		const render = new ICRender.Model();
		const model = BlockRenderer.createModel();
		for (let box of boxes) {
			model.addBox(box[0], box[1], box[2], box[3], box[4], box[5], id, data);
		}
		render.addEntry(model);
		return render;
	}

	export function setStaticModel(id: number, data: number, boxes: BoxVertexes[]): void {
		const model = createBlockModel(id, data, boxes);
		BlockRenderer.setStaticICRender(id, data, model);
	}

	export function getRotatedBoxVertexes(box: BoxVertexes, rotation: number): BoxVertexes {
		switch (rotation) {
		case 0:
			return box;
		case 1:
			return [1 - box[3], box[1], 1 - box[5], 1 - box[0], box[4], 1 - box[2]]; // rotate 180°
		case 2:
			return [box[2], box[1], 1 - box[3], box[5], box[4], 1 - box[0]]; // rotate 270°
		case 3:
			return [1 - box[5], box[1], box[0], 1 - box[2], box[4], box[3]] // rotate 90°
		}
	}

	export function setStaticModelWithRotation(id: number, boxes: BoxVertexes[]): void {
		for (let data = 0; data < 4; data++) {
			const newBoxes = [];
			for (let box of boxes) {
				newBoxes.push(getRotatedBoxVertexes(box, data));
			}
			setStaticModel(id, data, newBoxes);
		}
	}

	export function setCollisionShape(id: number, data: number, boxes: BoxVertexes[], setRaycastShape: boolean = true): void {
		const shape = new ICRender.CollisionShape();
		for (let i in boxes) {
			var box = boxes[i];
			shape.addEntry().addBox(box[0], box[1], box[2], box[3], box[4], box[5]);
		}
		BlockRenderer.setCustomCollisionShape(id, data, shape);
		if (setRaycastShape) BlockRenderer.setCustomRaycastShape(id, data, shape);
	}

	export function setShapeWithRotation(id: number, data: number, boxes: TileRenderer.BoxVertexes[]): void {
		for (let i = 0; i < 4; i++) {
			const newBoxes = [];
			for (let box of boxes) {
				newBoxes.push(TileRenderer.getRotatedBoxVertexes(box, i));
			}
			TileRenderer.setStaticModel(id, data + i, newBoxes);
			TileRenderer.setCollisionShape(id, data + i, newBoxes);
		}
	}

	export function setEmptyCollisionShape(id: number): void {
		const shape = new ICRender.CollisionShape();
		shape.addEntry().addBox(1, 1, 1, 0, 0, 0);
		BlockRenderer.setCustomCollisionShape(id, -1, shape);
	}

	export function setStandardModel(id: number, data: number, texture: BlockRenderer.ModelTextureSet): void {
		const render = new ICRender.Model();
		const model = BlockRenderer.createTexturedBlock(texture);
		render.addEntry(model);
		BlockRenderer.enableCoordMapping(id, data, render);
	}

	export function setStandardModelWithRotation(id: number, data: number, texture: BlockRenderer.ModelTextureSet, hasVertical?: boolean): void {
		const variations = [
			[texture[3], texture[2], texture[0], texture[1], texture[4], texture[5]],
			[texture[2], texture[3], texture[1], texture[0], texture[5], texture[4]],
			[texture[0], texture[1], texture[3], texture[2], texture[5], texture[4]],
			[texture[0], texture[1], texture[2], texture[3], texture[4], texture[5]],
			[texture[0], texture[1], texture[4], texture[5], texture[3], texture[2]],
			[texture[0], texture[1], texture[5], texture[4], texture[2], texture[3]],
		]
		const startIndex = hasVertical ? 0 : 2;
		for (let i = startIndex; i < 6; i++) {
			setStandardModel(id, data + i - startIndex, variations[i]);
		}
		if (hasVertical) {
			setHandAndUiModel(id, data, variations[3]);
		}
	}

	/** @deprecated use setStandardModel instead*/
	export function setStandartModel(id: number, texture: BlockRenderer.ModelTextureSet, data: number = 0): void {
		setStandardModel(id, data, texture)
	}

	export function setHandAndUiModel(id: number, data: number, texture: BlockRenderer.ModelTextureSet): void {
		const render = new ICRender.Model();
		const model = BlockRenderer.createTexturedBlock(texture);
		render.addEntry(model);
		ItemModel.getFor(id, data).setHandModel(model);
		ItemModel.getFor(id, data).setUiModel(model);
	}

	export function registerRenderModel(id: number, data: number, texture: BlockRenderer.ModelTextureSet): void {
		const render = new ICRender.Model();
		const model = BlockRenderer.createTexturedBlock(texture);
		render.addEntry(model);
		modelData[id] ??= {};
		modelData[id][data] = render;
	}

	export function registerModelWithRotation(id: number, data: number, texture: BlockRenderer.ModelTextureSet, hasVertical?: boolean): void {
		const variations = [
			[texture[3], texture[2], texture[0], texture[1], texture[4], texture[5]],
			[texture[2], texture[3], texture[1], texture[0], texture[5], texture[4]],
			[texture[0], texture[1], texture[3], texture[2], texture[5], texture[4]],
			[texture[0], texture[1], texture[2], texture[3], texture[4], texture[5]],
			[texture[0], texture[1], texture[4], texture[5], texture[3], texture[2]],
			[texture[0], texture[1], texture[5], texture[4], texture[2], texture[3]]
		]
		const startIndex = hasVertical ? 0 : 2;
		for (let i = startIndex; i < 6; i++) {
			registerRenderModel(id, data + i - startIndex, variations[i]);
		}
	}

	/** @deprecated use registerModelWithRotation instead*/
	export function registerRotationModel(id: number, data: number, texture: BlockRenderer.ModelTextureSet): void {
		registerModelWithRotation(id, data, texture);
	}

	/** @deprecated use registerModelWithRotation instead*/
	export function registerFullRotationModel(id: number, data: number, texture: BlockRenderer.ModelTextureSet): void {
		if (texture.length == 2) {
			for (let i = 0; i < 6; i++) {
				const textures = [];
				for (let j = 0; j < 6; j++) {
					if (j == i) textures.push(texture[1]);
					else textures.push(texture[0]);
				}
				registerRenderModel(id, i + data, textures);
			}
		} else {
			registerModelWithRotation(id, data, texture, true);
		}
	}

	export function getRenderModel(id: number, data: string | number): Nullable<ICRender.Model> {
		const models = modelData[id];
		if (models) {
			return models[data];
		}
		return null;
	}

	/** Client-side only */
	export function mapAtCoords(x: number, y: number, z: number, id: number, data: string | number) {
		const model = getRenderModel(id, data);
		if (model) {
			BlockRenderer.mapAtCoords(x, y, z, model);
		}
	}

	export function getBlockRotation(player: number, hasVertical?: boolean): number {
		const pitch = EntityGetPitch(player);
		if (hasVertical) {
			if (pitch < -45) return 0;
			if (pitch > 45) return 1;
		}
		let rotation = Math.floor((EntityGetYaw(player) - 45)%360 / 90);
		if (rotation < 0) rotation += 4;
		rotation = [5, 3, 4, 2][rotation];
		return rotation;
	}

	export function setRotationFunction(id: string | number, hasVertical?: boolean, placeSound?: string): void {
		Block.registerPlaceFunction(id, function(coords, item, block, player, region) {
			const place = World.canTileBeReplaced(block.id, block.data) ? coords : coords.relative;
			const rotation = TileRenderer.getBlockRotation(player, hasVertical);
			region.setBlock(place.x, place.y, place.z, item.id, rotation);
			World.playSound(place.x, place.y, place.z, placeSound || "dig.stone", 1, 0.8);
			return place;
		});
	}

	/** @deprecated */
	export function setRotationPlaceFunction(id: string | number, hasVertical?: boolean, placeSound?: string): void {
		Block.registerPlaceFunction(id, function(coords, item, block, player, region) {
			const place = World.canTileBeReplaced(block.id, block.data) ? coords : coords.relative;
			region.setBlock(place.x, place.y, place.z, item.id, 0);
			World.playSound(place.x, place.y, place.z, placeSound || "dig.stone", 1, 0.8)
			let rotation = TileRenderer.getBlockRotation(player, hasVertical);
			if (!hasVertical) rotation -= 2;
			const tile = World.addTileEntity(place.x, place.y, place.z, region);
			tile.data.meta = rotation;
			TileRenderer.mapAtCoords(place.x, place.y, place.z, item.id, rotation);
			return place;
		});
	}

	export function setupWireModel(id: number, data: number, width: number, groupName: string, preventSelfAdd?: boolean): void {
		const render = new ICRender.Model();
		const shape = new ICRender.CollisionShape();

		const group = ICRender.getGroup(groupName);
		if (!preventSelfAdd) {
			group.add(id, data);
		}

		// connections
		width /= 2;
		const boxes = [
			{side: [1, 0, 0], box: [0.5 + width, 0.5 - width, 0.5 - width, 1, 0.5 + width, 0.5 + width]},
			{side: [-1, 0, 0], box: [0, 0.5 - width, 0.5 - width, 0.5 - width, 0.5 + width, 0.5 + width]},
			{side: [0, 1, 0], box: [0.5 - width, 0.5 + width, 0.5 - width, 0.5 + width, 1, 0.5 + width]},
			{side: [0, -1, 0], box: [0.5 - width, 0, 0.5 - width, 0.5 + width, 0.5 - width, 0.5 + width]},
			{side: [0, 0, 1], box: [0.5 - width, 0.5 - width, 0.5 + width, 0.5 + width, 0.5 + width, 1]},
			{side: [0, 0, -1], box: [0.5 - width, 0.5 - width, 0, 0.5 + width, 0.5 + width, 0.5 - width]}
		]

		for (let box of boxes) {
			// render
			const model = BlockRenderer.createModel();
			model.addBox(box.box[0], box.box[1], box.box[2], box.box[3], box.box[4], box.box[5], id, data);
			const condition = ICRender.BLOCK(box.side[0], box.side[1], box.side[2], group, false);
			render.addEntry(model).setCondition(condition);
			// collision shape
			const entry = shape.addEntry();
			entry.addBox(box.box[0], box.box[1], box.box[2], box.box[3], box.box[4], box.box[5]);
			entry.setCondition(condition);
		}

		// central box
		const model = BlockRenderer.createModel();
		model.addBox(0.5 - width, 0.5 - width, 0.5 - width, 0.5 + width, 0.5 + width, 0.5 + width, id, data);
		render.addEntry(model);

		const entry = shape.addEntry();
		entry.addBox(0.5 - width, 0.5 - width, 0.5 - width, 0.5 + width, 0.5 + width, 0.5 + width);

		BlockRenderer.setStaticICRender(id, data, render);
		BlockRenderer.setCustomCollisionShape(id, data, shape);
		BlockRenderer.setCustomRaycastShape(id, data, shape);
	}

	export function getCropModel(texture: [string, number]): ICRender.Model;
	export function getCropModel(block: [number, number]): ICRender.Model;
	export function getCropModel(texture: [any, number]): ICRender.Model {
        return createBlockModel(texture[0], texture[1], [
			[0.25, 0, 0, 0.25, 1, 1],
			[0.75, 0, 0, 0.75, 1, 1],
			[0, 0, 0.25, 1, 1, 0.25],
			[0, 0, 0.75, 1, 1, 0.75]
		]);
    }

	/** @deprecated use render types instead */
	export function setCropModel(id: number, data: number, height?: number){
		if (height) {
			Block.setShape(id, 0, 0, 0, 1, height, 1, data);
		}
		var shape = new ICRender.CollisionShape();
		shape.addEntry().addBox(1, 1, 1, 0, 0, 0);
		BlockRenderer.setCustomCollisionShape(id, data, shape);
		var render = getCropModel([id, data]);
		BlockRenderer.setStaticICRender(id, data, render);
	}

	const __plantVertex = [
		[0.15, 0, 0.15, 1, 1],
		[0.85, 0, 0.85, 0, 1],
		[0.85, 1, 0.85, 0, 0],
		[0.15, 0, 0.15, 1, 1],
		[0.15, 1, 0.15, 1, 0],
		[0.85, 1, 0.85, 0, 0],
		[0.15, 0, 0.85, 1, 1],
		[0.85, 0, 0.15, 0, 1],
		[0.85, 1, 0.15, 0, 0],
		[0.15, 0, 0.85, 1, 1],
		[0.15, 1, 0.85, 1, 0],
		[0.85, 1, 0.15, 0, 0]
	];

	/** @deprecated use render types instead */
	export function setPlantModel(id: number, data: number, texture: string, meta: number = 0){
		const shape = new ICRender.CollisionShape();
		shape.addEntry().addBox(7/8, 1, 7/8, 1/8, 0, 1/8);
		BlockRenderer.setCustomCollisionShape(id, data, shape);
		const render = new ICRender.Model();
		const mesh = new RenderMesh();
		mesh.setBlockTexture(texture, meta);
		for (let i = 0; i < 12; i++) {
			const poly = __plantVertex[i];
			mesh.addVertex(poly[0], poly[1], poly[2], poly[3], poly[4]);
		}
		for (let i = 11; i >= 0; i--) {
			const poly = __plantVertex[i];
			mesh.addVertex(poly[0], poly[1], poly[2], poly[3], poly[4]);
		}
		render.addEntry(mesh);
		BlockRenderer.setStaticICRender(id, data, render);
	}

	/** @deprecated not supported */
	export function setSlabShape() {}
	/** @deprecated not supported */
	export function setSlabPlaceFunction() {}
}

EXPORT("TileRenderer", TileRenderer);