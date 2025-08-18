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

export const Route = createFileRoute("/examples/visual/soft-body")({
	component: SoftBodyExample,
});

interface SoftBodyPoint {
	x: number;
	y: number;
	oldX: number;
	oldY: number;
	pinned: boolean;
	id: number;
}

interface SoftBodyConstraint {
	p1: SoftBodyPoint;
	p2: SoftBodyPoint;
	restLength: number;
	stiffness: number;
}

interface SoftBodySettings {
	gravity: number;
	damping: number;
	iterations: number;
	stiffness: number;
	pressure: number;
	showConstraints: boolean;
	showPoints: boolean;
	colorMode: "solid" | "pressure" | "velocity";
}

function SoftBodyExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const mouseRef = useRef({ x: 0, y: 0, down: false, radius: 50 });

	const [isAnimating, setIsAnimating] = useState(false);
	const [points, setPoints] = useState<SoftBodyPoint[]>([]);
	const [constraints, setConstraints] = useState<SoftBodyConstraint[]>([]);
	const [settings, setSettings] = useState<SoftBodySettings>({
		gravity: 0.5,
		damping: 0.99,
		iterations: 3,
		stiffness: 0.8,
		pressure: 0.1,
		showConstraints: true,
		showPoints: true,
		colorMode: "pressure",
	});

	// Create soft body shapes
	const createBlob = (
		centerX: number,
		centerY: number,
		radius: number,
		segments: number,
	): { points: SoftBodyPoint[]; constraints: SoftBodyConstraint[] } => {
		const newPoints: SoftBodyPoint[] = [];
		const newConstraints: SoftBodyConstraint[] = [];

		// Create circular arrangement of points
		for (let i = 0; i < segments; i++) {
			const angle = (i / segments) * TWO_PI;
			const x = centerX + cos(angle) * radius;
			const y = centerY + sin(angle) * radius;

			newPoints.push({
				x,
				y,
				oldX: x,
				oldY: y,
				pinned: false,
				id: i,
			});
		}

		// Create constraints between adjacent points
		for (let i = 0; i < segments; i++) {
			const p1 = newPoints[i];
			const p2 = newPoints[(i + 1) % segments];
			const distance = vec2Distance(p1, p2);

			newConstraints.push({
				p1,
				p2,
				restLength: distance,
				stiffness: settings.stiffness,
			});
		}

		// Create cross constraints for stability
		for (let i = 0; i < segments; i++) {
			const p1 = newPoints[i];
			const p2 = newPoints[(i + 2) % segments];
			const distance = vec2Distance(p1, p2);

			newConstraints.push({
				p1,
				p2,
				restLength: distance,
				stiffness: settings.stiffness * 0.5,
			});
		}

		return { points: newPoints, constraints: newConstraints };
	};

	const createRope = (
		startX: number,
		startY: number,
		endX: number,
		endY: number,
		segments: number,
	): { points: SoftBodyPoint[]; constraints: SoftBodyConstraint[] } => {
		const newPoints: SoftBodyPoint[] = [];
		const newConstraints: SoftBodyConstraint[] = [];

		// Create points along the rope
		for (let i = 0; i <= segments; i++) {
			const t = i / segments;
			const x = lerp(startX, endX, t);
			const y = lerp(startY, endY, t);

			newPoints.push({
				x,
				y,
				oldX: x,
				oldY: y,
				pinned: i === 0 || i === segments, // Pin ends
				id: i,
			});
		}

		// Create constraints between adjacent points
		for (let i = 0; i < segments; i++) {
			const p1 = newPoints[i];
			const p2 = newPoints[i + 1];
			const distance = vec2Distance(p1, p2);

			newConstraints.push({
				p1,
				p2,
				restLength: distance,
				stiffness: settings.stiffness,
			});
		}

		return { points: newPoints, constraints: newConstraints };
	};

	const createCloth = (
		x: number,
		y: number,
		width: number,
		height: number,
		resX: number,
		resY: number,
	): { points: SoftBodyPoint[]; constraints: SoftBodyConstraint[] } => {
		const newPoints: SoftBodyPoint[] = [];
		const newConstraints: SoftBodyConstraint[] = [];

		// Create grid of points
		for (let j = 0; j <= resY; j++) {
			for (let i = 0; i <= resX; i++) {
				const px = x + (i / resX) * width;
				const py = y + (j / resY) * height;

				newPoints.push({
					x: px,
					y: py,
					oldX: px,
					oldY: py,
					pinned: j === 0 && (i === 0 || i === resX), // Pin top corners
					id: j * (resX + 1) + i,
				});
			}
		}

		// Create horizontal constraints
		for (let j = 0; j <= resY; j++) {
			for (let i = 0; i < resX; i++) {
				const p1 = newPoints[j * (resX + 1) + i];
				const p2 = newPoints[j * (resX + 1) + i + 1];
				const distance = vec2Distance(p1, p2);

				newConstraints.push({
					p1,
					p2,
					restLength: distance,
					stiffness: settings.stiffness,
				});
			}
		}

		// Create vertical constraints
		for (let j = 0; j < resY; j++) {
			for (let i = 0; i <= resX; i++) {
				const p1 = newPoints[j * (resX + 1) + i];
				const p2 = newPoints[(j + 1) * (resX + 1) + i];
				const distance = vec2Distance(p1, p2);

				newConstraints.push({
					p1,
					p2,
					restLength: distance,
					stiffness: settings.stiffness,
				});
			}
		}

		return { points: newPoints, constraints: newConstraints };
	};

	// Physics simulation
	const updatePhysics = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		// Verlet integration
		points.forEach((point) => {
			if (point.pinned) return;

			const velX = (point.x - point.oldX) * settings.damping;
			const velY = (point.y - point.oldY) * settings.damping;

			point.oldX = point.x;
			point.oldY = point.y;

			point.x += velX;
			point.y += velY + settings.gravity;

			// Boundary constraints
			if (point.x < 10) {
				point.x = 10;
				point.oldX = point.x + velX * 0.8;
			}
			if (point.x > canvas.width - 10) {
				point.x = canvas.width - 10;
				point.oldX = point.x + velX * 0.8;
			}
			if (point.y < 10) {
				point.y = 10;
				point.oldY = point.y + velY * 0.8;
			}
			if (point.y > canvas.height - 10) {
				point.y = canvas.height - 10;
				point.oldY = point.y + velY * 0.8;
			}
		});

		// Mouse interaction
		if (mouseRef.current.down) {
			points.forEach((point) => {
				const distance = vec2Distance(point, mouseRef.current);
				if (distance < mouseRef.current.radius) {
					const force =
						(mouseRef.current.radius - distance) / mouseRef.current.radius;
					const direction = vec2Normalize(vec2Sub(point, mouseRef.current));
					const pushForce = vec2Mul(direction, force * 10);

					point.x += pushForce.x;
					point.y += pushForce.y;
				}
			});
		}

		// Constraint satisfaction
		for (let iteration = 0; iteration < settings.iterations; iteration++) {
			constraints.forEach((constraint) => {
				const delta = vec2Sub(constraint.p2, constraint.p1);
				const distance = vec2Distance(constraint.p1, constraint.p2);
				const difference = (constraint.restLength - distance) / distance;
				const correction = vec2Mul(
					delta,
					difference * constraint.stiffness * 0.5,
				);

				if (!constraint.p1.pinned) {
					constraint.p1.x -= correction.x;
					constraint.p1.y -= correction.y;
				}
				if (!constraint.p2.pinned) {
					constraint.p2.x += correction.x;
					constraint.p2.y += correction.y;
				}
			});
		}
	};

	const render = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw constraints
		if (settings.showConstraints) {
			ctx.strokeStyle = "rgba(100, 100, 100, 0.3)";
			ctx.lineWidth = 1;
			constraints.forEach((constraint) => {
				ctx.beginPath();
				ctx.moveTo(constraint.p1.x, constraint.p1.y);
				ctx.lineTo(constraint.p2.x, constraint.p2.y);
				ctx.stroke();
			});
		}

		// Draw soft body surface
		if (points.length > 0) {
			ctx.fillStyle =
				settings.colorMode === "solid"
					? "rgba(100, 150, 255, 0.7)"
					: "rgba(100, 150, 255, 0.7)";
			ctx.strokeStyle = "#4A90E2";
			ctx.lineWidth = 2;

			// Draw filled shape for blobs
			if (points.length <= 20) {
				// Assuming blobs have fewer points
				ctx.beginPath();
				ctx.moveTo(points[0].x, points[0].y);
				for (let i = 1; i < points.length; i++) {
					ctx.lineTo(points[i].x, points[i].y);
				}
				ctx.closePath();

				if (settings.colorMode === "pressure") {
					// Calculate pressure based on area compression
					let area = 0;
					for (let i = 0; i < points.length; i++) {
						const j = (i + 1) % points.length;
						area += points[i].x * points[j].y - points[j].x * points[i].y;
					}
					area = Math.abs(area) / 2;
					const pressure = clamp(1 - area / 10000, 0, 1);
					const color = hslToRgb(hsl(pressure * 60, 80, 60));
					ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.7)`;
				}

				ctx.fill();
				ctx.stroke();
			}
		}

		// Draw points
		if (settings.showPoints) {
			points.forEach((point) => {
				ctx.fillStyle = point.pinned ? "#FF6B6B" : "#4ECDC4";
				ctx.beginPath();
				ctx.arc(point.x, point.y, point.pinned ? 6 : 4, 0, TWO_PI);
				ctx.fill();
			});
		}

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
	};

	const animate = () => {
		updatePhysics();
		render();
		if (isAnimating) {
			animationRef.current = requestAnimationFrame(animate);
		}
	};

	const startAnimation = () => {
		setIsAnimating(true);
	};

	const stopAnimation = () => {
		setIsAnimating(false);
		if (animationRef.current) {
			cancelAnimationFrame(animationRef.current);
		}
	};

	const resetSimulation = () => {
		setPoints([]);
		setConstraints([]);
	};

	const createSoftBody = (type: "blob" | "rope" | "cloth") => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		let result;
		switch (type) {
			case "blob":
				result = createBlob(canvas.width / 2, canvas.height / 3, 80, 12);
				break;
			case "rope":
				result = createRope(100, 100, canvas.width - 100, 100, 20);
				break;
			case "cloth":
				result = createCloth(canvas.width / 2 - 100, 50, 200, 150, 8, 6);
				break;
		}

		setPoints(result.points);
		setConstraints(result.constraints);
	};

	// Mouse event handlers
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

		// Create initial blob
		createSoftBody("blob");

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (isAnimating) {
			animate();
		}
		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [isAnimating, settings]);

	useEffect(() => {
		// Update constraint stiffness when settings change
		constraints.forEach((constraint) => {
			constraint.stiffness = settings.stiffness;
		});
	}, [settings.stiffness, constraints]);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Verlet Integration Soft Body Physics
				</h1>
				<p className="text-gray-600 mb-4">
					Three body types with interactive manipulation, real-time physics
					parameters, and pressure visualization.
				</p>
				<div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
					<p className="text-purple-800">
						🎈 Interactive physics simulation - drag to push objects, watch
						realistic deformation
					</p>
				</div>
			</div>

			<div className="mb-6">
				<div className="flex flex-wrap gap-4 mb-4">
					<button
						type="button"
						onClick={startAnimation}
						disabled={isAnimating}
						className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
					>
						{isAnimating ? "Running..." : "Start Simulation"}
					</button>
					<button
						type="button"
						onClick={stopAnimation}
						disabled={!isAnimating}
						className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
					>
						Stop Simulation
					</button>
					<button
						type="button"
						onClick={resetSimulation}
						className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
					>
						Reset
					</button>
				</div>

				<div className="flex flex-wrap gap-4 mb-4">
					<button
						type="button"
						onClick={() => createSoftBody("blob")}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
					>
						Create Blob
					</button>
					<button
						type="button"
						onClick={() => createSoftBody("rope")}
						className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
					>
						Create Rope
					</button>
					<button
						type="button"
						onClick={() => createSoftBody("cloth")}
						className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
					>
						Create Cloth
					</button>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Gravity: {settings.gravity.toFixed(2)}
						</label>
						<input
							type="range"
							min="0"
							max="2"
							step="0.1"
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
							Damping: {settings.damping.toFixed(3)}
						</label>
						<input
							type="range"
							min="0.9"
							max="0.999"
							step="0.001"
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
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Stiffness: {settings.stiffness.toFixed(2)}
						</label>
						<input
							type="range"
							min="0.1"
							max="1"
							step="0.1"
							value={settings.stiffness}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									stiffness: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Iterations: {settings.iterations}
						</label>
						<input
							type="range"
							min="1"
							max="10"
							step="1"
							value={settings.iterations}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									iterations: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
				</div>

				<div className="flex flex-wrap gap-4 mb-4">
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={settings.showConstraints}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									showConstraints: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">
							Show Constraints
						</span>
					</label>
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={settings.showPoints}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									showPoints: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">
							Show Points
						</span>
					</label>
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
							className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
						>
							<option value="solid">Solid Color</option>
							<option value="pressure">Pressure Based</option>
							<option value="velocity">Velocity Based</option>
						</select>
					</div>
				</div>
			</div>

			<div className="mb-6">
				<canvas
					ref={canvasRef}
					className="border border-gray-300 rounded-lg bg-gray-50 cursor-crosshair"
					style={{ maxWidth: "100%", height: "auto" }}
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseUp}
				/>
				<p className="text-sm text-gray-500 mt-2">
					Click and drag to interact with the soft bodies
				</p>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-blue-800">
						Physics Concepts
					</h3>
					<ul className="text-blue-700 space-y-1">
						<li>
							• <strong>Verlet Integration</strong>: Position-based dynamics for
							stability
						</li>
						<li>
							• <strong>Constraint Satisfaction</strong>: Iterative relaxation
							method
						</li>
						<li>
							• <strong>Mass-Spring System</strong>: Network of connected
							particles
						</li>
						<li>
							• <strong>Collision Response</strong>: Boundary and object
							interaction
						</li>
					</ul>
				</div>

				<div className="bg-green-50 border border-green-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-green-800">
						Simulation Features
					</h3>
					<ul className="text-green-700 space-y-1">
						<li>
							• <strong>Multiple Body Types</strong>: Blobs, ropes, cloth
							simulation
						</li>
						<li>
							• <strong>Interactive Forces</strong>: Mouse-based object
							manipulation
						</li>
						<li>
							• <strong>Real-time Parameters</strong>: Adjustable physics
							properties
						</li>
						<li>
							• <strong>Visual Feedback</strong>: Pressure and constraint
							visualization
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
						<strong>Game Development:</strong>
						<ul className="text-sm mt-1">
							<li>• Character animation</li>
							<li>• Environmental effects</li>
							<li>• Destructible objects</li>
						</ul>
					</div>
					<div>
						<strong>Computer Graphics:</strong>
						<ul className="text-sm mt-1">
							<li>• Fluid simulation</li>
							<li>• Cloth simulation</li>
							<li>• Deformable surfaces</li>
						</ul>
					</div>
					<div>
						<strong>Scientific Modeling:</strong>
						<ul className="text-sm mt-1">
							<li>• Material science</li>
							<li>• Biomechanics</li>
							<li>• Engineering analysis</li>
						</ul>
					</div>
				</div>
			</div>

			<div className="mt-6">
				<Link
					to="/examples/visual"
					className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
				>
					← Back to Examples
				</Link>
			</div>
		</div>
	);
}
