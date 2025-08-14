import { Link, createFileRoute } from "@tanstack/react-router";
import {
	clamp,
	hsl,
	hslToRgb,
	randomFloat,
	randomInt,
	toCssHsl,
	vec2,
	vec2Add,
	vec2Distance,
	vec2Mul,
	vec2Sub,
} from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/visual/voronoi")({
	component: VoronoiExample,
});

interface VoronoiSite {
	x: number;
	y: number;
	color: { h: number; s: number; l: number };
	id: number;
}

interface VoronoiCell {
	site: VoronoiSite;
	vertices: { x: number; y: number }[];
	neighbors: VoronoiSite[];
}

interface Edge {
	start: { x: number; y: number };
	end: { x: number; y: number };
	site1: VoronoiSite;
	site2: VoronoiSite;
}

function VoronoiExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const [sites, setSites] = useState<VoronoiSite[]>([]);
	const [isRelaxing, setIsRelaxing] = useState(false);
	const [relaxationStep, setRelaxationStep] = useState(0);
	const [siteCount, setSiteCount] = useState(25);
	const [showSites, setShowSites] = useState(true);
	const [showEdges, setShowEdges] = useState(true);
	const [showCells, setShowCells] = useState(true);
	const [colorMode, setColorMode] = useState<
		"random" | "distance" | "gradient"
	>("random");
	const [animationSpeed, setAnimationSpeed] = useState(100);

	const generateRandomSites = (count: number): VoronoiSite[] => {
		const canvas = canvasRef.current;
		if (!canvas) return [];

		const newSites: VoronoiSite[] = [];
		for (let i = 0; i < count; i++) {
			newSites.push({
				x: randomFloat(50, canvas.width - 50),
				y: randomFloat(50, canvas.height - 50),
				color: hsl(
					randomFloat(0, 360),
					randomFloat(50, 80),
					randomFloat(40, 70),
				),
				id: i,
			});
		}
		return newSites;
	};

	const generateGridSites = (count: number): VoronoiSite[] => {
		const canvas = canvasRef.current;
		if (!canvas) return [];

		const cols = Math.ceil(Math.sqrt(count));
		const rows = Math.ceil(count / cols);
		const cellWidth = (canvas.width - 100) / cols;
		const cellHeight = (canvas.height - 100) / rows;

		const newSites: VoronoiSite[] = [];
		for (let i = 0; i < count; i++) {
			const col = i % cols;
			const row = Math.floor(i / cols);

			// Add some randomness to grid positions
			const jitterX = randomFloat(-cellWidth * 0.3, cellWidth * 0.3);
			const jitterY = randomFloat(-cellHeight * 0.3, cellHeight * 0.3);

			newSites.push({
				x: 50 + col * cellWidth + cellWidth / 2 + jitterX,
				y: 50 + row * cellHeight + cellHeight / 2 + jitterY,
				color: hsl((i * 137.5) % 360, 70, 60), // Golden angle spacing
				id: i,
			});
		}
		return newSites;
	};

	// Simplified Voronoi computation using pixel-based approach
	const computeVoronoiPixels = (
		sites: VoronoiSite[],
		width: number,
		height: number,
	): ImageData => {
		const imageData = new ImageData(width, height);
		const data = imageData.data;

		for (let y = 0; y < height; y += 2) {
			// Sample every 2 pixels for performance
			for (let x = 0; x < width; x += 2) {
				let closestSite = sites[0];
				let minDistance = Number.POSITIVE_INFINITY;

				// Find closest site
				for (const site of sites) {
					const distance = vec2Distance({ x, y }, { x: site.x, y: site.y });
					if (distance < minDistance) {
						minDistance = distance;
						closestSite = site;
					}
				}

				// Color based on mode
				let color = closestSite.color;
				switch (colorMode) {
					case "distance":
						const normalizedDistance = Math.min(minDistance / 100, 1);
						color = hsl(
							closestSite.color.h,
							closestSite.color.s,
							clamp(70 - normalizedDistance * 30, 20, 70),
						);
						break;
					case "gradient":
						color = hsl(((x + y) * 0.5) % 360, 60, 50);
						break;
				}

				// Convert HSL to RGB for pixel data
				const rgbColor = hslToRgb(color);

				// Fill 2x2 block
				for (let dy = 0; dy < 2 && y + dy < height; dy++) {
					for (let dx = 0; dx < 2 && x + dx < width; dx++) {
						const pixelIndex = ((y + dy) * width + (x + dx)) * 4;
						data[pixelIndex] = rgbColor.r;
						data[pixelIndex + 1] = rgbColor.g;
						data[pixelIndex + 2] = rgbColor.b;
						data[pixelIndex + 3] = 255;
					}
				}
			}
		}

		return imageData;
	};

	// Lloyd's relaxation - move sites to centroids of their cells
	const lloydRelaxation = (currentSites: VoronoiSite[]): VoronoiSite[] => {
		const canvas = canvasRef.current;
		if (!canvas) return currentSites;

		const newSites: VoronoiSite[] = [];
		const sampleDensity = 4; // Sample every 4 pixels for performance

		for (const site of currentSites) {
			let centroidX = 0;
			let centroidY = 0;
			let pixelCount = 0;

			// Sample the canvas to find the centroid of this site's region
			for (let y = 0; y < canvas.height; y += sampleDensity) {
				for (let x = 0; x < canvas.width; x += sampleDensity) {
					let closestSite = currentSites[0];
					let minDistance = Number.POSITIVE_INFINITY;

					// Find which site this pixel belongs to
					for (const testSite of currentSites) {
						const distance = vec2Distance(
							{ x, y },
							{ x: testSite.x, y: testSite.y },
						);
						if (distance < minDistance) {
							minDistance = distance;
							closestSite = testSite;
						}
					}

					// If this pixel belongs to our site, add it to centroid calculation
					if (closestSite.id === site.id) {
						centroidX += x;
						centroidY += y;
						pixelCount++;
					}
				}
			}

			// Calculate new position (centroid)
			const newSite: VoronoiSite = {
				...site,
				x: pixelCount > 0 ? centroidX / pixelCount : site.x,
				y: pixelCount > 0 ? centroidY / pixelCount : site.y,
			};

			// Keep sites within bounds
			newSite.x = clamp(newSite.x, 20, canvas.width - 20);
			newSite.y = clamp(newSite.y, 20, canvas.height - 20);

			newSites.push(newSite);
		}

		return newSites;
	};

	// Find Voronoi edges using a simplified approach
	const findVoronoiEdges = (
		sites: VoronoiSite[],
		width: number,
		height: number,
	): Edge[] => {
		const edges: Edge[] = [];
		const stepSize = 8;

		for (let y = 0; y < height; y += stepSize) {
			for (let x = 0; x < width; x += stepSize) {
				const currentSite = getClosestSite(sites, { x, y });

				// Check right neighbor
				if (x + stepSize < width) {
					const rightSite = getClosestSite(sites, { x: x + stepSize, y });
					if (currentSite.id !== rightSite.id) {
						edges.push({
							start: { x: x + stepSize / 2, y },
							end: { x: x + stepSize / 2, y: y + stepSize },
							site1: currentSite,
							site2: rightSite,
						});
					}
				}

				// Check bottom neighbor
				if (y + stepSize < height) {
					const bottomSite = getClosestSite(sites, { x, y: y + stepSize });
					if (currentSite.id !== bottomSite.id) {
						edges.push({
							start: { x, y: y + stepSize / 2 },
							end: { x: x + stepSize, y: y + stepSize / 2 },
							site1: currentSite,
							site2: bottomSite,
						});
					}
				}
			}
		}

		return edges;
	};

	const getClosestSite = (
		sites: VoronoiSite[],
		point: { x: number; y: number },
	): VoronoiSite => {
		let closest = sites[0];
		let minDistance = Number.POSITIVE_INFINITY;

		for (const site of sites) {
			const distance = vec2Distance(point, { x: site.x, y: site.y });
			if (distance < minDistance) {
				minDistance = distance;
				closest = site;
			}
		}

		return closest;
	};

	const render = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx || sites.length === 0) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw Voronoi cells
		if (showCells) {
			const voronoiData = computeVoronoiPixels(
				sites,
				canvas.width,
				canvas.height,
			);
			ctx.putImageData(voronoiData, 0, 0);
		}

		// Draw Voronoi edges
		if (showEdges) {
			const edges = findVoronoiEdges(sites, canvas.width, canvas.height);
			ctx.strokeStyle = "#ffffff";
			ctx.lineWidth = 1;
			ctx.globalAlpha = 0.8;

			for (const edge of edges) {
				ctx.beginPath();
				ctx.moveTo(edge.start.x, edge.start.y);
				ctx.lineTo(edge.end.x, edge.end.y);
				ctx.stroke();
			}
			ctx.globalAlpha = 1;
		}

		// Draw sites
		if (showSites) {
			sites.forEach((site) => {
				// Site circle
				ctx.fillStyle = toCssHsl({ ...site.color, l: 20 });
				ctx.beginPath();
				ctx.arc(site.x, site.y, 6, 0, Math.PI * 2);
				ctx.fill();

				// Site outline
				ctx.strokeStyle = "#ffffff";
				ctx.lineWidth = 2;
				ctx.stroke();

				// Site center dot
				ctx.fillStyle = "#ffffff";
				ctx.beginPath();
				ctx.arc(site.x, site.y, 2, 0, Math.PI * 2);
				ctx.fill();
			});
		}

		// Draw relaxation step counter
		if (isRelaxing) {
			ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
			ctx.fillRect(10, 10, 200, 40);
			ctx.fillStyle = "#ffffff";
			ctx.font = "16px Arial";
			ctx.fillText(`Relaxation Step: ${relaxationStep}`, 20, 35);
		}
	};

	const startRelaxation = async () => {
		setIsRelaxing(true);
		setRelaxationStep(0);

		let currentSites = [...sites];

		for (let step = 0; step < 20; step++) {
			setRelaxationStep(step + 1);
			currentSites = lloydRelaxation(currentSites);
			setSites([...currentSites]);

			// Animation delay
			await new Promise((resolve) => setTimeout(resolve, 200 - animationSpeed));
		}

		setIsRelaxing(false);
	};

	const addSiteAtMouse = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas || isRelaxing) return;

		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const newSite: VoronoiSite = {
			x,
			y,
			color: hsl(randomFloat(0, 360), randomFloat(50, 80), randomFloat(40, 70)),
			id: Date.now(),
		};

		setSites((prev) => [...prev, newSite]);
		setSiteCount((prev) => prev + 1);
	};

	const resetSites = () => {
		if (isRelaxing) return;
		const newSites = generateRandomSites(siteCount);
		setSites(newSites);
		setRelaxationStep(0);
	};

	const generateGrid = () => {
		if (isRelaxing) return;
		const newSites = generateGridSites(siteCount);
		setSites(newSites);
		setRelaxationStep(0);
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.width = 800;
		canvas.height = 600;

		const initialSites = generateRandomSites(siteCount);
		setSites(initialSites);
	}, []);

	useEffect(() => {
		render();
	}, [sites, showSites, showEdges, showCells, colorMode]);

	useEffect(() => {
		if (sites.length !== siteCount && !isRelaxing) {
			const newSites = generateRandomSites(siteCount);
			setSites(newSites);
		}
	}, [siteCount]);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Interactive Voronoi Tessellation
				</h1>
				<p className="text-gray-600 mb-4">
					Lloyd's relaxation optimization with multiple patterns, click-to-add
					sites, and educational visualizations.
				</p>
				<div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
					<p className="text-emerald-800">
						🔶 Watch sites relax to optimal positions, click to add new sites,
						explore different patterns
					</p>
				</div>
			</div>

			<div className="mb-6">
				<div className="flex flex-wrap gap-4 mb-4">
					<button
						type="button"
						onClick={startRelaxation}
						disabled={isRelaxing}
						className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
					>
						{isRelaxing ? "Relaxing..." : "Start Lloyd's Relaxation"}
					</button>
					<button
						type="button"
						onClick={resetSites}
						disabled={isRelaxing}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
					>
						Random Sites
					</button>
					<button
						type="button"
						onClick={generateGrid}
						disabled={isRelaxing}
						className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
					>
						Grid Pattern
					</button>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Site Count: {siteCount}
						</label>
						<input
							type="range"
							min="5"
							max="100"
							value={siteCount}
							onChange={(e) => setSiteCount(Number(e.target.value))}
							disabled={isRelaxing}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Animation Speed: {animationSpeed}
						</label>
						<input
							type="range"
							min="10"
							max="190"
							value={animationSpeed}
							onChange={(e) => setAnimationSpeed(Number(e.target.value))}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Color Mode
						</label>
						<select
							value={colorMode}
							onChange={(e) => setColorMode(e.target.value as typeof colorMode)}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
						>
							<option value="random">Random Colors</option>
							<option value="distance">Distance Based</option>
							<option value="gradient">Position Gradient</option>
						</select>
					</div>
					<div className="space-y-2">
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={showCells}
								onChange={(e) => setShowCells(e.target.checked)}
								className="mr-2"
							/>
							<span className="text-sm font-medium text-gray-700">
								Show Cells
							</span>
						</label>
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={showEdges}
								onChange={(e) => setShowEdges(e.target.checked)}
								className="mr-2"
							/>
							<span className="text-sm font-medium text-gray-700">
								Show Edges
							</span>
						</label>
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={showSites}
								onChange={(e) => setShowSites(e.target.checked)}
								className="mr-2"
							/>
							<span className="text-sm font-medium text-gray-700">
								Show Sites
							</span>
						</label>
					</div>
				</div>
			</div>

			<div className="mb-6">
				<canvas
					ref={canvasRef}
					className="border border-gray-300 rounded-lg bg-white cursor-crosshair"
					style={{ maxWidth: "100%", height: "auto" }}
					onClick={addSiteAtMouse}
				/>
				<p className="text-sm text-gray-500 mt-2">
					Click on the canvas to add new sites
				</p>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-yellow-800">
						Voronoi Properties
					</h3>
					<ul className="text-yellow-700 space-y-1">
						<li>
							• <strong>Nearest Neighbor</strong>: Each region contains all
							points closest to its site
						</li>
						<li>
							• <strong>Dual of Delaunay</strong>: Connected to triangulation
							theory
						</li>
						<li>
							• <strong>Natural Patterns</strong>: Found in biological cell
							structures
						</li>
						<li>
							• <strong>Optimization</strong>: Lloyd's algorithm minimizes
							energy
						</li>
					</ul>
				</div>

				<div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-emerald-800">
						Lloyd's Relaxation
					</h3>
					<ul className="text-emerald-700 space-y-1">
						<li>
							• <strong>Centroidal Voronoi</strong>: Sites move to region
							centroids
						</li>
						<li>
							• <strong>Energy Minimization</strong>: Reduces overall system
							energy
						</li>
						<li>
							• <strong>Uniform Distribution</strong>: Creates more regular
							spacing
						</li>
						<li>
							• <strong>Iterative Process</strong>: Converges to optimal
							configuration
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
				<h3 className="text-lg font-semibold mb-2 text-blue-800">
					Applications
				</h3>
				<div className="grid md:grid-cols-3 gap-4 text-blue-700">
					<div>
						<strong>Computer Graphics:</strong>
						<ul className="text-sm mt-1">
							<li>• Procedural textures</li>
							<li>• Terrain generation</li>
							<li>• Cell shading</li>
						</ul>
					</div>
					<div>
						<strong>Computational Geometry:</strong>
						<ul className="text-sm mt-1">
							<li>• Mesh generation</li>
							<li>• Spatial analysis</li>
							<li>• Nearest neighbor queries</li>
						</ul>
					</div>
					<div>
						<strong>Real World:</strong>
						<ul className="text-sm mt-1">
							<li>• Ecology and biology</li>
							<li>• Urban planning</li>
							<li>• Material science</li>
						</ul>
					</div>
				</div>
			</div>

			<div className="mt-6">
				<Link
					to="/examples/visual"
					className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
				>
					← Back to Examples
				</Link>
			</div>
		</div>
	);
}
