import { clamp, lerp } from "play.ts";
import { useEffect, useRef, useState } from "react";

interface DockerContainer {
	id: string;
	name: string;
	image: string;
	status:
		| "created"
		| "running"
		| "paused"
		| "restarting"
		| "removing"
		| "exited"
		| "dead";
	health: "healthy" | "unhealthy" | "starting" | "none";
	node_id: string;
	service_id: string;
	cpu_usage: number;
	memory_usage: number;
	memory_limit: number;
	network_io: number;
	disk_io: number;
	uptime: number;
	restart_count: number;
	x: number;
	y: number;
	ports: string[];
	volumes: string[];
	env_vars: Record<string, string>;
	labels: Record<string, string>;
}

interface DockerNode {
	id: string;
	name: string;
	role: "manager" | "worker";
	status: "ready" | "down" | "unknown" | "disconnected";
	availability: "active" | "pause" | "drain";
	manager_status: "leader" | "reachable" | "unreachable" | "none";
	cpu_cores: number;
	memory_total: number;
	cpu_usage: number;
	memory_usage: number;
	containers_running: number;
	containers_total: number;
	x: number;
	y: number;
	engine_version: string;
	os: string;
	arch: string;
	last_seen: number;
}

interface DockerService {
	id: string;
	name: string;
	mode: "replicated" | "global";
	replicas_desired: number;
	replicas_running: number;
	image: string;
	ports: string[];
	networks: string[];
	update_status:
		| "updating"
		| "completed"
		| "paused"
		| "rollback_started"
		| "rollback_completed"
		| "none";
	placement_constraints: string[];
	labels: Record<string, string>;
	created: number;
	updated: number;
}

interface ContainerFlow {
	id: string;
	from_container: string;
	to_container: string;
	progress: number;
	type: "http" | "tcp" | "internal" | "overlay";
	bytes_per_sec: number;
	protocol: string;
}

export default function ASCIIDockerSwarmExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>(0);
	const containersRef = useRef<Map<string, DockerContainer>>(new Map());
	const nodesRef = useRef<Map<string, DockerNode>>(new Map());
	const servicesRef = useRef<Map<string, DockerService>>(new Map());
	const containerFlowsRef = useRef<ContainerFlow[]>([]);
	const [isPlaying, setIsPlaying] = useState(true);
	const [speed, setSpeed] = useState(1);
	const [viewMode, setViewMode] = useState("cluster");
	const [selectedNode, setSelectedNode] = useState("manager-1");
	const [displayMetric, setDisplayMetric] = useState("cpu");
	const [showServices, setShowServices] = useState(true);
	const [showNetworking, setShowNetworking] = useState(true);
	const [colorScheme, setColorScheme] = useState("docker");
	const [simulationMode, setSimulationMode] = useState("normal");
	const [scalingMode, setScalingMode] = useState("manual");

	const colorSchemes = {
		docker: {
			bg: "#0B1426",
			manager: "#2496ED",
			worker: "#0DB7ED",
			running: "#00C851",
			unhealthy: "#FF4444",
			updating: "#FF9500",
			service: "#FF6900",
			text: "#FFFFFF",
			network: "#9B59B6",
		},
		swarm: {
			bg: "#1A1A2E",
			manager: "#16213E",
			worker: "#0F3460",
			running: "#E94560",
			unhealthy: "#FF4757",
			updating: "#FFA502",
			service: "#3742FA",
			text: "#FFFFFF",
			network: "#2ED573",
		},
		production: {
			bg: "#000000",
			manager: "#00FF00",
			worker: "#00AA00",
			running: "#FFFF00",
			unhealthy: "#FF0000",
			updating: "#FF8800",
			service: "#00FFFF",
			text: "#FFFFFF",
			network: "#FF00FF",
		},
	};

	useEffect(() => {
		// Initialize Docker Swarm cluster
		const nodes = new Map<string, DockerNode>();
		const containers = new Map<string, DockerContainer>();
		const services = new Map<string, DockerService>();

		// Create manager nodes
		for (let i = 1; i <= 3; i++) {
			const managerNode: DockerNode = {
				id: `manager-${i}`,
				name: `docker-manager-${i}`,
				role: "manager",
				status: "ready",
				availability: "active",
				manager_status: i === 1 ? "leader" : "reachable",
				cpu_cores: 4,
				memory_total: 8192,
				cpu_usage: Math.random() * 2000 + 500,
				memory_usage: Math.random() * 4000 + 1000,
				containers_running: 0,
				containers_total: 0,
				x: 10 + (i - 1) * 30,
				y: 5,
				engine_version: "24.0.7",
				os: "linux",
				arch: "x86_64",
				last_seen: Date.now(),
			};
			nodes.set(`manager-${i}`, managerNode);
		}

		// Create worker nodes
		for (let i = 1; i <= 5; i++) {
			const workerNode: DockerNode = {
				id: `worker-${i}`,
				name: `docker-worker-${i}`,
				role: "worker",
				status: "ready",
				availability: "active",
				manager_status: "none",
				cpu_cores: 8,
				memory_total: 16384,
				cpu_usage: Math.random() * 4000 + 1000,
				memory_usage: Math.random() * 8000 + 2000,
				containers_running: 0,
				containers_total: 0,
				x: 5 + (i - 1) * 20,
				y: 15,
				engine_version: "24.0.7",
				os: "linux",
				arch: "x86_64",
				last_seen: Date.now(),
			};
			nodes.set(`worker-${i}`, workerNode);
		}

		// Create services
		const serviceConfigs = [
			{
				name: "web-frontend",
				replicas: 3,
				image: "nginx:alpine",
				ports: ["80:8080"],
			},
			{
				name: "api-backend",
				replicas: 2,
				image: "node:alpine",
				ports: ["3000:3000"],
			},
			{
				name: "database",
				replicas: 1,
				image: "postgres:15",
				ports: ["5432:5432"],
			},
			{
				name: "redis-cache",
				replicas: 1,
				image: "redis:alpine",
				ports: ["6379:6379"],
			},
			{
				name: "load-balancer",
				replicas: 2,
				image: "haproxy:alpine",
				ports: ["80:80", "443:443"],
			},
			{
				name: "monitoring",
				replicas: 1,
				image: "prom/prometheus",
				ports: ["9090:9090"],
			},
			{
				name: "log-aggregator",
				replicas: 1,
				image: "elasticsearch:7.17",
				ports: ["9200:9200"],
			},
		];

		serviceConfigs.forEach((svcConfig, i) => {
			const service: DockerService = {
				id: `service-${i}`,
				name: svcConfig.name,
				mode: "replicated",
				replicas_desired: svcConfig.replicas,
				replicas_running: svcConfig.replicas,
				image: svcConfig.image,
				ports: svcConfig.ports,
				networks: ["overlay-network", "ingress"],
				update_status: "none",
				placement_constraints: [],
				labels: { "com.docker.stack.namespace": "production" },
				created: Date.now() - Math.random() * 86400000,
				updated: Date.now() - Math.random() * 3600000,
			};
			services.set(service.id, service);
		});

		// Create containers for services
		let containerCounter = 0;
		const allNodes = Array.from(nodes.values());
		const workerNodes = allNodes.filter((n) => n.role === "worker");

		services.forEach((service) => {
			for (let i = 0; i < service.replicas_running; i++) {
				const node =
					workerNodes[Math.floor(Math.random() * workerNodes.length)];

				const container: DockerContainer = {
					id: `container-${containerCounter++}`,
					name: `${service.name}.${i}.${Math.random().toString(36).substr(2, 8)}`,
					image: service.image,
					status: Math.random() > 0.95 ? "restarting" : "running",
					health:
						Math.random() > 0.9
							? "unhealthy"
							: Math.random() > 0.8
								? "starting"
								: "healthy",
					node_id: node.id,
					service_id: service.id,
					cpu_usage: Math.random() * 200 + 50,
					memory_usage: Math.random() * 512 + 128,
					memory_limit: 1024,
					network_io: Math.random() * 1000 + 100,
					disk_io: Math.random() * 500 + 50,
					uptime: Math.random() * 172800,
					restart_count: Math.floor(Math.random() * 5),
					x: node.x + (i % 4) * 4,
					y: node.y + 3 + Math.floor(i / 4) * 2,
					ports: service.ports,
					volumes: [`${service.name}-data:/data`],
					env_vars: { NODE_ENV: "production", SERVICE_NAME: service.name },
					labels: { "com.docker.swarm.service.name": service.name },
				};

				containers.set(container.id, container);
				node.containers_running++;
				node.containers_total++;
			}
		});

		nodesRef.current = nodes;
		containersRef.current = containers;
		servicesRef.current = services;
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

		const updateSwarmMetrics = () => {
			const containers = containersRef.current;
			const nodes = nodesRef.current;
			const services = servicesRef.current;
			const time = Date.now() / 1000;

			// Update container metrics
			containers.forEach((container) => {
				// Simulate different behaviors based on simulation mode
				if (simulationMode === "rolling-update") {
					if (Math.random() < 0.02 * speed) {
						container.status = "restarting";
						container.health = "starting";
					} else if (container.status === "restarting" && Math.random() < 0.3) {
						container.status = "running";
						container.health = "healthy";
						container.restart_count++;
					}
				} else if (simulationMode === "high-load") {
					container.cpu_usage = Math.min(
						800,
						container.cpu_usage + Math.random() * 50,
					);
					container.memory_usage = Math.min(
						container.memory_limit * 0.9,
						container.memory_usage + Math.random() * 100,
					);
					container.network_io += Math.random() * 200;
				} else if (simulationMode === "node-failure") {
					const node = nodes.get(container.node_id);
					if (node && node.id === "worker-1") {
						container.status = "exited";
						container.health = "unhealthy";
					}
				}

				// Normal metric updates
				if (container.status === "running") {
					container.cpu_usage = clamp(
						container.cpu_usage + (Math.random() - 0.5) * 20,
						10,
						800,
					);
					container.memory_usage = clamp(
						container.memory_usage + (Math.random() - 0.5) * 50,
						64,
						container.memory_limit * 0.95,
					);
					container.network_io = clamp(
						container.network_io + (Math.random() - 0.5) * 100,
						0,
						5000,
					);
					container.disk_io = clamp(
						container.disk_io + (Math.random() - 0.5) * 50,
						0,
						2000,
					);
				}

				// Health checks
				if (container.memory_usage > container.memory_limit * 0.9) {
					container.health = "unhealthy";
				} else if (container.cpu_usage > 700) {
					container.health = "unhealthy";
				} else if (container.health === "unhealthy" && Math.random() < 0.1) {
					container.health = "healthy";
				}

				container.uptime += speed;
			});

			// Update node metrics
			nodes.forEach((node) => {
				if (simulationMode === "node-failure" && node.id === "worker-1") {
					node.status = "down";
					node.availability = "drain";
				} else {
					node.status = "ready";
					node.availability = "active";
				}

				// Calculate node metrics from containers
				const nodeContainers = Array.from(containers.values()).filter(
					(c) => c.node_id === node.id,
				);
				node.containers_running = nodeContainers.filter(
					(c) => c.status === "running",
				).length;
				node.containers_total = nodeContainers.length;
				node.cpu_usage = nodeContainers.reduce(
					(sum, c) => sum + c.cpu_usage,
					0,
				);
				node.memory_usage = nodeContainers.reduce(
					(sum, c) => sum + c.memory_usage,
					0,
				);

				node.last_seen = Date.now();
			});

			// Update service status
			services.forEach((service) => {
				const serviceContainers = Array.from(containers.values()).filter(
					(c) => c.service_id === service.id,
				);
				service.replicas_running = serviceContainers.filter(
					(c) => c.status === "running",
				).length;

				// Handle scaling
				if (scalingMode === "auto" && service.name === "web-frontend") {
					const avgCpu =
						serviceContainers.reduce((sum, c) => sum + c.cpu_usage, 0) /
						serviceContainers.length;
					if (avgCpu > 600 && service.replicas_running < 5) {
						service.replicas_desired++;
						service.update_status = "updating";
					} else if (avgCpu < 200 && service.replicas_running > 1) {
						service.replicas_desired--;
						service.update_status = "updating";
					}
				}

				// Update status based on replicas
				if (service.replicas_running < service.replicas_desired) {
					service.update_status = "updating";
				} else if (service.update_status === "updating") {
					service.update_status = "completed";
				}

				service.updated = Date.now();
			});

			// Generate container communication flows
			if (Math.random() < 0.12 * speed && showNetworking) {
				const runningContainers = Array.from(containers.values()).filter(
					(c) => c.status === "running",
				);

				if (runningContainers.length > 1) {
					const fromContainer =
						runningContainers[
							Math.floor(Math.random() * runningContainers.length)
						];
					const toContainer =
						runningContainers[
							Math.floor(Math.random() * runningContainers.length)
						];

					if (fromContainer.id !== toContainer.id) {
						containerFlowsRef.current.push({
							id: `flow-${fromContainer.id}-${toContainer.id}-${Date.now()}`,
							from_container: fromContainer.id,
							to_container: toContainer.id,
							progress: 0,
							type:
								Math.random() < 0.5
									? "http"
									: Math.random() < 0.7
										? "tcp"
										: "overlay",
							bytes_per_sec: Math.random() * 1000 + 100,
							protocol: Math.random() < 0.6 ? "HTTP/1.1" : "TCP",
						});
					}
				}
			}

			// Update container flows
			containerFlowsRef.current = containerFlowsRef.current.filter((flow) => {
				flow.progress += 0.05 * speed;
				return flow.progress < 1;
			});
		};

		const getContainerStatusColor = (
			container: DockerContainer,
			scheme: any,
		) => {
			if (container.status === "exited" || container.status === "dead")
				return scheme.unhealthy;
			if (container.status === "restarting") return scheme.updating;
			if (container.health === "unhealthy") return scheme.unhealthy;
			if (container.health === "starting") return scheme.updating;
			return scheme.running;
		};

		const drawContainer = (container: DockerContainer, fontSize: number) => {
			const x = container.x * fontSize;
			const y = container.y * fontSize;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Container status icon
			ctx.fillStyle = getContainerStatusColor(container, scheme);
			const icon =
				container.status === "running"
					? "▣"
					: container.status === "restarting"
						? "↻"
						: container.status === "exited"
							? "◇"
							: "▢";
			ctx.fillText(icon, x, y);

			// Container name (shortened)
			ctx.fillStyle = scheme.text;
			const shortName =
				container.name.length > 12
					? container.name.substring(0, 12) + "..."
					: container.name;
			ctx.fillText(shortName, x + fontSize, y);

			// Health indicator
			if (container.health === "unhealthy") {
				ctx.fillStyle = scheme.unhealthy;
				ctx.fillText("⚠", x - fontSize, y);
			} else if (container.health === "starting") {
				ctx.fillStyle = scheme.updating;
				ctx.fillText("◐", x - fontSize, y);
			}

			// Resource metrics
			if (viewMode === "detailed" || viewMode === "node") {
				let value = 0;
				let unit = "";
				let max = 100;

				switch (displayMetric) {
					case "cpu":
						value = container.cpu_usage;
						unit = "m";
						max = 1000;
						break;
					case "memory":
						value = container.memory_usage;
						unit = "MB";
						max = container.memory_limit;
						break;
					case "network":
						value = container.network_io;
						unit = "KB/s";
						max = 5000;
						break;
				}

				const barWidth = 6;
				const percentage = value / max;
				const filled = Math.floor(percentage * barWidth);

				ctx.fillStyle = scheme.text + "40";
				ctx.fillText("█".repeat(barWidth), x, y + fontSize);

				if (filled > 0) {
					ctx.fillStyle =
						percentage > 0.8
							? scheme.unhealthy
							: percentage > 0.6
								? scheme.updating
								: scheme.running;
					ctx.fillText("█".repeat(filled), x, y + fontSize);
				}

				ctx.fillStyle = scheme.text;
				ctx.fillText(
					`${value.toFixed(0)}${unit}`,
					x + (barWidth + 1) * fontSize,
					y + fontSize,
				);
			}

			// Restart count
			if (container.restart_count > 0) {
				ctx.fillStyle = scheme.updating;
				ctx.fillText(`R:${container.restart_count}`, x + fontSize * 14, y);
			}
		};

		const drawNode = (node: DockerNode, fontSize: number) => {
			const x = node.x * fontSize;
			const y = node.y * fontSize;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Node box
			const boxWidth = node.role === "manager" ? 25 : 18;
			const boxHeight = 10;

			ctx.strokeStyle =
				node.role === "manager" ? scheme.manager : scheme.worker;
			ctx.lineWidth = 2;
			ctx.strokeRect(
				x - fontSize,
				y - fontSize,
				boxWidth * fontSize,
				boxHeight * fontSize,
			);

			// Node role icon
			ctx.fillStyle = node.role === "manager" ? scheme.manager : scheme.worker;
			const icon = node.role === "manager" ? "👑" : "⚙";
			ctx.fillText(icon, x - fontSize * 0.5, y - fontSize * 0.5);

			// Manager status for managers
			if (node.role === "manager") {
				ctx.fillStyle =
					node.manager_status === "leader" ? scheme.running : scheme.updating;
				const managerIcon = node.manager_status === "leader" ? "★" : "●";
				ctx.fillText(managerIcon, x + fontSize * 17, y - fontSize * 0.5);
			}

			// Node name
			ctx.fillStyle = scheme.text;
			ctx.fillText(node.name, x, y);

			// Node status
			const statusColor =
				node.status === "ready"
					? scheme.running
					: node.status === "down"
						? scheme.unhealthy
						: scheme.updating;
			ctx.fillStyle = statusColor;
			ctx.fillText(node.status.toUpperCase(), x + fontSize * 10, y);

			// Resource utilization
			ctx.fillStyle = scheme.text;
			const cpuPercent = (
				(node.cpu_usage / (node.cpu_cores * 1000)) *
				100
			).toFixed(0);
			const memPercent = (
				(node.memory_usage / node.memory_total) *
				100
			).toFixed(0);
			ctx.fillText(`CPU: ${cpuPercent}%`, x, y + fontSize * 1.5);
			ctx.fillText(`MEM: ${memPercent}%`, x, y + fontSize * 2.5);
			ctx.fillText(
				`Containers: ${node.containers_running}/${node.containers_total}`,
				x,
				y + fontSize * 3.5,
			);

			// Engine version
			ctx.fillStyle = scheme.text + "80";
			ctx.fillText(
				`Docker ${node.engine_version}`,
				x + fontSize * 10,
				y + fontSize * 1.5,
			);

			// Availability
			if (node.availability !== "active") {
				ctx.fillStyle = scheme.updating;
				ctx.fillText(
					node.availability.toUpperCase(),
					x + fontSize * 10,
					y + fontSize * 2.5,
				);
			}
		};

		const drawService = (
			service: DockerService,
			x: number,
			y: number,
			fontSize: number,
		) => {
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Service icon
			ctx.fillStyle = scheme.service;
			const statusIcon =
				service.update_status === "updating"
					? "↻"
					: service.replicas_running < service.replicas_desired
						? "⚠"
						: "◆";
			ctx.fillText(statusIcon, x, y);

			// Service name and replicas
			ctx.fillStyle = scheme.text;
			ctx.fillText(
				`${service.name} (${service.replicas_running}/${service.replicas_desired})`,
				x + fontSize,
				y,
			);

			// Update status
			if (service.update_status !== "none") {
				ctx.fillStyle =
					service.update_status === "updating"
						? scheme.updating
						: scheme.running;
				ctx.fillText(service.update_status.toUpperCase(), x + fontSize * 18, y);
			}

			// Service mode
			ctx.fillStyle = scheme.text + "80";
			ctx.fillText(service.mode, x, y + fontSize);
		};

		const drawContainerFlows = (fontSize: number) => {
			if (!showNetworking) return;

			const containers = containersRef.current;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			containerFlowsRef.current.forEach((flow) => {
				const fromContainer = containers.get(flow.from_container);
				const toContainer = containers.get(flow.to_container);
				if (!fromContainer || !toContainer) return;

				const x1 = fromContainer.x * fontSize;
				const y1 = fromContainer.y * fontSize;
				const x2 = toContainer.x * fontSize;
				const y2 = toContainer.y * fontSize;

				const x = lerp(x1, x2, flow.progress);
				const y = lerp(y1, y2, flow.progress);

				let flowColor = scheme.network;
				if (flow.type === "overlay") flowColor = scheme.manager;
				else if (flow.type === "tcp") flowColor = scheme.worker;

				ctx.fillStyle = flowColor;
				ctx.fillText("●", x, y);

				// Draw connection line
				ctx.strokeStyle = flowColor + "30";
				ctx.lineWidth = 1;
				ctx.setLineDash([1, 3]);
				ctx.beginPath();
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
				ctx.stroke();
				ctx.setLineDash([]);
			});
		};

		const animate = () => {
			if (!isPlaying) return;

			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];
			const fontSize = 10;

			// Clear canvas
			ctx.fillStyle = scheme.bg;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			ctx.font = '10px "Courier New", monospace';
			ctx.textBaseline = "top";

			// Update metrics
			if (Math.random() < 0.1 * speed) {
				updateSwarmMetrics();
			}

			// Draw nodes
			nodesRef.current.forEach((node) => {
				if (viewMode === "node" && node.id !== selectedNode) return;
				drawNode(node, fontSize);
			});

			// Draw containers
			const filteredContainers =
				viewMode === "node"
					? Array.from(containersRef.current.values()).filter(
							(c) => c.node_id === selectedNode,
						)
					: Array.from(containersRef.current.values());

			filteredContainers.forEach((container) => {
				drawContainer(container, fontSize);
			});

			// Draw services
			if (showServices) {
				let serviceY = 50;
				servicesRef.current.forEach((service) => {
					drawService(service, canvas.width - 350, serviceY, fontSize);
					serviceY += fontSize * 3;
				});
			}

			// Draw container flows
			drawContainerFlows(fontSize);

			// Draw cluster statistics
			const allContainers = Array.from(containersRef.current.values());
			const allNodes = Array.from(nodesRef.current.values());
			const allServices = Array.from(servicesRef.current.values());
			const runningContainers = allContainers.filter(
				(c) => c.status === "running",
			).length;
			const unhealthyContainers = allContainers.filter(
				(c) => c.health === "unhealthy",
			).length;
			const readyNodes = allNodes.filter((n) => n.status === "ready").length;
			const managerNodes = allNodes.filter(
				(n) => n.role === "manager" && n.status === "ready",
			).length;
			const updatingServices = allServices.filter(
				(s) => s.update_status === "updating",
			).length;

			ctx.fillStyle = scheme.text;
			ctx.fillText(
				`Docker Swarm Cluster Dashboard - ${viewMode.toUpperCase()} VIEW`,
				10,
				canvas.height - 120,
			);
			ctx.fillText(
				`Nodes: ${readyNodes}/${allNodes.length} Ready | Managers: ${managerNodes}/3 | Workers: ${readyNodes - managerNodes}`,
				10,
				canvas.height - 105,
			);
			ctx.fillText(
				`Containers: ${runningContainers} Running | ${unhealthyContainers} Unhealthy | Total: ${allContainers.length}`,
				10,
				canvas.height - 90,
			);
			ctx.fillText(
				`Services: ${allServices.length} Total | ${updatingServices} Updating | Flows: ${containerFlowsRef.current.length}`,
				10,
				canvas.height - 75,
			);
			ctx.fillText(
				`Simulation: ${simulationMode} | Scaling: ${scalingMode} | Display: ${displayMetric}`,
				10,
				canvas.height - 60,
			);

			if (viewMode === "node") {
				const node = nodesRef.current.get(selectedNode);
				if (node) {
					ctx.fillText(
						`Viewing: ${node.name} (${node.containers_running} containers)`,
						10,
						canvas.height - 45,
					);
				}
			}

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
		viewMode,
		selectedNode,
		displayMetric,
		showServices,
		showNetworking,
		colorScheme,
		simulationMode,
		scalingMode,
	]);

	return (
		<div className="flex flex-col h-screen bg-black">
			<div className="flex-shrink-0 bg-gray-900 p-4 border-b border-gray-700">
				<h1 className="text-2xl font-bold text-blue-400 mb-4">
					🐳 ASCII Docker Swarm Monitor
				</h1>

				<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-sm mb-4">
					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Animation</label>
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
						<label className="text-blue-300 mb-2">
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
						<label className="text-blue-300 mb-2">View Mode</label>
						<select
							value={viewMode}
							onChange={(e) => setViewMode(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
						>
							<option value="cluster">Full Cluster</option>
							<option value="node">Single Node</option>
							<option value="detailed">Detailed View</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Selected Node</label>
						<select
							value={selectedNode}
							onChange={(e) => setSelectedNode(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
							disabled={viewMode !== "node"}
						>
							<option value="manager-1">Manager 1</option>
							<option value="manager-2">Manager 2</option>
							<option value="manager-3">Manager 3</option>
							<option value="worker-1">Worker 1</option>
							<option value="worker-2">Worker 2</option>
							<option value="worker-3">Worker 3</option>
							<option value="worker-4">Worker 4</option>
							<option value="worker-5">Worker 5</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Display Metric</label>
						<select
							value={displayMetric}
							onChange={(e) => setDisplayMetric(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
						>
							<option value="cpu">CPU Usage</option>
							<option value="memory">Memory Usage</option>
							<option value="network">Network I/O</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Color Scheme</label>
						<select
							value={colorScheme}
							onChange={(e) => setColorScheme(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
						>
							<option value="docker">Docker Blue</option>
							<option value="swarm">Swarm Purple</option>
							<option value="production">Production Terminal</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Simulation</label>
						<select
							value={simulationMode}
							onChange={(e) => setSimulationMode(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
						>
							<option value="normal">Normal Operations</option>
							<option value="rolling-update">Rolling Update</option>
							<option value="high-load">High Load</option>
							<option value="node-failure">Node Failure</option>
						</select>
					</div>

					<div className="flex flex-col gap-2">
						<label className="flex items-center text-blue-300 text-xs">
							<input
								type="checkbox"
								checked={showServices}
								onChange={(e) => setShowServices(e.target.checked)}
								className="mr-1"
							/>
							Services
						</label>
						<label className="flex items-center text-blue-300 text-xs">
							<input
								type="checkbox"
								checked={showNetworking}
								onChange={(e) => setShowNetworking(e.target.checked)}
								className="mr-1"
							/>
							Networking
						</label>
					</div>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Scaling Mode</label>
						<select
							value={scalingMode}
							onChange={(e) => setScalingMode(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
						>
							<option value="manual">Manual Scaling</option>
							<option value="auto">Auto Scaling</option>
						</select>
					</div>
				</div>

				<div className="mt-4 text-blue-400 text-sm">
					<p>
						🐳 <strong>Docker Swarm orchestration</strong> with real-time
						container lifecycle and service management!
					</p>
					<p>
						🔄 <strong>Simulate cluster operations</strong> - rolling updates,
						scaling events, and node failures!
					</p>
					<p>
						🌐 <strong>Container networking</strong> with overlay networks and
						inter-service communication flows!
					</p>
					<p>
						Monitor manager/worker nodes, containerized services, health checks
						across distributed Swarm cluster
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

			<div className="flex justify-center p-4 border-t border-gray-700">
				<a
					href="/examples/visual"
					className="text-blue-400 hover:text-blue-300 transition-colors"
				>
					← Back to Visual Examples
				</a>
			</div>
		</div>
	);
}