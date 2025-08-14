import { createFileRoute } from "@tanstack/react-router";
import { clamp, lerp } from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute(
	"/examples/visual/ascii-distributed-database",
)({
	component: ASCIIDistributedDatabaseExample,
});

interface DatabaseNode {
	id: string;
	name: string;
	type: "primary" | "replica" | "shard" | "coordinator" | "cache";
	region: string;
	status: "healthy" | "syncing" | "lagging" | "offline" | "split-brain";
	connections: number;
	queries_per_sec: number;
	replication_lag: number;
	storage_used: number;
	storage_total: number;
	cpu_usage: number;
	memory_usage: number;
	x: number;
	y: number;
	data_shards: string[];
	is_leader: boolean;
	last_heartbeat: number;
	consistency_level: "strong" | "eventual" | "weak";
	partition_key: string;
	backup_status: "current" | "stale" | "failed";
}

interface DataTransaction {
	id: string;
	type: "read" | "write" | "replication" | "backup" | "migration";
	from_node: string;
	to_node: string;
	progress: number;
	size: number;
	consistency: "strong" | "eventual";
	timestamp: number;
	success_rate: number;
}

interface ConsistencyCheck {
	id: string;
	nodes: string[];
	status: "checking" | "consistent" | "inconsistent" | "resolving";
	conflicts: number;
	resolution_time: number;
}

function ASCIIDistributedDatabaseExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>(0);
	const databaseNodesRef = useRef<Map<string, DatabaseNode>>(new Map());
	const transactionsRef = useRef<DataTransaction[]>([]);
	const consistencyChecksRef = useRef<ConsistencyCheck[]>([]);
	const [isPlaying, setIsPlaying] = useState(true);
	const [speed, setSpeed] = useState(1);
	const [displayMode, setDisplayMode] = useState("performance");
	const [viewMode, setViewMode] = useState("cluster");
	const [selectedRegion, setSelectedRegion] = useState("us-east");
	const [consistencyMode, setConsistencyMode] = useState("eventual");
	const [simulationMode, setSimulationMode] = useState("normal");
	const [colorScheme, setColorScheme] = useState("database");
	const [showTransactions, setShowTransactions] = useState(true);
	const [showReplication, setShowReplication] = useState(true);
	const [partitionTolerance, setPartitionTolerance] = useState(0.8);

	const colorSchemes = {
		database: {
			bg: "#001122",
			primary: "#00AA44",
			replica: "#0088AA",
			shard: "#AA8800",
			coordinator: "#AA44AA",
			offline: "#AA0000",
			text: "#FFFFFF",
			transaction: "#00AAFF",
		},
		mongodb: {
			bg: "#001100",
			primary: "#00AA00",
			replica: "#006600",
			shard: "#888800",
			coordinator: "#AA4400",
			offline: "#AA0000",
			text: "#FFFFFF",
			transaction: "#44AA44",
		},
		cassandra: {
			bg: "#110022",
			primary: "#8844AA",
			replica: "#6622AA",
			shard: "#AA4488",
			coordinator: "#AA8844",
			offline: "#AA0000",
			text: "#FFFFFF",
			transaction: "#AA44AA",
		},
		postgresql: {
			bg: "#002244",
			primary: "#4488CC",
			replica: "#2266AA",
			shard: "#6688AA",
			coordinator: "#88AACC",
			offline: "#AA0000",
			text: "#FFFFFF",
			transaction: "#44AACC",
		},
		redis: {
			bg: "#220000",
			primary: "#CC4444",
			replica: "#AA2222",
			shard: "#884444",
			coordinator: "#AA6644",
			offline: "#440000",
			text: "#FFFFFF",
			transaction: "#CC6644",
		},
	};

	useEffect(() => {
		// Initialize distributed database cluster
		const databaseNodes = new Map<string, DatabaseNode>();

		const regions = ["us-east", "us-west", "eu-west", "asia-pacific"];
		const nodeTypes = ["primary", "replica", "shard", "coordinator", "cache"];

		let nodeCount = 0;
		regions.forEach((region, regionIndex) => {
			const regionX = 5 + regionIndex * 30; // More spacing between regions

			// Primary node (1 per region)
			const nodeId = `${region}-primary`;
			const node: DatabaseNode = {
				id: nodeId,
				name: `${region}-primary`,
				type: "primary",
				region: region,
				status: "healthy",
				connections: Math.floor(Math.random() * 100) + 20,
				queries_per_sec: Math.floor(Math.random() * 1000) + 100,
				replication_lag: Math.random() * 50,
				storage_used: Math.random() * 80 + 10,
				storage_total: 1000,
				cpu_usage: Math.random() * 60 + 10,
				memory_usage: Math.random() * 70 + 15,
				x: regionX,
				y: 3, // Higher up for better visibility
				data_shards: [`shard-${nodeCount}`],
				is_leader: regionIndex === 0,
				last_heartbeat: Date.now(),
				consistency_level: "strong",
				partition_key: `region:${region}`,
				backup_status: "current",
			};
			databaseNodes.set(nodeId, node);
			nodeCount++;

			// Replica nodes (2 per region)
			for (let i = 0; i < 2; i++) {
				const replicaId = `${region}-replica-${i + 1}`;
				const replica: DatabaseNode = {
					id: replicaId,
					name: `${region}-replica-${i + 1}`,
					type: "replica",
					region: region,
					status: "healthy",
					connections: Math.floor(Math.random() * 50) + 10,
					queries_per_sec: Math.floor(Math.random() * 500) + 50,
					replication_lag: Math.random() * 100 + 10,
					storage_used: Math.random() * 80 + 10,
					storage_total: 1000,
					cpu_usage: Math.random() * 40 + 5,
					memory_usage: Math.random() * 60 + 10,
					x: regionX,
					y: 8 + i * 4, // Better vertical spacing
					data_shards: [`shard-${nodeCount}`],
					is_leader: false,
					last_heartbeat: Date.now(),
					consistency_level: "eventual",
					partition_key: `region:${region}`,
					backup_status: "current",
				};
				databaseNodes.set(replicaId, replica);
				nodeCount++;
			}

			// Shard node (1 per region)
			const shardId = `${region}-shard`;
			const shard: DatabaseNode = {
				id: shardId,
				name: `${region}-shard`,
				type: "shard",
				region: region,
				status: "healthy",
				connections: Math.floor(Math.random() * 30) + 5,
				queries_per_sec: Math.floor(Math.random() * 300) + 20,
				replication_lag: Math.random() * 20,
				storage_used: Math.random() * 90 + 5,
				storage_total: 500,
				cpu_usage: Math.random() * 70 + 10,
				memory_usage: Math.random() * 80 + 10,
				x: regionX,
				y: 17, // Bottom of the region
				data_shards: [`shard-${nodeCount}`],
				is_leader: false,
				last_heartbeat: Date.now(),
				consistency_level: "eventual",
				partition_key: `shard:${regionIndex}`,
				backup_status: "current",
			};
			databaseNodes.set(shardId, shard);
		});

		databaseNodesRef.current = databaseNodes;
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

		const updateDatabaseMetrics = () => {
			const nodes = databaseNodesRef.current;
			const time = Date.now() / 1000;

			nodes.forEach((node) => {
				// Apply simulation effects
				let loadMultiplier = 1;

				if (simulationMode === "high-traffic") {
					loadMultiplier = 2;
					node.queries_per_sec = Math.min(5000, node.queries_per_sec * 1.5);
					node.cpu_usage = Math.min(95, node.cpu_usage * 1.3);
				} else if (simulationMode === "partition") {
					if (node.region === "asia-pacific") {
						node.status = "offline";
						node.replication_lag = 9999;
						node.last_heartbeat = Date.now() - 30000;
					}
				} else if (simulationMode === "split-brain") {
					if (node.type === "primary" && node.region !== "us-east") {
						node.status = "split-brain";
						node.is_leader = true; // Multiple leaders
					}
				} else if (simulationMode === "backup-failure") {
					if (Math.random() < 0.3) {
						node.backup_status = "failed";
					}
				}

				// Normal metric updates
				if (node.status !== "offline") {
					// Simulate realistic database load patterns
					const baseLoad =
						node.type === "primary"
							? 60
							: node.type === "coordinator"
								? 40
								: 30;
					const variance =
						15 * Math.sin(time * 0.5 + Math.random()) + Math.random() * 10;

					node.queries_per_sec =
						Math.max(0, baseLoad + variance) * loadMultiplier;
					node.cpu_usage = clamp(
						node.cpu_usage + (Math.random() - 0.5) * 5,
						5,
						95,
					);
					node.memory_usage = clamp(
						node.memory_usage + (Math.random() - 0.5) * 3,
						10,
						90,
					);
					node.connections = Math.max(
						0,
						node.connections + Math.floor((Math.random() - 0.5) * 5),
					);

					// Replication lag simulation
					if (node.type === "replica") {
						node.replication_lag = Math.max(
							0,
							node.replication_lag + (Math.random() - 0.7) * 10,
						);
						if (node.replication_lag > 1000) {
							node.status = "lagging";
						} else if (node.replication_lag > 100) {
							node.status = "syncing";
						} else {
							node.status = "healthy";
						}
					}

					// Storage usage gradual increase
					node.storage_used = Math.min(
						node.storage_total * 0.95,
						node.storage_used + Math.random() * 0.1,
					);

					// Heartbeat
					node.last_heartbeat = Date.now();
				}

				// Determine consistency level based on configuration
				if (consistencyMode === "strong") {
					if (node.type === "primary" || node.type === "coordinator") {
						node.consistency_level = "strong";
					}
				} else if (consistencyMode === "eventual") {
					node.consistency_level = "eventual";
				}
			});

			// Generate transactions
			if (Math.random() < 0.15 * speed && showTransactions) {
				const allNodes = Array.from(nodes.values()).filter(
					(n) => n.status !== "offline",
				);
				if (allNodes.length >= 2) {
					const fromNode =
						allNodes[Math.floor(Math.random() * allNodes.length)];
					let toNode = allNodes[Math.floor(Math.random() * allNodes.length)];

					// Ensure different nodes
					while (toNode.id === fromNode.id && allNodes.length > 1) {
						toNode = allNodes[Math.floor(Math.random() * allNodes.length)];
					}

					const transactionTypes = [
						"read",
						"write",
						"replication",
						"backup",
						"migration",
					];
					const type = transactionTypes[
						Math.floor(Math.random() * transactionTypes.length)
					] as any;

					transactionsRef.current.push({
						id: `tx-${fromNode.id}-${toNode.id}-${Date.now()}`,
						type: type,
						from_node: fromNode.id,
						to_node: toNode.id,
						progress: 0,
						size: Math.random() * 1000 + 100,
						consistency: Math.random() < 0.3 ? "strong" : "eventual",
						timestamp: Date.now(),
						success_rate: 0.95 + Math.random() * 0.05,
					});
				}
			}

			// Update transactions
			transactionsRef.current = transactionsRef.current.filter((tx) => {
				tx.progress += 0.02 * speed;

				// Simulate transaction failures
				if (Math.random() > tx.success_rate) {
					return false; // Transaction failed
				}

				return tx.progress < 1;
			});

			// Generate consistency checks
			if (Math.random() < 0.05 * speed) {
				const regionNodes = Array.from(nodes.values()).filter(
					(n) => n.region === selectedRegion && n.status === "healthy",
				);

				if (regionNodes.length >= 2) {
					const selectedNodes = regionNodes.slice(
						0,
						Math.min(3, regionNodes.length),
					);

					consistencyChecksRef.current.push({
						id: `check-${Date.now()}`,
						nodes: selectedNodes.map((n) => n.id),
						status: "checking",
						conflicts: Math.floor(Math.random() * 5),
						resolution_time: Math.random() * 2000 + 500,
					});
				}
			}

			// Update consistency checks
			consistencyChecksRef.current = consistencyChecksRef.current
				.map((check) => {
					if (check.status === "checking") {
						check.resolution_time -= 100 * speed;
						if (check.resolution_time <= 0) {
							check.status =
								check.conflicts > 0 ? "inconsistent" : "consistent";
							if (check.status === "inconsistent") {
								check.status = "resolving";
								check.resolution_time = 1000;
							}
						}
					} else if (check.status === "resolving") {
						check.resolution_time -= 100 * speed;
						if (check.resolution_time <= 0) {
							check.status = "consistent";
							check.conflicts = 0;
						}
					}
					return check;
				})
				.filter(
					(check) =>
						check.status !== "consistent" ||
						Date.now() - check.resolution_time < 2000,
				);
		};

		const getNodeStatusColor = (node: DatabaseNode, scheme: any) => {
			if (node.status === "offline") return scheme.offline;
			if (node.status === "split-brain") return scheme.offline;
			if (node.status === "lagging") return scheme.transaction;

			switch (node.type) {
				case "primary":
					return scheme.primary;
				case "replica":
					return scheme.replica;
				case "shard":
					return scheme.shard;
				case "coordinator":
					return scheme.coordinator;
				case "cache":
					return scheme.replica;
				default:
					return scheme.text;
			}
		};

		const drawDatabaseNode = (node: DatabaseNode, fontSize: number) => {
			const x = node.x * fontSize;
			const y = node.y * fontSize;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Large, clear node representation
			let icon = "██"; // Larger block
			let typeLabel = "";
			if (node.type === "primary") {
				icon = "██";
				typeLabel = "PRI";
			} else if (node.type === "replica") {
				icon = "▓▓";
				typeLabel = "REP";
			} else if (node.type === "shard") {
				icon = "▒▒";
				typeLabel = "SHD";
			} else if (node.type === "coordinator") {
				icon = "◉◉";
				typeLabel = "CRD";
			}

			ctx.fillStyle = getNodeStatusColor(node, scheme);
			ctx.fillText(icon, x, y);

			// Leader indicator (more prominent)
			if (node.is_leader) {
				ctx.fillStyle = "#FFD700"; // Gold color for leader
				ctx.fillText("★", x - fontSize * 2, y);
			}

			// Status indicators (more visible)
			if (node.status === "split-brain") {
				ctx.fillStyle = scheme.offline;
				ctx.fillText("⚠️", x + fontSize * 3, y);
			} else if (node.status === "lagging") {
				ctx.fillStyle = scheme.transaction;
				ctx.fillText("⏳", x + fontSize * 3, y);
			} else if (node.backup_status === "failed") {
				ctx.fillStyle = scheme.offline;
				ctx.fillText("❌", x + fontSize * 3, y);
			}

			// Node name (shorter, clearer)
			ctx.fillStyle = scheme.text;
			const shortName =
				node.region.split("-")[0].toUpperCase() + "-" + typeLabel;
			ctx.fillText(shortName, x, y + fontSize * 1.5);

			// Region label
			ctx.fillStyle = scheme.text + "CC";
			ctx.fillText(node.region, x, y - fontSize * 0.5);

			// Metric display
			let value = 0;
			let unit = "";
			let label = "";

			switch (displayMode) {
				case "performance":
					value = node.queries_per_sec;
					unit = " QPS";
					label = "QPS";
					break;
				case "storage":
					value = (node.storage_used / node.storage_total) * 100;
					unit = "%";
					label = "STORAGE";
					break;
				case "replication":
					value = node.replication_lag;
					unit = "ms";
					label = "LAG";
					break;
				case "cpu":
					value = node.cpu_usage;
					unit = "%";
					label = "CPU";
					break;
				case "memory":
					value = node.memory_usage;
					unit = "%";
					label = "MEM";
					break;
				case "connections":
					value = node.connections;
					unit = "";
					label = "CONN";
					break;
			}

			// Metric bar (simpler and larger)
			const barWidth = 6;
			const maxValue =
				displayMode === "performance"
					? 2000
					: displayMode === "replication"
						? 500
						: displayMode === "connections"
							? 200
							: 100;
			const percentage = Math.min(1, value / maxValue);
			const filled = Math.floor(percentage * barWidth);

			// Background bar
			ctx.fillStyle = scheme.text + "40";
			ctx.fillText("░".repeat(barWidth), x, y + fontSize * 2.5);

			// Filled portion
			if (filled > 0) {
				let barColor = scheme.primary;
				if (displayMode === "replication" && value > 100) {
					barColor = scheme.offline;
				} else if (percentage > 0.8) {
					barColor = scheme.transaction;
				}

				ctx.fillStyle = barColor;
				ctx.fillText("█".repeat(filled), x, y + fontSize * 2.5);
			}

			// Value text (larger and clearer)
			ctx.fillStyle = scheme.text;
			ctx.fillText(`${value.toFixed(0)}${unit}`, x, y + fontSize * 3.5);
		};

		const drawTransactions = (fontSize: number) => {
			if (!showTransactions) return;

			const nodes = databaseNodesRef.current;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			transactionsRef.current.forEach((tx) => {
				const fromNode = nodes.get(tx.from_node);
				const toNode = nodes.get(tx.to_node);
				if (!fromNode || !toNode) return;

				const x1 = fromNode.x * fontSize;
				const y1 = fromNode.y * fontSize;
				const x2 = toNode.x * fontSize;
				const y2 = toNode.y * fontSize;

				const x = lerp(x1, x2, tx.progress);
				const y = lerp(y1, y2, tx.progress);

				let txColor = scheme.transaction;
				if (tx.type === "write") txColor = scheme.primary;
				else if (tx.type === "replication") txColor = scheme.replica;
				else if (tx.type === "backup") txColor = scheme.shard;

				ctx.fillStyle = txColor;
				ctx.fillText("●", x, y);

				// Draw connection line for replication
				if (showReplication && tx.type === "replication") {
					ctx.strokeStyle = txColor + "40";
					ctx.lineWidth = 1;
					ctx.setLineDash([2, 3]);
					ctx.beginPath();
					ctx.moveTo(x1, y1);
					ctx.lineTo(x2, y2);
					ctx.stroke();
					ctx.setLineDash([]);
				}
			});
		};

		const drawRegionBoundary = (region: string, fontSize: number) => {
			const regionNodes = Array.from(databaseNodesRef.current.values()).filter(
				(n) => n.region === region,
			);
			if (regionNodes.length === 0) return;

			const minX = Math.min(...regionNodes.map((n) => n.x));
			const maxX = Math.max(...regionNodes.map((n) => n.x));
			const minY = Math.min(...regionNodes.map((n) => n.y));
			const maxY = Math.max(...regionNodes.map((n) => n.y));

			const x = (minX - 2) * fontSize;
			const y = (minY - 2) * fontSize;
			const width = (maxX - minX + 8) * fontSize;
			const height = (maxY - minY + 8) * fontSize;

			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Thicker region outline
			ctx.strokeStyle = scheme.text + "AA"; // More opaque
			ctx.lineWidth = 2;
			ctx.strokeRect(x, y, width, height);

			// Large region label
			ctx.fillStyle = scheme.text;
			ctx.font = 'bold 14px "Courier New", monospace';
			ctx.fillText(region.toUpperCase(), x + 4, y - 4);
			ctx.font = '14px "Courier New", monospace'; // Reset font

			// Simplified region statistics
			const healthyNodes = regionNodes.filter(
				(n) => n.status === "healthy",
			).length;
			const totalNodes = regionNodes.length;
			const avgQPS =
				regionNodes.reduce((sum, n) => sum + n.queries_per_sec, 0) / totalNodes;

			ctx.fillStyle =
				healthyNodes === totalNodes ? scheme.primary : scheme.transaction;
			ctx.fillText(`${healthyNodes}/${totalNodes} UP`, x + 4, y + height - 20);
			ctx.fillStyle = scheme.text;
			ctx.fillText(`${avgQPS.toFixed(0)} QPS`, x + 4, y + height - 5);
		};

		const animate = () => {
			if (!isPlaying) return;

			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];
			const fontSize = 14; // Larger font for better visibility

			// Clear canvas
			ctx.fillStyle = scheme.bg;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			ctx.font = '14px "Courier New", monospace'; // Larger font
			ctx.textBaseline = "top";

			// Update metrics
			if (Math.random() < 0.1 * speed) {
				updateDatabaseMetrics();
			}

			// Draw based on view mode
			if (viewMode === "cluster") {
				// Draw all regions
				["us-east", "us-west", "eu-west", "asia-pacific"].forEach((region) => {
					drawRegionBoundary(region, fontSize);
				});

				// Draw all nodes
				databaseNodesRef.current.forEach((node) => {
					drawDatabaseNode(node, fontSize);
				});
			} else if (viewMode === "region") {
				// Draw selected region only
				drawRegionBoundary(selectedRegion, fontSize);

				const regionNodes = Array.from(
					databaseNodesRef.current.values(),
				).filter((n) => n.region === selectedRegion);
				regionNodes.forEach((node) => {
					drawDatabaseNode(node, fontSize);
				});
			}

			drawTransactions(fontSize);

			// Draw consistency checks
			consistencyChecksRef.current.forEach((check) => {
				const checkNodes = check.nodes
					.map((id) => databaseNodesRef.current.get(id))
					.filter(Boolean) as DatabaseNode[];
				if (checkNodes.length === 0) return;

				const centerX =
					(checkNodes.reduce((sum, n) => sum + n.x, 0) / checkNodes.length) *
					fontSize;
				const centerY =
					(checkNodes.reduce((sum, n) => sum + n.y, 0) / checkNodes.length) *
					fontSize;

				let checkColor = scheme.primary;
				if (check.status === "inconsistent") checkColor = scheme.offline;
				else if (check.status === "resolving") checkColor = scheme.transaction;

				ctx.fillStyle = checkColor;
				ctx.fillText("⚖", centerX, centerY);
			});

			// Draw statistics
			const allNodes = Array.from(databaseNodesRef.current.values());
			const healthyNodes = allNodes.filter(
				(n) => n.status === "healthy",
			).length;
			const offlineNodes = allNodes.filter(
				(n) => n.status === "offline",
			).length;
			const totalQPS = allNodes.reduce((sum, n) => sum + n.queries_per_sec, 0);
			const avgReplicationLag =
				allNodes
					.filter((n) => n.type === "replica")
					.reduce((sum, n) => sum + n.replication_lag, 0) /
				Math.max(1, allNodes.filter((n) => n.type === "replica").length);
			const activeTransactions = transactionsRef.current.length;
			const consistencyIssues = consistencyChecksRef.current.filter(
				(c) => c.status === "inconsistent",
			).length;

			ctx.fillStyle = scheme.text;
			ctx.fillText(
				`Distributed Database Cluster - ${viewMode.toUpperCase()} VIEW`,
				10,
				canvas.height - 120,
			);
			ctx.fillText(
				`Nodes: ${healthyNodes} healthy | ${offlineNodes} offline | Total: ${allNodes.length}`,
				10,
				canvas.height - 105,
			);
			ctx.fillText(
				`Performance: ${totalQPS.toFixed(0)} total QPS | Avg replication lag: ${avgReplicationLag.toFixed(0)}ms`,
				10,
				canvas.height - 90,
			);
			ctx.fillText(
				`Transactions: ${activeTransactions} active | Consistency: ${consistencyMode} | Issues: ${consistencyIssues}`,
				10,
				canvas.height - 75,
			);
			ctx.fillText(
				`Simulation: ${simulationMode} | Display: ${displayMode} | Partition tolerance: ${(partitionTolerance * 100).toFixed(0)}%`,
				10,
				canvas.height - 60,
			);

			if (viewMode === "region") {
				ctx.fillText(
					`Viewing region: ${selectedRegion}`,
					10,
					canvas.height - 45,
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
		displayMode,
		viewMode,
		selectedRegion,
		consistencyMode,
		simulationMode,
		colorScheme,
		showTransactions,
		showReplication,
		partitionTolerance,
	]);

	return (
		<div className="flex flex-col h-screen bg-black">
			<div className="flex-shrink-0 bg-gray-900 p-4 border-b border-gray-700">
				<h1 className="text-2xl font-bold text-blue-400 mb-4">
					🗄️ ASCII Distributed Database Monitor
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
						<label className="text-blue-300 mb-2">Display Mode</label>
						<select
							value={displayMode}
							onChange={(e) => setDisplayMode(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
						>
							<option value="performance">Performance (QPS)</option>
							<option value="storage">Storage Usage</option>
							<option value="replication">Replication Lag</option>
							<option value="cpu">CPU Usage</option>
							<option value="memory">Memory Usage</option>
							<option value="connections">Connections</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">View Mode</label>
						<select
							value={viewMode}
							onChange={(e) => setViewMode(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
						>
							<option value="cluster">Full Cluster</option>
							<option value="region">Single Region</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Selected Region</label>
						<select
							value={selectedRegion}
							onChange={(e) => setSelectedRegion(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
							disabled={viewMode !== "region"}
						>
							<option value="us-east">US East</option>
							<option value="us-west">US West</option>
							<option value="eu-west">EU West</option>
							<option value="asia-pacific">Asia Pacific</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Consistency Mode</label>
						<select
							value={consistencyMode}
							onChange={(e) => setConsistencyMode(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
						>
							<option value="strong">Strong Consistency</option>
							<option value="eventual">Eventual Consistency</option>
							<option value="weak">Weak Consistency</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Simulation Mode</label>
						<select
							value={simulationMode}
							onChange={(e) => setSimulationMode(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
						>
							<option value="normal">Normal Operations</option>
							<option value="high-traffic">High Traffic</option>
							<option value="partition">Network Partition</option>
							<option value="split-brain">Split Brain</option>
							<option value="backup-failure">Backup Failure</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Color Scheme</label>
						<select
							value={colorScheme}
							onChange={(e) => setColorScheme(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
						>
							<option value="database">Generic DB</option>
							<option value="mongodb">MongoDB</option>
							<option value="cassandra">Cassandra</option>
							<option value="postgresql">PostgreSQL</option>
							<option value="redis">Redis</option>
						</select>
					</div>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">
							Partition Tolerance: {(partitionTolerance * 100).toFixed(0)}%
						</label>
						<input
							type="range"
							min="0.1"
							max="1"
							step="0.1"
							value={partitionTolerance}
							onChange={(e) =>
								setPartitionTolerance(Number.parseFloat(e.target.value))
							}
							className="w-full"
						/>
					</div>

					<div className="flex flex-col gap-2">
						<label className="flex items-center text-blue-300 text-xs">
							<input
								type="checkbox"
								checked={showTransactions}
								onChange={(e) => setShowTransactions(e.target.checked)}
								className="mr-1"
							/>
							Transactions
						</label>
						<label className="flex items-center text-blue-300 text-xs">
							<input
								type="checkbox"
								checked={showReplication}
								onChange={(e) => setShowReplication(e.target.checked)}
								className="mr-1"
							/>
							Replication
						</label>
					</div>
				</div>

				<div className="mt-4 text-blue-400 text-sm">
					<p>
						🗄️ <strong>Distributed database cluster</strong> with real-time
						consistency monitoring and CAP theorem simulation!
					</p>
					<p>
						⚖️ <strong>Consistency models</strong> - Strong, eventual, and weak
						consistency with automatic conflict resolution!
					</p>
					<p>
						🌐 <strong>Multi-region architecture</strong> with
						primary/replica/shard nodes, partitions, and split-brain scenarios!
					</p>
					<p>
						Monitor MongoDB, Cassandra, PostgreSQL, Redis clusters with
						replication lag, transactions, and backup status
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
