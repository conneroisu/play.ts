import { createFileRoute } from "@tanstack/react-router";
import {
	clamp,
	cos,
	exp,
	hsl,
	hslToRgb,
	lerp,
	PI,
	sin,
	sqrt,
	TWO_PI,
	toCssHsl,
} from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute(
	"/examples/engineering/automotive-suspension-analysis",
)({
	component: AutomotiveSuspensionAnalysisExample,
});

interface SuspensionSettings {
	springConstant: number; // N/m
	dampingCoefficient: number; // N·s/m
	sprungMass: number; // kg (car body mass)
	unsprungMass: number; // kg (wheel mass)
	tireStiffness: number; // N/m
	tireDamping: number; // N·s/m
}

interface VehicleSettings {
	wheelbase: number; // m
	frontAxleDistance: number; // m from CG
	rearAxleDistance: number; // m from CG
	pitchInertia: number; // kg·m²
	rollInertia: number; // kg·m²
	vehicleSpeed: number; // m/s
}

interface RoadInput {
	type: "step" | "bump" | "sine" | "random" | "speedbump" | "pothole";
	amplitude: number; // m
	frequency: number; // Hz
	duration: number; // s
	position: number; // 0-1 (front to rear)
}

interface SimulationData {
	time: number[];
	sprungMassDisplacement: number[];
	unsprungMassDisplacement: number[];
	roadProfile: number[];
	suspensionForce: number[];
	tireForce: number[];
	sprungAcceleration: number[];
	tireDeflection: number[];
	suspensionTravel: number[];
}

interface SuspensionMetrics {
	rideComfort: number; // RMS acceleration
	roadHolding: number; // RMS tire force variation
	suspensionWorkspace: number; // Maximum suspension travel
	naturalFrequency: number; // Hz
	dampingRatio: number;
	transmissibility: number;
	settlingTime: number;
}

function AutomotiveSuspensionAnalysisExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();

	const [suspensionSettings, setSuspensionSettings] =
		useState<SuspensionSettings>({
			springConstant: 25000, // N/m
			dampingCoefficient: 2000, // N·s/m
			sprungMass: 400, // kg (quarter car)
			unsprungMass: 50, // kg
			tireStiffness: 200000, // N/m
			tireDamping: 50, // N·s/m
		});

	const [vehicleSettings, setVehicleSettings] = useState<VehicleSettings>({
		wheelbase: 2.7, // m
		frontAxleDistance: 1.2, // m
		rearAxleDistance: 1.5, // m
		pitchInertia: 2500, // kg·m²
		rollInertia: 800, // kg·m²
		vehicleSpeed: 20, // m/s (72 km/h)
	});

	const [roadInput, setRoadInput] = useState<RoadInput>({
		type: "bump",
		amplitude: 0.05, // 5cm
		frequency: 2, // Hz
		duration: 10, // s
		position: 0.5, // middle
	});

	const [simulationData, setSimulationData] = useState<SimulationData>({
		time: [],
		sprungMassDisplacement: [],
		unsprungMassDisplacement: [],
		roadProfile: [],
		suspensionForce: [],
		tireForce: [],
		sprungAcceleration: [],
		tireDeflection: [],
		suspensionTravel: [],
	});

	const [suspensionMetrics, setSuspensionMetrics] =
		useState<SuspensionMetrics | null>(null);
	const [isAnimating, setIsAnimating] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);

	const [displaySettings, setDisplaySettings] = useState({
		showSprungMass: true,
		showUnsprungMass: true,
		showRoadProfile: true,
		showForces: false,
		showAcceleration: false,
		timeWindow: 10,
		amplitudeScale: 1000,
	});

	// Suspension presets
	const suspensionPresets = {
		comfort: {
			springConstant: 20000,
			dampingCoefficient: 1800,
			sprungMass: 400,
			unsprungMass: 50,
		},
		sport: {
			springConstant: 35000,
			dampingCoefficient: 2500,
			sprungMass: 400,
			unsprungMass: 45,
		},
		racing: {
			springConstant: 50000,
			dampingCoefficient: 3500,
			sprungMass: 350,
			unsprungMass: 40,
		},
		off_road: {
			springConstant: 15000,
			dampingCoefficient: 1500,
			sprungMass: 450,
			unsprungMass: 60,
		},
		luxury: {
			springConstant: 18000,
			dampingCoefficient: 2200,
			sprungMass: 500,
			unsprungMass: 55,
		},
	};

	// Road input presets
	const roadPresets = {
		step: {
			type: "step" as const,
			amplitude: 0.03,
			frequency: 1,
			duration: 10,
		},
		bump: {
			type: "bump" as const,
			amplitude: 0.05,
			frequency: 2,
			duration: 10,
		},
		sine: {
			type: "sine" as const,
			amplitude: 0.02,
			frequency: 1.5,
			duration: 10,
		},
		speedbump: {
			type: "speedbump" as const,
			amplitude: 0.08,
			frequency: 0.5,
			duration: 10,
		},
		pothole: {
			type: "pothole" as const,
			amplitude: -0.06,
			frequency: 1,
			duration: 10,
		},
		random: {
			type: "random" as const,
			amplitude: 0.01,
			frequency: 3,
			duration: 10,
		},
	};

	// Generate road profile
	const generateRoadProfile = (
		time: number[],
		settings: RoadInput,
	): number[] => {
		return time.map((t) => {
			switch (settings.type) {
				case "step":
					return t > 2 ? settings.amplitude : 0;

				case "bump": {
					const bumpTime = 2;
					const bumpWidth = 0.5;
					if (t > bumpTime && t < bumpTime + bumpWidth) {
						const x = (t - bumpTime) / bumpWidth;
						return settings.amplitude * sin(PI * x);
					}
					return 0;
				}

				case "sine":
					return t > 1
						? settings.amplitude * sin(TWO_PI * settings.frequency * (t - 1))
						: 0;

				case "speedbump": {
					const speedbumpTime = 3;
					const speedbumpWidth = 1.5;
					if (t > speedbumpTime && t < speedbumpTime + speedbumpWidth) {
						const x = (t - speedbumpTime) / speedbumpWidth;
						return (settings.amplitude * (1 - cos(TWO_PI * x))) / 2;
					}
					return 0;
				}

				case "pothole": {
					const potholeTime = 2.5;
					const potholeWidth = 0.8;
					if (t > potholeTime && t < potholeTime + potholeWidth) {
						const x = (t - potholeTime) / potholeWidth;
						return settings.amplitude * sin(PI * x);
					}
					return 0;
				}

				case "random":
					// Simple random road using multiple sine waves
					return t > 1
						? settings.amplitude *
								(sin(TWO_PI * 1.2 * t) * 0.5 +
									sin(TWO_PI * 2.1 * t) * 0.3 +
									sin(TWO_PI * 3.7 * t) * 0.2)
						: 0;

				default:
					return 0;
			}
		});
	};

	// Quarter car model simulation
	const simulateQuarterCar = () => {
		const dt = 0.01; // 10ms time step
		const duration = roadInput.duration;
		const steps = Math.floor(duration / dt);

		const time: number[] = [];
		const sprungMassDisplacement: number[] = [];
		const unsprungMassDisplacement: number[] = [];
		const roadProfile: number[] = [];
		const suspensionForce: number[] = [];
		const tireForce: number[] = [];
		const sprungAcceleration: number[] = [];
		const tireDeflection: number[] = [];
		const suspensionTravel: number[] = [];

		// Initial conditions
		let x1 = 0; // sprung mass displacement
		let x2 = 0; // unsprung mass displacement
		let v1 = 0; // sprung mass velocity
		let v2 = 0; // unsprung mass velocity

		for (let i = 0; i <= steps; i++) {
			const t = i * dt;
			time.push(t);

			// Generate time array for road profile generation
			const currentRoadHeight = generateRoadProfile([t], roadInput)[0];
			roadProfile.push(currentRoadHeight);

			// Suspension forces
			const suspensionDeflection = x1 - x2;
			const suspensionVelocity = v1 - v2;
			const Fs =
				-suspensionSettings.springConstant * suspensionDeflection -
				suspensionSettings.dampingCoefficient * suspensionVelocity;

			// Tire forces
			const tireDeflectionValue = x2 - currentRoadHeight;
			const tireVelocity = v2;
			const Ft =
				-suspensionSettings.tireStiffness * tireDeflectionValue -
				suspensionSettings.tireDamping * tireVelocity;

			// Equations of motion
			const a1 = -Fs / suspensionSettings.sprungMass;
			const a2 = (Fs + Ft) / suspensionSettings.unsprungMass;

			// Store current values
			sprungMassDisplacement.push(x1);
			unsprungMassDisplacement.push(x2);
			suspensionForce.push(Fs);
			tireForce.push(Ft);
			sprungAcceleration.push(a1);
			tireDeflection.push(tireDeflectionValue);
			suspensionTravel.push(suspensionDeflection);

			// Integrate using Euler method
			v1 += a1 * dt;
			v2 += a2 * dt;
			x1 += v1 * dt;
			x2 += v2 * dt;
		}

		return {
			time,
			sprungMassDisplacement,
			unsprungMassDisplacement,
			roadProfile,
			suspensionForce,
			tireForce,
			sprungAcceleration,
			tireDeflection,
			suspensionTravel,
		};
	};

	// Calculate suspension metrics
	const calculateMetrics = (data: SimulationData): SuspensionMetrics => {
		if (data.time.length < 2) {
			return {
				rideComfort: 0,
				roadHolding: 0,
				suspensionWorkspace: 0,
				naturalFrequency: 0,
				dampingRatio: 0,
				transmissibility: 0,
				settlingTime: 0,
			};
		}

		// RMS acceleration (ride comfort metric)
		const accelerationRMS = sqrt(
			data.sprungAcceleration.reduce((sum, acc) => sum + acc * acc, 0) /
				data.sprungAcceleration.length,
		);

		// RMS tire force variation (road holding metric)
		const staticTireForce = suspensionSettings.sprungMass * 9.81;
		const dynamicTireForces = data.tireForce.map((f) => f - staticTireForce);
		const tireForceRMS = sqrt(
			dynamicTireForces.reduce((sum, f) => sum + f * f, 0) /
				dynamicTireForces.length,
		);

		// Maximum suspension travel
		const maxTravel = Math.max(...data.suspensionTravel.map(Math.abs));

		// Natural frequency and damping ratio
		const naturalFrequency =
			sqrt(suspensionSettings.springConstant / suspensionSettings.sprungMass) /
			TWO_PI;
		const criticalDamping =
			2 *
			sqrt(suspensionSettings.springConstant * suspensionSettings.sprungMass);
		const dampingRatio =
			suspensionSettings.dampingCoefficient / criticalDamping;

		// Transmissibility (peak response ratio)
		const inputAmplitude = Math.max(...data.roadProfile.map(Math.abs));
		const outputAmplitude = Math.max(
			...data.sprungMassDisplacement.map(Math.abs),
		);
		const transmissibility =
			inputAmplitude > 0 ? outputAmplitude / inputAmplitude : 0;

		// Settling time (time to settle within 2% of steady state)
		let settlingTime = data.time[data.time.length - 1];
		const finalValue =
			data.sprungMassDisplacement[data.sprungMassDisplacement.length - 1];
		const tolerance = 0.02 * Math.abs(finalValue);

		for (let i = data.sprungMassDisplacement.length - 1; i >= 0; i--) {
			if (Math.abs(data.sprungMassDisplacement[i] - finalValue) > tolerance) {
				settlingTime = data.time[i];
				break;
			}
		}

		return {
			rideComfort: accelerationRMS,
			roadHolding: tireForceRMS,
			suspensionWorkspace: maxTravel,
			naturalFrequency,
			dampingRatio,
			transmissibility,
			settlingTime,
		};
	};

	// Run simulation
	const runSimulation = () => {
		const data = simulateQuarterCar();
		setSimulationData(data);
		setSuspensionMetrics(calculateMetrics(data));
	};

	// Draw visualization
	const draw = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;

		ctx.clearRect(0, 0, width, height);

		// Draw quarter car model
		drawQuarterCarModel(ctx, width / 4, height / 2, 200, 150);

		// Draw time series plots
		drawTimeSeries(ctx, width / 2, 50, width / 2 - 50, height - 100);
	};

	const drawQuarterCarModel = (
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		modelWidth: number,
		modelHeight: number,
	) => {
		const scale = 1000; // mm to pixels
		const sprungDisp =
			simulationData.sprungMassDisplacement.length > 0
				? simulationData.sprungMassDisplacement[
						Math.floor(currentTime / 0.01)
					] * scale
				: 0;
		const unsprungDisp =
			simulationData.unsprungMassDisplacement.length > 0
				? simulationData.unsprungMassDisplacement[
						Math.floor(currentTime / 0.01)
					] * scale
				: 0;
		const roadHeight =
			simulationData.roadProfile.length > 0
				? simulationData.roadProfile[Math.floor(currentTime / 0.01)] * scale
				: 0;

		// Road surface
		ctx.fillStyle = "#8b7355";
		ctx.fillRect(x - 50, y + 100 + roadHeight, modelWidth + 100, 20);

		// Tire (unsprung mass)
		const tireY = y + 80 + unsprungDisp;
		ctx.fillStyle = "#1f2937";
		ctx.fillRect(x + 75, tireY, 50, 20);
		ctx.strokeStyle = "#374151";
		ctx.lineWidth = 2;
		ctx.strokeRect(x + 75, tireY, 50, 20);

		// Wheel
		ctx.fillStyle = "#6b7280";
		ctx.beginPath();
		ctx.arc(x + 100, tireY + 10, 8, 0, TWO_PI);
		ctx.fill();

		// Spring (visual representation)
		const springTop = y + 20 + sprungDisp;
		const springBottom = tireY - 10;
		ctx.strokeStyle = "#ef4444";
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.moveTo(x + 50, springTop);

		// Draw spring coils
		const coils = 8;
		const springHeight = springBottom - springTop;
		for (let i = 0; i <= coils * 4; i++) {
			const t = i / (coils * 4);
			const springY = springTop + t * springHeight;
			const springX = x + 50 + 10 * sin((i * PI) / 2);
			ctx.lineTo(springX, springY);
		}
		ctx.stroke();

		// Damper
		ctx.strokeStyle = "#3b82f6";
		ctx.lineWidth = 4;
		ctx.beginPath();
		ctx.moveTo(x + 150, springTop);
		ctx.lineTo(x + 150, springBottom);
		ctx.stroke();

		// Damper piston
		ctx.fillStyle = "#1e40af";
		ctx.fillRect(x + 145, springTop + springHeight * 0.3, 10, 20);

		// Sprung mass (car body)
		ctx.fillStyle = "#10b981";
		ctx.fillRect(x, y + sprungDisp, modelWidth, 40);
		ctx.strokeStyle = "#059669";
		ctx.lineWidth = 2;
		ctx.strokeRect(x, y + sprungDisp, modelWidth, 40);

		// Labels and values
		ctx.fillStyle = "#1f2937";
		ctx.font = "12px Arial";
		ctx.textAlign = "left";

		ctx.fillText(
			`Sprung Mass: ${suspensionSettings.sprungMass} kg`,
			x - 50,
			y - 20,
		);
		ctx.fillText(`Displacement: ${sprungDisp.toFixed(1)} mm`, x - 50, y - 5);

		ctx.fillText(
			`Unsprung Mass: ${suspensionSettings.unsprungMass} kg`,
			x - 50,
			tireY + 40,
		);
		ctx.fillText(
			`Spring: ${suspensionSettings.springConstant} N/m`,
			x - 50,
			tireY + 55,
		);
		ctx.fillText(
			`Damper: ${suspensionSettings.dampingCoefficient} N·s/m`,
			x - 50,
			tireY + 70,
		);
	};

	const drawTimeSeries = (
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		width: number,
		height: number,
	) => {
		if (simulationData.time.length < 2) return;

		const charts = [
			{
				title: "Displacement (mm)",
				y: y,
				height: height / 3 - 20,
				datasets: [
					{
						data: simulationData.roadProfile.map((v) => v * 1000),
						color: "#8b7355",
						label: "Road",
						show: displaySettings.showRoadProfile,
					},
					{
						data: simulationData.unsprungMassDisplacement.map((v) => v * 1000),
						color: "#6b7280",
						label: "Unsprung",
						show: displaySettings.showUnsprungMass,
					},
					{
						data: simulationData.sprungMassDisplacement.map((v) => v * 1000),
						color: "#10b981",
						label: "Sprung",
						show: displaySettings.showSprungMass,
					},
				],
			},
			{
				title: "Forces (N)",
				y: y + height / 3,
				height: height / 3 - 20,
				datasets: [
					{
						data: simulationData.suspensionForce,
						color: "#ef4444",
						label: "Suspension",
						show: displaySettings.showForces,
					},
					{
						data: simulationData.tireForce,
						color: "#1f2937",
						label: "Tire",
						show: displaySettings.showForces,
					},
				],
			},
			{
				title: "Acceleration (m/s²)",
				y: y + (2 * height) / 3,
				height: height / 3 - 20,
				datasets: [
					{
						data: simulationData.sprungAcceleration,
						color: "#8b5cf6",
						label: "Sprung Mass",
						show: displaySettings.showAcceleration,
					},
				],
			},
		];

		charts.forEach((chart) => {
			if (chart.datasets.some((d) => d.show)) {
				drawChart(ctx, chart, x, chart.y, width, chart.height);
			}
		});
	};

	const drawChart = (
		ctx: CanvasRenderingContext2D,
		chart: any,
		x: number,
		y: number,
		width: number,
		height: number,
	) => {
		// Background
		ctx.fillStyle = "#f8fafc";
		ctx.fillRect(x, y, width, height);
		ctx.strokeStyle = "#e2e8f0";
		ctx.lineWidth = 1;
		ctx.strokeRect(x, y, width, height);

		// Title
		ctx.fillStyle = "#1e293b";
		ctx.font = "14px Arial";
		ctx.textAlign = "left";
		ctx.fillText(chart.title, x + 5, y + 15);

		// Find data ranges
		let minY = Number.POSITIVE_INFINITY;
		let maxY = Number.NEGATIVE_INFINITY;

		chart.datasets.forEach((dataset: any) => {
			if (dataset.show && dataset.data.length > 0) {
				const dataMin = Math.min(...dataset.data);
				const dataMax = Math.max(...dataset.data);
				minY = Math.min(minY, dataMin);
				maxY = Math.max(maxY, dataMax);
			}
		});

		if (minY === maxY) {
			minY -= 1;
			maxY += 1;
		}

		const timeRange =
			Math.max(...simulationData.time) - Math.min(...simulationData.time);
		const yRange = maxY - minY;

		// Grid
		ctx.strokeStyle = "#f1f5f9";
		ctx.lineWidth = 1;

		for (let i = 1; i <= 4; i++) {
			const gridY = y + (i * height) / 5;
			ctx.beginPath();
			ctx.moveTo(x, gridY);
			ctx.lineTo(x + width, gridY);
			ctx.stroke();
		}

		// Plot datasets
		chart.datasets.forEach((dataset: any) => {
			if (!dataset.show || dataset.data.length === 0) return;

			ctx.strokeStyle = dataset.color;
			ctx.lineWidth = 2;
			ctx.beginPath();

			for (let i = 0; i < dataset.data.length; i++) {
				const time = simulationData.time[i];
				const value = dataset.data[i];

				const plotX = x + (time / timeRange) * width;
				const plotY = y + height - ((value - minY) / yRange) * height;

				if (i === 0) {
					ctx.moveTo(plotX, plotY);
				} else {
					ctx.lineTo(plotX, plotY);
				}
			}

			ctx.stroke();
		});

		// Current time indicator
		if (isAnimating && simulationData.time.length > 0) {
			const currentTimeNormalized =
				currentTime / Math.max(...simulationData.time);
			const indicatorX = x + currentTimeNormalized * width;

			ctx.strokeStyle = "#dc2626";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(indicatorX, y);
			ctx.lineTo(indicatorX, y + height);
			ctx.stroke();
		}
	};

	const animate = () => {
		if (isAnimating) {
			setCurrentTime((prev) => {
				const maxTime =
					simulationData.time.length > 0
						? Math.max(...simulationData.time)
						: 10;
				const newTime = prev + 0.05;
				return newTime > maxTime ? 0 : newTime;
			});
		}

		draw();
		animationRef.current = requestAnimationFrame(animate);
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (canvas) {
			canvas.width = 1000;
			canvas.height = 600;
		}

		runSimulation();
	}, [suspensionSettings, roadInput]);

	useEffect(() => {
		animationRef.current = requestAnimationFrame(animate);
		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [isAnimating, simulationData, currentTime]);

	const applySuspensionPreset = (preset: keyof typeof suspensionPresets) => {
		setSuspensionSettings((prev) => ({
			...prev,
			...suspensionPresets[preset],
		}));
	};

	const applyRoadPreset = (preset: keyof typeof roadPresets) => {
		setRoadInput((prev) => ({ ...prev, ...roadPresets[preset] }));
	};

	return (
		<div className="w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-orange-50 to-red-50 min-h-screen">
			<div className="bg-white rounded-xl shadow-lg p-6 mb-6">
				<div className="flex items-center gap-3 mb-6">
					<div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
					<h1 className="text-2xl font-bold text-gray-800">
						Automotive Suspension Analysis
					</h1>
					<div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
						Vehicle Dynamics Engineering Tool
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
					{/* Visualization */}
					<div className="lg:col-span-3">
						<div className="bg-gray-50 rounded-lg p-4 mb-4">
							<canvas
								ref={canvasRef}
								className="border border-gray-300 rounded-lg bg-white w-full"
							/>
						</div>

						<div className="flex gap-2 mb-4">
							<button
								onClick={() => setIsAnimating(!isAnimating)}
								className={`px-4 py-2 rounded-lg font-medium ${
									isAnimating
										? "bg-red-500 text-white hover:bg-red-600"
										: "bg-green-500 text-white hover:bg-green-600"
								}`}
							>
								{isAnimating ? "Stop" : "Start"} Animation
							</button>
							<button
								onClick={() => {
									setIsAnimating(false);
									setCurrentTime(0);
									runSimulation();
								}}
								className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
							>
								Reset
							</button>
						</div>
					</div>

					{/* Controls */}
					<div className="space-y-4">
						{/* Suspension Settings */}
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Suspension Parameters
							</h3>

							<div className="space-y-3">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Spring Constant: {suspensionSettings.springConstant} N/m
									</label>
									<input
										type="range"
										min="10000"
										max="60000"
										step="1000"
										value={suspensionSettings.springConstant}
										onChange={(e) =>
											setSuspensionSettings((prev) => ({
												...prev,
												springConstant: Number.parseInt(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Damping: {suspensionSettings.dampingCoefficient} N·s/m
									</label>
									<input
										type="range"
										min="500"
										max="5000"
										step="100"
										value={suspensionSettings.dampingCoefficient}
										onChange={(e) =>
											setSuspensionSettings((prev) => ({
												...prev,
												dampingCoefficient: Number.parseInt(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Sprung Mass: {suspensionSettings.sprungMass} kg
									</label>
									<input
										type="range"
										min="200"
										max="800"
										step="50"
										value={suspensionSettings.sprungMass}
										onChange={(e) =>
											setSuspensionSettings((prev) => ({
												...prev,
												sprungMass: Number.parseInt(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Unsprung Mass: {suspensionSettings.unsprungMass} kg
									</label>
									<input
										type="range"
										min="30"
										max="80"
										step="5"
										value={suspensionSettings.unsprungMass}
										onChange={(e) =>
											setSuspensionSettings((prev) => ({
												...prev,
												unsprungMass: Number.parseInt(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>
							</div>

							<div className="mt-3">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Suspension Presets
								</label>
								<div className="grid grid-cols-2 gap-2">
									{Object.keys(suspensionPresets).map((preset) => (
										<button
											key={preset}
											onClick={() =>
												applySuspensionPreset(
													preset as keyof typeof suspensionPresets,
												)
											}
											className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors"
										>
											{preset.replace("_", " ")}
										</button>
									))}
								</div>
							</div>
						</div>

						{/* Road Input */}
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Road Input
							</h3>

							<div className="space-y-3">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Input Type
									</label>
									<select
										value={roadInput.type}
										onChange={(e) => {
											const type = e.target.value as keyof typeof roadPresets;
											applyRoadPreset(type);
										}}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
									>
										<option value="step">Step Input</option>
										<option value="bump">Single Bump</option>
										<option value="sine">Sinusoidal</option>
										<option value="speedbump">Speed Bump</option>
										<option value="pothole">Pothole</option>
										<option value="random">Random Road</option>
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Amplitude: {(roadInput.amplitude * 1000).toFixed(0)} mm
									</label>
									<input
										type="range"
										min="0.01"
										max="0.15"
										step="0.005"
										value={roadInput.amplitude}
										onChange={(e) =>
											setRoadInput((prev) => ({
												...prev,
												amplitude: Number.parseFloat(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Frequency: {roadInput.frequency.toFixed(1)} Hz
									</label>
									<input
										type="range"
										min="0.5"
										max="5"
										step="0.1"
										value={roadInput.frequency}
										onChange={(e) =>
											setRoadInput((prev) => ({
												...prev,
												frequency: Number.parseFloat(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>
							</div>
						</div>

						{/* Display Settings */}
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Display Options
							</h3>

							<div className="space-y-2">
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={displaySettings.showSprungMass}
										onChange={(e) =>
											setDisplaySettings((prev) => ({
												...prev,
												showSprungMass: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Sprung Mass
								</label>
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={displaySettings.showUnsprungMass}
										onChange={(e) =>
											setDisplaySettings((prev) => ({
												...prev,
												showUnsprungMass: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Unsprung Mass
								</label>
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={displaySettings.showRoadProfile}
										onChange={(e) =>
											setDisplaySettings((prev) => ({
												...prev,
												showRoadProfile: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Road Profile
								</label>
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={displaySettings.showForces}
										onChange={(e) =>
											setDisplaySettings((prev) => ({
												...prev,
												showForces: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Forces
								</label>
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={displaySettings.showAcceleration}
										onChange={(e) =>
											setDisplaySettings((prev) => ({
												...prev,
												showAcceleration: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Acceleration
								</label>
							</div>
						</div>

						{/* Performance Metrics */}
						{suspensionMetrics && (
							<div className="bg-gray-50 rounded-lg p-4">
								<h3 className="text-lg font-semibold text-gray-800 mb-3">
									Performance Metrics
								</h3>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span>Ride Comfort:</span>
										<span className="font-mono">
											{suspensionMetrics.rideComfort.toFixed(2)} m/s²
										</span>
									</div>
									<div className="flex justify-between">
										<span>Road Holding:</span>
										<span className="font-mono">
											{suspensionMetrics.roadHolding.toFixed(0)} N
										</span>
									</div>
									<div className="flex justify-between">
										<span>Max Travel:</span>
										<span className="font-mono">
											{(suspensionMetrics.suspensionWorkspace * 1000).toFixed(
												1,
											)}{" "}
											mm
										</span>
									</div>
									<div className="flex justify-between">
										<span>Natural Freq:</span>
										<span className="font-mono">
											{suspensionMetrics.naturalFrequency.toFixed(2)} Hz
										</span>
									</div>
									<div className="flex justify-between">
										<span>Damping Ratio:</span>
										<span className="font-mono">
											{suspensionMetrics.dampingRatio.toFixed(3)}
										</span>
									</div>
									<div className="flex justify-between">
										<span>Transmissibility:</span>
										<span className="font-mono">
											{suspensionMetrics.transmissibility.toFixed(2)}
										</span>
									</div>
									<div className="flex justify-between">
										<span>Settling Time:</span>
										<span className="font-mono">
											{suspensionMetrics.settlingTime.toFixed(1)} s
										</span>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				<div className="mt-6 bg-orange-50 rounded-lg p-4">
					<h3 className="text-lg font-semibold text-orange-800 mb-2">
						Automotive Engineering Applications
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-orange-700">
						<div>
							<strong>Performance Objectives:</strong>
							<ul className="mt-1 space-y-1">
								<li>• Ride comfort optimization</li>
								<li>• Road holding improvement</li>
								<li>• Suspension travel minimization</li>
								<li>• Dynamic stability</li>
							</ul>
						</div>
						<div>
							<strong>Design Applications:</strong>
							<ul className="mt-1 space-y-1">
								<li>• Spring and damper sizing</li>
								<li>• Performance tuning</li>
								<li>• Comfort vs handling trade-offs</li>
								<li>• Vehicle dynamics validation</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
