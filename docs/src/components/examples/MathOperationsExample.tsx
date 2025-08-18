import {
	clamp,
	degrees,
	lerp,
	map,
	normalize,
	PI,
	radians,
	TWO_PI,
	vec2,
	vec2Add,
	vec2Angle,
	vec2Length,
	vec2Normalize,
	vec3,
	vec3Cross,
	vec3Dot,
} from "play.ts";
import { useEffect, useState } from "react";

export default function MathOperationsExample() {
	const [results, setResults] = useState<Record<string, unknown>>({});

	useEffect(() => {
		// Basic math functions
		const basicResults = {
			clamp: clamp(15, 0, 10),
			lerp: lerp(0, 100, 0.5),
			map: map(5, 0, 10, 0, 100),
			normalize: normalize(50, 0, 100),
		};

		// Vector2 operations
		const v1 = vec2(3, 4);
		const v2 = vec2(1, 2);
		const vector2Results = {
			v1,
			v2,
			vec2Add: vec2Add(v1, v2),
			vec2Length: vec2Length(v1),
			vec2Normalize: vec2Normalize(v1),
			vec2Angle: degrees(vec2Angle(v1)),
		};

		// Vector3 operations
		const v3a = vec3(1, 0, 0);
		const v3b = vec3(0, 1, 0);
		const vector3Results = {
			v3a,
			v3b,
			vec3Cross: vec3Cross(v3a, v3b),
			vec3Dot: vec3Dot(v3a, v3b),
		};

		// Constants and angle conversion
		const constants = {
			PI,
			TWO_PI,
			radians90: radians(90),
			degreesHalfPi: degrees(PI / 2),
		};

		// Edge cases
		const edgeCases = {
			lerpInfinity: lerp(Number.POSITIVE_INFINITY, 0, 0.5),
			normalizeZeroRange: normalize(5, 10, 10),
			normalizeZeroVector: vec2Normalize(vec2(0, 0)),
		};

		setResults({
			basic: basicResults,
			vector2: vector2Results,
			vector3: vector3Results,
			constants,
			edgeCases,
		});
	}, []);

	const ResultDisplay = ({
		title,
		data,
	}: {
		title: string;
		data: Record<string, unknown>;
	}) => (
		<div className="bg-white rounded-lg shadow-md p-6 mb-4">
			<h3 className="text-lg font-semibold mb-4 text-blue-600">{title}</h3>
			<div className="space-y-2">
				{Object.entries(data).map(([key, value]) => (
					<div
						key={key}
						className="flex justify-between items-center p-2 bg-gray-50 rounded"
					>
						<span className="font-mono text-sm text-gray-700">{key}:</span>
						<span className="font-mono text-sm text-blue-800">
							{typeof value === "object"
								? JSON.stringify(value)
								: String(value)}
						</span>
					</div>
				))}
			</div>
		</div>
	);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Mathematical Functions Reference
				</h1>
				<p className="text-gray-600 mb-4">
					Comprehensive showcase of play.ts's math utilities with vector
					operations, constants, and edge case examples.
				</p>
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<p className="text-blue-800">
						📐 This example showcases the mathematical foundation of the play.ts
						library
					</p>
				</div>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				{results.basic && (
					<ResultDisplay title="Basic Functions" data={results.basic} />
				)}
				{results.vector2 && (
					<ResultDisplay title="Vector2 Operations" data={results.vector2} />
				)}
				{results.vector3 && (
					<ResultDisplay title="Vector3 Operations" data={results.vector3} />
				)}
				{results.constants && (
					<ResultDisplay title="Constants & Angles" data={results.constants} />
				)}
				{results.edgeCases && (
					<ResultDisplay title="Edge Cases" data={results.edgeCases} />
				)}
			</div>

			<div className="mt-8">
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-yellow-800">
						Key Concepts Demonstrated
					</h3>
					<ul className="text-yellow-700 space-y-1">
						<li>
							• <strong>clamp()</strong>: Constrains values within a range
						</li>
						<li>
							• <strong>lerp()</strong>: Linear interpolation between two values
						</li>
						<li>
							• <strong>map()</strong>: Remaps values from one range to another
						</li>
						<li>
							• <strong>Vector operations</strong>: 2D and 3D vector mathematics
						</li>
						<li>
							• <strong>Angle conversion</strong>: Radians to degrees and vice
							versa
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6">
				<a
					href="/examples/basic"
					className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
				>
					← Back to Examples
				</a>
			</div>
		</div>
	);
}
