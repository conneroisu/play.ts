import { clamp, cos, lerp, sin } from "play.ts";
import { useEffect, useRef, useState } from "react";

interface ServiceInstance {
	id: string;
	status: "starting" | "running" | "stopping" | "stopped";
	cpu: number;
	memory: number;
	requests: number;
	uptime: number;
	zone: string;
	x: number;
	y: number;
}

interface LoadBalancer {
	totalRequests: number;
	requestsPerSecond: number;
	activeConnections: number;
	responseTime: number;
}

interface AutoscalingMetrics {
	targetCPU: number;
	currentCPU: number;
	desiredReplicas: number;
	currentReplicas: number;
	minReplicas: number;
	maxReplicas: number;
}

export default function AsciiCloudScalingExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const isRunningRef = useRef(false);
	const timeRef = useRef(0);
	const [isRunning, setIsRunning] = useState(false);

	const instancesRef = useRef<ServiceInstance[]>([
		{
			id: "inst-1",
			status: "running",
			cpu: 20,
			memory: 30,
			requests: 0,
			uptime: 100,
			zone: "us-east-1a",
			x: 10,
			y: 8,
		},
		{
			id: "inst-2",
			status: "running",
			cpu: 25,
			memory: 35,
			requests: 0,
			uptime: 98,
			zone: "us-east-1b",
			x: 30,
			y: 8,
		},
	]);

	const loadBalancerRef = useRef<LoadBalancer>({
		totalRequests: 0,
		requestsPerSecond: 0,
		activeConnections: 0,
		responseTime: 50,
	});

	const autoscalingRef = useRef<AutoscalingMetrics>({
		targetCPU: 70,
		currentCPU: 0,
		desiredReplicas: 2,
		currentReplicas: 2,
		minReplicas: 2,
		maxReplicas: 10,
	});

	const trafficEventsRef = useRef<Array<{ time: number; spike: boolean }>>([]);
	const [metrics, setMetrics] = useState({
		totalInstances: 2,
		runningInstances: 2,
		avgCPU: 0,
		totalRequests: 0,
		responseTime: 50,
	});

	const createInstance = (zone: string): ServiceInstance => {
		const id = `inst-${Math.random().toString(36).substr(2, 4)}`;
		const instances = instancesRef.current;
		const x = 10 + (instances.length % 8) * 10;
		const y = 8 + Math.floor(instances.length / 8) * 6;

		return {
			id,
			status: "starting",
			cpu: 0,
			memory: 0,
			requests: 0,
			uptime: 0,
			zone,
			x,
			y,
		};
	};

	const generateTrafficPattern = (time: number): number => {
		// Base traffic with daily patterns
		const baseTraffic = 50 + sin(time * 0.1) * 30;

		// Random spikes
		let spikeMultiplier = 1;
		if (Math.random() < 0.005) {
			trafficEventsRef.current.push({ time, spike: true });
		}

		// Apply traffic spikes
		trafficEventsRef.current = trafficEventsRef.current.filter((event) => {
			const age = time - event.time;
			if (age < 10) {
				spikeMultiplier *= 1 + 2 * Math.exp(-age);
				return true;
			}
			return false;
		});

		return baseTraffic * spikeMultiplier;
	};

	const updateLoadBalancer = (deltaTime: number) => {
		const lb = loadBalancerRef.current;
		const time = timeRef.current;

		// Generate realistic traffic
		const targetRPS = generateTrafficPattern(time);
		lb.requestsPerSecond = lerp(lb.requestsPerSecond, targetRPS, 0.1);
		lb.totalRequests += lb.requestsPerSecond * deltaTime;

		// Active connections based on RPS
		lb.activeConnections = Math.floor(
			lb.requestsPerSecond * 2 + Math.random() * 10,
		);

		// Response time affected by load
		const instances = instancesRef.current.filter(
			(i) => i.status === "running",
		);
		if (instances.length > 0) {
			const avgCPU =
				instances.reduce((sum, i) => sum + i.cpu, 0) / instances.length;
			const baseResponseTime = 50;
			const loadFactor = Math.max(1, avgCPU / 70);
			lb.responseTime = lerp(
				lb.responseTime,
				baseResponseTime * loadFactor,
				0.1,
			);
		}
	};

	const updateInstance = (instance: ServiceInstance, deltaTime: number) => {
		const lb = loadBalancerRef.current;

		if (instance.status === "starting") {
			instance.uptime += deltaTime;
			if (instance.uptime > 3) {
				instance.status = "running";
			}
			return;
		}

		if (instance.status === "stopping") {
			instance.uptime += deltaTime;
			if (instance.uptime > 2) {
				instance.status = "stopped";
			}
			return;
		}

		if (instance.status === "running") {
			instance.uptime += deltaTime;

			// Distribute load among running instances
			const runningInstances = instancesRef.current.filter(
				(i) => i.status === "running",
			);
			if (runningInstances.length > 0) {
				const requestsPerInstance =
					lb.requestsPerSecond / runningInstances.length;
				instance.requests = requestsPerInstance;

				// CPU usage based on requests
				const targetCPU = Math.min(
					95,
					requestsPerInstance * 2 + Math.random() * 10,
				);
				instance.cpu = lerp(instance.cpu, targetCPU, 0.05);

				// Memory usage
				const targetMemory =
					40 + (instance.cpu / 100) * 40 + Math.random() * 10;
				instance.memory = lerp(instance.memory, targetMemory, 0.03);
			}
		}
	};

	const updateAutoscaling = () => {
		const instances = instancesRef.current;
		const autoscaling = autoscalingRef.current;
		const runningInstances = instances.filter((i) => i.status === "running");

		// Calculate current metrics
		autoscaling.currentReplicas = instances.filter(
			(i) => i.status !== "stopped",
		).length;

		if (runningInstances.length > 0) {
			autoscaling.currentCPU =
				runningInstances.reduce((sum, i) => sum + i.cpu, 0) /
				runningInstances.length;
		}

		// Autoscaling logic
		if (
			autoscaling.currentCPU > autoscaling.targetCPU + 10 &&
			autoscaling.currentReplicas < autoscaling.maxReplicas
		) {
			// Scale up
			autoscaling.desiredReplicas = Math.min(
				autoscaling.maxReplicas,
				autoscaling.currentReplicas + 1,
			);
		} else if (
			autoscaling.currentCPU < autoscaling.targetCPU - 20 &&
			autoscaling.currentReplicas > autoscaling.minReplicas
		) {
			// Scale down
			autoscaling.desiredReplicas = Math.max(
				autoscaling.minReplicas,
				autoscaling.currentReplicas - 1,
			);
		}

		// Execute scaling actions
		if (autoscaling.desiredReplicas > autoscaling.currentReplicas) {
			// Add new instance
			const zones = ["us-east-1a", "us-east-1b", "us-east-1c"];
			const zone = zones[Math.floor(Math.random() * zones.length)];
			instances.push(createInstance(zone));
		} else if (autoscaling.desiredReplicas < autoscaling.currentReplicas) {
			// Remove instance
			const instanceToRemove = runningInstances[runningInstances.length - 1];
			if (instanceToRemove) {
				instanceToRemove.status = "stopping";
				instanceToRemove.uptime = 0;
			}
		}
	};

	const drawInstance = (
		ctx: CanvasRenderingContext2D,
		instance: ServiceInstance,
		charWidth: number,
		charHeight: number,
	) => {
		const x = instance.x;
		const y = instance.y;

		let statusColor = "#00ff00";
		let statusSymbol = "●";

		switch (instance.status) {
			case "starting":
				statusColor = "#ffff00";
				statusSymbol = "◯";
				break;
			case "running":
				statusColor = instance.cpu > 80 ? "#ff8800" : "#00ff00";
				statusSymbol = "●";
				break;
			case "stopping":
				statusColor = "#ff8800";
				statusSymbol = "◐";
				break;
			case "stopped":
				statusColor = "#666666";
				statusSymbol = "○";
				break;
		}

		// Instance box
		ctx.fillStyle = statusColor;
		ctx.fillText("╭────────────╮", x * charWidth, y * charHeight);

		// Instance header
		ctx.fillText("│", x * charWidth, (y + 1) * charHeight);
		ctx.fillText("│", (x + 13) * charWidth, (y + 1) * charHeight);
		ctx.fillStyle = "#ffffff";
		ctx.fillText(`${instance.id}`, (x + 2) * charWidth, (y + 1) * charHeight);
		ctx.fillStyle = statusColor;
		ctx.fillText(statusSymbol, (x + 11) * charWidth, (y + 1) * charHeight);

		// Metrics
		ctx.fillText("│", x * charWidth, (y + 2) * charHeight);
		ctx.fillText("│", (x + 13) * charWidth, (y + 2) * charHeight);
		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			`CPU:${instance.cpu.toFixed(0)}%`,
			(x + 2) * charWidth,
			(y + 2) * charHeight,
		);

		ctx.fillStyle = statusColor;
		ctx.fillText("│", x * charWidth, (y + 3) * charHeight);
		ctx.fillText("│", (x + 13) * charWidth, (y + 3) * charHeight);
		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			`MEM:${instance.memory.toFixed(0)}%`,
			(x + 2) * charWidth,
			(y + 3) * charHeight,
		);

		ctx.fillStyle = statusColor;
		ctx.fillText("│", x * charWidth, (y + 4) * charHeight);
		ctx.fillText("│", (x + 13) * charWidth, (y + 4) * charHeight);
		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			`RPS:${instance.requests.toFixed(0)}`,
			(x + 2) * charWidth,
			(y + 4) * charHeight,
		);

		ctx.fillStyle = statusColor;
		ctx.fillText("╰────────────╯", x * charWidth, (y + 5) * charHeight);

		// Zone indicator
		ctx.fillStyle = "#666666";
		ctx.fillText(
			instance.zone.slice(-2),
			(x + 5) * charWidth,
			(y + 6) * charHeight,
		);
	};

	const drawLoadBalancer = (
		ctx: CanvasRenderingContext2D,
		charWidth: number,
		charHeight: number,
	) => {
		const lb = loadBalancerRef.current;
		const x = 35;
		const y = 3;

		ctx.fillStyle = "#00ffff";
		ctx.fillText("╭─── LOAD BALANCER ───╮", x * charWidth, y * charHeight);
		ctx.fillText("│", x * charWidth, (y + 1) * charHeight);
		ctx.fillText("│", (x + 20) * charWidth, (y + 1) * charHeight);

		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			`RPS: ${lb.requestsPerSecond.toFixed(0)}`,
			(x + 2) * charWidth,
			(y + 1) * charHeight,
		);
		ctx.fillText(
			`RT: ${lb.responseTime.toFixed(0)}ms`,
			(x + 12) * charWidth,
			(y + 1) * charHeight,
		);

		ctx.fillStyle = "#00ffff";
		ctx.fillText("│", x * charWidth, (y + 2) * charHeight);
		ctx.fillText("│", (x + 20) * charWidth, (y + 2) * charHeight);

		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			`Connections: ${lb.activeConnections}`,
			(x + 2) * charWidth,
			(y + 2) * charHeight,
		);

		ctx.fillStyle = "#00ffff";
		ctx.fillText(
			"╰─────────────────────╯",
			x * charWidth,
			(y + 3) * charHeight,
		);

		// Traffic flow visualization
		const instances = instancesRef.current.filter(
			(i) => i.status === "running",
		);
		instances.forEach((instance, index) => {
			if (Math.random() < 0.3) {
				const flowY = y + 4;
				const flowX = x + 10 + (Math.random() - 0.5) * 4;
				const targetX = instance.x + 6;
				const targetY = instance.y - 1;

				// Animated traffic
				const progress = (timeRef.current * 3 + index) % 1;
				const currentX = flowX + (targetX - flowX) * progress;
				const currentY = flowY + (targetY - flowY) * progress;

				ctx.fillStyle = "#ffff00";
				ctx.fillText("→", currentX * charWidth, currentY * charHeight);
			}
		});
	};

	const drawAutoscalingInfo = (
		ctx: CanvasRenderingContext2D,
		charWidth: number,
		charHeight: number,
	) => {
		const autoscaling = autoscalingRef.current;
		const x = 5;
		const y = 20;

		ctx.fillStyle = "#ffffff";
		ctx.fillText("AUTOSCALING CONTROLLER", x * charWidth, y * charHeight);
		ctx.fillText("──────────────────────", x * charWidth, (y + 1) * charHeight);

		ctx.fillStyle = "#888888";
		ctx.fillText(
			`Target CPU: ${autoscaling.targetCPU}%`,
			x * charWidth,
			(y + 2) * charHeight,
		);
		ctx.fillText(
			`Current CPU: ${autoscaling.currentCPU.toFixed(1)}%`,
			x * charWidth,
			(y + 3) * charHeight,
		);
		ctx.fillText(
			`Min/Max Replicas: ${autoscaling.minReplicas}/${autoscaling.maxReplicas}`,
			x * charWidth,
			(y + 4) * charHeight,
		);

		const statusColor =
			autoscaling.desiredReplicas !== autoscaling.currentReplicas
				? "#ffff00"
				: "#00ff00";
		ctx.fillStyle = statusColor;
		ctx.fillText(
			`Current/Desired: ${autoscaling.currentReplicas}/${autoscaling.desiredReplicas}`,
			x * charWidth,
			(y + 5) * charHeight,
		);

		// Scaling events
		if (autoscaling.desiredReplicas > autoscaling.currentReplicas) {
			ctx.fillStyle = "#00ff00";
			ctx.fillText("▲ SCALING UP", (x + 25) * charWidth, (y + 2) * charHeight);
		} else if (autoscaling.desiredReplicas < autoscaling.currentReplicas) {
			ctx.fillStyle = "#ff8800";
			ctx.fillText(
				"▼ SCALING DOWN",
				(x + 25) * charWidth,
				(y + 2) * charHeight,
			);
		} else {
			ctx.fillStyle = "#888888";
			ctx.fillText("● STABLE", (x + 25) * charWidth, (y + 2) * charHeight);
		}
	};

	const drawTrafficSpikes = (
		ctx: CanvasRenderingContext2D,
		charWidth: number,
		charHeight: number,
	) => {
		trafficEventsRef.current.forEach((event) => {
			const age = timeRef.current - event.time;
			if (age < 5) {
				const alpha = 1 - age / 5;
				const x = 60 + Math.random() * 10;
				const y = 2 + Math.random() * 3;

				if (alpha > 0.5) {
					ctx.fillStyle = "#ff0000";
					ctx.fillText("⚡", x * charWidth, y * charHeight);
				}
			}
		});
	};

	const animate = () => {
		if (!isRunningRef.current) return;

		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		timeRef.current += 0.016;

		// Clear canvas
		ctx.fillStyle = "#000000";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		const charWidth = 8;
		const charHeight = 16;
		ctx.font = "12px monospace";

		// Title
		ctx.fillStyle = "#ffffff";
		ctx.fillText("Cloud Auto-scaling Dashboard", 10, 20);
		ctx.fillText(
			"════════════════════════════════════════════════════════════════",
			10,
			35,
		);

		// Update systems
		updateLoadBalancer(0.016);
		instancesRef.current.forEach((instance) => updateInstance(instance, 0.016));

		// Check for autoscaling every second
		if (Math.floor(timeRef.current * 10) % 10 === 0) {
			updateAutoscaling();
		}

		// Remove stopped instances
		instancesRef.current = instancesRef.current.filter(
			(i) => i.status !== "stopped",
		);

		// Update positions for new instances
		instancesRef.current.forEach((instance, index) => {
			instance.x = 10 + (index % 8) * 10;
			instance.y = 8 + Math.floor(index / 8) * 6;
		});

		// Draw components
		drawLoadBalancer(ctx, charWidth, charHeight);
		instancesRef.current.forEach((instance) =>
			drawInstance(ctx, instance, charWidth, charHeight),
		);
		drawAutoscalingInfo(ctx, charWidth, charHeight);
		drawTrafficSpikes(ctx, charWidth, charHeight);

		// Update metrics
		const runningInstances = instancesRef.current.filter(
			(i) => i.status === "running",
		);
		const avgCPU =
			runningInstances.length > 0
				? runningInstances.reduce((sum, i) => sum + i.cpu, 0) /
					runningInstances.length
				: 0;

		setMetrics({
			totalInstances: instancesRef.current.length,
			runningInstances: runningInstances.length,
			avgCPU,
			totalRequests: Math.floor(loadBalancerRef.current.totalRequests),
			responseTime: Math.floor(loadBalancerRef.current.responseTime),
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
		<div className="p-6 max-w-6xl mx-auto">
			<div className="mb-6">
				<h1 className="text-3xl font-bold mb-2">Cloud Auto-scaling</h1>
				<p className="text-gray-600">
					Real-time visualization of cloud auto-scaling in action, showing load
					balancer traffic, instance scaling based on CPU utilization, and
					traffic spike handling.
				</p>
				<p className="text-sm text-gray-500 mt-2">
					<a href="/examples/visual" className="text-blue-600 hover:underline">
						← Back to Visual Examples
					</a>
				</p>
			</div>

			<div className="mb-4 grid grid-cols-2 md:grid-cols-5 gap-4">
				<div className="bg-blue-100 p-3 rounded">
					<div className="text-sm text-gray-600">Running Instances</div>
					<div className="text-2xl font-bold text-blue-600">
						{metrics.runningInstances}
					</div>
				</div>
				<div className="bg-green-100 p-3 rounded">
					<div className="text-sm text-gray-600">Avg CPU</div>
					<div className="text-2xl font-bold text-green-600">
						{metrics.avgCPU.toFixed(0)}%
					</div>
				</div>
				<div className="bg-purple-100 p-3 rounded">
					<div className="text-sm text-gray-600">Total Requests</div>
					<div className="text-2xl font-bold text-purple-600">
						{metrics.totalRequests}
					</div>
				</div>
				<div className="bg-yellow-100 p-3 rounded">
					<div className="text-sm text-gray-600">Response Time</div>
					<div className="text-2xl font-bold text-yellow-600">
						{metrics.responseTime}ms
					</div>
				</div>
				<div className="bg-gray-100 p-3 rounded">
					<div className="text-sm text-gray-600">Total Instances</div>
					<div className="text-2xl font-bold">{metrics.totalInstances}</div>
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
					{isRunning ? "Stop" : "Start"} Auto-scaling
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
					<div>◯ Starting instance</div>
					<div>● Running instance</div>
					<div>◐ Stopping instance</div>
					<div>→ Traffic flow</div>
					<div>⚡ Traffic spike</div>
					<div>▲/▼ Scaling events</div>
				</div>
			</div>
		</div>
	);
}