import { degrees, hsl, radians, toCssHsl } from "play.ts";
import { useEffect, useRef, useState } from "react";

interface LSystemRule {
	symbol: string;
	replacement: string;
}

interface LSystemDefinition {
	name: string;
	axiom: string;
	rules: LSystemRule[];
	angle: number;
	description: string;
}

interface TurtleState {
	x: number;
	y: number;
	angle: number;
	color: { h: number; s: number; l: number };
	lineWidth: number;
}

export default function LSystemExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [currentSystem, setCurrentSystem] = useState<string>("dragon");
	const [iterations, setIterations] = useState(10);
	const [stepLength, setStepLength] = useState(5);
	const [showSteps, setShowSteps] = useState(false);
	const [animationSpeed, setAnimationSpeed] = useState(50);
	const [isAnimating, setIsAnimating] = useState(false);

	const animationRef = useRef<number>();
	const currentStepRef = useRef<number>(0);

	const lSystems: Record<string, LSystemDefinition> = {
		dragon: {
			name: "Dragon Curve",
			axiom: "F",
			rules: [
				{ symbol: "F", replacement: "F+S" },
				{ symbol: "S", replacement: "F-S" },
			],
			angle: 90,
			description: "Creates a fractal dragon curve with each iteration",
		},
		sierpinski: {
			name: "Sierpinski Triangle",
			axiom: "F-G-G",
			rules: [
				{ symbol: "F", replacement: "F-G+F+G-F" },
				{ symbol: "G", replacement: "GG" },
			],
			angle: 120,
			description: "Generates the famous Sierpinski triangle fractal",
		},
		kochSnowflake: {
			name: "Koch Snowflake",
			axiom: "F++F++F",
			rules: [{ symbol: "F", replacement: "F-F++F-F" }],
			angle: 60,
			description: "Creates the Koch snowflake with triangular segments",
		},
		plant: {
			name: "Plant Growth",
			axiom: "X",
			rules: [
				{ symbol: "X", replacement: "F+[[X]-X]-F[-FX]+X" },
				{ symbol: "F", replacement: "FF" },
			],
			angle: 25,
			description: "Simulates plant growth with branching patterns",
		},
		tree: {
			name: "Binary Tree",
			axiom: "F",
			rules: [{ symbol: "F", replacement: "F[+F]F[-F]F" }],
			angle: 30,
			description: "Creates a binary tree structure with symmetric branching",
		},
		levy: {
			name: "Lévy C Curve",
			axiom: "F",
			rules: [{ symbol: "F", replacement: "+F--F+" }],
			angle: 45,
			description: "Generates the Lévy C curve fractal",
		},
	};

	const generateString = (
		system: LSystemDefinition,
		iterations: number,
	): string => {
		let current = system.axiom;

		for (let i = 0; i < iterations; i++) {
			let next = "";
			for (const char of current) {
				const rule = system.rules.find((r) => r.symbol === char);
				next += rule ? rule.replacement : char;
			}
			current = next;
		}

		return current;
	};

	const interpretTurtle = (
		instructions: string,
		system: LSystemDefinition,
		stepLength: number,
		canvas: HTMLCanvasElement,
		animateSteps = false,
		maxSteps?: number,
	): void => {
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.lineCap = "round";
		ctx.lineJoin = "round";

		const stack: TurtleState[] = [];
		const turtle: TurtleState = {
			x: canvas.width / 2,
			y: canvas.height / 2,
			angle: system.name === "Plant Growth" ? 90 : 0, // Plants grow upward
			color: hsl(120, 70, 50), // Start with green
			lineWidth: 1,
		};

		// Adjust starting position based on system
		if (system.name === "Koch Snowflake") {
			turtle.x = canvas.width * 0.15;
			turtle.y = canvas.height * 0.7;
		} else if (system.name === "Sierpinski Triangle") {
			turtle.x = canvas.width * 0.5;
			turtle.y = canvas.height * 0.85;
		} else if (system.name === "Dragon Curve") {
			turtle.x = canvas.width * 0.4;
			turtle.y = canvas.height * 0.5;
		}

		let stepCount = 0;
		const totalSteps = maxSteps || instructions.length;

		for (
			let i = 0;
			i < instructions.length && (!maxSteps || stepCount < maxSteps);
			i++
		) {
			const instruction = instructions[i];

			ctx.strokeStyle = toCssHsl(turtle.color);
			ctx.lineWidth = turtle.lineWidth;

			switch (instruction) {
				case "F":
				case "G":
				case "S": {
					// Draw forward
					const oldX = turtle.x;
					const oldY = turtle.y;
					turtle.x += Math.cos(radians(turtle.angle)) * stepLength;
					turtle.y += Math.sin(radians(turtle.angle)) * stepLength;

					ctx.beginPath();
					ctx.moveTo(oldX, oldY);
					ctx.lineTo(turtle.x, turtle.y);
					ctx.stroke();
					stepCount++;
					break;
				}

				case "f":
					// Move forward without drawing
					turtle.x += Math.cos(radians(turtle.angle)) * stepLength;
					turtle.y += Math.sin(radians(turtle.angle)) * stepLength;
					break;

				case "+":
					// Turn right
					turtle.angle += system.angle;
					break;

				case "-":
					// Turn left
					turtle.angle -= system.angle;
					break;

				case "[":
					// Push state
					stack.push({ ...turtle, color: { ...turtle.color } });
					// Slightly change color for branches
					turtle.color.h = (turtle.color.h + 20) % 360;
					turtle.lineWidth *= 0.8;
					break;

				case "]": {
					// Pop state
					const state = stack.pop();
					if (state) {
						turtle.x = state.x;
						turtle.y = state.y;
						turtle.angle = state.angle;
						turtle.color = state.color;
						turtle.lineWidth = state.lineWidth;
					}
					break;
				}

				case "X":
					// Non-drawing symbol (placeholder)
					break;
			}
		}
	};

	const drawSystem = (
		systemName: string,
		iterations: number,
		stepLength: number,
		animate = false,
	) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const system = lSystems[systemName];
		if (!system) return;

		const instructions = generateString(system, iterations);

		if (animate) {
			currentStepRef.current = 0;
			setIsAnimating(true);
			animateDrawing(instructions, system, stepLength);
		} else {
			interpretTurtle(instructions, system, stepLength, canvas);
			setIsAnimating(false);
		}
	};

	const animateDrawing = (
		instructions: string,
		system: LSystemDefinition,
		stepLength: number,
	) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const drawStep = () => {
			const stepsPerFrame = Math.max(1, Math.floor(animationSpeed / 10));
			currentStepRef.current += stepsPerFrame;

			interpretTurtle(
				instructions,
				system,
				stepLength,
				canvas,
				true,
				currentStepRef.current,
			);

			if (currentStepRef.current < instructions.length) {
				animationRef.current = requestAnimationFrame(drawStep);
			} else {
				setIsAnimating(false);
			}
		};

		drawStep();
	};

	const stopAnimation = () => {
		setIsAnimating(false);
		if (animationRef.current) {
			cancelAnimationFrame(animationRef.current);
		}
	};

	const exportSVG = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const system = lSystems[currentSystem];
		const instructions = generateString(system, iterations);

		// Create SVG content
		let svg = `<svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg">\n`;
		svg += '<g stroke="green" stroke-width="1" fill="none">\n';

		// Convert canvas drawing to SVG paths
		// This is a simplified version - in practice you'd want to track all the turtle movements
		const paths = generateSVGPaths(instructions, system, stepLength, canvas);
		svg += paths;

		svg += "</g>\n</svg>";

		// Download SVG
		const blob = new Blob([svg], { type: "image/svg+xml" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${currentSystem}-${iterations}iterations.svg`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const generateSVGPaths = (
		instructions: string,
		system: LSystemDefinition,
		stepLength: number,
		canvas: HTMLCanvasElement,
	): string => {
		const stack: TurtleState[] = [];
		const turtle: TurtleState = {
			x: canvas.width / 2,
			y: canvas.height / 2,
			angle: system.name === "Plant Growth" ? 90 : 0,
			color: hsl(120, 70, 50),
			lineWidth: 1,
		};

		let paths = "";
		let currentPath = "";
		let pathStarted = false;

		for (const instruction of instructions) {
			switch (instruction) {
				case "F":
				case "G":
				case "S": {
					const oldX = turtle.x;
					const oldY = turtle.y;
					turtle.x += Math.cos(radians(turtle.angle)) * stepLength;
					turtle.y += Math.sin(radians(turtle.angle)) * stepLength;

					if (!pathStarted) {
						currentPath = `M ${oldX.toFixed(2)} ${oldY.toFixed(2)} `;
						pathStarted = true;
					}
					currentPath += `L ${turtle.x.toFixed(2)} ${turtle.y.toFixed(2)} `;
					break;
				}

				case "+":
					turtle.angle += system.angle;
					break;

				case "-":
					turtle.angle -= system.angle;
					break;

				case "[":
					if (pathStarted) {
						paths += `<path d="${currentPath}" />\n`;
						currentPath = "";
						pathStarted = false;
					}
					stack.push({ ...turtle, color: { ...turtle.color } });
					break;

				case "]": {
					if (pathStarted) {
						paths += `<path d="${currentPath}" />\n`;
						currentPath = "";
						pathStarted = false;
					}
					const state = stack.pop();
					if (state) {
						turtle.x = state.x;
						turtle.y = state.y;
						turtle.angle = state.angle;
						turtle.color = state.color;
						turtle.lineWidth = state.lineWidth;
					}
					break;
				}
			}
		}

		if (pathStarted) {
			paths += `<path d="${currentPath}" />\n`;
		}

		return paths;
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.width = 800;
		canvas.height = 600;

		drawSystem(currentSystem, iterations, stepLength);
	}, [currentSystem, iterations, stepLength]);

	useEffect(() => {
		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, []);

	const systemDef = lSystems[currentSystem];

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">L-System Fractal Generator</h1>
				<p className="text-gray-600 mb-4">
					Six mathematical fractals with turtle graphics, animated drawing, SVG
					export, and educational rule explanations.
				</p>
				<div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
					<p className="text-purple-800">
						🌿 Watch fractals grow using simple replacement rules and turtle
						graphics
					</p>
				</div>
			</div>

			<div className="mb-6">
				<div className="flex flex-wrap gap-4 mb-4">
					<button
						type="button"
						onClick={() =>
							drawSystem(currentSystem, iterations, stepLength, true)
						}
						disabled={isAnimating}
						className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
					>
						Animate Drawing
					</button>
					<button
						type="button"
						onClick={stopAnimation}
						disabled={!isAnimating}
						className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
					>
						Stop Animation
					</button>
					<button
						type="button"
						onClick={() => drawSystem(currentSystem, iterations, stepLength)}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
					>
						Draw Complete
					</button>
					<button
						type="button"
						onClick={exportSVG}
						className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
					>
						Export SVG
					</button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							L-System Type
						</label>
						<select
							value={currentSystem}
							onChange={(e) => setCurrentSystem(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
						>
							{Object.entries(lSystems).map(([key, system]) => (
								<option key={key} value={key}>
									{system.name}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Iterations: {iterations}
						</label>
						<input
							type="range"
							min="1"
							max="15"
							value={iterations}
							onChange={(e) => setIterations(Number(e.target.value))}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Step Length: {stepLength}px
						</label>
						<input
							type="range"
							min="1"
							max="20"
							value={stepLength}
							onChange={(e) => setStepLength(Number(e.target.value))}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Animation Speed: {animationSpeed}
						</label>
						<input
							type="range"
							min="10"
							max="200"
							value={animationSpeed}
							onChange={(e) => setAnimationSpeed(Number(e.target.value))}
							className="w-full"
						/>
					</div>
				</div>
			</div>

			<div className="mb-6">
				<canvas
					ref={canvasRef}
					className="border border-gray-300 rounded-lg bg-black"
					style={{ maxWidth: "100%", height: "auto" }}
				/>
			</div>

			<div className="grid md:grid-cols-2 gap-6 mb-6">
				<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-gray-800">
						Current System: {systemDef.name}
					</h3>
					<p className="text-gray-600 mb-3">{systemDef.description}</p>
					<div className="space-y-2 text-sm">
						<div>
							<strong>Axiom:</strong>{" "}
							<code className="bg-gray-200 px-1 rounded">
								{systemDef.axiom}
							</code>
						</div>
						<div>
							<strong>Angle:</strong> {systemDef.angle}°
						</div>
						<div>
							<strong>Rules:</strong>
						</div>
						<ul className="ml-4 space-y-1">
							{systemDef.rules.map((rule, index) => (
								<li key={index}>
									<code className="bg-gray-200 px-1 rounded">
										{rule.symbol}
									</code>{" "}
									→
									<code className="bg-gray-200 px-1 rounded ml-1">
										{rule.replacement}
									</code>
								</li>
							))}
						</ul>
					</div>
				</div>

				<div className="bg-green-50 border border-green-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-green-800">
						Turtle Commands
					</h3>
					<ul className="text-green-700 space-y-1 text-sm">
						<li>
							• <strong>F, G, S</strong>: Move forward and draw
						</li>
						<li>
							• <strong>f</strong>: Move forward without drawing
						</li>
						<li>
							• <strong>+</strong>: Turn right by angle
						</li>
						<li>
							• <strong>-</strong>: Turn left by angle
						</li>
						<li>
							• <strong>[</strong>: Save current state (push to stack)
						</li>
						<li>
							• <strong>]</strong>: Restore previous state (pop from stack)
						</li>
						<li>
							• <strong>X</strong>: Non-drawing placeholder symbol
						</li>
					</ul>
				</div>
			</div>

			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
				<h3 className="text-lg font-semibold mb-2 text-blue-800">
					How L-Systems Work
				</h3>
				<ol className="text-blue-700 space-y-1">
					<li>1. Start with an initial string (axiom)</li>
					<li>2. Apply replacement rules simultaneously to all symbols</li>
					<li>3. Repeat for the desired number of iterations</li>
					<li>4. Interpret the final string as turtle graphics commands</li>
					<li>5. The turtle draws the fractal pattern step by step</li>
				</ol>
			</div>

			<div className="mt-6">
				<a
					href="/examples/visual"
					className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
				>
					← Back to Examples
				</a>
			</div>
		</div>
	);
}