import { useEffect, useRef, useState } from "react";

interface GPU {
	id: string;
	compute: number;
	memory: number;
	temperature: number;
	power: number;
	utilization: number;
	status: "idle" | "busy" | "overheated" | "offline";
}

interface Job {
	id: string;
	type: "training" | "inference" | "rendering" | "compute";
	priority: "low" | "medium" | "high" | "critical";
	progress: number;
	gpuId?: string;
	estimatedTime: number;
	memoryRequired: number;
	status: "queued" | "running" | "completed" | "failed";
}

interface QueueStats {
	total: number;
	running: number;
	queued: number;
	completed: number;
	failed: number;
}

export default function AsciiGpuSchedulerExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const [isRunning, setIsRunning] = useState(false);
	const isRunningRef = useRef(false);

	const gpusRef = useRef<GPU[]>([
		{
			id: "GPU-0",
			compute: 0,
			memory: 0,
			temperature: 25,
			power: 50,
			utilization: 0,
			status: "idle",
		},
		{
			id: "GPU-1",
			compute: 0,
			memory: 0,
			temperature: 25,
			power: 50,
			utilization: 0,
			status: "idle",
		},
		{
			id: "GPU-2",
			compute: 0,
			memory: 0,
			temperature: 25,
			power: 50,
			utilization: 0,
			status: "idle",
		},
		{
			id: "GPU-3",
			compute: 0,
			memory: 0,
			temperature: 25,
			power: 50,
			utilization: 0,
			status: "idle",
		},
	]);

	const jobsRef = useRef<Job[]>([]);
	const nextJobIdRef = useRef(1);
	const queueStatsRef = useRef<QueueStats>({
		total: 0,
		running: 0,
		queued: 0,
		completed: 0,
		failed: 0,
	});
	const lastJobSpawnRef = useRef(0);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		canvas.width = 1000;
		canvas.height = 750;
		ctx.font = "11px monospace";

		const animate = (timestamp: number) => {
			if (!isRunningRef.current) return;

			// Spawn new jobs periodically
			if (timestamp - lastJobSpawnRef.current > 1000 + Math.random() * 2000) {
				spawnJob();
				lastJobSpawnRef.current = timestamp;
			}

			// Update GPU states
			updateGPUs();

			// Schedule jobs
			scheduleJobs();

			// Update running jobs
			updateJobs();

			// Update statistics
			updateStats();

			// Render
			render(ctx, timestamp);

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

	const spawnJob = () => {
		const jobTypes: Array<"training" | "inference" | "rendering" | "compute"> =
			["training", "inference", "rendering", "compute"];
		const priorities: Array<"low" | "medium" | "high" | "critical"> = [
			"low",
			"medium",
			"high",
			"critical",
		];

		const type = jobTypes[Math.floor(Math.random() * jobTypes.length)];
		const priority = priorities[Math.floor(Math.random() * priorities.length)];

		// Different job types have different characteristics
		let estimatedTime = 5000;
		let memoryRequired = 50;

		switch (type) {
			case "training":
				estimatedTime = 8000 + Math.random() * 12000;
				memoryRequired = 60 + Math.random() * 30;
				break;
			case "inference":
				estimatedTime = 1000 + Math.random() * 3000;
				memoryRequired = 20 + Math.random() * 40;
				break;
			case "rendering":
				estimatedTime = 3000 + Math.random() * 7000;
				memoryRequired = 40 + Math.random() * 50;
				break;
			case "compute":
				estimatedTime = 2000 + Math.random() * 8000;
				memoryRequired = 30 + Math.random() * 60;
				break;
		}

		const job: Job = {
			id: `job-${nextJobIdRef.current.toString().padStart(3, "0")}`,
			type,
			priority,
			progress: 0,
			estimatedTime,
			memoryRequired,
			status: "queued",
		};

		jobsRef.current.push(job);
		nextJobIdRef.current++;
	};

	const updateGPUs = () => {
		gpusRef.current.forEach((gpu) => {
			const runningJob = jobsRef.current.find(
				(job) => job.gpuId === gpu.id && job.status === "running",
			);

			if (runningJob) {
				gpu.status = "busy";
				gpu.utilization = 80 + Math.random() * 20;
				gpu.compute = 70 + Math.random() * 30;
				gpu.memory = runningJob.memoryRequired + Math.random() * 10;
				gpu.temperature = 65 + Math.random() * 20;
				gpu.power = 200 + Math.random() * 100;

				// Check for overheating
				if (gpu.temperature > 80) {
					gpu.status = "overheated";
					gpu.utilization = Math.max(0, gpu.utilization - 10);
				}
			} else {
				gpu.status = "idle";
				gpu.utilization = Math.max(0, gpu.utilization - 5);
				gpu.compute = Math.max(0, gpu.compute - 3);
				gpu.memory = Math.max(0, gpu.memory - 2);
				gpu.temperature = Math.max(25, gpu.temperature - 1);
				gpu.power = Math.max(50, gpu.power - 5);
			}

			// Random offline events
			if (gpu.status === "idle" && Math.random() < 0.0005) {
				gpu.status = "offline";
				setTimeout(() => {
					if (gpusRef.current.find((g) => g.id === gpu.id)) {
						gpu.status = "idle";
					}
				}, 5000);
			}
		});
	};

	const scheduleJobs = () => {
		const queuedJobs = jobsRef.current.filter((job) => job.status === "queued");
		const availableGPUs = gpusRef.current.filter(
			(gpu) => gpu.status === "idle",
		);

		// Sort jobs by priority and arrival time
		queuedJobs.sort((a, b) => {
			const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
			return priorityOrder[b.priority] - priorityOrder[a.priority];
		});

		// Assign jobs to available GPUs
		queuedJobs.forEach((job) => {
			const suitableGPU = availableGPUs.find(
				(gpu) => gpu.memory + job.memoryRequired < 95 && gpu.status === "idle",
			);

			if (suitableGPU) {
				job.gpuId = suitableGPU.id;
				job.status = "running";
				suitableGPU.status = "busy";
				availableGPUs.splice(availableGPUs.indexOf(suitableGPU), 1);
			}
		});
	};

	const updateJobs = () => {
		jobsRef.current.forEach((job) => {
			if (job.status === "running") {
				job.progress += 100 / (job.estimatedTime / 16.67); // 60 FPS

				// Check if GPU is overheated (slow down)
				const gpu = gpusRef.current.find((g) => g.id === job.gpuId);
				if (gpu?.status === "overheated") {
					job.progress -= job.progress * 0.1; // Slow down by 10%
				}

				if (job.progress >= 100) {
					job.status = "completed";
					job.progress = 100;

					// Free up GPU
					if (gpu) {
						gpu.status = "idle";
					}
				}

				// Random failures
				if (Math.random() < 0.0001) {
					job.status = "failed";
					if (gpu) {
						gpu.status = "idle";
					}
				}
			}
		});

		// Clean up old completed/failed jobs
		const now = Date.now();
		jobsRef.current = jobsRef.current.filter((job) => {
			if (job.status === "completed" || job.status === "failed") {
				// Keep for 10 seconds then remove
				return (now - (job as any).completionTime || 0) < 10000;
			}
			return true;
		});

		// Mark completion time
		jobsRef.current.forEach((job) => {
			if (
				(job.status === "completed" || job.status === "failed") &&
				!(job as any).completionTime
			) {
				(job as any).completionTime = now;
			}
		});
	};

	const updateStats = () => {
		const stats = queueStatsRef.current;
		stats.total = jobsRef.current.length;
		stats.running = jobsRef.current.filter(
			(j) => j.status === "running",
		).length;
		stats.queued = jobsRef.current.filter((j) => j.status === "queued").length;
		stats.completed = jobsRef.current.filter(
			(j) => j.status === "completed",
		).length;
		stats.failed = jobsRef.current.filter((j) => j.status === "failed").length;
	};

	const render = (ctx: CanvasRenderingContext2D, timestamp: number) => {
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, 1000, 750);

		// Title
		ctx.fillStyle = "#00ff00";
		ctx.fillText(
			"ASCII GPU Workload Scheduler - High-Performance Computing Cluster",
			20,
			25,
		);

		// Render GPU cluster
		renderGPUs(ctx);

		// Render job queue
		renderJobQueue(ctx);

		// Render scheduler stats
		renderSchedulerStats(ctx);

		// Render performance metrics
		renderPerformanceMetrics(ctx);
	};

	const renderGPUs = (ctx: CanvasRenderingContext2D) => {
		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			"╔═══ GPU CLUSTER STATUS ═══════════════════════════════════════════════╗",
			20,
			60,
		);

		gpusRef.current.forEach((gpu, index) => {
			const x = 25 + (index % 2) * 450;
			const y = 80 + Math.floor(index / 2) * 120;

			const statusColor =
				gpu.status === "idle"
					? "#00ff00"
					: gpu.status === "busy"
						? "#ffff00"
						: gpu.status === "overheated"
							? "#ff8800"
							: "#ff0000";

			ctx.fillStyle = statusColor;
			ctx.fillText(`┌─ ${gpu.id} ────────────────────┐`, x, y);
			ctx.fillText(`│ Status: ${gpu.status.padEnd(12)} │`, x, y + 15);

			ctx.fillStyle = "#ffffff";
			ctx.fillText(
				`│ Util: ${gpu.utilization.toFixed(0).padStart(3)}%            │`,
				x,
				y + 30,
			);
			ctx.fillText(
				`│ Compute: ${gpu.compute.toFixed(0).padStart(3)}%         │`,
				x,
				y + 45,
			);
			ctx.fillText(
				`│ Memory: ${gpu.memory.toFixed(0).padStart(3)}%          │`,
				x,
				y + 60,
			);
			ctx.fillText(
				`│ Temp: ${gpu.temperature.toFixed(0).padStart(3)}°C          │`,
				x,
				y + 75,
			);
			ctx.fillText(
				`│ Power: ${gpu.power.toFixed(0).padStart(3)}W           │`,
				x,
				y + 90,
			);

			ctx.fillStyle = statusColor;
			ctx.fillText("└─────────────────────────────┘", x, y + 105);

			// Utilization bar
			const utilBar =
				"█".repeat(Math.floor(gpu.utilization / 5)) +
				"░".repeat(20 - Math.floor(gpu.utilization / 5));
			ctx.fillStyle =
				gpu.utilization > 90
					? "#ff0000"
					: gpu.utilization > 70
						? "#ffff00"
						: "#00ff00";
			ctx.fillText(`[${utilBar}]`, x + 250, y + 30);

			// Running job indicator
			const runningJob = jobsRef.current.find(
				(job) => job.gpuId === gpu.id && job.status === "running",
			);
			if (runningJob) {
				ctx.fillStyle = "#00aaff";
				ctx.fillText(
					`Running: ${runningJob.id} (${runningJob.type})`,
					x + 250,
					y + 50,
				);
				ctx.fillText(
					`Progress: ${runningJob.progress.toFixed(0)}%`,
					x + 250,
					y + 70,
				);
			}
		});

		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			"╚══════════════════════════════════════════════════════════════════════╝",
			20,
			320,
		);
	};

	const renderJobQueue = (ctx: CanvasRenderingContext2D) => {
		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			"╔═══ JOB QUEUE ═════════════════════════════════════════════════════════╗",
			20,
			350,
		);

		const queuedJobs = jobsRef.current
			.filter((job) => job.status === "queued")
			.slice(0, 8);
		const runningJobs = jobsRef.current
			.filter((job) => job.status === "running")
			.slice(0, 4);

		// Queued jobs
		ctx.fillStyle = "#ffff00";
		ctx.fillText("Queued Jobs:", 25, 375);
		queuedJobs.forEach((job, index) => {
			const y = 395 + index * 15;
			const priorityColor =
				job.priority === "critical"
					? "#ff0000"
					: job.priority === "high"
						? "#ff8800"
						: job.priority === "medium"
							? "#ffff00"
							: "#00ff00";

			ctx.fillStyle = priorityColor;
			ctx.fillText(
				`${job.id} | ${job.type.padEnd(9)} | ${job.priority.padEnd(8)} | ${job.memoryRequired.toFixed(0)}% mem`,
				25,
				y,
			);
		});

		// Running jobs
		ctx.fillStyle = "#00ff00";
		ctx.fillText("Running Jobs:", 400, 375);
		runningJobs.forEach((job, index) => {
			const y = 395 + index * 15;
			ctx.fillStyle = "#00aaff";
			ctx.fillText(
				`${job.id} | ${job.gpuId} | ${job.progress.toFixed(0)}% complete`,
				400,
				y,
			);
		});

		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			"╚══════════════════════════════════════════════════════════════════════╝",
			20,
			540,
		);
	};

	const renderSchedulerStats = (ctx: CanvasRenderingContext2D) => {
		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			"╔═══ SCHEDULER STATISTICS ═════════════════════════════════════════════╗",
			20,
			570,
		);

		const stats = queueStatsRef.current;
		const activeGPUs = gpusRef.current.filter(
			(gpu) => gpu.status === "busy",
		).length;
		const idleGPUs = gpusRef.current.filter(
			(gpu) => gpu.status === "idle",
		).length;
		const problemGPUs = gpusRef.current.filter(
			(gpu) => gpu.status === "overheated" || gpu.status === "offline",
		).length;

		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			`Total Jobs: ${stats.total.toString().padStart(3)}      Running: ${stats.running.toString().padStart(2)}      Queued: ${stats.queued.toString().padStart(2)}`,
			25,
			595,
		);
		ctx.fillText(
			`Completed: ${stats.completed.toString().padStart(3)}       Failed: ${stats.failed.toString().padStart(2)}`,
			25,
			615,
		);

		ctx.fillText(
			`Active GPUs: ${activeGPUs}/4     Idle GPUs: ${idleGPUs}/4     Problem GPUs: ${problemGPUs}/4`,
			25,
			635,
		);

		// Cluster efficiency
		const totalUtilization = gpusRef.current.reduce(
			(sum, gpu) => sum + gpu.utilization,
			0,
		);
		const avgUtilization = totalUtilization / gpusRef.current.length;
		const efficiency = (avgUtilization / 100) * 100;

		ctx.fillStyle =
			efficiency > 80 ? "#00ff00" : efficiency > 60 ? "#ffff00" : "#ff8800";
		ctx.fillText(`Cluster Efficiency: ${efficiency.toFixed(1)}%`, 25, 665);

		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			"╚══════════════════════════════════════════════════════════════════════╝",
			20,
			685,
		);
	};

	const renderPerformanceMetrics = (ctx: CanvasRenderingContext2D) => {
		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			"╔═══ PERFORMANCE METRICS ══════════════════════════════════════════════╗",
			500,
			570,
		);

		// Calculate metrics
		const avgTemp =
			gpusRef.current.reduce((sum, gpu) => sum + gpu.temperature, 0) /
			gpusRef.current.length;
		const totalPower = gpusRef.current.reduce((sum, gpu) => sum + gpu.power, 0);
		const completionRate =
			(queueStatsRef.current.completed /
				(queueStatsRef.current.completed + queueStatsRef.current.failed || 1)) *
			100;

		ctx.fillText(`Average Temperature: ${avgTemp.toFixed(1)}°C`, 505, 595);
		ctx.fillText(
			`Total Power Consumption: ${totalPower.toFixed(0)}W`,
			505,
			615,
		);
		ctx.fillText(`Job Success Rate: ${completionRate.toFixed(1)}%`, 505, 635);

		// Thermal status
		const thermalColor =
			avgTemp > 75 ? "#ff0000" : avgTemp > 65 ? "#ffff00" : "#00ff00";
		ctx.fillStyle = thermalColor;
		const thermalStatus = avgTemp > 75 ? "HOT" : avgTemp > 65 ? "WARM" : "COOL";
		ctx.fillText(`Thermal Status: ${thermalStatus}`, 505, 655);

		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			"╚══════════════════════════════════════════════════════════════════════╝",
			500,
			685,
		);
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
		// Reset GPUs
		gpusRef.current.forEach((gpu) => {
			gpu.compute = 0;
			gpu.memory = 0;
			gpu.temperature = 25;
			gpu.power = 50;
			gpu.utilization = 0;
			gpu.status = "idle";
		});
		// Clear jobs
		jobsRef.current = [];
		nextJobIdRef.current = 1;
		queueStatsRef.current = {
			total: 0,
			running: 0,
			queued: 0,
			completed: 0,
			failed: 0,
		};
	};

	return (
		<div className="p-6 max-w-6xl mx-auto">
			<div className="mb-4">
				<a
					href="/examples/visual"
					className="text-blue-600 hover:text-blue-800 underline mb-4 inline-block"
				>
					← Back to Visual Examples
				</a>
			</div>
			<h1 className="text-3xl font-bold mb-4">ASCII GPU Workload Scheduler</h1>
			<p className="text-gray-600 mb-6">
				High-performance computing cluster scheduler managing GPU workloads with
				intelligent job queuing, resource allocation, and thermal management.
			</p>

			<div className="mb-4 space-x-2">
				<button
					onClick={startAnimation}
					disabled={isRunning}
					className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
				>
					Start Scheduler
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
					<li>Priority-based job scheduling with different workload types</li>
					<li>Real-time GPU monitoring (utilization, temperature, power)</li>
					<li>Intelligent resource allocation based on memory requirements</li>
					<li>Thermal management with performance throttling</li>
					<li>Cluster efficiency metrics and performance analytics</li>
				</ul>
			</div>
		</div>
	);
}
