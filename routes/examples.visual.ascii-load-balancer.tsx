import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/visual/ascii-load-balancer")({
	component: LoadBalancerExample,
});

interface Server {
	id: number;
	load: number;
	status: "healthy" | "overloaded" | "down";
	activeConnections: number;
}

interface Request {
	id: number;
	x: number;
	y: number;
	targetServer: number;
	progress: number;
	type: "api" | "static" | "db";
}

function LoadBalancerExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const [isRunning, setIsRunning] = useState(false);
	const isRunningRef = useRef(false);

	const serversRef = useRef<Server[]>([
		{ id: 1, load: 0, status: "healthy", activeConnections: 0 },
		{ id: 2, load: 0, status: "healthy", activeConnections: 0 },
		{ id: 3, load: 0, status: "healthy", activeConnections: 0 },
		{ id: 4, load: 0, status: "healthy", activeConnections: 0 },
	]);

	const requestsRef = useRef<Request[]>([]);
	const nextRequestIdRef = useRef(1);
	const lastSpawnTimeRef = useRef(0);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		canvas.width = 800;
		canvas.height = 600;
		ctx.font = "12px monospace";

		const animate = (timestamp: number) => {
			if (!isRunningRef.current) return;

			// Spawn new requests
			if (timestamp - lastSpawnTimeRef.current > 200 + Math.random() * 300) {
				spawnRequest();
				lastSpawnTimeRef.current = timestamp;
			}

			// Update requests
			updateRequests();

			// Update server loads
			updateServerLoads();

			// Render
			render(ctx);

			animationRef.current = requestAnimationFrame(animate);
		};

		if (isRunningRef.current) {
			animationRef.current = requestAnimationFrame(animate);
		}

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [isRunning]);

	const spawnRequest = () => {
		const requestTypes: Array<"api" | "static" | "db"> = [
			"api",
			"static",
			"db",
		];
		const type = requestTypes[Math.floor(Math.random() * requestTypes.length)];

		// Load balancing algorithm - round robin with health checks
		const healthyServers = serversRef.current.filter(
			(s) => s.status === "healthy",
		);
		if (healthyServers.length === 0) return;

		const targetServer = healthyServers.reduce((prev, curr) =>
			prev.load < curr.load ? prev : curr,
		).id;

		const newRequest: Request = {
			id: nextRequestIdRef.current++,
			x: 50,
			y: 200 + Math.random() * 200,
			targetServer,
			progress: 0,
			type,
		};

		requestsRef.current.push(newRequest);
	};

	const updateRequests = () => {
		requestsRef.current = requestsRef.current.filter((request) => {
			request.progress += 0.02;
			request.x = 50 + 600 * request.progress;

			if (request.progress >= 1) {
				// Request completed
				const server = serversRef.current.find(
					(s) => s.id === request.targetServer,
				);
				if (server) {
					server.activeConnections = Math.max(0, server.activeConnections - 1);
				}
				return false;
			}

			// Update server connections when request reaches server
			if (request.progress > 0.8 && request.progress < 0.85) {
				const server = serversRef.current.find(
					(s) => s.id === request.targetServer,
				);
				if (server) {
					server.activeConnections++;
				}
			}

			return true;
		});
	};

	const updateServerLoads = () => {
		serversRef.current.forEach((server) => {
			// Calculate load based on active connections
			server.load = Math.min(
				100,
				server.activeConnections * 15 + Math.random() * 10,
			);

			// Update status based on load
			if (server.load > 80) {
				server.status = "overloaded";
			} else if (server.load > 60) {
				server.status = "healthy";
			} else {
				server.status = "healthy";
			}

			// Occasional random downtime
			if (Math.random() < 0.001) {
				server.status = "down";
				setTimeout(() => {
					if (serversRef.current.find((s) => s.id === server.id)) {
						server.status = "healthy";
						server.load = 0;
						server.activeConnections = 0;
					}
				}, 3000);
			}
		});
	};

	const render = (ctx: CanvasRenderingContext2D) => {
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, 800, 600);

		// Title
		ctx.fillStyle = "#00ff00";
		ctx.fillText(
			"ASCII Load Balancer - Real-time Traffic Distribution",
			20,
			30,
		);

		// Draw load balancer
		ctx.fillStyle = "#ffff00";
		ctx.fillText("┌─ LOAD BALANCER ─┐", 20, 80);
		ctx.fillText("│  Round Robin    │", 20, 100);
		ctx.fillText("│  Health Check   │", 20, 120);
		ctx.fillText("└─────────────────┘", 20, 140);

		// Draw servers
		serversRef.current.forEach((server, index) => {
			const x = 500;
			const y = 100 + index * 100;

			let color = "#00ff00"; // healthy
			if (server.status === "overloaded") color = "#ff8800";
			if (server.status === "down") color = "#ff0000";

			ctx.fillStyle = color;
			ctx.fillText(`┌─ SERVER ${server.id} ─┐`, x, y);
			ctx.fillText(`│ Load: ${server.load.toFixed(0)}%  │`, x, y + 20);
			ctx.fillText(
				`│ Conn: ${server.activeConnections.toString().padStart(2)}    │`,
				x,
				y + 40,
			);
			ctx.fillText(`│ ${server.status.toUpperCase().padEnd(9)} │`, x, y + 60);
			ctx.fillText("└─────────────┘", x, y + 80);

			// Load bar
			const barWidth = Math.floor(server.load / 10);
			const loadBar = "█".repeat(barWidth) + "░".repeat(10 - barWidth);
			ctx.fillText(`[${loadBar}]`, x + 150, y + 20);
		});

		// Draw requests in flight
		requestsRef.current.forEach((request) => {
			const colors = {
				api: "#00ffff",
				static: "#ff00ff",
				db: "#ffff00",
			};

			ctx.fillStyle = colors[request.type];
			const char =
				request.type === "api" ? "●" : request.type === "static" ? "◆" : "▲";
			ctx.fillText(char, request.x, request.y);

			// Draw connection line
			if (request.progress > 0.1) {
				const targetY = 120 + (request.targetServer - 1) * 100;
				ctx.strokeStyle = colors[request.type];
				ctx.setLineDash([2, 2]);
				ctx.beginPath();
				ctx.moveTo(request.x, request.y);
				ctx.lineTo(500, targetY);
				ctx.stroke();
				ctx.setLineDash([]);
			}
		});

		// Stats
		ctx.fillStyle = "#ffffff";
		const totalRequests = requestsRef.current.length;
		const totalLoad =
			serversRef.current.reduce((sum, s) => sum + s.load, 0) /
			serversRef.current.length;
		const healthyServers = serversRef.current.filter(
			(s) => s.status === "healthy",
		).length;

		ctx.fillText("─ METRICS ─", 20, 200);
		ctx.fillText(`Requests in flight: ${totalRequests}`, 20, 220);
		ctx.fillText(`Average load: ${totalLoad.toFixed(1)}%`, 20, 240);
		ctx.fillText(`Healthy servers: ${healthyServers}/4`, 20, 260);

		// Legend
		ctx.fillText("─ LEGEND ─", 20, 320);
		ctx.fillStyle = "#00ffff";
		ctx.fillText("● API Request", 20, 340);
		ctx.fillStyle = "#ff00ff";
		ctx.fillText("◆ Static File", 20, 360);
		ctx.fillStyle = "#ffff00";
		ctx.fillText("▲ Database Query", 20, 380);

		// Algorithm info
		ctx.fillStyle = "#888888";
		ctx.fillText("Algorithm: Least Connections with Health Checks", 20, 420);
		ctx.fillText("Health Check: Load > 80% = Overloaded", 20, 440);
		ctx.fillText("Failover: Routes around down servers", 20, 460);
	};

	const startAnimation = () => {
		setIsRunning(true);
		isRunningRef.current = true;
	};

	const stopAnimation = () => {
		setIsRunning(false);
		isRunningRef.current = false;
		if (animationRef.current) {
			cancelAnimationFrame(animationRef.current);
		}
	};

	const resetAnimation = () => {
		stopAnimation();
		serversRef.current.forEach((server) => {
			server.load = 0;
			server.status = "healthy";
			server.activeConnections = 0;
		});
		requestsRef.current = [];
		nextRequestIdRef.current = 1;
	};

	return (
		<div className="p-6 max-w-4xl mx-auto">
			<h1 className="text-3xl font-bold mb-4">ASCII Load Balancer</h1>
			<p className="text-gray-600 mb-6">
				Real-time visualization of load balancer distributing traffic across
				multiple servers using least-connections algorithm with health
				monitoring.
			</p>

			<div className="mb-4 space-x-2">
				<button
					onClick={startAnimation}
					disabled={isRunning}
					className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
				>
					Start Load Balancer
				</button>
				<button
					onClick={stopAnimation}
					disabled={!isRunning}
					className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-400"
				>
					Stop
				</button>
				<button
					onClick={resetAnimation}
					className="px-4 py-2 bg-blue-500 text-white rounded"
				>
					Reset
				</button>
			</div>

			<canvas
				ref={canvasRef}
				style={{
					border: "1px solid #ccc",
					backgroundColor: "#000",
					maxWidth: "100%",
					height: "auto",
				}}
			/>

			<div className="mt-4 text-sm text-gray-600">
				<p>
					<strong>Features:</strong>
				</p>
				<ul className="list-disc list-inside">
					<li>Least-connections load balancing algorithm</li>
					<li>Real-time health monitoring and status updates</li>
					<li>Automatic failover when servers are overloaded or down</li>
					<li>Different request types (API, Static, Database)</li>
					<li>Live metrics and performance indicators</li>
				</ul>
			</div>
		</div>
	);
}
