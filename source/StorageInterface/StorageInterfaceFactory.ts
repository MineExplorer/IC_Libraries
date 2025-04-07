/// <reference path="TileEntityInterface.ts" />

namespace StorageInterfaceFactory {
    export function getTileEntityInterface(tileEntity: TileEntity) {
        const storagePrototype = StorageInterface.getPrototype(tileEntity.blockID);
        const interface = new storagePrototype.classType(tileEntity);
        if (storagePrototype) {
            for (let key in storagePrototype) {
                if (key == "classType") continue;
                interface[key] = storagePrototype[key];
            }
        }
        return interface;
    }
}