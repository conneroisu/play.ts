import {
	Particle,
	circleIntersects,
	gravity,
	randomFloat,
	randomInt,
	setSeed,
	springForce,
	vec2,
	vec2Add,
	vec2Distance,
	vec2Mul,
	vec2Normalize,
	vec2Sub,
	circle,
} from "play.ts";
import { useEffect, useRef, useState } from "react";

interface ParticleSettings {
	count: number;
	gravity: number;
	damping: number;
	enableCollisions: boolean;
	enableSprings: boolean;
	springStrength: number;
	mouseAttraction: number;
}

interface MouseState {
	x: number;
	y: number;
	isDown: boolean;
}

export default function ParticleSystemExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const particlesRef = useRef<Particle[]>([]);
	const lastTimeRef = useRef<number>(0);
	
	const [isRunning, setIsRunning] = useState(false);
	const [mouse, setMouse] = useState<MouseState>({ x: 0, y: 0, isDown: false });
	const [settings, setSettings] = useState<ParticleSettings>({
		count: 50,
		gravity: 0.5,
		damping: 0.99,
		enableCollisions: true,
		enableSprings: false,
		springStrength: 0.1,
		mouseAttraction: 0.3,
	});

	const initializeParticles = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		setSeed(12345); // For reproducible initial positions
		particlesRef.current = [];

		for (let i = 0; i < settings.count; i++) {
			const x = randomFloat(50, canvas.width - 50);
			const y = randomFloat(50, canvas.height - 150);
			const vx = randomFloat(-2, 2);
			const vy = randomFloat(-2, 2);
			const mass = randomFloat(0.5, 2);
			const radius = mass * 8;

			const particle = new Particle(x, y, vx, vy, mass);
			particle.radius = radius;
			particlesRef.current.push(particle);
		}
	};

	const updateParticles = (deltaTime: number) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const particles = particlesRef.current;
		const dt = Math.min(deltaTime / 1000, 1/60); // Cap at 60fps equivalent

		// Apply forces
		for (const particle of particles) {
			// Apply gravity
			if (settings.gravity > 0) {
				const gravityForce = gravity(particle.mass, settings.gravity);
				particle.addForce(gravityForce);
			}

			// Mouse attraction/repulsion
			if (mouse.isDown && settings.mouseAttraction !== 0) {
				const mousePos = vec2(mouse.x, mouse.y);
				const particlePos = particle.position;
				const direction = vec2Sub(mousePos, particlePos);
				const distance = vec2Distance(mousePos, particlePos);
				
				if (distance > 1) {
					const force = vec2Mul(direction, settings.mouseAttraction * particle.mass / (distance * distance));
					particle.addForce(force);
				}
			}

			// Spring forces (connect nearby particles)
			if (settings.enableSprings) {
				for (const other of particles) {
					if (particle !== other) {
						const distance = vec2Distance(particle.position, other.position);
						
						if (distance < 100) {
							const restLength = 80;
							const spring = springForce(
								particle.position,
								other.position,
								restLength,
								settings.springStrength
							);
							particle.addForce(spring);
						}
					}
				}
			}
		}

		// Update particle physics
		for (const particle of particles) {
			particle.update(dt);
			
			// Apply damping
			particle.velocity.x *= settings.damping;
			particle.velocity.y *= settings.damping;
		}

		// Handle collisions
		if (settings.enableCollisions) {
			for (let i = 0; i < particles.length; i++) {
				for (let j = i + 1; j < particles.length; j++) {
					const p1 = particles[i];
					const p2 = particles[j];
					
					const c1 = circle(p1.position.x, p1.position.y, p1.radius);
					const c2 = circle(p2.position.x, p2.position.y, p2.radius);
					
					if (circleIntersects(c1, c2)) {
						// Simple collision response
						const direction = vec2Normalize(vec2Sub(p2.position, p1.position));
						const overlap = (p1.radius + p2.radius) - vec2Distance(p1.position, p2.position);
						
						// Separate particles
						const separation = vec2Mul(direction, overlap * 0.5);
						p1.position.x -= separation.x;
						p1.position.y -= separation.y;
						p2.position.x += separation.x;
						p2.position.y += separation.y;
						
						// Elastic collision response
						const restitution = 0.8;
						const relativeVelocity = vec2Sub(p2.velocity, p1.velocity);
						const velocityAlongNormal = vec2Distance(relativeVelocity, vec2(0, 0)) * Math.sign(direction.x * relativeVelocity.x + direction.y * relativeVelocity.y);
						
						if (velocityAlongNormal > 0) return; // Objects separating
						
						const impulse = -(1 + restitution) * velocityAlongNormal / (1/p1.mass + 1/p2.mass);
						const impulseVector = vec2Mul(direction, impulse);
						
						p1.velocity.x -= impulseVector.x / p1.mass;
						p1.velocity.y -= impulseVector.y / p1.mass;
						p2.velocity.x += impulseVector.x / p2.mass;
						p2.velocity.y += impulseVector.y / p2.mass;
					}
				}
			}
		}

		// Apply boundary constraints
		for (const particle of particles) {
			const restitution = 0.7;
			
			// Left boundary
			if (particle.position.x - particle.radius < 0) {
				particle.position.x = particle.radius;
				particle.velocity.x = -particle.velocity.x * restitution;
			}
			
			// Right boundary
			if (particle.position.x + particle.radius > canvas.width) {
				particle.position.x = canvas.width - particle.radius;
				particle.velocity.x = -particle.velocity.x * restitution;
			}
			
			// Top boundary
			if (particle.position.y - particle.radius < 0) {
				particle.position.y = particle.radius;
				particle.velocity.y = -particle.velocity.y * restitution;
			}
			
			// Bottom boundary
			if (particle.position.y + particle.radius > canvas.height) {
				particle.position.y = canvas.height - particle.radius;
				particle.velocity.y = -particle.velocity.y * restitution;
			}
		}
	};

	const render = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw background grid
		ctx.strokeStyle = "#f0f0f0";
		ctx.lineWidth = 1;
		for (let i = 0; i <= canvas.width; i += 20) {
			ctx.beginPath();
			ctx.moveTo(i, 0);
			ctx.lineTo(i, canvas.height);
			ctx.stroke();
		}
		for (let i = 0; i <= canvas.height; i += 20) {
			ctx.beginPath();
			ctx.moveTo(0, i);
			ctx.lineTo(canvas.width, i);
			ctx.stroke();
		}

		const particles = particlesRef.current;

		// Draw spring connections
		if (settings.enableSprings) {
			ctx.strokeStyle = "#e0e0e0";
			ctx.lineWidth = 1;
			for (let i = 0; i < particles.length; i++) {
				for (let j = i + 1; j < particles.length; j++) {
					const p1 = particles[i];
					const p2 = particles[j];
					const distance = vec2Distance(p1.position, p2.position);
					
					if (distance < 100) {
						ctx.beginPath();
						ctx.moveTo(p1.position.x, p1.position.y);
						ctx.lineTo(p2.position.x, p2.position.y);
						ctx.stroke();
					}
				}
			}
		}

		// Draw particles
		for (const particle of particles) {
			// Particle body
			const speed = Math.sqrt(particle.velocity.x * particle.velocity.x + particle.velocity.y * particle.velocity.y);
			const hue = Math.min(speed * 20, 360);
			ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
			ctx.beginPath();
			ctx.arc(particle.position.x, particle.position.y, particle.radius, 0, 2 * Math.PI);
			ctx.fill();

			// Particle outline
			ctx.strokeStyle = "#333";
			ctx.lineWidth = 1;
			ctx.stroke();

			// Velocity vector (optional)
			if (speed > 0.5) {
				ctx.strokeStyle = "#666";
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(particle.position.x, particle.position.y);
				ctx.lineTo(
					particle.position.x + particle.velocity.x * 10,
					particle.position.y + particle.velocity.y * 10
				);
				ctx.stroke();
			}
		}

		// Draw mouse cursor effect
		if (mouse.isDown) {
			ctx.strokeStyle = settings.mouseAttraction > 0 ? "#3b82f6" : "#ef4444";
			ctx.lineWidth = 2;
			ctx.setLineDash([5, 5]);
			ctx.beginPath();
			ctx.arc(mouse.x, mouse.y, 50, 0, 2 * Math.PI);
			ctx.stroke();
			ctx.setLineDash([]);
		}
	};

	const animate = (timestamp: number) => {
		if (!isRunning) return;

		const deltaTime = timestamp - lastTimeRef.current;
		lastTimeRef.current = timestamp;

		updateParticles(deltaTime);
		render();

		animationRef.current = requestAnimationFrame(animate);
	};

	useEffect(() => {
		if (isRunning) {
			lastTimeRef.current = performance.now();
			animationRef.current = requestAnimationFrame(animate);
		} else {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		}

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [isRunning]);

	useEffect(() => {
		initializeParticles();
		render();
	}, [settings.count]);

	const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		setMouse(prev => ({
			...prev,
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		}));
	};

	const handleMouseDown = () => {
		setMouse(prev => ({ ...prev, isDown: true }));
	};

	const handleMouseUp = () => {
		setMouse(prev => ({ ...prev, isDown: false }));
	};

	const toggleSimulation = () => {
		setIsRunning(!isRunning);
	};

	const resetSimulation = () => {
		setIsRunning(false);
		initializeParticles();
		render();
	};

	const ParticleStats = () => {
		const particles = particlesRef.current;
		const totalKineticEnergy = particles.reduce((sum, p) => {
			const speed = Math.sqrt(p.velocity.x * p.velocity.x + p.velocity.y * p.velocity.y);
			return sum + 0.5 * p.mass * speed * speed;
		}, 0);

		const avgSpeed = particles.length > 0 
			? particles.reduce((sum, p) => sum + Math.sqrt(p.velocity.x * p.velocity.x + p.velocity.y * p.velocity.y), 0) / particles.length
			: 0;

		return (
			<div className="bg-white rounded-lg shadow-md p-4">
				<h3 className="text-lg font-semibold mb-3 text-gray-800">
					System Statistics
				</h3>
				<div className="space-y-2 text-sm">
					<div className="flex justify-between">
						<span>Particles:</span>
						<span className="font-mono">{particles.length}</span>
					</div>
					<div className="flex justify-between">
						<span>Total Kinetic Energy:</span>
						<span className="font-mono">{totalKineticEnergy.toFixed(2)}</span>
					</div>
					<div className="flex justify-between">
						<span>Average Speed:</span>
						<span className="font-mono">{avgSpeed.toFixed(2)}</span>
					</div>
					<div className="flex justify-between">
						<span>Status:</span>
						<span className={`font-semibold ${isRunning ? 'text-green-600' : 'text-red-600'}`}>
							{isRunning ? 'Running' : 'Stopped'}
						</span>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Interactive Particle Physics Simulation
				</h1>
				<p className="text-gray-600 mb-4">
					Real-time particle physics with collision detection, gravity, springs,
					and mouse interaction using Verlet integration.
				</p>
				<div className="bg-green-50 border border-green-200 rounded-lg p-4">
					<p className="text-green-800">
						⚛️ This example showcases physics simulation capabilities of the
						play.ts library
					</p>
				</div>
			</div>

			<div className="grid lg:grid-cols-4 gap-6">
				<div className="lg:col-span-3">
					<div className="bg-white rounded-lg shadow-md p-4 mb-6">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold text-gray-800">
								Physics Simulation
							</h3>
							<div className="flex gap-2">
								<button
									onClick={toggleSimulation}
									className={`px-4 py-2 rounded-md transition-colors ${
										isRunning
											? "bg-red-600 hover:bg-red-700 text-white"
											: "bg-green-600 hover:bg-green-700 text-white"
									}`}
								>
									{isRunning ? "Stop" : "Start"}
								</button>
								<button
									onClick={resetSimulation}
									className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
								>
									Reset
								</button>
							</div>
						</div>
						<canvas
							ref={canvasRef}
							width={800}
							height={500}
							onMouseMove={handleMouseMove}
							onMouseDown={handleMouseDown}
							onMouseUp={handleMouseUp}
							onMouseLeave={handleMouseUp}
							className="border border-gray-300 rounded cursor-crosshair w-full"
						/>
						<div className="mt-2 text-sm text-gray-600">
							Click and drag to attract/repel particles
						</div>
					</div>

					<ParticleStats />
				</div>

				<div className="space-y-6">
					<div className="bg-white rounded-lg shadow-md p-4">
						<h3 className="text-lg font-semibold mb-4 text-gray-800">
							Physics Settings
						</h3>
						<div className="space-y-4">
							<div>
								<label htmlFor="particle-count" className="block text-sm font-medium text-gray-700 mb-1">
									Particle Count: {settings.count}
								</label>
								<input
									id="particle-count"
									type="range"
									min="10"
									max="100"
									value={settings.count}
									onChange={(e) => setSettings(prev => ({
										...prev,
										count: Number.parseInt(e.target.value)
									}))}
									className="w-full"
								/>
							</div>

							<div>
								<label htmlFor="gravity" className="block text-sm font-medium text-gray-700 mb-1">
									Gravity: {settings.gravity.toFixed(2)}
								</label>
								<input
									id="gravity"
									type="range"
									min="0"
									max="2"
									step="0.1"
									value={settings.gravity}
									onChange={(e) => setSettings(prev => ({
										...prev,
										gravity: Number.parseFloat(e.target.value)
									}))}
									className="w-full"
								/>
							</div>

							<div>
								<label htmlFor="damping" className="block text-sm font-medium text-gray-700 mb-1">
									Damping: {settings.damping.toFixed(2)}
								</label>
								<input
									id="damping"
									type="range"
									min="0.9"
									max="1"
									step="0.01"
									value={settings.damping}
									onChange={(e) => setSettings(prev => ({
										...prev,
										damping: Number.parseFloat(e.target.value)
									}))}
									className="w-full"
								/>
							</div>

							<div>
								<label htmlFor="mouse-attraction" className="block text-sm font-medium text-gray-700 mb-1">
									Mouse Force: {settings.mouseAttraction.toFixed(2)}
								</label>
								<input
									id="mouse-attraction"
									type="range"
									min="-1"
									max="1"
									step="0.1"
									value={settings.mouseAttraction}
									onChange={(e) => setSettings(prev => ({
										...prev,
										mouseAttraction: Number.parseFloat(e.target.value)
									}))}
									className="w-full"
								/>
							</div>

							<div className="space-y-2">
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={settings.enableCollisions}
										onChange={(e) => setSettings(prev => ({
											...prev,
											enableCollisions: e.target.checked
										}))}
										className="mr-2"
									/>
									<span className="text-sm font-medium text-gray-700">
										Enable Collisions
									</span>
								</label>

								<label className="flex items-center">
									<input
										type="checkbox"
										checked={settings.enableSprings}
										onChange={(e) => setSettings(prev => ({
											...prev,
											enableSprings: e.target.checked
										}))}
										className="mr-2"
									/>
									<span className="text-sm font-medium text-gray-700">
										Enable Springs
									</span>
								</label>
							</div>

							{settings.enableSprings && (
								<div>
									<label htmlFor="spring-strength" className="block text-sm font-medium text-gray-700 mb-1">
										Spring Strength: {settings.springStrength.toFixed(2)}
									</label>
									<input
										id="spring-strength"
										type="range"
										min="0"
										max="0.5"
										step="0.01"
										value={settings.springStrength}
										onChange={(e) => setSettings(prev => ({
											...prev,
											springStrength: Number.parseFloat(e.target.value)
										}))}
										className="w-full"
									/>
								</div>
							)}
						</div>
					</div>

					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<h4 className="text-lg font-semibold mb-2 text-blue-800">
							Physics Concepts
						</h4>
						<ul className="text-blue-700 text-sm space-y-1">
							<li>• <strong>Verlet Integration</strong>: Stable particle motion</li>
							<li>• <strong>Collision Detection</strong>: Circle-circle collisions</li>
							<li>• <strong>Force Application</strong>: Gravity, springs, mouse forces</li>
							<li>• <strong>Constraint Solving</strong>: Boundary conditions</li>
							<li>• <strong>Energy Conservation</strong>: Realistic physics behavior</li>
						</ul>
					</div>
				</div>
			</div>

			<div className="mt-6">
				<a
					href="/examples/visual"
					className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
				>
					← Back to Visual Examples
				</a>
			</div>
		</div>
	);
}