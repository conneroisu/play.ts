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
import { useCallback, useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/engineering/control-systems")({
	component: ControlSystemsExample,
});

interface PIDController {
	kp: number; // Proportional gain
	ki: number; // Integral gain
	kd: number; // Derivative gain
	setpoint: number;
	integral: number;
	previousError: number;
	derivative: number;
	output: number;
	enabled: boolean;
}

interface SystemState {
	position: number;
	velocity: number;
	acceleration: number;
	time: number;
	error: number;
	errorIntegral: number;
	errorDerivative: number;
}

interface Plant {
	type:
		| "mass_spring_damper"
		| "dc_motor"
		| "temperature"
		| "level_control"
		| "custom";
	mass: number;
	damping: number;
	stiffness: number;
	gain: number;
	timeConstant: number;
	deadTime: number;
	nonlinearity: number;
	disturbance: number;
	noise: number;
}

interface SimulationSettings {
	timeStep: number;
	duration: number;
	sampleTime: number;
	realTime: boolean;
	showSetpoint: boolean;
	showOutput: boolean;
	showError: boolean;
	showControl: boolean;
	showDerivative: boolean;
	showIntegral: boolean;
	gridEnabled: boolean;
	autoScale: boolean;
}

interface PerformanceMetrics {
	riseTime: number;
	settlingTime: number;
	overshoot: number;
	steadyStateError: number;
	integralAbsoluteError: number;
	integralSquaredError: number;
	peakTime: number;
	oscillations: number;
}

function ControlSystemsExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const timeRef = useRef<number>(0);

	const [isSimulating, setIsSimulating] = useState(false);
	const [systemData, setSystemData] = useState<SystemState[]>([]);
	const [pidHistory, setPidHistory] = useState<
		{
			time: number;
			output: number;
			error: number;
			integral: number;
			derivative: number;
		}[]
	>([]);

	const [pid, setPid] = useState<PIDController>({
		kp: 1.0,
		ki: 0.1,
		kd: 0.05,
		setpoint: 1.0,
		integral: 0,
		previousError: 0,
		derivative: 0,
		output: 0,
		enabled: true,
	});

	const [plant, setPlant] = useState<Plant>({
		type: "mass_spring_damper",
		mass: 1.0,
		damping: 0.5,
		stiffness: 1.0,
		gain: 1.0,
		timeConstant: 1.0,
		deadTime: 0,
		nonlinearity: 0,
		disturbance: 0,
		noise: 0,
	});

	const [settings, setSettings] = useState<SimulationSettings>({
		timeStep: 0.01,
		duration: 10,
		sampleTime: 0.01,
		realTime: false,
		showSetpoint: true,
		showOutput: true,
		showError: true,
		showControl: false,
		showDerivative: false,
		showIntegral: false,
		gridEnabled: true,
		autoScale: false, // Use fixed scale to avoid scaling issues
	});

	const [controlMode, setControlMode] = useState<
		"pid" | "p" | "pi" | "pd" | "manual"
	>("pid");
	const [presetType, setPresetType] = useState<
		"step" | "ramp" | "sine" | "square" | "custom"
	>("step");
	const [tuningMethod, setTuningMethod] = useState<
		"manual" | "ziegler_nichols" | "cohen_coon" | "lambda"
	>("manual");

	const applyPlantPreset = (type: string) => {
		switch (type) {
			case "mass_spring_damper":
				setPlant((prev) => ({
					...prev,
					mass: 1.0,
					damping: 0.5,
					stiffness: 0.1, // Reduced spring constant for better step response
					gain: 1.0,
					timeConstant: 1.0,
				}));
				break;
			case "dc_motor":
				setPlant((prev) => ({
					...prev,
					mass: 0.1,
					damping: 0.2,
					stiffness: 0,
					gain: 10,
					timeConstant: 0.5,
				}));
				break;
			case "temperature":
				setPlant((prev) => ({
					...prev,
					mass: 5.0,
					damping: 1.0,
					stiffness: 0,
					gain: 0.8,
					timeConstant: 3.0,
				}));
				break;
			case "level_control":
				setPlant((prev) => ({
					...prev,
					mass: 2.0,
					damping: 0.3,
					stiffness: 0,
					gain: 1.2,
					timeConstant: 2.0,
				}));
				break;
		}
	};

	const autoTunePID = (method: string) => {
		// Adaptive auto-tuning based on plant characteristics
		const plantGain = plant.gain;
		const plantMass = plant.mass;
		const plantDamping = plant.damping;

		// Estimate critical gain and period based on plant parameters
		const Ku = 2.0 / plantGain; // Inversely related to plant gain
		const Tu = Math.sqrt(plantMass) * 2; // Related to system inertia

		// Use Ziegler-Nichols as default since it's most reliable
		const actualMethod = method === "manual" ? "ziegler_nichols" : method;

		switch (actualMethod) {
			case "ziegler_nichols":
				setPid((prev) => ({
					...prev,
					kp: 0.6 * Ku,
					ki: (1.2 * Ku) / Tu,
					kd: 0.075 * Ku * Tu,
				}));
				console.log("Auto-tuned PID using Ziegler-Nichols:", {
					Ku,
					Tu,
					plantGain,
					plantMass,
				});
				break;
			case "cohen_coon":
				const tau = plant.timeConstant;
				const K = plant.gain;
				const theta = plant.deadTime || 0.1;

				setPid((prev) => ({
					...prev,
					kp: (1.35 / K) * (tau / theta) * (1 + theta / (4 * tau)),
					ki:
						((1.35 / K) * (tau / theta) * (1 + theta / (4 * tau))) /
						(tau * (1 + theta / (12 * tau))),
					kd:
						((1.35 / K) *
							(tau / theta) *
							(1 + theta / (4 * tau)) *
							tau *
							theta) /
						(4 * tau + theta),
				}));
				break;
			case "lambda":
				const lambda = plant.timeConstant; // Desired closed-loop time constant
				setPid((prev) => ({
					...prev,
					kp: plant.timeConstant / (plant.gain * lambda),
					ki: 1 / lambda,
					kd: 0,
				}));
				break;
		}

		// Auto-optimize plant settings for better control demonstration
		applyPlantPreset("dc_motor"); // DC motor provides good step response characteristics

		// Reset simulation to see new tuning effect
		timeRef.current = 0;
		setSystemData([]);
		setPidHistory([]);
		setPid((prev) => ({
			...prev,
			integral: 0,
			previousError: 0,
			derivative: 0,
			output: 0,
		}));
	};

	const generateSetpoint = (time: number): number => {
		let setpoint: number;
		switch (presetType) {
			case "step":
				setpoint = time > 0.1 ? pid.setpoint : 0; // Step happens at 0.1s instead of 1s
				break;
			case "ramp":
				setpoint = time > 0.1 ? (time - 0.1) * 0.5 : 0;
				break;
			case "sine":
				setpoint = time > 0.1 ? pid.setpoint * sin(TWO_PI * 0.2 * time) : 0;
				break;
			case "square":
				setpoint =
					time > 0.1
						? sin(TWO_PI * 0.1 * time) > 0
							? pid.setpoint
							: -pid.setpoint
						: 0;
				break;
			default:
				setpoint = pid.setpoint;
		}

		// Removed excessive logging for performance

		return setpoint;
	};

	const simulatePlant = (
		controlSignal: number,
		currentState: SystemState,
		currentTime: number,
	): SystemState => {
		// Add disturbance and noise
		const disturbedInput =
			controlSignal + plant.disturbance + (Math.random() - 0.5) * plant.noise;

		// Plant simulation running: ${plant.type}

		let acceleration: number;

		switch (plant.type) {
			case "mass_spring_damper":
				// Mass-damper system for step tracking: m*a = F - c*v
				// Remove spring term to allow steady-state tracking of setpoint
				acceleration =
					(disturbedInput * plant.gain -
						plant.damping * currentState.velocity) /
					plant.mass;
				break;

			case "dc_motor":
				// DC motor model: simplified first-order with inertia
				acceleration =
					(disturbedInput * plant.gain -
						plant.damping * currentState.velocity) /
					plant.mass;
				break;

			case "temperature":
				// First-order thermal system
				acceleration =
					(disturbedInput * plant.gain - currentState.position) /
					(plant.mass * plant.timeConstant);
				break;

			case "level_control":
				// Integrating system with damping
				acceleration =
					(disturbedInput * plant.gain) / plant.mass -
					(plant.damping * currentState.velocity) / plant.mass;
				break;

			default:
				acceleration = (disturbedInput * plant.gain) / plant.mass;
		}

		// Apply nonlinearity (saturation)
		if (plant.nonlinearity > 0) {
			acceleration =
				Math.tanh(acceleration / plant.nonlinearity) * plant.nonlinearity;
		}

		// Euler integration
		const newVelocity =
			currentState.velocity + acceleration * settings.timeStep;
		const newPosition = currentState.position + newVelocity * settings.timeStep;

		return {
			position: newPosition,
			velocity: newVelocity,
			acceleration: acceleration,
			time: currentTime + settings.timeStep, // Use passed time for accurate tracking
			error: 0, // Will be calculated by controller
			errorIntegral: 0,
			errorDerivative: 0,
		};
	};

	const runPIDController = (currentState: SystemState): number => {
		if (!pid.enabled) return 0;

		const setpoint = generateSetpoint(currentState.time);
		const error = setpoint - currentState.position;

		// PID calculation
		let proportional = 0;
		let integral = 0;
		let derivative = 0;

		// Logging reduced for performance - mode: ${controlMode}

		switch (controlMode) {
			case "pid":
				proportional = pid.kp * error;
				pid.integral += error * settings.timeStep;
				integral = pid.ki * pid.integral;
				derivative = (pid.kd * (error - pid.previousError)) / settings.timeStep;
				break;
			case "p":
				proportional = pid.kp * error;
				break;
			case "pi":
				proportional = pid.kp * error;
				pid.integral += error * settings.timeStep;
				integral = pid.ki * pid.integral;
				break;
			case "pd":
				proportional = pid.kp * error;
				derivative = (pid.kd * (error - pid.previousError)) / settings.timeStep;
				break;
			case "manual":
				return pid.output;
		}

		const output = proportional + integral + derivative;

		// Anti-windup for integral term
		const maxOutput = 10;
		const clampedOutput = clamp(output, -maxOutput, maxOutput);
		if (Math.abs(output) > maxOutput) {
			pid.integral -= ((output - clampedOutput) / pid.ki) * settings.timeStep;
		}

		// PID output logged: P=${proportional.toFixed(2)}, I=${integral.toFixed(2)}, D=${derivative.toFixed(2)}

		pid.previousError = error;
		pid.output = clampedOutput;

		return clampedOutput;
	};

	const calculatePerformanceMetrics = (): PerformanceMetrics | null => {
		if (systemData.length < 100) return null;

		const setpointValue = pid.setpoint;
		const finalValue = systemData[systemData.length - 1]?.position || 0;
		const steadyStateError = Math.abs(setpointValue - finalValue);

		// Find rise time (10% to 90% of final value)
		let riseTime = 0;
		const target10 = 0.1 * setpointValue;
		const target90 = 0.9 * setpointValue;
		let rise10Index = -1;
		let rise90Index = -1;

		for (let i = 0; i < systemData.length; i++) {
			if (rise10Index === -1 && systemData[i].position >= target10) {
				rise10Index = i;
			}
			if (rise90Index === -1 && systemData[i].position >= target90) {
				rise90Index = i;
				break;
			}
		}

		if (rise10Index !== -1 && rise90Index !== -1) {
			riseTime = (rise90Index - rise10Index) * settings.timeStep;
		}

		// Find overshoot
		let maxValue = 0;
		let peakTime = 0;
		for (let i = 0; i < systemData.length; i++) {
			if (systemData[i].position > maxValue) {
				maxValue = systemData[i].position;
				peakTime = systemData[i].time;
			}
		}
		const overshoot = Math.max(
			0,
			((maxValue - setpointValue) / setpointValue) * 100,
		);

		// Find settling time (within 2% of final value)
		let settlingTime = systemData[systemData.length - 1]?.time || 0;
		const tolerance = 0.02 * Math.abs(setpointValue);
		for (let i = systemData.length - 1; i >= 0; i--) {
			if (Math.abs(systemData[i].position - setpointValue) > tolerance) {
				settlingTime = systemData[i].time;
				break;
			}
		}

		// Calculate IAE and ISE
		let iae = 0;
		let ise = 0;
		for (const point of systemData) {
			const error = Math.abs(setpointValue - point.position);
			iae += error * settings.timeStep;
			ise += error * error * settings.timeStep;
		}

		// Count oscillations
		let oscillations = 0;
		let previousSlope = 0;
		for (let i = 1; i < systemData.length; i++) {
			const slope = systemData[i].position - systemData[i - 1].position;
			if (previousSlope > 0 && slope < 0) oscillations++;
			previousSlope = slope;
		}

		return {
			riseTime,
			settlingTime,
			overshoot,
			steadyStateError,
			integralAbsoluteError: iae,
			integralSquaredError: ise,
			peakTime,
			oscillations,
		};
	};

	const draw = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;

		// Clear with a light background to ensure canvas is visible
		ctx.fillStyle = "#f8fafc";
		ctx.fillRect(0, 0, width, height);

		// Optimized grid drawing - batch all lines in one path
		ctx.strokeStyle = "rgba(200, 200, 200, 0.5)";
		ctx.lineWidth = 1;
		ctx.beginPath();

		// Draw all vertical grid lines in one path
		for (let x = 0; x <= width; x += 50) {
			ctx.moveTo(x, 0);
			ctx.lineTo(x, height);
		}
		// Draw all horizontal grid lines in one path
		for (let y = 0; y <= height; y += 50) {
			ctx.moveTo(0, y);
			ctx.lineTo(width, y);
		}
		ctx.stroke();

		// Draw center axes
		ctx.strokeStyle = "rgba(100, 100, 100, 0.8)";
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(0, height / 2);
		ctx.lineTo(width, height / 2);
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(50, 0);
		ctx.lineTo(50, height);
		ctx.stroke();

		if (systemData.length < 2) {
			// Draw empty state message instead of logging
			ctx.fillStyle = "#6b7280";
			ctx.font = "16px Arial";
			ctx.textAlign = "center";
			ctx.fillText("Waiting for simulation data...", width / 2, height / 2);
			return;
		}

		// Downsample data for performance when we have many points
		const maxRenderPoints = 500; // Maximum points to render
		let renderData = systemData;
		if (systemData.length > maxRenderPoints) {
			const step = Math.ceil(systemData.length / maxRenderPoints);
			renderData = systemData.filter((_, index) => index % step === 0);
			// Always include the last point for accurate current state
			if (systemData.length > 0) {
				renderData.push(systemData[systemData.length - 1]);
			}
		}

		if (systemData.length % 100 === 0) {
			// Only log every 100 data points
			console.log(
				`CANVAS: ${systemData.length} total, ${renderData.length} rendered, mode: ${controlMode}, plant: ${plant.type}`,
			);
		}

		// Auto-scale or fixed scale
		let minY = settings.autoScale
			? Math.min(...renderData.map((d) => d.position))
			: -2;
		let maxY = settings.autoScale
			? Math.max(...renderData.map((d) => d.position))
			: 3;
		const padding = (maxY - minY) * 0.1;
		minY -= padding;
		maxY += padding;

		const maxTime =
			renderData[renderData.length - 1]?.time || settings.duration;

		// Draw grid
		if (settings.gridEnabled) {
			ctx.strokeStyle = "rgba(200, 200, 200, 0.5)";
			ctx.lineWidth = 1;

			// Vertical grid lines (time)
			for (let t = 0; t <= maxTime; t += 1) {
				const x = (t / maxTime) * width;
				ctx.beginPath();
				ctx.moveTo(x, 0);
				ctx.lineTo(x, height);
				ctx.stroke();
			}

			// Horizontal grid lines (amplitude)
			const ySteps = 8;
			for (let i = 0; i <= ySteps; i++) {
				const y = (i / ySteps) * height;
				ctx.beginPath();
				ctx.moveTo(0, y);
				ctx.lineTo(width, y);
				ctx.stroke();
			}
		}

		// Helper function to convert data coordinates to canvas coordinates
		const toCanvasX = (time: number) => (time / maxTime) * width;
		const toCanvasY = (value: number) =>
			height - ((value - minY) / (maxY - minY)) * height;

		console.log(
			"Scale info - minY:",
			minY,
			"maxY:",
			maxY,
			"maxTime:",
			maxTime,
			"data range:",
			Math.min(...systemData.map((d) => d.position)),
			"to",
			Math.max(...systemData.map((d) => d.position)),
		);

		// Draw setpoint
		if (settings.showSetpoint) {
			ctx.strokeStyle = "rgba(128, 128, 128, 0.8)";
			ctx.lineWidth = 2;
			ctx.setLineDash([5, 5]);
			ctx.beginPath();
			for (let i = 0; i < renderData.length; i++) {
				const setpoint = generateSetpoint(renderData[i].time);
				const x = toCanvasX(renderData[i].time);
				const y = toCanvasY(setpoint);
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.stroke();
			ctx.setLineDash([]);
		}

		// Draw system output
		if (settings.showOutput) {
			ctx.strokeStyle = "rgba(59, 130, 246, 1)"; // Blue
			ctx.lineWidth = 3;
			ctx.beginPath();
			for (let i = 0; i < renderData.length; i++) {
				const x = toCanvasX(renderData[i].time);
				const y = toCanvasY(renderData[i].position);
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.stroke();
		}

		// Draw error
		if (settings.showError && pidHistory.length > 0) {
			ctx.strokeStyle = "rgba(239, 68, 68, 0.7)"; // Red
			ctx.lineWidth = 2;
			ctx.beginPath();
			for (let i = 0; i < pidHistory.length; i++) {
				const x = toCanvasX(pidHistory[i].time);
				const y = toCanvasY(pidHistory[i].error * 0.5); // Scale error for visibility
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.stroke();
		}

		// Draw control signal
		if (settings.showControl && pidHistory.length > 0) {
			ctx.strokeStyle = "rgba(34, 197, 94, 0.7)"; // Green
			ctx.lineWidth = 2;
			ctx.beginPath();
			for (let i = 0; i < pidHistory.length; i++) {
				const x = toCanvasX(pidHistory[i].time);
				const y = toCanvasY(pidHistory[i].output * 0.2); // Scale control signal
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.stroke();
		}

		// Draw labels
		ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
		ctx.font = "12px monospace";
		ctx.textAlign = "left";

		let labelY = 20;
		if (settings.showSetpoint) {
			ctx.fillStyle = "rgba(128, 128, 128, 0.8)";
			ctx.fillText("Setpoint", 10, labelY);
			labelY += 20;
		}
		if (settings.showOutput) {
			ctx.fillStyle = "rgba(59, 130, 246, 1)";
			ctx.fillText("Output", 10, labelY);
			labelY += 20;
		}
		if (settings.showError) {
			ctx.fillStyle = "rgba(239, 68, 68, 0.7)";
			ctx.fillText("Error (×0.5)", 10, labelY);
			labelY += 20;
		}
		if (settings.showControl) {
			ctx.fillStyle = "rgba(34, 197, 94, 0.7)";
			ctx.fillText("Control (×0.2)", 10, labelY);
		}
	};

	const simulate = useCallback(() => {
		if (!isSimulating) return;

		// Removed excessive logging

		const currentTime = timeRef.current;
		const currentState = systemData[systemData.length - 1] || {
			position: 0,
			velocity: 0,
			acceleration: 0,
			time: 0,
			error: 0,
			errorIntegral: 0,
			errorDerivative: 0,
		};

		// Run PID controller
		const controlSignal = runPIDController(currentState);

		// Simulate plant
		const newState = simulatePlant(controlSignal, currentState, currentTime);

		// Update error values
		const setpoint = generateSetpoint(newState.time);
		newState.error = setpoint - newState.position;

		// Store data (reduce logging frequency)
		if (newState.time % 5 < 0.1) {
			// Log every 5 seconds instead of every second
			console.log("SIMULATION DATA:", {
				time: newState.time.toFixed(2),
				position: newState.position.toFixed(3),
				velocity: newState.velocity.toFixed(3),
				acceleration: newState.acceleration.toFixed(3),
				controlSignal: controlSignal.toFixed(3),
				setpoint: generateSetpoint(newState.time).toFixed(3),
			});
		}

		setSystemData((prev) => [...prev.slice(-1000), newState]);
		setPidHistory((prev) => [
			...prev.slice(-1000),
			{
				time: newState.time,
				output: controlSignal,
				error: newState.error,
				integral: pid.integral,
				derivative: pid.derivative,
			},
		]);

		timeRef.current += settings.timeStep;

		// Reset time if duration is reached to allow continuous simulation
		if (currentTime >= settings.duration) {
			timeRef.current = 0;
			setSystemData([]);
			setPidHistory([]);
			setPid((prev) => ({
				...prev,
				integral: 0,
				previousError: 0,
				derivative: 0,
				output: 0,
			}));
		}
	}, [isSimulating, systemData, pid, plant, settings, controlMode, presetType]);

	const resetSimulation = () => {
		setIsSimulating(false);
		timeRef.current = 0;
		setSystemData([]);
		setPidHistory([]);
		setPid((prev) => ({
			...prev,
			integral: 0,
			previousError: 0,
			derivative: 0,
			output: 0,
		}));
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		// Set canvas dimensions programmatically (like wave interference example)
		canvas.width = 700;
		canvas.height = 400;

		console.log("Canvas initialized:", {
			width: canvas.width,
			height: canvas.height,
			offsetWidth: canvas.offsetWidth,
			offsetHeight: canvas.offsetHeight,
		});

		// Draw initial content to verify canvas is working
		const ctx = canvas.getContext("2d");
		if (ctx) {
			ctx.fillStyle = "#f0f9ff";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = "#1e40af";
			ctx.font = "16px Arial";
			ctx.fillText("PID Control System Ready", 20, 30);
			console.log("Canvas initial draw complete");
		}
	}, []);

	useEffect(() => {
		if (isSimulating) {
			const interval = setInterval(
				simulate,
				settings.realTime ? settings.timeStep * 1000 : 16,
			);
			return () => clearInterval(interval);
		}
	}, [isSimulating, settings.realTime, settings.timeStep, simulate]);

	useEffect(() => {
		let lastFrameTime = 0;
		const targetFPS = 30; // Reduce from 60fps to 30fps for better performance
		const frameInterval = 1000 / targetFPS;

		const animate = (currentTime: number) => {
			if (currentTime - lastFrameTime >= frameInterval) {
				draw();
				lastFrameTime = currentTime;
			}
			animationRef.current = requestAnimationFrame(animate);
		};
		animationRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [systemData, pidHistory, settings]);

	const metrics = calculatePerformanceMetrics();

	return (
		<div className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
			<div className="bg-white rounded-xl shadow-lg p-6 mb-6">
				<div className="flex items-center gap-3 mb-6">
					<div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
					<h1 className="text-2xl font-bold text-gray-800">
						Control Systems & PID Analysis
					</h1>
					<div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
						Control Engineering Tool
					</div>
				</div>

				{/* Main Layout: Canvas + Controls Side by Side */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
					{/* Left: Canvas Section */}
					<div className="bg-gray-50 rounded-lg p-4">
						<div className="text-sm text-gray-600 mb-2">
							PID Control System Visualization
						</div>
						<div className="bg-red-100 p-2 mb-2 text-xs">
							Canvas should appear below this line:
						</div>
						<canvas
							ref={canvasRef}
							id="pid-canvas"
							className="border-2 border-blue-500 bg-white block"
							style={{ width: "700px", height: "400px" }}
						>
							Canvas not supported
						</canvas>
						<div className="bg-green-100 p-2 mt-2 text-xs">
							Canvas should appear above this line
						</div>

						{/* Control Buttons */}
						<div className="flex gap-2 mt-4">
							<button
								onClick={() => setIsSimulating(!isSimulating)}
								className={`px-4 py-2 rounded-lg font-medium ${
									isSimulating
										? "bg-red-500 text-white hover:bg-red-600"
										: "bg-green-500 text-white hover:bg-green-600"
								}`}
							>
								{isSimulating ? "Stop" : "Start"} Simulation
							</button>
							<button
								onClick={resetSimulation}
								className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
							>
								Reset
							</button>
							<button
								onClick={() => autoTunePID(tuningMethod)}
								className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
							>
								Auto-Tune PID
							</button>
						</div>
					</div>

					{/* Right: Controls Panel */}
					<div className="space-y-4">
						{/* PID Controller */}
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								PID Controller
							</h3>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Control Mode
							</label>
							<select
								value={controlMode}
								onChange={(e) => setControlMode(e.target.value as any)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
							>
								<option value="pid">PID</option>
								<option value="p">P Only</option>
								<option value="pi">PI</option>
								<option value="pd">PD</option>
								<option value="manual">Manual</option>
							</select>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Kp (Proportional): {pid.kp.toFixed(3)}
							</label>
							<input
								type="range"
								min="0"
								max="10"
								step="0.1"
								value={pid.kp}
								onChange={(e) =>
									setPid((prev) => ({
										...prev,
										kp: Number.parseFloat(e.target.value),
									}))
								}
								className="w-full mb-3"
							/>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Ki (Integral): {pid.ki.toFixed(3)}
							</label>
							<input
								type="range"
								min="0"
								max="2"
								step="0.01"
								value={pid.ki}
								onChange={(e) =>
									setPid((prev) => ({
										...prev,
										ki: Number.parseFloat(e.target.value),
									}))
								}
								className="w-full mb-3"
							/>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Kd (Derivative): {pid.kd.toFixed(3)}
							</label>
							<input
								type="range"
								min="0"
								max="1"
								step="0.001"
								value={pid.kd}
								onChange={(e) =>
									setPid((prev) => ({
										...prev,
										kd: Number.parseFloat(e.target.value),
									}))
								}
								className="w-full mb-3"
							/>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Setpoint: {pid.setpoint.toFixed(2)}
							</label>
							<input
								type="range"
								min="-2"
								max="3"
								step="0.1"
								value={pid.setpoint}
								onChange={(e) =>
									setPid((prev) => ({
										...prev,
										setpoint: Number.parseFloat(e.target.value),
									}))
								}
								className="w-full"
							/>
						</div>

						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Plant Model
							</h3>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								System Type
							</label>
							<select
								value={plant.type}
								onChange={(e) => {
									setPlant((prev) => ({
										...prev,
										type: e.target.value as any,
									}));
									applyPlantPreset(e.target.value);
								}}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
							>
								<option value="mass_spring_damper">Mass-Spring-Damper</option>
								<option value="dc_motor">DC Motor</option>
								<option value="temperature">Temperature Control</option>
								<option value="level_control">Level Control</option>
								<option value="custom">Custom</option>
							</select>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Mass/Inertia: {plant.mass.toFixed(2)}
							</label>
							<input
								type="range"
								min="0.1"
								max="5"
								step="0.1"
								value={plant.mass}
								onChange={(e) =>
									setPlant((prev) => ({
										...prev,
										mass: Number.parseFloat(e.target.value),
									}))
								}
								className="w-full mb-3"
							/>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Damping: {plant.damping.toFixed(2)}
							</label>
							<input
								type="range"
								min="0"
								max="2"
								step="0.1"
								value={plant.damping}
								onChange={(e) =>
									setPlant((prev) => ({
										...prev,
										damping: Number.parseFloat(e.target.value),
									}))
								}
								className="w-full mb-3"
							/>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Disturbance: {plant.disturbance.toFixed(2)}
							</label>
							<input
								type="range"
								min="-1"
								max="1"
								step="0.01"
								value={plant.disturbance}
								onChange={(e) =>
									setPlant((prev) => ({
										...prev,
										disturbance: Number.parseFloat(e.target.value),
									}))
								}
								className="w-full"
							/>
						</div>

						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Display Options
							</h3>

							<div className="space-y-2 mb-3">
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={settings.showSetpoint}
										onChange={(e) =>
											setSettings((prev) => ({
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
										checked={settings.showOutput}
										onChange={(e) =>
											setSettings((prev) => ({
												...prev,
												showOutput: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									System Output
								</label>
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={settings.showError}
										onChange={(e) =>
											setSettings((prev) => ({
												...prev,
												showError: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Error Signal
								</label>
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={settings.showControl}
										onChange={(e) =>
											setSettings((prev) => ({
												...prev,
												showControl: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Control Signal
								</label>
							</div>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Setpoint Type
							</label>
							<select
								value={presetType}
								onChange={(e) => setPresetType(e.target.value as any)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								<option value="step">Step Response</option>
								<option value="ramp">Ramp Input</option>
								<option value="sine">Sine Wave</option>
								<option value="square">Square Wave</option>
								<option value="custom">Custom</option>
							</select>
						</div>

						{metrics && (
							<div className="bg-gray-50 rounded-lg p-4">
								<h3 className="text-lg font-semibold text-gray-800 mb-3">
									Performance Metrics
								</h3>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span>Rise Time:</span>
										<span className="font-mono">
											{metrics.riseTime.toFixed(2)} s
										</span>
									</div>
									<div className="flex justify-between">
										<span>Settling Time:</span>
										<span className="font-mono">
											{metrics.settlingTime.toFixed(2)} s
										</span>
									</div>
									<div className="flex justify-between">
										<span>Overshoot:</span>
										<span className="font-mono">
											{metrics.overshoot.toFixed(1)}%
										</span>
									</div>
									<div className="flex justify-between">
										<span>Steady-State Error:</span>
										<span className="font-mono">
											{metrics.steadyStateError.toFixed(3)}
										</span>
									</div>
									<div className="flex justify-between">
										<span>IAE:</span>
										<span className="font-mono">
											{metrics.integralAbsoluteError.toFixed(2)}
										</span>
									</div>
									<div className="flex justify-between">
										<span>ISE:</span>
										<span className="font-mono">
											{metrics.integralSquaredError.toFixed(2)}
										</span>
									</div>
									<div className="flex justify-between">
										<span>Oscillations:</span>
										<span className="font-mono">{metrics.oscillations}</span>
									</div>
									<div className="flex justify-between">
										<span>Simulation Time:</span>
										<span className="font-mono">
											{timeRef.current.toFixed(1)} s
										</span>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				<div className="mt-6 bg-blue-50 rounded-lg p-4">
					<h3 className="text-lg font-semibold text-blue-800 mb-2">
						Control Engineering Applications
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
						<div>
							<strong>Industrial Automation:</strong>
							<ul className="mt-1 space-y-1">
								<li>• Process control systems</li>
								<li>• Motor speed control</li>
								<li>• Temperature regulation</li>
								<li>• Pressure control loops</li>
							</ul>
						</div>
						<div>
							<strong>Robotics & Mechatronics:</strong>
							<ul className="mt-1 space-y-1">
								<li>• Robot joint control</li>
								<li>• Flight control systems</li>
								<li>• Automotive cruise control</li>
								<li>• Medical device control</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
