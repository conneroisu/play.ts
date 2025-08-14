import { createFileRoute } from "@tanstack/react-router";
import { clamp, lerp } from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute(
	"/examples/visual/ascii-datacenter-cooling",
)({
	component: ASCIIDatacenterCoolingExample,
});

interface CoolingUnit {
	id: string;
	name: string;
	type: "crac" | "crah" | "inmb" | "liquid" | "evaporative" | "chiller";
	capacity: number; // kW cooling capacity
	power_usage: number; // kW power consumption
	efficiency: number; // COP (Coefficient of Performance)
	status: "running" | "standby" | "maintenance" | "fault" | "emergency";
	setpoint: number; // Target temperature °C
	actual_temp: number; // Actual temperature °C
	humidity: number; // %
	airflow: number; // CFM
	x: number;
	y: number;
	zone: string;
	redundancy_group: string;
	alarm_state: boolean;
	runtime_hours: number;
}

interface ThermalSensor {
	id: string;
	name: string;
	temperature: number;
	humidity: number;
	airflow_velocity: number;
	x: number;
	y: number;
	zone: string;
	alert_threshold_high: number;
	alert_threshold_low: number;
	trend: "rising" | "falling" | "stable";
	history: number[];
}

interface ServerRack {
	id: string;
	name: string;
	heat_load: number; // kW heat generation
	inlet_temp: number; // °C
	outlet_temp: number; // °C
	delta_t: number; // Temperature rise
	power_usage: number; // kW
	u_position: number;
	density: "low" | "medium" | "high" | "extreme";
	x: number;
	y: number;
	zone: string;
	fan_speed: number; // %
	status: "normal" | "warning" | "critical" | "shutdown";
}

interface AirFlow {
	id: string;
	from_x: number;
	from_y: number;
	to_x: number;
	to_y: number;
	temperature: number;
	velocity: number;
	progress: number;
	type: "supply" | "return" | "exhaust" | "hot_aisle" | "cold_aisle";
}

interface CoolingZone {
	id: string;
	name: string;
	x: number;
	y: number;
	width: number;
	height: number;
	target_temp: number;
	actual_temp: number;
	pue: number; // Power Usage Effectiveness
	cooling_load: number; // kW
	type: "cold_aisle" | "hot_aisle" | "perimeter" | "equipment";
}

function ASCIIDatacenterCoolingExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>(0);
	const coolingUnitsRef = useRef<Map<string, CoolingUnit>>(new Map());
	const sensorsRef = useRef<Map<string, ThermalSensor>>(new Map());
	const racksRef = useRef<Map<string, ServerRack>>(new Map());
	const airFlowsRef = useRef<AirFlow[]>([]);
	const zonesRef = useRef<Map<string, CoolingZone>>(new Map());
	const [isPlaying, setIsPlaying] = useState(true);
	const [speed, setSpeed] = useState(1);
	const [displayMode, setDisplayMode] = useState("temperature");
	const [datacenterLayout, setDatacenterLayout] = useState("raised_floor");
	const [coolingStrategy, setCoolingStrategy] = useState("traditional");
	const [colorScheme, setColorScheme] = useState("thermal");
	const [showAirflow, setShowAirflow] = useState(true);
	const [showSensors, setShowSensors] = useState(true);
	const [showZones, setShowZones] = useState(false);
	const [emergencyMode, setEmergencyMode] = useState(false);
	const [outsideTemp, setOutsideTemp] = useState(25);
	const [targetPUE, setTargetPUE] = useState(1.5);

	const colorSchemes = {
		thermal: {
			bg: "#000011",
			cold: "#0000FF",
			cool: "#00AAFF",
			warm: "#FFAA00",
			hot: "#FF4400",
			critical: "#FF0000",
			text: "#FFFFFF",
			flow: "#88AAFF",
		},
		datacenter: {
			bg: "#001122",
			cold: "#00CCFF",
			cool: "#00AAAA",
			warm: "#FFCC00",
			hot: "#FF8800",
			critical: "#FF0000",
			text: "#FFFFFF",
			flow: "#AAFFFF",
		},
		efficiency: {
			bg: "#002200",
			cold: "#00FF00",
			cool: "#88FF88",
			warm: "#FFFF00",
			hot: "#FFAA00",
			critical: "#FF4444",
			text: "#FFFFFF",
			flow: "#AAFFAA",
		},
		night_vision: {
			bg: "#000000",
			cold: "#004400",
			cool: "#008800",
			warm: "#AAAA00",
			hot: "#AA4400",
			critical: "#AA0000",
			text: "#00FF00",
			flow: "#44AA44",
		},
		arctic: {
			bg: "#001122",
			cold: "#FFFFFF",
			cool: "#AAFFFF",
			warm: "#88AAFF",
			hot: "#4488FF",
			critical: "#0044FF",
			text: "#FFFFFF",
			flow: "#CCFFFF",
		},
	};

	useEffect(() => {
		// Initialize datacenter cooling infrastructure
		const coolingUnits = new Map<string, CoolingUnit>();
		const sensors = new Map<string, ThermalSensor>();
		const racks = new Map<string, ServerRack>();
		const zones = new Map<string, CoolingZone>();

		if (datacenterLayout === "raised_floor") {
			// Traditional raised floor datacenter

			// CRAC units (Computer Room Air Conditioning)
			const cracConfigs = [
				{ name: "CRAC-A1", x: 5, y: 5, capacity: 100, zone: "Zone-A" },
				{ name: "CRAC-A2", x: 5, y: 45, capacity: 100, zone: "Zone-A" },
				{ name: "CRAC-B1", x: 85, y: 5, capacity: 100, zone: "Zone-B" },
				{ name: "CRAC-B2", x: 85, y: 45, capacity: 100, zone: "Zone-B" },
			];

			cracConfigs.forEach((config) => {
				coolingUnits.set(config.name, {
					id: config.name,
					name: config.name,
					type: "crac",
					capacity: config.capacity,
					power_usage: config.capacity * 0.25, // kW
					efficiency: 3.5, // COP
					status: "running",
					setpoint: 22,
					actual_temp: 22 + (Math.random() - 0.5) * 2,
					humidity: 45 + (Math.random() - 0.5) * 10,
					airflow: config.capacity * 400, // CFM
					x: config.x,
					y: config.y,
					zone: config.zone,
					redundancy_group: config.zone,
					alarm_state: false,
					runtime_hours: Math.random() * 8760,
				});
			});

			// Server racks
			for (let row = 0; row < 4; row++) {
				for (let rack = 0; rack < 10; rack++) {
					const rackId = `R${row + 1}-${rack + 1}`;
					const isHotAisle = row % 2 === 1;
					const x = 15 + rack * 7;
					const y = 10 + row * 10;

					racks.set(rackId, {
						id: rackId,
						name: rackId,
						heat_load: 5 + Math.random() * 10, // 5-15 kW
						inlet_temp: 20 + Math.random() * 4,
						outlet_temp: 0, // Will be calculated
						delta_t: 0,
						power_usage: 8 + Math.random() * 12, // 8-20 kW
						u_position: 42, // Full height rack
						density:
							Math.random() < 0.3
								? "high"
								: Math.random() < 0.6
									? "medium"
									: "low",
						x: x,
						y: y,
						zone: rack < 5 ? "Zone-A" : "Zone-B",
						fan_speed: 60 + Math.random() * 30,
						status: "normal",
					});
				}
			}

			// Thermal sensors
			for (let i = 0; i < 20; i++) {
				const sensorId = `TEMP-${i + 1}`;
				sensors.set(sensorId, {
					id: sensorId,
					name: sensorId,
					temperature: 22 + (Math.random() - 0.5) * 8,
					humidity: 45 + (Math.random() - 0.5) * 15,
					airflow_velocity: 50 + Math.random() * 100,
					x: 10 + (i % 8) * 10,
					y: 8 + Math.floor(i / 8) * 12,
					zone: i % 8 < 4 ? "Zone-A" : "Zone-B",
					alert_threshold_high: 27,
					alert_threshold_low: 18,
					trend: "stable",
					history: Array(10)
						.fill(0)
						.map(() => 22 + (Math.random() - 0.5) * 4),
				});
			}

			// Cooling zones
			zones.set("Zone-A", {
				id: "Zone-A",
				name: "Zone A",
				x: 10,
				y: 5,
				width: 40,
				height: 45,
				target_temp: 22,
				actual_temp: 23,
				pue: 1.4,
				cooling_load: 200,
				type: "equipment",
			});

			zones.set("Zone-B", {
				id: "Zone-B",
				name: "Zone B",
				x: 55,
				y: 5,
				width: 40,
				height: 45,
				target_temp: 22,
				actual_temp: 23.5,
				pue: 1.45,
				cooling_load: 220,
				type: "equipment",
			});

			// Cold aisles
			for (let i = 0; i < 4; i += 2) {
				zones.set(`Cold-Aisle-${i + 1}`, {
					id: `Cold-Aisle-${i + 1}`,
					name: `Cold Aisle ${i + 1}`,
					x: 15,
					y: 8 + i * 10,
					width: 60,
					height: 3,
					target_temp: 20,
					actual_temp: 21,
					pue: 1.0,
					cooling_load: 0,
					type: "cold_aisle",
				});
			}

			// Hot aisles
			for (let i = 1; i < 4; i += 2) {
				zones.set(`Hot-Aisle-${i + 1}`, {
					id: `Hot-Aisle-${i + 1}`,
					name: `Hot Aisle ${i + 1}`,
					x: 15,
					y: 8 + i * 10,
					width: 60,
					height: 3,
					target_temp: 35,
					actual_temp: 32,
					pue: 1.0,
					cooling_load: 0,
					type: "hot_aisle",
				});
			}
		}

		coolingUnitsRef.current = coolingUnits;
		sensorsRef.current = sensors;
		racksRef.current = racks;
		zonesRef.current = zones;
	}, [datacenterLayout]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const resizeCanvas = () => {
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
		};

		const updateCoolingMetrics = () => {
			const coolingUnits = coolingUnitsRef.current;
			const sensors = sensorsRef.current;
			const racks = racksRef.current;
			const zones = zonesRef.current;
			const airFlows = airFlowsRef.current;
			const time = Date.now() / 1000;

			// Update server racks heat generation
			racks.forEach((rack) => {
				// Apply workload variations
				let heatMultiplier = 1.0;
				if (emergencyMode) {
					heatMultiplier = 0.3; // Emergency shutdown reduces heat
				} else {
					// Normal heat generation with daily cycles
					const dailyCycle = 0.8 + 0.4 * Math.sin(time * 0.1); // Business hours pattern
					heatMultiplier = dailyCycle + (Math.random() - 0.5) * 0.2;
				}

				const baseHeat =
					rack.density === "extreme"
						? 20
						: rack.density === "high"
							? 15
							: rack.density === "medium"
								? 10
								: 5;

				rack.heat_load = clamp(baseHeat * heatMultiplier, 2, 25);
				rack.power_usage = rack.heat_load * 1.1; // Include fan power

				// Calculate temperature rise
				rack.delta_t = rack.heat_load / 2; // Simplified thermal model
				rack.outlet_temp = rack.inlet_temp + rack.delta_t;

				// Determine rack status
				if (rack.inlet_temp > 27) {
					rack.status = "critical";
					rack.fan_speed = 100;
				} else if (rack.inlet_temp > 24) {
					rack.status = "warning";
					rack.fan_speed = 80;
				} else {
					rack.status = "normal";
					rack.fan_speed = 60 + (rack.heat_load / 20) * 40;
				}
			});

			// Update cooling units
			coolingUnits.forEach((unit) => {
				// Calculate required cooling based on nearby heat loads
				const nearbyRacks = Array.from(racks.values()).filter((rack) => {
					const distance = Math.sqrt(
						(rack.x - unit.x) ** 2 + (rack.y - unit.y) ** 2,
					);
					return distance < 50 && rack.zone === unit.zone;
				});

				const totalHeatLoad = nearbyRacks.reduce(
					(sum, rack) => sum + rack.heat_load,
					0,
				);
				const requiredCooling = totalHeatLoad * 1.2; // 20% safety factor

				// Adjust cooling output
				const loadRatio = Math.min(requiredCooling / unit.capacity, 1.0);
				unit.power_usage =
					unit.capacity * 0.15 + unit.capacity * 0.35 * loadRatio; // Variable power based on load

				// Apply cooling strategy effects
				if (coolingStrategy === "economizer") {
					if (outsideTemp < 15) {
						unit.power_usage *= 0.7; // Free cooling
						unit.efficiency = 8.0;
					}
				} else if (coolingStrategy === "containment") {
					unit.efficiency = 4.2; // Better efficiency with containment
				} else if (coolingStrategy === "liquid_cooling") {
					unit.efficiency = 6.0; // High efficiency liquid cooling
					unit.power_usage *= 0.8;
				}

				// Update temperature control
				const tempError = unit.actual_temp - unit.setpoint;
				if (Math.abs(tempError) > 0.5) {
					unit.actual_temp = lerp(unit.actual_temp, unit.setpoint, 0.1 * speed);
				}

				// Handle emergency mode
				if (emergencyMode) {
					unit.status = "emergency";
					unit.setpoint = 18; // Lower setpoint for emergency cooling
				} else if (unit.power_usage > unit.capacity * 0.9) {
					unit.status = "fault";
					unit.alarm_state = true;
				} else {
					unit.status = "running";
					unit.alarm_state = false;
				}

				unit.runtime_hours += speed / 3600;
			});

			// Update thermal sensors
			sensors.forEach((sensor) => {
				// Calculate temperature based on nearby heat sources and cooling
				const nearbyRacks = Array.from(racks.values()).filter((rack) => {
					const distance = Math.sqrt(
						(rack.x - sensor.x) ** 2 + (rack.y - sensor.y) ** 2,
					);
					return distance < 20;
				});

				const nearbyCooling = Array.from(coolingUnits.values()).filter(
					(unit) => {
						const distance = Math.sqrt(
							(unit.x - sensor.x) ** 2 + (unit.y - sensor.y) ** 2,
						);
						return distance < 30 && unit.zone === sensor.zone;
					},
				);

				// Heat contribution
				const heatContribution = nearbyRacks.reduce((sum, rack) => {
					const distance = Math.sqrt(
						(rack.x - sensor.x) ** 2 + (rack.y - sensor.y) ** 2,
					);
					return sum + rack.heat_load / Math.max(distance / 10, 1);
				}, 0);

				// Cooling contribution
				const coolingContribution = nearbyCooling.reduce((sum, unit) => {
					const distance = Math.sqrt(
						(unit.x - sensor.x) ** 2 + (unit.y - sensor.y) ** 2,
					);
					return sum + (unit.capacity * 0.1) / Math.max(distance / 15, 1);
				}, 0);

				const baseTemp = outsideTemp - 5; // Datacenter ambient
				const targetTemp = baseTemp + heatContribution - coolingContribution;

				sensor.temperature = lerp(sensor.temperature, targetTemp, 0.05 * speed);
				sensor.humidity = clamp(
					sensor.humidity + (Math.random() - 0.5) * 2,
					30,
					70,
				);
				sensor.airflow_velocity =
					50 + heatContribution * 5 + (Math.random() - 0.5) * 20;

				// Update trend
				const tempChange =
					sensor.temperature - sensor.history[sensor.history.length - 1];
				sensor.trend =
					tempChange > 0.5
						? "rising"
						: tempChange < -0.5
							? "falling"
							: "stable";

				// Update history
				sensor.history.push(sensor.temperature);
				if (sensor.history.length > 10) {
					sensor.history.shift();
				}
			});

			// Update zones
			zones.forEach((zone) => {
				const zoneSensors = Array.from(sensors.values()).filter(
					(s) =>
						s.zone === zone.id ||
						(s.x >= zone.x &&
							s.x <= zone.x + zone.width &&
							s.y >= zone.y &&
							s.y <= zone.y + zone.height),
				);

				if (zoneSensors.length > 0) {
					zone.actual_temp =
						zoneSensors.reduce((sum, s) => sum + s.temperature, 0) /
						zoneSensors.length;
				}

				const zoneRacks = Array.from(racks.values()).filter(
					(r) => r.zone === zone.id,
				);
				zone.cooling_load = zoneRacks.reduce((sum, r) => sum + r.heat_load, 0);

				// Calculate PUE for the zone
				const totalPower = zoneRacks.reduce((sum, r) => sum + r.power_usage, 0);
				const coolingPower = Array.from(coolingUnits.values())
					.filter((u) => u.zone === zone.id)
					.reduce((sum, u) => sum + u.power_usage, 0);

				zone.pue =
					totalPower > 0 ? (totalPower + coolingPower) / totalPower : 1.0;
			});

			// Generate airflow visualization
			if (showAirflow && Math.random() < 0.2 * speed) {
				coolingUnits.forEach((unit) => {
					if (unit.status === "running") {
						// Generate supply air
						airFlows.push({
							id: `flow-${unit.id}-${Date.now()}`,
							from_x: unit.x,
							from_y: unit.y,
							to_x: unit.x + 20 + Math.random() * 40,
							to_y: unit.y + 10 + Math.random() * 20,
							temperature: unit.actual_temp,
							velocity: unit.airflow / 1000,
							progress: 0,
							type: "supply",
						});
					}
				});

				// Generate hot air from racks
				racks.forEach((rack) => {
					if (Math.random() < 0.1) {
						airFlows.push({
							id: `flow-${rack.id}-${Date.now()}`,
							from_x: rack.x,
							from_y: rack.y,
							to_x: rack.x + (Math.random() - 0.5) * 30,
							to_y: rack.y - 15 + Math.random() * 10,
							temperature: rack.outlet_temp,
							velocity: rack.fan_speed / 10,
							progress: 0,
							type: "return",
						});
					}
				});
			}

			// Update airflow particles
			airFlowsRef.current = airFlows.filter((flow) => {
				flow.progress += 0.03 * speed * flow.velocity;
				return flow.progress < 1;
			});
		};

		const getTemperatureColor = (temperature: number, scheme: any) => {
			if (temperature < 18) return scheme.cold;
			if (temperature < 23) return scheme.cool;
			if (temperature < 27) return scheme.warm;
			if (temperature < 32) return scheme.hot;
			return scheme.critical;
		};

		const drawCoolingUnit = (unit: CoolingUnit, fontSize: number) => {
			const x = unit.x * fontSize;
			const y = unit.y * fontSize;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Unit representation
			let unitIcon = "❄️";
			if (unit.type === "crac") unitIcon = "🌀";
			else if (unit.type === "crah") unitIcon = "💨";
			else if (unit.type === "liquid") unitIcon = "💧";
			else if (unit.type === "chiller") unitIcon = "🧊";

			ctx.fillStyle =
				unit.status === "running"
					? scheme.cool
					: unit.status === "fault"
						? scheme.critical
						: scheme.warm;
			ctx.fillText(unitIcon, x, y);

			// Unit name and info
			ctx.fillStyle = scheme.text;
			ctx.fillText(unit.name, x + fontSize, y);
			ctx.fillText(`${unit.capacity}kW`, x + fontSize * 8, y);

			// Status indicator
			if (unit.alarm_state && Date.now() % 1000 < 500) {
				ctx.fillStyle = scheme.critical;
				ctx.fillText("⚠️", x - fontSize, y);
			}

			// Efficiency and power
			ctx.fillText(`COP:${unit.efficiency.toFixed(1)}`, x, y + fontSize);
			ctx.fillText(
				`${unit.power_usage.toFixed(0)}kW`,
				x + fontSize * 7,
				y + fontSize,
			);

			// Temperature display
			ctx.fillStyle = getTemperatureColor(unit.actual_temp, scheme);
			ctx.fillText(`${unit.actual_temp.toFixed(1)}°C`, x, y + fontSize * 2);

			// Setpoint
			ctx.fillStyle = scheme.text;
			ctx.fillText(`→${unit.setpoint}°C`, x + fontSize * 6, y + fontSize * 2);
		};

		const drawRack = (rack: ServerRack, fontSize: number) => {
			const x = rack.x * fontSize;
			const y = rack.y * fontSize;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Rack representation
			let rackColor = scheme.text;
			if (rack.status === "critical") rackColor = scheme.critical;
			else if (rack.status === "warning") rackColor = scheme.hot;
			else rackColor = getTemperatureColor(rack.inlet_temp, scheme);

			ctx.fillStyle = rackColor;
			ctx.fillText("▮", x, y);

			// Rack name
			ctx.fillStyle = scheme.text;
			ctx.fillText(rack.name, x + fontSize, y);

			// Heat load indicator
			const heatBars = Math.ceil(rack.heat_load / 5);
			ctx.fillStyle = getTemperatureColor(rack.outlet_temp, scheme);
			ctx.fillText("█".repeat(Math.min(heatBars, 5)), x + fontSize * 6, y);

			// Temperature info
			ctx.fillStyle = scheme.text;
			ctx.fillText(`${rack.inlet_temp.toFixed(0)}°C`, x, y + fontSize);
			ctx.fillText(
				`ΔT:${rack.delta_t.toFixed(0)}`,
				x + fontSize * 4,
				y + fontSize,
			);
			ctx.fillText(
				`${rack.heat_load.toFixed(0)}kW`,
				x + fontSize * 8,
				y + fontSize,
			);
		};

		const drawSensor = (sensor: ThermalSensor, fontSize: number) => {
			const x = sensor.x * fontSize;
			const y = sensor.y * fontSize;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Sensor icon
			ctx.fillStyle = getTemperatureColor(sensor.temperature, scheme);
			ctx.fillText("⊗", x, y);

			// Temperature display
			ctx.fillStyle = scheme.text;
			ctx.fillText(`${sensor.temperature.toFixed(1)}°`, x + fontSize, y);

			// Trend indicator
			const trendIcon =
				sensor.trend === "rising"
					? "↗"
					: sensor.trend === "falling"
						? "↘"
						: "→";
			ctx.fillText(trendIcon, x + fontSize * 6, y);

			// Alert state
			if (
				sensor.temperature > sensor.alert_threshold_high ||
				sensor.temperature < sensor.alert_threshold_low
			) {
				ctx.fillStyle = scheme.critical;
				ctx.fillText("!", x - fontSize * 0.5, y);
			}

			// Humidity
			ctx.fillStyle = scheme.text + "80";
			ctx.fillText(`${sensor.humidity.toFixed(0)}%H`, x, y + fontSize);
		};

		const drawZone = (zone: CoolingZone, fontSize: number) => {
			if (!showZones) return;

			const x = zone.x * fontSize;
			const y = zone.y * fontSize;
			const width = zone.width * fontSize;
			const height = zone.height * fontSize;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Zone outline
			ctx.strokeStyle =
				zone.type === "cold_aisle"
					? scheme.cold
					: zone.type === "hot_aisle"
						? scheme.hot
						: scheme.text + "60";
			ctx.lineWidth = 2;
			ctx.strokeRect(x, y, width, height);

			// Zone label
			ctx.fillStyle = scheme.text;
			ctx.fillText(zone.name, x + 2, y - fontSize * 0.5);
			ctx.fillText(
				`PUE:${zone.pue.toFixed(2)}`,
				x + width - fontSize * 8,
				y - fontSize * 0.5,
			);

			// Temperature info
			ctx.fillStyle = getTemperatureColor(zone.actual_temp, scheme);
			ctx.fillText(
				`${zone.actual_temp.toFixed(1)}°C`,
				x + 2,
				y + height - fontSize * 0.5,
			);
		};

		const drawAirflow = (fontSize: number) => {
			if (!showAirflow) return;

			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			airFlowsRef.current.forEach((flow) => {
				const x = lerp(flow.from_x, flow.to_x, flow.progress) * fontSize;
				const y = lerp(flow.from_y, flow.to_y, flow.progress) * fontSize;

				let flowColor = scheme.flow;
				if (flow.type === "supply") {
					flowColor = getTemperatureColor(flow.temperature, scheme);
				} else if (flow.type === "return") {
					flowColor = scheme.hot;
				}

				ctx.fillStyle = flowColor;

				// Different symbols for different flow types
				let symbol = "●";
				if (flow.type === "supply") symbol = "○";
				else if (flow.type === "return") symbol = "◦";
				else if (flow.type === "exhaust") symbol = "×";

				ctx.fillText(symbol, x, y);
			});
		};

		const animate = () => {
			if (!isPlaying) return;

			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];
			const fontSize = 8;

			// Clear canvas
			ctx.fillStyle = scheme.bg;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			ctx.font = '8px "Courier New", monospace';
			ctx.textBaseline = "top";

			// Update metrics
			if (Math.random() < 0.1 * speed) {
				updateCoolingMetrics();
			}

			// Draw zones first (background)
			zonesRef.current.forEach((zone) => {
				drawZone(zone, fontSize);
			});

			// Draw airflow
			drawAirflow(fontSize);

			// Draw infrastructure
			coolingUnitsRef.current.forEach((unit) => {
				drawCoolingUnit(unit, fontSize);
			});

			racksRef.current.forEach((rack) => {
				drawRack(rack, fontSize);
			});

			if (showSensors) {
				sensorsRef.current.forEach((sensor) => {
					drawSensor(sensor, fontSize);
				});
			}

			// Draw statistics
			const units = Array.from(coolingUnitsRef.current.values());
			const racks = Array.from(racksRef.current.values());
			const sensors = Array.from(sensorsRef.current.values());

			const totalCoolingCapacity = units.reduce(
				(sum, u) => sum + u.capacity,
				0,
			);
			const totalCoolingPower = units.reduce(
				(sum, u) => sum + u.power_usage,
				0,
			);
			const totalHeatLoad = racks.reduce((sum, r) => sum + r.heat_load, 0);
			const totalITPower = racks.reduce((sum, r) => sum + r.power_usage, 0);
			const avgTemp =
				sensors.reduce((sum, s) => sum + s.temperature, 0) / sensors.length;
			const overTempSensors = sensors.filter(
				(s) => s.temperature > s.alert_threshold_high,
			).length;
			const currentPUE =
				totalITPower > 0
					? (totalITPower + totalCoolingPower) / totalITPower
					: 1.0;
			const coolingEfficiency =
				totalHeatLoad > 0 ? (totalCoolingCapacity / totalHeatLoad) * 100 : 0;

			ctx.fillStyle = scheme.text;
			ctx.fillText(
				`Datacenter Cooling System - ${datacenterLayout.toUpperCase()} | Strategy: ${coolingStrategy}`,
				10,
				canvas.height - 140,
			);
			ctx.fillText(
				`Cooling: ${totalCoolingCapacity}kW capacity | ${totalCoolingPower.toFixed(0)}kW power | ${coolingEfficiency.toFixed(0)}% efficiency`,
				10,
				canvas.height - 125,
			);
			ctx.fillText(
				`Heat Load: ${totalHeatLoad.toFixed(0)}kW | IT Power: ${totalITPower.toFixed(0)}kW | Outside: ${outsideTemp}°C`,
				10,
				canvas.height - 110,
			);
			ctx.fillText(
				`PUE: ${currentPUE.toFixed(2)} (Target: ${targetPUE}) | Avg Temp: ${avgTemp.toFixed(1)}°C | Alerts: ${overTempSensors}`,
				10,
				canvas.height - 95,
			);
			ctx.fillText(
				`Display: ${displayMode} | Emergency: ${emergencyMode ? "ACTIVE" : "NORMAL"} | Airflows: ${airFlowsRef.current.length}`,
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
		datacenterLayout,
		coolingStrategy,
		colorScheme,
		showAirflow,
		showSensors,
		showZones,
		emergencyMode,
		outsideTemp,
		targetPUE,
	]);

	return (
		<div className="flex flex-col h-screen bg-black">
			<div className="flex-shrink-0 bg-gray-900 p-4 border-b border-gray-700">
				<h1 className="text-2xl font-bold text-cyan-400 mb-4">
					❄️ ASCII Datacenter Cooling System
				</h1>

				<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-sm mb-4">
					<div className="flex flex-col">
						<label className="text-cyan-300 mb-2">Animation</label>
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
						<label className="text-cyan-300 mb-2">
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
						<label className="text-cyan-300 mb-2">Datacenter Layout</label>
						<select
							value={datacenterLayout}
							onChange={(e) => setDatacenterLayout(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-cyan-300 rounded border border-gray-600"
						>
							<option value="raised_floor">Raised Floor</option>
							<option value="hard_floor">Hard Floor</option>
							<option value="containment">Containment</option>
							<option value="modular">Modular</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-cyan-300 mb-2">Cooling Strategy</label>
						<select
							value={coolingStrategy}
							onChange={(e) => setCoolingStrategy(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-cyan-300 rounded border border-gray-600"
						>
							<option value="traditional">Traditional</option>
							<option value="economizer">Economizer</option>
							<option value="containment">Containment</option>
							<option value="liquid_cooling">Liquid Cooling</option>
							<option value="immersion">Immersion</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-cyan-300 mb-2">Display Mode</label>
						<select
							value={displayMode}
							onChange={(e) => setDisplayMode(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-cyan-300 rounded border border-gray-600"
						>
							<option value="temperature">Temperature</option>
							<option value="power">Power Usage</option>
							<option value="efficiency">Efficiency</option>
							<option value="airflow">Airflow</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-cyan-300 mb-2">Color Scheme</label>
						<select
							value={colorScheme}
							onChange={(e) => setColorScheme(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-cyan-300 rounded border border-gray-600"
						>
							<option value="thermal">Thermal</option>
							<option value="datacenter">Datacenter</option>
							<option value="efficiency">Efficiency</option>
							<option value="night_vision">Night Vision</option>
							<option value="arctic">Arctic</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-cyan-300 mb-2">
							Outside Temp: {outsideTemp}°C
						</label>
						<input
							type="range"
							min="-10"
							max="45"
							step="1"
							value={outsideTemp}
							onChange={(e) => setOutsideTemp(Number.parseInt(e.target.value))}
							className="w-full"
						/>
					</div>

					<div className="flex flex-col">
						<label className="text-cyan-300 mb-2">
							Target PUE: {targetPUE}
						</label>
						<input
							type="range"
							min="1.1"
							max="3.0"
							step="0.1"
							value={targetPUE}
							onChange={(e) => setTargetPUE(Number.parseFloat(e.target.value))}
							className="w-full"
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
					<label className="flex items-center text-cyan-300">
						<input
							type="checkbox"
							checked={showAirflow}
							onChange={(e) => setShowAirflow(e.target.checked)}
							className="mr-2"
						/>
						Show Airflow
					</label>
					<label className="flex items-center text-cyan-300">
						<input
							type="checkbox"
							checked={showSensors}
							onChange={(e) => setShowSensors(e.target.checked)}
							className="mr-2"
						/>
						Show Sensors
					</label>
					<label className="flex items-center text-cyan-300">
						<input
							type="checkbox"
							checked={showZones}
							onChange={(e) => setShowZones(e.target.checked)}
							className="mr-2"
						/>
						Show Zones
					</label>
					<label className="flex items-center text-cyan-300">
						<input
							type="checkbox"
							checked={emergencyMode}
							onChange={(e) => setEmergencyMode(e.target.checked)}
							className="mr-2"
						/>
						Emergency Mode
					</label>
				</div>

				<div className="mt-4 text-cyan-400 text-sm">
					<p>
						❄️ <strong>Advanced datacenter cooling system</strong> with CRAC
						units, thermal sensors, and PUE monitoring!
					</p>
					<p>
						🌡️ <strong>Real-time thermal management</strong> - hot/cold aisle
						containment, economizer mode, liquid cooling!
					</p>
					<p>
						⚡ <strong>Energy efficiency optimization</strong> with Power Usage
						Effectiveness (PUE) tracking and alerts!
					</p>
					<p>
						Monitor CRAC/CRAH units, server heat loads, airflow patterns, and
						thermal zones in real-time
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
