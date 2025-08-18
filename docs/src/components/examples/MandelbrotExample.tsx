import { clamp, lerp, vec2, vec2Add, vec2Length, vec2Mul } from "play.ts";
import { useCallback, useEffect, useRef, useState } from "react";

interface MandelbrotState {
	centerX: number;
	centerY: number;
	zoom: number;
	maxIterations: number;
	colorMode: number;
	isRendering: boolean;
}

export default function MandelbrotExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [state, setState] = useState<MandelbrotState>({
		centerX: -0.5,
		centerY: 0,
		zoom: 1.0,
		maxIterations: 100,
		colorMode: 0,
		isRendering: false,
	});
	const [progress, setProgress] = useState(0);
	const [isDragging, setIsDragging] = useState(false);
	const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

	const colorPalettes = [
		// Classic blue-red
		(iter: number, max: number): [number, number, number] => {
			if (iter === max) return [0, 0, 0];
			const t = iter / max;
			return [
				Math.floor(255 * Math.sin(t * Math.PI * 2) * 0.5 + 0.5),
				Math.floor(255 * Math.sin(t * Math.PI * 2 + Math.PI / 3) * 0.5 + 0.5),
				Math.floor(
					255 * Math.sin(t * Math.PI * 2 + (2 * Math.PI) / 3) * 0.5 + 0.5,
				),
			];
		},
		// Fire palette
		(iter: number, max: number): [number, number, number] => {
			if (iter === max) return [0, 0, 0];
			const t = iter / max;
			return [
				Math.floor(255 * Math.min(1, t * 3)),
				Math.floor(255 * Math.min(1, Math.max(0, t * 3 - 1))),
				Math.floor(255 * Math.min(1, Math.max(0, t * 3 - 2))),
			];
		},
		// Electric
		(iter: number, max: number): [number, number, number] => {
			if (iter === max) return [0, 0, 0];
			const t = iter / max;
			return [
				Math.floor(255 * t),
				Math.floor(255 * Math.sin(t * Math.PI)),
				Math.floor(255 * (1 - t)),
			];
		},
	];

	const mandelbrot = useCallback(
		(cx: number, cy: number, maxIter: number): number => {
			let x = 0,
				y = 0;
			let iteration = 0;

			while (x * x + y * y <= 4 && iteration < maxIter) {
				const xTemp = x * x - y * y + cx;
				y = 2 * x * y + cy;
				x = xTemp;
				iteration++;
			}

			return iteration;
		},
		[],
	);

	const renderMandelbrot = useCallback(async () => {
		if (state.isRendering) return;

		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		setState((prev) => ({ ...prev, isRendering: true }));
		setProgress(0);

		try {
			const imageData = ctx.createImageData(canvas.width, canvas.height);
			const data = imageData.data;

			const scale = 4 / state.zoom;
			const offsetX = state.centerX - scale / 2;
			const offsetY = state.centerY - scale / 2;

			for (let py = 0; py < canvas.height; py++) {
				// Update progress
				const progressValue = (py / canvas.height) * 100;
				setProgress(progressValue);

				// Allow UI updates every 10 rows
				if (py % 10 === 0) {
					await new Promise((resolve) => setTimeout(resolve, 1));
				}

				for (let px = 0; px < canvas.width; px++) {
					const x = offsetX + (px / canvas.width) * scale;
					const y = offsetY + (py / canvas.height) * scale;

					const iterations = mandelbrot(x, y, state.maxIterations);
					const [r, g, b] = colorPalettes[state.colorMode](
						iterations,
						state.maxIterations,
					);

					const index = (py * canvas.width + px) * 4;
					data[index] = r; // Red
					data[index + 1] = g; // Green
					data[index + 2] = b; // Blue
					data[index + 3] = 255; // Alpha
				}
			}

			ctx.putImageData(imageData, 0, 0);
			setProgress(100);
		} catch (error) {
			console.error("Mandelbrot rendering error:", error);
		} finally {
			setState((prev) => ({ ...prev, isRendering: false }));
			setTimeout(() => setProgress(0), 1000);
		}
	}, [
		state.centerX,
		state.centerY,
		state.zoom,
		state.maxIterations,
		state.colorMode,
		state.isRendering,
		mandelbrot,
	]);

	useEffect(() => {
		renderMandelbrot();
	}, [
		state.centerX,
		state.centerY,
		state.zoom,
		state.maxIterations,
		state.colorMode,
	]);

	const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (state.isRendering) return;

		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		// Convert pixel coordinates to complex plane
		const scale = 4 / state.zoom;
		const newCenterX = state.centerX + (x / canvas.width - 0.5) * scale;
		const newCenterY = state.centerY + (y / canvas.height - 0.5) * scale;

		// Calculate new zoom with limits
		const isRightClick = e.button === 2;
		const zoomFactor = isRightClick ? 0.5 : 2;
		const newZoom = clamp(state.zoom * zoomFactor, 0.1, 1000000); // Limit zoom between 0.1x and 1,000,000x

		setState((prev) => ({
			...prev,
			centerX: newCenterX,
			centerY: newCenterY,
			zoom: newZoom,
		}));
	};

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
	};

	const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (e.button === 0) {
			// Left button
			setIsDragging(true);
			setLastMousePos({ x: e.clientX, y: e.clientY });
		}
	};

	const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (isDragging && !state.isRendering) {
			const deltaX = e.clientX - lastMousePos.x;
			const deltaY = e.clientY - lastMousePos.y;

			const canvas = canvasRef.current;
			if (!canvas) return;

			const scale = 4 / state.zoom;
			setState((prev) => ({
				...prev,
				centerX: prev.centerX - (deltaX / canvas.width) * scale,
				centerY: prev.centerY - (deltaY / canvas.height) * scale,
			}));

			setLastMousePos({ x: e.clientX, y: e.clientY });
		}
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	const resetView = () => {
		setState((prev) => ({
			...prev,
			centerX: -0.5,
			centerY: 0,
			zoom: 1.0,
		}));
	};

	const increaseIterations = () => {
		setState((prev) => ({
			...prev,
			maxIterations: Math.min(prev.maxIterations + 50, 1000),
		}));
	};

	const decreaseIterations = () => {
		setState((prev) => ({
			...prev,
			maxIterations: Math.max(prev.maxIterations - 50, 50),
		}));
	};

	const toggleColorMode = () => {
		setState((prev) => ({
			...prev,
			colorMode: (prev.colorMode + 1) % colorPalettes.length,
		}));
	};

	const saveImage = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const link = document.createElement("a");
		link.download = `mandelbrot-${state.centerX.toFixed(6)}-${state.centerY.toFixed(6)}-${state.zoom.toFixed(1)}x.png`;
		link.href = canvas.toDataURL();
		link.click();
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Interactive Mandelbrot Set Explorer
				</h1>
				<p className="text-gray-600 mb-4">
					Real-time fractal computation with infinite zoom, multiple color
					palettes, and progressive rendering.
				</p>
				<div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
					<p className="text-indigo-800">
						🌀 Click to zoom in, right-click to zoom out, drag to pan around
					</p>
				</div>
			</div>

			<div className="grid lg:grid-cols-4 gap-6">
				<div className="lg:col-span-3">
					<div className="bg-white rounded-lg shadow-lg p-4">
						<canvas
							ref={canvasRef}
							width={600}
							height={600}
							onClick={handleCanvasClick}
							onContextMenu={handleContextMenu}
							onMouseDown={handleMouseDown}
							onMouseMove={handleMouseMove}
							onMouseUp={handleMouseUp}
							className="border border-gray-300 rounded cursor-crosshair w-full max-w-full"
							style={{
								imageRendering: "pixelated",
								maxWidth: "100%",
								height: "auto",
							}}
						/>

						{progress > 0 && (
							<div className="mt-4">
								<div className="flex justify-between text-sm text-gray-600 mb-1">
									<span>Rendering Mandelbrot Set...</span>
									<span>{progress.toFixed(1)}%</span>
								</div>
								<div className="w-full bg-gray-200 rounded-full h-2">
									<div
										className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-100"
										style={{ width: `${progress}%` }}
									/>
								</div>
							</div>
						)}
					</div>
				</div>

				<div className="space-y-4">
					<div className="bg-white rounded-lg shadow-md p-4">
						<h3 className="text-lg font-semibold mb-3 text-gray-800">
							Information
						</h3>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span>Center:</span>
								<span className="font-mono text-blue-600">
									({state.centerX.toFixed(6)}, {state.centerY.toFixed(6)})
								</span>
							</div>
							<div className="flex justify-between">
								<span>Zoom:</span>
								<span className="font-mono text-green-600">
									{state.zoom.toFixed(1)}x
								</span>
							</div>
							<div className="flex justify-between">
								<span>Iterations:</span>
								<span className="font-mono text-purple-600">
									{state.maxIterations}
								</span>
							</div>
							<div className="flex justify-between">
								<span>Color Mode:</span>
								<span className="font-mono text-yellow-600">
									{["Classic", "Fire", "Electric"][state.colorMode]}
								</span>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow-md p-4">
						<h3 className="text-lg font-semibold mb-3 text-gray-800">
							Controls
						</h3>
						<div className="space-y-2">
							<button
								onClick={resetView}
								disabled={state.isRendering}
								className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
							>
								🏠 Reset View
							</button>
							<button
								onClick={increaseIterations}
								disabled={state.isRendering}
								className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
							>
								⬆️ More Detail
							</button>
							<button
								onClick={decreaseIterations}
								disabled={state.isRendering}
								className="w-full px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
							>
								⬇️ Less Detail
							</button>
							<button
								onClick={toggleColorMode}
								disabled={state.isRendering}
								className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
							>
								🎨 Change Colors
							</button>
							<button
								onClick={saveImage}
								disabled={state.isRendering}
								className="w-full px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
							>
								💾 Save PNG
							</button>
						</div>
					</div>

					<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
						<h3 className="text-lg font-semibold mb-2 text-yellow-800">
							About the Mandelbrot Set
						</h3>
						<ul className="text-yellow-700 text-sm space-y-1">
							<li>• Mathematical fractal with infinite detail</li>
							<li>• Based on complex number iterations</li>
							<li>• Self-similar patterns at all scales</li>
							<li>• Boundary between bounded and unbounded behavior</li>
						</ul>
					</div>
				</div>
			</div>

			<div className="mt-8">
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-blue-800">
						How to Explore
					</h3>
					<ul className="text-blue-700 space-y-1">
						<li>
							• <strong>Left click</strong>: Zoom in at that point
						</li>
						<li>
							• <strong>Right click</strong>: Zoom out
						</li>
						<li>
							• <strong>Drag</strong>: Pan around the fractal
						</li>
						<li>
							• <strong>More Detail</strong>: Increases iteration count for
							finer detail
						</li>
						<li>
							• <strong>Change Colors</strong>: Cycles through different color
							palettes
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6">
				<a
					href="/examples/visual"
					className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
				>
					← Back to Examples
				</a>
			</div>
		</div>
	);
}