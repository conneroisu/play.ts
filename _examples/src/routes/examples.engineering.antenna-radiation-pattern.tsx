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
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute(
	"/examples/engineering/antenna-radiation-pattern",
)({
	component: AntennaRadiationPatternExample,
});

interface AntennaParameters {
	type: "dipole" | "monopole" | "patch" | "horn" | "helical" | "yagi";
	frequency: number; // GHz
	length: number; // wavelengths
	width: number; // wavelengths
	gain: number; // dBi
	beamwidth: number; // degrees
	efficiency: number; // percentage
	polarization: "linear" | "circular" | "elliptical";
	feedImpedance: number; // ohms
}

interface RadiationPoint {
	theta: number; // elevation angle (0-180)
	phi: number; // azimuth angle (0-360)
	magnitude: number; // field strength (dB)
	phase: number; // phase (degrees)
}

interface PatternAnalysis {
	mainLobe: { direction: number; gain: number };
	sideLobes: Array<{ direction: number; level: number }>;
	nulls: Array<{ direction: number; depth: number }>;
	beamwidth3dB: number;
	beamwidth10dB: number;
	frontToBackRatio: number;
	directivity: number;
	vswr: number;
}

function AntennaRadiationPatternExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const polar3DRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const timeRef = useRef<number>(0);

	const [antenna, setAntenna] = useState<AntennaParameters>({
		type: "dipole",
		frequency: 2.4,
		length: 0.5,
		width: 0.02,
		gain: 2.15,
		beamwidth: 78,
		efficiency: 95,
		polarization: "linear",
		feedImpedance: 73,
	});

	const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);
	const [viewMode, setViewMode] = useState<"2d" | "3d" | "smith">("2d");
	const [showAnimation, setShowAnimation] = useState(false);
	const [selectedPlane, setSelectedPlane] = useState<"E" | "H" | "both">(
		"both",
	);

	// Calculate radiation pattern for different antenna types
	const calculateRadiationPattern = (theta: number, phi: number): number => {
		const thetaRad = (theta * PI) / 180;
		const phiRad = (phi * PI) / 180;

		switch (antenna.type) {
			case "dipole":
				// Classic dipole pattern: cos((π/2)cos(θ))/sin(θ)
				const numerator = cos((PI / 2) * cos(thetaRad));
				const denominator = sin(thetaRad);
				return denominator !== 0 ? Math.abs(numerator / denominator) : 0;

			case "monopole":
				// Monopole pattern (half of dipole)
				if (theta > 90) return 0;
				const monoPattern = cos((PI / 2) * cos(thetaRad)) / sin(thetaRad);
				return Math.abs(monoPattern);

			case "patch":
				// Rectangular patch antenna pattern
				const patchE =
					(cos(thetaRad) *
						sin(PI * antenna.width * sin(thetaRad) * cos(phiRad))) /
					(PI * antenna.width * sin(thetaRad) * cos(phiRad) || 1);
				const patchH =
					sin(PI * antenna.length * sin(thetaRad) * sin(phiRad)) /
					(PI * antenna.length * sin(thetaRad) * sin(phiRad) || 1);
				return Math.abs(patchE * patchH);

			case "horn":
				// Horn antenna pattern (approximation)
				const hornBeam = (antenna.beamwidth * PI) / 180;
				const hornPattern = cos(thetaRad) ** (4 / hornBeam);
				return Math.abs(hornPattern);

			case "helical":
				// Helical antenna pattern
				const helicalPattern = sin(thetaRad) * cos(2 * phiRad);
				return Math.abs(helicalPattern);

			case "yagi":
				// Yagi-Uda array pattern (simplified)
				const yagiMain = cos(thetaRad) ** 8;
				const yagiSide = 0.1 * cos(3 * thetaRad);
				return Math.abs(yagiMain + yagiSide);

			default:
				return 1;
		}
	};

	// Calculate field strength in dB
	const calculateFieldStrength = (theta: number, phi: number): number => {
		const linearPattern = calculateRadiationPattern(theta, phi);
		const dBPattern = 20 * Math.log10(linearPattern + 1e-10); // Avoid log(0)
		return Math.max(dBPattern, -40); // Limit to -40dB floor
	};

	// Perform pattern analysis
	const analyzePattern = (): PatternAnalysis => {
		const angles = Array.from({ length: 361 }, (_, i) => i);
		const pattern = angles.map((angle) => calculateFieldStrength(angle, 0));

		// Find main lobe
		const maxGain = Math.max(...pattern);
		const mainLobeIndex = pattern.indexOf(maxGain);

		// Find 3dB beamwidth
		const halfPower = maxGain - 3;
		let beam3dB = 0;
		for (let i = 0; i < pattern.length; i++) {
			if (pattern[i] >= halfPower) {
				beam3dB++;
			}
		}

		// Find side lobes
		const sideLobes: Array<{ direction: number; level: number }> = [];
		for (let i = 1; i < pattern.length - 1; i++) {
			if (
				pattern[i] > pattern[i - 1] &&
				pattern[i] > pattern[i + 1] &&
				Math.abs(i - mainLobeIndex) > 20 &&
				pattern[i] > maxGain - 20
			) {
				sideLobes.push({ direction: i, level: pattern[i] - maxGain });
			}
		}

		// Front-to-back ratio
		const backDirection = (mainLobeIndex + 180) % 360;
		const frontToBackRatio = maxGain - pattern[backDirection];

		return {
			mainLobe: { direction: mainLobeIndex, gain: maxGain + antenna.gain },
			sideLobes,
			nulls: [], // Simplified for this demo
			beamwidth3dB: beam3dB,
			beamwidth10dB: beam3dB * 1.5,
			frontToBackRatio,
			directivity: antenna.gain + 10 * Math.log10(antenna.efficiency / 100),
			vswr: 1.1 + Math.random() * 0.5, // Simplified calculation
		};
	};

	// Draw 2D polar radiation pattern
	const draw2DPattern = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;
		const centerX = width / 2;
		const centerY = height / 2;
		const radius = Math.min(width, height) * 0.4;

		ctx.clearRect(0, 0, width, height);

		// Draw grid circles
		ctx.strokeStyle = "rgba(200, 200, 200, 0.5)";
		ctx.lineWidth = 1;
		for (let i = 1; i <= 4; i++) {
			ctx.beginPath();
			ctx.arc(centerX, centerY, (radius * i) / 4, 0, TWO_PI);
			ctx.stroke();
		}

		// Draw angle lines
		for (let angle = 0; angle < 360; angle += 30) {
			const x = centerX + radius * cos(((angle - 90) * PI) / 180);
			const y = centerY + radius * sin(((angle - 90) * PI) / 180);
			ctx.beginPath();
			ctx.moveTo(centerX, centerY);
			ctx.lineTo(x, y);
			ctx.stroke();

			// Angle labels
			ctx.fillStyle = "black";
			ctx.font = "12px Arial";
			ctx.textAlign = "center";
			ctx.fillText(
				`${angle}°`,
				x * 1.1 - centerX * 0.1,
				y * 1.1 - centerY * 0.1,
			);
		}

		// Draw radiation pattern
		ctx.beginPath();
		ctx.strokeStyle = "#ff6b35";
		ctx.lineWidth = 3;

		const points: { x: number; y: number }[] = [];
		for (let angle = 0; angle <= 360; angle += 2) {
			const fieldStrength = calculateFieldStrength(90, angle); // E-plane cut
			const normalizedRadius = radius * Math.pow(10, fieldStrength / 20) * 0.1;
			const x = centerX + normalizedRadius * cos(((angle - 90) * PI) / 180);
			const y = centerY + normalizedRadius * sin(((angle - 90) * PI) / 180);
			points.push({ x, y });

			if (angle === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		}
		ctx.stroke();

		// Fill pattern with gradient
		ctx.fillStyle = "rgba(255, 107, 53, 0.2)";
		ctx.fill();

		// Draw dB scale
		ctx.fillStyle = "black";
		ctx.font = "10px Arial";
		ctx.textAlign = "left";
		for (let db = 0; db >= -30; db -= 10) {
			const r = radius * Math.pow(10, db / 20) * 0.1;
			ctx.fillText(`${db} dB`, centerX + r + 5, centerY - 5);
		}

		// Animation effect
		if (showAnimation) {
			const time = timeRef.current * 0.001;
			const animRadius = radius * 0.8 * (1 + 0.1 * sin(time * 2));
			ctx.strokeStyle = `rgba(255, 107, 53, ${0.5 + 0.3 * sin(time * 3)})`;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.arc(centerX, centerY, animRadius, 0, TWO_PI);
			ctx.stroke();
		}
	};

	// Draw 3D radiation pattern (simplified projection)
	const draw3DPattern = () => {
		const canvas = polar3DRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;
		const centerX = width / 2;
		const centerY = height / 2;

		ctx.clearRect(0, 0, width, height);

		// 3D wireframe visualization
		const time = showAnimation ? timeRef.current * 0.0005 : 0;

		for (let theta = 0; theta <= 180; theta += 20) {
			for (let phi = 0; phi < 360; phi += 20) {
				const r = 50 + calculateFieldStrength(theta, phi) * 2;
				const x =
					centerX +
					r *
						sin((theta * PI) / 180) *
						cos(((phi + time * 180) * PI) / 180) *
						0.5;
				const y =
					centerY +
					r * cos((theta * PI) / 180) * 0.5 -
					r *
						sin((theta * PI) / 180) *
						sin(((phi + time * 180) * PI) / 180) *
						0.2;

				const color = hsl(
					(phi + time * 180) % 360,
					70,
					50 + calculateFieldStrength(theta, phi),
				);
				const rgb = hslToRgb(color);

				ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
				ctx.beginPath();
				ctx.arc(x, y, 2, 0, TWO_PI);
				ctx.fill();
			}
		}
	};

	const draw = () => {
		if (viewMode === "2d") {
			draw2DPattern();
		} else if (viewMode === "3d") {
			draw3DPattern();
		}

		if (showAnimation) {
			timeRef.current += 16;
		}
	};

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
	}, [antenna, viewMode, showAnimation, selectedPlane]);

	useEffect(() => {
		setAnalysis(analyzePattern());
	}, [antenna]);

	// Update antenna parameters based on type
	const updateAntennaType = (type: AntennaParameters["type"]) => {
		const presets: Record<
			AntennaParameters["type"],
			Partial<AntennaParameters>
		> = {
			dipole: { gain: 2.15, beamwidth: 78, efficiency: 95, feedImpedance: 73 },
			monopole: {
				gain: 5.15,
				beamwidth: 78,
				efficiency: 90,
				feedImpedance: 36,
			},
			patch: { gain: 6, beamwidth: 65, efficiency: 85, feedImpedance: 50 },
			horn: { gain: 15, beamwidth: 30, efficiency: 98, feedImpedance: 50 },
			helical: { gain: 12, beamwidth: 45, efficiency: 92, feedImpedance: 150 },
			yagi: { gain: 10, beamwidth: 50, efficiency: 85, feedImpedance: 50 },
		};

		setAntenna((prev) => ({ ...prev, type, ...presets[type] }));
	};

	return (
		<div className="w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-cyan-50 min-h-screen">
			<div className="bg-white rounded-xl shadow-lg p-6 mb-6">
				<div className="flex items-center gap-3 mb-6">
					<div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
					<h1 className="text-2xl font-bold text-gray-800">
						Antenna Radiation Pattern Analyzer
					</h1>
					<div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
						RF & Microwave Engineering Tool
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Visualization */}
					<div className="lg:col-span-2">
						<div className="bg-gray-50 rounded-lg p-4 mb-4">
							<div className="flex gap-2 mb-4">
								<button
									onClick={() => setViewMode("2d")}
									className={`px-3 py-1 rounded text-sm ${viewMode === "2d" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
								>
									2D Polar
								</button>
								<button
									onClick={() => setViewMode("3d")}
									className={`px-3 py-1 rounded text-sm ${viewMode === "3d" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
								>
									3D Pattern
								</button>
								<button
									onClick={() => setShowAnimation(!showAnimation)}
									className={`px-3 py-1 rounded text-sm ${showAnimation ? "bg-green-500 text-white" : "bg-gray-200"}`}
								>
									{showAnimation ? "Stop" : "Animate"}
								</button>
							</div>

							{viewMode === "2d" && (
								<canvas
									ref={canvasRef}
									width={600}
									height={600}
									className="border border-gray-300 rounded-lg bg-white w-full max-w-[600px] mx-auto"
								/>
							)}

							{viewMode === "3d" && (
								<canvas
									ref={polar3DRef}
									width={600}
									height={400}
									className="border border-gray-300 rounded-lg bg-black w-full max-w-[600px] mx-auto"
								/>
							)}
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="bg-blue-50 rounded-lg p-4 text-center">
								<div className="text-2xl font-bold text-blue-600">
									{analysis?.mainLobe.gain.toFixed(1)} dBi
								</div>
								<div className="text-sm text-gray-600">Peak Gain</div>
							</div>

							<div className="bg-green-50 rounded-lg p-4 text-center">
								<div className="text-2xl font-bold text-green-600">
									{analysis?.beamwidth3dB.toFixed(0)}°
								</div>
								<div className="text-sm text-gray-600">3dB Beamwidth</div>
							</div>

							<div className="bg-purple-50 rounded-lg p-4 text-center">
								<div className="text-2xl font-bold text-purple-600">
									{analysis?.frontToBackRatio.toFixed(1)} dB
								</div>
								<div className="text-sm text-gray-600">F/B Ratio</div>
							</div>
						</div>
					</div>

					{/* Controls */}
					<div className="space-y-4">
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Antenna Configuration
							</h3>

							<div className="space-y-3">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Antenna Type
									</label>
									<select
										value={antenna.type}
										onChange={(e) =>
											updateAntennaType(
												e.target.value as AntennaParameters["type"],
											)
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									>
										<option value="dipole">Half-Wave Dipole</option>
										<option value="monopole">Quarter-Wave Monopole</option>
										<option value="patch">Microstrip Patch</option>
										<option value="horn">Horn Antenna</option>
										<option value="helical">Helical Antenna</option>
										<option value="yagi">Yagi-Uda Array</option>
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Frequency: {antenna.frequency.toFixed(2)} GHz
									</label>
									<input
										type="range"
										min="0.1"
										max="10"
										step="0.1"
										value={antenna.frequency}
										onChange={(e) =>
											setAntenna((prev) => ({
												...prev,
												frequency: Number.parseFloat(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Length: {antenna.length.toFixed(2)} λ
									</label>
									<input
										type="range"
										min="0.1"
										max="2"
										step="0.1"
										value={antenna.length}
										onChange={(e) =>
											setAntenna((prev) => ({
												...prev,
												length: Number.parseFloat(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Feed Impedance: {antenna.feedImpedance} Ω
									</label>
									<input
										type="range"
										min="25"
										max="300"
										step="5"
										value={antenna.feedImpedance}
										onChange={(e) =>
											setAntenna((prev) => ({
												...prev,
												feedImpedance: Number.parseInt(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>
							</div>
						</div>

						{analysis && (
							<div className="bg-gray-50 rounded-lg p-4">
								<h3 className="text-lg font-semibold text-gray-800 mb-3">
									Pattern Analysis
								</h3>

								<div className="space-y-3 text-sm">
									<div className="flex justify-between">
										<span>Directivity:</span>
										<span className="font-mono">
											{analysis.directivity.toFixed(2)} dBi
										</span>
									</div>

									<div className="flex justify-between">
										<span>Efficiency:</span>
										<span className="font-mono">{antenna.efficiency}%</span>
									</div>

									<div className="flex justify-between">
										<span>VSWR:</span>
										<span className="font-mono">
											{analysis.vswr.toFixed(2)}:1
										</span>
									</div>

									<div className="flex justify-between">
										<span>Side Lobes:</span>
										<span className="font-mono">
											{analysis.sideLobes.length} detected
										</span>
									</div>

									<div className="flex justify-between">
										<span>10dB Beamwidth:</span>
										<span className="font-mono">
											{analysis.beamwidth10dB.toFixed(0)}°
										</span>
									</div>

									<div className="flex justify-between">
										<span>Polarization:</span>
										<span className="font-mono capitalize">
											{antenna.polarization}
										</span>
									</div>
								</div>
							</div>
						)}

						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Display Options
							</h3>

							<div className="space-y-2">
								<label className="flex items-center">
									<input
										type="radio"
										name="plane"
										checked={selectedPlane === "E"}
										onChange={() => setSelectedPlane("E")}
										className="mr-2"
									/>
									E-Plane (Elevation)
								</label>
								<label className="flex items-center">
									<input
										type="radio"
										name="plane"
										checked={selectedPlane === "H"}
										onChange={() => setSelectedPlane("H")}
										className="mr-2"
									/>
									H-Plane (Azimuth)
								</label>
								<label className="flex items-center">
									<input
										type="radio"
										name="plane"
										checked={selectedPlane === "both"}
										onChange={() => setSelectedPlane("both")}
										className="mr-2"
									/>
									Both Planes
								</label>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-6 bg-blue-50 rounded-lg p-4">
					<h3 className="text-lg font-semibold text-blue-800 mb-2">
						RF Engineering Applications
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
						<div>
							<strong>Design & Optimization:</strong>
							<ul className="mt-1 space-y-1">
								<li>• Antenna pattern synthesis</li>
								<li>• Coverage area prediction</li>
								<li>• Interference analysis</li>
								<li>• Beam steering systems</li>
							</ul>
						</div>
						<div>
							<strong>Performance Analysis:</strong>
							<ul className="mt-1 space-y-1">
								<li>• Gain and directivity calculations</li>
								<li>• VSWR and impedance matching</li>
								<li>• Side lobe level optimization</li>
								<li>• Cross-polarization analysis</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
