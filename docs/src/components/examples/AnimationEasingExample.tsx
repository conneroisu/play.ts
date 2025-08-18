import {
	easeInBack,
	easeInBounce,
	easeInCubic,
	easeInElastic,
	easeInExpo,
	easeInOutBack,
	easeInOutBounce,
	easeInOutCubic,
	easeInOutElastic,
	easeInOutExpo,
	easeInOutQuad,
	easeInOutQuart,
	easeInOutQuint,
	easeInOutSine,
	easeInQuad,
	easeInQuart,
	easeInQuint,
	easeInSine,
	easeOutBack,
	easeOutBounce,
	easeOutCubic,
	easeOutElastic,
	easeOutExpo,
	easeOutQuad,
	easeOutQuart,
	easeOutQuint,
	easeOutSine,
	linear,
	tween,
} from "play.ts";
import { useEffect, useRef, useState } from "react";
import { createUrl } from "@/lib/utils";

interface EasingFunction {
	name: string;
	func: (t: number) => number;
	category:
		| "linear"
		| "quad"
		| "cubic"
		| "quart"
		| "quint"
		| "sine"
		| "expo"
		| "back"
		| "elastic"
		| "bounce";
}

const easingFunctions: EasingFunction[] = [
	{ name: "Linear", func: linear, category: "linear" },
	{ name: "Ease In Quad", func: easeInQuad, category: "quad" },
	{ name: "Ease Out Quad", func: easeOutQuad, category: "quad" },
	{ name: "Ease In Out Quad", func: easeInOutQuad, category: "quad" },
	{ name: "Ease In Cubic", func: easeInCubic, category: "cubic" },
	{ name: "Ease Out Cubic", func: easeOutCubic, category: "cubic" },
	{ name: "Ease In Out Cubic", func: easeInOutCubic, category: "cubic" },
	{ name: "Ease In Quart", func: easeInQuart, category: "quart" },
	{ name: "Ease Out Quart", func: easeOutQuart, category: "quart" },
	{ name: "Ease In Out Quart", func: easeInOutQuart, category: "quart" },
	{ name: "Ease In Quint", func: easeInQuint, category: "quint" },
	{ name: "Ease Out Quint", func: easeOutQuint, category: "quint" },
	{ name: "Ease In Out Quint", func: easeInOutQuint, category: "quint" },
	{ name: "Ease In Sine", func: easeInSine, category: "sine" },
	{ name: "Ease Out Sine", func: easeOutSine, category: "sine" },
	{ name: "Ease In Out Sine", func: easeInOutSine, category: "sine" },
	{ name: "Ease In Expo", func: easeInExpo, category: "expo" },
	{ name: "Ease Out Expo", func: easeOutExpo, category: "expo" },
	{ name: "Ease In Out Expo", func: easeInOutExpo, category: "expo" },
	{ name: "Ease In Back", func: easeInBack, category: "back" },
	{ name: "Ease Out Back", func: easeOutBack, category: "back" },
	{ name: "Ease In Out Back", func: easeInOutBack, category: "back" },
	{ name: "Ease In Elastic", func: easeInElastic, category: "elastic" },
	{ name: "Ease Out Elastic", func: easeOutElastic, category: "elastic" },
	{ name: "Ease In Out Elastic", func: easeInOutElastic, category: "elastic" },
	{ name: "Ease In Bounce", func: easeInBounce, category: "bounce" },
	{ name: "Ease Out Bounce", func: easeOutBounce, category: "bounce" },
	{ name: "Ease In Out Bounce", func: easeInOutBounce, category: "bounce" },
];

const categoryColors = {
	linear: "#6b7280",
	quad: "#3b82f6",
	cubic: "#8b5cf6",
	quart: "#06b6d4",
	quint: "#10b981",
	sine: "#f59e0b",
	expo: "#ef4444",
	back: "#84cc16",
	elastic: "#ec4899",
	bounce: "#f97316",
};

