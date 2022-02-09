const backgroundEl = document.querySelector('.background');
const nodeRadiusEl = document.querySelector('.node-radius');
const nodeColorEl = document.querySelector('.node-color');
const nodeValueColorEl = document.querySelector('.node-value-color');
const strokeWidthEl = document.querySelector('.edge-width');
const strokeColorEl = document.querySelector('.edge-color');
const edgeValueColorEl = document.querySelector('.edge-value-color');
const nodeListContent = document.querySelector('.node-list .content');
const addNodeBtn = document.querySelector('.add-btn');
const canvas = document.querySelector('#app');
const c = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;

let keyDown = 0;
let mouseDown = 0;
let mouseMove = 0;
let moveSpeed = 3;

// Function
function nodeRemoveBtn(thisEle) {
	const infoEl = thisEle.closest('.node-info');
	nodeList.forEach((item, index) => {
		if (item.value === +infoEl.dataset.value) {
			nodeList.splice(index, 1);
			update();
			infoEl.remove();

			nodeList.forEach((node) => {
				const idOf = node.listAdjTo
					.map((adj) => adj.item.value)
					.indexOf(item.value);
				if (idOf > -1) node.listAdjTo.splice(idOf, 1);

				document
					.querySelector(`.node-info[data-value="${node.value}"]`)
					.querySelector('.node-to').value = node.listAdjTo
					.map((adj) => `${adj.item.value}:${adj.weight}`)
					.join(',');
			});
		}
	});
}
function nodeFromHandle(thisEle) {
	// 	const infoEl = thisEle.closest('.node-info');
	// 	nodeList.forEach(item => {
	// 		if (item.value === +infoEl.dataset.value) {
	// 			item.textNode = thisEle.value;
	// 			update();
	// 		}
	// 	})
}
function nodeToHandle(thisEle) {
	const infoEl = thisEle.closest('.node-info');
	const _this = thisEle;
	nodeList.forEach((mainItem) => {
		if (mainItem.value === +infoEl.dataset.value) {
			const inpList = [
				..._this.value
					.trim()
					.split(',')
					.map((val) => {
						const newArr = val.split(':');
						return {
							value: +newArr[0],
							weight: newArr[1] || '0',
						};
					}),
			];
			const newNodeList = nodeList.map((node, index) => ({
				item: node,
				id: index,
			}));

			mainItem.listAdjTo.length = 0;
			inpList.forEach((inp) => {
				const idOf = newNodeList
					.map((x) => x.item.value)
					.indexOf(inp.value);
				if (idOf > -1) {
					mainItem.listAdjTo.push({
						item: nodeList[idOf],
						weight: inp.weight,
					});
				}
			});

			_this.setAttribute(
				'value',
				mainItem.listAdjTo
					.map((item) => {
						return item.item.value + ':' + item.weight;
					})
					.join(',')
			);
			update();
		}
	});
}
const addNodeInfo = (id) => {
	nodeListContent.insertAdjacentHTML(
		'beforeend',
		`<div class="node-info" data-value="${id}">
				<button class="node-remove" onclick="nodeRemoveBtn(this)">x</button>
				<input class="node-from" value="${id}" onchange="nodeFromHandle(this)">
				<input type="number" class="node-weight">
				<input type="text" class="node-to" value="" onchange="nodeToHandle(this)">
			</div>`
	);
	update();
};

const calcDist = ({ a, b }, { x, y }) => (a - x) ** 2 + (b - y) ** 2;
const trimArray = (list) => {
	if (list.length < 2) return;
	list.sort((a, b) => {
		if (a.x < b.x) return -1;
		if (a.x > b.x) return 1;
		return a.y - b.y;
	});
	for (let i = 1; i < list.length; i++)
		if (list[i].value === list[i - 1].value) list.splice(i, 1);
};
const trimAdjArray = (list) => {
	if (list.length < 2) return;
	list.sort((a, b) => {
		if (a.x < b.x) return -1;
		if (a.x > b.x) return 1;
		return a.y - b.y;
	});
	for (let i = 1; i < list.length; i++)
		if (list[i].item.value === list[i - 1].item.value) list.splice(i, 1);
};

