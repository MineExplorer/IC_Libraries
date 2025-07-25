/// <reference path="NativeContainerInterface.ts" />
/// <reference path="TileEntityInterface.ts" />
/// <reference path="StorageInterfaceFactory.ts" />

namespace StorageInterface {
	type ContainersMap = {[key: number]: Container};
	type StoragesMap = {[key: number]: Storage};

	interface StorageInterfacePrototype extends StorageDescriptor {
		classType?: typeof TileEntityInterface
	}
	
	export const data: {[key: number]: StorageInterfacePrototype} = {};

	/** @returns TileEntity StorageInterface prototype by block id */
	export function getPrototype(id: number): StorageInterfacePrototype {
		return data[id];
	}

	/** Registers interface for block container */
	export function createInterface(id: number, descriptor: StorageDescriptor, classType = TileEntityInterface): void {
		const prototype: StorageInterfacePrototype = {...descriptor};
		if (descriptor.slots) {
			for (let name in descriptor.slots) {
				if (name.includes('^')) {
					const slotData = descriptor.slots[name];
					const str = name.split('^');
					const index = str[1].split('-');
					for (let i = parseInt(index[0]); i <= parseInt(index[1]); i++) {
						descriptor.slots[str[0] + i] = slotData;
					}
					delete descriptor.slots[name];
				}
			}
		}
		else {
			prototype.slots = {};
		}

		prototype.classType = classType;
		data[id] = prototype;
	}

	export var directionsBySide = [
		{x: 0, y: -1, z: 0}, // down
		{x: 0, y: 1, z: 0}, // up
		{x: 0, y: 0, z: -1}, // north
		{x: 0, y: 0, z: 1}, // south
		{x: -1, y: 0, z: 0}, // east
		{x: 1, y: 0, z: 0} // west
	];

	export function getRelativeCoords(coords: Vector, side: number): Vector {
		const dir = directionsBySide[side];
		return {x: coords.x + dir.x, y: coords.y + dir.y, z: coords.z + dir.z};
	}

	export function setSlotMaxStackPolicy(container: ItemContainer, slotName: string, maxCount: number): void {
		container.setSlotAddTransferPolicy(slotName, function(container, name, id, amount, data) {
			const maxStack = Math.min(maxCount, Item.getMaxStack(id, data));
			return Math.max(0, Math.min(amount, maxStack - container.getSlot(name).count));
		});
	}

	export function setSlotValidatePolicy(container: ItemContainer, slotName: string, func: (name: string, id: number, amount: number, data: number, extra: ItemExtraData, container: ItemContainer, playerUid: number) => boolean): void {
		container.setSlotAddTransferPolicy(slotName, function(container, name, id, amount, data, extra, playerUid) {
			amount = Math.min(amount, Item.getMaxStack(id, data) - container.getSlot(name).count);
			return func(name, id, amount, data, extra, container, playerUid) ? amount : 0;
		});
	}

	export function setGlobalValidatePolicy(container: ItemContainer, func: (name: string, id: number, amount: number, data: number, extra: ItemExtraData, container: ItemContainer, playerUid: number) => boolean): void {
		container.setGlobalAddTransferPolicy(function(container, name, id, amount, data, extra, playerUid) {
			amount = Math.min(amount, Item.getMaxStack(id, data) - container.getSlot(name).count);
			return func(name, id, amount, data, extra, container, playerUid) ? amount : 0;
		});
	}

	/** Creates new interface instance for TileEntity or Container */
	export function getInterface(storage: TileEntity | Container): Storage {
		if ("container" in storage) {
			return StorageInterfaceFactory.getTileEntityInterface(storage);
		}
		if ("getParent" in storage) {
			return StorageInterfaceFactory.getTileEntityInterface(storage.getParent());
		}
		return new NativeContainerInterface(storage);
	}

	/** Trasfers item to slot
	 * @count amount to transfer. Default is 64.
	 * @returns transfered amount
	 */
	export function addItemToSlot(item: ItemInstance, slot: ItemInstance, count: number = 64): number {
		if (slot.id == 0 || slot.id == item.id && slot.data == item.data) {
			const maxStack = Item.getMaxStack(item.id, item.data);
			let add = Math.min(item.count, maxStack - slot.count);
			if (count < add) add = count;
			if (add > 0) {
				slot.id = item.id;
				slot.data = item.data;
				if (item.extra) slot.extra = item.extra;
				slot.count += add;
				item.count -= add;
				if (item.count == 0) {
					item.id = item.data = 0;
					item.extra = null;
				}
				return add;
			}
		}
		return 0;
	}

