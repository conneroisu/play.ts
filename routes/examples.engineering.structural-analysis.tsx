import { createFileRoute, Link } from "@tanstack/react-router";
import {
	clamp,
	cos,
	hsl,
	hslToRgb,
	lerp,
	PI,
	sin,
	TWO_PI,
	toCssHsl,
} from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute(
	"/examples/engineering/structural-analysis",
)({
	component: StructuralAnalysisExample,
});

interface Load {
	type: "point" | "distributed" | "moment";
	position: number; // Position along beam (0-1)
	magnitude: number; // Force magnitude (kN) or moment (kN·m)
	direction: "up" | "down"; // For forces
	id: string;
}

interface Support {
	type: "fixed" | "pinned" | "roller";
	position: number; // Position along beam (0-1)
	id: string;
}

interface BeamProperties {
	length: number; // meters
	elasticModulus: number; // GPa
	momentOfInertia: number; // m^4
	crossSectionalArea: number; // m^2
	density: number; // kg/m^3
	yieldStrength: number; // MPa
}

interface AnalysisResults {
	reactions: { position: number; force: number; moment: number }[];
	shearDiagram: { x: number; value: number }[];
	momentDiagram: { x: number; value: number }[];
	deflection: { x: number; value: number }[];
	stress: { x: number; value: number }[];
	maxDeflection: number;
	maxMoment: number;
	maxStress: number;
	safetyFactor: number;
}

function StructuralAnalysisExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const [beamProps, setBeamProps] = useState<BeamProperties>({
		length: 6, // 6 meters
		elasticModulus: 200, // 200 GPa (steel)
		momentOfInertia: 0.0001, // 0.0001 m^4
		crossSectionalArea: 0.01, // 0.01 m^2
		density: 7850, // kg/m^3 (steel)
		yieldStrength: 250, // 250 MPa
	});

	const [loads, setLoads] = useState<Load[]>([
		{
			type: "point",
			position: 0.25,
			magnitude: 10,
			direction: "down",
			id: "load1",
		},
		{
			type: "point",
			position: 0.75,
			magnitude: 15,
			direction: "down",
			id: "load2",
		},
	]);

	const [supports, setSupports] = useState<Support[]>([
		{ type: "pinned", position: 0, id: "support1" },
		{ type: "roller", position: 1, id: "support2" },
	]);

	const [displaySettings, setDisplaySettings] = useState({
		showShear: true,
		showMoment: true,
		showDeflection: true,
		showStress: false,
		scaleFactor: 1000,
		animateDeflection: false,
		showGrid: true,
		showValues: true,
	});

	const [materialType, setMaterialType] = useState<
		"steel" | "concrete" | "timber" | "aluminum" | "custom"
	>("steel");
	const [beamType, setBeamType] = useState<
		"simply_supported" | "cantilever" | "continuous" | "custom"
	>("simply_supported");
	const [analysisResults, setAnalysisResults] =
		useState<AnalysisResults | null>(null);

	const applyMaterialPreset = (material: string) => {
		switch (material) {
			case "steel":
				setBeamProps((prev) => ({
					...prev,
					elasticModulus: 200,
					density: 7850,
					yieldStrength: 250,
				}));
				break;
			case "concrete":
				setBeamProps((prev) => ({
					...prev,
					elasticModulus: 25,
					density: 2400,
					yieldStrength: 30,
				}));
				break;
			case "timber":
				setBeamProps((prev) => ({
					...prev,
					elasticModulus: 12,
					density: 600,
					yieldStrength: 40,
				}));
				break;
			case "aluminum":
				setBeamProps((prev) => ({
					...prev,
					elasticModulus: 70,
					density: 2700,
					yieldStrength: 276,
				}));
				break;
		}
	};

	const applyBeamTypePreset = (type: string) => {
		switch (type) {
			case "simply_supported":
				setSupports([
					{ type: "pinned", position: 0, id: "support1" },
					{ type: "roller", position: 1, id: "support2" },
				]);
				setLoads([
					{
						type: "point",
						position: 0.5,
						magnitude: 20,
						direction: "down",
						id: "load1",
					},
				]);
				break;
			case "cantilever":
				setSupports([{ type: "fixed", position: 0, id: "support1" }]);
				setLoads([
					{
						type: "point",
						position: 1,
						magnitude: 15,
						direction: "down",
						id: "load1",
					},
				]);
				break;
			case "continuous":
				setSupports([
					{ type: "pinned", position: 0, id: "support1" },
					{ type: "pinned", position: 0.5, id: "support2" },
					{ type: "roller", position: 1, id: "support3" },
				]);
				setLoads([
					{
						type: "point",
						position: 0.25,
						magnitude: 12,
						direction: "down",
						id: "load1",
					},
					{
						type: "point",
						position: 0.75,
						magnitude: 18,
						direction: "down",
						id: "load2",
					},
				]);
				break;
		}
	};

	// Simplified structural analysis calculations
	const performAnalysis = (): AnalysisResults => {
		const numPoints = 100;
		const dx = beamProps.length / (numPoints - 1);

		// Calculate reactions (simplified for statically determinate beams)
		let totalLoad = 0;
		let totalMoment = 0;

		loads.forEach((load) => {
			if (load.type === "point") {
				const force =
					load.direction === "down" ? -load.magnitude : load.magnitude;
				totalLoad += force;
				totalMoment += force * (load.position * beamProps.length);
			}
		});

		// For simply supported beam
		const reactions: { position: number; force: number; moment: number }[] = [];
		if (supports.length >= 2) {
			const L = beamProps.length;
			const support1Pos = supports[0].position * L;
			const support2Pos = supports[1].position * L;
			const Ldist = support2Pos - support1Pos;

			// Calculate reaction forces
			let R1 = 0,
				R2 = 0;

			loads.forEach((load) => {
				if (load.type === "point") {
					const force =
						load.direction === "down" ? load.magnitude : -load.magnitude;
					const a = load.position * L - support1Pos;
					const b = support2Pos - load.position * L;

					if (a >= 0 && b >= 0) {
						// Load is between supports
						R1 += (force * b) / Ldist;
						R2 += (force * a) / Ldist;
					}
				}
			});

			reactions.push(
				{ position: supports[0].position, force: R1, moment: 0 },
				{ position: supports[1].position, force: R2, moment: 0 },
			);
		}

		// Calculate shear force diagram
		const shearDiagram: { x: number; value: number }[] = [];
		for (let i = 0; i < numPoints; i++) {
			const x = i * dx;
			let shear = 0;

			// Add reaction forces to the left
			reactions.forEach((reaction) => {
				if (reaction.position * beamProps.length <= x) {
					shear += reaction.force;
				}
			});

			// Subtract loads to the left
			loads.forEach((load) => {
				if (load.type === "point" && load.position * beamProps.length <= x) {
					shear -= load.direction === "down" ? load.magnitude : -load.magnitude;
				}
			});

			shearDiagram.push({ x, value: shear });
		}

		// Calculate bending moment diagram
		const momentDiagram: { x: number; value: number }[] = [];
		for (let i = 0; i < numPoints; i++) {
			const x = i * dx;
			let moment = 0;

			// Add moments from reaction forces
			reactions.forEach((reaction) => {
				const reactionPos = reaction.position * beamProps.length;
				if (reactionPos <= x) {
					moment += reaction.force * (x - reactionPos);
				}
			});

			// Subtract moments from loads
			loads.forEach((load) => {
				if (load.type === "point") {
					const loadPos = load.position * beamProps.length;
					if (loadPos <= x) {
						const force =
							load.direction === "down" ? load.magnitude : -load.magnitude;
						moment -= force * (x - loadPos);
					}
				}
			});

			momentDiagram.push({ x, value: moment });
		}

		// Calculate deflection using simplified beam theory
		const EI = beamProps.elasticModulus * 1e9 * beamProps.momentOfInertia; // N·m²
		const deflection: { x: number; value: number }[] = [];

		for (let i = 0; i < numPoints; i++) {
			const x = i * dx;
			let deflectionValue = 0;

			// Simplified deflection calculation for point loads
			loads.forEach((load) => {
				if (load.type === "point") {
					const P = load.magnitude * 1000; // Convert kN to N
					const a = load.position * beamProps.length;
					const L = beamProps.length;

					if (beamType === "simply_supported") {
						if (x <= a) {
							deflectionValue +=
								(P * (L - a) * x * (L * L - (L - a) * (L - a) - x * x)) /
								(6 * EI * L);
						} else {
							deflectionValue +=
								(P * a * (L - x) * (2 * L * x - x * x - a * a)) / (6 * EI * L);
						}
					} else if (beamType === "cantilever") {
						if (x <= a) {
							deflectionValue += (P * x * x * (3 * a - x)) / (6 * EI);
						} else {
							deflectionValue += (P * a * a * (3 * x - a)) / (6 * EI);
						}
					}
				}
			});

			deflection.push({ x, value: deflectionValue * 1000 }); // Convert to mm
		}

		// Calculate stress
		const stress: { x: number; value: number }[] = [];
		const yMax = Math.sqrt(
			beamProps.momentOfInertia / beamProps.crossSectionalArea,
		); // Rough approximation

		momentDiagram.forEach((point, i) => {
			const stressValue =
				Math.abs((point.value * 1000 * yMax) / beamProps.momentOfInertia) / 1e6; // Convert to MPa
			stress.push({ x: point.x, value: stressValue });
		});

		// Calculate maximums and safety factor
		const maxDeflection = Math.max(...deflection.map((p) => Math.abs(p.value)));
		const maxMoment = Math.max(...momentDiagram.map((p) => Math.abs(p.value)));
		const maxStress = Math.max(...stress.map((p) => p.value));
		const safetyFactor =
			maxStress > 0
				? beamProps.yieldStrength / maxStress
				: Number.POSITIVE_INFINITY;

		return {
			reactions,
			shearDiagram,
			momentDiagram,
			deflection,
			stress,
			maxDeflection,
			maxMoment,
			maxStress,
			safetyFactor,
		};
	};

	const render = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx || !analysisResults) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Canvas dimensions and scales
		const margin = 60;
		const beamY = margin + 50;
		const beamHeight = 20;
		const beamWidth = canvas.width - 2 * margin;
		const diagramHeight = 120;
		const spacing = 20;

		// Draw beam
		ctx.fillStyle = "#94a3b8";
		ctx.fillRect(margin, beamY, beamWidth, beamHeight);

		// Draw beam outline
		ctx.strokeStyle = "#475569";
		ctx.lineWidth = 2;
		ctx.strokeRect(margin, beamY, beamWidth, beamHeight);

		// Draw supports
		supports.forEach((support) => {
			const x = margin + support.position * beamWidth;
			const y = beamY + beamHeight;

			ctx.fillStyle = "#1e293b";
			ctx.strokeStyle = "#1e293b";
			ctx.lineWidth = 2;

			switch (support.type) {
				case "pinned":
					// Draw triangle
					ctx.beginPath();
					ctx.moveTo(x, y);
					ctx.lineTo(x - 15, y + 20);
					ctx.lineTo(x + 15, y + 20);
					ctx.closePath();
					ctx.fill();
					ctx.stroke();
					break;
				case "roller":
					// Draw triangle with circles
					ctx.beginPath();
					ctx.moveTo(x, y);
					ctx.lineTo(x - 15, y + 15);
					ctx.lineTo(x + 15, y + 15);
					ctx.closePath();
					ctx.fill();
					ctx.stroke();

					// Draw rollers
					ctx.beginPath();
					ctx.arc(x - 8, y + 20, 3, 0, TWO_PI);
					ctx.arc(x + 8, y + 20, 3, 0, TWO_PI);
					ctx.fill();
					break;
				case "fixed":
					// Draw rectangle
					ctx.fillRect(x - 10, y, 20, 20);
					ctx.strokeRect(x - 10, y, 20, 20);

					// Draw hatching
					ctx.beginPath();
					for (let i = 0; i < 5; i++) {
						ctx.moveTo(x - 10 + i * 4, y + 20);
						ctx.lineTo(x - 10 + i * 4 + 3, y + 25);
					}
					ctx.stroke();
					break;
			}
		});

		// Draw loads
		loads.forEach((load) => {
			const x = margin + load.position * beamWidth;
			const y = load.direction === "down" ? beamY : beamY + beamHeight;

			ctx.strokeStyle = "#dc2626";
			ctx.fillStyle = "#dc2626";
			ctx.lineWidth = 3;

			if (load.type === "point") {
				// Draw arrow
				const arrowLength = 30;
				const arrowY =
					load.direction === "down" ? y - arrowLength : y + arrowLength;

				ctx.beginPath();
				ctx.moveTo(x, arrowY);
				ctx.lineTo(x, y);
				ctx.stroke();

				// Arrow head
				ctx.beginPath();
				if (load.direction === "down") {
					ctx.moveTo(x, y);
					ctx.lineTo(x - 5, y - 8);
					ctx.lineTo(x + 5, y - 8);
				} else {
					ctx.moveTo(x, y);
					ctx.lineTo(x - 5, y + 8);
					ctx.lineTo(x + 5, y + 8);
				}
				ctx.closePath();
				ctx.fill();

				// Load value
				ctx.fillStyle = "#1e293b";
				ctx.font = "12px Arial";
				ctx.textAlign = "center";
				ctx.fillText(`${load.magnitude} kN`, x, arrowY - 10);
			}
		});

		// Draw diagrams
		let currentY = beamY + beamHeight + 80;

		if (displaySettings.showShear) {
			drawDiagram(
				ctx,
				analysisResults.shearDiagram,
				currentY,
				diagramHeight,
				"Shear Force (kN)",
				"#0ea5e9",
				margin,
				beamWidth,
			);
			currentY += diagramHeight + spacing;
		}

		if (displaySettings.showMoment) {
			drawDiagram(
				ctx,
				analysisResults.momentDiagram,
				currentY,
				diagramHeight,
				"Bending Moment (kN·m)",
				"#8b5cf6",
				margin,
				beamWidth,
			);
			currentY += diagramHeight + spacing;
		}

		if (displaySettings.showDeflection) {
			drawDiagram(
				ctx,
				analysisResults.deflection,
				currentY,
				diagramHeight,
				"Deflection (mm)",
				"#10b981",
				margin,
				beamWidth,
				displaySettings.scaleFactor,
			);
			currentY += diagramHeight + spacing;
		}

		if (displaySettings.showStress) {
			drawDiagram(
				ctx,
				analysisResults.stress,
				currentY,
				diagramHeight,
				"Stress (MPa)",
				"#f59e0b",
				margin,
				beamWidth,
			);
			currentY += diagramHeight + spacing;
		}

		// Draw length dimension
		ctx.strokeStyle = "#64748b";
		ctx.fillStyle = "#64748b";
		ctx.lineWidth = 1;
		ctx.font = "12px Arial";
		ctx.textAlign = "center";

		const dimY = beamY + beamHeight + 50;
		ctx.beginPath();
		ctx.moveTo(margin, dimY);
		ctx.lineTo(margin + beamWidth, dimY);
		ctx.stroke();

		// Dimension arrows
		ctx.beginPath();
		ctx.moveTo(margin, dimY);
		ctx.lineTo(margin + 5, dimY - 3);
		ctx.lineTo(margin + 5, dimY + 3);
		ctx.closePath();
		ctx.fill();

		ctx.beginPath();
		ctx.moveTo(margin + beamWidth, dimY);
		ctx.lineTo(margin + beamWidth - 5, dimY - 3);
		ctx.lineTo(margin + beamWidth - 5, dimY + 3);
		ctx.closePath();
		ctx.fill();

		ctx.fillText(`${beamProps.length} m`, margin + beamWidth / 2, dimY + 15);
	};

	const drawDiagram = (
		ctx: CanvasRenderingContext2D,
		data: { x: number; value: number }[],
		y: number,
		height: number,
		title: string,
		color: string,
		margin: number,
		width: number,
		scale = 1,
	) => {
		if (data.length === 0) return;

		const maxValue = Math.max(...data.map((p) => Math.abs(p.value)));
		const yScale = maxValue > 0 ? height / 2 / (maxValue * scale) : 1;
		const centerY = y + height / 2;

		// Draw background
		ctx.fillStyle = "#f8fafc";
		ctx.fillRect(margin, y, width, height);
		ctx.strokeStyle = "#e2e8f0";
		ctx.lineWidth = 1;
		ctx.strokeRect(margin, y, width, height);

		// Draw center line
		ctx.strokeStyle = "#64748b";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(margin, centerY);
		ctx.lineTo(margin + width, centerY);
		ctx.stroke();

		// Draw grid lines
		if (displaySettings.showGrid && maxValue > 0) {
			ctx.strokeStyle = "#f1f5f9";
			ctx.lineWidth = 1;

			for (let i = 1; i <= 4; i++) {
				const gridValue = (maxValue * scale * i) / 4;
				const gridY1 = centerY - gridValue * yScale;
				const gridY2 = centerY + gridValue * yScale;

				ctx.beginPath();
				ctx.moveTo(margin, gridY1);
				ctx.lineTo(margin + width, gridY1);
				ctx.moveTo(margin, gridY2);
				ctx.lineTo(margin + width, gridY2);
				ctx.stroke();
			}
		}

		// Draw diagram
		ctx.strokeStyle = color;
		ctx.fillStyle = color + "40";
		ctx.lineWidth = 2;

		ctx.beginPath();
		ctx.moveTo(margin, centerY);

		data.forEach((point, i) => {
			const x = margin + (point.x / beamProps.length) * width;
			const plotY = centerY - point.value * scale * yScale;

			if (i === 0) {
				ctx.moveTo(x, plotY);
			} else {
				ctx.lineTo(x, plotY);
			}
		});

		ctx.lineTo(margin + width, centerY);
		ctx.closePath();
		ctx.fill();

		// Draw outline
		ctx.beginPath();
		data.forEach((point, i) => {
			const x = margin + (point.x / beamProps.length) * width;
			const plotY = centerY - point.value * scale * yScale;

			if (i === 0) {
				ctx.moveTo(x, plotY);
			} else {
				ctx.lineTo(x, plotY);
			}
		});
		ctx.stroke();

		// Draw title
		ctx.fillStyle = "#1e293b";
		ctx.font = "14px Arial";
		ctx.textAlign = "left";
		ctx.fillText(title, margin, y - 5);

		// Draw max value
		if (displaySettings.showValues && maxValue > 0) {
			ctx.fillStyle = "#64748b";
			ctx.font = "12px Arial";
			ctx.textAlign = "right";
			ctx.fillText(
				`Max: ${(maxValue * scale).toFixed(2)}`,
				margin + width - 5,
				y + 15,
			);
		}
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.width = 900;
		canvas.height = 800;

		const results = performAnalysis();
		setAnalysisResults(results);
	}, [beamProps, loads, supports, beamType]);

	useEffect(() => {
		if (materialType !== "custom") {
			applyMaterialPreset(materialType);
		}
	}, [materialType]);

	useEffect(() => {
		if (beamType !== "custom") {
			applyBeamTypePreset(beamType);
		}
	}, [beamType]);

	useEffect(() => {
		render();
	}, [analysisResults, displaySettings]);

	const addLoad = () => {
		const newLoad: Load = {
			type: "point",
			position: 0.5,
			magnitude: 10,
			direction: "down",
			id: `load${Date.now()}`,
		};
		setLoads((prev) => [...prev, newLoad]);
	};

	const removeLoad = (id: string) => {
		setLoads((prev) => prev.filter((load) => load.id !== id));
	};

	const addSupport = () => {
		const newSupport: Support = {
			type: "roller",
			position: 0.5,
			id: `support${Date.now()}`,
		};
		setSupports((prev) => [...prev, newSupport]);
	};

	const removeSupport = (id: string) => {
		setSupports((prev) => prev.filter((support) => support.id !== id));
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Structural Analysis Calculator
				</h1>
				<p className="text-gray-600 mb-4">
					beam analysis tool with shear force, bending moment, deflection
					calculations, and safety factor assessment.
				</p>
				<div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
					<p className="text-slate-800">
						🏗️ Interactive structural engineering - analyze beams, calculate
						stress, and verify safety factors
					</p>
				</div>
			</div>

			<div className="mb-6">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Beam Type
						</label>
						<select
							value={beamType}
							onChange={(e) => setBeamType(e.target.value as typeof beamType)}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
						>
							<option value="simply_supported">Simply Supported</option>
							<option value="cantilever">Cantilever</option>
							<option value="continuous">Continuous</option>
							<option value="custom">Custom</option>
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Material
						</label>
						<select
							value={materialType}
							onChange={(e) =>
								setMaterialType(e.target.value as typeof materialType)
							}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
						>
							<option value="steel">Steel</option>
							<option value="concrete">Concrete</option>
							<option value="timber">Timber</option>
							<option value="aluminum">Aluminum</option>
							<option value="custom">Custom</option>
						</select>
					</div>
					<div className="space-y-2">
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={displaySettings.showShear}
								onChange={(e) =>
									setDisplaySettings((prev) => ({
										...prev,
										showShear: e.target.checked,
									}))
								}
								className="mr-2"
							/>
							<span className="text-sm font-medium text-gray-700">
								Shear Diagram
							</span>
						</label>
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={displaySettings.showMoment}
								onChange={(e) =>
									setDisplaySettings((prev) => ({
										...prev,
										showMoment: e.target.checked,
									}))
								}
								className="mr-2"
							/>
							<span className="text-sm font-medium text-gray-700">
								Moment Diagram
							</span>
						</label>
					</div>
					<div className="space-y-2">
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={displaySettings.showDeflection}
								onChange={(e) =>
									setDisplaySettings((prev) => ({
										...prev,
										showDeflection: e.target.checked,
									}))
								}
								className="mr-2"
							/>
							<span className="text-sm font-medium text-gray-700">
								Deflection
							</span>
						</label>
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={displaySettings.showStress}
								onChange={(e) =>
									setDisplaySettings((prev) => ({
										...prev,
										showStress: e.target.checked,
									}))
								}
								className="mr-2"
							/>
							<span className="text-sm font-medium text-gray-700">Stress</span>
						</label>
					</div>
				</div>

				{/* Beam Properties */}
				<div className="mb-6">
					<h3 className="text-lg font-semibold mb-3">Beam Properties</h3>
					<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Length: {beamProps.length} m
							</label>
							<input
								type="range"
								min="1"
								max="20"
								step="0.5"
								value={beamProps.length}
								onChange={(e) =>
									setBeamProps((prev) => ({
										...prev,
										length: Number(e.target.value),
									}))
								}
								className="w-full"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								E: {beamProps.elasticModulus} GPa
							</label>
							<input
								type="range"
								min="5"
								max="400"
								step="5"
								value={beamProps.elasticModulus}
								onChange={(e) =>
									setBeamProps((prev) => ({
										...prev,
										elasticModulus: Number(e.target.value),
									}))
								}
								className="w-full"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								I: {(beamProps.momentOfInertia * 1000).toFixed(1)} × 10⁻³ m⁴
							</label>
							<input
								type="range"
								min="0.01"
								max="1"
								step="0.01"
								value={beamProps.momentOfInertia * 1000}
								onChange={(e) =>
									setBeamProps((prev) => ({
										...prev,
										momentOfInertia: Number(e.target.value) / 1000,
									}))
								}
								className="w-full"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Area: {(beamProps.crossSectionalArea * 1000).toFixed(1)} × 10⁻³
								m²
							</label>
							<input
								type="range"
								min="1"
								max="100"
								step="1"
								value={beamProps.crossSectionalArea * 1000}
								onChange={(e) =>
									setBeamProps((prev) => ({
										...prev,
										crossSectionalArea: Number(e.target.value) / 1000,
									}))
								}
								className="w-full"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Yield Strength: {beamProps.yieldStrength} MPa
							</label>
							<input
								type="range"
								min="20"
								max="500"
								step="10"
								value={beamProps.yieldStrength}
								onChange={(e) =>
									setBeamProps((prev) => ({
										...prev,
										yieldStrength: Number(e.target.value),
									}))
								}
								className="w-full"
							/>
						</div>
					</div>
				</div>

				{/* Loads */}
				<div className="mb-6">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-lg font-semibold">Applied Loads</h3>
						<button
							type="button"
							onClick={addLoad}
							className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
						>
							Add Load
						</button>
					</div>
					<div className="space-y-3">
						{loads.map((load, index) => (
							<div key={load.id} className="bg-gray-50 rounded-lg p-4">
								<div className="flex items-center justify-between mb-3">
									<span className="font-medium">Load {index + 1}</span>
									<button
										type="button"
										onClick={() => removeLoad(load.id)}
										className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
									>
										Remove
									</button>
								</div>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Type
										</label>
										<select
											value={load.type}
											onChange={(e) => {
												const newLoads = [...loads];
												newLoads[index].type = e.target
													.value as typeof load.type;
												setLoads(newLoads);
											}}
											className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
										>
											<option value="point">Point Load</option>
											<option value="distributed">Distributed</option>
											<option value="moment">Moment</option>
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Position: {(load.position * 100).toFixed(0)}%
										</label>
										<input
											type="range"
											min="0"
											max="1"
											step="0.01"
											value={load.position}
											onChange={(e) => {
												const newLoads = [...loads];
												newLoads[index].position = Number(e.target.value);
												setLoads(newLoads);
											}}
											className="w-full"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Magnitude: {load.magnitude} kN
										</label>
										<input
											type="range"
											min="1"
											max="50"
											step="1"
											value={load.magnitude}
											onChange={(e) => {
												const newLoads = [...loads];
												newLoads[index].magnitude = Number(e.target.value);
												setLoads(newLoads);
											}}
											className="w-full"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Direction
										</label>
										<select
											value={load.direction}
											onChange={(e) => {
												const newLoads = [...loads];
												newLoads[index].direction = e.target
													.value as typeof load.direction;
												setLoads(newLoads);
											}}
											className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
										>
											<option value="down">Down</option>
											<option value="up">Up</option>
										</select>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Supports */}
				<div className="mb-6">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-lg font-semibold">Supports</h3>
						<button
							type="button"
							onClick={addSupport}
							className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
						>
							Add Support
						</button>
					</div>
					<div className="space-y-3">
						{supports.map((support, index) => (
							<div key={support.id} className="bg-gray-50 rounded-lg p-4">
								<div className="flex items-center justify-between mb-3">
									<span className="font-medium">Support {index + 1}</span>
									<button
										type="button"
										onClick={() => removeSupport(support.id)}
										className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
									>
										Remove
									</button>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Type
										</label>
										<select
											value={support.type}
											onChange={(e) => {
												const newSupports = [...supports];
												newSupports[index].type = e.target
													.value as typeof support.type;
												setSupports(newSupports);
											}}
											className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
										>
											<option value="pinned">Pinned</option>
											<option value="roller">Roller</option>
											<option value="fixed">Fixed</option>
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Position: {(support.position * 100).toFixed(0)}%
										</label>
										<input
											type="range"
											min="0"
											max="1"
											step="0.01"
											value={support.position}
											onChange={(e) => {
												const newSupports = [...supports];
												newSupports[index].position = Number(e.target.value);
												setSupports(newSupports);
											}}
											className="w-full"
										/>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Analysis Results */}
			{analysisResults && (
				<div className="mb-6">
					<h3 className="text-lg font-semibold mb-3">Analysis Results</h3>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<h4 className="font-medium text-blue-800">Max Deflection</h4>
							<p className="text-2xl font-bold text-blue-900">
								{analysisResults.maxDeflection.toFixed(2)} mm
							</p>
							<p className="text-sm text-blue-600">Maximum displacement</p>
						</div>
						<div className="bg-green-50 border border-green-200 rounded-lg p-4">
							<h4 className="font-medium text-green-800">Max Moment</h4>
							<p className="text-2xl font-bold text-green-900">
								{analysisResults.maxMoment.toFixed(1)} kN·m
							</p>
							<p className="text-sm text-green-600">Maximum bending moment</p>
						</div>
						<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
							<h4 className="font-medium text-yellow-800">Max Stress</h4>
							<p className="text-2xl font-bold text-yellow-900">
								{analysisResults.maxStress.toFixed(1)} MPa
							</p>
							<p className="text-sm text-yellow-600">Maximum bending stress</p>
						</div>
						<div
							className={`border rounded-lg p-4 ${
								analysisResults.safetyFactor >= 2
									? "bg-green-50 border-green-200"
									: analysisResults.safetyFactor >= 1.5
										? "bg-yellow-50 border-yellow-200"
										: "bg-red-50 border-red-200"
							}`}
						>
							<h4
								className={`font-medium ${
									analysisResults.safetyFactor >= 2
										? "text-green-800"
										: analysisResults.safetyFactor >= 1.5
											? "text-yellow-800"
											: "text-red-800"
								}`}
							>
								Safety Factor
							</h4>
							<p
								className={`text-2xl font-bold ${
									analysisResults.safetyFactor >= 2
										? "text-green-900"
										: analysisResults.safetyFactor >= 1.5
											? "text-yellow-900"
											: "text-red-900"
								}`}
							>
								{analysisResults.safetyFactor === Number.POSITIVE_INFINITY
									? "∞"
									: analysisResults.safetyFactor.toFixed(1)}
							</p>
							<p
								className={`text-sm ${
									analysisResults.safetyFactor >= 2
										? "text-green-600"
										: analysisResults.safetyFactor >= 1.5
											? "text-yellow-600"
											: "text-red-600"
								}`}
							>
								{analysisResults.safetyFactor >= 2
									? "Safe"
									: analysisResults.safetyFactor >= 1.5
										? "Caution"
										: "Unsafe"}
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Structural Diagram */}
			<div className="mb-6">
				<canvas
					ref={canvasRef}
					className="border border-gray-300 rounded-lg bg-white"
					style={{ maxWidth: "100%", height: "auto" }}
				/>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-slate-800">
						Engineering Calculations
					</h3>
					<ul className="text-slate-700 space-y-1">
						<li>
							• <strong>Shear Force Analysis</strong>: V(x) along beam length
						</li>
						<li>
							• <strong>Bending Moment</strong>: M(x) using equilibrium
							equations
						</li>
						<li>
							• <strong>Deflection Calculation</strong>: Euler-Bernoulli beam
							theory
						</li>
						<li>
							• <strong>Stress Analysis</strong>: σ = My/I flexural stress
							formula
						</li>
					</ul>
				</div>

				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-blue-800">
						Design Applications
					</h3>
					<ul className="text-blue-700 space-y-1">
						<li>
							• <strong>Steel Structures</strong>: Building frames and bridges
						</li>
						<li>
							• <strong>Concrete Design</strong>: Reinforced concrete beams
						</li>
						<li>
							• <strong>Timber Construction</strong>: Wood frame buildings
						</li>
						<li>
							• <strong>Safety Assessment</strong>: Factor of safety
							verification
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
				<h3 className="text-lg font-semibold mb-2 text-orange-800">
					Standards
				</h3>
				<div className="grid md:grid-cols-3 gap-4 text-orange-700">
					<div>
						<strong>Design Codes:</strong>
						<ul className="text-sm mt-1">
							<li>• AISC Steel Construction</li>
							<li>• ACI Concrete Design</li>
							<li>• NDS Wood Design</li>
						</ul>
					</div>
					<div>
						<strong>Safety Factors:</strong>
						<ul className="text-sm mt-1">
							<li>• Dead loads: 1.2-1.4</li>
							<li>• Live loads: 1.6-1.7</li>
							<li>• Combined: 2.0+ recommended</li>
						</ul>
					</div>
					<div>
						<strong>Deflection Limits:</strong>
						<ul className="text-sm mt-1">
							<li>• Floors: L/360</li>
							<li>• Roofs: L/240</li>
							<li>• Cantilevers: L/180</li>
						</ul>
					</div>
				</div>
			</div>

			<div className="mt-6">
				<Link
					to="/examples/engineering"
					className="inline-block px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
				>
					← Back to Examples
				</Link>
			</div>
		</div>
	);
}
