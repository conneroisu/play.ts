import { Link, createFileRoute } from "@tanstack/react-router";
import {
	PI,
	TWO_PI,
	clamp,
	cos,
	hsl,
	hslToRgb,
	lerp,
	randomFloat,
	sin,
	toCssHsl,
} from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/engineering/materials-science")(
	{
		component: MaterialsScienceExample,
	},
);

interface Material {
	name: string;
	youngsModulus: number; // GPa
	yieldStrength: number; // MPa
	ultimateStrength: number; // MPa
	elongation: number; // %
	density: number; // g/cm³
	poissonRatio: number;
	color: { h: number; s: number; l: number };
}

interface StressStrainPoint {
	strain: number;
	stress: number;
	region: "elastic" | "plastic" | "necking" | "failure";
}

interface MaterialProperty {
	temperature: number;
	property: number;
	phase?: string;
}

interface CrystalStructure {
	name: string;
	latticeParameter: number;
	coordination: number;
	packingFactor: number;
	description: string;
}

interface PhaseTransition {
	temperature: number;
	phase: string;
	enthalpy: number;
}

function MaterialsScienceExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const phaseCanvasRef = useRef<HTMLCanvasElement>(null);
	const crystalCanvasRef = useRef<HTMLCanvasElement>(null);

	const [materials] = useState<Material[]>([
		{
			name: "Steel (AISI 1020)",
			youngsModulus: 200,
			yieldStrength: 350,
			ultimateStrength: 420,
			elongation: 36,
			density: 7.87,
			poissonRatio: 0.29,
			color: hsl(220, 70, 50),
		},
		{
			name: "Aluminum 6061",
			youngsModulus: 69,
			yieldStrength: 276,
			ultimateStrength: 310,
			elongation: 17,
			density: 2.7,
			poissonRatio: 0.33,
			color: hsl(180, 70, 60),
		},
		{
			name: "Titanium Ti-6Al-4V",
			youngsModulus: 114,
			yieldStrength: 880,
			ultimateStrength: 950,
			elongation: 14,
			density: 4.43,
			poissonRatio: 0.32,
			color: hsl(280, 70, 50),
		},
		{
			name: "Copper C11000",
			youngsModulus: 110,
			yieldStrength: 70,
			ultimateStrength: 220,
			elongation: 45,
			density: 8.96,
			poissonRatio: 0.34,
			color: hsl(30, 80, 50),
		},
		{
			name: "Carbon Fiber",
			youngsModulus: 230,
			yieldStrength: 3500,
			ultimateStrength: 3500,
			elongation: 1.5,
			density: 1.6,
			poissonRatio: 0.2,
			color: hsl(0, 0, 20),
		},
	]);

	const [crystalStructures] = useState<CrystalStructure[]>([
		{
			name: "Face-Centered Cubic (FCC)",
			latticeParameter: 3.6,
			coordination: 12,
			packingFactor: 0.74,
			description: "Common in Al, Cu, Au - high ductility",
		},
		{
			name: "Body-Centered Cubic (BCC)",
			latticeParameter: 2.9,
			coordination: 8,
			packingFactor: 0.68,
			description: "Common in Fe, Cr, W - moderate ductility",
		},
		{
			name: "Hexagonal Close-Packed (HCP)",
			latticeParameter: 2.5,
			coordination: 12,
			packingFactor: 0.74,
			description: "Common in Zn, Mg, Ti - limited ductility",
		},
	]);

	const [selectedMaterial, setSelectedMaterial] = useState<Material>(
		materials[0],
	);
	const [selectedCrystal, setSelectedCrystal] = useState<CrystalStructure>(
		crystalStructures[0],
	);
	const [testType, setTestType] = useState<
		"tensile" | "fatigue" | "creep" | "hardness"
	>("tensile");
	const [displayMode, setDisplayMode] = useState<
		"stress-strain" | "phase-diagram" | "crystal-structure"
	>("stress-strain");

	const [testParameters, setTestParameters] = useState({
		strainRate: 0.001, // /s
		temperature: 20, // °C
		maxStrain: 0.5,
		cyclesCount: 1000,
		appliedStress: 200, // MPa
		time: 100, // hours for creep
	});

	const [currentStrain, setCurrentStrain] = useState(0);
	const [isRunning, setIsRunning] = useState(false);
	const [stressStrainData, setStressStrainData] = useState<StressStrainPoint[]>(
		[],
	);

	const [materialProperties, setMaterialProperties] = useState({
		hardness: 0, // HRC
		toughness: 0, // J/m²
		fatigue_limit: 0, // MPa
		creep_rate: 0, // %/hour
		thermal_expansion: 0, // µm/m/°C
		thermal_conductivity: 0, // W/m·K
	});

	// Generate stress-strain curve
	const generateStressStrainCurve = (
		material: Material,
		maxStrain: number,
	): StressStrainPoint[] => {
		const data: StressStrainPoint[] = [];
		const strainStep = maxStrain / 1000;

		const elasticLimit = material.yieldStrength / material.youngsModulus / 1000; // Convert MPa to GPa
		const plasticStrain = material.elongation / 100 - elasticLimit;
		const neckingStrain = elasticStrain + plasticStrain * 0.8;
		const failureStrain = material.elongation / 100;

		for (let strain = 0; strain <= maxStrain; strain += strainStep) {
			let stress = 0;
			let region: "elastic" | "plastic" | "necking" | "failure" = "elastic";

			if (strain <= elasticLimit) {
				// Elastic region - linear
				stress = material.youngsModulus * strain * 1000; // Convert to MPa
				region = "elastic";
			} else if (strain <= neckingStrain) {
				// Plastic region - nonlinear hardening
				const plasticStrain_local = strain - elasticLimit;
				const hardening = 1 + plasticStrain_local / (plasticStrain * 2);
				stress = material.yieldStrength * hardening;
				region = "plastic";
			} else if (strain <= failureStrain) {
				// Necking region - stress decreases
				const neckingProgress =
					(strain - neckingStrain) / (failureStrain - neckingStrain);
				stress = material.ultimateStrength * (1 - neckingProgress * 0.3);
				region = "necking";
			} else {
				// Failure
				stress = 0;
				region = "failure";
			}

			// Add some material-specific variations
			if (material.name.includes("Carbon Fiber")) {
				// Brittle failure
				if (strain > elasticLimit * 1.1) {
					stress = 0;
					region = "failure";
				}
			}

			data.push({ strain, stress, region });

			if (region === "failure" && stress === 0) break;
		}

		return data;
	};

	// Calculate material properties based on composition and temperature
	const calculateMaterialProperties = (
		material: Material,
		temperature: number,
	) => {
		const baseTemp = 20; // °C
		const tempFactor = 1 - (temperature - baseTemp) * 0.002; // Temperature degradation

		// Hardness estimation based on ultimate strength
		const hardness = Math.max(
			0,
			(material.ultimateStrength / 10 - 80) * tempFactor,
		);

		// Toughness (simplified Charpy impact energy)
		const toughness =
			((material.elongation * material.ultimateStrength) / 10) * tempFactor;

		// Fatigue limit (approximately 40-50% of ultimate strength for steel)
		const fatigue_limit = material.ultimateStrength * 0.45 * tempFactor;

		// Creep rate (very simplified)
		const creep_rate = Math.max(
			0,
			(temperature - 400) * 0.001 * (1000 / material.youngsModulus),
		);

		// Thermal properties (simplified)
		const thermal_expansion = material.name.includes("Carbon")
			? 1.5
			: material.name.includes("Aluminum")
				? 23.1
				: material.name.includes("Steel")
					? 12.0
					: material.name.includes("Titanium")
						? 8.6
						: 16.5;

		const thermal_conductivity = material.name.includes("Aluminum")
			? 237
			: material.name.includes("Copper")
				? 401
				: material.name.includes("Steel")
					? 50
					: material.name.includes("Titanium")
						? 7
						: 1;

		setMaterialProperties({
			hardness: Math.round(hardness),
			toughness: Math.round(toughness),
			fatigue_limit: Math.round(fatigue_limit),
			creep_rate: creep_rate,
			thermal_expansion: thermal_expansion,
			thermal_conductivity: thermal_conductivity,
		});
	};

	const renderStressStrainCurve = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw background
		ctx.fillStyle = "#f8fafc";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Generate curves for all materials
		const allCurves = materials.map((material) => ({
			material,
			data: generateStressStrainCurve(material, testParameters.maxStrain),
		}));

		// Find scales
		const maxStrain = Math.max(
			...allCurves.flatMap((curve) => curve.data.map((p) => p.strain)),
		);
		const maxStress = Math.max(
			...allCurves.flatMap((curve) => curve.data.map((p) => p.stress)),
		);

		const xScale = (canvas.width - 80) / maxStrain;
		const yScale = (canvas.height - 80) / maxStress;

		// Draw grid
		ctx.strokeStyle = "#e2e8f0";
		ctx.lineWidth = 1;

		// Horizontal grid lines (stress)
		const stressSteps = 5;
		for (let i = 0; i <= stressSteps; i++) {
			const stress = (i * maxStress) / stressSteps;
			const y = canvas.height - 40 - stress * yScale;

			ctx.beginPath();
			ctx.moveTo(40, y);
			ctx.lineTo(canvas.width - 40, y);
			ctx.stroke();

			// Stress labels
			ctx.fillStyle = "#64748b";
			ctx.font = "12px Arial";
			ctx.textAlign = "right";
			ctx.fillText(`${stress.toFixed(0)} MPa`, 35, y + 4);
		}

		// Vertical grid lines (strain)
		const strainSteps = 10;
		for (let i = 0; i <= strainSteps; i++) {
			const strain = (i * maxStrain) / strainSteps;
			const x = 40 + strain * xScale;

			ctx.beginPath();
			ctx.moveTo(x, 40);
			ctx.lineTo(x, canvas.height - 40);
			ctx.stroke();

			// Strain labels
			ctx.fillStyle = "#64748b";
			ctx.font = "12px Arial";
			ctx.textAlign = "center";
			ctx.fillText(`${(strain * 100).toFixed(1)}%`, x, canvas.height - 20);
		}

		// Draw axes
		ctx.strokeStyle = "#1e293b";
		ctx.lineWidth = 2;

		// X-axis
		ctx.beginPath();
		ctx.moveTo(40, canvas.height - 40);
		ctx.lineTo(canvas.width - 40, canvas.height - 40);
		ctx.stroke();

		// Y-axis
		ctx.beginPath();
		ctx.moveTo(40, 40);
		ctx.lineTo(40, canvas.height - 40);
		ctx.stroke();

		// Draw stress-strain curves
		allCurves.forEach((curve, index) => {
			const material = curve.material;
			const isSelected = material.name === selectedMaterial.name;

			ctx.strokeStyle = toCssHsl(material.color);
			ctx.lineWidth = isSelected ? 4 : 2;
			ctx.globalAlpha = isSelected ? 1 : 0.7;

			ctx.beginPath();

			for (let i = 0; i < curve.data.length; i++) {
				const point = curve.data[i];
				const x = 40 + point.strain * xScale;
				const y = canvas.height - 40 - point.stress * yScale;

				if (i === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			}

			ctx.stroke();
			ctx.globalAlpha = 1;

			// Mark key points for selected material
			if (isSelected) {
				const data = curve.data;
				const yieldPoint = data.find((p) => p.region === "plastic");
				const ultimatePoint = data.reduce(
					(max, p) => (p.stress > max.stress ? p : max),
					{ strain: 0, stress: 0, region: "elastic" as const },
				);

				// Yield point
				if (yieldPoint) {
					ctx.fillStyle = "#f59e0b";
					ctx.beginPath();
					ctx.arc(
						40 + yieldPoint.strain * xScale,
						canvas.height - 40 - yieldPoint.stress * yScale,
						6,
						0,
						TWO_PI,
					);
					ctx.fill();

					ctx.fillStyle = "#1e293b";
					ctx.font = "12px Arial";
					ctx.textAlign = "left";
					ctx.fillText(
						"Yield",
						40 + yieldPoint.strain * xScale + 10,
						canvas.height - 40 - yieldPoint.stress * yScale - 5,
					);
				}

				// Ultimate point
				ctx.fillStyle = "#ef4444";
				ctx.beginPath();
				ctx.arc(
					40 + ultimatePoint.strain * xScale,
					canvas.height - 40 - ultimatePoint.stress * yScale,
					6,
					0,
					TWO_PI,
				);
				ctx.fill();

				ctx.fillStyle = "#1e293b";
				ctx.font = "12px Arial";
				ctx.textAlign = "left";
				ctx.fillText(
					"Ultimate",
					40 + ultimatePoint.strain * xScale + 10,
					canvas.height - 40 - ultimatePoint.stress * yScale - 5,
				);
			}
		});

		// Current test position
		if (isRunning && stressStrainData.length > 0) {
			const currentPoint = stressStrainData[stressStrainData.length - 1];
			const x = 40 + currentPoint.strain * xScale;
			const y = canvas.height - 40 - currentPoint.stress * yScale;

			ctx.fillStyle = "#dc2626";
			ctx.beginPath();
			ctx.arc(x, y, 8, 0, TWO_PI);
			ctx.fill();

			ctx.strokeStyle = "#dc2626";
			ctx.lineWidth = 2;
			ctx.setLineDash([5, 5]);
			ctx.beginPath();
			ctx.moveTo(x, 40);
			ctx.lineTo(x, canvas.height - 40);
			ctx.stroke();
			ctx.setLineDash([]);
		}

		// Labels
		ctx.fillStyle = "#1e293b";
		ctx.font = "14px Arial";
		ctx.textAlign = "center";
		ctx.fillText("Stress-Strain Curves", canvas.width / 2, 25);

		ctx.save();
		ctx.translate(15, canvas.height / 2);
		ctx.rotate(-PI / 2);
		ctx.textAlign = "center";
		ctx.fillText("Stress (MPa)", 0, 0);
		ctx.restore();

		ctx.textAlign = "center";
		ctx.fillText("Strain (%)", canvas.width / 2, canvas.height - 5);

		// Legend
		materials.forEach((material, index) => {
			const y = 60 + index * 20;
			const isSelected = material.name === selectedMaterial.name;

			ctx.strokeStyle = toCssHsl(material.color);
			ctx.lineWidth = isSelected ? 4 : 2;
			ctx.beginPath();
			ctx.moveTo(canvas.width - 200, y);
			ctx.lineTo(canvas.width - 170, y);
			ctx.stroke();

			ctx.fillStyle = isSelected ? "#1e293b" : "#64748b";
			ctx.font = isSelected ? "bold 12px Arial" : "12px Arial";
			ctx.textAlign = "left";
			ctx.fillText(material.name, canvas.width - 165, y + 4);
		});
	};

	const renderCrystalStructure = () => {
		const canvas = crystalCanvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw background
		ctx.fillStyle = "#f8fafc";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		const scale = 80;

		// Draw crystal structure based on selected type
		ctx.fillStyle = "#1e293b";
		ctx.font = "bold 16px Arial";
		ctx.textAlign = "center";
		ctx.fillText(selectedCrystal.name, centerX, 30);

		ctx.font = "12px Arial";
		ctx.fillText(selectedCrystal.description, centerX, 50);

		// Draw unit cell
		const a = (selectedCrystal.latticeParameter * scale) / 4;

		switch (selectedCrystal.name) {
			case "Face-Centered Cubic (FCC)":
				renderFCCStructure(ctx, centerX, centerY, a);
				break;
			case "Body-Centered Cubic (BCC)":
				renderBCCStructure(ctx, centerX, centerY, a);
				break;
			case "Hexagonal Close-Packed (HCP)":
				renderHCPStructure(ctx, centerX, centerY, a);
				break;
		}

		// Properties table
		const props = [
			`Lattice Parameter: ${selectedCrystal.latticeParameter.toFixed(1)} Å`,
			`Coordination Number: ${selectedCrystal.coordination}`,
			`Packing Factor: ${selectedCrystal.packingFactor.toFixed(2)}`,
		];

		ctx.font = "14px Arial";
		ctx.textAlign = "left";
		props.forEach((prop, index) => {
			ctx.fillText(prop, 20, canvas.height - 80 + index * 20);
		});
	};

	const renderFCCStructure = (
		ctx: CanvasRenderingContext2D,
		centerX: number,
		centerY: number,
		a: number,
	) => {
		// Draw cube edges
		ctx.strokeStyle = "#64748b";
		ctx.lineWidth = 2;

		// Front face
		ctx.strokeRect(centerX - a, centerY - a, 2 * a, 2 * a);

		// Back face (offset for 3D effect)
		const offset = a * 0.5;
		ctx.strokeRect(centerX - a + offset, centerY - a - offset, 2 * a, 2 * a);

		// Connecting lines
		ctx.beginPath();
		ctx.moveTo(centerX - a, centerY - a);
		ctx.lineTo(centerX - a + offset, centerY - a - offset);
		ctx.moveTo(centerX + a, centerY - a);
		ctx.lineTo(centerX + a + offset, centerY - a - offset);
		ctx.moveTo(centerX - a, centerY + a);
		ctx.lineTo(centerX - a + offset, centerY + a - offset);
		ctx.moveTo(centerX + a, centerY + a);
		ctx.lineTo(centerX + a + offset, centerY + a - offset);
		ctx.stroke();

		// Draw atoms
		const atomRadius = 8;

		// Corner atoms
		const corners = [
			[centerX - a, centerY - a],
			[centerX + a, centerY - a],
			[centerX - a, centerY + a],
			[centerX + a, centerY + a],
			[centerX - a + offset, centerY - a - offset],
			[centerX + a + offset, centerY - a - offset],
			[centerX - a + offset, centerY + a - offset],
			[centerX + a + offset, centerY + a - offset],
		];

		// Face-centered atoms
		const faces = [
			[centerX, centerY - a],
			[centerX, centerY + a], // front face centers
			[centerX - a, centerY],
			[centerX + a, centerY], // side face centers
			[centerX + offset, centerY - a - offset],
			[centerX + offset, centerY + a - offset], // back face centers
		];

		// Draw corner atoms
		ctx.fillStyle = "#3b82f6";
		corners.forEach(([x, y]) => {
			ctx.beginPath();
			ctx.arc(x, y, atomRadius, 0, TWO_PI);
			ctx.fill();
		});

		// Draw face-centered atoms
		ctx.fillStyle = "#ef4444";
		faces.forEach(([x, y]) => {
			ctx.beginPath();
			ctx.arc(x, y, atomRadius, 0, TWO_PI);
			ctx.fill();
		});
	};

	const renderBCCStructure = (
		ctx: CanvasRenderingContext2D,
		centerX: number,
		centerY: number,
		a: number,
	) => {
		// Similar to FCC but with body-centered atom
		ctx.strokeStyle = "#64748b";
		ctx.lineWidth = 2;

		// Front face
		ctx.strokeRect(centerX - a, centerY - a, 2 * a, 2 * a);

		// Back face
		const offset = a * 0.5;
		ctx.strokeRect(centerX - a + offset, centerY - a - offset, 2 * a, 2 * a);

		// Connecting lines
		ctx.beginPath();
		ctx.moveTo(centerX - a, centerY - a);
		ctx.lineTo(centerX - a + offset, centerY - a - offset);
		ctx.moveTo(centerX + a, centerY - a);
		ctx.lineTo(centerX + a + offset, centerY - a - offset);
		ctx.moveTo(centerX - a, centerY + a);
		ctx.lineTo(centerX - a + offset, centerY + a - offset);
		ctx.moveTo(centerX + a, centerY + a);
		ctx.lineTo(centerX + a + offset, centerY + a - offset);
		ctx.stroke();

		// Corner atoms
		const atomRadius = 8;
		const corners = [
			[centerX - a, centerY - a],
			[centerX + a, centerY - a],
			[centerX - a, centerY + a],
			[centerX + a, centerY + a],
			[centerX - a + offset, centerY - a - offset],
			[centerX + a + offset, centerY - a - offset],
			[centerX - a + offset, centerY + a - offset],
			[centerX + a + offset, centerY + a - offset],
		];

		ctx.fillStyle = "#3b82f6";
		corners.forEach(([x, y]) => {
			ctx.beginPath();
			ctx.arc(x, y, atomRadius, 0, TWO_PI);
			ctx.fill();
		});

		// Body-centered atoms
		ctx.fillStyle = "#ef4444";
		ctx.beginPath();
		ctx.arc(centerX + offset / 2, centerY - offset / 2, atomRadius, 0, TWO_PI);
		ctx.fill();
	};

	const renderHCPStructure = (
		ctx: CanvasRenderingContext2D,
		centerX: number,
		centerY: number,
		a: number,
	) => {
		// Simplified hexagonal structure
		const atomRadius = 8;
		const hexRadius = a;

		// Draw hexagonal outline
		ctx.strokeStyle = "#64748b";
		ctx.lineWidth = 2;
		ctx.beginPath();

		for (let i = 0; i < 6; i++) {
			const angle = (i * PI) / 3;
			const x = centerX + hexRadius * cos(angle);
			const y = centerY + hexRadius * sin(angle);

			if (i === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		}
		ctx.closePath();
		ctx.stroke();

		// Draw atoms
		ctx.fillStyle = "#3b82f6";

		// Corner atoms
		for (let i = 0; i < 6; i++) {
			const angle = (i * PI) / 3;
			const x = centerX + hexRadius * cos(angle);
			const y = centerY + hexRadius * sin(angle);

			ctx.beginPath();
			ctx.arc(x, y, atomRadius, 0, TWO_PI);
			ctx.fill();
		}

		// Center atom
		ctx.fillStyle = "#ef4444";
		ctx.beginPath();
		ctx.arc(centerX, centerY, atomRadius, 0, TWO_PI);
		ctx.fill();
	};

	const simulateTest = () => {
		if (!isRunning) return;

		if (testType === "tensile") {
			const newStrain = currentStrain + testParameters.strainRate * 0.1;

			if (newStrain <= testParameters.maxStrain) {
				const curve = generateStressStrainCurve(
					selectedMaterial,
					testParameters.maxStrain,
				);
				const dataPoint =
					curve.find((p) => Math.abs(p.strain - newStrain) < 0.001) ||
					curve[curve.length - 1];

				setStressStrainData((prev) => [...prev, dataPoint]);
				setCurrentStrain(newStrain);
			} else {
				setIsRunning(false);
			}
		}
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		const phaseCanvas = phaseCanvasRef.current;
		const crystalCanvas = crystalCanvasRef.current;
		if (!canvas || !phaseCanvas || !crystalCanvas) return;

		canvas.width = 800;
		canvas.height = 600;
		phaseCanvas.width = 600;
		phaseCanvas.height = 400;
		crystalCanvas.width = 600;
		crystalCanvas.height = 400;

		const interval = setInterval(() => {
			if (displayMode === "stress-strain") {
				renderStressStrainCurve();
			} else if (displayMode === "crystal-structure") {
				renderCrystalStructure();
			}

			if (isRunning) {
				simulateTest();
			}
		}, 100);

		return () => clearInterval(interval);
	}, [
		selectedMaterial,
		selectedCrystal,
		displayMode,
		isRunning,
		currentStrain,
		testParameters,
	]);

	useEffect(() => {
		calculateMaterialProperties(selectedMaterial, testParameters.temperature);
	}, [selectedMaterial, testParameters.temperature]);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Materials Science & Engineering
				</h1>
				<p className="text-gray-600 mb-4">
					Comprehensive materials analysis including stress-strain behavior,
					crystal structures, and material properties.
				</p>
				<div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
					<p className="text-purple-800">
						🔬 Interactive materials characterization with mechanical testing
						and microstructural analysis
					</p>
				</div>
			</div>

			{/* Control Panel */}
			<div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Material
						</label>
						<select
							value={selectedMaterial.name}
							onChange={(e) =>
								setSelectedMaterial(
									materials.find((m) => m.name === e.target.value) ||
										materials[0],
								)
							}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
						>
							{materials.map((material) => (
								<option key={material.name} value={material.name}>
									{material.name}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Test Type
						</label>
						<select
							value={testType}
							onChange={(e) => {
								setTestType(e.target.value as typeof testType);
								setCurrentStrain(0);
								setStressStrainData([]);
							}}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
						>
							<option value="tensile">Tensile Test</option>
							<option value="fatigue">Fatigue Test</option>
							<option value="creep">Creep Test</option>
							<option value="hardness">Hardness Test</option>
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Display Mode
						</label>
						<select
							value={displayMode}
							onChange={(e) =>
								setDisplayMode(e.target.value as typeof displayMode)
							}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
						>
							<option value="stress-strain">Stress-Strain</option>
							<option value="crystal-structure">Crystal Structure</option>
						</select>
					</div>

					<div className="flex flex-col gap-2">
						<button
							type="button"
							onClick={() => {
								setIsRunning(!isRunning);
								if (!isRunning) {
									setCurrentStrain(0);
									setStressStrainData([]);
								}
							}}
							className={`px-4 py-2 rounded-md transition-colors ${
								isRunning
									? "bg-red-600 text-white hover:bg-red-700"
									: "bg-green-600 text-white hover:bg-green-700"
							}`}
							disabled={testType !== "tensile"}
						>
							{isRunning ? "Stop" : "Start"} Test
						</button>
					</div>
				</div>

				{/* Test Parameters */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Temperature: {testParameters.temperature}°C
						</label>
						<input
							type="range"
							min="-200"
							max="1000"
							step="10"
							value={testParameters.temperature}
							onChange={(e) =>
								setTestParameters((prev) => ({
									...prev,
									temperature: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Strain Rate: {testParameters.strainRate.toFixed(4)} /s
						</label>
						<input
							type="range"
							min="0.0001"
							max="0.01"
							step="0.0001"
							value={testParameters.strainRate}
							onChange={(e) =>
								setTestParameters((prev) => ({
									...prev,
									strainRate: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Max Strain: {(testParameters.maxStrain * 100).toFixed(1)}%
						</label>
						<input
							type="range"
							min="0.01"
							max="1.0"
							step="0.01"
							value={testParameters.maxStrain}
							onChange={(e) =>
								setTestParameters((prev) => ({
									...prev,
									maxStrain: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Crystal Structure
						</label>
						<select
							value={selectedCrystal.name}
							onChange={(e) =>
								setSelectedCrystal(
									crystalStructures.find((c) => c.name === e.target.value) ||
										crystalStructures[0],
								)
							}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
						>
							{crystalStructures.map((crystal) => (
								<option key={crystal.name} value={crystal.name}>
									{crystal.name}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			{/* Material Properties */}
			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-3">Material Properties</h3>
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
						<h4 className="font-medium text-blue-800 text-sm">
							Young's Modulus
						</h4>
						<p className="text-lg font-bold text-blue-900">
							{selectedMaterial.youngsModulus} GPa
						</p>
					</div>
					<div className="bg-green-50 border border-green-200 rounded-lg p-3">
						<h4 className="font-medium text-green-800 text-sm">
							Yield Strength
						</h4>
						<p className="text-lg font-bold text-green-900">
							{selectedMaterial.yieldStrength} MPa
						</p>
					</div>
					<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
						<h4 className="font-medium text-yellow-800 text-sm">
							Ultimate Strength
						</h4>
						<p className="text-lg font-bold text-yellow-900">
							{selectedMaterial.ultimateStrength} MPa
						</p>
					</div>
					<div className="bg-red-50 border border-red-200 rounded-lg p-3">
						<h4 className="font-medium text-red-800 text-sm">Elongation</h4>
						<p className="text-lg font-bold text-red-900">
							{selectedMaterial.elongation}%
						</p>
					</div>
					<div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
						<h4 className="font-medium text-purple-800 text-sm">Density</h4>
						<p className="text-lg font-bold text-purple-900">
							{selectedMaterial.density} g/cm³
						</p>
					</div>
					<div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
						<h4 className="font-medium text-indigo-800 text-sm">
							Poisson's Ratio
						</h4>
						<p className="text-lg font-bold text-indigo-900">
							{selectedMaterial.poissonRatio}
						</p>
					</div>
				</div>
			</div>

			{/* Calculated Properties */}
			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-3">
					Calculated Properties at {testParameters.temperature}°C
				</h3>
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
					<div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
						<h4 className="font-medium text-orange-800 text-sm">Hardness</h4>
						<p className="text-lg font-bold text-orange-900">
							{materialProperties.hardness} HRC
						</p>
					</div>
					<div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
						<h4 className="font-medium text-teal-800 text-sm">Toughness</h4>
						<p className="text-lg font-bold text-teal-900">
							{materialProperties.toughness} J/m²
						</p>
					</div>
					<div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
						<h4 className="font-medium text-pink-800 text-sm">Fatigue Limit</h4>
						<p className="text-lg font-bold text-pink-900">
							{materialProperties.fatigue_limit} MPa
						</p>
					</div>
					<div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
						<h4 className="font-medium text-cyan-800 text-sm">
							Thermal Expansion
						</h4>
						<p className="text-lg font-bold text-cyan-900">
							{materialProperties.thermal_expansion.toFixed(1)} µm/m/°C
						</p>
					</div>
					<div className="bg-lime-50 border border-lime-200 rounded-lg p-3">
						<h4 className="font-medium text-lime-800 text-sm">
							Thermal Conductivity
						</h4>
						<p className="text-lg font-bold text-lime-900">
							{materialProperties.thermal_conductivity} W/m·K
						</p>
					</div>
					<div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
						<h4 className="font-medium text-rose-800 text-sm">Creep Rate</h4>
						<p className="text-lg font-bold text-rose-900">
							{materialProperties.creep_rate.toFixed(4)} %/hr
						</p>
					</div>
				</div>
			</div>

			{/* Main Visualization */}
			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-3">
					{displayMode === "stress-strain"
						? "Stress-Strain Analysis"
						: "Crystal Structure Analysis"}
				</h3>
				<div className="bg-white rounded-lg border border-gray-300 p-4">
					{displayMode === "stress-strain" ? (
						<canvas
							ref={canvasRef}
							className="border border-gray-300 rounded-lg bg-white mx-auto block"
							style={{ maxWidth: "100%", height: "auto" }}
						/>
					) : (
						<canvas
							ref={crystalCanvasRef}
							className="border border-gray-300 rounded-lg bg-white mx-auto block"
							style={{ maxWidth: "100%", height: "auto" }}
						/>
					)}
				</div>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-purple-800">
						Materials Features
					</h3>
					<ul className="text-purple-700 space-y-1">
						<li>
							• <strong>Mechanical Testing</strong>: Tensile, fatigue, creep,
							hardness
						</li>
						<li>
							• <strong>Crystal Structures</strong>: FCC, BCC, HCP
							visualizations
						</li>
						<li>
							• <strong>Property Calculations</strong>: Temperature-dependent
							properties
						</li>
						<li>
							• <strong>Comparative Analysis</strong>: Multiple material
							overlays
						</li>
					</ul>
				</div>

				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-blue-800">
						Engineering Applications
					</h3>
					<ul className="text-blue-700 space-y-1">
						<li>
							• <strong>Material Selection</strong>: Design optimization
						</li>
						<li>
							• <strong>Failure Analysis</strong>: Fracture mechanics
						</li>
						<li>
							• <strong>Quality Control</strong>: Manufacturing specifications
						</li>
						<li>
							• <strong>Research & Development</strong>: New material
							characterization
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6">
				<Link
					to="/examples/engineering"
					className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
				>
					← Back to Examples
				</Link>
			</div>
		</div>
	);
}
