import {
	clamp,
	cos,
	hsl,
	hslToRgb,
	lerp,
	PI,
	pow,
	sin,
	sqrt,
	TWO_PI,
	toCssHsl,
} from "play.ts";
import { useEffect, useRef, useState } from "react";

interface PipelineGeometry {
	outerDiameter: number; // mm
	wallThickness: number; // mm
	length: number; // m
	material:
		| "steel"
		| "aluminum"
		| "stainless"
		| "copper"
		| "pvc"
		| "carbon_steel";
}

interface LoadingConditions {
	internalPressure: number; // MPa
	externalPressure: number; // MPa
	axialForce: number; // kN
	bendingMoment: number; // kN·m
	torsionalMoment: number; // kN·m
	temperature: number; // °C
	thermalGradient: number; // °C/m
}

interface MaterialProperties {
	yieldStrength: number; // MPa
	ultimateStrength: number; // MPa
	elasticModulus: number; // GPa
	thermalExpansion: number; // /°C
	density: number; // kg/m³
	poissonRatio: number;
	allowableStress: number; // MPa
	name: string;
}

interface StressResults {
	hoopStress: number; // MPa
	longitudinalStress: number; // MPa
	radialStress: number; // MPa
	shearStress: number; // MPa
	vonMisesStress: number; // MPa
	principalStress1: number; // MPa
	principalStress2: number; // MPa
	principalStress3: number; // MPa
	safetyFactor: number;
	bucklingPressure: number; // MPa
	thermalStress: number; // MPa
}

interface AnalysisSettings {
	analysisType: "static" | "fatigue" | "buckling" | "thermal" | "combined";
	designCode: "asme_b31" | "api_5l" | "en_13480" | "jis_b8265" | "custom";
	safetyFactorTarget: number;
	fatigueLife: number; // cycles
	loadCombination: "working" | "test" | "upset" | "emergency";
}

