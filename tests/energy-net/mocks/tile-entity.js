function createTileEntity(capacity = 0) {
  let storedEnergy = 0;

  return {
    dimension: 0,
    data: {},
    isGenerator() {
      return false;
    },
    isConductor() {
      return false;
    },
    getFreeEnergyAmount() {
      return Math.max(0, capacity - storedEnergy);
    },
    energyReceive(_energyName, amount) {
      const accepted = Math.min(amount, this.getFreeEnergyAmount());
      storedEnergy += accepted;
      return accepted;
    },
    getStoredEnergy() {
      return storedEnergy;
    }
  };
}

module.exports = { createTileEntity };
