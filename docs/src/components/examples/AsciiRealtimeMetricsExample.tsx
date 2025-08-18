import { clamp, cos, lerp, sin } from "play.ts";
import { useEffect, useRef, useState } from "react";

interface ServerMetric {
	name: string;
	value: number;
	history: number[];
	threshold: number;
	unit: string;
	status: "normal" | "warning" | "critical";
}

interface AlertEvent {
	id: string;
	timestamp: number;
	severity: "info" | "warning" | "critical";
	message: string;
	acknowledged: boolean;
}

export default function AsciiRealtimeMetricsExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const isRunningRef = useRef(false);
	const timeRef = useRef(0);
	const [isRunning, setIsRunning] = useState(false);

	const metricsRef = useRef<ServerMetric[]>([
		{
			name: "CPU Usage",
			value: 0,
			history: [],
			threshold: 80,
			unit: "%",
			status: "normal",
		},
		{
			name: "Memory",
			value: 0,
			history: [],
			threshold: 85,
			unit: "%",
			status: "normal",
		},
		{
			name: "Disk I/O",
			value: 0,
			history: [],
			threshold: 90,
			unit: "MB/s",
			status: "normal",
		},
		{
			name: "Network",
			value: 0,
			history: [],
			threshold: 95,
			unit: "Mbps",
			status: "normal",
		},
		{
			name: "Load Avg",
			value: 0,
			history: [],
			threshold: 4,
			unit: "",
			status: "normal",
		},
		{
			name: "Connections",
			value: 0,
			history: [],
			threshold: 1000,
			unit: "",
			status: "normal",
		},
	]);

	const alertsRef = useRef<AlertEvent[]>([]);
	const [alerts, setAlerts] = useState<AlertEvent[]>([]);

	const updateMetrics = (deltaTime: number) => {
		const time = timeRef.current;
		const metrics = metricsRef.current;

		metrics.forEach((metric, index) => {
			// Generate realistic metric patterns
			let baseValue = 0;
			let variation = 0;

			switch (metric.name) {
				case "CPU Usage":
					baseValue = 30 + sin(time * 0.5) * 20 + sin(time * 2) * 10;
					variation = Math.random() * 15;
					break;
				case "Memory":
					baseValue = 60 + sin(time * 0.2) * 15;
					variation = Math.random() * 10;
					break;
				case "Disk I/O":
					baseValue = 50 + sin(time * 1.5) * 30 + cos(time * 3) * 20;
					variation = Math.random() * 25;
					break;
				case "Network":
					baseValue = 40 + sin(time * 0.8) * 25 + cos(time * 2.5) * 15;
					variation = Math.random() * 20;
					break;
				case "Load Avg":
					baseValue = 1.5 + sin(time * 0.3) * 1.2;
					variation = Math.random() * 0.8;
					break;
				case "Connections":
					baseValue = 500 + sin(time * 0.7) * 300 + cos(time * 1.8) * 150;
					variation = Math.random() * 100;
					break;
			}

			// Add spikes occasionally
			if (Math.random() < 0.02) {
				variation += Math.random() * 30;
			}

			metric.value = clamp(baseValue + variation, 0, metric.threshold * 1.2);

			// Update history
			metric.history.push(metric.value);
			if (metric.history.length > 50) {
				metric.history.shift();
			}

			// Update status
			if (metric.value > metric.threshold) {
				metric.status = "critical";
			} else if (metric.value > metric.threshold * 0.8) {
				metric.status = "warning";
			} else {
				metric.status = "normal";
			}
		});

		// Generate alerts
		if (Math.random() < 0.01) {
			const criticalMetrics = metrics.filter((m) => m.status === "critical");
			if (criticalMetrics.length > 0) {
				const metric =
					criticalMetrics[Math.floor(Math.random() * criticalMetrics.length)];
				const alert: AlertEvent = {
					id: Math.random().toString(36).substr(2, 8),
					timestamp: Date.now(),
					severity: "critical",
					message: `${metric.name} exceeded threshold: ${metric.value.toFixed(1)}${metric.unit}`,
					acknowledged: false,
				};
				alertsRef.current.unshift(alert);
				if (alertsRef.current.length > 10) {
					alertsRef.current.pop();
				}
				setAlerts([...alertsRef.current]);
			}
		}
	};

	const drawMetricGraph = (
		ctx: CanvasRenderingContext2D,
		metric: ServerMetric,
		x: number,
		y: number,
		width: number,
		height: number,
		charWidth: number,
		charHeight: number,
	) => {
		// Draw border
		ctx.fillStyle =
			metric.status === "critical"
				? "#ff0000"
				: metric.status === "warning"
					? "#ffaa00"
					: "#00ff00";

		// Top border
		for (let i = 0; i < width; i++) {
			ctx.fillText(
				i === 0 ? "╭" : i === width - 1 ? "╮" : "─",
				(x + i) * charWidth,
				y * charHeight,
			);
		}

		// Title
		ctx.fillStyle = "#ffffff";
		const title = `${metric.name}: ${metric.value.toFixed(1)}${metric.unit}`;
		ctx.fillText(title, (x + 2) * charWidth, (y + 1) * charHeight);

		// Side borders and graph area
		for (let j = 1; j < height - 1; j++) {
			ctx.fillStyle =
				metric.status === "critical"
					? "#ff0000"
					: metric.status === "warning"
						? "#ffaa00"
						: "#00ff00";
			ctx.fillText("│", x * charWidth, (y + j) * charHeight);
			ctx.fillText("│", (x + width - 1) * charWidth, (y + j) * charHeight);

			// Clear graph area
			ctx.fillStyle = "#111111";
			for (let i = 1; i < width - 1; i++) {
				ctx.fillText(" ", (x + i) * charWidth, (y + j) * charHeight);
			}
		}

		// Bottom border
		ctx.fillStyle =
			metric.status === "critical"
				? "#ff0000"
				: metric.status === "warning"
					? "#ffaa00"
					: "#00ff00";
		for (let i = 0; i < width; i++) {
			ctx.fillText(
				i === 0 ? "╰" : i === width - 1 ? "╯" : "─",
				(x + i) * charWidth,
				(y + height - 1) * charHeight,
			);
		}

		// Draw graph
		if (metric.history.length > 1) {
			const maxValue = Math.max(
				metric.threshold * 1.2,
				Math.max(...metric.history),
			);
			const graphWidth = width - 2;
			const graphHeight = height - 3;

			for (let i = 0; i < Math.min(metric.history.length, graphWidth); i++) {
				const value = metric.history[metric.history.length - 1 - i];
				const normalizedValue = value / maxValue;
				const barHeight = Math.floor(normalizedValue * graphHeight);

				const graphX = x + graphWidth - i;
				for (let j = 0; j < barHeight; j++) {
					const graphY = y + height - 2 - j;

					let char = "▁";
					let color = "#00ff00";

					if (j === barHeight - 1) {
						if (barHeight < graphHeight * 0.3) char = "▁";
						else if (barHeight < graphHeight * 0.6) char = "▄";
						else char = "█";
					} else {
						char = "█";
					}

					if (value > metric.threshold) {
						color = "#ff0000";
					} else if (value > metric.threshold * 0.8) {
						color = "#ffaa00";
					}

					ctx.fillStyle = color;
					ctx.fillText(char, graphX * charWidth, graphY * charHeight);
				}

				// Draw threshold line
				const thresholdY =
					y +
					height -
					2 -
					Math.floor((metric.threshold / maxValue) * graphHeight);
				if (thresholdY >= y + 2 && thresholdY < y + height - 1) {
					ctx.fillStyle = "#ff00ff";
					ctx.fillText("─", graphX * charWidth, thresholdY * charHeight);
				}
			}
		}
	};

	const drawSystemStatus = (
		ctx: CanvasRenderingContext2D,
		charWidth: number,
		charHeight: number,
	) => {
		const time = timeRef.current;
		const metrics = metricsRef.current;

		// Overall system status
		const criticalCount = metrics.filter((m) => m.status === "critical").length;
		const warningCount = metrics.filter((m) => m.status === "warning").length;

		let statusColor = "#00ff00";
		let statusText = "HEALTHY";

		if (criticalCount > 0) {
			statusColor = "#ff0000";
			statusText = "CRITICAL";
		} else if (warningCount > 0) {
			statusColor = "#ffaa00";
			statusText = "WARNING";
		}

		// Blinking effect for critical status
		if (criticalCount > 0 && Math.floor(time * 2) % 2 === 0) {
			statusColor = "#ffffff";
		}

		ctx.fillStyle = statusColor;
		ctx.fillText(`SYSTEM STATUS: ${statusText}`, 10, 40);

		// Current time
		ctx.fillStyle = "#888888";
		const now = new Date();
		ctx.fillText(`${now.toLocaleTimeString()}`, 500, 40);
	};

	const drawAlerts = (
		ctx: CanvasRenderingContext2D,
		charWidth: number,
		charHeight: number,
	) => {
		const startY = 28;

		ctx.fillStyle = "#ffffff";
		ctx.fillText("RECENT ALERTS:", 10, startY * charHeight);

		alertsRef.current.slice(0, 5).forEach((alert, index) => {
			const y = startY + 1 + index;
			const age = (Date.now() - alert.timestamp) / 1000;

			let color = "#888888";
			if (age < 10) {
				color = alert.severity === "critical" ? "#ff0000" : "#ffaa00";
				// Blinking effect for new alerts
				if (age < 3 && Math.floor(timeRef.current * 3) % 2 === 0) {
					color = "#ffffff";
				}
			}

			ctx.fillStyle = color;
			const timeStr = `${Math.floor(age)}s`;
			const message = alert.message.substring(0, 60);
			ctx.fillText(`[${timeStr.padStart(3)}] ${message}`, 10, y * charHeight);
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
		ctx.fillText("Real-time Server Metrics Dashboard", 10, 20);
		ctx.fillText(
			"═════════════════════════════════════════════════════════════",
			10,
			35,
		);

		updateMetrics(0.016);

		drawSystemStatus(ctx, charWidth, charHeight);

		// Draw metric graphs
		const metrics = metricsRef.current;
		const graphWidth = 25;
		const graphHeight = 8;

		for (let i = 0; i < metrics.length; i++) {
			const x = (i % 3) * 26 + 1;
			const y = Math.floor(i / 3) * 9 + 6;
			drawMetricGraph(
				ctx,
				metrics[i],
				x,
				y,
				graphWidth,
				graphHeight,
				charWidth,
				charHeight,
			);
		}

		drawAlerts(ctx, charWidth, charHeight);

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
				<h1 className="text-3xl font-bold mb-2">
					Real-time Server Metrics Dashboard
				</h1>
				<p className="text-gray-600">
					Live monitoring of critical server metrics with historical graphs,
					threshold alerting, and real-time status updates.
				</p>
			</div>

			<div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-4">
				{metricsRef.current.map((metric, index) => (
					<div
						key={index}
						className={`p-3 rounded ${
							metric.status === "critical"
								? "bg-red-100"
								: metric.status === "warning"
									? "bg-yellow-100"
									: "bg-green-100"
						}`}
					>
						<div className="text-sm text-gray-600">{metric.name}</div>
						<div
							className={`text-2xl font-bold ${
								metric.status === "critical"
									? "text-red-600"
									: metric.status === "warning"
										? "text-yellow-600"
										: "text-green-600"
							}`}
						>
							{metric.value.toFixed(1)}
							{metric.unit}
						</div>
					</div>
				))}
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
					{isRunning ? "Stop" : "Start"} Monitoring
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

			{alerts.length > 0 && (
				<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
					<h3 className="font-semibold text-red-800 mb-2">Active Alerts</h3>
					<div className="space-y-1">
						{alerts.slice(0, 3).map((alert) => (
							<div key={alert.id} className="text-sm text-red-700">
								<span className="font-mono">
									[{new Date(alert.timestamp).toLocaleTimeString()}]
								</span>{" "}
								{alert.message}
							</div>
						))}
					</div>
				</div>
			)}

			<div className="mt-4 text-sm text-gray-600">
				<h3 className="font-semibold mb-2">Legend:</h3>
				<div className="grid grid-cols-2 gap-2">
					<div>Green: Normal operation</div>
					<div>Yellow: Warning threshold</div>
					<div>Red: Critical threshold</div>
					<div>Pink line: Threshold limit</div>
				</div>
			</div>
		</div>
	);
}