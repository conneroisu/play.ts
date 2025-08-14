import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
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
	vec2Distance,
} from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/visual/wave-interference")({
	component: WaveInterferenceExample,
});

interface WaveSource {
	x: number;
	y: number;
	frequency: number;
	amplitude: number;
	phase: number;
	color: { h: number; s: number; l: number };
	id: number;
	active: boolean;
}

interface WaveSettings {
	waveSpeed: number;
	damping: number;
	resolution: number;
	timeScale: number;
	showWaves: boolean;
	showSources: boolean;
	colorMode: "amplitude" | "phase" | "rainbow";
}

function WaveInterferenceExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const timeRef = useRef<number>(0);
	const isAnimatingRef = useRef<boolean>(false);

	const [sources, setSources] = useState<WaveSource[]>([]);
	const [isAnimating, setIsAnimating] = useState(false);
	const [settings, setSettings] = useState<WaveSettings>({
		waveSpeed: 50,
		damping: 0.02,
		resolution: 4,
		timeScale: 1,
		showWaves: true,
		showSources: true,
		colorMode: "amplitude",
	});
	const [presetPattern, setPresetPattern] = useState<
		"two-source" | "three-source" | "interference" | "standing" | "custom"
	>("two-source");

	const createWaveSource = (
		x: number,
		y: number,
		frequency = 1.0,
	): WaveSource => ({
		x,
		y,
		frequency,
		amplitude: 1.0,
		phase: 0,
		color: hsl(randomFloat(0, 360), 70, 60),
		id: Date.now() + Math.random(),
		active: true,
	});

	const initializePreset = (pattern: string) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		let newSources: WaveSource[] = [];

		switch (pattern) {
			case "two-source":
				newSources = [
					createWaveSource(centerX - 100, centerY, 1.0),
					createWaveSource(centerX + 100, centerY, 1.0),
				];
				break;
			case "three-source":
				newSources = [
					createWaveSource(centerX, centerY - 80, 1.0),
					createWaveSource(centerX - 70, centerY + 40, 1.0),
					createWaveSource(centerX + 70, centerY + 40, 1.0),
				];
				break;
			case "interference":
				newSources = [
					createWaveSource(centerX - 120, centerY, 0.8),
					createWaveSource(centerX + 120, centerY, 1.2),
				];
				break;
			case "standing":
				newSources = [
					createWaveSource(50, centerY, 1.0),
					{ ...createWaveSource(canvas.width - 50, centerY, 1.0), phase: PI },
				];
				break;
		}

		setSources(newSources);
	};

	const calculateWaveAmplitude = (
		x: number,
		y: number,
		time: number,
	): number => {
		let totalAmplitude = 0;

		for (const source of sources) {
			if (!source.active) continue;

			const distance = vec2Distance({ x, y }, { x: source.x, y: source.y });

			// Wave equation: A * sin(k*r - ω*t + φ)
			const waveNumber = (TWO_PI * source.frequency) / settings.waveSpeed;
			const angularFrequency = TWO_PI * source.frequency;

			// Calculate phase with distance and time
			const phaseShift =
				waveNumber * distance -
				angularFrequency * time * settings.timeScale +
				source.phase;

			// Apply damping with distance
			const dampingFactor = Math.exp(-distance * settings.damping);

			// Calculate wave amplitude
			const amplitude = source.amplitude * dampingFactor * sin(phaseShift);
			totalAmplitude += amplitude;
		}

		return totalAmplitude;
	};

	const calculateWavePhase = (x: number, y: number, time: number): number => {
		let totalPhase = 0;
		let sourceCount = 0;

		for (const source of sources) {
			if (!source.active) continue;

			const distance = vec2Distance({ x, y }, { x: source.x, y: source.y });
			const waveNumber = (TWO_PI * source.frequency) / settings.waveSpeed;
			const angularFrequency = TWO_PI * source.frequency;
			const phaseShift =
				waveNumber * distance -
				angularFrequency * time * settings.timeScale +
				source.phase;

			totalPhase += phaseShift;
			sourceCount++;
		}

		return sourceCount > 0 ? totalPhase / sourceCount : 0;
	};

	const getColorFromWave = (
		amplitude: number,
		phase: number,
		maxAmplitude: number,
	): { r: number; g: number; b: number } => {
		switch (settings.colorMode) {
			case "amplitude": {
				const normalizedAmp = clamp(amplitude / maxAmplitude, -1, 1);
				const intensity = Math.abs(normalizedAmp);

				if (normalizedAmp > 0) {
					// Positive amplitude - red to yellow
					return {
						r: Math.floor(255 * intensity),
						g: Math.floor(255 * intensity * 0.7),
						b: 0,
					};
				} else {
					// Negative amplitude - blue to cyan
					return {
						r: 0,
						g: Math.floor(255 * intensity * 0.5),
						b: Math.floor(255 * intensity),
					};
				}
			}
			case "phase": {
				const normalizedPhase = ((phase % TWO_PI) + TWO_PI) % TWO_PI;
				const hue = (normalizedPhase / TWO_PI) * 360;
				const color = hsl(hue, 80, 50);
				const rgbColor = hslToRgb(color);
				return { r: rgbColor.r, g: rgbColor.g, b: rgbColor.b };
			}
			case "rainbow": {
				const normalizedAmp = clamp(
					(amplitude + maxAmplitude) / (2 * maxAmplitude),
					0,
					1,
				);
				const hue = normalizedAmp * 300; // Blue to red spectrum
				const color = hsl(hue, 90, 50);
				const rgbColor = hslToRgb(color);
				return { r: rgbColor.r, g: rgbColor.g, b: rgbColor.b };
			}
			default:
				return { r: 0, g: 0, b: 0 };
		}
	};

	const render = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		const { width, height } = canvas;
		const time = timeRef.current;

		if (settings.showWaves) {
			const imageData = ctx.createImageData(width, height);
			const data = imageData.data;

			let maxAmplitude = 0;
			const amplitudes: number[][] = [];

			// First pass: calculate all amplitudes to find maximum
			for (let y = 0; y < height; y += settings.resolution) {
				amplitudes[y] = [];
				for (let x = 0; x < width; x += settings.resolution) {
					const amplitude = calculateWaveAmplitude(x, y, time);
					amplitudes[y][x] = amplitude;
					maxAmplitude = Math.max(maxAmplitude, Math.abs(amplitude));
				}
			}

			// Second pass: render pixels
			for (let y = 0; y < height; y += settings.resolution) {
				for (let x = 0; x < width; x += settings.resolution) {
					const amplitude = amplitudes[y][x] || 0;
					const phase = calculateWavePhase(x, y, time);
					const color = getColorFromWave(amplitude, phase, maxAmplitude);

					// Fill resolution x resolution block
					for (let dy = 0; dy < settings.resolution && y + dy < height; dy++) {
						for (let dx = 0; dx < settings.resolution && x + dx < width; dx++) {
							const pixelIndex = ((y + dy) * width + (x + dx)) * 4;
							data[pixelIndex] = color.r;
							data[pixelIndex + 1] = color.g;
							data[pixelIndex + 2] = color.b;
							data[pixelIndex + 3] = 255;
						}
					}
				}
			}

			ctx.putImageData(imageData, 0, 0);
		} else {
			// Clear canvas if not showing waves
			ctx.fillStyle = "#000000";
			ctx.fillRect(0, 0, width, height);
		}

		// Draw wave sources
		if (settings.showSources) {
			sources.forEach((source) => {
				const { x, y } = source;

				// Source circle with pulsing effect
				const pulseSize =
					5 +
					3 *
						sin(
							time * TWO_PI * source.frequency * settings.timeScale +
								source.phase,
						);

				// Outer glow
				const gradient = ctx.createRadialGradient(
					x,
					y,
					0,
					x,
					y,
					pulseSize + 10,
				);
				gradient.addColorStop(
					0,
					`hsla(${source.color.h}, ${source.color.s}%, ${source.color.l}%, 0.8)`,
				);
				gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

				ctx.fillStyle = gradient;
				ctx.beginPath();
				ctx.arc(x, y, pulseSize + 10, 0, TWO_PI);
				ctx.fill();

				// Inner circle
				ctx.fillStyle = source.active ? "#ffffff" : "#666666";
				ctx.beginPath();
				ctx.arc(x, y, pulseSize, 0, TWO_PI);
				ctx.fill();

				// Source outline
				ctx.strokeStyle = source.active ? "#000000" : "#444444";
				ctx.lineWidth = 2;
				ctx.stroke();

				// Frequency indicator
				ctx.fillStyle = "#000000";
				ctx.font = "12px Arial";
				ctx.textAlign = "center";
				ctx.fillText(`f=${source.frequency.toFixed(1)}`, x, y - pulseSize - 15);
			});
		}

		// Draw interference patterns info
		if (sources.length > 1) {
			ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
			ctx.fillRect(10, 10, 200, 60);
			ctx.fillStyle = "#ffffff";
			ctx.font = "14px Arial";
			ctx.textAlign = "left";
			ctx.fillText(
				`Sources: ${sources.filter((s) => s.active).length}`,
				20,
				30,
			);
			ctx.fillText(`Time: ${time.toFixed(1)}s`, 20, 50);
			ctx.fillText(`Speed: ${settings.waveSpeed}px/s`, 20, 70);
		}
	};

	const animate = () => {
		if (!isAnimatingRef.current) return;

		timeRef.current += 0.02;
		render();
		animationRef.current = requestAnimationFrame(animate);
	};

	const startAnimation = () => {
		isAnimatingRef.current = true;
		setIsAnimating(true);
		animationRef.current = requestAnimationFrame(animate);
	};

	const stopAnimation = () => {
		isAnimatingRef.current = false;
		setIsAnimating(false);
		if (animationRef.current) {
			cancelAnimationFrame(animationRef.current);
		}
	};

	const resetTime = () => {
		timeRef.current = 0;
		render();
	};

	const addSource = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const newSource = createWaveSource(x, y, 1.0);
		setSources((prev) => [...prev, newSource]);
		setPresetPattern("custom");
	};

	const toggleSource = (sourceId: number) => {
		setSources((prev) =>
			prev.map((source) =>
				source.id === sourceId ? { ...source, active: !source.active } : source,
			),
		);
	};

	const updateSourceProperty = (
		sourceId: number,
		property: keyof WaveSource,
		value: any,
	) => {
		setSources((prev) =>
			prev.map((source) =>
				source.id === sourceId ? { ...source, [property]: value } : source,
			),
		);
	};

	const clearSources = () => {
		setSources([]);
		setPresetPattern("custom");
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.width = 800;
		canvas.height = 600;

		// Initialize with two-source pattern
		initializePreset("two-source");
	}, []);

	useEffect(() => {
		if (presetPattern !== "custom") {
			initializePreset(presetPattern);
		}
	}, [presetPattern]);

	useEffect(() => {
		if (!isAnimating) render();
	}, [sources, settings]);

	// Cleanup animation on component unmount
	useEffect(() => {
		return () => {
			isAnimatingRef.current = false;
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, []);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Advanced Wave Physics Simulator
				</h1>
				<p className="text-gray-600 mb-4">
					Multi-source interference with real-time controls, preset patterns,
					and educational wave mechanics.
				</p>
				<div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
					<p className="text-teal-800">
						🌊 Watch waves interfere constructively and destructively, click to
						add sources
					</p>
				</div>
			</div>

			<Card className="mb-6">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						Animation Controls
						{isAnimating && <Badge variant="secondary">Running</Badge>}
					</CardTitle>
					<CardDescription>
						Control wave animation and time progression
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-3">
						<Button
							onClick={startAnimation}
							disabled={isAnimating}
							variant="default"
						>
							Start Animation
						</Button>
						<Button
							onClick={stopAnimation}
							disabled={!isAnimating}
							variant="destructive"
						>
							Stop Animation
						</Button>
						<Button onClick={resetTime} variant="outline">
							Reset Time
						</Button>
						<Button onClick={clearSources} variant="secondary">
							Clear Sources
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Wave Configuration</CardTitle>
					<CardDescription>
						Adjust pattern presets, visualization settings, and wave resolution
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						<div className="space-y-2">
							<label className="text-sm font-medium">Preset Pattern</label>
							<select
								value={presetPattern}
								onChange={(e) =>
									setPresetPattern(e.target.value as typeof presetPattern)
								}
								className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
							>
								<option value="two-source">Two Source</option>
								<option value="three-source">Three Source</option>
								<option value="interference">Different Frequencies</option>
								<option value="standing">Standing Wave</option>
								<option value="custom">Custom</option>
							</select>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">Color Mode</label>
							<select
								value={settings.colorMode}
								onChange={(e) =>
									setSettings((prev) => ({
										...prev,
										colorMode: e.target.value as typeof settings.colorMode,
									}))
								}
								className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
							>
								<option value="amplitude">Amplitude</option>
								<option value="phase">Phase</option>
								<option value="rainbow">Rainbow</option>
							</select>
						</div>

						<div className="space-y-3">
							<label className="text-sm font-medium">Display Options</label>
							<div className="space-y-2">
								<label className="flex items-center space-x-2">
									<input
										type="checkbox"
										checked={settings.showWaves}
										onChange={(e) =>
											setSettings((prev) => ({
												...prev,
												showWaves: e.target.checked,
											}))
										}
										className="rounded border-border text-primary focus:ring-ring focus:ring-2"
									/>
									<span className="text-sm">Show Waves</span>
								</label>
								<label className="flex items-center space-x-2">
									<input
										type="checkbox"
										checked={settings.showSources}
										onChange={(e) =>
											setSettings((prev) => ({
												...prev,
												showSources: e.target.checked,
											}))
										}
										className="rounded border-border text-primary focus:ring-ring focus:ring-2"
									/>
									<span className="text-sm">Show Sources</span>
								</label>
							</div>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">
								Resolution:{" "}
								<Badge variant="outline">{settings.resolution}</Badge>
							</label>
							<Slider
								value={[settings.resolution]}
								onValueChange={(value) =>
									setSettings((prev) => ({ ...prev, resolution: value[0] }))
								}
								min={1}
								max={8}
								step={1}
								className="w-full"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Physics Parameters</CardTitle>
					<CardDescription>
						Fine-tune wave physics behavior and simulation speed
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="space-y-2">
							<label className="text-sm font-medium flex items-center justify-between">
								Wave Speed
								<Badge variant="secondary">{settings.waveSpeed}</Badge>
							</label>
							<Slider
								value={[settings.waveSpeed]}
								onValueChange={(value) =>
									setSettings((prev) => ({ ...prev, waveSpeed: value[0] }))
								}
								min={10}
								max={200}
								step={1}
								className="w-full"
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium flex items-center justify-between">
								Damping
								<Badge variant="secondary">{settings.damping.toFixed(3)}</Badge>
							</label>
							<Slider
								value={[settings.damping]}
								onValueChange={(value) =>
									setSettings((prev) => ({ ...prev, damping: value[0] }))
								}
								min={0}
								max={0.1}
								step={0.001}
								className="w-full"
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium flex items-center justify-between">
								Time Scale
								<Badge variant="secondary">
									{settings.timeScale.toFixed(1)}
								</Badge>
							</label>
							<Slider
								value={[settings.timeScale]}
								onValueChange={(value) =>
									setSettings((prev) => ({ ...prev, timeScale: value[0] }))
								}
								min={0.1}
								max={3}
								step={0.1}
								className="w-full"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="mb-6">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						Wave Simulation Canvas
						<Badge variant="outline">{sources.length} Sources</Badge>
					</CardTitle>
					<CardDescription>
						Click anywhere on the canvas to add wave sources and watch
						interference patterns
					</CardDescription>
				</CardHeader>
				<CardContent>
					<canvas
						ref={canvasRef}
						className="border border-border rounded-lg bg-black cursor-crosshair w-full"
						style={{ maxWidth: "100%", height: "auto" }}
						onClick={addSource}
					/>
				</CardContent>
			</Card>

			{/* Source Controls */}
			{sources.length > 0 && (
				<Card className="mb-6">
					<CardHeader>
						<CardTitle>Wave Sources Configuration</CardTitle>
						<CardDescription>
							Adjust frequency, amplitude, and phase for each wave source
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-6">
							{sources.map((source, index) => (
								<Card key={source.id} className="bg-muted/50">
									<CardHeader className="pb-3">
										<div className="flex items-center justify-between">
											<CardTitle className="text-lg">
												Source {index + 1}
											</CardTitle>
											<div className="flex items-center gap-2">
												<Badge
													variant={source.active ? "default" : "secondary"}
													className={source.active ? "bg-green-500" : ""}
												>
													{source.active ? "Active" : "Inactive"}
												</Badge>
												<Button
													size="sm"
													variant="outline"
													onClick={() => toggleSource(source.id)}
												>
													Toggle
												</Button>
											</div>
										</div>
									</CardHeader>
									<CardContent className="pt-0">
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div className="space-y-2">
												<label className="text-sm font-medium flex items-center justify-between">
													Frequency
													<Badge variant="outline">
														{source.frequency.toFixed(1)} Hz
													</Badge>
												</label>
												<Slider
													value={[source.frequency]}
													onValueChange={(value) =>
														updateSourceProperty(
															source.id,
															"frequency",
															value[0],
														)
													}
													min={0.1}
													max={3}
													step={0.1}
													className="w-full"
												/>
											</div>

											<div className="space-y-2">
												<label className="text-sm font-medium flex items-center justify-between">
													Amplitude
													<Badge variant="outline">
														{source.amplitude.toFixed(1)}
													</Badge>
												</label>
												<Slider
													value={[source.amplitude]}
													onValueChange={(value) =>
														updateSourceProperty(
															source.id,
															"amplitude",
															value[0],
														)
													}
													min={0.1}
													max={2}
													step={0.1}
													className="w-full"
												/>
											</div>

											<div className="space-y-2">
												<label className="text-sm font-medium flex items-center justify-between">
													Phase
													<Badge variant="outline">
														{((source.phase * 180) / PI).toFixed(0)}°
													</Badge>
												</label>
												<Slider
													value={[source.phase]}
													onValueChange={(value) =>
														updateSourceProperty(source.id, "phase", value[0])
													}
													min={0}
													max={TWO_PI}
													step={PI / 12}
													className="w-full"
												/>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			<div className="grid md:grid-cols-2 gap-6">
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-yellow-800">
						Wave Interference
					</h3>
					<ul className="text-yellow-700 space-y-1">
						<li>
							• <strong>Constructive</strong>: Waves add when in phase
							(brighter)
						</li>
						<li>
							• <strong>Destructive</strong>: Waves cancel when out of phase
							(darker)
						</li>
						<li>
							• <strong>Standing Waves</strong>: Result from opposing wave
							sources
						</li>
						<li>
							• <strong>Superposition</strong>: Total wave is sum of individual
							waves
						</li>
					</ul>
				</div>

				<div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-teal-800">
						Interactive Features
					</h3>
					<ul className="text-teal-700 space-y-1">
						<li>
							• <strong>Multiple Sources</strong>: Add unlimited wave sources
						</li>
						<li>
							• <strong>Real-time Controls</strong>: Adjust frequency,
							amplitude, phase
						</li>
						<li>
							• <strong>Visual Modes</strong>: Amplitude, phase, and rainbow
							coloring
						</li>
						<li>
							• <strong>Performance</strong>: Adjustable resolution for smooth
							animation
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6">
				<Link
					to="/examples/visual"
					className="inline-block px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
				>
					← Back to Examples
				</Link>
			</div>
		</div>
	);
}
