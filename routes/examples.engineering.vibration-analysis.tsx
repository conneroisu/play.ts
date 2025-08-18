import { createFileRoute } from "@tanstack/react-router";
import {
	clamp,
	cos,
	hsl,
	hslToRgb,
	lerp,
	PI,
	randomFloat,
	sin,
	TWO_PI,
	toCssHsl,
} from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute(
	"/examples/engineering/vibration-analysis",
)({
	component: VibrationAnalysisExample,
});

interface VibrationSystem {
	mass: number; // kg
	stiffness: number; // N/m
	damping: number; // N⋅s/m
	naturalFrequency: number; // Hz
	dampingRatio: number;
	dampedFrequency: number; // Hz
	criticalDamping: number; // N⋅s/m
}

interface ExcitationForce {
	type: "harmonic" | "impulse" | "random" | "step" | "chirp" | "impact";
	amplitude: number; // N
	frequency: number; // Hz
	phase: number; // degrees
	duration: number; // s
	enabled: boolean;
}

interface VibrationResponse {
	time: number[];
	displacement: number[];
	velocity: number[];
	acceleration: number[];
	force: number[];
	energy: number[];
}

interface FrequencyResponse {
	frequencies: number[];
	magnitude: number[];
	phase: number[];
	transmissibility: number[];
}

interface ModalAnalysis {
	mode: number;
	frequency: number; // Hz
	dampingRatio: number;
	modeShape: number[];
	modalMass: number;
	modalStiffness: number;
}

interface VibrationSettings {
	timeStep: number;
	duration: number;
	samplingRate: number;
	freqRangeMin: number;
	freqRangeMax: number;
	showDisplacement: boolean;
	showVelocity: boolean;
	showAcceleration: boolean;
	showForce: boolean;
	showFFT: boolean;
	showTransmissibility: boolean;
	logScale: boolean;
	autoScale: boolean;
	gridEnabled: boolean;
}

function VibrationAnalysisExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const fftCanvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const timeRef = useRef<number>(0);

	const [isSimulating, setIsSimulating] = useState(false);
	const [vibrationData, setVibrationData] = useState<VibrationResponse>({
		time: [],
		displacement: [],
		velocity: [],
		acceleration: [],
		force: [],
		energy: [],
	});

	const [system, setSystem] = useState<VibrationSystem>({
		mass: 10, // kg
		stiffness: 10000, // N/m
		damping: 100, // N⋅s/m
		naturalFrequency: 0,
		dampingRatio: 0,
		dampedFrequency: 0,
		criticalDamping: 0,
	});

	const [excitation, setExcitation] = useState<ExcitationForce>({
		type: "harmonic",
		amplitude: 100, // N
		frequency: 5, // Hz
		phase: 0,
		duration: 10,
		enabled: true,
	});

	const [settings, setSettings] = useState<VibrationSettings>({
		timeStep: 0.001,
		duration: 5,
		samplingRate: 1000,
		freqRangeMin: 0.1,
		freqRangeMax: 100,
		showDisplacement: true,
		showVelocity: false,
		showAcceleration: false,
		showForce: false,
		showFFT: true,
		showTransmissibility: false,
		logScale: false,
		autoScale: true,
		gridEnabled: true,
	});

	const [analysisType, setAnalysisType] = useState<
		"free" | "forced" | "resonance" | "modal"
	>("forced");
	const [systemType, setSystemType] = useState<
		"sdof" | "mdof" | "rotating" | "beam" | "custom"
	>("sdof");
	const [frequencyResponse, setFrequencyResponse] =
		useState<FrequencyResponse | null>(null);

	// Calculate system properties
	const calculateSystemProperties = (
		mass: number,
		stiffness: number,
		damping: number,
	): VibrationSystem => {
		const naturalFreq = Math.sqrt(stiffness / mass) / (2 * PI); // Hz
		const criticalDamp = 2 * Math.sqrt(mass * stiffness); // N⋅s/m
		const dampingRatio = damping / criticalDamp;
		const dampedFreq = naturalFreq * Math.sqrt(1 - dampingRatio * dampingRatio); // Hz

		return {
			mass,
			stiffness,
			damping,
			naturalFrequency: naturalFreq,
			dampingRatio,
			dampedFrequency: dampedFreq > 0 ? dampedFreq : 0,
			criticalDamping: criticalDamp,
		};
	};

	const generateExcitationForce = (time: number): number => {
		if (!excitation.enabled || time > excitation.duration) return 0;

		const omega = 2 * PI * excitation.frequency;
		const phaseRad = (excitation.phase * PI) / 180;

		switch (excitation.type) {
			case "harmonic":
				return excitation.amplitude * sin(omega * time + phaseRad);

			case "impulse":
				// Dirac delta approximation
				return time < settings.timeStep
					? excitation.amplitude / settings.timeStep
					: 0;

			case "step":
				return time > 1 ? excitation.amplitude : 0;

			case "chirp": {
				// Frequency sweep from 0.1 to 50 Hz over duration
				const f1 = 0.1;
				const f2 = 50;
				const instantFreq = f1 + ((f2 - f1) * time) / excitation.duration;
				return excitation.amplitude * sin(2 * PI * instantFreq * time);
			}

			case "impact": {
				// Half-sine pulse
				const pulseDuration = 0.01; // 10ms impact
				if (time <= pulseDuration) {
					return excitation.amplitude * sin((PI * time) / pulseDuration);
				}
				return 0;
			}

			case "random":
				return excitation.amplitude * randomFloat(-1, 1);

			default:
				return 0;
		}
	};

	const solveVibrationEquation = (
		currentState: { x: number; v: number; a: number },
		force: number,
	): { x: number; v: number; a: number } => {
		// Equation of motion: m*a + c*v + k*x = F(t)
		// Using Newmark integration method for numerical stability

		const { mass, stiffness, damping } = system;
		const dt = settings.timeStep;

		// Newmark parameters (average acceleration method)
		const gamma = 0.5;
		const beta = 0.25;

		// Predict acceleration
		const a_pred =
			(force - damping * currentState.v - stiffness * currentState.x) / mass;

		// Update velocity and displacement using Newmark
		const v_new =
			currentState.v + dt * ((1 - gamma) * currentState.a + gamma * a_pred);
		const x_new =
			currentState.x +
			dt * currentState.v +
			dt * dt * ((0.5 - beta) * currentState.a + beta * a_pred);

		// Correct acceleration
		const a_new = (force - damping * v_new - stiffness * x_new) / mass;

		return { x: x_new, v: v_new, a: a_new };
	};

	const calculateFrequencyResponse = (): FrequencyResponse => {
		const frequencies: number[] = [];
		const magnitude: number[] = [];
		const phase: number[] = [];
		const transmissibility: number[] = [];

		const { mass, stiffness, damping, naturalFrequency } = system;
		const numPoints = 200;

		for (let i = 0; i < numPoints; i++) {
			const freq =
				settings.freqRangeMin +
				(i / (numPoints - 1)) * (settings.freqRangeMax - settings.freqRangeMin);
			const omega = 2 * PI * freq;
			const omega_n = 2 * PI * naturalFrequency;
			const zeta = system.dampingRatio;

			// Frequency ratio
			const r = omega / omega_n;

			// Complex transfer function H(jω) = X(jω)/F(jω)
			const denomReal = stiffness * (1 - r * r);
			const denomImag = damping * omega;
			const denomMagSq = denomReal * denomReal + denomImag * denomImag;

			// Magnitude of transfer function
			const H_mag = 1 / Math.sqrt(denomMagSq / (stiffness * stiffness));

			// Phase of transfer function
			const H_phase = (-Math.atan2(denomImag, denomReal) * 180) / PI;

			// Transmissibility (for isolation analysis)
			const transmNum = Math.sqrt(1 + 2 * zeta * r * (2 * zeta * r));
			const transmDenom = Math.sqrt(
				(1 - r * r) * (1 - r * r) + 2 * zeta * r * (2 * zeta * r),
			);
			const transmissibilityValue =
				transmDenom > 0 ? transmNum / transmDenom : 0;

			frequencies.push(freq);
			magnitude.push(H_mag);
			phase.push(H_phase);
			transmissibility.push(transmissibilityValue);
		}

		return { frequencies, magnitude, phase, transmissibility };
	};

	const calculateFFT = (
		signal: number[],
	): { frequencies: number[]; magnitude: number[] } => {
		const N = Math.min(signal.length, 1024); // Limit for performance
		const magnitude: number[] = [];
		const frequencies: number[] = [];

		// Simple DFT implementation for demonstration
		for (let k = 0; k < N / 2; k++) {
			let realPart = 0;
			let imagPart = 0;

			for (let n = 0; n < N; n++) {
				const angle = (-2 * PI * k * n) / N;
				realPart += signal[n] * cos(angle);
				imagPart += signal[n] * sin(angle);
			}

			const mag = Math.sqrt(realPart * realPart + imagPart * imagPart) / N;
			magnitude.push(mag);
			frequencies.push((k * settings.samplingRate) / N);
		}

		return { frequencies, magnitude };
	};

	const simulate = () => {
		if (!isSimulating) return;

		const currentTime = timeRef.current;
		const dt = settings.timeStep;

		// Get current state
		const currentIndex = vibrationData.time.length - 1;
		const currentState = {
			x: currentIndex >= 0 ? vibrationData.displacement[currentIndex] : 0,
			v: currentIndex >= 0 ? vibrationData.velocity[currentIndex] : 0,
			a: currentIndex >= 0 ? vibrationData.acceleration[currentIndex] : 0,
		};

		// Generate excitation force
		const force = generateExcitationForce(currentTime);

		// Solve equation of motion
		const newState = solveVibrationEquation(currentState, force);

		// Calculate energy
		const kineticEnergy = 0.5 * system.mass * newState.v * newState.v;
		const potentialEnergy = 0.5 * system.stiffness * newState.x * newState.x;
		const totalEnergy = kineticEnergy + potentialEnergy;

		// Store results
		setVibrationData((prev) => {
			const maxPoints = Math.floor(settings.duration / settings.timeStep);
			return {
				time: [...prev.time.slice(-maxPoints), currentTime],
				displacement: [...prev.displacement.slice(-maxPoints), newState.x],
				velocity: [...prev.velocity.slice(-maxPoints), newState.v],
				acceleration: [...prev.acceleration.slice(-maxPoints), newState.a],
				force: [...prev.force.slice(-maxPoints), force],
				energy: [...prev.energy.slice(-maxPoints), totalEnergy],
			};
		});

		timeRef.current += dt;

		// Stop simulation when duration is reached
		if (currentTime >= settings.duration) {
			setIsSimulating(false);
		}
	};

	const resetSimulation = () => {
		setIsSimulating(false);
		timeRef.current = 0;
		setVibrationData({
			time: [],
			displacement: [],
			velocity: [],
			acceleration: [],
			force: [],
			energy: [],
		});
	};

	const applySystemPreset = (type: string) => {
		switch (type) {
			case "automotive_suspension":
				setSystem((prev) => ({
					...prev,
					mass: 300,
					stiffness: 20000,
					damping: 2000,
				}));
				setExcitation((prev) => ({
					...prev,
					type: "random",
					amplitude: 500,
					frequency: 10,
				}));
				break;
			case "machine_foundation":
				setSystem((prev) => ({
					...prev,
					mass: 5000,
					stiffness: 1000000,
					damping: 10000,
				}));
				setExcitation((prev) => ({
					...prev,
					type: "harmonic",
					amplitude: 2000,
					frequency: 25,
				}));
				break;
			case "building_structure":
				setSystem((prev) => ({
					...prev,
					mass: 100000,
					stiffness: 50000000,
					damping: 100000,
				}));
				setExcitation((prev) => ({
					...prev,
					type: "impact",
					amplitude: 10000,
					frequency: 1,
				}));
				break;
			case "rotating_machinery":
				setSystem((prev) => ({
					...prev,
					mass: 50,
					stiffness: 50000,
					damping: 200,
				}));
				setExcitation((prev) => ({
					...prev,
					type: "harmonic",
					amplitude: 200,
					frequency: 30,
				}));
				break;
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

		if (vibrationData.time.length < 2) return;

		// Auto-scale or use fixed scale
		const getYRange = (data: number[]) => {
			if (settings.autoScale) {
				const min = Math.min(...data);
				const max = Math.max(...data);
				const padding = Math.abs(max - min) * 0.1;
				return { min: min - padding, max: max + padding };
			}
			return { min: -0.01, max: 0.01 };
		};

		const maxTime = Math.max(...vibrationData.time);

		// Draw grid
		if (settings.gridEnabled) {
			ctx.strokeStyle = "rgba(200, 200, 200, 0.5)";
			ctx.lineWidth = 1;

			// Time grid lines
			for (let t = 0; t <= maxTime; t += maxTime / 10) {
				const x = (t / maxTime) * width;
				ctx.beginPath();
				ctx.moveTo(x, 0);
				ctx.lineTo(x, height);
				ctx.stroke();
			}

			// Amplitude grid lines
			for (let i = 0; i <= 8; i++) {
				const y = (i / 8) * height;
				ctx.beginPath();
				ctx.moveTo(0, y);
				ctx.lineTo(width, y);
				ctx.stroke();
			}
		}

		// Helper function to convert data to canvas coordinates
		const toCanvasX = (time: number) => (time / maxTime) * width;
		const toCanvasY = (value: number, range: { min: number; max: number }) =>
			height - ((value - range.min) / (range.max - range.min)) * height;

		// Draw displacement
		if (settings.showDisplacement) {
			const range = getYRange(vibrationData.displacement);
			ctx.strokeStyle = "rgba(59, 130, 246, 1)"; // Blue
			ctx.lineWidth = 2;
			ctx.beginPath();
			for (let i = 0; i < vibrationData.time.length; i++) {
				const x = toCanvasX(vibrationData.time[i]);
				const y = toCanvasY(vibrationData.displacement[i], range);
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.stroke();
		}

		// Draw velocity
		if (settings.showVelocity) {
			const range = getYRange(vibrationData.velocity);
			ctx.strokeStyle = "rgba(34, 197, 94, 0.8)"; // Green
			ctx.lineWidth = 2;
			ctx.beginPath();
			for (let i = 0; i < vibrationData.time.length; i++) {
				const x = toCanvasX(vibrationData.time[i]);
				const y = toCanvasY(vibrationData.velocity[i], range);
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.stroke();
		}

		// Draw acceleration
		if (settings.showAcceleration) {
			const range = getYRange(vibrationData.acceleration);
			ctx.strokeStyle = "rgba(239, 68, 68, 0.8)"; // Red
			ctx.lineWidth = 2;
			ctx.beginPath();
			for (let i = 0; i < vibrationData.time.length; i++) {
				const x = toCanvasX(vibrationData.time[i]);
				const y = toCanvasY(vibrationData.acceleration[i], range);
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.stroke();
		}

		// Draw force
		if (settings.showForce) {
			const range = getYRange(vibrationData.force);
			ctx.strokeStyle = "rgba(168, 85, 247, 0.8)"; // Purple
			ctx.lineWidth = 2;
			ctx.beginPath();
			for (let i = 0; i < vibrationData.time.length; i++) {
				const x = toCanvasX(vibrationData.time[i]);
				const y = toCanvasY(vibrationData.force[i], range);
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
		if (settings.showDisplacement) {
			ctx.fillStyle = "rgba(59, 130, 246, 1)";
			ctx.fillText("Displacement (m)", 10, labelY);
			labelY += 20;
		}
		if (settings.showVelocity) {
			ctx.fillStyle = "rgba(34, 197, 94, 0.8)";
			ctx.fillText("Velocity (m/s)", 10, labelY);
			labelY += 20;
		}
		if (settings.showAcceleration) {
			ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
			ctx.fillText("Acceleration (m/s²)", 10, labelY);
			labelY += 20;
		}
		if (settings.showForce) {
			ctx.fillStyle = "rgba(168, 85, 247, 0.8)";
			ctx.fillText("Force (N)", 10, labelY);
		}
	};

	const drawFFT = () => {
		const canvas = fftCanvasRef.current;
		if (!canvas || !settings.showFFT) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;

		ctx.clearRect(0, 0, width, height);

		if (vibrationData.displacement.length < 64) return;

		const fft = calculateFFT(vibrationData.displacement);
		if (fft.frequencies.length === 0) return;

		const maxFreq = Math.max(...fft.frequencies);
		const maxMag = Math.max(...fft.magnitude);

		// Draw frequency response
		ctx.strokeStyle = "rgba(59, 130, 246, 1)";
		ctx.lineWidth = 2;
		ctx.beginPath();

		for (let i = 0; i < fft.frequencies.length; i++) {
			const x = (fft.frequencies[i] / maxFreq) * width;
			const y = height - (fft.magnitude[i] / maxMag) * height;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.stroke();

		// Draw natural frequency line
		if (system.naturalFrequency > 0) {
			const fnLine = (system.naturalFrequency / maxFreq) * width;
			ctx.strokeStyle = "rgba(239, 68, 68, 0.8)";
			ctx.lineWidth = 2;
			ctx.setLineDash([5, 5]);
			ctx.beginPath();
			ctx.moveTo(fnLine, 0);
			ctx.lineTo(fnLine, height);
			ctx.stroke();
			ctx.setLineDash([]);

			ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
			ctx.font = "10px Arial";
			ctx.fillText(
				`fn=${system.naturalFrequency.toFixed(1)}Hz`,
				fnLine + 5,
				15,
			);
		}

		// Labels
		ctx.fillStyle = "black";
		ctx.font = "12px Arial";
		ctx.textAlign = "center";
		ctx.fillText("Frequency (Hz)", width / 2, height - 5);

		ctx.save();
		ctx.translate(15, height / 2);
		ctx.rotate(-PI / 2);
		ctx.fillText("Magnitude", 0, 0);
		ctx.restore();
	};

	useEffect(() => {
		const updatedSystem = calculateSystemProperties(
			system.mass,
			system.stiffness,
			system.damping,
		);
		setSystem(updatedSystem);

		// Calculate frequency response
		const freqResp = calculateFrequencyResponse();
		setFrequencyResponse(freqResp);
	}, [system.mass, system.stiffness, system.damping]);

	useEffect(() => {
		if (isSimulating) {
			const interval = setInterval(simulate, 16); // ~60 FPS
			return () => clearInterval(interval);
		}
	}, [isSimulating, system, excitation, settings]);

	useEffect(() => {
		const animate = () => {
			draw();
			drawFFT();
			animationRef.current = requestAnimationFrame(animate);
		};
		animationRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [vibrationData, settings, system]);

	const calculateVibrationMetrics = () => {
		if (vibrationData.displacement.length < 10) return null;

		const rms = Math.sqrt(
			vibrationData.displacement.reduce((sum, x) => sum + x * x, 0) /
				vibrationData.displacement.length,
		);
		const peak = Math.max(...vibrationData.displacement.map(Math.abs));
		const crestFactor = peak / rms;

		// Calculate settling time (within 2% of steady state)
		let settlingTime = vibrationData.time[vibrationData.time.length - 1] || 0;
		const steadyState =
			vibrationData.displacement[vibrationData.displacement.length - 1] || 0;
		const tolerance = 0.02 * Math.abs(steadyState);

		for (let i = vibrationData.displacement.length - 1; i >= 0; i--) {
			if (Math.abs(vibrationData.displacement[i] - steadyState) > tolerance) {
				settlingTime = vibrationData.time[i];
				break;
			}
		}

		return {
			rms,
			peak,
			crestFactor,
			settlingTime,
			naturalFrequency: system.naturalFrequency,
			dampingRatio: system.dampingRatio,
			dampedFrequency: system.dampedFrequency,
		};
	};

	const metrics = calculateVibrationMetrics();

	return (
		<div className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-purple-50 to-indigo-50 min-h-screen">
			<div className="bg-white rounded-xl shadow-lg p-6 mb-6">
				<div className="flex items-center gap-3 mb-6">
					<div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"></div>
					<h1 className="text-2xl font-bold text-gray-800">
						Vibration Analysis & Modal Testing
					</h1>
					<div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
						Mechanical Engineering Tool
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2">
						<div className="bg-gray-50 rounded-lg p-4 mb-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-2">
								Time Domain Response
							</h3>
							<canvas
								ref={canvasRef}
								width={700}
								height={300}
								className="border border-gray-300 rounded-lg bg-white w-full"
							/>
						</div>

						{settings.showFFT && (
							<div className="bg-gray-50 rounded-lg p-4 mb-4">
								<h3 className="text-lg font-semibold text-gray-800 mb-2">
									Frequency Domain Analysis
								</h3>
								<canvas
									ref={fftCanvasRef}
									width={700}
									height={250}
									className="border border-gray-300 rounded-lg bg-white w-full"
								/>
							</div>
						)}

						<div className="flex gap-2 mb-4">
							<button
								onClick={() => setIsSimulating(!isSimulating)}
								className={`px-4 py-2 rounded-lg font-medium ${
									isSimulating
										? "bg-red-500 text-white hover:bg-red-600"
										: "bg-green-500 text-white hover:bg-green-600"
								}`}
							>
								{isSimulating ? "Stop" : "Start"} Analysis
							</button>
							<button
								onClick={resetSimulation}
								className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
							>
								Reset
							</button>
						</div>
					</div>

					<div className="space-y-4">
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								System Properties
							</h3>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								System Type
							</label>
							<select
								value={systemType}
								onChange={(e) => {
									setSystemType(e.target.value as any);
									applySystemPreset(e.target.value);
								}}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-3"
							>
								<option value="sdof">Single DOF System</option>
								<option value="automotive_suspension">
									Automotive Suspension
								</option>
								<option value="machine_foundation">Machine Foundation</option>
								<option value="building_structure">Building Structure</option>
								<option value="rotating_machinery">Rotating Machinery</option>
								<option value="custom">Custom</option>
							</select>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Mass: {system.mass.toFixed(1)} kg
							</label>
							<input
								type="range"
								min="0.1"
								max="10000"
								step="0.1"
								value={system.mass}
								onChange={(e) =>
									setSystem((prev) => ({
										...prev,
										mass: Number.parseFloat(e.target.value),
									}))
								}
								className="w-full mb-3"
							/>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Stiffness: {system.stiffness.toFixed(0)} N/m
							</label>
							<input
								type="range"
								min="100"
								max="100000000"
								step="100"
								value={system.stiffness}
								onChange={(e) =>
									setSystem((prev) => ({
										...prev,
										stiffness: Number.parseFloat(e.target.value),
									}))
								}
								className="w-full mb-3"
							/>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Damping: {system.damping.toFixed(1)} N⋅s/m
							</label>
							<input
								type="range"
								min="0"
								max="10000"
								step="1"
								value={system.damping}
								onChange={(e) =>
									setSystem((prev) => ({
										...prev,
										damping: Number.parseFloat(e.target.value),
									}))
								}
								className="w-full"
							/>
						</div>

						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Excitation Force
							</h3>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Excitation Type
							</label>
							<select
								value={excitation.type}
								onChange={(e) =>
									setExcitation((prev) => ({
										...prev,
										type: e.target.value as any,
									}))
								}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-3"
							>
								<option value="harmonic">Harmonic</option>
								<option value="impulse">Impulse</option>
								<option value="step">Step</option>
								<option value="chirp">Chirp (Sweep)</option>
								<option value="impact">Impact</option>
								<option value="random">Random</option>
							</select>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Amplitude: {excitation.amplitude.toFixed(1)} N
							</label>
							<input
								type="range"
								min="0"
								max="10000"
								step="10"
								value={excitation.amplitude}
								onChange={(e) =>
									setExcitation((prev) => ({
										...prev,
										amplitude: Number.parseFloat(e.target.value),
									}))
								}
								className="w-full mb-3"
							/>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Frequency: {excitation.frequency.toFixed(1)} Hz
							</label>
							<input
								type="range"
								min="0.1"
								max="100"
								step="0.1"
								value={excitation.frequency}
								onChange={(e) =>
									setExcitation((prev) => ({
										...prev,
										frequency: Number.parseFloat(e.target.value),
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
										checked={settings.showDisplacement}
										onChange={(e) =>
											setSettings((prev) => ({
												...prev,
												showDisplacement: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Displacement
								</label>
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={settings.showVelocity}
										onChange={(e) =>
											setSettings((prev) => ({
												...prev,
												showVelocity: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Velocity
								</label>
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={settings.showAcceleration}
										onChange={(e) =>
											setSettings((prev) => ({
												...prev,
												showAcceleration: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Acceleration
								</label>
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={settings.showForce}
										onChange={(e) =>
											setSettings((prev) => ({
												...prev,
												showForce: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									Applied Force
								</label>
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={settings.showFFT}
										onChange={(e) =>
											setSettings((prev) => ({
												...prev,
												showFFT: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									FFT Analysis
								</label>
							</div>

							<label className="block text-sm font-medium text-gray-700 mb-2">
								Duration: {settings.duration.toFixed(1)} s
							</label>
							<input
								type="range"
								min="1"
								max="20"
								step="0.1"
								value={settings.duration}
								onChange={(e) =>
									setSettings((prev) => ({
										...prev,
										duration: Number.parseFloat(e.target.value),
									}))
								}
								className="w-full"
							/>
						</div>

						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								System Analysis
							</h3>
							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span>Natural Frequency:</span>
									<span className="font-mono">
										{system.naturalFrequency.toFixed(2)} Hz
									</span>
								</div>
								<div className="flex justify-between">
									<span>Damping Ratio:</span>
									<span className="font-mono">
										{system.dampingRatio.toFixed(4)}
									</span>
								</div>
								<div className="flex justify-between">
									<span>Damped Frequency:</span>
									<span className="font-mono">
										{system.dampedFrequency.toFixed(2)} Hz
									</span>
								</div>
								<div className="flex justify-between">
									<span>Critical Damping:</span>
									<span className="font-mono">
										{system.criticalDamping.toFixed(1)} N⋅s/m
									</span>
								</div>
								<div className="flex justify-between">
									<span>System Type:</span>
									<span className="font-mono">
										{system.dampingRatio < 1
											? "Underdamped"
											: system.dampingRatio === 1
												? "Critical"
												: "Overdamped"}
									</span>
								</div>
							</div>
						</div>

						{metrics && (
							<div className="bg-gray-50 rounded-lg p-4">
								<h3 className="text-lg font-semibold text-gray-800 mb-3">
									Vibration Metrics
								</h3>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span>RMS:</span>
										<span className="font-mono">
											{metrics.rms.toFixed(6)} m
										</span>
									</div>
									<div className="flex justify-between">
										<span>Peak:</span>
										<span className="font-mono">
											{metrics.peak.toFixed(6)} m
										</span>
									</div>
									<div className="flex justify-between">
										<span>Crest Factor:</span>
										<span className="font-mono">
											{metrics.crestFactor.toFixed(2)}
										</span>
									</div>
									<div className="flex justify-between">
										<span>Settling Time:</span>
										<span className="font-mono">
											{metrics.settlingTime.toFixed(3)} s
										</span>
									</div>
									<div className="flex justify-between">
										<span>Simulation Time:</span>
										<span className="font-mono">
											{timeRef.current.toFixed(2)} s
										</span>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				<div className="mt-6 bg-purple-50 rounded-lg p-4">
					<h3 className="text-lg font-semibold text-purple-800 mb-2">
						Mechanical Engineering Applications
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-700">
						<div>
							<strong>Machinery & Equipment:</strong>
							<ul className="mt-1 space-y-1">
								<li>• Rotating machinery analysis</li>
								<li>• Foundation design</li>
								<li>• Vibration isolation systems</li>
								<li>• Modal testing and validation</li>
							</ul>
						</div>
						<div>
							<strong>Structural & Automotive:</strong>
							<ul className="mt-1 space-y-1">
								<li>• Suspension system design</li>
								<li>• Building seismic analysis</li>
								<li>• Machine tool dynamics</li>
								<li>• Condition monitoring</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
