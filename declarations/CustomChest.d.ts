declare namespace CustomChest {
    function setChestRender(id: number): void;
    function createGuiSlotSet(count: number, inRow: number, slotSize: number): {};
    function createChestGui(title: string, count: number, inRow: number, slotSize: number): UI.StandardWindow;
}
declare class ChestTileEntity {
    constructor(guiScreen: UI.StandardWindow);
    useNetworkItemContainer: boolean;
    guiScreen: UI.StandardWindow;
    getScreenName(player: number, coords: any): string;
    getScreenByName(screenName: string): any;
    getGuiScreen(): any;
    clearContainer(): void;
    tick(): void;
}
