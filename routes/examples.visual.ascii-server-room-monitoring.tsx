import { createFileRoute } from "@tanstack/react-router";
import { clamp, cos, lerp, sin } from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute(
	"/examples/visual/ascii-server-room-monitoring",
)({
	component: ASCIIServerRoomMonitoringExample,
});

interface RackUnit {
	id: string;
	name: string;
	x: number;
	y: number;
	height: number;
	temperature: number;
	power_draw: number;
	fan_speed: number;
	status: "online" | "warning" | "critical" | "offline";
	cpu_usage: number;
	disk_activity: number;
	network_activity: number;
	alert_flash: number;
	type: "server" | "switch" | "storage" | "ups" | "cooling";
}

interface EnvironmentalSensor {
	id: string;
	x: number;
	y: number;
	temperature: number;
	humidity: number;
	airflow: number;
	type: "temp" | "humidity" | "airflow";
}

interface CoolingUnit {
	id: string;
	x: number;
	y: number;
	power: number;
	airflow_direction: number;
	efficiency: number;
	status: "running" | "maintenance" | "failed";
}

interface PowerReading {
	rack_id: string;
	current_load: number;
	max_capacity: number;
	efficiency: number;
}

function ASCIIServerRoomMonitoringExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>(0);
	const racksRef = useRef<Map<string, RackUnit>>(new Map());
	const sensorsRef = useRef<EnvironmentalSensor[]>([]);
	const coolingRef = useRef<CoolingUnit[]>([]);
	const powerRef = useRef<PowerReading[]>([]);
	const [isPlaying, setIsPlaying] = useState(true);
	const [speed, setSpeed] = useState(1);
	const [displayMode, setDisplayMode] = useState("temperature");
	const [colorScheme, setColorScheme] = useState("datacenter");
	const [alertThreshold, setAlertThreshold] = useState(75);
	const [showSensors, setShowSensors] = useState(true);
	const [showAirflow, setShowAirflow] = useState(true);
	const [emergencyMode, setEmergencyMode] = useState(false);

	const colorSchemes = {
		datacenter: {
			bg: "#000011",
			text: "#00CCFF",
			hot: "#FF4444",
			cold: "#4444FF",
			warning: "#FFAA00",
			critical: "#FF0000",
			power: "#00FF88",
		},
		thermal: {
			bg: "#001100",
			text: "#FFFFFF",
			hot: "#FF0000",
			cold: "#0088FF",
			warning: "#FFFF00",
			critical: "#FF0080",
			power: "#00FF00",
		},
		industrial: {
			bg: "#111100",
			text: "#FFCC00",
			hot: "#FF6600",
			cold: "#0066FF",
			warning: "#FF8800",
			critical: "#CC0000",
			power: "#88FF00",
		},
		matrix: {
			bg: "#000000",
			text: "#00FF00",
			hot: "#FF4400",
			cold: "#0044FF",
			warning: "#AAFF00",
			critical: "#FF2200",
			power: "#44FF44",
		},
	};

	useEffect(() => {
		// Initialize server racks
		const racks = new Map<string, RackUnit>();

		const rackConfigs = [
			// Front row - Web servers
			{ name: "WEB-R01", x: 5, y: 5, height: 4, type: "server" },
			{ name: "WEB-R02", x: 15, y: 5, height: 4, type: "server" },
			{ name: "WEB-R03", x: 25, y: 5, height: 4, type: "server" },
			{ name: "WEB-R04", x: 35, y: 5, height: 4, type: "server" },

			// Middle row - Database and storage
			{ name: "DB-R01", x: 5, y: 15, height: 6, type: "storage" },
			{ name: "DB-R02", x: 15, y: 15, height: 6, type: "storage" },
			{ name: "SAN-R01", x: 25, y: 15, height: 6, type: "storage" },
			{ name: "SAN-R02", x: 35, y: 15, height: 6, type: "storage" },

			// Back row - Network and infrastructure
			{ name: "NET-R01", x: 5, y: 28, height: 3, type: "switch" },
			{ name: "NET-R02", x: 15, y: 28, height: 3, type: "switch" },
			{ name: "UPS-R01", x: 25, y: 28, height: 5, type: "ups" },
			{ name: "COOL-R01", x: 35, y: 28, height: 5, type: "cooling" },
		];

		rackConfigs.forEach((config) => {
			racks.set(config.name, {
				id: config.name,
				name: config.name,
				x: config.x,
				y: config.y,
				height: config.height,
				temperature: 20 + Math.random() * 15,
				power_draw: 50 + Math.random() * 200,
				fan_speed: 30 + Math.random() * 50,
				status: "online",
				cpu_usage: Math.random() * 100,
				disk_activity: Math.random() * 100,
				network_activity: Math.random() * 100,
				alert_flash: 0,
				type: config.type as RackUnit["type"],
			});
		});

		racksRef.current = racks;

		// Initialize environmental sensors
		sensorsRef.current = [
			{
				id: "T01",
				x: 10,
				y: 2,
				temperature: 22,
				humidity: 45,
				airflow: 2.5,
				type: "temp",
			},
			{
				id: "T02",
				x: 30,
				y: 2,
				temperature: 24,
				humidity: 48,
				airflow: 2.8,
				type: "temp",
			},
			{
				id: "H01",
				x: 10,
				y: 12,
				temperature: 26,
				humidity: 52,
				airflow: 3.1,
				type: "humidity",
			},
			{
				id: "H02",
				x: 30,
				y: 12,
				temperature: 25,
				humidity: 49,
				airflow: 2.9,
				type: "humidity",
			},
			{
				id: "A01",
				x: 10,
				y: 25,
				temperature: 23,
				humidity: 46,
				airflow: 4.2,
				type: "airflow",
			},
			{
				id: "A02",
				x: 30,
				y: 25,
				temperature: 24,
				humidity: 47,
				airflow: 3.8,
				type: "airflow",
			},
		];

		// Initialize cooling units
		coolingRef.current = [
			{
				id: "AC01",
				x: 2,
				y: 18,
				power: 75,
				airflow_direction: 0,
				efficiency: 0.85,
				status: "running",
			},
			{
				id: "AC02",
				x: 42,
				y: 18,
				power: 68,
				airflow_direction: 180,
				efficiency: 0.82,
				status: "running",
			},
		];

		// Initialize power readings
		powerRef.current = rackConfigs.map((rack) => ({
			rack_id: rack.name,
			current_load: 50 + Math.random() * 150,
			max_capacity: 250,
			efficiency: 0.85 + Math.random() * 0.1,
		}));
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

		const updateEnvironment = () => {
			const time = Date.now() / 1000;
			const racks = racksRef.current;

			// Update rack conditions
			racks.forEach((rack) => {
				// Base temperature varies by rack type and load
				let baseTemp = 22;
				if (rack.type === "server") baseTemp = 25 + rack.cpu_usage * 0.2;
				else if (rack.type === "storage")
					baseTemp = 28 + rack.disk_activity * 0.15;
				else if (rack.type === "switch")
					baseTemp = 30 + rack.network_activity * 0.1;
				else if (rack.type === "ups") baseTemp = 35 + rack.power_draw * 0.05;
				else if (rack.type === "cooling") baseTemp = 20;

				// Add thermal cycling and load variations
				const thermalCycle = 3 * sin(time * 0.1 + rack.x * 0.1);
				const loadVariation =
					rack.cpu_usage * 0.1 * sin(time * 0.3 + rack.y * 0.1);

				rack.temperature = clamp(
					baseTemp + thermalCycle + loadVariation,
					15,
					85,
				);

				// Update usage metrics
				if (rack.type === "server") {
					rack.cpu_usage += (Math.random() - 0.5) * 5;
					rack.disk_activity += (Math.random() - 0.5) * 8;
					rack.network_activity += (Math.random() - 0.5) * 10;
				} else if (rack.type === "storage") {
					rack.disk_activity += (Math.random() - 0.5) * 15;
					rack.network_activity += (Math.random() - 0.5) * 5;
					rack.cpu_usage += (Math.random() - 0.5) * 3;
				} else if (rack.type === "switch") {
					rack.network_activity += (Math.random() - 0.5) * 20;
					rack.cpu_usage += (Math.random() - 0.5) * 8;
				}

				rack.cpu_usage = clamp(rack.cpu_usage, 0, 100);
				rack.disk_activity = clamp(rack.disk_activity, 0, 100);
				rack.network_activity = clamp(rack.network_activity, 0, 100);

				// Update power consumption based on load
				const powerFactor =
					(rack.cpu_usage + rack.disk_activity + rack.network_activity) / 300;
				rack.power_draw = clamp(
					50 + powerFactor * 200 + (Math.random() - 0.5) * 20,
					20,
					300,
				);

				// Update fan speed based on temperature
				rack.fan_speed = clamp(
					30 + (rack.temperature - 20) * 2 + (Math.random() - 0.5) * 10,
					0,
					100,
				);

				// Emergency cooling in emergency mode
				if (emergencyMode) {
					rack.fan_speed = Math.min(100, rack.fan_speed * 1.5);
				}

				// Determine status
				if (rack.temperature > 65 || rack.power_draw > 250) {
					rack.status = "critical";
					rack.alert_flash = Math.max(rack.alert_flash, 15);
				} else if (rack.temperature > alertThreshold || rack.power_draw > 200) {
					rack.status = "warning";
					rack.alert_flash = Math.max(rack.alert_flash, 8);
				} else {
					rack.status = "online";
				}

				if (rack.alert_flash > 0) {
					rack.alert_flash--;
				}
			});

			// Update environmental sensors
			sensorsRef.current.forEach((sensor, i) => {
				const nearbyRacks = Array.from(racks.values()).filter(
					(rack) =>
						Math.abs(rack.x - sensor.x) < 15 &&
						Math.abs(rack.y - sensor.y) < 10,
				);

				const avgTemp =
					nearbyRacks.reduce((sum, rack) => sum + rack.temperature, 0) /
					Math.max(nearbyRacks.length, 1);
				sensor.temperature = lerp(
					sensor.temperature,
					avgTemp + (Math.random() - 0.5) * 2,
					0.1,
				);

				// Humidity affected by temperature and cooling
				const targetHumidity = 45 + (sensor.temperature - 22) * 0.5;
				sensor.humidity = lerp(
					sensor.humidity,
					targetHumidity + (Math.random() - 0.5) * 3,
					0.1,
				);

				// Airflow affected by cooling units and fan speeds
				const coolingEffect = coolingRef.current.reduce((sum, cooling) => {
					const distance = Math.sqrt(
						(cooling.x - sensor.x) ** 2 + (cooling.y - sensor.y) ** 2,
					);
					return sum + (cooling.power / 100) * Math.max(0, 1 - distance / 30);
				}, 0);

				sensor.airflow = lerp(
					sensor.airflow,
					2 + coolingEffect + (Math.random() - 0.5) * 0.5,
					0.1,
				);
			});

			// Update cooling units
			coolingRef.current.forEach((cooling) => {
				// Adjust power based on ambient temperature
				const avgRoomTemp =
					sensorsRef.current.reduce((sum, s) => sum + s.temperature, 0) /
					sensorsRef.current.length;
				const targetPower = emergencyMode
					? 95
					: clamp(50 + (avgRoomTemp - 22) * 5, 40, 90);
				cooling.power = lerp(cooling.power, targetPower, 0.05);

				// Efficiency degrades with high load
				cooling.efficiency = clamp(
					0.9 - (cooling.power / 100) * 0.1,
					0.6,
					0.95,
				);

				// Update direction for circulation
				cooling.airflow_direction += 0.5 * speed;
			});

			// Update power readings
			powerRef.current.forEach((power) => {
				const rack = racks.get(power.rack_id);
				if (rack) {
					power.current_load = rack.power_draw;
					power.efficiency = clamp(
						power.efficiency + (Math.random() - 0.5) * 0.01,
						0.75,
						0.95,
					);
				}
			});
		};

		const drawRack = (rack: RackUnit) => {
			const fontSize = 10;
			const x = rack.x;
			const y = rack.y;

			let rackColor =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text;
			if (rack.status === "critical") {
				rackColor =
					colorSchemes[colorScheme as keyof typeof colorSchemes].critical;
			} else if (rack.status === "warning") {
				rackColor =
					colorSchemes[colorScheme as keyof typeof colorSchemes].warning;
			}

			// Flash effect for alerts
			if (rack.alert_flash > 0 && rack.alert_flash % 6 < 3) {
				ctx.fillStyle = rack.status === "critical" ? "#FF0000" : "#FFAA00";
			} else {
				ctx.fillStyle = rackColor;
			}

			// Draw rack representation based on type
			let rackArt: string[] = [];

			if (rack.type === "server") {
				rackArt = [
					"┌─────────┐",
					"│████ LED │",
					"│████ LED │",
					"│○○○○ FAN │",
					"└─────────┘",
				];
			} else if (rack.type === "storage") {
				rackArt = [
					"┌─────────┐",
					"│HDD HDD  │",
					"│HDD HDD  │",
					"│HDD HDD  │",
					"│HDD HDD  │",
					"│○○ POWER │",
					"└─────────┘",
				];
			} else if (rack.type === "switch") {
				rackArt = ["┌─────────┐", "│●●●●●●●● │", "│●●●●●●●● │", "└─────────┘"];
			} else if (rack.type === "ups") {
				rackArt = [
					"┌─────────┐",
					"│ ≈≈≈≈≈≈ │",
					"│ BATTERY │",
					"│ BATTERY │",
					"│ ⚡POWER │",
					"└─────────┘",
				];
			} else if (rack.type === "cooling") {
				rackArt = [
					"┌─────────┐",
					"│  ∘∘∘∘∘  │",
					"│ ∘COOL∘  │",
					"│  ∘∘∘∘∘  │",
					"│ ~~AIR~~ │",
					"└─────────┘",
				];
			}

			rackArt.forEach((line, i) => {
				ctx.fillText(line, x * fontSize, (y + i) * fontSize);
			});

			// Rack name and status
			ctx.fillStyle =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text;
			ctx.fillText(rack.name, x * fontSize, (y - 1) * fontSize);

			// Status indicator
			const statusChar =
				rack.status === "online" ? "●" : rack.status === "warning" ? "▲" : "✕";
			ctx.fillStyle = rackColor;
			ctx.fillText(statusChar, (x + 11) * fontSize, (y - 1) * fontSize);

			// Display metrics based on mode
			const metricY = y + rack.height + 1;
			let value = 0;
			let unit = "";
			let label = "";

			switch (displayMode) {
				case "temperature":
					value = rack.temperature;
					unit = "°C";
					label = "TEMP";
					break;
				case "power":
					value = rack.power_draw;
					unit = "W";
					label = "PWR";
					break;
				case "cpu":
					value = rack.cpu_usage;
					unit = "%";
					label = "CPU";
					break;
				case "fan":
					value = rack.fan_speed;
					unit = "%";
					label = "FAN";
					break;
			}

			// Color-coded metric display
			let metricColor =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text;
			if (displayMode === "temperature") {
				if (value > 60)
					metricColor =
						colorSchemes[colorScheme as keyof typeof colorSchemes].hot;
				else if (value < 25)
					metricColor =
						colorSchemes[colorScheme as keyof typeof colorSchemes].cold;
			} else if (value > alertThreshold) {
				metricColor =
					colorSchemes[colorScheme as keyof typeof colorSchemes].warning;
			}

			ctx.fillStyle = metricColor;
			ctx.fillText(
				`${label}: ${value.toFixed(1)}${unit}`,
				x * fontSize,
				metricY * fontSize,
			);
		};

		const drawSensors = () => {
			if (!showSensors) return;

			const fontSize = 10;
			sensorsRef.current.forEach((sensor) => {
				let sensorIcon = "🌡️";
				let value = sensor.temperature.toFixed(1) + "°C";

				if (sensor.type === "humidity") {
					sensorIcon = "💧";
					value = sensor.humidity.toFixed(1) + "%";
				} else if (sensor.type === "airflow") {
					sensorIcon = "🌪️";
					value = sensor.airflow.toFixed(1) + "m/s";
				}

				// Sensor background
				ctx.fillStyle =
					colorSchemes[colorScheme as keyof typeof colorSchemes].bg + "CC";
				ctx.fillRect(
					(sensor.x - 1) * fontSize,
					(sensor.y - 1) * fontSize,
					4 * fontSize,
					2 * fontSize,
				);

				// Sensor value
				ctx.fillStyle =
					colorSchemes[colorScheme as keyof typeof colorSchemes].text;
				ctx.fillText(
					`${sensorIcon}${value}`,
					sensor.x * fontSize,
					sensor.y * fontSize,
				);
			});
		};

		const drawAirflow = () => {
			if (!showAirflow) return;

			const fontSize = 10;
			const time = Date.now() / 1000;

			coolingRef.current.forEach((cooling) => {
				// Draw airflow particles
				for (let i = 0; i < 8; i++) {
					const angle = cooling.airflow_direction + i * 45;
					const distance = 3 + ((time * 2 + i) % 10);
					const x = cooling.x + distance * cos((angle * Math.PI) / 180);
					const y = cooling.y + distance * sin((angle * Math.PI) / 180);

					ctx.fillStyle =
						colorSchemes[colorScheme as keyof typeof colorSchemes].cold + "80";
					ctx.fillText("∘", x * fontSize, y * fontSize);
				}
			});
		};

		const drawStatusPanel = () => {
			const racks = Array.from(racksRef.current.values());
			const avgTemp =
				racks.reduce((sum, r) => sum + r.temperature, 0) / racks.length;
			const totalPower = racks.reduce((sum, r) => sum + r.power_draw, 0);
			const criticalCount = racks.filter((r) => r.status === "critical").length;
			const warningCount = racks.filter((r) => r.status === "warning").length;
			const avgHumidity =
				sensorsRef.current.reduce((sum, s) => sum + s.humidity, 0) /
				sensorsRef.current.length;
			const avgAirflow =
				sensorsRef.current.reduce((sum, s) => sum + s.airflow, 0) /
				sensorsRef.current.length;

			ctx.fillStyle =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text;
			const statusY = canvas.height - 120;

			ctx.fillText("┌─ SERVER ROOM ENVIRONMENTAL DASHBOARD ─┐", 10, statusY);
			ctx.fillText(
				`│ Temperature: ${avgTemp.toFixed(1)}°C | Humidity: ${avgHumidity.toFixed(1)}% | Airflow: ${avgAirflow.toFixed(1)}m/s`,
				10,
				statusY + 15,
			);
			ctx.fillText(
				`│ Total Power: ${totalPower.toFixed(0)}W | Critical: ${criticalCount} | Warning: ${warningCount}`,
				10,
				statusY + 30,
			);
			ctx.fillText(
				`│ Cooling Status: ${coolingRef.current.map((c) => c.status.toUpperCase()).join(", ")}`,
				10,
				statusY + 45,
			);
			ctx.fillText(
				`│ Emergency Mode: ${emergencyMode ? "ACTIVE" : "STANDBY"} | Display: ${displayMode.toUpperCase()}`,
				10,
				statusY + 60,
			);
			ctx.fillText(
				"└────────────────────────────────────────┘",
				10,
				statusY + 75,
			);
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

			// Update environment
			if (Math.random() < 0.15 * speed) {
				updateEnvironment();
			}

			// Draw airflow first (background)
			drawAirflow();

			// Draw racks
			racksRef.current.forEach((rack) => {
				drawRack(rack);
			});

			// Draw sensors
			drawSensors();

			// Draw status panel
			drawStatusPanel();

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
		alertThreshold,
		showSensors,
		showAirflow,
		emergencyMode,
	]);

	return (
		<div className="flex flex-col h-screen bg-black">
			<div className="flex-shrink-0 bg-gray-900 p-4 border-b border-gray-700">
				<h1 className="text-2xl font-bold text-blue-400 mb-4">
					🏢 ASCII Server Room Environmental Monitoring
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
						<label className="text-blue-300 mb-2">
							Alert Threshold: {alertThreshold}°C
						</label>
						<input
							type="range"
							min="50"
							max="80"
							step="5"
							value={alertThreshold}
							onChange={(e) =>
								setAlertThreshold(Number.parseInt(e.target.value))
							}
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
							<option value="temperature">Temperature</option>
							<option value="power">Power Draw</option>
							<option value="cpu">CPU Usage</option>
							<option value="fan">Fan Speed</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Color Scheme</label>
						<select
							value={colorScheme}
							onChange={(e) => setColorScheme(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
						>
							<option value="datacenter">Datacenter Blue</option>
							<option value="thermal">Thermal View</option>
							<option value="industrial">Industrial</option>
							<option value="matrix">Matrix Green</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Emergency Mode</label>
						<button
							onClick={() => setEmergencyMode(!emergencyMode)}
							className={`px-3 py-2 rounded font-medium transition-colors ${
								emergencyMode
									? "bg-red-600 hover:bg-red-700 text-white"
									: "bg-gray-600 hover:bg-gray-700 text-white"
							}`}
						>
							{emergencyMode ? "EMERGENCY" : "Normal"}
						</button>
					</div>

					<div className="flex flex-col gap-2">
						<label className="flex items-center text-blue-300 text-xs">
							<input
								type="checkbox"
								checked={showSensors}
								onChange={(e) => setShowSensors(e.target.checked)}
								className="mr-1"
							/>
							Sensors
						</label>
						<label className="flex items-center text-blue-300 text-xs">
							<input
								type="checkbox"
								checked={showAirflow}
								onChange={(e) => setShowAirflow(e.target.checked)}
								className="mr-1"
							/>
							Airflow
						</label>
					</div>
				</div>

				<div className="mt-4 text-blue-400 text-sm">
					<p>
						🏢 <strong>Real-time server room monitoring</strong> with
						environmental sensors and thermal management!
					</p>
					<p>
						🌡️ <strong>Track temperature, humidity, and airflow</strong> across
						different rack types and cooling systems!
					</p>
					<p>
						⚠️ <strong>Emergency cooling mode</strong> automatically activates
						for critical temperature conditions!
					</p>
					<p>
						Monitor servers, storage, switches, UPS units, and cooling systems
						in a realistic datacenter layout
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
