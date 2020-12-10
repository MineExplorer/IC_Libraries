/// <reference path="./core-engine.d.ts" />

declare type Container = NativeTileEntity | UI.Container | ItemContainer;
interface StorageDescriptor {
    slots?: {
        [key: string]: SlotInterface;
    };
    isValidInput?(item: ItemInstance, side: number, tileEntity: TileEntity): boolean;
    addItem?(item: ItemInstance, side?: number, maxCount?: number): number;
    getOutputSlots?(side: number): string[] | number[];
    canReceiveLiquid?(liquid: string, side?: number): boolean;
    canTransportLiquid?(liquid: string, side?: number): boolean;
    addLiquid?(liquid: string, amount: number): number;
    getLiquid?(liquid: string, amount: number): number;
    getLiquidStored?(storageName: string): string;
    getLiquidStorage?(storageName: string): string;
}
interface Storage extends StorageDescriptor {
    isNativeContainer(): boolean;
    getSlot(name: string | number): ItemInstance;
    setSlot(name: string | number, id: number, count: number, data: number, extra?: ItemExtraData): void;
    addItem(item: ItemInstance, side: number, maxCount?: number): number;
    getOutputSlots(side: number): string[] | number[];
}
interface SlotInterface {
    input?: boolean;
    output?: boolean;
    side?: number | "horizontal" | "down" | "up";
    maxStack?: number;
    isValid?(item: ItemInstance, side: number, tileEntity: TileEntity): boolean;
    canOutput?(item: ItemInstance, side: number, tileEntity: TileEntity): boolean;
}
declare class NativeContainerInterface implements Storage {
    container: NativeTileEntity;
    constructor(container: NativeTileEntity);
    isNativeContainer(): boolean;
    getSlot(index: number): ItemInstance;
    setSlot(index: number, id: number, count: number, data: number, extra?: ItemExtraData): void;
    private isValidInputSlot;
    addItem(item: ItemInstance, side?: number, maxCount?: number): number;
    getOutputSlots(side: number): number[];
}
declare class TileEntityInterface implements Storage {
    slots?: {
        [key: string]: SlotInterface;
    };
    container: UI.Container | ItemContainer;
    tileEntity: TileEntity;
    liquidStorage: any;
    constructor(tileEntity: TileEntity);
    isNativeContainer(): boolean;
    getSlot(name: string): ItemInstance;
    setSlot(name: string, id: number, count: number, data: number, extra?: ItemExtraData): void;
    isValidInput(item: ItemInstance, side: number, tileEntity: TileEntity): boolean;
    checkSide(slotSideTag: string | number, side: number): boolean;
    addItem(item: ItemInstance, side?: number, maxCount?: number): number;
    getOutputSlots(side: number): string[];
    canReceiveLiquid(liquid: string, side?: number): boolean;
    canTransportLiquid(liquid: string, side?: number): boolean;
    addLiquid(liquid: string, amount: number): number;
    getLiquid(liquid: string, amount: number): number;
    getLiquidStored(storageName?: string): string;
    getLiquidStorage(storageName?: string): any;
}
declare namespace StorageInterface {
    type ContainersMap = {
        [key: number]: Container;
    };
    type StoragesMap = {
        [key: number]: Storage;
    };
    export var data: {
        [key: number]: StorageDescriptor;
    };
    export var directionsBySide: {
        x: number;
        y: number;
        z: number;
    }[];
    export function getRelativeCoords(coords: Vector, side: number): Vector;
    export function setSlotMaxStackPolicy(container: ItemContainer, slotName: string, maxCount: number): void;
    export function setSlotValidatePolicy(container: ItemContainer, slotName: string, func: (name: string, id: number, amount: number, data: number, extra: ItemExtraData, container: ItemContainer, playerUid: number) => boolean): void;
    export function setGlobalValidatePolicy(container: ItemContainer, func: (name: string, id: number, amount: number, data: number, extra: ItemExtraData, container: ItemContainer, playerUid: number) => boolean): void;
    export function newStorage(storage: TileEntity | Container): Storage;
    export function createInterface(id: number, descriptor: StorageDescriptor): void;
    /** Trasfers item to slot
     * @count amount to transfer. Default is 64.
     * @returns transfered amount
     */
    export function addItemToSlot(item: ItemInstance, slot: ItemInstance, count?: number): number;
    /** @returns Storage for container in the world */
    export function getStorage(region: BlockSource, x: number, y: number, z: number): Nullable<Storage>;
    /** @returns Storage for TileEntity in the world if it has liquid storage */
    export function getLiquidStorage(region: BlockSource, x: number, y: number, z: number): Nullable<TileEntityInterface>;
    /** @returns Storage for neighbour container on specified side */
    export function getNeighbourStorage(region: BlockSource, coords: Vector, side: number): Nullable<Storage>;
    /** @returns Storage for neighbour TileEntity on specified side if it has liquid storage */
    export function getNeighbourLiquidStorage(region: BlockSource, coords: Vector, side: number): Nullable<TileEntityInterface>;
    /**
     * @returns object containing neigbour containers where keys are block side numbers
     * @side side to get container, use -1 to get from all sides
    */
    export function getNearestContainers(coords: Vector, side: number, region: BlockSource): ContainersMap;
    /**
     * @returns object containing neigbour liquid storages where keys are block side numbers
     * @side side to get storage, use -1 to get from all sides
    */
    export function getNearestLiquidStorages(coords: Vector, side: number, region: BlockSource): StoragesMap;
    /**
     * @returns array of slot indexes for vanilla container or array of slot names for mod container
    */
    export function getContainerSlots(container: Container): string[] | number[];
    /** Puts items to containers */
    export function putItems(items: ItemInstance[], containers: ContainersMap): void;
    /**
     * @side block side of container which receives item
     * @maxCount max count of item to transfer (optional)
    */
    export function putItemToContainer(item: ItemInstance, container: TileEntity | Container, side?: number, maxCount?: number): number;
    /**
     * Extracts items from one container to another
     * @inputContainer container to receive items
     * @outputContainer container to extract items
     * @inputSide block side of input container which is receiving items
     * @maxCount max total count of extracted items (optional)
     * @oneStack if true, will extract only 1 item
    */
    export function extractItemsFromContainer(inputContainer: TileEntity | Container, outputContainer: TileEntity | Container, inputSide: number, maxCount?: number, oneStack?: boolean): number;
    /**
     * Extracts items from one container to another
     * @inputStorage container interface to receive items
     * @outputStorage container interface to extract items
     * @inputSide block side of input container which is receiving items
     * @maxCount max total count of extracted items (optional)
     * @oneStack if true, will extract only 1 item
    */
    export function extractItemsFromStorage(inputStorage: Storage, outputStorage: Storage, inputSide: number, maxCount?: number, oneStack?: boolean): number;
    /**
     * Extract liquid from one storage to another
     * @liquid liquid to extract. If null, will extract liquid stored in output storage
     * @maxAmount max amount of liquid that can be transfered
     * @inputStorage storage to input liquid
     * @outputStorage storage to extract liquid
     * @inputSide block side of input storage which is receiving liquid
    */
    export function extractLiquid(liquid: Nullable<string>, maxAmount: number, inputStorage: TileEntity | Storage, outputStorage: Storage, inputSide: number): number;
    /** Similar to StorageInterface.extractLiquid, but liquid must be specified */
    export function transportLiquid(liquid: string, maxAmount: number, outputStorage: TileEntity | Storage, inputStorage: Storage, outputSide: number): number;
    /**
     * Every 8 ticks checks neigbour hoppers and transfers items.
     * Use it in tick function of TileEntity
    */
    export function checkHoppers(tile: TileEntity): void;
    export {};
}
