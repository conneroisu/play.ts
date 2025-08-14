import { Link, createFileRoute } from "@tanstack/react-router";
import {
	PI,
	TWO_PI,
	clamp,
	cos,
	hsl,
	hslToRgb,
	lerp,
	sin,
	toCssHsl,
} from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute(
	"/examples/engineering/traffic-flow-optimization",
)({
	component: TrafficFlowExample,
});

interface Intersection {
	id: string;
	name: string;
	x: number;
	y: number;
	signalPhases: SignalPhase[];
	currentPhase: number;
	cycleTime: number; // seconds
	elapsedTime: number;
	queueLengths: { [direction: string]: number };
	throughput: { [direction: string]: number };
	delay: number; // average delay in seconds
	levelOfService: "A" | "B" | "C" | "D" | "E" | "F";
}

interface SignalPhase {
	id: string;
	name: string;
	duration: number; // seconds
	movements: string[]; // ['north', 'south', 'east', 'west']
	color: "red" | "yellow" | "green";
}

interface Road {
	id: string;
	from: string;
	to: string;
	lanes: number;
	capacity: number; // vehicles per hour per lane
	speed: number; // km/h
	length: number; // meters
	volume: number; // vehicles per hour
	density: number; // vehicles per km
	occupancy: number; // percentage
	flowRate: number; // vehicles per second
	congestionLevel: "free" | "stable" | "unstable" | "jammed";
}

interface Vehicle {
	id: string;
	x: number;
	y: number;
	direction: number; // radians
	speed: number; // m/s
	road: string;
	color: string;
	type: "car" | "truck" | "bus";
}

interface TrafficMetrics {
	totalVolume: number;
	averageSpeed: number;
	totalDelay: number;
	fuelConsumption: number; // liters per hour
	emissions: number; // kg CO2 per hour
	economicCost: number; // $ per hour
	networkEfficiency: number; // percentage
}

function TrafficFlowExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const [intersections, setIntersections] = useState<Intersection[]>([
		{
			id: "int1",
			name: "Main & 1st",
			x: 200,
			y: 200,
			currentPhase: 0,
			cycleTime: 90,
			elapsedTime: 0,
			queueLengths: { north: 5, south: 3, east: 8, west: 6 },
			throughput: { north: 450, south: 380, east: 520, west: 410 },
			delay: 25,
			levelOfService: "C",
			signalPhases: [
				{
					id: "p1",
					name: "NS Green",
					duration: 35,
					movements: ["north", "south"],
					color: "green",
				},
				{
					id: "p2",
					name: "NS Yellow",
					duration: 5,
					movements: ["north", "south"],
					color: "yellow",
				},
				{
					id: "p3",
					name: "EW Green",
					duration: 40,
					movements: ["east", "west"],
					color: "green",
				},
				{
					id: "p4",
					name: "EW Yellow",
					duration: 5,
					movements: ["east", "west"],
					color: "yellow",
				},
				{ id: "p5", name: "All Red", duration: 5, movements: [], color: "red" },
			],
		},
		{
			id: "int2",
			name: "Main & 2nd",
			x: 400,
			y: 200,
			currentPhase: 2,
			cycleTime: 100,
			elapsedTime: 30,
			queueLengths: { north: 12, south: 8, east: 4, west: 15 },
			throughput: { north: 380, south: 420, east: 650, west: 350 },
			delay: 32,
			levelOfService: "D",
			signalPhases: [
				{
					id: "p1",
					name: "NS Green",
					duration: 30,
					movements: ["north", "south"],
					color: "green",
				},
				{
					id: "p2",
					name: "NS Yellow",
					duration: 5,
					movements: ["north", "south"],
					color: "yellow",
				},
				{
					id: "p3",
					name: "EW Green",
					duration: 50,
					movements: ["east", "west"],
					color: "green",
				},
				{
					id: "p4",
					name: "EW Yellow",
					duration: 5,
					movements: ["east", "west"],
					color: "yellow",
				},
				{
					id: "p5",
					name: "All Red",
					duration: 10,
					movements: [],
					color: "red",
				},
			],
		},
		{
			id: "int3",
			name: "1st & Oak",
			x: 200,
			y: 350,
			currentPhase: 1,
			cycleTime: 80,
			elapsedTime: 60,
			queueLengths: { north: 7, south: 9, east: 11, west: 5 },
			throughput: { north: 340, south: 290, east: 480, west: 310 },
			delay: 28,
			levelOfService: "C",
			signalPhases: [
				{
					id: "p1",
					name: "NS Green",
					duration: 40,
					movements: ["north", "south"],
					color: "green",
				},
				{
					id: "p2",
					name: "NS Yellow",
					duration: 5,
					movements: ["north", "south"],
					color: "yellow",
				},
				{
					id: "p3",
					name: "EW Green",
					duration: 25,
					movements: ["east", "west"],
					color: "green",
				},
				{
					id: "p4",
					name: "EW Yellow",
					duration: 5,
					movements: ["east", "west"],
					color: "yellow",
				},
				{ id: "p5", name: "All Red", duration: 5, movements: [], color: "red" },
			],
		},
	]);

	const [roads, setRoads] = useState<Road[]>([
		{
			id: "main_1_2",
			from: "int1",
			to: "int2",
			lanes: 3,
			capacity: 1800,
			speed: 50,
			length: 500,
			volume: 1200,
			density: 24,
			occupancy: 65,
			flowRate: 0.33,
			congestionLevel: "stable",
		},
		{
			id: "main_2_1",
			from: "int2",
			to: "int1",
			lanes: 3,
			capacity: 1800,
			speed: 45,
			length: 500,
			volume: 1100,
			density: 26,
			occupancy: 58,
			flowRate: 0.31,
			congestionLevel: "stable",
		},
		{
			id: "first_1_3",
			from: "int1",
			to: "int3",
			lanes: 2,
			capacity: 1200,
			speed: 40,
			length: 400,
			volume: 800,
			density: 32,
			occupancy: 75,
			flowRate: 0.22,
			congestionLevel: "unstable",
		},
		{
			id: "first_3_1",
			from: "int3",
			to: "int1",
			lanes: 2,
			capacity: 1200,
			speed: 35,
			length: 400,
			volume: 750,
			density: 35,
			occupancy: 70,
			flowRate: 0.21,
			congestionLevel: "unstable",
		},
	]);

	const [vehicles, setVehicles] = useState<Vehicle[]>([]);

	const [systemSettings, setSystemSettings] = useState({
		simulationSpeed: 1.0,
		trafficDemand: 1.0, // multiplier for base demand
		signalOptimization: "fixed" as "fixed" | "adaptive" | "coordinated",
		timeOfDay: "peak" as "peak" | "offpeak" | "night",
		weatherCondition: "clear" as "clear" | "rain" | "snow",
		incidentActive: false,
		emergencyVehicles: false,
		constructionZones: 0,
	});

	const [displaySettings, setDisplaySettings] = useState({
		showQueues: true,
		showTrafficSignals: true,
		showVehicles: true,
		showFlowRates: true,
		showDelays: true,
		showLevelOfService: true,
		animateVehicles: true,
		showOptimization: false,
	});

	const [metrics, setMetrics] = useState<TrafficMetrics | null>(null);
	const [time, setTime] = useState(0);
	const [isSimulating, setIsSimulating] = useState(false);

	// Generate vehicles for animation
	const generateVehicles = () => {
		const newVehicles: Vehicle[] = [];
		const vehicleCount = Math.floor(30 * systemSettings.trafficDemand);

		roads.forEach((road) => {
			const vehiclesOnRoad = Math.floor((vehicleCount * road.volume) / 3000); // Distribute based on volume

			for (let i = 0; i < vehiclesOnRoad; i++) {
				const fromInt = intersections.find((int) => int.id === road.from);
				const toInt = intersections.find((int) => int.id === road.to);

				if (!fromInt || !toInt) continue;

				const progress = Math.random();
				const x = lerp(fromInt.x, toInt.x, progress);
				const y = lerp(fromInt.y, toInt.y, progress);
				const direction = Math.atan2(toInt.y - fromInt.y, toInt.x - fromInt.x);

				const vehicleTypes = ["car", "car", "car", "truck", "bus"] as const;
				const type =
					vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];

				const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];
				const color = colors[Math.floor(Math.random() * colors.length)];

				newVehicles.push({
					id: `vehicle_${i}_${road.id}`,
					x,
					y,
					direction,
					speed: (road.speed / 3.6) * (0.8 + Math.random() * 0.4), // Convert km/h to m/s with variation
					road: road.id,
					color,
					type,
				});
			}
		});

		setVehicles(newVehicles);
	};

	// Calculate traffic flow using Greenshields model
	const calculateTrafficFlow = (road: Road): Road => {
		const jamDensity = 120; // vehicles per km
		const freeFlowSpeed = road.speed; // km/h

		// Apply demand multiplier and conditions
		let demandMultiplier = systemSettings.trafficDemand;

		if (systemSettings.timeOfDay === "peak") demandMultiplier *= 1.2;
		else if (systemSettings.timeOfDay === "night") demandMultiplier *= 0.3;

		if (systemSettings.weatherCondition === "rain") demandMultiplier *= 0.85;
		else if (systemSettings.weatherCondition === "snow")
			demandMultiplier *= 0.6;

		if (systemSettings.incidentActive) demandMultiplier *= 0.7;

		const adjustedVolume = road.volume * demandMultiplier;
		const density = adjustedVolume / freeFlowSpeed; // Simplified calculation
		const actualDensity = Math.min(density, jamDensity);

		// Greenshields model: v = vf(1 - k/kj)
		const currentSpeed = freeFlowSpeed * (1 - actualDensity / jamDensity);
		const flowRate = (actualDensity * currentSpeed) / 3600; // Convert to vehicles per second

		// Determine congestion level
		let congestionLevel: Road["congestionLevel"] = "free";
		const densityRatio = actualDensity / jamDensity;

		if (densityRatio > 0.8) congestionLevel = "jammed";
		else if (densityRatio > 0.6) congestionLevel = "unstable";
		else if (densityRatio > 0.3) congestionLevel = "stable";

		return {
			...road,
			volume: adjustedVolume,
			density: actualDensity,
			speed: Math.max(currentSpeed, 5), // Minimum speed
			flowRate,
			occupancy: (actualDensity / jamDensity) * 100,
			congestionLevel,
		};
	};

	// Update signal timing for optimization
	const optimizeSignalTiming = (intersection: Intersection): Intersection => {
		if (systemSettings.signalOptimization === "fixed") return intersection;

		// Adaptive signal control based on queue lengths
		if (systemSettings.signalOptimization === "adaptive") {
			const phases = [...intersection.signalPhases];
			const totalEWDemand =
				intersection.queueLengths.east + intersection.queueLengths.west;
			const totalNSDemand =
				intersection.queueLengths.north + intersection.queueLengths.south;

			if (totalEWDemand > totalNSDemand * 1.5) {
				// Increase EW green time
				phases[2].duration = Math.min(phases[2].duration + 5, 60);
				phases[0].duration = Math.max(phases[0].duration - 5, 20);
			} else if (totalNSDemand > totalEWDemand * 1.5) {
				// Increase NS green time
				phases[0].duration = Math.min(phases[0].duration + 5, 60);
				phases[2].duration = Math.max(phases[2].duration - 5, 20);
			}

			return { ...intersection, signalPhases: phases };
		}

		return intersection;
	};

	// Calculate intersection delay using Webster's formula
	const calculateIntersectionDelay = (intersection: Intersection): number => {
		const currentPhase = intersection.signalPhases[intersection.currentPhase];
		const cycleTime = intersection.signalPhases.reduce(
			(sum, phase) => sum + phase.duration,
			0,
		);

		let totalDelay = 0;
		Object.entries(intersection.queueLengths).forEach(
			([direction, queueLength]) => {
				const arrivalRate = intersection.throughput[direction] / 3600; // vehicles per second

				// Find effective green time for this direction
				let effectiveGreen = 0;
				intersection.signalPhases.forEach((phase) => {
					if (phase.movements.includes(direction) && phase.color === "green") {
						effectiveGreen += phase.duration;
					}
				});

				const greenRatio = effectiveGreen / cycleTime;
				const capacity = greenRatio * 0.5; // vehicles per second (simplified)

				if (capacity > arrivalRate) {
					// Webster's delay formula
					const delay =
						(cycleTime * Math.pow(1 - greenRatio, 2)) /
						(2 * (1 - (greenRatio * arrivalRate) / capacity));
					totalDelay += delay * arrivalRate;
				} else {
					totalDelay += 60; // Oversaturated condition
				}
			},
		);

		return totalDelay / 4; // Average across directions
	};

	// Determine Level of Service
	const calculateLevelOfService = (
		delay: number,
	): Intersection["levelOfService"] => {
		if (delay <= 10) return "A";
		if (delay <= 20) return "B";
		if (delay <= 35) return "C";
		if (delay <= 55) return "D";
		if (delay <= 80) return "E";
		return "F";
	};

	// Calculate system-wide metrics
	const calculateSystemMetrics = (): TrafficMetrics => {
		const totalVolume = roads.reduce((sum, road) => sum + road.volume, 0);
		const weightedSpeed =
			roads.reduce((sum, road) => sum + road.speed * road.volume, 0) /
			totalVolume;
		const totalDelay = intersections.reduce((sum, int) => sum + int.delay, 0);

		// Fuel consumption (liters per 100km base) adjusted for speed and congestion
		const baseFuelRate = 8; // liters per 100km
		const speedFactor = Math.max(0.8, 100 / weightedSpeed); // Lower speeds = higher consumption
		const congestionFactor =
			roads.reduce((sum, road) => {
				const factor =
					road.congestionLevel === "jammed"
						? 1.5
						: road.congestionLevel === "unstable"
							? 1.3
							: 1.0;
				return sum + factor * road.volume;
			}, 0) / totalVolume;

		const fuelConsumption =
			(totalVolume * baseFuelRate * speedFactor * congestionFactor) / 1000;

		// Emissions (kg CO2 per liter of fuel * 2.3)
		const emissions = fuelConsumption * 2.3;

		// Economic cost (fuel + time cost)
		const fuelCost = fuelConsumption * 1.5; // $ per liter
		const timeCost = (totalDelay / 3600) * totalVolume * 25; // $25 per hour value of time
		const economicCost = fuelCost + timeCost;

		// Network efficiency (inverse of relative delay)
		const networkEfficiency = Math.max(
			0,
			100 - (totalDelay / intersections.length) * 2,
		);

		return {
			totalVolume,
			averageSpeed: weightedSpeed,
			totalDelay,
			fuelConsumption,
			emissions,
			economicCost,
			networkEfficiency,
		};
	};

	const render = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw roads
		roads.forEach((road) => {
			const fromInt = intersections.find((int) => int.id === road.from);
			const toInt = intersections.find((int) => int.id === road.to);

			if (!fromInt || !toInt) return;

			// Road color based on congestion level
			let roadColor = "#6b7280";
			switch (road.congestionLevel) {
				case "free":
					roadColor = "#10b981";
					break;
				case "stable":
					roadColor = "#f59e0b";
					break;
				case "unstable":
					roadColor = "#ef4444";
					break;
				case "jammed":
					roadColor = "#7c2d12";
					break;
			}

			// Road width based on number of lanes
			const roadWidth = road.lanes * 8;

			ctx.strokeStyle = roadColor;
			ctx.lineWidth = roadWidth;
			ctx.lineCap = "round";
			ctx.beginPath();
			ctx.moveTo(fromInt.x, fromInt.y);
			ctx.lineTo(toInt.x, toInt.y);
			ctx.stroke();

			// Lane dividers
			ctx.strokeStyle = "#ffffff";
			ctx.lineWidth = 1;
			ctx.setLineDash([10, 10]);
			for (let i = 1; i < road.lanes; i++) {
				const offset = (i - road.lanes / 2 + 0.5) * 8;
				const perpX =
					(-(toInt.y - fromInt.y) /
						Math.sqrt(
							(toInt.x - fromInt.x) ** 2 + (toInt.y - fromInt.y) ** 2,
						)) *
					offset;
				const perpY =
					((toInt.x - fromInt.x) /
						Math.sqrt(
							(toInt.x - fromInt.x) ** 2 + (toInt.y - fromInt.y) ** 2,
						)) *
					offset;

				ctx.beginPath();
				ctx.moveTo(fromInt.x + perpX, fromInt.y + perpY);
				ctx.lineTo(toInt.x + perpX, toInt.y + perpY);
				ctx.stroke();
			}
			ctx.setLineDash([]);

			// Flow rate labels
			if (displaySettings.showFlowRates) {
				const midX = (fromInt.x + toInt.x) / 2;
				const midY = (fromInt.y + toInt.y) / 2;

				ctx.fillStyle = "#1f2937";
				ctx.font = "11px Arial";
				ctx.textAlign = "center";
				ctx.fillText(`${road.volume} vph`, midX, midY - 15);
				ctx.fillText(`${road.speed.toFixed(0)} km/h`, midX, midY);
				ctx.fillText(`${road.occupancy.toFixed(0)}%`, midX, midY + 15);
			}
		});

		// Draw vehicles
		if (displaySettings.showVehicles) {
			vehicles.forEach((vehicle) => {
				ctx.save();
				ctx.translate(vehicle.x, vehicle.y);
				ctx.rotate(vehicle.direction);

				ctx.fillStyle = vehicle.color;

				if (vehicle.type === "car") {
					ctx.fillRect(-6, -3, 12, 6);
				} else if (vehicle.type === "truck") {
					ctx.fillRect(-10, -4, 20, 8);
				} else if (vehicle.type === "bus") {
					ctx.fillRect(-12, -5, 24, 10);
				}

				ctx.restore();
			});
		}

		// Draw intersections
		intersections.forEach((intersection) => {
			// Intersection background
			ctx.fillStyle = "#f3f4f6";
			ctx.strokeStyle = "#6b7280";
			ctx.lineWidth = 2;

			const size = 40;
			ctx.fillRect(
				intersection.x - size / 2,
				intersection.y - size / 2,
				size,
				size,
			);
			ctx.strokeRect(
				intersection.x - size / 2,
				intersection.y - size / 2,
				size,
				size,
			);

			// Traffic signals
			if (displaySettings.showTrafficSignals) {
				const currentPhase =
					intersection.signalPhases[intersection.currentPhase];

				// Signal lights for each direction
				const directions = [
					{ x: intersection.x, y: intersection.y - 30, movements: ["north"] },
					{ x: intersection.x, y: intersection.y + 30, movements: ["south"] },
					{ x: intersection.x - 30, y: intersection.y, movements: ["west"] },
					{ x: intersection.x + 30, y: intersection.y, movements: ["east"] },
				];

				directions.forEach((dir) => {
					const hasMovement = currentPhase.movements.some((m) =>
						dir.movements.includes(m),
					);
					const lightColor = hasMovement ? currentPhase.color : "red";

					// Signal housing
					ctx.fillStyle = "#374151";
					ctx.fillRect(dir.x - 4, dir.y - 6, 8, 12);

					// Signal light
					ctx.fillStyle =
						lightColor === "green"
							? "#10b981"
							: lightColor === "yellow"
								? "#f59e0b"
								: "#ef4444";
					ctx.beginPath();
					ctx.arc(dir.x, dir.y, 3, 0, TWO_PI);
					ctx.fill();
				});
			}

			// Queue lengths
			if (displaySettings.showQueues) {
				const queueScale = 3;
				Object.entries(intersection.queueLengths).forEach(
					([direction, length]) => {
						let queueX = intersection.x;
						let queueY = intersection.y;
						let queueWidth = 6;
						let queueHeight = length * queueScale;

						switch (direction) {
							case "north":
								queueX -= 3;
								queueY -= size / 2 + queueHeight;
								break;
							case "south":
								queueX -= 3;
								queueY += size / 2;
								break;
							case "east":
								queueX += size / 2;
								queueY -= 3;
								queueWidth = queueHeight;
								queueHeight = 6;
								break;
							case "west":
								queueX -= size / 2 + queueHeight;
								queueY -= 3;
								queueWidth = queueHeight;
								queueHeight = 6;
								break;
						}

						ctx.fillStyle = "rgba(239, 68, 68, 0.6)";
						ctx.fillRect(queueX, queueY, queueWidth, queueHeight);
					},
				);
			}

			// Intersection labels
			ctx.fillStyle = "#1f2937";
			ctx.font = "bold 12px Arial";
			ctx.textAlign = "center";
			ctx.fillText(intersection.name, intersection.x, intersection.y - 55);

			// Level of service
			if (displaySettings.showLevelOfService) {
				const losColor =
					intersection.levelOfService <= "B"
						? "#10b981"
						: intersection.levelOfService <= "D"
							? "#f59e0b"
							: "#ef4444";

				ctx.fillStyle = losColor;
				ctx.font = "bold 14px Arial";
				ctx.fillText(
					`LOS ${intersection.levelOfService}`,
					intersection.x,
					intersection.y + 55,
				);
			}

			// Delay display
			if (displaySettings.showDelays) {
				ctx.fillStyle = "#6b7280";
				ctx.font = "10px Arial";
				ctx.fillText(
					`${intersection.delay.toFixed(0)}s delay`,
					intersection.x,
					intersection.y + 70,
				);
			}
		});

		// Legend
		ctx.fillStyle = "#1f2937";
		ctx.font = "14px Arial";
		ctx.textAlign = "left";
		ctx.fillText("Traffic Flow Network", 20, 30);

		ctx.font = "11px Arial";
		ctx.fillText(
			"Road Colors: Free (Green), Stable (Yellow), Unstable (Red), Jammed (Dark Red)",
			20,
			50,
		);
		ctx.fillText(
			"Signal Phases: Green (Go), Yellow (Caution), Red (Stop)",
			20,
			65,
		);

		if (displaySettings.showQueues) {
			ctx.fillText("Red bars: Vehicle queues at intersections", 20, 80);
		}
	};

	const updateSimulation = () => {
		if (!isSimulating) return;

		// Update signal timing
		setIntersections((prev) =>
			prev.map((intersection) => {
				const newElapsedTime =
					intersection.elapsedTime + systemSettings.simulationSpeed;
				const cycleTime = intersection.signalPhases.reduce(
					(sum, phase) => sum + phase.duration,
					0,
				);

				let currentPhase = intersection.currentPhase;
				const phaseElapsed = newElapsedTime;

				// Calculate current phase
				let totalTime = 0;
				for (let i = 0; i < intersection.signalPhases.length; i++) {
					totalTime += intersection.signalPhases[i].duration;
					if (newElapsedTime % cycleTime < totalTime) {
						currentPhase = i;
						break;
					}
				}

				const optimizedIntersection = optimizeSignalTiming({
					...intersection,
					currentPhase,
					elapsedTime: newElapsedTime % cycleTime,
				});

				// Update delay and level of service
				const delay = calculateIntersectionDelay(optimizedIntersection);
				const levelOfService = calculateLevelOfService(delay);

				return {
					...optimizedIntersection,
					delay,
					levelOfService,
				};
			}),
		);

		// Update road conditions
		setRoads((prev) => prev.map(calculateTrafficFlow));

		// Update vehicles
		if (displaySettings.animateVehicles) {
			setVehicles((prev) =>
				prev.map((vehicle) => {
					const road = roads.find((r) => r.id === vehicle.road);
					if (!road) return vehicle;

					const fromInt = intersections.find((int) => int.id === road.from);
					const toInt = intersections.find((int) => int.id === road.to);
					if (!fromInt || !toInt) return vehicle;

					// Calculate new position
					const distance = Math.sqrt(
						(toInt.x - fromInt.x) ** 2 + (toInt.y - fromInt.y) ** 2,
					);
					const speed = (vehicle.speed * systemSettings.simulationSpeed) / 10; // Scale for animation
					const deltaDistance = speed;

					const currentDistance = Math.sqrt(
						(vehicle.x - fromInt.x) ** 2 + (vehicle.y - fromInt.y) ** 2,
					);
					const newDistance = currentDistance + deltaDistance;

					if (newDistance >= distance) {
						// Vehicle reached intersection, respawn at beginning
						return {
							...vehicle,
							x: fromInt.x,
							y: fromInt.y,
						};
					}

					const progress = newDistance / distance;
					return {
						...vehicle,
						x: lerp(fromInt.x, toInt.x, progress),
						y: lerp(fromInt.y, toInt.y, progress),
					};
				}),
			);
		}

		// Update metrics
		setMetrics(calculateSystemMetrics());
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.width = 800;
		canvas.height = 500;

		generateVehicles();
		setMetrics(calculateSystemMetrics());
	}, []);

	useEffect(() => {
		render();
	}, [intersections, roads, vehicles, displaySettings]);

	useEffect(() => {
		generateVehicles();
	}, [systemSettings.trafficDemand, roads]);

	useEffect(() => {
		if (!isSimulating) return;

		const interval = setInterval(updateSimulation, 100);
		return () => clearInterval(interval);
	}, [isSimulating, systemSettings.simulationSpeed]);

	const updateIntersection = (intId: string, field: string, value: any) => {
		setIntersections((prev) =>
			prev.map((int) => (int.id === intId ? { ...int, [field]: value } : int)),
		);
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Traffic Flow Optimization System
				</h1>
				<p className="text-gray-600 mb-4">
					Advanced traffic engineering tool for signal optimization, congestion
					analysis, and network performance evaluation.
				</p>
				<div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
					<p className="text-slate-800">
						🚦 Intelligent transportation systems - adaptive signals, flow
						modeling, and real-time optimization
					</p>
				</div>
			</div>

			{/* Simulation Controls */}
			<div className="mb-6">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold">Simulation Controls</h3>
					<button
						onClick={() => setIsSimulating(!isSimulating)}
						className={`px-4 py-2 rounded-lg text-white font-medium ${
							isSimulating
								? "bg-red-600 hover:bg-red-700"
								: "bg-green-600 hover:bg-green-700"
						} transition-colors`}
					>
						{isSimulating ? "Stop Simulation" : "Start Simulation"}
					</button>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Traffic Demand: {(systemSettings.trafficDemand * 100).toFixed(0)}%
						</label>
						<input
							type="range"
							min="0.3"
							max="2.0"
							step="0.1"
							value={systemSettings.trafficDemand}
							onChange={(e) =>
								setSystemSettings((prev) => ({
									...prev,
									trafficDemand: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Time of Day
						</label>
						<select
							value={systemSettings.timeOfDay}
							onChange={(e) =>
								setSystemSettings((prev) => ({
									...prev,
									timeOfDay: e.target.value as typeof systemSettings.timeOfDay,
								}))
							}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
						>
							<option value="peak">Peak Hours</option>
							<option value="offpeak">Off-Peak</option>
							<option value="night">Night</option>
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Weather
						</label>
						<select
							value={systemSettings.weatherCondition}
							onChange={(e) =>
								setSystemSettings((prev) => ({
									...prev,
									weatherCondition: e.target
										.value as typeof systemSettings.weatherCondition,
								}))
							}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
						>
							<option value="clear">Clear</option>
							<option value="rain">Rain</option>
							<option value="snow">Snow</option>
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Signal Control
						</label>
						<select
							value={systemSettings.signalOptimization}
							onChange={(e) =>
								setSystemSettings((prev) => ({
									...prev,
									signalOptimization: e.target
										.value as typeof systemSettings.signalOptimization,
								}))
							}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
						>
							<option value="fixed">Fixed Timing</option>
							<option value="adaptive">Adaptive</option>
							<option value="coordinated">Coordinated</option>
						</select>
					</div>
				</div>
			</div>

			{/* Display Options */}
			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-3">Display Options</h3>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={displaySettings.showQueues}
							onChange={(e) =>
								setDisplaySettings((prev) => ({
									...prev,
									showQueues: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">
							Vehicle Queues
						</span>
					</label>
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={displaySettings.showTrafficSignals}
							onChange={(e) =>
								setDisplaySettings((prev) => ({
									...prev,
									showTrafficSignals: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">
							Traffic Signals
						</span>
					</label>
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={displaySettings.showVehicles}
							onChange={(e) =>
								setDisplaySettings((prev) => ({
									...prev,
									showVehicles: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">Vehicles</span>
					</label>
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={displaySettings.animateVehicles}
							onChange={(e) =>
								setDisplaySettings((prev) => ({
									...prev,
									animateVehicles: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">
							Animate Flow
						</span>
					</label>
				</div>
			</div>

			{/* System Performance Metrics */}
			{metrics && (
				<div className="mb-6">
					<h3 className="text-lg font-semibold mb-3">Network Performance</h3>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<h4 className="font-medium text-blue-800">Total Volume</h4>
							<p className="text-2xl font-bold text-blue-900">
								{metrics.totalVolume.toFixed(0)}
							</p>
							<p className="text-sm text-blue-600">vehicles/hour</p>
						</div>
						<div className="bg-green-50 border border-green-200 rounded-lg p-4">
							<h4 className="font-medium text-green-800">Avg Speed</h4>
							<p className="text-2xl font-bold text-green-900">
								{metrics.averageSpeed.toFixed(1)} km/h
							</p>
							<p className="text-sm text-green-600">network average</p>
						</div>
						<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
							<h4 className="font-medium text-yellow-800">Total Delay</h4>
							<p className="text-2xl font-bold text-yellow-900">
								{metrics.totalDelay.toFixed(0)} sec
							</p>
							<p className="text-sm text-yellow-600">per vehicle</p>
						</div>
						<div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
							<h4 className="font-medium text-purple-800">Efficiency</h4>
							<p className="text-2xl font-bold text-purple-900">
								{metrics.networkEfficiency.toFixed(0)}%
							</p>
							<p className="text-sm text-purple-600">network utilization</p>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="bg-red-50 border border-red-200 rounded-lg p-4">
							<h4 className="font-medium text-red-800">Environmental Impact</h4>
							<p className="text-lg font-bold text-red-900">
								{metrics.emissions.toFixed(1)} kg CO₂/hr
							</p>
							<p className="text-sm text-red-600">
								{metrics.fuelConsumption.toFixed(1)} L fuel/hr
							</p>
						</div>
						<div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
							<h4 className="font-medium text-orange-800">Economic Cost</h4>
							<p className="text-lg font-bold text-orange-900">
								${metrics.economicCost.toFixed(0)}/hr
							</p>
							<p className="text-sm text-orange-600">fuel + time value</p>
						</div>
						<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
							<h4 className="font-medium text-gray-800">Optimization</h4>
							<p className="text-lg font-bold text-gray-900">
								{systemSettings.signalOptimization.toUpperCase()}
							</p>
							<p className="text-sm text-gray-600">signal control mode</p>
						</div>
					</div>
				</div>
			)}

			{/* Traffic Network Visualization */}
			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-3">Traffic Network</h3>
				<canvas
					ref={canvasRef}
					className="border border-gray-300 rounded-lg bg-white"
					style={{ maxWidth: "100%", height: "auto" }}
				/>
			</div>

			{/* Intersection Details */}
			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-3">Intersection Status</h3>
				<div className="grid gap-4">
					{intersections.map((intersection) => (
						<div key={intersection.id} className="bg-gray-50 rounded-lg p-4">
							<div className="flex items-center justify-between mb-3">
								<h4 className="font-medium">{intersection.name}</h4>
								<div className="flex items-center space-x-4">
									<span
										className={`px-2 py-1 rounded text-sm font-medium ${
											intersection.levelOfService <= "B"
												? "bg-green-100 text-green-800"
												: intersection.levelOfService <= "D"
													? "bg-yellow-100 text-yellow-800"
													: "bg-red-100 text-red-800"
										}`}
									>
										LOS {intersection.levelOfService}
									</span>
									<span className="text-sm text-gray-600">
										Cycle: {intersection.cycleTime}s | Delay:{" "}
										{intersection.delay.toFixed(0)}s
									</span>
								</div>
							</div>

							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										North Queue: {intersection.queueLengths.north}
									</label>
									<input
										type="range"
										min="0"
										max="20"
										step="1"
										value={intersection.queueLengths.north}
										onChange={(e) => {
											const newQueues = {
												...intersection.queueLengths,
												north: Number(e.target.value),
											};
											updateIntersection(
												intersection.id,
												"queueLengths",
												newQueues,
											);
										}}
										className="w-full"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										South Queue: {intersection.queueLengths.south}
									</label>
									<input
										type="range"
										min="0"
										max="20"
										step="1"
										value={intersection.queueLengths.south}
										onChange={(e) => {
											const newQueues = {
												...intersection.queueLengths,
												south: Number(e.target.value),
											};
											updateIntersection(
												intersection.id,
												"queueLengths",
												newQueues,
											);
										}}
										className="w-full"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										East Queue: {intersection.queueLengths.east}
									</label>
									<input
										type="range"
										min="0"
										max="20"
										step="1"
										value={intersection.queueLengths.east}
										onChange={(e) => {
											const newQueues = {
												...intersection.queueLengths,
												east: Number(e.target.value),
											};
											updateIntersection(
												intersection.id,
												"queueLengths",
												newQueues,
											);
										}}
										className="w-full"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										West Queue: {intersection.queueLengths.west}
									</label>
									<input
										type="range"
										min="0"
										max="20"
										step="1"
										value={intersection.queueLengths.west}
										onChange={(e) => {
											const newQueues = {
												...intersection.queueLengths,
												west: Number(e.target.value),
											};
											updateIntersection(
												intersection.id,
												"queueLengths",
												newQueues,
											);
										}}
										className="w-full"
									/>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-slate-800">
						Traffic Engineering
					</h3>
					<ul className="text-slate-700 space-y-1">
						<li>
							• <strong>Flow Models</strong>: Greenshields fundamental diagram
						</li>
						<li>
							• <strong>Signal Optimization</strong>: Webster's delay
							minimization
						</li>
						<li>
							• <strong>Level of Service</strong>: HCM 2016 methodology
						</li>
						<li>
							• <strong>Adaptive Control</strong>: Real-time queue management
						</li>
					</ul>
				</div>

				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-blue-800">
						Applications
					</h3>
					<ul className="text-blue-700 space-y-1">
						<li>
							• <strong>Urban Planning</strong>: Intersection design and timing
						</li>
						<li>
							• <strong>Smart Cities</strong>: Connected vehicle infrastructure
						</li>
						<li>
							• <strong>Operations</strong>: Real-time traffic management
						</li>
						<li>
							• <strong>Environmental</strong>: Emission reduction strategies
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6">
				<Link
					to="/examples/engineering"
					className="inline-block px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
				>
					← Back to Examples
				</Link>
			</div>
		</div>
	);
}
