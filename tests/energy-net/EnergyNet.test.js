const assert = require("node:assert/strict");
const { describe, test } = require("node:test");
const { loadEnergyNet } = require("./load-energy-net");
const { createBlockSource } = require("./mocks/block-source");
const { createTileEntity } = require("./mocks/tile-entity");

function createTileEntityNode(api, energyType, onEnergyTick = () => {}) {
  const tileEntity = createTileEntity();
  tileEntity.__initialized = true;
  tileEntity.isLoaded = true;
  tileEntity.energyTick = onEnergyTick;

  const node = new api.EnergyTileNode(energyType, tileEntity);
  node.initialized = true;
  tileEntity.energyNode = node;

  return { node, tileEntity };
}

describe("EnergyNet", () => {
  test("registers tile nodes for network ticks", () => {
    const { api, callbacks } = loadEnergyNet();
    const energyType = api.EnergyTypeRegistry.createEnergyType("test-energy", 1);
    let tickCount = 0;
    const { node } = createTileEntityNode(api, energyType, () => tickCount++);

    api.EnergyNet.addEnergyNode(node);
    callbacks.tick();

    assert.equal(tickCount, 1);
  });

  test("registers grid nodes by dimension for coordinate lookup", () => {
    const { api } = loadEnergyNet();
    const energyType = api.EnergyTypeRegistry.createEnergyType("test-energy", 1);
    const region = createBlockSource(3);
    const otherRegion = createBlockSource(4);
    const grid = new api.EnergyGrid(energyType, 8, 42, region);
    grid.addCoords(2, 3, 4, { id: 42, data: 0 });

    api.EnergyNet.addEnergyNode(grid);
    const registeredNode = api.EnergyNet.getNodeOnCoords(region, 2, 3, 4);
    const otherDimensionNode = api.EnergyNet.getNodeOnCoords(otherRegion, 2, 3, 4);

    assert.strictEqual(registeredNode, grid);
    assert.equal(otherDimensionNode, null);
  });

  test("finds an initialized tile node at its coordinates", () => {
    const { api, context } = loadEnergyNet();
    const energyType = api.EnergyTypeRegistry.createEnergyType("test-energy", 1);
    const { node, tileEntity } = createTileEntityNode(api, energyType);
    tileEntity.x = 2;
    tileEntity.y = 3;
    tileEntity.z = 4;
    context.TileEntity.getTileEntity = (x, y, z) =>
      x === 2 && y === 3 && z === 4 ? tileEntity : null;

    const foundNode = api.EnergyNet.getNodeOnCoords(createBlockSource(), 2, 3, 4);

    assert.strictEqual(foundNode, node);
  });

  test("flushes destroyed tracked nodes and clears their connections", () => {
    const { api, callbacks } = loadEnergyNet();
    const energyType = api.EnergyTypeRegistry.createEnergyType("test-energy", 1);
    let tickCount = 0;
    const { node } = createTileEntityNode(api, energyType, () => tickCount++);
    const receiver = new api.EnergyTileNode(energyType, createTileEntity());
    node.addConnection(receiver);
    api.EnergyNet.addEnergyNode(node);

    node.destroy();
    api.EnergyNet.flushRemovals();
    callbacks.tick();

    assert.equal(node.receivers.length, 0);
    assert.equal(receiver.entries.length, 0);
    assert.equal(tickCount, 0);
  });
});
