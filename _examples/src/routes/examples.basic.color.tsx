import { Link, createFileRoute } from "@tanstack/react-router";
import { hexToRgb, hsl, hslToRgb, rgb, rgbToHex, rgbToHsl } from "play.ts";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/examples/basic/color")({
	component: ColorSystemsExample,
});

interface ColorExample {
	hsl?: number[];
	rgb?: number[];
	original?: number[];
	converted?: number[];
	type?: string;
	description: string;
}

interface ColorSection {
	name: string;
	colors: ColorExample[];
}

function ColorSystemsExample() {
	const [colorExamples, setColorExamples] = useState<ColorSection[]>([]);

	useEffect(() => {
		const examples = [
			{
				name: "HSL Colors",
				colors: [
					{ hsl: [0, 100, 50], description: "Pure Red" },
					{ hsl: [120, 100, 50], description: "Pure Green" },
					{ hsl: [240, 100, 50], description: "Pure Blue" },
					{ hsl: [60, 100, 50], description: "Yellow" },
					{ hsl: [300, 100, 50], description: "Magenta" },
					{ hsl: [180, 100, 50], description: "Cyan" },
				],
			},
			{
				name: "RGB Colors",
				colors: [
					{ rgb: [255, 0, 0], description: "Pure Red" },
					{ rgb: [0, 255, 0], description: "Pure Green" },
					{ rgb: [0, 0, 255], description: "Pure Blue" },
					{ rgb: [255, 255, 0], description: "Yellow" },
					{ rgb: [255, 0, 255], description: "Magenta" },
					{ rgb: [0, 255, 255], description: "Cyan" },
				],
			},
			{
				name: "Conversions",
				colors: [
					{
						original: [180, 50, 75],
						converted: hslToRgb(hsl(180, 50, 75)),
						type: "HSL to RGB",
						description: "Teal to RGB",
					},
					{
						original: [255, 128, 64],
						converted: rgbToHsl(rgb(255, 128, 64)),
						type: "RGB to HSL",
						description: "Orange to HSL",
					},
				],
			},
		];

		setColorExamples(examples);
	}, []);

	const ColorSwatch = ({
		color,
		description,
		type = "hsl",
	}: {
		color: number[];
		description: string;
		type?: "hsl" | "rgb";
	}) => {
		const bgColor =
			type === "hsl"
				? `hsl(${color[0]}, ${color[1]}%, ${color[2]}%)`
				: `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

		return (
			<div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm border">
				<div
					className="w-16 h-16 rounded-lg border-2 border-gray-300"
					style={{ backgroundColor: bgColor }}
				/>
				<div>
					<p className="font-semibold text-gray-800">{description}</p>
					<p className="text-sm text-gray-600 font-mono">
						{type === "hsl"
							? `hsl(${color[0]}, ${color[1]}%, ${color[2]}%)`
							: `rgb(${color[0]}, ${color[1]}, ${color[2]})`}
					</p>
				</div>
			</div>
		);
	};

	const ConversionExample = ({ example }: { example: ColorExample }) => {
		const originalColor = example.type.includes("HSL")
			? `hsl(${example.original[0]}, ${example.original[1]}%, ${example.original[2]}%)`
			: `rgb(${example.original[0]}, ${example.original[1]}, ${example.original[2]})`;

		// Fix: Handle object format from hslToRgb/rgbToHsl functions
		const convertedColor = example.type.includes("to RGB")
			? `rgb(${Math.round(example.converted.r)}, ${Math.round(example.converted.g)}, ${Math.round(example.converted.b)})`
			: `hsl(${Math.round(example.converted.h)}, ${Math.round(example.converted.s)}%, ${Math.round(example.converted.l)}%)`;

		return (
			<div className="bg-white rounded-lg shadow-sm border p-4">
				<h4 className="font-semibold text-gray-800 mb-3">
					{example.description}
				</h4>
				<div className="flex items-center space-x-4">
					<div className="text-center">
						<div
							className="w-12 h-12 rounded border-2 border-gray-300 mx-auto mb-2"
							style={{ backgroundColor: originalColor }}
						/>
						<p className="text-xs text-gray-600">Original</p>
						<p className="text-xs font-mono">{example.type.split(" ")[0]}</p>
					</div>
					<div className="text-2xl text-gray-400">→</div>
					<div className="text-center">
						<div
							className="w-12 h-12 rounded border-2 border-gray-300 mx-auto mb-2"
							style={{ backgroundColor: convertedColor }}
						/>
						<p className="text-xs text-gray-600">Converted</p>
						<p className="text-xs font-mono">{example.type.split(" ")[2]}</p>
					</div>
				</div>
				<p className="text-sm text-gray-600 mt-2">{example.type}</p>
			</div>
		);
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Color Space Conversion Studio
				</h1>
				<p className="text-gray-600 mb-4">
					Interactive HSL/RGB color swatches with live conversion examples and
					visual color theory demonstrations.
				</p>
				<div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
					<p className="text-purple-800">
						🎨 This example showcases color manipulation capabilities of the
						play.ts library
					</p>
				</div>
			</div>

			<div className="space-y-8">
				{colorExamples.map((section) => (
					<div key={section.name} className="bg-gray-50 rounded-lg p-6">
						<h2 className="text-xl font-semibold mb-4 text-gray-800">
							{section.name}
						</h2>

						{section.name === "Conversions" ? (
							<div className="grid md:grid-cols-2 gap-4">
								{section.colors.map((example: ColorExample, idx: number) => (
									<ConversionExample
										key={`conversion-${example.description}-${idx}`}
										example={example}
									/>
								))}
							</div>
						) : (
							<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
								{section.colors.map((color: ColorExample, idx: number) => (
									<ColorSwatch
										key={`${section.name}-${color.description}-${idx}`}
										color={color.hsl || color.rgb}
										description={color.description}
										type={color.hsl ? "hsl" : "rgb"}
									/>
								))}
							</div>
						)}
					</div>
				))}
			</div>

			<div className="mt-8">
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-yellow-800">
						Key Concepts Demonstrated
					</h3>
					<ul className="text-yellow-700 space-y-1">
						<li>
							• <strong>HSL Color Space</strong>: Hue, Saturation, Lightness
							representation
						</li>
						<li>
							• <strong>RGB Color Space</strong>: Red, Green, Blue color values
						</li>
						<li>
							• <strong>Color Conversion</strong>: Converting between HSL and
							RGB formats
						</li>
						<li>
							• <strong>Hex Support</strong>: Working with hexadecimal color
							values
						</li>
						<li>
							• <strong>Color Utilities</strong>: Helper functions for color
							manipulation
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6">
				<Link
					to="/examples/basic"
					className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
				>
					← Back to Examples
				</Link>
			</div>
		</div>
	);
}
