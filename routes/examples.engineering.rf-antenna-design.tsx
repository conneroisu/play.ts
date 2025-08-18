import { createFileRoute, Link } from "@tanstack/react-router";
import {
	atan2,
	clamp,
	cos,
	hsl,
	hslToRgb,
	lerp,
	PI,
	sin,
	sqrt,
	TWO_PI,
	toCssHsl,
	vec2,
} from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/engineering/rf-antenna-design")(
	{
		component: RFAntennaDesignExample,
	},
);

interface AntennaElement {
	x: number;
	y: number;
	length: number;
	current: { real: number; imag: number };
	phase: number;
}

interface ComplexNumber {
	real: number;
	imag: number;
}

interface AntennaPattern {
	theta: number;
	magnitude: number;
	phase: number;
	directivity: number;
}

interface TransmissionLine {
	z0: number; // Characteristic impedance
	length: number; // Length in wavelengths
	zl: ComplexNumber; // Load impedance
	frequency: number; // Operating frequency (MHz)
}

function RFAntennaDesignExample() {
	const polarCanvasRef = useRef<HTMLCanvasElement>(null);
	const smithCanvasRef = useRef<HTMLCanvasElement>(null);
	const impedanceCanvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();

	const [antennaType, setAntennaType] = useState<
		"dipole" | "yagi" | "patch" | "array"
	>("dipole");
	const [settings, setSettings] = useState({
		frequency: 2400, // MHz
		wavelength: 0.125, // meters
		elements: 4,
		spacing: 0.25, // wavelengths
		feedImpedance: 50, // ohms
		antennaGain: 0, // dBi
		beamwidth: 90, // degrees
		frontBackRatio: 0, // dB
		vswr: 1.0,
		efficiency: 95, // percent
		showEField: true,
		showHField: false,
		show3DPattern: false,
		animatePhase: false,
	});

	const [antennaElements, setAntennaElements] = useState<AntennaElement[]>([]);
	const [radiationPattern, setRadiationPattern] = useState<AntennaPattern[]>(
		[],
	);
	const [transmissionLine, setTransmissionLine] = useState<TransmissionLine>({
		z0: 50,
		length: 0.25,
		zl: { real: 73, imag: 42.5 },
		frequency: 2400,
	});

	const [smithChart, setSmithChart] = useState({
		impedancePoints: [] as { z: ComplexNumber; reflection: ComplexNumber }[],
		matchingNetwork: [] as {
			type: "series" | "shunt";
			value: number;
			reactance: number;
		}[],
		currentPoint: { real: 0, imag: 0 },
	});

	const [simulation, setSimulation] = useState({
		running: false,
		time: 0,
		phaseOffset: 0,
	});

	// Calculate wavelength from frequency
	useEffect(() => {
		const c = 299792458; // Speed of light in m/s
		const wavelength = c / (settings.frequency * 1e6);
		setSettings((prev) => ({ ...prev, wavelength }));
	}, [settings.frequency]);

	// Initialize antenna elements based on type
	useEffect(() => {
		const elements: AntennaElement[] = [];
		const lambda = settings.wavelength;

		switch (antennaType) {
			case "dipole":
				elements.push({
					x: 0,
					y: 0,
					length: lambda / 2,
					current: { real: 1, imag: 0 },
					phase: 0,
				});
				break;

			case "yagi":
				// Reflector
				elements.push({
					x: -lambda * 0.25,
					y: 0,
					length: lambda * 0.51,
					current: { real: 0.8, imag: -0.3 },
					phase: 180,
				});
				// Driven element
				elements.push({
					x: 0,
					y: 0,
					length: lambda * 0.47,
					current: { real: 1, imag: 0 },
					phase: 0,
				});
				// Directors
				for (let i = 1; i <= 3; i++) {
					elements.push({
						x: lambda * 0.2 * i,
						y: 0,
						length: lambda * (0.45 - i * 0.02),
						current: { real: 0.6 / i, imag: 0.2 },
						phase: -30 * i,
					});
				}
				break;

			case "patch":
				// Rectangular patch antenna
				elements.push({
					x: 0,
					y: 0,
					length: lambda / 2,
					current: { real: 1, imag: 0 },
					phase: 0,
				});
				break;

			case "array":
				// Linear array
				for (let i = 0; i < settings.elements; i++) {
					elements.push({
						x: i * settings.spacing * lambda,
						y: 0,
						length: lambda / 2,
						current: { real: 1, imag: 0 },
						phase: i * 60, // Progressive phase
					});
				}
				break;
		}

		setAntennaElements(elements);
	}, [antennaType, settings.wavelength, settings.elements, settings.spacing]);

	// Complex number operations
	const complexAdd = (a: ComplexNumber, b: ComplexNumber): ComplexNumber => ({
		real: a.real + b.real,
		imag: a.imag + b.imag,
	});

	const complexMul = (a: ComplexNumber, b: ComplexNumber): ComplexNumber => ({
		real: a.real * b.real - a.imag * b.imag,
		imag: a.real * b.imag + a.imag * b.real,
	});

	const complexMag = (z: ComplexNumber): number =>
		sqrt(z.real * z.real + z.imag * z.imag);

	const complexPhase = (z: ComplexNumber): number => atan2(z.imag, z.real);

	// Calculate radiation pattern
	const calculateRadiationPattern = () => {
		const pattern: AntennaPattern[] = [];
		const k = TWO_PI / settings.wavelength; // Wave number

		for (let theta = 0; theta <= 360; theta += 2) {
			const thetaRad = (theta * PI) / 180;
			let totalField: ComplexNumber = { real: 0, imag: 0 };

			antennaElements.forEach((element) => {
				// Calculate field contribution from each element
				const distance = element.x * cos(thetaRad) + element.y * sin(thetaRad);
				const phaseShift = k * distance + (element.phase * PI) / 180;

				// Element pattern (dipole approximation)
				const elementPattern =
					antennaType === "patch"
						? cos((PI / 2) * cos(thetaRad)) / sin(thetaRad)
						: cos((PI / 2) * cos(thetaRad));

				if (!isFinite(elementPattern)) return;

				const fieldContrib: ComplexNumber = {
					real:
						element.current.real *
						elementPattern *
						cos(phaseShift + simulation.phaseOffset),
					imag:
						element.current.imag *
						elementPattern *
						sin(phaseShift + simulation.phaseOffset),
				};

				totalField = complexAdd(totalField, fieldContrib);
			});

			const magnitude = complexMag(totalField);
			const phase = complexPhase(totalField);

			// Calculate directivity (simplified)
			const directivity = 20 * Math.log10(magnitude + 1e-10);

			pattern.push({
				theta,
				magnitude,
				phase,
				directivity: clamp(directivity, -40, 20),
			});
		}

		setRadiationPattern(pattern);

		// Calculate antenna parameters
		const maxGain = Math.max(...pattern.map((p) => p.directivity));
		const mainLobe = pattern.find((p) => p.directivity === maxGain);
		const backLobe = pattern.find(
			(p) => Math.abs(p.theta - (mainLobe?.theta || 0) - 180) < 10,
		);

		setSettings((prev) => ({
			...prev,
			antennaGain: maxGain,
			frontBackRatio: maxGain - (backLobe?.directivity || -40),
			beamwidth: calculateBeamwidth(pattern, maxGain - 3), // 3dB beamwidth
		}));
	};

	const calculateBeamwidth = (
		pattern: AntennaPattern[],
		threshold: number,
	): number => {
		const mainLobe = pattern.find(
			(p) => p.directivity === Math.max(...pattern.map((pt) => pt.directivity)),
		);
		if (!mainLobe) return 90;

		let lower = 0,
			upper = 360;
		for (const point of pattern) {
			if (point.directivity >= threshold) {
				if (point.theta < mainLobe.theta) lower = Math.max(lower, point.theta);
				if (point.theta > mainLobe.theta) {
					upper = point.theta;
					break;
				}
			}
		}

		return upper - lower;
	};

	// Calculate Smith Chart impedance transformations
	const calculateSmithChart = () => {
		const points: { z: ComplexNumber; reflection: ComplexNumber }[] = [];
		const z0 = transmissionLine.z0;
		const zl = transmissionLine.zl;

		// Calculate reflection coefficient
		const numerator = complexAdd(zl, { real: -z0, imag: 0 });
		const denominator = complexAdd(zl, { real: z0, imag: 0 });
		const denMag = complexMag(denominator);

		const reflection: ComplexNumber = {
			real:
				(numerator.real * denominator.real +
					numerator.imag * denominator.imag) /
				(denMag * denMag),
			imag:
				(numerator.imag * denominator.real -
					numerator.real * denominator.imag) /
				(denMag * denMag),
		};

		points.push({ z: zl, reflection });

		// Add points along transmission line
		for (let l = 0; l <= 0.5; l += 0.05) {
			const beta = TWO_PI * l;
			const rotatedReflection: ComplexNumber = {
				real: reflection.real * cos(2 * beta) + reflection.imag * sin(2 * beta),
				imag: reflection.imag * cos(2 * beta) - reflection.real * sin(2 * beta),
			};

			// Transform back to impedance
			const onePlusGamma = complexAdd({ real: 1, imag: 0 }, rotatedReflection);
			const oneMinusGamma = complexAdd(
				{ real: 1, imag: 0 },
				{ real: -rotatedReflection.real, imag: -rotatedReflection.imag },
			);
			const oneMinusMag = complexMag(oneMinusGamma);

			const zTransformed: ComplexNumber = {
				real:
					(z0 *
						(onePlusGamma.real * oneMinusGamma.real +
							onePlusGamma.imag * oneMinusGamma.imag)) /
					(oneMinusMag * oneMinusMag),
				imag:
					(z0 *
						(onePlusGamma.imag * oneMinusGamma.real -
							onePlusGamma.real * oneMinusGamma.imag)) /
					(oneMinusMag * oneMinusMag),
			};

			points.push({ z: zTransformed, reflection: rotatedReflection });
		}

		setSmithChart((prev) => ({ ...prev, impedancePoints: points }));

		// Calculate VSWR
		const reflectionMag = complexMag(reflection);
		const vswr = (1 + reflectionMag) / (1 - reflectionMag);
		setSettings((prev) => ({ ...prev, vswr: clamp(vswr, 1, 10) }));
	};

	// Animation loop
	useEffect(() => {
		if (simulation.running) {
			const animate = () => {
				setSimulation((prev) => ({
					...prev,
					time: prev.time + 0.01,
					phaseOffset: settings.animatePhase
						? (prev.time * TWO_PI * 0.1) % TWO_PI
						: 0,
				}));
				animationRef.current = requestAnimationFrame(animate);
			};
			animationRef.current = requestAnimationFrame(animate);
		}

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [simulation.running, settings.animatePhase]);

	// Update calculations when parameters change
	useEffect(() => {
		calculateRadiationPattern();
		calculateSmithChart();
	}, [antennaElements, simulation.phaseOffset, transmissionLine]);

	// Render polar radiation pattern
	const renderPolarPattern = () => {
		const canvas = polarCanvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx || radiationPattern.length === 0) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		const radius = Math.min(centerX, centerY) * 0.8;

		// Draw grid circles
		ctx.strokeStyle = "#e0e0e0";
		ctx.lineWidth = 1;
		for (let r = radius / 4; r <= radius; r += radius / 4) {
			ctx.beginPath();
			ctx.arc(centerX, centerY, r, 0, TWO_PI);
			ctx.stroke();
		}

		// Draw radial lines
		for (let angle = 0; angle < 360; angle += 30) {
			const x = centerX + radius * cos((angle * PI) / 180);
			const y = centerY + radius * sin((angle * PI) / 180);
			ctx.beginPath();
			ctx.moveTo(centerX, centerY);
			ctx.lineTo(x, y);
			ctx.stroke();

			// Add angle labels
			ctx.fillStyle = "#666";
			ctx.font = "12px Arial";
			ctx.textAlign = "center";
			ctx.fillText(
				`${angle}°`,
				x * 1.1 - centerX * 0.1,
				y * 1.1 - centerY * 0.1,
			);
		}

		// Draw radiation pattern
		ctx.strokeStyle = "#ff4444";
		ctx.lineWidth = 3;
		ctx.beginPath();

		radiationPattern.forEach((point, index) => {
			const normalizedMag = clamp((point.directivity + 40) / 60, 0, 1); // Normalize -40 to 20 dB
			const r = normalizedMag * radius;
			const x = centerX + r * cos((point.theta * PI) / 180);
			const y = centerY + r * sin((point.theta * PI) / 180);

			if (index === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		});

		ctx.closePath();
		ctx.stroke();

		// Fill pattern
		ctx.fillStyle = "rgba(255, 68, 68, 0.3)";
		ctx.fill();

		// Draw gain labels
		ctx.fillStyle = "#333";
		ctx.font = "10px Arial";
		for (let gain = -30; gain <= 20; gain += 10) {
			const r = ((gain + 40) / 60) * radius;
			ctx.fillText(`${gain}dB`, centerX + r + 5, centerY);
		}
	};

	// Render Smith Chart
	const renderSmithChart = () => {
		const canvas = smithCanvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		const radius = Math.min(centerX, centerY) * 0.8;

		// Draw Smith Chart circles
		ctx.strokeStyle = "#e0e0e0";
		ctx.lineWidth = 1;

		// Outer circle
		ctx.beginPath();
		ctx.arc(centerX, centerY, radius, 0, TWO_PI);
		ctx.stroke();

		// Resistance circles
		for (let r = 0.2; r <= 5; r *= 2) {
			const circleRadius = radius / (1 + r);
			const circleX = centerX + (radius * r) / (1 + r);
			ctx.beginPath();
			ctx.arc(circleX, centerY, circleRadius, 0, TWO_PI);
			ctx.stroke();
		}

		// Reactance arcs
		for (let x = 0.2; x <= 5; x *= 2) {
			const arcRadius = radius / x;
			const arcY = centerY - radius / x;
			ctx.beginPath();
			ctx.arc(centerX + radius, arcY, arcRadius, PI / 2, PI);
			ctx.stroke();

			ctx.beginPath();
			ctx.arc(
				centerX + radius,
				centerY + radius / x,
				arcRadius,
				PI,
				(3 * PI) / 2,
			);
			ctx.stroke();
		}

		// Draw impedance points
		if (smithChart.impedancePoints.length > 0) {
			ctx.strokeStyle = "#ff4444";
			ctx.lineWidth = 2;
			ctx.beginPath();

			smithChart.impedancePoints.forEach((point, index) => {
				const x = centerX + point.reflection.real * radius;
				const y = centerY - point.reflection.imag * radius;

				if (index === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			});

			ctx.stroke();

			// Mark load point
			const loadPoint = smithChart.impedancePoints[0];
			if (loadPoint) {
				const x = centerX + loadPoint.reflection.real * radius;
				const y = centerY - loadPoint.reflection.imag * radius;

				ctx.fillStyle = "#ff4444";
				ctx.beginPath();
				ctx.arc(x, y, 5, 0, TWO_PI);
				ctx.fill();
			}
		}

		// Add labels
		ctx.fillStyle = "#333";
		ctx.font = "12px Arial";
		ctx.textAlign = "center";
		ctx.fillText("Smith Chart", centerX, 20);
		ctx.fillText(
			"VSWR = " + settings.vswr.toFixed(2),
			centerX,
			canvas.height - 10,
		);
	};

	useEffect(() => {
		renderPolarPattern();
		renderSmithChart();
	}, [radiationPattern, smithChart, settings.vswr]);

	const toggleSimulation = () => {
		setSimulation((prev) => ({ ...prev, running: !prev.running }));
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">RF & Antenna Design</h1>
				<p className="text-gray-600 mb-4">
					Advanced antenna analysis with radiation patterns, Smith Chart
					impedance matching, and transmission line calculations.
				</p>
				<div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
					<p className="text-slate-800">
						📡 RF design - radiation patterns, impedance matching, VSWR
						analysis, and antenna arrays
					</p>
				</div>
			</div>

			<div className="grid lg:grid-cols-4 gap-6">
				{/* Controls */}
				<div className="lg:col-span-1 space-y-6">
					<div className="bg-white border border-gray-300 rounded-lg p-4">
						<h3 className="text-lg font-semibold mb-4">Antenna Design</h3>

						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Antenna Type
								</label>
								<select
									value={antennaType}
									onChange={(e) => setAntennaType(e.target.value as any)}
									className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
								>
									<option value="dipole">Half-Wave Dipole</option>
									<option value="yagi">Yagi-Uda Array</option>
									<option value="patch">Microstrip Patch</option>
									<option value="array">Linear Array</option>
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Frequency: {settings.frequency} MHz
								</label>
								<input
									type="range"
									min="100"
									max="6000"
									step="50"
									value={settings.frequency}
									onChange={(e) =>
										setSettings((prev) => ({
											...prev,
											frequency: Number(e.target.value),
										}))
									}
									className="w-full"
								/>
							</div>

							{antennaType === "array" && (
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Elements: {settings.elements}
									</label>
									<input
										type="range"
										min="2"
										max="8"
										step="1"
										value={settings.elements}
										onChange={(e) =>
											setSettings((prev) => ({
												...prev,
												elements: Number(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>
							)}

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Element Spacing: {settings.spacing.toFixed(2)}λ
								</label>
								<input
									type="range"
									min="0.1"
									max="1"
									step="0.05"
									value={settings.spacing}
									onChange={(e) =>
										setSettings((prev) => ({
											...prev,
											spacing: Number(e.target.value),
										}))
									}
									className="w-full"
								/>
							</div>

							<label className="flex items-center">
								<input
									type="checkbox"
									checked={settings.animatePhase}
									onChange={(e) =>
										setSettings((prev) => ({
											...prev,
											animatePhase: e.target.checked,
										}))
									}
									className="mr-2"
								/>
								<span className="text-sm font-medium text-gray-700">
									Animate Phase
								</span>
							</label>

							<button
								onClick={toggleSimulation}
								className={`w-full px-3 py-2 rounded-md transition-colors ${
									simulation.running
										? "bg-red-600 text-white hover:bg-red-700"
										: "bg-green-600 text-white hover:bg-green-700"
								}`}
							>
								{simulation.running ? "Stop Animation" : "Start Animation"}
							</button>
						</div>
					</div>

					<div className="bg-white border border-gray-300 rounded-lg p-4">
						<h3 className="text-lg font-semibold mb-4">Transmission Line</h3>

						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Z₀: {transmissionLine.z0}Ω
								</label>
								<input
									type="range"
									min="25"
									max="100"
									step="5"
									value={transmissionLine.z0}
									onChange={(e) =>
										setTransmissionLine((prev) => ({
											...prev,
											z0: Number(e.target.value),
										}))
									}
									className="w-full"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Load R: {transmissionLine.zl.real.toFixed(1)}Ω
								</label>
								<input
									type="range"
									min="10"
									max="150"
									step="1"
									value={transmissionLine.zl.real}
									onChange={(e) =>
										setTransmissionLine((prev) => ({
											...prev,
											zl: { ...prev.zl, real: Number(e.target.value) },
										}))
									}
									className="w-full"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Load X: {transmissionLine.zl.imag.toFixed(1)}Ω
								</label>
								<input
									type="range"
									min="-100"
									max="100"
									step="1"
									value={transmissionLine.zl.imag}
									onChange={(e) =>
										setTransmissionLine((prev) => ({
											...prev,
											zl: { ...prev.zl, imag: Number(e.target.value) },
										}))
									}
									className="w-full"
								/>
							</div>
						</div>
					</div>

					<div className="bg-white border border-gray-300 rounded-lg p-4">
						<h3 className="text-lg font-semibold mb-4">Performance</h3>

						<div className="space-y-3 text-sm">
							<div className="flex justify-between">
								<span>Gain:</span>
								<span className="font-semibold">
									{settings.antennaGain.toFixed(1)} dBi
								</span>
							</div>
							<div className="flex justify-between">
								<span>Beamwidth:</span>
								<span className="font-semibold">
									{settings.beamwidth.toFixed(1)}°
								</span>
							</div>
							<div className="flex justify-between">
								<span>F/B Ratio:</span>
								<span className="font-semibold">
									{settings.frontBackRatio.toFixed(1)} dB
								</span>
							</div>
							<div className="flex justify-between">
								<span>VSWR:</span>
								<span className="font-semibold">
									{settings.vswr.toFixed(2)}:1
								</span>
							</div>
							<div className="flex justify-between">
								<span>Efficiency:</span>
								<span className="font-semibold">{settings.efficiency}%</span>
							</div>
							<div className="flex justify-between">
								<span>Wavelength:</span>
								<span className="font-semibold">
									{(settings.wavelength * 100).toFixed(1)} cm
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Main Visualization */}
				<div className="lg:col-span-3">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Radiation Pattern */}
						<div className="bg-white border border-gray-300 rounded-lg p-4">
							<h3 className="text-lg font-semibold mb-4">Radiation Pattern</h3>
							<canvas
								ref={polarCanvasRef}
								width={300}
								height={300}
								className="w-full max-w-sm mx-auto"
							/>
						</div>

						{/* Smith Chart */}
						<div className="bg-white border border-gray-300 rounded-lg p-4">
							<h3 className="text-lg font-semibold mb-4">Smith Chart</h3>
							<canvas
								ref={smithCanvasRef}
								width={300}
								height={300}
								className="w-full max-w-sm mx-auto"
							/>
						</div>
					</div>

					{/* Antenna Parameters */}
					<div className="mt-4 bg-white border border-gray-300 rounded-lg p-4">
						<h3 className="text-lg font-semibold mb-3">Antenna Analysis</h3>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div className="text-center">
								<div className="text-2xl font-bold text-blue-600">
									{settings.antennaGain.toFixed(1)}
								</div>
								<div className="text-sm text-gray-600">Gain (dBi)</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-green-600">
									{settings.beamwidth.toFixed(0)}°
								</div>
								<div className="text-sm text-gray-600">Beamwidth</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-purple-600">
									{settings.vswr.toFixed(2)}
								</div>
								<div className="text-sm text-gray-600">VSWR</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-orange-600">
									{settings.frontBackRatio.toFixed(1)}
								</div>
								<div className="text-sm text-gray-600">F/B Ratio (dB)</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="mt-8 grid md:grid-cols-2 gap-6">
				<div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-slate-800">
						RF Engineering
					</h3>
					<ul className="text-slate-700 space-y-1">
						<li>
							• <strong>Radiation Pattern</strong>: Directional power
							distribution
						</li>
						<li>
							• <strong>Smith Chart</strong>: Impedance matching visualization
						</li>
						<li>
							• <strong>VSWR</strong>: Voltage Standing Wave Ratio
						</li>
						<li>
							• <strong>Transmission Lines</strong>: Impedance transformation
						</li>
					</ul>
				</div>

				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-blue-800">
						Applications
					</h3>
					<ul className="text-blue-700 space-y-1">
						<li>
							• <strong>Wireless Communications</strong>: 5G, WiFi, Bluetooth
						</li>
						<li>
							• <strong>Radar Systems</strong>: Weather, automotive, military
						</li>
						<li>
							• <strong>Satellite Communications</strong>: Broadcasting, GPS
						</li>
						<li>
							• <strong>RF Test Equipment</strong>: Network analyzers,
							generators
						</li>
					</ul>
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
