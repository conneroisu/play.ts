import { createFileRoute } from "@tanstack/react-router";
import { clamp, lerp } from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/visual/ascii-service-mesh")({
	component: ASCIIServiceMeshExample,
});

interface Microservice {
	id: string;
	name: string;
	version: string;
	namespace: string;
	status: "healthy" | "degraded" | "unhealthy" | "starting" | "stopping";
	replicas: number;
	cpu_usage: number;
	memory_usage: number;
	request_rate: number;
	error_rate: number;
	response_time: number;
	x: number;
	y: number;
	dependencies: string[];
	endpoints: ServiceEndpoint[];
	circuit_breaker_state: "closed" | "open" | "half-open";
	retry_count: number;
	timeout_ms: number;
	istio_enabled: boolean;
	envoy_proxy: boolean;
}

interface ServiceEndpoint {
	path: string;
	method: string;
	request_count: number;
	avg_latency: number;
	error_count: number;
}

interface ServiceRequest {
	id: string;
	from_service: string;
	to_service: string;
	progress: number;
	method: string;
	path: string;
	status_code: number;
	latency: number;
	retry_attempt: number;
	trace_id: string;
	span_id: string;
}

interface ServiceMeshGateway {
	id: string;
	name: string;
	type: "ingress" | "egress" | "internal";
	host: string;
	port: number;
	ssl_enabled: boolean;
	rate_limit: number;
	requests_per_second: number;
	connected_services: string[];
	x: number;
	y: number;
}

interface MeshMetrics {
	total_requests: number;
	success_rate: number;
	avg_latency: number;
	p99_latency: number;
	active_connections: number;
	retries: number;
	circuit_breakers_open: number;
	mtls_enabled: boolean;
}

function ASCIIServiceMeshExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>(0);
	const servicesRef = useRef<Map<string, Microservice>>(new Map());
	const gatewaysRef = useRef<Map<string, ServiceMeshGateway>>(new Map());
	const requestsRef = useRef<ServiceRequest[]>([]);
	const meshMetricsRef = useRef<MeshMetrics>({
		total_requests: 0,
		success_rate: 99.5,
		avg_latency: 45,
		p99_latency: 150,
		active_connections: 0,
		retries: 0,
		circuit_breakers_open: 0,
		mtls_enabled: true,
	});
	const [isPlaying, setIsPlaying] = useState(true);
	const [speed, setSpeed] = useState(1);
	const [viewMode, setViewMode] = useState("topology");
	const [selectedService, setSelectedService] = useState("user-service");
	const [displayMetric, setDisplayMetric] = useState("latency");
	const [showTracing, setShowTracing] = useState(true);
	const [showRetries, setShowRetries] = useState(true);
	const [colorScheme, setColorScheme] = useState("istio");
	const [meshMode, setMeshMode] = useState("istio");
	const [trafficPattern, setTrafficPattern] = useState("normal");
	const [faultInjection, setFaultInjection] = useState("none");

	const colorSchemes = {
		istio: {
			bg: "#0F1419",
			healthy: "#00D084",
			degraded: "#FF9500",
			unhealthy: "#FF4757",
			gateway: "#466BB0",
			request: "#00D4FF",
			text: "#FFFFFF",
			mesh: "#7209B7",
			proxy: "#2ED573",
		},
		linkerd: {
			bg: "#1B1D23",
			healthy: "#00D4FF",
			degraded: "#FFA726",
			unhealthy: "#F44336",
			gateway: "#2196F3",
			request: "#E91E63",
			text: "#FFFFFF",
			mesh: "#9C27B0",
			proxy: "#4CAF50",
		},
		consul: {
			bg: "#000000",
			healthy: "#CA2171",
			degraded: "#DC477D",
			unhealthy: "#F596AA",
			gateway: "#8C1C84",
			request: "#DC477D",
			text: "#FFFFFF",
			mesh: "#F596AA",
			proxy: "#CA2171",
		},
	};

	useEffect(() => {
		// Initialize microservices mesh
		const services = new Map<string, Microservice>();
		const gateways = new Map<string, ServiceMeshGateway>();

		// Create microservices
		const serviceConfigs = [
			{
				name: "user-service",
				namespace: "default",
				x: 20,
				y: 10,
				deps: ["auth-service", "profile-service"],
			},
			{
				name: "auth-service",
				namespace: "security",
				x: 5,
				y: 20,
				deps: ["database-service"],
			},
			{
				name: "profile-service",
				namespace: "default",
				x: 35,
				y: 20,
				deps: ["database-service", "cache-service"],
			},
			{
				name: "order-service",
				namespace: "commerce",
				x: 50,
				y: 10,
				deps: ["payment-service", "inventory-service"],
			},
			{
				name: "payment-service",
				namespace: "commerce",
				x: 65,
				y: 20,
				deps: ["bank-api", "fraud-detection"],
			},
			{
				name: "inventory-service",
				namespace: "commerce",
				x: 35,
				y: 30,
				deps: ["database-service"],
			},
			{
				name: "notification-service",
				namespace: "messaging",
				x: 80,
				y: 15,
				deps: ["email-service", "sms-service"],
			},
			{ name: "database-service", namespace: "data", x: 20, y: 35, deps: [] },
			{ name: "cache-service", namespace: "data", x: 50, y: 35, deps: [] },
			{
				name: "api-gateway",
				namespace: "gateway",
				x: 10,
				y: 5,
				deps: ["user-service", "order-service"],
			},
			{ name: "email-service", namespace: "external", x: 95, y: 10, deps: [] },
			{ name: "sms-service", namespace: "external", x: 95, y: 20, deps: [] },
			{ name: "bank-api", namespace: "external", x: 80, y: 30, deps: [] },
			{
				name: "fraud-detection",
				namespace: "security",
				x: 65,
				y: 35,
				deps: ["ml-service"],
			},
			{ name: "ml-service", namespace: "ai", x: 80, y: 40, deps: [] },
		];

		serviceConfigs.forEach((config, i) => {
			const service: Microservice = {
				id: `svc-${i}`,
				name: config.name,
				version:
					"v" +
					(Math.floor(Math.random() * 3) + 1) +
					"." +
					Math.floor(Math.random() * 10),
				namespace: config.namespace,
				status: Math.random() > 0.95 ? "degraded" : "healthy",
				replicas: Math.floor(Math.random() * 5) + 1,
				cpu_usage: Math.random() * 80 + 10,
				memory_usage: Math.random() * 70 + 20,
				request_rate: Math.random() * 1000 + 100,
				error_rate: Math.random() * 5,
				response_time: Math.random() * 100 + 20,
				x: config.x,
				y: config.y,
				dependencies: config.deps,
				endpoints: [
					{
						path: "/health",
						method: "GET",
						request_count: 0,
						avg_latency: 10,
						error_count: 0,
					},
					{
						path: "/api/v1",
						method: "GET",
						request_count: 0,
						avg_latency: 45,
						error_count: 0,
					},
					{
						path: "/api/v1",
						method: "POST",
						request_count: 0,
						avg_latency: 80,
						error_count: 0,
					},
				],
				circuit_breaker_state: "closed",
				retry_count: 0,
				timeout_ms: 5000,
				istio_enabled: meshMode === "istio",
				envoy_proxy: meshMode === "istio" || meshMode === "linkerd",
			};
			services.set(service.id, service);
		});

		// Create service mesh gateways
		const gatewayConfigs = [
			{
				name: "istio-ingress",
				type: "ingress",
				host: "api.example.com",
				port: 443,
				x: 5,
				y: 1,
			},
			{
				name: "istio-egress",
				type: "egress",
				host: "external-apis",
				port: 443,
				x: 95,
				y: 1,
			},
			{
				name: "internal-gateway",
				type: "internal",
				host: "internal.svc.cluster.local",
				port: 80,
				x: 50,
				y: 1,
			},
		];

		gatewayConfigs.forEach((config, i) => {
			const gateway: ServiceMeshGateway = {
				id: `gw-${i}`,
				name: config.name,
				type: config.type as any,
				host: config.host,
				port: config.port,
				ssl_enabled: config.port === 443,
				rate_limit: 1000,
				requests_per_second: Math.random() * 500 + 100,
				connected_services:
					config.type === "ingress"
						? ["api-gateway"]
						: config.type === "egress"
							? ["email-service", "sms-service", "bank-api"]
							: ["user-service", "order-service"],
				x: config.x,
				y: config.y,
			};
			gateways.set(gateway.id, gateway);
		});

		servicesRef.current = services;
		gatewaysRef.current = gateways;
	}, [meshMode]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const resizeCanvas = () => {
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
		};

		const updateMeshMetrics = () => {
			const services = servicesRef.current;
			const gateways = gatewaysRef.current;
			const metrics = meshMetricsRef.current;
			const time = Date.now() / 1000;

			// Update service metrics
			services.forEach((service) => {
				// Apply traffic patterns
				let trafficMultiplier = 1;
				if (trafficPattern === "spike") {
					trafficMultiplier = 1 + 2 * Math.sin(time * 2);
				} else if (trafficPattern === "gradual-increase") {
					trafficMultiplier = 1 + (time % 60) / 60;
				} else if (trafficPattern === "random-bursts") {
					trafficMultiplier = Math.random() < 0.1 ? 3 : 1;
				}

				// Apply fault injection
				if (faultInjection === "latency" && service.name === selectedService) {
					service.response_time = Math.min(5000, service.response_time + 1000);
				} else if (
					faultInjection === "errors" &&
					service.name === selectedService
				) {
					service.error_rate = Math.min(50, service.error_rate + 10);
				} else if (
					faultInjection === "circuit-breaker" &&
					service.name === selectedService
				) {
					service.circuit_breaker_state = "open";
				}

				// Update service metrics
				service.request_rate = clamp(
					service.request_rate * trafficMultiplier + (Math.random() - 0.5) * 50,
					10,
					2000,
				);

				service.response_time = clamp(
					service.response_time + (Math.random() - 0.5) * 10,
					10,
					service.circuit_breaker_state === "open" ? 5000 : 500,
				);

				service.error_rate = clamp(
					service.error_rate + (Math.random() - 0.5) * 1,
					0,
					service.circuit_breaker_state === "open" ? 50 : 10,
				);

				service.cpu_usage = clamp(
					service.cpu_usage + (Math.random() - 0.5) * 5,
					5,
					95,
				);

				service.memory_usage = clamp(
					service.memory_usage + (Math.random() - 0.5) * 3,
					10,
					90,
				);

				// Update service status based on metrics
				if (service.error_rate > 10 || service.response_time > 1000) {
					service.status = "unhealthy";
				} else if (service.error_rate > 5 || service.response_time > 500) {
					service.status = "degraded";
				} else {
					service.status = "healthy";
				}

				// Circuit breaker logic
				if (
					service.error_rate > 20 &&
					service.circuit_breaker_state === "closed"
				) {
					service.circuit_breaker_state = "open";
				} else if (
					service.circuit_breaker_state === "open" &&
					Math.random() < 0.05
				) {
					service.circuit_breaker_state = "half-open";
				} else if (
					service.circuit_breaker_state === "half-open" &&
					service.error_rate < 5
				) {
					service.circuit_breaker_state = "closed";
				}

				// Update endpoints
				service.endpoints.forEach((endpoint) => {
					endpoint.request_count += Math.floor(service.request_rate / 10);
					endpoint.avg_latency =
						service.response_time + (Math.random() - 0.5) * 20;
					endpoint.error_count += Math.floor(service.error_rate / 5);
				});
			});

			// Update gateway metrics
			gateways.forEach((gateway) => {
				gateway.requests_per_second = clamp(
					gateway.requests_per_second + (Math.random() - 0.5) * 50,
					50,
					1500,
				);
			});

			// Generate service requests
			if (Math.random() < 0.2 * speed && showTracing) {
				const allServices = Array.from(services.values());
				const serviceWithDeps = allServices.filter(
					(s) => s.dependencies.length > 0,
				);

				if (serviceWithDeps.length > 0) {
					const sourceService =
						serviceWithDeps[Math.floor(Math.random() * serviceWithDeps.length)];
					const targetServiceName =
						sourceService.dependencies[
							Math.floor(Math.random() * sourceService.dependencies.length)
						];
					const targetService = Array.from(services.values()).find(
						(s) => s.name === targetServiceName,
					);

					if (targetService) {
						const shouldRetry =
							sourceService.circuit_breaker_state === "open" ||
							Math.random() < 0.1;

						requestsRef.current.push({
							id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
							from_service: sourceService.id,
							to_service: targetService.id,
							progress: 0,
							method: Math.random() < 0.7 ? "GET" : "POST",
							path: "/api/v1",
							status_code:
								targetService.error_rate > 10
									? Math.random() < 0.3
										? 500
										: 200
									: Math.random() < 0.05
										? 404
										: 200,
							latency: targetService.response_time + (Math.random() - 0.5) * 20,
							retry_attempt: shouldRetry ? Math.floor(Math.random() * 3) : 0,
							trace_id: Math.random().toString(36).substr(2, 16),
							span_id: Math.random().toString(36).substr(2, 8),
						});
					}
				}
			}

			// Update service requests
			requestsRef.current = requestsRef.current.filter((request) => {
				request.progress += 0.03 * speed;
				return request.progress < 1;
			});

			// Update global mesh metrics
			const totalServices = services.size;
			const healthyServices = Array.from(services.values()).filter(
				(s) => s.status === "healthy",
			).length;
			const openCircuitBreakers = Array.from(services.values()).filter(
				(s) => s.circuit_breaker_state === "open",
			).length;
			const totalRequests = Array.from(services.values()).reduce(
				(sum, s) => sum + s.request_rate,
				0,
			);
			const avgLatency =
				Array.from(services.values()).reduce(
					(sum, s) => sum + s.response_time,
					0,
				) / totalServices;

			metrics.success_rate = (healthyServices / totalServices) * 100;
			metrics.avg_latency = avgLatency;
			metrics.p99_latency = Math.max(
				...Array.from(services.values()).map((s) => s.response_time),
			);
			metrics.active_connections = requestsRef.current.length;
			metrics.circuit_breakers_open = openCircuitBreakers;
			metrics.total_requests = totalRequests;
		};

		const getServiceStatusColor = (service: Microservice, scheme: any) => {
			if (service.status === "unhealthy") return scheme.unhealthy;
			if (service.status === "degraded") return scheme.degraded;
			if (service.status === "starting") return scheme.degraded;
			return scheme.healthy;
		};

		const drawService = (service: Microservice, fontSize: number) => {
			const x = service.x * fontSize;
			const y = service.y * fontSize;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Service icon based on status
			ctx.fillStyle = getServiceStatusColor(service, scheme);
			let icon = "●";
			if (service.circuit_breaker_state === "open") icon = "◐";
			else if (service.envoy_proxy) icon = "◆";
			else if (service.istio_enabled) icon = "◇";

			ctx.fillText(icon, x, y);

			// Service name
			ctx.fillStyle = scheme.text;
			const shortName =
				service.name.length > 15
					? service.name.substring(0, 15) + "..."
					: service.name;
			ctx.fillText(shortName, x + fontSize, y);

			// Version
			ctx.fillStyle = scheme.text + "80";
			ctx.fillText(service.version, x + fontSize * 16, y);

			// Circuit breaker state
			if (service.circuit_breaker_state !== "closed") {
				ctx.fillStyle =
					service.circuit_breaker_state === "open"
						? scheme.unhealthy
						: scheme.degraded;
				ctx.fillText(
					service.circuit_breaker_state.toUpperCase(),
					x - fontSize,
					y,
				);
			}

			// Proxy sidecar indicator
			if (service.envoy_proxy) {
				ctx.fillStyle = scheme.proxy;
				ctx.fillText("⊡", x - fontSize * 2, y);
			}

			// Metric display
			if (viewMode === "detailed" || service.name === selectedService) {
				let value = 0;
				let unit = "";
				let label = "";

				switch (displayMetric) {
					case "latency":
						value = service.response_time;
						unit = "ms";
						label = "LAT";
						break;
					case "requests":
						value = service.request_rate;
						unit = "/s";
						label = "RPS";
						break;
					case "errors":
						value = service.error_rate;
						unit = "%";
						label = "ERR";
						break;
					case "cpu":
						value = service.cpu_usage;
						unit = "%";
						label = "CPU";
						break;
				}

				const barWidth = 8;
				const maxValue =
					displayMetric === "latency"
						? 500
						: displayMetric === "requests"
							? 1000
							: 100;
				const percentage = value / maxValue;
				const filled = Math.floor(percentage * barWidth);

				ctx.fillStyle = scheme.text + "40";
				ctx.fillText("█".repeat(barWidth), x, y + fontSize);

				if (filled > 0) {
					let barColor = scheme.healthy;
					if (displayMetric === "errors") {
						barColor =
							percentage > 0.1
								? scheme.unhealthy
								: percentage > 0.05
									? scheme.degraded
									: scheme.healthy;
					} else {
						barColor =
							percentage > 0.8
								? scheme.unhealthy
								: percentage > 0.6
									? scheme.degraded
									: scheme.healthy;
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
			}

			// Namespace indicator
			ctx.fillStyle = scheme.text + "60";
			ctx.fillText(`[${service.namespace}]`, x, y + fontSize * 2);
		};

		const drawGateway = (gateway: ServiceMeshGateway, fontSize: number) => {
			const x = gateway.x * fontSize;
			const y = gateway.y * fontSize;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Gateway icon
			ctx.fillStyle = scheme.gateway;
			const icon =
				gateway.type === "ingress"
					? "🔽"
					: gateway.type === "egress"
						? "🔼"
						: "🔄";
			ctx.fillText(icon, x, y);

			// Gateway name
			ctx.fillStyle = scheme.text;
			ctx.fillText(gateway.name, x + fontSize, y);

			// SSL indicator
			if (gateway.ssl_enabled) {
				ctx.fillStyle = scheme.healthy;
				ctx.fillText("🔒", x + fontSize * 15, y);
			}

			// Request rate
			ctx.fillStyle = scheme.text;
			ctx.fillText(
				`${gateway.requests_per_second.toFixed(0)} req/s`,
				x,
				y + fontSize,
			);
		};

		const drawServiceRequests = (fontSize: number) => {
			if (!showTracing) return;

			const services = servicesRef.current;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			requestsRef.current.forEach((request) => {
				const fromService = services.get(request.from_service);
				const toService = services.get(request.to_service);
				if (!fromService || !toService) return;

				const x1 = fromService.x * fontSize;
				const y1 = fromService.y * fontSize;
				const x2 = toService.x * fontSize;
				const y2 = toService.y * fontSize;

				const x = lerp(x1, x2, request.progress);
				const y = lerp(y1, y2, request.progress);

				let requestColor = scheme.request;
				if (request.status_code >= 400) requestColor = scheme.unhealthy;
				else if (request.status_code >= 300) requestColor = scheme.degraded;

				// Show retry attempts
				if (request.retry_attempt > 0 && showRetries) {
					requestColor = scheme.degraded;
					ctx.fillStyle = scheme.text + "80";
					ctx.fillText(`R${request.retry_attempt}`, x + fontSize, y - fontSize);
				}

				ctx.fillStyle = requestColor;
				ctx.fillText("●", x, y);

				// Draw trace connection
				ctx.strokeStyle = requestColor + "30";
				ctx.lineWidth = 1;
				ctx.setLineDash([2, 3]);
				ctx.beginPath();
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
				ctx.stroke();
				ctx.setLineDash([]);

				// Show span information for detailed view
				if (viewMode === "detailed") {
					ctx.fillStyle = scheme.text + "60";
					ctx.fillText(`${request.method}`, x, y + fontSize);
					ctx.fillText(`${request.latency.toFixed(0)}ms`, x, y + fontSize * 2);
				}
			});
		};

		const drawServiceDependencies = (fontSize: number) => {
			const services = servicesRef.current;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			services.forEach((service) => {
				service.dependencies.forEach((depName) => {
					const targetService = Array.from(services.values()).find(
						(s) => s.name === depName,
					);
					if (!targetService) return;

					const x1 = service.x * fontSize;
					const y1 = service.y * fontSize;
					const x2 = targetService.x * fontSize;
					const y2 = targetService.y * fontSize;

					// Draw dependency line
					ctx.strokeStyle = scheme.mesh + "50";
					ctx.lineWidth = 1;
					ctx.setLineDash([5, 5]);
					ctx.beginPath();
					ctx.moveTo(x1, y1);
					ctx.lineTo(x2, y2);
					ctx.stroke();
					ctx.setLineDash([]);
				});
			});
		};

		const animate = () => {
			if (!isPlaying) return;

			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];
			const fontSize = 11;

			// Clear canvas
			ctx.fillStyle = scheme.bg;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			ctx.font = '11px "Courier New", monospace';
			ctx.textBaseline = "top";

			// Update metrics
			if (Math.random() < 0.1 * speed) {
				updateMeshMetrics();
			}

			// Draw service dependencies (background)
			if (viewMode === "topology") {
				drawServiceDependencies(fontSize);
			}

			// Draw gateways
			gatewaysRef.current.forEach((gateway) => {
				drawGateway(gateway, fontSize);
			});

			// Draw services
			servicesRef.current.forEach((service) => {
				if (viewMode === "service" && service.name !== selectedService) return;
				drawService(service, fontSize);
			});

			// Draw service requests
			drawServiceRequests(fontSize);

			// Draw mesh metrics
			const metrics = meshMetricsRef.current;
			const allServices = Array.from(servicesRef.current.values());
			const healthyServices = allServices.filter(
				(s) => s.status === "healthy",
			).length;
			const degradedServices = allServices.filter(
				(s) => s.status === "degraded",
			).length;
			const unhealthyServices = allServices.filter(
				(s) => s.status === "unhealthy",
			).length;

			ctx.fillStyle = scheme.text;
			ctx.fillText(
				`Service Mesh Dashboard - ${meshMode.toUpperCase()} - ${viewMode.toUpperCase()} VIEW`,
				10,
				canvas.height - 140,
			);
			ctx.fillText(
				`Services: ${healthyServices} Healthy | ${degradedServices} Degraded | ${unhealthyServices} Unhealthy | Total: ${allServices.length}`,
				10,
				canvas.height - 125,
			);
			ctx.fillText(
				`Success Rate: ${metrics.success_rate.toFixed(1)}% | Avg Latency: ${metrics.avg_latency.toFixed(0)}ms | P99: ${metrics.p99_latency.toFixed(0)}ms`,
				10,
				canvas.height - 110,
			);
			ctx.fillText(
				`Active Requests: ${metrics.active_connections} | Circuit Breakers Open: ${metrics.circuit_breakers_open}`,
				10,
				canvas.height - 95,
			);
			ctx.fillText(
				`Total RPS: ${metrics.total_requests.toFixed(0)} | mTLS: ${metrics.mtls_enabled ? "Enabled" : "Disabled"} | Traffic: ${trafficPattern}`,
				10,
				canvas.height - 80,
			);
			ctx.fillText(
				`Mesh: ${meshMode} | Display: ${displayMetric} | Fault Injection: ${faultInjection}`,
				10,
				canvas.height - 65,
			);

			if (viewMode === "service") {
				const service = Array.from(servicesRef.current.values()).find(
					(s) => s.name === selectedService,
				);
				if (service) {
					ctx.fillText(
						`Viewing: ${service.name} | Status: ${service.status} | Circuit Breaker: ${service.circuit_breaker_state}`,
						10,
						canvas.height - 50,
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
		selectedService,
		displayMetric,
		showTracing,
		showRetries,
		colorScheme,
		meshMode,
		trafficPattern,
		faultInjection,
	]);

	return (
		<div className="flex flex-col h-screen bg-black">
			<div className="flex-shrink-0 bg-gray-900 p-4 border-b border-gray-700">
				<h1 className="text-2xl font-bold text-purple-400 mb-4">
					🕸️ ASCII Service Mesh Monitor
				</h1>

				<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-sm mb-4">
					<div className="flex flex-col">
						<label className="text-purple-300 mb-2">Animation</label>
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
						<label className="text-purple-300 mb-2">
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
						<label className="text-purple-300 mb-2">View Mode</label>
						<select
							value={viewMode}
							onChange={(e) => setViewMode(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-purple-300 rounded border border-gray-600"
						>
							<option value="topology">Service Topology</option>
							<option value="service">Single Service</option>
							<option value="detailed">Detailed View</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-purple-300 mb-2">Selected Service</label>
						<select
							value={selectedService}
							onChange={(e) => setSelectedService(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-purple-300 rounded border border-gray-600"
						>
							<option value="user-service">User Service</option>
							<option value="auth-service">Auth Service</option>
							<option value="order-service">Order Service</option>
							<option value="payment-service">Payment Service</option>
							<option value="notification-service">Notification Service</option>
							<option value="api-gateway">API Gateway</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-purple-300 mb-2">Display Metric</label>
						<select
							value={displayMetric}
							onChange={(e) => setDisplayMetric(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-purple-300 rounded border border-gray-600"
						>
							<option value="latency">Response Time</option>
							<option value="requests">Request Rate</option>
							<option value="errors">Error Rate</option>
							<option value="cpu">CPU Usage</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-purple-300 mb-2">Mesh Type</label>
						<select
							value={meshMode}
							onChange={(e) => setMeshMode(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-purple-300 rounded border border-gray-600"
						>
							<option value="istio">Istio</option>
							<option value="linkerd">Linkerd</option>
							<option value="consul">Consul Connect</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-purple-300 mb-2">Color Scheme</label>
						<select
							value={colorScheme}
							onChange={(e) => setColorScheme(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-purple-300 rounded border border-gray-600"
						>
							<option value="istio">Istio Blue</option>
							<option value="linkerd">Linkerd Pink</option>
							<option value="consul">Consul Purple</option>
						</select>
					</div>

					<div className="flex flex-col gap-2">
						<label className="flex items-center text-purple-300 text-xs">
							<input
								type="checkbox"
								checked={showTracing}
								onChange={(e) => setShowTracing(e.target.checked)}
								className="mr-1"
							/>
							Distributed Tracing
						</label>
						<label className="flex items-center text-purple-300 text-xs">
							<input
								type="checkbox"
								checked={showRetries}
								onChange={(e) => setShowRetries(e.target.checked)}
								className="mr-1"
							/>
							Retry Attempts
						</label>
					</div>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
					<div className="flex flex-col">
						<label className="text-purple-300 mb-2">Traffic Pattern</label>
						<select
							value={trafficPattern}
							onChange={(e) => setTrafficPattern(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-purple-300 rounded border border-gray-600"
						>
							<option value="normal">Normal Traffic</option>
							<option value="spike">Traffic Spike</option>
							<option value="gradual-increase">Gradual Increase</option>
							<option value="random-bursts">Random Bursts</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-purple-300 mb-2">Fault Injection</label>
						<select
							value={faultInjection}
							onChange={(e) => setFaultInjection(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-purple-300 rounded border border-gray-600"
						>
							<option value="none">No Faults</option>
							<option value="latency">Inject Latency</option>
							<option value="errors">Inject Errors</option>
							<option value="circuit-breaker">Trigger Circuit Breaker</option>
						</select>
					</div>
				</div>

				<div className="mt-4 text-purple-400 text-sm">
					<p>
						🕸️ <strong>Service mesh monitoring</strong> with real-time
						microservice communication and observability!
					</p>
					<p>
						🔍 <strong>Distributed tracing</strong> with request flows, circuit
						breakers, and retry patterns!
					</p>
					<p>
						⚡ <strong>Fault injection testing</strong> with latency, error
						rate, and circuit breaker simulation!
					</p>
					<p>
						Monitor Istio/Linkerd/Consul service mesh with ingress/egress
						gateways, mTLS, and traffic management
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
