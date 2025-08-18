import { lerp } from "play.ts";
import { useEffect, useRef, useState } from "react";

interface MatrixColumn {
	x: number;
	y: number;
	speed: number;
	chars: string[];
	length: number;
	leadChar: number;
	direction: number;
	glitchChance: number;
	colorOffset: number;
}

export default function AsciiMatrixRainExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>(0);
	const columnsRef = useRef<MatrixColumn[]>([]);
	const [isPlaying, setIsPlaying] = useState(true);
	const [speed, setSpeed] = useState(1);
	const [density, setDensity] = useState(0.8);
	const [trailLength, setTrailLength] = useState(20);
	const [colorScheme, setColorScheme] = useState("classic");
	const [fontSize, setFontSize] = useState(16);
	const [characterSet, setCharacterSet] = useState("japanese");
	const [fadeEffect, setFadeEffect] = useState(true);
	const [glitchEffect, setGlitchEffect] = useState(false);
	const [rainDirection, setRainDirection] = useState("down");
	const [interactiveMode, setInteractiveMode] = useState(true);
	const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

	const characterSets = {
		japanese:
			"アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789",
		binary: "01",
		hex: "0123456789ABCDEF",
		alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
		symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
		mixed:
			"アイウエオカキクケコサシスセソタチツテト0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*",
		cyrillic: "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ0123456789",
		greek: "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ0123456789",
	};

	const matrixChars = characterSets[characterSet as keyof typeof characterSets];

	const colorSchemes = {
		classic: { bg: "#000000", trail: "#00FF00", lead: "#FFFFFF" },
		blue: { bg: "#000011", trail: "#0088FF", lead: "#FFFFFF" },
		purple: { bg: "#100010", trail: "#8800FF", lead: "#FFFFFF" },
		amber: { bg: "#110800", trail: "#FFAA00", lead: "#FFFFFF" },
		red: { bg: "#110000", trail: "#FF4444", lead: "#FFFFFF" },
		cyan: { bg: "#001122", trail: "#00FFFF", lead: "#FFFFFF" },
		neon: { bg: "#000000", trail: "#FF00FF", lead: "#FFFF00" },
		terminal: { bg: "#001100", trail: "#33FF33", lead: "#AAFFAA" },
		ghost: { bg: "#0a0a0a", trail: "#666666", lead: "#FFFFFF" },
		rainbow: { bg: "#000000", trail: "#FF8800", lead: "#FFFFFF" },
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const resizeCanvas = () => {
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
			initializeColumns();
		};

		const initializeColumns = () => {
			const cols = Math.floor(canvas.width / fontSize);
			const rows = Math.floor(canvas.height / fontSize);

			columnsRef.current = [];

			for (let i = 0; i < cols * density; i++) {
				const direction =
					rainDirection === "down"
						? 1
						: rainDirection === "up"
							? -1
							: Math.random() < 0.5
								? 1
								: -1;
				const startY =
					direction === 1
						? -Math.random() * rows * fontSize
						: canvas.height + Math.random() * rows * fontSize;

				const column: MatrixColumn = {
					x: Math.floor(Math.random() * cols) * fontSize,
					y: startY,
					speed: lerp(0.5, 3, Math.random()) * speed,
					chars: [],
					length: Math.floor(lerp(10, trailLength, Math.random())),
					leadChar: 0,
					direction: direction,
					glitchChance: Math.random() * 0.1,
					colorOffset: Math.random() * 360,
				};

				for (let j = 0; j < column.length; j++) {
					column.chars.push(
						matrixChars[Math.floor(Math.random() * matrixChars.length)],
					);
				}

				columnsRef.current.push(column);
			}
		};

		const animate = (timestamp: number) => {
			if (!isPlaying) return;

			const currentScheme =
				colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Fade effect instead of clearing if enabled
			if (fadeEffect) {
				ctx.fillStyle = currentScheme.bg + "20";
				ctx.fillRect(0, 0, canvas.width, canvas.height);
			} else {
				ctx.fillStyle = currentScheme.bg;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
			}

			ctx.font = `${fontSize}px "Courier New", monospace`;
			ctx.textBaseline = "top";

			columnsRef.current.forEach((column) => {
				// Update position based on direction
				column.y += column.speed * speed * column.direction;

				// Reset if off screen
				const offScreen =
					column.direction === 1
						? column.y > canvas.height + column.length * fontSize
						: column.y < -column.length * fontSize;

				if (offScreen) {
					column.y =
						column.direction === 1
							? -column.length * fontSize
							: canvas.height + column.length * fontSize;
					column.x =
						Math.floor(Math.random() * Math.floor(canvas.width / fontSize)) *
						fontSize;
					column.speed = lerp(0.5, 3, Math.random()) * speed;

					// Regenerate characters
					for (let j = 0; j < column.chars.length; j++) {
						column.chars[j] =
							matrixChars[Math.floor(Math.random() * matrixChars.length)];
					}
				}

				// Interactive mode - influence from mouse position
				if (interactiveMode) {
					const mouseX = mousePositionRef.current.x;
					const mouseY = mousePositionRef.current.y;
					const distanceToMouse = Math.sqrt(
						(column.x - mouseX) ** 2 + (column.y - mouseY) ** 2,
					);

					if (distanceToMouse < 100) {
						column.speed *= 1 + (100 - distanceToMouse) / 200;
					}
				}

				// Draw characters
				for (let i = 0; i < column.chars.length; i++) {
					const charY = column.y - i * fontSize * column.direction;

					if (charY > -fontSize && charY < canvas.height + fontSize) {
						let alpha = 1;
						let color = currentScheme.trail;

						// Lead character (brightest)
						if (i === 0) {
							color = currentScheme.lead;
							alpha = 1;
						} else {
							// Fade trail
							alpha = Math.max(0, Math.min(1, 1 - i / column.length));
						}

						// Rainbow effect for rainbow scheme
						if (colorScheme === "rainbow") {
							const hue =
								(column.colorOffset + timestamp * 0.05 + i * 30) % 360;
							color = `hsl(${hue}, 100%, 50%)`;
						}

						// Glitch effect
						if (glitchEffect && Math.random() < column.glitchChance) {
							column.chars[i] =
								matrixChars[Math.floor(Math.random() * matrixChars.length)];
							alpha *= 0.5 + Math.random() * 0.5;
						}

						// Random character changes for digital effect
						if (Math.random() < 0.05) {
							column.chars[i] =
								matrixChars[Math.floor(Math.random() * matrixChars.length)];
						}

						ctx.fillStyle =
							colorScheme === "rainbow"
								? color
								: color +
									Math.floor(alpha * 255)
										.toString(16)
										.padStart(2, "0");
						ctx.fillText(column.chars[i], column.x, charY);
					}
				}
			});

			animationRef.current = requestAnimationFrame(() => animate(Date.now()));
		};

		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);

		if (isPlaying) {
			animate(Date.now());
		}

		return () => {
			window.removeEventListener("resize", resizeCanvas);
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [
		isPlaying,
		speed,
		density,
		trailLength,
		colorScheme,
		fontSize,
		characterSet,
		fadeEffect,
		glitchEffect,
		rainDirection,
		interactiveMode,
	]);

	const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		// Add a new column at click position
		const direction =
			rainDirection === "down"
				? 1
				: rainDirection === "up"
					? -1
					: Math.random() < 0.5
						? 1
						: -1;
		const newColumn: MatrixColumn = {
			x: Math.floor(x / fontSize) * fontSize,
			y: y - Math.random() * 200,
			speed: lerp(1, 4, Math.random()) * speed,
			chars: [],
			length: Math.floor(lerp(15, 30, Math.random())),
			leadChar: 0,
			direction: direction,
			glitchChance: Math.random() * 0.2,
			colorOffset: Math.random() * 360,
		};

		for (let j = 0; j < newColumn.length; j++) {
			newColumn.chars.push(
				matrixChars[Math.floor(Math.random() * matrixChars.length)],
			);
		}

		columnsRef.current.push(newColumn);
	};

	const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!interactiveMode) return;

		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		mousePositionRef.current = {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		};
	};

	return (
		<div className="flex flex-col h-screen bg-black">
			<div className="flex-shrink-0 bg-gray-900 p-4 border-b border-gray-700">
				<div className="flex items-center justify-between mb-4">
					<h1 className="text-2xl font-bold text-green-400">
						🌊 ASCII Matrix Rain
					</h1>
					<a
						href="/examples/visual"
						className="text-green-400 hover:text-green-300 underline"
					>
						← Back to Visual Examples
					</a>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-sm mb-4">
					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Animation</label>
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
						<label className="text-green-300 mb-2">
							Speed: {speed.toFixed(1)}x
						</label>
						<input
							type="range"
							min="0.1"
							max="3"
							step="0.1"
							value={speed}
							onChange={(e) => setSpeed(Number.parseFloat(e.target.value))}
							className="w-full"
						/>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">
							Density: {Math.round(density * 100)}%
						</label>
						<input
							type="range"
							min="0.1"
							max="1"
							step="0.1"
							value={density}
							onChange={(e) => setDensity(Number.parseFloat(e.target.value))}
							className="w-full"
						/>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Trail: {trailLength}</label>
						<input
							type="range"
							min="5"
							max="40"
							step="1"
							value={trailLength}
							onChange={(e) => setTrailLength(Number.parseInt(e.target.value))}
							className="w-full"
						/>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Color Scheme</label>
						<select
							value={colorScheme}
							onChange={(e) => setColorScheme(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-green-300 rounded border border-gray-600"
						>
							<option value="classic">Classic Green</option>
							<option value="blue">Blue Matrix</option>
							<option value="purple">Purple Rain</option>
							<option value="amber">Amber Code</option>
							<option value="red">Red Alert</option>
							<option value="cyan">Cyan Wave</option>
							<option value="neon">Neon Dreams</option>
							<option value="terminal">Terminal</option>
							<option value="ghost">Ghost Mode</option>
							<option value="rainbow">Rainbow</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Characters</label>
						<select
							value={characterSet}
							onChange={(e) => setCharacterSet(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-green-300 rounded border border-gray-600"
						>
							<option value="japanese">Japanese</option>
							<option value="binary">Binary</option>
							<option value="hex">Hexadecimal</option>
							<option value="alphanumeric">Alphanumeric</option>
							<option value="symbols">Symbols</option>
							<option value="mixed">Mixed</option>
							<option value="cyrillic">Cyrillic</option>
							<option value="greek">Greek</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Direction</label>
						<select
							value={rainDirection}
							onChange={(e) => setRainDirection(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-green-300 rounded border border-gray-600"
						>
							<option value="down">Falling Down</option>
							<option value="up">Rising Up</option>
							<option value="random">Random</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">
							Font Size: {fontSize}px
						</label>
						<input
							type="range"
							min="10"
							max="24"
							step="2"
							value={fontSize}
							onChange={(e) => setFontSize(Number.parseInt(e.target.value))}
							className="w-full"
						/>
					</div>

					<div className="flex flex-col gap-2">
						<label className="flex items-center text-green-300 text-xs">
							<input
								type="checkbox"
								checked={fadeEffect}
								onChange={(e) => setFadeEffect(e.target.checked)}
								className="mr-1"
							/>
							Fade Effect
						</label>
						<label className="flex items-center text-green-300 text-xs">
							<input
								type="checkbox"
								checked={glitchEffect}
								onChange={(e) => setGlitchEffect(e.target.checked)}
								className="mr-1"
							/>
							Glitch
						</label>
						<label className="flex items-center text-green-300 text-xs">
							<input
								type="checkbox"
								checked={interactiveMode}
								onChange={(e) => setInteractiveMode(e.target.checked)}
								className="mr-1"
							/>
							Interactive
						</label>
					</div>
				</div>

				<div className="mt-4 text-green-400 text-sm">
					<p>
						💡 <strong>Click anywhere</strong> to spawn new character streams!
					</p>
					<p>
						🖱️ <strong>Move your mouse</strong> in interactive mode to influence
						stream speed!
					</p>
					<p>
						🎨 <strong>Choose character sets</strong> from Japanese, Binary,
						Hex, and more!
					</p>
					<p>
						Experience the iconic "digital rain" effect with advanced
						customization and interactive features
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
						background:
							colorSchemes[colorScheme as keyof typeof colorSchemes].bg,
						maxWidth: "100%",
						height: "auto",
					}}
				/>
			</div>
		</div>
	);
}