const assert = require("node:assert/strict");
const { describe, test } = require("node:test");
const { loadEnergyNet } = require("./load-energy-net");

describe("EnergyRegistry", () => {
  test("creates and retrieves an energy type", () => {
    const { api } = loadEnergyNet();
    const registry = api.EnergyTypeRegistry;

    const energyType = registry.createEnergyType("test-energy", 2);

    assert.equal(energyType.name, "test-energy");
    assert.equal(energyType.value, 2);
    assert.equal(registry.getEnergyType("test-energy"), energyType);
    assert.equal(registry.getValueRatio("test-energy", "test-energy"), 1);
  });
});
