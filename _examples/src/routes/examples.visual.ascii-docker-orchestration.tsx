import { createFileRoute } from "@tanstack/react-router";
import { clamp, cos, lerp, sin } from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute(
	"/examples/visual/ascii-docker-orchestration",
)({
	component: DockerOrchestrationDemo,
});

interface Container {
	id: string;
	name: string;
	status: "starting" | "running" | "stopping" | "stopped";
	cpu: number;
	memory: number;
	x: number;
	y: number;
	health: "healthy" | "warning" | "critical";
	uptime: number;
}

interface Node {
	id: string;
	name: string;
	containers: Container[];
	cpu: number;
	memory: number;
	status: "active" | "draining" | "down";
}

function DockerOrchestrationDemo() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const isRunningRef = useRef(false);
	const timeRef = useRef(0);
	const [isRunning, setIsRunning] = useState(false);
	const [metrics, setMetrics] = useState({
		totalContainers: 0,
		runningContainers: 0,
		totalNodes: 0,
		activeNodes: 0,
	});

	const nodesRef = useRef<Node[]>([
		{
			id: "node-1",
			name: "worker-01",
			containers: [],
			cpu: 0,
			memory: 0,
			status: "active",
		},
		{
			id: "node-2",
			name: "worker-02",
			containers: [],
			cpu: 0,
			memory: 0,
			status: "active",
		},
		{
			id: "node-3",
			name: "worker-03",
			containers: [],
			cpu: 0,
			memory: 0,
			status: "active",
		},
	]);

	const createContainer = (nodeIndex: number): Container => {
		const services = ["nginx", "redis", "postgres", "api", "worker", "cache"];
		const service = services[Math.floor(Math.random() * services.length)];
		const id = Math.random().toString(36).substr(2, 8);

		return {
			id,
			name: `${service}-${id}`,
			status: "starting",
			cpu: Math.random() * 50,
			memory: Math.random() * 80,
			x: 10 + nodeIndex * 25,
			y: 8 + Math.floor(Math.random() * 10),
			health: "healthy",
			uptime: 0,
		};
	};

	const updateContainerStatus = (container: Container, deltaTime: number) => {
		container.uptime += deltaTime;

		// Lifecycle management
		if (container.status === "starting" && container.uptime > 2) {
			container.status = "running";
		}

		// Random events
		if (Math.random() < 0.001) {
			if (container.status === "running") {
				container.status = "stopping";
			}
		}

		if (container.status === "stopping" && container.uptime > 5) {
			container.status = "stopped";
		}

		// Health monitoring
		if (container.cpu > 80 || container.memory > 90) {
			container.health = "critical";
		} else if (container.cpu > 60 || container.memory > 70) {
			container.health = "warning";
		} else {
			container.health = "healthy";
		}

		// CPU and memory fluctuation
		container.cpu = clamp(container.cpu + (Math.random() - 0.5) * 10, 0, 100);
		container.memory = clamp(
			container.memory + (Math.random() - 0.5) * 5,
			0,
			100,
		);
	};

	const drawContainer = (
		ctx: CanvasRenderingContext2D,
		container: Container,
		charWidth: number,
		charHeight: number,
	) => {
		const x = container.x * charWidth;
		const y = container.y * charHeight;

		let symbol = "□";
		let color = "#00ff00";

		switch (container.status) {
			case "starting":
				symbol = "◯";
				color = "#ffff00";
				break;
			case "running":
				symbol = "■";
				color =
					container.health === "healthy"
						? "#00ff00"
						: container.health === "warning"
							? "#ff8800"
							: "#ff0000";
				break;
			case "stopping":
				symbol = "◐";
				color = "#ff8800";
				break;
			case "stopped":
				symbol = "□";
				color = "#666666";
				break;
		}

		ctx.fillStyle = color;
		ctx.fillText(symbol, x, y);

		// Show resource usage as bars
		if (container.status === "running") {
			const cpuBar = Math.floor(container.cpu / 10);
			const memBar = Math.floor(container.memory / 10);

			ctx.fillStyle = "#444444";
			for (let i = 0; i < 10; i++) {
				ctx.fillText("_", x + (i + 1) * charWidth, y + charHeight);
				ctx.fillText("_", x + (i + 1) * charWidth, y + charHeight * 2);
			}

			ctx.fillStyle = container.cpu > 80 ? "#ff0000" : "#00ff00";
			for (let i = 0; i < cpuBar; i++) {
				ctx.fillText("█", x + (i + 1) * charWidth, y + charHeight);
			}

			ctx.fillStyle = container.memory > 90 ? "#ff0000" : "#0088ff";
			for (let i = 0; i < memBar; i++) {
				ctx.fillText("█", x + (i + 1) * charWidth, y + charHeight * 2);
			}
		}
	};

	const drawNode = (
		ctx: CanvasRenderingContext2D,
		node: Node,
		index: number,
		charWidth: number,
		charHeight: number,
	) => {
		const x = 5 + index * 25;
		const y = 3;

		// Node header
		ctx.fillStyle =
			node.status === "active"
				? "#00ff00"
				: node.status === "draining"
					? "#ffff00"
					: "#ff0000";
		ctx.fillText(`╭─ ${node.name} ─╮`, x * charWidth, y * charHeight);

		// Node stats
		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			`│ CPU: ${node.cpu.toFixed(1)}%`,
			x * charWidth,
			(y + 1) * charHeight,
		);
		ctx.fillText(
			`│ MEM: ${node.memory.toFixed(1)}%`,
			x * charWidth,
			(y + 2) * charHeight,
		);
		ctx.fillText(
			`│ CNT: ${node.containers.filter((c) => c.status === "running").length}`,
			x * charWidth,
			(y + 3) * charHeight,
		);
		ctx.fillText("╰─────────────╯", x * charWidth, (y + 4) * charHeight);

		// Container area
		ctx.fillStyle = "#333333";
		for (let i = 0; i < 15; i++) {
			for (let j = 0; j < 12; j++) {
				ctx.fillText("·", (x + i) * charWidth, (y + 6 + j) * charHeight);
			}
		}
	};

	const drawNetworkTraffic = (
		ctx: CanvasRenderingContext2D,
		time: number,
		charWidth: number,
		charHeight: number,
	) => {
		const nodes = nodesRef.current;

		for (let i = 0; i < nodes.length - 1; i++) {
			const fromX = 12 + i * 25;
			const toX = 12 + (i + 1) * 25;
			const y = 20;

			// Animated data flow
			const flow = Math.floor(time * 2) % (toX - fromX);
			const char = Math.random() > 0.5 ? "→" : "⟶";

			ctx.fillStyle = "#00ffff";
			ctx.fillText(char, (fromX + flow) * charWidth, y * charHeight);

			// Connection line
			ctx.fillStyle = "#444444";
			for (let x = fromX; x < toX; x++) {
				if (x !== fromX + flow) {
					ctx.fillText("─", x * charWidth, y * charHeight);
				}
			}
		}
	};

	const animate = () => {
		if (!isRunningRef.current) return;

		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		timeRef.current += 0.016;
		const time = timeRef.current;

		// Clear canvas
		ctx.fillStyle = "#000000";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		const charWidth = 8;
		const charHeight = 16;
		ctx.font = "12px monospace";

		// Title
		ctx.fillStyle = "#ffffff";
		ctx.fillText("Docker Swarm Orchestration Dashboard", 10, 20);
		ctx.fillText("════════════════════════════════════", 10, 35);

		const nodes = nodesRef.current;

		// Update and draw nodes
		nodes.forEach((node, index) => {
			// Update node metrics
			node.cpu = 0;
			node.memory = 0;
			let runningContainers = 0;

			// Container lifecycle management
			if (Math.random() < 0.01 && node.containers.length < 8) {
				node.containers.push(createContainer(index));
			}

			// Update containers
			node.containers = node.containers.filter((container) => {
				updateContainerStatus(container, 0.016);

				if (container.status === "running") {
					runningContainers++;
					node.cpu += container.cpu;
					node.memory += container.memory;
				}

				return container.status !== "stopped" || container.uptime < 6;
			});

			if (runningContainers > 0) {
				node.cpu /= runningContainers;
				node.memory /= runningContainers;
			}

			drawNode(ctx, node, index, charWidth, charHeight);

			// Draw containers
			node.containers.forEach((container) => {
				drawContainer(ctx, container, charWidth, charHeight);
			});
		});

		// Draw network traffic
		drawNetworkTraffic(ctx, time, charWidth, charHeight);

		// Update metrics
		const totalContainers = nodes.reduce(
			(sum, node) => sum + node.containers.length,
			0,
		);
		const runningContainers = nodes.reduce(
			(sum, node) =>
				sum + node.containers.filter((c) => c.status === "running").length,
			0,
		);

		setMetrics({
			totalContainers,
			runningContainers,
			totalNodes: nodes.length,
			activeNodes: nodes.filter((n) => n.status === "active").length,
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
		<div className="p-6 max-w-4xl mx-auto">
			<div className="mb-6">
				<h1 className="text-3xl font-bold mb-2">Docker Swarm Orchestration</h1>
				<p className="text-gray-600">
					Real-time visualization of container orchestration, showing nodes,
					containers, resource usage, and network traffic in a Docker Swarm
					cluster.
				</p>
			</div>

			<div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
				<div className="bg-gray-100 p-3 rounded">
					<div className="text-sm text-gray-600">Total Containers</div>
					<div className="text-2xl font-bold">{metrics.totalContainers}</div>
				</div>
				<div className="bg-green-100 p-3 rounded">
					<div className="text-sm text-gray-600">Running</div>
					<div className="text-2xl font-bold text-green-600">
						{metrics.runningContainers}
					</div>
				</div>
				<div className="bg-blue-100 p-3 rounded">
					<div className="text-sm text-gray-600">Active Nodes</div>
					<div className="text-2xl font-bold text-blue-600">
						{metrics.activeNodes}
					</div>
				</div>
				<div className="bg-purple-100 p-3 rounded">
					<div className="text-sm text-gray-600">Total Nodes</div>
					<div className="text-2xl font-bold text-purple-600">
						{metrics.totalNodes}
					</div>
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
					{isRunning ? "Stop" : "Start"} Orchestration
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
					<div>■ Running container</div>
					<div>◯ Starting container</div>
					<div>◐ Stopping container</div>
					<div>□ Stopped container</div>
					<div>Green bars: CPU usage</div>
					<div>Blue bars: Memory usage</div>
				</div>
			</div>
		</div>
	);
}
