import { clamp, cos, lerp, sin } from "play.ts";
import { useEffect, useRef, useState } from "react";

interface ServerNode {
	id: string;
	name: string;
	x: number;
	y: number;
	load: number;
	health: number;
	response_time: number;
	connections: number;
	status: "healthy" | "degraded" | "overloaded" | "down";
	queue_size: number;
	max_connections: number;
	alert_flash: number;
}

interface LoadBalancer {
	id: string;
	x: number;
	y: number;
	algorithm: "round_robin" | "least_connections" | "weighted" | "health_based";
	total_requests: number;
	requests_per_second: number;
	failed_requests: number;
	active_connections: number;
	status: "active" | "failover" | "maintenance";
}

interface TrafficPacket {
	id: string;
	source_x: number;
	source_y: number;
	target_x: number;
	target_y: number;
	current_x: number;
	current_y: number;
	progress: number;
	type: "request" | "response" | "health_check" | "error";
	size: number;
	server_id?: string;
}

interface Client {
	id: string;
	x: number;
	y: number;
	request_rate: number;
	is_active: boolean;
	type: "web" | "mobile" | "api" | "bot";
}

export default function AsciiLoadBalancerTrafficExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>(0);
	const serversRef = useRef<Map<string, ServerNode>>(new Map());
	const loadBalancersRef = useRef<LoadBalancer[]>([]);
	const packetsRef = useRef<TrafficPacket[]>([]);
	const clientsRef = useRef<Client[]>([]);
	const [isPlaying, setIsPlaying] = useState(true);
	const [speed, setSpeed] = useState(1);
	const [trafficIntensity, setTrafficIntensity] = useState(0.5);
	const [colorScheme, setColorScheme] = useState("network");
	const [displayMode, setDisplayMode] = useState("load");
	const [loadBalancingAlgorithm, setLoadBalancingAlgorithm] =
		useState("round_robin");
	const [showHealthChecks, setShowHealthChecks] = useState(true);
	const [simulationMode, setSimulationMode] = useState("normal");

	const colorSchemes = {
		network: {
			bg: "#001122",
			text: "#00CCFF",
			load: "#FFAA00",
			error: "#FF4444",
			success: "#44FF44",
			data: "#8844FF",
		},
		traffic: {
			bg: "#110011",
			text: "#FFFFFF",
			load: "#FF8800",
			error: "#FF0000",
			success: "#00FF00",
			data: "#0088FF",
		},
		neon: {
			bg: "#000000",
			text: "#00FFFF",
			load: "#FF00FF",
			error: "#FF4040",
			success: "#40FF40",
			data: "#4040FF",
		},
		classic: {
			bg: "#000011",
			text: "#00FF00",
			load: "#FFFF00",
			error: "#FF0000",
			success: "#00AA00",
			data: "#0000FF",
		},
	};

	useEffect(() => {
		// Initialize servers
		const servers = new Map<string, ServerNode>();

		const serverConfigs = [
			{ name: "WEB-01", x: 70, y: 8 },
			{ name: "WEB-02", x: 70, y: 15 },
			{ name: "WEB-03", x: 70, y: 22 },
			{ name: "WEB-04", x: 70, y: 29 },
			{ name: "API-01", x: 85, y: 12 },
			{ name: "API-02", x: 85, y: 20 },
		];

		serverConfigs.forEach((config) => {
			servers.set(config.name, {
				id: config.name,
				name: config.name,
				x: config.x,
				y: config.y,
				load: Math.random() * 50,
				health: 0.8 + Math.random() * 0.2,
				response_time: 50 + Math.random() * 100,
				connections: Math.floor(Math.random() * 20),
				status: "healthy",
				queue_size: 0,
				max_connections: 50 + Math.floor(Math.random() * 50),
				alert_flash: 0,
			});
		});

		serversRef.current = servers;

		// Initialize load balancers
		loadBalancersRef.current = [
			{
				id: "LB-PRIMARY",
				x: 45,
				y: 18,
				algorithm: "round_robin",
				total_requests: 0,
				requests_per_second: 0,
				failed_requests: 0,
				active_connections: 0,
				status: "active",
			},
			{
				id: "LB-BACKUP",
				x: 45,
				y: 25,
				algorithm: "least_connections",
				total_requests: 0,
				requests_per_second: 0,
				failed_requests: 0,
				active_connections: 0,
				status: "failover",
			},
		];

		// Initialize clients
		clientsRef.current = [
			{
				id: "WEB-USERS",
				x: 10,
				y: 10,
				request_rate: 2,
				is_active: true,
				type: "web",
			},
			{
				id: "MOBILE-APP",
				x: 10,
				y: 16,
				request_rate: 3,
				is_active: true,
				type: "mobile",
			},
			{
				id: "API-CLIENTS",
				x: 10,
				y: 22,
				request_rate: 1.5,
				is_active: true,
				type: "api",
			},
			{
				id: "BOTS",
				x: 10,
				y: 28,
				request_rate: 0.5,
				is_active: true,
				type: "bot",
			},
		];
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

		let roundRobinIndex = 0;
		let requestCounter = 0;

		const selectServer = (lb: LoadBalancer): ServerNode | null => {
			const servers = Array.from(serversRef.current.values()).filter(
				(s) => s.status !== "down",
			);
			if (servers.length === 0) return null;

			switch (loadBalancingAlgorithm) {
				case "round_robin": {
					const server = servers[roundRobinIndex % servers.length];
					roundRobinIndex++;
					return server;
				}

				case "least_connections":
					return servers.reduce((min, current) =>
						current.connections < min.connections ? current : min,
					);

				case "weighted": {
					const weightedServers = servers.filter((s) => s.health > 0.5);
					return weightedServers.length > 0
						? weightedServers[
								Math.floor(Math.random() * weightedServers.length)
							]
						: servers[0];
				}

				case "health_based": {
					const healthyServers = servers.filter(
						(s) => s.health > 0.7 && s.load < 80,
					);
					return healthyServers.length > 0
						? healthyServers[Math.floor(Math.random() * healthyServers.length)]
						: servers[0];
				}

				default:
					return servers[0];
			}
		};

		const generateTraffic = () => {
			const activeLB = loadBalancersRef.current.find(
				(lb) => lb.status === "active",
			);
			if (!activeLB) return;

			// Generate client requests
			clientsRef.current.forEach((client) => {
				if (!client.is_active) return;

				const baseRate = client.request_rate * trafficIntensity * speed;
				let actualRate = baseRate;

				// Apply simulation effects
				if (simulationMode === "traffic_spike") {
					actualRate *= 3;
				} else if (simulationMode === "ddos_attack") {
					if (client.type === "bot") actualRate *= 10;
				} else if (simulationMode === "low_traffic") {
					actualRate *= 0.3;
				}

				if (Math.random() < actualRate * 0.1) {
					requestCounter++;
					const targetServer = selectServer(activeLB);

					if (targetServer) {
						// Client to Load Balancer
						packetsRef.current.push({
							id: `req-${requestCounter}`,
							source_x: client.x,
							source_y: client.y,
							target_x: activeLB.x,
							target_y: activeLB.y,
							current_x: client.x,
							current_y: client.y,
							progress: 0,
							type: "request",
							size: 1 + Math.floor(Math.random() * 3),
							server_id: targetServer.id,
						});

						activeLB.total_requests++;
						activeLB.requests_per_second++;
					}
				}
			});

			// Health checks
			if (showHealthChecks && Math.random() < 0.05 * speed) {
				const activeLB = loadBalancersRef.current.find(
					(lb) => lb.status === "active",
				);
				if (activeLB) {
					serversRef.current.forEach((server) => {
						packetsRef.current.push({
							id: `health-${Date.now()}-${server.id}`,
							source_x: activeLB.x,
							source_y: activeLB.y,
							target_x: server.x,
							target_y: server.y,
							current_x: activeLB.x,
							current_y: activeLB.y,
							progress: 0,
							type: "health_check",
							size: 1,
							server_id: server.id,
						});
					});
				}
			}
		};

		const updateServers = () => {
			const servers = serversRef.current;
			const time = Date.now() / 1000;

			servers.forEach((server) => {
				// Simulate load patterns
				const baseLoad = 20 + 30 * sin(time * 0.1 + server.x * 0.01);
				const connectionLoad =
					(server.connections / server.max_connections) * 50;
				server.load = clamp(
					baseLoad + connectionLoad + (Math.random() - 0.5) * 10,
					0,
					100,
				);

				// Health degradation under high load
				if (server.load > 80) {
					server.health = Math.max(0.1, server.health - 0.01);
				} else {
					server.health = Math.min(1.0, server.health + 0.005);
				}

				// Response time affected by load
				server.response_time =
					30 + server.load * 2 + (Math.random() - 0.5) * 20;
				server.response_time = clamp(server.response_time, 10, 500);

				// Determine status
				if (server.health < 0.2) {
					server.status = "down";
					server.alert_flash = Math.max(server.alert_flash, 20);
				} else if (server.load > 90 || server.health < 0.5) {
					server.status = "overloaded";
					server.alert_flash = Math.max(server.alert_flash, 10);
				} else if (server.load > 70 || server.health < 0.7) {
					server.status = "degraded";
					server.alert_flash = Math.max(server.alert_flash, 5);
				} else {
					server.status = "healthy";
				}

				if (server.alert_flash > 0) {
					server.alert_flash--;
				}

				// Update queue size
				server.queue_size = Math.max(
					0,
					server.queue_size + (Math.random() - 0.8) * 2,
				);
			});
		};

		const updatePackets = () => {
			const packetSpeed = 0.03 * speed;

			packetsRef.current.forEach((packet) => {
				packet.progress += packetSpeed;

				// Update packet position
				packet.current_x = lerp(
					packet.source_x,
					packet.target_x,
					packet.progress,
				);
				packet.current_y = lerp(
					packet.source_y,
					packet.target_y,
					packet.progress,
				);

				// Handle packet arrival
				if (packet.progress >= 1) {
					if (packet.type === "request" && packet.server_id) {
						const server = serversRef.current.get(packet.server_id);
						const activeLB = loadBalancersRef.current.find(
							(lb) => lb.status === "active",
						);

						if (server && activeLB) {
							server.connections++;

							// Forward request to server
							packetsRef.current.push({
								id: `fwd-${packet.id}`,
								source_x: activeLB.x,
								source_y: activeLB.y,
								target_x: server.x,
								target_y: server.y,
								current_x: activeLB.x,
								current_y: activeLB.y,
								progress: 0,
								type: "request",
								size: packet.size,
								server_id: server.id,
							});
						}
					} else if (packet.type === "request" && packet.target_x > 60) {
						// Request reached server, send response
						const server = serversRef.current.get(packet.server_id || "");
						const activeLB = loadBalancersRef.current.find(
							(lb) => lb.status === "active",
						);

						if (server && activeLB) {
							const isSuccess =
								Math.random() > 0.05 && server.status !== "down";

							if (!isSuccess) {
								activeLB.failed_requests++;
							}

							// Response back to load balancer
							setTimeout(() => {
								packetsRef.current.push({
									id: `resp-${packet.id}`,
									source_x: server.x,
									source_y: server.y,
									target_x: activeLB.x,
									target_y: activeLB.y,
									current_x: server.x,
									current_y: server.y,
									progress: 0,
									type: isSuccess ? "response" : "error",
									size: packet.size,
									server_id: server.id,
								});
							}, server.response_time);

							server.connections = Math.max(0, server.connections - 1);
						}
					} else if (packet.type === "health_check" && packet.server_id) {
						const server = serversRef.current.get(packet.server_id);
						if (server) {
							// Health check response
							const activeLB = loadBalancersRef.current.find(
								(lb) => lb.status === "active",
							);
							if (activeLB) {
								packetsRef.current.push({
									id: `health-resp-${packet.id}`,
									source_x: server.x,
									source_y: server.y,
									target_x: activeLB.x,
									target_y: activeLB.y,
									current_x: server.x,
									current_y: server.y,
									progress: 0,
									type: server.status === "healthy" ? "response" : "error",
									size: 1,
								});
							}
						}
					}
				}
			});

			// Remove completed packets
			packetsRef.current = packetsRef.current.filter(
				(packet) => packet.progress < 1,
			);
		};

		const drawClient = (client: Client) => {
			const fontSize = 10;
			const x = client.x;
			const y = client.y;

			let clientIcon = "👥";
			if (client.type === "mobile") clientIcon = "📱";
			else if (client.type === "api") clientIcon = "🔌";
			else if (client.type === "bot") clientIcon = "🤖";

			ctx.fillStyle = client.is_active
				? colorSchemes[colorScheme as keyof typeof colorSchemes].text
				: colorSchemes[colorScheme as keyof typeof colorSchemes].text + "60";

			ctx.fillText(`${clientIcon} ${client.id}`, x * fontSize, y * fontSize);
			ctx.fillText(
				`Rate: ${client.request_rate.toFixed(1)} req/s`,
				x * fontSize,
				(y + 1) * fontSize,
			);
		};

		const drawLoadBalancer = (lb: LoadBalancer) => {
			const fontSize = 10;
			const x = lb.x;
			const y = lb.y;

			let lbColor =
				colorSchemes[colorScheme as keyof typeof colorSchemes].success;
			if (lb.status === "failover")
				lbColor = colorSchemes[colorScheme as keyof typeof colorSchemes].load;
			else if (lb.status === "maintenance")
				lbColor = colorSchemes[colorScheme as keyof typeof colorSchemes].error;

			ctx.fillStyle = lbColor;

			const lbArt = [
				"┌─────────┐",
				"│ ⚖️  LB   │",
				"│ ←→←→←→  │",
				"│ BALANCE │",
				"└─────────┘",
			];

			lbArt.forEach((line, i) => {
				ctx.fillText(line, x * fontSize, (y + i - 2) * fontSize);
			});

			ctx.fillStyle =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text;
			ctx.fillText(lb.id, x * fontSize, (y - 3) * fontSize);
			ctx.fillText(
				`${lb.status.toUpperCase()}`,
				(x + 12) * fontSize,
				(y - 3) * fontSize,
			);
			ctx.fillText(
				`RPS: ${lb.requests_per_second}`,
				x * fontSize,
				(y + 4) * fontSize,
			);
			ctx.fillText(
				`Fails: ${lb.failed_requests}`,
				x * fontSize,
				(y + 5) * fontSize,
			);
		};

		const drawServer = (server: ServerNode) => {
			const fontSize = 10;
			const x = server.x;
			const y = server.y;

			let serverColor =
				colorSchemes[colorScheme as keyof typeof colorSchemes].success;
			if (server.status === "down")
				serverColor =
					colorSchemes[colorScheme as keyof typeof colorSchemes].error;
			else if (server.status === "overloaded")
				serverColor =
					colorSchemes[colorScheme as keyof typeof colorSchemes].error;
			else if (server.status === "degraded")
				serverColor =
					colorSchemes[colorScheme as keyof typeof colorSchemes].load;

			// Flash effect for alerts
			if (server.alert_flash > 0 && server.alert_flash % 6 < 3) {
				ctx.fillStyle = server.status === "down" ? "#FF0000" : "#FFAA00";
			} else {
				ctx.fillStyle = serverColor;
			}

			const serverArt = ["┌─────┐", "│ ███ │", "│ ○○○ │", "└─────┘"];

			serverArt.forEach((line, i) => {
				ctx.fillText(line, x * fontSize, (y + i - 1) * fontSize);
			});

			// Server info
			ctx.fillStyle =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text;
			ctx.fillText(server.name, x * fontSize, (y - 2) * fontSize);

			// Status indicator
			const statusChar =
				server.status === "healthy"
					? "●"
					: server.status === "degraded"
						? "▲"
						: server.status === "overloaded"
							? "■"
							: "✕";
			ctx.fillStyle = serverColor;
			ctx.fillText(statusChar, (x + 8) * fontSize, (y - 2) * fontSize);

			// Metrics
			let value = 0;
			let label = "";
			switch (displayMode) {
				case "load":
					value = server.load;
					label = `Load: ${value.toFixed(1)}%`;
					break;
				case "connections":
					value = server.connections;
					label = `Conn: ${value}/${server.max_connections}`;
					break;
				case "health":
					value = server.health * 100;
					label = `Health: ${value.toFixed(1)}%`;
					break;
				case "response_time":
					value = server.response_time;
					label = `RT: ${value.toFixed(0)}ms`;
					break;
			}

			ctx.fillStyle =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text;
			ctx.fillText(label, x * fontSize, (y + 4) * fontSize);
		};

		const drawPackets = () => {
			const fontSize = 10;

			packetsRef.current.forEach((packet) => {
				let packetChar = "●";
				let packetColor =
					colorSchemes[colorScheme as keyof typeof colorSchemes].data;

				if (packet.type === "request") {
					packetChar = "→";
					packetColor =
						colorSchemes[colorScheme as keyof typeof colorSchemes].text;
				} else if (packet.type === "response") {
					packetChar = "←";
					packetColor =
						colorSchemes[colorScheme as keyof typeof colorSchemes].success;
				} else if (packet.type === "error") {
					packetChar = "✕";
					packetColor =
						colorSchemes[colorScheme as keyof typeof colorSchemes].error;
				} else if (packet.type === "health_check") {
					packetChar = "♥";
					packetColor =
						colorSchemes[colorScheme as keyof typeof colorSchemes].load;
				}

				ctx.fillStyle = packetColor;
				ctx.fillText(
					packetChar,
					packet.current_x * fontSize,
					packet.current_y * fontSize,
				);
			});
		};

		const drawConnectionLines = () => {
			const fontSize = 10;
			const activeLB = loadBalancersRef.current.find(
				(lb) => lb.status === "active",
			);
			if (!activeLB) return;

			ctx.strokeStyle =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text + "40";
			ctx.lineWidth = 1;
			ctx.setLineDash([2, 2]);

			// Client to LB connections
			clientsRef.current.forEach((client) => {
				if (client.is_active) {
					ctx.beginPath();
					ctx.moveTo(client.x * fontSize + 100, client.y * fontSize);
					ctx.lineTo(activeLB.x * fontSize, (activeLB.y + 1) * fontSize);
					ctx.stroke();
				}
			});

			// LB to server connections
			serversRef.current.forEach((server) => {
				if (server.status !== "down") {
					ctx.beginPath();
					ctx.moveTo((activeLB.x + 10) * fontSize, (activeLB.y + 1) * fontSize);
					ctx.lineTo(server.x * fontSize, (server.y + 1) * fontSize);
					ctx.stroke();
				}
			});

			ctx.setLineDash([]);
		};

		const drawStatistics = () => {
			const activeLB = loadBalancersRef.current.find(
				(lb) => lb.status === "active",
			);
			const servers = Array.from(serversRef.current.values());
			const totalConnections = servers.reduce(
				(sum, s) => sum + s.connections,
				0,
			);
			const avgLoad =
				servers.reduce((sum, s) => sum + s.load, 0) / servers.length;
			const healthyServers = servers.filter(
				(s) => s.status === "healthy",
			).length;
			const avgResponseTime =
				servers.reduce((sum, s) => sum + s.response_time, 0) / servers.length;

			ctx.fillStyle =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text;
			const statsY = canvas.height - 100;

			ctx.fillText("┌─ LOAD BALANCER DASHBOARD ─┐", 10, statsY);
			ctx.fillText(
				`│ Algorithm: ${loadBalancingAlgorithm.toUpperCase()} | Mode: ${simulationMode}`,
				10,
				statsY + 15,
			);
			ctx.fillText(
				`│ Total Connections: ${totalConnections} | Avg Load: ${avgLoad.toFixed(1)}%`,
				10,
				statsY + 30,
			);
			ctx.fillText(
				`│ Healthy Servers: ${healthyServers}/${servers.length} | Avg Response: ${avgResponseTime.toFixed(0)}ms`,
				10,
				statsY + 45,
			);

			if (activeLB) {
				ctx.fillText(
					`│ Requests: ${activeLB.total_requests} | RPS: ${activeLB.requests_per_second} | Failures: ${activeLB.failed_requests}`,
					10,
					statsY + 60,
				);
			}

			ctx.fillText("└─────────────────────────────┘", 10, statsY + 75);
		};

		const animate = () => {
			if (!isPlaying) return;

			const currentScheme =
				colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Clear canvas
			ctx.fillStyle = currentScheme.bg;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			ctx.font = '10px "Courier New", monospace';
			ctx.textBaseline = "top";

			// Update system
			generateTraffic();
			updatePackets();

			if (Math.random() < 0.1 * speed) {
				updateServers();
			}

			// Reset RPS counter periodically
			if (Math.random() < 0.02) {
				loadBalancersRef.current.forEach((lb) => {
					lb.requests_per_second = 0;
				});
			}

			// Draw components
			drawConnectionLines();

			clientsRef.current.forEach((client) => drawClient(client));
			loadBalancersRef.current.forEach((lb) => drawLoadBalancer(lb));
			serversRef.current.forEach((server) => drawServer(server));

			drawPackets();
			drawStatistics();

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
		trafficIntensity,
		colorScheme,
		displayMode,
		loadBalancingAlgorithm,
		showHealthChecks,
		simulationMode,
	]);

	return (
		<div className="flex flex-col h-screen bg-black">
			<div className="flex-shrink-0 bg-gray-900 p-4 border-b border-gray-700">
				<h1 className="text-2xl font-bold text-cyan-400 mb-4">
					⚖️ ASCII Load Balancer Traffic Monitor
				</h1>

				<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-sm mb-4">
					<div className="flex flex-col">
						<label className="text-cyan-300 mb-2">Animation</label>
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
						<label className="text-cyan-300 mb-2">
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
						<label className="text-cyan-300 mb-2">
							Traffic: {Math.round(trafficIntensity * 100)}%
						</label>
						<input
							type="range"
							min="0"
							max="1"
							step="0.1"
							value={trafficIntensity}
							onChange={(e) =>
								setTrafficIntensity(Number.parseFloat(e.target.value))
							}
							className="w-full"
						/>
					</div>

					<div className="flex flex-col">
						<label className="text-cyan-300 mb-2">Algorithm</label>
						<select
							value={loadBalancingAlgorithm}
							onChange={(e) => setLoadBalancingAlgorithm(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-cyan-300 rounded border border-gray-600"
						>
							<option value="round_robin">Round Robin</option>
							<option value="least_connections">Least Connections</option>
							<option value="weighted">Weighted</option>
							<option value="health_based">Health Based</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-cyan-300 mb-2">Display Mode</label>
						<select
							value={displayMode}
							onChange={(e) => setDisplayMode(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-cyan-300 rounded border border-gray-600"
						>
							<option value="load">Server Load</option>
							<option value="connections">Connections</option>
							<option value="health">Health</option>
							<option value="response_time">Response Time</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-cyan-300 mb-2">Simulation</label>
						<select
							value={simulationMode}
							onChange={(e) => setSimulationMode(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-cyan-300 rounded border border-gray-600"
						>
							<option value="normal">Normal Traffic</option>
							<option value="traffic_spike">Traffic Spike</option>
							<option value="ddos_attack">DDoS Attack</option>
							<option value="low_traffic">Low Traffic</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-cyan-300 mb-2">Color Scheme</label>
						<select
							value={colorScheme}
							onChange={(e) => setColorScheme(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-cyan-300 rounded border border-gray-600"
						>
							<option value="network">Network Blue</option>
							<option value="traffic">Traffic Light</option>
							<option value="neon">Neon</option>
							<option value="classic">Classic Terminal</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="flex items-center text-cyan-300 text-xs">
							<input
								type="checkbox"
								checked={showHealthChecks}
								onChange={(e) => setShowHealthChecks(e.target.checked)}
								className="mr-1"
							/>
							Health Checks
						</label>
					</div>
				</div>

				<div className="mt-4 text-cyan-400 text-sm">
					<p>
						⚖️ <strong>Real-time load balancer monitoring</strong> with multiple
						distribution algorithms!
					</p>
					<p>
						📊 <strong>Watch traffic flow</strong> from clients through load
						balancers to backend servers!
					</p>
					<p>
						🔧 <strong>Test different algorithms</strong> and simulate traffic
						spikes, DDoS attacks, and failover scenarios!
					</p>
					<p>
						Monitor server health, response times, and connection distribution
						in real-time ASCII visualization
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