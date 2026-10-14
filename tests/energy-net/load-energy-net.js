const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createInnerCoreMock } = require("./mocks/inner-core");

const bundlePath = path.resolve(
  __dirname,
  "../../build/Energy-Net/energy-net.js"
);

function loadEnergyNet() {
  const innerCore = createInnerCoreMock();

  vm.runInNewContext(readFileSync(bundlePath, "utf8"), innerCore.context, {
    filename: bundlePath
  });

  return innerCore;
}

module.exports = { loadEnergyNet };
