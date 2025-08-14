import { Link, createFileRoute } from "@tanstack/react-router";
import {
	clamp,
	cos,
	hsl,
	lerp,
	sin,
	toCssHsl,
	vec3,
	vec3Add,
	vec3Dot,
	vec3Length,
	vec3Mul,
	vec3Normalize,
	vec3Sub,
} from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/visual/ray-marching")({
	component: RayMarchingExample,
});

interface Camera {
	position: { x: number; y: number; z: number };
	target: { x: number; y: number; z: number };
	fov: number;
}

interface RayMarchSettings {
	maxSteps: number;
	maxDistance: number;
	surfaceDistance: number;
	camera: Camera;
	time: number;
	lightPosition: { x: number; y: number; z: number };
}

function RayMarchingExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const settingsRef = useRef<RayMarchSettings>({
		maxSteps: 64,
		maxDistance: 20.0,
		surfaceDistance: 0.01,
		camera: {
			position: { x: 0, y: 0, z: -3 },
			target: { x: 0, y: 0, z: 0 },
			fov: Math.PI / 4,
		},
		time: 0,
		lightPosition: { x: 2, y: 2, z: -1 },
	});

	const [isAnimating, setIsAnimating] = useState(false);
	const [renderMode, setRenderMode] = useState<"normal" | "depth" | "steps">(
		"normal",
	);
	const [primitiveType, setPrimitiveType] = useState<
		"sphere" | "box" | "torus" | "mandelbulb"
	>("sphere");
	const [showWireframe, setShowWireframe] = useState(false);

	// Signed Distance Functions
	const sdfSphere = (
		p: { x: number; y: number; z: number },
		radius: number,
	): number => {
		return vec3Length(p) - radius;
	};

	const sdfBox = (
		p: { x: number; y: number; z: number },
		size: { x: number; y: number; z: number },
	): number => {
		const q = {
			x: Math.abs(p.x) - size.x,
			y: Math.abs(p.y) - size.y,
			z: Math.abs(p.z) - size.z,
		};
		return (
			vec3Length({
				x: Math.max(q.x, 0),
				y: Math.max(q.y, 0),
				z: Math.max(q.z, 0),
			}) + Math.min(Math.max(q.x, Math.max(q.y, q.z)), 0)
		);
	};

	const sdfTorus = (
		p: { x: number; y: number; z: number },
		r1: number,
		r2: number,
	): number => {
		const q = {
			x: Math.sqrt(p.x * p.x + p.z * p.z) - r1,
			y: p.y,
		};
		return Math.sqrt(q.x * q.x + q.y * q.y) - r2;
	};

	const sdfMandelbulb = (
		pos: { x: number; y: number; z: number },
		power = 8,
	): number => {
		let z = { ...pos };
		let dr = 1.0;
		let r = 0.0;

		for (let i = 0; i < 4; i++) {
			r = vec3Length(z);
			if (r > 2) break;

			// Convert to polar coordinates
			const theta = Math.acos(z.z / r);
			const phi = Math.atan2(z.y, z.x);
			dr = Math.pow(r, power - 1) * power * dr + 1.0;

			// Scale and rotate the point
			const zr = Math.pow(r, power);
			const newTheta = theta * power;
			const newPhi = phi * power;

			z = vec3Add(
				vec3Mul(
					{
						x: Math.sin(newTheta) * Math.cos(newPhi),
						y: Math.sin(newPhi) * Math.sin(newTheta),
						z: Math.cos(newTheta),
					},
					zr,
				),
				pos,
			);
		}

		return (0.5 * Math.log(r) * r) / dr;
	};

	const getDistance = (
		p: { x: number; y: number; z: number },
		time: number,
	): number => {
		// Add rotation to make it more interesting
		const rotY = time * 0.5;
		const rotatedP = {
			x: p.x * Math.cos(rotY) - p.z * Math.sin(rotY),
			y: p.y,
			z: p.x * Math.sin(rotY) + p.z * Math.cos(rotY),
		};

		switch (primitiveType) {
			case "sphere":
				return sdfSphere(rotatedP, 1.0);
			case "box":
				return sdfBox(rotatedP, { x: 0.8, y: 0.8, z: 0.8 });
			case "torus":
				return sdfTorus(rotatedP, 1.0, 0.3);
			case "mandelbulb":
				return sdfMandelbulb(vec3Mul(rotatedP, 0.5)) * 2;
			default:
				return sdfSphere(rotatedP, 1.0);
		}
	};

	const getNormal = (
		p: { x: number; y: number; z: number },
		time: number,
	): { x: number; y: number; z: number } => {
		const eps = 0.01;
		const gradient = {
			x:
				getDistance({ x: p.x + eps, y: p.y, z: p.z }, time) -
				getDistance({ x: p.x - eps, y: p.y, z: p.z }, time),
			y:
				getDistance({ x: p.x, y: p.y + eps, z: p.z }, time) -
				getDistance({ x: p.x, y: p.y - eps, z: p.z }, time),
			z:
				getDistance({ x: p.x, y: p.y, z: p.z + eps }, time) -
				getDistance({ x: p.x, y: p.y, z: p.z - eps }, time),
		};
		return vec3Normalize(gradient);
	};

	const rayMarch = (
		rayOrigin: { x: number; y: number; z: number },
		rayDirection: { x: number; y: number; z: number },
		settings: RayMarchSettings,
	): { distance: number; steps: number; hit: boolean } => {
		let totalDistance = 0;
		let steps = 0;

		for (let i = 0; i < settings.maxSteps; i++) {
			const currentPos = vec3Add(
				rayOrigin,
				vec3Mul(rayDirection, totalDistance),
			);
			const distanceToSurface = getDistance(currentPos, settings.time);

			totalDistance += distanceToSurface;
			steps = i;

			if (distanceToSurface < settings.surfaceDistance) {
				return { distance: totalDistance, steps, hit: true };
			}

			if (totalDistance > settings.maxDistance) {
				break;
			}
		}

		return { distance: totalDistance, steps, hit: false };
	};

	const render = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		const { width, height } = canvas;
		const imageData = ctx.createImageData(width, height);
		const data = imageData.data;
		const settings = settingsRef.current;

		// Camera setup
		const aspectRatio = width / height;
		const camera = settings.camera;
		const forward = vec3Normalize(vec3Sub(camera.target, camera.position));
		const right = vec3Normalize(
			vec3Dot(forward, { x: 0, y: 1, z: 0 }) > 0.99
				? { x: 1, y: 0, z: 0 }
				: vec3Normalize({ x: forward.z, y: 0, z: -forward.x }),
		);
		const up = vec3Normalize(
			vec3Sub(
				{ x: 0, y: 0, z: 0 },
				vec3Dot(right, forward) > 0
					? {
							x: right.y * forward.z - right.z * forward.y,
							y: right.z * forward.x - right.x * forward.z,
							z: right.x * forward.y - right.y * forward.x,
						}
					: { x: 0, y: 1, z: 0 },
			),
		);

		const fovScale = Math.tan(camera.fov * 0.5);

		for (let y = 0; y < height; y += 2) {
			// Render every other pixel for performance
			for (let x = 0; x < width; x += 2) {
				// Convert screen coordinates to normalized device coordinates
				const ndc = {
					x: ((2 * x) / width - 1) * aspectRatio * fovScale,
					y: (1 - (2 * y) / height) * fovScale,
				};

				// Calculate ray direction
				const rayDirection = vec3Normalize(
					vec3Add(vec3Add(forward, vec3Mul(right, ndc.x)), vec3Mul(up, ndc.y)),
				);

				const result = rayMarch(camera.position, rayDirection, settings);

				let color = { r: 0, g: 0, b: 0 };

				if (result.hit) {
					const hitPoint = vec3Add(
						camera.position,
						vec3Mul(rayDirection, result.distance),
					);

					switch (renderMode) {
						case "normal": {
							const normal = getNormal(hitPoint, settings.time);
							const lightDir = vec3Normalize(
								vec3Sub(settings.lightPosition, hitPoint),
							);
							const diffuse = Math.max(0, vec3Dot(normal, lightDir));

							// Add some color variation based on position
							const hue =
								((hitPoint.x + hitPoint.y + hitPoint.z) * 50 +
									settings.time * 20) %
								360;
							const baseColor = hsl(hue, 70, 50);

							color = {
								r: baseColor.r * diffuse,
								g: baseColor.g * diffuse,
								b: baseColor.b * diffuse,
							};
							break;
						}
						case "depth": {
							const depth =
								1 - clamp(result.distance / settings.maxDistance, 0, 1);
							color = { r: depth * 255, g: depth * 255, b: depth * 255 };
							break;
						}
						case "steps": {
							const stepIntensity = result.steps / settings.maxSteps;
							const hue = (1 - stepIntensity) * 240; // Blue to red
							const stepColor = hsl(hue, 100, 50);
							color = stepColor;
							break;
						}
					}
				} else {
					// Background gradient
					const gradient = (y / height) * 0.3;
					color = { r: gradient * 50, g: gradient * 70, b: gradient * 100 };
				}

				// Fill 2x2 block for performance
				for (let dy = 0; dy < 2 && y + dy < height; dy++) {
					for (let dx = 0; dx < 2 && x + dx < width; dx++) {
						const pixelIndex = ((y + dy) * width + (x + dx)) * 4;
						data[pixelIndex] = Math.min(255, Math.max(0, color.r));
						data[pixelIndex + 1] = Math.min(255, Math.max(0, color.g));
						data[pixelIndex + 2] = Math.min(255, Math.max(0, color.b));
						data[pixelIndex + 3] = 255;
					}
				}
			}
		}

		ctx.putImageData(imageData, 0, 0);

		// Draw wireframe overlay if enabled
		if (showWireframe) {
			ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
			ctx.lineWidth = 1;
			const gridSize = 20;
			for (let i = 0; i <= width; i += gridSize) {
				ctx.beginPath();
				ctx.moveTo(i, 0);
				ctx.lineTo(i, height);
				ctx.stroke();
			}
			for (let i = 0; i <= height; i += gridSize) {
				ctx.beginPath();
				ctx.moveTo(0, i);
				ctx.lineTo(width, i);
				ctx.stroke();
			}
		}
	};

	const animate = () => {
		if (!isAnimating) return;

		settingsRef.current.time += 0.02;
		render();
		animationRef.current = requestAnimationFrame(animate);
	};

	const startAnimation = () => {
		setIsAnimating(true);
		animationRef.current = requestAnimationFrame(animate);
	};

	const stopAnimation = () => {
		setIsAnimating(false);
		if (animationRef.current) {
			cancelAnimationFrame(animationRef.current);
		}
	};

	const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!e.buttons) return; // Only when dragging

		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const x = (e.clientX - rect.left) / rect.width;
		const y = (e.clientY - rect.top) / rect.height;

		// Rotate camera around the origin
		const radius = 3;
		const angle = (x - 0.5) * Math.PI * 2;
		const elevation = (y - 0.5) * Math.PI;

		settingsRef.current.camera.position = {
			x: Math.sin(angle) * Math.cos(elevation) * radius,
			y: Math.sin(elevation) * radius,
			z: Math.cos(angle) * Math.cos(elevation) * radius,
		};

		if (!isAnimating) {
			render();
		}
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.width = 400;
		canvas.height = 300;
		render();

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [renderMode, primitiveType, showWireframe]);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Advanced Ray Marching 3D Renderer
				</h1>
				<p className="text-gray-600 mb-4">
					Signed distance fields with multiple primitives, debug visualization,
					and interactive camera controls.
				</p>
				<div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
					<p className="text-purple-800">
						🔮 Drag to rotate camera, explore different primitives and rendering
						modes
					</p>
				</div>
			</div>

			<div className="mb-6">
				<div className="flex flex-wrap gap-4 mb-4">
					<button
						type="button"
						onClick={startAnimation}
						disabled={isAnimating}
						className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
					>
						Start Animation
					</button>
					<button
						type="button"
						onClick={stopAnimation}
						disabled={!isAnimating}
						className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
					>
						Stop Animation
					</button>
					<button
						type="button"
						onClick={render}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
					>
						Render Frame
					</button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Primitive Type
						</label>
						<select
							value={primitiveType}
							onChange={(e) =>
								setPrimitiveType(e.target.value as typeof primitiveType)
							}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
						>
							<option value="sphere">Sphere</option>
							<option value="box">Box</option>
							<option value="torus">Torus</option>
							<option value="mandelbulb">Mandelbulb</option>
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Render Mode
						</label>
						<select
							value={renderMode}
							onChange={(e) =>
								setRenderMode(e.target.value as typeof renderMode)
							}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
						>
							<option value="normal">Normal Shading</option>
							<option value="depth">Depth Buffer</option>
							<option value="steps">Ray Steps</option>
						</select>
					</div>
					<div className="flex items-center">
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={showWireframe}
								onChange={(e) => setShowWireframe(e.target.checked)}
								className="mr-2"
							/>
							<span className="text-sm font-medium text-gray-700">
								Show Wireframe
							</span>
						</label>
					</div>
				</div>
			</div>

			<div className="mb-6">
				<canvas
					ref={canvasRef}
					className="border border-gray-300 rounded-lg bg-black cursor-move"
					style={{ maxWidth: "100%", height: "auto" }}
					onMouseMove={handleMouseMove}
				/>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-yellow-800">
						Ray Marching Technique
					</h3>
					<ul className="text-yellow-700 space-y-1">
						<li>
							• <strong>Distance Fields</strong>: Mathematical functions
							describing 3D shapes
						</li>
						<li>
							• <strong>Ray Stepping</strong>: March along rays using safe
							distance steps
						</li>
						<li>
							• <strong>Surface Detection</strong>: Find intersections without
							triangle meshes
						</li>
						<li>
							• <strong>Gradient Normals</strong>: Calculate surface normals
							from SDF gradients
						</li>
					</ul>
				</div>

				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-blue-800">
						Rendering Features
					</h3>
					<ul className="text-blue-700 space-y-1">
						<li>
							• <strong>Multiple Primitives</strong>: Sphere, box, torus, and
							Mandelbulb
						</li>
						<li>
							• <strong>Real-time Rotation</strong>: Interactive camera controls
						</li>
						<li>
							• <strong>Debug Modes</strong>: Depth buffer and ray step
							visualization
						</li>
						<li>
							• <strong>Dynamic Lighting</strong>: Diffuse shading with moving
							light source
						</li>
					</ul>
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
