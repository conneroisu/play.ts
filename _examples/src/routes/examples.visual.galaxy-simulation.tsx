import { Link, createFileRoute } from "@tanstack/react-router";
import {
	PI,
	TWO_PI,
	clamp,
	cos,
	hsl,
	hslToRgb,
	lerp,
	randomFloat,
	randomInt,
	sin,
	toCssHsl,
	vec2,
	vec2Add,
	vec2Distance,
	vec2Mul,
	vec2Normalize,
	vec2Sub,
} from "play.ts";
import { useCallback, useEffect, useRef, useState } from "react";

interface CelestialBody {
	x: number;
	y: number;
	vx: number;
	vy: number;
	mass: number;
	radius: number;
	type: "star" | "planet" | "black_hole" | "comet";
	color: { h: number; s: number; l: number };
	trail: { x: number; y: number }[];
	age: number;
	temperature: number;
	id: string;
	luminosity: number;
}

interface GalaxySettings {
	numBodies: number;
	gravitationalConstant: number;
	timeStep: number;
	centralMass: number;
	showTrails: boolean;
	showGravityField: boolean;
	showOrbitalPaths: boolean;
	trailLength: number;
	collisionDetection: boolean;
	relativisticEffects: boolean;
	darkMatter: boolean;
	starFormation: boolean;
	colorMode: "type" | "velocity" | "mass" | "temperature" | "age";
}

