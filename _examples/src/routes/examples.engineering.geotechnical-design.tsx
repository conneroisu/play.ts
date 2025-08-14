import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute(
	"/examples/engineering/geotechnical-design",
)({
	component: GeotechnicalDesignExample,
});

interface SoilLayer {
	thickness: number;
	cohesion: number;
	friction: number;
	unitWeight: number;
	name: string;
	color: string;
}

interface Foundation {
	width: number;
	depth: number;
	load: number;
	type: "strip" | "square";
}

function GeotechnicalDesignExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [foundation, setFoundation] = useState<Foundation>({
		width: 2.0,
		depth: 1.5,
		load: 500,
		type: "strip",
	});

	const [soilLayers, setSoilLayers] = useState<SoilLayer[]>([
		{
			thickness: 2.0,
			cohesion: 15,
			friction: 28,
			unitWeight: 18,
			name: "Sand/Silt",
			color: "#D2B48C",
		},
		{
			thickness: 3.0,
			cohesion: 25,
			friction: 22,
			unitWeight: 19,
			name: "Clay",
			color: "#8B4513",
		},
		{
			thickness: 5.0,
			cohesion: 0,
			friction: 35,
			unitWeight: 20,
			name: "Dense Sand",
			color: "#DAA520",
		},
	]);

	const [results, setResults] = useState({
		bearingCapacity: 0,
		safetyFactor: 0,
		settlement: 0,
		status: "unknown" as "safe" | "warning" | "unsafe" | "unknown",
	});

	// Terzaghi bearing capacity factors
	const getBearingFactors = (phi: number) => {
		const phiRad = (phi * Math.PI) / 180;
		const Nq =
			Math.exp(Math.PI * Math.tan(phiRad)) *
			Math.pow(Math.tan(Math.PI / 4 + phiRad / 2), 2);
		const Nc = (Nq - 1) / Math.tan(phiRad);
		const Ny = 2 * (Nq - 1) * Math.tan(phiRad);
		return { Nc, Nq, Ny };
	};

	// Calculate ultimate bearing capacity using Terzaghi equation
	const calculateBearingCapacity = () => {
		const soilAtFoundation = getSoilAtDepth(foundation.depth);
		const { Nc, Nq, Ny } = getBearingFactors(soilAtFoundation.friction);

		// Shape factors for square vs strip footings
		const shapeFactors =
			foundation.type === "square"
				? { sc: 1.3, sq: 1.2, sy: 0.8 }
				: { sc: 1.0, sq: 1.0, sy: 1.0 };

		// Depth factors (simplified)
		const depthFactors = {
			dc: 1 + 0.4 * (foundation.depth / foundation.width),
			dq:
				1 +
				2 *
					Math.tan((soilAtFoundation.friction * Math.PI) / 180) *
					(1 - Math.sin((soilAtFoundation.friction * Math.PI) / 180)) *
					(foundation.depth / foundation.width),
			dy: 1.0,
		};

		// Effective overburden pressure at foundation level
		let overburden = 0;
		let currentDepth = 0;
		for (const layer of soilLayers) {
			if (currentDepth + layer.thickness <= foundation.depth) {
				overburden += layer.thickness * layer.unitWeight;
				currentDepth += layer.thickness;
			} else if (currentDepth < foundation.depth) {
				overburden += (foundation.depth - currentDepth) * layer.unitWeight;
				break;
			}
		}

		// Ultimate bearing capacity (Terzaghi equation)
		const qu =
			soilAtFoundation.cohesion * Nc * shapeFactors.sc * depthFactors.dc +
			overburden * Nq * shapeFactors.sq * depthFactors.dq +
			0.5 *
				soilAtFoundation.unitWeight *
				foundation.width *
				Ny *
				shapeFactors.sy *
				depthFactors.dy;

		return qu;
	};

	// Get soil properties at specific depth
	const getSoilAtDepth = (depth: number) => {
		let currentDepth = 0;
		for (const layer of soilLayers) {
			if (currentDepth + layer.thickness > depth) {
				return layer;
			}
			currentDepth += layer.thickness;
		}
		return soilLayers[soilLayers.length - 1];
	};

	// Calculate settlement using elastic theory (simplified)
	const calculateSettlement = () => {
		const soilAtFoundation = getSoilAtDepth(foundation.depth);
		const appliedPressure =
			foundation.load /
			(foundation.width *
				(foundation.type === "square" ? foundation.width : 1.0));

		// Elastic modulus estimation based on soil type
		const elasticModulus = soilAtFoundation.friction > 30 ? 50000 : 20000; // kPa
		const poissonRatio = 0.3;

		// Immediate settlement (elastic)
		const influenceFactor = foundation.type === "square" ? 1.12 : 2.0;
		const settlement =
			(appliedPressure *
				foundation.width *
				influenceFactor *
				(1 - poissonRatio * poissonRatio)) /
			elasticModulus;

		return settlement * 1000; // Convert to mm
	};

	// Update calculations
	useEffect(() => {
		const qu = calculateBearingCapacity();
		const appliedPressure =
			foundation.load /
			(foundation.width *
				(foundation.type === "square" ? foundation.width : 1.0));
		const safetyFactor = qu / appliedPressure;
		const settlement = calculateSettlement();

		let status: "safe" | "warning" | "unsafe";
		if (safetyFactor >= 3.0 && settlement <= 25) {
			status = "safe";
		} else if (safetyFactor >= 2.0 && settlement <= 50) {
			status = "warning";
		} else {
			status = "unsafe";
		}

		setResults({
			bearingCapacity: qu,
			safetyFactor,
			settlement,
			status,
		});
	}, [foundation, soilLayers]);

	// Draw soil profile and foundation
	const drawProfile = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const scale = 50; // pixels per meter
		const offsetX = 50;
		const offsetY = 50;

		// Draw soil layers
		let currentY = offsetY;
		for (let i = 0; i < soilLayers.length; i++) {
			const layer = soilLayers[i];
			const layerHeight = layer.thickness * scale;

			ctx.fillStyle = layer.color;
			ctx.fillRect(offsetX, currentY, 400, layerHeight);

			// Layer boundary
			ctx.strokeStyle = "#333";
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(offsetX, currentY + layerHeight);
			ctx.lineTo(offsetX + 400, currentY + layerHeight);
			ctx.stroke();

			// Layer label
			ctx.fillStyle = "#000";
			ctx.font = "12px Arial";
			ctx.fillText(
				`${layer.name} (φ=${layer.friction}°, c=${layer.cohesion}kPa)`,
				offsetX + 10,
				currentY + 20,
			);
			ctx.fillText(
				`γ=${layer.unitWeight}kN/m³, t=${layer.thickness}m`,
				offsetX + 10,
				currentY + 35,
			);

			currentY += layerHeight;
		}

		// Draw foundation
		const foundationY = offsetY + foundation.depth * scale;
		const foundationWidth = foundation.width * scale;
		const foundationHeight = 20;

		ctx.fillStyle = "#666";
		ctx.fillRect(
			offsetX + 200 - foundationWidth / 2,
			foundationY - foundationHeight,
			foundationWidth,
			foundationHeight,
		);

		// Foundation outline
		ctx.strokeStyle = "#000";
		ctx.lineWidth = 2;
		ctx.strokeRect(
			offsetX + 200 - foundationWidth / 2,
			foundationY - foundationHeight,
			foundationWidth,
			foundationHeight,
		);

		// Load arrow
		ctx.strokeStyle = "#FF0000";
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.moveTo(offsetX + 200, foundationY - foundationHeight - 50);
		ctx.lineTo(offsetX + 200, foundationY - foundationHeight);
		ctx.stroke();

		// Arrow head
		ctx.beginPath();
		ctx.moveTo(offsetX + 200, foundationY - foundationHeight);
		ctx.lineTo(offsetX + 190, foundationY - foundationHeight - 10);
		ctx.lineTo(offsetX + 210, foundationY - foundationHeight - 10);
		ctx.closePath();
		ctx.fillStyle = "#FF0000";
		ctx.fill();

		// Load label
		ctx.fillStyle = "#FF0000";
		ctx.font = "bold 14px Arial";
		ctx.fillText(
			`${foundation.load} kN`,
			offsetX + 210,
			foundationY - foundationHeight - 25,
		);

		// Dimensions
		ctx.strokeStyle = "#000";
		ctx.lineWidth = 1;
		ctx.setLineDash([5, 5]);

		// Width dimension
		ctx.beginPath();
		ctx.moveTo(offsetX + 200 - foundationWidth / 2, foundationY + 10);
		ctx.lineTo(offsetX + 200 + foundationWidth / 2, foundationY + 10);
		ctx.stroke();

		ctx.fillStyle = "#000";
		ctx.font = "12px Arial";
		ctx.fillText(
			`B = ${foundation.width}m`,
			offsetX + 200 - 30,
			foundationY + 25,
		);

		// Depth dimension
		ctx.beginPath();
		ctx.moveTo(offsetX - 30, offsetY);
		ctx.lineTo(offsetX - 30, foundationY);
		ctx.stroke();

		ctx.fillText(`D = ${foundation.depth}m`, offsetX - 80, foundationY - 10);

		ctx.setLineDash([]);
	};

	useEffect(() => {
		drawProfile();
	}, [foundation, soilLayers]);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-2">
					Geotechnical Foundation Design
				</h1>
				<p className="text-gray-600">
					Calculate bearing capacity, safety factors, and settlement for shallow
					foundations using Terzaghi's bearing capacity theory.
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Soil Profile Visualization */}
				<Card>
					<CardHeader>
						<CardTitle>Soil Profile & Foundation</CardTitle>
						<CardDescription>
							Cross-section showing soil layers and foundation geometry
						</CardDescription>
					</CardHeader>
					<CardContent>
						<canvas
							ref={canvasRef}
							width={500}
							height={600}
							className="border rounded max-w-full"
						/>
					</CardContent>
				</Card>

				{/* Controls and Results */}
				<div className="space-y-6">
					{/* Foundation Parameters */}
					<Card>
						<CardHeader>
							<CardTitle>Foundation Parameters</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<label className="text-sm font-medium">Foundation Type</label>
								<div className="flex space-x-2 mt-1">
									<Button
										variant={
											foundation.type === "strip" ? "default" : "outline"
										}
										size="sm"
										onClick={() =>
											setFoundation({ ...foundation, type: "strip" })
										}
									>
										Strip Footing
									</Button>
									<Button
										variant={
											foundation.type === "square" ? "default" : "outline"
										}
										size="sm"
										onClick={() =>
											setFoundation({ ...foundation, type: "square" })
										}
									>
										Square Footing
									</Button>
								</div>
							</div>

							<div>
								<label className="text-sm font-medium">
									Width (B): {foundation.width} m
								</label>
								<Slider
									value={[foundation.width]}
									onValueChange={([value]) =>
										setFoundation({ ...foundation, width: value })
									}
									min={0.5}
									max={5.0}
									step={0.1}
									className="mt-2"
								/>
							</div>

							<div>
								<label className="text-sm font-medium">
									Depth (D): {foundation.depth} m
								</label>
								<Slider
									value={[foundation.depth]}
									onValueChange={([value]) =>
										setFoundation({ ...foundation, depth: value })
									}
									min={0.5}
									max={4.0}
									step={0.1}
									className="mt-2"
								/>
							</div>

							<div>
								<label className="text-sm font-medium">
									Applied Load: {foundation.load} kN
								</label>
								<Slider
									value={[foundation.load]}
									onValueChange={([value]) =>
										setFoundation({ ...foundation, load: value })
									}
									min={100}
									max={2000}
									step={50}
									className="mt-2"
								/>
							</div>
						</CardContent>
					</Card>

					{/* Results */}
					<Card>
						<CardHeader>
							<CardTitle>Design Results</CardTitle>
							<div className="flex items-center space-x-2">
								<Badge
									variant={
										results.status === "safe"
											? "default"
											: results.status === "warning"
												? "secondary"
												: "destructive"
									}
								>
									{results.status === "safe"
										? "SAFE"
										: results.status === "warning"
											? "CAUTION"
											: "UNSAFE"}
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="text-center p-3 bg-blue-50 rounded">
									<div className="text-2xl font-bold text-blue-600">
										{results.bearingCapacity.toFixed(0)}
									</div>
									<div className="text-sm text-gray-600">
										Ultimate Bearing Capacity (kPa)
									</div>
								</div>

								<div className="text-center p-3 bg-green-50 rounded">
									<div className="text-2xl font-bold text-green-600">
										{results.safetyFactor.toFixed(1)}
									</div>
									<div className="text-sm text-gray-600">Safety Factor</div>
								</div>

								<div className="text-center p-3 bg-orange-50 rounded">
									<div className="text-2xl font-bold text-orange-600">
										{results.settlement.toFixed(1)}
									</div>
									<div className="text-sm text-gray-600">Settlement (mm)</div>
								</div>

								<div className="text-center p-3 bg-purple-50 rounded">
									<div className="text-2xl font-bold text-purple-600">
										{(
											foundation.load /
											(foundation.width *
												(foundation.type === "square" ? foundation.width : 1.0))
										).toFixed(0)}
									</div>
									<div className="text-sm text-gray-600">
										Applied Pressure (kPa)
									</div>
								</div>
							</div>

							<div className="text-sm space-y-2">
								<h4 className="font-semibold">Design Criteria:</h4>
								<div className="grid grid-cols-1 gap-1 text-xs">
									<div
										className={`flex justify-between ${results.safetyFactor >= 3.0 ? "text-green-600" : results.safetyFactor >= 2.0 ? "text-orange-600" : "text-red-600"}`}
									>
										<span>Safety Factor:</span>
										<span>
											{results.safetyFactor >= 3.0
												? "✓ ≥ 3.0"
												: results.safetyFactor >= 2.0
													? "⚠ ≥ 2.0"
													: "✗ < 2.0"}
										</span>
									</div>
									<div
										className={`flex justify-between ${results.settlement <= 25 ? "text-green-600" : results.settlement <= 50 ? "text-orange-600" : "text-red-600"}`}
									>
										<span>Settlement:</span>
										<span>
											{results.settlement <= 25
												? "✓ ≤ 25mm"
												: results.settlement <= 50
													? "⚠ ≤ 50mm"
													: "✗ > 50mm"}
										</span>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Soil Properties */}
					<Card>
						<CardHeader>
							<CardTitle>Soil Properties</CardTitle>
							<CardDescription>Layered soil profile parameters</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{soilLayers.map((layer, index) => (
									<div key={index} className="p-3 border rounded">
										<div className="flex items-center space-x-2 mb-2">
											<div
												className="w-4 h-4 rounded"
												style={{ backgroundColor: layer.color }}
											/>
											<span className="font-medium">{layer.name}</span>
										</div>
										<div className="grid grid-cols-2 gap-2 text-xs">
											<div>φ = {layer.friction}°</div>
											<div>c = {layer.cohesion} kPa</div>
											<div>γ = {layer.unitWeight} kN/m³</div>
											<div>t = {layer.thickness} m</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			<div className="mt-8 p-4 bg-gray-50 rounded-lg">
				<h3 className="font-semibold mb-2">Engineering Applications:</h3>
				<ul className="text-sm space-y-1 list-disc list-inside">
					<li>
						<strong>Foundation Design:</strong> Size foundations for buildings,
						bridges, and industrial structures
					</li>
					<li>
						<strong>Safety Assessment:</strong> Verify bearing capacity and
						settlement limits per building codes
					</li>
					<li>
						<strong>Soil Investigation:</strong> Analyze geotechnical data and
						optimize foundation types
					</li>
					<li>
						<strong>Cost Optimization:</strong> Balance foundation size against
						soil improvement costs
					</li>
					<li>
						<strong>Risk Analysis:</strong> Evaluate foundation performance
						under various load conditions
					</li>
				</ul>
			</div>
		</div>
	);
}
