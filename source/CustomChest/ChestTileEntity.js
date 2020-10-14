class ChestTileEntity {
	useNetworkItemContainer = true;

	constructor(guiScreen) {
		this.guiScreen = guiScreen;
	}

	getScreenName(player, coords) {
		return "main";
	}
	
	getScreenByName(screenName) {
		return this.guiScreen;
	}

	getGuiScreen() { // reverse compatibility
		return this.guiScreen;
	}

	clearContainer() {
		for (let name in this.container.slots) {
			this.container.clearSlot(name);
		}
	}

	tick() {
		// TODO: check hoppers
	}
}