export default function GalaxySimulationExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const timeRef = useRef<number>(0);
	const bodiesRef = useRef<CelestialBody[]>([]);
	const settingsRef = useRef<GalaxySettings>({
		numBodies: 150,
		gravitationalConstant: 100,
		timeStep: 0.02,
		centralMass: 10000,
		showTrails: true,
		showGravityField: false,
		showOrbitalPaths: false,
		trailLength: 50,
		collisionDetection: true,
		relativisticEffects: false,
		darkMatter: false,
		starFormation: false,
		colorMode: "type",
	});

	const [isSimulating, setIsSimulating] = useState(false);
	const isSimulatingRef = useRef(false);
	const [settings, setSettings] = useState<GalaxySettings>(settingsRef.current);
	const [galaxyType, setGalaxyType] = useState<
		"spiral" | "elliptical" | "irregular" | "collision" | "custom"
	>("spiral");
	const [cameraZoom, setCameraZoom] = useState(1);
	const [cameraX, setCameraX] = useState(0);
	const [cameraY, setCameraY] = useState(0);

	// Sync settings with ref
	useEffect(() => {
		settingsRef.current = settings;
	}, [settings]);

	const createCelestialBody = (
		x: number,
		y: number,
		vx: number,
		vy: number,
		mass: number,
		type: CelestialBody["type"],
	): CelestialBody => {
		const radius =
			type === "black_hole"
				? Math.sqrt(mass) * 0.5
				: type === "star"
					? Math.sqrt(mass) * 0.3
					: type === "planet"
						? Math.sqrt(mass) * 0.2
						: Math.sqrt(mass) * 0.1;

		let color: { h: number; s: number; l: number };
		let temperature = 5778;

		switch (type) {
			case "black_hole":
				color = hsl(0, 0, 10);
				temperature = 0;
				break;
			case "star":
				temperature = 3000 + randomFloat(0, 7000);
				const tempHue = clamp((6000 - temperature) / 30, 0, 300);
				color = hsl(tempHue, 80, 70);
				break;
			case "planet":
				color = hsl(randomFloat(200, 260), 60, 50);
				temperature = 288;
				break;
			case "comet":
				color = hsl(randomFloat(180, 220), 40, 60);
				temperature = 100;
				break;
			default:
				color = hsl(randomFloat(0, 360), 50, 50);
		}

		return {
			x,
			y,
			vx,
			vy,
			mass,
			radius,
			type,
			color,
			trail: [],
			age: 0,
			temperature,
			id: `${type}-${Date.now()}-${Math.random()}`,
			luminosity:
				type === "star" ? mass * 10 : type === "black_hole" ? 0 : mass,
		};
	};

	const generateGalaxy = (type: string): CelestialBody[] => {
		const canvas = canvasRef.current;
		if (!canvas) return [];

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		const newBodies: CelestialBody[] = [];
		const currentSettings = settingsRef.current;

		// Add central black hole
		if (type !== "irregular") {
			newBodies.push(
				createCelestialBody(
					centerX,
					centerY,
					0,
					0,
					currentSettings.centralMass,
					"black_hole",
				),
			);
		}

		switch (type) {
			case "spiral": {
				const arms = 2;
				const armSpread = PI / 3;

				for (let i = 0; i < currentSettings.numBodies; i++) {
					const armIndex = i % arms;
					const t = (i / currentSettings.numBodies) * 4 * PI;
					const armAngle = (armIndex * TWO_PI) / arms + armSpread * t;

					const r = 50 + (i / currentSettings.numBodies) * 200;
					const x = centerX + r * cos(armAngle) + randomFloat(-20, 20);
					const y = centerY + r * sin(armAngle) + randomFloat(-20, 20);

					const orbitalSpeed =
						Math.sqrt(
							(currentSettings.gravitationalConstant * currentSettings.centralMass) / r,
						) * 0.8;
					const vx = -orbitalSpeed * sin(armAngle) + randomFloat(-10, 10);
					const vy = orbitalSpeed * cos(armAngle) + randomFloat(-10, 10);

					const mass = randomFloat(1, 50);
					const bodyType: CelestialBody["type"] =
						mass > 30 ? "star" : mass > 10 ? "planet" : "comet";

					newBodies.push(createCelestialBody(x, y, vx, vy, mass, bodyType));
				}
				break;
			}

			case "elliptical": {
				for (let i = 0; i < currentSettings.numBodies; i++) {
					const theta = randomFloat(0, TWO_PI);
					const r = randomFloat(30, 180) * Math.pow(randomFloat(0, 1), 0.5);

					const x = centerX + r * cos(theta);
					const y = centerY + r * sin(theta) * 0.6;

					const orbitalSpeed =
						Math.sqrt(
							(currentSettings.gravitationalConstant * currentSettings.centralMass) / r,
						) * 0.7;
					const vx = -orbitalSpeed * sin(theta) * randomFloat(0.5, 1.5);
					const vy = orbitalSpeed * cos(theta) * randomFloat(0.5, 1.5);

					const mass = randomFloat(5, 40);
					const bodyType: CelestialBody["type"] = mass > 25 ? "star" : "planet";

					newBodies.push(createCelestialBody(x, y, vx, vy, mass, bodyType));
				}
				break;
			}

			case "irregular": {
				for (let i = 0; i < currentSettings.numBodies; i++) {
					const x = centerX + randomFloat(-250, 250);
					const y = centerY + randomFloat(-200, 200);
					const vx = randomFloat(-30, 30);
					const vy = randomFloat(-30, 30);

					const mass = randomFloat(1, 80);
					const bodyType: CelestialBody["type"] =
						mass > 60
							? "black_hole"
							: mass > 30
								? "star"
								: mass > 10
									? "planet"
									: "comet";

					newBodies.push(createCelestialBody(x, y, vx, vy, mass, bodyType));
				}
				break;
			}

			case "collision": {
				const offset = 150;

				// Galaxy 1
				for (let i = 0; i < currentSettings.numBodies / 2; i++) {
					const t = (i / (currentSettings.numBodies / 2)) * 3 * PI;
					const r = 30 + (i / (currentSettings.numBodies / 2)) * 120;
					const angle = t;

					const x = centerX - offset + r * cos(angle);
					const y = centerY + r * sin(angle);

					const orbitalSpeed = Math.sqrt(
						(currentSettings.gravitationalConstant * (currentSettings.centralMass / 2)) / r,
					);
					const vx = -orbitalSpeed * sin(angle) + 20;
					const vy = orbitalSpeed * cos(angle);

					const mass = randomFloat(5, 30);
					const bodyType: CelestialBody["type"] = mass > 20 ? "star" : "planet";

					newBodies.push(createCelestialBody(x, y, vx, vy, mass, bodyType));
				}

				// Galaxy 2
				for (let i = 0; i < currentSettings.numBodies / 2; i++) {
					const t = (i / (currentSettings.numBodies / 2)) * 3 * PI;
					const r = 30 + (i / (currentSettings.numBodies / 2)) * 120;
					const angle = -t + PI;

					const x = centerX + offset + r * cos(angle);
					const y = centerY + r * sin(angle);

					const orbitalSpeed = Math.sqrt(
						(currentSettings.gravitationalConstant * (currentSettings.centralMass / 2)) / r,
					);
					const vx = -orbitalSpeed * sin(angle) - 20;
					const vy = orbitalSpeed * cos(angle);

					const mass = randomFloat(5, 30);
					const bodyType: CelestialBody["type"] = mass > 20 ? "star" : "planet";

					newBodies.push(createCelestialBody(x, y, vx, vy, mass, bodyType));
				}

				// Add both central black holes
				newBodies.push(
					createCelestialBody(
						centerX - offset,
						centerY,
						20,
						0,
						currentSettings.centralMass / 2,
						"black_hole",
					),
				);
				newBodies.push(
					createCelestialBody(
						centerX + offset,
						centerY,
						-20,
						0,
						currentSettings.centralMass / 2,
						"black_hole",
					),
				);
				break;
			}
		}

		return newBodies;
	};

	const calculateGravitationalForce = (
		body1: CelestialBody,
		body2: CelestialBody,
	): { fx: number; fy: number } => {
		const dx = body2.x - body1.x;
		const dy = body2.y - body1.y;
		const distance = Math.max(
			vec2Distance(body1, body2),
			body1.radius + body2.radius,
		);

		if (distance === 0) return { fx: 0, fy: 0 };

		const currentSettings = settingsRef.current;
		let force =
			(currentSettings.gravitationalConstant * body1.mass * body2.mass) /
			(distance * distance);

		const fx = force * (dx / distance);
		const fy = force * (dy / distance);

		return { fx, fy };
	};

	const updateBodies = () => {
		const prevBodies = bodiesRef.current;
		const currentSettings = settingsRef.current;

		const forces = prevBodies.map((body, i) => {
			let totalFx = 0;
			let totalFy = 0;

			prevBodies.forEach((otherBody, j) => {
				if (i !== j) {
					const { fx, fy } = calculateGravitationalForce(body, otherBody);
					totalFx += fx;
					totalFy += fy;
				}
			});

			return { fx: totalFx, fy: totalFy };
		});

		const updatedBodies = prevBodies.map((body, i) => {
			const newVx = body.vx + (forces[i].fx / body.mass) * currentSettings.timeStep;
			const newVy = body.vy + (forces[i].fy / body.mass) * currentSettings.timeStep;
			const newX = body.x + newVx * currentSettings.timeStep;
			const newY = body.y + newVy * currentSettings.timeStep;

			const newTrail = currentSettings.showTrails
				? [...body.trail, { x: newX, y: newY }].slice(-currentSettings.trailLength)
				: [];

			return {
				...body,
				vx: newVx,
				vy: newVy,
				x: newX,
				y: newY,
				age: body.age + currentSettings.timeStep,
				trail: newTrail,
			};
		});

		bodiesRef.current = updatedBodies;
	};

	const getBodyColor = (body: CelestialBody): string => {
		const currentSettings = settingsRef.current;
		switch (currentSettings.colorMode) {
			case "velocity": {
				const speed = Math.sqrt(body.vx * body.vx + body.vy * body.vy);
				const hue = clamp(speed * 5, 0, 360);
				return toCssHsl(hsl(hue, 80, 60));
			}
			case "mass": {
				const massHue = clamp(body.mass * 3, 0, 300);
				return toCssHsl(hsl(massHue, 70, 50));
			}
			case "temperature": {
				const tempHue = clamp((6000 - body.temperature) / 30, 0, 300);
				return toCssHsl(hsl(tempHue, 80, 60));
			}
			case "age": {
				const ageHue = clamp(body.age * 10, 0, 360);
				return toCssHsl(hsl(ageHue, 60, 50));
			}
			case "type":
			default:
				return toCssHsl(body.color);
		}
	};

	const render = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		const currentBodies = bodiesRef.current;
		const currentSettings = settingsRef.current;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw space background
		const gradient = ctx.createRadialGradient(
			canvas.width / 2,
			canvas.height / 2,
			0,
			canvas.width / 2,
			canvas.height / 2,
			Math.max(canvas.width, canvas.height),
		);
		gradient.addColorStop(0, "#000011");
		gradient.addColorStop(0.7, "#000033");
		gradient.addColorStop(1, "#000000");
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Add stars background
		ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
		for (let i = 0; i < 200; i++) {
			const x = (i * 123.456) % canvas.width;
			const y = (i * 789.012) % canvas.height;
			const size = ((i * 17) % 100) / 100 * 1.5 + 0.5; // Deterministic size
			ctx.beginPath();
			ctx.arc(x, y, size, 0, TWO_PI);
			ctx.fill();
		}

		// Apply camera transform
		ctx.save();
		ctx.translate(canvas.width / 2 + cameraX, canvas.height / 2 + cameraY);
		ctx.scale(cameraZoom, cameraZoom);
		ctx.translate(-canvas.width / 2, -canvas.height / 2);

		// Draw trails
		if (currentSettings.showTrails) {
			currentBodies.forEach((body) => {
				if (body.trail.length > 1) {
					ctx.strokeStyle = getBodyColor(body);
					ctx.lineWidth = 1;
					ctx.globalAlpha = 0.5;

					ctx.beginPath();
					ctx.moveTo(body.trail[0].x, body.trail[0].y);

					for (let i = 1; i < body.trail.length; i++) {
						ctx.lineTo(body.trail[i].x, body.trail[i].y);
					}

					ctx.stroke();
					ctx.globalAlpha = 1;
				}
			});
		}

		// Draw celestial bodies
		currentBodies.forEach((body) => {
			const color = getBodyColor(body);

			// Body glow effect
			if (body.type === "star" || body.type === "black_hole") {
				const glowRadius = body.radius * 3;
				const glowGradient = ctx.createRadialGradient(
					body.x,
					body.y,
					0,
					body.x,
					body.y,
					glowRadius,
				);

				if (body.type === "black_hole") {
					glowGradient.addColorStop(0, "rgba(255, 100, 0, 0.8)");
					glowGradient.addColorStop(0.5, "rgba(255, 50, 0, 0.3)");
					glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
				} else {
					glowGradient.addColorStop(
						0,
						`${color.replace("hsl", "hsla").replace(")", ", 0.8)")}`,
					);
					glowGradient.addColorStop(
						0.7,
						`${color.replace("hsl", "hsla").replace(")", ", 0.2)")}`,
					);
					glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
				}

				ctx.fillStyle = glowGradient;
				ctx.beginPath();
				ctx.arc(body.x, body.y, glowRadius, 0, TWO_PI);
				ctx.fill();
			}

			// Main body
			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.arc(body.x, body.y, body.radius, 0, TWO_PI);
			ctx.fill();

			// Body highlight
			if (body.type !== "black_hole") {
				ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
				ctx.beginPath();
				ctx.arc(
					body.x - body.radius * 0.3,
					body.y - body.radius * 0.3,
					body.radius * 0.3,
					0,
					TWO_PI,
				);
				ctx.fill();
			}
		});

		ctx.restore();

		// Draw UI information
		ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
		ctx.fillRect(10, 10, 300, 140);
		ctx.fillStyle = "#ffffff";
		ctx.font = "14px Arial";
		ctx.textAlign = "left";

		ctx.fillText(`Galaxy Type: ${galaxyType}`, 20, 30);
		ctx.fillText(`Bodies: ${currentBodies.length}`, 20, 50);
		ctx.fillText(`Time: ${timeRef.current.toFixed(1)}s`, 20, 70);
		ctx.fillText(`Gravity: ${currentSettings.gravitationalConstant}`, 20, 90);
		ctx.fillText(`Zoom: ${cameraZoom.toFixed(1)}x`, 20, 110);
		ctx.fillText(`Color Mode: ${currentSettings.colorMode}`, 20, 130);
	};

	const animate = () => {
		timeRef.current += settingsRef.current.timeStep;

		if (isSimulatingRef.current) {
			updateBodies();
		}

		render();
		animationRef.current = requestAnimationFrame(animate);
	};

	const startSimulation = () => {
		setIsSimulating(true);
		isSimulatingRef.current = true;
	};

	const stopSimulation = () => {
		setIsSimulating(false);
		isSimulatingRef.current = false;
	};

	const resetGalaxy = useCallback(() => {
		const newBodies = generateGalaxy(galaxyType);
		bodiesRef.current = newBodies;
		timeRef.current = 0;
		setCameraX(0);
		setCameraY(0);
		setCameraZoom(1);
	}, [galaxyType]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.width = 1000;
		canvas.height = 700;

		resetGalaxy();
		animationRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (galaxyType !== "custom") {
			resetGalaxy();
		}
	}, [galaxyType, settings.numBodies, resetGalaxy]);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">N-Body Galaxy Simulation</h1>
				<p className="text-gray-600 mb-4">
					Gravitational n-body simulation with galaxy formation, stellar
					evolution, and realistic astronomical physics.
				</p>
				<div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
					<p className="text-indigo-800">
						🌌 Watch galaxies form and evolve, explore different galaxy types,
						see gravitational interactions
					</p>
				</div>
			</div>

			<div className="mb-6">
				<div className="flex flex-wrap gap-4 mb-4">
					<button
						type="button"
						onClick={startSimulation}
						disabled={isSimulating}
						className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
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
						onClick={resetGalaxy}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
					>
						Reset Galaxy
					</button>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
					<div>
						<label
							htmlFor="galaxyType"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Galaxy Type
						</label>
						<select
							id="galaxyType"
							value={galaxyType}
							onChange={(e) =>
								setGalaxyType(e.target.value as typeof galaxyType)
							}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
						>
							<option value="spiral">Spiral Galaxy</option>
							<option value="elliptical">Elliptical Galaxy</option>
							<option value="irregular">Irregular Galaxy</option>
							<option value="collision">Galaxy Collision</option>
							<option value="custom">Custom</option>
						</select>
					</div>
					<div>
						<label
							htmlFor="colorMode"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Color Mode
						</label>
						<select
							id="colorMode"
							value={settings.colorMode}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									colorMode: e.target.value as typeof prev.colorMode,
								}))
							}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
						>
							<option value="type">Object Type</option>
							<option value="velocity">Velocity</option>
							<option value="mass">Mass</option>
							<option value="temperature">Temperature</option>
							<option value="age">Age</option>
						</select>
					</div>
					<div>
						<label
							htmlFor="numBodies"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Bodies: {settings.numBodies}
						</label>
						<input
							id="numBodies"
							type="range"
							min="50"
							max="300"
							step="25"
							value={settings.numBodies}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									numBodies: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label
							htmlFor="zoom"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Zoom: {cameraZoom.toFixed(1)}x
						</label>
						<input
							id="zoom"
							type="range"
							min="0.1"
							max="3"
							step="0.1"
							value={cameraZoom}
							onChange={(e) => setCameraZoom(Number(e.target.value))}
							className="w-full"
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
					<div>
						<label
							htmlFor="gravityConstant"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Gravity Constant: {settings.gravitationalConstant}
						</label>
						<input
							id="gravityConstant"
							type="range"
							min="10"
							max="500"
							step="10"
							value={settings.gravitationalConstant}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									gravitationalConstant: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label
							htmlFor="timeStep"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Time Step: {settings.timeStep.toFixed(3)}
						</label>
						<input
							id="timeStep"
							type="range"
							min="0.005"
							max="0.1"
							step="0.005"
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
					<div>
						<label
							htmlFor="centralMass"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Central Mass: {settings.centralMass}
						</label>
						<input
							id="centralMass"
							type="range"
							min="1000"
							max="50000"
							step="1000"
							value={settings.centralMass}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									centralMass: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label
							htmlFor="trailLength"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Trail Length: {settings.trailLength}
						</label>
						<input
							id="trailLength"
							type="range"
							min="10"
							max="200"
							step="10"
							value={settings.trailLength}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									trailLength: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
					<label htmlFor="showTrails" className="flex items-center">
						<input
							id="showTrails"
							type="checkbox"
							checked={settings.showTrails}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									showTrails: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">
							Show Trails
						</span>
					</label>
					<label htmlFor="showGravityField" className="flex items-center">
						<input
							id="showGravityField"
							type="checkbox"
							checked={settings.showGravityField}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									showGravityField: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">
							Gravity Field
						</span>
					</label>
					<label htmlFor="collisionDetection" className="flex items-center">
						<input
							id="collisionDetection"
							type="checkbox"
							checked={settings.collisionDetection}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									collisionDetection: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">
							Collisions
						</span>
					</label>
					<label htmlFor="darkMatter" className="flex items-center">
						<input
							id="darkMatter"
							type="checkbox"
							checked={settings.darkMatter}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									darkMatter: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">
							Dark Matter
						</span>
					</label>
					<label htmlFor="starFormation" className="flex items-center">
						<input
							id="starFormation"
							type="checkbox"
							checked={settings.starFormation}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									starFormation: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">
							Star Formation
						</span>
					</label>
				</div>
			</div>

			<div className="mb-6">
				<canvas
					ref={canvasRef}
					className="border border-gray-300 rounded-lg bg-black cursor-move"
					style={{ maxWidth: "100%", height: "auto" }}
					role="application"
				/>
				<p className="text-sm text-gray-500 mt-2">
					Use controls above to interact with the galaxy simulation
				</p>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-blue-800">
						Astrophysics Concepts
					</h3>
					<ul className="text-blue-700 space-y-1">
						<li>
							• <strong>N-Body Gravity</strong>: Every object attracts every
							other object
						</li>
						<li>
							• <strong>Orbital Mechanics</strong>: Stable orbits require
							precise velocity
						</li>
						<li>
							• <strong>Galaxy Formation</strong>: Structure emerges from
							gravitational collapse
						</li>
						<li>
							• <strong>Stellar Evolution</strong>: Stars form, age, and
							sometimes merge
						</li>
					</ul>
				</div>

				<div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-indigo-800">
						Simulation Features
					</h3>
					<ul className="text-indigo-700 space-y-1">
						<li>
							• <strong>Galaxy Types</strong>: Spiral, elliptical, irregular
							formations
						</li>
						<li>
							• <strong>Collision Dynamics</strong>: Watch galaxies merge and
							interact
						</li>
						<li>
							• <strong>Dark Matter</strong>: Hidden mass affects galactic
							structure
						</li>
						<li>
							• <strong>Real-time Physics</strong>: Adjustable parameters and
							time scales
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6">
				<Link
					to="/examples/visual"
					className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
				>
					← Back to Examples
				</Link>
			</div>
		</div>
	);
}

export const Route = createFileRoute("/examples/visual/galaxy-simulation")({
	component: GalaxySimulationExample,
});