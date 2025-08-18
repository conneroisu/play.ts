import { randomBool, randomInt } from "play.ts";
import { useCallback, useEffect, useRef, useState } from "react";

interface GameState {
	grid: boolean[][];
	generation: number;
	isRunning: boolean;
	speed: number;
}

export default function ConwayExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const lastUpdateRef = useRef<number>(0);

	const [gridSize, setGridSize] = useState({ width: 80, height: 60 });
	const [cellSize, setCellSize] = useState(8);
	const [gameState, setGameState] = useState<GameState>({
		grid: [],
		generation: 0,
		isRunning: false,
		speed: 100, // milliseconds between generations
	});

	const [pattern, setPattern] = useState<
		"random" | "glider" | "gosperGun" | "pulsar" | "beacon"
	>("random");

	// Initialize empty grid
	const initializeGrid = useCallback(
		(width: number, height: number): boolean[][] => {
			return Array(height)
				.fill(null)
				.map(() => Array(width).fill(false));
		},
		[],
	);

	// Count live neighbors
	const countNeighbors = useCallback(
		(grid: boolean[][], x: number, y: number): number => {
			let count = 0;
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					if (dx === 0 && dy === 0) continue;

					const ny = y + dy;
					const nx = x + dx;

					if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
						if (grid[ny][nx]) count++;
					}
				}
			}
			return count;
		},
		[],
	);

	// Apply Conway's Game of Life rules
	const nextGeneration = useCallback(
		(currentGrid: boolean[][]): boolean[][] => {
			const newGrid = initializeGrid(currentGrid[0].length, currentGrid.length);

			for (let y = 0; y < currentGrid.length; y++) {
				for (let x = 0; x < currentGrid[0].length; x++) {
					const neighbors = countNeighbors(currentGrid, x, y);
					const isAlive = currentGrid[y][x];

					if (isAlive) {
						// Live cell rules
						newGrid[y][x] = neighbors === 2 || neighbors === 3;
					} else {
						// Dead cell rules
						newGrid[y][x] = neighbors === 3;
					}
				}
			}

			return newGrid;
		},
		[countNeighbors, initializeGrid],
	);

	// Predefined patterns
	const patterns = {
		glider: [
			[0, 1, 0],
			[0, 0, 1],
			[1, 1, 1],
		],
		gosperGun: [
			[
				0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
				1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
			],
			[
				0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0,
				1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
			],
			[
				0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0,
				0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
			],
			[
				0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0,
				0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
			],
			[
				1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0,
				0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
			],
			[
				1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0,
				1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
			],
			[
				0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0,
				1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
			],
			[
				0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
			],
			[
				0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
			],
		],
		pulsar: [
			[0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
			[1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
			[1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
			[0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
			[1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
			[1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
			[1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
		],
		beacon: [
			[1, 1, 0, 0],
			[1, 1, 0, 0],
			[0, 0, 1, 1],
			[0, 0, 1, 1],
		],
	};

	const loadPattern = useCallback(
		(patternName: keyof typeof patterns) => {
			const newGrid = initializeGrid(gridSize.width, gridSize.height);
			const pattern = patterns[patternName];

			const startX = Math.floor((gridSize.width - pattern[0].length) / 2);
			const startY = Math.floor((gridSize.height - pattern.length) / 2);

			pattern.forEach((row, y) => {
				row.forEach((cell, x) => {
					if (startY + y < gridSize.height && startX + x < gridSize.width) {
						newGrid[startY + y][startX + x] = cell === 1;
					}
				});
			});

			setGameState((prev) => ({ ...prev, grid: newGrid, generation: 0 }));
		},
		[gridSize, initializeGrid],
	);

	const generateRandomGrid = useCallback(() => {
		const newGrid = initializeGrid(gridSize.width, gridSize.height);

		for (let y = 0; y < gridSize.height; y++) {
			for (let x = 0; x < gridSize.width; x++) {
				newGrid[y][x] = randomBool() && Math.random() < 0.3; // 30% chance of being alive
			}
		}

		setGameState((prev) => ({ ...prev, grid: newGrid, generation: 0 }));
	}, [gridSize, initializeGrid]);

	const clearGrid = useCallback(() => {
		const newGrid = initializeGrid(gridSize.width, gridSize.height);
		setGameState((prev) => ({ ...prev, grid: newGrid, generation: 0 }));
	}, [gridSize, initializeGrid]);

	const toggleCell = useCallback((x: number, y: number) => {
		setGameState((prev) => {
			const newGrid = prev.grid.map((row) => [...row]);
			newGrid[y][x] = !newGrid[y][x];
			return { ...prev, grid: newGrid };
		});
	}, []);

	const render = useCallback(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw grid
		ctx.strokeStyle = "#e0e0e0";
		ctx.lineWidth = 1;

		// Vertical lines
		for (let x = 0; x <= gridSize.width; x++) {
			ctx.beginPath();
			ctx.moveTo(x * cellSize, 0);
			ctx.lineTo(x * cellSize, gridSize.height * cellSize);
			ctx.stroke();
		}

		// Horizontal lines
		for (let y = 0; y <= gridSize.height; y++) {
			ctx.beginPath();
			ctx.moveTo(0, y * cellSize);
			ctx.lineTo(gridSize.width * cellSize, y * cellSize);
			ctx.stroke();
		}

		// Draw live cells
		ctx.fillStyle = "#2563eb";
		gameState.grid.forEach((row, y) => {
			row.forEach((cell, x) => {
				if (cell) {
					ctx.fillRect(
						x * cellSize + 1,
						y * cellSize + 1,
						cellSize - 2,
						cellSize - 2,
					);
				}
			});
		});
	}, [gameState.grid, gridSize, cellSize]);

	const animate = useCallback(
		(currentTime: number) => {
			if (!gameState.isRunning) return;

			if (currentTime - lastUpdateRef.current >= gameState.speed) {
				setGameState((prev) => ({
					...prev,
					grid: nextGeneration(prev.grid),
					generation: prev.generation + 1,
				}));
				lastUpdateRef.current = currentTime;
			}

			animationRef.current = requestAnimationFrame(animate);
		},
		[gameState.isRunning, gameState.speed, nextGeneration],
	);

	const startSimulation = () => {
		setGameState((prev) => ({ ...prev, isRunning: true }));
	};

	const stopSimulation = () => {
		setGameState((prev) => ({ ...prev, isRunning: false }));
		if (animationRef.current) {
			cancelAnimationFrame(animationRef.current);
		}
	};

	const stepGeneration = () => {
		setGameState((prev) => ({
			...prev,
			grid: nextGeneration(prev.grid),
			generation: prev.generation + 1,
		}));
	};

	useEffect(() => {
		if (gameState.isRunning) {
			animationRef.current = requestAnimationFrame(animate);
		}
		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [gameState.isRunning, animate]);

	useEffect(() => {
		render();
	}, [render]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.width = gridSize.width * cellSize;
		canvas.height = gridSize.height * cellSize;

		const handleClick = (e: MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			const x = Math.floor((e.clientX - rect.left) / cellSize);
			const y = Math.floor((e.clientY - rect.top) / cellSize);

			if (x >= 0 && x < gridSize.width && y >= 0 && y < gridSize.height) {
				toggleCell(x, y);
			}
		};

		canvas.addEventListener("click", handleClick);
		return () => canvas.removeEventListener("click", handleClick);
	}, [gridSize, cellSize, toggleCell]);

	useEffect(() => {
		generateRandomGrid();
	}, []);

	useEffect(() => {
		if (pattern !== "random") {
			loadPattern(pattern);
		} else {
			generateRandomGrid();
		}
	}, [pattern, loadPattern, generateRandomGrid]);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Conway's Game of Life Simulator
				</h1>
				<p className="text-gray-600 mb-4">
					Complete cellular automata with famous patterns, interactive editing,
					and educational rule visualization.
				</p>
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<p className="text-blue-800">
						🔬 Watch patterns evolve, click cells to toggle them, try different
						starting configurations
					</p>
				</div>
			</div>

			<div className="mb-6">
				<div className="flex flex-wrap gap-4 mb-4">
					<button
						type="button"
						onClick={startSimulation}
						disabled={gameState.isRunning}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
					>
						Start
					</button>
					<button
						type="button"
						onClick={stopSimulation}
						disabled={!gameState.isRunning}
						className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
					>
						Stop
					</button>
					<button
						type="button"
						onClick={stepGeneration}
						disabled={gameState.isRunning}
						className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
					>
						Step
					</button>
					<button
						type="button"
						onClick={clearGrid}
						className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
					>
						Clear
					</button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Speed: {gameState.speed}ms
						</label>
						<input
							type="range"
							min="50"
							max="1000"
							step="50"
							value={gameState.speed}
							onChange={(e) =>
								setGameState((prev) => ({
									...prev,
									speed: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Cell Size: {cellSize}px
						</label>
						<input
							type="range"
							min="4"
							max="16"
							value={cellSize}
							onChange={(e) => setCellSize(Number(e.target.value))}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Pattern
						</label>
						<select
							value={pattern}
							onChange={(e) => setPattern(e.target.value as typeof pattern)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="random">Random</option>
							<option value="glider">Glider</option>
							<option value="gosperGun">Gosper Glider Gun</option>
							<option value="pulsar">Pulsar</option>
							<option value="beacon">Beacon</option>
						</select>
					</div>
				</div>

				<div className="text-sm text-gray-600 mb-4">
					Generation: {gameState.generation} | Click cells to toggle them
				</div>
			</div>

			<div className="mb-6">
				<canvas
					ref={canvasRef}
					className="border border-gray-300 rounded-lg cursor-pointer bg-white"
					style={{ maxWidth: "100%", height: "auto" }}
				/>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-yellow-800">
						Game Rules
					</h3>
					<ul className="text-yellow-700 space-y-1">
						<li>
							• <strong>Birth</strong>: Dead cell with exactly 3 neighbors
							becomes alive
						</li>
						<li>
							• <strong>Survival</strong>: Live cell with 2 or 3 neighbors stays
							alive
						</li>
						<li>
							• <strong>Death</strong>: Live cell with fewer than 2 or more than
							3 neighbors dies
						</li>
						<li>
							• <strong>Isolation</strong>: Underpopulation kills cells
						</li>
						<li>
							• <strong>Overcrowding</strong>: Overpopulation kills cells
						</li>
					</ul>
				</div>

				<div className="bg-green-50 border border-green-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-green-800">
						Famous Patterns
					</h3>
					<ul className="text-green-700 space-y-1">
						<li>
							• <strong>Glider</strong>: Moving pattern that travels across the
							grid
						</li>
						<li>
							• <strong>Gosper Gun</strong>: Periodically produces gliders
						</li>
						<li>
							• <strong>Pulsar</strong>: Oscillates with period 3
						</li>
						<li>
							• <strong>Beacon</strong>: Simple oscillator with period 2
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6">
				<a
					href="/examples/visual"
					className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
				>
					← Back to Examples
				</a>
			</div>
		</div>
	);
}