import { clamp, lerp } from "play.ts";
import { useEffect, useRef, useState } from "react";

interface CloudResource {
	id: string;
	name: string;
	type: "vm" | "container" | "function" | "storage" | "network" | "database";
	region: string;
	zone: string;
	status: "running" | "starting" | "stopping" | "error" | "scaling";
	utilization: number;
	cost: number;
	x: number;
	y: number;
	connections: string[];
	scaling_target: number;
	auto_scale: boolean;
	health_score: number;
	alerts: string[];
	deployment_wave: number;
}

interface CloudRegion {
	name: string;
	code: string;
	x: number;
	y: number;
	resources: CloudResource[];
	latency: number;
	status: "healthy" | "degraded" | "outage";
}

interface DataFlow {
	id: string;
	from: string;
	to: string;
	progress: number;
	type: "api" | "data_sync" | "backup" | "cdn" | "migration";
	volume: number;
	latency: number;
}

export default function AsciiCloudInfrastructureExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>(0);
	const regionsRef = useRef<Map<string, CloudRegion>>(new Map());
	const resourcesRef = useRef<Map<string, CloudResource>>(new Map());
	const dataFlowsRef = useRef<DataFlow[]>([]);
	const [isPlaying, setIsPlaying] = useState(true);
	const [speed, setSpeed] = useState(1);
	const [viewMode, setViewMode] = useState("global");
	const [selectedRegion, setSelectedRegion] = useState("us-east-1");
	const [displayMetric, setDisplayMetric] = useState("utilization");
	const [autoScale, setAutoScale] = useState(true);
	const [colorScheme, setColorScheme] = useState("cloud");
	const [showDataFlow, setShowDataFlow] = useState(true);
	const [simulationMode, setSimulationMode] = useState("normal");
	const [deploymentActive, setDeploymentActive] = useState(false);

	const colorSchemes = {
		cloud: {
			bg: "#001122",
			healthy: "#00AA44",
			warning: "#FFAA00",
			critical: "#FF4444",
			data: "#00AAFF",
			text: "#FFFFFF",
		},
		aws: {
			bg: "#232F3E",
			healthy: "#FF9900",
			warning: "#FFAA00",
			critical: "#FF4444",
			data: "#146EB4",
			text: "#FFFFFF",
		},
		azure: {
			bg: "#0078D4",
			healthy: "#00BCF2",
			warning: "#FFAA00",
			critical: "#FF4444",
			data: "#40E0D0",
			text: "#FFFFFF",
		},
		gcp: {
			bg: "#1A73E8",
			healthy: "#34A853",
			warning: "#FBBC04",
			critical: "#EA4335",
			data: "#4285F4",
			text: "#FFFFFF",
		},
		dark: {
			bg: "#000000",
			healthy: "#00FF00",
			warning: "#FFAA00",
			critical: "#FF0000",
			data: "#00AAFF",
			text: "#FFFFFF",
		},
	};

	useEffect(() => {
		// Initialize cloud regions and resources
		const regions = new Map<string, CloudRegion>();
		const resources = new Map<string, CloudResource>();

		const regionConfigs = [
			{ name: "US East 1", code: "us-east-1", x: 20, y: 15, latency: 10 },
			{ name: "US West 2", code: "us-west-2", x: 5, y: 12, latency: 15 },
			{ name: "EU West 1", code: "eu-west-1", x: 40, y: 8, latency: 45 },
			{
				name: "Asia Pacific",
				code: "ap-southeast-1",
				x: 70,
				y: 20,
				latency: 120,
			},
			{ name: "South America", code: "sa-east-1", x: 25, y: 30, latency: 80 },
		];

		regionConfigs.forEach((regionConfig) => {
			const region: CloudRegion = {
				name: regionConfig.name,
				code: regionConfig.code,
				x: regionConfig.x,
				y: regionConfig.y,
				resources: [],
				latency: regionConfig.latency,
				status: "healthy",
			};

			// Create resources for each region
			const resourceTypes = [
				{ type: "vm", count: 3, prefix: "vm" },
				{ type: "container", count: 5, prefix: "pod" },
				{ type: "function", count: 2, prefix: "fn" },
				{ type: "storage", count: 1, prefix: "s3" },
				{ type: "database", count: 1, prefix: "db" },
				{ type: "network", count: 1, prefix: "lb" },
			];

			let resourceY = 0;
			resourceTypes.forEach((resType) => {
				for (let i = 0; i < resType.count; i++) {
					const resourceId = `${regionConfig.code}-${resType.prefix}-${i + 1}`;
					const resource: CloudResource = {
						id: resourceId,
						name: `${resType.prefix}-${i + 1}`,
						type: resType.type as any,
						region: regionConfig.code,
						zone: `${regionConfig.code}${String.fromCharCode(97 + (i % 3))}`,
						status: "running",
						utilization: Math.random() * 80 + 10,
						cost: Math.random() * 100 + 20,
						x: regionConfig.x + (i % 3) * 3,
						y: regionConfig.y + 2 + resourceY + Math.floor(i / 3) * 2,
						connections: [],
						scaling_target: 1,
						auto_scale:
							resType.type === "container" || resType.type === "function",
						health_score: 90 + Math.random() * 10,
						alerts: [],
						deployment_wave: 0,
					};

					resources.set(resourceId, resource);
					region.resources.push(resource);
				}
				resourceY += Math.ceil(resType.count / 3) * 2 + 1;
			});

			regions.set(regionConfig.code, region);
		});

		// Set up connections between resources
		resources.forEach((resource) => {
			if (resource.type === "network") {
				// Load balancers connect to VMs and containers in same region
				const targets = Array.from(resources.values()).filter(
					(r) =>
						r.region === resource.region &&
						(r.type === "vm" || r.type === "container"),
				);
				resource.connections = targets.map((t) => t.id);
			} else if (resource.type === "vm" || resource.type === "container") {
				// Connect to databases and storage
				const targets = Array.from(resources.values()).filter(
					(r) =>
						r.region === resource.region &&
						(r.type === "database" || r.type === "storage"),
				);
				resource.connections = targets.map((t) => t.id);
			}
		});

		regionsRef.current = regions;
		resourcesRef.current = resources;
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

		const updateCloudMetrics = () => {
			const resources = resourcesRef.current;
			const regions = regionsRef.current;
			const time = Date.now() / 1000;

			resources.forEach((resource) => {
				// Apply simulation effects
				let baseUtilization = resource.utilization;

				if (simulationMode === "traffic-spike") {
					if (
						resource.type === "vm" ||
						resource.type === "container" ||
						resource.type === "function"
					) {
						baseUtilization = Math.min(
							95,
							baseUtilization + 30 + 20 * Math.sin(time * 2),
						);
					}
				} else if (simulationMode === "region-outage") {
					if (resource.region === "us-east-1") {
						resource.status = "error";
						baseUtilization = 0;
					}
				} else if (simulationMode === "auto-scaling") {
					if (resource.type === "container" && resource.auto_scale) {
						const targetUtilization = 70;
						if (baseUtilization > 80) {
							resource.scaling_target = Math.min(
								5,
								resource.scaling_target + 1,
							);
						} else if (baseUtilization < 30 && resource.scaling_target > 1) {
							resource.scaling_target = Math.max(
								1,
								resource.scaling_target - 1,
							);
						}
					}
				}

				// Update utilization with natural variance
				if (resource.status !== "error") {
					resource.utilization = clamp(
						baseUtilization + (Math.random() - 0.5) * 10,
						0,
						resource.type === "function" ? 100 : 95,
					);
				}

				// Update costs based on utilization and scaling
				resource.cost =
					resource.utilization * 0.5 +
					resource.scaling_target * 10 +
					Math.random() * 5;

				// Update health score
				if (resource.status === "error") {
					resource.health_score = Math.max(0, resource.health_score - 5);
				} else {
					resource.health_score = Math.min(
						100,
						resource.health_score + (Math.random() - 0.4),
					);
				}

				// Determine status based on metrics
				if (resource.health_score < 50) {
					resource.status = "error";
				} else if (resource.utilization > 85) {
					resource.status = "scaling";
				} else if (resource.health_score < 80) {
					resource.status = "starting";
				} else {
					resource.status = "running";
				}

				// Generate alerts
				resource.alerts = [];
				if (resource.utilization > 90) resource.alerts.push("High CPU");
				if (resource.health_score < 70) resource.alerts.push("Unhealthy");
				if (resource.cost > 80) resource.alerts.push("High Cost");
			});

			// Update region status
			regions.forEach((region) => {
				const regionResources = Array.from(resources.values()).filter(
					(r) => r.region === region.code,
				);
				const errorCount = regionResources.filter(
					(r) => r.status === "error",
				).length;
				const warningCount = regionResources.filter(
					(r) => r.alerts.length > 0,
				).length;

				if (errorCount > regionResources.length * 0.3) {
					region.status = "outage";
				} else if (
					errorCount > 0 ||
					warningCount > regionResources.length * 0.5
				) {
					region.status = "degraded";
				} else {
					region.status = "healthy";
				}
			});

			// Generate data flows
			if (Math.random() < 0.1 * speed && showDataFlow) {
				const allResources = Array.from(resources.values());
				const from =
					allResources[Math.floor(Math.random() * allResources.length)];

				if (from.connections.length > 0) {
					const targetId =
						from.connections[
							Math.floor(Math.random() * from.connections.length)
						];

					dataFlowsRef.current.push({
						id: `${from.id}-${targetId}-${Date.now()}`,
						from: from.id,
						to: targetId,
						progress: 0,
						type:
							Math.random() < 0.3
								? "api"
								: Math.random() < 0.5
									? "data_sync"
									: "backup",
						volume: Math.random() * 100,
						latency: Math.random() * 50 + 10,
					});
				}
			}

			// Update data flows
			dataFlowsRef.current = dataFlowsRef.current.filter((flow) => {
				flow.progress += 0.02 * speed;
				return flow.progress < 1;
			});
		};

		const getResourceIcon = (type: string) => {
			switch (type) {
				case "vm":
					return "▢";
				case "container":
					return "□";
				case "function":
					return "λ";
				case "storage":
					return "⬢";
				case "database":
					return "⬡";
				case "network":
					return "⬣";
				default:
					return "●";
			}
		};

		const getStatusColor = (status: string, scheme: any) => {
			switch (status) {
				case "running":
					return scheme.healthy;
				case "starting":
					return scheme.warning;
				case "scaling":
					return scheme.warning;
				case "error":
					return scheme.critical;
				case "stopping":
					return scheme.warning;
				default:
					return scheme.text;
			}
		};

		const drawResource = (resource: CloudResource, fontSize: number) => {
			const x = resource.x * fontSize;
			const y = resource.y * fontSize;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Resource icon
			ctx.fillStyle = getStatusColor(resource.status, scheme);
			ctx.fillText(getResourceIcon(resource.type), x, y);

			// Resource name
			ctx.fillStyle = scheme.text;
			ctx.fillText(resource.name, x + fontSize, y);

			// Scaling indicator
			if (resource.auto_scale && resource.scaling_target > 1) {
				ctx.fillText(`×${resource.scaling_target}`, x + fontSize * 6, y);
			}

			// Status indicator
			if (resource.status === "scaling") {
				const frame = Math.floor(Date.now() / 200) % 4;
				ctx.fillText("↕↔↕↔"[frame], x - fontSize, y);
			} else if (resource.status === "error") {
				ctx.fillStyle = scheme.critical;
				ctx.fillText("✕", x - fontSize, y);
			}

			// Metric bar
			if (
				viewMode === "detailed" ||
				(viewMode === "region" && resource.region === selectedRegion)
			) {
				let value = 0;
				switch (displayMetric) {
					case "utilization":
						value = resource.utilization;
						break;
					case "cost":
						value = resource.cost;
						break;
					case "health":
						value = resource.health_score;
						break;
				}

				const barWidth = 8;
				const filled = Math.floor((value / 100) * barWidth);

				ctx.fillStyle = scheme.text + "40";
				ctx.fillText("█".repeat(barWidth), x, y + fontSize);

				if (filled > 0) {
					ctx.fillStyle =
						value > 80
							? scheme.critical
							: value > 60
								? scheme.warning
								: scheme.healthy;
					ctx.fillText("█".repeat(filled), x, y + fontSize);
				}

				ctx.fillStyle = scheme.text;
				ctx.fillText(
					`${value.toFixed(0)}%`,
					x + (barWidth + 1) * fontSize,
					y + fontSize,
				);
			}

			// Alerts
			if (resource.alerts.length > 0 && Date.now() % 1000 < 500) {
				ctx.fillStyle = scheme.critical;
				ctx.fillText("⚠", x + fontSize * 8, y);
			}
		};

		const drawRegion = (region: CloudRegion, fontSize: number) => {
			const x = region.x * fontSize;
			const y = region.y * fontSize;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Region box
			const boxWidth = 20;
			const boxHeight = 15;

			ctx.strokeStyle =
				region.status === "healthy"
					? scheme.healthy
					: region.status === "degraded"
						? scheme.warning
						: scheme.critical;
			ctx.lineWidth = 2;
			ctx.strokeRect(
				x - fontSize,
				y - fontSize,
				boxWidth * fontSize,
				boxHeight * fontSize,
			);

			// Region label
			ctx.fillStyle = scheme.text;
			ctx.fillText(region.name, x, y - fontSize * 0.5);

			// Region code
			ctx.fillText(`(${region.code})`, x, y);

			// Latency info
			ctx.fillText(
				`${region.latency}ms`,
				x + fontSize * 12,
				y - fontSize * 0.5,
			);

			// Resource count
			const runningCount = region.resources.filter(
				(r) => r.status === "running",
			).length;
			const errorCount = region.resources.filter(
				(r) => r.status === "error",
			).length;
			ctx.fillText(
				`${runningCount}/${region.resources.length} healthy`,
				x + fontSize * 12,
				y,
			);

			if (errorCount > 0) {
				ctx.fillStyle = scheme.critical;
				ctx.fillText(`${errorCount} errors`, x + fontSize * 12, y + fontSize);
			}

			// Status indicator
			const statusChar =
				region.status === "healthy"
					? "●"
					: region.status === "degraded"
						? "▲"
						: "✕";
			ctx.fillStyle =
				region.status === "healthy"
					? scheme.healthy
					: region.status === "degraded"
						? scheme.warning
						: scheme.critical;
			ctx.fillText(statusChar, x - fontSize * 0.5, y - fontSize * 0.5);
		};

		const drawDataFlows = (fontSize: number) => {
			if (!showDataFlow) return;

			const resources = resourcesRef.current;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			dataFlowsRef.current.forEach((flow) => {
				const fromResource = resources.get(flow.from);
				const toResource = resources.get(flow.to);
				if (!fromResource || !toResource) return;

				const x1 = fromResource.x * fontSize;
				const y1 = fromResource.y * fontSize;
				const x2 = toResource.x * fontSize;
				const y2 = toResource.y * fontSize;

				const x = lerp(x1, x2, flow.progress);
				const y = lerp(y1, y2, flow.progress);

				let flowColor = scheme.data;
				if (flow.type === "backup") flowColor = scheme.warning;
				else if (flow.type === "migration") flowColor = scheme.critical;

				ctx.fillStyle = flowColor;
				ctx.fillText("●", x, y);

				// Draw connection line
				ctx.strokeStyle = flowColor + "40";
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
			if (Math.random() < 0.05 * speed) {
				updateCloudMetrics();
			}

			// Draw based on view mode
			if (viewMode === "global") {
				// Draw regions
				regionsRef.current.forEach((region) => {
					drawRegion(region, fontSize);
				});

				// Draw inter-region connections
				ctx.strokeStyle = scheme.data + "60";
				ctx.lineWidth = 1;
				ctx.setLineDash([5, 5]);
				const regionArray = Array.from(regionsRef.current.values());
				for (let i = 0; i < regionArray.length; i++) {
					for (let j = i + 1; j < regionArray.length; j++) {
						const r1 = regionArray[i];
						const r2 = regionArray[j];
						ctx.beginPath();
						ctx.moveTo((r1.x + 10) * fontSize, (r1.y + 5) * fontSize);
						ctx.lineTo((r2.x + 10) * fontSize, (r2.y + 5) * fontSize);
						ctx.stroke();
					}
				}
				ctx.setLineDash([]);
			} else if (viewMode === "region") {
				const region = regionsRef.current.get(selectedRegion);
				if (region) {
					region.resources.forEach((resource) => {
						drawResource(resource, fontSize);
					});
					drawDataFlows(fontSize);
				}
			} else if (viewMode === "detailed") {
				resourcesRef.current.forEach((resource) => {
					drawResource(resource, fontSize);
				});
				drawDataFlows(fontSize);
			}

			// Draw global statistics
			const totalResources = resourcesRef.current.size;
			const runningResources = Array.from(resourcesRef.current.values()).filter(
				(r) => r.status === "running",
			).length;
			const errorResources = Array.from(resourcesRef.current.values()).filter(
				(r) => r.status === "error",
			).length;
			const totalCost = Array.from(resourcesRef.current.values()).reduce(
				(sum, r) => sum + r.cost,
				0,
			);
			const avgUtilization =
				Array.from(resourcesRef.current.values()).reduce(
					(sum, r) => sum + r.utilization,
					0,
				) / totalResources;

			ctx.fillStyle = scheme.text;
			ctx.fillText(
				`Cloud Infrastructure Dashboard - ${viewMode.toUpperCase()} VIEW`,
				10,
				canvas.height - 100,
			);
			ctx.fillText(
				`Resources: ${runningResources}/${totalResources} running | ${errorResources} errors`,
				10,
				canvas.height - 85,
			);
			ctx.fillText(
				`Average ${displayMetric}: ${avgUtilization.toFixed(1)}% | Total Cost: $${totalCost.toFixed(0)}/hour`,
				10,
				canvas.height - 70,
			);
			ctx.fillText(
				`Data Flows: ${dataFlowsRef.current.length} active | Mode: ${simulationMode}`,
				10,
				canvas.height - 55,
			);
			ctx.fillText(
				`Regions: ${Array.from(regionsRef.current.values()).filter((r) => r.status === "healthy").length}/${regionsRef.current.size} healthy`,
				10,
				canvas.height - 40,
			);

			if (viewMode === "region") {
				ctx.fillText(`Viewing: ${selectedRegion}`, 10, canvas.height - 25);
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
		selectedRegion,
		displayMetric,
		autoScale,
		colorScheme,
		showDataFlow,
		simulationMode,
		deploymentActive,
	]);

	return (
		<div className="flex flex-col h-screen bg-black">
			<div className="flex-shrink-0 bg-gray-900 p-4 border-b border-gray-700">
				<h1 className="text-2xl font-bold text-blue-400 mb-4">
					☁️ ASCII Cloud Infrastructure Monitor
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
							<option value="global">Global View</option>
							<option value="region">Region View</option>
							<option value="detailed">Detailed View</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Region</label>
						<select
							value={selectedRegion}
							onChange={(e) => setSelectedRegion(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
							disabled={viewMode !== "region"}
						>
							<option value="us-east-1">US East 1</option>
							<option value="us-west-2">US West 2</option>
							<option value="eu-west-1">EU West 1</option>
							<option value="ap-southeast-1">Asia Pacific</option>
							<option value="sa-east-1">South America</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Display Metric</label>
						<select
							value={displayMetric}
							onChange={(e) => setDisplayMetric(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
						>
							<option value="utilization">Utilization</option>
							<option value="cost">Cost</option>
							<option value="health">Health Score</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Color Scheme</label>
						<select
							value={colorScheme}
							onChange={(e) => setColorScheme(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
						>
							<option value="cloud">Cloud Blue</option>
							<option value="aws">AWS Orange</option>
							<option value="azure">Azure Blue</option>
							<option value="gcp">Google Cloud</option>
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
							<option value="traffic-spike">Traffic Spike</option>
							<option value="region-outage">Region Outage</option>
							<option value="auto-scaling">Auto-scaling Demo</option>
						</select>
					</div>

					<div className="flex flex-col gap-2">
						<label className="flex items-center text-blue-300 text-xs">
							<input
								type="checkbox"
								checked={showDataFlow}
								onChange={(e) => setShowDataFlow(e.target.checked)}
								className="mr-1"
							/>
							Data Flows
						</label>
						<label className="flex items-center text-blue-300 text-xs">
							<input
								type="checkbox"
								checked={autoScale}
								onChange={(e) => setAutoScale(e.target.checked)}
								className="mr-1"
							/>
							Auto-scale
						</label>
					</div>
				</div>

				<div className="mt-4 text-blue-400 text-sm">
					<p>
						☁️ <strong>Multi-region cloud infrastructure</strong> with real-time
						resource monitoring!
					</p>
					<p>
						🌍 <strong>Switch between views</strong> - Global overview, regional
						focus, or detailed resource view!
					</p>
					<p>
						⚡ <strong>Auto-scaling simulation</strong> with traffic spikes,
						outages, and cost optimization!
					</p>
					<p>
						Monitor VMs, containers, functions, storage, databases across
						multiple cloud regions with live data flows
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