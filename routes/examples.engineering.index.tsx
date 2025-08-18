import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/examples/engineering/")({
	component: EngineeringExamplesPage,
});

function EngineeringExamplesPage() {
	const engineeringExamples = [
		{
			name: "Signal Processing & FFT Analysis",
			path: "/examples/engineering/signal-processing",
			description:
				"Advanced signal generation, filtering, and frequency domain analysis with real-time FFT visualization",
			tags: ["Signal Processing", "FFT", "Filters", "Frequency Analysis"],
			complexity: "Advanced",
			category: "Digital Signal Processing",
		},
		{
			name: "Circuit Analysis & Simulation",
			path: "/examples/engineering/circuit-analysis",
			description:
				"AC/DC circuit analysis with impedance calculations, phasor diagrams, and interactive component placement",
			tags: ["Circuits", "AC Analysis", "Impedance", "Phasors"],
			complexity: "Advanced",
			category: "Electrical Engineering",
		},
		{
			name: "Structural Analysis & FEA",
			path: "/examples/engineering/structural-analysis",
			description:
				"Finite element analysis for beams and trusses with stress visualization and load distribution",
			tags: ["FEA", "Structural", "Stress Analysis", "Beams"],
			complexity: "Advanced",
			category: "Mechanical Engineering",
		},
		{
			name: "Heat Transfer Simulation",
			path: "/examples/engineering/heat-transfer",
			description:
				"2D heat conduction simulation with temperature field visualization and thermal boundary conditions",
			tags: ["Heat Transfer", "Thermal", "PDE", "Simulation"],
			complexity: "Advanced",
			category: "Thermal Engineering",
		},
		{
			name: "Control Systems Analysis",
			path: "/examples/engineering/control-systems",
			description:
				"Control theory demonstrations with step response, bode plots, and stability analysis",
			tags: ["Control Theory", "Step Response", "Bode Plots", "Stability"],
			complexity: "Advanced",
			category: "Control Engineering",
		},
		{
			name: "Hydraulic Systems Design",
			path: "/examples/engineering/hydraulic-systems",
			description:
				"Fluid power systems analysis with pressure calculations, flow dynamics, and component sizing",
			tags: ["Hydraulics", "Flow", "Pressure", "Fluid Power"],
			complexity: "Advanced",
			category: "Fluid Engineering",
		},
		{
			name: "Vibration Analysis & Modal Testing",
			path: "/examples/engineering/vibration-analysis",
			description:
				"Structural vibration analysis with frequency response, modal shapes, and resonance identification",
			tags: ["Vibration", "Modal Analysis", "Frequency Response", "Resonance"],
			complexity: "Advanced",
			category: "Mechanical Engineering",
		},
		{
			name: "Antenna Radiation Pattern Analyzer",
			path: "/examples/engineering/antenna-radiation-pattern",
			description:
				"RF antenna analysis with radiation patterns, gain calculations, and 3D visualization for microwave engineering",
			tags: ["RF", "Antenna", "Radiation Pattern", "Microwave"],
			complexity: "Expert",
			category: "RF Engineering",
		},
		{
			name: "Bridge Structural Analysis",
			path: "/examples/engineering/bridge-analysis",
			description:
				"Comprehensive bridge analysis with FEA, load distribution, safety factors, and dynamic response simulation",
			tags: ["Bridge", "FEA", "Structural", "Safety"],
			complexity: "Expert",
			category: "Civil Engineering",
		},
		{
			name: "Renewable Energy System Optimizer",
			path: "/examples/engineering/renewable-energy-optimizer",
			description:
				"Smart grid optimization with solar, wind, storage integration, weather modeling, and cost analysis",
			tags: ["Renewable", "Smart Grid", "Optimization", "Energy"],
			complexity: "Expert",
			category: "Energy Engineering",
		},
		{
			name: "PID Controller Design & Tuning",
			path: "/examples/engineering/pid-controller-design",
			description:
				"PID controller analysis with real-time simulation, parameter tuning, and performance metrics",
			tags: ["PID", "Control Systems", "Tuning", "Real-time"],
			complexity: "Advanced",
			category: "Control Engineering",
		},
		{
			name: "Automotive Suspension Analysis",
			path: "/examples/engineering/automotive-suspension-analysis",
			description:
				"Quarter-car model simulation with suspension dynamics, ride comfort, and road holding analysis",
			tags: ["Automotive", "Suspension", "Vehicle Dynamics", "Simulation"],
			complexity: "Advanced",
			category: "Automotive Engineering",
		},
		{
			name: "Pipeline Stress Analysis",
			path: "/examples/engineering/pipeline-stress-analysis",
			description:
				"Comprehensive pipeline stress analysis with ASME/API standards, safety factors, and failure assessment",
			tags: ["Pipeline", "Stress Analysis", "ASME", "Safety"],
			complexity: "Expert",
			category: "Pipeline Engineering",
		},
	];

	const complexityColors = {
		Beginner: "bg-green-100 text-green-800",
		Intermediate: "bg-yellow-100 text-yellow-800",
		Advanced: "bg-red-100 text-red-800",
		Expert: "bg-purple-100 text-purple-800",
	};

	const categoryColors = {
		"Digital Signal Processing": "bg-purple-100 text-purple-800",
		"Electrical Engineering": "bg-blue-100 text-blue-800",
		"Mechanical Engineering": "bg-orange-100 text-orange-800",
		"Thermal Engineering": "bg-red-100 text-red-800",
		"Control Engineering": "bg-indigo-100 text-indigo-800",
		"Fluid Engineering": "bg-teal-100 text-teal-800",
		"RF Engineering": "bg-pink-100 text-pink-800",
		"Civil Engineering": "bg-gray-100 text-gray-800",
		"Energy Engineering": "bg-green-100 text-green-800",
		"Automotive Engineering": "bg-yellow-100 text-yellow-800",
		"Pipeline Engineering": "bg-slate-100 text-slate-800",
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
			<div className="max-w-6xl mx-auto">
				<div className="mb-8">
					<Link
						to="/examples"
						className="inline-block px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors mb-4"
					>
						← Back to Examples
					</Link>
					<h1 className="text-4xl font-bold text-slate-800 mb-4">
						Engineering Examples
					</h1>
					<p className="text-xl text-slate-600 max-w-3xl">
						Advanced engineering simulations and analysis tools demonstrating
						computational methods for signal processing, circuit analysis,
						structural engineering, heat transfer, and control systems.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
					{engineeringExamples.map((example) => (
						<Link
							key={example.path}
							to={example.path}
							className="group block bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border border-slate-200 hover:border-slate-300"
						>
							<div className="p-6">
								<div className="flex items-start justify-between mb-4">
									<h2 className="text-xl font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">
										{example.name}
									</h2>
									<div className="flex flex-col gap-2 items-end">
										<span
											className={`px-2 py-1 rounded-full text-xs font-medium ${complexityColors[example.complexity as keyof typeof complexityColors]}`}
										>
											{example.complexity}
										</span>
										<span
											className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[example.category as keyof typeof categoryColors]}`}
										>
											{example.category}
										</span>
									</div>
								</div>

								<p className="text-slate-600 mb-4 text-sm leading-relaxed">
									{example.description}
								</p>

								<div className="flex flex-wrap gap-2">
									{example.tags.map((tag) => (
										<span
											key={tag}
											className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium"
										>
											{tag}
										</span>
									))}
								</div>
							</div>
						</Link>
					))}
				</div>

				<div className="mt-12 bg-white rounded-xl p-6 border border-slate-200">
					<h2 className="text-2xl font-bold text-slate-800 mb-4">
						About Engineering Examples
					</h2>
					<div className="prose text-slate-600 max-w-none">
						<p className="mb-4">
							These engineering examples demonstrate advanced computational
							methods and simulations used in various engineering disciplines.
							Each example showcases the practical application of play.ts's
							mathematical utilities in real-world engineering scenarios.
						</p>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
							<div>
								<h3 className="font-semibold text-slate-800 mb-2">
									Computational Methods
								</h3>
								<ul className="space-y-1 text-sm">
									<li>• Finite Element Analysis (FEA)</li>
									<li>• Fast Fourier Transform (FFT)</li>
									<li>• Partial Differential Equations (PDE)</li>
									<li>• Complex Number Operations</li>
									<li>• Matrix Mathematics</li>
								</ul>
							</div>
							<div>
								<h3 className="font-semibold text-slate-800 mb-2">
									Engineering Disciplines
								</h3>
								<ul className="space-y-1 text-sm">
									<li>• Digital Signal Processing</li>
									<li>• Electrical Engineering</li>
									<li>• Mechanical Engineering</li>
									<li>• Thermal Engineering</li>
									<li>• Control Engineering</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
