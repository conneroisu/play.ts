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
	vec2Distance,
	vec2Dot,
	vec2Mul,
	vec2Normalize,
	vec2Sub,
} from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/visual/fluid-dynamics")({
	component: FluidDynamicsExample,
});

interface FluidParticle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	density: number;
	pressure: number;
	id: number;
	color: { r: number; g: number; b: number };
	life: number;
}

interface FluidSettings {
	numParticles: number;
	viscosity: number;
	gravity: number;
	restDensity: number;
	gasConstant: number;
	particleRadius: number;
	smoothingRadius: number;
	timeStep: number;
	damping: number;
	surfaceTension: number;
	colorMode: "velocity" | "pressure" | "density" | "temperature";
	showGrid: boolean;
	showVelocity: boolean;
}

interface GridCell {
	particles: FluidParticle[];
}

function FluidDynamicsExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const mouseRef = useRef({ x: 0, y: 0, down: false, radius: 30 });

	const [particles, setParticles] = useState<FluidParticle[]>([]);
	const [isSimulating, setIsSimulating] = useState(false);
	const [settings, setSettings] = useState<FluidSettings>({
		numParticles: 200,
		viscosity: 0.1,
		gravity: 300,
		restDensity: 1000,
		gasConstant: 2000,
		particleRadius: 4,
		smoothingRadius: 16,
		timeStep: 0.016,
		damping: 0.9,
		surfaceTension: 0.1,
		colorMode: "velocity",
		showGrid: false,
		showVelocity: false,
	});
	const [presetType, setPresetType] = useState<
		"water" | "oil" | "gas" | "honey" | "custom"
	>("water");

	const gridRef = useRef<GridCell[][]>([]);
	const GRID_SIZE = 32;

	const initializeParticles = (): FluidParticle[] => {
		const canvas = canvasRef.current;
		if (!canvas) return [];

		const newParticles: FluidParticle[] = [];
		const spacing = settings.particleRadius * 2.2;
		const startX = canvas.width * 0.3;
		const startY = canvas.height * 0.2;
		const cols = Math.floor(Math.sqrt(settings.numParticles * 1.5));
		const rows = Math.ceil(settings.numParticles / cols);

		for (let i = 0; i < settings.numParticles; i++) {
			const col = i % cols;
			const row = Math.floor(i / cols);

			newParticles.push({
				x: startX + col * spacing + randomFloat(-2, 2),
				y: startY + row * spacing + randomFloat(-2, 2),
				vx: randomFloat(-10, 10),
				vy: randomFloat(-10, 10),
				density: settings.restDensity,
				pressure: 0,
				id: i,
				color: { r: 100, g: 150, b: 255 },
				life: 1.0,
			});
		}

		return newParticles;
	};

	const applyPreset = (type: string) => {
		switch (type) {
			case "water":
				setSettings((prev) => ({
					...prev,
					viscosity: 0.1,
					gravity: 300,
					gasConstant: 2000,
					damping: 0.9,
					surfaceTension: 0.1,
				}));
				break;
			case "oil":
				setSettings((prev) => ({
					...prev,
					viscosity: 0.3,
					gravity: 250,
					gasConstant: 1500,
					damping: 0.95,
					surfaceTension: 0.2,
				}));
				break;
			case "gas":
				setSettings((prev) => ({
					...prev,
					viscosity: 0.01,
					gravity: 50,
					gasConstant: 3000,
					damping: 0.8,
					surfaceTension: 0.01,
				}));
				break;
			case "honey":
				setSettings((prev) => ({
					...prev,
					viscosity: 0.8,
					gravity: 200,
					gasConstant: 1000,
					damping: 0.98,
					surfaceTension: 0.3,
				}));
				break;
		}
	};

	const initializeGrid = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const cols = Math.ceil(canvas.width / GRID_SIZE);
		const rows = Math.ceil(canvas.height / GRID_SIZE);

		gridRef.current = Array(rows)
			.fill(null)
			.map(() =>
				Array(cols)
					.fill(null)
					.map(() => ({ particles: [] })),
			);
	};

	const clearGrid = () => {
		gridRef.current.forEach((row) => {
			row.forEach((cell) => {
				cell.particles = [];
			});
		});
	};

	const addToGrid = (particle: FluidParticle) => {
		const col = Math.floor(particle.x / GRID_SIZE);
		const row = Math.floor(particle.y / GRID_SIZE);

		if (
			row >= 0 &&
			row < gridRef.current.length &&
			col >= 0 &&
			col < gridRef.current[0].length
		) {
			gridRef.current[row][col].particles.push(particle);
		}
	};

	const getNeighbors = (particle: FluidParticle): FluidParticle[] => {
		const neighbors: FluidParticle[] = [];
		const col = Math.floor(particle.x / GRID_SIZE);
		const row = Math.floor(particle.y / GRID_SIZE);

		for (let r = row - 1; r <= row + 1; r++) {
			for (let c = col - 1; c <= col + 1; c++) {
				if (
					r >= 0 &&
					r < gridRef.current.length &&
					c >= 0 &&
					c < gridRef.current[0].length
				) {
					neighbors.push(...gridRef.current[r][c].particles);
				}
			}
		}

		return neighbors;
	};

	const smoothingKernel = (distance: number, radius: number): number => {
		if (distance >= radius) return 0;
		const q = distance / radius;
		return (315 / (64 * PI * radius ** 9)) * (1 - q ** 2) ** 3;
	};

	const smoothingKernelGradient = (
		distance: number,
		radius: number,
	): number => {
		if (distance >= radius) return 0;
		const q = distance / radius;
		return -(945 / (32 * PI * radius ** 9)) * (1 - q ** 2) ** 2 * q;
	};

	const viscosityKernel = (distance: number, radius: number): number => {
		if (distance >= radius) return 0;
		const q = distance / radius;
		return (45 / (PI * radius ** 6)) * (1 - q);
	};

	const calculateDensityAndPressure = () => {
		clearGrid();

		// Add particles to grid
		particles.forEach(addToGrid);

		// Calculate density
		particles.forEach((particle) => {
			const neighbors = getNeighbors(particle);
			let density = 0;

			neighbors.forEach((neighbor) => {
				const distance = vec2Distance(particle, neighbor);
				if (distance < settings.smoothingRadius) {
					density += smoothingKernel(distance, settings.smoothingRadius);
				}
			});

			particle.density = Math.max(density, settings.restDensity * 0.1);
			particle.pressure =
				settings.gasConstant * (particle.density - settings.restDensity);
		});
	};

	const calculateForces = () => {
		particles.forEach((particle) => {
			const neighbors = getNeighbors(particle);
			let pressureForceX = 0;
			let pressureForceY = 0;
			let viscosityForceX = 0;
			let viscosityForceY = 0;

			neighbors.forEach((neighbor) => {
				if (particle.id === neighbor.id) return;

				const distance = vec2Distance(particle, neighbor);
				if (distance < settings.smoothingRadius && distance > 0) {
					const direction = vec2Normalize(vec2Sub(particle, neighbor));

					// Pressure force
					const pressureForce =
						((particle.pressure + neighbor.pressure) / (2 * neighbor.density)) *
						smoothingKernelGradient(distance, settings.smoothingRadius);
					pressureForceX += direction.x * pressureForce;
					pressureForceY += direction.y * pressureForce;

					// Viscosity force
					const velocityDiff = vec2Sub(
						{ x: neighbor.vx, y: neighbor.vy },
						{ x: particle.vx, y: particle.vy },
					);
					const viscosityForce =
						settings.viscosity *
						(1 / neighbor.density) *
						viscosityKernel(distance, settings.smoothingRadius);
					viscosityForceX += velocityDiff.x * viscosityForce;
					viscosityForceY += velocityDiff.y * viscosityForce;
				}
			});

			// Apply forces
			const totalForceX = -pressureForceX + viscosityForceX;
			const totalForceY = -pressureForceY + viscosityForceY + settings.gravity;

			particle.vx += (totalForceX * settings.timeStep) / particle.density;
			particle.vy += (totalForceY * settings.timeStep) / particle.density;

			// Mouse interaction
			if (mouseRef.current.down) {
				const mouseDistance = vec2Distance(particle, mouseRef.current);
				if (mouseDistance < mouseRef.current.radius) {
					const force =
						(mouseRef.current.radius - mouseDistance) / mouseRef.current.radius;
					const direction = vec2Normalize(vec2Sub(particle, mouseRef.current));
					particle.vx += direction.x * force * 500 * settings.timeStep;
					particle.vy += direction.y * force * 500 * settings.timeStep;
				}
			}
		});
	};

	const integrateMotion = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		particles.forEach((particle) => {
			// Apply damping
			particle.vx *= settings.damping;
			particle.vy *= settings.damping;

			// Update position
			particle.x += particle.vx * settings.timeStep;
			particle.y += particle.vy * settings.timeStep;

			// Boundary collision
			const radius = settings.particleRadius;

			if (particle.x - radius < 0) {
				particle.x = radius;
				particle.vx *= -0.5;
			}
			if (particle.x + radius > canvas.width) {
				particle.x = canvas.width - radius;
				particle.vx *= -0.5;
			}
			if (particle.y - radius < 0) {
				particle.y = radius;
				particle.vy *= -0.3;
			}
			if (particle.y + radius > canvas.height) {
				particle.y = canvas.height - radius;
				particle.vy *= -0.3;
			}
		});
	};

	const updateParticleColors = () => {
		particles.forEach((particle) => {
			const velocity = Math.sqrt(particle.vx ** 2 + particle.vy ** 2);

			switch (settings.colorMode) {
				case "velocity": {
					const speed = clamp(velocity / 200, 0, 1);
					const color = hslToRgb(hsl(240 - speed * 180, 80, 50));
					particle.color = color;
					break;
				}
				case "pressure": {
					const normalizedPressure = clamp(particle.pressure / 5000, -1, 1);
					const hue = normalizedPressure > 0 ? 0 : 240;
					const intensity = Math.abs(normalizedPressure);
					const color = hslToRgb(hsl(hue, 80, 30 + intensity * 40));
					particle.color = color;
					break;
				}
				case "density": {
					const densityRatio = particle.density / settings.restDensity;
					const hue = 200 + densityRatio * 100;
					const color = hslToRgb(hsl(hue, 70, 50));
					particle.color = color;
					break;
				}
				case "temperature": {
					const temperature = (velocity * particle.density) / 10000;
					const hue = 240 - clamp(temperature, 0, 1) * 240;
					const color = hslToRgb(hsl(hue, 80, 50));
					particle.color = color;
					break;
				}
			}
		});
	};

	const simulate = () => {
		calculateDensityAndPressure();
		calculateForces();
		integrateMotion();
		updateParticleColors();
	};

	const render = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw background
		ctx.fillStyle = "#001122";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Draw grid
		if (settings.showGrid) {
			ctx.strokeStyle = "rgba(100, 100, 100, 0.3)";
			ctx.lineWidth = 1;

			for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
				ctx.beginPath();
				ctx.moveTo(x, 0);
				ctx.lineTo(x, canvas.height);
				ctx.stroke();
			}

			for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
				ctx.beginPath();
				ctx.moveTo(0, y);
				ctx.lineTo(canvas.width, y);
				ctx.stroke();
			}
		}

		// Draw particles
		particles.forEach((particle) => {
			// Particle body
			ctx.fillStyle = `rgb(${particle.color.r}, ${particle.color.g}, ${particle.color.b})`;
			ctx.beginPath();
			ctx.arc(particle.x, particle.y, settings.particleRadius, 0, TWO_PI);
			ctx.fill();

			// Particle highlight
			ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
			ctx.beginPath();
			ctx.arc(
				particle.x - 1,
				particle.y - 1,
				settings.particleRadius * 0.6,
				0,
				TWO_PI,
			);
			ctx.fill();

			// Velocity vectors
			if (settings.showVelocity) {
				const scale = 0.1;
				ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(particle.x, particle.y);
				ctx.lineTo(
					particle.x + particle.vx * scale,
					particle.y + particle.vy * scale,
				);
				ctx.stroke();
			}
		});

		// Draw mouse interaction area
		if (mouseRef.current.down) {
			ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(
				mouseRef.current.x,
				mouseRef.current.y,
				mouseRef.current.radius,
				0,
				TWO_PI,
			);
			ctx.stroke();
		}

		// Draw info
		ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
		ctx.fillRect(10, 10, 200, 60);
		ctx.fillStyle = "#ffffff";
		ctx.font = "14px Arial";
		ctx.fillText(`Particles: ${particles.length}`, 20, 30);
		ctx.fillText(`Preset: ${presetType}`, 20, 50);
		ctx.fillText(`Mode: ${settings.colorMode}`, 20, 70);
	};

	const animate = () => {
		if (isSimulating) {
			simulate();
		}
		render();
		animationRef.current = requestAnimationFrame(animate);
	};

	const startSimulation = () => {
		setIsSimulating(true);
	};

	const stopSimulation = () => {
		setIsSimulating(false);
	};

	const resetSimulation = () => {
		const newParticles = initializeParticles();
		setParticles(newParticles);
	};

	const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		mouseRef.current.x = e.clientX - rect.left;
		mouseRef.current.y = e.clientY - rect.top;
		mouseRef.current.down = true;
	};

	const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		mouseRef.current.x = e.clientX - rect.left;
		mouseRef.current.y = e.clientY - rect.top;
	};

	const handleMouseUp = () => {
		mouseRef.current.down = false;
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.width = 800;
		canvas.height = 600;

		initializeGrid();
		const initialParticles = initializeParticles();
		setParticles(initialParticles);

		animationRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (presetType !== "custom") {
			applyPreset(presetType);
		}
	}, [presetType]);

	useEffect(() => {
		resetSimulation();
	}, [settings.numParticles]);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">Fluid Dynamics Simulation</h1>
				<p className="text-gray-600 mb-4">
					Real-time particle-based fluid simulation using Smoothed Particle
					Hydrodynamics (SPH) with interactive controls.
				</p>
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<p className="text-blue-800">
						💧 Watch fluid behavior with realistic physics, drag to interact,
						explore different fluid types
					</p>
				</div>
			</div>

			<div className="mb-6">
				<div className="flex flex-wrap gap-4 mb-4">
					<button
						type="button"
						onClick={startSimulation}
						disabled={isSimulating}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
					>
						Start Simulation
					</button>
					<button
						type="button"
						onClick={stopSimulation}
						disabled={!isSimulating}
						className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
					>
						Stop Simulation
					</button>
					<button
						type="button"
						onClick={resetSimulation}
						className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
					>
						Reset
					</button>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Fluid Type
						</label>
						<select
							value={presetType}
							onChange={(e) =>
								setPresetType(e.target.value as typeof presetType)
							}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="water">Water</option>
							<option value="oil">Oil</option>
							<option value="gas">Gas</option>
							<option value="honey">Honey</option>
							<option value="custom">Custom</option>
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Color Mode
						</label>
						<select
							value={settings.colorMode}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									colorMode: e.target.value as typeof settings.colorMode,
								}))
							}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="velocity">Velocity</option>
							<option value="pressure">Pressure</option>
							<option value="density">Density</option>
							<option value="temperature">Temperature</option>
						</select>
					</div>
					<div className="space-y-2">
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={settings.showGrid}
								onChange={(e) =>
									setSettings((prev) => ({
										...prev,
										showGrid: e.target.checked,
									}))
								}
								className="mr-2"
							/>
							<span className="text-sm font-medium text-gray-700">
								Show Grid
							</span>
						</label>
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={settings.showVelocity}
								onChange={(e) =>
									setSettings((prev) => ({
										...prev,
										showVelocity: e.target.checked,
									}))
								}
								className="mr-2"
							/>
							<span className="text-sm font-medium text-gray-700">
								Show Velocity
							</span>
						</label>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Particles: {settings.numParticles}
						</label>
						<input
							type="range"
							min="50"
							max="400"
							step="25"
							value={settings.numParticles}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									numParticles: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Viscosity: {settings.viscosity.toFixed(2)}
						</label>
						<input
							type="range"
							min="0.01"
							max="1"
							step="0.01"
							value={settings.viscosity}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									viscosity: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Gravity: {settings.gravity}
						</label>
						<input
							type="range"
							min="0"
							max="500"
							step="25"
							value={settings.gravity}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									gravity: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Gas Constant: {settings.gasConstant}
						</label>
						<input
							type="range"
							min="500"
							max="5000"
							step="100"
							value={settings.gasConstant}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									gasConstant: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Damping: {settings.damping.toFixed(2)}
						</label>
						<input
							type="range"
							min="0.7"
							max="0.99"
							step="0.01"
							value={settings.damping}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									damping: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
				</div>
			</div>

			<div className="mb-6">
				<canvas
					ref={canvasRef}
					className="border border-gray-300 rounded-lg bg-black cursor-crosshair"
					style={{ maxWidth: "100%", height: "auto" }}
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseUp}
				/>
				<p className="text-sm text-gray-500 mt-2">
					Click and drag to interact with the fluid particles
				</p>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-cyan-800">
						SPH Physics
					</h3>
					<ul className="text-cyan-700 space-y-1">
						<li>
							• <strong>Smoothed Particle Hydrodynamics</strong>: Lagrangian
							fluid simulation
						</li>
						<li>
							• <strong>Density Estimation</strong>: Kernel-based neighbor
							calculations
						</li>
						<li>
							• <strong>Pressure Forces</strong>: Gradient-based particle
							interactions
						</li>
						<li>
							• <strong>Viscosity Modeling</strong>: Velocity smoothing between
							neighbors
						</li>
					</ul>
				</div>

				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-blue-800">
						Interactive Features
					</h3>
					<ul className="text-blue-700 space-y-1">
						<li>
							• <strong>Fluid Presets</strong>: Water, oil, gas, and honey
							properties
						</li>
						<li>
							• <strong>Color Visualization</strong>: Velocity, pressure,
							density, temperature
						</li>
						<li>
							• <strong>Mouse Interaction</strong>: Push and stir the fluid
							particles
						</li>
						<li>
							• <strong>Real-time Controls</strong>: Adjust physics parameters
							dynamically
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
				<h3 className="text-lg font-semibold mb-2 text-purple-800">
					Applications
				</h3>
				<div className="grid md:grid-cols-3 gap-4 text-purple-700">
					<div>
						<strong>Computer Graphics:</strong>
						<ul className="text-sm mt-1">
							<li>• Realistic water simulation</li>
							<li>• Particle effects systems</li>
							<li>• Environmental animations</li>
						</ul>
					</div>
					<div>
						<strong>Engineering:</strong>
						<ul className="text-sm mt-1">
							<li>• Fluid dynamics analysis</li>
							<li>• Material behavior studies</li>
							<li>• Process optimization</li>
						</ul>
					</div>
					<div>
						<strong>Scientific Research:</strong>
						<ul className="text-sm mt-1">
							<li>• Oceanographic modeling</li>
							<li>• Atmospheric simulation</li>
							<li>• Blood flow analysis</li>
						</ul>
					</div>
				</div>
			</div>

			<div className="mt-6">
				<Link
					to="/examples/visual"
					className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
				>
					← Back to Examples
				</Link>
			</div>
		</div>
	);
}