const drawPoint = (item) => {
	const newNode = new Path2D();
	const { x, y } = item;
	newNode.arc(
		x + coor.x,
		y + coor.y,
		+nodeRadiusEl.value,
		0,
		Math.PI * 2,
		false
	);
	c.fillStyle = nodeColorEl.value;
	c.fill(newNode);
};
const drawDir = (a, b) => {
	const radius = +nodeRadiusEl.value;
	const angle = Math.atan2(b.y - a.y, b.x - a.x);

	const unitVector = {
		x: Math.cos(angle) * radius,
		y: Math.sin(angle) * radius,
	};
	const normalVector = {
		x: -unitVector.y,
		y: unitVector.x,
	};

	const boundPoint = {
		x: b.x - unitVector.x * 0.9 + coor.x,
		y: b.y - unitVector.y * 0.9 + coor.y,
	};
	const leftPoint = {
		x: boundPoint.x - unitVector.x + normalVector.x,
		y: boundPoint.y - unitVector.y + normalVector.y,
	};
	const rightPoint = {
		x: boundPoint.x - unitVector.x - normalVector.x,
		y: boundPoint.y - unitVector.y - normalVector.y,
	};

	c.beginPath();
	c.fillStyle = strokeColorEl.value;
	c.moveTo(boundPoint.x, boundPoint.y, 20, 0, Math.PI * 2, false);
	c.lineTo(leftPoint.x, leftPoint.y, 10, 0, Math.PI * 2, false);
	c.lineTo(rightPoint.x, rightPoint.y, 10, 0, Math.PI * 2, false);
	c.fill();
	c.closePath();
};
const drawLine = (a, b) => {
	c.beginPath();
	c.moveTo(a.x + coor.x, a.y + coor.y);
	c.lineTo(b.x + coor.x, b.y + coor.y);
	c.strokeStyle = strokeColorEl.value;
	c.lineWidth = +strokeWidthEl.value;
	c.stroke();
	c.closePath();

	drawDir(a, b);
	drawEdgeWeight(a, b);
};
const drawNodeValue = (item) => {
	const { x, y, textNode } = item;

	c.beginPath();
	c.font = '35px Trebuchet MS';
	c.fillStyle = nodeValueColorEl.value;
	c.fillText(
		textNode,
		x + coor.x - (10 + 10 * Math.floor(Math.log10(+item.textNode))),
		y + coor.y + 10
	);
	c.closePath();
};
const drawEdgeWeight = (a, b) => {
	const newList = a.listAdjTo.map((item) => item.item.value);
	const idx = newList.indexOf(b.value);
	const weight = a.listAdjTo[idx].weight;
	if (!weight || weight == 0) return;

	const radius = +nodeRadiusEl.value;
	const angle = Math.atan2(b.y - a.y, b.x - a.x);
	const unitVector = {
		x: Math.cos(angle),
		y: Math.sin(angle),
	};
	const normalVector = {
		x: -unitVector.y,
		y: unitVector.x,
	};

	const midPoint = {
		x: (b.x + a.x) / 2 + coor.x,
		y: (b.y + a.y) / 2 + coor.y,
	};

	c.beginPath();
	c.font = '40px Trebuchet MS';
	c.fillStyle = edgeValueColorEl.value;
	c.fillText(weight, midPoint.x, midPoint.y);
	c.closePath();
};
const drawNodeWeight = (item) => {
	const { x, y } = item;
	const dist = +nodeRadiusEl.value + 10;

	let weight;
	document.querySelectorAll('.node-weight').forEach((inp, index) => {
		const itemPar = inp.closest('.node-info');
		if (item.value === +itemPar.dataset.value) {
			weight = +inp.value;
			inp.setAttribute('value', weight);
			return;
		}
	});
	if (!weight) return;

	c.beginPath();
	c.font = '40px Trebuchet MS';
	c.fillStyle = nodeValueColorEl.value;
	c.fillText(weight, x + coor.x, y + coor.y - dist);
	c.closePath();
};
const update = () => {
	c.fillStyle = backgroundEl.value;
	c.fillRect(0, 0, canvas.width, canvas.height);

	trimArray(nodeList);
	nodeList.forEach((item) => {
		trimAdjArray(item.listAdjTo);
		item.listAdjTo.forEach((adjItem) => {
			if (item.x === adjItem.item.x && item.y === adjItem.item.y) return;
			if (nodeList.map((node) => node.value).includes(adjItem.item.value))
				drawLine(item, adjItem.item);
		});
		c.save();
	});
	nodeList.forEach((item) => {
		drawPoint(item);
		drawNodeValue(item);
		drawNodeWeight(item);
		c.save();
	});

	// localStorage.setItem('nodeList', JSON.stringify(nodeList));
};

const checkInside = ({ a, b }, { x, y }, r = +nodeRadiusEl.value) =>
	calcDist({ a, b }, { x, y }) < r * r;
const moveSpace = (e) => {
	mouseMove = 1;
	const angle = Math.atan2(
		(mouse.y || 0) - e.clientY,
		(mouse.x || 0) - e.clientX
	);
	coor.x -= Math.cos(angle) * moveSpeed;
	coor.y -= Math.sin(angle) * moveSpeed;
	update();
};
const toolHandle = (e, area) => {
	removeEventListener('mousemove', moveSpace);
	let key = e.key.toLowerCase();
	if (tool.list.includes(key)) tool.run[key](area);
};
const addNode = (e, f) => {
	if (keyDown || !mouseDown) return;
	keyDown = 1;

	let key = e.key;

	if (array[key]) {
		let idx = 1;
		while (nodeList.some((item) => item.value === idx)) idx++;

		const newPos = {
			a: f.clientX - coor.x,
			b: f.clientY - coor.y,
		};

		const r = +nodeRadiusEl.value;
		const checkFarAway = nodeList.every(
			(item) => calcDist(newPos, item) >= 4 * r * r + 30
		);
		if (checkFarAway) {
			array[key].push({
				x: newPos.a,
				y: newPos.b,
				weight: 0,
				value: idx,
				textNode: idx,
				listAdjTo: [],
			});
			addNodeInfo(idx);
		}
	}
};
let moveNode;
let nodeHandle;

