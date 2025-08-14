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

export const Route = createFileRoute("/examples/visual/quantum-simulation")({
	component: QuantumSimulationExample,
});

interface ComplexNumber {
	real: number;
	imag: number;
}

interface WaveFunction {
	amplitude: ComplexNumber[];
	probability: number[];
	position: number[];
	energy: number;
	nodes: number;
}

interface QuantumState {
	n: number; // Principal quantum number
	l: number; // Angular momentum
	m: number; // Magnetic quantum number
	waveFunction: WaveFunction;
	color: { h: number; s: number; l: number };
}

interface QuantumSettings {
	simulationType:
		| "particle_in_box"
		| "harmonic_oscillator"
		| "hydrogen_atom"
		| "double_slit";
	energyLevel: number;
	timeEvolution: boolean;
	showProbability: boolean;
	showWaveFunction: boolean;
	showNodes: boolean;
	animationSpeed: number;
	uncertainty: number;
	measurement: boolean;
	colorMode: "phase" | "probability" | "energy" | "quantum_numbers";
}

function QuantumSimulationExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const timeRef = useRef<number>(0);

	const [quantumStates, setQuantumStates] = useState<QuantumState[]>([]);
	const [isSimulating, setIsSimulating] = useState(false);
	const [settings, setSettings] = useState<QuantumSettings>({
		simulationType: "particle_in_box",
		energyLevel: 1,
		timeEvolution: true,
		showProbability: true,
		showWaveFunction: true,
		showNodes: false,
		animationSpeed: 1,
		uncertainty: 0.1,
		measurement: false,
		colorMode: "phase",
	});
	const [measurementPosition, setMeasurementPosition] = useState<number | null>(
		null,
	);
	const [observableValue, setObservableValue] = useState<number>(0);

	// Complex number operations
	const complexAdd = (a: ComplexNumber, b: ComplexNumber): ComplexNumber => ({
		real: a.real + b.real,
		imag: a.imag + b.imag,
	});

	const complexMultiply = (
		a: ComplexNumber,
		b: ComplexNumber,
	): ComplexNumber => ({
		real: a.real * b.real - a.imag * b.imag,
		imag: a.real * b.imag + a.imag * b.real,
	});

	const complexMagnitudeSquared = (c: ComplexNumber): number => {
		return c.real * c.real + c.imag * c.imag;
	};

	const complexPhase = (c: ComplexNumber): number => {
		return Math.atan2(c.imag, c.real);
	};

	const generateParticleInBox = (
		n: number,
		length: number,
		points: number,
	): WaveFunction => {
		const amplitude: ComplexNumber[] = [];
		const probability: number[] = [];
		const position: number[] = [];

		for (let i = 0; i < points; i++) {
			const x = (i / (points - 1)) * length;
			position.push(x);

			// Wave function: ψ(x) = √(2/L) * sin(nπx/L)
			const psi = Math.sqrt(2 / length) * sin((n * PI * x) / length);
			const phase = 0; // Real wave function for particle in box

			const amp: ComplexNumber = {
				real: psi * cos(phase),
				imag: psi * sin(phase),
			};

			amplitude.push(amp);
			probability.push(complexMagnitudeSquared(amp));
		}

		return {
			amplitude,
			probability,
			position,
			energy: (n * n * PI * PI) / (2 * length * length),
			nodes: n - 1,
		};
	};

	const generateHarmonicOscillator = (
		n: number,
		points: number,
	): WaveFunction => {
		const amplitude: ComplexNumber[] = [];
		const probability: number[] = [];
		const position: number[] = [];
		const xMax = 8; // Range for oscillator

		// Hermite polynomial coefficients (simplified for first few levels)
		const hermiteCoeffs = [
			[1], // H_0 = 1
			[2, 0], // H_1 = 2x
			[4, 0, -2], // H_2 = 4x² - 2
			[8, 0, -12, 0], // H_3 = 8x³ - 12x
			[16, 0, -48, 0, 12], // H_4 = 16x⁴ - 48x² + 12
		];

		for (let i = 0; i < points; i++) {
			const x = (i / (points - 1) - 0.5) * xMax;
			position.push(x);

			// Harmonic oscillator wave function
			const gaussianPart = Math.exp((-x * x) / 2);

			// Calculate Hermite polynomial
			let hermiteValue = 0;
			const coeffs = hermiteCoeffs[Math.min(n, hermiteCoeffs.length - 1)];
			for (let j = 0; j < coeffs.length; j++) {
				hermiteValue += coeffs[j] * Math.pow(x, j);
			}

			const normalization =
				Math.pow(PI, -0.25) / Math.sqrt(Math.pow(2, n) * factorial(n));
			const psi = normalization * hermiteValue * gaussianPart;

			const amp: ComplexNumber = {
				real: psi,
				imag: 0,
			};

			amplitude.push(amp);
			probability.push(complexMagnitudeSquared(amp));
		}

		return {
			amplitude,
			probability,
			position,
			energy: (n + 0.5) * 1, // ħω = 1
			nodes: n,
		};
	};

	const generateHydrogenAtom = (
		n: number,
		l: number,
		points: number,
	): WaveFunction => {
		const amplitude: ComplexNumber[] = [];
		const probability: number[] = [];
		const position: number[] = [];
		const rMax = 20; // Bohr radii

		for (let i = 0; i < points; i++) {
			const r = (i / (points - 1)) * rMax;
			position.push(r);

			// Simplified radial wave function for hydrogen (1s, 2s, 2p, etc.)
			let radialPart = 0;

			if (n === 1 && l === 0) {
				// 1s
				radialPart = 2 * Math.exp(-r) * Math.pow(r, 0);
			} else if (n === 2 && l === 0) {
				// 2s
				radialPart = (1 / Math.sqrt(8)) * (2 - r) * Math.exp(-r / 2);
			} else if (n === 2 && l === 1) {
				// 2p
				radialPart = (1 / Math.sqrt(24)) * r * Math.exp(-r / 2);
			} else if (n === 3 && l === 0) {
				// 3s
				radialPart =
					(2 / Math.sqrt(27)) *
					(3 - 2 * r + (2 * r * r) / 9) *
					Math.exp(-r / 3);
			} else {
				// Fallback
				radialPart = Math.exp(-r / n) * Math.pow(r, l);
			}

			const amp: ComplexNumber = {
				real: radialPart,
				imag: 0,
			};

			amplitude.push(amp);
			probability.push(complexMagnitudeSquared(amp));
		}

		return {
			amplitude,
			probability,
			position,
			energy: -13.6 / (n * n), // Hydrogen energy levels in eV
			nodes: n - l - 1,
		};
	};

	const generateDoubleSlit = (points: number, time: number): WaveFunction => {
		const amplitude: ComplexNumber[] = [];
		const probability: number[] = [];
		const position: number[] = [];
		const screenWidth = 10;

		const slit1Y = -1;
		const slit2Y = 1;
		const slitSeparation = 2;
		const wavelength = 1;
		const k = TWO_PI / wavelength;

		for (let i = 0; i < points; i++) {
			const y = (i / (points - 1) - 0.5) * screenWidth;
			position.push(y);

			// Distance from each slit
			const dist1 = Math.sqrt((y - slit1Y) * (y - slit1Y) + 25); // z = 5
			const dist2 = Math.sqrt((y - slit2Y) * (y - slit2Y) + 25);

			// Phase from each slit
			const phase1 = k * dist1 - settings.animationSpeed * time;
			const phase2 = k * dist2 - settings.animationSpeed * time;

			// Superposition
			const amp1: ComplexNumber = {
				real: cos(phase1) / dist1,
				imag: sin(phase1) / dist1,
			};

			const amp2: ComplexNumber = {
				real: cos(phase2) / dist2,
				imag: sin(phase2) / dist2,
			};

			const totalAmp = complexAdd(amp1, amp2);

			amplitude.push(totalAmp);
			probability.push(complexMagnitudeSquared(totalAmp));
		}

		return {
			amplitude,
			probability,
			position,
			energy: 0,
			nodes: 0,
		};
	};

	const factorial = (n: number): number => {
		if (n <= 1) return 1;
		return n * factorial(n - 1);
	};

	const generateQuantumState = (
		type: string,
		n: number,
		l = 0,
	): QuantumState => {
		const points = 500;
		let waveFunction: WaveFunction;

		switch (type) {
			case "particle_in_box":
				waveFunction = generateParticleInBox(n, 10, points);
				break;
			case "harmonic_oscillator":
				waveFunction = generateHarmonicOscillator(n - 1, points);
				break;
			case "hydrogen_atom":
				waveFunction = generateHydrogenAtom(n, l, points);
				break;
			case "double_slit":
				waveFunction = generateDoubleSlit(points, timeRef.current);
				break;
			default:
				waveFunction = generateParticleInBox(n, 10, points);
		}

		return {
			n,
			l,
			m: 0,
			waveFunction,
			color: hsl((n * 60) % 360, 70, 60),
		};
	};

	const applyTimeEvolution = (
		state: QuantumState,
		time: number,
	): QuantumState => {
		if (!settings.timeEvolution) return state;

		const newAmplitude = state.waveFunction.amplitude.map((amp) => {
			const energyPhase =
				-state.waveFunction.energy * time * settings.animationSpeed;
			const timeFactor: ComplexNumber = {
				real: cos(energyPhase),
				imag: sin(energyPhase),
			};
			return complexMultiply(amp, timeFactor);
		});

		const newProbability = newAmplitude.map((amp) =>
			complexMagnitudeSquared(amp),
		);

		return {
			...state,
			waveFunction: {
				...state.waveFunction,
				amplitude: newAmplitude,
				probability: newProbability,
			},
		};
	};

	const getWaveColor = (
		state: QuantumState,
		index: number,
		time: number,
	): string => {
		const amp = state.waveFunction.amplitude[index];

		switch (settings.colorMode) {
			case "phase": {
				const phase = complexPhase(amp);
				const hue = ((phase + PI) / TWO_PI) * 360;
				return toCssHsl(hsl(hue, 80, 60));
			}
			case "probability": {
				const prob = state.waveFunction.probability[index];
				const maxProb = Math.max(...state.waveFunction.probability);
				const intensity = prob / maxProb;
				return toCssHsl(hsl(240 + intensity * 120, 80, 30 + intensity * 50));
			}
			case "energy": {
				const energyHue = clamp((state.waveFunction.energy + 20) * 10, 0, 360);
				return toCssHsl(hsl(energyHue, 70, 50));
			}
			case "quantum_numbers": {
				const hue = (state.n * 60 + state.l * 120) % 360;
				return toCssHsl(hsl(hue, 80, 60));
			}
			default:
				return "#4A90E2";
		}
	};

	const performMeasurement = (x: number) => {
		if (quantumStates.length === 0) return;

		const state = quantumStates[0];
		const position = state.waveFunction.position;
		const probability = state.waveFunction.probability;

		// Find closest position index
		let closestIndex = 0;
		let minDistance = Math.abs(position[0] - x);

		for (let i = 1; i < position.length; i++) {
			const distance = Math.abs(position[i] - x);
			if (distance < minDistance) {
				minDistance = distance;
				closestIndex = i;
			}
		}

		setMeasurementPosition(x);
		setObservableValue(probability[closestIndex]);
		setSettings((prev) => ({ ...prev, measurement: true }));

		// Collapse wave function (simplified)
		setTimeout(() => {
			setSettings((prev) => ({ ...prev, measurement: false }));
			setMeasurementPosition(null);
		}, 2000);
	};

	const render = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx || quantumStates.length === 0) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw quantum background
		const gradient = ctx.createLinearGradient(
			0,
			0,
			canvas.width,
			canvas.height,
		);
		gradient.addColorStop(0, "#0a0a1a");
		gradient.addColorStop(0.5, "#1a1a3a");
		gradient.addColorStop(1, "#2a1a3a");
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		const time = timeRef.current;
		const state = applyTimeEvolution(quantumStates[0], time);
		const { waveFunction } = state;

		const xScale = (canvas.width - 100) / (waveFunction.position.length - 1);
		const centerY = canvas.height / 2;
		const yScale = (canvas.height - 100) / 4;

		// Draw coordinate axes
		ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(50, centerY);
		ctx.lineTo(canvas.width - 50, centerY);
		ctx.moveTo(50, 50);
		ctx.lineTo(50, canvas.height - 50);
		ctx.stroke();

		// Draw probability density
		if (settings.showProbability) {
			ctx.fillStyle = "rgba(100, 255, 100, 0.3)";
			ctx.beginPath();
			ctx.moveTo(50, centerY);

			for (let i = 0; i < waveFunction.probability.length; i++) {
				const x = 50 + i * xScale;
				const prob = waveFunction.probability[i];
				const maxProb = Math.max(...waveFunction.probability);
				const y = centerY - (prob / maxProb) * yScale;

				if (i === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			}

			ctx.lineTo(canvas.width - 50, centerY);
			ctx.closePath();
			ctx.fill();
		}

		// Draw wave function (real and imaginary parts)
		if (settings.showWaveFunction) {
			// Real part
			ctx.strokeStyle = "rgba(100, 150, 255, 0.8)";
			ctx.lineWidth = 2;
			ctx.beginPath();

			for (let i = 0; i < waveFunction.amplitude.length; i++) {
				const x = 50 + i * xScale;
				const realPart = waveFunction.amplitude[i].real;
				const y = centerY - realPart * yScale;

				if (i === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			}
			ctx.stroke();

			// Imaginary part
			ctx.strokeStyle = "rgba(255, 100, 150, 0.8)";
			ctx.lineWidth = 2;
			ctx.beginPath();

			for (let i = 0; i < waveFunction.amplitude.length; i++) {
				const x = 50 + i * xScale;
				const imagPart = waveFunction.amplitude[i].imag;
				const y = centerY - imagPart * yScale;

				if (i === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			}
			ctx.stroke();
		}

		// Draw phase visualization
		if (settings.colorMode === "phase") {
			for (let i = 0; i < waveFunction.amplitude.length; i += 5) {
				const x = 50 + i * xScale;
				const phase = complexPhase(waveFunction.amplitude[i]);
				const intensity = complexMagnitudeSquared(waveFunction.amplitude[i]);

				if (intensity > 0.01) {
					ctx.fillStyle = getWaveColor(state, i, time);
					ctx.globalAlpha = intensity * 2;
					ctx.beginPath();
					ctx.arc(x, centerY, 3, 0, TWO_PI);
					ctx.fill();
					ctx.globalAlpha = 1;
				}
			}
		}

		// Draw nodes
		if (settings.showNodes && waveFunction.nodes > 0) {
			ctx.strokeStyle = "rgba(255, 255, 0, 0.8)";
			ctx.lineWidth = 2;

			// Find zero crossings
			for (let i = 1; i < waveFunction.amplitude.length; i++) {
				const prev = waveFunction.amplitude[i - 1].real;
				const curr = waveFunction.amplitude[i].real;

				if ((prev > 0 && curr < 0) || (prev < 0 && curr > 0)) {
					const x = 50 + i * xScale;
					ctx.beginPath();
					ctx.moveTo(x, centerY - yScale);
					ctx.lineTo(x, centerY + yScale);
					ctx.stroke();
				}
			}
		}

		// Draw measurement
		if (settings.measurement && measurementPosition !== null) {
			const measureX =
				50 +
				(measurementPosition /
					waveFunction.position[waveFunction.position.length - 1]) *
					(canvas.width - 100);

			ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
			ctx.lineWidth = 3;
			ctx.setLineDash([5, 5]);
			ctx.beginPath();
			ctx.moveTo(measureX, 50);
			ctx.lineTo(measureX, canvas.height - 50);
			ctx.stroke();
			ctx.setLineDash([]);

			// Measurement collapse effect
			const collapseRadius = sin(time * 10) * 20 + 30;
			ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(measureX, centerY, collapseRadius, 0, TWO_PI);
			ctx.stroke();
		}

		// Draw quantum information
		ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
		ctx.fillRect(10, 10, 280, 120);
		ctx.fillStyle = "#ffffff";
		ctx.font = "14px Arial";
		ctx.textAlign = "left";

		ctx.fillText(
			`Quantum System: ${settings.simulationType.replace("_", " ")}`,
			20,
			30,
		);
		ctx.fillText(`Energy Level: n = ${state.n}`, 20, 50);
		ctx.fillText(`Energy: ${state.waveFunction.energy.toFixed(3)} eV`, 20, 70);
		ctx.fillText(`Nodes: ${state.waveFunction.nodes}`, 20, 90);

		if (measurementPosition !== null) {
			ctx.fillText(`Measurement: P = ${observableValue.toFixed(4)}`, 20, 110);
		}

		// Draw uncertainty principle visualization
		if (settings.uncertainty > 0) {
			const uncertaintyX = 50 + settings.uncertainty * (canvas.width - 100);
			ctx.fillStyle = "rgba(255, 100, 100, 0.3)";
			ctx.fillRect(uncertaintyX - 20, centerY - 50, 40, 100);

			ctx.fillStyle = "#ffffff";
			ctx.font = "12px Arial";
			ctx.textAlign = "center";
			ctx.fillText("Δx", uncertaintyX, centerY + 70);
		}
	};

	const animate = () => {
		timeRef.current += 0.02;
		render();
		if (isSimulating) {
			animationRef.current = requestAnimationFrame(animate);
		}
	};

	const startSimulation = () => {
		setIsSimulating(true);
		animationRef.current = requestAnimationFrame(animate);
	};

	const stopSimulation = () => {
		setIsSimulating(false);
		if (animationRef.current) {
			cancelAnimationFrame(animationRef.current);
		}
	};

	const updateQuantumState = () => {
		const state = generateQuantumState(
			settings.simulationType,
			settings.energyLevel,
		);
		setQuantumStates([state]);
	};

	const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!settings.measurement) return;

		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const relativeX = (x - 50) / (canvas.width - 100);

		if (quantumStates.length > 0) {
			const maxPos =
				quantumStates[0].waveFunction.position[
					quantumStates[0].waveFunction.position.length - 1
				];
			performMeasurement(relativeX * maxPos);
		}
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.width = 900;
		canvas.height = 600;

		updateQuantumState();
	}, []);

	useEffect(() => {
		updateQuantumState();
	}, [settings.simulationType, settings.energyLevel]);

	useEffect(() => {
		if (!isSimulating) render();
	}, [
		quantumStates,
		settings.showProbability,
		settings.showWaveFunction,
		settings.showNodes,
		settings.colorMode,
	]);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Quantum Mechanics Simulation
				</h1>
				<p className="text-gray-600 mb-4">
					Interactive quantum mechanics visualization with wave functions,
					probability distributions, and measurement effects.
				</p>
				<div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
					<p className="text-violet-800">
						⚛️ Explore quantum states, wave-particle duality, uncertainty
						principle, and measurement collapse
					</p>
				</div>
			</div>

			<div className="mb-6">
				<div className="flex flex-wrap gap-4 mb-4">
					<button
						type="button"
						onClick={startSimulation}
						disabled={isSimulating}
						className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 transition-colors"
					>
						Start Simulation
					</button>
					<button
						type="button"
						onClick={stopSimulation}
						disabled={!isSimulating}
						className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
					>
						Stop Simulation
					</button>
					<button
						type="button"
						onClick={() =>
							setSettings((prev) => ({
								...prev,
								measurement: !prev.measurement,
							}))
						}
						className={`px-4 py-2 rounded-md transition-colors ${
							settings.measurement
								? "bg-yellow-600 text-white hover:bg-yellow-700"
								: "bg-gray-600 text-white hover:bg-gray-700"
						}`}
					>
						{settings.measurement
							? "Measurement Mode ON"
							: "Enable Measurement"}
					</button>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Quantum System
						</label>
						<select
							value={settings.simulationType}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									simulationType: e.target.value as typeof prev.simulationType,
								}))
							}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
						>
							<option value="particle_in_box">Particle in Box</option>
							<option value="harmonic_oscillator">Harmonic Oscillator</option>
							<option value="hydrogen_atom">Hydrogen Atom</option>
							<option value="double_slit">Double Slit</option>
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Energy Level: n = {settings.energyLevel}
						</label>
						<input
							type="range"
							min="1"
							max="5"
							value={settings.energyLevel}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									energyLevel: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Color Mode
						</label>
						<select
							value={settings.colorMode}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									colorMode: e.target.value as typeof prev.colorMode,
								}))
							}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
						>
							<option value="phase">Phase</option>
							<option value="probability">Probability</option>
							<option value="energy">Energy</option>
							<option value="quantum_numbers">Quantum Numbers</option>
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Animation Speed: {settings.animationSpeed.toFixed(1)}
						</label>
						<input
							type="range"
							min="0.1"
							max="3"
							step="0.1"
							value={settings.animationSpeed}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									animationSpeed: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={settings.timeEvolution}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									timeEvolution: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">
							Time Evolution
						</span>
					</label>
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={settings.showProbability}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									showProbability: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">
							Show Probability
						</span>
					</label>
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={settings.showWaveFunction}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									showWaveFunction: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">
							Show Wave Function
						</span>
					</label>
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={settings.showNodes}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									showNodes: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">
							Show Nodes
						</span>
					</label>
				</div>
			</div>

			<div className="mb-6">
				<canvas
					ref={canvasRef}
					className="border border-gray-300 rounded-lg bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 cursor-crosshair"
					style={{ maxWidth: "100%", height: "auto" }}
					onClick={handleCanvasClick}
				/>
				<p className="text-sm text-gray-500 mt-2">
					{settings.measurement
						? "Click to perform quantum measurement"
						: "Quantum wave function visualization"}
				</p>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-purple-800">
						Quantum Concepts
					</h3>
					<ul className="text-purple-700 space-y-1">
						<li>
							• <strong>Wave-Particle Duality</strong>: Matter exhibits both
							wave and particle properties
						</li>
						<li>
							• <strong>Probability Density</strong>: |ψ|² gives probability of
							finding particle
						</li>
						<li>
							• <strong>Quantized Energy</strong>: Only discrete energy levels
							allowed
						</li>
						<li>
							• <strong>Measurement Collapse</strong>: Observation changes
							quantum state
						</li>
					</ul>
				</div>

				<div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-violet-800">
						Simulation Features
					</h3>
					<ul className="text-violet-700 space-y-1">
						<li>
							• <strong>Multiple Systems</strong>: Box, oscillator, hydrogen,
							double-slit
						</li>
						<li>
							• <strong>Time Evolution</strong>: Watch quantum states evolve
						</li>
						<li>
							• <strong>Interactive Measurement</strong>: Click to collapse wave
							function
						</li>
						<li>
							• <strong>Phase Visualization</strong>: Complex wave function
							representation
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
				<h3 className="text-lg font-semibold mb-2 text-indigo-800">
					Applications
				</h3>
				<div className="grid md:grid-cols-3 gap-4 text-indigo-700">
					<div>
						<strong>Technology:</strong>
						<ul className="text-sm mt-1">
							<li>• Quantum computing</li>
							<li>• Laser technology</li>
							<li>• Medical imaging (MRI)</li>
						</ul>
					</div>
					<div>
						<strong>Scientific Research:</strong>
						<ul className="text-sm mt-1">
							<li>• Atomic physics</li>
							<li>• Materials science</li>
							<li>• Quantum chemistry</li>
						</ul>
					</div>
					<div>
						<strong>Future Applications:</strong>
						<ul className="text-sm mt-1">
							<li>• Quantum cryptography</li>
							<li>• Quantum sensors</li>
							<li>• Quantum simulation</li>
						</ul>
					</div>
				</div>
			</div>

			<div className="mt-6">
				<Link
					to="/examples/visual"
					className="inline-block px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
				>
					← Back to Examples
				</Link>
			</div>
		</div>
	);
}
