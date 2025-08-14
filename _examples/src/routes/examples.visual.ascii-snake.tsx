import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/visual/ascii-snake")({
	component: ASCIISnakeExample,
});

interface Position {
	x: number;
	y: number;
}

interface Food extends Position {
	type: "normal" | "bonus" | "super";
	points: number;
	char: string;
	color: string;
}

interface PowerUp extends Position {
	type: "speed" | "slow" | "double" | "shrink" | "freeze";
	duration: number;
	char: string;
	color: string;
}

interface Effect {
	type: string;
	duration: number;
	startTime: number;
}

type Direction = "up" | "down" | "left" | "right";

function ASCIISnakeExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>(0);
	const gameLoopRef = useRef<number>(0);
	const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
	const [direction, setDirection] = useState<Direction>("right");
	const [food, setFood] = useState<Food[]>([]);
	const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
	const [activeEffects, setActiveEffects] = useState<Effect[]>([]);
	const [score, setScore] = useState(0);
	const [gameState, setGameState] = useState<"playing" | "paused" | "gameOver">(
		"paused",
	);
	const [speed, setSpeed] = useState(200);
	const [difficulty, setDifficulty] = useState("normal");
	const [showGrid, setShowGrid] = useState(false);
	const [colorMode, setColorMode] = useState("classic");
	const [enablePowerUps, setEnablePowerUps] = useState(true);
	const [showEffects, setShowEffects] = useState(true);
	const [gameTimer, setGameTimer] = useState(0);
	const [highScore, setHighScore] = useState(() => {
		return Number.parseInt(localStorage.getItem("snake-high-score") || "0");
	});

	const gridWidth = 40;
	const gridHeight = 25;
	const cellSize = 16;

	const colorSchemes = {
		classic: {
			background: "#000000",
			snake: "#00FF00",
			snakeHead: "#FFFF00",
			food: "#FF0000",
			bonus: "#FF8800",
			super: "#FF00FF",
			grid: "#333333",
			text: "#FFFFFF",
		},
		retro: {
			background: "#1a1a2e",
			snake: "#16213e",
			snakeHead: "#0f3460",
			food: "#e94560",
			bonus: "#f39c12",
			super: "#9b59b6",
			grid: "#444444",
			text: "#ecf0f1",
		},
		neon: {
			background: "#0c0c0c",
			snake: "#00ffff",
			snakeHead: "#ff0080",
			food: "#ffff00",
			bonus: "#ff8000",
			super: "#8000ff",
			grid: "#444444",
			text: "#ffffff",
		},
	};

	const foodTypes = {
		normal: { char: "●", points: 10, spawnChance: 0.7 },
		bonus: { char: "◆", points: 25, spawnChance: 0.2 },
		super: { char: "★", points: 50, spawnChance: 0.1 },
	};

	const powerUpTypes = {
		speed: {
			char: "⚡",
			color: "#FFFF00",
			duration: 5000,
			description: "Speed Boost",
		},
		slow: {
			char: "⏱️",
			color: "#ADD8E6",
			duration: 3000,
			description: "Slow Motion",
		},
		double: {
			char: "×2",
			color: "#FF6A00",
			duration: 10000,
			description: "Double Points",
		},
		shrink: {
			char: "⬇",
			color: "#FF69B4",
			duration: 0,
			description: "Shrink Snake",
		},
		freeze: {
			char: "❄",
			color: "#87CEEB",
			duration: 2000,
			description: "Freeze Time",
		},
	};

	const generateFood = useCallback((): Food => {
		const rand = Math.random();
		let type: "normal" | "bonus" | "super" = "normal";

		if (rand < foodTypes.super.spawnChance) type = "super";
		else if (rand < foodTypes.super.spawnChance + foodTypes.bonus.spawnChance)
			type = "bonus";

		const scheme = colorSchemes[colorMode as keyof typeof colorSchemes];
		const colors = {
			normal: scheme.food,
			bonus: scheme.bonus,
			super: scheme.super,
		};

		let position: Position;
		do {
			position = {
				x: Math.floor(Math.random() * gridWidth),
				y: Math.floor(Math.random() * gridHeight),
			};
		} while (
			snake.some(
				(segment) => segment.x === position.x && segment.y === position.y,
			)
		);

		return {
			...position,
			type,
			points: foodTypes[type].points,
			char: foodTypes[type].char,
			color: colors[type],
		};
	}, [snake, colorMode]);

	const generatePowerUp = useCallback((): PowerUp => {
		if (!enablePowerUps) return null!;

		const types = Object.keys(powerUpTypes) as Array<keyof typeof powerUpTypes>;
		const type = types[Math.floor(Math.random() * types.length)];
		const powerUpData = powerUpTypes[type];

		let position: Position;
		do {
			position = {
				x: Math.floor(Math.random() * gridWidth),
				y: Math.floor(Math.random() * gridHeight),
			};
		} while (
			snake.some(
				(segment) => segment.x === position.x && segment.y === position.y,
			) ||
			food.some((f) => f.x === position.x && f.y === position.y)
		);

		return {
			...position,
			type,
			duration: powerUpData.duration,
			char: powerUpData.char,
			color: powerUpData.color,
		};
	}, [snake, food, enablePowerUps]);

	const resetGame = useCallback(() => {
		setSnake([{ x: 10, y: 10 }]);
		setDirection("right");
		setFood([]);
		setPowerUps([]);
		setActiveEffects([]);
		setScore(0);
		setGameTimer(0);
		setGameState("paused");

		// Generate initial food
		setTimeout(() => {
			setFood([generateFood()]);
		}, 100);
	}, [generateFood]);

	const moveSnake = useCallback(() => {
		if (gameState !== "playing") return;

		setSnake((currentSnake) => {
			const newSnake = [...currentSnake];
			const head = { ...newSnake[0] };

			// Move head based on direction
			switch (direction) {
				case "up":
					head.y -= 1;
					break;
				case "down":
					head.y += 1;
					break;
				case "left":
					head.x -= 1;
					break;
				case "right":
					head.x += 1;
					break;
			}

			// Check wall collision
			if (
				head.x < 0 ||
				head.x >= gridWidth ||
				head.y < 0 ||
				head.y >= gridHeight
			) {
				setGameState("gameOver");
				return currentSnake;
			}

			// Check self collision
			if (
				newSnake.some((segment) => segment.x === head.x && segment.y === head.y)
			) {
				setGameState("gameOver");
				return currentSnake;
			}

			newSnake.unshift(head);

			// Check food collision
			let foodEaten = false;
			setFood((currentFood) => {
				const eatenFoodIndex = currentFood.findIndex(
					(f) => f.x === head.x && f.y === head.y,
				);

				if (eatenFoodIndex !== -1) {
					foodEaten = true;
					const eatenFood = currentFood[eatenFoodIndex];

					// Apply double points effect
					const doublePoints = activeEffects.some(
						(effect) => effect.type === "double",
					);
					const points = doublePoints ? eatenFood.points * 2 : eatenFood.points;

					setScore((prevScore) => {
						const newScore = prevScore + points;
						if (newScore > highScore) {
							setHighScore(newScore);
							localStorage.setItem("snake-high-score", newScore.toString());
						}
						return newScore;
					});

					// Generate new food
					const newFood = [...currentFood];
					newFood.splice(eatenFoodIndex, 1);

					// Add new food based on difficulty
					const maxFood =
						difficulty === "easy" ? 3 : difficulty === "normal" ? 2 : 1;
					if (newFood.length < maxFood) {
						newFood.push(generateFood());
					}

					return newFood;
				}

				return currentFood;
			});

			// Check power-up collision
			setPowerUps((currentPowerUps) => {
				const eatenPowerUpIndex = currentPowerUps.findIndex(
					(p) => p.x === head.x && p.y === head.y,
				);

				if (eatenPowerUpIndex !== -1) {
					const eatenPowerUp = currentPowerUps[eatenPowerUpIndex];

					// Apply power-up effect
					setActiveEffects((prevEffects) => {
						const newEffects = [...prevEffects];

						if (eatenPowerUp.type === "shrink") {
							// Immediate effect - shrink snake
							setSnake((prevSnake) =>
								prevSnake.slice(
									0,
									Math.max(1, Math.floor(prevSnake.length / 2)),
								),
							);
						} else {
							// Timed effect
							newEffects.push({
								type: eatenPowerUp.type,
								duration: eatenPowerUp.duration,
								startTime: Date.now(),
							});
						}

						return newEffects;
					});

					// Remove eaten power-up
					const newPowerUps = [...currentPowerUps];
					newPowerUps.splice(eatenPowerUpIndex, 1);
					return newPowerUps;
				}

				return currentPowerUps;
			});

			// Remove tail if no food eaten
			if (!foodEaten) {
				newSnake.pop();
			}

			return newSnake;
		});
	}, [
		direction,
		gameState,
		gridWidth,
		gridHeight,
		generateFood,
		difficulty,
		highScore,
		activeEffects,
	]);

	// Manage game timer and effects
	useEffect(() => {
		if (gameState !== "playing") return;

		const interval = setInterval(() => {
			setGameTimer((prev) => prev + 1);

			// Update active effects
			setActiveEffects((prevEffects) => {
				const now = Date.now();
				return prevEffects.filter(
					(effect) => now - effect.startTime < effect.duration,
				);
			});

			// Spawn power-ups randomly
			if (enablePowerUps && Math.random() < 0.005) {
				// 0.5% chance per second
				setPowerUps((prevPowerUps) => {
					if (prevPowerUps.length < 2) {
						const newPowerUp = generatePowerUp();
						if (newPowerUp) {
							return [...prevPowerUps, newPowerUp];
						}
					}
					return prevPowerUps;
				});
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [gameState, enablePowerUps, generatePowerUp]);

	// Handle keyboard input
	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			e.preventDefault();

			switch (e.key) {
				case "ArrowUp":
				case "w":
				case "W":
					if (direction !== "down") setDirection("up");
					break;
				case "ArrowDown":
				case "s":
				case "S":
					if (direction !== "up") setDirection("down");
					break;
				case "ArrowLeft":
				case "a":
				case "A":
					if (direction !== "right") setDirection("left");
					break;
				case "ArrowRight":
				case "d":
				case "D":
					if (direction !== "left") setDirection("right");
					break;
				case " ":
					if (gameState === "playing") {
						setGameState("paused");
					} else if (gameState === "paused") {
						setGameState("playing");
					}
					break;
				case "r":
				case "R":
					resetGame();
					break;
			}
		};

		window.addEventListener("keydown", handleKeyPress);
		return () => window.removeEventListener("keydown", handleKeyPress);
	}, [direction, gameState, resetGame]);

	// Game loop with effects
	useEffect(() => {
		if (gameState === "playing") {
			// Check for freeze effect
			const isFrozen = activeEffects.some((effect) => effect.type === "freeze");
			if (isFrozen) return;

			// Calculate speed based on effects
			let effectiveSpeed = speed;
			const hasSpeedBoost = activeEffects.some(
				(effect) => effect.type === "speed",
			);
			const hasSlowMotion = activeEffects.some(
				(effect) => effect.type === "slow",
			);

			if (hasSpeedBoost) effectiveSpeed = Math.max(50, speed * 0.5);
			if (hasSlowMotion) effectiveSpeed = speed * 2;

			gameLoopRef.current = window.setInterval(moveSnake, effectiveSpeed);
		} else {
			if (gameLoopRef.current) {
				clearInterval(gameLoopRef.current);
			}
		}

		return () => {
			if (gameLoopRef.current) {
				clearInterval(gameLoopRef.current);
			}
		};
	}, [gameState, speed, moveSnake, activeEffects]);

	// Generate initial food
	useEffect(() => {
		if (food.length === 0 && gameState !== "gameOver") {
			setFood([generateFood()]);
		}
	}, [food.length, gameState, generateFood]);

	// Rendering
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const render = () => {
			const scheme = colorSchemes[colorMode as keyof typeof colorSchemes];

			// Clear canvas
			ctx.fillStyle = scheme.background;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Draw grid
			if (showGrid) {
				ctx.strokeStyle = scheme.grid;
				ctx.lineWidth = 1;

				for (let x = 0; x <= gridWidth; x++) {
					ctx.beginPath();
					ctx.moveTo(x * cellSize, 0);
					ctx.lineTo(x * cellSize, gridHeight * cellSize);
					ctx.stroke();
				}

				for (let y = 0; y <= gridHeight; y++) {
					ctx.beginPath();
					ctx.moveTo(0, y * cellSize);
					ctx.lineTo(gridWidth * cellSize, y * cellSize);
					ctx.stroke();
				}
			}

			// Draw snake
			ctx.font = `${cellSize - 2}px "Courier New", monospace`;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";

			snake.forEach((segment, index) => {
				const x = segment.x * cellSize;
				const y = segment.y * cellSize;

				if (index === 0) {
					// Head
					ctx.fillStyle = scheme.snakeHead;
					ctx.fillText("●", x + cellSize / 2, y + cellSize / 2);
				} else {
					// Body
					ctx.fillStyle = scheme.snake;
					ctx.fillText("█", x + cellSize / 2, y + cellSize / 2);
				}
			});

			// Draw food
			food.forEach((f) => {
				const x = f.x * cellSize;
				const y = f.y * cellSize;

				ctx.fillStyle = f.color;
				ctx.fillText(f.char, x + cellSize / 2, y + cellSize / 2);
			});

			// Draw power-ups
			powerUps.forEach((p) => {
				const x = p.x * cellSize;
				const y = p.y * cellSize;

				ctx.fillStyle = p.color;
				ctx.fillText(p.char, x + cellSize / 2, y + cellSize / 2);
			});

			// Draw UI overlay
			ctx.font = '20px "Courier New", monospace';
			ctx.fillStyle = scheme.text;
			ctx.textAlign = "left";
			ctx.fillText(`Score: ${score}`, 10, 30);
			ctx.fillText(`High: ${highScore}`, 10, 55);
			ctx.fillText(`Time: ${gameTimer}s`, 10, 80);

			// Draw active effects
			if (showEffects && activeEffects.length > 0) {
				ctx.font = '14px "Courier New", monospace';
				activeEffects.forEach((effect, index) => {
					const powerUpData =
						powerUpTypes[effect.type as keyof typeof powerUpTypes];
					const timeLeft = Math.max(
						0,
						Math.ceil(
							(effect.duration - (Date.now() - effect.startTime)) / 1000,
						),
					);
					const effectText = `${powerUpData.char} ${powerUpData.description}: ${timeLeft}s`;

					ctx.fillStyle = powerUpData.color;
					ctx.fillText(effectText, canvas.width - 200, 30 + index * 20);
				});

				// Reset font
				ctx.font = '20px "Courier New", monospace';
				ctx.fillStyle = scheme.text;
			}

			if (gameState === "paused") {
				ctx.font = '24px "Courier New", monospace';
				ctx.textAlign = "center";
				ctx.fillText(
					"PAUSED - Press SPACE to continue",
					canvas.width / 2,
					canvas.height / 2,
				);
			} else if (gameState === "gameOver") {
				ctx.font = '32px "Courier New", monospace';
				ctx.fillStyle = "#FF0000";
				ctx.textAlign = "center";
				ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
				ctx.font = '18px "Courier New", monospace';
				ctx.fillStyle = scheme.text;
				ctx.fillText(
					"Press R to restart",
					canvas.width / 2,
					canvas.height / 2 + 20,
				);
			}

			animationRef.current = requestAnimationFrame(render);
		};

		const resizeCanvas = () => {
			canvas.width = gridWidth * cellSize;
			canvas.height = gridHeight * cellSize;
		};

		resizeCanvas();
		render();

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [
		snake,
		food,
		powerUps,
		activeEffects,
		score,
		highScore,
		gameState,
		showGrid,
		colorMode,
		gameTimer,
		showEffects,
	]);

	const handleDifficultyChange = (newDifficulty: string) => {
		setDifficulty(newDifficulty);
		const speeds = { easy: 300, normal: 200, hard: 100, insane: 50 };
		setSpeed(speeds[newDifficulty as keyof typeof speeds]);
	};

	return (
		<div className="flex flex-col h-screen bg-gray-900">
			<div className="flex-shrink-0 bg-gray-800 p-4 border-b border-gray-700">
				<h1 className="text-2xl font-bold text-green-400 mb-4">
					🐍 ASCII Snake Game
				</h1>

				<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-sm mb-4">
					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Game Control</label>
						<button
							onClick={() => {
								if (gameState === "gameOver") {
									resetGame();
								} else {
									setGameState(gameState === "playing" ? "paused" : "playing");
								}
							}}
							className={`px-3 py-2 rounded font-medium transition-colors ${
								gameState === "gameOver"
									? "bg-blue-600 hover:bg-blue-700 text-white"
									: gameState === "playing"
										? "bg-red-600 hover:bg-red-700 text-white"
										: "bg-green-600 hover:bg-green-700 text-white"
							}`}
						>
							{gameState === "gameOver"
								? "New Game"
								: gameState === "playing"
									? "Pause"
									: "Start"}
						</button>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Difficulty</label>
						<select
							value={difficulty}
							onChange={(e) => handleDifficultyChange(e.target.value)}
							className="px-2 py-1 bg-gray-700 text-green-300 rounded border border-gray-600"
						>
							<option value="easy">Easy</option>
							<option value="normal">Normal</option>
							<option value="hard">Hard</option>
							<option value="insane">Insane</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Color Theme</label>
						<select
							value={colorMode}
							onChange={(e) => setColorMode(e.target.value)}
							className="px-2 py-1 bg-gray-700 text-green-300 rounded border border-gray-600"
						>
							<option value="classic">Classic</option>
							<option value="retro">Retro</option>
							<option value="neon">Neon</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Show Grid</label>
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={showGrid}
								onChange={(e) => setShowGrid(e.target.checked)}
								className="mr-2"
							/>
							<span className="text-green-300">Enabled</span>
						</label>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Current Score</label>
						<div className="text-green-400 font-mono text-lg">{score}</div>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">High Score</label>
						<div className="text-yellow-400 font-mono text-lg">{highScore}</div>
					</div>

					<div className="flex flex-col">
						<label className="text-green-300 mb-2">Game Time</label>
						<div className="text-blue-400 font-mono text-lg">{gameTimer}s</div>
					</div>

					<div className="flex flex-col gap-2">
						<label className="flex items-center text-green-300 text-xs">
							<input
								type="checkbox"
								checked={enablePowerUps}
								onChange={(e) => setEnablePowerUps(e.target.checked)}
								className="mr-2"
							/>
							Power-ups
						</label>
						<label className="flex items-center text-green-300 text-xs">
							<input
								type="checkbox"
								checked={showEffects}
								onChange={(e) => setShowEffects(e.target.checked)}
								className="mr-2"
							/>
							Show Effects
						</label>
					</div>
				</div>

				<div className="text-green-400 text-sm">
					<p>
						🎮 <strong>Controls:</strong> Arrow Keys / WASD to move, SPACE to
						pause, R to restart
					</p>
					<p>
						🍎 <strong>Food:</strong> Normal (●) = 10pts | Bonus (◆) = 25pts |
						Super (★) = 50pts
					</p>
					<p>
						⚡ <strong>Power-ups:</strong> Speed Boost (⚡) | Slow Motion (⏱️) |
						Double Points (×2) | Shrink (⬇) | Freeze Time (❄)
					</p>
				</div>
			</div>

			<div className="flex-1 flex items-center justify-center bg-gray-900">
				<div className="relative">
					<canvas
						ref={canvasRef}
						className="border-2 border-gray-600 rounded"
						tabIndex={0}
						style={{
							background:
								colorSchemes[colorMode as keyof typeof colorSchemes].background,
							outline: "none",
							maxWidth: "100%",
							height: "auto",
						}}
					/>

					{gameState === "paused" && snake.length === 1 && (
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="bg-black bg-opacity-75 text-white p-6 rounded-lg text-center">
								<h2 className="text-xl font-bold mb-4">Ready to Play?</h2>
								<p className="mb-2">
									Use arrow keys or WASD to control the snake
								</p>
								<p className="mb-4">
									Eat food to grow and increase your score!
								</p>
								<button
									onClick={() => setGameState("playing")}
									className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
								>
									Start Game
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
