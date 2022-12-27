declare class LiquidTank {
    constructor(tileEntity: TileEntity, name: string, limit: number);
    tileEntity: TileEntity;
    limit: number;
    data: any;
    getLiquidStored(): string;
    getLimit(): number;
    getAmount(liquid?: string): number;
    setAmount(liquid: string, amount: number): void;
    getRelativeAmount(): number;
    addLiquid(liquid: string, amount: number): number;
    getLiquid(amount: number): number;
    getLiquid(liquid: string, amount: number): number;
    isFull(): boolean;
    isEmpty(): boolean;
    updateUiScale(scale: string, container?: any): void;
}
declare namespace LiquidLib {
    const itemData: {};
    function registerItem(liquid: string, emptyId: number, fullId: number, storage: number): void;
    function getItemLiquid(id: number, data: number): string;
    function getEmptyItem(id: number, data: number): {
        id: number;
        data: number;
        liquid: string;
        amount: number;
        storage: number;
    };
    function getFullItem(id: number, data: number, liquid: string): {
        id: number;
        data: number;
        amount: number;
        storage: number;
    };
}
