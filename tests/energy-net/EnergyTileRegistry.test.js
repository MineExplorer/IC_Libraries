const assert = require("node:assert/strict");
const { describe, test } = require("node:test");
const { loadEnergyNet } = require("./load-energy-net");
const { createTileEntity } = require("./mocks/tile-entity");

describe("EnergyTileRegistry", () => {
  test("creates and removes a tile node through Inner Core callbacks", () => {
    const { api, callbacks } = loadEnergyNet();
    const energyType = api.EnergyTypeRegistry.createEnergyType("test-energy", 1);
    const tileEntity = createTileEntity();
    tileEntity.isEnergyTile = true;
    tileEntity.energyTypes = { [energyType.name]: energyType };

    callbacks.TileEntityAdded(tileEntity);

    assert.equal(tileEntity.energyNode.baseEnergy, "test-energy");
    assert.equal(tileEntity.energyNode.kind, "tile");

    callbacks.TileEntityRemoved(tileEntity);

    assert.equal(tileEntity.energyNode.removed, true);
  });
});
