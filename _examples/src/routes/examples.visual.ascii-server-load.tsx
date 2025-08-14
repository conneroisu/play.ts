import { createFileRoute } from "@tanstack/react-router";
import { clamp, lerp } from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/visual/ascii-server-load")({
	component: ASCIIServerLoadExample,
});

interface ServerNode {
	id: string;
	name: string;
	cpu: number;
	memory: number;
	network: number;
	disk: number;
	temperature: number;
	uptime: number;
	x: number;
	y: number;
	status: "healthy" | "warning" | "critical" | "offline";
	connections: string[];
	load_history: number[];
	alert_flash: number;
}

interface NetworkPacket {
	id: string;
	from: string;
	to: string;
	progress: number;
	type: "data" | "request" | "response" | "error";
	size: number;
}

function ASCIIServerLoadExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>(0);
	const serversRef = useRef<Map<string, ServerNode>>(new Map());
	const packetsRef = useRef<NetworkPacket[]>([]);
	const [isPlaying, setIsPlaying] = useState(true);
	const [speed, setSpeed] = useState(1);
	const [alertLevel, setAlertLevel] = useState(0.7);
	const [displayMode, setDisplayMode] = useState("cpu");
	const [networkTraffic, setNetworkTraffic] = useState(0.5);
	const [colorScheme, setColorScheme] = useState("terminal");
	const [showConnections, setShowConnections] = useState(true);
	const [showMetrics, setShowMetrics] = useState(true);
	const [simulationMode, setSimulationMode] = useState("normal");

	const colorSchemes = {
		terminal: {
			bg: "#001100",
			text: "#33FF33",
			warning: "#FFAA00",
			critical: "#FF3333",
			network: "#00AAFF",
		},
		matrix: {
			bg: "#000000",
			text: "#00FF00",
			warning: "#FFFF00",
			critical: "#FF0000",
			network: "#0080FF",
		},
		amber: {
			bg: "#110800",
			text: "#FFAA00",
			warning: "#FF8800",
			critical: "#FF4400",
			network: "#00AAFF",
		},
		cyber: {
			bg: "#000022",
			text: "#00FFFF",
			warning: "#FF00FF",
			critical: "#FF4444",
			network: "#8800FF",
		},
		monochrome: {
			bg: "#000000",
			text: "#FFFFFF",
			warning: "#CCCCCC",
			critical: "#888888",
			network: "#666666",
		},
	};

	useEffect(() => {
		// Initialize servers
		const servers = new Map<string, ServerNode>();

		const serverConfigs = [
			{ name: "web-01", x: 10, y: 5, connections: ["lb-01", "db-01"] },
			{ name: "web-02", x: 10, y: 15, connections: ["lb-01", "db-01"] },
			{ name: "web-03", x: 10, y: 25, connections: ["lb-01", "db-02"] },
			{
				name: "lb-01",
				x: 30,
				y: 10,
				connections: ["web-01", "web-02", "web-03", "cache-01"],
			},
			{ name: "cache-01", x: 50, y: 8, connections: ["lb-01", "db-01"] },
			{ name: "cache-02", x: 50, y: 18, connections: ["db-01", "db-02"] },
			{
				name: "db-01",
				x: 70,
				y: 5,
				connections: ["web-01", "web-02", "cache-01", "backup-01"],
			},
			{
				name: "db-02",
				x: 70,
				y: 15,
				connections: ["web-03", "cache-02", "backup-01"],
			},
			{ name: "backup-01", x: 90, y: 10, connections: ["db-01", "db-02"] },
			{
				name: "mon-01",
				x: 30,
				y: 25,
				connections: ["web-01", "web-02", "web-03", "lb-01"],
			},
		];

		serverConfigs.forEach((config) => {
			servers.set(config.name, {
				id: config.name,
				name: config.name,
				cpu: Math.random() * 100,
				memory: Math.random() * 100,
				network: Math.random() * 100,
				disk: Math.random() * 100,
				temperature: 40 + Math.random() * 30,
				uptime: Math.random() * 10000,
				x: config.x,
				y: config.y,
				status: "healthy",
				connections: config.connections,
				load_history: Array(20)
					.fill(0)
					.map(() => Math.random() * 100),
				alert_flash: 0,
			});
		});

		serversRef.current = servers;
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const resizeCanvas = () => {
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
		};

		const updateServerMetrics = () => {
			const servers = serversRef.current;

			servers.forEach((server) => {
				// Simulate different load patterns based on server type
				let loadPattern = 0;
				const time = Date.now() / 1000;

				if (server.name.startsWith("web-")) {
					// Web servers have spiky traffic patterns
					loadPattern =
						30 +
						40 * Math.sin(time * 0.5) +
						20 * Math.sin(time * 2) +
						Math.random() * 20;
				} else if (server.name.startsWith("db-")) {
					// Database servers have more steady load with occasional spikes
					loadPattern =
						50 + 20 * Math.sin(time * 0.2) + (Math.random() < 0.1 ? 40 : 0);
				} else if (server.name.startsWith("cache-")) {
					// Cache servers have burst patterns
					loadPattern = 20 + 30 * Math.sin(time * 1.5) + Math.random() * 30;
				} else if (server.name.startsWith("lb-")) {
					// Load balancers have consistent moderate load
					loadPattern = 40 + 15 * Math.sin(time * 0.8) + Math.random() * 15;
				} else {
					// Other servers
					loadPattern = 25 + 25 * Math.sin(time * 0.3) + Math.random() * 25;
				}

				// Apply simulation mode effects
				if (simulationMode === "high-load") {
					loadPattern *= 1.5;
				} else if (simulationMode === "ddos-attack") {
					if (server.name.startsWith("web-") || server.name.startsWith("lb-")) {
						loadPattern = 80 + Math.random() * 20;
					}
				} else if (simulationMode === "db-overload") {
					if (server.name.startsWith("db-")) {
						loadPattern = 90 + Math.random() * 10;
					}
				}

				server.cpu = clamp(loadPattern + (Math.random() - 0.5) * 10, 0, 100);
				server.memory = clamp(
					server.memory + (Math.random() - 0.5) * 2,
					10,
					95,
				);
				server.network = clamp(
					server.network + (Math.random() - 0.5) * 5,
					0,
					100,
				);
				server.disk = clamp(server.disk + (Math.random() - 0.5) * 1, 5, 95);
				server.temperature = clamp(
					40 + server.cpu * 0.3 + (Math.random() - 0.5) * 5,
					35,
					85,
				);
				server.uptime += 1;

				// Update load history
				server.load_history.push(server.cpu);
				if (server.load_history.length > 20) {
					server.load_history.shift();
				}

				// Determine status
				const maxLoad = Math.max(server.cpu, server.memory, server.disk);
				if (maxLoad > 90) {
					server.status = "critical";
					server.alert_flash = Math.max(server.alert_flash, 10);
				} else if (maxLoad > alertLevel * 100) {
					server.status = "warning";
					server.alert_flash = Math.max(server.alert_flash, 5);
				} else {
					server.status = "healthy";
				}

				if (server.alert_flash > 0) {
					server.alert_flash--;
				}

				// Generate network packets
				if (
					Math.random() < networkTraffic * speed &&
					server.connections.length > 0
				) {
					const targetId =
						server.connections[
							Math.floor(Math.random() * server.connections.length)
						];
					const target = servers.get(targetId);

					if (target) {
						packetsRef.current.push({
							id: `${server.id}-${targetId}-${Date.now()}`,
							from: server.id,
							to: targetId,
							progress: 0,
							type:
								Math.random() < 0.1
									? "error"
									: Math.random() < 0.3
										? "request"
										: "data",
							size: Math.floor(Math.random() * 5) + 1,
						});
					}
				}
			});

			// Update network packets
			packetsRef.current = packetsRef.current.filter((packet) => {
				packet.progress += 0.02 * speed;
				return packet.progress < 1;
			});
		};

		const drawMetricBar = (
			x: number,
			y: number,
			value: number,
			max: number,
			label: string,
		) => {
			const barWidth = 12;
			const barHeight = 1;
			const percentage = value / max;

			// Background
			ctx.fillStyle =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text + "40";
			ctx.fillText("█".repeat(barWidth), x, y);

			// Filled portion
			const filled = Math.floor(percentage * barWidth);
			if (filled > 0) {
				let color = colorSchemes[colorScheme as keyof typeof colorSchemes].text;
				if (percentage > 0.9)
					color =
						colorSchemes[colorScheme as keyof typeof colorSchemes].critical;
				else if (percentage > alertLevel)
					color =
						colorSchemes[colorScheme as keyof typeof colorSchemes].warning;

				ctx.fillStyle = color;
				ctx.fillText("█".repeat(filled), x, y);
			}

			// Label and value
			ctx.fillStyle =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text;
			ctx.fillText(`${label}: ${value.toFixed(0)}%`, x + barWidth + 1, y);
		};

		const drawServer = (server: ServerNode) => {
			const fontSize = 12;
			const x = server.x;
			const y = server.y;

			// Server box
			let boxColor =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text;
			if (server.status === "critical") {
				boxColor =
					colorSchemes[colorScheme as keyof typeof colorSchemes].critical;
			} else if (server.status === "warning") {
				boxColor =
					colorSchemes[colorScheme as keyof typeof colorSchemes].warning;
			}

			// Flash effect for alerts
			if (server.alert_flash > 0 && server.alert_flash % 4 < 2) {
				ctx.fillStyle = server.status === "critical" ? "#FF0000" : "#FFAA00";
			} else {
				ctx.fillStyle = boxColor;
			}

			// Draw server representation
			const serverArt = [
				"┌─────────┐",
				"│ ███████ │",
				"│ ███████ │",
				"│ ○ ○ ○ ○ │",
				"└─────────┘",
			];

			serverArt.forEach((line, i) => {
				ctx.fillText(line, x * fontSize, (y + i) * fontSize);
			});

			// Server name
			ctx.fillStyle =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text;
			ctx.fillText(server.name, x * fontSize, (y - 1) * fontSize);

			// Status indicator
			const statusChar =
				server.status === "healthy"
					? "●"
					: server.status === "warning"
						? "▲"
						: "✕";
			ctx.fillStyle = boxColor;
			ctx.fillText(statusChar, (x + 12) * fontSize, (y - 1) * fontSize);

			// Metrics display
			if (showMetrics) {
				const metricY = y + 6;
				let displayValue = 0;
				let displayLabel = "";

				switch (displayMode) {
					case "cpu":
						displayValue = server.cpu;
						displayLabel = "CPU";
						break;
					case "memory":
						displayValue = server.memory;
						displayLabel = "MEM";
						break;
					case "network":
						displayValue = server.network;
						displayLabel = "NET";
						break;
					case "disk":
						displayValue = server.disk;
						displayLabel = "DSK";
						break;
					case "temperature":
						displayValue = server.temperature;
						displayLabel = "TMP";
						break;
				}

				drawMetricBar(
					(x + 1) * fontSize,
					metricY * fontSize,
					displayValue,
					displayMode === "temperature" ? 100 : 100,
					displayLabel,
				);

				// Load history graph
				if (displayMode === "cpu") {
					const graphY = metricY + 2;
					server.load_history.forEach((load, i) => {
						const graphX = x + 1 + i;
						const height = Math.floor((load / 100) * 3);
						ctx.fillStyle =
							load > 80
								? colorSchemes[colorScheme as keyof typeof colorSchemes]
										.critical
								: load > 60
									? colorSchemes[colorScheme as keyof typeof colorSchemes]
											.warning
									: colorSchemes[colorScheme as keyof typeof colorSchemes].text;

						for (let h = 0; h < height; h++) {
							ctx.fillText("▌", graphX * fontSize, (graphY + 2 - h) * fontSize);
						}
					});
				}
			}
		};

		const drawConnections = () => {
			if (!showConnections) return;

			const servers = serversRef.current;
			const fontSize = 12;

			servers.forEach((server) => {
				server.connections.forEach((targetId) => {
					const target = servers.get(targetId);
					if (!target) return;

					const x1 = (server.x + 5) * fontSize;
					const y1 = (server.y + 2) * fontSize;
					const x2 = (target.x + 5) * fontSize;
					const y2 = (target.y + 2) * fontSize;

					// Draw connection line
					ctx.strokeStyle =
						colorSchemes[colorScheme as keyof typeof colorSchemes].network +
						"60";
					ctx.lineWidth = 1;
					ctx.setLineDash([2, 2]);
					ctx.beginPath();
					ctx.moveTo(x1, y1);
					ctx.lineTo(x2, y2);
					ctx.stroke();
					ctx.setLineDash([]);
				});
			});

			// Draw network packets
			packetsRef.current.forEach((packet) => {
				const fromServer = servers.get(packet.from);
				const toServer = servers.get(packet.to);
				if (!fromServer || !toServer) return;

				const x1 = (fromServer.x + 5) * fontSize;
				const y1 = (fromServer.y + 2) * fontSize;
				const x2 = (toServer.x + 5) * fontSize;
				const y2 = (toServer.y + 2) * fontSize;

				const x = lerp(x1, x2, packet.progress);
				const y = lerp(y1, y2, packet.progress);

				let packetColor =
					colorSchemes[colorScheme as keyof typeof colorSchemes].network;
				if (packet.type === "error")
					packetColor =
						colorSchemes[colorScheme as keyof typeof colorSchemes].critical;
				else if (packet.type === "request")
					packetColor =
						colorSchemes[colorScheme as keyof typeof colorSchemes].warning;

				ctx.fillStyle = packetColor;
				ctx.fillText("●", x, y);
			});
		};

		const animate = () => {
			if (!isPlaying) return;

			const currentScheme =
				colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Clear canvas
			ctx.fillStyle = currentScheme.bg;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			ctx.font = '12px "Courier New", monospace';
			ctx.textBaseline = "top";

			// Update metrics every few frames
			if (Math.random() < 0.1 * speed) {
				updateServerMetrics();
			}

			// Draw connections first (behind servers)
			drawConnections();

			// Draw servers
			serversRef.current.forEach((server) => {
				drawServer(server);
			});

			// Draw network statistics
			const totalLoad =
				Array.from(serversRef.current.values()).reduce(
					(sum, s) => sum + s.cpu,
					0,
				) / serversRef.current.size;
			const criticalServers = Array.from(serversRef.current.values()).filter(
				(s) => s.status === "critical",
			).length;
			const warningServers = Array.from(serversRef.current.values()).filter(
				(s) => s.status === "warning",
			).length;

			ctx.fillStyle =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text;
			ctx.fillText(`Infrastructure Status Dashboard`, 10, canvas.height - 80);
			ctx.fillText(
				`Average Load: ${totalLoad.toFixed(1)}%`,
				10,
				canvas.height - 65,
			);
			ctx.fillText(
				`Critical: ${criticalServers} | Warning: ${warningServers} | Healthy: ${serversRef.current.size - criticalServers - warningServers}`,
				10,
				canvas.height - 50,
			);
			ctx.fillText(
				`Network Packets: ${packetsRef.current.length} | Mode: ${simulationMode}`,
				10,
				canvas.height - 35,
			);
			ctx.fillText(
				`Display: ${displayMode.toUpperCase()} | Traffic: ${(networkTraffic * 100).toFixed(0)}%`,
				10,
				canvas.height - 20,
			);

			animationRef.current = requestAnimationFrame(animate);
		};

		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);

		if (isPlaying) {
			animate();
		}

		return () => {
			window.removeEventListener("resize", resizeCanvas);
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [
		isPlaying,
		speed,
		alertLevel,
		displayMode,
		networkTraffic,
		colorScheme,
		showConnections,
		showMetrics,
		simulationMode,
	]);

	return (
		<div className="flex flex-col h-screen bg-black">
			<div className="flex-shrink-0 bg-gray-900 p-4 border-b border-gray-700">
				<h1 className="text-2xl font-bold text-green-400 mb-4">
					🖥️ ASCII Server Load Monitor
				</h1>

				<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-sm mb-4">
					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Animation</label>
						<button
							onClick={() => setIsPlaying(!isPlaying)}
							className={`px-3 py-2 rounded font-medium transition-colors ${
								isPlaying
									? "bg-red-600 hover:bg-red-700 text-white"
									: "bg-green-600 hover:bg-green-700 text-white"
							}`}
						>
							{isPlaying ? "Pause" : "Play"}
						</button>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">
							Speed: {speed.toFixed(1)}x
						</label>
						<input
							type="range"
							min="0.1"
							max="3"
							step="0.1"
							value={speed}
							onChange={(e) => setSpeed(Number.parseFloat(e.target.value))}
							className="w-full"
						/>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">
							Alert Level: {Math.round(alertLevel * 100)}%
						</label>
						<input
							type="range"
							min="0.5"
							max="0.9"
							step="0.05"
							value={alertLevel}
							onChange={(e) => setAlertLevel(Number.parseFloat(e.target.value))}
							className="w-full"
						/>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Display Mode</label>
						<select
							value={displayMode}
							onChange={(e) => setDisplayMode(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-green-300 rounded border border-gray-600"
						>
							<option value="cpu">CPU Usage</option>
							<option value="memory">Memory</option>
							<option value="network">Network</option>
							<option value="disk">Disk I/O</option>
							<option value="temperature">Temperature</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">
							Network Traffic: {Math.round(networkTraffic * 100)}%
						</label>
						<input
							type="range"
							min="0"
							max="1"
							step="0.1"
							value={networkTraffic}
							onChange={(e) =>
								setNetworkTraffic(Number.parseFloat(e.target.value))
							}
							className="w-full"
						/>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Color Scheme</label>
						<select
							value={colorScheme}
							onChange={(e) => setColorScheme(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-green-300 rounded border border-gray-600"
						>
							<option value="terminal">Terminal Green</option>
							<option value="matrix">Matrix</option>
							<option value="amber">Amber</option>
							<option value="cyber">Cyberpunk</option>
							<option value="monochrome">Monochrome</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Simulation</label>
						<select
							value={simulationMode}
							onChange={(e) => setSimulationMode(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-green-300 rounded border border-gray-600"
						>
							<option value="normal">Normal Load</option>
							<option value="high-load">High Load</option>
							<option value="ddos-attack">DDoS Attack</option>
							<option value="db-overload">DB Overload</option>
						</select>
					</div>

					<div className="flex flex-col gap-2">
						<label className="flex items-center text-green-300 text-xs">
							<input
								type="checkbox"
								checked={showConnections}
								onChange={(e) => setShowConnections(e.target.checked)}
								className="mr-1"
							/>
							Connections
						</label>
						<label className="flex items-center text-green-300 text-xs">
							<input
								type="checkbox"
								checked={showMetrics}
								onChange={(e) => setShowMetrics(e.target.checked)}
								className="mr-1"
							/>
							Metrics
						</label>
					</div>
				</div>

				<div className="mt-4 text-green-400 text-sm">
					<p>
						🖥️ <strong>Real-time server monitoring</strong> with load
						visualization and network packet flow!
					</p>
					<p>
						📊 <strong>Switch display modes</strong> to view CPU, memory, disk,
						network, and temperature metrics!
					</p>
					<p>
						⚠️ <strong>Alert system</strong> automatically highlights servers
						exceeding load thresholds!
					</p>
					<p>
						Simulate different infrastructure scenarios including DDoS attacks
						and database overloads
					</p>
				</div>
			</div>

			<div className="flex-1 relative">
				<canvas
					ref={canvasRef}
					className="absolute inset-0 w-full h-full"
					style={{
						background:
							colorSchemes[colorScheme as keyof typeof colorSchemes].bg,
					}}
				/>
			</div>
		</div>
	);
}
