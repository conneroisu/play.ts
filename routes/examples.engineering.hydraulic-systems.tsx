import { createFileRoute } from "@tanstack/react-router";
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

export const Route = createFileRoute("/examples/engineering/hydraulic-systems")(
	{
		component: HydraulicSystemsExample,
	},
);

interface HydraulicComponent {
	id: string;
	type:
		| "pump"
		| "motor"
		| "cylinder"
		| "valve"
		| "accumulator"
		| "filter"
		| "reservoir"
		| "relief_valve";
	x: number;
	y: number;
	properties: {
		displacement?: number; // cm³/rev
		pressure?: number; // bar
		flowRate?: number; // L/min
		efficiency?: number; // %
		strokeLength?: number; // mm
		bore?: number; // mm
		rod?: number; // mm
		crackingPressure?: number; // bar
		capacity?: number; // L
		filtrationRating?: number; // μm
	};
	isSelected: boolean;
}

interface FluidProperties {
	density: number; // kg/m³
	viscosity: number; // cSt
	bulkModulus: number; // bar
	temperature: number; // °C
	type: "mineral_oil" | "synthetic" | "water_glycol" | "phosphate_ester";
}

interface SystemAnalysis {
	totalPower: number; // kW
	systemEfficiency: number; // %
	pressureLoss: number; // bar
	flowRate: number; // L/min
	heatGeneration: number; // kW
	responseTime: number; // ms
	stabilityFactor: number;
}

interface PumpCharacteristics {
	displacement: number; // cm³/rev
	maxPressure: number; // bar
	maxSpeed: number; // rpm
	volumetricEfficiency: number; // %
	mechanicalEfficiency: number; // %
	speed: number; // rpm
	actualFlow: number; // L/min
	actualPower: number; // kW
}

interface CylinderAnalysis {
	extendForce: number; // N
	retractForce: number; // N
	extendSpeed: number; // mm/s
	retractSpeed: number; // mm/s
	extendTime: number; // s
	retractTime: number; // s
	powerRequired: number; // kW
	bucklingSafety: number;
}

interface SystemSettings {
	simulationSpeed: number;
	showPressureLines: boolean;
	showFlowDirections: boolean;
	showPowerLoss: boolean;
	showTemperature: boolean;
	realTimeAnalysis: boolean;
	pressureScale: number;
	flowScale: number;
	animationEnabled: boolean;
}

function HydraulicSystemsExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const timeRef = useRef<number>(0);

	const [components, setComponents] = useState<HydraulicComponent[]>([
		{
			id: "PUMP1",
			type: "pump",
			x: 100,
			y: 200,
			properties: {
				displacement: 56,
				pressure: 210,
				flowRate: 168,
				efficiency: 85,
			},
			isSelected: false,
		},
		{
			id: "CYL1",
			type: "cylinder",
			x: 400,
			y: 150,
			properties: {
				bore: 100,
				rod: 50,
				strokeLength: 500,
				pressure: 200,
			},
			isSelected: false,
		},
		{
			id: "VALVE1",
			type: "valve",
			x: 250,
			y: 200,
			properties: {
				flowRate: 150,
				pressureDrop: 5,
			},
			isSelected: false,
		},
	]);

	const [fluidProperties, setFluidProperties] = useState<FluidProperties>({
		density: 870, // kg/m³
		viscosity: 46, // cSt at 40°C
		bulkModulus: 1400, // bar
		temperature: 50, // °C
		type: "mineral_oil",
	});

	const [settings, setSettings] = useState<SystemSettings>({
		simulationSpeed: 1,
		showPressureLines: true,
		showFlowDirections: true,
		showPowerLoss: false,
		showTemperature: false,
		realTimeAnalysis: true,
		pressureScale: 1,
		flowScale: 1,
		animationEnabled: true,
	});

	const [systemType, setSystemType] = useState<
		"excavator" | "press" | "crane" | "injection_molding" | "custom"
	>("excavator");
	const [analysisResults, setAnalysisResults] = useState<SystemAnalysis | null>(
		null,
	);
	const [selectedComponent, setSelectedComponent] =
		useState<HydraulicComponent | null>(null);
	const [isSimulating, setIsSimulating] = useState(false);

	const fluidTypes = {
		mineral_oil: {
			name: "Mineral Oil (ISO 46)",
			density: 870,
			viscosity: 46,
			bulkModulus: 1400,
			tempRange: "-20 to 80°C",
		},
		synthetic: {
			name: "Synthetic Fluid",
			density: 850,
			viscosity: 32,
			bulkModulus: 1600,
			tempRange: "-40 to 120°C",
		},
		water_glycol: {
			name: "Water-Glycol",
			density: 1050,
			viscosity: 35,
			bulkModulus: 2000,
			tempRange: "-30 to 60°C",
		},
		phosphate_ester: {
			name: "Phosphate Ester",
			density: 1150,
			viscosity: 41,
			bulkModulus: 1300,
			tempRange: "-20 to 150°C",
		},
	};

	const calculatePumpPerformance = (
		pump: HydraulicComponent,
	): PumpCharacteristics => {
		const displacement = pump.properties.displacement || 56; // cm³/rev
		const pressure = pump.properties.pressure || 210; // bar
		const speed = 1800; // rpm (typical)
		const maxPressure = 350; // bar
		const maxSpeed = 2200; // rpm

		// Volumetric efficiency decreases with pressure
		const volEff = 95 - (pressure / maxPressure) * 10; // %

		// Mechanical efficiency
		const mechEff = 85 - (pressure / maxPressure) * 5; // %

		// Actual flow rate
		const theoreticalFlow = (displacement * speed) / 1000; // L/min
		const actualFlow = theoreticalFlow * (volEff / 100);

		// Power calculation
		const actualPower = (pressure * actualFlow) / (600 * (mechEff / 100)); // kW

		return {
			displacement,
			maxPressure,
			maxSpeed,
			volumetricEfficiency: volEff,
			mechanicalEfficiency: mechEff,
			speed,
			actualFlow,
			actualPower,
		};
	};

	const calculateCylinderPerformance = (
		cylinder: HydraulicComponent,
		systemPressure: number,
		flowRate: number,
	): CylinderAnalysis => {
		const bore = cylinder.properties.bore || 100; // mm
		const rod = cylinder.properties.rod || 50; // mm
		const stroke = cylinder.properties.strokeLength || 500; // mm

		// Areas
		const pistonArea = (Math.PI * (bore / 2) ** 2) / 100; // cm²
		const rodArea = (Math.PI * (rod / 2) ** 2) / 100; // cm²
		const annularArea = pistonArea - rodArea; // cm²

		// Forces
		const extendForce = (pistonArea * systemPressure * 100) / 10; // N (convert bar⋅cm² to N)
		const retractForce = (annularArea * systemPressure * 100) / 10; // N

		// Speeds (based on flow rate)
		const extendSpeed = (flowRate * 1000) / (pistonArea * 60); // mm/s
		const retractSpeed = (flowRate * 1000) / (annularArea * 60); // mm/s

		// Times
		const extendTime = stroke / extendSpeed; // s
		const retractTime = stroke / retractSpeed; // s

		// Power
		const powerRequired = (systemPressure * flowRate) / 600; // kW

		// Buckling analysis (simplified)
		const length = stroke + 200; // mm (add connection length)
		const momentOfInertia = (Math.PI * rod ** 4) / 64; // mm⁴
		const elasticModulus = 200000; // MPa (steel)
		const bucklingLoad =
			(Math.PI ** 2 * elasticModulus * momentOfInertia) / length ** 2; // N
		const bucklingSafety = bucklingLoad / extendForce;

		return {
			extendForce,
			retractForce,
			extendSpeed,
			retractSpeed,
			extendTime,
			retractTime,
			powerRequired,
			bucklingSafety,
		};
	};

	const calculatePressureLoss = (
		flowRate: number,
		pipeLength: number,
		pipeDiameter: number,
	): number => {
		// Darcy-Weisbach equation for pressure loss
		const velocity =
			(4 * flowRate) / (1000 * 60 * Math.PI * (pipeDiameter / 1000) ** 2); // m/s
		const reynoldsNumber =
			(fluidProperties.density * velocity * (pipeDiameter / 1000)) /
			(fluidProperties.viscosity * 1e-6);

		// Friction factor (Blasius equation for turbulent flow)
		const frictionFactor =
			reynoldsNumber > 2300
				? 0.316 / reynoldsNumber ** 0.25
				: 64 / reynoldsNumber;

		// Pressure loss in bar
		const pressureLoss =
			(frictionFactor * pipeLength * fluidProperties.density * velocity ** 2) /
			(2 * (pipeDiameter / 1000) * 100000);

		return Math.max(0, pressureLoss);
	};

	const calculateSystemEfficiency = (): number => {
		const pumps = components.filter((c) => c.type === "pump");
		const cylinders = components.filter((c) => c.type === "cylinder");
		const valves = components.filter((c) => c.type === "valve");

		let totalPowerInput = 0;
		let totalPowerOutput = 0;

		pumps.forEach((pump) => {
			const pumpPerf = calculatePumpPerformance(pump);
			totalPowerInput += pumpPerf.actualPower;
		});

		cylinders.forEach((cylinder) => {
			const pressure = cylinder.properties.pressure || 200;
			const flowRate = cylinder.properties.flowRate || 100;
			totalPowerOutput += (pressure * flowRate) / 600;
		});

		return totalPowerInput > 0 ? (totalPowerOutput / totalPowerInput) * 100 : 0;
	};

	const analyzeSystem = (): SystemAnalysis => {
		const pumps = components.filter((c) => c.type === "pump");
		const cylinders = components.filter((c) => c.type === "cylinder");
		const valves = components.filter((c) => c.type === "valve");

		let totalPower = 0;
		let totalFlow = 0;
		let totalPressureLoss = 0;
		let heatGeneration = 0;

		// Calculate pump power
		pumps.forEach((pump) => {
			const pumpPerf = calculatePumpPerformance(pump);
			totalPower += pumpPerf.actualPower;
			totalFlow += pumpPerf.actualFlow;
		});

		// Calculate pressure losses
		valves.forEach((valve) => {
			const flowRate = valve.properties.flowRate || 100;
			const pressureDrop = valve.properties.pressureDrop || 5;
			totalPressureLoss += pressureDrop;
		});

		// Calculate heat generation (inefficiencies)
		const systemEfficiency = calculateSystemEfficiency();
		heatGeneration = totalPower * (1 - systemEfficiency / 100);

		// Response time (simplified)
		const systemVolume = components.length * 0.5; // L (estimated)
		const responseTime = (systemVolume / totalFlow) * 60 * 1000; // ms

		// Stability factor (based on system characteristics)
		const stabilityFactor = Math.min(systemEfficiency / 50, 2.0);

		return {
			totalPower,
			systemEfficiency,
			pressureLoss: totalPressureLoss,
			flowRate: totalFlow,
			heatGeneration,
			responseTime,
			stabilityFactor,
		};
	};

	const applySystemPreset = (type: string) => {
		switch (type) {
			case "excavator":
				setComponents([
					{
						id: "PUMP1",
						type: "pump",
						x: 100,
						y: 200,
						properties: { displacement: 140, pressure: 350, efficiency: 90 },
						isSelected: false,
					},
					{
						id: "BOOM",
						type: "cylinder",
						x: 300,
						y: 100,
						properties: {
							bore: 120,
							rod: 70,
							strokeLength: 800,
							pressure: 320,
						},
						isSelected: false,
					},
					{
						id: "ARM",
						type: "cylinder",
						x: 400,
						y: 150,
						properties: {
							bore: 110,
							rod: 65,
							strokeLength: 600,
							pressure: 300,
						},
						isSelected: false,
					},
					{
						id: "BUCKET",
						type: "cylinder",
						x: 500,
						y: 200,
						properties: {
							bore: 100,
							rod: 60,
							strokeLength: 400,
							pressure: 280,
						},
						isSelected: false,
					},
					{
						id: "VALVE1",
						type: "valve",
						x: 200,
						y: 150,
						properties: { flowRate: 250, pressureDrop: 8 },
						isSelected: false,
					},
					{
						id: "RELIEF1",
						type: "relief_valve",
						x: 150,
						y: 120,
						properties: { crackingPressure: 350 },
						isSelected: false,
					},
				]);
				break;

			case "press":
				setComponents([
					{
						id: "PUMP1",
						type: "pump",
						x: 100,
						y: 200,
						properties: { displacement: 85, pressure: 250, efficiency: 88 },
						isSelected: false,
					},
					{
						id: "MAIN_CYL",
						type: "cylinder",
						x: 350,
						y: 150,
						properties: {
							bore: 200,
							rod: 120,
							strokeLength: 1000,
							pressure: 240,
						},
						isSelected: false,
					},
					{
						id: "VALVE1",
						type: "valve",
						x: 200,
						y: 200,
						properties: { flowRate: 180, pressureDrop: 6 },
						isSelected: false,
					},
					{
						id: "ACC1",
						type: "accumulator",
						x: 250,
						y: 120,
						properties: { capacity: 50, pressure: 210 },
						isSelected: false,
					},
				]);
				break;

			case "injection_molding":
				setComponents([
					{
						id: "PUMP1",
						type: "pump",
						x: 100,
						y: 200,
						properties: { displacement: 28, pressure: 140, efficiency: 85 },
						isSelected: false,
					},
					{
						id: "INJ_CYL",
						type: "cylinder",
						x: 300,
						y: 150,
						properties: { bore: 80, rod: 45, strokeLength: 300, pressure: 130 },
						isSelected: false,
					},
					{
						id: "CLAMP_CYL",
						type: "cylinder",
						x: 400,
						y: 200,
						properties: {
							bore: 150,
							rod: 90,
							strokeLength: 400,
							pressure: 120,
						},
						isSelected: false,
					},
					{
						id: "VALVE1",
						type: "valve",
						x: 200,
						y: 180,
						properties: { flowRate: 80, pressureDrop: 3 },
						isSelected: false,
					},
				]);
				break;
		}
	};

	const drawComponent = (
		ctx: CanvasRenderingContext2D,
		component: HydraulicComponent,
	) => {
		const { x, y, type, isSelected } = component;

		ctx.save();
		ctx.translate(x, y);

		if (isSelected) {
			ctx.strokeStyle = "red";
			ctx.lineWidth = 3;
		} else {
			ctx.strokeStyle = "black";
			ctx.lineWidth = 2;
		}

		ctx.fillStyle = isSelected
			? "rgba(255, 0, 0, 0.1)"
			: "rgba(59, 130, 246, 0.1)";

		switch (type) {
			case "pump":
				// Draw pump symbol (circle with arrow)
				ctx.beginPath();
				ctx.arc(0, 0, 25, 0, TWO_PI);
				ctx.fill();
				ctx.stroke();

				// Arrow indicating flow direction
				ctx.beginPath();
				ctx.moveTo(-10, 0);
				ctx.lineTo(10, 0);
				ctx.lineTo(7, -4);
				ctx.moveTo(10, 0);
				ctx.lineTo(7, 4);
				ctx.stroke();
				break;

			case "cylinder":
				// Draw cylinder symbol
				ctx.fillRect(-30, -15, 60, 30);
				ctx.strokeRect(-30, -15, 60, 30);

				// Piston rod
				ctx.fillRect(30, -5, 20, 10);
				ctx.strokeRect(30, -5, 20, 10);

				// Connection points
				ctx.beginPath();
				ctx.arc(-35, -10, 3, 0, TWO_PI);
				ctx.arc(-35, 10, 3, 0, TWO_PI);
				ctx.fill();
				break;

			case "valve":
				// Draw valve symbol (diamond)
				ctx.beginPath();
				ctx.moveTo(0, -20);
				ctx.lineTo(20, 0);
				ctx.lineTo(0, 20);
				ctx.lineTo(-20, 0);
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
				break;

			case "accumulator":
				// Draw accumulator symbol
				ctx.beginPath();
				ctx.arc(0, 0, 20, 0, TWO_PI);
				ctx.fill();
				ctx.stroke();

				// Gas section indicator
				ctx.beginPath();
				ctx.arc(0, -5, 12, 0, PI, true);
				ctx.stroke();
				break;

			case "relief_valve":
				// Draw relief valve symbol
				ctx.beginPath();
				ctx.moveTo(-15, -15);
				ctx.lineTo(15, -15);
				ctx.lineTo(0, 15);
				ctx.closePath();
				ctx.fill();
				ctx.stroke();

				// Spring symbol
				for (let i = 0; i < 5; i++) {
					ctx.beginPath();
					ctx.arc(0, -10 + i * 4, 2, 0, TWO_PI);
					ctx.stroke();
				}
				break;

			case "reservoir":
				// Draw reservoir (tank)
				ctx.fillRect(-25, -20, 50, 40);
				ctx.strokeRect(-25, -20, 50, 40);

				// Fluid level
				ctx.fillStyle = "rgba(0, 100, 200, 0.3)";
				ctx.fillRect(-23, -5, 46, 23);
				break;
		}

		// Component label
		ctx.fillStyle = isSelected ? "red" : "black";
		ctx.font = "10px Arial";
		ctx.textAlign = "center";
		ctx.fillText(component.id, 0, -35);

		// Show key properties
		if (type === "pump" && component.properties.displacement) {
			ctx.fillText(`${component.properties.displacement} cm³/rev`, 0, 45);
		}
		if (type === "cylinder" && component.properties.bore) {
			ctx.fillText(
				`⌀${component.properties.bore}/${component.properties.rod}`,
				0,
				45,
			);
		}

		ctx.restore();
	};

	const drawPressureLines = (ctx: CanvasRenderingContext2D) => {
		if (!settings.showPressureLines) return;

		// Draw high pressure lines in red, low pressure in blue
		components.forEach((comp, index) => {
			if (index < components.length - 1) {
				const nextComp = components[index + 1];
				const pressure = comp.properties.pressure || 0;

				// Color based on pressure
				const pressureRatio = pressure / 350; // Normalize to max pressure
				const hue = lerp(240, 0, pressureRatio); // Blue to red
				ctx.strokeStyle = toCssHsl(hsl(hue, 80, 50));
				ctx.lineWidth = Math.max(2, pressureRatio * 8);

				ctx.beginPath();
				ctx.moveTo(comp.x + 30, comp.y);
				ctx.lineTo(nextComp.x - 30, nextComp.y);
				ctx.stroke();

				// Flow direction arrow
				if (settings.showFlowDirections) {
					const midX = (comp.x + nextComp.x) / 2;
					const midY = (comp.y + nextComp.y) / 2;
					const angle = Math.atan2(nextComp.y - comp.y, nextComp.x - comp.x);

					ctx.save();
					ctx.translate(midX, midY);
					ctx.rotate(angle);
					ctx.strokeStyle = "black";
					ctx.lineWidth = 2;
					ctx.beginPath();
					ctx.moveTo(-8, -4);
					ctx.lineTo(0, 0);
					ctx.lineTo(-8, 4);
					ctx.stroke();
					ctx.restore();
				}
			}
		});
	};

	const draw = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;

		ctx.clearRect(0, 0, width, height);

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

		// Draw pressure lines
		drawPressureLines(ctx);

		// Draw components
		components.forEach((component) => drawComponent(ctx, component));

		// Draw system information
		if (analysisResults) {
			ctx.fillStyle = "black";
			ctx.font = "12px Arial";
			ctx.textAlign = "left";
			ctx.fillText(
				`System Power: ${analysisResults.totalPower.toFixed(1)} kW`,
				10,
				height - 80,
			);
			ctx.fillText(
				`Efficiency: ${analysisResults.systemEfficiency.toFixed(1)}%`,
				10,
				height - 60,
			);
			ctx.fillText(
				`Flow Rate: ${analysisResults.flowRate.toFixed(1)} L/min`,
				10,
				height - 40,
			);
			ctx.fillText(
				`Heat Generation: ${analysisResults.heatGeneration.toFixed(1)} kW`,
				10,
				height - 20,
			);
		}
	};

	const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		// Find clicked component
		const clickedComponent = components.find((comp) => {
			const dx = x - comp.x;
			const dy = y - comp.y;
			return Math.sqrt(dx * dx + dy * dy) < 30;
		});

		// Update selection
		setComponents((prev) =>
			prev.map((comp) => ({
				...comp,
				isSelected: comp.id === clickedComponent?.id,
			})),
		);
		setSelectedComponent(clickedComponent || null);
	};

	useEffect(() => {
		const analysis = analyzeSystem();
		setAnalysisResults(analysis);
	}, [components, fluidProperties]);

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
	}, [components, settings, analysisResults]);

	useEffect(() => {
		applySystemPreset(systemType);
	}, []);

	const formatValue = (value: number, unit: string): string => {
		if (value >= 1000) {
			return `${(value / 1000).toFixed(1)}k${unit}`;
		}
		return `${value.toFixed(1)}${unit}`;
	};

	return (
		<div className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-cyan-50 min-h-screen">
			<div className="bg-white rounded-xl shadow-lg p-6 mb-6">
				<div className="flex items-center gap-3 mb-6">
					<div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
					<h1 className="text-2xl font-bold text-gray-800">
						Hydraulic Systems Analysis
					</h1>
					<div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
						Fluid Power Engineering Tool
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2">
						<div className="bg-gray-50 rounded-lg p-4 mb-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-2">
								Hydraulic Circuit Diagram
							</h3>
							<canvas
								ref={canvasRef}
								width={700}
								height={500}
								className="border border-gray-300 rounded-lg bg-white w-full cursor-pointer"
								onClick={handleCanvasClick}
							/>
						</div>

						<div className="flex gap-2 mb-4">
							<button
								onClick={() => {
									const analysis = analyzeSystem();
									setAnalysisResults(analysis);
								}}
								className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
							>
								Analyze System
							</button>
							<button
								onClick={() => {
									setComponents([]);
									setAnalysisResults(null);
									setSelectedComponent(null);
								}}
								className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
							>
								Clear Circuit
							</button>
						</div>
					</div>

					<div className="space-y-4">
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								System Presets
							</h3>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Load System
							</label>
							<select
								value={systemType}
								onChange={(e) => {
									setSystemType(e.target.value as any);
									applySystemPreset(e.target.value);
								}}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
							>
								<option value="excavator">Excavator</option>
								<option value="press">Hydraulic Press</option>
								<option value="crane">Mobile Crane</option>
								<option value="injection_molding">Injection Molding</option>
								<option value="custom">Custom</option>
							</select>
						</div>

						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Fluid Properties
							</h3>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Fluid Type
							</label>
							<select
								value={fluidProperties.type}
								onChange={(e) => {
									const type = e.target.value as keyof typeof fluidTypes;
									setFluidProperties((prev) => ({
										...prev,
										type,
										density: fluidTypes[type].density,
										viscosity: fluidTypes[type].viscosity,
										bulkModulus: fluidTypes[type].bulkModulus,
									}));
								}}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
							>
								{Object.entries(fluidTypes).map(([key, fluid]) => (
									<option key={key} value={key}>
										{fluid.name}
									</option>
								))}
							</select>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Temperature: {fluidProperties.temperature}°C
							</label>
							<input
								type="range"
								min="20"
								max="120"
								step="5"
								value={fluidProperties.temperature}
								onChange={(e) =>
									setFluidProperties((prev) => ({
										...prev,
										temperature: Number.parseInt(e.target.value),
									}))
								}
								className="w-full mb-3"
							/>

							<div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
								<div>Density: {fluidProperties.density} kg/m³</div>
								<div>Viscosity: {fluidProperties.viscosity} cSt</div>
								<div>Bulk Modulus: {fluidProperties.bulkModulus} bar</div>
								<div>Range: {fluidTypes[fluidProperties.type].tempRange}</div>
							</div>
						</div>

						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Display Options
							</h3>

							<div className="space-y-2">
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={settings.showPressureLines}
										onChange={(e) =>
											setSettings((prev) => ({
												...prev,
												showPressureLines: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Pressure Lines
								</label>
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={settings.showFlowDirections}
										onChange={(e) =>
											setSettings((prev) => ({
												...prev,
												showFlowDirections: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Flow Directions
								</label>
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={settings.showPowerLoss}
										onChange={(e) =>
											setSettings((prev) => ({
												...prev,
												showPowerLoss: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Power Loss
								</label>
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={settings.showTemperature}
										onChange={(e) =>
											setSettings((prev) => ({
												...prev,
												showTemperature: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Temperature
								</label>
							</div>
						</div>

						{selectedComponent && (
							<div className="bg-gray-50 rounded-lg p-4">
								<h3 className="text-lg font-semibold text-gray-800 mb-3">
									Component Properties
								</h3>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span>ID:</span>
										<span className="font-mono">{selectedComponent.id}</span>
									</div>
									<div className="flex justify-between">
										<span>Type:</span>
										<span className="font-mono">{selectedComponent.type}</span>
									</div>

									{selectedComponent.type === "pump" && (
										<>
											<div className="flex justify-between">
												<span>Displacement:</span>
												<span className="font-mono">
													{selectedComponent.properties.displacement} cm³/rev
												</span>
											</div>
											<div className="flex justify-between">
												<span>Pressure:</span>
												<span className="font-mono">
													{selectedComponent.properties.pressure} bar
												</span>
											</div>
											<div className="flex justify-between">
												<span>Efficiency:</span>
												<span className="font-mono">
													{selectedComponent.properties.efficiency}%
												</span>
											</div>
										</>
									)}

									{selectedComponent.type === "cylinder" && (
										<>
											<div className="flex justify-between">
												<span>Bore:</span>
												<span className="font-mono">
													{selectedComponent.properties.bore} mm
												</span>
											</div>
											<div className="flex justify-between">
												<span>Rod:</span>
												<span className="font-mono">
													{selectedComponent.properties.rod} mm
												</span>
											</div>
											<div className="flex justify-between">
												<span>Stroke:</span>
												<span className="font-mono">
													{selectedComponent.properties.strokeLength} mm
												</span>
											</div>
										</>
									)}
								</div>
							</div>
						)}

						{analysisResults && (
							<div className="bg-gray-50 rounded-lg p-4">
								<h3 className="text-lg font-semibold text-gray-800 mb-3">
									System Analysis
								</h3>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span>Total Power:</span>
										<span className="font-mono">
											{analysisResults.totalPower.toFixed(1)} kW
										</span>
									</div>
									<div className="flex justify-between">
										<span>System Efficiency:</span>
										<span className="font-mono">
											{analysisResults.systemEfficiency.toFixed(1)}%
										</span>
									</div>
									<div className="flex justify-between">
										<span>Flow Rate:</span>
										<span className="font-mono">
											{analysisResults.flowRate.toFixed(1)} L/min
										</span>
									</div>
									<div className="flex justify-between">
										<span>Pressure Loss:</span>
										<span className="font-mono">
											{analysisResults.pressureLoss.toFixed(1)} bar
										</span>
									</div>
									<div className="flex justify-between">
										<span>Heat Generation:</span>
										<span className="font-mono">
											{analysisResults.heatGeneration.toFixed(1)} kW
										</span>
									</div>
									<div className="flex justify-between">
										<span>Response Time:</span>
										<span className="font-mono">
											{analysisResults.responseTime.toFixed(0)} ms
										</span>
									</div>
									<div className="flex justify-between">
										<span>Stability Factor:</span>
										<span className="font-mono">
											{analysisResults.stabilityFactor.toFixed(2)}
										</span>
									</div>
								</div>
							</div>
						)}

						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Component Library
							</h3>
							<div className="grid grid-cols-2 gap-2 text-sm">
								<div className="bg-white p-2 rounded border">
									<strong>Power:</strong>
									<ul className="mt-1 space-y-1">
										<li>• Pumps</li>
										<li>• Motors</li>
										<li>• Accumulators</li>
									</ul>
								</div>
								<div className="bg-white p-2 rounded border">
									<strong>Control:</strong>
									<ul className="mt-1 space-y-1">
										<li>• Directional Valves</li>
										<li>• Relief Valves</li>
										<li>• Flow Controls</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-6 bg-blue-50 rounded-lg p-4">
					<h3 className="text-lg font-semibold text-blue-800 mb-2">
						Fluid Power Engineering Applications
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
						<div>
							<strong>Industrial Applications:</strong>
							<ul className="mt-1 space-y-1">
								<li>• Manufacturing automation</li>
								<li>• Injection molding machines</li>
								<li>• Hydraulic presses</li>
								<li>• Material handling systems</li>
							</ul>
						</div>
						<div>
							<strong>Mobile Applications:</strong>
							<ul className="mt-1 space-y-1">
								<li>• Construction equipment</li>
								<li>• Agricultural machinery</li>
								<li>• Mining equipment</li>
								<li>• Aerospace actuators</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