	/** Returns storage interface for container in the world */
	export function getStorage(region: BlockSource, x: number, y: number, z: number): Nullable<Storage> {
		const nativeTileEntity = region.getBlockEntity(x, y, z);
		if (nativeTileEntity && nativeTileEntity.getSize() > 0) {
			return new NativeContainerInterface(nativeTileEntity);
		}
		const tileEntity = World.getTileEntity(x, y, z, region);
		if (tileEntity && tileEntity.container && tileEntity.__initialized) {
			return StorageInterfaceFactory.getTileEntityInterface(tileEntity);
		}
		return null;
	}

	/** Returns storage interface for TileEntity with liquid storage */
	export function getLiquidStorage(region: BlockSource, x: number, y: number, z: number): Nullable<TileEntityInterface> {
		const tileEntity = World.getTileEntity(x, y, z, region);
		if (tileEntity && tileEntity.__initialized) {
			return StorageInterfaceFactory.getTileEntityInterface(tileEntity);
		}
		return null;
	}

	/** Returns storage interface for neighbour container on specified side */
	export function getNeighbourStorage(region: BlockSource, coords: Vector, side: number): Nullable<Storage> {
		const dir = getRelativeCoords(coords, side);
		return getStorage(region, dir.x, dir.y, dir.z);
	}

	/** Returns storage interface for neighbour TileEntity with liquid storage on specified side */
	export function getNeighbourLiquidStorage(region: BlockSource, coords: Vector, side: number): Nullable<TileEntityInterface> {
		const dir = getRelativeCoords(coords, side);
		return getLiquidStorage(region, dir.x, dir.y, dir.z);
	}

	/**
	 * Returns object containing neigbour containers where keys are block side numbers
	 * @coords position from which check neighbour blocks
	*/
	export function getNearestContainers(coords: Vector, region: BlockSource): ContainersMap;
	export function getNearestContainers(coords: Vector, region: any): ContainersMap {
		let side = -1;
		if (typeof region == "number") { // reverse compatibility
			region = null;
			side = region;
		}
		const containers = {};
		for (let i = 0; i < 6; i++) {
			if (side >= 0 && i != side) continue;
			const dir = getRelativeCoords(coords, i);
			const container = World.getContainer(dir.x, dir.y, dir.z, region);
			if (container) {
				containers[i] = container;
			}
		}
		return containers;
	}

	/**
	 * Returns object containing neigbour liquid storages where keys are block side numbers
	 * @coords position from which check neighbour blocks
	*/
	export function getNearestLiquidStorages(coords: Vector, region: BlockSource): StoragesMap;
	export function getNearestLiquidStorages(coords: Vector, region: any): StoragesMap {
		let side = -1;
		if (typeof region == "number") { // reverse compatibility
			region = null;
			side = region;
		}
		const storages = {};
		for (let i = 0; i < 6; i++) {
			if (side >= 0 && side != i) continue;
			const storage = getNeighbourLiquidStorage(region, coords, i);
			if (storage) storages[i] = storage;
		}
		return storages;
	}

	/**
	 * Returns array of slot indexes for vanilla container or array of slot names for mod container
	*/
	export function getContainerSlots(container: Container): string[] | number[] {
		if ("slots" in container) {
			return Object.keys(container.slots);
		}
		else {
			const slots = [];
			const size = container.getSize();
			for (let i = 0; i < size; i++) {
				slots.push(i);
			}
			return slots;
		}
	}

	/** Puts items to containers */
	export function putItems(items: ItemInstance[], containers: ContainersMap): void {
		for (let i in items) {
			const item = items[i];
			for (let side in containers) {
				if (item.count == 0) break;
				const container = containers[side];
				putItemToContainer(item, container, parseInt(side) ^ 1);
			}
		}
	}

	/**
	 * @side block side of container which receives item
	 * @maxCount max count of item to transfer (optional)
	*/
	export function putItemToContainer(item: ItemInstance, container: TileEntity | Container, side?: number, maxCount?: number): number {
		const storage = getInterface(container);
		return storage.addItem(item, side, maxCount);
	}

	/**
	 * Extracts items from one container to another
	 * @inputContainer container to receive items
	 * @outputContainer container to extract items
	 * @inputSide block side of input container which is receiving items
	 * @maxCount max total count of extracted items (optional)
	 * @oneStack if true, will extract only 1 item
	*/
	export function extractItemsFromContainer(inputContainer: TileEntity | Container, outputContainer: TileEntity | Container, inputSide: number, maxCount?: number, oneStack?: boolean): number {
		const inputStorage = getInterface(inputContainer);
		const outputStorage = getInterface(outputContainer);
		return extractItemsFromStorage(inputStorage, outputStorage, inputSide, maxCount, oneStack);
	}

