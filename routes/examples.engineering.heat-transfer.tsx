import { createFileRoute } from "@tanstack/react-router";
import {
	clamp,
	cos,
	hsl,
	hslToRgb,
	lerp,
	PI,
	sin,
	TWO_PI,
	toCssHsl,
} from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/engineering/heat-transfer")({
	component: HeatTransferExample,
});

interface ThermalNode {
	x: number;
	y: number;
	temperature: number;
	materialType:
		| "steel"
		| "aluminum"
		| "copper"
		| "concrete"
		| "air"
		| "insulation";
	heatCapacity: number;
	thermalConductivity: number;
	density: number;
	id: string;
}

interface HeatSource {
	x: number;
	y: number;
	power: number; // Watts
	type: "constant" | "variable" | "convection" | "radiation";
	id: string;
}

interface BoundaryCondition {
	type: "fixed_temperature" | "heat_flux" | "convection" | "insulated";
	value: number;
	side: "top" | "bottom" | "left" | "right";
	id: string;
}

interface MaterialProperties {
	thermalConductivity: number; // W/(m·K)
	density: number; // kg/m³
	specificHeat: number; // J/(kg·K)
	name: string;
	color: { h: number; s: number; l: number };
}

interface SimulationSettings {
	gridSize: number;
	timeStep: number;
	ambientTemperature: number;
	convectionCoefficient: number;
	emissivity: number;
	stefanBoltzmann: number;
	showTemperatureField: boolean;
	showHeatFlux: boolean;
	showIsotherms: boolean;
	colorScale: "thermal" | "scientific" | "grayscale";
	maxTemperature: number;
	minTemperature: number;
}

function HeatTransferExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const timeRef = useRef<number>(0);

	const [temperatureField, setTemperatureField] = useState<number[][]>([]);
	const [heatFlux, setHeatFlux] = useState<{ x: number[][]; y: number[][] }>({
		x: [[]],
		y: [[]],
	});
	const [isSimulating, setIsSimulating] = useState(false);

	const [settings, setSettings] = useState<SimulationSettings>({
		gridSize: 50,
		timeStep: 0.1,
		ambientTemperature: 20,
		convectionCoefficient: 25,
		emissivity: 0.8,
		stefanBoltzmann: 5.67e-8,
		showTemperatureField: true,
		showHeatFlux: false,
		showIsotherms: true,
		colorScale: "thermal",
		maxTemperature: 100,
		minTemperature: 0,
	});

	const [heatSources, setHeatSources] = useState<HeatSource[]>([
		{ x: 0.3, y: 0.3, power: 1000, type: "constant", id: "source1" },
		{ x: 0.7, y: 0.7, power: -500, type: "constant", id: "source2" },
	]);

	const [boundaryConditions, setBoundaryConditions] = useState<
		BoundaryCondition[]
	>([
		{ type: "fixed_temperature", value: 20, side: "top", id: "bc1" },
		{ type: "convection", value: 25, side: "bottom", id: "bc2" },
		{ type: "insulated", value: 0, side: "left", id: "bc3" },
		{ type: "insulated", value: 0, side: "right", id: "bc4" },
	]);

	const [materialType, setMaterialType] = useState<
		"steel" | "aluminum" | "copper" | "concrete" | "composite"
	>("steel");
	const [analysisType, setAnalysisType] = useState<
		"steady_state" | "transient" | "coupled"
	>("transient");

	const materials: Record<string, MaterialProperties> = {
		steel: {
			thermalConductivity: 50,
			density: 7850,
			specificHeat: 420,
			name: "Steel",
			color: { h: 220, s: 30, l: 50 },
		},
		aluminum: {
			thermalConductivity: 237,
			density: 2700,
			specificHeat: 900,
			name: "Aluminum",
			color: { h: 200, s: 20, l: 70 },
		},
		copper: {
			thermalConductivity: 401,
			density: 8960,
			specificHeat: 385,
			name: "Copper",
			color: { h: 30, s: 80, l: 45 },
		},
		concrete: {
			thermalConductivity: 1.7,
			density: 2400,
			specificHeat: 880,
			name: "Concrete",
			color: { h: 0, s: 0, l: 60 },
		},
		composite: {
			thermalConductivity: 20,
			density: 1800,
			specificHeat: 1200,
			name: "Composite",
			color: { h: 120, s: 40, l: 40 },
		},
	};

	const initializeTemperatureField = () => {
		const field: number[][] = [];
		for (let i = 0; i < settings.gridSize; i++) {
			field[i] = [];
			for (let j = 0; j < settings.gridSize; j++) {
				field[i][j] = settings.ambientTemperature;
			}
		}
		setTemperatureField(field);
	};

	const calculateHeatFlux = (
		tempField: number[][],
	): { x: number[][]; y: number[][] } => {
		const material = materials[materialType];
		const dx = 1 / settings.gridSize;
		const dy = 1 / settings.gridSize;
		const fluxX: number[][] = [];
		const fluxY: number[][] = [];

		for (let i = 0; i < settings.gridSize; i++) {
			fluxX[i] = [];
			fluxY[i] = [];
			for (let j = 0; j < settings.gridSize; j++) {
				// Heat flux using Fourier's law: q = -k∇T
				const dTdx =
					i < settings.gridSize - 1
						? (tempField[i + 1][j] - tempField[i][j]) / dx
						: 0;
				const dTdy =
					j < settings.gridSize - 1
						? (tempField[i][j + 1] - tempField[i][j]) / dy
						: 0;

				fluxX[i][j] = -material.thermalConductivity * dTdx;
				fluxY[i][j] = -material.thermalConductivity * dTdy;
			}
		}

		return { x: fluxX, y: fluxY };
	};

	const solveDiffusionEquation = (tempField: number[][]): number[][] => {
		const material = materials[materialType];
		const alpha =
			material.thermalConductivity / (material.density * material.specificHeat); // Thermal diffusivity
		const dx = 1 / settings.gridSize;
		const dy = 1 / settings.gridSize;
		const dt = settings.timeStep;

		// Stability condition for explicit finite difference
		const stabilityFactor = alpha * dt * (1 / (dx * dx) + 1 / (dy * dy));
		const maxStability = 0.25;
		const actualDt =
			stabilityFactor > maxStability
				? maxStability / (alpha * (1 / (dx * dx) + 1 / (dy * dy)))
				: dt;

		const newField: number[][] = [];

		for (let i = 0; i < settings.gridSize; i++) {
			newField[i] = [];
			for (let j = 0; j < settings.gridSize; j++) {
				let newTemp = tempField[i][j];

				if (
					i > 0 &&
					i < settings.gridSize - 1 &&
					j > 0 &&
					j < settings.gridSize - 1
				) {
					// Interior points - use 2D heat equation
					const d2Tdx2 =
						(tempField[i + 1][j] - 2 * tempField[i][j] + tempField[i - 1][j]) /
						(dx * dx);
					const d2Tdy2 =
						(tempField[i][j + 1] - 2 * tempField[i][j] + tempField[i][j - 1]) /
						(dy * dy);

					newTemp = tempField[i][j] + alpha * actualDt * (d2Tdx2 + d2Tdy2);

					// Add heat sources
					heatSources.forEach((source) => {
						const sourceI = Math.round(source.x * settings.gridSize);
						const sourceJ = Math.round(source.y * settings.gridSize);
						if (i === sourceI && j === sourceJ) {
							const heatGeneration =
								source.power /
								(material.density * material.specificHeat * dx * dy);
							newTemp += heatGeneration * actualDt;
						}
					});
				} else {
					// Boundary conditions
					newTemp = applyBoundaryConditions(i, j, tempField);
				}

				newField[i][j] = clamp(newTemp, -273, 2000); // Physical temperature limits
			}
		}

		return newField;
	};

	const applyBoundaryConditions = (
		i: number,
		j: number,
		tempField: number[][],
	): number => {
		const dx = 1 / settings.gridSize;

		// Top boundary
		if (i === 0) {
			const bc = boundaryConditions.find((bc) => bc.side === "top");
			if (bc) {
				switch (bc.type) {
					case "fixed_temperature":
						return bc.value;
					case "convection": {
						const hc = bc.value;
						const Tinf = settings.ambientTemperature;
						return (
							tempField[1][j] +
							((hc * dx) / materials[materialType].thermalConductivity) *
								(Tinf - tempField[1][j])
						);
					}
					case "insulated":
						return tempField[1][j];
					default:
						return tempField[i][j];
				}
			}
		}

		// Bottom boundary
		if (i === settings.gridSize - 1) {
			const bc = boundaryConditions.find((bc) => bc.side === "bottom");
			if (bc) {
				switch (bc.type) {
					case "fixed_temperature":
						return bc.value;
					case "convection": {
						const hc = bc.value;
						const Tinf = settings.ambientTemperature;
						return (
							tempField[i - 1][j] +
							((hc * dx) / materials[materialType].thermalConductivity) *
								(Tinf - tempField[i - 1][j])
						);
					}
					case "insulated":
						return tempField[i - 1][j];
					default:
						return tempField[i][j];
				}
			}
		}

		// Left and right boundaries
		if (j === 0) {
			const bc = boundaryConditions.find((bc) => bc.side === "left");
			return bc?.type === "insulated" ? tempField[i][1] : tempField[i][j];
		}

		if (j === settings.gridSize - 1) {
			const bc = boundaryConditions.find((bc) => bc.side === "right");
			return bc?.type === "insulated" ? tempField[i][j - 1] : tempField[i][j];
		}

		return tempField[i][j];
	};

	const getTemperatureColor = (temperature: number): string => {
		const normalizedTemp = clamp(
			(temperature - settings.minTemperature) /
				(settings.maxTemperature - settings.minTemperature),
			0,
			1,
		);

		switch (settings.colorScale) {
			case "thermal":
				// Blue (cold) to Red (hot) thermal scale
				if (normalizedTemp < 0.25) {
					const t = normalizedTemp * 4;
					return toCssHsl(hsl(240, 100, lerp(20, 50, t)));
				} else if (normalizedTemp < 0.5) {
					const t = (normalizedTemp - 0.25) * 4;
					return toCssHsl(hsl(lerp(240, 180, t), 100, 50));
				} else if (normalizedTemp < 0.75) {
					const t = (normalizedTemp - 0.5) * 4;
					return toCssHsl(hsl(lerp(180, 60, t), 100, 50));
				} else {
					const t = (normalizedTemp - 0.75) * 4;
					return toCssHsl(hsl(lerp(60, 0, t), 100, lerp(50, 70, t)));
				}
			case "scientific":
				return toCssHsl(hsl(240 - normalizedTemp * 240, 80, 50));
			case "grayscale": {
				const gray = Math.round(normalizedTemp * 255);
				return `rgb(${gray}, ${gray}, ${gray})`;
			}
			default:
				return toCssHsl(hsl(240 - normalizedTemp * 240, 80, 50));
		}
	};

	const calculateAnalysis = () => {
		if (temperatureField.length === 0) return null;

		let maxTemp = Number.NEGATIVE_INFINITY;
		let minTemp = Number.POSITIVE_INFINITY;
		let avgTemp = 0;
		let totalHeatFlux = 0;
		let count = 0;

		for (let i = 0; i < settings.gridSize; i++) {
			for (let j = 0; j < settings.gridSize; j++) {
				const temp = temperatureField[i][j];
				maxTemp = Math.max(maxTemp, temp);
				minTemp = Math.min(minTemp, temp);
				avgTemp += temp;
				count++;

				if (heatFlux.x[i] && heatFlux.y[i]) {
					const fluxMagnitude = Math.sqrt(
						heatFlux.x[i][j] ** 2 + heatFlux.y[i][j] ** 2,
					);
					totalHeatFlux += fluxMagnitude;
				}
			}
		}

		avgTemp /= count;
		const avgHeatFlux = totalHeatFlux / count;

		// Calculate thermal resistance
		const deltaT = maxTemp - minTemp;
		const totalPower = heatSources.reduce(
			(sum, source) => sum + Math.abs(source.power),
			0,
		);
		const thermalResistance = deltaT / totalPower;

		return {
			maxTemperature: maxTemp,
			minTemperature: minTemp,
			averageTemperature: avgTemp,
			temperatureRange: deltaT,
			averageHeatFlux: avgHeatFlux,
			thermalResistance: thermalResistance,
			totalPower: totalPower,
		};
	};

	const draw = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;

		ctx.clearRect(0, 0, width, height);

		// Draw temperature field
		if (settings.showTemperatureField && temperatureField.length > 0) {
			const cellWidth = width / settings.gridSize;
			const cellHeight = height / settings.gridSize;

			for (let i = 0; i < settings.gridSize; i++) {
				for (let j = 0; j < settings.gridSize; j++) {
					ctx.fillStyle = getTemperatureColor(temperatureField[i][j]);
					ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
				}
			}
		}

		// Draw isotherms
		if (settings.showIsotherms && temperatureField.length > 0) {
			ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
			ctx.lineWidth = 1;

			const numIsotherms = 10;
			const tempStep =
				(settings.maxTemperature - settings.minTemperature) / numIsotherms;

			for (let iso = 1; iso < numIsotherms; iso++) {
				const isoTemp = settings.minTemperature + iso * tempStep;

				// Simple contour drawing
				for (let i = 1; i < settings.gridSize - 1; i++) {
					for (let j = 1; j < settings.gridSize - 1; j++) {
						const temp = temperatureField[i][j];
						if (Math.abs(temp - isoTemp) < tempStep * 0.1) {
							const x = (j / settings.gridSize) * width;
							const y = (i / settings.gridSize) * height;
							ctx.beginPath();
							ctx.arc(x, y, 1, 0, TWO_PI);
							ctx.stroke();
						}
					}
				}
			}
		}

		// Draw heat flux vectors
		if (settings.showHeatFlux && heatFlux.x.length > 0) {
			ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
			ctx.lineWidth = 1;

			const skip = Math.max(1, Math.floor(settings.gridSize / 20));

			for (let i = 0; i < settings.gridSize; i += skip) {
				for (let j = 0; j < settings.gridSize; j += skip) {
					if (heatFlux.x[i] && heatFlux.y[i]) {
						const fx = heatFlux.x[i][j];
						const fy = heatFlux.y[i][j];
						const magnitude = Math.sqrt(fx * fx + fy * fy);

						if (magnitude > 0.1) {
							const x = (j / settings.gridSize) * width;
							const y = (i / settings.gridSize) * height;
							const scale = 10;
							const endX = x + (fx / magnitude) * scale;
							const endY = y + (fy / magnitude) * scale;

							ctx.beginPath();
							ctx.moveTo(x, y);
							ctx.lineTo(endX, endY);
							ctx.stroke();

							// Arrow head
							const angle = Math.atan2(fy, fx);
							ctx.beginPath();
							ctx.moveTo(endX, endY);
							ctx.lineTo(
								endX - 5 * cos(angle - 0.3),
								endY - 5 * sin(angle - 0.3),
							);
							ctx.moveTo(endX, endY);
							ctx.lineTo(
								endX - 5 * cos(angle + 0.3),
								endY - 5 * sin(angle + 0.3),
							);
							ctx.stroke();
						}
					}
				}
			}
		}

		// Draw heat sources
		heatSources.forEach((source) => {
			const x = source.x * width;
			const y = source.y * height;
			const radius = 8;

			ctx.fillStyle = source.power > 0 ? "red" : "blue";
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, TWO_PI);
			ctx.fill();

			ctx.fillStyle = "white";
			ctx.font = "12px monospace";
			ctx.textAlign = "center";
			ctx.fillText(`${source.power}W`, x, y + 20);
		});
	};

	const animate = () => {
		if (isSimulating && temperatureField.length > 0) {
			const newField = solveDiffusionEquation(temperatureField);
			setTemperatureField(newField);

			const newHeatFlux = calculateHeatFlux(newField);
			setHeatFlux(newHeatFlux);

			timeRef.current += settings.timeStep;
		}

		draw();
		animationRef.current = requestAnimationFrame(animate);
	};

	useEffect(() => {
		initializeTemperatureField();
	}, [settings.gridSize, settings.ambientTemperature]);

	useEffect(() => {
		if (temperatureField.length > 0) {
			const flux = calculateHeatFlux(temperatureField);
			setHeatFlux(flux);
		}
	}, [temperatureField, materialType]);

	useEffect(() => {
		animationRef.current = requestAnimationFrame(animate);
		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [isSimulating, temperatureField, settings, heatFlux, heatSources]);

	const analysis = calculateAnalysis();

	return (
		<div className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-orange-50 to-red-50 min-h-screen">
			<div className="bg-white rounded-xl shadow-lg p-6 mb-6">
				<div className="flex items-center gap-3 mb-6">
					<div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
					<h1 className="text-2xl font-bold text-gray-800">
						Heat Transfer Analysis
					</h1>
					<div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
						Thermal Engineering Tool
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2">
						<div className="bg-gray-50 rounded-lg p-4 mb-4">
							<canvas
								ref={canvasRef}
								width={600}
								height={400}
								className="border border-gray-300 rounded-lg bg-white w-full"
							/>
						</div>

						<div className="flex gap-2 mb-4">
							<button
								onClick={() => setIsSimulating(!isSimulating)}
								className={`px-4 py-2 rounded-lg font-medium ${
									isSimulating
										? "bg-red-500 text-white hover:bg-red-600"
										: "bg-green-500 text-white hover:bg-green-600"
								}`}
							>
								{isSimulating ? "Pause" : "Start"} Simulation
							</button>
							<button
								onClick={() => {
									setIsSimulating(false);
									timeRef.current = 0;
									initializeTemperatureField();
								}}
								className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
							>
								Reset
							</button>
						</div>
					</div>

					<div className="space-y-4">
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Material Properties
							</h3>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Material Type
							</label>
							<select
								value={materialType}
								onChange={(e) => setMaterialType(e.target.value as any)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-3"
							>
								{Object.entries(materials).map(([key, material]) => (
									<option key={key} value={key}>
										{material.name} (k={material.thermalConductivity} W/m·K)
									</option>
								))}
							</select>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Analysis Type
							</label>
							<select
								value={analysisType}
								onChange={(e) => setAnalysisType(e.target.value as any)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
							>
								<option value="steady_state">Steady State</option>
								<option value="transient">Transient</option>
								<option value="coupled">Coupled</option>
							</select>
						</div>

						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Simulation Settings
							</h3>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Grid Resolution: {settings.gridSize}×{settings.gridSize}
							</label>
							<input
								type="range"
								min="20"
								max="100"
								step="10"
								value={settings.gridSize}
								onChange={(e) =>
									setSettings((prev) => ({
										...prev,
										gridSize: Number.parseInt(e.target.value),
									}))
								}
								className="w-full mb-3"
							/>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Time Step: {settings.timeStep}s
							</label>
							<input
								type="range"
								min="0.01"
								max="1.0"
								step="0.01"
								value={settings.timeStep}
								onChange={(e) =>
									setSettings((prev) => ({
										...prev,
										timeStep: Number.parseFloat(e.target.value),
									}))
								}
								className="w-full mb-3"
							/>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Max Temperature: {settings.maxTemperature}°C
							</label>
							<input
								type="range"
								min="50"
								max="500"
								step="10"
								value={settings.maxTemperature}
								onChange={(e) =>
									setSettings((prev) => ({
										...prev,
										maxTemperature: Number.parseInt(e.target.value),
									}))
								}
								className="w-full"
							/>
						</div>

						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Display Options
							</h3>

							<div className="space-y-2">
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={settings.showTemperatureField}
										onChange={(e) =>
											setSettings((prev) => ({
												...prev,
												showTemperatureField: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Temperature Field
								</label>
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={settings.showHeatFlux}
										onChange={(e) =>
											setSettings((prev) => ({
												...prev,
												showHeatFlux: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Heat Flux Vectors
								</label>
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={settings.showIsotherms}
										onChange={(e) =>
											setSettings((prev) => ({
												...prev,
												showIsotherms: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Isotherms
								</label>
							</div>

							<label className="block text-sm font-medium text-gray-700 mb-2 mt-3">
								Color Scale
							</label>
							<select
								value={settings.colorScale}
								onChange={(e) =>
									setSettings((prev) => ({
										...prev,
										colorScale: e.target.value as any,
									}))
								}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
							>
								<option value="thermal">Thermal (Blue-Red)</option>
								<option value="scientific">Scientific</option>
								<option value="grayscale">Grayscale</option>
							</select>
						</div>

						{analysis && (
							<div className="bg-gray-50 rounded-lg p-4">
								<h3 className="text-lg font-semibold text-gray-800 mb-3">
									Thermal Analysis
								</h3>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span>Max Temperature:</span>
										<span className="font-mono text-red-600">
											{analysis.maxTemperature.toFixed(1)}°C
										</span>
									</div>
									<div className="flex justify-between">
										<span>Min Temperature:</span>
										<span className="font-mono text-blue-600">
											{analysis.minTemperature.toFixed(1)}°C
										</span>
									</div>
									<div className="flex justify-between">
										<span>Avg Temperature:</span>
										<span className="font-mono">
											{analysis.averageTemperature.toFixed(1)}°C
										</span>
									</div>
									<div className="flex justify-between">
										<span>Thermal Resistance:</span>
										<span className="font-mono">
											{analysis.thermalResistance.toFixed(4)} K/W
										</span>
									</div>
									<div className="flex justify-between">
										<span>Avg Heat Flux:</span>
										<span className="font-mono">
											{analysis.averageHeatFlux.toFixed(1)} W/m²
										</span>
									</div>
									<div className="flex justify-between">
										<span>Total Power:</span>
										<span className="font-mono">
											{analysis.totalPower.toFixed(0)} W
										</span>
									</div>
									<div className="flex justify-between">
										<span>Simulation Time:</span>
										<span className="font-mono">
											{timeRef.current.toFixed(1)} s
										</span>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				<div className="mt-6 bg-blue-50 rounded-lg p-4">
					<h3 className="text-lg font-semibold text-blue-800 mb-2">
						Engineering Applications
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
						<div>
							<strong>Thermal Design:</strong>
							<ul className="mt-1 space-y-1">
								<li>• Electronics cooling analysis</li>
								<li>• HVAC system design</li>
								<li>• Heat exchanger optimization</li>
								<li>• Building energy analysis</li>
							</ul>
						</div>
						<div>
							<strong>Material Processing:</strong>
							<ul className="mt-1 space-y-1">
								<li>• Welding thermal profiles</li>
								<li>• Manufacturing cooling</li>
								<li>• Thermal stress analysis</li>
								<li>• Energy efficiency studies</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
