import { BookOpen, Hash, Search, Settings, X, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { createUrl } from "@/lib/utils";

interface Example {
	name: string;
	path: string;
	description: string;
	category: "basic" | "advanced" | "visual";
	keywords: string[];
}

const allExamples: Example[] = [
	// Basic Examples
	{
		name: "Mathematical Functions Reference",
		path: "/examples/basic/math",
		description:
			"Comprehensive showcase of play.ts's math utilities with vector operations, constants, and edge case examples",
		category: "basic",
		keywords: [
			"math",
			"vector",
			"interpolation",
			"clamp",
			"lerp",
			"geometry",
			"functions",
			"constants",
		],
	},
	{
		name: "Color Space Conversion Studio",
		path: "/examples/basic/color",
		description:
			"Interactive HSL/RGB color space conversions with live preview and color theory demonstrations",
		category: "basic",
		keywords: [
			"color",
			"hsl",
			"rgb",
			"conversion",
			"palette",
			"hue",
			"studio",
			"theory",
		],
	},
	{
		name: "Interactive Easing Functions Showcase",
		path: "/examples/basic/animation",
		description:
			"Visual demonstration of all easing functions with interactive controls and animation timing",
		category: "basic",
		keywords: [
			"animation",
			"easing",
			"tween",
			"transition",
			"smooth",
			"timing",
			"interactive",
			"functions",
		],
	},
	{
		name: "Random Number Generation Suite",
		path: "/examples/basic/random",
		description:
			"Pseudo-random number generation with seeding, distributions, and visualization tools",
		category: "basic",
		keywords: [
			"random",
			"noise",
			"seed",
			"generation",
			"probability",
			"gaussian",
			"distribution",
		],
	},
	{
		name: "Interactive Vector Mathematics Lab",
		path: "/examples/basic/geometry",
		description:
			"Interactive 2D geometry calculations with vector operations and geometric visualizations",
		category: "basic",
		keywords: [
			"geometry",
			"shapes",
			"vector",
			"collision",
			"distance",
			"angle",
			"interactive",
			"mathematics",
		],
	},

	// Visual Examples
	{
		name: "Interactive Shape Canvas",
		path: "/examples/visual/basic-shapes",
		description:
			"Fundamental shape rendering with interactive controls and animation effects",
		category: "visual",
		keywords: [
			"shapes",
			"canvas",
			"drawing",
			"render",
			"circle",
			"rectangle",
			"interactive",
		],
	},
	{
		name: "Multi-Object Animation Showcase",
		path: "/examples/visual/animation-demo",
		description:
			"Complex animation system with multiple objects, easing functions, and timing controls",
		category: "visual",
		keywords: [
			"animation",
			"demo",
			"easing",
			"visual",
			"interactive",
			"canvas",
			"multi-object",
		],
	},
	{
		name: "Advanced Particle Physics System",
		path: "/examples/visual/particle-system",
		description:
			"Complex particle effects with gravity, collisions, and force-based interactions",
		category: "visual",
		keywords: [
			"particles",
			"physics",
			"effects",
			"gravity",
			"forces",
			"simulation",
			"advanced",
		],
	},
	{
		name: "Interactive Mandelbrot Set Explorer",
		path: "/examples/visual/mandelbrot",
		description:
			"Real-time fractal computation with infinite zoom, multiple color palettes, and progressive rendering",
		category: "visual",
		keywords: [
			"mandelbrot",
			"fractal",
			"zoom",
			"complex",
			"mathematics",
			"explorer",
			"interactive",
			"set",
		],
	},
	{
		name: "Conway's Game of Life Simulator",
		path: "/examples/visual/game-of-life",
		description:
			"Complete cellular automata with famous patterns, interactive editing, and educational rule visualization",
		category: "visual",
		keywords: [
			"automata",
			"patterns",
			"interactive",
			"conway",
			"cellular",
			"game",
			"life",
			"simulator",
		],
	},
	{
		name: "Advanced Wave Physics Simulator",
		path: "/examples/visual/wave-interference",
		description:
			"Multi-source interference with real-time controls, preset patterns, and educational wave mechanics",
		category: "visual",
		keywords: [
			"physics",
			"waves",
			"interference",
			"simulation",
			"wave",
			"frequency",
			"amplitude",
		],
	},
	{
		name: "Interactive Voronoi Tessellation",
		path: "/examples/visual/voronoi",
		description:
			"Lloyd's relaxation optimization with multiple patterns, click-to-add sites, and educational visualizations",
		category: "visual",
		keywords: [
			"voronoi",
			"tessellation",
			"geometry",
			"interactive",
			"lloyd",
			"relaxation",
			"sites",
		],
	},
	{
		name: "L-System Fractal Generator",
		path: "/examples/visual/l-system",
		description:
			"Six mathematical fractals with turtle graphics, animated drawing, SVG export, and educational rule explanations",
		category: "visual",
		keywords: [
			"l-systems",
			"fractals",
			"turtle",
			"graphics",
			"svg",
			"procedural",
			"generation",
		],
	},
	{
		name: "Advanced Ray Marching 3D Renderer",
		path: "/examples/visual/ray-marching",
		description:
			"Signed distance fields with multiple primitives, debug visualization, and interactive camera controls",
		category: "visual",
		keywords: [
			"3d",
			"ray",
			"marching",
			"sdf",
			"rendering",
			"primitives",
			"signed",
			"distance",
		],
	},
	{
		name: "Multi-Algorithm Maze Generator",
		path: "/examples/visual/maze-generator",
		description:
			"Four generation algorithms with animated creation, automatic pathfinding, and educational algorithm comparisons",
		category: "visual",
		keywords: [
			"algorithms",
			"maze",
			"pathfinding",
			"animation",
			"generation",
			"recursive",
			"backtracking",
		],
	},
	{
		name: "Craig Reynolds Boids Flocking",
		path: "/examples/visual/flocking",
		description:
			"Complete emergent behavior simulation with interactive forces, real-time parameters, and visual debugging",
		category: "visual",
		keywords: [
			"boids",
			"flocking",
			"ai",
			"simulation",
			"emergent",
			"behavior",
			"reynolds",
			"swarm",
		],
	},
	{
		name: "Verlet Integration Soft Body Physics",
		path: "/examples/visual/soft-body",
		description:
			"Three body types with interactive manipulation, real-time physics parameters, and pressure visualization",
		category: "visual",
		keywords: [
			"physics",
			"soft",
			"body",
			"verlet",
			"interactive",
			"pressure",
			"integration",
		],
	},
	{
		name: "Advanced 3D Software Renderer",
		path: "/examples/visual/3d-wireframe",
		description:
			"Complete 3D engine with matrix math, multiple primitives, lighting, and interactive camera controls",
		category: "visual",
		keywords: [
			"3d",
			"rendering",
			"matrix",
			"lighting",
			"wireframe",
			"software",
			"engine",
		],
	},
	{
		name: "Fractal Tree Generator",
		path: "/examples/visual/fractal-tree",
		description:
			"Recursive fractal tree generation with interactive parameters and real-time visualization",
		category: "visual",
		keywords: [
			"fractals",
			"trees",
			"recursive",
			"interactive",
			"generation",
			"parameters",
		],
	},
	{
		name: "ASCII Fire Simulation",
		path: "/examples/visual/ascii-fire",
		description:
			"Real-time fire physics with heat diffusion, wind effects, click-to-ignite interactions, and temperature visualization",
		category: "visual",
		keywords: [
			"ascii",
			"fire",
			"physics",
			"simulation",
			"heat",
			"diffusion",
			"temperature",
		],
	},
	{
		name: "ASCII Matrix Rain",
		path: "/examples/visual/ascii-matrix",
		description:
			"Interactive Matrix-style digital rain with Japanese characters, click-to-spawn streams, and multiple color schemes",
		category: "visual",
		keywords: [
			"ascii",
			"matrix",
			"animation",
			"interactive",
			"digital",
			"rain",
			"characters",
		],
	},
	{
		name: "ASCII Digital Clock",
		path: "/examples/visual/ascii-clock",
		description:
			"7-segment digital display and analog clock with multiple color schemes, time formats, and glow effects",
		category: "visual",
		keywords: [
			"ascii",
			"clock",
			"digital",
			"time",
			"segment",
			"display",
			"analog",
		],
	},
	{
		name: "ASCII Snake Game",
		path: "/examples/visual/ascii-snake",
		description:
			"Classic Snake game with multiple food types, difficulty levels, high scores, and keyboard controls",
		category: "visual",
		keywords: [
			"ascii",
			"game",
			"snake",
			"interactive",
			"classic",
			"food",
			"score",
		],
	},
	{
		name: "ASCII GPU Cluster Monitor",
		path: "/examples/visual/ascii-gpu-cluster",
		description:
			"High-performance GPU cluster simulation with real-time job scheduling, thermal monitoring, and distributed compute tasks",
		category: "visual",
		keywords: [
			"ascii",
			"gpu",
			"cluster",
			"monitoring",
			"thermal",
			"performance",
			"jobs",
			"computing",
		],
	},
	{
		name: "Fluid Dynamics Simulation",
		path: "/examples/visual/fluid-dynamics",
		description:
			"Real-time fluid physics simulation with interactive visualization",
		category: "visual",
		keywords: [
			"physics",
			"fluids",
			"simulation",
			"interactive",
			"dynamics",
			"visualization",
		],
	},
	{
		name: "Galaxy Simulation",
		path: "/examples/visual/galaxy-simulation",
		description: "N-body gravitational simulation with particle interactions",
		category: "visual",
		keywords: [
			"physics",
			"gravity",
			"n-body",
			"space",
			"galaxy",
			"simulation",
			"particles",
		],
	},
	{
		name: "Neural Network Visualization",
		path: "/examples/visual/neural-network",
		description: "Interactive neural network training and visualization",
		category: "visual",
		keywords: [
			"ai",
			"neural",
			"networks",
			"machine",
			"learning",
			"interactive",
			"training",
		],
	},
	{
		name: "Quantum Simulation",
		path: "/examples/visual/quantum-simulation",
		description: "Quantum mechanics visualization and simulation",
		category: "visual",
		keywords: [
			"physics",
			"quantum",
			"simulation",
			"visualization",
			"mechanics",
			"wave",
		],
	},

	// Engineering Examples
	{
		name: "Signal Processing & FFT Analysis",
		path: "/examples/engineering/signal-processing",
		description:
			"Advanced signal generation, filtering, and frequency domain analysis with real-time FFT visualization",
		category: "advanced",
		keywords: [
			"signal",
			"processing",
			"fft",
			"frequency",
			"analysis",
			"filtering",
			"engineering",
		],
	},
	{
		name: "Circuit Analysis & Simulation",
		path: "/examples/engineering/circuit-analysis",
		description:
			"AC/DC circuit analysis with impedance calculations, phasor diagrams, and interactive component placement",
		category: "advanced",
		keywords: [
			"circuit",
			"analysis",
			"simulation",
			"electrical",
			"impedance",
			"phasor",
			"engineering",
		],
	},
	{
		name: "Structural Analysis & FEA",
		path: "/examples/engineering/structural-analysis",
		description:
			"Finite element analysis for beams and trusses with stress visualization and load distribution",
		category: "advanced",
		keywords: [
			"structural",
			"analysis",
			"fea",
			"finite",
			"element",
			"stress",
			"engineering",
		],
	},
	{
		name: "Heat Transfer Simulation",
		path: "/examples/engineering/heat-transfer",
		description:
			"2D heat conduction simulation with temperature field visualization and thermal boundary conditions",
		category: "advanced",
		keywords: [
			"heat",
			"transfer",
			"simulation",
			"thermal",
			"conduction",
			"temperature",
			"engineering",
		],
	},
	{
		name: "Control Systems Analysis",
		path: "/examples/engineering/control-systems",
		description:
			"Control theory demonstrations with step response, bode plots, and stability analysis",
		category: "advanced",
		keywords: [
			"control",
			"systems",
			"analysis",
			"theory",
			"bode",
			"stability",
			"engineering",
		],
	},
	{
		name: "Hydraulic Systems Design",
		path: "/examples/engineering/hydraulic-systems",
		description:
			"Fluid power systems analysis with pressure calculations, flow dynamics, and component sizing",
		category: "advanced",
		keywords: [
			"hydraulic",
			"systems",
			"design",
			"fluid",
			"power",
			"pressure",
			"engineering",
		],
	},
	{
		name: "Vibration Analysis & Modal Testing",
		path: "/examples/engineering/vibration-analysis",
		description:
			"Structural vibration analysis with frequency response, modal shapes, and resonance identification",
		category: "advanced",
		keywords: [
			"vibration",
			"analysis",
			"modal",
			"testing",
			"frequency",
			"resonance",
			"engineering",
		],
	},
];

export default function ExampleSearch() {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	// Optimized search with better performance
	const filteredExamples = useMemo(() => {
		if (!query.trim()) {
			return [];
		}

		const searchTerms = query
			.toLowerCase()
			.split(" ")
			.filter((term) => term.length > 0);

		const filtered = allExamples.filter((example) => {
			const searchableText = [
				example.name,
				example.description,
				example.category,
				...example.keywords,
			]
				.join(" ")
				.toLowerCase();

			return searchTerms.every((term) => searchableText.includes(term));
		});

		filtered.sort((a, b) => {
			const aNameMatch = a.name.toLowerCase().includes(query.toLowerCase());
			const bNameMatch = b.name.toLowerCase().includes(query.toLowerCase());

			if (aNameMatch && !bNameMatch) return -1;
			if (!aNameMatch && bNameMatch) return 1;

			const categoryOrder = { basic: 0, visual: 1, advanced: 2 };
			return categoryOrder[a.category] - categoryOrder[b.category];
		});

		return filtered.slice(0, 10);
	}, [query]);

	// Handle keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isOpen) {
				if ((e.ctrlKey || e.metaKey) && e.key === "k") {
					e.preventDefault();
					setIsOpen(true);
				}
				return;
			}

			if (e.key === "Escape") {
				setIsOpen(false);
				setQuery("");
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen]);

	// Focus input when modal opens
	useEffect(() => {
		if (isOpen) {
			setTimeout(() => {
				inputRef.current?.focus();
			}, 0);
		}
	}, [isOpen]);

	const getCategoryIcon = (category: Example["category"]) => {
		switch (category) {
			case "basic":
				return BookOpen;
			case "visual":
				return Zap;
			case "advanced":
				return Settings;
			default:
				return Hash;
		}
	};

	const getCategoryBadgeVariant = (
		category: Example["category"],
	): "default" | "secondary" | "destructive" | "outline" => {
		switch (category) {
			case "basic":
				return "default";
			case "visual":
				return "secondary";
			case "advanced":
				return "destructive";
			default:
				return "outline";
		}
	};

	const handleSelectExample = (path: string) => {
		setIsOpen(false);
		setQuery("");
		window.location.href = createUrl(path);
	};

	return (
		<TooltipProvider>
			<div className="relative">
				{/* Search Trigger Button */}
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={() => setIsOpen(true)}
							className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
						>
							<Search className="w-4 h-4" />
							<span className="hidden sm:inline">Search examples...</span>
							<kbd className="hidden sm:inline px-1.5 py-0.5 text-xs bg-gray-200 border border-gray-300 rounded">
								⌘K
							</kbd>
						</button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Search examples (⌘K)</p>
					</TooltipContent>
				</Tooltip>

				{/* Enhanced Search Modal */}
				{isOpen && (
					<div
						className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20"
						onClick={() => setIsOpen(false)}
						onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
					>
						<div
							className="w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
							onClick={(e) => e.stopPropagation()}
							onKeyDown={(e) => e.stopPropagation()}
						>
							{/* Enhanced Search Input */}
							<div className="flex items-center px-4 py-4 border-b border-gray-200 dark:border-gray-700">
								<Search className="w-5 h-5 text-gray-400 mr-3" />
								<input
									ref={inputRef}
									type="text"
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder="Search examples..."
									className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 border-0 focus:outline-none text-base"
								/>
								<button
									type="button"
									onClick={() => setIsOpen(false)}
									className="ml-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
								>
									<X className="w-4 h-4" />
								</button>
							</div>

							{/* Enhanced Results */}
							<div className="max-h-96 overflow-y-auto">
								{query.trim() ? (
									filteredExamples.length === 0 ? (
										<div className="px-6 py-12 text-center">
											<Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
											<p className="text-gray-900 dark:text-gray-100 font-medium mb-2">
												No examples found
											</p>
											<p className="text-sm text-gray-500 dark:text-gray-400">
												Try searching for math, animation, or visual
											</p>
										</div>
									) : (
										<div className="py-2">
											<div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
												Examples
											</div>
											{filteredExamples.map((example) => {
												const Icon = getCategoryIcon(example.category);
												return (
													<button
														key={example.path}
														onClick={() => handleSelectExample(example.path)}
														className="w-full flex items-center gap-3 px-3 py-3 mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group text-left"
													>
														<Icon className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
														<div className="flex-1 min-w-0">
															<div className="font-medium text-gray-900 dark:text-gray-100 truncate">
																{example.name}
															</div>
															<div className="text-sm text-gray-500 dark:text-gray-400 truncate">
																{example.description}
															</div>
														</div>
														<div className="flex items-center gap-2">
															<Badge
																variant={getCategoryBadgeVariant(
																	example.category,
																)}
																className="text-xs"
															>
																{example.category}
															</Badge>
															<kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
																↵
															</kbd>
														</div>
													</button>
												);
											})}
										</div>
									)
								) : (
									<div className="py-2">
										<div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Quick Actions
										</div>
										<button
											type="button"
											onClick={() => handleSelectExample(createUrl("/examples/basic"))}
											className="w-full flex items-center gap-3 px-3 py-3 mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
										>
											<BookOpen className="h-4 w-4 text-gray-500 dark:text-gray-400" />
											<div className="flex-1">
												<div className="font-medium text-gray-900 dark:text-gray-100">
													Browse Basic Examples
												</div>
												<div className="text-sm text-gray-500 dark:text-gray-400">
													Mathematical functions, color theory, geometry
												</div>
											</div>
											<kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
												⌘B
											</kbd>
										</button>
										<button
											type="button"
											onClick={() => handleSelectExample(createUrl("/examples/visual"))}
											className="w-full flex items-center gap-3 px-3 py-3 mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
										>
											<Zap className="h-4 w-4 text-gray-500 dark:text-gray-400" />
											<div className="flex-1">
												<div className="font-medium text-gray-900 dark:text-gray-100">
													Browse Visual Examples
												</div>
												<div className="text-sm text-gray-500 dark:text-gray-400">
													Animations, fractals, physics simulations
												</div>
											</div>
											<kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
												⌘V
											</kbd>
										</button>
										<button
											type="button"
											onClick={() =>
												handleSelectExample(createUrl("/examples/engineering"))
											}
											className="w-full flex items-center gap-3 px-3 py-3 mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
										>
											<Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
											<div className="flex-1">
												<div className="font-medium text-gray-900 dark:text-gray-100">
													Browse Engineering Examples
												</div>
												<div className="text-sm text-gray-500 dark:text-gray-400">
													Signal processing, circuit analysis, control systems
												</div>
											</div>
											<kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
												⌘E
											</kbd>
										</button>
									</div>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</TooltipProvider>
	);
}