	/**
	 * Extracts items from one container to another
	 * @inputStorage container interface to receive items
	 * @outputStorage container interface to extract items
	 * @inputSide block side of input container which is receiving items
	 * @maxCount max total count of extracted items (optional)
	 * @oneStack if true, will extract only 1 item
	*/
	export function extractItemsFromStorage(inputStorage: Storage, outputStorage: Storage, inputSide: number, maxCount?: number, oneStack?: boolean): number {
		let count = 0;
		const slots = outputStorage.getOutputSlots(inputSide ^ 1);
		for (let name of slots) {
			const slot = outputStorage.getSlot(name);
			if (slot.id !== 0) {
				const added = inputStorage.addItem(slot, inputSide, maxCount - count);
				if (added > 0) {
					count += added;
					outputStorage.setSlot(name, slot.id, slot.count, slot.data, slot.extra);
					if (oneStack || count >= maxCount) {break;}
				}
			}
		}
		return count;
	}

	/**
	 * Extract liquid from one storage to another
	 * @liquid liquid to extract. If null, will extract liquid stored in output storage
	 * @maxAmount max amount of liquid that can be transfered
	 * @inputStorage storage to input liquid
	 * @outputStorage storage to extract liquid
	 * @inputSide block side of input storage which is receiving 
	 * @returns left liquid amount
	*/
	export function extractLiquid(liquid: Nullable<string>, maxAmount: number, inputStorage: TileEntity | Storage, outputStorage: Storage, inputSide: number): number {
		if (!(inputStorage instanceof TileEntityInterface)) { // reverse compatibility
			inputStorage = StorageInterfaceFactory.getTileEntityInterface(inputStorage as TileEntity);
		}
		const outputSide = inputSide ^ 1;
		const inputTank = inputStorage.getInputTank(inputSide);
		const outputTank = outputStorage.getOutputTank(outputSide);
		if (!inputTank || !outputTank) return 0;

		if (!liquid) liquid = outputTank.getLiquidStored();
		if (liquid && outputStorage.canTransportLiquid(liquid, outputSide) && inputStorage.canReceiveLiquid(liquid, inputSide) && !inputTank.isFull(liquid)) {
			let amount = Math.min(outputTank.getAmount(liquid) * outputStorage.liquidUnitRatio, maxAmount);
			amount = inputStorage.receiveLiquid(inputTank, liquid, amount);
			outputStorage.extractLiquid(outputTank, liquid, amount);
			return amount;
		}
		return 0;
	}

	/** Similar to StorageInterface.extractLiquid, but liquid must be specified */
	export function transportLiquid(liquid: string, maxAmount: number, outputStorage: TileEntity | Storage, inputStorage: Storage, outputSide: number): number {
		if (!(outputStorage instanceof TileEntityInterface)) { // reverse compatibility
			outputStorage = StorageInterfaceFactory.getTileEntityInterface(outputStorage as TileEntity);
		}
		const inputSide = outputSide ^ 1;
		const inputTank = inputStorage.getInputTank(inputSide);
		const outputTank = outputStorage.getOutputTank(outputSide);
		if (!inputTank || !outputTank) return 0;

		if (inputStorage.canReceiveLiquid(liquid, inputSide) && !inputTank.isFull(liquid)) {
			let amount = Math.min(outputTank.getAmount(liquid) * outputStorage.liquidUnitRatio, maxAmount);
			amount = inputStorage.receiveLiquid(inputTank, liquid, amount);
			outputStorage.extractLiquid(outputTank, liquid, amount);
			return amount;
		}
		return 0;
	}

	/**
	 * Every 8 ticks checks neigbour hoppers and transfers items.
	 * Use it in tick function of TileEntity
	*/
	export function checkHoppers(tile: TileEntity): void {
		if (World.getThreadTime()%8 > 0) return;
		const region = tile.blockSource;
		const storage = StorageInterface.getInterface(tile);

		// input
		for (let side = 1; side < 6; side++) {
			const dir = getRelativeCoords(tile, side);
			const block = region.getBlock(dir.x, dir.y, dir.z);
			if (block.id == 154 && block.data == side + Math.pow(-1, side)) {
				const hopper = StorageInterface.getStorage(region, dir.x, dir.y, dir.z);
				extractItemsFromStorage(storage, hopper, side, 1);
			}
		}

		// extract
		if (region.getBlockId(tile.x, tile.y - 1, tile.z) == 154) {
			const hopper = StorageInterface.getStorage(region, tile.x, tile.y - 1, tile.z);
			extractItemsFromStorage(hopper, storage, 0, 1);
		}
	}

	Callback.addCallback("TileEntityAdded", function(tileEntity: TileEntity, created: boolean) {
		if (created) { // fix of TileEntity access from ItemContainer
			tileEntity.container.setParent(tileEntity);
		}
	});
}

EXPORT("StorageInterface", StorageInterface);
