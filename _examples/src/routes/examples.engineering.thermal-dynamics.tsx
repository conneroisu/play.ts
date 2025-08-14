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

export const Route = createFileRoute("/examples/engineering/thermal-dynamics")({
	component: ThermalDynamicsExample,
});

interface ThermalNode {
	x: number;
	y: number;
	temperature: number;
	fixedTemp?: boolean;
	materialIndex: number;
}

interface ThermalMaterial {
	name: string;
	conductivity: number; // W/m·K
	density: number; // kg/m³
	specificHeat: number; // J/kg·K
	color: string;
}

interface HeatSource {
	x: number;
	y: number;
	power: number; // Watts
	radius: number;
}

function ThermalDynamicsExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();

	const [materials] = useState<ThermalMaterial[]>([
		{
			name: "Aluminum",
			conductivity: 237,
			density: 2700,
			specificHeat: 897,
			color: "#c0c0c0",
		},
		{
			name: "Steel",
			conductivity: 50,
			density: 7850,
			specificHeat: 434,
			color: "#708090",
		},
		{
			name: "Copper",
			conductivity: 401,
			density: 8960,
			specificHeat: 385,
			color: "#b87333",
		},
		{
			name: "Ceramic",
			conductivity: 2,
			density: 3800,
			specificHeat: 900,
			color: "#deb887",
		},
		{
			name: "Air",
			conductivity: 0.026,
			density: 1.225,
			specificHeat: 1006,
			color: "#87ceeb",
		},
	]);

	const [settings, setSettings] = useState({
		gridSize: 40,
		timeStep: 0.01,
		ambientTemp: 20,
		showTemperatureField: true,
		showHeatFlux: true,
		showIsotherms: true,
		animationSpeed: 1,
		colormap: "thermal" as "thermal" | "viridis" | "plasma",
	});

	const [nodes, setNodes] = useState<ThermalNode[]>([]);
	const [heatSources, setHeatSources] = useState<HeatSource[]>([
		{ x: 0.2, y: 0.5, power: 100, radius: 0.05 },
	]);
	const [materialBrush, setMaterialBrush] = useState(0);
	const [simulation, setSimulation] = useState({
		running: false,
		time: 0,
		maxTemp: 100,
		minTemp: 20,
	});

	// Initialize thermal grid
	useEffect(() => {
		const gridSize = settings.gridSize;
		const newNodes: ThermalNode[] = [];

		for (let i = 0; i < gridSize; i++) {
			for (let j = 0; j < gridSize; j++) {
				const x = i / (gridSize - 1);
				const y = j / (gridSize - 1);

				// Initialize with different materials in regions
				let materialIndex = 0;
				if (x < 0.3)
					materialIndex = 1; // Steel
				else if (x > 0.7)
					materialIndex = 2; // Copper
				else if (y < 0.3 || y > 0.7) materialIndex = 3; // Ceramic

				// Boundary conditions
				const fixedTemp =
					i === 0 || i === gridSize - 1 || j === 0 || j === gridSize - 1;

				newNodes.push({
					x,
					y,
					temperature: settings.ambientTemp,
					fixedTemp,
					materialIndex,
				});
			}
		}

		setNodes(newNodes);
	}, [settings.gridSize, settings.ambientTemp]);

	// Thermal simulation step
	const simulationStep = () => {
		if (!simulation.running) return;

		setNodes((prevNodes) => {
			const newNodes = [...prevNodes];
			const gridSize = settings.gridSize;
			const dt = settings.timeStep * settings.animationSpeed;
			const dx = 1 / (gridSize - 1);

			// Calculate new temperatures using finite difference method
			for (let i = 1; i < gridSize - 1; i++) {
				for (let j = 1; j < gridSize - 1; j++) {
					const idx = i * gridSize + j;
					const node = newNodes[idx];

					if (node.fixedTemp) continue;

					const material = materials[node.materialIndex];
					const alpha =
						material.conductivity / (material.density * material.specificHeat); // Thermal diffusivity

					// Get neighboring temperatures
					const T_right = newNodes[(i + 1) * gridSize + j].temperature;
					const T_left = newNodes[(i - 1) * gridSize + j].temperature;
					const T_up = newNodes[i * gridSize + (j + 1)].temperature;
					const T_down = newNodes[i * gridSize + (j - 1)].temperature;
					const T_center = node.temperature;

					// 2D heat equation: ∂T/∂t = α(∂²T/∂x² + ∂²T/∂y²)
					const d2T_dx2 = (T_right - 2 * T_center + T_left) / (dx * dx);
					const d2T_dy2 = (T_up - 2 * T_center + T_down) / (dx * dx);

					let dT_dt = alpha * (d2T_dx2 + d2T_dy2);

					// Add heat sources
					heatSources.forEach((source) => {
						const distance = Math.sqrt(
							(node.x - source.x) ** 2 + (node.y - source.y) ** 2,
						);
						if (distance < source.radius) {
							const heatFlux =
								source.power / (PI * source.radius * source.radius); // W/m²
							dT_dt +=
								heatFlux / (material.density * material.specificHeat * 0.01); // Approximate volume
						}
					});

					newNodes[idx].temperature = node.temperature + dT_dt * dt;
				}
			}

			return newNodes;
		});

		setSimulation((prev) => ({ ...prev, time: prev.time + settings.timeStep }));
	};

	// Animation loop
	useEffect(() => {
		if (simulation.running) {
			const animate = () => {
				simulationStep();
				animationRef.current = requestAnimationFrame(animate);
			};
			animationRef.current = requestAnimationFrame(animate);
		}

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [simulation.running, settings]);

	// Rendering
	const render = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx || nodes.length === 0) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const gridSize = settings.gridSize;
		const cellWidth = canvas.width / gridSize;
		const cellHeight = canvas.height / gridSize;

		// Find temperature range for color mapping
		const temps = nodes.map((n) => n.temperature);
		const minTemp = Math.min(...temps);
		const maxTemp = Math.max(...temps);
		const tempRange = maxTemp - minTemp || 1;

		// Update simulation stats
		setSimulation((prev) => ({ ...prev, minTemp, maxTemp }));

		// Draw temperature field
		if (settings.showTemperatureField) {
			for (let i = 0; i < gridSize; i++) {
				for (let j = 0; j < gridSize; j++) {
					const idx = i * gridSize + j;
					const node = nodes[idx];
					const normalizedTemp = (node.temperature - minTemp) / tempRange;

					const color = getTemperatureColor(normalizedTemp, settings.colormap);
					ctx.fillStyle = color;
					ctx.fillRect(i * cellWidth, j * cellHeight, cellWidth, cellHeight);
				}
			}
		}

		// Draw material boundaries
		ctx.strokeStyle = "#333";
		ctx.lineWidth = 1;
		for (let i = 0; i < gridSize - 1; i++) {
			for (let j = 0; j < gridSize - 1; j++) {
				const idx = i * gridSize + j;
				const currentMaterial = nodes[idx].materialIndex;
				const rightMaterial = nodes[(i + 1) * gridSize + j].materialIndex;
				const downMaterial = nodes[i * gridSize + (j + 1)].materialIndex;

				if (currentMaterial !== rightMaterial) {
					ctx.beginPath();
					ctx.moveTo((i + 1) * cellWidth, j * cellHeight);
					ctx.lineTo((i + 1) * cellWidth, (j + 1) * cellHeight);
					ctx.stroke();
				}

				if (currentMaterial !== downMaterial) {
					ctx.beginPath();
					ctx.moveTo(i * cellWidth, (j + 1) * cellHeight);
					ctx.lineTo((i + 1) * cellWidth, (j + 1) * cellHeight);
					ctx.stroke();
				}
			}
		}

		// Draw isotherms
		if (settings.showIsotherms) {
			ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
			ctx.lineWidth = 1;

			for (let tempLevel = 0.2; tempLevel <= 0.8; tempLevel += 0.2) {
				const targetTemp = minTemp + tempLevel * tempRange;
				drawIsotherm(ctx, nodes, gridSize, cellWidth, cellHeight, targetTemp);
			}
		}

		// Draw heat sources
		heatSources.forEach((source) => {
			const x = source.x * canvas.width;
			const y = source.y * canvas.height;
			const radius = source.radius * Math.min(canvas.width, canvas.height);

			ctx.fillStyle = "#ff4444";
			ctx.strokeStyle = "#cc0000";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, TWO_PI);
			ctx.fill();
			ctx.stroke();

			// Heat source label
			ctx.fillStyle = "#fff";
			ctx.font = "12px Arial";
			ctx.textAlign = "center";
			ctx.fillText(`${source.power}W`, x, y + 4);
		});

		// Draw heat flux vectors
		if (settings.showHeatFlux) {
			drawHeatFlux(ctx, nodes, gridSize, cellWidth, cellHeight, materials);
		}
	};

	const getTemperatureColor = (
		normalized: number,
		colormap: string,
	): string => {
		normalized = clamp(normalized, 0, 1);

		switch (colormap) {
			case "thermal":
				if (normalized < 0.25) {
					const t = normalized / 0.25;
					return `rgb(${Math.round(lerp(0, 0, t))}, ${Math.round(lerp(0, 100, t))}, ${Math.round(lerp(100, 200, t))})`;
				} else if (normalized < 0.5) {
					const t = (normalized - 0.25) / 0.25;
					return `rgb(${Math.round(lerp(0, 200, t))}, ${Math.round(lerp(100, 200, t))}, ${Math.round(lerp(200, 0, t))})`;
				} else if (normalized < 0.75) {
					const t = (normalized - 0.5) / 0.25;
					return `rgb(${Math.round(lerp(200, 255, t))}, ${Math.round(lerp(200, 255, t))}, 0)`;
				} else {
					const t = (normalized - 0.75) / 0.25;
					return `rgb(255, ${Math.round(lerp(255, 150, t))}, 0)`;
				}

			case "viridis":
				const r = Math.round(lerp(68, 253, normalized));
				const g = Math.round(lerp(1, 231, normalized * 0.8));
				const b = Math.round(lerp(84, 37, normalized));
				return `rgb(${r}, ${g}, ${b})`;

			case "plasma":
				const pr = Math.round(lerp(13, 240, normalized));
				const pg = Math.round(lerp(8, 249, normalized * 0.7));
				const pb = Math.round(lerp(135, 33, normalized));
				return `rgb(${pr}, ${pg}, ${pb})`;

			default:
				return `hsl(${240 - normalized * 240}, 100%, 50%)`;
		}
	};

	const drawIsotherm = (
		ctx: CanvasRenderingContext2D,
		nodes: ThermalNode[],
		gridSize: number,
		cellWidth: number,
		cellHeight: number,
		targetTemp: number,
	) => {
		// Simple isotherm drawing using marching squares concept
		for (let i = 0; i < gridSize - 1; i++) {
			for (let j = 0; j < gridSize - 1; j++) {
				const corners = [
					nodes[i * gridSize + j].temperature,
					nodes[(i + 1) * gridSize + j].temperature,
					nodes[(i + 1) * gridSize + (j + 1)].temperature,
					nodes[i * gridSize + (j + 1)].temperature,
				];

				// Check if isotherm passes through this cell
				const minCorner = Math.min(...corners);
				const maxCorner = Math.max(...corners);

				if (targetTemp >= minCorner && targetTemp <= maxCorner) {
					// Draw approximate isotherm line
					ctx.beginPath();
					ctx.moveTo(i * cellWidth + cellWidth / 2, j * cellHeight);
					ctx.lineTo(i * cellWidth + cellWidth / 2, (j + 1) * cellHeight);
					ctx.stroke();
				}
			}
		}
	};

	const drawHeatFlux = (
		ctx: CanvasRenderingContext2D,
		nodes: ThermalNode[],
		gridSize: number,
		cellWidth: number,
		cellHeight: number,
		materials: ThermalMaterial[],
	) => {
		ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
		ctx.lineWidth = 1;

		const step = 4; // Draw every 4th vector for clarity

		for (let i = step; i < gridSize - step; i += step) {
			for (let j = step; j < gridSize - step; j += step) {
				const idx = i * gridSize + j;
				const node = nodes[idx];
				const material = materials[node.materialIndex];

				// Calculate temperature gradients
				const T_right = nodes[(i + 1) * gridSize + j].temperature;
				const T_left = nodes[(i - 1) * gridSize + j].temperature;
				const T_up = nodes[i * gridSize + (j + 1)].temperature;
				const T_down = nodes[i * gridSize + (j - 1)].temperature;

				const dx = 2 / (gridSize - 1);
				const dT_dx = (T_right - T_left) / (2 * dx);
				const dT_dy = (T_up - T_down) / (2 * dx);

				// Heat flux: q = -k∇T
				const qx = -material.conductivity * dT_dx;
				const qy = -material.conductivity * dT_dy;

				const magnitude = Math.sqrt(qx * qx + qy * qy);
				if (magnitude < 1) continue; // Skip very small vectors

				const scale =
					(0.3 * Math.min(cellWidth, cellHeight)) /
					Math.max(Math.abs(qx), Math.abs(qy));

				const startX = i * cellWidth + cellWidth / 2;
				const startY = j * cellHeight + cellHeight / 2;
				const endX = startX + qx * scale;
				const endY = startY + qy * scale;

				// Draw arrow
				ctx.beginPath();
				ctx.moveTo(startX, startY);
				ctx.lineTo(endX, endY);
				ctx.stroke();

				// Arrow head
				const angle = Math.atan2(qy, qx);
				const headLength = 5;
				ctx.beginPath();
				ctx.moveTo(endX, endY);
				ctx.lineTo(
					endX - headLength * cos(angle - PI / 6),
					endY - headLength * sin(angle - PI / 6),
				);
				ctx.moveTo(endX, endY);
				ctx.lineTo(
					endX - headLength * cos(angle + PI / 6),
					endY - headLength * sin(angle + PI / 6),
				);
				ctx.stroke();
			}
		}
	};

	useEffect(() => {
		render();
	}, [nodes, settings, heatSources]);

	const toggleSimulation = () => {
		setSimulation((prev) => ({ ...prev, running: !prev.running }));
	};

	const resetSimulation = () => {
		setSimulation((prev) => ({ ...prev, running: false, time: 0 }));
		setNodes((prevNodes) =>
			prevNodes.map((node) => ({
				...node,
				temperature: node.fixedTemp
					? settings.ambientTemp
					: settings.ambientTemp,
			})),
		);
	};

	const addHeatSource = () => {
		setHeatSources((prev) => [
			...prev,
			{
				x: Math.random() * 0.6 + 0.2,
				y: Math.random() * 0.6 + 0.2,
				power: 50,
				radius: 0.03,
			},
		]);
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">Thermal Dynamics Simulation</h1>
				<p className="text-gray-600 mb-4">
					Advanced heat transfer simulation with finite difference method,
					multiple materials, and thermal analysis.
				</p>
				<div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
					<p className="text-slate-800">
						🔥 Real-time thermal analysis - heat conduction, material
						properties, and temperature field visualization
					</p>
				</div>
			</div>

			<div className="grid lg:grid-cols-4 gap-6">
				{/* Controls */}
				<div className="lg:col-span-1 space-y-6">
					<div className="bg-white border border-gray-300 rounded-lg p-4">
						<h3 className="text-lg font-semibold mb-4">Simulation Controls</h3>

						<div className="space-y-4">
							<div className="flex gap-2">
								<button
									onClick={toggleSimulation}
									className={`flex-1 px-3 py-2 rounded-md transition-colors ${
										simulation.running
											? "bg-red-600 text-white hover:bg-red-700"
											: "bg-green-600 text-white hover:bg-green-700"
									}`}
								>
									{simulation.running ? "Pause" : "Start"}
								</button>
								<button
									onClick={resetSimulation}
									className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
								>
									Reset
								</button>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Animation Speed: {settings.animationSpeed.toFixed(1)}x
								</label>
								<input
									type="range"
									min="0.1"
									max="3"
									step="0.1"
									value={settings.animationSpeed}
									onChange={(e) =>
										setSettings((prev) => ({
											...prev,
											animationSpeed: Number(e.target.value),
										}))
									}
									className="w-full"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Time Step: {settings.timeStep}
								</label>
								<input
									type="range"
									min="0.001"
									max="0.1"
									step="0.001"
									value={settings.timeStep}
									onChange={(e) =>
										setSettings((prev) => ({
											...prev,
											timeStep: Number(e.target.value),
										}))
									}
									className="w-full"
								/>
							</div>
						</div>
					</div>

					<div className="bg-white border border-gray-300 rounded-lg p-4">
						<h3 className="text-lg font-semibold mb-4">Display Options</h3>

						<div className="space-y-3">
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
								<span className="text-sm font-medium text-gray-700">
									Temperature Field
								</span>
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
								<span className="text-sm font-medium text-gray-700">
									Heat Flux Vectors
								</span>
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
								<span className="text-sm font-medium text-gray-700">
									Isotherms
								</span>
							</label>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Colormap
								</label>
								<select
									value={settings.colormap}
									onChange={(e) =>
										setSettings((prev) => ({
											...prev,
											colormap: e.target.value as typeof settings.colormap,
										}))
									}
									className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
								>
									<option value="thermal">Thermal</option>
									<option value="viridis">Viridis</option>
									<option value="plasma">Plasma</option>
								</select>
							</div>
						</div>
					</div>

					<div className="bg-white border border-gray-300 rounded-lg p-4">
						<h3 className="text-lg font-semibold mb-4">Heat Sources</h3>

						<button
							onClick={addHeatSource}
							className="w-full mb-4 px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
						>
							Add Heat Source
						</button>

						<div className="space-y-3">
							{heatSources.map((source, index) => (
								<div key={index} className="bg-gray-50 rounded-lg p-3">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm font-medium">
											Source {index + 1}
										</span>
										<button
											onClick={() =>
												setHeatSources((prev) =>
													prev.filter((_, i) => i !== index),
												)
											}
											className="text-red-600 hover:text-red-800 text-sm"
										>
											Remove
										</button>
									</div>

									<div className="space-y-2">
										<div>
											<label className="block text-xs text-gray-600">
												Power: {source.power}W
											</label>
											<input
												type="range"
												min="10"
												max="200"
												step="10"
												value={source.power}
												onChange={(e) => {
													const newSources = [...heatSources];
													newSources[index].power = Number(e.target.value);
													setHeatSources(newSources);
												}}
												className="w-full"
											/>
										</div>

										<div>
											<label className="block text-xs text-gray-600">
												Radius: {(source.radius * 100).toFixed(1)}%
											</label>
											<input
												type="range"
												min="0.01"
												max="0.1"
												step="0.005"
												value={source.radius}
												onChange={(e) => {
													const newSources = [...heatSources];
													newSources[index].radius = Number(e.target.value);
													setHeatSources(newSources);
												}}
												className="w-full"
											/>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Main Visualization */}
				<div className="lg:col-span-3">
					<div className="bg-white border border-gray-300 rounded-lg p-4">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold">
								Thermal Field Visualization
							</h3>
							<div className="text-sm text-gray-600">
								Time: {simulation.time.toFixed(2)}s | Temp Range:{" "}
								{simulation.minTemp.toFixed(1)}°C -{" "}
								{simulation.maxTemp.toFixed(1)}°C
							</div>
						</div>

						<canvas
							ref={canvasRef}
							width={600}
							height={600}
							className="border border-gray-300 rounded-lg bg-white w-full"
							style={{ maxWidth: "600px", height: "auto", aspectRatio: "1" }}
						/>
					</div>

					{/* Material Legend */}
					<div className="mt-4 bg-white border border-gray-300 rounded-lg p-4">
						<h3 className="text-lg font-semibold mb-3">Material Properties</h3>
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
							{materials.map((material, index) => (
								<div key={index} className="text-center">
									<div
										className="w-8 h-8 mx-auto mb-2 rounded border-2 border-gray-300"
										style={{ backgroundColor: material.color }}
									/>
									<div className="text-sm font-medium">{material.name}</div>
									<div className="text-xs text-gray-600">
										k: {material.conductivity} W/m·K
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			<div className="mt-8 grid md:grid-cols-2 gap-6">
				<div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-slate-800">
						Heat Transfer Physics
					</h3>
					<ul className="text-slate-700 space-y-1">
						<li>
							• <strong>Fourier's Law</strong>: q = -k∇T (heat conduction)
						</li>
						<li>
							• <strong>Heat Equation</strong>: ∂T/∂t = α∇²T (diffusion)
						</li>
						<li>
							• <strong>Thermal Diffusivity</strong>: α = k/(ρc_p)
						</li>
						<li>
							• <strong>Finite Difference</strong>: Numerical solution method
						</li>
					</ul>
				</div>

				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-blue-800">
						Engineering Applications
					</h3>
					<ul className="text-blue-700 space-y-1">
						<li>
							• <strong>Electronics Cooling</strong>: CPU heat dissipation
						</li>
						<li>
							• <strong>Building Design</strong>: Thermal insulation analysis
						</li>
						<li>
							• <strong>Manufacturing</strong>: Heat treatment processes
						</li>
						<li>
							• <strong>Energy Systems</strong>: Heat exchanger design
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
