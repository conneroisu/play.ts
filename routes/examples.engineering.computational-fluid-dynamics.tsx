import { createFileRoute, Link } from "@tanstack/react-router";
import {
	clamp,
	cos,
	hsl,
	hslToRgb,
	lerp,
	PI,
	randomFloat,
	sin,
	TWO_PI,
	toCssHsl,
	vec2,
	vec2Add,
	vec2Length,
	vec2Mul,
	vec2Normalize,
	vec2Sub,
} from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute(
	"/examples/engineering/computational-fluid-dynamics",
)({
	component: ComputationalFluidDynamicsExample,
});

interface FluidCell {
	u: number; // Velocity in x direction
	v: number; // Velocity in y direction
	p: number; // Pressure
	density: number; // Fluid density
	temperature: number; // Temperature for thermal effects
	vorticity: number; // Vorticity for visualization
}

interface FluidProperties {
	viscosity: number; // Dynamic viscosity (Pa·s)
	density: number; // Fluid density (kg/m³)
	thermalConductivity: number; // Thermal conductivity (W/m·K)
	specificHeat: number; // Specific heat capacity (J/kg·K)
	name: string;
	color: string;
}

interface FluidObstacle {
	x: number;
	y: number;
	width: number;
	height: number;
	type: "rectangle" | "circle";
	temperature?: number;
}

function ComputationalFluidDynamicsExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();

	const [fluidProperties] = useState<FluidProperties[]>([
		{
			name: "Water",
			viscosity: 0.001,
			density: 1000,
			thermalConductivity: 0.6,
			specificHeat: 4186,
			color: "#4a90e2",
		},
		{
			name: "Air",
			viscosity: 1.81e-5,
			density: 1.225,
			thermalConductivity: 0.026,
			specificHeat: 1006,
			color: "#87ceeb",
		},
		{
			name: "Oil",
			viscosity: 0.1,
			density: 850,
			thermalConductivity: 0.15,
			specificHeat: 2000,
			color: "#8b4513",
		},
		{
			name: "Honey",
			viscosity: 10,
			density: 1400,
			thermalConductivity: 0.5,
			specificHeat: 2500,
			color: "#ffd700",
		},
	]);

	const [settings, setSettings] = useState({
		gridSize: 64,
		timeStep: 0.01,
		viscosity: 0.001,
		density: 1000,
		inletVelocity: 2.0,
		reynoldsNumber: 1000,
		showVelocityField: true,
		showPressureField: false,
		showVorticity: true,
		showStreamlines: true,
		showTemperature: false,
		visualization: "velocity" as
			| "velocity"
			| "pressure"
			| "vorticity"
			| "temperature",
		fluidType: 0,
		inletTemperature: 300,
		wallTemperature: 280,
	});

	const [fluidGrid, setFluidGrid] = useState<FluidCell[][]>([]);
	const [obstacles, setObstacles] = useState<FluidObstacle[]>([
		{
			x: 0.3,
			y: 0.4,
			width: 0.08,
			height: 0.2,
			type: "rectangle",
			temperature: 350,
		},
	]);

	const [simulation, setSimulation] = useState({
		running: false,
		time: 0,
		convergence: 0,
		maxVelocity: 0,
		avgPressure: 0,
		dragCoefficient: 0,
		reynoldsNumber: 1000,
	});

	// Initialize fluid grid
	useEffect(() => {
		const gridSize = settings.gridSize;
		const newGrid: FluidCell[][] = [];

		for (let i = 0; i < gridSize; i++) {
			newGrid[i] = [];
			for (let j = 0; j < gridSize; j++) {
				const x = i / (gridSize - 1);
				const y = j / (gridSize - 1);

				// Initialize with inlet conditions on left side
				const u = x < 0.1 ? settings.inletVelocity : 0;
				const v = 0;
				const p = 0;
				const density = settings.density;
				const temperature = x < 0.1 ? settings.inletTemperature : 293; // Room temperature

				newGrid[i][j] = {
					u,
					v,
					p,
					density,
					temperature,
					vorticity: 0,
				};
			}
		}

		setFluidGrid(newGrid);
	}, [
		settings.gridSize,
		settings.density,
		settings.inletVelocity,
		settings.inletTemperature,
	]);

	// CFD simulation step using simplified Navier-Stokes
	const simulationStep = () => {
		if (!simulation.running || fluidGrid.length === 0) return;

		setFluidGrid((prevGrid) => {
			const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));
			const gridSize = settings.gridSize;
			const dt = settings.timeStep;
			const dx = 1 / (gridSize - 1);
			const Re = settings.reynoldsNumber;
			const nu = settings.viscosity / settings.density; // Kinematic viscosity

			let maxVel = 0;
			let totalPressure = 0;
			let cellCount = 0;

			// Apply Navier-Stokes equations
			for (let i = 1; i < gridSize - 1; i++) {
				for (let j = 1; j < gridSize - 1; j++) {
					const cell = newGrid[i][j];

					// Check if cell is inside obstacle
					let insideObstacle = false;
					for (const obstacle of obstacles) {
						const ox = obstacle.x * gridSize;
						const oy = obstacle.y * gridSize;
						const ow = obstacle.width * gridSize;
						const oh = obstacle.height * gridSize;

						if (obstacle.type === "rectangle") {
							if (i >= ox && i <= ox + ow && j >= oy && j <= oy + oh) {
								insideObstacle = true;
								// No-slip boundary condition
								cell.u = 0;
								cell.v = 0;
								if (obstacle.temperature) {
									cell.temperature = obstacle.temperature;
								}
								break;
							}
						}
					}

					if (insideObstacle) continue;

					// Get neighboring velocities with bounds checking
					const u_right =
						i + 1 < gridSize ? newGrid[i + 1][j].u || 0 : cell.u || 0;
					const u_left = i - 1 >= 0 ? newGrid[i - 1][j].u || 0 : cell.u || 0;
					const u_up =
						j + 1 < gridSize ? newGrid[i][j + 1].u || 0 : cell.u || 0;
					const u_down = j - 1 >= 0 ? newGrid[i][j - 1].u || 0 : cell.u || 0;

					const v_right =
						i + 1 < gridSize ? newGrid[i + 1][j].v || 0 : cell.v || 0;
					const v_left = i - 1 >= 0 ? newGrid[i - 1][j].v || 0 : cell.v || 0;
					const v_up =
						j + 1 < gridSize ? newGrid[i][j + 1].v || 0 : cell.v || 0;
					const v_down = j - 1 >= 0 ? newGrid[i][j - 1].v || 0 : cell.v || 0;

					const p_right =
						i + 1 < gridSize ? newGrid[i + 1][j].p || 0 : cell.p || 0;
					const p_left = i - 1 >= 0 ? newGrid[i - 1][j].p || 0 : cell.p || 0;
					const p_up =
						j + 1 < gridSize ? newGrid[i][j + 1].p || 0 : cell.p || 0;
					const p_down = j - 1 >= 0 ? newGrid[i][j - 1].p || 0 : cell.p || 0;

					// Pressure gradients
					const dp_dx = (p_right - p_left) / (2 * dx);
					const dp_dy = (p_up - p_down) / (2 * dx);

					// Velocity gradients for viscous terms
					const d2u_dx2 = (u_right - 2 * cell.u + u_left) / (dx * dx);
					const d2u_dy2 = (u_up - 2 * cell.u + u_down) / (dx * dx);
					const d2v_dx2 = (v_right - 2 * cell.v + v_left) / (dx * dx);
					const d2v_dy2 = (v_up - 2 * cell.v + v_down) / (dx * dx);

					// Convective terms (simplified)
					const du_dx = (u_right - u_left) / (2 * dx);
					const dv_dy = (v_up - v_down) / (2 * dx);
					const du_dy = (u_up - u_down) / (2 * dx);
					const dv_dx = (v_right - v_left) / (2 * dx);

					// Navier-Stokes momentum equations
					// ∂u/∂t = -u∂u/∂x - v∂u/∂y - (1/ρ)∂p/∂x + ν∇²u
					const du_dt =
						-cell.u * du_dx -
						cell.v * du_dy -
						dp_dx / settings.density +
						nu * (d2u_dx2 + d2u_dy2);
					const dv_dt =
						-cell.u * dv_dx -
						cell.v * dv_dy -
						dp_dy / settings.density +
						nu * (d2v_dx2 + d2v_dy2);

					// Update velocities with NaN protection
					if (isFinite(du_dt)) cell.u += du_dt * dt;
					if (isFinite(dv_dt)) cell.v += dv_dt * dt;

					// Clamp velocities to prevent numerical instability
					cell.u = clamp(cell.u || 0, -10, 10);
					cell.v = clamp(cell.v || 0, -10, 10);

					// Calculate vorticity: ω = ∂v/∂x - ∂u/∂y
					cell.vorticity = dv_dx - du_dy;

					// Inlet boundary condition
					if (i < 3) {
						cell.u =
							settings.inletVelocity *
							(1 - ((j - gridSize / 2) / (gridSize / 4)) ** 2);
						cell.v = 0;
						cell.temperature = settings.inletTemperature;
					}

					// Outlet boundary condition
					if (i > gridSize - 4) {
						cell.u = newGrid[i - 1][j].u;
						cell.v = newGrid[i - 1][j].v;
					}

					// Wall boundary conditions
					if (j < 2 || j > gridSize - 3) {
						cell.u = 0;
						cell.v = 0;
						cell.temperature = settings.wallTemperature;
					}

					// Update pressure using simplified pressure correction
					const divergence = du_dx + dv_dy;
					if (isFinite(divergence)) {
						cell.p -= divergence * dt * 100; // Simplified pressure correction
					}
					cell.p = clamp(cell.p || 0, -1000, 1000);

					// Calculate statistics
					const velocity = Math.sqrt(cell.u * cell.u + cell.v * cell.v);
					maxVel = Math.max(maxVel, velocity);
					totalPressure += cell.p;
					cellCount++;
				}
			}

			// Update simulation statistics
			setSimulation((prev) => ({
				...prev,
				time: prev.time + dt,
				maxVelocity: maxVel,
				avgPressure: totalPressure / cellCount,
				reynoldsNumber: (maxVel * 0.1) / nu, // Characteristic length = 0.1
			}));

			return newGrid;
		});
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
		if (!canvas || !ctx || fluidGrid.length === 0) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const gridSize = settings.gridSize;
		const cellWidth = canvas.width / gridSize;
		const cellHeight = canvas.height / gridSize;

		// Render based on visualization type
		for (let i = 0; i < gridSize; i++) {
			for (let j = 0; j < gridSize; j++) {
				const cell = fluidGrid[i][j];
				let color = "#000000";

				switch (settings.visualization) {
					case "velocity": {
						const velocity = Math.sqrt(cell.u * cell.u + cell.v * cell.v);
						const normalizedVel = clamp(
							velocity / settings.inletVelocity,
							0,
							1,
						);
						color = `hsl(${240 - normalizedVel * 240}, 100%, ${50 + normalizedVel * 30}%)`;
						break;
					}
					case "pressure": {
						const normalizedP = clamp((cell.p + 50) / 100, 0, 1);
						color = `hsl(${normalizedP * 60}, 100%, 50%)`;
						break;
					}
					case "vorticity": {
						const normalizedVort = clamp((cell.vorticity + 10) / 20, 0, 1);
						color = `hsl(${normalizedVort * 300}, 100%, 50%)`;
						break;
					}
					case "temperature": {
						const normalizedTemp = clamp((cell.temperature - 280) / 80, 0, 1);
						color = `hsl(${240 - normalizedTemp * 240}, 100%, 50%)`;
						break;
					}
				}

				ctx.fillStyle = color;
				ctx.fillRect(i * cellWidth, j * cellHeight, cellWidth, cellHeight);
			}
		}

		// Draw velocity vectors
		if (settings.showVelocityField) {
			ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
			ctx.lineWidth = 1;

			const step = Math.max(1, Math.floor(gridSize / 20));
			for (let i = 0; i < gridSize; i += step) {
				for (let j = 0; j < gridSize; j += step) {
					const cell = fluidGrid[i][j];
					const x = i * cellWidth + cellWidth / 2;
					const y = j * cellHeight + cellHeight / 2;
					const scale = 20;

					ctx.beginPath();
					ctx.moveTo(x, y);
					ctx.lineTo(x + cell.u * scale, y + cell.v * scale);
					ctx.stroke();

					// Arrow head
					const angle = Math.atan2(cell.v, cell.u);
					const arrowLength = 5;
					ctx.beginPath();
					ctx.moveTo(x + cell.u * scale, y + cell.v * scale);
					ctx.lineTo(
						x + cell.u * scale - arrowLength * cos(angle - PI / 6),
						y + cell.v * scale - arrowLength * sin(angle - PI / 6),
					);
					ctx.moveTo(x + cell.u * scale, y + cell.v * scale);
					ctx.lineTo(
						x + cell.u * scale - arrowLength * cos(angle + PI / 6),
						y + cell.v * scale - arrowLength * sin(angle + PI / 6),
					);
					ctx.stroke();
				}
			}
		}

		// Draw obstacles
		obstacles.forEach((obstacle) => {
			ctx.fillStyle = "rgba(100, 100, 100, 0.8)";
			ctx.strokeStyle = "#333";
			ctx.lineWidth = 2;

			const x = obstacle.x * canvas.width;
			const y = obstacle.y * canvas.height;
			const w = obstacle.width * canvas.width;
			const h = obstacle.height * canvas.height;

			if (obstacle.type === "rectangle") {
				ctx.fillRect(x, y, w, h);
				ctx.strokeRect(x, y, w, h);
			} else if (obstacle.type === "circle") {
				ctx.beginPath();
				ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, TWO_PI);
				ctx.fill();
				ctx.stroke();
			}
		});

		// Draw streamlines if enabled
		if (settings.showStreamlines && fluidGrid.length > 0) {
			ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
			ctx.lineWidth = 1;

			for (let startY = 0.1; startY < 0.9; startY += 0.1) {
				let x = 0.05;
				let y = startY;

				ctx.beginPath();
				ctx.moveTo(x * canvas.width, y * canvas.height);

				for (let step = 0; step < 200; step++) {
					const i = Math.floor(x * gridSize);
					const j = Math.floor(y * gridSize);

					if (i >= gridSize - 1 || j >= gridSize - 1 || i < 0 || j < 0) break;

					const cell = fluidGrid[i][j];
					const vel = Math.sqrt(cell.u * cell.u + cell.v * cell.v);
					if (vel < 0.01) break;

					x += cell.u * 0.001;
					y += cell.v * 0.001;

					ctx.lineTo(x * canvas.width, y * canvas.height);

					if (x > 0.95) break;
				}

				ctx.stroke();
			}
		}
	};

	useEffect(() => {
		render();
	}, [fluidGrid, settings, obstacles]);

	const toggleSimulation = () => {
		setSimulation((prev) => ({ ...prev, running: !prev.running }));
	};

	const resetSimulation = () => {
		setSimulation((prev) => ({ ...prev, running: false, time: 0 }));
		// Reinitialize grid
		const gridSize = settings.gridSize;
		const newGrid: FluidCell[][] = [];

		for (let i = 0; i < gridSize; i++) {
			newGrid[i] = [];
			for (let j = 0; j < gridSize; j++) {
				const x = i / (gridSize - 1);
				const u = x < 0.1 ? settings.inletVelocity : 0;
				newGrid[i][j] = {
					u,
					v: 0,
					p: 0,
					density: settings.density,
					temperature: x < 0.1 ? settings.inletTemperature : 293,
					vorticity: 0,
				};
			}
		}

		setFluidGrid(newGrid);
	};

	const addObstacle = () => {
		setObstacles((prev) => [
			...prev,
			{
				x: randomFloat(0.2, 0.6),
				y: randomFloat(0.3, 0.6),
				width: randomFloat(0.05, 0.15),
				height: randomFloat(0.05, 0.15),
				type: Math.random() > 0.5 ? "rectangle" : "circle",
				temperature: randomFloat(280, 400),
			},
		]);
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Computational Fluid Dynamics
				</h1>
				<p className="text-gray-600 mb-4">
					Advanced CFD simulation using the Navier-Stokes equations with
					interactive visualization and analysis tools.
				</p>
				<div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
					<p className="text-slate-800">
						🌊 Real-time fluid simulation - Reynolds numbers, pressure fields,
						vorticity, and thermal effects
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
									Inlet Velocity: {settings.inletVelocity.toFixed(1)} m/s
								</label>
								<input
									type="range"
									min="0.5"
									max="5"
									step="0.1"
									value={settings.inletVelocity}
									onChange={(e) =>
										setSettings((prev) => ({
											...prev,
											inletVelocity: Number(e.target.value),
										}))
									}
									className="w-full"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Reynolds Number: {settings.reynoldsNumber.toFixed(0)}
								</label>
								<input
									type="range"
									min="100"
									max="5000"
									step="100"
									value={settings.reynoldsNumber}
									onChange={(e) =>
										setSettings((prev) => ({
											...prev,
											reynoldsNumber: Number(e.target.value),
											viscosity:
												(simulation.maxVelocity * 0.1 * settings.density) /
													Number(e.target.value) || 0.001,
										}))
									}
									className="w-full"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Fluid Type
								</label>
								<select
									value={settings.fluidType}
									onChange={(e) => {
										const idx = Number(e.target.value);
										const fluid = fluidProperties[idx];
										setSettings((prev) => ({
											...prev,
											fluidType: idx,
											density: fluid.density,
											viscosity: fluid.viscosity,
										}));
									}}
									className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
								>
									{fluidProperties.map((fluid, idx) => (
										<option key={idx} value={idx}>
											{fluid.name}
										</option>
									))}
								</select>
							</div>
						</div>
					</div>

					<div className="bg-white border border-gray-300 rounded-lg p-4">
						<h3 className="text-lg font-semibold mb-4">Visualization</h3>

						<div className="space-y-3">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Field Type
								</label>
								<select
									value={settings.visualization}
									onChange={(e) =>
										setSettings((prev) => ({
											...prev,
											visualization: e.target.value as any,
										}))
									}
									className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
								>
									<option value="velocity">Velocity Magnitude</option>
									<option value="pressure">Pressure Field</option>
									<option value="vorticity">Vorticity</option>
									<option value="temperature">Temperature</option>
								</select>
							</div>

							<label className="flex items-center">
								<input
									type="checkbox"
									checked={settings.showVelocityField}
									onChange={(e) =>
										setSettings((prev) => ({
											...prev,
											showVelocityField: e.target.checked,
										}))
									}
									className="mr-2"
								/>
								<span className="text-sm font-medium text-gray-700">
									Velocity Vectors
								</span>
							</label>

							<label className="flex items-center">
								<input
									type="checkbox"
									checked={settings.showStreamlines}
									onChange={(e) =>
										setSettings((prev) => ({
											...prev,
											showStreamlines: e.target.checked,
										}))
									}
									className="mr-2"
								/>
								<span className="text-sm font-medium text-gray-700">
									Streamlines
								</span>
							</label>
						</div>
					</div>

					<div className="bg-white border border-gray-300 rounded-lg p-4">
						<h3 className="text-lg font-semibold mb-4">Obstacles</h3>

						<button
							onClick={addObstacle}
							className="w-full mb-4 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
						>
							Add Obstacle
						</button>

						<div className="space-y-3">
							{obstacles.map((obstacle, index) => (
								<div key={index} className="bg-gray-50 rounded-lg p-3">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm font-medium">
											{obstacle.type} {index + 1}
										</span>
										<button
											onClick={() =>
												setObstacles((prev) =>
													prev.filter((_, i) => i !== index),
												)
											}
											className="text-red-600 hover:text-red-800 text-sm"
										>
											Remove
										</button>
									</div>

									<div className="text-xs text-gray-600">
										Position: ({(obstacle.x * 100).toFixed(0)}%,{" "}
										{(obstacle.y * 100).toFixed(0)}%)
										<br />
										Size: {(obstacle.width * 100).toFixed(0)}% ×{" "}
										{(obstacle.height * 100).toFixed(0)}%
										{obstacle.temperature && (
											<>
												<br />
												Temperature: {(obstacle.temperature || 0).toFixed(0)}K
											</>
										)}
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
							<h3 className="text-lg font-semibold">CFD Simulation</h3>
							<div className="text-sm text-gray-600">
								Time: {(simulation.time || 0).toFixed(2)}s | Max Vel:{" "}
								{(simulation.maxVelocity || 0).toFixed(2)} m/s | Re:{" "}
								{(simulation.reynoldsNumber || 0).toFixed(0)}
							</div>
						</div>

						<canvas
							ref={canvasRef}
							width={800}
							height={400}
							className="border border-gray-300 rounded-lg bg-white w-full"
							style={{ maxWidth: "800px", height: "auto", aspectRatio: "2" }}
						/>
					</div>

					{/* Statistics Panel */}
					<div className="mt-4 bg-white border border-gray-300 rounded-lg p-4">
						<h3 className="text-lg font-semibold mb-3">Flow Statistics</h3>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div className="text-center">
								<div className="text-2xl font-bold text-blue-600">
									{(simulation.maxVelocity || 0).toFixed(2)}
								</div>
								<div className="text-sm text-gray-600">Max Velocity (m/s)</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-green-600">
									{(simulation.reynoldsNumber || 0).toFixed(0)}
								</div>
								<div className="text-sm text-gray-600">Reynolds Number</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-purple-600">
									{(simulation.avgPressure || 0).toFixed(1)}
								</div>
								<div className="text-sm text-gray-600">Avg Pressure (Pa)</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-orange-600">
									{fluidProperties[settings.fluidType].name}
								</div>
								<div className="text-sm text-gray-600">Fluid Type</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="mt-8 grid md:grid-cols-2 gap-6">
				<div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-slate-800">
						CFD Physics
					</h3>
					<ul className="text-slate-700 space-y-1">
						<li>
							• <strong>Navier-Stokes Equations</strong>: ∇·V = 0, ∂V/∂t +
							(V·∇)V = -∇p/ρ + ν∇²V
						</li>
						<li>
							• <strong>Reynolds Number</strong>: Re = VL/ν (inertial/viscous
							forces)
						</li>
						<li>
							• <strong>Vorticity</strong>: ω = ∇ × V (fluid rotation)
						</li>
						<li>
							• <strong>Streamlines</strong>: Flow path visualization
						</li>
					</ul>
				</div>

				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-blue-800">
						Engineering Applications
					</h3>
					<ul className="text-blue-700 space-y-1">
						<li>
							• <strong>Aerodynamics</strong>: Aircraft and vehicle design
						</li>
						<li>
							• <strong>HVAC Systems</strong>: Building climate control
						</li>
						<li>
							• <strong>Process Engineering</strong>: Chemical reactor design
						</li>
						<li>
							• <strong>Environmental</strong>: Pollution dispersion modeling
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
