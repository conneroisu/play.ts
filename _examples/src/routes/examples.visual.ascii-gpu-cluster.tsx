import { createFileRoute } from "@tanstack/react-router";
import { clamp, lerp } from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/visual/ascii-gpu-cluster")({
	component: ASCIIGPUClusterExample,
});

interface GPUNode {
	id: string;
	name: string;
	model: string;
	compute_units: number;
	memory_gb: number;
	utilization: number;
	memory_usage: number;
	temperature: number;
	power_draw: number;
	jobs: GPUJob[];
	status: "idle" | "running" | "overheating" | "error" | "maintenance";
	x: number;
	y: number;
	rack_id: string;
	cluster_id: string;
	performance_score: number;
	thermal_throttling: boolean;
	error_count: number;
	uptime: number;
}

interface GPUJob {
	id: string;
	name: string;
	type: "training" | "inference" | "compute" | "rendering";
	progress: number;
	priority: number;
	memory_required: number;
	compute_required: number;
	time_remaining: number;
	user: string;
	framework: string;
	status: "queued" | "running" | "completed" | "failed";
}

interface ComputeTask {
	id: string;
	from_gpu: string;
	to_gpu: string;
	progress: number;
	data_size: number;
	task_type: "gradient" | "weight_sync" | "data_transfer" | "checkpoint";
}

function ASCIIGPUClusterExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>(0);
	const gpuNodesRef = useRef<Map<string, GPUNode>>(new Map());
	const jobQueueRef = useRef<GPUJob[]>([]);
	const computeTasksRef = useRef<ComputeTask[]>([]);
	const [isPlaying, setIsPlaying] = useState(true);
	const [speed, setSpeed] = useState(1);
	const [displayMode, setDisplayMode] = useState("utilization");
	const [clusterView, setClusterView] = useState("overview");
	const [selectedRack, setSelectedRack] = useState("rack-1");
	const [workloadType, setWorkloadType] = useState("mixed");
	const [colorScheme, setColorScheme] = useState("nvidia");
	const [showTasks, setShowTasks] = useState(true);
	const [showJobs, setShowJobs] = useState(true);
	const [coolingMode, setCoolingMode] = useState("standard");
	const [powerBudget, setPowerBudget] = useState(1000);

	const colorSchemes = {
		nvidia: {
			bg: "#0A0A0A",
			idle: "#00FF00",
			running: "#00AA00",
			hot: "#FFAA00",
			critical: "#FF4444",
			compute: "#00AAFF",
			text: "#FFFFFF",
		},
		amd: {
			bg: "#000000",
			idle: "#FF6600",
			running: "#FF4400",
			hot: "#FFAA00",
			critical: "#FF0000",
			compute: "#00AAFF",
			text: "#FFFFFF",
		},
		intel: {
			bg: "#001144",
			idle: "#0066CC",
			running: "#004499",
			hot: "#FFAA00",
			critical: "#FF4444",
			compute: "#00AAFF",
			text: "#FFFFFF",
		},
		hpc: {
			bg: "#000022",
			idle: "#00FFFF",
			running: "#00AAAA",
			hot: "#FFAA00",
			critical: "#FF4444",
			compute: "#FF00FF",
			text: "#FFFFFF",
		},
		thermal: {
			bg: "#000000",
			idle: "#0000FF",
			running: "#00FF00",
			hot: "#FFFF00",
			critical: "#FF0000",
			compute: "#FF00FF",
			text: "#FFFFFF",
		},
	};

	useEffect(() => {
		// Initialize GPU cluster
		const gpuNodes = new Map<string, GPUNode>();
		const jobQueue: GPUJob[] = [];

		const gpuModels = [
			{ name: "RTX 4090", compute: 128, memory: 24 },
			{ name: "A100 80GB", compute: 108, memory: 80 },
			{ name: "H100 SXM", compute: 144, memory: 80 },
			{ name: "V100 32GB", compute: 80, memory: 32 },
		];

		const jobTypes = ["training", "inference", "compute", "rendering"];
		const frameworks = ["PyTorch", "TensorFlow", "JAX", "CUDA", "OpenCL"];

		// Create GPU nodes in racks
		for (let rack = 1; rack <= 4; rack++) {
			for (let slot = 1; slot <= 8; slot++) {
				const model = gpuModels[Math.floor(Math.random() * gpuModels.length)];
				const nodeId = `gpu-${rack}-${slot}`;

				const gpuNode: GPUNode = {
					id: nodeId,
					name: `GPU-${rack}-${slot}`,
					model: model.name,
					compute_units: model.compute,
					memory_gb: model.memory,
					utilization: Math.random() * 30, // Start low
					memory_usage: Math.random() * 20,
					temperature: 35 + Math.random() * 10,
					power_draw: 50 + Math.random() * 100,
					jobs: [],
					status: "idle",
					x: 5 + (rack - 1) * 25,
					y: 3 + (slot - 1) * 3,
					rack_id: `rack-${rack}`,
					cluster_id: "main-cluster",
					performance_score: 90 + Math.random() * 10,
					thermal_throttling: false,
					error_count: 0,
					uptime: Math.random() * 10000,
				};

				gpuNodes.set(nodeId, gpuNode);
			}
		}

		// Generate initial job queue
		for (let i = 0; i < 20; i++) {
			const jobType = jobTypes[
				Math.floor(Math.random() * jobTypes.length)
			] as any;
			const framework =
				frameworks[Math.floor(Math.random() * frameworks.length)];

			jobQueue.push({
				id: `job-${i + 1}`,
				name: `${jobType}-job-${i + 1}`,
				type: jobType,
				progress: 0,
				priority: Math.floor(Math.random() * 10) + 1,
				memory_required: Math.random() * 40 + 10,
				compute_required: Math.random() * 80 + 20,
				time_remaining: Math.random() * 3600 + 300,
				user: `user${Math.floor(Math.random() * 10) + 1}`,
				framework: framework,
				status: "queued",
			});
		}

		gpuNodesRef.current = gpuNodes;
		jobQueueRef.current = jobQueue;
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

		const updateGPUMetrics = () => {
			const gpuNodes = gpuNodesRef.current;
			const jobQueue = jobQueueRef.current;
			const time = Date.now() / 1000;

			// Schedule jobs to GPUs
			const availableGPUs = Array.from(gpuNodes.values()).filter(
				(gpu) => gpu.status === "idle" && gpu.jobs.length === 0,
			);

			const queuedJobs = jobQueue.filter((job) => job.status === "queued");

			if (availableGPUs.length > 0 && queuedJobs.length > 0) {
				const gpu = availableGPUs[0];
				const job = queuedJobs.sort((a, b) => b.priority - a.priority)[0];

				if (gpu.memory_gb >= job.memory_required) {
					job.status = "running";
					gpu.jobs.push(job);
					gpu.status = "running";
				}
			}

			gpuNodes.forEach((gpu) => {
				// Update running jobs
				gpu.jobs = gpu.jobs.filter((job) => {
					if (job.status === "running") {
						job.progress += (Math.random() * 2 + 0.5) * speed;
						job.time_remaining = Math.max(0, job.time_remaining - speed);

						if (job.progress >= 100 || job.time_remaining <= 0) {
							job.status = "completed";
							job.progress = 100;
							return false; // Remove completed job
						}
					}
					return true;
				});

				// Update GPU status based on jobs
				if (gpu.jobs.length === 0) {
					gpu.status = "idle";
					gpu.utilization = Math.max(0, gpu.utilization - 5 * speed);
					gpu.memory_usage = Math.max(0, gpu.memory_usage - 3 * speed);
				} else {
					gpu.status = "running";

					// Calculate utilization based on jobs
					const totalComputeRequired = gpu.jobs.reduce(
						(sum, job) => sum + job.compute_required,
						0,
					);
					const totalMemoryRequired = gpu.jobs.reduce(
						(sum, job) => sum + job.memory_required,
						0,
					);

					gpu.utilization = Math.min(100, totalComputeRequired);
					gpu.memory_usage = Math.min(
						100,
						(totalMemoryRequired / gpu.memory_gb) * 100,
					);
				}

				// Apply workload effects
				let utilizationMultiplier = 1;
				if (workloadType === "ai-training") {
					utilizationMultiplier = 1.5;
					if (gpu.jobs.some((job) => job.type === "training")) {
						gpu.utilization = Math.min(100, gpu.utilization * 1.3);
					}
				} else if (workloadType === "crypto-mining") {
					gpu.utilization = Math.max(gpu.utilization, 80 + Math.random() * 20);
				} else if (workloadType === "rendering") {
					if (gpu.jobs.some((job) => job.type === "rendering")) {
						gpu.utilization = 60 + 30 * Math.sin(time * 2);
					}
				}

				// Temperature calculation
				const baseTemp = 35;
				const tempFromUtilization = (gpu.utilization / 100) * 45;
				const tempFromAmbient =
					coolingMode === "enhanced" ? -5 : coolingMode === "liquid" ? -10 : 0;

				gpu.temperature = clamp(
					baseTemp +
						tempFromUtilization +
						tempFromAmbient +
						(Math.random() - 0.5) * 3,
					25,
					95,
				);

				// Power draw calculation
				const basePower = 50;
				const powerFromLoad = (gpu.utilization / 100) * 300;
				gpu.power_draw = clamp(
					basePower + powerFromLoad + (Math.random() - 0.5) * 20,
					30,
					400,
				);

				// Thermal throttling
				if (gpu.temperature > 83) {
					gpu.thermal_throttling = true;
					gpu.utilization *= 0.8; // Reduce performance
					gpu.performance_score = Math.max(60, gpu.performance_score - 1);
				} else {
					gpu.thermal_throttling = false;
					gpu.performance_score = Math.min(100, gpu.performance_score + 0.1);
				}

				// Status updates
				if (gpu.temperature > 90) {
					gpu.status = "overheating";
					gpu.error_count++;
				} else if (gpu.error_count > 10) {
					gpu.status = "error";
				} else if (gpu.performance_score < 70) {
					gpu.status = "maintenance";
				}

				gpu.uptime += speed;

				// Generate compute tasks for distributed jobs
				if (gpu.jobs.length > 0 && Math.random() < 0.1 * speed && showTasks) {
					const otherGPUs = Array.from(gpuNodes.values()).filter(
						(g) => g.id !== gpu.id && g.jobs.length > 0,
					);

					if (otherGPUs.length > 0) {
						const targetGPU =
							otherGPUs[Math.floor(Math.random() * otherGPUs.length)];

						computeTasksRef.current.push({
							id: `task-${gpu.id}-${targetGPU.id}-${Date.now()}`,
							from_gpu: gpu.id,
							to_gpu: targetGPU.id,
							progress: 0,
							data_size: Math.random() * 1000 + 100,
							task_type:
								Math.random() < 0.4
									? "gradient"
									: Math.random() < 0.7
										? "weight_sync"
										: "data_transfer",
						});
					}
				}
			});

			// Update compute tasks
			computeTasksRef.current = computeTasksRef.current.filter((task) => {
				task.progress += 0.03 * speed;
				return task.progress < 1;
			});

			// Add new jobs periodically
			if (Math.random() < 0.02 * speed && jobQueue.length < 50) {
				const jobTypes = ["training", "inference", "compute", "rendering"];
				const frameworks = ["PyTorch", "TensorFlow", "JAX", "CUDA"];

				jobQueue.push({
					id: `job-${Date.now()}`,
					name: `job-${jobQueue.length + 1}`,
					type: jobTypes[Math.floor(Math.random() * jobTypes.length)] as any,
					progress: 0,
					priority: Math.floor(Math.random() * 10) + 1,
					memory_required: Math.random() * 40 + 10,
					compute_required: Math.random() * 80 + 20,
					time_remaining: Math.random() * 3600 + 300,
					user: `user${Math.floor(Math.random() * 10) + 1}`,
					framework: frameworks[Math.floor(Math.random() * frameworks.length)],
					status: "queued",
				});
			}
		};

		const getGPUStatusColor = (gpu: GPUNode, scheme: any) => {
			if (gpu.status === "error") return scheme.critical;
			if (gpu.status === "overheating") return scheme.critical;
			if (gpu.thermal_throttling) return scheme.hot;
			if (gpu.status === "running") return scheme.running;
			if (gpu.status === "maintenance") return scheme.hot;
			return scheme.idle;
		};

		const drawGPU = (gpu: GPUNode, fontSize: number) => {
			const x = gpu.x * fontSize;
			const y = gpu.y * fontSize;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			// GPU icon and status
			ctx.fillStyle = getGPUStatusColor(gpu, scheme);
			ctx.fillText("▣", x, y);

			// GPU name
			ctx.fillStyle = scheme.text;
			ctx.fillText(gpu.name, x + fontSize, y);

			// Status indicators
			if (gpu.thermal_throttling) {
				ctx.fillStyle = scheme.hot;
				ctx.fillText("🔥", x - fontSize, y);
			}

			if (gpu.status === "error") {
				ctx.fillStyle = scheme.critical;
				ctx.fillText("✕", x - fontSize, y);
			}

			// Metric display
			let value = 0;
			let unit = "%";
			let label = "";

			switch (displayMode) {
				case "utilization":
					value = gpu.utilization;
					label = "GPU";
					break;
				case "memory":
					value = gpu.memory_usage;
					label = "MEM";
					break;
				case "temperature":
					value = gpu.temperature;
					unit = "°C";
					label = "TMP";
					break;
				case "power":
					value = gpu.power_draw;
					unit = "W";
					label = "PWR";
					break;
				case "performance":
					value = gpu.performance_score;
					label = "PERF";
					break;
			}

			// Metric bar
			const barWidth = 8;
			const maxValue =
				displayMode === "temperature"
					? 100
					: displayMode === "power"
						? 400
						: 100;
			const percentage = value / maxValue;
			const filled = Math.floor(percentage * barWidth);

			ctx.fillStyle = scheme.text + "40";
			ctx.fillText("█".repeat(barWidth), x, y + fontSize);

			if (filled > 0) {
				let barColor = scheme.idle;
				if (displayMode === "temperature") {
					barColor =
						value > 80
							? scheme.critical
							: value > 70
								? scheme.hot
								: scheme.running;
				} else {
					barColor =
						percentage > 0.9
							? scheme.critical
							: percentage > 0.7
								? scheme.hot
								: scheme.running;
				}

				ctx.fillStyle = barColor;
				ctx.fillText("█".repeat(filled), x, y + fontSize);
			}

			ctx.fillStyle = scheme.text;
			ctx.fillText(
				`${label}: ${value.toFixed(0)}${unit}`,
				x + (barWidth + 1) * fontSize,
				y + fontSize,
			);

			// Job info
			if (showJobs && gpu.jobs.length > 0) {
				const job = gpu.jobs[0]; // Show first job
				ctx.fillStyle = scheme.compute;
				ctx.fillText(
					`${job.type}: ${job.progress.toFixed(0)}%`,
					x,
					y + fontSize * 2,
				);
				ctx.fillText(`${job.framework}`, x, y + fontSize * 2.5);
			}

			// Model info
			ctx.fillStyle = scheme.text + "80";
			ctx.fillText(gpu.model, x + fontSize * 8, y);
		};

		const drawRack = (rackId: string, fontSize: number) => {
			const rackGPUs = Array.from(gpuNodesRef.current.values()).filter(
				(gpu) => gpu.rack_id === rackId,
			);
			if (rackGPUs.length === 0) return;

			const minX = Math.min(...rackGPUs.map((gpu) => gpu.x));
			const maxX = Math.max(...rackGPUs.map((gpu) => gpu.x));
			const minY = Math.min(...rackGPUs.map((gpu) => gpu.y));
			const maxY = Math.max(...rackGPUs.map((gpu) => gpu.y));

			const x = (minX - 1) * fontSize;
			const y = (minY - 1) * fontSize;
			const width = (maxX - minX + 12) * fontSize;
			const height = (maxY - minY + 4) * fontSize;

			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Rack outline
			ctx.strokeStyle = scheme.text + "60";
			ctx.lineWidth = 1;
			ctx.strokeRect(x, y, width, height);

			// Rack label
			ctx.fillStyle = scheme.text;
			ctx.fillText(rackId.toUpperCase(), x + 2, y - fontSize * 0.5);

			// Rack statistics
			const runningGPUs = rackGPUs.filter(
				(gpu) => gpu.status === "running",
			).length;
			const errorGPUs = rackGPUs.filter(
				(gpu) => gpu.status === "error" || gpu.status === "overheating",
			).length;
			const avgTemp =
				rackGPUs.reduce((sum, gpu) => sum + gpu.temperature, 0) /
				rackGPUs.length;
			const totalPower = rackGPUs.reduce((sum, gpu) => sum + gpu.power_draw, 0);

			ctx.fillText(
				`${runningGPUs}/${rackGPUs.length} running`,
				x + width - fontSize * 12,
				y - fontSize * 0.5,
			);
			ctx.fillText(
				`Avg: ${avgTemp.toFixed(0)}°C`,
				x + width - fontSize * 12,
				y,
			);
			ctx.fillText(
				`${totalPower.toFixed(0)}W`,
				x + width - fontSize * 6,
				y - fontSize * 0.5,
			);

			if (errorGPUs > 0) {
				ctx.fillStyle = scheme.critical;
				ctx.fillText(`${errorGPUs} errors`, x + width - fontSize * 6, y);
			}
		};

		const drawComputeTasks = (fontSize: number) => {
			if (!showTasks) return;

			const gpuNodes = gpuNodesRef.current;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			computeTasksRef.current.forEach((task) => {
				const fromGPU = gpuNodes.get(task.from_gpu);
				const toGPU = gpuNodes.get(task.to_gpu);
				if (!fromGPU || !toGPU) return;

				const x1 = fromGPU.x * fontSize;
				const y1 = fromGPU.y * fontSize;
				const x2 = toGPU.x * fontSize;
				const y2 = toGPU.y * fontSize;

				const x = lerp(x1, x2, task.progress);
				const y = lerp(y1, y2, task.progress);

				let taskColor = scheme.compute;
				if (task.task_type === "gradient") taskColor = scheme.running;
				else if (task.task_type === "weight_sync") taskColor = scheme.hot;

				ctx.fillStyle = taskColor;
				ctx.fillText("●", x, y);

				// Draw connection line
				ctx.strokeStyle = taskColor + "30";
				ctx.lineWidth = 1;
				ctx.setLineDash([1, 2]);
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
				updateGPUMetrics();
			}

			// Draw based on view mode
			if (clusterView === "overview") {
				// Draw all racks
				for (let i = 1; i <= 4; i++) {
					drawRack(`rack-${i}`, fontSize);
				}

				// Draw all GPUs
				gpuNodesRef.current.forEach((gpu) => {
					drawGPU(gpu, fontSize);
				});

				drawComputeTasks(fontSize);
			} else if (clusterView === "rack") {
				// Draw selected rack only
				drawRack(selectedRack, fontSize);

				const rackGPUs = Array.from(gpuNodesRef.current.values()).filter(
					(gpu) => gpu.rack_id === selectedRack,
				);
				rackGPUs.forEach((gpu) => {
					drawGPU(gpu, fontSize);
				});

				drawComputeTasks(fontSize);
			}

			// Draw cluster statistics
			const allGPUs = Array.from(gpuNodesRef.current.values());
			const runningGPUs = allGPUs.filter(
				(gpu) => gpu.status === "running",
			).length;
			const idleGPUs = allGPUs.filter((gpu) => gpu.status === "idle").length;
			const errorGPUs = allGPUs.filter(
				(gpu) => gpu.status === "error" || gpu.status === "overheating",
			).length;
			const avgUtilization =
				allGPUs.reduce((sum, gpu) => sum + gpu.utilization, 0) / allGPUs.length;
			const totalPower = allGPUs.reduce((sum, gpu) => sum + gpu.power_draw, 0);
			const activeJobs = allGPUs.reduce((sum, gpu) => sum + gpu.jobs.length, 0);
			const queuedJobs = jobQueueRef.current.filter(
				(job) => job.status === "queued",
			).length;

			ctx.fillStyle = scheme.text;
			ctx.fillText(
				`GPU Cluster Dashboard - ${clusterView.toUpperCase()} VIEW`,
				10,
				canvas.height - 120,
			);
			ctx.fillText(
				`GPUs: ${runningGPUs} running | ${idleGPUs} idle | ${errorGPUs} errors | Total: ${allGPUs.length}`,
				10,
				canvas.height - 105,
			);
			ctx.fillText(
				`Average Utilization: ${avgUtilization.toFixed(1)}% | Total Power: ${totalPower.toFixed(0)}W/${powerBudget}W`,
				10,
				canvas.height - 90,
			);
			ctx.fillText(
				`Jobs: ${activeJobs} active | ${queuedJobs} queued | Workload: ${workloadType}`,
				10,
				canvas.height - 75,
			);
			ctx.fillText(
				`Compute Tasks: ${computeTasksRef.current.length} active | Display: ${displayMode}`,
				10,
				canvas.height - 60,
			);
			ctx.fillText(
				`Cooling: ${coolingMode} | Thermal Events: ${allGPUs.filter((gpu) => gpu.thermal_throttling).length}`,
				10,
				canvas.height - 45,
			);

			if (clusterView === "rack") {
				ctx.fillText(`Viewing: ${selectedRack}`, 10, canvas.height - 30);
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
		displayMode,
		clusterView,
		selectedRack,
		workloadType,
		colorScheme,
		showTasks,
		showJobs,
		coolingMode,
		powerBudget,
	]);

	return (
		<div className="flex flex-col h-screen bg-black">
			<div className="flex-shrink-0 bg-gray-900 p-4 border-b border-gray-700">
				<h1 className="text-2xl font-bold text-green-400 mb-4">
					🎮 ASCII GPU Cluster Monitor
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
						<label className="text-green-300 mb-2">Display Metric</label>
						<select
							value={displayMode}
							onChange={(e) => setDisplayMode(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-green-300 rounded border border-gray-600"
						>
							<option value="utilization">GPU Utilization</option>
							<option value="memory">Memory Usage</option>
							<option value="temperature">Temperature</option>
							<option value="power">Power Draw</option>
							<option value="performance">Performance Score</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Cluster View</label>
						<select
							value={clusterView}
							onChange={(e) => setClusterView(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-green-300 rounded border border-gray-600"
						>
							<option value="overview">Full Cluster</option>
							<option value="rack">Single Rack</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Selected Rack</label>
						<select
							value={selectedRack}
							onChange={(e) => setSelectedRack(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-green-300 rounded border border-gray-600"
							disabled={clusterView !== "rack"}
						>
							<option value="rack-1">Rack 1</option>
							<option value="rack-2">Rack 2</option>
							<option value="rack-3">Rack 3</option>
							<option value="rack-4">Rack 4</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Workload Type</label>
						<select
							value={workloadType}
							onChange={(e) => setWorkloadType(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-green-300 rounded border border-gray-600"
						>
							<option value="mixed">Mixed Workload</option>
							<option value="ai-training">AI Training</option>
							<option value="crypto-mining">Crypto Mining</option>
							<option value="rendering">3D Rendering</option>
							<option value="compute">Scientific Compute</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Color Scheme</label>
						<select
							value={colorScheme}
							onChange={(e) => setColorScheme(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-green-300 rounded border border-gray-600"
						>
							<option value="nvidia">NVIDIA Green</option>
							<option value="amd">AMD Red</option>
							<option value="intel">Intel Blue</option>
							<option value="hpc">HPC Cyan</option>
							<option value="thermal">Thermal</option>
						</select>
					</div>

					<div className="flex flex-col gap-2">
						<label className="flex items-center text-green-300 text-xs">
							<input
								type="checkbox"
								checked={showTasks}
								onChange={(e) => setShowTasks(e.target.checked)}
								className="mr-1"
							/>
							Compute Tasks
						</label>
						<label className="flex items-center text-green-300 text-xs">
							<input
								type="checkbox"
								checked={showJobs}
								onChange={(e) => setShowJobs(e.target.checked)}
								className="mr-1"
							/>
							Job Info
						</label>
					</div>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Cooling Mode</label>
						<select
							value={coolingMode}
							onChange={(e) => setCoolingMode(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-green-300 rounded border border-gray-600"
						>
							<option value="standard">Air Cooling</option>
							<option value="enhanced">Enhanced Air</option>
							<option value="liquid">Liquid Cooling</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">
							Power Budget: {powerBudget}W
						</label>
						<input
							type="range"
							min="500"
							max="2000"
							step="100"
							value={powerBudget}
							onChange={(e) => setPowerBudget(Number.parseInt(e.target.value))}
							className="w-full"
						/>
					</div>
				</div>

				<div className="mt-4 text-green-400 text-sm">
					<p>
						🎮 <strong>High-performance GPU cluster</strong> with real-time job
						scheduling and thermal monitoring!
					</p>
					<p>
						⚡ <strong>Switch between workloads</strong> - AI training, crypto
						mining, 3D rendering, and scientific computing!
					</p>
					<p>
						🌡️ <strong>Thermal management</strong> with automatic throttling,
						cooling modes, and power budget control!
					</p>
					<p>
						Monitor RTX 4090, A100, H100, V100 GPUs across multiple racks with
						distributed compute task visualization
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
