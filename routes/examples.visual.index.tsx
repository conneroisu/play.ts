import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/examples/visual/")({
	component: VisualExamplesPage,
});

function VisualExamplesPage() {
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const visualExamples = [
		{
			name: "ASCII Matrix Rain",
			path: "/examples/visual/ascii-matrix",
			description:
				"Interactive Matrix-style digital rain with Japanese characters, click-to-spawn streams, and multiple color schemes",
			tags: ["ASCII", "Matrix", "Animation", "Interactive"],
			complexity: "Intermediate",
			category: "ASCII Art",
		},
		{
			name: "ASCII Fire Simulation",
			path: "/examples/visual/ascii-fire",
			description:
				"Real-time fire physics with heat diffusion, wind effects, click-to-ignite interactions, and temperature visualization",
			tags: ["ASCII", "Fire", "Physics", "Simulation"],
			complexity: "Advanced",
			category: "ASCII Art",
		},
		{
			name: "ASCII Digital Clock",
			path: "/examples/visual/ascii-clock",
			description:
				"7-segment digital display and analog clock with multiple color schemes, time formats, and glow effects",
			tags: ["ASCII", "Clock", "Digital", "Time"],
			complexity: "Intermediate",
			category: "ASCII Art",
		},
		{
			name: "ASCII Snake Game",
			path: "/examples/visual/ascii-snake",
			description:
				"Classic Snake game with multiple food types, difficulty levels, high scores, and keyboard controls",
			tags: ["ASCII", "Game", "Snake", "Interactive"],
			complexity: "Advanced",
			category: "ASCII Art",
		},
		{
			name: "ASCII Server Load Monitor",
			path: "/examples/visual/ascii-server-load",
			description:
				"Real-time server infrastructure monitoring with load visualization, network packet flow, and alert systems",
			tags: ["ASCII", "Server", "Monitoring", "Infrastructure"],
			complexity: "Advanced",
			category: "ASCII Art",
		},
		{
			name: "ASCII Cloud Infrastructure",
			path: "/examples/visual/ascii-cloud-infrastructure",
			description:
				"Multi-region cloud infrastructure with auto-scaling, resource monitoring, and data flow visualization",
			tags: ["ASCII", "Cloud", "Infrastructure", "Monitoring"],
			complexity: "Expert",
			category: "ASCII Art",
		},
		{
			name: "ASCII GPU Cluster Monitor",
			path: "/examples/visual/ascii-gpu-cluster",
			description:
				"High-performance GPU cluster with job scheduling, thermal monitoring, and distributed compute tasks",
			tags: ["ASCII", "GPU", "Cluster", "HPC"],
			complexity: "Expert",
			category: "ASCII Art",
		},
		{
			name: "ASCII Distributed Database",
			path: "/examples/visual/ascii-distributed-database",
			description:
				"Distributed database cluster with consistency monitoring, replication lag, and CAP theorem simulation",
			tags: ["ASCII", "Database", "Distributed", "Consistency"],
			complexity: "Expert",
			category: "ASCII Art",
		},
		{
			name: "Interactive Shape Canvas",
			path: "/examples/visual/basic-shapes",
			description:
				"Click-to-add geometric shapes with real-time area calculations, rotation, and optional floating animations",
			tags: ["Shapes", "Canvas", "Interactive", "Geometry"],
			complexity: "Beginner",
			category: "Graphics",
		},
		{
			name: "Multi-Object Animation Showcase",
			path: "/examples/visual/animation-demo",
			description:
				"Six animated objects demonstrating different easing functions with timeline visualization and interactive controls",
			tags: ["Animation", "Easing", "Timeline", "Interactive"],
			complexity: "Intermediate",
			category: "Animation",
		},
		{
			name: "Advanced Particle Physics System",
			path: "/examples/visual/particle-system",
			description:
				"Multiple forces, interactive mouse controls, visual trails, and real-time physics parameter adjustment",
			tags: ["Physics", "Particles", "Forces", "Interactive"],
			complexity: "Advanced",
			category: "Physics",
		},
		{
			name: "Interactive Mandelbrot Set Explorer",
			path: "/examples/visual/mandelbrot",
			description:
				"Real-time fractal computation with infinite zoom, multiple color palettes, and progressive rendering",
			tags: ["Fractals", "Math", "Zoom", "Mandelbrot"],
			complexity: "Advanced",
			category: "Fractals",
		},
		{
			name: "Conway's Game of Life Simulator",
			path: "/examples/visual/game-of-life",
			description:
				"Complete cellular automata with famous patterns, interactive editing, and educational rule visualization",
			tags: ["Automata", "Patterns", "Interactive", "Conway"],
			complexity: "Intermediate",
			category: "Algorithms",
		},
		{
			name: "L-System Fractal Generator",
			path: "/examples/visual/l-system",
			description:
				"Six mathematical fractals with turtle graphics, animated drawing, SVG export, and educational rule explanations",
			tags: ["L-Systems", "Fractals", "Turtle Graphics", "SVG"],
			complexity: "Advanced",
			category: "Fractals",
		},
		{
			name: "Advanced Ray Marching 3D Renderer",
			path: "/examples/visual/ray-marching",
			description:
				"Signed distance fields with multiple primitives, debug visualization, and interactive camera controls",
			tags: ["3D", "Ray Marching", "SDF", "Rendering"],
			complexity: "Expert",
			category: "3D Graphics",
		},
		{
			name: "Multi-Algorithm Maze Generator",
			path: "/examples/visual/maze-generator",
			description:
				"Four generation algorithms with animated creation, automatic pathfinding, and educational algorithm comparisons",
			tags: ["Algorithms", "Maze", "Pathfinding", "Animation"],
			complexity: "Intermediate",
			category: "Algorithms",
		},
		{
			name: "Craig Reynolds Boids Flocking",
			path: "/examples/visual/flocking",
			description:
				"Complete emergent behavior simulation with interactive forces, real-time parameters, and visual debugging",
			tags: ["Boids", "Flocking", "AI", "Simulation"],
			complexity: "Advanced",
			category: "AI/Simulation",
		},
		{
			name: "Advanced Wave Physics Simulator",
			path: "/examples/visual/wave-interference",
			description:
				"Multi-source interference with real-time controls, preset patterns, and educational wave mechanics",
			tags: ["Physics", "Waves", "Interference", "Simulation"],
			complexity: "Advanced",
			category: "Physics",
		},
		{
			name: "Interactive Voronoi Tessellation",
			path: "/examples/visual/voronoi",
			description:
				"Lloyd's relaxation optimization with multiple patterns, click-to-add sites, and educational visualizations",
			tags: ["Voronoi", "Tessellation", "Geometry", "Interactive"],
			complexity: "Advanced",
			category: "Algorithms",
		},
		{
			name: "Verlet Integration Soft Body Physics",
			path: "/examples/visual/soft-body",
			description:
				"Three body types with interactive manipulation, real-time physics parameters, and pressure visualization",
			tags: ["Physics", "Soft Body", "Verlet", "Interactive"],
			complexity: "Expert",
			category: "Physics",
		},
		{
			name: "Advanced 3D Software Renderer",
			path: "/examples/visual/3d-wireframe",
			description:
				"Complete 3D engine with matrix math, multiple primitives, lighting, and interactive camera controls",
			tags: ["3D", "Rendering", "Matrix", "Lighting"],
			complexity: "Expert",
			category: "3D Graphics",
		},
		{
			name: "Fractal Tree Generator",
			path: "/examples/visual/fractal-tree",
			description:
				"Recursive fractal tree generation with interactive parameters and real-time visualization",
			tags: ["Fractals", "Trees", "Recursive", "Interactive"],
			complexity: "Intermediate",
			category: "Fractals",
		},
		{
			name: "Fluid Dynamics Simulation",
			path: "/examples/visual/fluid-dynamics",
			description:
				"Real-time fluid physics simulation with interactive visualization",
			tags: ["Physics", "Fluids", "Simulation", "Interactive"],
			complexity: "Expert",
			category: "Physics",
		},
		{
			name: "Galaxy Simulation",
			path: "/examples/visual/galaxy-simulation",
			description: "N-body gravitational simulation with particle interactions",
			tags: ["Physics", "Gravity", "N-body", "Space"],
			complexity: "Expert",
			category: "Physics",
		},
		{
			name: "Neural Network Visualization",
			path: "/examples/visual/neural-network",
			description: "Interactive neural network training and visualization",
			tags: ["AI", "Neural Networks", "Machine Learning", "Interactive"],
			complexity: "Expert",
			category: "AI/Simulation",
		},
		{
			name: "Quantum Simulation",
			path: "/examples/visual/quantum-simulation",
			description: "Quantum mechanics visualization and simulation",
			tags: ["Physics", "Quantum", "Simulation", "Visualization"],
			complexity: "Expert",
			category: "Physics",
		},
	];

	const getComplexityColor = (complexity: string) => {
		switch (complexity) {
			case "Beginner":
				return "text-green-600 bg-green-100";
			case "Intermediate":
				return "text-yellow-600 bg-yellow-100";
			case "Advanced":
				return "text-orange-600 bg-orange-100";
			case "Expert":
				return "text-red-600 bg-red-100";
			default:
				return "text-gray-600 bg-gray-100";
		}
	};

	const getCategoryColor = (category: string) => {
		switch (category) {
			case "ASCII Art":
				return "text-lime-600 bg-lime-100";
			case "Graphics":
				return "text-blue-600 bg-blue-100";
			case "Animation":
				return "text-purple-600 bg-purple-100";
			case "Physics":
				return "text-green-600 bg-green-100";
			case "Fractals":
				return "text-pink-600 bg-pink-100";
			case "Algorithms":
				return "text-indigo-600 bg-indigo-100";
			case "3D Graphics":
				return "text-cyan-600 bg-cyan-100";
			case "AI/Simulation":
				return "text-yellow-600 bg-yellow-100";
			default:
				return "text-gray-600 bg-gray-100";
		}
	};

	const categories = [...new Set(visualExamples.map((ex) => ex.category))];

	const filteredExamples = selectedCategory
		? visualExamples.filter((example) => example.category === selectedCategory)
		: visualExamples;

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">🎨 Visual Examples</h1>
				<p className="text-gray-600 mb-6">
					Advanced interactive demonstrations showcasing graphics programming,
					physics simulation, mathematical visualization, and algorithmic art.
				</p>
				<div className="bg-green-50 border border-green-200 rounded-lg p-4">
					<p className="text-green-800">
						🚀 These examples demonstrate advanced concepts and sophisticated
						implementations
					</p>
				</div>
			</div>

			<div className="mb-8">
				<div className="mb-4">
					<span className="text-gray-700 font-medium">Categories:</span>
				</div>
				<div className="flex flex-wrap gap-2 text-sm mb-3">
					<button
						onClick={() => setSelectedCategory(null)}
						className={`px-3 py-1 rounded-full transition-colors cursor-pointer hover:opacity-80 ${
							selectedCategory === null
								? "bg-gray-200 text-gray-800 font-medium ring-2 ring-gray-400"
								: "bg-gray-100 text-gray-600"
						}`}
					>
						All ({visualExamples.length})
					</button>
					{categories.map((category) => {
						const count = visualExamples.filter(
							(ex) => ex.category === category,
						).length;
						const isSelected = selectedCategory === category;
						return (
							<button
								key={category}
								onClick={() =>
									setSelectedCategory(isSelected ? null : category)
								}
								className={`px-3 py-1 rounded-full transition-colors cursor-pointer hover:opacity-80 ${
									isSelected
										? `${getCategoryColor(category)} font-medium ring-2 ring-opacity-50`
										: getCategoryColor(category)
								}`}
							>
								{category} ({count})
							</button>
						);
					})}
				</div>
				{selectedCategory && (
					<div className="text-sm text-gray-600">
						Showing examples for:{" "}
						<span className="font-medium">{selectedCategory}</span>
						<button
							onClick={() => setSelectedCategory(null)}
							className="ml-2 text-green-600 hover:text-green-800 underline"
						>
							Clear filter
						</button>
					</div>
				)}
			</div>

			<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
				{filteredExamples.map((example) => (
					<Link
						key={example.path}
						to={example.path}
						className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-all border hover:border-green-300 group"
					>
						<div className="flex justify-between items-start mb-3">
							<h3 className="text-lg font-semibold text-green-600 group-hover:text-green-700 leading-tight">
								{example.name}
							</h3>
							<div className="flex flex-col gap-1 ml-2">
								<span
									className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getComplexityColor(example.complexity)}`}
								>
									{example.complexity}
								</span>
								<span
									className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getCategoryColor(example.category)}`}
								>
									{example.category}
								</span>
							</div>
						</div>
						<p className="text-gray-600 mb-4 text-sm">{example.description}</p>
						<div className="flex flex-wrap gap-1">
							{example.tags.map((tag) => (
								<span
									key={tag}
									className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
								>
									{tag}
								</span>
							))}
						</div>
					</Link>
				))}
			</div>

			<div className="mt-12 grid md:grid-cols-2 gap-8">
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
					<h3 className="text-lg font-semibold mb-3 text-blue-800">
						Complexity Guide
					</h3>
					<div className="space-y-2 text-blue-700 text-sm">
						<div className="flex items-center gap-2">
							<span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs font-medium">
								Beginner
							</span>
							<span>Basic graphics concepts</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="px-2 py-1 bg-yellow-100 text-yellow-600 rounded text-xs font-medium">
								Intermediate
							</span>
							<span>Requires some math knowledge</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="px-2 py-1 bg-orange-100 text-orange-600 rounded text-xs font-medium">
								Advanced
							</span>
							<span>Complex algorithms & physics</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-medium">
								Expert
							</span>
							<span>Sophisticated implementations</span>
						</div>
					</div>
				</div>

				<div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
					<h3 className="text-lg font-semibold mb-3 text-purple-800">
						Recommended Learning Path
					</h3>
					<div className="space-y-2 text-purple-700 text-sm">
						<p>
							<strong>1. Start with Graphics:</strong> Basic shapes and canvas
							fundamentals
						</p>
						<p>
							<strong>2. Add Animation:</strong> Bring static graphics to life
						</p>
						<p>
							<strong>3. Explore Algorithms:</strong> Maze generation and
							cellular automata
						</p>
						<p>
							<strong>4. Dive into Physics:</strong> Particle systems and
							simulations
						</p>
						<p>
							<strong>5. Master Advanced:</strong> 3D rendering and complex
							mathematics
						</p>
					</div>
				</div>
			</div>

			<div className="mt-8 text-center">
				<Link
					to="/examples/basic"
					className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
				>
					← Back to Basic Examples
				</Link>
			</div>
		</div>
	);
}
