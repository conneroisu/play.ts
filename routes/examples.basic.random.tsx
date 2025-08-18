import { createFileRoute, Link } from "@tanstack/react-router";
import {
	noise,
	randomBool,
	randomChoice,
	randomFloat,
	randomGaussian,
	randomInt,
	setSeed as randomSeed,
	SeededRandom,
} from "play.ts";
import { useCallback, useEffect, useState } from "react";

// Simple 2D noise implementation
const noise2D = (x: number, y: number): number => {
	return noise.noise2D(x, y);
};

export const Route = createFileRoute("/examples/basic/random")({
	component: RandomGenerationExample,
});

interface RandomValues {
	floats: number[];
	integers: number[];
	booleans: boolean[];
	choices: string[];
	gaussian: number[];
}

function RandomGenerationExample() {
	const [seed, setSeed] = useState(12345);
	const [randomValues, setRandomValues] = useState<RandomValues>({
		// Use the new interface
		floats: [],
		integers: [],
		booleans: [],
		choices: [],
		gaussian: [],
	});
	const [noiseGrid, setNoiseGrid] = useState<number[][]>([]);

	const generateRandomValues = () => {
		// Set seed for reproducible results
		randomSeed(seed);

		const results = {
			floats: Array.from({ length: 10 }, () => randomFloat(0, 100)),
			integers: Array.from({ length: 10 }, () => randomInt(1, 100)),
			booleans: Array.from({ length: 10 }, () => randomBool()),
			choices: Array.from({ length: 10 }, () =>
				randomChoice(["🎯", "🎮", "🎨", "🎵", "🎪", "🎭", "🎯"]),
			),
			gaussian: Array.from({ length: 100 }, () => randomGaussian(50, 15)),
		};

		setRandomValues(results);
	};

	const generateNoiseGrid = () => {
		const gridSize = 50;
		const scale = 0.1;
		const grid: number[][] = [];

		for (let y = 0; y < gridSize; y++) {
			const row: number[] = [];
			for (let x = 0; x < gridSize; x++) {
				const noiseValue = noise2D(x * scale, y * scale);
				row.push(noiseValue);
			}
			grid.push(row);
		}

		setNoiseGrid(grid);
	};

	useEffect(() => {
		generateRandomValues();
		generateNoiseGrid();
	}, [seed, generateRandomValues, generateNoiseGrid]);

	const HistogramChart = ({
		data,
		title,
		color = "blue",
	}: {
		data: number[];
		title: string;
		color?: string;
	}) => {
		const buckets = 10;
		const min = Math.min(...data);
		const max = Math.max(...data);
		const bucketSize = (max - min) / buckets;

		const histogram = Array(buckets).fill(0);
		for (const value of data) {
			const bucketIndex = Math.min(
				Math.floor((value - min) / bucketSize),
				buckets - 1,
			);
			histogram[bucketIndex]++;
		}

		const maxCount = Math.max(...histogram);

		return (
			<div className="bg-white rounded-lg shadow-md p-4">
				<h3 className="text-lg font-semibold mb-3 text-gray-800">{title}</h3>
				<div className="flex items-end space-x-1 h-32">
					{histogram.map((count, index) => (
						<div
							key={`histogram-bar-${index}`}
							className={`bg-${color}-500 rounded-t transition-all duration-300`}
							style={{
								height: `${(count / maxCount) * 100}%`,
								width: `${100 / buckets}%`,
							}}
							title={`Bucket ${index}: ${count} values`}
						/>
					))}
				</div>
				<div className="text-xs text-gray-600 mt-2">
					Range: {min.toFixed(2)} - {max.toFixed(2)} | Count: {data.length}
				</div>
			</div>
		);
	};

	const NoiseVisualization = () => (
		<div className="bg-white rounded-lg shadow-md p-4">
			<h3 className="text-lg font-semibold mb-3 text-gray-800">
				2D Noise Visualization
			</h3>
			<div
				className="grid grid-cols-50 gap-px border border-gray-300 rounded overflow-hidden"
				style={{ gridTemplateColumns: "repeat(50, 1fr)" }}
			>
				{noiseGrid.flat().map((value, index) => {
					const normalizedValue = (value + 1) / 2; // Normalize from [-1, 1] to [0, 1]
					const intensity = Math.floor(normalizedValue * 255);
					return (
						<div
							key={`noise-cell-${index}`}
							className="w-2 h-2"
							style={{
								backgroundColor: `rgb(${intensity}, ${intensity}, ${intensity})`,
							}}
							title={`Noise: ${value.toFixed(3)}`}
						/>
					);
				})}
			</div>
			<div className="text-xs text-gray-600 mt-2">
				50x50 grid showing Perlin noise values (darker = lower values)
			</div>
		</div>
	);

	const RandomValueDisplay = ({
		title,
		values,
		type,
	}: {
		title: string;
		values: (number | boolean | string)[];
		type: "number" | "boolean" | "choice";
	}) => (
		<div className="bg-white rounded-lg shadow-md p-4">
			<h3 className="text-lg font-semibold mb-3 text-gray-800">{title}</h3>
			<div className="grid grid-cols-5 gap-2">
				{values.slice(0, 10).map((value, index) => (
					<div
						key={`random-value-${index}`}
						className="p-2 bg-gray-100 rounded text-center text-sm font-mono"
					>
						{type === "number" ? value.toFixed(2) : String(value)}
					</div>
				))}
			</div>
		</div>
	);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Random Number Generation Suite
				</h1>
				<p className="text-gray-600 mb-4">
					Seeded randomness with Gaussian distributions, Perlin noise
					visualization, and interactive seed control.
				</p>
				<div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
					<p className="text-orange-800">
						🎲 This example showcases random generation capabilities of the
						play.ts library
					</p>
				</div>
			</div>

			<div className="mb-6">
				<div className="flex items-center space-x-4 mb-4">
					<label
						htmlFor="seedInput"
						className="text-sm font-medium text-gray-700"
					>
						Seed:
					</label>
					<input
						id="seedInput"
						type="number"
						value={seed}
						onChange={(e) => setSeed(Number.parseInt(e.target.value) || 0)}
						className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<button
						onClick={() => {
							generateRandomValues();
							generateNoiseGrid();
						}}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
					>
						Regenerate
					</button>
					<button
						onClick={() => {
							const newSeed = Math.floor(Math.random() * 100000);
							setSeed(newSeed);
						}}
						className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
					>
						Random Seed
					</button>
				</div>
			</div>

			<div className="grid lg:grid-cols-2 gap-6 mb-8">
				{randomValues.floats && (
					<RandomValueDisplay
						title="Random Floats (0-100)"
						values={randomValues.floats}
						type="number"
					/>
				)}
				{randomValues.integers && (
					<RandomValueDisplay
						title="Random Integers (1-100)"
						values={randomValues.integers}
						type="number"
					/>
				)}
				{randomValues.booleans && (
					<RandomValueDisplay
						title="Random Booleans"
						values={randomValues.booleans}
						type="boolean"
					/>
				)}
				{randomValues.choices && (
					<RandomValueDisplay
						title="Random Choices"
						values={randomValues.choices}
						type="choice"
					/>
				)}
			</div>

			<div className="grid lg:grid-cols-2 gap-6 mb-8">
				{randomValues.gaussian && (
					<HistogramChart
						data={randomValues.gaussian}
						title="Gaussian Distribution (μ=50, σ=15)"
						color="purple"
					/>
				)}
				<NoiseVisualization />
			</div>

			<div className="mt-8">
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-yellow-800">
						Key Concepts Demonstrated
					</h3>
					<ul className="text-yellow-700 space-y-1">
						<li>
							• <strong>Seeded Random</strong>: Reproducible random sequences
						</li>
						<li>
							• <strong>Random Floats</strong>: Continuous values within a range
						</li>
						<li>
							• <strong>Random Integers</strong>: Discrete values within a range
						</li>
						<li>
							• <strong>Random Booleans</strong>: True/false values with equal
							probability
						</li>
						<li>
							• <strong>Random Choice</strong>: Selecting from a list of options
						</li>
						<li>
							• <strong>Gaussian Distribution</strong>: Normal distribution with
							mean and standard deviation
						</li>
						<li>
							• <strong>Perlin Noise</strong>: Coherent noise for
							natural-looking randomness
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6">
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-blue-800">
						Usage Tips
					</h3>
					<ul className="text-blue-700 space-y-1">
						<li>• Use the same seed for reproducible results in testing</li>
						<li>
							• Gaussian distribution creates more natural-looking variations
						</li>
						<li>
							• Noise functions are perfect for procedural content generation
						</li>
						<li>
							• Random choice is ideal for picking from predefined options
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6">
				<Link
					to="/examples/basic"
					className="inline-block px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
				>
					← Back to Examples
				</Link>
			</div>
		</div>
	);
}
