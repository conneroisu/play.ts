import { createFileRoute, Link } from "@tanstack/react-router";
import {
	cos,
	degrees,
	easeInOutQuad,
	easeInQuad,
	easeOutBounce,
	easeOutElastic,
	easeOutQuad,
	lerp,
	PI,
	sin,
	TWO_PI,
	vec2,
	vec2Add,
	vec2Mul,
} from "play.ts";
import { useCallback, useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/visual/animation-demo")({
	component: AnimationDemoExample,
});

interface AnimatedObject {
	id: string;
	position: { x: number; y: number };
	targetPosition: { x: number; y: number };
	color: string;
	size: number;
	animationProgress: number;
	easingFunction: (t: number) => number;
	easingName: string;
	isAnimating: boolean;
	rotationSpeed: number;
	rotation: number;
}

function AnimationDemoExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const objectsRef = useRef<AnimatedObject[]>([]);
	const [objects, setObjects] = useState<AnimatedObject[]>([]);
	const [isGlobalAnimation, setIsGlobalAnimation] = useState(false);
	const [animationSpeed, setAnimationSpeed] = useState(1);
	const [selectedEasing, setSelectedEasing] = useState<string>("easeInOutQuad");
	const lastRenderTimeRef = useRef<number>(0);
	const staticCanvasRef = useRef<HTMLCanvasElement>(null);
	const frameCountRef = useRef<number>(0);

	const easingFunctions = {
		linear: (t: number) => t,
		easeInQuad,
		easeOutQuad,
		easeInOutQuad,
		easeOutBounce,
		easeOutElastic,
	};

	// Initialize animated objects
	useEffect(() => {
		const initialObjects: AnimatedObject[] = [
			{
				id: "linear",
				position: { x: 100, y: 100 },
				targetPosition: { x: 500, y: 100 },
				color: "#ef4444",
				size: 20,
				animationProgress: 0,
				easingFunction: easingFunctions.linear,
				easingName: "Linear",
				isAnimating: false,
				rotationSpeed: 0.02,
				rotation: 0,
			},
			{
				id: "easeIn",
				position: { x: 100, y: 150 },
				targetPosition: { x: 500, y: 150 },
				color: "#3b82f6",
				size: 20,
				animationProgress: 0,
				easingFunction: easingFunctions.easeInQuad,
				easingName: "Ease In",
				isAnimating: false,
				rotationSpeed: 0.03,
				rotation: 0,
			},
			{
				id: "easeOut",
				position: { x: 100, y: 200 },
				targetPosition: { x: 500, y: 200 },
				color: "#10b981",
				size: 20,
				animationProgress: 0,
				easingFunction: easingFunctions.easeOutQuad,
				easingName: "Ease Out",
				isAnimating: false,
				rotationSpeed: 0.025,
				rotation: 0,
			},
			{
				id: "easeInOut",
				position: { x: 100, y: 250 },
				targetPosition: { x: 500, y: 250 },
				color: "#8b5cf6",
				size: 20,
				animationProgress: 0,
				easingFunction: easingFunctions.easeInOutQuad,
				easingName: "Ease In-Out",
				isAnimating: false,
				rotationSpeed: 0.04,
				rotation: 0,
			},
			{
				id: "bounce",
				position: { x: 100, y: 300 },
				targetPosition: { x: 500, y: 300 },
				color: "#f59e0b",
				size: 20,
				animationProgress: 0,
				easingFunction: easingFunctions.easeOutBounce,
				easingName: "Bounce",
				isAnimating: false,
				rotationSpeed: 0.05,
				rotation: 0,
			},
			{
				id: "elastic",
				position: { x: 100, y: 350 },
				targetPosition: { x: 500, y: 350 },
				color: "#ec4899",
				size: 20,
				animationProgress: 0,
				easingFunction: easingFunctions.easeOutElastic,
				easingName: "Elastic",
				isAnimating: false,
				rotationSpeed: 0.06,
				rotation: 0,
			},
		];
		objectsRef.current = initialObjects;
		setObjects(initialObjects);
	}, []);

	// Optimized animation loop with throttled state updates
	useEffect(() => {
		if (!isGlobalAnimation) {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
			return;
		}

		const animate = () => {
			// Update animation data in refs (high frequency)
			objectsRef.current = objectsRef.current.map((obj) => {
				if (!obj.isAnimating) return obj;

				const newProgress = Math.min(
					obj.animationProgress + 0.008 * animationSpeed,
					1,
				);
				const easedProgress = obj.easingFunction(newProgress);

				const newPosition = {
					x: lerp(100, obj.targetPosition.x, easedProgress),
					y: obj.targetPosition.y,
				};

				const newRotation = obj.rotation + obj.rotationSpeed;

				return {
					...obj,
					position: newPosition,
					animationProgress: newProgress,
					rotation: newRotation,
					isAnimating: newProgress < 1,
				};
			});

			// Throttle React state updates (every 3rd frame for 20fps state updates)
			frameCountRef.current++;
			if (frameCountRef.current % 3 === 0) {
				setObjects([...objectsRef.current]);
			}

			animationRef.current = requestAnimationFrame(animate);
		};

		animationRef.current = requestAnimationFrame(animate);
		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [isGlobalAnimation, animationSpeed]);

	// Create static background canvas once
	const drawStaticBackground = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw background grid
		ctx.strokeStyle = "#f1f5f9";
		ctx.lineWidth = 1;
		for (let x = 0; x <= canvas.width; x += 50) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, canvas.height);
			ctx.stroke();
		}
		for (let y = 0; y <= canvas.height; y += 50) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(canvas.width, y);
			ctx.stroke();
		}

		// Draw start and end markers
		ctx.fillStyle = "#64748b";
		ctx.fillRect(85, 85, 30, 280);
		ctx.fillRect(485, 85, 30, 280);

		// Draw labels
		ctx.fillStyle = "#1f2937";
		ctx.font = "12px sans-serif";
		ctx.fillText("START", 87, 80);
		ctx.fillText("END", 492, 80);

		// Draw animation timeline
		const timelineY = canvas.height - 50;
		const timelineWidth = canvas.width - 100;
		const timelineX = 50;

		ctx.strokeStyle = "#6b7280";
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(timelineX, timelineY);
		ctx.lineTo(timelineX + timelineWidth, timelineY);
		ctx.stroke();

		// Draw timeline markers
		const markers = 11;
		for (let i = 0; i < markers; i++) {
			const x = timelineX + (timelineWidth / (markers - 1)) * i;
			ctx.beginPath();
			ctx.moveTo(x, timelineY - 5);
			ctx.lineTo(x, timelineY + 5);
			ctx.stroke();

			ctx.fillStyle = "#6b7280";
			ctx.font = "10px sans-serif";
			ctx.textAlign = "center";
			ctx.fillText(`${(i / 10).toFixed(1)}`, x, timelineY + 20);
		}
	}, []);

	// Optimized render with dirty region clearing
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Throttle canvas updates to reduce rendering overhead
		const currentTime = performance.now();
		if (currentTime - lastRenderTimeRef.current < 16) {
			// ~60fps cap
			return;
		}
		lastRenderTimeRef.current = currentTime;

		// Redraw static background only when needed
		if (frameCountRef.current === 0 || !isGlobalAnimation) {
			drawStaticBackground();
		} else {
			// Clear only the regions where objects might be (dirty regions)
			for (const obj of objects) {
				const clearX = Math.max(0, obj.position.x - obj.size - 30);
				const clearY = Math.max(0, obj.position.y - obj.size - 40);
				const clearWidth = Math.min(canvas.width - clearX, (obj.size + 30) * 2);
				const clearHeight = Math.min(
					canvas.height - clearY,
					(obj.size + 40) * 2,
				);

				// Clear this dirty region
				ctx.clearRect(clearX, clearY, clearWidth, clearHeight);

				// Redraw static elements in this region (grid lines)
				ctx.strokeStyle = "#f1f5f9";
				ctx.lineWidth = 1;
				for (
					let x = Math.floor(clearX / 50) * 50;
					x <= clearX + clearWidth;
					x += 50
				) {
					if (x >= clearX && x <= clearX + clearWidth) {
						ctx.beginPath();
						ctx.moveTo(x, clearY);
						ctx.lineTo(x, clearY + clearHeight);
						ctx.stroke();
					}
				}
				for (
					let y = Math.floor(clearY / 50) * 50;
					y <= clearY + clearHeight;
					y += 50
				) {
					if (y >= clearY && y <= clearY + clearHeight) {
						ctx.beginPath();
						ctx.moveTo(clearX, y);
						ctx.lineTo(clearX + clearWidth, y);
						ctx.stroke();
					}
				}
			}
		}

		// Draw animated objects
		for (const obj of objects) {
			ctx.save();
			ctx.translate(obj.position.x, obj.position.y);
			ctx.rotate(obj.rotation);

			// Draw object
			ctx.fillStyle = obj.color;
			ctx.beginPath();
			ctx.arc(0, 0, obj.size, 0, TWO_PI);
			ctx.fill();

			// Draw rotating indicator
			ctx.strokeStyle = obj.color;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(obj.size * 0.8, 0);
			ctx.stroke();

			ctx.restore();

			// Draw label
			ctx.fillStyle = "#1f2937";
			ctx.font = "11px sans-serif";
			ctx.fillText(obj.easingName, obj.position.x - 25, obj.position.y - 30);

			// Draw progress bar
			const progressWidth = 60;
			const progressHeight = 4;
			const progressX = obj.position.x - progressWidth / 2;
			const progressY = obj.position.y + 35;

			ctx.fillStyle = "#e5e7eb";
			ctx.fillRect(progressX, progressY, progressWidth, progressHeight);

			ctx.fillStyle = obj.color;
			ctx.fillRect(
				progressX,
				progressY,
				progressWidth * obj.animationProgress,
				progressHeight,
			);
		}
	}, [objects, isGlobalAnimation, drawStaticBackground]);

	const startAnimation = useCallback(() => {
		frameCountRef.current = 0;
		const resetObjects = objectsRef.current.map((obj) => ({
			...obj,
			animationProgress: 0,
			position: { x: 100, y: obj.targetPosition.y },
			isAnimating: true,
		}));
		objectsRef.current = resetObjects;
		setObjects(resetObjects);
		setIsGlobalAnimation(true);
	}, []);

	const stopAnimation = useCallback(() => {
		setIsGlobalAnimation(false);
	}, []);

	const resetAnimation = useCallback(() => {
		setIsGlobalAnimation(false);
		frameCountRef.current = 0;
		const resetObjects = objectsRef.current.map((obj) => ({
			...obj,
			animationProgress: 0,
			position: { x: 100, y: obj.targetPosition.y },
			isAnimating: false,
		}));
		objectsRef.current = resetObjects;
		setObjects(resetObjects);
	}, []);

	const animateIndividual = useCallback((objectId: string) => {
		const updatedObjects = objectsRef.current.map((obj) =>
			obj.id === objectId
				? {
						...obj,
						animationProgress: 0,
						position: { x: 100, y: obj.targetPosition.y },
						isAnimating: true,
					}
				: obj,
		);
		objectsRef.current = updatedObjects;
		setObjects(updatedObjects);
	}, []);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Multi-Object Animation Showcase
				</h1>
				<p className="text-gray-600 mb-4">
					Six animated objects demonstrating different easing functions with
					timeline visualization and interactive controls.
				</p>
				<div className="bg-green-50 border border-green-200 rounded-lg p-4">
					<p className="text-green-800">
						🎬 Watch different easing functions in action with real-time
						visualization
					</p>
				</div>
			</div>

			<div className="grid lg:grid-cols-4 gap-8">
				<div className="lg:col-span-3">
					<div className="bg-white rounded-lg shadow-md p-4 mb-6">
						<h3 className="text-lg font-semibold mb-3 text-gray-800">
							Animation Canvas
						</h3>
						<canvas
							ref={canvasRef}
							width={600}
							height={450}
							className="border border-gray-300 rounded w-full"
							style={{ maxWidth: "100%", height: "auto" }}
						/>
					</div>
				</div>

				<div className="space-y-6">
					<div className="bg-white rounded-lg shadow-md p-4">
						<h3 className="text-lg font-semibold mb-3 text-gray-800">
							Controls
						</h3>

						<div className="space-y-4">
							<div className="flex flex-col space-y-2">
								<button
									type="button"
									onClick={startAnimation}
									disabled={isGlobalAnimation}
									className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
								>
									{isGlobalAnimation ? "Animating..." : "Start All"}
								</button>
								<button
									type="button"
									onClick={stopAnimation}
									disabled={!isGlobalAnimation}
									className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
								>
									Stop
								</button>
								<button
									type="button"
									onClick={resetAnimation}
									className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
								>
									Reset
								</button>
							</div>

							<div>
								<label
									htmlFor="speed-control"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									Animation Speed: {animationSpeed.toFixed(1)}x
								</label>
								<input
									id="speed-control"
									type="range"
									min="0.1"
									max="3"
									step="0.1"
									value={animationSpeed}
									onChange={(e) =>
										setAnimationSpeed(Number.parseFloat(e.target.value))
									}
									className="w-full"
								/>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow-md p-4">
						<h3 className="text-lg font-semibold mb-3 text-gray-800">
							Individual Controls
						</h3>
						<div className="space-y-2">
							{objects.map((obj) => (
								<button
									key={obj.id}
									type="button"
									onClick={() => animateIndividual(obj.id)}
									disabled={obj.isAnimating}
									className="w-full px-3 py-2 text-left text-sm rounded-md border hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
									style={{ borderColor: obj.color, color: obj.color }}
								>
									{obj.easingName}
								</button>
							))}
						</div>
					</div>

					<div className="bg-white rounded-lg shadow-md p-4">
						<h3 className="text-lg font-semibold mb-3 text-gray-800">
							Animation Stats
						</h3>
						<div className="space-y-2">
							<div className="flex justify-between p-2 bg-gray-50 rounded">
								<span>Active Objects:</span>
								<span className="font-mono">
									{objects.filter((o) => o.isAnimating).length}
								</span>
							</div>
							<div className="flex justify-between p-2 bg-gray-50 rounded">
								<span>Speed:</span>
								<span className="font-mono">{animationSpeed.toFixed(1)}x</span>
							</div>
							<div className="flex justify-between p-2 bg-gray-50 rounded">
								<span>Status:</span>
								<span
									className={`font-mono ${isGlobalAnimation ? "text-green-600" : "text-gray-600"}`}
								>
									{isGlobalAnimation ? "Running" : "Stopped"}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="mt-8">
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-yellow-800">
						Easing Functions Explained
					</h3>
					<div className="grid md:grid-cols-2 gap-4 text-yellow-700">
						<div>
							<ul className="space-y-1">
								<li>
									• <strong>Linear</strong>: Constant speed throughout
								</li>
								<li>
									• <strong>Ease In</strong>: Starts slow, accelerates
								</li>
								<li>
									• <strong>Ease Out</strong>: Starts fast, decelerates
								</li>
							</ul>
						</div>
						<div>
							<ul className="space-y-1">
								<li>
									• <strong>Ease In-Out</strong>: Slow start/end, fast middle
								</li>
								<li>
									• <strong>Bounce</strong>: Bouncing effect at the end
								</li>
								<li>
									• <strong>Elastic</strong>: Elastic overshoot and settle
								</li>
							</ul>
						</div>
					</div>
				</div>
			</div>

			<div className="mt-6">
				<Link
					to="/examples/visual"
					className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
				>
					← Back to Examples
				</Link>
			</div>
		</div>
	);
}
