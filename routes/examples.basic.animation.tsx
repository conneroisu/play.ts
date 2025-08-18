import { createFileRoute, Link } from "@tanstack/react-router";
import {
	easeInOutQuad,
	easeInQuad,
	easeOutBounce,
	easeOutElastic,
	easeOutQuad,
	lerp,
} from "play.ts";
import { useCallback, useEffect, useRef, useState } from "react";

// Simple cubic bezier implementation
const cubicBezier = (
	t: number,
	x1: number,
	y1: number,
	x2: number,
	y2: number,
): number => {
	const cx = 3 * x1;
	const bx = 3 * (x2 - x1) - cx;
	const ax = 1 - cx - bx;

	const cy = 3 * y1;
	const by = 3 * (y2 - y1) - cy;
	const ay = 1 - cy - by;

	return ((ax * t + bx) * t + cx) * t;
};

export const Route = createFileRoute("/examples/basic/animation")({
	component: AnimationEasingExample,
});

function AnimationEasingExample() {
	const [isAnimating, setIsAnimating] = useState(false);
	const [progress, setProgress] = useState(0);
	const [forceRender, setForceRender] = useState(0);
	const animationRef = useRef<number>();
	const startTimeRef = useRef<number>();
	const isAnimatingRef = useRef<boolean>(false);

	// Debug logging to help identify issues
	console.log("Animation: Component render", {
		isAnimating,
		progress,
		isAnimatingRef: isAnimatingRef.current,
	});

	const easingFunctions = [
		{ name: "Linear", fn: (t: number) => t, color: "bg-gray-500" },
		{
			name: "Ease In",
			fn: easeInQuad || ((t: number) => t * t),
			color: "bg-red-500",
		},
		{
			name: "Ease Out",
			fn: easeOutQuad || ((t: number) => 1 - (1 - t) * (1 - t)),
			color: "bg-blue-500",
		},
		{
			name: "Ease In Out",
			fn:
				easeInOutQuad ||
				((t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)),
			color: "bg-green-500",
		},
		{
			name: "Bounce Out",
			fn:
				easeOutBounce ||
				((t: number) =>
					t < 1 / 2.75
						? 7.5625 * t * t
						: t < 2 / 2.75
							? 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
							: t < 2.5 / 2.75
								? 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
								: 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375),
			color: "bg-purple-500",
		},
		{
			name: "Elastic Out",
			fn:
				easeOutElastic ||
				((t: number) =>
					t === 0
						? 0
						: t === 1
							? 1
							: 2 ** (-10 * t) *
									Math.sin(((t * 10 - 0.75) * (2 * Math.PI)) / 3) +
								1),
			color: "bg-yellow-500",
		},
		{
			name: "Cubic Bezier",
			fn: (t: number) => cubicBezier(t, 0.68, -0.55, 0.265, 1.55),
			color: "bg-pink-500",
		},
	];

	const startAnimation = useCallback(() => {
		console.log("Animation: startAnimation called");

		// Prevent multiple animations from running simultaneously
		if (isAnimatingRef.current) {
			console.log("Animation: already running, ignoring start request");
			return;
		}

		// Update refs immediately to prevent race conditions
		isAnimatingRef.current = true;
		setIsAnimating(true);
		setProgress(0);
		startTimeRef.current = performance.now();

		const animate = (currentTime: number) => {
			// Check if animation should continue using ref (immediate check)
			if (!isAnimatingRef.current) {
				console.log("Animation: stopped via ref check");
				return;
			}

			if (!startTimeRef.current) {
				console.log("Animation: animate called but no startTime");
				isAnimatingRef.current = false;
				setIsAnimating(false);
				return;
			}

			const elapsed = currentTime - startTimeRef.current;
			const duration = 5000; // 5 seconds - slower for debugging
			const t = Math.min(elapsed / duration, 1);

			console.log("Animation: animate frame", { elapsed, t, progress: t });
			setProgress(t);

			if (t < 1 && isAnimatingRef.current) {
				animationRef.current = requestAnimationFrame(animate);
			} else {
				console.log("Animation: animation complete");
				isAnimatingRef.current = false;
				setIsAnimating(false);
				setTimeout(() => {
					console.log("Animation: resetting progress to 0");
					setProgress(0);
				}, 500); // Reset after a delay
			}
		};

		console.log("Animation: requesting first animation frame");
		animationRef.current = requestAnimationFrame(animate);
	}, []);

	const stopAnimation = useCallback(() => {
		console.log("Animation: stopAnimation called");

		// Update ref immediately to stop animation loop
		isAnimatingRef.current = false;

		if (animationRef.current) {
			cancelAnimationFrame(animationRef.current);
			animationRef.current = undefined;
		}

		setIsAnimating(false);
		setProgress(0);
	}, []);

	useEffect(() => {
		return () => {
			// Cleanup on component unmount
			isAnimatingRef.current = false;
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
				animationRef.current = undefined;
			}
		};
	}, []);

	const EasingDemo = ({
		name,
		fn,
		color,
	}: {
		name: string;
		fn: (t: number) => number;
		color: string;
	}) => {
		const easedProgress = fn(progress);
		const position = easedProgress * 100;

		// Debug logging (only for first component to reduce spam)
		if (name === "Linear") {
			console.log(
				`Linear: progress=${progress.toFixed(3)}, eased=${easedProgress.toFixed(3)}, position=${position.toFixed(1)}%`,
			);
		}

		return (
			<div className="bg-white rounded-lg shadow-md p-4 mb-4">
				<h3 className="text-lg font-semibold mb-3 text-gray-800">{name}</h3>
				<div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
					<div
						className={`absolute top-0 left-0 h-full ${color} rounded-full`}
						style={{
							width: `${position}%`,
						}}
					/>
					<div
						className="absolute top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white border-2 border-gray-400 rounded-full shadow-md"
						style={{
							left: `calc(${position}% - 12px)`,
						}}
					/>
				</div>
				<div className="mt-2 text-sm text-gray-600 font-mono">
					Progress: {progress.toFixed(3)} → Eased: {easedProgress.toFixed(3)} →
					Position: {position.toFixed(1)}%
				</div>
			</div>
		);
	};

	const GraphVisualization = () => {
		const canvasRef = useRef<HTMLCanvasElement>(null);

		useEffect(() => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			const width = canvas.width;
			const height = canvas.height;

			// Clear canvas
			ctx.clearRect(0, 0, width, height);

			// Draw grid
			ctx.strokeStyle = "#e5e7eb";
			ctx.lineWidth = 1;
			for (let i = 0; i <= 10; i++) {
				const x = (i / 10) * width;
				const y = (i / 10) * height;

				ctx.beginPath();
				ctx.moveTo(x, 0);
				ctx.lineTo(x, height);
				ctx.stroke();

				ctx.beginPath();
				ctx.moveTo(0, y);
				ctx.lineTo(width, y);
				ctx.stroke();
			}

			// Draw easing curves
			easingFunctions.forEach((easing, index) => {
				const hue = (index * 360) / easingFunctions.length;
				ctx.strokeStyle = `hsl(${hue}, 70%, 50%)`;
				ctx.lineWidth = 2;
				ctx.beginPath();

				for (let i = 0; i <= width; i++) {
					const t = i / width;
					const easedValue = easing.fn(t);
					const x = i;
					const y = height - easedValue * height;

					if (i === 0) {
						ctx.moveTo(x, y);
					} else {
						ctx.lineTo(x, y);
					}
				}
				ctx.stroke();
			});

			// Draw current progress line
			if (progress > 0) {
				ctx.strokeStyle = "#dc2626";
				ctx.lineWidth = 2;
				ctx.setLineDash([5, 5]);

				const x = progress * width;
				ctx.beginPath();
				ctx.moveTo(x, 0);
				ctx.lineTo(x, height);
				ctx.stroke();

				ctx.setLineDash([]);
			}
		}, [progress, easingFunctions]);

		return (
			<div className="bg-white rounded-lg shadow-md p-4">
				<h3 className="text-lg font-semibold mb-3 text-gray-800">
					Easing Curves Visualization
				</h3>
				<canvas
					ref={canvasRef}
					width={400}
					height={300}
					className="border border-gray-300 rounded"
				/>
				<div className="mt-2 text-sm text-gray-600">
					Time (x-axis) → Eased Value (y-axis)
				</div>
			</div>
		);
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Interactive Easing Functions Showcase
				</h1>
				<p className="text-gray-600 mb-4">
					Compare 7 animation easing curves in real-time with visual progress
					bars and mathematical curve graphs.
				</p>
				<div className="bg-green-50 border border-green-200 rounded-lg p-4">
					<p className="text-green-800">
						⚡ This example showcases animation capabilities of the play.ts
						library
					</p>
				</div>
			</div>

			<div className="mb-8">
				<div className="flex items-center space-x-4 mb-6">
					<button
						type="button"
						onClick={() => {
							console.log(
								"Animation: Button clicked, isAnimating =",
								isAnimating,
								"isAnimatingRef =",
								isAnimatingRef.current,
							);
							try {
								if (isAnimating || isAnimatingRef.current) {
									console.log("Animation: Calling stopAnimation");
									stopAnimation();
								} else {
									console.log("Animation: Calling startAnimation");
									startAnimation();
								}
							} catch (error) {
								console.error(
									"Animation: Error in button click handler:",
									error,
								);
								// Reset state on error
								isAnimatingRef.current = false;
								setIsAnimating(false);
								setProgress(0);
							}
						}}
						className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md ${
							isAnimating
								? "bg-red-600 text-white hover:bg-red-700"
								: "bg-blue-600 text-white hover:bg-blue-700"
						}`}
					>
						{isAnimating ? "Stop Animation" : "Start Animation"}
					</button>
					<div className="flex items-center space-x-2">
						<div
							className={`w-3 h-3 rounded-full transition-colors duration-200 ${
								isAnimating ? "bg-green-500 animate-pulse" : "bg-gray-400"
							}`}
						/>
						<span className="text-sm text-gray-600 font-medium">
							{isAnimating ? "Running" : "Stopped"}
						</span>
					</div>
				</div>
			</div>

			<div className="grid lg:grid-cols-2 gap-8">
				<div>
					<h2 className="text-xl font-semibold mb-4 text-gray-800">
						Easing Functions
					</h2>
					{easingFunctions.map((easing) => (
						<EasingDemo key={easing.name} {...easing} />
					))}
				</div>

				<div>
					<GraphVisualization />

					<div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
						<h3 className="text-lg font-semibold mb-2 text-yellow-800">
							Key Concepts Demonstrated
						</h3>
						<ul className="text-yellow-700 space-y-1">
							<li>
								• <strong>Linear Interpolation</strong>: Constant rate of change
							</li>
							<li>
								• <strong>Ease In</strong>: Slow start, fast finish
							</li>
							<li>
								• <strong>Ease Out</strong>: Fast start, slow finish
							</li>
							<li>
								• <strong>Ease In Out</strong>: Slow start and finish
							</li>
							<li>
								• <strong>Bounce</strong>: Spring-like bouncing effect
							</li>
							<li>
								• <strong>Elastic</strong>: Elastic snapback effect
							</li>
							<li>
								• <strong>Cubic Bézier</strong>: Custom curve definition
							</li>
						</ul>
					</div>
				</div>
			</div>

			<div className="mt-8">
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-blue-800">
						Usage Tips
					</h3>
					<ul className="text-blue-700 space-y-1">
						<li>
							• Use <strong>easeOut</strong> for UI animations that feel
							responsive
						</li>
						<li>
							• Use <strong>easeIn</strong> for elements leaving the screen
						</li>
						<li>
							• Use <strong>easeInOut</strong> for looping animations
						</li>
						<li>
							• Use <strong>bounce</strong> and <strong>elastic</strong> for
							playful effects
						</li>
						<li>
							• Use <strong>cubicBezier</strong> for completely custom easing
							curves
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6">
				<Link
					to="/examples/basic"
					className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
				>
					← Back to Examples
				</Link>
			</div>
		</div>
	);
}