// Variable
const nodeList = JSON.parse(localStorage.getItem('nodeList')) || [];
const nodeColor = nodeColorEl.value;

const strokeList = [];
const strokeColor = strokeColorEl.value;

const tool = {
	list: ['d', 's'],
	run: {
		d: (area) => {
			nodeList.forEach((item, index) => {
				if (checkInside(area, item)) {
					nodeList.forEach((node) => {
						const idOf = node.listAdjTo
							.map((adj) => adj.item.value)
							.indexOf(item.value);
						if (idOf > -1) node.listAdjTo.splice(idOf, 1);

						document
							.querySelector(
								`.node-info[data-value="${node.value}"]`
							)
							.querySelector('.node-to').value = node.listAdjTo
							.map((adj) => `${adj.item.value}:${adj.weight}`)
							.join(',');
					});

					nodeList.splice(index, 1);
					nodeListContent
						.querySelectorAll('.node-info')
						.forEach((node) => {
							if (item.value === +node.dataset.value) {
								update();
								node.remove();
								return;
							}
						});
				}
			});
		},
		s: (area) => {
			nodeList.forEach((item) => {
				if (checkInside(area, item)) strokeList.push(item);
			});
			if (strokeList.length < 2) return;

			const root = strokeList.shift();
			const rootInfo = nodeListContent.querySelector(
				`.node-info[data-value="${root.value}"]`
			);

			strokeList.forEach(
				(item) =>
					item.value !== root.value &&
					root.listAdjTo.push({ item: item, weight: 0 })
			);
			strokeList.length = 0;
			update();

			if (nodeListContent)
				rootInfo.querySelector('.node-to').value = root.listAdjTo
					.map((item) => `${item.item.value}:${item.weight}`)
					.join(',');
		},
		x: () => {
			moveSpeed = moveSpeed === 14 ? 4 : 14;
		},
	},
};
const array = {
	Shift: nodeList,
};
const coor = {
	x: 0,
	y: 0,
};
const mouse = {
	x: undefined,
	y: undefined,
};

// Add Event
const addHandle = () => {
	let nowNode = {
		a: Math.random() * innerWidth + coor.x,
		b: Math.random() * innerHeight + coor.y,
	};
	let r = nodeRadiusEl.value;
	while (
		nodeList.length &&
		!nodeList.every((item) => calcDist(nowNode, item) > 4 * r * r)
	) {
		nowNode.a = Math.random() * (innerWidth - 300) - coor.x;
		nowNode.b = Math.random() * (innerHeight - 300) - coor.y;
	}

	let idx = 1;
	while (nodeList.some((item) => item.value === idx)) idx++;
	nodeList.push({
		x: nowNode.a,
		y: nowNode.b,
		weight: 0,
		listAdjTo: [],
		value: idx,
		textNode: idx,
	});
	addNodeInfo(idx);
};
addNodeBtn.onclick = addHandle;

window.onresize = () => {
	canvas.width = innerWidth;
	canvas.height = innerHeight;
	update();
};

window.onmousedown = (f) => {
	mouseDown = 1;
	mouse.x = f.clientX;
	mouse.y = f.clientY;

	const area = {
		a: f.clientX - coor.x,
		b: f.clientY - coor.y,
	};

	addEventListener('mousemove', moveSpace);

	nodeList.forEach((item) => {
		if (checkInside(area, item)) {
			removeEventListener('mousemove', moveSpace);
			addEventListener(
				'mousemove',
				(moveNode = (e) => {
					const newPos = {
						a: e.clientX - coor.x,
						b: e.clientY - coor.y,
					};

					const r = +nodeRadiusEl.value;
					const checkFarAway = nodeList.every(
						(item) => calcDist(newPos, item) >= 4 * r * r + 30
					);
					if (checkFarAway) {
						item.x = newPos.a;
						item.y = newPos.b;
					}
					update();
				})
			);
			update();
		}
	});

	// Inside Event
	keyDown = 0;
	addEventListener(
		'keydown',
		(nodeHandle = (e) => {
			addNode(e, f);
			toolHandle(e, area);
		})
	);
	window.onkeyup = () => (keyDown = 0);
};

addEventListener('mouseup', () => {
	mouseDown = 0;
	removeEventListener('mousemove', moveNode);
	removeEventListener('mousemove', moveSpace);
	removeEventListener('keydown', nodeHandle);
	!mouseMove && update();
	mouseMove = 0;
});

addEventListener('keydown', (e) => {
	const key = e.key.toLowerCase();
	if (key === 'x') tool.run[key]();

	const container = document.querySelector('.container');
	if (key === 'p') container.classList.toggle('active');
});

update();
