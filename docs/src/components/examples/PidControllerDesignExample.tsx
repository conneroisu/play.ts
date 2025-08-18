import {
	clamp,
	cos,
	exp,
	hsl,
	hslToRgb,
	lerp,
	PI,
	sin,
	TWO_PI,
	toCssHsl,
} from "play.ts";
import { useEffect, useRef, useState } from "react";

interface PIDSettings {
	kp: number; // Proportional gain
	ki: number; // Integral gain
	kd: number; // Derivative gain
	setpoint: number; // Target value
	dt: number; // Time step
}

interface PlantSettings {
	type: "first_order" | "second_order" | "integrator" | "motor" | "thermal";
	timeConstant: number;
	dampingRatio: number;
	gain: number;
	delay: number;
}

interface SimulationData {
	time: number[];
	output: number[];
	setpoint: number[];
	error: number[];
	control: number[];
	proportional: number[];
	integral: number[];
	derivative: number[];
}

interface PerformanceMetrics {
	riseTime: number;
	settlingTime: number;
	overshoot: number;
	steadyStateError: number;
	iae: number; // Integral Absolute Error
	ise: number; // Integral Square Error
	stability: "stable" | "marginally_stable" | "unstable";
}

export default function PidControllerDesignExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();

	const [pidSettings, setPidSettings] = useState<PIDSettings>({
		kp: 1.0,
		ki: 0.1,
		kd: 0.05,
		setpoint: 1.0,
		dt: 0.01,
	});

	const [plantSettings, setPlantSettings] = useState<PlantSettings>({
		type: "second_order",
		timeConstant: 1.0,
		dampingRatio: 0.7,
		gain: 1.0,
		delay: 0.1,
	});

	const [simulationData, setSimulationData] = useState<SimulationData>({
		time: [],
		output: [],
		setpoint: [],
		error: [],
		control: [],
		proportional: [],
		integral: [],
		derivative: [],
	});

	const [performanceMetrics, setPerformanceMetrics] =
		useState<PerformanceMetrics | null>(null);
	const [isRunning, setIsRunning] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [displaySettings, setDisplaySettings] = useState({
		showSetpoint: true,
		showOutput: true,
		showError: true,
		showControl: true,
		showComponents: false,
		timeWindow: 10,
		autoScale: true,
	});

	// Plant presets
	const plantPresets = {
		first_order: {
			timeConstant: 1.0,
			dampingRatio: 1.0,
			gain: 1.0,
			delay: 0.1,
		},
		second_order: {
			timeConstant: 1.0,
			dampingRatio: 0.7,
			gain: 1.0,
			delay: 0.1,
		},
		integrator: {
			timeConstant: 1.0,
			dampingRatio: 1.0,
			gain: 0.5,
			delay: 0.05,
		},
		motor: { timeConstant: 0.2, dampingRatio: 0.8, gain: 2.0, delay: 0.02 },
		thermal: { timeConstant: 5.0, dampingRatio: 1.0, gain: 1.5, delay: 0.5 },
	};

	// PID tuning presets
	const pidPresets = {
		conservative: { kp: 0.5, ki: 0.05, kd: 0.02 },
		aggressive: { kp: 2.0, ki: 0.5, kd: 0.1 },
		pi_only: { kp: 1.0, ki: 0.2, kd: 0.0 },
		pd_only: { kp: 1.5, ki: 0.0, kd: 0.1 },
		ziegler_nichols: { kp: 1.2, ki: 0.3, kd: 0.075 },
	};

	// Plant transfer function simulation
	const simulatePlant = (
		input: number,
		prevOutputs: number[],
		prevInputs: number[],
	): number => {
		const { type, timeConstant, dampingRatio, gain, delay } = plantSettings;
		const dt = pidSettings.dt;

		switch (type) {
			case "first_order": {
				// First-order: G(s) = K / (τs + 1)
				const alpha = dt / (timeConstant + dt);
				return prevOutputs[0] * (1 - alpha) + input * gain * alpha;
			}

			case "second_order": {
				// Second-order: G(s) = K*ωn² / (s² + 2ζωns + ωn²)
				const wn = 1 / timeConstant;
				const a0 = 1;
				const a1 = 2 * dampingRatio * wn;
				const a2 = wn * wn;

				// Discrete approximation using backward difference
				const y =
					(gain * input +
						2 * prevOutputs[0] * (1 + (a1 * dt) / 2) -
						prevOutputs[1] * (1 - a1 * dt + a2 * dt * dt)) /
					(1 + a1 * dt + a2 * dt * dt);
				return clamp(y, -10, 10);
			}

			case "integrator":
				// Integrator: G(s) = K / s
				return prevOutputs[0] + input * gain * dt;

			case "motor": {
				// DC Motor: G(s) = K / (s(τs + 1))
				const motorTau = timeConstant;
				const velocity =
					prevOutputs[1] + ((input * gain - prevOutputs[1]) * dt) / motorTau;
				const position = prevOutputs[0] + velocity * dt;
				return position;
			}

			case "thermal": {
				// Thermal system with capacity: G(s) = K / (τs + 1) with larger time constant
				const thermalAlpha = dt / (timeConstant + dt);
				return (
					prevOutputs[0] * (1 - thermalAlpha) + input * gain * thermalAlpha
				);
			}

			default:
				return input * gain;
		}
	};

	// PID Controller implementation
	const calculatePID = (
		error: number,
		prevErrors: number[],
		integral: number,
	): {
		control: number;
		newIntegral: number;
		proportional: number;
		integralTerm: number;
		derivative: number;
	} => {
		const { kp, ki, kd, dt } = pidSettings;

		// Proportional term
		const proportional = kp * error;

		// Integral term with windup protection
		const newIntegral = clamp(integral + error * dt, -10, 10);
		const integralTerm = ki * newIntegral;

		// Derivative term
		const derivative =
			prevErrors.length > 0 ? (kd * (error - prevErrors[0])) / dt : 0;

		// Total control output
		const control = clamp(proportional + integralTerm + derivative, -10, 10);

		return { control, newIntegral, proportional, integralTerm, derivative };
	};

	// Calculate performance metrics
	const calculateMetrics = (data: SimulationData): PerformanceMetrics => {
		if (data.time.length < 2) {
			return {
				riseTime: 0,
				settlingTime: 0,
				overshoot: 0,
				steadyStateError: 0,
				iae: 0,
				ise: 0,
				stability: "stable",
			};
		}

		const setpoint = pidSettings.setpoint;
		const output = data.output;
		const error = data.error;
		const time = data.time;

		// Rise time (10% to 90% of setpoint)
		let riseTime = 0;
		const tenPercent = setpoint * 0.1;
		const ninetyPercent = setpoint * 0.9;
		let tenPercentIndex = -1;
		let ninetyPercentIndex = -1;

		for (let i = 0; i < output.length; i++) {
			if (tenPercentIndex === -1 && output[i] >= tenPercent) {
				tenPercentIndex = i;
			}
			if (ninetyPercentIndex === -1 && output[i] >= ninetyPercent) {
				ninetyPercentIndex = i;
				break;
			}
		}

		if (tenPercentIndex !== -1 && ninetyPercentIndex !== -1) {
			riseTime = time[ninetyPercentIndex] - time[tenPercentIndex];
		}

		// Overshoot
		const maxOutput = Math.max(...output);
		const overshoot = Math.max(0, ((maxOutput - setpoint) / setpoint) * 100);

		// Settling time (within 2% of setpoint)
		let settlingTime = time[time.length - 1];
		const tolerance = setpoint * 0.02;

		for (let i = output.length - 1; i >= 0; i--) {
			if (Math.abs(output[i] - setpoint) > tolerance) {
				settlingTime = time[i];
				break;
			}
		}

		// Steady-state error
		const steadyStateError = Math.abs(output[output.length - 1] - setpoint);

		// Integral errors
		let iae = 0;
		let ise = 0;
		for (let i = 1; i < error.length; i++) {
			const dt = time[i] - time[i - 1];
			iae += Math.abs(error[i]) * dt;
			ise += error[i] * error[i] * dt;
		}

		// Stability assessment (simple check based on final values)
		let stability: "stable" | "marginally_stable" | "unstable" = "stable";
		const finalValue = output[output.length - 1];
		const secondLastValue = output[output.length - 2];
		const oscillation = Math.abs(finalValue - secondLastValue);

		if (oscillation > 0.1 || Math.abs(finalValue) > 10) {
			stability = "unstable";
		} else if (steadyStateError > 0.1) {
			stability = "marginally_stable";
		}

		return {
			riseTime,
			settlingTime,
			overshoot,
			steadyStateError,
			iae,
			ise,
			stability,
		};
	};

	// Run simulation
	const runSimulation = () => {
		const maxTime = displaySettings.timeWindow;
		const dt = pidSettings.dt;
		const steps = Math.floor(maxTime / dt);

		const time: number[] = [];
		const output: number[] = [];
		const setpoint: number[] = [];
		const error: number[] = [];
		const control: number[] = [];
		const proportional: number[] = [];
		const integral: number[] = [];
		const derivative: number[] = [];

		// Initial conditions
		let currentOutput = 0;
		let prevOutputs = [0, 0];
		let prevInputs = [0, 0];
		let prevErrors = [0];
		let integralSum = 0;
		let currentControl = 0;

		for (let i = 0; i < steps; i++) {
			const t = i * dt;
			time.push(t);

			// Step input or ramp input
			const currentSetpoint = t > 1.0 ? pidSettings.setpoint : 0;
			setpoint.push(currentSetpoint);

			// Calculate error
			const currentError = currentSetpoint - currentOutput;
			error.push(currentError);

			// Calculate PID control
			const pidResult = calculatePID(currentError, prevErrors, integralSum);
			currentControl = pidResult.control;
			integralSum = pidResult.newIntegral;

			control.push(currentControl);
			proportional.push(pidResult.proportional);
			integral.push(pidResult.integralTerm);
			derivative.push(pidResult.derivative);

			// Simulate plant
			currentOutput = simulatePlant(currentControl, prevOutputs, prevInputs);
			output.push(currentOutput);

			// Update history
			prevOutputs = [currentOutput, prevOutputs[0]];
			prevInputs = [currentControl, prevInputs[0]];
			prevErrors = [currentError];
		}

		const newData = {
			time,
			output,
			setpoint,
			error,
			control,
			proportional,
			integral,
			derivative,
		};

		setSimulationData(newData);
		setPerformanceMetrics(calculateMetrics(newData));
	};

	// Real-time simulation
	const simulateRealTime = () => {
		const dt = pidSettings.dt;
		const maxPoints = Math.floor(displaySettings.timeWindow / dt);

		setSimulationData((prev) => {
			const newTime = currentTime;
			const currentSetpoint = newTime > 1.0 ? pidSettings.setpoint : 0;

			// Get last output or start from 0
			const lastOutput =
				prev.output.length > 0 ? prev.output[prev.output.length - 1] : 0;
			const lastControl =
				prev.control.length > 0 ? prev.control[prev.control.length - 1] : 0;

			// Calculate error
			const currentError = currentSetpoint - lastOutput;

			// Calculate PID (simplified for real-time)
			const lastIntegral =
				prev.integral.length > 0
					? prev.integral[prev.integral.length - 1] / pidSettings.ki
					: 0;
			const lastError =
				prev.error.length > 0 ? prev.error[prev.error.length - 1] : 0;

			const pidResult = calculatePID(currentError, [lastError], lastIntegral);

			// Simulate plant response
			const prevOutputs =
				prev.output.length >= 2
					? [
							prev.output[prev.output.length - 1],
							prev.output[prev.output.length - 2],
						]
					: [lastOutput, 0];
			const prevInputs =
				prev.control.length >= 2
					? [
							prev.control[prev.control.length - 1],
							prev.control[prev.control.length - 2],
						]
					: [lastControl, 0];

			const newOutput = simulatePlant(
				pidResult.control,
				prevOutputs,
				prevInputs,
			);

			// Update arrays
			const newData = {
				time: [...prev.time, newTime].slice(-maxPoints),
				output: [...prev.output, newOutput].slice(-maxPoints),
				setpoint: [...prev.setpoint, currentSetpoint].slice(-maxPoints),
				error: [...prev.error, currentError].slice(-maxPoints),
				control: [...prev.control, pidResult.control].slice(-maxPoints),
				proportional: [...prev.proportional, pidResult.proportional].slice(
					-maxPoints,
				),
				integral: [...prev.integral, pidResult.integralTerm].slice(-maxPoints),
				derivative: [...prev.derivative, pidResult.derivative].slice(
					-maxPoints,
				),
			};

			// Update metrics periodically
			if (prev.time.length % 50 === 0) {
				setPerformanceMetrics(calculateMetrics(newData));
			}

			return newData;
		});

		setCurrentTime((prev) => prev + dt);
	};

	// Draw charts
	const draw = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;

		ctx.clearRect(0, 0, width, height);

		// Chart dimensions
		const margin = 60;
		const chartWidth = width - 2 * margin;
		const chartHeight = (height - 4 * margin) / 3;

		const charts = [
			{
				title: "System Response",
				y: margin,
				datasets: [
					{
						data: simulationData.setpoint,
						color: "#ef4444",
						label: "Setpoint",
						show: displaySettings.showSetpoint,
					},
					{
						data: simulationData.output,
						color: "#3b82f6",
						label: "Output",
						show: displaySettings.showOutput,
					},
				],
			},
			{
				title: "Error Signal",
				y: margin + chartHeight + 20,
				datasets: [
					{
						data: simulationData.error,
						color: "#f59e0b",
						label: "Error",
						show: displaySettings.showError,
					},
				],
			},
			{
				title: "Control Signal",
				y: margin + 2 * (chartHeight + 20),
				datasets: [
					{
						data: simulationData.control,
						color: "#10b981",
						label: "Control",
						show: displaySettings.showControl,
					},
					{
						data: simulationData.proportional,
						color: "#8b5cf6",
						label: "P",
						show: displaySettings.showComponents,
					},
					{
						data: simulationData.integral,
						color: "#ec4899",
						label: "I",
						show: displaySettings.showComponents,
					},
					{
						data: simulationData.derivative,
						color: "#6366f1",
						label: "D",
						show: displaySettings.showComponents,
					},
				],
			},
		];

		charts.forEach((chart) => {
			drawChart(ctx, chart, margin, chart.y, chartWidth, chartHeight);
		});
	};

	const drawChart = (
		ctx: CanvasRenderingContext2D,
		chart: any,
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
		ctx.textAlign = "left";
		ctx.fillText(chart.title, x, y - 5);

		if (simulationData.time.length < 2) return;

		// Find data ranges
		let minY = Number.POSITIVE_INFINITY;
		let maxY = Number.NEGATIVE_INFINITY;
		const minTime = Math.min(...simulationData.time);
		const maxTime = Math.max(...simulationData.time);

		chart.datasets.forEach((dataset: any) => {
			if (dataset.show && dataset.data.length > 0) {
				const dataMin = Math.min(...dataset.data);
				const dataMax = Math.max(...dataset.data);
				minY = Math.min(minY, dataMin);
				maxY = Math.max(maxY, dataMax);
			}
		});

		if (minY === maxY) {
			minY -= 0.5;
			maxY += 0.5;
		}

		const timeRange = maxTime - minTime;
		const yRange = maxY - minY;

		// Grid
		ctx.strokeStyle = "#f1f5f9";
		ctx.lineWidth = 1;

		for (let i = 1; i <= 4; i++) {
			const gridY = y + (i * height) / 5;
			ctx.beginPath();
			ctx.moveTo(x, gridY);
			ctx.lineTo(x + width, gridY);
			ctx.stroke();
		}

		for (let i = 1; i <= 4; i++) {
			const gridX = x + (i * width) / 5;
			ctx.beginPath();
			ctx.moveTo(gridX, y);
			ctx.lineTo(gridX, y + height);
			ctx.stroke();
		}

		// Plot datasets
		chart.datasets.forEach((dataset: any) => {
			if (!dataset.show || dataset.data.length === 0) return;

			ctx.strokeStyle = dataset.color;
			ctx.lineWidth = 2;
			ctx.beginPath();

			for (let i = 0; i < dataset.data.length; i++) {
				const time = simulationData.time[i];
				const value = dataset.data[i];

				const plotX = x + ((time - minTime) / timeRange) * width;
				const plotY = y + height - ((value - minY) / yRange) * height;

				if (i === 0) {
					ctx.moveTo(plotX, plotY);
				} else {
					ctx.lineTo(plotX, plotY);
				}
			}

			ctx.stroke();
		});

		// Axis labels
		ctx.fillStyle = "#64748b";
		ctx.font = "10px Arial";
		ctx.textAlign = "center";

		// Time axis
		for (let i = 0; i <= 4; i++) {
			const time = minTime + (i * timeRange) / 4;
			const labelX = x + (i * width) / 4;
			ctx.fillText(time.toFixed(1), labelX, y + height + 15);
		}

		// Value axis
		ctx.textAlign = "right";
		for (let i = 0; i <= 4; i++) {
			const value = minY + (i * yRange) / 4;
			const labelY = y + height - (i * height) / 4 + 3;
			ctx.fillText(value.toFixed(2), x - 5, labelY);
		}
	};

	const animate = () => {
		if (isRunning) {
			simulateRealTime();
		}
		draw();
		animationRef.current = requestAnimationFrame(animate);
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (canvas) {
			canvas.width = 800;
			canvas.height = 600;
		}

		runSimulation();
	}, [pidSettings, plantSettings, displaySettings.timeWindow]);

	useEffect(() => {
		animationRef.current = requestAnimationFrame(animate);
		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [isRunning, simulationData]);

	const applyPIDPreset = (preset: keyof typeof pidPresets) => {
		setPidSettings((prev) => ({ ...prev, ...pidPresets[preset] }));
	};

	const applyPlantPreset = (preset: keyof typeof plantPresets) => {
		setPlantSettings((prev) => ({
			...prev,
			...plantPresets[preset],
			type: preset,
		}));
	};

	const resetSimulation = () => {
		setIsRunning(false);
		setCurrentTime(0);
		setSimulationData({
			time: [],
			output: [],
			setpoint: [],
			error: [],
			control: [],
			proportional: [],
			integral: [],
			derivative: [],
		});
		runSimulation();
	};

	return (
		<div className="w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
			<div className="bg-white rounded-xl shadow-lg p-6 mb-6">
				<div className="flex items-center gap-3 mb-6">
					<div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
					<h1 className="text-2xl font-bold text-gray-800">
						PID Controller Design & Tuning
					</h1>
					<div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
						Control Systems Engineering Tool
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

						<div className="flex gap-2 mb-4">
							<button
								onClick={() => setIsRunning(!isRunning)}
								className={`px-4 py-2 rounded-lg font-medium ${
									isRunning
										? "bg-red-500 text-white hover:bg-red-600"
										: "bg-green-500 text-white hover:bg-green-600"
								}`}
							>
								{isRunning ? "Stop" : "Start"} Real-time
							</button>
							<button
								onClick={resetSimulation}
								className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
							>
								Reset
							</button>
							<button
								onClick={runSimulation}
								className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
							>
								Run Simulation
							</button>
						</div>
					</div>

					{/* Controls */}
					<div className="space-y-4">
						{/* PID Parameters */}
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								PID Parameters
							</h3>

							<div className="space-y-3">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Kp (Proportional): {pidSettings.kp.toFixed(2)}
									</label>
									<input
										type="range"
										min="0"
										max="5"
										step="0.1"
										value={pidSettings.kp}
										onChange={(e) =>
											setPidSettings((prev) => ({
												...prev,
												kp: Number.parseFloat(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Ki (Integral): {pidSettings.ki.toFixed(3)}
									</label>
									<input
										type="range"
										min="0"
										max="2"
										step="0.01"
										value={pidSettings.ki}
										onChange={(e) =>
											setPidSettings((prev) => ({
												...prev,
												ki: Number.parseFloat(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Kd (Derivative): {pidSettings.kd.toFixed(3)}
									</label>
									<input
										type="range"
										min="0"
										max="1"
										step="0.001"
										value={pidSettings.kd}
										onChange={(e) =>
											setPidSettings((prev) => ({
												...prev,
												kd: Number.parseFloat(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Setpoint: {pidSettings.setpoint.toFixed(1)}
									</label>
									<input
										type="range"
										min="0.5"
										max="2"
										step="0.1"
										value={pidSettings.setpoint}
										onChange={(e) =>
											setPidSettings((prev) => ({
												...prev,
												setpoint: Number.parseFloat(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>
							</div>

							<div className="mt-3">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									PID Presets
								</label>
								<div className="grid grid-cols-2 gap-2">
									{Object.keys(pidPresets).map((preset) => (
										<button
											key={preset}
											onClick={() =>
												applyPIDPreset(preset as keyof typeof pidPresets)
											}
											className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
										>
											{preset.replace("_", " ")}
										</button>
									))}
								</div>
							</div>
						</div>

						{/* Plant Settings */}
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Plant Model
							</h3>

							<div className="space-y-3">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Plant Type
									</label>
									<select
										value={plantSettings.type}
										onChange={(e) => {
											const type = e.target.value as keyof typeof plantPresets;
											applyPlantPreset(type);
										}}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									>
										<option value="first_order">First Order</option>
										<option value="second_order">Second Order</option>
										<option value="integrator">Integrator</option>
										<option value="motor">DC Motor</option>
										<option value="thermal">Thermal System</option>
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Time Constant: {plantSettings.timeConstant.toFixed(2)}
									</label>
									<input
										type="range"
										min="0.1"
										max="10"
										step="0.1"
										value={plantSettings.timeConstant}
										onChange={(e) =>
											setPlantSettings((prev) => ({
												...prev,
												timeConstant: Number.parseFloat(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Damping Ratio: {plantSettings.dampingRatio.toFixed(2)}
									</label>
									<input
										type="range"
										min="0.1"
										max="2"
										step="0.1"
										value={plantSettings.dampingRatio}
										onChange={(e) =>
											setPlantSettings((prev) => ({
												...prev,
												dampingRatio: Number.parseFloat(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Plant Gain: {plantSettings.gain.toFixed(2)}
									</label>
									<input
										type="range"
										min="0.1"
										max="5"
										step="0.1"
										value={plantSettings.gain}
										onChange={(e) =>
											setPlantSettings((prev) => ({
												...prev,
												gain: Number.parseFloat(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>
							</div>
						</div>

						{/* Display Settings */}
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Display Options
							</h3>

							<div className="space-y-2">
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={displaySettings.showSetpoint}
										onChange={(e) =>
											setDisplaySettings((prev) => ({
												...prev,
												showSetpoint: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Setpoint
								</label>
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={displaySettings.showOutput}
										onChange={(e) =>
											setDisplaySettings((prev) => ({
												...prev,
												showOutput: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Output
								</label>
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={displaySettings.showError}
										onChange={(e) =>
											setDisplaySettings((prev) => ({
												...prev,
												showError: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Error
								</label>
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={displaySettings.showControl}
										onChange={(e) =>
											setDisplaySettings((prev) => ({
												...prev,
												showControl: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Control Signal
								</label>
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={displaySettings.showComponents}
										onChange={(e) =>
											setDisplaySettings((prev) => ({
												...prev,
												showComponents: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									PID Components
								</label>
							</div>

							<div className="mt-3">
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Time Window: {displaySettings.timeWindow}s
								</label>
								<input
									type="range"
									min="5"
									max="30"
									step="1"
									value={displaySettings.timeWindow}
									onChange={(e) =>
										setDisplaySettings((prev) => ({
											...prev,
											timeWindow: Number.parseInt(e.target.value),
										}))
									}
									className="w-full"
								/>
							</div>
						</div>

						{/* Performance Metrics */}
						{performanceMetrics && (
							<div className="bg-gray-50 rounded-lg p-4">
								<h3 className="text-lg font-semibold text-gray-800 mb-3">
									Performance Metrics
								</h3>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span>Rise Time:</span>
										<span className="font-mono">
											{performanceMetrics.riseTime.toFixed(2)}s
										</span>
									</div>
									<div className="flex justify-between">
										<span>Settling Time:</span>
										<span className="font-mono">
											{performanceMetrics.settlingTime.toFixed(2)}s
										</span>
									</div>
									<div className="flex justify-between">
										<span>Overshoot:</span>
										<span className="font-mono">
											{performanceMetrics.overshoot.toFixed(1)}%
										</span>
									</div>
									<div className="flex justify-between">
										<span>SS Error:</span>
										<span className="font-mono">
											{performanceMetrics.steadyStateError.toFixed(3)}
										</span>
									</div>
									<div className="flex justify-between">
										<span>IAE:</span>
										<span className="font-mono">
											{performanceMetrics.iae.toFixed(3)}
										</span>
									</div>
									<div className="flex justify-between">
										<span>ISE:</span>
										<span className="font-mono">
											{performanceMetrics.ise.toFixed(3)}
										</span>
									</div>
									<div className="flex justify-between">
										<span>Stability:</span>
										<span
											className={`font-mono ${
												performanceMetrics.stability === "stable"
													? "text-green-600"
													: performanceMetrics.stability === "marginally_stable"
														? "text-yellow-600"
														: "text-red-600"
											}`}
										>
											{performanceMetrics.stability.replace("_", " ")}
										</span>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				<div className="mt-6 bg-blue-50 rounded-lg p-4">
					<h3 className="text-lg font-semibold text-blue-800 mb-2">
						Control Systems Applications
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
						<div>
							<strong>Industrial Applications:</strong>
							<ul className="mt-1 space-y-1">
								<li>• Temperature control systems</li>
								<li>• Motor speed control</li>
								<li>• Process automation</li>
								<li>• Flow rate regulation</li>
							</ul>
						</div>
						<div>
							<strong>Performance Tuning:</strong>
							<ul className="mt-1 space-y-1">
								<li>• Ziegler-Nichols method</li>
								<li>• Cohen-Coon tuning</li>
								<li>• Lambda tuning</li>
								<li>• Manual optimization</li>
							</ul>
						</div>
					</div>
				</div>

				<div className="mt-6 text-center">
					<a 
						href="/examples/engineering" 
						className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
					>
						← Back to Engineering Examples
					</a>
				</div>
			</div>
		</div>
	);
}