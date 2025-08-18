import { createFileRoute, Link } from "@tanstack/react-router";
import {
	clamp,
	cos,
	hsl,
	hslToRgb,
	lerp,
	PI,
	randomFloat,
	sin,
	TWO_PI,
	toCssHsl,
	vec2,
	vec2Add,
	vec2Mul,
	vec2Normalize,
} from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/visual/fractal-tree")({
	component: FractalTreeExample,
});

interface TreeNode {
	x: number;
	y: number;
	angle: number;
	length: number;
	generation: number;
	parent?: TreeNode;
	children: TreeNode[];
	isGrowing: boolean;
	growthProgress: number;
	thickness: number;
}

interface TreeSettings {
	maxGenerations: number;
	branchAngle: number;
	lengthScale: number;
	thicknessScale: number;
	growthSpeed: number;
	branchProbability: number;
	windStrength: number;
	colorMode: "generation" | "season" | "rainbow" | "natural";
	showLeaves: boolean;
	animateGrowth: boolean;
}

function FractalTreeExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const timeRef = useRef<number>(0);

	const [tree, setTree] = useState<TreeNode | null>(null);
	const [isGrowing, setIsGrowing] = useState(false);
	const [isAnimating, setIsAnimating] = useState(false);
	const [settings, setSettings] = useState<TreeSettings>({
		maxGenerations: 8,
		branchAngle: 25,
		lengthScale: 0.7,
		thicknessScale: 0.8,
		growthSpeed: 2,
		branchProbability: 0.8,
		windStrength: 0,
		colorMode: "natural",
		showLeaves: true,
		animateGrowth: true,
	});
	const [presetType, setPresetType] = useState<
		"classic" | "weeping" | "pine" | "oak" | "custom"
	>("classic");

	const createTreeNode = (
		x: number,
		y: number,
		angle: number,
		length: number,
		generation: number,
		thickness: number,
		parent?: TreeNode,
	): TreeNode => ({
		x,
		y,
		angle,
		length,
		generation,
		parent,
		children: [],
		isGrowing: false,
		growthProgress: 0,
		thickness,
	});

	const generateTree = (rootX: number, rootY: number): TreeNode => {
		const baseThickness = 12;
		const root = createTreeNode(rootX, rootY, -PI / 2, 80, 0, baseThickness);

		const generateBranches = (node: TreeNode) => {
			if (node.generation >= settings.maxGenerations) return;

			const numBranches =
				node.generation === 0
					? 1
					: Math.random() < settings.branchProbability
						? 2
						: 1;

			for (let i = 0; i < numBranches; i++) {
				let branchAngle = node.angle;

				if (numBranches === 2) {
					const angleOffset =
						((settings.branchAngle * PI) / 180) * (i === 0 ? -1 : 1);
					branchAngle += angleOffset + randomFloat(-0.2, 0.2);
				} else if (node.generation > 0) {
					branchAngle += randomFloat(-0.3, 0.3);
				}

				const newLength =
					node.length * settings.lengthScale * randomFloat(0.8, 1.2);
				const newThickness = node.thickness * settings.thicknessScale;

				const endX = node.x + cos(node.angle) * node.length;
				const endY = node.y + sin(node.angle) * node.length;

				const child = createTreeNode(
					endX,
					endY,
					branchAngle,
					newLength,
					node.generation + 1,
					newThickness,
					node,
				);

				node.children.push(child);
				generateBranches(child);
			}
		};

		generateBranches(root);
		return root;
	};

	const applyPreset = (type: string) => {
		switch (type) {
			case "classic":
				setSettings((prev) => ({
					...prev,
					maxGenerations: 8,
					branchAngle: 25,
					lengthScale: 0.7,
					thicknessScale: 0.8,
					branchProbability: 0.8,
				}));
				break;
			case "weeping":
				setSettings((prev) => ({
					...prev,
					maxGenerations: 10,
					branchAngle: 15,
					lengthScale: 0.85,
					thicknessScale: 0.9,
					branchProbability: 0.6,
				}));
				break;
			case "pine":
				setSettings((prev) => ({
					...prev,
					maxGenerations: 12,
					branchAngle: 35,
					lengthScale: 0.6,
					thicknessScale: 0.75,
					branchProbability: 0.9,
				}));
				break;
			case "oak":
				setSettings((prev) => ({
					...prev,
					maxGenerations: 6,
					branchAngle: 40,
					lengthScale: 0.8,
					thicknessScale: 0.85,
					branchProbability: 0.7,
				}));
				break;
		}
	};

	const startGrowthAnimation = async () => {
		if (!tree) return;

		setIsGrowing(true);

		const animateNode = async (node: TreeNode): Promise<void> => {
			node.isGrowing = true;

			// Animate growth progress
			while (node.growthProgress < 1) {
				node.growthProgress = Math.min(
					1,
					node.growthProgress + settings.growthSpeed * 0.02,
				);
				await new Promise((resolve) => setTimeout(resolve, 16));
			}

			node.isGrowing = false;

			// Animate children with delay
			const promises = node.children.map(
				(child, index) =>
					new Promise<void>((resolve) => {
						setTimeout(() => {
							animateNode(child).then(resolve);
						}, index * 100);
					}),
			);

			await Promise.all(promises);
		};

		tree.growthProgress = 0;
		await animateNode(tree);
		setIsGrowing(false);
	};

	const getBranchColor = (node: TreeNode, time: number): string => {
		switch (settings.colorMode) {
			case "generation": {
				const hue = (node.generation * 30) % 360;
				return toCssHsl(hsl(hue, 70, 40));
			}
			case "season": {
				const seasonHue =
					120 - (node.generation / settings.maxGenerations) * 80;
				return toCssHsl(hsl(seasonHue, 60, 35));
			}
			case "rainbow": {
				const hue = (node.generation * 45 + time * 50) % 360;
				return toCssHsl(hsl(hue, 80, 50));
			}
			case "natural":
			default: {
				const brown = 25 + node.generation * 5;
				const saturation = 40 - node.generation * 3;
				const lightness = 20 + node.generation * 2;
				return toCssHsl(hsl(brown, saturation, lightness));
			}
		}
	};

	const getLeafColor = (node: TreeNode, time: number): string => {
		switch (settings.colorMode) {
			case "season": {
				const autumnHue = 60 + sin(time * 0.5 + node.x * 0.01) * 40;
				return toCssHsl(hsl(autumnHue, 80, 50));
			}
			case "rainbow": {
				const hue = (time * 100 + node.x + node.y) % 360;
				return toCssHsl(hsl(hue, 70, 60));
			}
			default: {
				const greenHue = 100 + randomFloat(-20, 20);
				return toCssHsl(hsl(greenHue, 70, 40));
			}
		}
	};

	const drawBranch = (
		ctx: CanvasRenderingContext2D,
		node: TreeNode,
		time: number,
	) => {
		if (!node.parent) return;

		const progress = settings.animateGrowth ? node.growthProgress : 1;
		if (progress <= 0) return;

		const windOffset =
			settings.windStrength * sin(time * 2 + node.generation * 0.5) * 0.02;
		const actualAngle = node.parent.angle + windOffset;

		const startX = node.parent.x;
		const startY = node.parent.y;
		const endX = startX + cos(actualAngle) * node.parent.length * progress;
		const endY = startY + sin(actualAngle) * node.parent.length * progress;

		// Draw branch
		ctx.strokeStyle = getBranchColor(node, time);
		ctx.lineWidth = node.parent.thickness * (1 + node.generation * 0.1);
		ctx.lineCap = "round";

		ctx.beginPath();
		ctx.moveTo(startX, startY);
		ctx.lineTo(endX, endY);
		ctx.stroke();

		// Draw leaves on terminal branches
		if (settings.showLeaves && node.children.length === 0 && progress > 0.8) {
			const leafSize = 3 + randomFloat(-1, 2);
			ctx.fillStyle = getLeafColor(node, time);

			for (let i = 0; i < 3; i++) {
				const leafX = endX + randomFloat(-10, 10);
				const leafY = endY + randomFloat(-10, 10);

				ctx.beginPath();
				ctx.arc(leafX, leafY, leafSize, 0, TWO_PI);
				ctx.fill();
			}
		}
	};

	const drawTree = (
		ctx: CanvasRenderingContext2D,
		node: TreeNode,
		time: number,
	) => {
		if (node.parent) {
			drawBranch(ctx, node, time);
		}

		node.children.forEach((child) => drawTree(ctx, child, time));
	};

	const render = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx || !tree) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw gradient background
		const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
		gradient.addColorStop(0, "#87CEEB");
		gradient.addColorStop(1, "#98FB98");
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Draw ground
		ctx.fillStyle = "#8B4513";
		ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

		const time = timeRef.current;

		// Draw tree trunk
		ctx.strokeStyle = getBranchColor(tree, time);
		ctx.lineWidth = tree.thickness;
		ctx.lineCap = "round";

		const trunkProgress = settings.animateGrowth ? tree.growthProgress : 1;
		if (trunkProgress > 0) {
			const trunkEndX = tree.x + cos(tree.angle) * tree.length * trunkProgress;
			const trunkEndY = tree.y + sin(tree.angle) * tree.length * trunkProgress;

			ctx.beginPath();
			ctx.moveTo(tree.x, tree.y);
			ctx.lineTo(trunkEndX, trunkEndY);
			ctx.stroke();
		}

		// Draw all branches
		drawTree(ctx, tree, time);

		// Draw growth info
		if (isGrowing) {
			ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
			ctx.fillRect(10, 10, 180, 40);
			ctx.fillStyle = "#ffffff";
			ctx.font = "14px Arial";
			ctx.fillText("Growing...", 20, 30);
			ctx.fillText(`Generation: ${getCurrentGeneration(tree)}`, 20, 50);
		}
	};

	const getCurrentGeneration = (node: TreeNode): number => {
		let maxGen = node.generation;

		const checkChildren = (n: TreeNode) => {
			if (n.growthProgress > 0) {
				maxGen = Math.max(maxGen, n.generation);
			}
			n.children.forEach(checkChildren);
		};

		checkChildren(node);
		return maxGen;
	};

	const animate = () => {
		timeRef.current += 0.02;
		render();
		if (isAnimating) {
			animationRef.current = requestAnimationFrame(animate);
		}
	};

	const startAnimation = () => {
		setIsAnimating(true);
		animationRef.current = requestAnimationFrame(animate);
	};

	const stopAnimation = () => {
		setIsAnimating(false);
		if (animationRef.current) {
			cancelAnimationFrame(animationRef.current);
		}
	};

	const generateNewTree = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const newTree = generateTree(canvas.width / 2, canvas.height - 20);
		setTree(newTree);

		// Reset growth animation
		const resetGrowth = (node: TreeNode) => {
			node.growthProgress = settings.animateGrowth ? 0 : 1;
			node.isGrowing = false;
			node.children.forEach(resetGrowth);
		};

		resetGrowth(newTree);
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.width = 800;
		canvas.height = 600;

		generateNewTree();
	}, []);

	useEffect(() => {
		if (presetType !== "custom") {
			applyPreset(presetType);
		}
	}, [presetType]);

	useEffect(() => {
		generateNewTree();
	}, [
		settings.maxGenerations,
		settings.branchAngle,
		settings.lengthScale,
		settings.thicknessScale,
		settings.branchProbability,
	]);

	useEffect(() => {
		if (!isAnimating) render();
	}, [tree, settings.colorMode, settings.showLeaves, settings.windStrength]);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">Fractal Tree Generator</h1>
				<p className="text-gray-600 mb-4">
					Interactive fractal tree generation with L-system-inspired growth
					patterns and customizable parameters.
				</p>
				<div className="bg-green-50 border border-green-200 rounded-lg p-4">
					<p className="text-green-800">
						🌳 Watch trees grow organically with realistic branching patterns,
						wind effects, and seasonal colors
					</p>
				</div>
			</div>

			<div className="mb-6">
				<div className="flex flex-wrap gap-4 mb-4">
					<button
						type="button"
						onClick={startAnimation}
						disabled={isAnimating}
						className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
					>
						Start Animation
					</button>
					<button
						type="button"
						onClick={stopAnimation}
						disabled={!isAnimating}
						className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
					>
						Stop Animation
					</button>
					<button
						type="button"
						onClick={generateNewTree}
						disabled={isGrowing}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
					>
						New Tree
					</button>
					<button
						type="button"
						onClick={startGrowthAnimation}
						disabled={isGrowing || !tree}
						className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 transition-colors"
					>
						{isGrowing ? "Growing..." : "Animate Growth"}
					</button>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Tree Type
						</label>
						<select
							value={presetType}
							onChange={(e) =>
								setPresetType(e.target.value as typeof presetType)
							}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
						>
							<option value="classic">Classic</option>
							<option value="weeping">Weeping Willow</option>
							<option value="pine">Pine Tree</option>
							<option value="oak">Oak Tree</option>
							<option value="custom">Custom</option>
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Color Mode
						</label>
						<select
							value={settings.colorMode}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									colorMode: e.target.value as typeof settings.colorMode,
								}))
							}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
						>
							<option value="natural">Natural Brown</option>
							<option value="generation">By Generation</option>
							<option value="season">Seasonal</option>
							<option value="rainbow">Rainbow</option>
						</select>
					</div>
					<div className="space-y-2">
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={settings.showLeaves}
								onChange={(e) =>
									setSettings((prev) => ({
										...prev,
										showLeaves: e.target.checked,
									}))
								}
								className="mr-2"
							/>
							<span className="text-sm font-medium text-gray-700">
								Show Leaves
							</span>
						</label>
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={settings.animateGrowth}
								onChange={(e) =>
									setSettings((prev) => ({
										...prev,
										animateGrowth: e.target.checked,
									}))
								}
								className="mr-2"
							/>
							<span className="text-sm font-medium text-gray-700">
								Animate Growth
							</span>
						</label>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Wind Strength: {settings.windStrength.toFixed(1)}
						</label>
						<input
							type="range"
							min="0"
							max="5"
							step="0.1"
							value={settings.windStrength}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									windStrength: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Generations: {settings.maxGenerations}
						</label>
						<input
							type="range"
							min="3"
							max="12"
							value={settings.maxGenerations}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									maxGenerations: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Branch Angle: {settings.branchAngle}°
						</label>
						<input
							type="range"
							min="10"
							max="60"
							value={settings.branchAngle}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									branchAngle: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Length Scale: {settings.lengthScale.toFixed(2)}
						</label>
						<input
							type="range"
							min="0.5"
							max="0.9"
							step="0.05"
							value={settings.lengthScale}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									lengthScale: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Branch Probability: {settings.branchProbability.toFixed(2)}
						</label>
						<input
							type="range"
							min="0.3"
							max="1"
							step="0.1"
							value={settings.branchProbability}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									branchProbability: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Growth Speed: {settings.growthSpeed}
						</label>
						<input
							type="range"
							min="0.5"
							max="5"
							step="0.5"
							value={settings.growthSpeed}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									growthSpeed: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
				</div>
			</div>

			<div className="mb-6">
				<canvas
					ref={canvasRef}
					className="border border-gray-300 rounded-lg bg-gradient-to-b from-blue-200 to-green-200"
					style={{ maxWidth: "100%", height: "auto" }}
				/>
				<p className="text-sm text-gray-500 mt-2">
					Fractal tree with organic growth patterns and environmental effects
				</p>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-amber-800">
						Fractal Concepts
					</h3>
					<ul className="text-amber-700 space-y-1">
						<li>
							• <strong>Self-Similarity</strong>: Branches repeat patterns at
							different scales
						</li>
						<li>
							• <strong>Recursive Generation</strong>: Each branch spawns
							smaller versions
						</li>
						<li>
							• <strong>L-System Inspiration</strong>: Rule-based organic growth
						</li>
						<li>
							• <strong>Natural Variation</strong>: Random elements create
							realistic forms
						</li>
					</ul>
				</div>

				<div className="bg-green-50 border border-green-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-green-800">
						Interactive Features
					</h3>
					<ul className="text-green-700 space-y-1">
						<li>
							• <strong>Tree Presets</strong>: Classic, willow, pine, and oak
							forms
						</li>
						<li>
							• <strong>Growth Animation</strong>: Watch trees develop
							organically
						</li>
						<li>
							• <strong>Environmental Effects</strong>: Wind simulation and
							seasonal colors
						</li>
						<li>
							• <strong>Parametric Control</strong>: Fine-tune every aspect of
							growth
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
							<li>• Procedural vegetation</li>
							<li>• Game environment assets</li>
							<li>• Architectural visualization</li>
						</ul>
					</div>
					<div>
						<strong>Scientific Modeling:</strong>
						<ul className="text-sm mt-1">
							<li>• Biological growth patterns</li>
							<li>• Neural network structures</li>
							<li>• Vascular system modeling</li>
						</ul>
					</div>
					<div>
						<strong>Art & Design:</strong>
						<ul className="text-sm mt-1">
							<li>• Generative art patterns</li>
							<li>• Logo and brand design</li>
							<li>• Educational visualization</li>
						</ul>
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
