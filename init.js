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
		ctx.lineWidth = x == center[0] ? 2 : 1;
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, innerHeight);
		ctx.stroke();
	}

	for (let y = center[1] % scale; y < innerHeight; y += scale) {
		ctx.lineWidth = y == center[1] ? 2 : 1;
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(innerWidth, y);
		ctx.stroke();
	}

	ctx.lineWidth = 2;

	ctx.beginPath();
	let moved = false;

	for (let x = 0; x < innerWidth; x++) {
		let y = Math.max(Math.min(center[1] + func((x - center[0]) / scale) * scale, +1e+37), -1e+37);

		if (x == 0)
			ctx.moveTo(x, y);
		else
			ctx.lineTo(x, y);
	}
	ctx.stroke();

	ctx.fillStyle = "blue";

	for (let circle of positions) {
		const [x, y] = coordinateToScreen(circle[0], circle[1]);
		ctx.beginPath();
		ctx.arc(x, y, scale * 0.1, 0, Math.PI * 2);
		ctx.fill();
	}
};

const addPosition = pos => {
	positions.push(pos);
	lagrange();
	draw();
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

		if (Math.sqrt(Math.pow(evt.clientX - x, 2) + Math.pow(evt.clientY - y, 2)) < scale * 0.1) {
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

			positions[dragIndex] = screenToCoordinate(dragPos[0] * innerWidth, dragPos[1] * innerHeight);

			lagrange();
			draw();
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
	scale = Math.max(7, scale);

	draw();
});

addEventListener("resize", _ => {
	resize();
});

init();
