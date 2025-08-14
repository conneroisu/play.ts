import { Link, createFileRoute } from "@tanstack/react-router";
import {
	PI,
	TWO_PI,
	clamp,
	cos,
	hsl,
	hslToRgb,
	lerp,
	randomFloat,
	sin,
	toCssHsl,
	vec2,
	vec2Add,
	vec2Distance,
	vec2Mul,
	vec2Normalize,
	vec2Sub,
} from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/examples/visual/neural-network")({
	component: NeuralNetworkExample,
});

interface Neuron {
	x: number;
	y: number;
	activation: number;
	bias: number;
	layer: number;
	index: number;
	id: string;
	error: number;
	targetActivation?: number;
}

interface Connection {
	from: Neuron;
	to: Neuron;
	weight: number;
	id: string;
	activity: number;
}

interface NetworkTopology {
	layers: number[];
	activationFunction: "sigmoid" | "tanh" | "relu" | "leaky_relu";
	learningRate: number;
	momentum: number;
}

interface TrainingData {
	inputs: number[];
	outputs: number[];
	name: string;
}

function NeuralNetworkExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const timeRef = useRef<number>(0);

	const [neurons, setNeurons] = useState<Neuron[]>([]);
	const [connections, setConnections] = useState<Connection[]>([]);
	const [isTraining, setIsTraining] = useState(false);
	const [isAnimating, setIsAnimating] = useState(false);
	const [topology, setTopology] = useState<NetworkTopology>({
		layers: [3, 4, 3, 2],
		activationFunction: "sigmoid",
		learningRate: 0.1,
		momentum: 0.9,
	});
	const [currentEpoch, setCurrentEpoch] = useState(0);
	const [totalError, setTotalError] = useState(0);
	const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
	const [currentDataIndex, setCurrentDataIndex] = useState(0);
	const [networkType, setNetworkType] = useState<
		"classification" | "regression" | "autoencoder" | "custom"
	>("classification");
	const [showWeights, setShowWeights] = useState(true);
	const [showActivations, setShowActivations] = useState(true);
	const [showBias, setShowBias] = useState(false);

	const activationFunctions = {
		sigmoid: (x: number) => 1 / (1 + Math.exp(-x)),
		tanh: (x: number) => Math.tanh(x),
		relu: (x: number) => Math.max(0, x),
		leaky_relu: (x: number) => (x > 0 ? x : 0.01 * x),
	};

	const activationDerivatives = {
		sigmoid: (x: number) => x * (1 - x),
		tanh: (x: number) => 1 - x * x,
		relu: (x: number) => (x > 0 ? 1 : 0),
		leaky_relu: (x: number) => (x > 0 ? 1 : 0.01),
	};

	const generateTrainingData = (type: string): TrainingData[] => {
		const data: TrainingData[] = [];

		switch (type) {
			case "classification":
				// XOR problem
				data.push(
					{ inputs: [0, 0, 1], outputs: [0, 1], name: "Class A" },
					{ inputs: [0, 1, 1], outputs: [1, 0], name: "Class B" },
					{ inputs: [1, 0, 1], outputs: [1, 0], name: "Class B" },
					{ inputs: [1, 1, 1], outputs: [0, 1], name: "Class A" },
				);
				break;
			case "regression":
				// Function approximation
				for (let i = 0; i < 8; i++) {
					const x = i / 7;
					const y = sin(x * PI * 2);
					const z = cos(x * PI * 2);
					data.push({
						inputs: [x, 0.5, 1],
						outputs: [y, z],
						name: `Point ${i}`,
					});
				}
				break;
			case "autoencoder":
				// Identity mapping with noise
				for (let i = 0; i < 6; i++) {
					const pattern = Array(3).fill(0);
					pattern[i % 3] = 1;
					data.push({
						inputs: pattern,
						outputs: pattern,
						name: `Pattern ${i}`,
					});
				}
				break;
		}

		return data;
	};

	const createNeurons = (layers: number[]): Neuron[] => {
		const canvas = canvasRef.current;
		if (!canvas) return [];

		const newNeurons: Neuron[] = [];
		const layerSpacing = (canvas.width - 100) / (layers.length - 1);

		layers.forEach((layerSize, layerIndex) => {
			const neuronSpacing =
				layerSize > 1 ? (canvas.height - 100) / (layerSize - 1) : 0;
			const startY = layerSize === 1 ? canvas.height / 2 : 50;

			for (let neuronIndex = 0; neuronIndex < layerSize; neuronIndex++) {
				const x = 50 + layerIndex * layerSpacing;
				const y = startY + neuronIndex * neuronSpacing;

				newNeurons.push({
					x,
					y,
					activation: 0,
					bias: randomFloat(-0.5, 0.5),
					layer: layerIndex,
					index: neuronIndex,
					id: `${layerIndex}-${neuronIndex}`,
					error: 0,
				});
			}
		});

		return newNeurons;
	};

	const createConnections = (neurons: Neuron[]): Connection[] => {
		const newConnections: Connection[] = [];

		for (let i = 0; i < neurons.length; i++) {
			const fromNeuron = neurons[i];

			// Connect to all neurons in the next layer
			for (let j = 0; j < neurons.length; j++) {
				const toNeuron = neurons[j];

				if (toNeuron.layer === fromNeuron.layer + 1) {
					newConnections.push({
						from: fromNeuron,
						to: toNeuron,
						weight: randomFloat(-1, 1),
						id: `${fromNeuron.id}-${toNeuron.id}`,
						activity: 0,
					});
				}
			}
		}

		return newConnections;
	};

	const applyNetworkType = (type: string) => {
		switch (type) {
			case "classification":
				setTopology((prev) => ({ ...prev, layers: [3, 4, 3, 2] }));
				break;
			case "regression":
				setTopology((prev) => ({ ...prev, layers: [3, 5, 4, 2] }));
				break;
			case "autoencoder":
				setTopology((prev) => ({ ...prev, layers: [3, 2, 3] }));
				break;
		}

		const data = generateTrainingData(type);
		setTrainingData(data);
		setCurrentDataIndex(0);
	};

	const forwardPropagate = (inputs: number[]) => {
		// Set input layer activations
		const inputNeurons = neurons.filter((n) => n.layer === 0);
		inputNeurons.forEach((neuron, index) => {
			neuron.activation = inputs[index] || 0;
		});

		// Propagate through each layer
		const maxLayer = Math.max(...neurons.map((n) => n.layer));
		for (let layer = 1; layer <= maxLayer; layer++) {
			const layerNeurons = neurons.filter((n) => n.layer === layer);

			layerNeurons.forEach((neuron) => {
				let sum = neuron.bias;

				// Sum weighted inputs from previous layer
				connections.forEach((conn) => {
					if (conn.to.id === neuron.id) {
						sum += conn.from.activation * conn.weight;
						conn.activity = Math.abs(conn.from.activation * conn.weight);
					}
				});

				neuron.activation =
					activationFunctions[topology.activationFunction](sum);
			});
		}
	};

	const backPropagate = (targetOutputs: number[]) => {
		const maxLayer = Math.max(...neurons.map((n) => n.layer));
		const outputNeurons = neurons.filter((n) => n.layer === maxLayer);

		// Calculate output layer errors
		outputNeurons.forEach((neuron, index) => {
			const target = targetOutputs[index] || 0;
			const error = target - neuron.activation;
			neuron.error =
				error *
				activationDerivatives[topology.activationFunction](neuron.activation);
			neuron.targetActivation = target;
		});

		// Backpropagate errors through hidden layers
		for (let layer = maxLayer - 1; layer >= 0; layer--) {
			const layerNeurons = neurons.filter((n) => n.layer === layer);

			layerNeurons.forEach((neuron) => {
				let errorSum = 0;

				connections.forEach((conn) => {
					if (conn.from.id === neuron.id) {
						errorSum += conn.to.error * conn.weight;
					}
				});

				neuron.error =
					errorSum *
					activationDerivatives[topology.activationFunction](neuron.activation);
			});
		}

		// Update weights and biases
		connections.forEach((conn) => {
			const weightDelta =
				topology.learningRate * conn.to.error * conn.from.activation;
			conn.weight += weightDelta;
			conn.weight = clamp(conn.weight, -5, 5); // Prevent exploding weights
		});

		neurons.forEach((neuron) => {
			if (neuron.layer > 0) {
				neuron.bias += topology.learningRate * neuron.error;
				neuron.bias = clamp(neuron.bias, -3, 3);
			}
		});
	};

	const trainNetwork = async () => {
		setIsTraining(true);
		setCurrentEpoch(0);

		for (let epoch = 0; epoch < 200; epoch++) {
			let epochError = 0;

			for (let dataIndex = 0; dataIndex < trainingData.length; dataIndex++) {
				const data = trainingData[dataIndex];
				setCurrentDataIndex(dataIndex);

				forwardPropagate(data.inputs);
				backPropagate(data.outputs);

				// Calculate error
				const outputNeurons = neurons.filter(
					(n) => n.layer === Math.max(...neurons.map((n) => n.layer)),
				);
				outputNeurons.forEach((neuron, i) => {
					const target = data.outputs[i] || 0;
					epochError += Math.pow(target - neuron.activation, 2);
				});

				await new Promise((resolve) => setTimeout(resolve, 50));
			}

			setCurrentEpoch(epoch + 1);
			setTotalError(epochError / trainingData.length);

			if (epochError < 0.01) break;
		}

		setIsTraining(false);
	};

	const getConnectionColor = (connection: Connection): string => {
		const weight = connection.weight;
		const activity = connection.activity;

		if (!showWeights) {
			return `rgba(100, 100, 100, ${0.3 + activity * 0.7})`;
		}

		const intensity = Math.abs(weight) / 5;
		const alpha = 0.3 + activity * 0.7;

		if (weight > 0) {
			return `rgba(100, 255, 100, ${alpha})`;
		} else {
			return `rgba(255, 100, 100, ${alpha})`;
		}
	};

	const getNeuronColor = (neuron: Neuron): string => {
		if (!showActivations) {
			return "#4A90E2";
		}

		const activation = neuron.activation;
		const intensity = Math.abs(activation);

		if (neuron.layer === 0) {
			// Input neurons - blue gradient
			return toCssHsl(hsl(220, 80, 30 + intensity * 50));
		} else if (neuron.layer === Math.max(...neurons.map((n) => n.layer))) {
			// Output neurons - green/red based on target
			if (neuron.targetActivation !== undefined) {
				const error = Math.abs(neuron.targetActivation - activation);
				const hue = error < 0.1 ? 120 : 0; // Green if close, red if far
				return toCssHsl(hsl(hue, 80, 30 + intensity * 50));
			}
			return toCssHsl(hsl(120, 80, 30 + intensity * 50));
		} else {
			// Hidden neurons - purple gradient
			return toCssHsl(hsl(280, 80, 30 + intensity * 50));
		}
	};

	const render = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw background gradient
		const gradient = ctx.createLinearGradient(
			0,
			0,
			canvas.width,
			canvas.height,
		);
		gradient.addColorStop(0, "#1a1a2e");
		gradient.addColorStop(1, "#16213e");
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		const time = timeRef.current;

		// Draw connections
		connections.forEach((connection) => {
			const { from, to } = connection;

			ctx.strokeStyle = getConnectionColor(connection);
			ctx.lineWidth = 1 + Math.abs(connection.weight) * 2;
			ctx.lineCap = "round";

			// Animated connection flow
			const pulseOffset = sin(time * 3 + connection.weight * 10) * 0.5 + 0.5;
			const alpha = connection.activity * pulseOffset;

			if (alpha > 0.1) {
				ctx.globalAlpha = alpha;
				ctx.beginPath();
				ctx.moveTo(from.x, from.y);
				ctx.lineTo(to.x, to.y);
				ctx.stroke();

				// Weight label
				if (showWeights && Math.abs(connection.weight) > 0.5) {
					const midX = (from.x + to.x) / 2;
					const midY = (from.y + to.y) / 2;
					ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
					ctx.font = "10px Arial";
					ctx.textAlign = "center";
					ctx.fillText(connection.weight.toFixed(1), midX, midY);
				}
			}
			ctx.globalAlpha = 1;
		});

		// Draw neurons
		neurons.forEach((neuron) => {
			const pulseSize =
				2 + sin(time * 2 + neuron.activation * 5) * neuron.activation * 3;
			const radius = 15 + pulseSize;

			// Neuron body
			ctx.fillStyle = getNeuronColor(neuron);
			ctx.beginPath();
			ctx.arc(neuron.x, neuron.y, radius, 0, TWO_PI);
			ctx.fill();

			// Neuron outline
			ctx.strokeStyle = "#ffffff";
			ctx.lineWidth = 2;
			ctx.stroke();

			// Neuron activation value
			if (showActivations) {
				ctx.fillStyle = "#ffffff";
				ctx.font = "12px Arial";
				ctx.textAlign = "center";
				ctx.fillText(neuron.activation.toFixed(2), neuron.x, neuron.y + 4);
			}

			// Bias indicator
			if (showBias && neuron.layer > 0) {
				ctx.fillStyle = neuron.bias > 0 ? "#90EE90" : "#FFB6C1";
				ctx.beginPath();
				ctx.arc(neuron.x + 20, neuron.y - 20, 8, 0, TWO_PI);
				ctx.fill();
				ctx.fillStyle = "#000000";
				ctx.font = "8px Arial";
				ctx.textAlign = "center";
				ctx.fillText("B", neuron.x + 20, neuron.y - 16);
			}

			// Layer labels
			if (neuron.index === 0) {
				ctx.fillStyle = "#ffffff";
				ctx.font = "14px Arial";
				ctx.textAlign = "center";

				let layerName = "";
				if (neuron.layer === 0) layerName = "Input";
				else if (neuron.layer === Math.max(...neurons.map((n) => n.layer)))
					layerName = "Output";
				else layerName = `Hidden ${neuron.layer}`;

				ctx.fillText(layerName, neuron.x, neuron.y - 40);
			}
		});

		// Draw training info
		if (isTraining || currentEpoch > 0) {
			ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
			ctx.fillRect(10, 10, 250, 100);
			ctx.fillStyle = "#ffffff";
			ctx.font = "14px Arial";
			ctx.textAlign = "left";
			ctx.fillText(`Epoch: ${currentEpoch}`, 20, 30);
			ctx.fillText(`Error: ${totalError.toFixed(4)}`, 20, 50);
			ctx.fillText(`Learning Rate: ${topology.learningRate}`, 20, 70);

			if (trainingData[currentDataIndex]) {
				ctx.fillText(
					`Training: ${trainingData[currentDataIndex].name}`,
					20,
					90,
				);
			}

			if (isTraining) {
				ctx.fillText("Training...", 20, 110);
			}
		}

		// Draw current input/output
		if (trainingData[currentDataIndex]) {
			const data = trainingData[currentDataIndex];
			ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
			ctx.fillRect(canvas.width - 200, 10, 180, 80);
			ctx.fillStyle = "#ffffff";
			ctx.font = "12px Arial";
			ctx.textAlign = "left";
			ctx.fillText("Current Pattern:", canvas.width - 190, 30);
			ctx.fillText(
				`Input: [${data.inputs.map((x) => x.toFixed(1)).join(", ")}]`,
				canvas.width - 190,
				50,
			);
			ctx.fillText(
				`Target: [${data.outputs.map((x) => x.toFixed(1)).join(", ")}]`,
				canvas.width - 190,
				70,
			);
		}
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

	const initializeNetwork = () => {
		const newNeurons = createNeurons(topology.layers);
		const newConnections = createConnections(newNeurons);
		setNeurons(newNeurons);
		setConnections(newConnections);
		setCurrentEpoch(0);
		setTotalError(0);
	};

	const testPattern = (index: number) => {
		if (trainingData[index]) {
			setCurrentDataIndex(index);
			forwardPropagate(trainingData[index].inputs);
		}
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.width = 900;
		canvas.height = 600;

		applyNetworkType(networkType);
		initializeNetwork();
	}, []);

	useEffect(() => {
		if (networkType !== "custom") {
			applyNetworkType(networkType);
		}
	}, [networkType]);

	useEffect(() => {
		initializeNetwork();
	}, [topology.layers]);

	useEffect(() => {
		if (!isAnimating) render();
	}, [
		neurons,
		connections,
		showWeights,
		showActivations,
		showBias,
		currentDataIndex,
	]);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Neural Network Visualization
				</h1>
				<p className="text-gray-600 mb-4">
					Interactive neural network with real-time learning visualization,
					backpropagation, and customizable architectures.
				</p>
				<div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
					<p className="text-indigo-800">
						🧠 Watch neurons learn patterns through training, see weights
						update, explore different network types
					</p>
				</div>
			</div>

			<div className="mb-6">
				<div className="flex flex-wrap gap-4 mb-4">
					<button
						type="button"
						onClick={startAnimation}
						disabled={isAnimating}
						className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
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
						onClick={trainNetwork}
						disabled={isTraining}
						className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
					>
						{isTraining ? "Training..." : "Train Network"}
					</button>
					<button
						type="button"
						onClick={initializeNetwork}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
					>
						Reset Network
					</button>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Network Type
						</label>
						<select
							value={networkType}
							onChange={(e) =>
								setNetworkType(e.target.value as typeof networkType)
							}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
						>
							<option value="classification">Classification (XOR)</option>
							<option value="regression">Function Approximation</option>
							<option value="autoencoder">Autoencoder</option>
							<option value="custom">Custom</option>
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Activation Function
						</label>
						<select
							value={topology.activationFunction}
							onChange={(e) =>
								setTopology((prev) => ({
									...prev,
									activationFunction: e.target
										.value as typeof prev.activationFunction,
								}))
							}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
						>
							<option value="sigmoid">Sigmoid</option>
							<option value="tanh">Tanh</option>
							<option value="relu">ReLU</option>
							<option value="leaky_relu">Leaky ReLU</option>
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Learning Rate: {topology.learningRate.toFixed(2)}
						</label>
						<input
							type="range"
							min="0.01"
							max="1"
							step="0.01"
							value={topology.learningRate}
							onChange={(e) =>
								setTopology((prev) => ({
									...prev,
									learningRate: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div className="space-y-2">
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={showWeights}
								onChange={(e) => setShowWeights(e.target.checked)}
								className="mr-2"
							/>
							<span className="text-sm font-medium text-gray-700">
								Show Weights
							</span>
						</label>
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={showActivations}
								onChange={(e) => setShowActivations(e.target.checked)}
								className="mr-2"
							/>
							<span className="text-sm font-medium text-gray-700">
								Show Activations
							</span>
						</label>
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={showBias}
								onChange={(e) => setShowBias(e.target.checked)}
								className="mr-2"
							/>
							<span className="text-sm font-medium text-gray-700">
								Show Bias
							</span>
						</label>
					</div>
				</div>

				{trainingData.length > 0 && (
					<div className="mb-4">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Test Patterns
						</label>
						<div className="flex flex-wrap gap-2">
							{trainingData.map((data, index) => (
								<button
									key={index}
									type="button"
									onClick={() => testPattern(index)}
									className={`px-3 py-1 text-sm rounded-md transition-colors ${
										index === currentDataIndex
											? "bg-indigo-600 text-white"
											: "bg-gray-200 text-gray-700 hover:bg-gray-300"
									}`}
								>
									{data.name}
								</button>
							))}
						</div>
					</div>
				)}
			</div>

			<div className="mb-6">
				<canvas
					ref={canvasRef}
					className="border border-gray-300 rounded-lg bg-gradient-to-br from-gray-900 to-blue-900"
					style={{ maxWidth: "100%", height: "auto" }}
				/>
				<p className="text-sm text-gray-500 mt-2">
					Neural network with animated learning and real-time weight
					visualization
				</p>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-purple-800">
						Machine Learning Concepts
					</h3>
					<ul className="text-purple-700 space-y-1">
						<li>
							• <strong>Forward Propagation</strong>: Signal flows from input to
							output
						</li>
						<li>
							• <strong>Backpropagation</strong>: Error gradients update weights
						</li>
						<li>
							• <strong>Activation Functions</strong>: Non-linear
							transformations
						</li>
						<li>
							• <strong>Learning Rate</strong>: Controls speed of weight updates
						</li>
					</ul>
				</div>

				<div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-indigo-800">
						Visualization Features
					</h3>
					<ul className="text-indigo-700 space-y-1">
						<li>
							• <strong>Weight Visualization</strong>: Green for positive, red
							for negative
						</li>
						<li>
							• <strong>Activation Patterns</strong>: Neuron brightness shows
							activity
						</li>
						<li>
							• <strong>Training Progress</strong>: Real-time error and epoch
							tracking
						</li>
						<li>
							• <strong>Interactive Testing</strong>: Test different input
							patterns
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
				<h3 className="text-lg font-semibold mb-2 text-orange-800">
					Applications
				</h3>
				<div className="grid md:grid-cols-3 gap-4 text-orange-700">
					<div>
						<strong>Computer Vision:</strong>
						<ul className="text-sm mt-1">
							<li>• Image classification</li>
							<li>• Object detection</li>
							<li>• Feature extraction</li>
						</ul>
					</div>
					<div>
						<strong>Natural Language:</strong>
						<ul className="text-sm mt-1">
							<li>• Text classification</li>
							<li>• Language translation</li>
							<li>• Sentiment analysis</li>
						</ul>
					</div>
					<div>
						<strong>Data Science:</strong>
						<ul className="text-sm mt-1">
							<li>• Pattern recognition</li>
							<li>• Predictive modeling</li>
							<li>• Anomaly detection</li>
						</ul>
					</div>
				</div>
			</div>

			<div className="mt-6">
				<Link
					to="/examples/visual"
					className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
				>
					← Back to Examples
				</Link>
			</div>
		</div>
	);
}
