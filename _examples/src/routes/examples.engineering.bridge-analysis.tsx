import { createFileRoute } from "@tanstack/react-router";
import {
	PI,
	TWO_PI,
	clamp,
	cos,
	hsl,
	hslToRgb,
	lerp,
	sin,
	toCssHsl,
} from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/engineering/bridge-analysis")({
	component: BridgeAnalysisExample,
});

interface BridgeNode {
	id: string;
	x: number;
	y: number;
	isSupport: boolean;
	supportType: "pin" | "roller" | "fixed" | "free";
	displacement: { x: number; y: number };
	reaction: { x: number; y: number };
}

interface BridgeElement {
	id: string;
	node1: string;
	node2: string;
	material: "steel" | "concrete" | "wood" | "composite";
	crossSection: "beam" | "truss" | "cable";
	area: number; // cm²
	momentOfInertia: number; // cm⁴
	elasticModulus: number; // GPa
	stress: number; // MPa
	strain: number;
	force: number; // kN
}

interface Load {
	id: string;
	nodeId?: string;
	elementId?: string;
	type: "point" | "distributed" | "moment";
	magnitude: number; // kN or kN/m
	direction: number; // degrees
	position?: number; // for distributed loads (0-1 along element)
}

interface BridgeParameters {
	span: number; // meters
	height: number; // meters
	bridgeType: "beam" | "truss" | "arch" | "suspension" | "cable_stayed";
	loadCase: "dead" | "live" | "wind" | "seismic" | "combined";
	safetyFactor: number;
	designCode: "AASHTO" | "Eurocode" | "AS5100" | "CSA";
}

interface AnalysisResults {
	maxStress: number;
	maxDeflection: number;
	safetyFactor: number;
	criticalElement: string;
	naturalFrequency: number;
	bucklingLoad: number;
	fatigueCycles: number;
}

function BridgeAnalysisExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const timeRef = useRef<number>(0);

	const [bridge, setBridge] = useState<BridgeParameters>({
		span: 30,
		height: 4,
		bridgeType: "beam",
		loadCase: "combined",
		safetyFactor: 2.5,
		designCode: "AASHTO",
	});

	const [nodes, setNodes] = useState<BridgeNode[]>([
		{
			id: "n1",
			x: 50,
			y: 300,
			isSupport: true,
			supportType: "pin",
			displacement: { x: 0, y: 0 },
			reaction: { x: 0, y: 0 },
		},
		{
			id: "n2",
			x: 250,
			y: 280,
			isSupport: false,
			supportType: "free",
			displacement: { x: 0, y: -2 },
			reaction: { x: 0, y: 0 },
		},
		{
			id: "n3",
			x: 450,
			y: 280,
			isSupport: false,
			supportType: "free",
			displacement: { x: 0, y: -3 },
			reaction: { x: 0, y: 0 },
		},
		{
			id: "n4",
			x: 650,
			y: 300,
			isSupport: true,
			supportType: "roller",
			displacement: { x: 0, y: 0 },
			reaction: { x: 0, y: 0 },
		},
	]);

	const [elements, setElements] = useState<BridgeElement[]>([
		{
			id: "e1",
			node1: "n1",
			node2: "n2",
			material: "steel",
			crossSection: "beam",
			area: 150,
			momentOfInertia: 25000,
			elasticModulus: 200,
			stress: 45,
			strain: 0.000225,
			force: 120,
		},
		{
			id: "e2",
			node1: "n2",
			node2: "n3",
			material: "steel",
			crossSection: "beam",
			area: 150,
			momentOfInertia: 25000,
			elasticModulus: 200,
			stress: 52,
			strain: 0.00026,
			force: 140,
		},
		{
			id: "e3",
			node1: "n3",
			node2: "n4",
			material: "steel",
			crossSection: "beam",
			area: 150,
			momentOfInertia: 25000,
			elasticModulus: 200,
			stress: 38,
			strain: 0.00019,
			force: 110,
		},
	]);

	const [loads, setLoads] = useState<Load[]>([
		{ id: "l1", nodeId: "n2", type: "point", magnitude: 100, direction: 270 },
		{
			id: "l2",
			elementId: "e2",
			type: "distributed",
			magnitude: 25,
			direction: 270,
			position: 0.5,
		},
	]);

	const [analysis, setAnalysis] = useState<AnalysisResults | null>(null);
	const [showDeformation, setShowDeformation] = useState(true);
	const [showStress, setShowStress] = useState(true);
	const [animateLoading, setAnimateLoading] = useState(false);
	const [viewMode, setViewMode] = useState<
		"structure" | "moment" | "shear" | "deflection"
	>("structure");

	// Material properties
	const materials = {
		steel: {
			density: 7850,
			yieldStrength: 250,
			ultimateStrength: 400,
			elasticModulus: 200,
		},
		concrete: {
			density: 2400,
			yieldStrength: 30,
			ultimateStrength: 40,
			elasticModulus: 30,
		},
		wood: {
			density: 600,
			yieldStrength: 40,
			ultimateStrength: 60,
			elasticModulus: 12,
		},
		composite: {
			density: 1600,
			yieldStrength: 300,
			ultimateStrength: 450,
			elasticModulus: 150,
		},
	};

	// Calculate structural analysis
	const performStructuralAnalysis = (): AnalysisResults => {
		// Simplified finite element analysis
		let maxStress = 0;
		let maxDeflection = 0;
		let criticalElement = "";

		elements.forEach((element) => {
			const material = materials[element.material];

			// Calculate stress based on applied loads
			const stress = (element.force * 1000) / element.area; // Convert kN to N, area in cm²
			element.stress = stress / 1000; // Convert back to MPa

			if (Math.abs(element.stress) > Math.abs(maxStress)) {
				maxStress = element.stress;
				criticalElement = element.id;
			}

			// Calculate strain
			element.strain = element.stress / material.elasticModulus;
		});

		// Calculate maximum deflection
		nodes.forEach((node) => {
			const deflection = Math.sqrt(
				node.displacement.x ** 2 + node.displacement.y ** 2,
			);
			if (deflection > maxDeflection) {
				maxDeflection = deflection;
			}
		});

		// Calculate safety factor
		const criticalMaterial =
			elements.find((e) => e.id === criticalElement)?.material || "steel";
		const allowableStress = materials[criticalMaterial].yieldStrength;
		const safetyFactor = Math.abs(allowableStress / maxStress);

		// Estimate natural frequency (simplified)
		const totalMass = elements.reduce(
			(sum, e) => sum + (e.area * materials[e.material].density) / 10000,
			0,
		);
		const stiffness = elements.reduce(
			(sum, e) =>
				sum +
				(materials[e.material].elasticModulus * e.momentOfInertia) / 1000000,
			0,
		);
		const naturalFrequency = Math.sqrt(stiffness / totalMass) / (2 * PI);

		return {
			maxStress,
			maxDeflection,
			safetyFactor,
			criticalElement,
			naturalFrequency,
			bucklingLoad: 1500 + Math.random() * 500, // Simplified
			fatigueCycles: 2000000 * (1 / Math.abs(maxStress)) ** 3, // Simplified Wöhler curve
		};
	};

	// Get stress color
	const getStressColor = (stress: number): string => {
		const maxStress = 300; // MPa
		const normalizedStress = Math.abs(stress) / maxStress;
		const hue = 240 - normalizedStress * 240; // Blue to Red
		return toCssHsl(hsl(hue, 80, 50));
	};

	// Draw bridge structure
	const drawBridge = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;

		ctx.clearRect(0, 0, width, height);

		// Draw ground
		ctx.fillStyle = "#8B4513";
		ctx.fillRect(0, height - 30, width, 30);

		// Draw grid
		ctx.strokeStyle = "rgba(200, 200, 200, 0.3)";
		ctx.lineWidth = 1;
		for (let x = 0; x <= width; x += 50) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, height);
			ctx.stroke();
		}
		for (let y = 0; y <= height; y += 50) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(width, y);
			ctx.stroke();
		}

		// Draw elements
		elements.forEach((element) => {
			const node1 = nodes.find((n) => n.id === element.node1);
			const node2 = nodes.find((n) => n.id === element.node2);
			if (!node1 || !node2) return;

			const deformationScale = showDeformation ? 10 : 0;
			const x1 = node1.x + node1.displacement.x * deformationScale;
			const y1 = node1.y + node1.displacement.y * deformationScale;
			const x2 = node2.x + node2.displacement.x * deformationScale;
			const y2 = node2.y + node2.displacement.y * deformationScale;

			// Element color based on stress
			if (showStress) {
				ctx.strokeStyle = getStressColor(element.stress);
				ctx.lineWidth = 6 + Math.abs(element.stress) / 20;
			} else {
				ctx.strokeStyle =
					element.material === "steel"
						? "#666"
						: element.material === "concrete"
							? "#999"
							: "#8B4513";
				ctx.lineWidth = 8;
			}

			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.stroke();

			// Draw cross-section indicator
			if (element.crossSection === "beam") {
				const midX = (x1 + x2) / 2;
				const midY = (y1 + y2) / 2;
				const angle = Math.atan2(y2 - y1, x2 - x1);
				const perpX = -sin(angle) * 10;
				const perpY = cos(angle) * 10;

				ctx.strokeStyle = ctx.strokeStyle;
				ctx.lineWidth = 3;
				ctx.beginPath();
				ctx.moveTo(midX + perpX, midY + perpY);
				ctx.lineTo(midX - perpX, midY - perpY);
				ctx.stroke();
			}

			// Element labels
			const midX = (x1 + x2) / 2;
			const midY = (y1 + y2) / 2;
			ctx.fillStyle = "black";
			ctx.font = "10px Arial";
			ctx.textAlign = "center";
			ctx.fillText(element.id, midX, midY - 10);
			if (showStress) {
				ctx.fillText(`${element.stress.toFixed(1)} MPa`, midX, midY + 15);
			}
		});

		// Draw nodes
		nodes.forEach((node) => {
			const deformationScale = showDeformation ? 10 : 0;
			const x = node.x + node.displacement.x * deformationScale;
			const y = node.y + node.displacement.y * deformationScale;

			// Node circle
			ctx.fillStyle = node.isSupport ? "#ff6b35" : "#4CAF50";
			ctx.beginPath();
			ctx.arc(x, y, 6, 0, TWO_PI);
			ctx.fill();

			// Support symbols
			if (node.isSupport) {
				ctx.strokeStyle = "#ff6b35";
				ctx.lineWidth = 3;

				if (node.supportType === "pin") {
					// Triangle for pin support
					ctx.beginPath();
					ctx.moveTo(x, y + 6);
					ctx.lineTo(x - 10, y + 20);
					ctx.lineTo(x + 10, y + 20);
					ctx.closePath();
					ctx.stroke();
				} else if (node.supportType === "roller") {
					// Circle for roller support
					ctx.beginPath();
					ctx.arc(x, y + 15, 6, 0, TWO_PI);
					ctx.stroke();
					ctx.beginPath();
					ctx.moveTo(x, y + 6);
					ctx.lineTo(x, y + 9);
					ctx.stroke();
				}
			}

			// Node labels
			ctx.fillStyle = "black";
			ctx.font = "10px Arial";
			ctx.textAlign = "center";
			ctx.fillText(node.id, x, y - 10);
		});

		// Draw loads
		loads.forEach((load) => {
			if (load.nodeId) {
				const node = nodes.find((n) => n.id === load.nodeId);
				if (!node) return;

				const x = node.x;
				const y = node.y;
				const magnitude = load.magnitude / 5; // Scale for display

				// Load arrow
				ctx.strokeStyle = "#FF0000";
				ctx.lineWidth = 3;
				ctx.beginPath();
				ctx.moveTo(x, y - magnitude);
				ctx.lineTo(x, y);
				ctx.stroke();

				// Arrow head
				ctx.beginPath();
				ctx.moveTo(x, y);
				ctx.lineTo(x - 5, y - 10);
				ctx.lineTo(x + 5, y - 10);
				ctx.closePath();
				ctx.fillStyle = "#FF0000";
				ctx.fill();

				// Load label
				ctx.fillStyle = "#FF0000";
				ctx.font = "10px Arial";
				ctx.textAlign = "center";
				ctx.fillText(`${load.magnitude} kN`, x, y - magnitude - 10);
			}
		});

		// Animation effects
		if (animateLoading) {
			const time = timeRef.current * 0.002;
			const pulse = 1 + 0.3 * sin(time * 4);

			loads.forEach((load) => {
				if (load.nodeId) {
					const node = nodes.find((n) => n.id === load.nodeId);
					if (!node) return;

					ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 + 0.3 * sin(time * 6)})`;
					ctx.lineWidth = 2;
					ctx.beginPath();
					ctx.arc(node.x, node.y, 20 * pulse, 0, TWO_PI);
					ctx.stroke();
				}
			});
		}
	};

	const draw = () => {
		drawBridge();

		if (animateLoading) {
			timeRef.current += 16;
		}
	};

	useEffect(() => {
		const animate = () => {
			draw();
			animationRef.current = requestAnimationFrame(animate);
		};
		animationRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [
		nodes,
		elements,
		loads,
		showDeformation,
		showStress,
		animateLoading,
		viewMode,
	]);

	useEffect(() => {
		setAnalysis(performStructuralAnalysis());
	}, [bridge, nodes, elements, loads]);

	// Apply bridge type preset
	const applyBridgeType = (type: BridgeParameters["bridgeType"]) => {
		setBridge((prev) => ({ ...prev, bridgeType: type }));

		// Update structure based on bridge type
		switch (type) {
			case "beam":
				setNodes([
					{
						id: "n1",
						x: 50,
						y: 300,
						isSupport: true,
						supportType: "pin",
						displacement: { x: 0, y: 0 },
						reaction: { x: 0, y: 0 },
					},
					{
						id: "n2",
						x: 250,
						y: 280,
						isSupport: false,
						supportType: "free",
						displacement: { x: 0, y: -2 },
						reaction: { x: 0, y: 0 },
					},
					{
						id: "n3",
						x: 450,
						y: 280,
						isSupport: false,
						supportType: "free",
						displacement: { x: 0, y: -3 },
						reaction: { x: 0, y: 0 },
					},
					{
						id: "n4",
						x: 650,
						y: 300,
						isSupport: true,
						supportType: "roller",
						displacement: { x: 0, y: 0 },
						reaction: { x: 0, y: 0 },
					},
				]);
				break;

			case "truss":
				setNodes([
					{
						id: "n1",
						x: 50,
						y: 300,
						isSupport: true,
						supportType: "pin",
						displacement: { x: 0, y: 0 },
						reaction: { x: 0, y: 0 },
					},
					{
						id: "n2",
						x: 200,
						y: 200,
						isSupport: false,
						supportType: "free",
						displacement: { x: 0, y: -1 },
						reaction: { x: 0, y: 0 },
					},
					{
						id: "n3",
						x: 350,
						y: 180,
						isSupport: false,
						supportType: "free",
						displacement: { x: 0, y: -1.5 },
						reaction: { x: 0, y: 0 },
					},
					{
						id: "n4",
						x: 500,
						y: 200,
						isSupport: false,
						supportType: "free",
						displacement: { x: 0, y: -1 },
						reaction: { x: 0, y: 0 },
					},
					{
						id: "n5",
						x: 650,
						y: 300,
						isSupport: true,
						supportType: "roller",
						displacement: { x: 0, y: 0 },
						reaction: { x: 0, y: 0 },
					},
				]);
				break;

			case "arch":
				setNodes([
					{
						id: "n1",
						x: 50,
						y: 300,
						isSupport: true,
						supportType: "pin",
						displacement: { x: 0, y: 0 },
						reaction: { x: 0, y: 0 },
					},
					{
						id: "n2",
						x: 200,
						y: 220,
						isSupport: false,
						supportType: "free",
						displacement: { x: 0, y: -0.5 },
						reaction: { x: 0, y: 0 },
					},
					{
						id: "n3",
						x: 350,
						y: 180,
						isSupport: false,
						supportType: "free",
						displacement: { x: 0, y: -0.8 },
						reaction: { x: 0, y: 0 },
					},
					{
						id: "n4",
						x: 500,
						y: 220,
						isSupport: false,
						supportType: "free",
						displacement: { x: 0, y: -0.5 },
						reaction: { x: 0, y: 0 },
					},
					{
						id: "n5",
						x: 650,
						y: 300,
						isSupport: true,
						supportType: "pin",
						displacement: { x: 0, y: 0 },
						reaction: { x: 0, y: 0 },
					},
				]);
				break;
		}
	};

	return (
		<div className="w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-orange-50 to-red-50 min-h-screen">
			<div className="bg-white rounded-xl shadow-lg p-6 mb-6">
				<div className="flex items-center gap-3 mb-6">
					<div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
					<h1 className="text-2xl font-bold text-gray-800">
						Bridge Structural Analysis
					</h1>
					<div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
						Civil Engineering Tool
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Visualization */}
					<div className="lg:col-span-2">
						<div className="bg-gray-50 rounded-lg p-4 mb-4">
							<div className="flex gap-2 mb-4">
								<button
									onClick={() => setViewMode("structure")}
									className={`px-3 py-1 rounded text-sm ${viewMode === "structure" ? "bg-orange-500 text-white" : "bg-gray-200"}`}
								>
									Structure
								</button>
								<button
									onClick={() => setShowDeformation(!showDeformation)}
									className={`px-3 py-1 rounded text-sm ${showDeformation ? "bg-blue-500 text-white" : "bg-gray-200"}`}
								>
									Deformation
								</button>
								<button
									onClick={() => setShowStress(!showStress)}
									className={`px-3 py-1 rounded text-sm ${showStress ? "bg-red-500 text-white" : "bg-gray-200"}`}
								>
									Stress
								</button>
								<button
									onClick={() => setAnimateLoading(!animateLoading)}
									className={`px-3 py-1 rounded text-sm ${animateLoading ? "bg-green-500 text-white" : "bg-gray-200"}`}
								>
									Animate
								</button>
							</div>

							<canvas
								ref={canvasRef}
								width={700}
								height={400}
								className="border border-gray-300 rounded-lg bg-white w-full cursor-crosshair"
							/>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
							<div className="bg-red-50 rounded-lg p-4 text-center">
								<div className="text-2xl font-bold text-red-600">
									{analysis?.maxStress.toFixed(1)} MPa
								</div>
								<div className="text-sm text-gray-600">Max Stress</div>
							</div>

							<div className="bg-blue-50 rounded-lg p-4 text-center">
								<div className="text-2xl font-bold text-blue-600">
									{analysis?.maxDeflection.toFixed(1)} mm
								</div>
								<div className="text-sm text-gray-600">Max Deflection</div>
							</div>

							<div className="bg-green-50 rounded-lg p-4 text-center">
								<div className="text-2xl font-bold text-green-600">
									{analysis?.safetyFactor.toFixed(1)}
								</div>
								<div className="text-sm text-gray-600">Safety Factor</div>
							</div>

							<div className="bg-purple-50 rounded-lg p-4 text-center">
								<div className="text-2xl font-bold text-purple-600">
									{analysis?.naturalFrequency.toFixed(1)} Hz
								</div>
								<div className="text-sm text-gray-600">Natural Freq.</div>
							</div>
						</div>
					</div>

					{/* Controls */}
					<div className="space-y-4">
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Bridge Configuration
							</h3>

							<div className="space-y-3">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Bridge Type
									</label>
									<select
										value={bridge.bridgeType}
										onChange={(e) =>
											applyBridgeType(
												e.target.value as BridgeParameters["bridgeType"],
											)
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
									>
										<option value="beam">Simply Supported Beam</option>
										<option value="truss">Truss Bridge</option>
										<option value="arch">Arch Bridge</option>
										<option value="suspension">Suspension Bridge</option>
										<option value="cable_stayed">Cable-Stayed Bridge</option>
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Span: {bridge.span} m
									</label>
									<input
										type="range"
										min="10"
										max="100"
										step="5"
										value={bridge.span}
										onChange={(e) =>
											setBridge((prev) => ({
												...prev,
												span: Number.parseInt(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Load Case
									</label>
									<select
										value={bridge.loadCase}
										onChange={(e) =>
											setBridge((prev) => ({
												...prev,
												loadCase: e.target
													.value as BridgeParameters["loadCase"],
											}))
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
									>
										<option value="dead">Dead Load Only</option>
										<option value="live">Live Load Only</option>
										<option value="wind">Wind Load</option>
										<option value="seismic">Seismic Load</option>
										<option value="combined">Combined Loading</option>
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Design Code
									</label>
									<select
										value={bridge.designCode}
										onChange={(e) =>
											setBridge((prev) => ({
												...prev,
												designCode: e.target
													.value as BridgeParameters["designCode"],
											}))
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
									>
										<option value="AASHTO">AASHTO LRFD</option>
										<option value="Eurocode">Eurocode 3 & 4</option>
										<option value="AS5100">AS 5100 (Australia)</option>
										<option value="CSA">CSA S6 (Canada)</option>
									</select>
								</div>
							</div>
						</div>

						{analysis && (
							<div className="bg-gray-50 rounded-lg p-4">
								<h3 className="text-lg font-semibold text-gray-800 mb-3">
									Analysis Results
								</h3>

								<div className="space-y-3 text-sm">
									<div className="flex justify-between">
										<span>Critical Element:</span>
										<span className="font-mono text-red-600">
											{analysis.criticalElement}
										</span>
									</div>

									<div className="flex justify-between">
										<span>Buckling Load:</span>
										<span className="font-mono">
											{analysis.bucklingLoad.toFixed(0)} kN
										</span>
									</div>

									<div className="flex justify-between">
										<span>Fatigue Cycles:</span>
										<span className="font-mono">
											{(analysis.fatigueCycles / 1000000).toFixed(1)}M
										</span>
									</div>

									<div className="flex justify-between">
										<span>Design Code:</span>
										<span className="font-mono">{bridge.designCode}</span>
									</div>

									<div
										className={`flex justify-between ${analysis.safetyFactor >= 2.0 ? "text-green-600" : "text-red-600"}`}
									>
										<span>Status:</span>
										<span className="font-mono font-bold">
											{analysis.safetyFactor >= 2.0
												? "SAFE"
												: "REVIEW REQUIRED"}
										</span>
									</div>
								</div>
							</div>
						)}

						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Material Properties
							</h3>

							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span>Steel (Grade 50):</span>
									<span>250 MPa</span>
								</div>
								<div className="flex justify-between">
									<span>Concrete (C40):</span>
									<span>30 MPa</span>
								</div>
								<div className="flex justify-between">
									<span>E-Modulus:</span>
									<span>200 GPa</span>
								</div>
								<div className="flex justify-between">
									<span>Safety Factor:</span>
									<span>{bridge.safetyFactor}</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-6 bg-orange-50 rounded-lg p-4">
					<h3 className="text-lg font-semibold text-orange-800 mb-2">
						Civil Engineering Applications
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-orange-700">
						<div>
							<strong>Design & Analysis:</strong>
							<ul className="mt-1 space-y-1">
								<li>• Structural design verification</li>
								<li>• Load path optimization</li>
								<li>• Dynamic response analysis</li>
								<li>• Fatigue life assessment</li>
							</ul>
						</div>
						<div>
							<strong>Safety & Compliance:</strong>
							<ul className="mt-1 space-y-1">
								<li>• Code compliance checking</li>
								<li>• Safety factor validation</li>
								<li>• Risk assessment</li>
								<li>• Maintenance planning</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
