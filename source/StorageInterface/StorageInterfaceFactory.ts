/// <reference path="TileEntityInterface.ts" />

namespace StorageInterfaceFactory {
    export function getTileEntityInterface(tileEntity: TileEntity) {
        if (tileEntity.__storageInterface) {
            return tileEntity.__storageInterface;
        }
        const storagePrototype = StorageInterface.getPrototype(tileEntity.blockID);
        const interface = new storagePrototype.classType(tileEntity);
        if (storagePrototype) {
            for (let key in storagePrototype) {
                if (key == "classType") continue;
                interface[key] = storagePrototype[key];
            }
        }
        tileEntity.__storageInterface = interface;
        return interface;
    }
}