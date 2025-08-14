import { Link, createFileRoute } from "@tanstack/react-router";
import { PI, TWO_PI, vec2 } from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/visual/basic-shapes")({
	component: BasicShapesExample,
});

interface Shape {
	type: "circle" | "rectangle" | "triangle";
	position: { x: number; y: number };
	size: { width: number; height: number };
	color: string;
	rotation: number;
}

function BasicShapesExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [shapes, setShapes] = useState<Shape[]>([]);
	const [selectedShapeType, setSelectedShapeType] = useState<
		"circle" | "rectangle" | "triangle"
	>("circle");
	const [animationEnabled, setAnimationEnabled] = useState(false);
	const animationRef = useRef<number>();

	// Initialize with some default shapes
	useEffect(() => {
		const defaultShapes: Shape[] = [
			{
				type: "circle",
				position: { x: 150, y: 150 },
				size: { width: 60, height: 60 },
				color: "#3b82f6",
				rotation: 0,
			},
			{
				type: "rectangle",
				position: { x: 300, y: 150 },
				size: { width: 80, height: 50 },
				color: "#ef4444",
				rotation: 0.3,
			},
			{
				type: "triangle",
				position: { x: 450, y: 150 },
				size: { width: 70, height: 70 },
				color: "#10b981",
				rotation: 0.5,
			},
		];
		setShapes(defaultShapes);
	}, []);

	// Animation loop
	useEffect(() => {
		if (!animationEnabled) {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
			return;
		}

		const animate = (time: number) => {
			setShapes((prevShapes) =>
				prevShapes.map((shape) => ({
					...shape,
					rotation: shape.rotation + 0.02,
					position: {
						x:
							shape.position.x +
							Math.sin(time * 0.001 + shape.position.y * 0.01) * 0.5,
						y:
							shape.position.y +
							Math.cos(time * 0.001 + shape.position.x * 0.01) * 0.3,
					},
				})),
			);
			animationRef.current = requestAnimationFrame(animate);
		};

		animationRef.current = requestAnimationFrame(animate);
		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [animationEnabled]);

	// Render shapes to canvas
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw grid
		ctx.strokeStyle = "#f1f5f9";
		ctx.lineWidth = 1;
		for (let x = 0; x <= canvas.width; x += 20) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, canvas.height);
			ctx.stroke();
		}
		for (let y = 0; y <= canvas.height; y += 20) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(canvas.width, y);
			ctx.stroke();
		}

		// Draw shapes
		for (const shape of shapes) {
			ctx.save();
			ctx.translate(shape.position.x, shape.position.y);
			ctx.rotate(shape.rotation);
			ctx.fillStyle = shape.color;
			ctx.strokeStyle = shape.color;

			switch (shape.type) {
				case "circle":
					ctx.beginPath();
					ctx.arc(0, 0, shape.size.width / 2, 0, TWO_PI);
					ctx.fill();
					break;

				case "rectangle":
					ctx.fillRect(
						-shape.size.width / 2,
						-shape.size.height / 2,
						shape.size.width,
						shape.size.height,
					);
					break;

				case "triangle": {
					ctx.beginPath();
					const height = shape.size.height;
					const width = shape.size.width;
					ctx.moveTo(0, -height / 2);
					ctx.lineTo(-width / 2, height / 2);
					ctx.lineTo(width / 2, height / 2);
					ctx.closePath();
					ctx.fill();
					break;
				}
			}
			ctx.restore();
		}
	}, [shapes]);

	const addShape = () => {
		const newShape: Shape = {
			type: selectedShapeType,
			position: {
				x: Math.random() * 500 + 50,
				y: Math.random() * 300 + 50,
			},
			size: {
				width: Math.random() * 60 + 40,
				height: Math.random() * 60 + 40,
			},
			color: `hsl(${Math.random() * 360}, 70%, 50%)`,
			rotation: Math.random() * TWO_PI,
		};
		setShapes((prev) => [...prev, newShape]);
	};

	const clearShapes = () => setShapes([]);

	const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const newShape: Shape = {
			type: selectedShapeType,
			position: { x, y },
			size: { width: 50, height: 50 },
			color: `hsl(${Math.random() * 360}, 70%, 50%)`,
			rotation: 0,
		};
		setShapes((prev) => [...prev, newShape]);
	};

	const calculateTotalArea = () => {
		return shapes.reduce((total, shape) => {
			switch (shape.type) {
				case "circle": {
					// Calculate circle area: π * r²
					const radius = shape.size.width / 2;
					return total + PI * radius * radius;
				}
				case "rectangle":
					// Calculate rectangle area: width * height
					return total + shape.size.width * shape.size.height;
				case "triangle":
					// Calculate triangle area: (base * height) / 2
					return total + (shape.size.width * shape.size.height) / 2;
				default:
					return total;
			}
		}, 0);
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">Interactive Shape Canvas</h1>
				<p className="text-gray-600 mb-4">
					Click-to-add geometric shapes with real-time area calculations,
					rotation, and optional floating animations.
				</p>
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<p className="text-blue-800">
						🎨 Click on the canvas to add shapes, or use the controls below
					</p>
				</div>
			</div>

			<div className="grid lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2">
					<div className="bg-white rounded-lg shadow-md p-4 mb-6">
						<h3 className="text-lg font-semibold mb-3 text-gray-800">
							Interactive Canvas
						</h3>
						<canvas
							ref={canvasRef}
							width={600}
							height={400}
							onClick={handleCanvasClick}
							className="border border-gray-300 rounded cursor-crosshair w-full"
						/>
						<div className="mt-2 text-sm text-gray-600">
							Click anywhere on the canvas to add a {selectedShapeType}
						</div>
					</div>
				</div>

				<div className="space-y-6">
					<div className="bg-white rounded-lg shadow-md p-4">
						<h3 className="text-lg font-semibold mb-3 text-gray-800">
							Controls
						</h3>

						<div className="space-y-4">
							<div>
								<label
									htmlFor="shape-type"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									Shape Type
								</label>
								<select
									id="shape-type"
									value={selectedShapeType}
									onChange={(e) =>
										setSelectedShapeType(
											e.target.value as "circle" | "rectangle" | "triangle",
										)
									}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="circle">Circle</option>
									<option value="rectangle">Rectangle</option>
									<option value="triangle">Triangle</option>
								</select>
							</div>

							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="animation"
									checked={animationEnabled}
									onChange={(e) => setAnimationEnabled(e.target.checked)}
									className="rounded focus:ring-2 focus:ring-blue-500"
								/>
								<label
									htmlFor="animation"
									className="text-sm font-medium text-gray-700"
								>
									Enable Animation
								</label>
							</div>

							<div className="flex space-x-2">
								<button
									type="button"
									onClick={addShape}
									className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
								>
									Add Shape
								</button>
								<button
									type="button"
									onClick={clearShapes}
									className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
								>
									Clear All
								</button>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow-md p-4">
						<h3 className="text-lg font-semibold mb-3 text-gray-800">
							Statistics
						</h3>
						<div className="space-y-2">
							<div className="flex justify-between p-2 bg-gray-50 rounded">
								<span>Total Shapes:</span>
								<span className="font-mono">{shapes.length}</span>
							</div>
							<div className="flex justify-between p-2 bg-gray-50 rounded">
								<span>Circles:</span>
								<span className="font-mono">
									{shapes.filter((s) => s.type === "circle").length}
								</span>
							</div>
							<div className="flex justify-between p-2 bg-gray-50 rounded">
								<span>Rectangles:</span>
								<span className="font-mono">
									{shapes.filter((s) => s.type === "rectangle").length}
								</span>
							</div>
							<div className="flex justify-between p-2 bg-gray-50 rounded">
								<span>Triangles:</span>
								<span className="font-mono">
									{shapes.filter((s) => s.type === "triangle").length}
								</span>
							</div>
							<div className="flex justify-between p-2 bg-blue-50 rounded border border-blue-200">
								<span>Total Area:</span>
								<span className="font-mono">
									{calculateTotalArea().toFixed(1)} px²
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="mt-8">
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-yellow-800">
						Key Concepts Demonstrated
					</h3>
					<ul className="text-yellow-700 space-y-1">
						<li>
							• <strong>Canvas Rendering</strong>: HTML5 Canvas API for 2D
							graphics
						</li>
						<li>
							• <strong>Shape Primitives</strong>: Circles, rectangles, and
							triangles
						</li>
						<li>
							• <strong>Transformations</strong>: Translation and rotation using
							transform matrix
						</li>
						<li>
							• <strong>Animation</strong>: RequestAnimationFrame for smooth
							animations
						</li>
						<li>
							• <strong>Interactive Input</strong>: Mouse click handling for
							shape placement
						</li>
						<li>
							• <strong>Mathematical Calculations</strong>: Area calculations
							using play.ts utilities
						</li>
					</ul>
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