export default function AnimationEasingExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const [selectedEasing, setSelectedEasing] = useState<EasingFunction>(
		easingFunctions[0],
	);
	const [isPlaying, setIsPlaying] = useState(false);
	const [duration, setDuration] = useState(2000);
	const [currentTime, setCurrentTime] = useState(0);
	const [startTime, setStartTime] = useState<number | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const drawEasingCurve = () => {
			// Clear canvas
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// Draw grid
			ctx.strokeStyle = "#f0f0f0";
			ctx.lineWidth = 1;
			for (let i = 0; i <= canvas.width; i += 20) {
				ctx.beginPath();
				ctx.moveTo(i, 0);
				ctx.lineTo(i, canvas.height);
				ctx.stroke();
			}
			for (let i = 0; i <= canvas.height; i += 20) {
				ctx.beginPath();
				ctx.moveTo(0, i);
				ctx.lineTo(canvas.width, i);
				ctx.stroke();
			}

			// Draw axes
			ctx.strokeStyle = "#374151";
			ctx.lineWidth = 2;
			// X-axis (time)
			ctx.beginPath();
			ctx.moveTo(50, canvas.height - 50);
			ctx.lineTo(canvas.width - 50, canvas.height - 50);
			ctx.stroke();
			// Y-axis (progress)
			ctx.beginPath();
			ctx.moveTo(50, 50);
			ctx.lineTo(50, canvas.height - 50);
			ctx.stroke();

			// Draw axis labels
			ctx.fillStyle = "#374151";
			ctx.font = "12px system-ui";
			ctx.fillText("Time", canvas.width - 40, canvas.height - 30);
			ctx.save();
			ctx.translate(25, 100);
			ctx.rotate(-Math.PI / 2);
			ctx.fillText("Progress", 0, 0);
			ctx.restore();

			// Draw easing curve
			const padding = 50;
			const graphWidth = canvas.width - 2 * padding;
			const graphHeight = canvas.height - 2 * padding;

			ctx.strokeStyle = categoryColors[selectedEasing.category];
			ctx.lineWidth = 3;
			ctx.beginPath();

			for (let x = 0; x <= graphWidth; x += 2) {
				const t = x / graphWidth;
				const easedValue = selectedEasing.func(t);
				const canvasX = padding + x;
				const canvasY = canvas.height - padding - easedValue * graphHeight;

				if (x === 0) {
					ctx.moveTo(canvasX, canvasY);
				} else {
					ctx.lineTo(canvasX, canvasY);
				}
			}
			ctx.stroke();

			// Draw current position if animating
			if (isPlaying && currentTime >= 0) {
				const t = Math.min(currentTime / duration, 1);
				const easedValue = selectedEasing.func(t);
				const canvasX = padding + t * graphWidth;
				const canvasY = canvas.height - padding - easedValue * graphHeight;

				// Draw dot on curve
				ctx.fillStyle = categoryColors[selectedEasing.category];
				ctx.beginPath();
				ctx.arc(canvasX, canvasY, 6, 0, 2 * Math.PI);
				ctx.fill();

				// Draw animated ball
				const ballX = 50 + easedValue * 200;
				const ballY = canvas.height - 150;
				ctx.fillStyle = categoryColors[selectedEasing.category];
				ctx.beginPath();
				ctx.arc(ballX, ballY, 12, 0, 2 * Math.PI);
				ctx.fill();

				// Draw progress bar
				ctx.fillStyle = "#e5e7eb";
				ctx.fillRect(50, canvas.height - 130, 200, 8);
				ctx.fillStyle = categoryColors[selectedEasing.category];
				ctx.fillRect(50, canvas.height - 130, easedValue * 200, 8);
			}
		};

		drawEasingCurve();
	}, [selectedEasing, currentTime, isPlaying, duration]);

	useEffect(() => {
		if (isPlaying && startTime !== null) {
			const animate = (timestamp: number) => {
				const elapsed = timestamp - startTime;
				setCurrentTime(elapsed);

				if (elapsed < duration) {
					animationRef.current = requestAnimationFrame(animate);
				} else {
					setIsPlaying(false);
					setCurrentTime(duration);
				}
			};

			animationRef.current = requestAnimationFrame(animate);
		}

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [isPlaying, startTime, duration]);

	const startAnimation = () => {
		setStartTime(performance.now());
		setCurrentTime(0);
		setIsPlaying(true);
	};

	const stopAnimation = () => {
		setIsPlaying(false);
		setCurrentTime(0);
		if (animationRef.current) {
			cancelAnimationFrame(animationRef.current);
		}
	};

	const TweenPlayground = () => {
		const [tweenFrom, setTweenFrom] = useState(0);
		const [tweenTo, setTweenTo] = useState(100);
		const [tweenDuration, setTweenDuration] = useState(1000);
		const [tweenProgress, setTweenProgress] = useState(0);
		const [isTweenPlaying, setIsTweenPlaying] = useState(false);

		const runTween = () => {
			setIsTweenPlaying(true);
			const myTween = tween({
				from: tweenFrom,
				to: tweenTo,
				duration: tweenDuration,
				easing: selectedEasing.func,
				onUpdate: (value) => setTweenProgress(value),
				onComplete: () => setIsTweenPlaying(false),
			});
		};

		return (
			<div className="bg-white rounded-lg shadow-md p-4">
				<h3 className="text-lg font-semibold mb-4 text-gray-800">
					Tween Playground
				</h3>

				<div className="grid grid-cols-3 gap-4 mb-4">
					<div>
						<label
							htmlFor="tween-from"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							From Value
						</label>
						<input
							id="tween-from"
							type="number"
							value={tweenFrom}
							onChange={(e) =>
								setTweenFrom(Number.parseFloat(e.target.value) || 0)
							}
							className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
						/>
					</div>
					<div>
						<label
							htmlFor="tween-to"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							To Value
						</label>
						<input
							id="tween-to"
							type="number"
							value={tweenTo}
							onChange={(e) =>
								setTweenTo(Number.parseFloat(e.target.value) || 0)
							}
							className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
						/>
					</div>
					<div>
						<label
							htmlFor="tween-duration"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Duration (ms)
						</label>
						<input
							id="tween-duration"
							type="number"
							value={tweenDuration}
							onChange={(e) =>
								setTweenDuration(Number.parseInt(e.target.value) || 1000)
							}
							className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
						/>
					</div>
				</div>

				<div className="flex items-center justify-between mb-4">
					<button
						onClick={runTween}
						disabled={isTweenPlaying}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
					>
						{isTweenPlaying ? "Running..." : "Run Tween"}
					</button>
					<div className="text-lg font-mono">
						Current Value: {tweenProgress.toFixed(2)}
					</div>
				</div>

				<div className="bg-gray-100 rounded-lg p-3">
					<div className="text-sm text-gray-600 mb-2">
						Progress Visualization
					</div>
					<div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
						<div
							className="h-full bg-blue-500 transition-all duration-75"
							style={{
								width: `${((tweenProgress - tweenFrom) / (tweenTo - tweenFrom)) * 100}%`,
							}}
						/>
					</div>
				</div>
			</div>
		);
	};

	const EasingSelector = () => {
		const categories = Array.from(
			new Set(easingFunctions.map((e) => e.category)),
		);

		return (
			<div className="bg-white rounded-lg shadow-md p-4">
				<h3 className="text-lg font-semibold mb-4 text-gray-800">
					Easing Functions
				</h3>
				<div className="space-y-4">
					{categories.map((category) => (
						<div key={category}>
							<h4 className="text-sm font-medium text-gray-600 mb-2 capitalize">
								{category}
							</h4>
							<div className="grid grid-cols-1 gap-1">
								{easingFunctions
									.filter((e) => e.category === category)
									.map((easing) => (
										<button
											key={easing.name}
											onClick={() => setSelectedEasing(easing)}
											className={`px-3 py-2 text-left text-sm rounded transition-colors ${
												selectedEasing.name === easing.name
													? "bg-blue-100 text-blue-800 border border-blue-300"
													: "hover:bg-gray-50 border border-transparent"
											}`}
											style={{
												borderLeftColor:
													selectedEasing.name === easing.name
														? categoryColors[category]
														: "transparent",
												borderLeftWidth: "3px",
											}}
										>
											{easing.name}
										</button>
									))}
							</div>
						</div>
					))}
				</div>
			</div>
		);
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Animation Easing Functions Laboratory
				</h1>
				<p className="text-gray-600 mb-4">
					Interactive easing function visualization with real-time animation and
					tween playground for exploring motion curves.
				</p>
				<div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
					<p className="text-purple-800">
						🎬 This example showcases animation capabilities of the play.ts
						library
					</p>
				</div>
			</div>

			<div className="grid lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2">
					<div className="bg-white rounded-lg shadow-md p-4 mb-6">
						<h3 className="text-lg font-semibold mb-3 text-gray-800">
							Easing Curve Visualization
						</h3>
						<canvas
							ref={canvasRef}
							width={600}
							height={400}
							className="border border-gray-300 rounded w-full"
						/>
						<div className="mt-4 text-sm text-gray-600">
							Current function: <strong>{selectedEasing.name}</strong>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow-md p-4 mb-6">
						<h3 className="text-lg font-semibold mb-3 text-gray-800">
							Animation Controls
						</h3>
						<div className="flex items-center gap-4 mb-4">
							<button
								onClick={startAnimation}
								disabled={isPlaying}
								className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
							>
								{isPlaying ? "Playing..." : "Start Animation"}
							</button>
							<button
								onClick={stopAnimation}
								className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
							>
								Stop
							</button>
							<div className="flex items-center gap-2">
								<label
									htmlFor="duration"
									className="text-sm font-medium text-gray-700"
								>
									Duration (ms):
								</label>
								<input
									id="duration"
									type="number"
									value={duration}
									onChange={(e) =>
										setDuration(Number.parseInt(e.target.value) || 2000)
									}
									className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
									min="100"
									max="10000"
									step="100"
								/>
							</div>
						</div>
						<div className="text-sm text-gray-600">
							Progress:{" "}
							{isPlaying
								? `${((currentTime / duration) * 100).toFixed(1)}%`
								: "0%"}
						</div>
					</div>

					<TweenPlayground />
				</div>

				<div>
					<EasingSelector />
				</div>
			</div>

			<div className="mt-8">
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-yellow-800">
						Easing Function Categories
					</h3>
					<ul className="text-yellow-700 space-y-1">
						<li>
							• <strong>Linear</strong>: Constant rate of change
						</li>
						<li>
							• <strong>Quad/Cubic/Quart/Quint</strong>: Polynomial curves with
							increasing steepness
						</li>
						<li>
							• <strong>Sine</strong>: Smooth sinusoidal transitions
						</li>
						<li>
							• <strong>Expo</strong>: Exponential acceleration/deceleration
						</li>
						<li>
							• <strong>Back</strong>: Overshoots target before settling
						</li>
						<li>
							• <strong>Elastic</strong>: Oscillating spring-like motion
						</li>
						<li>
							• <strong>Bounce</strong>: Bouncing ball effect
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6">
				<a
					href={createUrl("/examples/basic")}
					className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
				>
					← Back to Examples
				</a>
			</div>
		</div>
	);
}
