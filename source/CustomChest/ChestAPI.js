LIBRARY({
	name: "CustomChest",
	version: 1,
	shared: false,
	api: "CoreEngine"
});

let CustomChest = {	
	setChestRender: function(id) {
		for (let data = 0; data < 4; data++) {
			Block.setShape(id, 1/16, 0, 1/16, 15/16, 14/16, 15/16, data);
			let render = new ICRender.Model();
			let model = BlockRenderer.createModel();
			model.addBox(1/16, 0, 1/16, 15/16, 14/16, 15/16, id, data);
			if (data == 0) model.addBox(7/16, 7/16, 15/16, 9/16, 11/16, 1, id, data);
			if (data == 1) model.addBox(7/16, 7/16, 0, 9/16, 11/16, 1/16, id, data);
			if (data == 2) model.addBox(15/16, 7/16, 7/16, 1, 11/16, 9/16, id, data);
			if (data == 3) model.addBox(0, 7/16, 7/16, 1/16, 11/16, 9/16, id, data);
			render.addEntry(model);
			BlockRenderer.setStaticICRender(id, data, render);
		}
	},

	createGuiSlotSet: function(count, inRow, slotSize) {
		let startX = (1000 - inRow * slotSize) / 2;
		let elements = {};
		for (let i = 0; i < count; i++) {
			let x = i % inRow;
			let y = Math.floor(i / inRow);
			elements["slot"+i] = {type: "slot", x: startX + x * slotSize, y: y * slotSize, size: slotSize};
		}
		return elements;
	},

	createChestGui: function(title, count, inRow, slotSize) {
		let inRow = inRow || 9;
		let slotSize = slotSize || 108;
		return new UI.StandardWindow({
			standard: {
				header: {text: {text: Translation.translate(title)}},
				inventory: {standard: true},
				background: {standard: true},
				minHeight: Math.ceil(count / inRow) * slotSize
			},
		
			elements: this.createGuiSlotSet(count, inRow, slotSize)
		});
	}
}