'use strict';

const backgroundEl = document.querySelector('.background');
const nodeRadiusEl = document.querySelector('.node-radius');
const nodeColorEl = document.querySelector('.node-color');
const nodeValueColorEl = document.querySelector('.node-value-color');
const strokeWidthEl = document.querySelector('.edge-width');
const strokeColorEl = document.querySelector('.edge-color');
const edgeValueColorEl = document.querySelector('.edge-value-color');
const nodeListContent = document.querySelector('.node-list .content');
const addNodeBtn = document.querySelector('.add-btn');
const copyDataBtn = document.querySelector('.copy-btn');
const showDirect = document.querySelector('.show-direct');
const inpGr = document.querySelector('.input-group');
const canvas = document.querySelector('#app');
const c = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;
showDirect.checked = 1;

let keyDown = 0;
let mouseDown = 0;
let mouseMove = 0;
let moveSpeed = 5;

// Node Ele Func
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

				const nodeToInp = document
					.querySelector(`.node-info[data-value="${node.value}"]`)
					?.querySelector('.node-to');
				if (nodeToInp)
					nodeToInp.value = node.listAdjTo
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

// Utilities Func
const getRandPos = (r = +nodeRadiusEl.value) => ({
	a: Math.random() * (innerWidth + coor.x - 4 * r) + 2 * r,
	b: Math.random() * (innerHeight + coor.y - 4 * r) + 2 * r,
});
const calcDist = ({ a, b }, { x, y }) => (a - x) ** 2 + (b - y) ** 2;
const trimArray = (list) => {
	if (list.length < 2) return;
	for (let i = 1; i < list.length; i++)
		if (list[i].value === list[i - 1].value) list.splice(i, 1);
};
const trimAdjArray = (list) => {
	if (list.length < 2) return;
	for (let i = 1; i < list.length; i++)
		if (list[i].item.value === list[i - 1].item.value) list.splice(i, 1);
};

// Draw Func
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
const drawDirOwn = (a) => {
	const r = +nodeRadiusEl.value;
	c.beginPath();
	c.arc(a.x + coor.x, a.y + coor.y - r * 1.3, r * 1.3, 0, Math.PI * 2, false);
	c.lineWidth = +strokeWidthEl.value;
	c.strokeStyle = 'yellow';
	c.stroke();
	c.closePath();

	const cp = { x: a.x + coor.x - 10, y: a.y + coor.y - 70 };

	const newList = a.listAdjTo.map((item) => item.item.value);
	const idx = newList.indexOf(a.value);
	const weight = a.listAdjTo[idx].weight;
	if (!weight) return;

	c.beginPath();
	c.font = '40px Trebuchet MS';
	c.fillStyle = edgeValueColorEl.value;
	c.fillText(weight, cp.x, cp.y);
	c.closePath();
};
const drawDir = (a, b, { curve = 0, cp }) => {
	if (!showDirect.checked) return;

	const radius = +nodeRadiusEl.value;
	const angle = curve
		? Math.atan2(b.y - cp.y + coor.y, b.x - cp.x + coor.x)
		: Math.atan2(b.y - a.y, b.x - a.x);

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
		x: boundPoint.x - unitVector.x * 0.8 + normalVector.x * 0.7,
		y: boundPoint.y - unitVector.y * 0.8 + normalVector.y * 0.7,
	};
	const rightPoint = {
		x: boundPoint.x - unitVector.x * 0.8 - normalVector.x * 0.7,
		y: boundPoint.y - unitVector.y * 0.8 - normalVector.y * 0.7,
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

	drawDir(a, b, { curve: 0 });
	drawEdgeWeight(a, b, { curve: 0 });
};
const drawCurve = (a, b) => {
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
		x: (a.x + b.x) / 2,
		y: (a.y + b.y) / 2,
	};
	const cp = {
		x: midPoint.x - normalVector.x * 65 + coor.x,
		y: midPoint.y - normalVector.y * 65 + coor.y,
	};

	c.beginPath();
	c.moveTo(a.x + coor.x, a.y + coor.y);
	c.bezierCurveTo(cp.x, cp.y, cp.x, cp.y, b.x + coor.x, b.y + coor.y);
	c.strokeStyle = strokeColorEl.value;
	c.lineWidth = strokeWidthEl.value;
	c.stroke();
	c.closePath();

	drawDir(a, b, { curve: 1, cp });
	drawEdgeWeight(a, b, { curve: 1, cp });
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
const drawEdgeWeight = (a, b, { curve = 0, cp }) => {
	const newList = a.listAdjTo.map((item) => item.item.value);
	const idx = newList.indexOf(b.value);
	const weight = a.listAdjTo[idx].weight;
	if (!weight || weight == 0) return;

	const pos = {
		x: curve ? cp.x : (b.x + a.x) / 2 + coor.x,
		y: curve ? cp.y : (b.y + a.y) / 2 + coor.y,
	};

	c.beginPath();
	c.font = '40px Trebuchet MS';
	c.fillStyle = edgeValueColorEl.value;
	c.fillText(weight, pos.x, pos.y);
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
	c.restore();
	c.fillStyle = backgroundEl.value;
	c.fillRect(0, 0, canvas.width, canvas.height);

	trimArray(nodeList);
	nodeList.forEach((item) => {
		trimAdjArray(item.listAdjTo);
		item.listAdjTo.forEach((adj) => {
			if (item.x === adj.item.x && item.y === adj.item.y) {
				drawDirOwn(item);
			} else if (nodeList.map((x) => x.value).includes(adj.item.value)) {
				if (
					adj.item.listAdjTo
						.map((x) => x.item.value)
						.includes(item.value) &&
					showDirect.checked
				)
					drawCurve(item, adj.item);
				else drawLine(item, adj.item);
			}
		});
	});
	nodeList.forEach((item) => {
		drawPoint(item);
		drawNodeValue(item);
		drawNodeWeight(item);
	});

	c.save();
	// localStorage.setItem('nodeList', JSON.stringify(nodeList));
};

