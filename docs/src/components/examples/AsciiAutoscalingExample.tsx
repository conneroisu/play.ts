import { useEffect, useRef, useState } from "react";

interface Instance {
	id: string;
	x: number;
	y: number;
	status: "starting" | "running" | "terminating";
	age: number;
	cpu: number;
	memory: number;
	startTime: number;
}

interface ScalingEvent {
	type: "scale_up" | "scale_down";
	timestamp: number;
	reason: string;
	targetCount: number;
}

export default function AsciiAutoscalingExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const [isRunning, setIsRunning] = useState(false);
	const isRunningRef = useRef(false);

	const instancesRef = useRef<Instance[]>([]);
	const nextInstanceIdRef = useRef(1);
	const scalingEventsRef = useRef<ScalingEvent[]>([]);
	const lastScaleCheckRef = useRef(0);
	const trafficRef = useRef(50); // Current traffic load
	const targetInstancesRef = useRef(2);
	const minInstancesRef = useRef(2);
	const maxInstancesRef = useRef(8);

	useEffect(() => {
		// Initialize with minimum instances
		initializeInstances();
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		canvas.width = 900;
		canvas.height = 700;
		ctx.font = "12px monospace";

		const animate = (timestamp: number) => {
			if (!isRunningRef.current) return;

			// Simulate traffic fluctuations
			updateTraffic(timestamp);

			// Check scaling conditions every 2 seconds
			if (timestamp - lastScaleCheckRef.current > 2000) {
				checkScalingConditions(timestamp);
				lastScaleCheckRef.current = timestamp;
			}

			// Update instances
			updateInstances(timestamp);

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

	const initializeInstances = () => {
		instancesRef.current = [];
		for (let i = 0; i < minInstancesRef.current; i++) {
			createInstance(Date.now() - 10000); // Start them as already running
		}
	};

	const createInstance = (timestamp: number) => {
		const instance: Instance = {
			id: `i-${nextInstanceIdRef.current.toString().padStart(3, "0")}`,
			x: 200 + (instancesRef.current.length % 6) * 100,
			y: 150 + Math.floor(instancesRef.current.length / 6) * 80,
			status: "starting",
			age: 0,
			cpu: 0,
			memory: 0,
			startTime: timestamp,
		};

		instancesRef.current.push(instance);
		nextInstanceIdRef.current++;

		// Instance becomes running after 3 seconds
		setTimeout(() => {
			const inst = instancesRef.current.find((i) => i.id === instance.id);
			if (inst) inst.status = "running";
		}, 3000);
	};

	const terminateInstance = () => {
		const runningInstances = instancesRef.current.filter(
			(i) => i.status === "running",
		);
		if (runningInstances.length > minInstancesRef.current) {
			// Terminate oldest instance
			const oldest = runningInstances.reduce((prev, curr) =>
				prev.age > curr.age ? prev : curr,
			);
			oldest.status = "terminating";

			// Remove after 2 seconds
			setTimeout(() => {
				instancesRef.current = instancesRef.current.filter(
					(i) => i.id !== oldest.id,
				);
			}, 2000);
		}
	};

	const updateTraffic = (timestamp: number) => {
		// Simulate realistic traffic patterns
		const timeOfDay = (timestamp / 1000) % 120; // 2 minute cycle
		const baseTraffic = 50 + 30 * Math.sin((timeOfDay / 120) * Math.PI * 2);
		const noise = (Math.random() - 0.5) * 20;
		const spikes = Math.random() < 0.01 ? 50 : 0; // Random traffic spikes

		trafficRef.current = Math.max(
			0,
			Math.min(100, baseTraffic + noise + spikes),
		);
	};

	const checkScalingConditions = (timestamp: number) => {
		const runningInstances = instancesRef.current.filter(
			(i) => i.status === "running",
		);
		const avgCpu =
			runningInstances.reduce((sum, i) => sum + i.cpu, 0) /
				runningInstances.length || 0;

		let shouldScale = false;
		let scaleDirection: "up" | "down" = "up";
		let reason = "";

		// Scale up conditions
		if (avgCpu > 70 && runningInstances.length < maxInstancesRef.current) {
			shouldScale = true;
			scaleDirection = "up";
			reason = `High CPU utilization (${avgCpu.toFixed(1)}%)`;
			targetInstancesRef.current = Math.min(
				maxInstancesRef.current,
				runningInstances.length + 1,
			);
		}
		// Scale down conditions
		else if (avgCpu < 30 && runningInstances.length > minInstancesRef.current) {
			shouldScale = true;
			scaleDirection = "down";
			reason = `Low CPU utilization (${avgCpu.toFixed(1)}%)`;
			targetInstancesRef.current = Math.max(
				minInstancesRef.current,
				runningInstances.length - 1,
			);
		}

		if (shouldScale) {
			const event: ScalingEvent = {
				type: scaleDirection === "up" ? "scale_up" : "scale_down",
				timestamp,
				reason,
				targetCount: targetInstancesRef.current,
			};

			scalingEventsRef.current.push(event);
			if (scalingEventsRef.current.length > 5) {
				scalingEventsRef.current.shift();
			}

			if (scaleDirection === "up") {
				createInstance(timestamp);
			} else {
				terminateInstance();
			}
		}
	};

	const updateInstances = (timestamp: number) => {
		instancesRef.current.forEach((instance) => {
			instance.age = (timestamp - instance.startTime) / 1000;

			if (instance.status === "running") {
				// CPU based on traffic load with some variance
				const loadFactor = trafficRef.current / 100;
				instance.cpu = Math.min(95, loadFactor * 80 + Math.random() * 20);
				instance.memory = 40 + instance.cpu * 0.5 + Math.random() * 10;
			} else {
				instance.cpu = Math.max(0, instance.cpu - 2);
				instance.memory = Math.max(0, instance.memory - 1);
			}
		});
	};

	const render = (ctx: CanvasRenderingContext2D, timestamp: number) => {
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, 900, 700);

		// Title
		ctx.fillStyle = "#00ff00";
		ctx.fillText(
			"ASCII Auto-Scaling Infrastructure - Dynamic Resource Management",
			20,
			30,
		);

		// Traffic indicator
		ctx.fillStyle = "#ffffff";
		ctx.fillText("─ CURRENT TRAFFIC ─", 20, 70);
		const trafficBar =
			"█".repeat(Math.floor(trafficRef.current / 5)) +
			"░".repeat(20 - Math.floor(trafficRef.current / 5));
		ctx.fillStyle =
			trafficRef.current > 70
				? "#ff0000"
				: trafficRef.current > 40
					? "#ffff00"
					: "#00ff00";
		ctx.fillText(`[${trafficBar}] ${trafficRef.current.toFixed(1)}%`, 20, 90);

		// Auto-scaler status
		const runningCount = instancesRef.current.filter(
			(i) => i.status === "running",
		).length;
		const startingCount = instancesRef.current.filter(
			(i) => i.status === "starting",
		).length;
		const terminatingCount = instancesRef.current.filter(
			(i) => i.status === "terminating",
		).length;

		ctx.fillStyle = "#ffff00";
		ctx.fillText("─ AUTO-SCALER ─", 450, 70);
		ctx.fillStyle = "#ffffff";
		ctx.fillText(`Target: ${targetInstancesRef.current} instances`, 450, 90);
		ctx.fillText(
			`Running: ${runningCount} | Starting: ${startingCount} | Terminating: ${terminatingCount}`,
			450,
			110,
		);

		// Draw instances
		instancesRef.current.forEach((instance) => {
			let color = "#00ff00"; // running
			if (instance.status === "starting") color = "#ffff00";
			if (instance.status === "terminating") color = "#ff8800";

			ctx.fillStyle = color;
			ctx.fillText("┌─────────────┐", instance.x, instance.y);
			ctx.fillText(`│ ${instance.id}    │`, instance.x, instance.y + 15);
			ctx.fillText(
				`│ ${instance.status.padEnd(11)} │`,
				instance.x,
				instance.y + 30,
			);
			ctx.fillText(
				`│ CPU: ${instance.cpu.toFixed(0)}%    │`,
				instance.x,
				instance.y + 45,
			);
			ctx.fillText(
				`│ MEM: ${instance.memory.toFixed(0)}%    │`,
				instance.x,
				instance.y + 60,
			);
			ctx.fillText("└─────────────┘", instance.x, instance.y + 75);

			// Status indicator
			const statusChar =
				instance.status === "running"
					? "●"
					: instance.status === "starting"
						? "◐"
						: "○";
			ctx.fillText(statusChar, instance.x + 120, instance.y + 30);
		});

		// Scaling events log
		ctx.fillStyle = "#ffffff";
		ctx.fillText("─ SCALING EVENTS ─", 20, 400);
		scalingEventsRef.current.slice(-5).forEach((event, index) => {
			const color = event.type === "scale_up" ? "#00ff00" : "#ff8800";
			ctx.fillStyle = color;
			const timeAgo = ((timestamp - event.timestamp) / 1000).toFixed(0);
			ctx.fillText(
				`${event.type.toUpperCase()}: ${event.reason} (${timeAgo}s ago)`,
				20,
				420 + index * 20,
			);
		});

		// Metrics
		const avgCpu =
			instancesRef.current
				.filter((i) => i.status === "running")
				.reduce((sum, i) => sum + i.cpu, 0) / runningCount || 0;

		ctx.fillStyle = "#ffffff";
		ctx.fillText("─ CLUSTER METRICS ─", 450, 400);
		ctx.fillText(`Total Instances: ${instancesRef.current.length}`, 450, 420);
		ctx.fillText(`Average CPU: ${avgCpu.toFixed(1)}%`, 450, 440);
		ctx.fillText(
			`Scaling Events: ${scalingEventsRef.current.length}`,
			450,
			460,
		);

		// Configuration
		ctx.fillStyle = "#888888";
		ctx.fillText("─ CONFIGURATION ─", 20, 550);
		ctx.fillText(`Min Instances: ${minInstancesRef.current}`, 20, 570);
		ctx.fillText(`Max Instances: ${maxInstancesRef.current}`, 20, 590);
		ctx.fillText("Scale Up: CPU > 70%", 20, 610);
		ctx.fillText("Scale Down: CPU < 30%", 20, 630);
		ctx.fillText("Check Interval: 2s", 20, 650);

		// Legend
		ctx.fillStyle = "#888888";
		ctx.fillText("─ STATUS LEGEND ─", 450, 550);
		ctx.fillStyle = "#00ff00";
		ctx.fillText("● Running", 450, 570);
		ctx.fillStyle = "#ffff00";
		ctx.fillText("◐ Starting", 450, 590);
		ctx.fillStyle = "#ff8800";
		ctx.fillText("○ Terminating", 450, 610);
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
		initializeInstances();
		scalingEventsRef.current = [];
		trafficRef.current = 50;
		targetInstancesRef.current = 2;
	};

	return (
		<div className="p-6 max-w-5xl mx-auto">
			<div className="mb-6">
				<a 
					href="/examples/visual" 
					className="text-blue-500 hover:text-blue-700 text-sm"
				>
					← Back to Visual Examples
				</a>
			</div>

			<h1 className="text-3xl font-bold mb-4">
				ASCII Auto-Scaling Infrastructure
			</h1>
			<p className="text-gray-600 mb-6">
				Real-time visualization of auto-scaling infrastructure that dynamically
				adjusts instance count based on CPU utilization and traffic patterns.
			</p>

			<div className="mb-4 space-x-2">
				<button
					onClick={startAnimation}
					disabled={isRunning}
					className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
				>
					Start Auto-Scaler
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
					<li>Dynamic scaling based on CPU utilization thresholds</li>
					<li>Realistic traffic simulation with natural fluctuations</li>
					<li>
						Instance lifecycle management (starting, running, terminating)
					</li>
					<li>Real-time metrics and scaling event logging</li>
					<li>Configurable min/max instance limits</li>
				</ul>
			</div>
		</div>
	);
}