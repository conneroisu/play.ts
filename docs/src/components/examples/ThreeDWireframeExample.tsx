import {
	clamp,
	cos,
	hsl,
	lerp,
	PI,
	randomFloat,
	sin,
	TAU,
	toCssHsl,
} from "play.ts";
import { useEffect, useRef, useState } from "react";

interface Vector3 {
	x: number;
	y: number;
	z: number;
}

interface Vector2 {
	x: number;
	y: number;
}

interface Edge {
	start: number;
	end: number;
}

interface Face {
	vertices: number[];
	color: { h: number; s: number; l: number };
	normal?: Vector3;
}

interface Mesh {
	vertices: Vector3[];
	edges: Edge[];
	faces: Face[];
	center: Vector3;
}

interface Camera {
	position: Vector3;
	rotation: Vector3;
	fov: number;
	near: number;
	far: number;
}

interface RenderSettings {
	showWireframe: boolean;
	showFaces: boolean;
	showVertices: boolean;
	backfaceCulling: boolean;
	lighting: boolean;
	autoRotate: boolean;
	renderMode: "wireframe" | "solid" | "both";
}

export default function ThreeDWireframeExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const mouseRef = useRef({ x: 0, y: 0, dragging: false, lastX: 0, lastY: 0 });

	const [isAnimating, setIsAnimating] = useState(false);
	const [currentMesh, setCurrentMesh] = useState<
		"cube" | "pyramid" | "octahedron" | "sphere" | "torus"
	>("cube");
	const [camera, setCamera] = useState<Camera>({
		position: { x: 0, y: 0, z: 5 },
		rotation: { x: 0, y: 0, z: 0 },
		fov: PI / 4,
		near: 0.1,
		far: 100,
	});
	const [settings, setSettings] = useState<RenderSettings>({
		showWireframe: true,
		showFaces: true,
		showVertices: false,
		backfaceCulling: true,
		lighting: true,
		autoRotate: false,
		renderMode: "both",
	});

	// Matrix operations
	const createIdentityMatrix = (): number[][] => [
		[1, 0, 0, 0],
		[0, 1, 0, 0],
		[0, 0, 1, 0],
		[0, 0, 0, 1],
	];

	const createRotationMatrixX = (angle: number): number[][] => [
		[1, 0, 0, 0],
		[0, cos(angle), -sin(angle), 0],
		[0, sin(angle), cos(angle), 0],
		[0, 0, 0, 1],
	];

	const createRotationMatrixY = (angle: number): number[][] => [
		[cos(angle), 0, sin(angle), 0],
		[0, 1, 0, 0],
		[-sin(angle), 0, cos(angle), 0],
		[0, 0, 0, 1],
	];

	const createRotationMatrixZ = (angle: number): number[][] => [
		[cos(angle), -sin(angle), 0, 0],
		[sin(angle), cos(angle), 0, 0],
		[0, 0, 1, 0],
		[0, 0, 0, 1],
	];

	const createTranslationMatrix = (
		x: number,
		y: number,
		z: number,
	): number[][] => [
		[1, 0, 0, x],
		[0, 1, 0, y],
		[0, 0, 1, z],
		[0, 0, 0, 1],
	];

	const createPerspectiveMatrix = (
		fov: number,
		aspect: number,
		near: number,
		far: number,
	): number[][] => {
		const f = 1 / Math.tan(fov / 2);
		const rangeInv = 1 / (near - far);

		return [
			[f / aspect, 0, 0, 0],
			[0, f, 0, 0],
			[0, 0, (near + far) * rangeInv, near * far * rangeInv * 2],
			[0, 0, -1, 0],
		];
	};

	const multiplyMatrices = (a: number[][], b: number[][]): number[][] => {
		const result = createIdentityMatrix();
		for (let i = 0; i < 4; i++) {
			for (let j = 0; j < 4; j++) {
				result[i][j] = 0;
				for (let k = 0; k < 4; k++) {
					result[i][j] += a[i][k] * b[k][j];
				}
			}
		}
		return result;
	};

	const transformVector = (vector: Vector3, matrix: number[][]): Vector3 => {
		const x =
			vector.x * matrix[0][0] +
			vector.y * matrix[0][1] +
			vector.z * matrix[0][2] +
			matrix[0][3];
		const y =
			vector.x * matrix[1][0] +
			vector.y * matrix[1][1] +
			vector.z * matrix[1][2] +
			matrix[1][3];
		const z =
			vector.x * matrix[2][0] +
			vector.y * matrix[2][1] +
			vector.z * matrix[2][2] +
			matrix[2][3];
		const w =
			vector.x * matrix[3][0] +
			vector.y * matrix[3][1] +
			vector.z * matrix[3][2] +
			matrix[3][3];

		return { x: x / w, y: y / w, z: z / w };
	};

	const projectToScreen = (
		vector: Vector3,
		width: number,
		height: number,
	): Vector2 => ({
		x: ((vector.x + 1) * width) / 2,
		y: ((1 - vector.y) * height) / 2,
	});

	// Mesh generators
	const createCube = (): Mesh => ({
		vertices: [
			{ x: -1, y: -1, z: -1 },
			{ x: 1, y: -1, z: -1 },
			{ x: 1, y: 1, z: -1 },
			{ x: -1, y: 1, z: -1 },
			{ x: -1, y: -1, z: 1 },
			{ x: 1, y: -1, z: 1 },
			{ x: 1, y: 1, z: 1 },
			{ x: -1, y: 1, z: 1 },
		],
		edges: [
			{ start: 0, end: 1 },
			{ start: 1, end: 2 },
			{ start: 2, end: 3 },
			{ start: 3, end: 0 },
			{ start: 4, end: 5 },
			{ start: 5, end: 6 },
			{ start: 6, end: 7 },
			{ start: 7, end: 4 },
			{ start: 0, end: 4 },
			{ start: 1, end: 5 },
			{ start: 2, end: 6 },
			{ start: 3, end: 7 },
		],
		faces: [
			{ vertices: [0, 1, 2, 3], color: hsl(0, 70, 60) }, // Front
			{ vertices: [4, 7, 6, 5], color: hsl(60, 70, 60) }, // Back
			{ vertices: [0, 4, 5, 1], color: hsl(120, 70, 60) }, // Bottom
			{ vertices: [2, 6, 7, 3], color: hsl(180, 70, 60) }, // Top
			{ vertices: [0, 3, 7, 4], color: hsl(240, 70, 60) }, // Left
			{ vertices: [1, 5, 6, 2], color: hsl(300, 70, 60) }, // Right
		],
		center: { x: 0, y: 0, z: 0 },
	});

	const createPyramid = (): Mesh => ({
		vertices: [
			{ x: 0, y: 1.5, z: 0 }, // Apex
			{ x: -1, y: -1, z: 1 }, // Base vertices
			{ x: 1, y: -1, z: 1 },
			{ x: 1, y: -1, z: -1 },
			{ x: -1, y: -1, z: -1 },
		],
		edges: [
			{ start: 0, end: 1 },
			{ start: 0, end: 2 },
			{ start: 0, end: 3 },
			{ start: 0, end: 4 },
			{ start: 1, end: 2 },
			{ start: 2, end: 3 },
			{ start: 3, end: 4 },
			{ start: 4, end: 1 },
		],
		faces: [
			{ vertices: [0, 1, 2], color: hsl(0, 70, 60) },
			{ vertices: [0, 2, 3], color: hsl(90, 70, 60) },
			{ vertices: [0, 3, 4], color: hsl(180, 70, 60) },
			{ vertices: [0, 4, 1], color: hsl(270, 70, 60) },
			{ vertices: [1, 4, 3, 2], color: hsl(45, 70, 60) },
		],
		center: { x: 0, y: 0, z: 0 },
	});

	const createSphere = (radius = 1, segments = 12, rings = 8): Mesh => {
		const vertices: Vector3[] = [];
		const edges: Edge[] = [];
		const faces: Face[] = [];

		// Generate vertices
		for (let i = 0; i <= rings; i++) {
			const phi = (i / rings) * PI;
			for (let j = 0; j <= segments; j++) {
				const theta = (j / segments) * TAU;
				vertices.push({
					x: radius * sin(phi) * cos(theta),
					y: radius * cos(phi),
					z: radius * sin(phi) * sin(theta),
				});
			}
		}

		// Generate faces and edges
		for (let i = 0; i < rings; i++) {
			for (let j = 0; j < segments; j++) {
				const current = i * (segments + 1) + j;
				const next = current + segments + 1;

				if (i > 0) {
					faces.push({
						vertices: [current, next, next + 1, current + 1],
						color: hsl((i * j * 30) % 360, 70, 60),
					});
				}

				// Horizontal edges
				if (j < segments) {
					edges.push({ start: current, end: current + 1 });
				}
				// Vertical edges
				if (i < rings) {
					edges.push({ start: current, end: next });
				}
			}
		}

		return { vertices, edges, faces, center: { x: 0, y: 0, z: 0 } };
	};

	const getMesh = (type: string): Mesh => {
		switch (type) {
			case "cube":
				return createCube();
			case "pyramid":
				return createPyramid();
			case "sphere":
				return createSphere();
			default:
				return createCube();
		}
	};

	// Calculate face normal
	const calculateNormal = (face: Face, vertices: Vector3[]): Vector3 => {
		const v0 = vertices[face.vertices[0]];
		const v1 = vertices[face.vertices[1]];
		const v2 = vertices[face.vertices[2]];

		const edge1 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
		const edge2 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };

		// Cross product
		const normal = {
			x: edge1.y * edge2.z - edge1.z * edge2.y,
			y: edge1.z * edge2.x - edge1.x * edge2.z,
			z: edge1.x * edge2.y - edge1.y * edge2.x,
		};

		// Normalize
		const length = Math.sqrt(
			normal.x * normal.x + normal.y * normal.y + normal.z * normal.z,
		);
		return length > 0
			? { x: normal.x / length, y: normal.y / length, z: normal.z / length }
			: { x: 0, y: 0, z: 1 };
	};

	const render = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		const { width, height } = canvas;
		ctx.clearRect(0, 0, width, height);

		// Get current mesh
		const mesh = getMesh(currentMesh);

		// Create transformation matrices
		const rotationX = createRotationMatrixX(camera.rotation.x);
		const rotationY = createRotationMatrixY(camera.rotation.y);
		const rotationZ = createRotationMatrixZ(camera.rotation.z);
		const translation = createTranslationMatrix(
			-camera.position.x,
			-camera.position.y,
			-camera.position.z,
		);

		// Combine transformations (correct order: translation -> rotation)
		let transform = multiplyMatrices(translation, rotationX);
		transform = multiplyMatrices(transform, rotationY);
		transform = multiplyMatrices(transform, rotationZ);

		// Perspective projection
		const aspect = width / height;
		const perspective = createPerspectiveMatrix(
			camera.fov,
			aspect,
			camera.near,
			camera.far,
		);
		const finalTransform = multiplyMatrices(perspective, transform);

		// Transform vertices
		const transformedVertices = mesh.vertices.map((v) =>
			transformVector(v, finalTransform),
		);
		const screenVertices = transformedVertices.map((v) =>
			projectToScreen(v, width, height),
		);

		// Draw faces (if enabled)
		if (settings.showFaces && settings.renderMode !== "wireframe") {
			const facesWithDepth = mesh.faces.map((face) => {
				// Calculate average z for depth sorting
				const avgZ =
					face.vertices.reduce(
						(sum, idx) => sum + transformedVertices[idx].z,
						0,
					) / face.vertices.length;

				// Calculate normal for backface culling
				const transformedFaceVertices = face.vertices.map(
					(idx) => transformedVertices[idx],
				);
				const normal = calculateNormal(
					{ ...face, vertices: [0, 1, 2] },
					transformedFaceVertices,
				);

				return { face, avgZ, normal };
			});

			// Sort by depth (back to front)
			facesWithDepth.sort((a, b) => a.avgZ - b.avgZ);

			facesWithDepth.forEach(({ face, normal }) => {
				// Backface culling
				if (settings.backfaceCulling && normal.z <= 0) return;

				// Draw face
				ctx.beginPath();
				face.vertices.forEach((vertexIdx, i) => {
					const screenPos = screenVertices[vertexIdx];
					if (i === 0) {
						ctx.moveTo(screenPos.x, screenPos.y);
					} else {
						ctx.lineTo(screenPos.x, screenPos.y);
					}
				});
				ctx.closePath();

				// Apply lighting
				let color = face.color;
				if (settings.lighting) {
					const lightDir = { x: 0.5, y: 0.5, z: 1 };
					const lightIntensity = Math.max(
						0,
						normal.x * lightDir.x +
							normal.y * lightDir.y +
							normal.z * lightDir.z,
					);
					color = {
						...color,
						l: clamp(color.l * (0.3 + 0.7 * lightIntensity), 10, 90),
					};
				}

				ctx.fillStyle = toCssHsl(color);
				ctx.fill();

				if (settings.renderMode === "both") {
					ctx.strokeStyle = "#000000";
					ctx.lineWidth = 1;
					ctx.stroke();
				}
			});
		}

		// Draw wireframe (if enabled)
		if (settings.showWireframe && settings.renderMode !== "solid") {
			ctx.strokeStyle =
				settings.renderMode === "wireframe" ? "#ffffff" : "#000000";
			ctx.lineWidth = settings.renderMode === "wireframe" ? 2 : 1;

			mesh.edges.forEach((edge) => {
				const start = screenVertices[edge.start];
				const end = screenVertices[edge.end];

				// Only draw if both vertices are in front of the camera
				if (
					transformedVertices[edge.start].z > 0 &&
					transformedVertices[edge.end].z > 0
				) {
					ctx.beginPath();
					ctx.moveTo(start.x, start.y);
					ctx.lineTo(end.x, end.y);
					ctx.stroke();
				}
			});
		}

		// Draw vertices (if enabled)
		if (settings.showVertices) {
			ctx.fillStyle = "#ff0000";
			screenVertices.forEach((vertex, i) => {
				if (transformedVertices[i].z > 0) {
					ctx.beginPath();
					ctx.arc(vertex.x, vertex.y, 3, 0, TAU);
					ctx.fill();
				}
			});
		}

		// Draw UI info
		ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
		ctx.fillRect(10, 10, 200, 100);
		ctx.fillStyle = "#ffffff";
		ctx.font = "14px Arial";
		ctx.fillText(`Mesh: ${currentMesh}`, 20, 30);
		ctx.fillText(`Vertices: ${mesh.vertices.length}`, 20, 50);
		ctx.fillText(`Faces: ${mesh.faces.length}`, 20, 70);
		ctx.fillText(
			`Rotation: (${camera.rotation.x.toFixed(1)}, ${camera.rotation.y.toFixed(1)})`,
			20,
			90,
		);
	};

	const animate = () => {
		if (!isAnimating) return;

		if (settings.autoRotate) {
			setCamera((prev) => ({
				...prev,
				rotation: {
					...prev.rotation,
					y: prev.rotation.y + 0.02,
				},
			}));
		}

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

	const handleMouseDown = (e: React.MouseEvent) => {
		mouseRef.current.dragging = true;
		mouseRef.current.lastX = e.clientX;
		mouseRef.current.lastY = e.clientY;
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!mouseRef.current.dragging) return;

		const deltaX = e.clientX - mouseRef.current.lastX;
		const deltaY = e.clientY - mouseRef.current.lastY;

		setCamera((prev) => ({
			...prev,
			rotation: {
				...prev.rotation,
				y: prev.rotation.y + deltaX * 0.01,
				x: clamp(prev.rotation.x + deltaY * 0.01, -PI / 2, PI / 2),
			},
		}));

		mouseRef.current.lastX = e.clientX;
		mouseRef.current.lastY = e.clientY;
	};

	const handleMouseUp = () => {
		mouseRef.current.dragging = false;
	};

	const resetCamera = () => {
		setCamera({
			position: { x: 0, y: 0, z: 5 },
			rotation: { x: 0, y: 0, z: 0 },
			fov: PI / 4,
			near: 0.1,
			far: 100,
		});
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.width = 800;
		canvas.height = 600;

		// Initial render
		render();

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (!isAnimating) render();
	}, [camera, currentMesh, settings]);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Advanced 3D Software Renderer
				</h1>
				<p className="text-gray-600 mb-4">
					Complete 3D engine with matrix math, multiple primitives, lighting,
					and interactive camera controls.
				</p>
				<div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
					<p className="text-indigo-800">
						🎮 Drag to rotate, explore different meshes and rendering modes
					</p>
				</div>
			</div>

			<div className="mb-6">
				<div className="flex flex-wrap gap-4 mb-4">
					<button
						type="button"
						onClick={startAnimation}
						disabled={isAnimating}
						className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
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
						onClick={resetCamera}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
					>
						Reset Camera
					</button>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							3D Mesh
						</label>
						<select
							value={currentMesh}
							onChange={(e) =>
								setCurrentMesh(e.target.value as typeof currentMesh)
							}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
						>
							<option value="cube">Cube</option>
							<option value="pyramid">Pyramid</option>
							<option value="sphere">Sphere</option>
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Render Mode
						</label>
						<select
							value={settings.renderMode}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									renderMode: e.target.value as typeof settings.renderMode,
								}))
							}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
						>
							<option value="wireframe">Wireframe</option>
							<option value="solid">Solid</option>
							<option value="both">Both</option>
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							FOV: {((camera.fov * 180) / PI).toFixed(0)}°
						</label>
						<input
							type="range"
							min={PI / 6}
							max={PI / 2}
							step={PI / 36}
							value={camera.fov}
							onChange={(e) =>
								setCamera((prev) => ({ ...prev, fov: Number(e.target.value) }))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Distance: {camera.position.z.toFixed(1)}
						</label>
						<input
							type="range"
							min="2"
							max="10"
							step="0.1"
							value={camera.position.z}
							onChange={(e) =>
								setCamera((prev) => ({
									...prev,
									position: { ...prev.position, z: Number(e.target.value) },
								}))
							}
							className="w-full"
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={settings.showVertices}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									showVertices: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">
							Show Vertices
						</span>
					</label>
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={settings.backfaceCulling}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									backfaceCulling: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">
							Backface Culling
						</span>
					</label>
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={settings.lighting}
							onChange={(e) =>
								setSettings((prev) => ({ ...prev, lighting: e.target.checked }))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">Lighting</span>
					</label>
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={settings.autoRotate}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									autoRotate: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">
							Auto Rotate
						</span>
					</label>
				</div>
			</div>

			<div className="mb-6">
				<canvas
					ref={canvasRef}
					className="border border-gray-300 rounded-lg bg-black cursor-move"
					style={{ maxWidth: "100%", height: "auto" }}
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseUp}
				/>
				<p className="text-sm text-gray-500 mt-2">
					Drag to rotate the camera around the object
				</p>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-yellow-800">
						3D Transformations
					</h3>
					<ul className="text-yellow-700 space-y-1">
						<li>
							• <strong>Matrix Math</strong>: 4x4 transformation matrices
						</li>
						<li>
							• <strong>Perspective Projection</strong>: 3D to 2D screen mapping
						</li>
						<li>
							• <strong>Rotation Matrices</strong>: X, Y, Z axis rotations
						</li>
						<li>
							• <strong>Homogeneous Coordinates</strong>: 4D vector
							transformations
						</li>
					</ul>
				</div>

				<div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-indigo-800">
						Rendering Features
					</h3>
					<ul className="text-indigo-700 space-y-1">
						<li>
							• <strong>Multiple Render Modes</strong>: Wireframe, solid,
							combined
						</li>
						<li>
							• <strong>Backface Culling</strong>: Hide faces pointing away from
							camera
						</li>
						<li>
							• <strong>Depth Sorting</strong>: Proper face rendering order
						</li>
						<li>
							• <strong>Basic Lighting</strong>: Normal-based shading
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6">
				<a
					href="/examples/visual"
					className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
				>
					← Back to Examples
				</a>
			</div>
		</div>
	);
}