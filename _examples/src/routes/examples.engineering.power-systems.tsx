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

export const Route = createFileRoute("/examples/engineering/power-systems")({
	component: PowerSystemsExample,
});

interface Bus {
	id: string;
	name: string;
	type: "slack" | "PV" | "PQ";
	x: number;
	y: number;
	voltage: { magnitude: number; angle: number };
	power: { real: number; reactive: number };
	baseKV: number;
	isSelected: boolean;
}

interface TransmissionLine {
	id: string;
	fromBus: string;
	toBus: string;
	resistance: number; // pu
	reactance: number; // pu
	susceptance: number; // pu
	rating: number; // MVA
	current: { magnitude: number; angle: number };
	power: { real: number; reactive: number };
}

interface Generator {
	id: string;
	busId: string;
	capacity: number; // MW
	voltage: number; // kV
	powerFactor: number;
	status: "online" | "offline" | "maintenance";
	efficiency: number;
}

interface Load {
	id: string;
	busId: string;
	realPower: number; // MW
	reactivePower: number; // MVAr
	loadFactor: number;
	priority: "critical" | "high" | "medium" | "low";
}

interface FaultAnalysis {
	busId: string;
	faultType: "three-phase" | "line-to-ground" | "line-to-line";
	faultCurrent: number;
	voltageProfile: { busId: string; voltage: number }[];
}

function PowerSystemsExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const phasorCanvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const timeRef = useRef<number>(0);

	const [buses, setBuses] = useState<Bus[]>([
		{
			id: "bus1",
			name: "Generation",
			type: "slack",
			x: 100,
			y: 200,
			voltage: { magnitude: 1.0, angle: 0 },
			power: { real: 0, reactive: 0 },
			baseKV: 138,
			isSelected: false,
		},
		{
			id: "bus2",
			name: "Transmission",
			type: "PV",
			x: 300,
			y: 150,
			voltage: { magnitude: 1.02, angle: -2 },
			power: { real: 50, reactive: 0 },
			baseKV: 138,
			isSelected: false,
		},
		{
			id: "bus3",
			name: "Distribution",
			type: "PQ",
			x: 500,
			y: 200,
			voltage: { magnitude: 0.98, angle: -5 },
			power: { real: -30, reactive: -10 },
			baseKV: 69,
			isSelected: false,
		},
		{
			id: "bus4",
			name: "Industrial",
			type: "PQ",
			x: 400,
			y: 350,
			voltage: { magnitude: 0.95, angle: -8 },
			power: { real: -40, reactive: -15 },
			baseKV: 69,
			isSelected: false,
		},
	]);

	const [lines, setLines] = useState<TransmissionLine[]>([
		{
			id: "line1",
			fromBus: "bus1",
			toBus: "bus2",
			resistance: 0.02,
			reactance: 0.08,
			susceptance: 0.005,
			rating: 100,
			current: { magnitude: 0, angle: 0 },
			power: { real: 0, reactive: 0 },
		},
		{
			id: "line2",
			fromBus: "bus2",
			toBus: "bus3",
			resistance: 0.03,
			reactance: 0.12,
			susceptance: 0.008,
			rating: 80,
			current: { magnitude: 0, angle: 0 },
			power: { real: 0, reactive: 0 },
		},
		{
			id: "line3",
			fromBus: "bus2",
			toBus: "bus4",
			resistance: 0.025,
			reactance: 0.1,
			susceptance: 0.006,
			rating: 90,
			current: { magnitude: 0, angle: 0 },
			power: { real: 0, reactive: 0 },
		},
		{
			id: "line4",
			fromBus: "bus3",
			toBus: "bus4",
			resistance: 0.015,
			reactance: 0.06,
			susceptance: 0.004,
			rating: 60,
			current: { magnitude: 0, angle: 0 },
			power: { real: 0, reactive: 0 },
		},
	]);

	const [generators, setGenerators] = useState<Generator[]>([
		{
			id: "gen1",
			busId: "bus1",
			capacity: 100,
			voltage: 138,
			powerFactor: 0.85,
			status: "online",
			efficiency: 0.92,
		},
		{
			id: "gen2",
			busId: "bus2",
			capacity: 75,
			voltage: 138,
			powerFactor: 0.9,
			status: "online",
			efficiency: 0.88,
		},
	]);

	const [loads, setLoads] = useState<Load[]>([
		{
			id: "load1",
			busId: "bus3",
			realPower: 30,
			reactivePower: 10,
			loadFactor: 0.8,
			priority: "high",
		},
		{
			id: "load2",
			busId: "bus4",
			realPower: 40,
			reactivePower: 15,
			loadFactor: 0.75,
			priority: "critical",
		},
	]);

	const [analysisMode, setAnalysisMode] = useState<
		"load-flow" | "fault-analysis" | "stability" | "phasor"
	>("load-flow");
	const [isRealTime, setIsRealTime] = useState(false);
	const [faultBus, setFaultBus] = useState<string>("");
	const [faultType, setFaultType] = useState<
		"three-phase" | "line-to-ground" | "line-to-line"
	>("three-phase");

	const [systemMetrics, setSystemMetrics] = useState({
		totalGeneration: 0,
		totalLoad: 0,
		losses: 0,
		frequency: 60.0,
		stability: "stable" as "stable" | "marginal" | "unstable",
	});

	// Newton-Raphson Load Flow Analysis
	const performLoadFlow = () => {
		const n = buses.length;
		const tolerance = 1e-6;
		const maxIterations = 20;

		// Build admittance matrix
		const Y = Array(n)
			.fill(null)
			.map(() => Array(n).fill({ real: 0, imag: 0 }));

		// Add line admittances
		lines.forEach((line) => {
			const fromIndex = buses.findIndex((bus) => bus.id === line.fromBus);
			const toIndex = buses.findIndex((bus) => bus.id === line.toBus);

			if (fromIndex !== -1 && toIndex !== -1) {
				const admittance = {
					real:
						line.resistance /
						(line.resistance * line.resistance +
							line.reactance * line.reactance),
					imag:
						-line.reactance /
						(line.resistance * line.resistance +
							line.reactance * line.reactance),
				};

				// Diagonal elements (self-admittance)
				Y[fromIndex][fromIndex] = {
					real: Y[fromIndex][fromIndex].real + admittance.real,
					imag:
						Y[fromIndex][fromIndex].imag +
						admittance.imag +
						line.susceptance / 2,
				};
				Y[toIndex][toIndex] = {
					real: Y[toIndex][toIndex].real + admittance.real,
					imag:
						Y[toIndex][toIndex].imag + admittance.imag + line.susceptance / 2,
				};

				// Off-diagonal elements (mutual admittance)
				Y[fromIndex][toIndex] = {
					real: Y[fromIndex][toIndex].real - admittance.real,
					imag: Y[fromIndex][toIndex].imag - admittance.imag,
				};
				Y[toIndex][fromIndex] = {
					real: Y[toIndex][fromIndex].real - admittance.real,
					imag: Y[toIndex][fromIndex].imag - admittance.imag,
				};
			}
		});

		// Calculate power flows (simplified)
		const updatedBuses = buses.map((bus, i) => {
			const calculatedPower = { real: 0, reactive: 0 };

			for (let j = 0; j < n; j++) {
				const V_i = bus.voltage.magnitude;
				const V_j = buses[j].voltage.magnitude;
				const theta_ij =
					((bus.voltage.angle - buses[j].voltage.angle) * PI) / 180;

				const G_ij = Y[i][j].real;
				const B_ij = Y[i][j].imag;

				calculatedPower.real +=
					V_i * V_j * (G_ij * cos(theta_ij) + B_ij * sin(theta_ij));
				calculatedPower.reactive +=
					V_i * V_j * (G_ij * sin(theta_ij) - B_ij * cos(theta_ij));
			}

			return {
				...bus,
				power: calculatedPower,
			};
		});

		setBuses(updatedBuses);

		// Calculate line flows
		const updatedLines = lines.map((line) => {
			const fromBus = updatedBuses.find((bus) => bus.id === line.fromBus);
			const toBus = updatedBuses.find((bus) => bus.id === line.toBus);

			if (fromBus && toBus) {
				const V_from = fromBus.voltage.magnitude;
				const V_to = toBus.voltage.magnitude;
				const theta =
					((fromBus.voltage.angle - toBus.voltage.angle) * PI) / 180;

				const impedance = Math.sqrt(
					line.resistance * line.resistance + line.reactance * line.reactance,
				);
				const current = Math.abs(V_from - V_to * cos(theta)) / impedance;

				const powerFlow = {
					real: (V_from * V_to * cos(theta)) / impedance,
					reactive: (V_from * V_to * sin(theta)) / impedance,
				};

				return {
					...line,
					current: { magnitude: current, angle: 0 },
					power: powerFlow,
				};
			}
			return line;
		});

		setLines(updatedLines);

		// Update system metrics
		const totalGen = generators.reduce(
			(sum, gen) => (gen.status === "online" ? sum + gen.capacity : sum),
			0,
		);
		const totalLoad = loads.reduce((sum, load) => sum + load.realPower, 0);
		const losses = updatedLines.reduce(
			(sum, line) => sum + Math.abs(line.power.real) * 0.02,
			0,
		);

		setSystemMetrics({
			totalGeneration: totalGen,
			totalLoad: totalLoad,
			losses: losses,
			frequency: 60.0 + randomFloat(-0.1, 0.1),
			stability: losses < 5 ? "stable" : losses < 10 ? "marginal" : "unstable",
		});
	};

	// Fault Analysis
	const performFaultAnalysis = (
		busId: string,
		type: string,
	): FaultAnalysis | null => {
		const bus = buses.find((b) => b.id === busId);
		if (!bus) return null;

		// Simplified fault current calculation
		const baseImpedance = 10; // Base system impedance
		const faultImpedance =
			type === "three-phase" ? 0.1 : type === "line-to-ground" ? 0.2 : 0.15;
		const faultCurrent =
			bus.voltage.magnitude / (baseImpedance + faultImpedance);

		// Calculate voltage profile during fault
		const voltageProfile = buses.map((b) => ({
			busId: b.id,
			voltage:
				b.id === busId
					? 0.1
					: b.voltage.magnitude *
						(1 - 0.3 * Math.exp(-Math.abs(b.x - bus.x) / 100)),
		}));

		return {
			busId,
			faultType: type as any,
			faultCurrent,
			voltageProfile,
		};
	};

	const renderPowerSystem = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw background
		ctx.fillStyle = "#f8fafc";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Draw transmission lines
		lines.forEach((line) => {
			const fromBus = buses.find((bus) => bus.id === line.fromBus);
			const toBus = buses.find((bus) => bus.id === line.toBus);

			if (fromBus && toBus) {
				// Line color based on loading
				const loading = Math.abs(line.power.real) / line.rating;
				let lineColor = "#4ade80"; // Green for normal
				if (loading > 0.8)
					lineColor = "#f87171"; // Red for overload
				else if (loading > 0.6) lineColor = "#fbbf24"; // Yellow for high load

				ctx.strokeStyle = lineColor;
				ctx.lineWidth = 3 + loading * 2;
				ctx.beginPath();
				ctx.moveTo(fromBus.x, fromBus.y);
				ctx.lineTo(toBus.x, toBus.y);
				ctx.stroke();

				// Draw power flow arrows
				const midX = (fromBus.x + toBus.x) / 2;
				const midY = (fromBus.y + toBus.y) / 2;
				const angle = Math.atan2(toBus.y - fromBus.y, toBus.x - fromBus.x);

				if (Math.abs(line.power.real) > 1) {
					ctx.fillStyle = lineColor;
					ctx.save();
					ctx.translate(midX, midY);
					ctx.rotate(angle);
					ctx.beginPath();
					ctx.moveTo(-5, -3);
					ctx.lineTo(5, 0);
					ctx.lineTo(-5, 3);
					ctx.closePath();
					ctx.fill();
					ctx.restore();
				}

				// Line labels
				ctx.fillStyle = "#374151";
				ctx.font = "12px Arial";
				ctx.textAlign = "center";
				ctx.fillText(
					`${Math.abs(line.power.real).toFixed(1)} MW`,
					midX,
					midY - 10,
				);
				ctx.fillText(`${(loading * 100).toFixed(0)}%`, midX, midY + 15);
			}
		});

		// Draw buses
		buses.forEach((bus) => {
			let busColor = "#3b82f6"; // Blue for PQ
			if (bus.type === "slack")
				busColor = "#10b981"; // Green for slack
			else if (bus.type === "PV") busColor = "#f59e0b"; // Orange for PV

			// Bus voltage affects size
			const voltageLevel = bus.voltage.magnitude;
			const busSize = 15 + voltageLevel * 5;

			ctx.fillStyle = busColor;
			ctx.beginPath();
			ctx.arc(bus.x, bus.y, busSize, 0, TWO_PI);
			ctx.fill();

			// Bus outline
			ctx.strokeStyle = bus.isSelected ? "#ef4444" : "#1f2937";
			ctx.lineWidth = bus.isSelected ? 3 : 2;
			ctx.stroke();

			// Bus labels
			ctx.fillStyle = "#1f2937";
			ctx.font = "bold 14px Arial";
			ctx.textAlign = "center";
			ctx.fillText(bus.name, bus.x, bus.y - busSize - 5);

			ctx.font = "12px Arial";
			ctx.fillText(
				`${bus.voltage.magnitude.toFixed(3)} pu`,
				bus.x,
				bus.y + busSize + 15,
			);
			ctx.fillText(
				`∠${bus.voltage.angle.toFixed(1)}°`,
				bus.x,
				bus.y + busSize + 30,
			);
			ctx.fillText(`${bus.baseKV} kV`, bus.x, bus.y + busSize + 45);
		});

		// Draw generators
		generators.forEach((gen) => {
			const bus = buses.find((b) => b.id === gen.busId);
			if (bus && gen.status === "online") {
				ctx.fillStyle = gen.status === "online" ? "#10b981" : "#6b7280";
				ctx.beginPath();
				ctx.arc(bus.x - 25, bus.y - 25, 8, 0, TWO_PI);
				ctx.fill();

				ctx.fillStyle = "#1f2937";
				ctx.font = "10px Arial";
				ctx.textAlign = "center";
				ctx.fillText("G", bus.x - 25, bus.y - 22);
				ctx.fillText(`${gen.capacity}MW`, bus.x - 25, bus.y - 35);
			}
		});

		// Draw loads
		loads.forEach((load) => {
			const bus = buses.find((b) => b.id === load.busId);
			if (bus) {
				const loadColor =
					load.priority === "critical"
						? "#ef4444"
						: load.priority === "high"
							? "#f59e0b"
							: "#6b7280";

				ctx.fillStyle = loadColor;
				ctx.beginPath();
				ctx.rect(bus.x + 15, bus.y - 30, 20, 15);
				ctx.fill();

				ctx.fillStyle = "#1f2937";
				ctx.font = "10px Arial";
				ctx.textAlign = "center";
				ctx.fillText("L", bus.x + 25, bus.y - 22);
				ctx.fillText(`${load.realPower}MW`, bus.x + 25, bus.y - 35);
			}
		});

		// Draw fault indication if in fault analysis mode
		if (analysisMode === "fault-analysis" && faultBus) {
			const bus = buses.find((b) => b.id === faultBus);
			if (bus) {
				ctx.strokeStyle = "#dc2626";
				ctx.lineWidth = 4;
				ctx.setLineDash([5, 5]);
				ctx.beginPath();
				ctx.arc(bus.x, bus.y, 25, 0, TWO_PI);
				ctx.stroke();
				ctx.setLineDash([]);

				ctx.fillStyle = "#dc2626";
				ctx.font = "bold 12px Arial";
				ctx.textAlign = "center";
				ctx.fillText("FAULT", bus.x, bus.y + 40);
			}
		}
	};

	const renderPhasorDiagram = () => {
		const canvas = phasorCanvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw background
		ctx.fillStyle = "#f8fafc";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		const scale = 100;

		// Draw coordinate system
		ctx.strokeStyle = "#e5e7eb";
		ctx.lineWidth = 1;

		// Grid circles
		for (let r = 50; r <= 150; r += 50) {
			ctx.beginPath();
			ctx.arc(centerX, centerY, r, 0, TWO_PI);
			ctx.stroke();
		}

		// Axes
		ctx.strokeStyle = "#374151";
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(centerX - 200, centerY);
		ctx.lineTo(centerX + 200, centerY);
		ctx.moveTo(centerX, centerY - 200);
		ctx.lineTo(centerX, centerY + 200);
		ctx.stroke();

		// Draw voltage phasors
		buses.forEach((bus, index) => {
			const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b"];
			const magnitude = bus.voltage.magnitude * scale;
			const angle = (bus.voltage.angle * PI) / 180;

			const endX = centerX + magnitude * cos(angle);
			const endY = centerY - magnitude * sin(angle); // Negative for correct orientation

			ctx.strokeStyle = colors[index % colors.length];
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.moveTo(centerX, centerY);
			ctx.lineTo(endX, endY);
			ctx.stroke();

			// Arrow head
			ctx.fillStyle = colors[index % colors.length];
			ctx.save();
			ctx.translate(endX, endY);
			ctx.rotate(angle);
			ctx.beginPath();
			ctx.moveTo(-8, -4);
			ctx.lineTo(0, 0);
			ctx.lineTo(-8, 4);
			ctx.closePath();
			ctx.fill();
			ctx.restore();

			// Labels
			ctx.fillStyle = "#1f2937";
			ctx.font = "12px Arial";
			ctx.textAlign = "left";
			ctx.fillText(
				`${bus.name}: ${bus.voltage.magnitude.toFixed(3)}∠${bus.voltage.angle.toFixed(1)}°`,
				endX + 10,
				endY,
			);
		});

		// Labels
		ctx.fillStyle = "#1f2937";
		ctx.font = "bold 14px Arial";
		ctx.textAlign = "center";
		ctx.fillText("Voltage Phasor Diagram", centerX, 30);

		ctx.font = "12px Arial";
		ctx.fillText("Real (pu)", centerX + 180, centerY + 15);
		ctx.save();
		ctx.translate(centerX - 15, centerY - 180);
		ctx.rotate(-PI / 2);
		ctx.fillText("Imaginary (pu)", 0, 0);
		ctx.restore();
	};

	const animate = () => {
		timeRef.current += 0.02;

		if (analysisMode === "load-flow" || analysisMode === "stability") {
			performLoadFlow();
		}

		renderPowerSystem();

		if (analysisMode === "phasor") {
			renderPhasorDiagram();
		}

		if (isRealTime) {
			animationRef.current = requestAnimationFrame(animate);
		}
	};

	const handleBusClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		const clickedBus = buses.find((bus) => {
			const distance = Math.sqrt((x - bus.x) ** 2 + (y - bus.y) ** 2);
			return distance <= 20;
		});

		if (clickedBus) {
			setBuses(
				buses.map((bus) => ({
					...bus,
					isSelected: bus.id === clickedBus.id ? !bus.isSelected : false,
				})),
			);

			if (analysisMode === "fault-analysis") {
				setFaultBus(clickedBus.id);
			}
		}
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		const phasorCanvas = phasorCanvasRef.current;
		if (!canvas || !phasorCanvas) return;

		canvas.width = 800;
		canvas.height = 600;
		phasorCanvas.width = 400;
		phasorCanvas.height = 400;

		animate();
	}, []);

	useEffect(() => {
		if (!isRealTime) {
			animate();
		}
	}, [buses, lines, analysisMode, faultBus, faultType]);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">Power Systems Analysis</h1>
				<p className="text-gray-600 mb-4">
					Comprehensive power systems analysis including load flow, fault
					analysis, and system stability visualization.
				</p>
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<p className="text-yellow-800">
						⚡ Interactive power grid analysis with real-time monitoring and
						fault simulation capabilities
					</p>
				</div>
			</div>

			{/* Control Panel */}
			<div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Analysis Mode
						</label>
						<select
							value={analysisMode}
							onChange={(e) =>
								setAnalysisMode(e.target.value as typeof analysisMode)
							}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
						>
							<option value="load-flow">Load Flow</option>
							<option value="fault-analysis">Fault Analysis</option>
							<option value="stability">Stability Analysis</option>
							<option value="phasor">Phasor Diagram</option>
						</select>
					</div>

					{analysisMode === "fault-analysis" && (
						<>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Fault Bus
								</label>
								<select
									value={faultBus}
									onChange={(e) => setFaultBus(e.target.value)}
									className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
								>
									<option value="">Select Bus</option>
									{buses.map((bus) => (
										<option key={bus.id} value={bus.id}>
											{bus.name}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Fault Type
								</label>
								<select
									value={faultType}
									onChange={(e) =>
										setFaultType(e.target.value as typeof faultType)
									}
									className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
								>
									<option value="three-phase">Three-Phase</option>
									<option value="line-to-ground">Line-to-Ground</option>
									<option value="line-to-line">Line-to-Line</option>
								</select>
							</div>
						</>
					)}

					<div className="flex items-end">
						<button
							type="button"
							onClick={() => {
								setIsRealTime(!isRealTime);
								if (!isRealTime) {
									animationRef.current = requestAnimationFrame(animate);
								} else if (animationRef.current) {
									cancelAnimationFrame(animationRef.current);
								}
							}}
							className={`px-4 py-2 rounded-md transition-colors ${
								isRealTime
									? "bg-red-600 text-white hover:bg-red-700"
									: "bg-green-600 text-white hover:bg-green-700"
							}`}
						>
							{isRealTime ? "Stop" : "Start"} Real-time
						</button>
					</div>
				</div>
			</div>

			{/* System Metrics */}
			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-3">System Metrics</h3>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<h4 className="font-medium text-blue-800">Total Generation</h4>
						<p className="text-2xl font-bold text-blue-900">
							{systemMetrics.totalGeneration.toFixed(1)} MW
						</p>
					</div>
					<div className="bg-green-50 border border-green-200 rounded-lg p-4">
						<h4 className="font-medium text-green-800">Total Load</h4>
						<p className="text-2xl font-bold text-green-900">
							{systemMetrics.totalLoad.toFixed(1)} MW
						</p>
					</div>
					<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
						<h4 className="font-medium text-yellow-800">System Losses</h4>
						<p className="text-2xl font-bold text-yellow-900">
							{systemMetrics.losses.toFixed(2)} MW
						</p>
					</div>
					<div
						className={`border rounded-lg p-4 ${
							systemMetrics.stability === "stable"
								? "bg-green-50 border-green-200"
								: systemMetrics.stability === "marginal"
									? "bg-yellow-50 border-yellow-200"
									: "bg-red-50 border-red-200"
						}`}
					>
						<h4
							className={`font-medium ${
								systemMetrics.stability === "stable"
									? "text-green-800"
									: systemMetrics.stability === "marginal"
										? "text-yellow-800"
										: "text-red-800"
							}`}
						>
							System Status
						</h4>
						<p
							className={`text-2xl font-bold ${
								systemMetrics.stability === "stable"
									? "text-green-900"
									: systemMetrics.stability === "marginal"
										? "text-yellow-900"
										: "text-red-900"
							}`}
						>
							{systemMetrics.stability.toUpperCase()}
						</p>
					</div>
				</div>
			</div>

			{/* Main Visualization */}
			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-3">
					Power System One-Line Diagram
				</h3>
				<div className="bg-white rounded-lg border border-gray-300 p-4">
					<canvas
						ref={canvasRef}
						onClick={handleBusClick}
						className="border border-gray-300 rounded-lg bg-white cursor-pointer"
						style={{ maxWidth: "100%", height: "auto" }}
					/>
					<div className="mt-4 text-sm text-gray-600">
						<p>
							<strong>Legend:</strong>
							Green circles = Slack bus (reference), Orange circles = PV bus
							(generator), Blue circles = PQ bus (load)
						</p>
						<p>
							Line colors: Green = Normal loading, Yellow = High loading
							(&gt;60%), Red = Overloaded (&gt;80%)
						</p>
						{analysisMode === "fault-analysis" && (
							<p>Click on a bus to simulate a fault</p>
						)}
					</div>
				</div>
			</div>

			{/* Phasor Diagram */}
			{analysisMode === "phasor" && (
				<div className="mb-6">
					<h3 className="text-lg font-semibold mb-3">Voltage Phasor Diagram</h3>
					<div className="bg-white rounded-lg border border-gray-300 p-4">
						<canvas
							ref={phasorCanvasRef}
							className="border border-gray-300 rounded-lg bg-white mx-auto block"
							style={{ maxWidth: "100%", height: "auto" }}
						/>
					</div>
				</div>
			)}

			{/* Bus Data Table */}
			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-3">Bus Data</h3>
				<div className="overflow-x-auto">
					<table className="min-w-full bg-white border border-gray-300 rounded-lg">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-4 py-2 text-left font-medium text-gray-700">
									Bus
								</th>
								<th className="px-4 py-2 text-left font-medium text-gray-700">
									Type
								</th>
								<th className="px-4 py-2 text-left font-medium text-gray-700">
									Voltage (pu)
								</th>
								<th className="px-4 py-2 text-left font-medium text-gray-700">
									Angle (°)
								</th>
								<th className="px-4 py-2 text-left font-medium text-gray-700">
									P (MW)
								</th>
								<th className="px-4 py-2 text-left font-medium text-gray-700">
									Q (MVAr)
								</th>
								<th className="px-4 py-2 text-left font-medium text-gray-700">
									Base kV
								</th>
							</tr>
						</thead>
						<tbody>
							{buses.map((bus) => (
								<tr
									key={bus.id}
									className={
										bus.isSelected ? "bg-yellow-50" : "hover:bg-gray-50"
									}
								>
									<td className="px-4 py-2 border-t">{bus.name}</td>
									<td className="px-4 py-2 border-t">
										<span
											className={`px-2 py-1 rounded text-xs font-medium ${
												bus.type === "slack"
													? "bg-green-100 text-green-800"
													: bus.type === "PV"
														? "bg-orange-100 text-orange-800"
														: "bg-blue-100 text-blue-800"
											}`}
										>
											{bus.type}
										</span>
									</td>
									<td className="px-4 py-2 border-t">
										{bus.voltage.magnitude.toFixed(4)}
									</td>
									<td className="px-4 py-2 border-t">
										{bus.voltage.angle.toFixed(2)}
									</td>
									<td className="px-4 py-2 border-t">
										{bus.power.real.toFixed(2)}
									</td>
									<td className="px-4 py-2 border-t">
										{bus.power.reactive.toFixed(2)}
									</td>
									<td className="px-4 py-2 border-t">{bus.baseKV}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-yellow-800">
						Power Systems Features
					</h3>
					<ul className="text-yellow-700 space-y-1">
						<li>
							• <strong>Load Flow Analysis</strong>: Newton-Raphson method for
							steady-state
						</li>
						<li>
							• <strong>Fault Analysis</strong>: Short circuit calculations and
							voltage profiles
						</li>
						<li>
							• <strong>Stability Assessment</strong>: Real-time system
							stability monitoring
						</li>
						<li>
							• <strong>Phasor Visualization</strong>: Complex voltage
							relationships
						</li>
					</ul>
				</div>

				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-blue-800">
						Engineering Applications
					</h3>
					<ul className="text-blue-700 space-y-1">
						<li>
							• <strong>Grid Planning</strong>: Transmission system expansion
						</li>
						<li>
							• <strong>Operations</strong>: Real-time monitoring and control
						</li>
						<li>
							• <strong>Protection</strong>: Relay coordination and fault
							clearing
						</li>
						<li>
							• <strong>Reliability</strong>: Contingency analysis and risk
							assessment
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6">
				<Link
					to="/examples/engineering"
					className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
				>
					← Back to Examples
				</Link>
			</div>
		</div>
	);
}
