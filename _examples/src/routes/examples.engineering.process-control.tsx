import { Link, createFileRoute } from "@tanstack/react-router";
import {
	PI,
	TWO_PI,
	clamp,
	cos,
	easeInOutCubic,
	hsl,
	hslToRgb,
	lerp,
	randomFloat,
	sin,
	toCssHsl,
} from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/engineering/process-control")({
	component: ProcessControlExample,
});

interface PIDController {
	kp: number; // Proportional gain
	ki: number; // Integral gain
	kd: number; // Derivative gain
	integral: number;
	previousError: number;
	output: number;
	setpoint: number;
}

interface ProcessModel {
	gain: number;
	timeConstant: number;
	deadTime: number;
	disturbance: number;
	noise: number;
	output: number;
	states: number[];
}

interface SystemResponse {
	time: number[];
	setpoint: number[];
	output: number[];
	error: number[];
	controlSignal: number[];
	disturbance: number[];
}

interface ControlMetrics {
	overshoot: number;
	settlingTime: number;
	riseTime: number;
	steadyStateError: number;
	integralAbsoluteError: number;
	integralSquaredError: number;
}

function ProcessControlExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const bodeCanvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const timeRef = useRef<number>(0);

	const [pid, setPID] = useState<PIDController>({
		kp: 1.0,
		ki: 0.5,
		kd: 0.1,
		integral: 0,
		previousError: 0,
		output: 0,
		setpoint: 1.0,
	});

	const [process, setProcess] = useState<ProcessModel>({
		gain: 2.0,
		timeConstant: 1.5,
		deadTime: 0.2,
		disturbance: 0,
		noise: 0.01,
		output: 0,
		states: [0, 0, 0],
	});

	const [response, setResponse] = useState<SystemResponse>({
		time: [],
		setpoint: [],
		output: [],
		error: [],
		controlSignal: [],
		disturbance: [],
	});

	const [controlType, setControlType] = useState<"P" | "PI" | "PID" | "manual">(
		"PID",
	);
	const [systemType, setSystemType] = useState<
		"first-order" | "second-order" | "integrating" | "unstable"
	>("first-order");
	const [isRunning, setIsRunning] = useState(false);
	const [autoTune, setAutoTune] = useState(false);
	const [metrics, setMetrics] = useState<ControlMetrics>({
		overshoot: 0,
		settlingTime: 0,
		riseTime: 0,
		steadyStateError: 0,
		integralAbsoluteError: 0,
		integralSquaredError: 0,
	});

	const [displayMode, setDisplayMode] = useState<
		"time-response" | "bode-plot" | "root-locus" | "nyquist"
	>("time-response");
	const [stepChange, setStepChange] = useState({ time: 0, magnitude: 1.0 });
	const [disturbanceTime, setDisturbanceTime] = useState(0);

	const dt = 0.01; // Simulation time step

	// PID Controller calculation
	const calculatePID = (error: number, dt: number): number => {
		// Proportional term
		const proportional = pid.kp * error;

		// Integral term with windup protection
		pid.integral += error * dt;
		pid.integral = clamp(pid.integral, -10, 10); // Anti-windup
		const integral = pid.ki * pid.integral;

		// Derivative term with filtering
		const derivative = (pid.kd * (error - pid.previousError)) / dt;
		pid.previousError = error;

		// PID output
		let output = proportional + integral + derivative;

		// Apply control type limitations
		switch (controlType) {
			case "P":
				output = proportional;
				break;
			case "PI":
				output = proportional + integral;
				break;
			case "PID":
				// Full PID already calculated
				break;
			case "manual":
				output = pid.output; // Manual control mode
				break;
		}

		return clamp(output, -10, 10); // Actuator saturation
	};

	// Process simulation (first-order with dead time)
	const simulateProcess = (input: number, dt: number): number => {
		const delayedInput = input; // Simplified - real implementation would use delay buffer

		switch (systemType) {
			case "first-order":
				// First-order system: G(s) = K / (τs + 1)
				process.states[0] +=
					((process.gain * delayedInput - process.states[0]) * dt) /
					process.timeConstant;
				return (
					process.states[0] +
					process.disturbance +
					randomFloat(-process.noise, process.noise)
				);

			case "second-order":
				// Second-order underdamped system
				const wn = 2.0; // Natural frequency
				const zeta = 0.3; // Damping ratio
				const a0 = wn * wn;
				const a1 = 2 * zeta * wn;

				const acceleration =
					a0 * (process.gain * delayedInput) -
					a1 * process.states[1] -
					a0 * process.states[0];
				process.states[1] += acceleration * dt;
				process.states[0] += process.states[1] * dt;
				return (
					process.states[0] +
					process.disturbance +
					randomFloat(-process.noise, process.noise)
				);

			case "integrating":
				// Integrating process: G(s) = K / s
				process.states[0] += process.gain * delayedInput * dt;
				return (
					process.states[0] +
					process.disturbance +
					randomFloat(-process.noise, process.noise)
				);

			case "unstable":
				// Unstable process: G(s) = K / (s - 1)
				process.states[0] +=
					(process.gain * delayedInput + process.states[0]) * dt;
				return (
					process.states[0] +
					process.disturbance +
					randomFloat(-process.noise, process.noise)
				);

			default:
				return 0;
		}
	};

	// Auto-tuning using Ziegler-Nichols method (simplified)
	const performAutoTune = () => {
		// Simplified auto-tuning based on process characteristics
		const ku = 4.0 / (process.gain * process.timeConstant); // Critical gain estimate
		const tu = 2 * PI * Math.sqrt(process.timeConstant); // Critical period estimate

		switch (controlType) {
			case "P":
				setPID((prev) => ({ ...prev, kp: 0.5 * ku, ki: 0, kd: 0 }));
				break;
			case "PI":
				setPID((prev) => ({
					...prev,
					kp: 0.45 * ku,
					ki: (0.54 * ku) / tu,
					kd: 0,
				}));
				break;
			case "PID":
				setPID((prev) => ({
					...prev,
					kp: 0.6 * ku,
					ki: (1.2 * ku) / tu,
					kd: 0.075 * ku * tu,
				}));
				break;
		}
	};

	// Calculate performance metrics
	const calculateMetrics = (response: SystemResponse) => {
		if (response.time.length < 10) return;

		const finalValue = response.setpoint[response.setpoint.length - 1];
		const steady_state_tolerance = 0.02 * Math.abs(finalValue);

		// Find overshoot
		const maxOutput = Math.max(...response.output);
		const overshoot =
			finalValue > 0
				? Math.max(0, ((maxOutput - finalValue) / finalValue) * 100)
				: 0;

		// Find rise time (10% to 90% of final value)
		const target10 = 0.1 * finalValue;
		const target90 = 0.9 * finalValue;
		let riseStart = -1,
			riseEnd = -1;

		for (let i = 0; i < response.output.length; i++) {
			if (
				riseStart === -1 &&
				Math.abs(response.output[i]) >= Math.abs(target10)
			) {
				riseStart = i;
			}
			if (
				riseStart !== -1 &&
				riseEnd === -1 &&
				Math.abs(response.output[i]) >= Math.abs(target90)
			) {
				riseEnd = i;
				break;
			}
		}

		const riseTime =
			riseStart !== -1 && riseEnd !== -1
				? response.time[riseEnd] - response.time[riseStart]
				: 0;

		// Find settling time (within 2% of final value)
		let settlingTime = response.time[response.time.length - 1];
		for (let i = response.output.length - 1; i >= 0; i--) {
			if (Math.abs(response.output[i] - finalValue) > steady_state_tolerance) {
				settlingTime = response.time[i];
				break;
			}
		}

		// Steady-state error
		const lastFew = response.output.slice(-10);
		const avgFinalOutput =
			lastFew.reduce((sum, val) => sum + val, 0) / lastFew.length;
		const steadyStateError = Math.abs(finalValue - avgFinalOutput);

		// Integral errors
		let iae = 0,
			ise = 0;
		for (let i = 0; i < response.error.length; i++) {
			iae += Math.abs(response.error[i]) * dt;
			ise += response.error[i] * response.error[i] * dt;
		}

		setMetrics({
			overshoot,
			riseTime,
			settlingTime,
			steadyStateError,
			integralAbsoluteError: iae,
			integralSquaredError: ise,
		});
	};

	// Simulation step
	const simulationStep = () => {
		const currentTime = timeRef.current;

		// Apply step change
		let currentSetpoint = pid.setpoint;
		if (currentTime >= stepChange.time && stepChange.time > 0) {
			currentSetpoint = stepChange.magnitude;
		}

		// Apply disturbance
		let currentDisturbance = process.disturbance;
		if (currentTime >= disturbanceTime && disturbanceTime > 0) {
			currentDisturbance = 0.5;
		}

		// Calculate error
		const error = currentSetpoint - process.output;

		// Calculate control signal
		const controlSignal =
			controlType !== "manual" ? calculatePID(error, dt) : pid.output;

		// Simulate process
		const newOutput = simulateProcess(controlSignal, dt);
		setProcess((prev) => ({
			...prev,
			output: newOutput,
			disturbance: currentDisturbance,
		}));

		// Update response data
		setResponse((prev) => {
			const maxDataPoints = 1000;
			const newTime = [...prev.time, currentTime].slice(-maxDataPoints);
			const newSetpoint = [...prev.setpoint, currentSetpoint].slice(
				-maxDataPoints,
			);
			const newOutput = [...prev.output, newOutput].slice(-maxDataPoints);
			const newError = [...prev.error, error].slice(-maxDataPoints);
			const newControlSignal = [...prev.controlSignal, controlSignal].slice(
				-maxDataPoints,
			);
			const newDisturbance = [...prev.disturbance, currentDisturbance].slice(
				-maxDataPoints,
			);

			const updatedResponse = {
				time: newTime,
				setpoint: newSetpoint,
				output: newOutput,
				error: newError,
				controlSignal: newControlSignal,
				disturbance: newDisturbance,
			};

			// Calculate metrics every 100 steps
			if (newTime.length % 100 === 0) {
				calculateMetrics(updatedResponse);
			}

			return updatedResponse;
		});

		timeRef.current += dt;
	};

	const renderTimeResponse = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw background
		ctx.fillStyle = "#f8fafc";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		if (response.time.length < 2) return;

		const timeRange = Math.max(20, response.time[response.time.length - 1]);
		const xScale = (canvas.width - 80) / timeRange;
		const yScale = (canvas.height - 80) / 4; // Assuming ±2 range
		const centerY = canvas.height / 2;

		// Draw grid
		ctx.strokeStyle = "#e2e8f0";
		ctx.lineWidth = 1;

		// Horizontal grid lines
		for (let i = -2; i <= 2; i++) {
			const y = centerY - (i * yScale) / 2;
			ctx.beginPath();
			ctx.moveTo(40, y);
			ctx.lineTo(canvas.width - 40, y);
			ctx.stroke();

			// Labels
			ctx.fillStyle = "#64748b";
			ctx.font = "12px Arial";
			ctx.textAlign = "right";
			ctx.fillText(i.toString(), 35, y + 4);
		}

		// Vertical grid lines
		const timeSteps = 10;
		for (let i = 0; i <= timeSteps; i++) {
			const x = 40 + (i * (canvas.width - 80)) / timeSteps;
			const time = (i * timeRange) / timeSteps;

			ctx.beginPath();
			ctx.moveTo(x, 40);
			ctx.lineTo(x, canvas.height - 40);
			ctx.stroke();

			// Time labels
			ctx.fillStyle = "#64748b";
			ctx.font = "12px Arial";
			ctx.textAlign = "center";
			ctx.fillText(time.toFixed(1) + "s", x, canvas.height - 20);
		}

		// Draw axes
		ctx.strokeStyle = "#1e293b";
		ctx.lineWidth = 2;

		// X-axis
		ctx.beginPath();
		ctx.moveTo(40, centerY);
		ctx.lineTo(canvas.width - 40, centerY);
		ctx.stroke();

		// Y-axis
		ctx.beginPath();
		ctx.moveTo(40, 40);
		ctx.lineTo(40, canvas.height - 40);
		ctx.stroke();

		// Draw signals
		const drawSignal = (
			data: number[],
			color: string,
			lineWidth: number,
			label: string,
		) => {
			if (data.length < 2) return;

			ctx.strokeStyle = color;
			ctx.lineWidth = lineWidth;
			ctx.beginPath();

			for (let i = 0; i < Math.min(data.length, response.time.length); i++) {
				const x = 40 + response.time[i] * xScale;
				const y = centerY - (data[i] * yScale) / 2;

				if (i === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			}

			ctx.stroke();
		};

		// Draw setpoint (red dashed)
		ctx.setLineDash([5, 5]);
		drawSignal(response.setpoint, "#ef4444", 2, "Setpoint");
		ctx.setLineDash([]);

		// Draw output (blue solid)
		drawSignal(response.output, "#3b82f6", 3, "Process Output");

		// Draw control signal (green)
		drawSignal(response.controlSignal, "#10b981", 2, "Control Signal");

		// Draw disturbance (orange)
		if (response.disturbance.some((d) => d !== 0)) {
			drawSignal(response.disturbance, "#f59e0b", 2, "Disturbance");
		}

		// Legend
		const legends = [
			{ color: "#ef4444", label: "Setpoint", dash: true },
			{ color: "#3b82f6", label: "Process Output", dash: false },
			{ color: "#10b981", label: "Control Signal", dash: false },
		];

		if (response.disturbance.some((d) => d !== 0)) {
			legends.push({ color: "#f59e0b", label: "Disturbance", dash: false });
		}

		legends.forEach((legend, index) => {
			const x = canvas.width - 200;
			const y = 60 + index * 25;

			ctx.strokeStyle = legend.color;
			ctx.lineWidth = 3;
			if (legend.dash) ctx.setLineDash([5, 5]);
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(x + 30, y);
			ctx.stroke();
			ctx.setLineDash([]);

			ctx.fillStyle = "#1e293b";
			ctx.font = "12px Arial";
			ctx.textAlign = "left";
			ctx.fillText(legend.label, x + 35, y + 4);
		});

		// Labels
		ctx.fillStyle = "#1e293b";
		ctx.font = "14px Arial";
		ctx.textAlign = "left";
		ctx.fillText("Output", 10, 25);

		ctx.save();
		ctx.translate(canvas.width / 2, canvas.height - 5);
		ctx.textAlign = "center";
		ctx.fillText("Time (seconds)", 0, 0);
		ctx.restore();
	};

	const renderBodePlot = () => {
		const canvas = bodeCanvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw background
		ctx.fillStyle = "#f8fafc";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Frequency range
		const freqMin = 0.01;
		const freqMax = 100;
		const frequencies: number[] = [];
		const magnitude: number[] = [];
		const phase: number[] = [];

		// Calculate frequency response
		for (let i = 0; i < 100; i++) {
			const freq = freqMin * Math.pow(freqMax / freqMin, i / 99);
			frequencies.push(freq);

			const omega = 2 * PI * freq;
			const s = { real: 0, imag: omega };

			// PID transfer function: Kp + Ki/s + Kd*s
			const pidNumerator = {
				real: pid.kp - pid.kd * omega * omega,
				imag: pid.ki / omega + pid.kd * omega,
			};

			// Process transfer function (first-order): K / (τs + 1)
			const processDenominator = {
				real: 1,
				imag: process.timeConstant * omega,
			};

			// Closed-loop transfer function calculation (simplified)
			const openLoopMag =
				(Math.sqrt(
					pidNumerator.real * pidNumerator.real +
						pidNumerator.imag * pidNumerator.imag,
				) *
					process.gain) /
				Math.sqrt(
					processDenominator.real * processDenominator.real +
						processDenominator.imag * processDenominator.imag,
				);

			const openLoopPhase =
				Math.atan2(pidNumerator.imag, pidNumerator.real) -
				Math.atan2(processDenominator.imag, processDenominator.real);

			magnitude.push(20 * Math.log10(openLoopMag));
			phase.push((openLoopPhase * 180) / PI);
		}

		const halfHeight = canvas.height / 2;

		// Draw magnitude plot
		ctx.fillStyle = "#1e293b";
		ctx.font = "14px Arial";
		ctx.textAlign = "center";
		ctx.fillText("Bode Plot - Open Loop Response", canvas.width / 2, 20);

		// Magnitude plot background
		ctx.fillStyle = "#f1f5f9";
		ctx.fillRect(40, 40, canvas.width - 80, halfHeight - 60);

		// Phase plot background
		ctx.fillStyle = "#f1f5f9";
		ctx.fillRect(40, halfHeight + 20, canvas.width - 80, halfHeight - 60);

		// Draw magnitude
		ctx.strokeStyle = "#3b82f6";
		ctx.lineWidth = 2;
		ctx.beginPath();

		const xScale = (canvas.width - 80) / Math.log10(freqMax / freqMin);
		const magScale = (halfHeight - 80) / 80; // 80 dB range
		const phaseScale = (halfHeight - 80) / 360; // 360 degree range

		for (let i = 0; i < frequencies.length; i++) {
			const x = 40 + Math.log10(frequencies[i] / freqMin) * xScale;
			const y = halfHeight - 20 - (magnitude[i] + 40) * magScale;

			if (i === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		}
		ctx.stroke();

		// Draw phase
		ctx.strokeStyle = "#ef4444";
		ctx.lineWidth = 2;
		ctx.beginPath();

		for (let i = 0; i < frequencies.length; i++) {
			const x = 40 + Math.log10(frequencies[i] / freqMin) * xScale;
			const y = canvas.height - 40 - (phase[i] + 180) * phaseScale;

			if (i === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		}
		ctx.stroke();

		// Draw 0 dB line
		ctx.strokeStyle = "#6b7280";
		ctx.setLineDash([3, 3]);
		ctx.beginPath();
		ctx.moveTo(40, halfHeight - 20 - 40 * magScale);
		ctx.lineTo(canvas.width - 40, halfHeight - 20 - 40 * magScale);
		ctx.stroke();

		// Draw -180° line
		ctx.beginPath();
		ctx.moveTo(40, canvas.height - 40);
		ctx.lineTo(canvas.width - 40, canvas.height - 40);
		ctx.stroke();
		ctx.setLineDash([]);

		// Labels
		ctx.fillStyle = "#1e293b";
		ctx.font = "12px Arial";
		ctx.textAlign = "right";
		ctx.fillText("Magnitude (dB)", 35, halfHeight / 2);
		ctx.fillText("Phase (°)", 35, halfHeight + halfHeight / 2);
		ctx.textAlign = "center";
		ctx.fillText("Frequency (Hz)", canvas.width / 2, canvas.height - 5);
	};

	const animate = () => {
		if (isRunning) {
			simulationStep();
		}

		if (displayMode === "time-response") {
			renderTimeResponse();
		} else if (displayMode === "bode-plot") {
			renderBodePlot();
		}

		animationRef.current = requestAnimationFrame(animate);
	};

	const resetSimulation = () => {
		timeRef.current = 0;
		setPID((prev) => ({ ...prev, integral: 0, previousError: 0 }));
		setProcess((prev) => ({ ...prev, output: 0, states: [0, 0, 0] }));
		setResponse({
			time: [],
			setpoint: [],
			output: [],
			error: [],
			controlSignal: [],
			disturbance: [],
		});
		setStepChange({ time: 0, magnitude: 1.0 });
		setDisturbanceTime(0);
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		const bodeCanvas = bodeCanvasRef.current;
		if (!canvas || !bodeCanvas) return;

		canvas.width = 800;
		canvas.height = 500;
		bodeCanvas.width = 600;
		bodeCanvas.height = 500;

		animationRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (autoTune) {
			performAutoTune();
			setAutoTune(false);
		}
	}, [autoTune, controlType]);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">Process Control Systems</h1>
				<p className="text-gray-600 mb-4">
					Advanced PID controller design and analysis with real-time process
					simulation and performance metrics.
				</p>
				<div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
					<p className="text-indigo-800">
						🎛️ Interactive control system design with PID tuning, process
						modeling, and stability analysis
					</p>
				</div>
			</div>

			{/* Control Panel */}
			<div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Control Type
						</label>
						<select
							value={controlType}
							onChange={(e) =>
								setControlType(e.target.value as typeof controlType)
							}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
						>
							<option value="P">Proportional (P)</option>
							<option value="PI">Proportional-Integral (PI)</option>
							<option value="PID">PID Controller</option>
							<option value="manual">Manual Control</option>
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Process Type
						</label>
						<select
							value={systemType}
							onChange={(e) => {
								setSystemType(e.target.value as typeof systemType);
								resetSimulation();
							}}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
						>
							<option value="first-order">First Order</option>
							<option value="second-order">Second Order</option>
							<option value="integrating">Integrating</option>
							<option value="unstable">Unstable</option>
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
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
						>
							<option value="time-response">Time Response</option>
							<option value="bode-plot">Bode Plot</option>
						</select>
					</div>

					<div className="flex flex-col gap-2">
						<button
							type="button"
							onClick={() => setIsRunning(!isRunning)}
							className={`px-4 py-2 rounded-md transition-colors ${
								isRunning
									? "bg-red-600 text-white hover:bg-red-700"
									: "bg-green-600 text-white hover:bg-green-700"
							}`}
						>
							{isRunning ? "Stop" : "Start"}
						</button>
						<button
							type="button"
							onClick={resetSimulation}
							className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
						>
							Reset
						</button>
					</div>
				</div>

				{/* PID Parameters */}
				<div className="mb-4">
					<h3 className="text-lg font-semibold mb-3">Controller Parameters</h3>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Kp (Proportional): {pid.kp.toFixed(3)}
							</label>
							<input
								type="range"
								min="0"
								max="10"
								step="0.1"
								value={pid.kp}
								onChange={(e) =>
									setPID((prev) => ({ ...prev, kp: Number(e.target.value) }))
								}
								className="w-full"
								disabled={controlType === "manual"}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Ki (Integral): {pid.ki.toFixed(3)}
							</label>
							<input
								type="range"
								min="0"
								max="5"
								step="0.05"
								value={pid.ki}
								onChange={(e) =>
									setPID((prev) => ({ ...prev, ki: Number(e.target.value) }))
								}
								className="w-full"
								disabled={controlType === "P" || controlType === "manual"}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Kd (Derivative): {pid.kd.toFixed(3)}
							</label>
							<input
								type="range"
								min="0"
								max="2"
								step="0.01"
								value={pid.kd}
								onChange={(e) =>
									setPID((prev) => ({ ...prev, kd: Number(e.target.value) }))
								}
								className="w-full"
								disabled={
									controlType === "P" ||
									controlType === "PI" ||
									controlType === "manual"
								}
							/>
						</div>
						<div className="flex items-end">
							<button
								type="button"
								onClick={() => setAutoTune(true)}
								className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
								disabled={controlType === "manual"}
							>
								Auto-Tune
							</button>
						</div>
					</div>
				</div>

				{/* Process Parameters */}
				<div className="mb-4">
					<h3 className="text-lg font-semibold mb-3">Process Parameters</h3>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Process Gain: {process.gain.toFixed(2)}
							</label>
							<input
								type="range"
								min="0.1"
								max="5"
								step="0.1"
								value={process.gain}
								onChange={(e) =>
									setProcess((prev) => ({
										...prev,
										gain: Number(e.target.value),
									}))
								}
								className="w-full"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Time Constant: {process.timeConstant.toFixed(2)}s
							</label>
							<input
								type="range"
								min="0.1"
								max="5"
								step="0.1"
								value={process.timeConstant}
								onChange={(e) =>
									setProcess((prev) => ({
										...prev,
										timeConstant: Number(e.target.value),
									}))
								}
								className="w-full"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Dead Time: {process.deadTime.toFixed(2)}s
							</label>
							<input
								type="range"
								min="0"
								max="2"
								step="0.1"
								value={process.deadTime}
								onChange={(e) =>
									setProcess((prev) => ({
										...prev,
										deadTime: Number(e.target.value),
									}))
								}
								className="w-full"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Noise Level: {process.noise.toFixed(3)}
							</label>
							<input
								type="range"
								min="0"
								max="0.1"
								step="0.001"
								value={process.noise}
								onChange={(e) =>
									setProcess((prev) => ({
										...prev,
										noise: Number(e.target.value),
									}))
								}
								className="w-full"
							/>
						</div>
					</div>
				</div>

				{/* Test Inputs */}
				<div>
					<h3 className="text-lg font-semibold mb-3">Test Inputs</h3>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Setpoint: {pid.setpoint.toFixed(2)}
							</label>
							<input
								type="range"
								min="0"
								max="3"
								step="0.1"
								value={pid.setpoint}
								onChange={(e) =>
									setPID((prev) => ({
										...prev,
										setpoint: Number(e.target.value),
									}))
								}
								className="w-full"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Step Time: {stepChange.time.toFixed(1)}s
							</label>
							<input
								type="range"
								min="0"
								max="20"
								step="0.5"
								value={stepChange.time}
								onChange={(e) =>
									setStepChange((prev) => ({
										...prev,
										time: Number(e.target.value),
									}))
								}
								className="w-full"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Step Magnitude: {stepChange.magnitude.toFixed(2)}
							</label>
							<input
								type="range"
								min="0"
								max="3"
								step="0.1"
								value={stepChange.magnitude}
								onChange={(e) =>
									setStepChange((prev) => ({
										...prev,
										magnitude: Number(e.target.value),
									}))
								}
								className="w-full"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Disturbance Time: {disturbanceTime.toFixed(1)}s
							</label>
							<input
								type="range"
								min="0"
								max="20"
								step="0.5"
								value={disturbanceTime}
								onChange={(e) => setDisturbanceTime(Number(e.target.value))}
								className="w-full"
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Performance Metrics */}
			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-3">Performance Metrics</h3>
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
						<h4 className="font-medium text-blue-800 text-sm">Overshoot</h4>
						<p className="text-lg font-bold text-blue-900">
							{metrics.overshoot.toFixed(1)}%
						</p>
					</div>
					<div className="bg-green-50 border border-green-200 rounded-lg p-3">
						<h4 className="font-medium text-green-800 text-sm">Rise Time</h4>
						<p className="text-lg font-bold text-green-900">
							{metrics.riseTime.toFixed(2)}s
						</p>
					</div>
					<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
						<h4 className="font-medium text-yellow-800 text-sm">
							Settling Time
						</h4>
						<p className="text-lg font-bold text-yellow-900">
							{metrics.settlingTime.toFixed(2)}s
						</p>
					</div>
					<div className="bg-red-50 border border-red-200 rounded-lg p-3">
						<h4 className="font-medium text-red-800 text-sm">SS Error</h4>
						<p className="text-lg font-bold text-red-900">
							{metrics.steadyStateError.toFixed(3)}
						</p>
					</div>
					<div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
						<h4 className="font-medium text-purple-800 text-sm">IAE</h4>
						<p className="text-lg font-bold text-purple-900">
							{metrics.integralAbsoluteError.toFixed(2)}
						</p>
					</div>
					<div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
						<h4 className="font-medium text-indigo-800 text-sm">ISE</h4>
						<p className="text-lg font-bold text-indigo-900">
							{metrics.integralSquaredError.toFixed(2)}
						</p>
					</div>
				</div>
			</div>

			{/* Main Visualization */}
			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-3">
					{displayMode === "time-response"
						? "Time Domain Response"
						: "Frequency Domain Analysis"}
				</h3>
				<div className="bg-white rounded-lg border border-gray-300 p-4">
					{displayMode === "time-response" ? (
						<canvas
							ref={canvasRef}
							className="border border-gray-300 rounded-lg bg-white mx-auto block"
							style={{ maxWidth: "100%", height: "auto" }}
						/>
					) : (
						<canvas
							ref={bodeCanvasRef}
							className="border border-gray-300 rounded-lg bg-white mx-auto block"
							style={{ maxWidth: "100%", height: "auto" }}
						/>
					)}
				</div>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-indigo-800">
						Control Features
					</h3>
					<ul className="text-indigo-700 space-y-1">
						<li>
							• <strong>PID Controllers</strong>: P, PI, and full PID
							implementations
						</li>
						<li>
							• <strong>Auto-Tuning</strong>: Ziegler-Nichols tuning methods
						</li>
						<li>
							• <strong>Process Models</strong>: First/second order,
							integrating, unstable
						</li>
						<li>
							• <strong>Performance Metrics</strong>: Overshoot, settling time,
							IAE, ISE
						</li>
					</ul>
				</div>

				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-blue-800">
						Applications
					</h3>
					<ul className="text-blue-700 space-y-1">
						<li>
							• <strong>Process Industries</strong>: Temperature, pressure, flow
							control
						</li>
						<li>
							• <strong>Manufacturing</strong>: Motor speed, position control
						</li>
						<li>
							• <strong>Chemical Plants</strong>: Reactor temperature, pH
							control
						</li>
						<li>
							• <strong>Power Systems</strong>: Frequency, voltage regulation
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6">
				<Link
					to="/examples/engineering"
					className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
				>
					← Back to Examples
				</Link>
			</div>
		</div>
	);
}
