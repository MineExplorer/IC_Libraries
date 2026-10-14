const assert = require("node:assert/strict");
const { describe, test } = require("node:test");
const { loadEnergyNet } = require("./load-energy-net");
const { createTileEntity } = require("./mocks/tile-entity");

function createNode(api, energyType, capacity = 0) {
  return new api.EnergyTileNode(energyType, createTileEntity(capacity));
}

function makeTickable(node) {
  node.initialized = true;
  node.tileEntity.__initialized = true;
  node.tileEntity.isLoaded = true;
  node.tileEntity.energyTick = () => {};
}

describe("EnergyNode", () => {
  test("transfers energy up to the receiver's available capacity", () => {
    const { api } = loadEnergyNet();
    const energyType = api.EnergyTypeRegistry.createEnergyType("test-energy", 1);
    const source = createNode(api, energyType);
    const receiverTile = createTileEntity(6);
    const receiver = new api.EnergyTileNode(energyType, receiverTile);

    source.addConnection(receiver);

    assert.equal(source.add(10), 4);
    assert.equal(receiverTile.getStoredEnergy(), 6);
  });

  test("adds and removes connections symmetrically", () => {
    const { api } = loadEnergyNet();
    const energyType = api.EnergyTypeRegistry.createEnergyType("test-energy", 1);
    const source = createNode(api, energyType);
    const receiver = createNode(api, energyType);

    assert.equal(source.addConnection(receiver), true);
    assert.equal(source.addConnection(receiver), false);
    assert.strictEqual(source.receivers[0], receiver);
    assert.strictEqual(receiver.entries[0], source);

    assert.equal(source.removeConnection(receiver), true);
    assert.equal(source.removeConnection(receiver), false);
    assert.equal(source.receivers.length, 0);
    assert.equal(receiver.entries.length, 0);
  });

  test("resets incoming and outgoing connections", () => {
    const { api } = loadEnergyNet();
    const energyType = api.EnergyTypeRegistry.createEnergyType("test-energy", 1);
    const incoming = createNode(api, energyType);
    const node = createNode(api, energyType);
    const outgoing = createNode(api, energyType);

    incoming.addConnection(node);
    node.addConnection(outgoing);
    node.resetConnections();

    assert.equal(node.entries.length, 0);
    assert.equal(node.receivers.length, 0);
    assert.equal(incoming.receivers.length, 0);
    assert.equal(outgoing.entries.length, 0);
  });

  test("checks compatibility against registered energy types", () => {
    const { api } = loadEnergyNet();
    const registry = api.EnergyTypeRegistry;
    const firstType = registry.createEnergyType("first-energy", 1);
    const secondType = registry.createEnergyType("second-energy", 1);
    const firstNode = createNode(api, firstType);
    const secondNode = createNode(api, secondType);

    assert.equal(firstNode.isCompatible(secondNode), false);

    firstNode.addEnergyType(secondType);

    assert.equal(firstNode.isCompatible(secondNode), true);
  });

  test("moves current transfer counters into the previous tick", () => {
    const { api } = loadEnergyNet();
    const energyType = api.EnergyTypeRegistry.createEnergyType("test-energy", 1);
    const source = createNode(api, energyType);
    const receiver = createNode(api, energyType, 10);
    source.addConnection(receiver);

    assert.equal(source.add(5), 0);
    makeTickable(source);
    makeTickable(receiver);
    source.tick();
    receiver.tick();

    assert.equal(source.energyOut, 5);
    assert.equal(source.energyPower, 5);
    assert.equal(receiver.energyIn, 5);
    assert.equal(source.currentOut, 0);
    assert.equal(source.currentPower, 0);
    assert.equal(receiver.currentIn, 0);
  });

  test("marks a destroyed node as removed", () => {
    const { api } = loadEnergyNet();
    const energyType = api.EnergyTypeRegistry.createEnergyType("test-energy", 1);
    const node = createNode(api, energyType);

    node.destroy();

    assert.equal(node.removed, true);
  });
});