export default function PipelineStressAnalysisExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();

	const [geometry, setGeometry] = useState<PipelineGeometry>({
		outerDiameter: 508, // 20 inch
		wallThickness: 12.7, // 0.5 inch
		length: 100, // m
		material: "carbon_steel",
	});

	const [loading, setLoading] = useState<LoadingConditions>({
		internalPressure: 7.0, // MPa (1000 psi)
		externalPressure: 0.1, // MPa
		axialForce: 0, // kN
		bendingMoment: 0, // kN·m
		torsionalMoment: 0, // kN·m
		temperature: 60, // °C
		thermalGradient: 0, // °C/m
	});

	const [analysisSettings, setAnalysisSettings] = useState<AnalysisSettings>({
		analysisType: "static",
		designCode: "asme_b31",
		safetyFactorTarget: 2.0,
		fatigueLife: 1000000,
		loadCombination: "working",
	});

	const [stressResults, setStressResults] = useState<StressResults | null>(
		null,
	);
	const [isAnimating, setIsAnimating] = useState(false);
	const [displaySettings, setDisplaySettings] = useState({
		showStressDistribution: true,
		showDeformation: false,
		stressColorScale: "von_mises",
		crossSection: "elevation",
		showGrid: true,
		animationSpeed: 1,
	});

	// Material properties database
	const materials: Record<string, MaterialProperties> = {
		carbon_steel: {
			yieldStrength: 358, // MPa (Grade X52)
			ultimateStrength: 455, // MPa
			elasticModulus: 207, // GPa
			thermalExpansion: 12e-6, // /°C
			density: 7850, // kg/m³
			poissonRatio: 0.3,
			allowableStress: 241, // MPa (SMYS * 0.72 for gas pipelines)
			name: "Carbon Steel (API 5L X52)",
		},
		steel: {
			yieldStrength: 250,
			ultimateStrength: 400,
			elasticModulus: 200,
			thermalExpansion: 12e-6,
			density: 7850,
			poissonRatio: 0.3,
			allowableStress: 167,
			name: "Structural Steel",
		},
		stainless: {
			yieldStrength: 215,
			ultimateStrength: 505,
			elasticModulus: 200,
			thermalExpansion: 17e-6,
			density: 8000,
			poissonRatio: 0.3,
			allowableStress: 143,
			name: "Stainless Steel 316",
		},
		aluminum: {
			yieldStrength: 276,
			ultimateStrength: 310,
			elasticModulus: 69,
			thermalExpansion: 23e-6,
			density: 2700,
			poissonRatio: 0.33,
			allowableStress: 138,
			name: "Aluminum 6061-T6",
		},
		copper: {
			yieldStrength: 69,
			ultimateStrength: 220,
			elasticModulus: 110,
			thermalExpansion: 17e-6,
			density: 8960,
			poissonRatio: 0.34,
			allowableStress: 48,
			name: "Copper C11000",
		},
		pvc: {
			yieldStrength: 52,
			ultimateStrength: 62,
			elasticModulus: 3.4,
			thermalExpansion: 70e-6,
			density: 1400,
			poissonRatio: 0.38,
			allowableStress: 20,
			name: "PVC (ASTM D2466)",
		},
	};

	// Design code factors
	const designCodes = {
		asme_b31: {
			name: "ASME B31.3/B31.4",
			factor: 0.72,
			temperatureFactor: 1.0,
		},
		api_5l: { name: "API 5L", factor: 0.72, temperatureFactor: 1.0 },
		en_13480: { name: "EN 13480", factor: 0.67, temperatureFactor: 1.0 },
		jis_b8265: { name: "JIS B8265", factor: 0.6, temperatureFactor: 1.0 },
		custom: { name: "Custom", factor: 0.72, temperatureFactor: 1.0 },
	};

	// Calculate stress analysis
	const calculateStresses = (): StressResults => {
		const material = materials[geometry.material];
		const Do = geometry.outerDiameter; // mm
		const t = geometry.wallThickness; // mm
		const Di = Do - 2 * t; // mm
		const A = (PI * (Do * Do - Di * Di)) / 4; // mm²
		const I = (PI * (pow(Do, 4) - pow(Di, 4))) / 64; // mm⁴
		const Z = I / (Do / 2); // mm³
		const J = 2 * I; // polar moment

		// Hoop stress (circumferential stress)
		const hoopStress = (loading.internalPressure * Di) / (2 * t); // MPa

		// Longitudinal stress (axial stress)
		const pressureLongitudinalStress =
			(loading.internalPressure * Di) / (4 * t); // MPa
		const axialStress = (loading.axialForce * 1000) / A; // Convert kN to N, then MPa
		const bendingStress = (loading.bendingMoment * 1e6) / Z; // Convert kN·m to N·mm, then MPa
		const longitudinalStress =
			pressureLongitudinalStress + axialStress + bendingStress;

		// Radial stress (typically small for thin-walled vessels)
		const radialStress = -loading.internalPressure / 2; // MPa (negative = compression)

		// Shear stress (torsional)
		const shearStress = (loading.torsionalMoment * 1e6 * Do) / 2 / J; // MPa

		// Thermal stress
		const deltaT = (loading.thermalGradient * geometry.length) / 2; // average temp change
		const constrainedThermalStress =
			material.elasticModulus * 1000 * material.thermalExpansion * deltaT; // MPa
		const thermalStress = Math.abs(constrainedThermalStress);

		// Principal stresses
		const sigma1 = hoopStress;
		const sigma2 = longitudinalStress + thermalStress;
		const sigma3 = radialStress;

		// Sort principal stresses
		const stresses = [sigma1, sigma2, sigma3].sort((a, b) => b - a);
		const principalStress1 = stresses[0];
		const principalStress2 = stresses[1];
		const principalStress3 = stresses[2];

		// Von Mises stress
		const vonMisesStress = sqrt(
			0.5 *
				(pow(principalStress1 - principalStress2, 2) +
					pow(principalStress2 - principalStress3, 2) +
					pow(principalStress3 - principalStress1, 2)) +
				3 * pow(shearStress, 2),
		);

		// Safety factor
		const allowableStress =
			material.allowableStress *
			designCodes[analysisSettings.designCode].factor;
		const safetyFactor = allowableStress / vonMisesStress;

		// Critical buckling pressure (external pressure)
		const elasticBucklingModulus =
			(2 * material.elasticModulus * 1000) /
			(1 - pow(material.poissonRatio, 2));
		const bucklingPressure = elasticBucklingModulus * pow(t / Do, 3); // MPa

		return {
			hoopStress,
			longitudinalStress,
			radialStress,
			shearStress,
			vonMisesStress,
			principalStress1,
			principalStress2,
			principalStress3,
			safetyFactor,
			bucklingPressure,
			thermalStress,
		};
	};

	// Get stress color based on value
	const getStressColor = (stress: number, maxStress: number): string => {
		const material = materials[geometry.material];
		const normalizedStress = clamp(
			Math.abs(stress) / material.yieldStrength,
			0,
			1,
		);

		if (normalizedStress < 0.3) {
			return toCssHsl(hsl(120, 80, 50)); // Green - safe
		} else if (normalizedStress < 0.6) {
			return toCssHsl(hsl(60, 80, 50)); // Yellow - caution
		} else if (normalizedStress < 0.9) {
			return toCssHsl(hsl(30, 80, 50)); // Orange - high
		} else {
			return toCssHsl(hsl(0, 80, 50)); // Red - critical
		}
	};

	// Draw pipeline visualization
	const draw = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;

		ctx.clearRect(0, 0, width, height);

		// Draw pipeline cross-section and stress visualization
		drawPipelineCrossSection(ctx, width / 4, height / 2, 150);
		drawStressDistribution(ctx, width * 0.6, 50, width * 0.35, height - 100);
		drawLoadingDiagram(ctx, 50, height - 200, 300, 150);
	};

	const drawPipelineCrossSection = (
		ctx: CanvasRenderingContext2D,
		centerX: number,
		centerY: number,
		radius: number,
	) => {
		if (!stressResults) return;

		const material = materials[geometry.material];
		const Do = geometry.outerDiameter;
		const Di = Do - 2 * geometry.wallThickness;
		const outerRadius = radius;
		const innerRadius = radius * (Di / Do);

		// Draw pipe wall
		ctx.lineWidth = 3;

		// Color pipe wall based on stress
		const stressValue =
			displaySettings.stressColorScale === "von_mises"
				? stressResults.vonMisesStress
				: stressResults.hoopStress;

		ctx.fillStyle = getStressColor(stressValue, material.yieldStrength);
		ctx.strokeStyle = "#374151";

		// Outer circle
		ctx.beginPath();
		ctx.arc(centerX, centerY, outerRadius, 0, TWO_PI);
		ctx.fill();
		ctx.stroke();

		// Inner circle (hollow)
		ctx.fillStyle = "#f8fafc";
		ctx.beginPath();
		ctx.arc(centerX, centerY, innerRadius, 0, TWO_PI);
		ctx.fill();
		ctx.stroke();

		// Dimension lines
		ctx.strokeStyle = "#64748b";
		ctx.lineWidth = 1;
		ctx.setLineDash([5, 5]);

		// Diameter lines
		ctx.beginPath();
		ctx.moveTo(centerX - outerRadius, centerY);
		ctx.lineTo(centerX + outerRadius, centerY);
		ctx.moveTo(centerX, centerY - outerRadius);
		ctx.lineTo(centerX, centerY + outerRadius);
		ctx.stroke();

		ctx.setLineDash([]);

		// Labels
		ctx.fillStyle = "#1f2937";
		ctx.font = "12px Arial";
		ctx.textAlign = "center";

		ctx.fillText(
			`OD: ${Do.toFixed(1)} mm`,
			centerX,
			centerY - outerRadius - 15,
		);
		ctx.fillText(
			`ID: ${Di.toFixed(1)} mm`,
			centerX,
			centerY - innerRadius - 15,
		);
		ctx.fillText(
			`t: ${geometry.wallThickness.toFixed(1)} mm`,
			centerX + outerRadius + 30,
			centerY,
		);

		// Stress arrows (hoop stress)
		if (displaySettings.showStressDistribution) {
			const arrowRadius = outerRadius + 20;
			const numArrows = 8;

			ctx.strokeStyle = "#ef4444";
			ctx.fillStyle = "#ef4444";
			ctx.lineWidth = 2;

			for (let i = 0; i < numArrows; i++) {
				const angle = (i * TWO_PI) / numArrows;
				const x1 = centerX + arrowRadius * cos(angle);
				const y1 = centerY + arrowRadius * sin(angle);
				const x2 = centerX + (arrowRadius + 15) * cos(angle);
				const y2 = centerY + (arrowRadius + 15) * sin(angle);

				// Arrow line
				ctx.beginPath();
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
				ctx.stroke();

				// Arrow head
				const headAngle = angle + PI;
				ctx.beginPath();
				ctx.moveTo(x2, y2);
				ctx.lineTo(
					x2 + 5 * cos(headAngle + 0.3),
					y2 + 5 * sin(headAngle + 0.3),
				);
				ctx.lineTo(
					x2 + 5 * cos(headAngle - 0.3),
					y2 + 5 * sin(headAngle - 0.3),
				);
				ctx.closePath();
				ctx.fill();
			}
		}

		// Material and pressure info
		ctx.textAlign = "left";
		ctx.fillText(
			`Material: ${material.name}`,
			centerX - outerRadius,
			centerY + outerRadius + 30,
		);
		ctx.fillText(
			`Pressure: ${loading.internalPressure.toFixed(1)} MPa`,
			centerX - outerRadius,
			centerY + outerRadius + 45,
		);
		ctx.fillText(
			`Temperature: ${loading.temperature}°C`,
			centerX - outerRadius,
			centerY + outerRadius + 60,
		);
	};

	const drawStressDistribution = (
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		width: number,
		height: number,
	) => {
		if (!stressResults) return;

		// Background
		ctx.fillStyle = "#f8fafc";
		ctx.fillRect(x, y, width, height);
		ctx.strokeStyle = "#e2e8f0";
		ctx.lineWidth = 1;
		ctx.strokeRect(x, y, width, height);

		// Title
		ctx.fillStyle = "#1e293b";
		ctx.font = "16px Arial";
		ctx.textAlign = "center";
		ctx.fillText("Stress Analysis Results", x + width / 2, y + 20);

		// Stress bars
		const stresses = [
			{ name: "Hoop", value: stressResults.hoopStress, color: "#ef4444" },
			{
				name: "Longitudinal",
				value: stressResults.longitudinalStress,
				color: "#3b82f6",
			},
			{
				name: "Radial",
				value: Math.abs(stressResults.radialStress),
				color: "#10b981",
			},
			{ name: "Shear", value: stressResults.shearStress, color: "#f59e0b" },
			{
				name: "Von Mises",
				value: stressResults.vonMisesStress,
				color: "#8b5cf6",
			},
			{ name: "Thermal", value: stressResults.thermalStress, color: "#ec4899" },
		];

		const material = materials[geometry.material];
		const maxStress = material.yieldStrength;
		const barHeight = 25;
		const barSpacing = 35;
		const startY = y + 50;

		stresses.forEach((stress, i) => {
			const barY = startY + i * barSpacing;
			const barWidth = (Math.abs(stress.value) / maxStress) * (width - 120);

			// Bar
			ctx.fillStyle = stress.color;
			ctx.fillRect(x + 80, barY, Math.max(barWidth, 2), barHeight);

			// Bar outline
			ctx.strokeStyle = "#374151";
			ctx.lineWidth = 1;
			ctx.strokeRect(x + 80, barY, Math.max(barWidth, 2), barHeight);

			// Label
			ctx.fillStyle = "#1f2937";
			ctx.font = "12px Arial";
			ctx.textAlign = "left";
			ctx.fillText(stress.name, x + 5, barY + 16);

			// Value
			ctx.textAlign = "right";
			ctx.fillText(`${stress.value.toFixed(1)} MPa`, x + width - 5, barY + 16);
		});

		// Yield strength line
		const yieldLineX = x + 80 + (width - 120);
		ctx.strokeStyle = "#dc2626";
		ctx.lineWidth = 2;
		ctx.setLineDash([3, 3]);
		ctx.beginPath();
		ctx.moveTo(yieldLineX, startY);
		ctx.lineTo(yieldLineX, startY + stresses.length * barSpacing);
		ctx.stroke();
		ctx.setLineDash([]);

		ctx.fillStyle = "#dc2626";
		ctx.font = "10px Arial";
		ctx.textAlign = "center";
		ctx.fillText("Yield", yieldLineX, startY - 5);

		// Safety factor
		const safetyY = startY + stresses.length * barSpacing + 20;
		ctx.fillStyle =
			stressResults.safetyFactor >= analysisSettings.safetyFactorTarget
				? "#059669"
				: "#dc2626";
		ctx.font = "14px Arial";
		ctx.textAlign = "center";
		ctx.fillText(
			`Safety Factor: ${stressResults.safetyFactor.toFixed(2)}`,
			x + width / 2,
			safetyY,
		);
	};

	const drawLoadingDiagram = (
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		width: number,
		height: number,
	) => {
		// Background
		ctx.fillStyle = "#f8fafc";
		ctx.fillRect(x, y, width, height);
		ctx.strokeStyle = "#e2e8f0";
		ctx.lineWidth = 1;
		ctx.strokeRect(x, y, width, height);

		// Title
		ctx.fillStyle = "#1e293b";
		ctx.font = "14px Arial";
		ctx.textAlign = "center";
		ctx.fillText("Loading Conditions", x + width / 2, y + 15);

		// Pipeline schematic
		const pipeY = y + height / 2;
		const pipeWidth = width - 60;
		const pipeHeight = 20;

		// Pipe
		ctx.fillStyle = "#94a3b8";
		ctx.fillRect(x + 30, pipeY - pipeHeight / 2, pipeWidth, pipeHeight);
		ctx.strokeStyle = "#475569";
		ctx.lineWidth = 2;
		ctx.strokeRect(x + 30, pipeY - pipeHeight / 2, pipeWidth, pipeHeight);

		// Internal pressure arrows
		if (loading.internalPressure > 0) {
			ctx.strokeStyle = "#ef4444";
			ctx.fillStyle = "#ef4444";
			ctx.lineWidth = 2;

			const numArrows = 5;
			for (let i = 0; i < numArrows; i++) {
				const arrowX = x + 40 + (i * (pipeWidth - 20)) / (numArrows - 1);

				// Upward arrow
				ctx.beginPath();
				ctx.moveTo(arrowX, pipeY - pipeHeight / 2);
				ctx.lineTo(arrowX, pipeY - pipeHeight / 2 - 15);
				ctx.stroke();

				ctx.beginPath();
				ctx.moveTo(arrowX, pipeY - pipeHeight / 2 - 15);
				ctx.lineTo(arrowX - 3, pipeY - pipeHeight / 2 - 10);
				ctx.lineTo(arrowX + 3, pipeY - pipeHeight / 2 - 10);
				ctx.closePath();
				ctx.fill();

				// Downward arrow
				ctx.beginPath();
				ctx.moveTo(arrowX, pipeY + pipeHeight / 2);
				ctx.lineTo(arrowX, pipeY + pipeHeight / 2 + 15);
				ctx.stroke();

				ctx.beginPath();
				ctx.moveTo(arrowX, pipeY + pipeHeight / 2 + 15);
				ctx.lineTo(arrowX - 3, pipeY + pipeHeight / 2 + 10);
				ctx.lineTo(arrowX + 3, pipeY + pipeHeight / 2 + 10);
				ctx.closePath();
				ctx.fill();
			}
		}

		// Axial force
		if (loading.axialForce !== 0) {
			ctx.strokeStyle = "#3b82f6";
			ctx.fillStyle = "#3b82f6";
			ctx.lineWidth = 2;

			const arrowDirection = loading.axialForce > 0 ? 1 : -1;
			const arrowStartX = arrowDirection > 0 ? x + 15 : x + width - 15;
			const arrowEndX = arrowDirection > 0 ? x + 30 : x + width - 30;

			ctx.beginPath();
			ctx.moveTo(arrowStartX, pipeY);
			ctx.lineTo(arrowEndX, pipeY);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(arrowEndX, pipeY);
			ctx.lineTo(arrowEndX - arrowDirection * 5, pipeY - 3);
			ctx.lineTo(arrowEndX - arrowDirection * 5, pipeY + 3);
			ctx.closePath();
			ctx.fill();
		}

		// Bending moment
		if (loading.bendingMoment !== 0) {
			ctx.strokeStyle = "#10b981";
			ctx.lineWidth = 2;

			const centerX = x + width / 2;
			const momentRadius = 25;

			ctx.beginPath();
			ctx.arc(centerX, pipeY - momentRadius, momentRadius, 0, PI);
			ctx.stroke();

			// Moment arrows
			ctx.fillStyle = "#10b981";
			ctx.beginPath();
			ctx.moveTo(centerX - momentRadius, pipeY - momentRadius);
			ctx.lineTo(centerX - momentRadius - 5, pipeY - momentRadius - 3);
			ctx.lineTo(centerX - momentRadius - 5, pipeY - momentRadius + 3);
			ctx.closePath();
			ctx.fill();
		}

		// Loading values
		ctx.fillStyle = "#1f2937";
		ctx.font = "10px Arial";
		ctx.textAlign = "left";

		const textStartY = y + 30;
		ctx.fillText(
			`P: ${loading.internalPressure.toFixed(1)} MPa`,
			x + 5,
			textStartY,
		);
		ctx.fillText(
			`F: ${loading.axialForce.toFixed(0)} kN`,
			x + 5,
			textStartY + 12,
		);
		ctx.fillText(
			`M: ${loading.bendingMoment.toFixed(0)} kN·m`,
			x + 5,
			textStartY + 24,
		);
		ctx.fillText(
			`T: ${loading.torsionalMoment.toFixed(0)} kN·m`,
			x + 5,
			textStartY + 36,
		);
	};

	const animate = () => {
		draw();
		animationRef.current = requestAnimationFrame(animate);
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (canvas) {
			canvas.width = 1000;
			canvas.height = 700;
		}

		const results = calculateStresses();
		setStressResults(results);
	}, [geometry, loading, analysisSettings]);

	useEffect(() => {
		animationRef.current = requestAnimationFrame(animate);
		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [stressResults, displaySettings]);

	const applyPipelinePreset = (preset: string) => {
		switch (preset) {
			case "gas_transmission":
				setGeometry({
					outerDiameter: 1067,
					wallThickness: 17.5,
					length: 1000,
					material: "carbon_steel",
				});
				setLoading({ ...loading, internalPressure: 7.0, temperature: 40 });
				break;
			case "oil_pipeline":
				setGeometry({
					outerDiameter: 508,
					wallThickness: 12.7,
					length: 500,
					material: "carbon_steel",
				});
				setLoading({ ...loading, internalPressure: 5.5, temperature: 60 });
				break;
			case "water_main":
				setGeometry({
					outerDiameter: 300,
					wallThickness: 8,
					length: 100,
					material: "steel",
				});
				setLoading({ ...loading, internalPressure: 1.6, temperature: 20 });
				break;
			case "chemical_process":
				setGeometry({
					outerDiameter: 150,
					wallThickness: 6,
					length: 50,
					material: "stainless",
				});
				setLoading({ ...loading, internalPressure: 4.0, temperature: 150 });
				break;
		}
	};

	return (
		<div className="w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
			<div className="bg-white rounded-xl shadow-lg p-6 mb-6">
				<div className="flex items-center gap-3 mb-6">
					<div className="w-3 h-3 bg-gradient-to-r from-slate-500 to-blue-500 rounded-full"></div>
					<h1 className="text-2xl font-bold text-gray-800">
						Pipeline Stress Analysis
					</h1>
					<div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
						Pipeline Engineering Tool
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
					{/* Visualization */}
					<div className="lg:col-span-3">
						<div className="bg-gray-50 rounded-lg p-4 mb-4">
							<canvas
								ref={canvasRef}
								className="border border-gray-300 rounded-lg bg-white w-full"
							/>
						</div>
					</div>

					{/* Controls */}
					<div className="space-y-4">
						{/* Pipeline Geometry */}
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Pipeline Geometry
							</h3>

							<div className="space-y-3">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Outer Diameter: {geometry.outerDiameter} mm
									</label>
									<input
										type="range"
										min="100"
										max="1500"
										step="25"
										value={geometry.outerDiameter}
										onChange={(e) =>
											setGeometry((prev) => ({
												...prev,
												outerDiameter: Number.parseInt(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Wall Thickness: {geometry.wallThickness.toFixed(1)} mm
									</label>
									<input
										type="range"
										min="3"
										max="50"
										step="0.5"
										value={geometry.wallThickness}
										onChange={(e) =>
											setGeometry((prev) => ({
												...prev,
												wallThickness: Number.parseFloat(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Material
									</label>
									<select
										value={geometry.material}
										onChange={(e) =>
											setGeometry((prev) => ({
												...prev,
												material: e.target.value as keyof typeof materials,
											}))
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									>
										{Object.entries(materials).map(([key, material]) => (
											<option key={key} value={key}>
												{material.name}
											</option>
										))}
									</select>
								</div>
							</div>

							<div className="mt-3">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Pipeline Presets
								</label>
								<div className="grid grid-cols-1 gap-2">
									{[
										{ key: "gas_transmission", name: "Gas Transmission" },
										{ key: "oil_pipeline", name: "Oil Pipeline" },
										{ key: "water_main", name: "Water Main" },
										{ key: "chemical_process", name: "Chemical Process" },
									].map((preset) => (
										<button
											key={preset.key}
											onClick={() => applyPipelinePreset(preset.key)}
											className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
										>
											{preset.name}
										</button>
									))}
								</div>
							</div>
						</div>

						{/* Loading Conditions */}
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Loading Conditions
							</h3>

							<div className="space-y-3">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Internal Pressure: {loading.internalPressure.toFixed(1)} MPa
									</label>
									<input
										type="range"
										min="0"
										max="15"
										step="0.1"
										value={loading.internalPressure}
										onChange={(e) =>
											setLoading((prev) => ({
												...prev,
												internalPressure: Number.parseFloat(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Axial Force: {loading.axialForce.toFixed(0)} kN
									</label>
									<input
										type="range"
										min="-1000"
										max="1000"
										step="50"
										value={loading.axialForce}
										onChange={(e) =>
											setLoading((prev) => ({
												...prev,
												axialForce: Number.parseFloat(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Bending Moment: {loading.bendingMoment.toFixed(0)} kN·m
									</label>
									<input
										type="range"
										min="0"
										max="500"
										step="10"
										value={loading.bendingMoment}
										onChange={(e) =>
											setLoading((prev) => ({
												...prev,
												bendingMoment: Number.parseFloat(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Temperature: {loading.temperature}°C
									</label>
									<input
										type="range"
										min="-40"
										max="200"
										step="5"
										value={loading.temperature}
										onChange={(e) =>
											setLoading((prev) => ({
												...prev,
												temperature: Number.parseInt(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>
							</div>
						</div>

						{/* Analysis Settings */}
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Analysis Settings
							</h3>

							<div className="space-y-3">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Design Code
									</label>
									<select
										value={analysisSettings.designCode}
										onChange={(e) =>
											setAnalysisSettings((prev) => ({
												...prev,
												designCode: e.target.value as keyof typeof designCodes,
											}))
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									>
										{Object.entries(designCodes).map(([key, code]) => (
											<option key={key} value={key}>
												{code.name}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Analysis Type
									</label>
									<select
										value={analysisSettings.analysisType}
										onChange={(e) =>
											setAnalysisSettings((prev) => ({
												...prev,
												analysisType: e.target.value as any,
											}))
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									>
										<option value="static">Static Analysis</option>
										<option value="fatigue">Fatigue Analysis</option>
										<option value="buckling">Buckling Analysis</option>
										<option value="thermal">Thermal Analysis</option>
										<option value="combined">Combined Loading</option>
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Target Safety Factor:{" "}
										{analysisSettings.safetyFactorTarget.toFixed(1)}
									</label>
									<input
										type="range"
										min="1.5"
										max="4.0"
										step="0.1"
										value={analysisSettings.safetyFactorTarget}
										onChange={(e) =>
											setAnalysisSettings((prev) => ({
												...prev,
												safetyFactorTarget: Number.parseFloat(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>
							</div>
						</div>

						{/* Material Properties */}
						{geometry.material && (
							<div className="bg-gray-50 rounded-lg p-4">
								<h3 className="text-lg font-semibold text-gray-800 mb-3">
									Material Properties
								</h3>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span>Yield Strength:</span>
										<span className="font-mono">
											{materials[geometry.material].yieldStrength} MPa
										</span>
									</div>
									<div className="flex justify-between">
										<span>Ultimate Strength:</span>
										<span className="font-mono">
											{materials[geometry.material].ultimateStrength} MPa
										</span>
									</div>
									<div className="flex justify-between">
										<span>Elastic Modulus:</span>
										<span className="font-mono">
											{materials[geometry.material].elasticModulus} GPa
										</span>
									</div>
									<div className="flex justify-between">
										<span>Allowable Stress:</span>
										<span className="font-mono">
											{materials[geometry.material].allowableStress} MPa
										</span>
									</div>
									<div className="flex justify-between">
										<span>Density:</span>
										<span className="font-mono">
											{materials[geometry.material].density} kg/m³
										</span>
									</div>
								</div>
							</div>
						)}

						{/* Critical Assessment */}
						{stressResults && (
							<div className="bg-gray-50 rounded-lg p-4">
								<h3 className="text-lg font-semibold text-gray-800 mb-3">
									Critical Assessment
								</h3>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span>Von Mises Stress:</span>
										<span
											className={`font-mono ${stressResults.vonMisesStress > materials[geometry.material].allowableStress ? "text-red-600" : "text-green-600"}`}
										>
											{stressResults.vonMisesStress.toFixed(1)} MPa
										</span>
									</div>
									<div className="flex justify-between">
										<span>Safety Factor:</span>
										<span
											className={`font-mono ${stressResults.safetyFactor < analysisSettings.safetyFactorTarget ? "text-red-600" : "text-green-600"}`}
										>
											{stressResults.safetyFactor.toFixed(2)}
										</span>
									</div>
									<div className="flex justify-between">
										<span>Buckling Pressure:</span>
										<span className="font-mono">
											{stressResults.bucklingPressure.toFixed(1)} MPa
										</span>
									</div>
									<div className="flex justify-between">
										<span>Status:</span>
										<span
											className={`font-mono ${
												stressResults.safetyFactor >=
												analysisSettings.safetyFactorTarget
													? "text-green-600"
													: stressResults.safetyFactor >= 1.5
														? "text-yellow-600"
														: "text-red-600"
											}`}
										>
											{stressResults.safetyFactor >=
											analysisSettings.safetyFactorTarget
												? "SAFE"
												: stressResults.safetyFactor >= 1.5
													? "CAUTION"
													: "UNSAFE"}
										</span>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				<div className="mt-6 bg-slate-50 rounded-lg p-4">
					<h3 className="text-lg font-semibold text-slate-800 mb-2">
						Pipeline Engineering Applications
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
						<div>
							<strong>Design Standards:</strong>
							<ul className="mt-1 space-y-1">
								<li>• ASME B31.3 Process Piping</li>
								<li>• ASME B31.4 Pipeline Transportation</li>
								<li>• API 5L Pipeline Specifications</li>
								<li>• EN 13480 Metallic Industrial Piping</li>
							</ul>
						</div>
						<div>
							<strong>Critical Assessments:</strong>
							<ul className="mt-1 space-y-1">
								<li>• Pressure vessel analysis</li>
								<li>• Fitness-for-service evaluation</li>
								<li>• Remaining life assessment</li>
								<li>• Integrity management programs</li>
							</ul>
						</div>
					</div>
					<div className="mt-4 text-center">
						<a
							href="/examples/engineering"
							className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
						>
							← Back to Engineering Examples
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}