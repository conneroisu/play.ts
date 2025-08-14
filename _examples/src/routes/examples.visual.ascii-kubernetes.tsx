import { createFileRoute } from "@tanstack/react-router";
import { clamp, lerp } from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/visual/ascii-kubernetes")({
	component: ASCIIKubernetesExample,
});

interface KubePod {
	id: string;
	name: string;
	namespace: string;
	node: string;
	status: "Pending" | "Running" | "Succeeded" | "Failed" | "Unknown";
	ready: boolean;
	restarts: number;
	age: number;
	cpu_usage: number;
	memory_usage: number;
	x: number;
	y: number;
	labels: Record<string, string>;
	containers: KubeContainer[];
	phase_transition: number;
}

interface KubeContainer {
	name: string;
	image: string;
	status: "Running" | "Waiting" | "Terminated";
	ready: boolean;
	restart_count: number;
}

interface KubeNode {
	id: string;
	name: string;
	type: "master" | "worker";
	status: "Ready" | "NotReady" | "SchedulingDisabled";
	cpu_capacity: number;
	memory_capacity: number;
	cpu_usage: number;
	memory_usage: number;
	pod_count: number;
	max_pods: number;
	x: number;
	y: number;
	taints: string[];
	version: string;
	uptime: number;
	conditions: string[];
}

interface KubeService {
	id: string;
	name: string;
	namespace: string;
	type: "ClusterIP" | "NodePort" | "LoadBalancer" | "ExternalName";
	cluster_ip: string;
	external_ip: string;
	ports: string[];
	endpoints: string[];
	selector: Record<string, string>;
	traffic_flow: number;
}

interface NetworkFlow {
	id: string;
	from_pod: string;
	to_service: string;
	progress: number;
	type: "http" | "grpc" | "tcp" | "dns";
	latency: number;
	status_code: number;
}

function ASCIIKubernetesExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>(0);
	const podsRef = useRef<Map<string, KubePod>>(new Map());
	const nodesRef = useRef<Map<string, KubeNode>>(new Map());
	const servicesRef = useRef<Map<string, KubeService>>(new Map());
	const networkFlowsRef = useRef<NetworkFlow[]>([]);
	const [isPlaying, setIsPlaying] = useState(true);
	const [speed, setSpeed] = useState(1);
	const [viewMode, setViewMode] = useState("cluster");
	const [selectedNamespace, setSelectedNamespace] = useState("default");
	const [displayMetric, setDisplayMetric] = useState("cpu");
	const [showServices, setShowServices] = useState(true);
	const [showNetworkFlow, setShowNetworkFlow] = useState(true);
	const [colorScheme, setColorScheme] = useState("kubernetes");
	const [simulationMode, setSimulationMode] = useState("normal");
	const [autoScale, setAutoScale] = useState(false);

	const colorSchemes = {
		kubernetes: {
			bg: "#001122",
			master: "#326CE5",
			worker: "#4CAF50",
			running: "#00C851",
			pending: "#FF6900",
			failed: "#FF4444",
			service: "#2196F3",
			text: "#FFFFFF",
			network: "#9C27B0",
		},
		openshift: {
			bg: "#0F1419",
			master: "#EE0000",
			worker: "#CC0000",
			running: "#00AA00",
			pending: "#FFAA00",
			failed: "#FF0000",
			service: "#0066CC",
			text: "#FFFFFF",
			network: "#FF6600",
		},
		dark: {
			bg: "#000000",
			master: "#FFFFFF",
			worker: "#CCCCCC",
			running: "#00FF00",
			pending: "#FFFF00",
			failed: "#FF0000",
			service: "#00FFFF",
			text: "#FFFFFF",
			network: "#FF00FF",
		},
	};

	const namespaces = [
		"default",
		"kube-system",
		"monitoring",
		"ingress",
		"app-prod",
		"app-staging",
	];

	useEffect(() => {
		// Initialize Kubernetes cluster
		const nodes = new Map<string, KubeNode>();
		const pods = new Map<string, KubePod>();
		const services = new Map<string, KubeService>();

		// Create master nodes
		const masterNode: KubeNode = {
			id: "master-1",
			name: "k8s-master-1",
			type: "master",
			status: "Ready",
			cpu_capacity: 4000,
			memory_capacity: 8192,
			cpu_usage: 500,
			memory_usage: 2048,
			pod_count: 8,
			max_pods: 110,
			x: 50,
			y: 5,
			taints: ["node-role.kubernetes.io/master:NoSchedule"],
			version: "v1.28.0",
			uptime: 86400,
			conditions: ["Ready", "MemoryPressure=False", "DiskPressure=False"],
		};
		nodes.set("master-1", masterNode);

		// Create worker nodes
		for (let i = 1; i <= 3; i++) {
			const workerNode: KubeNode = {
				id: `worker-${i}`,
				name: `k8s-worker-${i}`,
				type: "worker",
				status: "Ready",
				cpu_capacity: 8000,
				memory_capacity: 16384,
				cpu_usage: Math.random() * 4000 + 1000,
				memory_usage: Math.random() * 8000 + 2000,
				pod_count: Math.floor(Math.random() * 20) + 5,
				max_pods: 110,
				x: 15 + (i - 1) * 35,
				y: 15,
				taints: [],
				version: "v1.28.0",
				uptime: 86400 - i * 3600,
				conditions: ["Ready", "MemoryPressure=False", "DiskPressure=False"],
			};
			nodes.set(`worker-${i}`, workerNode);
		}

		// Create system pods
		const systemPods = [
			{ name: "kube-apiserver", namespace: "kube-system", node: "master-1" },
			{
				name: "kube-controller-manager",
				namespace: "kube-system",
				node: "master-1",
			},
			{ name: "kube-scheduler", namespace: "kube-system", node: "master-1" },
			{ name: "etcd", namespace: "kube-system", node: "master-1" },
			{ name: "kube-proxy", namespace: "kube-system", node: "worker-1" },
			{ name: "kube-proxy", namespace: "kube-system", node: "worker-2" },
			{ name: "kube-proxy", namespace: "kube-system", node: "worker-3" },
			{ name: "coredns", namespace: "kube-system", node: "worker-1" },
			{ name: "coredns", namespace: "kube-system", node: "worker-2" },
		];

		// Create application pods
		const appPods = [
			{ name: "web-frontend", namespace: "default", replicas: 3 },
			{ name: "api-backend", namespace: "default", replicas: 2 },
			{ name: "database", namespace: "default", replicas: 1 },
			{ name: "redis-cache", namespace: "default", replicas: 1 },
			{ name: "nginx-ingress", namespace: "ingress", replicas: 2 },
			{ name: "prometheus", namespace: "monitoring", replicas: 1 },
			{ name: "grafana", namespace: "monitoring", replicas: 1 },
		];

		let podCounter = 0;
		let yOffset = 25;

		// Add system pods
		systemPods.forEach((podConfig) => {
			const node = nodes.get(podConfig.node);
			if (!node) return;

			const pod: KubePod = {
				id: `${podConfig.name}-${podCounter++}`,
				name: podConfig.name,
				namespace: podConfig.namespace,
				node: podConfig.node,
				status: "Running",
				ready: true,
				restarts: Math.floor(Math.random() * 3),
				age: Math.random() * 86400,
				cpu_usage: Math.random() * 200 + 50,
				memory_usage: Math.random() * 512 + 128,
				x: node.x - 5,
				y: yOffset,
				labels: { app: podConfig.name, tier: "system" },
				containers: [
					{
						name: podConfig.name,
						image: `k8s.gcr.io/${podConfig.name}:v1.28.0`,
						status: "Running",
						ready: true,
						restart_count: 0,
					},
				],
				phase_transition: 0,
			};
			pods.set(pod.id, pod);
			yOffset += 2;
		});

		// Add application pods
		const workerNodes = Array.from(nodes.values()).filter(
			(n) => n.type === "worker",
		);
		yOffset = 25;

		appPods.forEach((appConfig) => {
			for (let i = 0; i < appConfig.replicas; i++) {
				const node =
					workerNodes[Math.floor(Math.random() * workerNodes.length)];

				const pod: KubePod = {
					id: `${appConfig.name}-${i}-${podCounter++}`,
					name: `${appConfig.name}-${i}`,
					namespace: appConfig.namespace,
					node: node.id,
					status: Math.random() > 0.95 ? "Pending" : "Running",
					ready: Math.random() > 0.1,
					restarts: Math.floor(Math.random() * 5),
					age: Math.random() * 172800,
					cpu_usage: Math.random() * 500 + 100,
					memory_usage: Math.random() * 1024 + 256,
					x: node.x + (i % 3) * 8,
					y: yOffset + Math.floor(i / 3) * 2,
					labels: { app: appConfig.name, version: "v1.0.0" },
					containers: [
						{
							name: appConfig.name,
							image: `app/${appConfig.name}:latest`,
							status: "Running",
							ready: true,
							restart_count: Math.floor(Math.random() * 3),
						},
					],
					phase_transition: 0,
				};
				pods.set(pod.id, pod);
			}
			yOffset += 4;
		});

		// Create services
		const serviceConfigs = [
			{
				name: "kubernetes",
				namespace: "default",
				type: "ClusterIP",
				ip: "10.96.0.1",
			},
			{
				name: "web-service",
				namespace: "default",
				type: "LoadBalancer",
				ip: "10.96.1.100",
			},
			{
				name: "api-service",
				namespace: "default",
				type: "ClusterIP",
				ip: "10.96.1.101",
			},
			{
				name: "database-service",
				namespace: "default",
				type: "ClusterIP",
				ip: "10.96.1.102",
			},
			{
				name: "redis-service",
				namespace: "default",
				type: "ClusterIP",
				ip: "10.96.1.103",
			},
			{
				name: "nginx-ingress",
				namespace: "ingress",
				type: "NodePort",
				ip: "10.96.2.100",
			},
			{
				name: "prometheus",
				namespace: "monitoring",
				type: "ClusterIP",
				ip: "10.96.3.100",
			},
		];

		serviceConfigs.forEach((svcConfig, i) => {
			const service: KubeService = {
				id: `svc-${i}`,
				name: svcConfig.name,
				namespace: svcConfig.namespace,
				type: svcConfig.type as any,
				cluster_ip: svcConfig.ip,
				external_ip:
					svcConfig.type === "LoadBalancer" ? "192.168.1.100" : "<none>",
				ports: ["80:30080/TCP"],
				endpoints: [],
				selector: { app: svcConfig.name },
				traffic_flow: Math.random() * 100,
			};
			services.set(service.id, service);
		});

		nodesRef.current = nodes;
		podsRef.current = pods;
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

		const updateKubernetesMetrics = () => {
			const pods = podsRef.current;
			const nodes = nodesRef.current;
			const services = servicesRef.current;
			const time = Date.now() / 1000;

			// Update pod metrics
			pods.forEach((pod) => {
				// Simulate pod lifecycle
				if (
					simulationMode === "rolling-update" &&
					Math.random() < 0.01 * speed
				) {
					if (pod.status === "Running") {
						pod.status = "Pending";
						pod.phase_transition = 30; // Animation frames
					}
				} else if (
					simulationMode === "node-failure" &&
					pod.node === "worker-1"
				) {
					pod.status = "Failed";
					pod.ready = false;
				} else if (simulationMode === "resource-pressure") {
					pod.cpu_usage = Math.min(1000, pod.cpu_usage + Math.random() * 50);
					pod.memory_usage = Math.min(
						2048,
						pod.memory_usage + Math.random() * 100,
					);
				}

				// Update metrics with natural variance
				if (pod.status === "Running") {
					pod.cpu_usage = clamp(
						pod.cpu_usage + (Math.random() - 0.5) * 20,
						10,
						pod.namespace === "kube-system" ? 500 : 1000,
					);
					pod.memory_usage = clamp(
						pod.memory_usage + (Math.random() - 0.5) * 50,
						64,
						pod.namespace === "kube-system" ? 1024 : 2048,
					);
				}

				// Handle phase transitions
				if (pod.phase_transition > 0) {
					pod.phase_transition--;
					if (pod.phase_transition === 0 && pod.status === "Pending") {
						pod.status = "Running";
						pod.ready = true;
					}
				}

				pod.age += speed;
			});

			// Update node metrics
			nodes.forEach((node) => {
				if (simulationMode === "node-failure" && node.id === "worker-1") {
					node.status = "NotReady";
					node.conditions = ["Ready=False", "NetworkUnavailable=True"];
				} else {
					node.status = "Ready";
				}

				// Calculate node utilization from pods
				const nodePods = Array.from(pods.values()).filter(
					(p) => p.node === node.id,
				);
				node.pod_count = nodePods.length;
				node.cpu_usage = nodePods.reduce((sum, p) => sum + p.cpu_usage, 0);
				node.memory_usage = nodePods.reduce(
					(sum, p) => sum + p.memory_usage,
					0,
				);

				node.uptime += speed;
			});

			// Update service traffic
			services.forEach((service) => {
				service.traffic_flow = clamp(
					service.traffic_flow + (Math.random() - 0.5) * 10,
					0,
					200,
				);
			});

			// Generate network flows
			if (Math.random() < 0.15 * speed && showNetworkFlow) {
				const runningPods = Array.from(pods.values()).filter(
					(p) => p.status === "Running",
				);
				const availableServices = Array.from(services.values());

				if (runningPods.length > 0 && availableServices.length > 0) {
					const sourcePod =
						runningPods[Math.floor(Math.random() * runningPods.length)];
					const targetService =
						availableServices[
							Math.floor(Math.random() * availableServices.length)
						];

					networkFlowsRef.current.push({
						id: `flow-${sourcePod.id}-${targetService.id}-${Date.now()}`,
						from_pod: sourcePod.id,
						to_service: targetService.id,
						progress: 0,
						type:
							Math.random() < 0.6
								? "http"
								: Math.random() < 0.8
									? "grpc"
									: "tcp",
						latency: Math.random() * 50 + 5,
						status_code:
							Math.random() < 0.95 ? 200 : Math.random() < 0.5 ? 404 : 500,
					});
				}
			}

			// Update network flows
			networkFlowsRef.current = networkFlowsRef.current.filter((flow) => {
				flow.progress += 0.04 * speed;
				return flow.progress < 1;
			});
		};

		const getPodStatusColor = (pod: KubePod, scheme: any) => {
			if (pod.status === "Failed") return scheme.failed;
			if (pod.status === "Pending") return scheme.pending;
			if (!pod.ready) return scheme.pending;
			return scheme.running;
		};

		const drawPod = (pod: KubePod, fontSize: number) => {
			const x = pod.x * fontSize;
			const y = pod.y * fontSize;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Pod status icon
			ctx.fillStyle = getPodStatusColor(pod, scheme);
			const icon =
				pod.phase_transition > 0
					? "◐"
					: pod.status === "Running"
						? "●"
						: pod.status === "Pending"
							? "◯"
							: pod.status === "Failed"
								? "✕"
								: "◐";
			ctx.fillText(icon, x, y);

			// Pod name
			ctx.fillStyle = scheme.text;
			ctx.fillText(pod.name, x + fontSize, y);

			// Namespace badge
			if (viewMode === "detailed" || pod.namespace !== selectedNamespace) {
				ctx.fillStyle = scheme.text + "80";
				ctx.fillText(`[${pod.namespace}]`, x + fontSize * 12, y);
			}

			// Resource metrics
			if (viewMode === "detailed") {
				const value =
					displayMetric === "cpu" ? pod.cpu_usage : pod.memory_usage;
				const unit = displayMetric === "cpu" ? "m" : "Mi";
				const max = displayMetric === "cpu" ? 1000 : 2048;

				const barWidth = 8;
				const percentage = value / max;
				const filled = Math.floor(percentage * barWidth);

				ctx.fillStyle = scheme.text + "40";
				ctx.fillText("█".repeat(barWidth), x, y + fontSize);

				if (filled > 0) {
					ctx.fillStyle =
						percentage > 0.8
							? scheme.failed
							: percentage > 0.6
								? scheme.pending
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
			if (pod.restarts > 0) {
				ctx.fillStyle = scheme.pending;
				ctx.fillText(`R:${pod.restarts}`, x + fontSize * 18, y);
			}
		};

		const drawNode = (node: KubeNode, fontSize: number) => {
			const x = node.x * fontSize;
			const y = node.y * fontSize;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Node box
			const boxWidth = 20;
			const boxHeight = node.type === "master" ? 8 : 12;

			ctx.strokeStyle = node.type === "master" ? scheme.master : scheme.worker;
			ctx.lineWidth = 2;
			ctx.strokeRect(
				x - fontSize,
				y - fontSize,
				boxWidth * fontSize,
				boxHeight * fontSize,
			);

			// Node type icon
			ctx.fillStyle = node.type === "master" ? scheme.master : scheme.worker;
			const icon = node.type === "master" ? "⚡" : "⚙";
			ctx.fillText(icon, x - fontSize * 0.5, y - fontSize * 0.5);

			// Node name
			ctx.fillStyle = scheme.text;
			ctx.fillText(node.name, x, y);

			// Node status
			const statusColor =
				node.status === "Ready"
					? scheme.running
					: node.status === "NotReady"
						? scheme.failed
						: scheme.pending;
			ctx.fillStyle = statusColor;
			ctx.fillText(node.status, x + fontSize * 10, y);

			// Resource utilization
			ctx.fillStyle = scheme.text;
			const cpuPercent = ((node.cpu_usage / node.cpu_capacity) * 100).toFixed(
				0,
			);
			const memPercent = (
				(node.memory_usage / node.memory_capacity) *
				100
			).toFixed(0);
			ctx.fillText(`CPU: ${cpuPercent}%`, x, y + fontSize * 1.5);
			ctx.fillText(`MEM: ${memPercent}%`, x, y + fontSize * 2.5);
			ctx.fillText(
				`Pods: ${node.pod_count}/${node.max_pods}`,
				x,
				y + fontSize * 3.5,
			);

			// Version and uptime
			ctx.fillStyle = scheme.text + "80";
			ctx.fillText(node.version, x + fontSize * 10, y + fontSize * 1.5);
			ctx.fillText(
				`${Math.floor(node.uptime / 3600)}h`,
				x + fontSize * 10,
				y + fontSize * 2.5,
			);
		};

		const drawService = (
			service: KubeService,
			x: number,
			y: number,
			fontSize: number,
		) => {
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Service icon
			ctx.fillStyle = scheme.service;
			ctx.fillText("◇", x, y);

			// Service name and type
			ctx.fillStyle = scheme.text;
			ctx.fillText(`${service.name} (${service.type})`, x + fontSize, y);

			// Traffic indicator
			if (service.traffic_flow > 0) {
				const intensity = Math.floor(service.traffic_flow / 20);
				ctx.fillStyle = scheme.network;
				ctx.fillText("▶".repeat(Math.min(5, intensity)), x + fontSize * 15, y);
			}
		};

		const drawNetworkFlows = (fontSize: number) => {
			if (!showNetworkFlow) return;

			const pods = podsRef.current;
			const services = servicesRef.current;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			networkFlowsRef.current.forEach((flow) => {
				const sourcePod = pods.get(flow.from_pod);
				const targetService = services.get(flow.to_service);
				if (!sourcePod) return;

				const x1 = sourcePod.x * fontSize;
				const y1 = sourcePod.y * fontSize;

				// For services, use a fixed position
				const x2 = canvas.width - 200 + Math.random() * 100;
				const y2 = 100 + Math.random() * 100;

				const x = lerp(x1, x2, flow.progress);
				const y = lerp(y1, y2, flow.progress);

				let flowColor = scheme.network;
				if (flow.status_code >= 400) flowColor = scheme.failed;
				else if (flow.status_code >= 300) flowColor = scheme.pending;

				ctx.fillStyle = flowColor;
				ctx.fillText("●", x, y);

				// Draw faint connection line
				ctx.strokeStyle = flowColor + "30";
				ctx.lineWidth = 1;
				ctx.setLineDash([2, 4]);
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
			const fontSize = 12;

			// Clear canvas
			ctx.fillStyle = scheme.bg;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			ctx.font = '12px "Courier New", monospace';
			ctx.textBaseline = "top";

			// Update metrics
			if (Math.random() < 0.08 * speed) {
				updateKubernetesMetrics();
			}

			// Draw nodes
			nodesRef.current.forEach((node) => {
				drawNode(node, fontSize);
			});

			// Draw pods (filtered by namespace if needed)
			const filteredPods =
				viewMode === "namespace"
					? Array.from(podsRef.current.values()).filter(
							(p) => p.namespace === selectedNamespace,
						)
					: Array.from(podsRef.current.values());

			filteredPods.forEach((pod) => {
				drawPod(pod, fontSize);
			});

			// Draw services
			if (showServices) {
				let serviceY = 50;
				const servicesInNamespace =
					viewMode === "namespace"
						? Array.from(servicesRef.current.values()).filter(
								(s) => s.namespace === selectedNamespace,
							)
						: Array.from(servicesRef.current.values());

				servicesInNamespace.forEach((service) => {
					drawService(service, canvas.width - 300, serviceY, fontSize);
					serviceY += fontSize * 2;
				});
			}

			// Draw network flows
			drawNetworkFlows(fontSize);

			// Draw cluster statistics
			const allPods = Array.from(podsRef.current.values());
			const allNodes = Array.from(nodesRef.current.values());
			const runningPods = allPods.filter((p) => p.status === "Running").length;
			const pendingPods = allPods.filter((p) => p.status === "Pending").length;
			const failedPods = allPods.filter((p) => p.status === "Failed").length;
			const readyNodes = allNodes.filter((n) => n.status === "Ready").length;
			const totalCpu = allNodes.reduce((sum, n) => sum + n.cpu_usage, 0);
			const totalMemory = allNodes.reduce((sum, n) => sum + n.memory_usage, 0);

			ctx.fillStyle = scheme.text;
			ctx.fillText(
				`Kubernetes Cluster Dashboard - ${viewMode.toUpperCase()} VIEW`,
				10,
				canvas.height - 120,
			);
			ctx.fillText(
				`Nodes: ${readyNodes}/${allNodes.length} Ready | Total CPU: ${totalCpu.toFixed(0)}m | Memory: ${(totalMemory / 1024).toFixed(1)}Gi`,
				10,
				canvas.height - 105,
			);
			ctx.fillText(
				`Pods: ${runningPods} Running | ${pendingPods} Pending | ${failedPods} Failed | Total: ${allPods.length}`,
				10,
				canvas.height - 90,
			);
			ctx.fillText(
				`Network Flows: ${networkFlowsRef.current.length} active | Simulation: ${simulationMode}`,
				10,
				canvas.height - 75,
			);

			if (viewMode === "namespace") {
				const nsPods = allPods.filter((p) => p.namespace === selectedNamespace);
				ctx.fillText(
					`Namespace: ${selectedNamespace} (${nsPods.length} pods)`,
					10,
					canvas.height - 60,
				);
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
		selectedNamespace,
		displayMetric,
		showServices,
		showNetworkFlow,
		colorScheme,
		simulationMode,
		autoScale,
	]);

	return (
		<div className="flex flex-col h-screen bg-black">
			<div className="flex-shrink-0 bg-gray-900 p-4 border-b border-gray-700">
				<h1 className="text-2xl font-bold text-blue-400 mb-4">
					☸️ ASCII Kubernetes Cluster Monitor
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
							<option value="namespace">Namespace View</option>
							<option value="detailed">Detailed View</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Namespace</label>
						<select
							value={selectedNamespace}
							onChange={(e) => setSelectedNamespace(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
							disabled={viewMode !== "namespace"}
						>
							{namespaces.map((ns) => (
								<option key={ns} value={ns}>
									{ns}
								</option>
							))}
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
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Color Scheme</label>
						<select
							value={colorScheme}
							onChange={(e) => setColorScheme(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
						>
							<option value="kubernetes">Kubernetes Blue</option>
							<option value="openshift">OpenShift Red</option>
							<option value="dark">Dark Terminal</option>
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
							<option value="node-failure">Node Failure</option>
							<option value="resource-pressure">Resource Pressure</option>
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
								checked={showNetworkFlow}
								onChange={(e) => setShowNetworkFlow(e.target.checked)}
								className="mr-1"
							/>
							Network Flow
						</label>
					</div>
				</div>

				<div className="mt-4 text-blue-400 text-sm">
					<p>
						☸️ <strong>Kubernetes cluster monitoring</strong> with real-time pod
						scheduling and lifecycle management!
					</p>
					<p>
						🚀 <strong>Simulate cluster events</strong> - rolling updates, node
						failures, and resource pressure scenarios!
					</p>
					<p>
						🌐 <strong>Network visualization</strong> with service mesh traffic
						flows and inter-pod communication!
					</p>
					<p>
						Monitor master/worker nodes, system/application pods, services
						across multiple namespaces with live metrics
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
