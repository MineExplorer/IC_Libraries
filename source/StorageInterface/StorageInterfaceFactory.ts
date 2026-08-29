/// <reference path="TileEntityInterface.ts" />

namespace StorageInterfaceFactory {
    export function getTileEntityInterface(tileEntity: TileEntity): StorageInterface.TileEntityInterface {
        if (tileEntity.__storageInterface) {
            return tileEntity.__storageInterface;
        }
        const storagePrototype = StorageInterface.getPrototype(tileEntity.blockID);
        let tileInterface: StorageInterface.TileEntityInterface;
        if (storagePrototype) {
            tileInterface = new storagePrototype.classType(tileEntity)
            for (let key in storagePrototype) {
                if (key == "classType") continue;
                // Reverse compatibility with callers who do not pass tileEntity arg.
                if (key == "canReceiveLiquid") {
                    tileInterface["__canReceiveLiquid"] = storagePrototype[key];
                    tileInterface[key] = function(liquid, side, tileEntity = this.tileEntity) {
                        return this.__canReceiveLiquid(liquid, side, tileEntity);
                    }
                    continue;
                }
                if (key == "canTransportLiquid") {
                    tileInterface["__canTransportLiquid"] = storagePrototype[key];
                    tileInterface[key] = function(liquid, side, tileEntity = this.tileEntity) {
                        return this.__canTransportLiquid(liquid, side, tileEntity);
                    }
                    continue;
                }
                if (key == "getInputTank") {
                    tileInterface["__getInputTank"] = storagePrototype[key];
                    tileInterface[key] = function(side, tileEntity = this.tileEntity) {
                        return this.__getInputTank(side, tileEntity);
                    }
                    continue;
                }
                if (key == "getOutputTank") {
                    tileInterface["__getOutputTank"] = storagePrototype[key];
                    tileInterface[key] = function(side, tileEntity = this.tileEntity) {
                        return this.__getOutputTank(side, tileEntity);
                    }
                    continue;
                }
                tileInterface[key] = storagePrototype[key];
            }
        } else {
            tileInterface = new StorageInterface.TileEntityInterface(tileEntity);
        }
        tileEntity.__storageInterface = tileInterface;
        return tileInterface;
    }
}