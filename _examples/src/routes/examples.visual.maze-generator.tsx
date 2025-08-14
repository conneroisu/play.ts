import { Link, createFileRoute } from "@tanstack/react-router";
import { randomChoice, randomInt, shuffle } from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/visual/maze-generator")({
	component: MazeGeneratorExample,
});

interface Cell {
	x: number;
	y: number;
	walls: {
		top: boolean;
		right: boolean;
		bottom: boolean;
		left: boolean;
	};
	visited: boolean;
	inMaze: boolean;
	distance?: number;
}

interface MazeSettings {
	width: number;
	height: number;
	cellSize: number;
	algorithm: "dfs" | "kruskal" | "prim" | "aldous-broder";
	animationSpeed: number;
}

function MazeGeneratorExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const [maze, setMaze] = useState<Cell[][]>([]);
	const [isGenerating, setIsGenerating] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [settings, setSettings] = useState<MazeSettings>({
		width: 25,
		height: 25,
		cellSize: 16,
		algorithm: "dfs",
		animationSpeed: 50,
	});
	const [showSolution, setShowSolution] = useState(false);
	const [solution, setSolution] = useState<{ x: number; y: number }[]>([]);

	const initializeMaze = (): Cell[][] => {
		const newMaze: Cell[][] = [];
		for (let y = 0; y < settings.height; y++) {
			newMaze[y] = [];
			for (let x = 0; x < settings.width; x++) {
				newMaze[y][x] = {
					x,
					y,
					walls: { top: true, right: true, bottom: true, left: true },
					visited: false,
					inMaze: false,
				};
			}
		}
		return newMaze;
	};

	const getNeighbors = (
		cell: Cell,
		maze: Cell[][],
		includeDiagonal = false,
	): Cell[] => {
		const neighbors: Cell[] = [];
		const { x, y } = cell;

		// Cardinal directions
		if (y > 0) neighbors.push(maze[y - 1][x]); // Top
		if (x < settings.width - 1) neighbors.push(maze[y][x + 1]); // Right
		if (y < settings.height - 1) neighbors.push(maze[y + 1][x]); // Bottom
		if (x > 0) neighbors.push(maze[y][x - 1]); // Left

		if (includeDiagonal) {
			// Diagonal directions
			if (y > 0 && x > 0) neighbors.push(maze[y - 1][x - 1]); // Top-left
			if (y > 0 && x < settings.width - 1) neighbors.push(maze[y - 1][x + 1]); // Top-right
			if (y < settings.height - 1 && x > 0) neighbors.push(maze[y + 1][x - 1]); // Bottom-left
			if (y < settings.height - 1 && x < settings.width - 1)
				neighbors.push(maze[y + 1][x + 1]); // Bottom-right
		}

		return neighbors;
	};

	const removeWall = (current: Cell, neighbor: Cell, maze: Cell[][]) => {
		const dx = current.x - neighbor.x;
		const dy = current.y - neighbor.y;

		if (dx === 1) {
			// Neighbor is to the left
			maze[current.y][current.x].walls.left = false;
			maze[neighbor.y][neighbor.x].walls.right = false;
		} else if (dx === -1) {
			// Neighbor is to the right
			maze[current.y][current.x].walls.right = false;
			maze[neighbor.y][neighbor.x].walls.left = false;
		} else if (dy === 1) {
			// Neighbor is above
			maze[current.y][current.x].walls.top = false;
			maze[neighbor.y][neighbor.x].walls.bottom = false;
		} else if (dy === -1) {
			// Neighbor is below
			maze[current.y][current.x].walls.bottom = false;
			maze[neighbor.y][neighbor.x].walls.top = false;
		}
	};

	// Depth-First Search (Recursive Backtracking)
	const generateDFS = async (maze: Cell[][], startX = 0, startY = 0) => {
		const stack: Cell[] = [];
		const current = maze[startY][startX];
		current.visited = true;
		stack.push(current);

		while (stack.length > 0) {
			const current = stack[stack.length - 1];
			const neighbors = getNeighbors(current, maze).filter((n) => !n.visited);

			if (neighbors.length > 0) {
				const next = randomChoice(neighbors);
				removeWall(current, next, maze);
				next.visited = true;
				stack.push(next);
			} else {
				stack.pop();
			}

			// Animation step
			await new Promise((resolve) =>
				setTimeout(resolve, 100 - settings.animationSpeed),
			);
			setMaze([...maze]);
		}
	};

	// Kruskal's Algorithm
	const generateKruskal = async (maze: Cell[][]) => {
		const edges: { cell1: Cell; cell2: Cell }[] = [];
		const sets = new Map<string, Set<string>>();

		// Initialize disjoint sets
		for (let y = 0; y < settings.height; y++) {
			for (let x = 0; x < settings.width; x++) {
				const key = `${x},${y}`;
				sets.set(key, new Set([key]));
			}
		}

		// Create all possible edges
		for (let y = 0; y < settings.height; y++) {
			for (let x = 0; x < settings.width; x++) {
				if (x < settings.width - 1) {
					edges.push({ cell1: maze[y][x], cell2: maze[y][x + 1] });
				}
				if (y < settings.height - 1) {
					edges.push({ cell1: maze[y][x], cell2: maze[y + 1][x] });
				}
			}
		}

		// Shuffle edges
		shuffle(edges);

		const findSet = (key: string): Set<string> | undefined => {
			for (const [setKey, set] of sets) {
				if (set.has(key)) return set;
			}
			return undefined;
		};

		const union = (key1: string, key2: string) => {
			const set1 = findSet(key1);
			const set2 = findSet(key2);

			if (set1 && set2 && set1 !== set2) {
				// Merge smaller set into larger set
				if (set1.size < set2.size) {
					set2.forEach((item) => set1.add(item));
					sets.delete(
						Array.from(sets.keys()).find((k) => sets.get(k) === set2)!,
					);
				} else {
					set1.forEach((item) => set2.add(item));
					sets.delete(
						Array.from(sets.keys()).find((k) => sets.get(k) === set1)!,
					);
				}
				return true;
			}
			return false;
		};

		for (const edge of edges) {
			const key1 = `${edge.cell1.x},${edge.cell1.y}`;
			const key2 = `${edge.cell2.x},${edge.cell2.y}`;

			if (union(key1, key2)) {
				removeWall(edge.cell1, edge.cell2, maze);
				edge.cell1.visited = true;
				edge.cell2.visited = true;

				// Animation step
				await new Promise((resolve) =>
					setTimeout(resolve, 100 - settings.animationSpeed),
				);
				setMaze([...maze]);
			}
		}
	};

	// Prim's Algorithm
	const generatePrim = async (maze: Cell[][]) => {
		const startX = randomInt(0, settings.width - 1);
		const startY = randomInt(0, settings.height - 1);

		maze[startY][startX].inMaze = true;
		const frontiers: Cell[] = getNeighbors(maze[startY][startX], maze);

		while (frontiers.length > 0) {
			const randomIndex = randomInt(0, frontiers.length - 1);
			const frontier = frontiers[randomIndex];
			frontiers.splice(randomIndex, 1);

			const mazeNeighbors = getNeighbors(frontier, maze).filter(
				(n) => n.inMaze,
			);
			if (mazeNeighbors.length > 0) {
				const neighbor = randomChoice(mazeNeighbors);
				removeWall(frontier, neighbor, maze);
				frontier.inMaze = true;
				frontier.visited = true;

				// Add new frontiers
				const newFrontiers = getNeighbors(frontier, maze).filter(
					(n) => !n.inMaze && !frontiers.includes(n),
				);
				frontiers.push(...newFrontiers);

				// Animation step
				await new Promise((resolve) =>
					setTimeout(resolve, 100 - settings.animationSpeed),
				);
				setMaze([...maze]);
			}
		}
	};

	// Aldous-Broder Algorithm
	const generateAldousBroder = async (maze: Cell[][]) => {
		let currentX = randomInt(0, settings.width - 1);
		let currentY = randomInt(0, settings.height - 1);
		let visitedCount = 1;

		maze[currentY][currentX].visited = true;

		while (visitedCount < settings.width * settings.height) {
			const neighbors = getNeighbors(maze[currentY][currentX], maze);
			const nextCell = randomChoice(neighbors);

			if (!nextCell.visited) {
				removeWall(maze[currentY][currentX], nextCell, maze);
				nextCell.visited = true;
				visitedCount++;
			}

			currentX = nextCell.x;
			currentY = nextCell.y;

			// Animation step
			await new Promise((resolve) =>
				setTimeout(resolve, 100 - settings.animationSpeed),
			);
			setMaze([...maze]);
		}
	};

	const generateMaze = async () => {
		setIsGenerating(true);
		setShowSolution(false);
		const newMaze = initializeMaze();
		setMaze(newMaze);

		try {
			switch (settings.algorithm) {
				case "dfs":
					await generateDFS(newMaze);
					break;
				case "kruskal":
					await generateKruskal(newMaze);
					break;
				case "prim":
					await generatePrim(newMaze);
					break;
				case "aldous-broder":
					await generateAldousBroder(newMaze);
					break;
			}
		} catch (error) {
			console.error("Maze generation error:", error);
		}

		setIsGenerating(false);
	};

	const solveMaze = () => {
		if (maze.length === 0) return;

		const start = maze[0][0];
		const end = maze[settings.height - 1][settings.width - 1];
		const queue: { cell: Cell; path: { x: number; y: number }[] }[] = [];
		const visited = new Set<string>();

		queue.push({ cell: start, path: [{ x: start.x, y: start.y }] });
		visited.add(`${start.x},${start.y}`);

		while (queue.length > 0) {
			const { cell: current, path } = queue.shift()!;

			if (current === end) {
				setSolution(path);
				setShowSolution(true);
				return;
			}

			const neighbors = getNeighbors(current, maze).filter((neighbor) => {
				const key = `${neighbor.x},${neighbor.y}`;
				if (visited.has(key)) return false;

				// Check if there's a wall between current and neighbor
				const dx = current.x - neighbor.x;
				const dy = current.y - neighbor.y;

				if (dx === 1 && current.walls.left) return false;
				if (dx === -1 && current.walls.right) return false;
				if (dy === 1 && current.walls.top) return false;
				if (dy === -1 && current.walls.bottom) return false;

				return true;
			});

			for (const neighbor of neighbors) {
				const key = `${neighbor.x},${neighbor.y}`;
				visited.add(key);
				queue.push({
					cell: neighbor,
					path: [...path, { x: neighbor.x, y: neighbor.y }],
				});
			}
		}
	};

	const render = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx || maze.length === 0) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw cells and walls
		for (let y = 0; y < settings.height; y++) {
			for (let x = 0; x < settings.width; x++) {
				const cell = maze[y][x];
				const pixelX = x * settings.cellSize;
				const pixelY = y * settings.cellSize;

				// Draw cell background
				if (cell.visited || cell.inMaze) {
					ctx.fillStyle = "#f8f9fa";
				} else {
					ctx.fillStyle = "#343a40";
				}
				ctx.fillRect(pixelX, pixelY, settings.cellSize, settings.cellSize);

				// Draw walls
				ctx.strokeStyle = "#212529";
				ctx.lineWidth = 2;

				if (cell.walls.top) {
					ctx.beginPath();
					ctx.moveTo(pixelX, pixelY);
					ctx.lineTo(pixelX + settings.cellSize, pixelY);
					ctx.stroke();
				}
				if (cell.walls.right) {
					ctx.beginPath();
					ctx.moveTo(pixelX + settings.cellSize, pixelY);
					ctx.lineTo(pixelX + settings.cellSize, pixelY + settings.cellSize);
					ctx.stroke();
				}
				if (cell.walls.bottom) {
					ctx.beginPath();
					ctx.moveTo(pixelX, pixelY + settings.cellSize);
					ctx.lineTo(pixelX + settings.cellSize, pixelY + settings.cellSize);
					ctx.stroke();
				}
				if (cell.walls.left) {
					ctx.beginPath();
					ctx.moveTo(pixelX, pixelY);
					ctx.lineTo(pixelX, pixelY + settings.cellSize);
					ctx.stroke();
				}
			}
		}

		// Draw start and end points
		ctx.fillStyle = "#28a745";
		ctx.fillRect(2, 2, settings.cellSize - 4, settings.cellSize - 4);

		ctx.fillStyle = "#dc3545";
		ctx.fillRect(
			(settings.width - 1) * settings.cellSize + 2,
			(settings.height - 1) * settings.cellSize + 2,
			settings.cellSize - 4,
			settings.cellSize - 4,
		);

		// Draw solution path
		if (showSolution && solution.length > 0) {
			ctx.strokeStyle = "#ffc107";
			ctx.lineWidth = 3;
			ctx.lineCap = "round";
			ctx.beginPath();

			for (let i = 0; i < solution.length; i++) {
				const point = solution[i];
				const centerX = point.x * settings.cellSize + settings.cellSize / 2;
				const centerY = point.y * settings.cellSize + settings.cellSize / 2;

				if (i === 0) {
					ctx.moveTo(centerX, centerY);
				} else {
					ctx.lineTo(centerX, centerY);
				}
			}
			ctx.stroke();
		}
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.width = settings.width * settings.cellSize;
		canvas.height = settings.height * settings.cellSize;

		if (maze.length > 0) {
			render();
		}
	}, [maze, settings, showSolution, solution]);

	useEffect(() => {
		const newMaze = initializeMaze();
		setMaze(newMaze);
	}, [settings.width, settings.height]);

	const algorithms = {
		dfs: "Depth-First Search (Recursive Backtracking)",
		kruskal: "Kruskal's Algorithm",
		prim: "Prim's Algorithm",
		"aldous-broder": "Aldous-Broder Algorithm",
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Multi-Algorithm Maze Generator
				</h1>
				<p className="text-gray-600 mb-4">
					Four generation algorithms with animated creation, automatic
					pathfinding, and educational algorithm comparisons.
				</p>
				<div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
					<p className="text-orange-800">
						🔍 Generate mazes with various algorithms, then solve them
						automatically
					</p>
				</div>
			</div>

			<div className="mb-6">
				<div className="flex flex-wrap gap-4 mb-4">
					<button
						type="button"
						onClick={generateMaze}
						disabled={isGenerating}
						className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
					>
						{isGenerating ? "Generating..." : "Generate Maze"}
					</button>
					<button
						type="button"
						onClick={solveMaze}
						disabled={isGenerating || maze.length === 0}
						className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
					>
						Solve Maze
					</button>
					<button
						type="button"
						onClick={() => setShowSolution(false)}
						disabled={!showSolution}
						className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
					>
						Hide Solution
					</button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Algorithm
						</label>
						<select
							value={settings.algorithm}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									algorithm: e.target.value as typeof settings.algorithm,
								}))
							}
							disabled={isGenerating}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
						>
							{Object.entries(algorithms).map(([key, name]) => (
								<option key={key} value={key}>
									{name}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Width: {settings.width}
						</label>
						<input
							type="range"
							min="10"
							max="50"
							value={settings.width}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									width: Number(e.target.value),
								}))
							}
							disabled={isGenerating}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Height: {settings.height}
						</label>
						<input
							type="range"
							min="10"
							max="50"
							value={settings.height}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									height: Number(e.target.value),
								}))
							}
							disabled={isGenerating}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Speed: {settings.animationSpeed}
						</label>
						<input
							type="range"
							min="1"
							max="99"
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
			</div>

			<div className="mb-6">
				<canvas
					ref={canvasRef}
					className="border border-gray-300 rounded-lg bg-white"
					style={{ maxWidth: "100%", height: "auto" }}
				/>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-yellow-800">
						Algorithm Comparison
					</h3>
					<ul className="text-yellow-700 space-y-1">
						<li>
							• <strong>DFS</strong>: Creates long winding passages, uses
							backtracking
						</li>
						<li>
							• <strong>Kruskal's</strong>: Random spanning tree, can create
							loops briefly
						</li>
						<li>
							• <strong>Prim's</strong>: Grows from frontier, creates more
							branched mazes
						</li>
						<li>
							• <strong>Aldous-Broder</strong>: Unbiased algorithm, uniform
							distribution
						</li>
					</ul>
				</div>

				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-blue-800">Features</h3>
					<ul className="text-blue-700 space-y-1">
						<li>
							• <strong>Multiple Algorithms</strong>: Different generation
							strategies
						</li>
						<li>
							• <strong>Animated Generation</strong>: Watch the maze grow step
							by step
						</li>
						<li>
							• <strong>Pathfinding</strong>: Breadth-first search for optimal
							solution
						</li>
						<li>
							• <strong>Customizable Size</strong>: Adjust maze dimensions and
							speed
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6">
				<Link
					to="/examples/visual"
					className="inline-block px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
				>
					← Back to Examples
				</Link>
			</div>
		</div>
	);
}
