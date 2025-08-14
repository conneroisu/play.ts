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
import { Suspense, lazy, useEffect, useRef, useState } from "react";

// Loading component for better UX
const LoadingSpinner = () => (
	<div className="flex items-center justify-center min-h-screen">
		<div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500"></div>
		<span className="ml-4 text-lg text-gray-600">
			Loading Circuit Analysis...
		</span>
	</div>
);

export const Route = createFileRoute("/examples/engineering/circuit-analysis")({
	component: () => (
		<Suspense fallback={<LoadingSpinner />}>
			<CircuitAnalysisExample />
		</Suspense>
	),
});

interface Component {
	id: string;
	type:
		| "resistor"
		| "capacitor"
		| "inductor"
		| "voltage_source"
		| "current_source"
		| "diode"
		| "transistor";
	value: number;
	unit: string;
	x: number;
	y: number;
	rotation: number;
	node1: string;
	node2: string;
	node3?: string; // For 3-terminal devices
	isSelected: boolean;
}

interface Node {
	id: string;
	x: number;
	y: number;
	voltage: number;
	connections: string[];
}

interface Wire {
	id: string;
	fromNode: string;
	toNode: string;
	current: number;
	points: { x: number; y: number }[];
}

interface AnalysisResults {
	nodeVoltages: Map<string, number>;
	branchCurrents: Map<string, number>;
	power: Map<string, number>;
	totalPower: number;
	impedances: Map<string, { magnitude: number; phase: number }>;
	frequency: number;
	analysisType: "dc" | "ac" | "transient";
}

interface CircuitSettings {
	analysisType: "dc" | "ac" | "transient";
	frequency: number;
	timeStep: number;
	duration: number;
	tolerance: number;
	maxIterations: number;
	showVoltages: boolean;
	showCurrents: boolean;
	showPower: boolean;
	showGrid: boolean;
	gridSize: number;
	autoScale: boolean;
}

function CircuitAnalysisExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const timeRef = useRef<number>(0);

	const [components, setComponents] = useState<Component[]>([
		{
			id: "V1",
			type: "voltage_source",
			value: 12,
			unit: "V",
			x: 100,
			y: 200,
			rotation: 0,
			node1: "n1",
			node2: "gnd",
			isSelected: false,
		},
		{
			id: "R1",
			type: "resistor",
			value: 1000,
			unit: "Ω",
			x: 200,
			y: 150,
			rotation: 0,
			node1: "n1",
			node2: "n2",
			isSelected: false,
		},
		{
			id: "R2",
			type: "resistor",
			value: 2000,
			unit: "Ω",
			x: 300,
			y: 200,
			rotation: 90,
			node1: "n2",
			node2: "gnd",
			isSelected: false,
		},
		{
			id: "C1",
			type: "capacitor",
			value: 0.001,
			unit: "F",
			x: 400,
			y: 200,
			rotation: 90,
			node1: "n2",
			node2: "gnd",
			isSelected: false,
		},
	]);

	const [nodes, setNodes] = useState<Node[]>([
		{ id: "n1", x: 150, y: 150, voltage: 0, connections: [] },
		{ id: "n2", x: 250, y: 150, voltage: 0, connections: [] },
		{ id: "gnd", x: 200, y: 300, voltage: 0, connections: [] },
	]);

	const [wires, setWires] = useState<Wire[]>([]);
	const [selectedTool, setSelectedTool] = useState<
		Component["type"] | "select" | "wire"
	>("select");
	const [analysisResults, setAnalysisResults] =
		useState<AnalysisResults | null>(null);
	const [isSimulating, setIsSimulating] = useState(false);

	const [settings, setSettings] = useState<CircuitSettings>({
		analysisType: "dc",
		frequency: 1000,
		timeStep: 0.001,
		duration: 0.01,
		tolerance: 1e-6,
		maxIterations: 100,
		showVoltages: true,
		showCurrents: false,
		showPower: false,
		showGrid: true,
		gridSize: 25,
		autoScale: true,
	});

	const [presetCircuit, setPresetCircuit] = useState<
		| "voltage_divider"
		| "rc_filter"
		| "rlc_resonant"
		| "bridge"
		| "amplifier"
		| "custom"
	>("voltage_divider");

	const applyCircuitPreset = (type: string) => {
		switch (type) {
			case "voltage_divider":
				setComponents([
					{
						id: "V1",
						type: "voltage_source",
						value: 12,
						unit: "V",
						x: 100,
						y: 200,
						rotation: 0,
						node1: "n1",
						node2: "gnd",
						isSelected: false,
					},
					{
						id: "R1",
						type: "resistor",
						value: 1000,
						unit: "Ω",
						x: 200,
						y: 150,
						rotation: 0,
						node1: "n1",
						node2: "n2",
						isSelected: false,
					},
					{
						id: "R2",
						type: "resistor",
						value: 2000,
						unit: "Ω",
						x: 300,
						y: 200,
						rotation: 90,
						node1: "n2",
						node2: "gnd",
						isSelected: false,
					},
				]);
				setNodes([
					{ id: "n1", x: 150, y: 150, voltage: 0, connections: [] },
					{ id: "n2", x: 250, y: 150, voltage: 0, connections: [] },
					{ id: "gnd", x: 200, y: 300, voltage: 0, connections: [] },
				]);
				break;

			case "rc_filter":
				setComponents([
					{
						id: "V1",
						type: "voltage_source",
						value: 5,
						unit: "V",
						x: 100,
						y: 200,
						rotation: 0,
						node1: "n1",
						node2: "gnd",
						isSelected: false,
					},
					{
						id: "R1",
						type: "resistor",
						value: 1000,
						unit: "Ω",
						x: 200,
						y: 150,
						rotation: 0,
						node1: "n1",
						node2: "n2",
						isSelected: false,
					},
					{
						id: "C1",
						type: "capacitor",
						value: 0.000001,
						unit: "F",
						x: 300,
						y: 200,
						rotation: 90,
						node1: "n2",
						node2: "gnd",
						isSelected: false,
					},
				]);
				setNodes([
					{ id: "n1", x: 150, y: 150, voltage: 0, connections: [] },
					{ id: "n2", x: 250, y: 150, voltage: 0, connections: [] },
					{ id: "gnd", x: 200, y: 300, voltage: 0, connections: [] },
				]);
				setSettings((prev) => ({
					...prev,
					analysisType: "ac",
					frequency: 1000,
				}));
				break;

			case "rlc_resonant":
				setComponents([
					{
						id: "V1",
						type: "voltage_source",
						value: 10,
						unit: "V",
						x: 100,
						y: 200,
						rotation: 0,
						node1: "n1",
						node2: "gnd",
						isSelected: false,
					},
					{
						id: "R1",
						type: "resistor",
						value: 100,
						unit: "Ω",
						x: 200,
						y: 150,
						rotation: 0,
						node1: "n1",
						node2: "n2",
						isSelected: false,
					},
					{
						id: "L1",
						type: "inductor",
						value: 0.001,
						unit: "H",
						x: 300,
						y: 150,
						rotation: 0,
						node1: "n2",
						node2: "n3",
						isSelected: false,
					},
					{
						id: "C1",
						type: "capacitor",
						value: 0.000001,
						unit: "F",
						x: 400,
						y: 200,
						rotation: 90,
						node1: "n3",
						node2: "gnd",
						isSelected: false,
					},
				]);
				setNodes([
					{ id: "n1", x: 150, y: 150, voltage: 0, connections: [] },
					{ id: "n2", x: 250, y: 150, voltage: 0, connections: [] },
					{ id: "n3", x: 350, y: 150, voltage: 0, connections: [] },
					{ id: "gnd", x: 200, y: 300, voltage: 0, connections: [] },
				]);
				setSettings((prev) => ({
					...prev,
					analysisType: "ac",
					frequency: 5000,
				}));
				break;
		}
	};

	const calculateImpedance = (
		component: Component,
		frequency: number,
	): { magnitude: number; phase: number } => {
		const omega = 2 * PI * frequency;

		switch (component.type) {
			case "resistor":
				return { magnitude: component.value, phase: 0 };

			case "capacitor":
				const Xc = 1 / (omega * component.value);
				return { magnitude: Xc, phase: -90 };

			case "inductor":
				const Xl = omega * component.value;
				return { magnitude: Xl, phase: 90 };

			default:
				return { magnitude: 0, phase: 0 };
		}
	};

	const solveDCCircuit = async (): Promise<AnalysisResults> => {
		const nodeVoltages = new Map<string, number>();
		const branchCurrents = new Map<string, number>();
		const power = new Map<string, number>();
		const impedances = new Map<string, { magnitude: number; phase: number }>();

		// Find all unique nodes except ground
		const uniqueNodes = [
			...new Set(components.flatMap((c) => [c.node1, c.node2].filter(Boolean))),
		].filter((node) => node !== "gnd");

		const n = uniqueNodes.length;
		if (n === 0) {
			return {
				nodeVoltages,
				branchCurrents,
				power,
				totalPower: 0,
				impedances,
				frequency: 0,
				analysisType: "dc",
			};
		}

		// Add a small delay to prevent blocking
		await new Promise((resolve) => setTimeout(resolve, 0));

		// Initialize ground voltage
		nodeVoltages.set("gnd", 0);

		// For voltage sources, we need to handle them differently
		// First, identify voltage sources and set node voltages directly
		const voltageSources = components.filter(
			(c) => c.type === "voltage_source",
		);
		const handledNodes = new Set(["gnd"]);

		voltageSources.forEach((vs) => {
			if (vs.node2 === "gnd") {
				// Voltage source connected to ground
				nodeVoltages.set(vs.node1, vs.value);
				handledNodes.add(vs.node1);
			} else if (vs.node1 === "gnd") {
				// Reverse polarity
				nodeVoltages.set(vs.node2, -vs.value);
				handledNodes.add(vs.node2);
			}
		});

		// For simple circuits with voltage sources to ground, calculate other node voltages
		const remainingNodes = uniqueNodes.filter(
			(node) => !handledNodes.has(node),
		);

		if (remainingNodes.length > 0) {
			// Set up nodal analysis for remaining nodes
			const G = Array(remainingNodes.length)
				.fill(null)
				.map(() => Array(remainingNodes.length).fill(0));
			const I = Array(remainingNodes.length).fill(0);

			// Build conductance matrix
			components.forEach((component) => {
				if (component.type === "resistor") {
					const conductance = 1 / component.value;
					const node1Index = remainingNodes.indexOf(component.node1);
					const node2Index = remainingNodes.indexOf(component.node2);

					// Handle connections to known voltage nodes
					if (node1Index >= 0 && handledNodes.has(component.node2)) {
						G[node1Index][node1Index] += conductance;
						I[node1Index] +=
							conductance * (nodeVoltages.get(component.node2) || 0);
					} else if (node2Index >= 0 && handledNodes.has(component.node1)) {
						G[node2Index][node2Index] += conductance;
						I[node2Index] +=
							conductance * (nodeVoltages.get(component.node1) || 0);
					} else if (node1Index >= 0 && node2Index >= 0) {
						// Both nodes are unknown
						G[node1Index][node1Index] += conductance;
						G[node1Index][node2Index] -= conductance;
						G[node2Index][node2Index] += conductance;
						G[node2Index][node1Index] -= conductance;
					}
				}
			});

			// Solve using Gaussian elimination
			try {
				for (let i = 0; i < remainingNodes.length; i++) {
					// Find pivot
					let maxRow = i;
					for (let k = i + 1; k < remainingNodes.length; k++) {
						if (Math.abs(G[k][i]) > Math.abs(G[maxRow][i])) {
							maxRow = k;
						}
					}

					// Swap rows
					if (maxRow !== i) {
						[G[i], G[maxRow]] = [G[maxRow], G[i]];
						[I[i], I[maxRow]] = [I[maxRow], I[i]];
					}

					// Skip if pivot is too small
					if (Math.abs(G[i][i]) < 1e-10) continue;

					// Make all rows below this one 0 in current column
					for (let k = i + 1; k < remainingNodes.length; k++) {
						const factor = G[k][i] / G[i][i];
						I[k] -= factor * I[i];
						for (let j = i; j < remainingNodes.length; j++) {
							G[k][j] -= factor * G[i][j];
						}
					}
				}

				// Back substitution
				const voltages = Array(remainingNodes.length).fill(0);
				for (let i = remainingNodes.length - 1; i >= 0; i--) {
					voltages[i] = I[i];
					for (let j = i + 1; j < remainingNodes.length; j++) {
						voltages[i] -= G[i][j] * voltages[j];
					}
					if (Math.abs(G[i][i]) > 1e-10) {
						voltages[i] /= G[i][i];
					}
				}

				// Store results for remaining nodes
				remainingNodes.forEach((node, index) => {
					nodeVoltages.set(node, voltages[index] || 0);
				});
			} catch (error) {
				console.warn("Circuit analysis failed:", error);
				// Set default values for remaining nodes
				remainingNodes.forEach((node) => {
					nodeVoltages.set(node, 0);
				});
			}
		}

		// Calculate branch currents and power
		let totalPower = 0;
		components.forEach((component) => {
			const v1 = nodeVoltages.get(component.node1) || 0;
			const v2 = nodeVoltages.get(component.node2) || 0;
			const voltage = v1 - v2;

			let current = 0;
			let componentPower = 0;

			switch (component.type) {
				case "resistor":
					current = voltage / component.value;
					componentPower = current * voltage;
					break;
				case "voltage_source":
					// Current would need to be calculated from connected components
					current = 0;
					componentPower = 0;
					break;
				case "current_source":
					current = component.value;
					componentPower = current * voltage;
					break;
			}

			branchCurrents.set(component.id, current);
			power.set(component.id, componentPower);
			totalPower += Math.abs(componentPower);

			if (
				component.type !== "voltage_source" &&
				component.type !== "current_source"
			) {
				impedances.set(component.id, { magnitude: component.value, phase: 0 });
			}
		});

		return {
			nodeVoltages,
			branchCurrents,
			power,
			totalPower,
			impedances,
			frequency: 0,
			analysisType: "dc",
		};
	};

	const solveACCircuit = async (
		frequency: number,
	): Promise<AnalysisResults> => {
		// For AC analysis, we need complex number calculations
		// This is a simplified implementation
		const results = await solveDCCircuit(); // Use DC as base

		// Calculate impedances for AC components
		components.forEach((component) => {
			const impedance = calculateImpedance(component, frequency);
			results.impedances.set(component.id, impedance);
		});

		results.frequency = frequency;
		results.analysisType = "ac";

		return results;
	};

	const runAnalysis = async () => {
		setIsSimulating(true);

		try {
			let results: AnalysisResults;

			switch (settings.analysisType) {
				case "dc":
					results = await solveDCCircuit();
					break;
				case "ac":
					results = await solveACCircuit(settings.frequency);
					break;
				case "transient":
					results = await solveDCCircuit(); // Simplified - would need differential equation solver
					break;
				default:
					results = await solveDCCircuit();
			}

			setAnalysisResults(results);

			// Update node voltages for display
			setNodes((prevNodes) =>
				prevNodes.map((node) => ({
					...node,
					voltage: results.nodeVoltages.get(node.id) || 0,
				})),
			);
		} catch (error) {
			console.error("Circuit analysis failed:", error);
		} finally {
			setIsSimulating(false);
		}
	};

	const drawComponent = (
		ctx: CanvasRenderingContext2D,
		component: Component,
	) => {
		const { x, y, rotation, type, value, unit, isSelected } = component;

		ctx.save();
		ctx.translate(x, y);
		ctx.rotate((rotation * PI) / 180);

		if (isSelected) {
			ctx.strokeStyle = "red";
			ctx.lineWidth = 3;
		} else {
			ctx.strokeStyle = "black";
			ctx.lineWidth = 2;
		}

		switch (type) {
			case "resistor":
				// Draw zigzag resistor symbol
				ctx.beginPath();
				ctx.moveTo(-30, 0);
				ctx.lineTo(-20, 0);
				ctx.lineTo(-15, -10);
				ctx.lineTo(-5, 10);
				ctx.lineTo(5, -10);
				ctx.lineTo(15, 10);
				ctx.lineTo(20, 0);
				ctx.lineTo(30, 0);
				ctx.stroke();
				break;

			case "capacitor":
				// Draw parallel lines
				ctx.beginPath();
				ctx.moveTo(-30, 0);
				ctx.lineTo(-5, 0);
				ctx.moveTo(-5, -15);
				ctx.lineTo(-5, 15);
				ctx.moveTo(5, -15);
				ctx.lineTo(5, 15);
				ctx.moveTo(5, 0);
				ctx.lineTo(30, 0);
				ctx.stroke();
				break;

			case "inductor":
				// Draw coil symbol
				ctx.beginPath();
				ctx.moveTo(-30, 0);
				ctx.lineTo(-15, 0);
				for (let i = 0; i < 4; i++) {
					ctx.arc(-15 + i * 7.5, 0, 3.75, 0, PI, false);
				}
				ctx.moveTo(15, 0);
				ctx.lineTo(30, 0);
				ctx.stroke();
				break;

			case "voltage_source":
				// Draw circle with + and -
				ctx.beginPath();
				ctx.arc(0, 0, 15, 0, TWO_PI);
				ctx.stroke();
				ctx.font = "12px Arial";
				ctx.textAlign = "center";
				ctx.fillText("+", -5, -5);
				ctx.fillText("-", 5, 5);
				// Connection lines
				ctx.beginPath();
				ctx.moveTo(-30, 0);
				ctx.lineTo(-15, 0);
				ctx.moveTo(15, 0);
				ctx.lineTo(30, 0);
				ctx.stroke();
				break;

			case "current_source":
				// Draw circle with arrow
				ctx.beginPath();
				ctx.arc(0, 0, 15, 0, TWO_PI);
				ctx.stroke();
				// Arrow
				ctx.beginPath();
				ctx.moveTo(-8, 0);
				ctx.lineTo(8, 0);
				ctx.lineTo(5, -3);
				ctx.moveTo(8, 0);
				ctx.lineTo(5, 3);
				ctx.stroke();
				break;
		}

		// Draw component label and value
		ctx.fillStyle = isSelected ? "red" : "black";
		ctx.font = "10px Arial";
		ctx.textAlign = "center";
		ctx.fillText(`${component.id}`, 0, -25);
		ctx.fillText(`${value}${unit}`, 0, 40);

		ctx.restore();
	};

	const drawNode = (ctx: CanvasRenderingContext2D, node: Node) => {
		const { x, y, voltage, id } = node;

		// Draw node circle
		ctx.fillStyle = id === "gnd" ? "black" : "blue";
		ctx.beginPath();
		ctx.arc(x, y, 4, 0, TWO_PI);
		ctx.fill();

		// Draw voltage label if enabled
		if (settings.showVoltages && analysisResults) {
			ctx.fillStyle = "blue";
			ctx.font = "10px Arial";
			ctx.textAlign = "center";
			ctx.fillText(`${voltage.toFixed(2)}V`, x, y - 10);
		}

		// Draw node label
		ctx.fillStyle = "black";
		ctx.font = "8px Arial";
		ctx.fillText(id, x, y + 15);
	};

	const drawGrid = (
		ctx: CanvasRenderingContext2D,
		width: number,
		height: number,
	) => {
		if (!settings.showGrid) return;

		ctx.strokeStyle = "rgba(200, 200, 200, 0.3)";
		ctx.lineWidth = 1;

		for (let x = 0; x <= width; x += settings.gridSize) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, height);
			ctx.stroke();
		}

		for (let y = 0; y <= height; y += settings.gridSize) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(width, y);
			ctx.stroke();
		}
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
		drawGrid(ctx, width, height);

		// Draw wires first (so they appear behind components)
		wires.forEach((wire) => {
			ctx.strokeStyle = "gray";
			ctx.lineWidth = 2;
			ctx.beginPath();
			if (wire.points.length >= 2) {
				ctx.moveTo(wire.points[0].x, wire.points[0].y);
				for (let i = 1; i < wire.points.length; i++) {
					ctx.lineTo(wire.points[i].x, wire.points[i].y);
				}
			}
			ctx.stroke();

			// Draw current arrow if showing currents
			if (settings.showCurrents && analysisResults) {
				const current = analysisResults.branchCurrents.get(wire.id) || 0;
				if (Math.abs(current) > 0.001) {
					const midPoint = wire.points[Math.floor(wire.points.length / 2)];
					ctx.fillStyle = "green";
					ctx.font = "10px Arial";
					ctx.textAlign = "center";
					ctx.fillText(`${current.toFixed(3)}A`, midPoint.x, midPoint.y - 5);
				}
			}
		});

		// Draw components
		components.forEach((component) => drawComponent(ctx, component));

		// Draw nodes
		nodes.forEach((node) => drawNode(ctx, node));

		// Draw power information if enabled
		if (settings.showPower && analysisResults) {
			ctx.fillStyle = "purple";
			ctx.font = "12px Arial";
			ctx.textAlign = "left";
			ctx.fillText(
				`Total Power: ${analysisResults.totalPower.toFixed(3)} W`,
				10,
				height - 20,
			);
		}
	};

	const formatValue = (value: number, unit: string): string => {
		if (Math.abs(value) >= 1e6) {
			return `${(value / 1e6).toFixed(2)}M${unit}`;
		} else if (Math.abs(value) >= 1e3) {
			return `${(value / 1e3).toFixed(2)}k${unit}`;
		} else if (Math.abs(value) >= 1) {
			return `${value.toFixed(2)}${unit}`;
		} else if (Math.abs(value) >= 1e-3) {
			return `${(value * 1e3).toFixed(2)}m${unit}`;
		} else if (Math.abs(value) >= 1e-6) {
			return `${(value * 1e6).toFixed(2)}μ${unit}`;
		} else if (Math.abs(value) >= 1e-9) {
			return `${(value * 1e9).toFixed(2)}n${unit}`;
		} else {
			return `${(value * 1e12).toFixed(2)}p${unit}`;
		}
	};

	// Only render when data changes, not continuously
	useEffect(() => {
		draw();
	}, [components, nodes, wires, settings, analysisResults]);

	// Optional animation loop only when simulating
	useEffect(() => {
		if (!isSimulating) return;

		const animate = () => {
			draw();
			if (isSimulating) {
				animationRef.current = requestAnimationFrame(animate);
			}
		};
		animationRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [isSimulating]);

	useEffect(() => {
		applyCircuitPreset(presetCircuit);
	}, []);

	return (
		<div className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-yellow-50 to-orange-50 min-h-screen">
			<div className="bg-white rounded-xl shadow-lg p-6 mb-6">
				<div className="flex items-center gap-3 mb-6">
					<div className="w-3 h-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"></div>
					<h1 className="text-2xl font-bold text-gray-800">
						Circuit Analysis & Design
					</h1>
					<div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
						Electrical Engineering Tool
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2">
						<div className="bg-gray-50 rounded-lg p-4 mb-4">
							<canvas
								ref={canvasRef}
								width={700}
								height={500}
								className="border border-gray-300 rounded-lg bg-white w-full cursor-crosshair"
							/>
						</div>

						<div className="flex gap-2 mb-4">
							<button
								onClick={runAnalysis}
								disabled={isSimulating}
								className={`px-4 py-2 rounded-lg font-medium transition-all ${
									isSimulating
										? "bg-gray-400 cursor-not-allowed"
										: "bg-blue-500 hover:bg-blue-600 text-white"
								}`}
							>
								{isSimulating ? "Analyzing..." : "Analyze Circuit"}
							</button>
							<button
								onClick={() => {
									setComponents([]);
									setNodes([]);
									setWires([]);
									setAnalysisResults(null);
								}}
								disabled={isSimulating}
								className={`px-4 py-2 rounded-lg transition-all ${
									isSimulating
										? "bg-gray-400 cursor-not-allowed"
										: "bg-gray-500 hover:bg-gray-600 text-white"
								}`}
							>
								Clear Circuit
							</button>
						</div>
					</div>

					<div className="space-y-4">
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Circuit Presets
							</h3>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Load Circuit
							</label>
							<select
								value={presetCircuit}
								onChange={(e) => {
									setPresetCircuit(e.target.value as any);
									applyCircuitPreset(e.target.value);
								}}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-3"
							>
								<option value="voltage_divider">Voltage Divider</option>
								<option value="rc_filter">RC Low-Pass Filter</option>
								<option value="rlc_resonant">RLC Resonant Circuit</option>
								<option value="bridge">Wheatstone Bridge</option>
								<option value="amplifier">Op-Amp Circuit</option>
								<option value="custom">Custom</option>
							</select>
						</div>

						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Analysis Settings
							</h3>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Analysis Type
							</label>
							<select
								value={settings.analysisType}
								onChange={(e) =>
									setSettings((prev) => ({
										...prev,
										analysisType: e.target.value as any,
									}))
								}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-3"
							>
								<option value="dc">DC Analysis</option>
								<option value="ac">AC Analysis</option>
								<option value="transient">Transient Analysis</option>
							</select>

							{settings.analysisType === "ac" && (
								<>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Frequency: {formatValue(settings.frequency, "Hz")}
									</label>
									<input
										type="range"
										min="1"
										max="1000000"
										step="1"
										value={settings.frequency}
										onChange={(e) =>
											setSettings((prev) => ({
												...prev,
												frequency: Number.parseInt(e.target.value),
											}))
										}
										className="w-full mb-3"
									/>
								</>
							)}

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Tolerance: {settings.tolerance}
							</label>
							<input
								type="range"
								min="1e-9"
								max="1e-3"
								step="1e-9"
								value={settings.tolerance}
								onChange={(e) =>
									setSettings((prev) => ({
										...prev,
										tolerance: Number.parseFloat(e.target.value),
									}))
								}
								className="w-full"
							/>
						</div>

						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Display Options
							</h3>

							<div className="space-y-2">
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={settings.showVoltages}
										onChange={(e) =>
											setSettings((prev) => ({
												...prev,
												showVoltages: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Node Voltages
								</label>
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={settings.showCurrents}
										onChange={(e) =>
											setSettings((prev) => ({
												...prev,
												showCurrents: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Branch Currents
								</label>
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={settings.showPower}
										onChange={(e) =>
											setSettings((prev) => ({
												...prev,
												showPower: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Power Calculations
								</label>
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={settings.showGrid}
										onChange={(e) =>
											setSettings((prev) => ({
												...prev,
												showGrid: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Grid
								</label>
							</div>
						</div>

						{analysisResults && (
							<div className="bg-gray-50 rounded-lg p-4">
								<h3 className="text-lg font-semibold text-gray-800 mb-3">
									Analysis Results
								</h3>

								<div className="space-y-3">
									<div>
										<h4 className="font-medium text-gray-700 mb-2">
											Node Voltages
										</h4>
										<div className="space-y-1 text-sm">
											{Array.from(analysisResults.nodeVoltages.entries()).map(
												([node, voltage]) => (
													<div key={node} className="flex justify-between">
														<span>{node}:</span>
														<span className="font-mono">
															{voltage.toFixed(3)} V
														</span>
													</div>
												),
											)}
										</div>
									</div>

									<div>
										<h4 className="font-medium text-gray-700 mb-2">
											Branch Currents
										</h4>
										<div className="space-y-1 text-sm">
											{Array.from(analysisResults.branchCurrents.entries()).map(
												([branch, current]) => (
													<div key={branch} className="flex justify-between">
														<span>{branch}:</span>
														<span className="font-mono">
															{current.toFixed(6)} A
														</span>
													</div>
												),
											)}
										</div>
									</div>

									<div>
										<h4 className="font-medium text-gray-700 mb-2">
											Power Dissipation
										</h4>
										<div className="space-y-1 text-sm">
											{Array.from(analysisResults.power.entries()).map(
												([component, power]) => (
													<div key={component} className="flex justify-between">
														<span>{component}:</span>
														<span className="font-mono">
															{power.toFixed(6)} W
														</span>
													</div>
												),
											)}
											<div className="flex justify-between font-medium pt-2 border-t">
												<span>Total:</span>
												<span className="font-mono">
													{analysisResults.totalPower.toFixed(6)} W
												</span>
											</div>
										</div>
									</div>

									{settings.analysisType === "ac" && (
										<div>
											<h4 className="font-medium text-gray-700 mb-2">
												Impedances @{" "}
												{formatValue(analysisResults.frequency, "Hz")}
											</h4>
											<div className="space-y-1 text-sm">
												{Array.from(analysisResults.impedances.entries()).map(
													([component, impedance]) => (
														<div
															key={component}
															className="flex justify-between"
														>
															<span>{component}:</span>
															<span className="font-mono">
																{impedance.magnitude.toFixed(2)}Ω ∠
																{impedance.phase.toFixed(1)}°
															</span>
														</div>
													),
												)}
											</div>
										</div>
									)}
								</div>
							</div>
						)}

						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Component Library
							</h3>
							<div className="grid grid-cols-2 gap-2 text-sm">
								<div className="bg-white p-2 rounded border">
									<strong>Passive:</strong>
									<ul className="mt-1 space-y-1">
										<li>• Resistors (R)</li>
										<li>• Capacitors (C)</li>
										<li>• Inductors (L)</li>
									</ul>
								</div>
								<div className="bg-white p-2 rounded border">
									<strong>Sources:</strong>
									<ul className="mt-1 space-y-1">
										<li>• Voltage Source (V)</li>
										<li>• Current Source (I)</li>
										<li>• AC Sources</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-6 bg-yellow-50 rounded-lg p-4">
					<h3 className="text-lg font-semibold text-yellow-800 mb-2">
						Electrical Engineering Applications
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-700">
						<div>
							<strong>Circuit Design:</strong>
							<ul className="mt-1 space-y-1">
								<li>• Filter design and analysis</li>
								<li>• Power supply circuits</li>
								<li>• Amplifier design</li>
								<li>• Impedance matching</li>
							</ul>
						</div>
						<div>
							<strong>Educational & Analysis:</strong>
							<ul className="mt-1 space-y-1">
								<li>• Circuit theory validation</li>
								<li>• Frequency response analysis</li>
								<li>• Node and mesh analysis</li>
								<li>• Component selection</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
