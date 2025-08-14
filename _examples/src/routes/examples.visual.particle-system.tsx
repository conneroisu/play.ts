import { Link, createFileRoute } from "@tanstack/react-router";
import {
	Particle,
	ParticleSystem,
	attraction,
	drag,
	gravity,
	hsl,
	randomChoice,
	randomFloat,
	randomInt,
	repulsion,
	toCssHsl,
	vec2,
	vec2Add,
	vec2Mul,
} from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/visual/particle-system")({
	component: ParticleSystemExample,
});

interface CustomParticle {
	position: { x: number; y: number };
	velocity: { x: number; y: number };
	acceleration: { x: number; y: number };
	life: number;
	maxLife: number;
	size: number;
	color: { h: number; s: number; l: number };
	trail: Array<{ x: number; y: number; alpha: number }>;
}

function ParticleSystemExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const [isRunning, setIsRunning] = useState(false);
	const isRunningRef = useRef(false);
	const [particleCount, setParticleCount] = useState(100);
	const [emissionRate, setEmissionRate] = useState(5);
	const [forceType, setForceType] = useState<
		"gravity" | "explosion" | "attractor" | "repulsor"
	>("gravity");
	const [showTrails, setShowTrails] = useState(true);

	const particlesRef = useRef<CustomParticle[]>([]);
	const mouseRef = useRef({ x: 0, y: 0 });
	const lastEmissionRef = useRef(0);

	const createParticle = (x: number, y: number): CustomParticle => {
		const angle = randomFloat(0, Math.PI * 2);
		const speed = randomFloat(1, 4);
		const life = randomFloat(60, 180);

		return {
			position: { x, y },
			velocity: {
				x: Math.cos(angle) * speed,
				y: Math.sin(angle) * speed,
			},
			acceleration: { x: 0, y: 0 },
			life,
			maxLife: life,
			size: randomFloat(2, 6),
			color: hsl(randomInt(0, 360), randomFloat(50, 100), randomFloat(40, 80)),
			trail: [],
		};
	};

	const updateParticles = (deltaTime: number) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const { width, height } = canvas;
		const particles = particlesRef.current;

		// Apply forces based on type
		particles.forEach((particle) => {
			// Reset acceleration
			particle.acceleration = { x: 0, y: 0 };

			switch (forceType) {
				case "gravity":
					particle.acceleration.y += 0.2;
					break;
				case "explosion":
					const dx = particle.position.x - width / 2;
					const dy = particle.position.y - height / 2;
					const distance = Math.sqrt(dx * dx + dy * dy);
					if (distance > 0) {
						const force = 50 / (distance * distance);
						particle.acceleration.x += (dx / distance) * force;
						particle.acceleration.y += (dy / distance) * force;
					}
					break;
				case "attractor":
					const attractDx = mouseRef.current.x - particle.position.x;
					const attractDy = mouseRef.current.y - particle.position.y;
					const attractDistance = Math.sqrt(
						attractDx * attractDx + attractDy * attractDy,
					);
					if (attractDistance > 0) {
						const attractForce = 100 / (attractDistance * attractDistance);
						particle.acceleration.x +=
							(attractDx / attractDistance) * attractForce;
						particle.acceleration.y +=
							(attractDy / attractDistance) * attractForce;
					}
					break;
				case "repulsor":
					const repelDx = particle.position.x - mouseRef.current.x;
					const repelDy = particle.position.y - mouseRef.current.y;
					const repelDistance = Math.sqrt(
						repelDx * repelDx + repelDy * repelDy,
					);
					if (repelDistance > 0 && repelDistance < 100) {
						const repelForce = 200 / (repelDistance * repelDistance);
						particle.acceleration.x += (repelDx / repelDistance) * repelForce;
						particle.acceleration.y += (repelDy / repelDistance) * repelForce;
					}
					break;
			}

			// Apply drag
			particle.acceleration.x -= particle.velocity.x * 0.01;
			particle.acceleration.y -= particle.velocity.y * 0.01;

			// Update velocity and position
			particle.velocity.x += particle.acceleration.x;
			particle.velocity.y += particle.acceleration.y;

			// Add current position to trail
			if (showTrails) {
				particle.trail.push({
					x: particle.position.x,
					y: particle.position.y,
					alpha: particle.life / particle.maxLife,
				});

				// Limit trail length
				if (particle.trail.length > 20) {
					particle.trail.shift();
				}
			}

			particle.position.x += particle.velocity.x;
			particle.position.y += particle.velocity.y;

			// Update life
			particle.life -= 1;

			// Bounce off walls
			if (particle.position.x < 0 || particle.position.x > width) {
				particle.velocity.x *= -0.8;
				particle.position.x = Math.max(0, Math.min(width, particle.position.x));
			}
			if (particle.position.y < 0 || particle.position.y > height) {
				particle.velocity.y *= -0.8;
				particle.position.y = Math.max(
					0,
					Math.min(height, particle.position.y),
				);
			}
		});

		// Remove dead particles
		particlesRef.current = particles.filter((p) => p.life > 0);
	};

	const render = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		// Clear canvas with black background
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		const particles = particlesRef.current;

		particles.forEach((particle, index) => {
			const alpha = Math.max(
				0.1,
				Math.min(1, particle.life / particle.maxLife),
			);

			// Only skip completely dead particles
			if (particle.life <= 0) return;

			ctx.save();

			// Reset shadow and alpha
			ctx.shadowColor = "transparent";
			ctx.shadowBlur = 0;
			ctx.globalAlpha = 1;

			// Draw trail first
			if (showTrails && particle.trail.length > 1) {
				ctx.strokeStyle = `hsla(${particle.color.h}, ${particle.color.s}%, ${particle.color.l}%, ${Math.max(0.3, alpha * 0.5)})`;
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
				for (let i = 1; i < particle.trail.length; i++) {
					ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
				}
				ctx.stroke();
			}

			// Draw main particle
			ctx.globalAlpha = alpha;
			ctx.fillStyle = `hsl(${particle.color.h}, ${particle.color.s}%, ${particle.color.l}%)`;
			ctx.beginPath();
			ctx.arc(
				particle.position.x,
				particle.position.y,
				particle.size,
				0,
				Math.PI * 2,
			);
			ctx.fill();

			// Add glow effect
			ctx.globalAlpha = alpha * 0.5;
			ctx.shadowColor = `hsl(${particle.color.h}, ${particle.color.s}%, ${particle.color.l}%)`;
			ctx.shadowBlur = particle.size * 3;
			ctx.fillStyle = `hsla(${particle.color.h}, ${particle.color.s}%, ${particle.color.l}%, ${alpha * 0.3})`;
			ctx.beginPath();
			ctx.arc(
				particle.position.x,
				particle.position.y,
				particle.size * 1.8,
				0,
				Math.PI * 2,
			);
			ctx.fill();

			ctx.restore();
		});
	};

	const lastTimeRef = useRef<number>(0);

	const animate = (currentTime: number) => {
		if (!isRunningRef.current) return;

		const deltaTime = currentTime - lastTimeRef.current;
		lastTimeRef.current = currentTime;

		// Emit new particles
		if (
			currentTime - lastEmissionRef.current > 1000 / emissionRate &&
			particlesRef.current.length < particleCount
		) {
			const canvas = canvasRef.current;
			if (canvas) {
				for (
					let i = 0;
					i <
					Math.min(emissionRate, particleCount - particlesRef.current.length);
					i++
				) {
					const x =
						forceType === "explosion"
							? canvas.width / 2
							: randomFloat(0, canvas.width);
					const y =
						forceType === "explosion"
							? canvas.height / 2
							: randomFloat(0, canvas.height);
					particlesRef.current.push(createParticle(x, y));
				}
			}
			lastEmissionRef.current = currentTime;
		}

		updateParticles(deltaTime);
		render();

		if (isRunningRef.current) {
			animationRef.current = requestAnimationFrame(animate);
		}
	};

	const startAnimation = () => {
		setIsRunning(true);
		isRunningRef.current = true;
		lastTimeRef.current = performance.now();
		lastEmissionRef.current = performance.now();
		animationRef.current = requestAnimationFrame(animate);
	};

	const stopAnimation = () => {
		setIsRunning(false);
		isRunningRef.current = false;
		if (animationRef.current) {
			cancelAnimationFrame(animationRef.current);
		}
	};

	const clearParticles = () => {
		particlesRef.current = [];
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.width = 800;
		canvas.height = 600;

		// Initialize with some particles for testing
		for (let i = 0; i < 10; i++) {
			particlesRef.current.push(
				createParticle(randomFloat(100, 700), randomFloat(100, 500)),
			);
		}

		// Initial render to show particles immediately
		render();

		const handleMouseMove = (e: MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			mouseRef.current = {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			};
		};

		const handleClick = (e: MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			// Burst of particles at click location
			for (let i = 0; i < 10; i++) {
				particlesRef.current.push(createParticle(x, y));
			}
		};

		canvas.addEventListener("mousemove", handleMouseMove);
		canvas.addEventListener("click", handleClick);

		return () => {
			canvas.removeEventListener("mousemove", handleMouseMove);
			canvas.removeEventListener("click", handleClick);
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, []);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Advanced Particle Physics System
				</h1>
				<p className="text-gray-600 mb-4">
					Multiple forces, interactive mouse controls, visual trails, and
					real-time physics parameter adjustment.
				</p>
				<div className="bg-green-50 border border-green-200 rounded-lg p-4">
					<p className="text-green-800">
						🎆 Watch particles interact with forces, click to add bursts, move
						mouse for attraction/repulsion
					</p>
				</div>
			</div>

			<div className="mb-6">
				<div className="flex flex-wrap gap-4 mb-4">
					<button
						type="button"
						onClick={startAnimation}
						disabled={isRunning}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
					>
						Start Simulation
					</button>
					<button
						type="button"
						onClick={stopAnimation}
						disabled={!isRunning}
						className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
					>
						Stop Simulation
					</button>
					<button
						type="button"
						onClick={clearParticles}
						className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
					>
						Clear Particles
					</button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Max Particles: {particleCount}
						</label>
						<input
							type="range"
							min="50"
							max="500"
							value={particleCount}
							onChange={(e) => setParticleCount(Number(e.target.value))}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Emission Rate: {emissionRate}/sec
						</label>
						<input
							type="range"
							min="1"
							max="20"
							value={emissionRate}
							onChange={(e) => setEmissionRate(Number(e.target.value))}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Force Type
						</label>
						<select
							value={forceType}
							onChange={(e) => setForceType(e.target.value as typeof forceType)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="gravity">Gravity</option>
							<option value="explosion">Explosion</option>
							<option value="attractor">Mouse Attractor</option>
							<option value="repulsor">Mouse Repulsor</option>
						</select>
					</div>
					<div className="flex items-center">
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={showTrails}
								onChange={(e) => setShowTrails(e.target.checked)}
								className="mr-2"
							/>
							<span className="text-sm font-medium text-gray-700">
								Show Trails
							</span>
						</label>
					</div>
				</div>
			</div>

			<div className="mb-6">
				<canvas
					ref={canvasRef}
					className="border border-gray-300 rounded-lg bg-black cursor-crosshair"
					style={{ maxWidth: "100%", height: "auto" }}
				/>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-yellow-800">
						Physics Features
					</h3>
					<ul className="text-yellow-700 space-y-1">
						<li>
							• <strong>Multiple Forces</strong>: Gravity, explosion,
							attraction, repulsion
						</li>
						<li>
							• <strong>Collision Detection</strong>: Bouncing off canvas
							boundaries
						</li>
						<li>
							• <strong>Drag Forces</strong>: Air resistance simulation
						</li>
						<li>
							• <strong>Mouse Interaction</strong>: Dynamic force application
						</li>
					</ul>
				</div>

				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-blue-800">
						Visual Effects
					</h3>
					<ul className="text-blue-700 space-y-1">
						<li>
							• <strong>Particle Trails</strong>: Motion blur and path
							visualization
						</li>
						<li>
							• <strong>Color Variations</strong>: HSL color space for vibrant
							effects
						</li>
						<li>
							• <strong>Alpha Blending</strong>: Fade effects based on particle
							life
						</li>
						<li>
							• <strong>Glow Effects</strong>: Canvas shadow blur for luminous
							particles
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6">
				<Link
					to="/examples/visual"
					className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
				>
					← Back to Examples
				</Link>
			</div>
		</div>
	);
}
