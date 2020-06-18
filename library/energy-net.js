/*
  _____                                           __   _          _
 | ____|  _ __     ___   _ __    __ _   _   _    |  \ | |   ___  | |_
 |  _|   | '_ \   / _ \ | '__|  / _` | | | | |   | \ \| |  / _ \ | __|
 | |___  | | | | |  __/ | |    | (_| | | |_| |   | |\ | | |  __/ | |_
 |_____| |_| |_|  \___| |_|     \__, |  \__, |   |_| \__|  \___|  \__|
                                |___/   |___/
*/
LIBRARY({
    name: "EnergyNet",
    version: 6,
    shared: true,
    api: "CoreEngine"
});
Translation.addTranslation("Energy", { ru: "Энергия", zh: "能量" });
var EnergyRegistry = {
    energyTypes: {},
    /**
     * name - name of this energy type
     * value - value of one unit in [Eu] (Industrial Energy)
    */
    createEnergyType: function (name, value, wireParams) {
        if (this.energyTypes[name]) {
            alert("WARNING: duplicate energy types for name: " + name + "!");
            Logger.Log("duplicate energy types for name: " + name + "!", "ERROR");
        }
        var energyType = new EnergyType(name);
        energyType.value = value || 1;
        this.energyTypes[name] = energyType;
        return energyType;
    },
    assureEnergyType: function (name, value, wireParams) {
        if (this.getEnergyType(name)) {
            return this.getEnergyType(name);
        }
        else {
            return this.createEnergyType(name, value, wireParams);
        }
    },
    getEnergyType: function (name) {
        return this.energyTypes[name];
    },
    getValueRatio: function (name1, name2) {
        var type1 = this.getEnergyType(name1);
        var type2 = this.getEnergyType(name2);
        if (type1 && type2) {
            return type1.value / type2.value;
        }
        else {
            Logger.Log("get energy value ratio failed: some of this 2 energy types is not defiled: " + [name1, name2], "ERROR");
            return -1;
        }
    },
    wireData: {},
    getWireData: function (id) {
        return this.wireData[id];
    },
    isWire: function (id, type) {
        var wireData = this.getWireData(id);
        if (wireData) {
            if (!type || wireData.type == type)
                return true;
        }
        return false;
    },
    onWirePlaced: function (x, y, z) {
        var block = World.getBlock(x, y, z);
        var wireData = this.getWireData(block.id);
        var coord1 = { x: x, y: y, z: z };
        for (var side = 0; side < 6; side++) {
            var coord2 = EnergyNetBuilder.getRelativeCoords(x, y, z, side);
            var net = EnergyNetBuilder.getNetByBlock(coord2.x, coord2.y, coord2.z, block.id);
            if (net && wireData.canConnect(block, coord1, coord2, side)) {
                EnergyNetBuilder.rebuildRecursive(net, block.id, x, y, z);
                return;
            }
        }
        EnergyNetBuilder.buildForWire(x, y, z, block.id);
    },
    onWireDestroyed: function (x, y, z, id) {
        var net = EnergyNetBuilder.getNetOnCoords(x, y, z);
        if (net) {
            EnergyNetBuilder.removeNet(net);
            EnergyNetBuilder.rebuildForWire(x - 1, y, z, id);
            EnergyNetBuilder.rebuildForWire(x + 1, y, z, id);
            EnergyNetBuilder.rebuildForWire(x, y - 1, z, id);
            EnergyNetBuilder.rebuildForWire(x, y + 1, z, id);
            EnergyNetBuilder.rebuildForWire(x, y, z - 1, id);
            EnergyNetBuilder.rebuildForWire(x, y, z + 1, id);
        }
    }
};
Callback.addCallback("DestroyBlock", function (coords, block) {
    if (EnergyRegistry.isWire(block.id)) {
        EnergyRegistry.onWireDestroyed(coords.x, coords.y, coords.z, block.id);
    }
});
var EnergyType = /** @class */ (function () {
    function EnergyType(name) {
        this.name = name;
        this.value = 1;
        this.wireData = {};
    }
    EnergyType.prototype.registerWire = function (id, maxValue, overloadFunc, canConnectFunc) {
        this.wireData[id] = maxValue;
        var wireData = { type: this.name, value: maxValue };
        wireData.onOverload = overloadFunc || function () { };
        wireData.canConnect = canConnectFunc || function (wireBlock, coord1, coord2, side) {
            return true;
        };
        EnergyRegistry.wireData[id] = wireData;
        Block.registerPlaceFunction(id, function (coords, item, block) {
            var place = coords.relative;
            if (World.getBlockID(place.x, place.y, place.z) == 0) {
                World.setBlock(place.x, place.y, place.z, item.id, item.data);
                Player.setCarriedItem(item.id, item.count - 1, item.data);
                EnergyRegistry.onWirePlaced(place.x, place.y, place.z);
            }
        });
        return wireData;
    };
    return EnergyType;
}());
var TileEntityRegistry = {
    // adds energy type for tile entity prototype
    addEnergyType: function (Prototype, energyType) {
        if (!Prototype.__energyLibInit) {
            this.setupInitialParams(Prototype);
        }
        Prototype.__energyTypes[energyType.name] = energyType;
    },
    //same as addEnergyType, but works on already created prototypes, accessing them by id
    addEnergyTypeForId: function (id, energyType) {
        var Prototype = TileEntity.getPrototype(id);
        if (Prototype) {
            this.addEnergyType(Prototype, energyType);
        }
        else {
            Logger.Log("cannot add energy type no prototype defined for id " + id, "ERROR");
        }
    },
    setupInitialParams: function (Prototype) {
        Prototype.__energyLibInit = true;
        Prototype.__energyTypes = {};
        Prototype.__energyNets = {};
        Prototype.__connectedNets = {};
        Prototype.__init = Prototype.init || function () { };
        Prototype.__tick = Prototype.tick || function () { };
        Prototype.__destroy = Prototype.destroy || function () { };
        if (!Prototype.energyTick) {
            Prototype.energyTick = function (type, src) {
                // called for each energy type
            };
        }
        Prototype.energyReceive = Prototype.energyReceive || function () {
            return 0;
        };
        Prototype.canReceiveEnergy = Prototype.canReceiveEnergy || function () {
            return true;
        };
        if (Prototype.isEnergySource) {
            Prototype.canExtractEnergy = Prototype.canExtractEnergy || function () {
                return true;
            };
        }
        else {
            Prototype.canExtractEnergy = function () {
                return false;
            };
            Prototype.isEnergySource = function (type) {
                return false;
            };
        }
        Prototype.init = function () {
            this.__energyNets = {};
            this.__connectedNets = {};
            TileEntityRegistry.addMacineAccessAtCoords(this.x, this.y, this.z, this);
            EnergyNetBuilder.rebuildTileConnections(this.x, this.y, this.z, this);
            this.__init();
        };
        Prototype.destroy = function () {
            TileEntityRegistry.removeMachineAccessAtCoords(this.x, this.y, this.z);
            for (var i in this.__connectedNets) {
                this.__connectedNets[i].removeTileEntity(this);
            }
            for (var i in this.__energyNets) {
                EnergyNetBuilder.removeNet(this.__energyNets[i]);
            }
            this.__destroy();
        };
        Prototype.tick = function () {
            this.__tick();
            for (var name in this.__energyTypes) {
                if (this.isEnergySource(name)) {
                    var net = this.__energyNets[name];
                    if (!net) {
                        net = EnergyNetBuilder.buildForTile(this, this.__energyTypes[name]);
                        this.__energyNets[name] = net;
                    }
                    var src = net.source;
                    this.energyTick(name, src);
                }
                else {
                    this.energyTick(name, null);
                }
            }
        };
    },
    /* machine is tile entity, that uses energy */
    machineIDs: {},
    isMachine: function (id) {
        return this.machineIDs[id];
    },
    quickCoordAccess: {},
    addMacineAccessAtCoords: function (x, y, z, machine) {
        this.quickCoordAccess[x + ":" + y + ":" + z] = machine;
    },
    removeMachineAccessAtCoords: function (x, y, z) {
        delete this.quickCoordAccess[x + ":" + y + ":" + z];
    },
    accessMachineAtCoords: function (x, y, z) {
        return this.quickCoordAccess[x + ":" + y + ":" + z];
    },
    executeForAllInNet: function (net, func) {
        for (var i in net.tileEntities) {
            var mech = net.tileEntities[i];
            func(mech);
        }
    },
};
Callback.addCallback("LevelLoaded", function () {
    TileEntityRegistry.quickCoordAccess = {};
});
var GLOBAL_WEB_ID = 0;
var EnergyNet = /** @class */ (function () {
    function EnergyNet(energyType, maxPacketSize, overloadFunc) {
        this.energyType = energyType;
        this.energyName = energyType.name;
        this.maxPacketSize = maxPacketSize || 2e9;
        this.netId = GLOBAL_WEB_ID++;
        this.wireMap = {};
        this.onOverload = overloadFunc || function () { };
        this.store = 0;
        this.transfered = 0;
        this.voltage = 0;
        this.lastStore = 0;
        this.lastTransfered = 0;
        this.lastVoltage = 0;
        var self = this;
        this.source = {
            parent: function () {
                return self;
            },
            add: function (amount, voltage) {
                var add = self.addEnergy(amount, voltage || amount, self.sourceTile, {});
                return amount - add;
            },
            addAll: function (amount, voltage) {
                if (!voltage)
                    voltage = amount;
                if (self.connectionsCount == 1 && self.tileEntities.length == 0) {
                    for (var i in self.connectedNets)
                        self.connectedNets[i].addToBuffer(amount, voltage);
                    self.transfered = amount;
                    self.voltage = voltage;
                }
                else {
                    self.addToBuffer(amount, voltage);
                }
            }
        };
        this.connectedNets = {};
        this.connectionsCount = 0;
        this.tileEntities = [];
    }
    EnergyNet.prototype.addConnection = function (net) {
        if (!this.connectedNets[net.netId]) {
            this.connectedNets[net.netId] = net;
            this.connectionsCount++;
        }
    };
    EnergyNet.prototype.removeConnection = function (net) {
        delete this.connectedNets[net.netId];
        this.connectionsCount--;
    };
    EnergyNet.prototype.addTileEntity = function (tileEntity) {
        if (!tileEntity.__connectedNets[this.netId]) {
            this.tileEntities.push(tileEntity);
            tileEntity.__connectedNets[this.netId] = this;
        }
    };
    EnergyNet.prototype.removeTileEntity = function (tileEntity) {
        for (var i in this.tileEntities) {
            if (this.tileEntities[i] == tileEntity) {
                this.tileEntities.splice(i, 1);
                break;
            }
        }
    };
    EnergyNet.prototype.addEnergy = function (amount, voltage, source, explored) {
        if (explored[this.netId]) {
            return 0;
        }
        explored[this.netId] = true;
        var inVoltage = voltage;
        if (voltage > this.maxPacketSize) {
            voltage = this.maxPacketSize;
            amount = Math.min(amount, voltage);
        }
        var inAmount = amount;
        var n = this.tileEntities.length;
        for (var i in this.tileEntities) {
            if (amount <= 0)
                break;
            var tile = this.tileEntities[i];
            if (tile != source) {
                amount -= tile.energyReceive(this.energyName, Math.ceil(amount / n), voltage);
            }
            n--;
        }
        for (var i in this.tileEntities) {
            if (amount <= 0)
                break;
            var tile = this.tileEntities[i];
            if (tile != source) {
                amount -= tile.energyReceive(this.energyName, amount, voltage);
            }
        }
        for (var i in this.connectedNets) {
            if (amount <= 0)
                break;
            var net = this.connectedNets[i];
            if (!net.sourceTile) {
                amount -= net.addEnergy(amount, voltage, source, explored);
            }
        }
        if (inAmount > amount) {
            if (inVoltage > voltage) {
                this.onOverload(inVoltage);
            }
            this.voltage = Math.max(this.voltage, voltage);
            this.transfered += inAmount - amount;
        }
        return inAmount - amount;
    };
    EnergyNet.prototype.addToBuffer = function (amount, voltage) {
        this.store += amount;
        this.voltage = Math.max(this.voltage, voltage);
    };
    EnergyNet.prototype.tick = function () {
        this.lastStore = this.store;
        if (this.store > 0) {
            this.addEnergy(this.store, this.voltage, null, {});
            this.store = 0;
        }
        this.lastTransfered = this.transfered;
        this.lastVoltage = this.voltage;
        this.transfered = 0;
        this.voltage = 0;
    };
    EnergyNet.prototype.toString = function () {
        var r = function (x) { return Math.round(x * 100) / 100; };
        return "[EnergyNet id=" + this.netId + " type=" + this.energyName + "| stored =" + this.lastStore + "| connections=" + this.connectionsCount + " units=" + this.tileEntities.length + " | transfered=" + r(this.lastTransfered) + " | voltage=" + r(this.lastVoltage) + "]";
    };
    return EnergyNet;
}());
EXPORT("EnergyTypeRegistry", EnergyRegistry);
EXPORT("EnergyNetBuilder", EnergyNetBuilder);
EXPORT("EnergyTileRegistry", TileEntityRegistry);
