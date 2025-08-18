import { useEffect, useRef, useState } from "react";

interface Metric {
	name: string;
	value: number;
	threshold: number;
	status: "ok" | "warning" | "critical";
	history: number[];
}

interface Alert {
	id: string;
	severity: "info" | "warning" | "critical";
	message: string;
	timestamp: number;
	acknowledged: boolean;
}

interface ServiceStatus {
	name: string;
	status: "up" | "down" | "degraded";
	uptime: number;
	responseTime: number;
}

export default function AsciiMonitoringDashboardExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const [isRunning, setIsRunning] = useState(false);
	const isRunningRef = useRef(false);

	const metricsRef = useRef<Metric[]>([
		{ name: "CPU", value: 0, threshold: 80, status: "ok", history: [] },
		{ name: "Memory", value: 0, threshold: 85, status: "ok", history: [] },
		{ name: "Disk I/O", value: 0, threshold: 90, status: "ok", history: [] },
		{ name: "Network", value: 0, threshold: 75, status: "ok", history: [] },
		{ name: "Latency", value: 0, threshold: 500, status: "ok", history: [] },
		{ name: "Error Rate", value: 0, threshold: 5, status: "ok", history: [] },
	]);

	const alertsRef = useRef<Alert[]>([]);
	const nextAlertIdRef = useRef(1);

	const servicesRef = useRef<ServiceStatus[]>([
		{ name: "API Gateway", status: "up", uptime: 99.9, responseTime: 45 },
		{ name: "Auth Service", status: "up", uptime: 99.8, responseTime: 32 },
		{ name: "Database", status: "up", uptime: 99.95, responseTime: 12 },
		{ name: "Cache Layer", status: "up", uptime: 99.7, responseTime: 8 },
		{ name: "Message Queue", status: "up", uptime: 99.85, responseTime: 15 },
	]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		canvas.width = 1000;
		canvas.height = 800;
		ctx.font = "11px monospace";

		const animate = (timestamp: number) => {
			if (!isRunningRef.current) return;

			// Update metrics
			updateMetrics(timestamp);

			// Update services
			updateServices(timestamp);

			// Check for alerts
			checkAlerts(timestamp);

			// Render dashboard
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

	const updateMetrics = (timestamp: number) => {
		metricsRef.current.forEach((metric) => {
			// Simulate realistic metric fluctuations
			let newValue = metric.value;

			switch (metric.name) {
				case "CPU":
					newValue = 30 + 40 * Math.sin(timestamp / 5000) + Math.random() * 20;
					break;
				case "Memory":
					newValue = 45 + 25 * Math.sin(timestamp / 8000) + Math.random() * 15;
					break;
				case "Disk I/O":
					newValue =
						Math.random() < 0.1
							? 60 + Math.random() * 30
							: 10 + Math.random() * 20;
					break;
				case "Network":
					newValue = 20 + 30 * Math.sin(timestamp / 6000) + Math.random() * 25;
					break;
				case "Latency":
					newValue = 50 + 100 * Math.sin(timestamp / 7000) + Math.random() * 50;
					break;
				case "Error Rate":
					newValue =
						Math.random() < 0.05 ? Math.random() * 8 : Math.random() * 2;
					break;
			}

			metric.value = Math.max(0, newValue);

			// Update history (keep last 50 values)
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
				metric.status = "ok";
			}
		});
	};

	const updateServices = (timestamp: number) => {
		servicesRef.current.forEach((service) => {
			// Simulate occasional service issues
			if (Math.random() < 0.001) {
				service.status = Math.random() < 0.7 ? "degraded" : "down";
				service.uptime = Math.max(95, service.uptime - Math.random() * 2);
			} else if (service.status !== "up" && Math.random() < 0.1) {
				service.status = "up";
			}

			// Update response times
			if (service.status === "up") {
				service.responseTime =
					service.responseTime * 0.9 + (Math.random() * 50 + 10) * 0.1;
			} else {
				service.responseTime =
					service.responseTime * 0.9 + (Math.random() * 200 + 100) * 0.1;
			}
		});
	};

	const checkAlerts = (timestamp: number) => {
		// Check metrics for alert conditions
		metricsRef.current.forEach((metric) => {
			if (metric.status === "critical" && Math.random() < 0.02) {
				createAlert(
					"critical",
					`${metric.name} threshold exceeded: ${metric.value.toFixed(1)}%`,
					timestamp,
				);
			}
		});

		// Check services for alerts
		servicesRef.current.forEach((service) => {
			if (service.status === "down" && Math.random() < 0.05) {
				createAlert("critical", `${service.name} is down`, timestamp);
			} else if (service.status === "degraded" && Math.random() < 0.03) {
				createAlert(
					"warning",
					`${service.name} performance degraded`,
					timestamp,
				);
			}
		});

		// Auto-acknowledge old alerts
		alertsRef.current.forEach((alert) => {
			if (!alert.acknowledged && timestamp - alert.timestamp > 10000) {
				alert.acknowledged = true;
			}
		});

		// Remove old acknowledged alerts
		alertsRef.current = alertsRef.current.filter(
			(alert) => !alert.acknowledged || timestamp - alert.timestamp < 20000,
		);
	};

	const createAlert = (
		severity: "info" | "warning" | "critical",
		message: string,
		timestamp: number,
	) => {
		const alert: Alert = {
			id: `alert-${nextAlertIdRef.current++}`,
			severity,
			message,
			timestamp,
			acknowledged: false,
		};

		alertsRef.current.unshift(alert);
		if (alertsRef.current.length > 10) {
			alertsRef.current.pop();
		}
	};

	const render = (ctx: CanvasRenderingContext2D, timestamp: number) => {
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, 1000, 800);

		// Title and timestamp
		ctx.fillStyle = "#00ff00";
		ctx.fillText(
			"ASCII Monitoring Dashboard - Real-time System Health",
			20,
			25,
		);
		ctx.fillStyle = "#888888";
		const time = new Date(timestamp).toLocaleTimeString();
		ctx.fillText(`Last Updated: ${time}`, 700, 25);

		// Metrics section
		renderMetrics(ctx);

		// Services section
		renderServices(ctx);

		// Alerts section
		renderAlerts(ctx, timestamp);

		// System overview
		renderSystemOverview(ctx);
	};

	const renderMetrics = (ctx: CanvasRenderingContext2D) => {
		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			"╔═══ SYSTEM METRICS ═══════════════════════════════════════════════════╗",
			20,
			60,
		);

		metricsRef.current.forEach((metric, index) => {
			const x = 20 + (index % 3) * 300;
			const y = 80 + Math.floor(index / 3) * 120;

			// Metric name and value
			const color =
				metric.status === "critical"
					? "#ff0000"
					: metric.status === "warning"
						? "#ffff00"
						: "#00ff00";

			ctx.fillStyle = color;
			ctx.fillText(
				`${metric.name.padEnd(12)} ${metric.value.toFixed(1).padStart(6)}${metric.name === "Latency" ? "ms" : "%"}`,
				x + 5,
				y + 20,
			);

			// Threshold bar
			const barWidth = 25;
			const fillWidth = Math.floor(
				(metric.value / (metric.threshold * 1.2)) * barWidth,
			);
			const bar =
				"█".repeat(Math.min(fillWidth, barWidth)) +
				"░".repeat(Math.max(0, barWidth - fillWidth));
			ctx.fillText(`[${bar}]`, x + 5, y + 40);

			// Mini sparkline
			if (metric.history.length > 1) {
				ctx.fillStyle = "#666666";
				ctx.fillText("Trend:", x + 5, y + 60);

				const sparkline = metric.history
					.slice(-20)
					.map((val) => {
						const normalized = val / (metric.threshold * 1.2);
						return normalized > 0.7 ? "▲" : normalized > 0.4 ? "■" : "▼";
					})
					.join("");

				ctx.fillStyle = color;
				ctx.fillText(sparkline, x + 50, y + 60);
			}
		});

		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			"╚══════════════════════════════════════════════════════════════════════╝",
			20,
			320,
		);
	};

	const renderServices = (ctx: CanvasRenderingContext2D) => {
		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			"╔═══ SERVICE STATUS ═══════════════════════════════════════════════════╗",
			20,
			350,
		);

		servicesRef.current.forEach((service, index) => {
			const y = 370 + index * 25;

			const statusColor =
				service.status === "up"
					? "#00ff00"
					: service.status === "degraded"
						? "#ffff00"
						: "#ff0000";
			const statusIcon =
				service.status === "up"
					? "●"
					: service.status === "degraded"
						? "◐"
						: "○";

			ctx.fillStyle = statusColor;
			ctx.fillText(`${statusIcon} ${service.name.padEnd(15)}`, 25, y);

			ctx.fillStyle = "#ffffff";
			ctx.fillText(`Uptime: ${service.uptime.toFixed(2)}%`, 200, y);
			ctx.fillText(`Response: ${service.responseTime.toFixed(0)}ms`, 320, y);

			// Status indicator bar
			const uptimeBar =
				"█".repeat(Math.floor(service.uptime / 5)) +
				"░".repeat(20 - Math.floor(service.uptime / 5));
			ctx.fillStyle =
				service.uptime > 99
					? "#00ff00"
					: service.uptime > 95
						? "#ffff00"
						: "#ff0000";
			ctx.fillText(`[${uptimeBar}]`, 450, y);
		});

		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			"╚══════════════════════════════════════════════════════════════════════╝",
			20,
			500,
		);
	};

	const renderAlerts = (ctx: CanvasRenderingContext2D, timestamp: number) => {
		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			"╔═══ ACTIVE ALERTS ════════════════════════════════════════════════════╗",
			520,
			60,
		);

		const activeAlerts = alertsRef.current.filter(
			(alert) => !alert.acknowledged,
		);

		if (activeAlerts.length === 0) {
			ctx.fillStyle = "#00ff00";
			ctx.fillText("✓ No active alerts - All systems nominal", 525, 90);
		} else {
			activeAlerts.slice(0, 8).forEach((alert, index) => {
				const y = 90 + index * 25;

				const severityColor =
					alert.severity === "critical"
						? "#ff0000"
						: alert.severity === "warning"
							? "#ffff00"
							: "#00aaff";
				const severityIcon =
					alert.severity === "critical"
						? "⚠"
						: alert.severity === "warning"
							? "!"
							: "i";

				ctx.fillStyle = severityColor;
				ctx.fillText(`${severityIcon} ${alert.severity.toUpperCase()}`, 525, y);

				ctx.fillStyle = "#ffffff";
				const timeAgo = Math.floor((timestamp - alert.timestamp) / 1000);
				ctx.fillText(
					`${alert.message.substring(0, 35)} (${timeAgo}s ago)`,
					600,
					y,
				);
			});
		}

		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			"╚══════════════════════════════════════════════════════════════════════╝",
			520,
			290,
		);
	};

	const renderSystemOverview = (ctx: CanvasRenderingContext2D) => {
		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			"╔═══ SYSTEM OVERVIEW ══════════════════════════════════════════════════╗",
			520,
			320,
		);

		// Calculate overall health
		const healthyMetrics = metricsRef.current.filter(
			(m) => m.status === "ok",
		).length;
		const healthyServices = servicesRef.current.filter(
			(s) => s.status === "up",
		).length;
		const activeAlerts = alertsRef.current.filter(
			(a) => !a.acknowledged,
		).length;

		const overallHealth =
			((healthyMetrics / metricsRef.current.length +
				healthyServices / servicesRef.current.length) /
				2) *
			100;

		const healthColor =
			overallHealth > 90
				? "#00ff00"
				: overallHealth > 70
					? "#ffff00"
					: "#ff0000";
		const healthStatus =
			overallHealth > 90
				? "EXCELLENT"
				: overallHealth > 70
					? "GOOD"
					: "DEGRADED";

		ctx.fillStyle = healthColor;
		ctx.fillText(
			`System Health: ${healthStatus} (${overallHealth.toFixed(1)}%)`,
			525,
			350,
		);

		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			`Metrics OK: ${healthyMetrics}/${metricsRef.current.length}`,
			525,
			380,
		);
		ctx.fillText(
			`Services UP: ${healthyServices}/${servicesRef.current.length}`,
			525,
			400,
		);
		ctx.fillText(`Active Alerts: ${activeAlerts}`, 525, 420);

		// Performance indicators
		const avgLatency =
			metricsRef.current.find((m) => m.name === "Latency")?.value || 0;
		const errorRate =
			metricsRef.current.find((m) => m.name === "Error Rate")?.value || 0;

		ctx.fillText(`Avg Latency: ${avgLatency.toFixed(0)}ms`, 525, 450);
		ctx.fillText(`Error Rate: ${errorRate.toFixed(2)}%`, 525, 470);

		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			"╚══════════════════════════════════════════════════════════════════════╝",
			520,
			500,
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
		// Reset all metrics
		metricsRef.current.forEach((metric) => {
			metric.value = 0;
			metric.status = "ok";
			metric.history = [];
		});
		alertsRef.current = [];
		// Reset services
		servicesRef.current.forEach((service) => {
			service.status = "up";
			service.uptime = 99.9;
			service.responseTime = Math.random() * 50 + 10;
		});
	};

	return (
		<div className="p-6 max-w-6xl mx-auto">
			<h1 className="text-3xl font-bold mb-4">ASCII Monitoring Dashboard</h1>
			<p className="text-gray-600 mb-6">
				Comprehensive real-time monitoring dashboard showing system metrics,
				service health, alerts, and overall infrastructure status.
			</p>

			<div className="mb-4 space-x-2">
				<button
					onClick={startAnimation}
					disabled={isRunning}
					className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
				>
					Start Monitoring
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
					<li>Real-time system metrics with threshold monitoring</li>
					<li>Service health tracking with uptime statistics</li>
					<li>Alert management with severity levels and timestamps</li>
					<li>Trend visualization with sparkline charts</li>
					<li>Overall system health scoring and performance indicators</li>
				</ul>
			</div>
		</div>
	);
}