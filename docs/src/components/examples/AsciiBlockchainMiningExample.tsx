import { clamp, cos, lerp, sin } from "play.ts";
import { useEffect, useRef, useState } from "react";

interface MiningRig {
	id: string;
	name: string;
	x: number;
	y: number;
	hashrate: number;
	power_consumption: number;
	temperature: number;
	uptime: number;
	shares_found: number;
	shares_accepted: number;
	status: "mining" | "idle" | "error" | "maintenance";
	gpu_count: number;
	efficiency: number;
	alert_flash: number;
}

interface Block {
	id: string;
	height: number;
	difficulty: number;
	timestamp: number;
	hash: string;
	miner_id: string;
	reward: number;
	transaction_count: number;
	status: "pending" | "confirmed" | "orphaned";
}

interface NetworkStats {
	total_hashrate: number;
	difficulty: number;
	block_time: number;
	network_hashrate: number;
	price: number;
	profit_per_day: number;
}

interface HashParticle {
	id: string;
	x: number;
	y: number;
	target_x: number;
	target_y: number;
	progress: number;
	hash_value: string;
	rig_id: string;
	type: "share" | "solution" | "stale";
}

export default function ASCIIBlockchainMiningExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>(0);
	const rigsRef = useRef<Map<string, MiningRig>>(new Map());
	const blocksRef = useRef<Block[]>([]);
	const particlesRef = useRef<HashParticle[]>([]);
	const networkStatsRef = useRef<NetworkStats>({
		total_hashrate: 0,
		difficulty: 15000000000000,
		block_time: 600,
		network_hashrate: 150000000000000,
		price: 45000,
		profit_per_day: 0,
	});
	const [isPlaying, setIsPlaying] = useState(true);
	const [speed, setSpeed] = useState(1);
	const [displayMode, setDisplayMode] = useState("hashrate");
	const [colorScheme, setColorScheme] = useState("crypto");
	const [showParticles, setShowParticles] = useState(true);
	const [miningIntensity, setMiningIntensity] = useState(0.8);
	const [electricityCost, setElectricityCost] = useState(0.12);
	const [poolMode, setPoolMode] = useState(true);

	const colorSchemes = {
		crypto: {
			bg: "#001122",
			text: "#00FFAA",
			hash: "#FFAA00",
			block: "#AA00FF",
			profit: "#00AA00",
			loss: "#FF4444",
		},
		gold: {
			bg: "#111100",
			text: "#FFDD00",
			hash: "#FF8800",
			block: "#FFFF00",
			profit: "#00DD00",
			loss: "#DD0000",
		},
		matrix: {
			bg: "#000000",
			text: "#00FF00",
			hash: "#AAFF00",
			block: "#00AAFF",
			profit: "#44FF44",
			loss: "#FF4444",
		},
		neon: {
			bg: "#000011",
			text: "#00FFFF",
			hash: "#FF00FF",
			block: "#FFFF00",
			profit: "#00FF88",
			loss: "#FF8800",
		},
	};

	useEffect(() => {
		// Initialize mining rigs
		const rigs = new Map<string, MiningRig>();

		const rigConfigs = [
			{ name: "RIG-01", x: 10, y: 8, gpu_count: 6 },
			{ name: "RIG-02", x: 25, y: 8, gpu_count: 8 },
			{ name: "RIG-03", x: 40, y: 8, gpu_count: 6 },
			{ name: "RIG-04", x: 55, y: 8, gpu_count: 10 },
			{ name: "RIG-05", x: 70, y: 8, gpu_count: 8 },
			{ name: "RIG-06", x: 10, y: 20, gpu_count: 12 },
			{ name: "RIG-07", x: 25, y: 20, gpu_count: 6 },
			{ name: "RIG-08", x: 40, y: 20, gpu_count: 8 },
			{ name: "ASIC-01", x: 55, y: 20, gpu_count: 1 },
			{ name: "ASIC-02", x: 70, y: 20, gpu_count: 1 },
		];

		rigConfigs.forEach((config) => {
			const baseHashrate = config.name.startsWith("ASIC")
				? 110000
				: config.gpu_count * 45;
			rigs.set(config.name, {
				id: config.name,
				name: config.name,
				x: config.x,
				y: config.y,
				hashrate: baseHashrate + Math.random() * baseHashrate * 0.1,
				power_consumption: config.name.startsWith("ASIC")
					? 3200
					: config.gpu_count * 220,
				temperature: 65 + Math.random() * 15,
				uptime: Math.random() * 7200000,
				shares_found: Math.floor(Math.random() * 1000),
				shares_accepted: 0,
				status: "mining",
				gpu_count: config.gpu_count,
				efficiency: 0.85 + Math.random() * 0.1,
				alert_flash: 0,
			});
		});

		rigsRef.current = rigs;

		// Initialize some sample blocks
		blocksRef.current = [
			{
				id: "block-750123",
				height: 750123,
				difficulty: 15000000000000,
				timestamp: Date.now() - 300000,
				hash: "0000000000000000000abc123def456",
				miner_id: "RIG-04",
				reward: 6.25,
				transaction_count: 2847,
				status: "confirmed",
			},
		];
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

		const generateRandomHash = () => {
			const chars = "0123456789abcdef";
			let hash = "0000";
			for (let i = 4; i < 32; i++) {
				hash += chars[Math.floor(Math.random() * chars.length)];
			}
			return hash;
		};

		const updateMiningRigs = () => {
			const rigs = rigsRef.current;
			const time = Date.now() / 1000;
			let totalHashrate = 0;

			rigs.forEach((rig) => {
				// Update hashrate based on temperature and efficiency
				const tempFactor = clamp(1 - (rig.temperature - 70) * 0.01, 0.5, 1.1);
				const intensityFactor = miningIntensity * tempFactor * rig.efficiency;
				const baseHashrate = rig.name.startsWith("ASIC")
					? 110000
					: rig.gpu_count * 45;

				rig.hashrate =
					baseHashrate * intensityFactor * (0.95 + Math.random() * 0.1);
				totalHashrate += rig.hashrate;

				// Update temperature based on load and ambient conditions
				const targetTemp =
					65 + (rig.hashrate / baseHashrate) * 20 + 5 * sin(time * 0.1);
				rig.temperature = lerp(rig.temperature, targetTemp, 0.05);

				// Update power consumption
				rig.power_consumption =
					(rig.name.startsWith("ASIC") ? 3200 : rig.gpu_count * 220) *
					intensityFactor;

				// Generate shares (simplified mining simulation)
				if (Math.random() < (rig.hashrate / 1000000) * speed * 0.01) {
					rig.shares_found++;

					// Create hash particle
					if (showParticles) {
						particlesRef.current.push({
							id: `share-${Date.now()}-${rig.id}`,
							x: rig.x,
							y: rig.y,
							target_x: 85,
							target_y: 15,
							progress: 0,
							hash_value: generateRandomHash(),
							rig_id: rig.id,
							type: Math.random() < 0.02 ? "solution" : "share",
						});
					}

					// Check for block solution (very rare)
					if (Math.random() < 0.0001 * speed) {
						const newBlock: Block = {
							id: `block-${Date.now()}`,
							height:
								blocksRef.current.length > 0
									? Math.max(...blocksRef.current.map((b) => b.height)) + 1
									: 750124,
							difficulty: networkStatsRef.current.difficulty,
							timestamp: Date.now(),
							hash: generateRandomHash(),
							miner_id: rig.id,
							reward: 6.25,
							transaction_count: 1500 + Math.floor(Math.random() * 2000),
							status: "pending",
						};

						blocksRef.current.unshift(newBlock);
						if (blocksRef.current.length > 10) {
							blocksRef.current.pop();
						}

						rig.shares_accepted += 50;
					} else if (Math.random() < 0.95) {
						rig.shares_accepted++;
					}
				}

				// Determine status
				if (rig.temperature > 85) {
					rig.status = "error";
					rig.alert_flash = Math.max(rig.alert_flash, 15);
				} else if (rig.hashrate < baseHashrate * 0.5) {
					rig.status = "maintenance";
					rig.alert_flash = Math.max(rig.alert_flash, 8);
				} else if (rig.hashrate < baseHashrate * 0.8) {
					rig.status = "idle";
				} else {
					rig.status = "mining";
				}

				if (rig.alert_flash > 0) {
					rig.alert_flash--;
				}

				rig.uptime += 1000 * speed;
			});

			// Update network stats
			networkStatsRef.current.total_hashrate = totalHashrate;
			networkStatsRef.current.difficulty += (Math.random() - 0.5) * 100000000;
			networkStatsRef.current.price += (Math.random() - 0.5) * 100;

			// Calculate profitability
			const totalPowerKW =
				Array.from(rigs.values()).reduce(
					(sum, rig) => sum + rig.power_consumption,
					0,
				) / 1000;
			const dailyPowerCost = totalPowerKW * 24 * electricityCost;
			const dailyRevenue =
				(totalHashrate / 1000000) * 0.00001 * networkStatsRef.current.price;
			networkStatsRef.current.profit_per_day = dailyRevenue - dailyPowerCost;
		};

		const updateParticles = () => {
			particlesRef.current.forEach((particle) => {
				particle.progress += 0.02 * speed;
				particle.x = lerp(particle.x, particle.target_x, particle.progress);
				particle.y = lerp(particle.y, particle.target_y, particle.progress);

				// Particle reached pool
				if (particle.progress >= 1 && particle.type === "solution") {
					// Confirm the latest pending block
					const pendingBlock = blocksRef.current.find(
						(b) => b.status === "pending",
					);
					if (pendingBlock) {
						pendingBlock.status = "confirmed";
					}
				}
			});

			// Remove completed particles
			particlesRef.current = particlesRef.current.filter((p) => p.progress < 1);
		};

		const drawMiningRig = (rig: MiningRig) => {
			const fontSize = 10;
			const x = rig.x;
			const y = rig.y;

			let rigColor =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text;
			if (rig.status === "error")
				rigColor = colorSchemes[colorScheme as keyof typeof colorSchemes].loss;
			else if (rig.status === "maintenance")
				rigColor = colorSchemes[colorScheme as keyof typeof colorSchemes].hash;
			else if (rig.status === "mining")
				rigColor =
					colorSchemes[colorScheme as keyof typeof colorSchemes].profit;

			// Flash effect for alerts
			if (rig.alert_flash > 0 && rig.alert_flash % 6 < 3) {
				ctx.fillStyle = rig.status === "error" ? "#FF0000" : "#FFAA00";
			} else {
				ctx.fillStyle = rigColor;
			}

			let rigArt: string[] = [];
			if (rig.name.startsWith("ASIC")) {
				rigArt = [
					"┌─────────┐",
					"│ ████▓▓▓ │",
					"│ ASIC    │",
					"│ ○○○ HOT │",
					"└─────────┘",
				];
			} else {
				rigArt = [
					"┌─────────┐",
					"│ GPU GPU │",
					"│ GPU GPU │",
					"│ ○○○ FAN │",
					"└─────────┘",
				];
			}

			rigArt.forEach((line, i) => {
				ctx.fillText(line, x * fontSize, (y + i) * fontSize);
			});

			// Rig info
			ctx.fillStyle =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text;
			ctx.fillText(rig.name, x * fontSize, (y - 1) * fontSize);

			// Status indicator
			let statusChar = "●";
			if (rig.status === "mining") statusChar = "⚡";
			else if (rig.status === "error") statusChar = "✕";
			else if (rig.status === "maintenance") statusChar = "🔧";
			else if (rig.status === "idle") statusChar = "○";

			ctx.fillStyle = rigColor;
			ctx.fillText(statusChar, (x + 11) * fontSize, (y - 1) * fontSize);

			// Display metrics
			const metricY = y + 6;
			let value = 0;
			let label = "";
			let unit = "";

			switch (displayMode) {
				case "hashrate":
					value = rig.hashrate / 1000;
					label = "Hash";
					unit = "MH/s";
					break;
				case "temperature":
					value = rig.temperature;
					label = "Temp";
					unit = "°C";
					break;
				case "power":
					value = rig.power_consumption;
					label = "Power";
					unit = "W";
					break;
				case "efficiency":
					value = rig.efficiency * 100;
					label = "Eff";
					unit = "%";
					break;
			}

			let metricColor =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text;
			if (displayMode === "temperature" && value > 80) {
				metricColor =
					colorSchemes[colorScheme as keyof typeof colorSchemes].loss;
			} else if (displayMode === "hashrate" && rig.status === "mining") {
				metricColor =
					colorSchemes[colorScheme as keyof typeof colorSchemes].profit;
			}

			ctx.fillStyle = metricColor;
			ctx.fillText(
				`${label}: ${value.toFixed(1)}${unit}`,
				x * fontSize,
				metricY * fontSize,
			);
			ctx.fillText(
				`Shares: ${rig.shares_accepted}/${rig.shares_found}`,
				x * fontSize,
				(metricY + 1) * fontSize,
			);
		};

		const drawMiningPool = () => {
			const fontSize = 10;
			const x = 85;
			const y = 12;

			ctx.fillStyle =
				colorSchemes[colorScheme as keyof typeof colorSchemes].block;

			const poolArt = [
				"┌───────────┐",
				"│  MINING   │",
				"│   POOL    │",
				"│ ◇◇◇◇◇◇◇◇ │",
				"│ STRATUM   │",
				"└───────────┘",
			];

			poolArt.forEach((line, i) => {
				ctx.fillText(line, x * fontSize, (y + i) * fontSize);
			});

			ctx.fillStyle =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text;
			ctx.fillText("POOL SERVER", x * fontSize, (y - 1) * fontSize);
			ctx.fillText(
				`Difficulty: ${(networkStatsRef.current.difficulty / 1000000000000).toFixed(1)}T`,
				x * fontSize,
				(y + 7) * fontSize,
			);
		};

		const drawBlocks = () => {
			const fontSize = 10;
			const startY = 25;

			ctx.fillStyle =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text;
			ctx.fillText("┌─ RECENT BLOCKS ─┐", 10, startY * fontSize);

			blocksRef.current.forEach((block, i) => {
				if (i >= 8) return;

				let blockColor =
					colorSchemes[colorScheme as keyof typeof colorSchemes].block;
				if (block.status === "confirmed")
					blockColor =
						colorSchemes[colorScheme as keyof typeof colorSchemes].profit;
				else if (block.status === "orphaned")
					blockColor =
						colorSchemes[colorScheme as keyof typeof colorSchemes].loss;

				ctx.fillStyle = blockColor;
				const blockY = startY + 1 + i;
				const age = (Date.now() - block.timestamp) / 60000;

				ctx.fillText(
					`│ #${block.height} ${block.hash.substring(0, 16)}... ${age.toFixed(0)}m ago ${block.status}`,
					10,
					blockY * fontSize,
				);
				ctx.fillText(
					`│ Reward: ${block.reward} BTC | Txs: ${block.transaction_count} | Miner: ${block.miner_id}`,
					10,
					(blockY + 0.5) * fontSize,
				);
			});

			ctx.fillStyle =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text;
			ctx.fillText("└──────────────────┘", 10, (startY + 9) * fontSize);
		};

		const drawParticles = () => {
			if (!showParticles) return;

			const fontSize = 10;

			particlesRef.current.forEach((particle) => {
				let particleChar = "●";
				let particleColor =
					colorSchemes[colorScheme as keyof typeof colorSchemes].hash;

				if (particle.type === "solution") {
					particleChar = "★";
					particleColor =
						colorSchemes[colorScheme as keyof typeof colorSchemes].block;
				} else if (particle.type === "stale") {
					particleChar = "✕";
					particleColor =
						colorSchemes[colorScheme as keyof typeof colorSchemes].loss;
				}

				ctx.fillStyle = particleColor;
				ctx.fillText(
					particleChar,
					particle.x * fontSize,
					particle.y * fontSize,
				);
			});
		};

		const drawStatistics = () => {
			const stats = networkStatsRef.current;
			const rigs = Array.from(rigsRef.current.values());
			const totalPower = rigs.reduce(
				(sum, rig) => sum + rig.power_consumption,
				0,
			);
			const miningRigs = rigs.filter((r) => r.status === "mining").length;
			const avgTemp =
				rigs.reduce((sum, rig) => sum + rig.temperature, 0) / rigs.length;

			ctx.fillStyle =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text;
			const statsY = canvas.height - 120;

			ctx.fillText("┌─ MINING FARM DASHBOARD ─┐", 10, statsY);
			ctx.fillText(
				`│ Total Hashrate: ${(stats.total_hashrate / 1000000).toFixed(1)} MH/s | Active Rigs: ${miningRigs}/${rigs.length}`,
				10,
				statsY + 15,
			);
			ctx.fillText(
				`│ Power Consumption: ${(totalPower / 1000).toFixed(1)} kW | Avg Temp: ${avgTemp.toFixed(1)}°C`,
				10,
				statsY + 30,
			);
			ctx.fillText(
				`│ BTC Price: $${stats.price.toFixed(0)} | Electricity: $${electricityCost}/kWh`,
				10,
				statsY + 45,
			);

			const profitColor =
				stats.profit_per_day > 0
					? colorSchemes[colorScheme as keyof typeof colorSchemes].profit
					: colorSchemes[colorScheme as keyof typeof colorSchemes].loss;

			ctx.fillStyle = profitColor;
			ctx.fillText(
				`│ Daily Profit: $${stats.profit_per_day.toFixed(2)} | Pool Mode: ${poolMode ? "ON" : "SOLO"}`,
				10,
				statsY + 60,
			);

			ctx.fillStyle =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text;
			ctx.fillText("└─────────────────────────┘", 10, statsY + 75);
		};

		const animate = () => {
			if (!isPlaying) return;

			const currentScheme =
				colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Clear canvas
			ctx.fillStyle = currentScheme.bg;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			ctx.font = '10px "Courier New", monospace';
			ctx.textBaseline = "top";

			// Update system
			if (Math.random() < 0.1 * speed) {
				updateMiningRigs();
			}
			updateParticles();

			// Draw components
			rigsRef.current.forEach((rig) => drawMiningRig(rig));

			if (poolMode) {
				drawMiningPool();
			}

			drawBlocks();
			drawParticles();
			drawStatistics();

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
		colorScheme,
		showParticles,
		miningIntensity,
		electricityCost,
		poolMode,
	]);

	return (
		<div className="flex flex-col h-screen bg-black">
			<div className="flex-shrink-0 bg-gray-900 p-4 border-b border-gray-700">
				<h1 className="text-2xl font-bold text-green-400 mb-4">
					⛏️ ASCII Blockchain Mining Farm
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
						<label className="text-green-300 mb-2">
							Mining Intensity: {Math.round(miningIntensity * 100)}%
						</label>
						<input
							type="range"
							min="0.1"
							max="1"
							step="0.05"
							value={miningIntensity}
							onChange={(e) =>
								setMiningIntensity(Number.parseFloat(e.target.value))
							}
							className="w-full"
						/>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">
							Electricity: ${electricityCost}/kWh
						</label>
						<input
							type="range"
							min="0.05"
							max="0.25"
							step="0.01"
							value={electricityCost}
							onChange={(e) =>
								setElectricityCost(Number.parseFloat(e.target.value))
							}
							className="w-full"
						/>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Display Mode</label>
						<select
							value={displayMode}
							onChange={(e) => setDisplayMode(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-green-300 rounded border border-gray-600"
						>
							<option value="hashrate">Hashrate</option>
							<option value="temperature">Temperature</option>
							<option value="power">Power</option>
							<option value="efficiency">Efficiency</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Color Scheme</label>
						<select
							value={colorScheme}
							onChange={(e) => setColorScheme(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-green-300 rounded border border-gray-600"
						>
							<option value="crypto">Crypto Green</option>
							<option value="gold">Digital Gold</option>
							<option value="matrix">Matrix</option>
							<option value="neon">Neon</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Pool Mining</label>
						<button
							onClick={() => setPoolMode(!poolMode)}
							className={`px-3 py-2 rounded font-medium transition-colors ${
								poolMode
									? "bg-blue-600 hover:bg-blue-700 text-white"
									: "bg-gray-600 hover:bg-gray-700 text-white"
							}`}
						>
							{poolMode ? "Pool" : "Solo"}
						</button>
					</div>

					<div className="flex flex-col">
						<label className="flex items-center text-green-300 text-xs">
							<input
								type="checkbox"
								checked={showParticles}
								onChange={(e) => setShowParticles(e.target.checked)}
								className="mr-1"
							/>
							Hash Particles
						</label>
					</div>
				</div>

				<div className="mt-4 text-green-400 text-sm">
					<p>
						⛏️ <strong>Real-time crypto mining farm simulation</strong> with GPU
						rigs and ASIC miners!
					</p>
					<p>
						📊{" "}
						<strong>Monitor hashrates, temperatures, and profitability</strong>{" "}
						across multiple mining hardware types!
					</p>
					<p>
						💰 <strong>Track block rewards and pool shares</strong> with dynamic
						difficulty and BTC price changes!
					</p>
					<p>
						Watch hash particles flow from rigs to pool servers and observe real
						mining economics
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