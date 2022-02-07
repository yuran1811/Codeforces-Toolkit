const backgroundEl = document.querySelector('.background input');
const strokeWidthEl = document.querySelector('.edge-width input');
const nodeRadiusEl = document.querySelector('.node-radius input');
const strokeColorEl = document.querySelector('.edge-color input');
const nodeColorEl = document.querySelector('.node-color input');
const canvas = document.querySelector('#app');
const c = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;

let keyDown = 0;
let mouseDown = 0;
let mouseMove = 0;
let moveSpeed = 3;

// Function
const calcDist = ({ a, b }, { x, y }) => (a - x) ** 2 + (b - y) ** 2;
const trimArray = (list) => {
	if (list.length < 2) return;
	list.sort((a, b) => {
		if (a.x < b.x) return -1;
		if (a.x > b.x) return 1;
		return a.y - b.y;
	});

	let index = 0;
	let last = list[index++];
	const r = +nodeRadiusEl.value;
	while (index < list.length) {
		if (calcDist({ a: last.x, b: last.y }, list[index]) <= 4 * r * r) {
			list.splice(index, 1);
		} else {
			last = list[index];
			index++;
		}
	}
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
const drawLine = (a, b) => {
	c.beginPath();
	c.moveTo(a.x + coor.x, a.y + coor.y);
	c.lineTo(b.x + coor.x, b.y + coor.y);
	c.strokeStyle = strokeColorEl.value;
	c.lineWidth = +strokeWidthEl.value;
	c.stroke();
	c.closePath();
};
const drawText = (item) => {
	c.newPath();
};
const update = () => {
	c.fillStyle = backgroundEl.value;
	c.fillRect(0, 0, canvas.width, canvas.height);

	trimArray(nodeList);
	nodeList.forEach((item) => {
		trimArray(item.listAdjTo);
		item.listAdjTo.forEach((adjItem) => {
			if (item.x === adjItem.x && item.y === adjItem.y) return;
			if (nodeList.includes(adjItem)) drawLine(item, adjItem);
		});
		c.save();
	});
	nodeList.forEach((item) => {
		drawPoint(item);
		drawText(item);
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
	array[key]?.push({
		x: f.clientX - coor.x,
		y: f.clientY - coor.y,
		listAdjTo: [],
		value: nodeList.length + 1,
	});
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
				if (checkInside(area, item)) nodeList.splice(index, 1);
				update();
			});
		},
		s: (area) => {
			nodeList.forEach((item) => {
				if (checkInside(area, item)) strokeList.push(item);
			});
			if (strokeList.length < 2) return;

			const root = strokeList.shift();
			strokeList.forEach((item) => root.listAdjTo.push(item));
			strokeList.length = 0;
			update();
		},
		x: () => {
			moveSpeed = moveSpeed === 12 ? 3 : 12;
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
					item.x = e.clientX - coor.x;
					item.y = e.clientY - coor.y;
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

localStorage.clear();

// Add Node Button Handle
(() => {
	const nodeListContent = document.querySelector('.node-list .content');
	const addNodeBtn = document.querySelector('.add-btn');
	addNodeBtn.onclick = () => {
		let nowNode = {
			a: Math.random() * innerWidth + coor.x,
			b: Math.random() * innerHeight + coor.y,
		};
		let r = nodeRadiusEl.value;
		while (
			nodeList.length &&
			!nodeList.every((item) => calcDist(nowNode, item) > 4 * r * r)
		) {
			nowNode.a = Math.random() * innerWidth + coor.x;
			nowNode.b = Math.random() * innerHeight + coor.y;
		}

		nodeList.push({
			x: nowNode.a,
			y: nowNode.b,
			listAdjTo: [],
			value: nodeList.length + 1,
		});

		nodeListContent.innerHTML += `
			<div class="node-info">
				<button
					data-id="${nodeList.length - 1}"
					class="node-remove"
					onclick="
						nodeList.splice(this.dataset.id, 1);
					"
				>x</button>
				<input type="number" class="node-from" min="0" max="1000000" value = "${
					nodeList.length
				}">
				<input type="text" class="node-to">
			</div>`;
	};
})();
