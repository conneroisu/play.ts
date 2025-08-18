import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/visual/test-simple")({
	component: TestSimpleExample,
});

function TestSimpleExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isRunning, setIsRunning] = useState(false);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Simple test rendering
		ctx.fillStyle = "#3B82F6";
		ctx.fillRect(50, 50, 100, 100);

		ctx.fillStyle = "#EF4444";
		ctx.beginPath();
		ctx.arc(200, 100, 50, 0, Math.PI * 2);
		ctx.fill();

		ctx.fillStyle = "#000";
		ctx.font = "16px Arial";
		ctx.fillText("Test Visual Example Working!", 50, 200);
	}, []);

	return (
		<div className="w-full max-w-4xl mx-auto p-6">
			<div className="bg-white rounded-xl shadow-lg p-6">
				<h1 className="text-2xl font-bold text-gray-800 mb-4">
					Test Simple Visual Example
				</h1>
				<p className="text-gray-600 mb-6">Testing basic canvas rendering</p>

				<div className="mb-4">
					<canvas
						ref={canvasRef}
						width={400}
						height={300}
						className="border border-gray-300 rounded-lg bg-white"
					/>
				</div>

				<div className="flex gap-2">
					<button
						onClick={() => setIsRunning(!isRunning)}
						className={`px-4 py-2 rounded-lg font-medium ${
							isRunning
								? "bg-red-500 text-white hover:bg-red-600"
								: "bg-green-500 text-white hover:bg-green-600"
						}`}
					>
						{isRunning ? "Stop" : "Start"}
					</button>
				</div>
			</div>
		</div>
	);
}
