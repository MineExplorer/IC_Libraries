/// <reference path="TileEntityInterface.ts" />

namespace StorageInterfaceFactory {
    export function getTileEntityInterface(tileEntity: TileEntity) {
        if (tileEntity.__storageInterface) {
            return tileEntity.__storageInterface;
        }
        const storagePrototype = StorageInterface.getPrototype(tileEntity.blockID);
        let interface: StorageInterface.TileEntityInterface;
        if (storagePrototype) {
            interface = new storagePrototype.classType(tileEntity)
            for (let key in storagePrototype) {
                if (key == "classType") continue;
                interface[key] = storagePrototype[key];
            }
        } else {
            interface = new StorageInterface.TileEntityInterface(tileEntity);
        }
        tileEntity.__storageInterface = interface;
        return interface;
    }
}