import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/examples/")({
	component: ExamplesIndexPage,
});

function ExamplesIndexPage() {
	const basicExamples = [
		{
			name: "Mathematical Functions Reference",
			path: "/examples/basic/math",
			description:
				"Comprehensive showcase of play.ts's math utilities with vector operations, constants, and edge case examples",
		},
		{
			name: "Color Space Conversion Studio",
			path: "/examples/basic/color",
			description:
				"Interactive HSL/RGB color swatches with live conversion examples and visual color theory demonstrations",
		},
		{
			name: "Interactive Easing Functions Showcase",
			path: "/examples/basic/animation",
			description:
				"Compare 7 animation easing curves in real-time with visual progress bars and mathematical curve graphs",
		},
		{
			name: "Random Number Generation Suite",
			path: "/examples/basic/random",
			description:
				"Seeded randomness with Gaussian distributions, Perlin noise visualization, and interactive seed control",
		},
		{
			name: "Interactive Vector Mathematics Lab",
			path: "/examples/basic/geometry",
			description:
				"Real-time 2D vector operations with mouse-driven visualization and geometric property calculations",
		},
	];

	const visualExamples = [
		{
			name: "Interactive Shape Canvas",
			path: "/examples/visual/basic-shapes",
			description:
				"Click-to-add geometric shapes with real-time area calculations, rotation, and optional floating animations",
		},
		{
			name: "Multi-Object Animation Showcase",
			path: "/examples/visual/animation-demo",
			description:
				"Six animated objects demonstrating different easing functions with timeline visualization and interactive controls",
		},
		{
			name: "Advanced Particle Physics System",
			path: "/examples/visual/particle-system",
			description:
				"Multiple forces, interactive mouse controls, visual trails, and real-time physics parameter adjustment",
		},
		{
			name: "Interactive Mandelbrot Set Explorer",
			path: "/examples/visual/mandelbrot",
			description:
				"Real-time fractal computation with infinite zoom, multiple color palettes, and progressive rendering",
		},
		{
			name: "Conway's Game of Life Simulator",
			path: "/examples/visual/game-of-life",
			description:
				"Complete cellular automata with famous patterns, interactive editing, and educational rule visualization",
		},
		{
			name: "L-System Fractal Generator",
			path: "/examples/visual/l-system",
			description:
				"Six mathematical fractals with turtle graphics, animated drawing, SVG export, and educational rule explanations",
		},
		{
			name: "Advanced Ray Marching 3D Renderer",
			path: "/examples/visual/ray-marching",
			description:
				"Signed distance fields with multiple primitives, debug visualization, and interactive camera controls",
		},
		{
			name: "Multi-Algorithm Maze Generator",
			path: "/examples/visual/maze-generator",
			description:
				"Four generation algorithms with animated creation, automatic pathfinding, and educational algorithm comparisons",
		},
		{
			name: "Craig Reynolds Boids Flocking",
			path: "/examples/visual/flocking",
			description:
				"Complete emergent behavior simulation with interactive forces, real-time parameters, and visual debugging",
		},
		{
			name: "Advanced Wave Physics Simulator",
			path: "/examples/visual/wave-interference",
			description:
				"Multi-source interference with real-time controls, preset patterns, and educational wave mechanics",
		},
		{
			name: "Interactive Voronoi Tessellation",
			path: "/examples/visual/voronoi",
			description:
				"Lloyd's relaxation optimization with multiple patterns, click-to-add sites, and educational visualizations",
		},
		{
			name: "Verlet Integration Soft Body Physics",
			path: "/examples/visual/soft-body",
			description:
				"Three body types with interactive manipulation, real-time physics parameters, and pressure visualization",
		},
		{
			name: "Advanced 3D Software Renderer",
			path: "/examples/visual/3d-wireframe",
			description:
				"Complete 3D engine with matrix math, multiple primitives, lighting, and interactive camera controls",
		},
		{
			name: "Fractal Tree Generator",
			path: "/examples/visual/fractal-tree",
			description:
				"Recursive fractal tree generation with interactive parameters and real-time visualization",
		},
		{
			name: "Fluid Dynamics Simulation",
			path: "/examples/visual/fluid-dynamics",
			description:
				"Real-time fluid physics simulation with interactive visualization",
		},
		{
			name: "Galaxy Simulation",
			path: "/examples/visual/galaxy-simulation",
			description: "N-body gravitational simulation with particle interactions",
		},
		{
			name: "Neural Network Visualization",
			path: "/examples/visual/neural-network",
			description: "Interactive neural network training and visualization",
		},
		{
			name: "Quantum Simulation",
			path: "/examples/visual/quantum-simulation",
			description: "Quantum mechanics visualization and simulation",
		},
	];

	const engineeringExamples = [
		{
			name: "Signal Processing & FFT Analysis",
			path: "/examples/engineering/signal-processing",
			description:
				"Advanced signal generation, filtering, and frequency domain analysis with real-time FFT visualization",
		},
		{
			name: "Circuit Analysis & Simulation",
			path: "/examples/engineering/circuit-analysis",
			description:
				"AC/DC circuit analysis with impedance calculations, phasor diagrams, and interactive component placement",
		},
		{
			name: "Structural Analysis & FEA",
			path: "/examples/engineering/structural-analysis",
			description:
				"Finite element analysis for beams and trusses with stress visualization and load distribution",
		},
		{
			name: "Heat Transfer Simulation",
			path: "/examples/engineering/heat-transfer",
			description:
				"2D heat conduction simulation with temperature field visualization and thermal boundary conditions",
		},
		{
			name: "Control Systems Analysis",
			path: "/examples/engineering/control-systems",
			description:
				"Control theory demonstrations with step response, bode plots, and stability analysis",
		},
		{
			name: "Hydraulic Systems Design",
			path: "/examples/engineering/hydraulic-systems",
			description:
				"Fluid power systems analysis with pressure calculations, flow dynamics, and component sizing",
		},
		{
			name: "Vibration Analysis & Modal Testing",
			path: "/examples/engineering/vibration-analysis",
			description:
				"Structural vibration analysis with frequency response, modal shapes, and resonance identification",
		},
	];

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="text-center mb-12">
				<h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
					play.ts Examples
				</h1>
				<p className="text-xl text-gray-600 mb-8">
					Interactive demonstrations of creative coding capabilities
				</p>
				<Alert variant="info" className="mb-8">
					<AlertDescription>
						🎨 Comprehensive collection of interactive examples demonstrating
						mathematics, graphics, physics, and algorithms
					</AlertDescription>
				</Alert>
			</div>

			<div className="grid gap-8">
				{/* Basic Examples */}
				<section>
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-2xl font-semibold text-gray-800">
							📚 Basic Examples
						</h2>
						<Link
							to="/examples/basic"
							className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
						>
							View All Basic →
						</Link>
					</div>
					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
						{basicExamples.map((example) => (
							<Link key={example.path} to={example.path} className="group">
								<Card className="h-full hover:shadow-lg transition-all duration-200 hover:border-blue-300 group-hover:scale-105">
									<CardHeader className="pb-3">
										<CardTitle className="text-lg text-blue-600 group-hover:text-blue-700">
											{example.name}
										</CardTitle>
									</CardHeader>
									<CardContent>
										<CardDescription className="text-sm">
											{example.description}
										</CardDescription>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				</section>

				{/* Engineering Examples */}
				<section>
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-2xl font-semibold text-gray-800">
							⚙️ Engineering Examples
						</h2>
						<Link
							to="/examples/engineering"
							className="text-orange-600 hover:text-orange-800 font-medium flex items-center gap-1"
						>
							View All Engineering →
						</Link>
					</div>
					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
						{engineeringExamples.map((example) => (
							<Link key={example.path} to={example.path} className="group">
								<Card className="h-full hover:shadow-lg transition-all duration-200 hover:border-orange-300 group-hover:scale-105">
									<CardHeader className="pb-3">
										<CardTitle className="text-lg text-orange-600 group-hover:text-orange-700">
											{example.name}
										</CardTitle>
									</CardHeader>
									<CardContent>
										<CardDescription className="text-sm">
											{example.description}
										</CardDescription>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				</section>

				{/* Visual Examples */}
				<section>
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-2xl font-semibold text-gray-800">
							🎨 Visual Examples
						</h2>
						<Link
							to="/examples/visual"
							className="text-green-600 hover:text-green-800 font-medium flex items-center gap-1"
						>
							View All Visual →
						</Link>
					</div>
					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
						{visualExamples.slice(0, 9).map((example) => (
							<Link key={example.path} to={example.path} className="group">
								<Card className="h-full hover:shadow-lg transition-all duration-200 hover:border-green-300 group-hover:scale-105">
									<CardHeader className="pb-3">
										<CardTitle className="text-lg text-green-600 group-hover:text-green-700">
											{example.name}
										</CardTitle>
									</CardHeader>
									<CardContent>
										<CardDescription className="text-sm">
											{example.description}
										</CardDescription>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
					{visualExamples.length > 9 && (
						<div className="mt-4 text-center">
							<Link
								to="/examples/visual"
								className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
							>
								View {visualExamples.length - 9} More Visual Examples →
							</Link>
						</div>
					)}
				</section>
			</div>

			<div className="mt-12 text-center">
				<div className="bg-gray-50 rounded-lg p-6">
					<h3 className="text-lg font-semibold mb-2">About play.ts</h3>
					<p className="text-gray-600">
						A comprehensive TypeScript library providing essential utilities for
						interactive graphics, mathematics, animations, and creative coding
						applications.
					</p>
				</div>
			</div>
		</div>
	);
}
