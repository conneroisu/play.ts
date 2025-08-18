import { createFileRoute, Link } from "@tanstack/react-router";
import {
	circle,
	circleArea,
	circleCircumference,
	degrees,
	PI,
	rect,
	rectArea,
	rectPerimeter,
	vec2,
	vec2Add,
	vec2Angle,
	vec2Distance,
	vec2Dot,
	vec2Length,
	vec2Mul,
	vec2Normalize,
	vec2Rotate,
	vec2Sub,
} from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/basic/geometry")({
	component: GeometryShapesExample,
});

interface Point {
	x: number;
	y: number;
}

function GeometryShapesExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
	const [centerPoint] = useState<Point>({ x: 200, y: 200 });
	const [shapes, setShapes] = useState<any>({});

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw grid
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

		// Draw center point
		ctx.fillStyle = "#3b82f6";
		ctx.beginPath();
		ctx.arc(centerPoint.x, centerPoint.y, 6, 0, 2 * PI);
		ctx.fill();

		// Draw mouse position
		ctx.fillStyle = "#ef4444";
		ctx.beginPath();
		ctx.arc(mousePos.x, mousePos.y, 4, 0, 2 * PI);
		ctx.fill();

		// Draw line between points
		ctx.strokeStyle = "#6b7280";
		ctx.lineWidth = 2;
		ctx.setLineDash([5, 5]);
		ctx.beginPath();
		ctx.moveTo(centerPoint.x, centerPoint.y);
		ctx.lineTo(mousePos.x, mousePos.y);
		ctx.stroke();
		ctx.setLineDash([]);

		// Calculate and display vector information
		const centerVec = vec2(centerPoint.x, centerPoint.y);
		const mouseVec = vec2(mousePos.x, mousePos.y);
		const direction = vec2Sub(mouseVec, centerVec);
		const distance = vec2Distance(centerVec, mouseVec);
		const angle = vec2Angle(direction);
		const normalized = vec2Normalize(direction);

		// Draw normalized vector (scaled up for visibility)
		const scaledNormal = vec2Mul(normalized, 50);
		const normalEnd = vec2Add(centerVec, scaledNormal);

		ctx.strokeStyle = "#10b981";
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.moveTo(centerPoint.x, centerPoint.y);
		ctx.lineTo(normalEnd.x, normalEnd.y);
		ctx.stroke();

		// Draw arrowhead for normalized vector
		const arrowSize = 8;
		const arrowAngle = angle + PI;
		ctx.fillStyle = "#10b981";
		ctx.beginPath();
		ctx.moveTo(normalEnd.x, normalEnd.y);
		ctx.lineTo(
			normalEnd.x + arrowSize * Math.cos(arrowAngle + 0.5),
			normalEnd.y + arrowSize * Math.sin(arrowAngle + 0.5),
		);
		ctx.lineTo(
			normalEnd.x + arrowSize * Math.cos(arrowAngle - 0.5),
			normalEnd.y + arrowSize * Math.sin(arrowAngle - 0.5),
		);
		ctx.closePath();
		ctx.fill();

		// Calculate shape properties
		const radius = distance / 4;
		const circleShape = circle(centerPoint.x, centerPoint.y, radius);
		const circleAreaValue = circleArea(circleShape);
		const circleCircumferenceValue = circleCircumference(circleShape);

		const rectWidth = distance / 3;
		const rectHeight = distance / 5;
		const rectangleShape = rect(
			centerPoint.x - rectWidth / 2,
			centerPoint.y - rectHeight / 2,
			rectWidth,
			rectHeight,
		);
		const rectangleAreaValue = rectArea(rectangleShape);
		const rectanglePerimeterValue = rectPerimeter(rectangleShape);

		setShapes({
			circle: {
				radius: radius.toFixed(1),
				area: circleAreaValue.toFixed(1),
				circumference: circleCircumferenceValue.toFixed(1),
			},
			rectangle: {
				width: rectWidth.toFixed(1),
				height: rectHeight.toFixed(1),
				area: rectangleAreaValue.toFixed(1),
				perimeter: rectanglePerimeterValue.toFixed(1),
			},
			vector: {
				length: distance.toFixed(1),
				angle: degrees(angle).toFixed(1),
				normalized: `(${normalized.x.toFixed(2)}, ${normalized.y.toFixed(2)})`,
				direction: `(${direction.x.toFixed(1)}, ${direction.y.toFixed(1)})`,
			},
		});

		// Draw example circle
		if (radius > 5) {
			ctx.strokeStyle = "#8b5cf6";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(centerPoint.x, centerPoint.y, radius, 0, 2 * PI);
			ctx.stroke();
		}

		// Draw example rectangle
		if (rectWidth > 10 && rectHeight > 10) {
			ctx.strokeStyle = "#f59e0b";
			ctx.lineWidth = 2;
			ctx.strokeRect(
				centerPoint.x - rectWidth / 2,
				centerPoint.y - rectHeight / 2,
				rectWidth,
				rectHeight,
			);
		}
	}, [mousePos, centerPoint]);

	const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		setMousePos({
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		});
	};

	const VectorOperationsDemo = () => {
		const [vectorA, setVectorA] = useState({ x: 3, y: 4 });
		const [vectorB, setVectorB] = useState({ x: 1, y: 2 });

		const vA = vec2(vectorA.x, vectorA.y);
		const vB = vec2(vectorB.x, vectorB.y);

		const operations = {
			addition: vec2Add(vA, vB),
			subtraction: vec2Sub(vA, vB),
			dotProduct: vec2Dot(vA, vB),
			lengthA: vec2Length(vA),
			lengthB: vec2Length(vB),
			distance: vec2Distance(vA, vB),
			normalizedA: vec2Normalize(vA),
			normalizedB: vec2Normalize(vB),
		};

		return (
			<div className="bg-white rounded-lg shadow-md p-4">
				<h3 className="text-lg font-semibold mb-4 text-gray-800">
					Vector Operations Calculator
				</h3>

				<div className="grid md:grid-cols-2 gap-4 mb-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Vector A
						</label>
						<div className="flex space-x-2">
							<input
								type="number"
								value={vectorA.x}
								onChange={(e) =>
									setVectorA({
										...vectorA,
										x: Number.parseFloat(e.target.value) || 0,
									})
								}
								className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
								placeholder="x"
							/>
							<input
								type="number"
								value={vectorA.y}
								onChange={(e) =>
									setVectorA({
										...vectorA,
										y: Number.parseFloat(e.target.value) || 0,
									})
								}
								className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
								placeholder="y"
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Vector B
						</label>
						<div className="flex space-x-2">
							<input
								type="number"
								value={vectorB.x}
								onChange={(e) =>
									setVectorB({
										...vectorB,
										x: Number.parseFloat(e.target.value) || 0,
									})
								}
								className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
								placeholder="x"
							/>
							<input
								type="number"
								value={vectorB.y}
								onChange={(e) =>
									setVectorB({
										...vectorB,
										y: Number.parseFloat(e.target.value) || 0,
									})
								}
								className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
								placeholder="y"
							/>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-2 text-sm">
					<div className="p-2 bg-blue-50 rounded">
						<strong>A + B:</strong> ({operations.addition.x.toFixed(2)},{" "}
						{operations.addition.y.toFixed(2)})
					</div>
					<div className="p-2 bg-blue-50 rounded">
						<strong>A - B:</strong> ({operations.subtraction.x.toFixed(2)},{" "}
						{operations.subtraction.y.toFixed(2)})
					</div>
					<div className="p-2 bg-green-50 rounded">
						<strong>A · B:</strong> {operations.dotProduct.toFixed(2)}
					</div>
					<div className="p-2 bg-green-50 rounded">
						<strong>Distance:</strong> {operations.distance.toFixed(2)}
					</div>
					<div className="p-2 bg-purple-50 rounded">
						<strong>|A|:</strong> {operations.lengthA.toFixed(2)}
					</div>
					<div className="p-2 bg-purple-50 rounded">
						<strong>|B|:</strong> {operations.lengthB.toFixed(2)}
					</div>
					<div className="p-2 bg-yellow-50 rounded">
						<strong>norm(A):</strong> ({operations.normalizedA.x.toFixed(2)},{" "}
						{operations.normalizedA.y.toFixed(2)})
					</div>
					<div className="p-2 bg-yellow-50 rounded">
						<strong>norm(B):</strong> ({operations.normalizedB.x.toFixed(2)},{" "}
						{operations.normalizedB.y.toFixed(2)})
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Interactive Vector Mathematics Lab
				</h1>
				<p className="text-gray-600 mb-4">
					Real-time 2D vector operations with mouse-driven visualization and
					geometric property calculations.
				</p>
				<div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
					<p className="text-indigo-800">
						📐 This example showcases geometry capabilities of the play.ts
						library
					</p>
				</div>
			</div>

			<div className="grid lg:grid-cols-2 gap-8">
				<div>
					<div className="bg-white rounded-lg shadow-md p-4 mb-6">
						<h3 className="text-lg font-semibold mb-3 text-gray-800">
							Interactive Vector Visualization
						</h3>
						<canvas
							ref={canvasRef}
							width={400}
							height={400}
							onMouseMove={handleMouseMove}
							className="border border-gray-300 rounded cursor-crosshair"
						/>
						<div className="mt-2 text-sm text-gray-600">
							Move your mouse to see vector calculations in real-time
						</div>
					</div>

					<VectorOperationsDemo />
				</div>

				<div className="space-y-6">
					{shapes.vector && (
						<div className="bg-white rounded-lg shadow-md p-4">
							<h3 className="text-lg font-semibold mb-3 text-gray-800">
								Vector Properties
							</h3>
							<div className="space-y-2">
								<div className="flex justify-between p-2 bg-gray-50 rounded">
									<span>Length:</span>
									<span className="font-mono">{shapes.vector.length} px</span>
								</div>
								<div className="flex justify-between p-2 bg-gray-50 rounded">
									<span>Angle:</span>
									<span className="font-mono">{shapes.vector.angle}°</span>
								</div>
								<div className="flex justify-between p-2 bg-gray-50 rounded">
									<span>Direction:</span>
									<span className="font-mono">{shapes.vector.direction}</span>
								</div>
								<div className="flex justify-between p-2 bg-gray-50 rounded">
									<span>Normalized:</span>
									<span className="font-mono">{shapes.vector.normalized}</span>
								</div>
							</div>
						</div>
					)}

					{shapes.circle && (
						<div className="bg-white rounded-lg shadow-md p-4">
							<h3 className="text-lg font-semibold mb-3 text-purple-600">
								Circle Properties
							</h3>
							<div className="space-y-2">
								<div className="flex justify-between p-2 bg-purple-50 rounded">
									<span>Radius:</span>
									<span className="font-mono">{shapes.circle.radius} px</span>
								</div>
								<div className="flex justify-between p-2 bg-purple-50 rounded">
									<span>Area:</span>
									<span className="font-mono">{shapes.circle.area} px²</span>
								</div>
								<div className="flex justify-between p-2 bg-purple-50 rounded">
									<span>Circumference:</span>
									<span className="font-mono">
										{shapes.circle.circumference} px
									</span>
								</div>
							</div>
						</div>
					)}

					{shapes.rectangle && (
						<div className="bg-white rounded-lg shadow-md p-4">
							<h3 className="text-lg font-semibold mb-3 text-yellow-600">
								Rectangle Properties
							</h3>
							<div className="space-y-2">
								<div className="flex justify-between p-2 bg-yellow-50 rounded">
									<span>Width:</span>
									<span className="font-mono">{shapes.rectangle.width} px</span>
								</div>
								<div className="flex justify-between p-2 bg-yellow-50 rounded">
									<span>Height:</span>
									<span className="font-mono">
										{shapes.rectangle.height} px
									</span>
								</div>
								<div className="flex justify-between p-2 bg-yellow-50 rounded">
									<span>Area:</span>
									<span className="font-mono">{shapes.rectangle.area} px²</span>
								</div>
								<div className="flex justify-between p-2 bg-yellow-50 rounded">
									<span>Perimeter:</span>
									<span className="font-mono">
										{shapes.rectangle.perimeter} px
									</span>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			<div className="mt-8">
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-yellow-800">
						Key Concepts Demonstrated
					</h3>
					<ul className="text-yellow-700 space-y-1">
						<li>
							• <strong>Vector Operations</strong>: Addition, subtraction, dot
							product, normalization
						</li>
						<li>
							• <strong>Distance Calculation</strong>: Euclidean distance
							between points
						</li>
						<li>
							• <strong>Angle Calculation</strong>: Vector direction in degrees
							and radians
						</li>
						<li>
							• <strong>Circle Geometry</strong>: Area and circumference
							calculations
						</li>
						<li>
							• <strong>Rectangle Geometry</strong>: Area and perimeter
							calculations
						</li>
						<li>
							• <strong>Real-time Visualization</strong>: Interactive geometric
							relationships
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6">
				<Link
					to="/examples/basic"
					className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
				>
					← Back to Examples
				</Link>
			</div>
		</div>
	);
}
