import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/examples/basic/")({
	component: BasicExamplesPage,
});

function BasicExamplesPage() {
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

	const categories = [
		{
			name: "Mathematics",
			color: "bg-blue-100 text-blue-700",
			tags: ["Math", "Vectors", "Constants"],
		},
		{
			name: "Color Theory",
			color: "bg-purple-100 text-purple-700",
			tags: ["Color", "HSL", "RGB", "Conversion"],
		},
		{
			name: "Geometry",
			color: "bg-green-100 text-green-700",
			tags: ["Geometry", "Vectors", "2D"],
		},
		{
			name: "Animation",
			color: "bg-yellow-100 text-yellow-700",
			tags: ["Animation", "Easing", "Curves", "Timing"],
		},
		{
			name: "Random Generation",
			color: "bg-pink-100 text-pink-700",
			tags: ["Random", "Noise", "Gaussian", "Seeded"],
		},
	];

	const basicExamples = [
		{
			name: "Mathematical Functions Reference",
			path: "/examples/basic/math",
			description:
				"Comprehensive showcase of play.ts's math utilities with vector operations, constants, and edge case examples",
			tags: ["Math", "Vectors", "Constants", "Edge Cases"],
			complexity: "Beginner",
		},
		{
			name: "Color Space Conversion Studio",
			path: "/examples/basic/color",
			description:
				"Interactive HSL/RGB color swatches with live conversion examples and visual color theory demonstrations",
			tags: ["Color", "HSL", "RGB", "Conversion"],
			complexity: "Beginner",
		},
		{
			name: "Interactive Easing Functions Showcase",
			path: "/examples/basic/animation",
			description:
				"Compare 7 animation easing curves in real-time with visual progress bars and mathematical curve graphs",
			tags: ["Animation", "Easing", "Curves", "Timing"],
			complexity: "Intermediate",
		},
		{
			name: "Random Number Generation Suite",
			path: "/examples/basic/random",
			description:
				"Seeded randomness with Gaussian distributions, Perlin noise visualization, and interactive seed control",
			tags: ["Random", "Noise", "Gaussian", "Seeded"],
			complexity: "Intermediate",
		},
		{
			name: "Interactive Vector Mathematics Lab",
			path: "/examples/basic/geometry",
			description:
				"Real-time 2D vector operations with mouse-driven visualization and geometric property calculations",
			tags: ["Geometry", "Vectors", "2D", "Interactive"],
			complexity: "Intermediate",
		},
	];

	const filteredExamples = selectedCategory
		? basicExamples.filter((example) => {
				const category = categories.find(
					(cat) => cat.name === selectedCategory,
				);
				return category?.tags.some((tag) => example.tags.includes(tag));
			})
		: basicExamples;

	const getComplexityVariant = (
		complexity: string,
	): "default" | "secondary" | "destructive" | "outline" => {
		switch (complexity) {
			case "Beginner":
				return "default";
			case "Intermediate":
				return "secondary";
			case "Advanced":
				return "destructive";
			default:
				return "outline";
		}
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">📚 Basic Examples</h1>
				<p className="text-gray-600 mb-6">
					Fundamental building blocks for creative coding - explore core
					mathematical concepts, color theory, geometry, and animation
					principles.
				</p>
				<Alert variant="info">
					<AlertDescription>
						💡 These examples demonstrate the foundational concepts you'll use
						in more complex applications
					</AlertDescription>
				</Alert>
			</div>

			<div className="mb-8">
				<div className="flex flex-wrap gap-2 items-center">
					<span className="text-gray-700 font-medium text-sm">
						Topics covered:
					</span>
					<Button
						variant={selectedCategory === null ? "default" : "outline"}
						size="sm"
						onClick={() => setSelectedCategory(null)}
					>
						All
					</Button>
					{categories.map((category) => (
						<Button
							key={category.name}
							variant={
								selectedCategory === category.name ? "default" : "outline"
							}
							size="sm"
							onClick={() =>
								setSelectedCategory(
									category.name === selectedCategory ? null : category.name,
								)
							}
						>
							{category.name}
						</Button>
					))}
				</div>
				{selectedCategory && (
					<div className="mt-3 text-sm text-gray-600">
						Showing examples for:{" "}
						<span className="font-medium">{selectedCategory}</span>
						<button
							type="button"
							onClick={() => setSelectedCategory(null)}
							className="ml-2 text-blue-600 hover:text-blue-800 underline"
						>
							Clear filter
						</button>
					</div>
				)}
			</div>

			<div className="grid md:grid-cols-2 lg:grid-cols-1 gap-6">
				{filteredExamples.map((example) => (
					<Link key={example.path} to={example.path} className="group">
						<Card className="hover:shadow-lg transition-all duration-200 hover:border-blue-300 group-hover:scale-[1.02]">
							<CardHeader className="pb-4">
								<div className="flex justify-between items-start">
									<CardTitle className="text-xl text-blue-600 group-hover:text-blue-700">
										{example.name}
									</CardTitle>
									<Badge variant={getComplexityVariant(example.complexity)}>
										{example.complexity}
									</Badge>
								</div>
							</CardHeader>
							<CardContent className="pt-0">
								<CardDescription className="mb-4 text-base">
									{example.description}
								</CardDescription>
								<div className="flex flex-wrap gap-2">
									{example.tags.map((tag) => (
										<Badge key={tag} variant="outline" className="text-xs">
											{tag}
										</Badge>
									))}
								</div>
							</CardContent>
						</Card>
					</Link>
				))}
			</div>

			<div className="mt-12">
				<Alert variant="warning">
					<AlertTitle className="text-lg">Learning Path Suggestions</AlertTitle>
					<AlertDescription className="mt-3 space-y-2">
						<p>
							<strong>1. Start with Math:</strong> Build understanding of core
							mathematical operations
						</p>
						<p>
							<strong>2. Explore Colors:</strong> Learn color space conversions
							for visual applications
						</p>
						<p>
							<strong>3. Master Geometry:</strong> Understand vector operations
							for 2D graphics
						</p>
						<p>
							<strong>4. Add Animation:</strong> Bring static graphics to life
							with easing functions
						</p>
						<p>
							<strong>5. Embrace Randomness:</strong> Create natural variations
							and procedural content
						</p>
					</AlertDescription>
				</Alert>
			</div>

			<div className="mt-8 text-center">
				<Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
					<Link to="/examples/visual">Ready for Visual Examples? →</Link>
				</Button>
			</div>
		</div>
	);
}