// Feature Func
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
			(item) => calcDist(newPos, item) >= 4 * r * r
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

						document.querySelector(
							`.node-info[data-value="${node.value}"] .node-to`
						).value = node.listAdjTo
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

			strokeList.forEach((item) =>
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
			moveSpeed = moveSpeed === 14 ? 5 : 14;
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

// Event Handles
const inpAddNode = (nodeValue) => {
	const nodeInList = nodeList.find((item) => item.value === nodeValue);
	if (nodeInList)
		return {
			unique: 0,
			node: nodeInList,
		};

	let nowNode = getRandPos();
	let r = nodeRadiusEl.value;
	while (
		nodeList.length &&
		!nodeList.every((item) => calcDist(nowNode, item) > 4 * r * r)
	)
		nowNode = getRandPos();

	return {
		unique: 1,
		node: {
			x: nowNode.a,
			y: nowNode.b,
			weight: 0,
			listAdjTo: [],
			value: nodeValue,
			textNode: nodeValue,
		},
	};
};
const addHandle = () => {
	let nowNode = getRandPos();
	let r = nodeRadiusEl.value;
	while (
		nodeList.length &&
		!nodeList.every((item) => calcDist(nowNode, item) > 4 * r * r)
	)
		nowNode = getRandPos();

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

showDirect.oninput = () => update();

window.onresize = () => {
	canvas.width = innerWidth;
	canvas.height = innerHeight;
	update();
};

let animationID;
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
					const checkFarAway = nodeList.every((node) => {
						if (item !== node)
							return calcDist(newPos, node) >= 4 * r * r + 2 * r;
						return true;
					});
					if (checkFarAway) {
						item.x = newPos.a;
						item.y = newPos.b;
					}
					update();
				})
			);
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

	const helpModal = document.querySelector('.help-modal');
	if (key === 'h') helpModal.classList.toggle('active');

	if (key === 'i') inpGr.classList.toggle('active');

	if (key === 'escape') {
		container.classList.remove('active');
		helpModal.classList.remove('active');
		inpGr.classList.remove('active');
	}
});

copyDataBtn.onclick = () => {
	const getData = () =>
		nodeList
			.map((node) => {
				const adjOfOthers = nodeList.some((item) =>
					item.listAdjTo.map((x) => x.item.value).includes(node.value)
				);
				const adjData = node.listAdjTo
					.map(
						(adj) =>
							`${node.value} ${adj.item.value}${
								adj.weight
									? ' ' + adj.weight.split('/').join(' ')
									: ''
							}\n`
					)
					.join('');
				const adjOwnData = !adjData && !adjOfOthers ? node.value : '';
				return adjData + adjOwnData;
			})
			.join('')
			.trim();
	const nodeListData = getData();
	inpGr.value = nodeListData;
	navigator.clipboard.writeText(nodeListData);
	copyDataBtn.classList.add('btn--success');
	setTimeout(() => copyDataBtn.classList.remove('btn--success'), 800);
};

inpGr.onmousemove = (e) => e.stopPropagation();
inpGr.oninput = (e) => {
	nodeListContent.innerHTML = '';
	nodeList.length = 0;
	const lines = e.target.value.trim().split('\n');
	lines.forEach((line) => {
		if (!line[0]) return;
		const directEdge = !showDirect.checked;
		const arr = line
			.trim()
			.split(' ')
			.map((item) => +item);
		const from = inpAddNode(arr[0]);
		from.unique && nodeList.push(from.node);

		if (arr.length === 2) {
			const to = inpAddNode(arr[1]);
			to.unique && nodeList.push(to.node);
			from.node.listAdjTo.push({ item: to.node, weight: 0 });
			directEdge &&
				to.node.listAdjTo.push({ item: from.node, weight: 0 });
		}
		if (arr.length > 2) {
			const to = inpAddNode(arr[1]);
			to.unique && nodeList.push(to.node);
			const weight = arr.slice(2).join('/');
			from.node.listAdjTo.push({ item: to.node, weight });
			directEdge && to.node.listAdjTo.push({ item: from.node, weight });
		}
	});
	update();
};

update();
