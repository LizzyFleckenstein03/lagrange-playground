const canvas = document.getElementsByTagName("canvas")[0];
const ctx = canvas.getContext("2d");

let center;
let centerF = [0.5, 0.5];
let scale = 50;
let positions = [];
let func = null;
let drag = false;
let dragPos = null;
let dragIndex = -1;
let pointSize = 0.2;

let config = {
	grid: true,
	lines: false,
	circles: false,
};

const coordinateToScreen = (x, y) => {
	return [
		center[0] + x * scale,
		center[1] + y * scale,
	];
};

const screenToCoordinate = (x, y) => {
	return [
		(x - center[0]) / scale,
		(y - center[1]) / scale,
	];
};

const evalPos = (a, b, c, x) => {
    return a + (b + c * x) * x;
};

const lagrange = _ => {
	func = x => {
		let sum = 0;

		for (let i = 0; i < positions.length; i++) {
			let prod = positions[i][1];

			for (let j = 0; j < positions.length; j++)
				if (j != i)
					prod *= (x - positions[j][0]) / (positions[i][0] - positions[j][0]);

			sum += prod;
		}

		return sum;
	};
};

const draw = _ => {
	ctx.clearRect(0, 0, innerWidth, innerHeight);

	for (let x = center[0] % scale; x < innerWidth; x += scale) {
		if (Math.round(x) == Math.round(center[0]))
			ctx.lineWidth = 2;
		else if (config.grid)
			ctx.lineWidth = 1;
		else
			continue;

		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, innerHeight);
		ctx.strokeStyle = "grey";
		ctx.stroke();
	}

	for (let y = center[1] % scale; y < innerHeight; y += scale) {
		if (Math.round(y) == Math.round(center[1]))
			ctx.lineWidth = 2;
		else if (config.grid)
			ctx.lineWidth = 1;
		else
			continue;

		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(innerWidth, y);
		ctx.strokeStyle = "grey";
		ctx.stroke();
	}

	ctx.lineWidth = 2;

	ctx.beginPath();
	for (let x = 0; x < innerWidth; x++) {
		let y = Math.max(Math.min(center[1] + func((x - center[0]) / scale) * scale, +1e+37), -1e+37);

		if (x == 0)
			ctx.moveTo(x, y);
		else
			ctx.lineTo(x, y);
	}
	ctx.strokeStyle = "black";
	ctx.stroke();

	for (let i = 0; i < positions.length; i++) {
		const pos = positions[i];

		const [x, y] = coordinateToScreen(pos[0], pos[1]);
		ctx.beginPath();
		ctx.arc(x, y, scale * pointSize, 0, Math.PI * 2);
		ctx.fillStyle = "blue";
		ctx.fill();

		if (i > 0) {
			const last = positions[i - 1];

			if (config.lines) {
				const [lx, ly] = coordinateToScreen(last[0], last[1]);

				ctx.beginPath();
				ctx.moveTo(lx, ly);
				ctx.lineTo(x, y);
				ctx.strokeStyle = "red";
				ctx.stroke();
			}

			if (config.circles) {
				const [cx, cy] = coordinateToScreen((pos[0] + last[0]) / 2, (pos[1] + last[1]) / 2);

				ctx.beginPath();
				ctx.arc(cx, cy, scale * Math.sqrt(Math.pow(pos[0] - last[0], 2) + Math.pow(pos[1] - last[1], 2)) / 2, 0, Math.PI * 2);
				ctx.strokeStyle = "green";
				ctx.stroke();
			}
		}
	}
};

const sortPositions = _ => {
	positions.sort((a, b) => {
		return a[0] < b[0] ? -1 : +1;
	});
	lagrange();
	draw();
};

const addPosition = pos => {
	positions.push(pos);
	sortPositions();
};

const calculateCenter = _ => {
	center = [
		centerF[0] * innerWidth,
		centerF[1] * innerHeight,
	];

	draw();
};

const resize = _ => {
	canvas.width = innerWidth;
	canvas.height = innerHeight;

	calculateCenter();
};

const enableDrag = evt => {
	dragPos = [evt.clientX / innerWidth, evt.clientY / innerHeight];
};

const disableDrag = _ => {
	drag = false;
	dragPos = null;
	dragIndex = -1;
	canvas.style.cursor = "auto";
};

const init = _ => {
	lagrange();
	resize();
};

canvas.addEventListener("mousedown", evt => {
	if (evt.button != 0)
		return;

	enableDrag(evt);

	for (let i = 0; i < positions.length; i++) {
		const [x, y] = coordinateToScreen(positions[i][0], positions[i][1]);

		if (Math.sqrt(Math.pow(evt.clientX - x, 2) + Math.pow(evt.clientY - y, 2)) < scale * pointSize) {
			dragIndex = i;
			break;
		}
	}
});

canvas.addEventListener("mousemove", evt => {
	if (evt.button != 0)
		return;

	const oldDragPos = dragPos;

	if (oldDragPos) {
		drag = true;

		enableDrag(evt);

		if (dragIndex == -1) {
			canvas.style.cursor = "move";

			centerF = [
				centerF[0] + dragPos[0] - oldDragPos[0],
				centerF[1] + dragPos[1] - oldDragPos[1],
			];

			calculateCenter();
		} else {
			canvas.style.cursor = "grabbing";

			let pos = positions[dragIndex] = screenToCoordinate(dragPos[0] * innerWidth, dragPos[1] * innerHeight);
			sortPositions();
			dragIndex = positions.indexOf(pos);
		}
	}
});

canvas.addEventListener("mouseup", evt => {
	if (evt.button != 0)
		return;

	if (! drag)
		addPosition(screenToCoordinate(evt.clientX, evt.clientY));

	disableDrag();
});

canvas.addEventListener("mouseleave", evt => {
	if (evt.button != 0)
		return;

	disableDrag();
});

canvas.addEventListener("wheel", evt => {
	scale -= evt.deltaY * 0.05;
	scale = Math.max(1, scale);

	draw();
});

addEventListener("resize", _ => {
	resize();
});

for (let id of ["grid", "lines", "circles"]) {
	let elem = document.getElementById(id);
	elem.checked = config[id];

	elem.addEventListener("input", evt => {
		config[id] = elem.checked;
		draw();
	});
}

init();
