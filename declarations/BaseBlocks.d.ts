/// <reference path="./core-engine.d.ts" />

declare namespace BaseBlocks {
	function createSlab(stringID: string, variants: Block.BlockVariation[], blockType: string | Block.SpecialType, doubleSlabID: number): void
	function createDoubleSlab(stringID: string, variants: Block.BlockVariation[], blockType: string | Block.SpecialType, slabID: number): void
	function addDropOnExplosion(blockID: number): void
}