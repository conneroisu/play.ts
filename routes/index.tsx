import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	const featuredExamples = [
		{
			name: "Interactive Mandelbrot Set Explorer",
			path: "/examples/visual/mandelbrot",
			description:
				"Real-time fractal computation with infinite zoom capabilities",
			image: "🌀",
			complexity: "Advanced",
		},
		{
			name: "Craig Reynolds Boids Flocking",
			path: "/examples/visual/flocking",
			description: "Emergent behavior simulation with interactive forces",
			image: "🐦",
			complexity: "Advanced",
		},
		{
			name: "Advanced 3D Software Renderer",
			path: "/examples/visual/3d-wireframe",
			description: "Complete 3D engine with matrix mathematics",
			image: "🎮",
			complexity: "Expert",
		},
	];

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="text-center mb-16">
				<h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
					play.ts
				</h1>
				<p className="text-2xl text-gray-600 mb-8">
					Comprehensive TypeScript library for creative coding
				</p>
				<p className="text-lg text-gray-500 mb-10 max-w-3xl mx-auto">
					Essential utilities for interactive graphics, mathematics, animations,
					physics simulations, and algorithmic art. Built with TypeScript for
					modern web applications.
				</p>

				<div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
					<Link
						to="/examples"
						className="relative z-20 pointer-events-auto inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
					>
						🎨 <span className="min-[360px]:hidden">Examples</span>
						<span className="hidden min-[360px]:inline sm:hidden">
							Explore All
						</span>
						<span className="hidden sm:inline">Explore All Examples</span>
					</Link>
					<Link
						to="/examples/basic"
						className="relative z-20 pointer-events-auto inline-flex items-center px-8 py-4 bg-white text-gray-700 text-lg font-semibold rounded-lg border-2 border-gray-300 hover:border-blue-300 hover:text-blue-600 transition-all"
					>
						📚 Start with Basics
					</Link>
				</div>
			</div>

			{/* Featured Examples */}
			<section className="mb-16">
				<h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
					Featured Examples
				</h2>
				<div className="grid md:grid-cols-3 gap-8">
					{featuredExamples.map((example) => (
						<Link
							key={example.path}
							to={example.path}
							className="relative z-20 pointer-events-auto group block p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all border hover:border-blue-300 transform hover:-translate-y-1"
						>
							<div className="text-center mb-4">
								<div className="text-6xl mb-4">{example.image}</div>
								<div className="flex justify-center mb-3">
									<span
										className={`px-3 py-1 rounded-full text-xs font-medium ${
											example.complexity === "Expert"
												? "bg-red-100 text-red-600"
												: "bg-orange-100 text-orange-600"
										}`}
									>
										{example.complexity}
									</span>
								</div>
							</div>
							<h3 className="text-xl font-bold mb-3 text-gray-800 group-hover:text-blue-600 transition-colors text-center">
								{example.name}
							</h3>
							<p className="text-gray-600 text-center">{example.description}</p>
						</Link>
					))}
				</div>
			</section>

			{/* Quick Stats */}
			<section className="mb-16">
				<div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
					<div className="grid md:grid-cols-3 gap-8 text-center">
						<div>
							<div className="text-4xl font-bold text-blue-600 mb-2">23+</div>
							<div className="text-gray-700 font-medium">
								Interactive Examples
							</div>
							<div className="text-sm text-gray-500">Basic to Expert level</div>
						</div>
						<div>
							<div className="text-4xl font-bold text-purple-600 mb-2">8</div>
							<div className="text-gray-700 font-medium">Core Categories</div>
							<div className="text-sm text-gray-500">
								Math, Physics, Graphics, AI
							</div>
						</div>
						<div>
							<div className="text-4xl font-bold text-green-600 mb-2">50+</div>
							<div className="text-gray-700 font-medium">Utility Functions</div>
							<div className="text-sm text-gray-500">Production-ready code</div>
						</div>
					</div>
				</div>
			</section>

			{/* Categories Overview */}
			<section className="mb-16">
				<h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
					Explore by Category
				</h2>
				<div className="grid md:grid-cols-2 gap-8">
					<Link
						to="/examples/basic"
						className="group p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all border hover:border-blue-300"
					>
						<div className="flex items-center mb-4">
							<div className="text-4xl mr-4">📚</div>
							<div>
								<h3 className="text-2xl font-bold text-blue-600 group-hover:text-blue-700">
									Basic Examples
								</h3>
								<p className="text-gray-600">Foundation concepts & utilities</p>
							</div>
						</div>
						<div className="flex flex-wrap gap-2 mb-4">
							<span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
								Mathematics
							</span>
							<span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
								Colors
							</span>
							<span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
								Geometry
							</span>
							<span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
								Animation
							</span>
						</div>
						<p className="text-gray-600">
							Learn the fundamentals with 5 interactive examples covering core
							mathematical concepts, color theory, and animation principles.
						</p>
					</Link>

					<Link
						to="/examples/visual"
						className="group p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all border hover:border-green-300"
					>
						<div className="flex items-center mb-4">
							<div className="text-4xl mr-4">🎨</div>
							<div>
								<h3 className="text-2xl font-bold text-green-600 group-hover:text-green-700">
									Visual Examples
								</h3>
								<p className="text-gray-600">Advanced graphics & simulations</p>
							</div>
						</div>
						<div className="flex flex-wrap gap-2 mb-4">
							<span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
								Physics
							</span>
							<span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
								Fractals
							</span>
							<span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm">
								3D Graphics
							</span>
							<span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
								Algorithms
							</span>
						</div>
						<p className="text-gray-600">
							Explore 18+ sophisticated examples featuring physics simulations,
							algorithmic art, 3D rendering, and computational geometry.
						</p>
					</Link>
				</div>
			</section>

			{/* About Section */}
			<section className="text-center">
				<div className="bg-gray-50 rounded-2xl p-8">
					<h3 className="text-2xl font-bold mb-4 text-gray-800">
						About play.ts
					</h3>
					<p className="text-gray-600 text-lg max-w-4xl mx-auto mb-6">
						play.ts is a production-ready TypeScript library designed for
						creative coding, interactive graphics, and mathematical computing.
						Each example demonstrates real-world applications with full source
						code, educational explanations, and interactive controls.
					</p>
					<div className="flex justify-center gap-4">
						<span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium">
							TypeScript
						</span>
						<span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
							Tree-shakeable
						</span>
						<span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium">
							Well-documented
						</span>
						<span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium">
							Production-ready
						</span>
					</div>
				</div>
			</section>
		</div>
	);
}
