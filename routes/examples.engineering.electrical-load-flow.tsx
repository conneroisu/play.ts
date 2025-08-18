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
	"/examples/engineering/electrical-load-flow",
)({
	component: ElectricalLoadFlowExample,
});

interface Bus {
	id: string;
	name: string;
	type: "slack" | "pv" | "pq";
	voltage: number; // per unit
	angle: number; // degrees
	realPower: number; // MW
	reactivePower: number; // MVAr
	x: number; // position
	y: number;
	voltageSpec: number; // specified voltage for PV buses
	generation: number; // MW generation capacity
}

interface Branch {
	id: string;
	fromBus: string;
	toBus: string;
	resistance: number; // per unit
	reactance: number; // per unit
	susceptance: number; // per unit (line charging)
	rating: number; // MVA rating
	current: number; // calculated current
	powerFlow: number; // MW flow
	loading: number; // % of rating
	losses: number; // MW losses
}

interface LoadFlowResults {
	converged: boolean;
	iterations: number;
	maxMismatch: number;
	totalGeneration: number; // MW
	totalLoad: number; // MW
	totalLosses: number; // MW
	minVoltage: number;
	maxVoltage: number;
	systemStability: "stable" | "marginal" | "unstable";
}

function ElectricalLoadFlowExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const [buses, setBuses] = useState<Bus[]>([
		{
			id: "gen1",
			name: "Generator 1",
			type: "slack",
			voltage: 1.05,
			angle: 0,
			realPower: 0,
			reactivePower: 0,
			x: 100,
			y: 100,
			voltageSpec: 1.05,
			generation: 300,
		},
		{
			id: "gen2",
			name: "Generator 2",
			type: "pv",
			voltage: 1.02,
			angle: 0,
			realPower: 150,
			reactivePower: 0,
			x: 500,
			y: 100,
			voltageSpec: 1.02,
			generation: 250,
		},
		{
			id: "load1",
			name: "Load Center 1",
			type: "pq",
			voltage: 1.0,
			angle: 0,
			realPower: -120,
			reactivePower: -50,
			x: 200,
			y: 250,
			voltageSpec: 0,
			generation: 0,
		},
		{
			id: "load2",
			name: "Load Center 2",
			type: "pq",
			voltage: 1.0,
			angle: 0,
			realPower: -80,
			reactivePower: -40,
			x: 400,
			y: 250,
			voltageSpec: 0,
			generation: 0,
		},
		{
			id: "sub1",
			name: "Substation 1",
			type: "pq",
			voltage: 1.0,
			angle: 0,
			realPower: -60,
			reactivePower: -30,
			x: 300,
			y: 150,
			voltageSpec: 0,
			generation: 0,
		},
	]);

	const [branches, setBranches] = useState<Branch[]>([
		{
			id: "line1",
			fromBus: "gen1",
			toBus: "sub1",
			resistance: 0.02,
			reactance: 0.06,
			susceptance: 0.03,
			rating: 200,
			current: 0,
			powerFlow: 0,
			loading: 0,
			losses: 0,
		},
		{
			id: "line2",
			fromBus: "gen2",
			toBus: "sub1",
			resistance: 0.03,
			reactance: 0.08,
			susceptance: 0.04,
			rating: 150,
			current: 0,
			powerFlow: 0,
			loading: 0,
			losses: 0,
		},
		{
			id: "line3",
			fromBus: "sub1",
			toBus: "load1",
			resistance: 0.01,
			reactance: 0.04,
			susceptance: 0.02,
			rating: 100,
			current: 0,
			powerFlow: 0,
			loading: 0,
			losses: 0,
		},
		{
			id: "line4",
			fromBus: "sub1",
			toBus: "load2",
			resistance: 0.02,
			reactance: 0.05,
			susceptance: 0.025,
			rating: 120,
			current: 0,
			powerFlow: 0,
			loading: 0,
			losses: 0,
		},
		{
			id: "line5",
			fromBus: "load1",
			toBus: "load2",
			resistance: 0.015,
			reactance: 0.045,
			susceptance: 0.02,
			rating: 80,
			current: 0,
			powerFlow: 0,
			loading: 0,
			losses: 0,
		},
	]);

	const [systemSettings, setSystemSettings] = useState({
		baseVoltage: 138, // kV
		basePower: 100, // MVA
		tolerance: 0.001,
		maxIterations: 50,
		accelerationFactor: 1.4,
		contingencyAnalysis: false,
		displayMode: "voltage" as "voltage" | "power" | "current" | "loading",
	});

	const [displaySettings, setDisplaySettings] = useState({
		showVoltages: true,
		showPowerFlows: true,
		showCurrents: false,
		showLosses: false,
		showAngles: false,
		animatePowerFlow: true,
		showStability: true,
		colorCodeVoltage: true,
	});

	const [results, setResults] = useState<LoadFlowResults | null>(null);
	const [time, setTime] = useState(0);
	const [analysisRunning, setAnalysisRunning] = useState(false);

	// Newton-Raphson Load Flow Solution
	const solveLoadFlow = (): LoadFlowResults => {
		const n = buses.length;
		const convergenceTolerance = systemSettings.tolerance;
		const maxIter = systemSettings.maxIterations;

		// Initialize bus data
		const V = buses.map((bus) => bus.voltage);
		const delta = buses.map((bus) => (bus.angle * PI) / 180);
		const P = buses.map((bus) => bus.realPower / 100); // Convert to per unit on base power
		const Q = buses.map((bus) => bus.reactivePower / 100);

		// Build admittance matrix
		const Y = Array(n)
			.fill(null)
			.map(() =>
				Array(n)
					.fill(0)
					.map(() => ({ real: 0, imag: 0 })),
			);

		// Add branch admittances
		branches.forEach((branch) => {
			const fromIndex = buses.findIndex((bus) => bus.id === branch.fromBus);
			const toIndex = buses.findIndex((bus) => bus.id === branch.toBus);

			if (fromIndex === -1 || toIndex === -1) return;

			const z = { real: branch.resistance, imag: branch.reactance };
			const zMag2 = z.real * z.real + z.imag * z.imag;
			const y = { real: z.real / zMag2, imag: -z.imag / zMag2 };

			// Off-diagonal elements
			Y[fromIndex][toIndex].real -= y.real;
			Y[fromIndex][toIndex].imag -= y.imag;
			Y[toIndex][fromIndex].real -= y.real;
			Y[toIndex][fromIndex].imag -= y.imag;

			// Diagonal elements
			Y[fromIndex][fromIndex].real += y.real;
			Y[fromIndex][fromIndex].imag += y.imag + branch.susceptance / 2;
			Y[toIndex][toIndex].real += y.real;
			Y[toIndex][toIndex].imag += y.imag + branch.susceptance / 2;
		});

		let converged = false;
		let iteration = 0;
		let maxMismatch = Number.POSITIVE_INFINITY;

		// Newton-Raphson iterations
		while (!converged && iteration < maxIter) {
			iteration++;

			// Calculate power injections
			const Pcalc = Array(n).fill(0);
			const Qcalc = Array(n).fill(0);

			for (let i = 0; i < n; i++) {
				for (let j = 0; j < n; j++) {
					const Gij = Y[i][j].real;
					const Bij = Y[i][j].imag;
					const deltaij = delta[i] - delta[j];

					Pcalc[i] += V[i] * V[j] * (Gij * cos(deltaij) + Bij * sin(deltaij));
					Qcalc[i] += V[i] * V[j] * (Gij * sin(deltaij) - Bij * cos(deltaij));
				}
			}

			// Calculate mismatches
			const deltaP = Array(n).fill(0);
			const deltaQ = Array(n).fill(0);

			for (let i = 0; i < n; i++) {
				if (buses[i].type !== "slack") {
					deltaP[i] = P[i] - Pcalc[i];
				}
				if (buses[i].type === "pq") {
					deltaQ[i] = Q[i] - Qcalc[i];
				}
			}

			// Check convergence
			maxMismatch = Math.max(
				Math.max(...deltaP.map(Math.abs)),
				Math.max(...deltaQ.map(Math.abs)),
			);

			if (maxMismatch < convergenceTolerance) {
				converged = true;
				break;
			}

			// Simplified update (real implementation would use Jacobian matrix)
			for (let i = 1; i < n; i++) {
				// Skip slack bus
				if (buses[i].type === "pq") {
					delta[i] += deltaP[i] * 0.1 * systemSettings.accelerationFactor;
					V[i] += deltaQ[i] * 0.05 * systemSettings.accelerationFactor;
					V[i] = clamp(V[i], 0.9, 1.1); // Voltage limits
				} else if (buses[i].type === "pv") {
					delta[i] += deltaP[i] * 0.1 * systemSettings.accelerationFactor;
				}
			}
		}

		// Update bus results
		const updatedBuses = buses.map((bus, i) => ({
			...bus,
			voltage: V[i],
			angle: (delta[i] * 180) / PI,
		}));
		setBuses(updatedBuses);

		// Calculate branch flows
		const updatedBranches = branches.map((branch) => {
			const fromIndex = buses.findIndex((bus) => bus.id === branch.fromBus);
			const toIndex = buses.findIndex((bus) => bus.id === branch.toBus);

			if (fromIndex === -1 || toIndex === -1) return branch;

			const Vf = V[fromIndex];
			const Vt = V[toIndex];
			const deltaf = delta[fromIndex];
			const deltat = delta[toIndex];

			// Calculate current magnitude (simplified)
			const z = Math.sqrt(
				branch.resistance * branch.resistance +
					branch.reactance * branch.reactance,
			);
			const current = Math.abs(Vf - Vt * cos(deltaf - deltat)) / z;

			// Calculate power flow
			const powerFlow =
				Vf *
				current *
				cos(deltaf - Math.atan2(branch.reactance, branch.resistance)) *
				systemSettings.basePower;

			// Calculate loading
			const loading =
				((current * systemSettings.baseVoltage * Math.sqrt(3)) /
					(branch.rating * 1000)) *
				100;

			// Calculate losses (simplified)
			const losses =
				current * current * branch.resistance * systemSettings.basePower;

			return {
				...branch,
				current: current,
				powerFlow: powerFlow,
				loading: loading,
				losses: losses,
			};
		});
		setBranches(updatedBranches);

		// Calculate system totals
		const totalGeneration = updatedBuses
			.filter((bus) => bus.type === "slack" || bus.type === "pv")
			.reduce((sum, bus) => sum + Math.max(0, bus.realPower), 0);

		const totalLoad = updatedBuses
			.filter((bus) => bus.realPower < 0)
			.reduce((sum, bus) => sum + Math.abs(bus.realPower), 0);

		const totalLosses = updatedBranches.reduce(
			(sum, branch) => sum + branch.losses,
			0,
		);

		const voltages = V.filter((_, i) => buses[i].type !== "slack");
		const minVoltage = Math.min(...voltages);
		const maxVoltage = Math.max(...voltages);

		// Determine system stability
		let systemStability: "stable" | "marginal" | "unstable" = "stable";
		if (minVoltage < 0.95 || maxVoltage > 1.05 || maxMismatch > 0.1) {
			systemStability = "unstable";
		} else if (minVoltage < 0.98 || maxVoltage > 1.02) {
			systemStability = "marginal";
		}

		return {
			converged,
			iterations: iteration,
			maxMismatch,
			totalGeneration,
			totalLoad,
			totalLosses,
			minVoltage,
			maxVoltage,
			systemStability,
		};
	};

	const render = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw transmission lines
		branches.forEach((branch) => {
			const fromBus = buses.find((bus) => bus.id === branch.fromBus);
			const toBus = buses.find((bus) => bus.id === branch.toBus);

			if (!fromBus || !toBus) return;

			// Line color based on loading
			let strokeColor = "#374151";
			if (displaySettings.colorCodeVoltage) {
				if (branch.loading > 80)
					strokeColor = "#dc2626"; // Red - overloaded
				else if (branch.loading > 60)
					strokeColor = "#f59e0b"; // Yellow - high loading
				else strokeColor = "#10b981"; // Green - normal
			}

			// Line thickness based on rating
			const lineWidth = Math.max(2, branch.rating / 50);

			ctx.strokeStyle = strokeColor;
			ctx.lineWidth = lineWidth;
			ctx.beginPath();
			ctx.moveTo(fromBus.x, fromBus.y);
			ctx.lineTo(toBus.x, toBus.y);
			ctx.stroke();

			// Power flow animation
			if (displaySettings.animatePowerFlow && branch.powerFlow > 0) {
				const progress = (time * 0.02) % 1;
				const direction = branch.powerFlow > 0 ? progress : 1 - progress;
				const animX = lerp(fromBus.x, toBus.x, direction);
				const animY = lerp(fromBus.y, toBus.y, direction);

				ctx.fillStyle = "rgba(59, 130, 246, 0.8)";
				ctx.beginPath();
				ctx.arc(animX, animY, 4, 0, TWO_PI);
				ctx.fill();
			}

			// Branch labels
			const midX = (fromBus.x + toBus.x) / 2;
			const midY = (fromBus.y + toBus.y) / 2;

			ctx.fillStyle = "#1f2937";
			ctx.font = "11px Arial";
			ctx.textAlign = "center";

			if (displaySettings.showPowerFlows) {
				ctx.fillText(
					`${Math.abs(branch.powerFlow).toFixed(1)} MW`,
					midX,
					midY - 10,
				);
			}

			if (displaySettings.showCurrents) {
				ctx.fillText(
					`${((branch.current * systemSettings.baseVoltage * Math.sqrt(3)) / 1000).toFixed(1)} kA`,
					midX,
					midY + 5,
				);
			}

			if (branch.loading > 0) {
				const loadingColor =
					branch.loading > 80
						? "#dc2626"
						: branch.loading > 60
							? "#f59e0b"
							: "#10b981";
				ctx.fillStyle = loadingColor;
				ctx.fillText(`${branch.loading.toFixed(0)}%`, midX, midY + 20);
			}
		});

		// Draw buses
		buses.forEach((bus) => {
			let fillColor = "#e5e7eb";
			let strokeColor = "#374151";

			// Bus color based on type and voltage
			if (bus.type === "slack") {
				fillColor = "#dbeafe"; // Blue for slack bus
				strokeColor = "#1e40af";
			} else if (bus.type === "pv") {
				fillColor = "#dcfce7"; // Green for generator
				strokeColor = "#15803d";
			} else {
				// Color code by voltage deviation
				if (displaySettings.colorCodeVoltage) {
					const voltageDeviation = Math.abs(bus.voltage - 1.0);
					if (voltageDeviation > 0.05) {
						fillColor = "#fecaca"; // Red for voltage violations
						strokeColor = "#dc2626";
					} else if (voltageDeviation > 0.02) {
						fillColor = "#fed7aa"; // Orange for marginal voltage
						strokeColor = "#ea580c";
					} else {
						fillColor = "#d1fae5"; // Green for good voltage
						strokeColor = "#059669";
					}
				}
			}

			// Draw bus circle
			ctx.fillStyle = fillColor;
			ctx.strokeStyle = strokeColor;
			ctx.lineWidth = 2;

			const radius = bus.generation > 0 ? 25 : 20;
			ctx.beginPath();
			ctx.arc(bus.x, bus.y, radius, 0, TWO_PI);
			ctx.fill();
			ctx.stroke();

			// Bus labels
			ctx.fillStyle = "#1f2937";
			ctx.font = "bold 12px Arial";
			ctx.textAlign = "center";
			ctx.fillText(bus.name, bus.x, bus.y - 35);

			// Voltage and angle
			if (displaySettings.showVoltages) {
				ctx.font = "11px Arial";
				ctx.fillText(`${bus.voltage.toFixed(3)} pu`, bus.x, bus.y + 40);

				if (displaySettings.showAngles) {
					ctx.fillText(`${bus.angle.toFixed(1)}°`, bus.x, bus.y + 55);
				}
			}

			// Power generation/consumption
			if (bus.realPower !== 0) {
				ctx.font = "10px Arial";
				const power =
					bus.realPower > 0
						? `+${bus.realPower.toFixed(0)} MW`
						: `${bus.realPower.toFixed(0)} MW`;
				ctx.fillText(power, bus.x, bus.y - 5);

				if (bus.reactivePower !== 0) {
					const reactive =
						bus.reactivePower > 0
							? `+${bus.reactivePower.toFixed(0)} MVAr`
							: `${bus.reactivePower.toFixed(0)} MVAr`;
					ctx.fillText(reactive, bus.x, bus.y + 8);
				}
			}

			// Generator symbol
			if (bus.generation > 0) {
				ctx.strokeStyle = "#374151";
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.arc(bus.x, bus.y, 15, 0, TWO_PI);
				ctx.stroke();

				ctx.fillStyle = "#374151";
				ctx.font = "bold 14px Arial";
				ctx.fillText("G", bus.x, bus.y + 5);
			}
		});

		// System status indicator
		if (results && displaySettings.showStability) {
			const statusColor =
				results.systemStability === "stable"
					? "#10b981"
					: results.systemStability === "marginal"
						? "#f59e0b"
						: "#dc2626";

			ctx.fillStyle = statusColor;
			ctx.strokeStyle = statusColor;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(canvas.width - 30, 30, 12, 0, TWO_PI);
			ctx.fill();

			ctx.fillStyle = "#1f2937";
			ctx.font = "12px Arial";
			ctx.textAlign = "right";
			ctx.fillText(
				`System: ${results.systemStability.toUpperCase()}`,
				canvas.width - 50,
				35,
			);
		}

		// Legend
		ctx.fillStyle = "#1f2937";
		ctx.font = "12px Arial";
		ctx.textAlign = "left";
		ctx.fillText("Power System Load Flow Analysis", 20, 30);

		if (displaySettings.colorCodeVoltage) {
			ctx.font = "10px Arial";
			ctx.fillText(
				"Bus Colors: Normal (Green), Marginal (Orange), Violation (Red)",
				20,
				50,
			);
			ctx.fillText(
				"Line Colors: Normal (Green), High Load (Yellow), Overload (Red)",
				20,
				65,
			);
		}
	};

	const runLoadFlowAnalysis = async () => {
		setAnalysisRunning(true);

		// Simulate analysis time for realistic experience
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const analysisResults = solveLoadFlow();
		setResults(analysisResults);
		setAnalysisRunning(false);
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.width = 700;
		canvas.height = 400;
	}, []);

	useEffect(() => {
		render();
	}, [buses, branches, displaySettings, time, results]);

	useEffect(() => {
		if (!displaySettings.animatePowerFlow) return;

		const interval = setInterval(() => {
			setTime((prev) => prev + 1);
		}, 50);

		return () => clearInterval(interval);
	}, [displaySettings.animatePowerFlow]);

	// Auto-run analysis when parameters change
	useEffect(() => {
		runLoadFlowAnalysis();
	}, [buses, systemSettings]);

	const updateBus = (busId: string, field: keyof Bus, value: any) => {
		setBuses((prev) =>
			prev.map((bus) => (bus.id === busId ? { ...bus, [field]: value } : bus)),
		);
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Electrical Load Flow Analysis
				</h1>
				<p className="text-gray-600 mb-4">
					Power system analysis tool for voltage regulation, power flow
					calculation, and system stability assessment.
				</p>
				<div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
					<p className="text-slate-800">
						⚡ Power system engineering - Newton-Raphson load flow, contingency
						analysis, and grid optimization
					</p>
				</div>
			</div>

			{/* Analysis Controls */}
			<div className="mb-6">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold">Analysis Controls</h3>
					<button
						onClick={runLoadFlowAnalysis}
						disabled={analysisRunning}
						className={`px-4 py-2 rounded-lg text-white font-medium ${
							analysisRunning
								? "bg-gray-400 cursor-not-allowed"
								: "bg-blue-600 hover:bg-blue-700"
						} transition-colors`}
					>
						{analysisRunning ? "Analyzing..." : "Run Load Flow"}
					</button>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Base Voltage: {systemSettings.baseVoltage} kV
						</label>
						<input
							type="range"
							min="69"
							max="500"
							step="1"
							value={systemSettings.baseVoltage}
							onChange={(e) =>
								setSystemSettings((prev) => ({
									...prev,
									baseVoltage: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Tolerance: {systemSettings.tolerance}
						</label>
						<input
							type="range"
							min="0.0001"
							max="0.01"
							step="0.0001"
							value={systemSettings.tolerance}
							onChange={(e) =>
								setSystemSettings((prev) => ({
									...prev,
									tolerance: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Max Iterations: {systemSettings.maxIterations}
						</label>
						<input
							type="range"
							min="10"
							max="100"
							step="5"
							value={systemSettings.maxIterations}
							onChange={(e) =>
								setSystemSettings((prev) => ({
									...prev,
									maxIterations: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Acceleration: {systemSettings.accelerationFactor.toFixed(1)}
						</label>
						<input
							type="range"
							min="1.0"
							max="2.0"
							step="0.1"
							value={systemSettings.accelerationFactor}
							onChange={(e) =>
								setSystemSettings((prev) => ({
									...prev,
									accelerationFactor: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
				</div>
			</div>

			{/* Display Options */}
			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-3">Display Options</h3>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={displaySettings.showVoltages}
							onChange={(e) =>
								setDisplaySettings((prev) => ({
									...prev,
									showVoltages: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">
							Bus Voltages
						</span>
					</label>
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={displaySettings.showPowerFlows}
							onChange={(e) =>
								setDisplaySettings((prev) => ({
									...prev,
									showPowerFlows: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">
							Power Flows
						</span>
					</label>
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={displaySettings.colorCodeVoltage}
							onChange={(e) =>
								setDisplaySettings((prev) => ({
									...prev,
									colorCodeVoltage: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">
							Color Coding
						</span>
					</label>
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={displaySettings.animatePowerFlow}
							onChange={(e) =>
								setDisplaySettings((prev) => ({
									...prev,
									animatePowerFlow: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">
							Animate Flow
						</span>
					</label>
				</div>
			</div>

			{/* Bus Configuration */}
			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-3">Bus Configuration</h3>
				<div className="space-y-4">
					{buses.map((bus) => (
						<div key={bus.id} className="bg-gray-50 rounded-lg p-4">
							<div className="flex items-center justify-between mb-3">
								<h4 className="font-medium">
									{bus.name} ({bus.type.toUpperCase()})
								</h4>
								<span
									className={`px-2 py-1 rounded text-sm ${
										bus.type === "slack"
											? "bg-blue-100 text-blue-800"
											: bus.type === "pv"
												? "bg-green-100 text-green-800"
												: "bg-gray-100 text-gray-800"
									}`}
								>
									{bus.type === "slack"
										? "Reference"
										: bus.type === "pv"
											? "Generator"
											: "Load"}
								</span>
							</div>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								{bus.type !== "slack" && (
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Real Power: {bus.realPower} MW
										</label>
										<input
											type="range"
											min={bus.type === "pv" ? "0" : "-200"}
											max={bus.type === "pv" ? "300" : "0"}
											step="5"
											value={bus.realPower}
											onChange={(e) =>
												updateBus(bus.id, "realPower", Number(e.target.value))
											}
											className="w-full"
										/>
									</div>
								)}
								{bus.type === "pq" && (
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Reactive Power: {bus.reactivePower} MVAr
										</label>
										<input
											type="range"
											min="-100"
											max="50"
											step="5"
											value={bus.reactivePower}
											onChange={(e) =>
												updateBus(
													bus.id,
													"reactivePower",
													Number(e.target.value),
												)
											}
											className="w-full"
										/>
									</div>
								)}
								{(bus.type === "slack" || bus.type === "pv") && (
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Voltage Setpoint: {bus.voltageSpec.toFixed(3)} pu
										</label>
										<input
											type="range"
											min="0.95"
											max="1.10"
											step="0.005"
											value={bus.voltageSpec}
											onChange={(e) =>
												updateBus(bus.id, "voltageSpec", Number(e.target.value))
											}
											className="w-full"
										/>
									</div>
								)}
								<div className="text-sm">
									<p>
										<strong>Current:</strong> {bus.voltage.toFixed(3)} pu
									</p>
									<p>
										<strong>Angle:</strong> {bus.angle.toFixed(1)}°
									</p>
									<p>
										<strong>Voltage:</strong>{" "}
										{(bus.voltage * systemSettings.baseVoltage).toFixed(1)} kV
									</p>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Results */}
			{results && (
				<div className="mb-6">
					<h3 className="text-lg font-semibold mb-3">Analysis Results</h3>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
						<div
							className={`border rounded-lg p-4 ${
								results.converged
									? "bg-green-50 border-green-200"
									: "bg-red-50 border-red-200"
							}`}
						>
							<h4
								className={`font-medium ${results.converged ? "text-green-800" : "text-red-800"}`}
							>
								Convergence
							</h4>
							<p
								className={`text-2xl font-bold ${results.converged ? "text-green-900" : "text-red-900"}`}
							>
								{results.converged ? "YES" : "NO"}
							</p>
							<p
								className={`text-sm ${results.converged ? "text-green-600" : "text-red-600"}`}
							>
								{results.iterations} iterations
							</p>
						</div>
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<h4 className="font-medium text-blue-800">Power Balance</h4>
							<p className="text-lg font-bold text-blue-900">
								Gen: {results.totalGeneration.toFixed(1)} MW
							</p>
							<p className="text-sm text-blue-600">
								Load: {results.totalLoad.toFixed(1)} MW
							</p>
						</div>
						<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
							<h4 className="font-medium text-yellow-800">System Losses</h4>
							<p className="text-2xl font-bold text-yellow-900">
								{results.totalLosses.toFixed(2)} MW
							</p>
							<p className="text-sm text-yellow-600">
								{(
									(results.totalLosses / results.totalGeneration) *
									100
								).toFixed(1)}
								% of generation
							</p>
						</div>
						<div
							className={`border rounded-lg p-4 ${
								results.systemStability === "stable"
									? "bg-green-50 border-green-200"
									: results.systemStability === "marginal"
										? "bg-yellow-50 border-yellow-200"
										: "bg-red-50 border-red-200"
							}`}
						>
							<h4
								className={`font-medium ${
									results.systemStability === "stable"
										? "text-green-800"
										: results.systemStability === "marginal"
											? "text-yellow-800"
											: "text-red-800"
								}`}
							>
								Voltage Range
							</h4>
							<p
								className={`text-lg font-bold ${
									results.systemStability === "stable"
										? "text-green-900"
										: results.systemStability === "marginal"
											? "text-yellow-900"
											: "text-red-900"
								}`}
							>
								{results.minVoltage.toFixed(3)} -{" "}
								{results.maxVoltage.toFixed(3)}
							</p>
							<p
								className={`text-sm ${
									results.systemStability === "stable"
										? "text-green-600"
										: results.systemStability === "marginal"
											? "text-yellow-600"
											: "text-red-600"
								}`}
							>
								per unit
							</p>
						</div>
					</div>
				</div>
			)}

			{/* System Diagram */}
			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-3">
					Power System Single-Line Diagram
				</h3>
				<canvas
					ref={canvasRef}
					className="border border-gray-300 rounded-lg bg-white"
					style={{ maxWidth: "100%", height: "auto" }}
				/>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-slate-800">
						Power System Analysis
					</h3>
					<ul className="text-slate-700 space-y-1">
						<li>
							• <strong>Newton-Raphson Method</strong>: Iterative load flow
							solution
						</li>
						<li>
							• <strong>Bus Classifications</strong>: Slack, PV, and PQ bus
							modeling
						</li>
						<li>
							• <strong>Admittance Matrix</strong>: Network topology
							representation
						</li>
						<li>
							• <strong>Convergence Analysis</strong>: Mismatch tolerance
							monitoring
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
							• <strong>Operations</strong>: Real-time state estimation
						</li>
						<li>
							• <strong>Protection</strong>: Fault current calculations
						</li>
						<li>
							• <strong>Markets</strong>: Economic dispatch optimization
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
				<h3 className="text-lg font-semibold mb-2 text-orange-800">
					IEEE Standards & Limits
				</h3>
				<div className="grid md:grid-cols-3 gap-4 text-orange-700">
					<div>
						<strong>Voltage Limits:</strong>
						<ul className="text-sm mt-1">
							<li>• Normal: ±5% (0.95-1.05 pu)</li>
							<li>• Emergency: ±10% (0.90-1.10 pu)</li>
							<li>• Critical: ±15% (0.85-1.15 pu)</li>
						</ul>
					</div>
					<div>
						<strong>Loading Limits:</strong>
						<ul className="text-sm mt-1">
							<li>• Continuous: 100% of rating</li>
							<li>• Emergency: 130% for 15 min</li>
							<li>• Short-term: 150% for 5 min</li>
						</ul>
					</div>
					<div>
						<strong>Stability Margins:</strong>
						<ul className="text-sm mt-1">
							<li>• Angle: {"<"}30° for stability</li>
							<li>• Reactive reserve: {">"}5% of load</li>
							<li>• N-1 contingency planning</li>
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
