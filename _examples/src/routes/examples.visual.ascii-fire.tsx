import { createFileRoute } from "@tanstack/react-router";
import { clamp, noise } from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/visual/ascii-fire")({
	component: ASCIIFireExample,
});

function ASCIIFireExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>(0);
	const fireBufferRef = useRef<number[][]>([]);
	const [isPlaying, setIsPlaying] = useState(true);
	const [windStrength, setWindStrength] = useState(0.1);
	const [fireIntensity, setFireIntensity] = useState(1.2);
	const [coolingRate, setCoolingRate] = useState(0.008);
	const [fireStyle, setFireStyle] = useState("flames");
	const [showTemperature, setShowTemperature] = useState(false);
	const [sparkleEffect, setSparkleEffect] = useState(true);
	const [fireHeight, setFireHeight] = useState(0.95);
	const [turbulence, setTurbulence] = useState(0.4);
	const [colorScheme, setColorScheme] = useState("inferno");
	const [particleCount, setParticleCount] = useState(150);
	const particlesRef = useRef<
		Array<{
			x: number;
			y: number;
			vx: number;
			vy: number;
			life: number;
			char: string;
		}>
	>([]);
	const [enableParticles, setEnableParticles] = useState(true);

	const fireChars = {
		classic: [" ", ".", ":", ";", "!", "*", "#", "$", "@"],
		blocks: [" ", "░", "▒", "▓", "█", "█", "█", "█", "█"],
		flames: [" ", ".", "°", "o", "O", "∩", "⌒", "⨀", "█"],
		ascii: [" ", ".", "-", "~", "^", "*", "%", "#", "@"],
		organic: [" ", "⋅", "∘", "●", "◉", "⬢", "⬡", "◆", "█"],
		technical: [" ", "▫", "▪", "▬", "■", "▲", "▼", "◆", "█"],
		mystical: [" ", "·", "∗", "✦", "✧", "✩", "✪", "✯", "★"],
	};

	const colorPalettes = {
		classic: [
			"#000000",
			"#440000",
			"#880000",
			"#CC0000",
			"#FF0000",
			"#FF4400",
			"#FF8800",
			"#FFCC00",
			"#FFFFFF",
		],
		blue: [
			"#000011",
			"#000044",
			"#000088",
			"#0000CC",
			"#0044FF",
			"#4488FF",
			"#88CCFF",
			"#CCFFFF",
			"#FFFFFF",
		],
		purple: [
			"#110011",
			"#440044",
			"#880088",
			"#CC00CC",
			"#FF00FF",
			"#FF44FF",
			"#FF88FF",
			"#FFCCFF",
			"#FFFFFF",
		],
		green: [
			"#001100",
			"#004400",
			"#008800",
			"#00CC00",
			"#00FF00",
			"#44FF44",
			"#88FF88",
			"#CCFFCC",
			"#FFFFFF",
		],
		inferno: [
			"#000000",
			"#1a0000",
			"#4d0000",
			"#800000",
			"#cc0000",
			"#ff3300",
			"#ff6600",
			"#ff9900",
			"#ffcc00",
		],
		plasma: [
			"#0d0887",
			"#46039f",
			"#7201a8",
			"#9c179e",
			"#bd3786",
			"#d8576b",
			"#ed7953",
			"#fb9f3a",
			"#fdca26",
		],
		arctic: [
			"#000033",
			"#000066",
			"#003399",
			"#0066cc",
			"#3399ff",
			"#66ccff",
			"#99ddff",
			"#cceeFF",
			"#ffffff",
		],
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		let cols = 0;
		let rows = 0;
		const cellSize = 20;

		const resizeCanvas = () => {
			// Get computed styles to ensure we have the actual rendered dimensions
			const computedStyle = window.getComputedStyle(canvas);
			const computedWidth = Number.parseInt(computedStyle.width);
			const computedHeight = Number.parseInt(computedStyle.height);

			console.log("ASCII Fire: resizeCanvas called", {
				offsetWidth: canvas.offsetWidth,
				offsetHeight: canvas.offsetHeight,
				computedWidth,
				computedHeight,
				clientWidth: canvas.clientWidth,
				clientHeight: canvas.clientHeight,
			});

			// Use computed dimensions if offset dimensions are 0
			const effectiveWidth =
				canvas.offsetWidth > 0 ? canvas.offsetWidth : computedWidth;
			const effectiveHeight =
				canvas.offsetHeight > 0 ? canvas.offsetHeight : computedHeight;

			canvas.width = effectiveWidth;
			canvas.height = effectiveHeight;
			cols = Math.floor(canvas.width / cellSize);
			rows = Math.floor(canvas.height / cellSize);

			console.log("ASCII Fire: Canvas sizing result", {
				effectiveWidth,
				effectiveHeight,
				cols,
				rows,
				cellSize,
			});

			// Add bounds checking to prevent crash when canvas has no dimensions
			if (cols <= 0 || rows <= 0) {
				console.warn(
					"ASCII Fire: Canvas dimensions invalid, skipping initialization",
					{
						cols,
						rows,
						width: canvas.width,
						height: canvas.height,
						offsetWidth: canvas.offsetWidth,
						offsetHeight: canvas.offsetHeight,
						computedWidth,
						computedHeight,
					},
				);
				return;
			}

			// Initialize fire buffer
			fireBufferRef.current = Array(rows)
				.fill(null)
				.map(() => Array(cols).fill(0));

			// Set bottom row to maximum heat (now safe with bounds checking)
			for (let x = 0; x < cols; x++) {
				fireBufferRef.current[rows - 1][x] = 8;
			}

			console.log("ASCII Fire: Fire buffer initialized", {
				rows,
				cols,
				bottomRowSample: fireBufferRef.current[rows - 1].slice(0, 5),
			});

			// Initialize particles
			particlesRef.current = [];
			for (let i = 0; i < particleCount; i++) {
				particlesRef.current.push(createParticle(cols, rows));
			}
		};

		const createParticle = (cols: number, rows: number) => ({
			x: Math.random() * cols,
			y: rows - 1,
			vx: (Math.random() - 0.5) * 2 * turbulence,
			vy: -Math.random() * 3 - 1,
			life: Math.random() * 60 + 30,
			char: ["*", "·", "°", "⋅", "✧"][Math.floor(Math.random() * 5)],
		});

		const updateParticles = (cols: number, rows: number) => {
			if (!enableParticles) return;

			const particles = particlesRef.current;

			for (let i = particles.length - 1; i >= 0; i--) {
				const particle = particles[i];

				// Update position
				particle.x += particle.vx;
				particle.y += particle.vy;
				particle.vy += 0.1; // gravity
				particle.life--;

				// Remove dead particles
				if (
					particle.life <= 0 ||
					particle.y < 0 ||
					particle.x < 0 ||
					particle.x >= cols
				) {
					particles.splice(i, 1);
				}
			}

			// Add new particles with enhanced frequency
			while (particles.length < particleCount && Math.random() < 0.5) {
				particles.push(createParticle(cols, rows));
			}
		};

		const updateFire = (time: number) => {
			const buffer = fireBufferRef.current;

			// Update fire simulation
			for (let y = 1; y < rows - 1; y++) {
				for (let x = 1; x < cols - 1; x++) {
					// Get neighboring heat values
					const below = buffer[y + 1][x] || 0;
					const left = buffer[y][x - 1] || 0;
					const right = buffer[y][x + 1] || 0;
					const above = buffer[y - 1][x] || 0;

					// Wind effect using noise with turbulence
					const turbulenceX =
						turbulence * noise.noise2D(x * 0.05, time * 0.002);
					const turbulenceY =
						turbulence * noise.noise2D(x * 0.03, time * 0.003);
					const windOffset = Math.floor(
						windStrength * 3 * noise.noise2D(x * 0.1, time * 0.001) +
							turbulenceX,
					);
					const windX = clamp(x + windOffset, 0, cols - 1);

					// Heat diffusion with wind and turbulence
					let newHeat = (below + left + right + above + buffer[y][windX]) / 5;

					// Apply cooling with height-based variation
					const heightFactor = 1 - (y / rows) * fireHeight;
					const cooling = coolingRate * (2 + Math.random() * 1) * heightFactor;
					newHeat -= cooling;

					// Add enhanced turbulence and flickering for more dynamic effects
					newHeat += (Math.random() - 0.5) * 0.8 + turbulenceY * 0.5;

					// Boost heat values slightly to maintain visibility
					newHeat = Math.max(newHeat * 1.05, 0);

					// Clamp heat value
					buffer[y][x] = clamp(newHeat, 0, 8);
				}
			}

			// Maintain fire source at bottom with enhanced intensity variation
			for (let x = 0; x < cols; x++) {
				const intensity =
					fireIntensity * (0.9 + 0.3 * noise.noise2D(x * 0.1, time * 0.003));
				buffer[rows - 1][x] = clamp(8 * intensity, 6, 8); // Ensure minimum high intensity

				// Also boost the row above for better visual continuity
				if (rows > 1) {
					const upperIntensity =
						fireIntensity * (0.7 + 0.3 * noise.noise2D(x * 0.08, time * 0.004));
					buffer[rows - 2][x] = Math.max(
						buffer[rows - 2][x],
						clamp(6 * upperIntensity, 4, 8),
					);
				}
			}

			// Update particles
			updateParticles(cols, rows);
		};

		const render = () => {
			const buffer = fireBufferRef.current;
			if (!buffer || buffer.length === 0) {
				console.warn("ASCII Fire: No fire buffer to render");
				return;
			}

			const chars = fireChars[fireStyle as keyof typeof fireChars];
			const colors = colorPalettes[colorScheme as keyof typeof colorPalettes];

			// Clear canvas
			ctx.fillStyle = "#000000";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Sample heat values for debugging
			const bottomRowSample = buffer[rows - 1]
				? buffer[rows - 1].slice(0, 10)
				: [];
			const middleRowSample = buffer[Math.floor(rows / 2)]
				? buffer[Math.floor(rows / 2)].slice(0, 10)
				: [];

			console.log("ASCII Fire: Rendering frame", {
				rows,
				cols,
				bufferSize: buffer.length,
				bottomRowSample,
				middleRowSample,
			});

			ctx.font = `${cellSize}px "Courier New", monospace`;
			ctx.textBaseline = "top";

			let visibleCharsDrawn = 0;
			for (let y = 0; y < rows; y++) {
				for (let x = 0; x < cols; x++) {
					const heat = buffer[y][x];
					const charIndex = Math.floor(heat);
					const char = chars[clamp(charIndex, 0, chars.length - 1)];
					const color = colors[clamp(charIndex, 0, colors.length - 1)];

					// Force visible fire at bottom rows with enhanced intensity
					if (y >= rows - 6) {
						const forceChar = chars[Math.min(8, chars.length - 1)];
						const forceColor = colors[Math.min(8, colors.length - 1)];
						ctx.fillStyle = forceColor;
						ctx.fillText(forceChar, x * cellSize, y * cellSize);
						visibleCharsDrawn++;
					} else if (heat > 0.5 || char !== " ") {
						// Enhanced visibility: show flames even with lower heat values
						const enhancedHeat = Math.min(heat * 1.3, 8);
						const enhancedCharIndex = Math.floor(enhancedHeat);
						const enhancedChar =
							chars[clamp(enhancedCharIndex, 0, chars.length - 1)];
						const enhancedColor =
							colors[clamp(enhancedCharIndex, 0, colors.length - 1)];

						ctx.fillStyle = enhancedColor;
						ctx.fillText(enhancedChar, x * cellSize, y * cellSize);
						visibleCharsDrawn++;
					}
				}
			}

			// Debug log every 60 frames
			if (Math.random() < 0.017) {
				console.log("ASCII Fire: Visible chars drawn:", visibleCharsDrawn);
			}

			// Render enhanced particles with glow effect
			if (enableParticles) {
				const particles = particlesRef.current;
				particles.forEach((particle) => {
					const alpha = Math.max(0, particle.life / 60);
					const size = Math.max(6, cellSize * 0.8);

					ctx.font = `${size}px "Courier New", monospace`;

					const px = particle.x * cellSize;
					const py = particle.y * cellSize;

					if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
						// Add glow effect with multiple layers
						ctx.shadowBlur = 10;
						ctx.shadowColor = `rgba(255, 150, 50, ${alpha * 0.8})`;
						ctx.fillStyle = `rgba(255, 220, 120, ${alpha})`;
						ctx.fillText(particle.char, px, py);

						// Reset shadow
						ctx.shadowBlur = 0;
					}
				});

				// Reset font
				ctx.font = `${cellSize}px "Courier New", monospace`;
			}
		};

		const animate = (time: number) => {
			if (!isPlaying) {
				console.log("ASCII Fire: Animation stopped");
				return;
			}

			updateFire(time);
			render();

			animationRef.current = requestAnimationFrame(animate);
		};

		// More robust canvas initialization that waits for CSS layout
		const initCanvas = () => {
			const computedStyle = window.getComputedStyle(canvas);
			const computedWidth = Number.parseInt(computedStyle.width);
			const computedHeight = Number.parseInt(computedStyle.height);

			console.log("ASCII Fire: initCanvas attempt", {
				offsetWidth: canvas.offsetWidth,
				offsetHeight: canvas.offsetHeight,
				computedWidth,
				computedHeight,
				clientWidth: canvas.clientWidth,
				clientHeight: canvas.clientHeight,
			});

			// Check if we have valid dimensions from either offset or computed styles
			const hasValidWidth = canvas.offsetWidth > 0 || computedWidth > 0;
			const hasValidHeight = canvas.offsetHeight > 0 || computedHeight > 0;

			if (hasValidWidth && hasValidHeight) {
				console.log(
					"ASCII Fire: Canvas dimensions valid, calling resizeCanvas",
				);
				resizeCanvas();
			} else {
				console.log("ASCII Fire: Canvas not ready, retrying in 100ms");
				// Retry initialization if canvas isn't ready
				setTimeout(initCanvas, 100);
			}
		};

		initCanvas();
		window.addEventListener("resize", resizeCanvas);

		console.log("ASCII Fire: isPlaying =", isPlaying);
		if (isPlaying) {
			console.log("ASCII Fire: Starting animation");
			animationRef.current = requestAnimationFrame(animate);
		} else {
			console.log("ASCII Fire: Animation not started - isPlaying is false");
		}

		return () => {
			window.removeEventListener("resize", resizeCanvas);
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [
		isPlaying,
		windStrength,
		fireIntensity,
		coolingRate,
		fireStyle,
		showTemperature,
		sparkleEffect,
		fireHeight,
		turbulence,
		colorScheme,
		particleCount,
		enableParticles,
	]);

	const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const x = Math.floor((e.clientX - rect.left) / 8);
		const y = Math.floor((e.clientY - rect.top) / 8);

		// Add heat at click position
		const buffer = fireBufferRef.current;
		if (y >= 0 && y < buffer.length && x >= 0 && x < buffer[0].length) {
			for (let dy = -2; dy <= 2; dy++) {
				for (let dx = -2; dx <= 2; dx++) {
					const ny = y + dy;
					const nx = x + dx;
					if (
						ny >= 0 &&
						ny < buffer.length &&
						nx >= 0 &&
						nx < buffer[0].length
					) {
						const distance = Math.sqrt(dx * dx + dy * dy);
						const heat = Math.max(0, 8 - distance * 2);
						buffer[ny][nx] = Math.max(buffer[ny][nx], heat);
					}
				}
			}
		}
	};

	const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (e.buttons === 1) {
			// Left mouse button held
			handleCanvasClick(e);
		}
	};

	const resetFire = () => {
		const buffer = fireBufferRef.current;
		for (let y = 0; y < buffer.length - 1; y++) {
			for (let x = 0; x < buffer[0].length; x++) {
				buffer[y][x] = 0;
			}
		}
	};

	return (
		<div className="flex flex-col h-screen bg-black">
			<div className="flex-shrink-0 bg-gray-900 p-4 border-b border-gray-700">
				<h1 className="text-2xl font-bold text-orange-400 mb-4">
					🔥 ASCII Fire Simulation
				</h1>

				<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-sm mb-4">
					<div className="flex flex-col">
						<label className="text-orange-300 mb-2">Animation</label>
						<button
							onClick={() => setIsPlaying(!isPlaying)}
							className={`px-3 py-2 rounded font-medium transition-colors ${
								isPlaying
									? "bg-red-600 hover:bg-red-700 text-white"
									: "bg-green-600 hover:bg-green-700 text-white"
							}`}
						>
							{isPlaying ? "Pause" : "Play"}
						</button>
					</div>

					<div className="flex flex-col">
						<label className="text-orange-300 mb-2">
							Intensity: {Math.round(fireIntensity * 100)}%
						</label>
						<input
							type="range"
							min="0.1"
							max="1.5"
							step="0.05"
							value={fireIntensity}
							onChange={(e) =>
								setFireIntensity(Number.parseFloat(e.target.value))
							}
							className="w-full"
						/>
					</div>

					<div className="flex flex-col">
						<label className="text-orange-300 mb-2">
							Wind: {windStrength.toFixed(2)}
						</label>
						<input
							type="range"
							min="0"
							max="0.5"
							step="0.01"
							value={windStrength}
							onChange={(e) =>
								setWindStrength(Number.parseFloat(e.target.value))
							}
							className="w-full"
						/>
					</div>

					<div className="flex flex-col">
						<label className="text-orange-300 mb-2">
							Cooling: {coolingRate.toFixed(3)}
						</label>
						<input
							type="range"
							min="0.005"
							max="0.05"
							step="0.005"
							value={coolingRate}
							onChange={(e) =>
								setCoolingRate(Number.parseFloat(e.target.value))
							}
							className="w-full"
						/>
					</div>

					<div className="flex flex-col">
						<label className="text-orange-300 mb-2">Style</label>
						<select
							value={fireStyle}
							onChange={(e) => setFireStyle(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-orange-300 rounded border border-gray-600"
						>
							<option value="classic">Classic ASCII</option>
							<option value="blocks">Block Characters</option>
							<option value="flames">Flame Symbols</option>
							<option value="ascii">Symbols</option>
							<option value="organic">Organic</option>
							<option value="technical">Technical</option>
							<option value="mystical">Mystical</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-orange-300 mb-2">Color Scheme</label>
						<select
							value={colorScheme}
							onChange={(e) => setColorScheme(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-orange-300 rounded border border-gray-600"
						>
							<option value="classic">Classic Fire</option>
							<option value="blue">Blue Flame</option>
							<option value="purple">Purple Flame</option>
							<option value="green">Green Flame</option>
							<option value="inferno">Inferno</option>
							<option value="plasma">Plasma</option>
							<option value="arctic">Arctic</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-orange-300 mb-2">
							Fire Height: {Math.round(fireHeight * 100)}%
						</label>
						<input
							type="range"
							min="0.3"
							max="1"
							step="0.05"
							value={fireHeight}
							onChange={(e) => setFireHeight(Number.parseFloat(e.target.value))}
							className="w-full"
						/>
					</div>

					<div className="flex flex-col">
						<label className="text-orange-300 mb-2">
							Turbulence: {turbulence.toFixed(2)}
						</label>
						<input
							type="range"
							min="0"
							max="1"
							step="0.05"
							value={turbulence}
							onChange={(e) => setTurbulence(Number.parseFloat(e.target.value))}
							className="w-full"
						/>
					</div>

					<div className="flex flex-col">
						<label className="text-orange-300 mb-2">
							Particles: {particleCount}
						</label>
						<input
							type="range"
							min="0"
							max="200"
							step="10"
							value={particleCount}
							onChange={(e) =>
								setParticleCount(Number.parseInt(e.target.value))
							}
							className="w-full"
						/>
					</div>

					<div className="flex flex-col gap-2">
						<button
							onClick={resetFire}
							className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
						>
							Reset
						</button>
						<label className="flex items-center text-orange-300 text-xs">
							<input
								type="checkbox"
								checked={showTemperature}
								onChange={(e) => setShowTemperature(e.target.checked)}
								className="mr-1"
							/>
							Temperature
						</label>
						<label className="flex items-center text-orange-300 text-xs">
							<input
								type="checkbox"
								checked={sparkleEffect}
								onChange={(e) => setSparkleEffect(e.target.checked)}
								className="mr-1"
							/>
							Sparkles
						</label>
						<label className="flex items-center text-orange-300 text-xs">
							<input
								type="checkbox"
								checked={enableParticles}
								onChange={(e) => setEnableParticles(e.target.checked)}
								className="mr-1"
							/>
							Particles
						</label>
					</div>
				</div>

				<div className="text-orange-400 text-sm">
					<p>
						💡 <strong>Click and drag</strong> to add heat sources to the fire!
					</p>
					<p>
						🎨 <strong>Choose styles and colors</strong> for different flame
						effects!
					</p>
					<p>
						✨ <strong>Enable particles and sparkles</strong> for enhanced
						visual effects!
					</p>
					<p>
						Advanced fire simulation with heat diffusion, wind effects,
						turbulence, and particle systems
					</p>
				</div>
			</div>

			<div className="flex-1 relative">
				<canvas
					ref={canvasRef}
					onClick={handleCanvasClick}
					onMouseMove={handleMouseMove}
					className="absolute inset-0 w-full h-full cursor-crosshair"
					style={{
						background: "#000000",
						maxWidth: "100%",
						height: "auto",
					}}
				/>
			</div>
		</div>
	);
}
