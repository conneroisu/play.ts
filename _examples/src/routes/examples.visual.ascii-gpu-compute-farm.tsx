import { createFileRoute } from "@tanstack/react-router";
import { clamp, cos, lerp, sin } from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/visual/ascii-gpu-compute-farm")(
	{
		component: GPUComputeFarmDemo,
	},
);

interface GPU {
	id: string;
	name: string;
	temperature: number;
	utilization: number;
	memory: number;
	powerDraw: number;
	fanSpeed: number;
	status: "idle" | "computing" | "throttling" | "error";
	currentTask: ComputeTask | null;
	x: number;
	y: number;
}

interface ComputeTask {
	id: string;
	type:
		| "ml-training"
		| "crypto-mining"
		| "render"
		| "simulation"
		| "ai-inference";
	progress: number;
	priority: "low" | "normal" | "high" | "critical";
	estimatedTime: number;
	startTime: number;
}

interface TaskQueue {
	waiting: ComputeTask[];
	running: ComputeTask[];
	completed: ComputeTask[];
}

function GPUComputeFarmDemo() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const isRunningRef = useRef(false);
	const timeRef = useRef(0);
	const [isRunning, setIsRunning] = useState(false);

	const gpusRef = useRef<GPU[]>([
		{
			id: "gpu-0",
			name: "RTX 4090",
			temperature: 35,
			utilization: 0,
			memory: 0,
			powerDraw: 100,
			fanSpeed: 30,
			status: "idle",
			currentTask: null,
			x: 5,
			y: 5,
		},
		{
			id: "gpu-1",
			name: "RTX 4090",
			temperature: 38,
			utilization: 0,
			memory: 0,
			powerDraw: 95,
			fanSpeed: 28,
			status: "idle",
			currentTask: null,
			x: 25,
			y: 5,
		},
		{
			id: "gpu-2",
			name: "RTX 4090",
			temperature: 36,
			utilization: 0,
			memory: 0,
			powerDraw: 98,
			fanSpeed: 32,
			status: "idle",
			currentTask: null,
			x: 45,
			y: 5,
		},
		{
			id: "gpu-3",
			name: "RTX 4090",
			temperature: 40,
			utilization: 0,
			memory: 0,
			powerDraw: 102,
			fanSpeed: 35,
			status: "idle",
			currentTask: null,
			x: 65,
			y: 5,
		},
		{
			id: "gpu-4",
			name: "A100 80GB",
			temperature: 42,
			utilization: 0,
			memory: 0,
			powerDraw: 250,
			fanSpeed: 40,
			status: "idle",
			currentTask: null,
			x: 5,
			y: 15,
		},
		{
			id: "gpu-5",
			name: "A100 80GB",
			temperature: 41,
			utilization: 0,
			memory: 0,
			powerDraw: 245,
			fanSpeed: 38,
			status: "idle",
			currentTask: null,
			x: 25,
			y: 15,
		},
		{
			id: "gpu-6",
			name: "H100 80GB",
			temperature: 45,
			utilization: 0,
			memory: 0,
			powerDraw: 300,
			fanSpeed: 45,
			status: "idle",
			currentTask: null,
			x: 45,
			y: 15,
		},
		{
			id: "gpu-7",
			name: "H100 80GB",
			temperature: 43,
			utilization: 0,
			memory: 0,
			powerDraw: 295,
			fanSpeed: 42,
			status: "idle",
			currentTask: null,
			x: 65,
			y: 15,
		},
	]);

	const taskQueueRef = useRef<TaskQueue>({
		waiting: [],
		running: [],
		completed: [],
	});

	const [metrics, setMetrics] = useState({
		totalTasks: 0,
		runningTasks: 0,
		completedTasks: 0,
		avgTemperature: 0,
		totalPowerDraw: 0,
		avgUtilization: 0,
	});

	const taskTypes = [
		"ml-training",
		"crypto-mining",
		"render",
		"simulation",
		"ai-inference",
	] as const;
	const priorities = ["low", "normal", "high", "critical"] as const;

	const createTask = (): ComputeTask => {
		const type = taskTypes[Math.floor(Math.random() * taskTypes.length)];
		const priority = priorities[Math.floor(Math.random() * priorities.length)];

		let estimatedTime = 5 + Math.random() * 15;
		if (priority === "critical") estimatedTime *= 0.5;
		if (priority === "low") estimatedTime *= 1.5;

		return {
			id: Math.random().toString(36).substr(2, 8),
			type,
			priority,
			progress: 0,
			estimatedTime,
			startTime: 0,
		};
	};

	const assignTaskToGPU = (gpu: GPU, task: ComputeTask) => {
		gpu.currentTask = task;
		gpu.status = "computing";
		task.startTime = timeRef.current;

		const queue = taskQueueRef.current;
		queue.waiting = queue.waiting.filter((t) => t.id !== task.id);
		queue.running.push(task);
	};

	const updateGPU = (gpu: GPU, deltaTime: number) => {
		if (gpu.currentTask) {
			const task = gpu.currentTask;
			const elapsed = timeRef.current - task.startTime;
			task.progress = Math.min(100, (elapsed / task.estimatedTime) * 100);

			// GPU utilization based on task type
			let targetUtilization = 0;
			switch (task.type) {
				case "ml-training":
					targetUtilization = 85 + Math.random() * 10;
					break;
				case "crypto-mining":
					targetUtilization = 95 + Math.random() * 5;
					break;
				case "render":
					targetUtilization = 70 + Math.random() * 20;
					break;
				case "simulation":
					targetUtilization = 80 + Math.random() * 15;
					break;
				case "ai-inference":
					targetUtilization = 60 + Math.random() * 25;
					break;
			}

			gpu.utilization = lerp(gpu.utilization, targetUtilization, 0.05);
			gpu.memory = lerp(gpu.memory, targetUtilization * 0.8, 0.03);

			// Temperature simulation
			const baseTemp = 40;
			const loadTemp = gpu.utilization * 0.6;
			const targetTemp = baseTemp + loadTemp + Math.random() * 5;
			gpu.temperature = lerp(gpu.temperature, targetTemp, 0.02);

			// Fan speed adjustment
			const targetFanSpeed = Math.min(100, 30 + (gpu.temperature - 40) * 2);
			gpu.fanSpeed = lerp(gpu.fanSpeed, targetFanSpeed, 0.1);

			// Power draw
			const basePower = gpu.name.includes("H100")
				? 300
				: gpu.name.includes("A100")
					? 250
					: 100;
			const targetPower =
				basePower + (gpu.utilization / 100) * (basePower * 0.5);
			gpu.powerDraw = lerp(gpu.powerDraw, targetPower, 0.05);

			// Thermal throttling
			if (gpu.temperature > 85) {
				gpu.status = "throttling";
				gpu.utilization *= 0.7;
			} else if (gpu.temperature > 95) {
				gpu.status = "error";
				gpu.utilization = 0;
			}

			// Task completion
			if (task.progress >= 100) {
				const queue = taskQueueRef.current;
				queue.running = queue.running.filter((t) => t.id !== task.id);
				queue.completed.push(task);
				gpu.currentTask = null;
				gpu.status = "idle";

				if (queue.completed.length > 20) {
					queue.completed.shift();
				}
			}
		} else {
			// Idle state
			gpu.utilization = lerp(gpu.utilization, 0, 0.1);
			gpu.memory = lerp(gpu.memory, 0, 0.05);
			gpu.temperature = lerp(gpu.temperature, 35 + Math.random() * 5, 0.01);
			gpu.fanSpeed = lerp(gpu.fanSpeed, 30, 0.05);

			const basePower = gpu.name.includes("H100")
				? 50
				: gpu.name.includes("A100")
					? 40
					: 20;
			gpu.powerDraw = lerp(gpu.powerDraw, basePower + Math.random() * 10, 0.02);
		}
	};

	const drawGPU = (
		ctx: CanvasRenderingContext2D,
		gpu: GPU,
		charWidth: number,
		charHeight: number,
	) => {
		const x = gpu.x;
		const y = gpu.y;

		// GPU status color
		let statusColor = "#00ff00";
		let statusSymbol = "●";

		switch (gpu.status) {
			case "idle":
				statusColor = "#888888";
				statusSymbol = "○";
				break;
			case "computing":
				statusColor = "#00ff00";
				statusSymbol = "●";
				break;
			case "throttling":
				statusColor = "#ffaa00";
				statusSymbol = "◐";
				break;
			case "error":
				statusColor = "#ff0000";
				statusSymbol = "✗";
				break;
		}

		// GPU frame
		ctx.fillStyle = statusColor;
		ctx.fillText("╭─────────────────╮", x * charWidth, y * charHeight);
		ctx.fillText("│", x * charWidth, (y + 1) * charHeight);
		ctx.fillText("│", (x + 18) * charWidth, (y + 1) * charHeight);

		// GPU name and status
		ctx.fillStyle = "#ffffff";
		ctx.fillText(`${gpu.name}`, (x + 2) * charWidth, (y + 1) * charHeight);
		ctx.fillStyle = statusColor;
		ctx.fillText(statusSymbol, (x + 16) * charWidth, (y + 1) * charHeight);

		// Metrics
		ctx.fillStyle = statusColor;
		ctx.fillText("│", x * charWidth, (y + 2) * charHeight);
		ctx.fillText("│", (x + 18) * charWidth, (y + 2) * charHeight);
		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			`Util: ${gpu.utilization.toFixed(0)}%`,
			(x + 2) * charWidth,
			(y + 2) * charHeight,
		);
		ctx.fillText(
			`${gpu.temperature.toFixed(0)}°C`,
			(x + 12) * charWidth,
			(y + 2) * charHeight,
		);

		ctx.fillStyle = statusColor;
		ctx.fillText("│", x * charWidth, (y + 3) * charHeight);
		ctx.fillText("│", (x + 18) * charWidth, (y + 3) * charHeight);
		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			`Mem: ${gpu.memory.toFixed(0)}%`,
			(x + 2) * charWidth,
			(y + 3) * charHeight,
		);
		ctx.fillText(
			`${gpu.powerDraw.toFixed(0)}W`,
			(x + 12) * charWidth,
			(y + 3) * charHeight,
		);

		// Current task
		ctx.fillStyle = statusColor;
		ctx.fillText("│", x * charWidth, (y + 4) * charHeight);
		ctx.fillText("│", (x + 18) * charWidth, (y + 4) * charHeight);

		if (gpu.currentTask) {
			ctx.fillStyle = "#00ffff";
			const taskName = gpu.currentTask.type.replace("-", " ").substr(0, 12);
			ctx.fillText(taskName, (x + 2) * charWidth, (y + 4) * charHeight);

			// Progress bar
			const progress = Math.floor(gpu.currentTask.progress / 10);
			ctx.fillStyle = "#444444";
			for (let i = 0; i < 10; i++) {
				ctx.fillText("░", (x + 2 + i) * charWidth, (y + 5) * charHeight);
			}
			ctx.fillStyle = "#00ff00";
			for (let i = 0; i < progress; i++) {
				ctx.fillText("█", (x + 2 + i) * charWidth, (y + 5) * charHeight);
			}
			ctx.fillStyle = "#ffffff";
			ctx.fillText(
				`${gpu.currentTask.progress.toFixed(0)}%`,
				(x + 13) * charWidth,
				(y + 5) * charHeight,
			);
		} else {
			ctx.fillStyle = "#666666";
			ctx.fillText("idle", (x + 2) * charWidth, (y + 4) * charHeight);
		}

		// Bottom border
		ctx.fillStyle = statusColor;
		ctx.fillText("│", x * charWidth, (y + 5) * charHeight);
		ctx.fillText("│", (x + 18) * charWidth, (y + 5) * charHeight);
		ctx.fillText("╰─────────────────╯", x * charWidth, (y + 6) * charHeight);

		// Cooling visualization
		if (gpu.fanSpeed > 50) {
			const fanChars = ["◐", "◓", "◑", "◒"];
			const fanIndex =
				Math.floor(timeRef.current * (gpu.fanSpeed / 10)) % fanChars.length;
			ctx.fillStyle = "#00aaff";
			ctx.fillText(
				fanChars[fanIndex],
				(x + 17) * charWidth,
				(y + 5) * charHeight,
			);
		}
	};

	const drawTaskQueue = (
		ctx: CanvasRenderingContext2D,
		charWidth: number,
		charHeight: number,
	) => {
		const queue = taskQueueRef.current;
		const x = 5;
		let y = 27;

		ctx.fillStyle = "#ffffff";
		ctx.fillText("TASK QUEUE", x * charWidth, y * charHeight);
		y++;

		ctx.fillStyle = "#888888";
		ctx.fillText("─".repeat(30), x * charWidth, y * charHeight);
		y++;

		// Waiting tasks
		ctx.fillStyle = "#ffaa00";
		ctx.fillText(
			`Waiting (${queue.waiting.length}):`,
			x * charWidth,
			y * charHeight,
		);
		y++;

		queue.waiting.slice(0, 3).forEach((task) => {
			ctx.fillStyle = "#666666";
			const priorityColor =
				task.priority === "critical"
					? "#ff0000"
					: task.priority === "high"
						? "#ffaa00"
						: task.priority === "normal"
							? "#00ff00"
							: "#888888";
			ctx.fillStyle = priorityColor;
			ctx.fillText(
				`• ${task.type} [${task.priority}]`,
				(x + 1) * charWidth,
				y * charHeight,
			);
			y++;
		});

		if (queue.waiting.length > 3) {
			ctx.fillStyle = "#666666";
			ctx.fillText(
				`... +${queue.waiting.length - 3} more`,
				(x + 1) * charWidth,
				y * charHeight,
			);
			y++;
		}

		y++;

		// Running tasks
		ctx.fillStyle = "#00ff00";
		ctx.fillText(
			`Running (${queue.running.length}):`,
			x * charWidth,
			y * charHeight,
		);
		y++;

		queue.running.slice(0, 3).forEach((task) => {
			ctx.fillStyle = "#00ffff";
			ctx.fillText(
				`• ${task.type} ${task.progress.toFixed(0)}%`,
				(x + 1) * charWidth,
				y * charHeight,
			);
			y++;
		});
	};

	const animate = () => {
		if (!isRunningRef.current) return;

		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		timeRef.current += 0.016;

		// Clear canvas
		ctx.fillStyle = "#000000";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		const charWidth = 8;
		const charHeight = 16;
		ctx.font = "12px monospace";

		// Title
		ctx.fillStyle = "#ffffff";
		ctx.fillText("GPU Compute Farm Dashboard", 10, 20);
		ctx.fillText(
			"════════════════════════════════════════════════════════════════",
			10,
			35,
		);

		const gpus = gpusRef.current;
		const queue = taskQueueRef.current;

		// Generate new tasks
		if (Math.random() < 0.02 && queue.waiting.length < 10) {
			queue.waiting.push(createTask());
		}

		// Assign tasks to idle GPUs
		const idleGPUs = gpus.filter((gpu) => gpu.status === "idle");
		if (idleGPUs.length > 0 && queue.waiting.length > 0) {
			// Sort by priority
			queue.waiting.sort((a, b) => {
				const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
				return priorityOrder[b.priority] - priorityOrder[a.priority];
			});

			const gpu = idleGPUs[0];
			const task = queue.waiting[0];
			assignTaskToGPU(gpu, task);
		}

		// Update GPUs
		gpus.forEach((gpu) => updateGPU(gpu, 0.016));

		// Draw GPUs
		gpus.forEach((gpu) => drawGPU(ctx, gpu, charWidth, charHeight));

		// Draw task queue
		drawTaskQueue(ctx, charWidth, charHeight);

		// Update metrics
		const totalTasks =
			queue.waiting.length + queue.running.length + queue.completed.length;
		const avgTemp =
			gpus.reduce((sum, gpu) => sum + gpu.temperature, 0) / gpus.length;
		const totalPower = gpus.reduce((sum, gpu) => sum + gpu.powerDraw, 0);
		const avgUtil =
			gpus.reduce((sum, gpu) => sum + gpu.utilization, 0) / gpus.length;

		setMetrics({
			totalTasks,
			runningTasks: queue.running.length,
			completedTasks: queue.completed.length,
			avgTemperature: avgTemp,
			totalPowerDraw: totalPower,
			avgUtilization: avgUtil,
		});

		animationRef.current = requestAnimationFrame(animate);
	};

	const startAnimation = () => {
		setIsRunning(true);
		isRunningRef.current = true;
		animate();
	};

	const stopAnimation = () => {
		setIsRunning(false);
		isRunningRef.current = false;
		if (animationRef.current) {
			cancelAnimationFrame(animationRef.current);
		}
	};

	useEffect(() => {
		startAnimation();
		return () => stopAnimation();
	}, []);

	return (
		<div className="p-6 max-w-6xl mx-auto">
			<div className="mb-6">
				<h1 className="text-3xl font-bold mb-2">GPU Compute Farm</h1>
				<p className="text-gray-600">
					Real-time monitoring of GPU cluster computing various workloads
					including ML training, AI inference, rendering, and simulations with
					thermal management.
				</p>
			</div>

			<div className="mb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
				<div className="bg-blue-100 p-3 rounded">
					<div className="text-sm text-gray-600">Running Tasks</div>
					<div className="text-2xl font-bold text-blue-600">
						{metrics.runningTasks}
					</div>
				</div>
				<div className="bg-green-100 p-3 rounded">
					<div className="text-sm text-gray-600">Completed</div>
					<div className="text-2xl font-bold text-green-600">
						{metrics.completedTasks}
					</div>
				</div>
				<div className="bg-purple-100 p-3 rounded">
					<div className="text-sm text-gray-600">Avg Temp</div>
					<div className="text-2xl font-bold text-purple-600">
						{metrics.avgTemperature.toFixed(0)}°C
					</div>
				</div>
				<div className="bg-red-100 p-3 rounded">
					<div className="text-sm text-gray-600">Total Power</div>
					<div className="text-2xl font-bold text-red-600">
						{metrics.totalPowerDraw.toFixed(0)}W
					</div>
				</div>
				<div className="bg-yellow-100 p-3 rounded">
					<div className="text-sm text-gray-600">Avg Util</div>
					<div className="text-2xl font-bold text-yellow-600">
						{metrics.avgUtilization.toFixed(0)}%
					</div>
				</div>
				<div className="bg-gray-100 p-3 rounded">
					<div className="text-sm text-gray-600">Total Tasks</div>
					<div className="text-2xl font-bold">{metrics.totalTasks}</div>
				</div>
			</div>

			<div className="mb-4">
				<button
					onClick={isRunning ? stopAnimation : startAnimation}
					className={`px-4 py-2 rounded ${
						isRunning
							? "bg-red-500 hover:bg-red-600 text-white"
							: "bg-green-500 hover:bg-green-600 text-white"
					}`}
				>
					{isRunning ? "Stop" : "Start"} Farm
				</button>
			</div>

			<div className="border rounded-lg p-4 bg-black">
				<canvas
					ref={canvasRef}
					width={800}
					height={600}
					className="block"
					style={{
						width: "100%",
						height: "auto",
						maxWidth: "100%",
						imageRendering: "pixelated",
					}}
				/>
			</div>

			<div className="mt-4 text-sm text-gray-600">
				<h3 className="font-semibold mb-2">Legend:</h3>
				<div className="grid grid-cols-2 gap-2">
					<div>○ Idle GPU</div>
					<div>● Computing</div>
					<div>◐ Throttling</div>
					<div>✗ Error/Overheating</div>
					<div>Progress bars show task completion</div>
					<div>Fan symbols indicate cooling activity</div>
				</div>
			</div>
		</div>
	);
}
