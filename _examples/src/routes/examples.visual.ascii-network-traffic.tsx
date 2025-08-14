import { createFileRoute } from "@tanstack/react-router";
import { clamp, lerp } from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/visual/ascii-network-traffic")({
	component: ASCIINetworkTrafficExample,
});

interface NetworkNode {
	id: string;
	name: string;
	type:
		| "router"
		| "switch"
		| "server"
		| "client"
		| "firewall"
		| "load_balancer";
	ip: string;
	mac: string;
	bandwidth: number;
	utilization: number;
	packets_sent: number;
	packets_received: number;
	bytes_sent: number;
	bytes_received: number;
	connections: string[];
	x: number;
	y: number;
	status: "online" | "offline" | "congested" | "error";
	security_level: "low" | "medium" | "high" | "critical";
	latency: number;
	packet_loss: number;
	uptime: number;
}

interface NetworkPacket {
	id: string;
	source: string;
	destination: string;
	protocol: "TCP" | "UDP" | "ICMP" | "HTTP" | "HTTPS" | "SSH" | "DNS" | "DHCP";
	size: number;
	priority: "low" | "normal" | "high" | "critical";
	progress: number;
	hop_count: number;
	ttl: number;
	port_src: number;
	port_dst: number;
	security_flag: boolean;
	encrypted: boolean;
}

interface NetworkInterface {
	id: string;
	node_id: string;
	name: string;
	type: "ethernet" | "wifi" | "fiber" | "cellular";
	speed: number;
	duplex: "half" | "full";
	status: "up" | "down" | "degraded";
	rx_bytes: number;
	tx_bytes: number;
	rx_packets: number;
	tx_packets: number;
	errors: number;
	drops: number;
}

interface SecurityEvent {
	id: string;
	timestamp: number;
	type: "intrusion" | "ddos" | "malware" | "unauthorized_access" | "port_scan";
	source_ip: string;
	target_ip: string;
	severity: "low" | "medium" | "high" | "critical";
	blocked: boolean;
	description: string;
}

function ASCIINetworkTrafficExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>(0);
	const nodesRef = useRef<Map<string, NetworkNode>>(new Map());
	const packetsRef = useRef<NetworkPacket[]>([]);
	const interfacesRef = useRef<Map<string, NetworkInterface>>(new Map());
	const securityEventsRef = useRef<SecurityEvent[]>([]);
	const [isPlaying, setIsPlaying] = useState(true);
	const [speed, setSpeed] = useState(1);
	const [displayMode, setDisplayMode] = useState("utilization");
	const [networkTopology, setNetworkTopology] = useState("enterprise");
	const [trafficPattern, setTrafficPattern] = useState("normal");
	const [colorScheme, setColorScheme] = useState("network");
	const [showPackets, setShowPackets] = useState(true);
	const [showSecurity, setShowSecurity] = useState(true);
	const [showInterfaces, setShowInterfaces] = useState(false);
	const [protocolFilter, setProtocolFilter] = useState("all");
	const [securityMode, setSecurityMode] = useState("normal");

	const colorSchemes = {
		network: {
			bg: "#000011",
			online: "#00FF00",
			busy: "#FFAA00",
			critical: "#FF0000",
			secure: "#00AAFF",
			text: "#FFFFFF",
			packet: "#FFFF00",
		},
		cisco: {
			bg: "#001122",
			online: "#00AA44",
			busy: "#FF8800",
			critical: "#FF0000",
			secure: "#0066CC",
			text: "#FFFFFF",
			packet: "#FFAA00",
		},
		security: {
			bg: "#110000",
			online: "#00AA00",
			busy: "#FFAA00",
			critical: "#FF0000",
			secure: "#AA00FF",
			text: "#FFFFFF",
			packet: "#FF4444",
		},
		datacenter: {
			bg: "#000022",
			online: "#00FFFF",
			busy: "#FFAA00",
			critical: "#FF0000",
			secure: "#00AA00",
			text: "#FFFFFF",
			packet: "#AAFFAA",
		},
		terminal: {
			bg: "#000000",
			online: "#00FF00",
			busy: "#FFAA00",
			critical: "#FF0000",
			secure: "#00AAFF",
			text: "#FFFFFF",
			packet: "#FFFF00",
		},
	};

	useEffect(() => {
		// Initialize network topology
		const nodes = new Map<string, NetworkNode>();
		const interfaces = new Map<string, NetworkInterface>();

		if (networkTopology === "enterprise") {
			// Enterprise network topology
			const nodeConfigs = [
				{
					name: "Core-Router",
					type: "router",
					x: 50,
					y: 10,
					bandwidth: 10000,
					connections: ["Dist-SW-1", "Dist-SW-2", "FW-External"],
				},
				{
					name: "Dist-SW-1",
					type: "switch",
					x: 25,
					y: 20,
					bandwidth: 1000,
					connections: ["Core-Router", "Access-SW-1", "Access-SW-2"],
				},
				{
					name: "Dist-SW-2",
					type: "switch",
					x: 75,
					y: 20,
					bandwidth: 1000,
					connections: ["Core-Router", "Access-SW-3", "Access-SW-4"],
				},
				{
					name: "FW-External",
					type: "firewall",
					x: 50,
					y: 2,
					bandwidth: 5000,
					connections: ["Core-Router", "LB-Web"],
				},
				{
					name: "LB-Web",
					type: "load_balancer",
					x: 50,
					y: 25,
					bandwidth: 2000,
					connections: ["FW-External", "Web-Srv-1", "Web-Srv-2"],
				},
				{
					name: "Access-SW-1",
					type: "switch",
					x: 10,
					y: 30,
					bandwidth: 100,
					connections: ["Dist-SW-1", "Client-1", "Client-2"],
				},
				{
					name: "Access-SW-2",
					type: "switch",
					x: 40,
					y: 30,
					bandwidth: 100,
					connections: ["Dist-SW-1", "Client-3", "Client-4"],
				},
				{
					name: "Access-SW-3",
					type: "switch",
					x: 60,
					y: 30,
					bandwidth: 100,
					connections: ["Dist-SW-2", "Web-Srv-1", "DB-Srv-1"],
				},
				{
					name: "Access-SW-4",
					type: "switch",
					x: 90,
					y: 30,
					bandwidth: 100,
					connections: ["Dist-SW-2", "Web-Srv-2", "DB-Srv-2"],
				},
				{
					name: "Web-Srv-1",
					type: "server",
					x: 55,
					y: 40,
					bandwidth: 1000,
					connections: ["LB-Web", "Access-SW-3", "DB-Srv-1"],
				},
				{
					name: "Web-Srv-2",
					type: "server",
					x: 65,
					y: 40,
					bandwidth: 1000,
					connections: ["LB-Web", "Access-SW-4", "DB-Srv-2"],
				},
				{
					name: "DB-Srv-1",
					type: "server",
					x: 45,
					y: 50,
					bandwidth: 1000,
					connections: ["Web-Srv-1", "Access-SW-3"],
				},
				{
					name: "DB-Srv-2",
					type: "server",
					x: 75,
					y: 50,
					bandwidth: 1000,
					connections: ["Web-Srv-2", "Access-SW-4"],
				},
				{
					name: "Client-1",
					type: "client",
					x: 5,
					y: 40,
					bandwidth: 100,
					connections: ["Access-SW-1"],
				},
				{
					name: "Client-2",
					type: "client",
					x: 15,
					y: 40,
					bandwidth: 100,
					connections: ["Access-SW-1"],
				},
				{
					name: "Client-3",
					type: "client",
					x: 35,
					y: 40,
					bandwidth: 100,
					connections: ["Access-SW-2"],
				},
				{
					name: "Client-4",
					type: "client",
					x: 45,
					y: 40,
					bandwidth: 100,
					connections: ["Access-SW-2"],
				},
			];

			nodeConfigs.forEach((config) => {
				const node: NetworkNode = {
					id: config.name,
					name: config.name,
					type: config.type as any,
					ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
					mac: Array.from({ length: 6 }, () =>
						Math.floor(Math.random() * 256)
							.toString(16)
							.padStart(2, "0"),
					).join(":"),
					bandwidth: config.bandwidth,
					utilization: Math.random() * 30,
					packets_sent: 0,
					packets_received: 0,
					bytes_sent: 0,
					bytes_received: 0,
					connections: config.connections,
					x: config.x,
					y: config.y,
					status: "online",
					security_level:
						config.type === "firewall"
							? "critical"
							: config.type === "server"
								? "high"
								: "medium",
					latency: 1 + Math.random() * 10,
					packet_loss: Math.random() * 0.1,
					uptime: Math.random() * 10000,
				};
				nodes.set(config.name, node);

				// Create network interfaces
				config.connections.forEach((connName, index) => {
					const interfaceId = `${config.name}-eth${index}`;
					interfaces.set(interfaceId, {
						id: interfaceId,
						node_id: config.name,
						name: `eth${index}`,
						type: config.type === "client" && index === 0 ? "wifi" : "ethernet",
						speed: config.bandwidth,
						duplex: "full",
						status: "up",
						rx_bytes: 0,
						tx_bytes: 0,
						rx_packets: 0,
						tx_packets: 0,
						errors: 0,
						drops: 0,
					});
				});
			});
		}

		nodesRef.current = nodes;
		interfacesRef.current = interfaces;
	}, [networkTopology]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const resizeCanvas = () => {
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
		};

		const updateNetworkMetrics = () => {
			const nodes = nodesRef.current;
			const packets = packetsRef.current;
			const interfaces = interfacesRef.current;
			const securityEvents = securityEventsRef.current;
			const time = Date.now() / 1000;

			nodes.forEach((node) => {
				// Apply traffic patterns
				let baseUtilization = node.utilization;

				if (trafficPattern === "ddos_attack") {
					if (node.type === "firewall" || node.type === "load_balancer") {
						baseUtilization = Math.min(
							95,
							70 + 25 * Math.sin(time * 3) + Math.random() * 20,
						);
					}
				} else if (trafficPattern === "high_traffic") {
					baseUtilization = Math.min(
						85,
						node.utilization + 30 + 20 * Math.sin(time * 0.8),
					);
				} else if (trafficPattern === "backup_window") {
					if (node.type === "server") {
						baseUtilization = Math.min(90, 50 + 30 * Math.sin(time * 0.5));
					}
				} else if (trafficPattern === "business_hours") {
					const hour = new Date().getHours();
					const businessMultiplier = hour >= 8 && hour <= 18 ? 1.5 : 0.3;
					baseUtilization =
						node.utilization * businessMultiplier + Math.random() * 15;
				} else {
					// Normal traffic with natural variance
					baseUtilization = node.utilization + (Math.random() - 0.5) * 10;
				}

				node.utilization = clamp(baseUtilization, 0, 100);

				// Update network metrics
				node.latency = clamp(
					node.latency + (Math.random() - 0.5) * 2,
					0.5,
					100,
				);
				node.packet_loss = clamp(
					node.packet_loss + (Math.random() - 0.5) * 0.02,
					0,
					5,
				);
				node.uptime += speed;

				// Determine status
				if (node.packet_loss > 2 || node.latency > 50) {
					node.status = "error";
				} else if (node.utilization > 80 || node.latency > 20) {
					node.status = "congested";
				} else {
					node.status = "online";
				}

				// Generate packets based on utilization and connections
				if (
					Math.random() < (node.utilization / 100) * 0.3 * speed &&
					node.connections.length > 0
				) {
					const targetId =
						node.connections[
							Math.floor(Math.random() * node.connections.length)
						];
					const target = nodes.get(targetId);

					if (target && showPackets) {
						const protocols = [
							"TCP",
							"UDP",
							"HTTP",
							"HTTPS",
							"SSH",
							"DNS",
							"ICMP",
						];
						let protocol = protocols[
							Math.floor(Math.random() * protocols.length)
						] as any;

						// Adjust protocol based on node types
						if (node.type === "client" && target.type === "server") {
							protocol = Math.random() < 0.6 ? "HTTP" : "HTTPS";
						} else if (node.type === "server" && target.type === "server") {
							protocol = Math.random() < 0.5 ? "TCP" : "SSH";
						}

						// Filter packets if protocol filter is active
						if (protocolFilter === "all" || protocol === protocolFilter) {
							const packet: NetworkPacket = {
								id: `packet-${Date.now()}-${Math.random()}`,
								source: node.id,
								destination: targetId,
								protocol: protocol,
								size: 64 + Math.floor(Math.random() * 1472), // 64-1536 bytes
								priority: Math.random() < 0.1 ? "high" : "normal",
								progress: 0,
								hop_count: 0,
								ttl: 64,
								port_src: 1024 + Math.floor(Math.random() * 64511),
								port_dst:
									protocol === "HTTP"
										? 80
										: protocol === "HTTPS"
											? 443
											: protocol === "SSH"
												? 22
												: Math.floor(Math.random() * 65535),
								security_flag: false,
								encrypted: protocol === "HTTPS" || protocol === "SSH",
							};

							packets.push(packet);
							node.packets_sent++;
							node.bytes_sent += packet.size;
						}
					}
				}
			});

			// Update packet movement
			packetsRef.current = packets.filter((packet) => {
				packet.progress += (0.05 + Math.random() * 0.05) * speed;

				if (packet.progress >= 1) {
					const destination = nodes.get(packet.destination);
					if (destination) {
						destination.packets_received++;
						destination.bytes_received += packet.size;
					}
					return false;
				}

				packet.hop_count++;
				packet.ttl--;

				return packet.ttl > 0;
			});

			// Generate security events
			if (showSecurity && Math.random() < 0.05 * speed) {
				const eventTypes = [
					"intrusion",
					"ddos",
					"port_scan",
					"unauthorized_access",
					"malware",
				];
				const allNodes = Array.from(nodes.values());
				const sourceNode =
					allNodes[Math.floor(Math.random() * allNodes.length)];
				const targetNode =
					allNodes[Math.floor(Math.random() * allNodes.length)];

				if (sourceNode.id !== targetNode.id) {
					const eventType = eventTypes[
						Math.floor(Math.random() * eventTypes.length)
					] as any;
					let severity: "low" | "medium" | "high" | "critical" = "medium";

					if (securityMode === "under_attack") {
						severity = Math.random() < 0.7 ? "high" : "critical";
					} else if (securityMode === "high_security") {
						severity = Math.random() < 0.4 ? "low" : "medium";
					}

					const event: SecurityEvent = {
						id: `event-${Date.now()}`,
						timestamp: Date.now(),
						type: eventType,
						source_ip: sourceNode.ip,
						target_ip: targetNode.ip,
						severity: severity,
						blocked: targetNode.type === "firewall" || Math.random() < 0.7,
						description: `${eventType} detected from ${sourceNode.ip} to ${targetNode.ip}`,
					};

					securityEvents.push(event);
				}
			}

			// Clean up old security events (keep last 10)
			securityEventsRef.current = securityEvents.slice(-10);

			// Update interface statistics
			interfaces.forEach((iface) => {
				const node = nodes.get(iface.node_id);
				if (node) {
					iface.rx_packets = node.packets_received;
					iface.tx_packets = node.packets_sent;
					iface.rx_bytes = node.bytes_received;
					iface.tx_bytes = node.bytes_sent;

					// Simulate occasional errors and drops
					if (Math.random() < 0.01) {
						iface.errors++;
					}
					if (node.utilization > 90 && Math.random() < 0.05) {
						iface.drops++;
					}

					iface.status =
						node.status === "error"
							? "down"
							: node.status === "congested"
								? "degraded"
								: "up";
				}
			});
		};

		const getNodeIcon = (type: string) => {
			switch (type) {
				case "router":
					return "◆";
				case "switch":
					return "◇";
				case "server":
					return "▮";
				case "client":
					return "○";
				case "firewall":
					return "▲";
				case "load_balancer":
					return "⬟";
				default:
					return "●";
			}
		};

		const getStatusColor = (status: string, scheme: any) => {
			switch (status) {
				case "online":
					return scheme.online;
				case "congested":
					return scheme.busy;
				case "error":
					return scheme.critical;
				case "offline":
					return scheme.text + "40";
				default:
					return scheme.text;
			}
		};

		const drawNode = (node: NetworkNode, fontSize: number) => {
			const x = node.x * fontSize;
			const y = node.y * fontSize;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Node icon
			ctx.fillStyle = getStatusColor(node.status, scheme);
			ctx.fillText(getNodeIcon(node.type), x, y);

			// Node name
			ctx.fillStyle = scheme.text;
			ctx.fillText(node.name, x + fontSize, y);

			// Security level indicator
			if (node.security_level === "critical") {
				ctx.fillStyle = scheme.secure;
				ctx.fillText("🔒", x - fontSize, y);
			}

			// Metric display
			let value = 0;
			let unit = "%";
			let label = "";

			switch (displayMode) {
				case "utilization":
					value = node.utilization;
					label = "CPU";
					break;
				case "latency":
					value = node.latency;
					unit = "ms";
					label = "LAT";
					break;
				case "packet_loss":
					value = node.packet_loss;
					unit = "%";
					label = "LOSS";
					break;
				case "bandwidth":
					value = (node.bytes_sent + node.bytes_received) / 1024 / 1024;
					unit = "MB";
					label = "BW";
					break;
			}

			// Metric bar
			const barWidth = 8;
			const maxValue =
				displayMode === "latency"
					? 50
					: displayMode === "bandwidth"
						? 100
						: 100;
			const percentage = Math.min(value / maxValue, 1);
			const filled = Math.floor(percentage * barWidth);

			ctx.fillStyle = scheme.text + "40";
			ctx.fillText("█".repeat(barWidth), x, y + fontSize);

			if (filled > 0) {
				let barColor = scheme.online;
				if (displayMode === "packet_loss") {
					barColor =
						value > 1
							? scheme.critical
							: value > 0.5
								? scheme.busy
								: scheme.online;
				} else {
					barColor =
						percentage > 0.8
							? scheme.critical
							: percentage > 0.6
								? scheme.busy
								: scheme.online;
				}

				ctx.fillStyle = barColor;
				ctx.fillText("█".repeat(filled), x, y + fontSize);
			}

			ctx.fillStyle = scheme.text;
			ctx.fillText(
				`${label}: ${value.toFixed(displayMode === "bandwidth" ? 1 : 0)}${unit}`,
				x + (barWidth + 1) * fontSize,
				y + fontSize,
			);

			// Connection info
			ctx.fillStyle = scheme.text + "80";
			ctx.fillText(
				`${node.packets_sent}↑ ${node.packets_received}↓`,
				x,
				y + fontSize * 2,
			);
			ctx.fillText(node.ip, x, y + fontSize * 2.5);
		};

		const drawConnections = (fontSize: number) => {
			const nodes = nodesRef.current;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			nodes.forEach((node) => {
				node.connections.forEach((targetId) => {
					const target = nodes.get(targetId);
					if (!target) return;

					const x1 = node.x * fontSize;
					const y1 = node.y * fontSize;
					const x2 = target.x * fontSize;
					const y2 = target.y * fontSize;

					// Connection line
					ctx.strokeStyle = scheme.text + "60";
					ctx.lineWidth = 1;
					ctx.setLineDash([2, 2]);
					ctx.beginPath();
					ctx.moveTo(x1, y1);
					ctx.lineTo(x2, y2);
					ctx.stroke();
					ctx.setLineDash([]);
				});
			});
		};

		const drawPackets = (fontSize: number) => {
			if (!showPackets) return;

			const nodes = nodesRef.current;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			packetsRef.current.forEach((packet) => {
				const sourceNode = nodes.get(packet.source);
				const destNode = nodes.get(packet.destination);
				if (!sourceNode || !destNode) return;

				const x1 = sourceNode.x * fontSize;
				const y1 = sourceNode.y * fontSize;
				const x2 = destNode.x * fontSize;
				const y2 = destNode.y * fontSize;

				const x = lerp(x1, x2, packet.progress);
				const y = lerp(y1, y2, packet.progress);

				let packetColor = scheme.packet;
				if (packet.priority === "high") packetColor = scheme.critical;
				else if (packet.encrypted) packetColor = scheme.secure;
				else if (packet.security_flag) packetColor = scheme.critical;

				ctx.fillStyle = packetColor;

				// Different packet symbols based on protocol
				let symbol = "●";
				if (packet.protocol === "TCP") symbol = "▪";
				else if (packet.protocol === "UDP") symbol = "▫";
				else if (packet.protocol === "HTTP") symbol = "H";
				else if (packet.protocol === "HTTPS") symbol = "S";
				else if (packet.protocol === "SSH") symbol = "K";
				else if (packet.protocol === "DNS") symbol = "D";

				ctx.fillText(symbol, x, y);
			});
		};

		const drawSecurityEvents = (fontSize: number) => {
			if (!showSecurity) return;

			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];
			const events = securityEventsRef.current;

			events.forEach((event, index) => {
				const x = 10 * fontSize;
				const y = (canvas.height / fontSize - 15 + index) * fontSize;

				let eventColor = scheme.text;
				if (event.severity === "critical") eventColor = scheme.critical;
				else if (event.severity === "high") eventColor = scheme.busy;
				else if (event.severity === "medium") eventColor = scheme.packet;

				ctx.fillStyle = eventColor;
				const statusIcon = event.blocked ? "🛡️" : "⚠️";
				const typeIcon =
					event.type === "ddos"
						? "💥"
						: event.type === "intrusion"
							? "🔓"
							: event.type === "malware"
								? "🦠"
								: "👀";

				ctx.fillText(
					`${statusIcon} ${typeIcon} ${event.type.toUpperCase()}`,
					x,
					y,
				);
				ctx.fillText(
					`${event.source_ip} → ${event.target_ip}`,
					x + fontSize * 15,
					y,
				);
			});
		};

		const drawInterfaces = (fontSize: number) => {
			if (!showInterfaces) return;

			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];
			const interfaces = Array.from(interfacesRef.current.values());

			interfaces.slice(0, 10).forEach((iface, index) => {
				const x = 60 * fontSize;
				const y = (5 + index * 2) * fontSize;

				ctx.fillStyle = scheme.text;
				ctx.fillText(`${iface.node_id}-${iface.name}`, x, y);

				const statusColor =
					iface.status === "up"
						? scheme.online
						: iface.status === "degraded"
							? scheme.busy
							: scheme.critical;
				ctx.fillStyle = statusColor;
				ctx.fillText(iface.status.toUpperCase(), x + fontSize * 15, y);

				ctx.fillStyle = scheme.text;
				ctx.fillText(
					`${iface.speed}Mbps ${iface.duplex}`,
					x + fontSize * 20,
					y,
				);

				if (iface.errors > 0 || iface.drops > 0) {
					ctx.fillStyle = scheme.critical;
					ctx.fillText(`E:${iface.errors} D:${iface.drops}`, x, y + fontSize);
				}
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
				updateNetworkMetrics();
			}

			// Draw network topology
			drawConnections(fontSize);

			// Draw nodes
			nodesRef.current.forEach((node) => {
				drawNode(node, fontSize);
			});

			// Draw packets
			drawPackets(fontSize);

			// Draw security events
			drawSecurityEvents(fontSize);

			// Draw interface details
			drawInterfaces(fontSize);

			// Draw statistics
			const nodes = Array.from(nodesRef.current.values());
			const onlineNodes = nodes.filter((n) => n.status === "online").length;
			const congestedNodes = nodes.filter(
				(n) => n.status === "congested",
			).length;
			const errorNodes = nodes.filter((n) => n.status === "error").length;
			const totalPackets = packetsRef.current.length;
			const securityEvents = securityEventsRef.current.length;
			const avgUtilization =
				nodes.reduce((sum, n) => sum + n.utilization, 0) / nodes.length;
			const avgLatency =
				nodes.reduce((sum, n) => sum + n.latency, 0) / nodes.length;

			ctx.fillStyle = scheme.text;
			ctx.fillText(
				`Network Traffic Monitor - ${networkTopology.toUpperCase()} | Pattern: ${trafficPattern}`,
				10,
				canvas.height - 140,
			);
			ctx.fillText(
				`Nodes: ${onlineNodes} online | ${congestedNodes} congested | ${errorNodes} error | Total: ${nodes.length}`,
				10,
				canvas.height - 125,
			);
			ctx.fillText(
				`Packets: ${totalPackets} active | Security Events: ${securityEvents} | Filter: ${protocolFilter}`,
				10,
				canvas.height - 110,
			);
			ctx.fillText(
				`Average: ${avgUtilization.toFixed(1)}% utilization | ${avgLatency.toFixed(1)}ms latency`,
				10,
				canvas.height - 95,
			);
			ctx.fillText(
				`Display: ${displayMode} | Security Mode: ${securityMode}`,
				10,
				canvas.height - 80,
			);

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
		networkTopology,
		trafficPattern,
		colorScheme,
		showPackets,
		showSecurity,
		showInterfaces,
		protocolFilter,
		securityMode,
	]);

	return (
		<div className="flex flex-col h-screen bg-black">
			<div className="flex-shrink-0 bg-gray-900 p-4 border-b border-gray-700">
				<h1 className="text-2xl font-bold text-green-400 mb-4">
					🌐 ASCII Network Traffic Monitor
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
						<label className="text-green-300 mb-2">Topology</label>
						<select
							value={networkTopology}
							onChange={(e) => setNetworkTopology(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-green-300 rounded border border-gray-600"
						>
							<option value="enterprise">Enterprise</option>
							<option value="datacenter">Datacenter</option>
							<option value="campus">Campus</option>
							<option value="cloud">Cloud Native</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Display Metric</label>
						<select
							value={displayMode}
							onChange={(e) => setDisplayMode(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-green-300 rounded border border-gray-600"
						>
							<option value="utilization">Utilization</option>
							<option value="latency">Latency</option>
							<option value="packet_loss">Packet Loss</option>
							<option value="bandwidth">Bandwidth</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Traffic Pattern</label>
						<select
							value={trafficPattern}
							onChange={(e) => setTrafficPattern(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-green-300 rounded border border-gray-600"
						>
							<option value="normal">Normal</option>
							<option value="high_traffic">High Traffic</option>
							<option value="ddos_attack">DDoS Attack</option>
							<option value="backup_window">Backup Window</option>
							<option value="business_hours">Business Hours</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Protocol Filter</label>
						<select
							value={protocolFilter}
							onChange={(e) => setProtocolFilter(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-green-300 rounded border border-gray-600"
						>
							<option value="all">All Protocols</option>
							<option value="TCP">TCP</option>
							<option value="UDP">UDP</option>
							<option value="HTTP">HTTP</option>
							<option value="HTTPS">HTTPS</option>
							<option value="SSH">SSH</option>
							<option value="DNS">DNS</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Color Scheme</label>
						<select
							value={colorScheme}
							onChange={(e) => setColorScheme(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-green-300 rounded border border-gray-600"
						>
							<option value="network">Network Green</option>
							<option value="cisco">Cisco Blue</option>
							<option value="security">Security Red</option>
							<option value="datacenter">Datacenter Cyan</option>
							<option value="terminal">Terminal</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Security Mode</label>
						<select
							value={securityMode}
							onChange={(e) => setSecurityMode(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-green-300 rounded border border-gray-600"
						>
							<option value="normal">Normal</option>
							<option value="high_security">High Security</option>
							<option value="under_attack">Under Attack</option>
						</select>
					</div>
				</div>

				<div className="grid grid-cols-3 gap-4 text-sm mb-4">
					<label className="flex items-center text-green-300">
						<input
							type="checkbox"
							checked={showPackets}
							onChange={(e) => setShowPackets(e.target.checked)}
							className="mr-2"
						/>
						Show Packet Flow
					</label>
					<label className="flex items-center text-green-300">
						<input
							type="checkbox"
							checked={showSecurity}
							onChange={(e) => setShowSecurity(e.target.checked)}
							className="mr-2"
						/>
						Show Security Events
					</label>
					<label className="flex items-center text-green-300">
						<input
							type="checkbox"
							checked={showInterfaces}
							onChange={(e) => setShowInterfaces(e.target.checked)}
							className="mr-2"
						/>
						Show Interface Details
					</label>
				</div>

				<div className="mt-4 text-green-400 text-sm">
					<p>
						🌐 <strong>Real-time network traffic monitoring</strong> with packet
						flow visualization and security events!
					</p>
					<p>
						🔒 <strong>Security analysis</strong> - DDoS detection, intrusion
						monitoring, and firewall activity!
					</p>
					<p>
						📊 <strong>Multiple network topologies</strong> with protocol
						filtering and latency/bandwidth monitoring!
					</p>
					<p>
						Monitor routers, switches, servers, clients with real-time packet
						flow and network interface statistics
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
