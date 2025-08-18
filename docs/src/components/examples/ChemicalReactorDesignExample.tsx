import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

interface ReactorParameters {
	volume: number;
	temperature: number;
	pressure: number;
	feedRate: number;
	concentration: number;
	reactorType: "cstr" | "pfr" | "batch";
}

interface ReactionKinetics {
	activationEnergy: number; // kJ/mol
	preExponentialFactor: number; // s⁻¹ or m³/mol·s
	reactionOrder: number;
	heatOfReaction: number; // kJ/mol
}

interface Results {
	conversionRate: number;
	productConcentration: number;
	residenceTime: number;
	reactionRate: number;
	temperature: number;
	heatGenerated: number;
	efficiency: number;
	status: "optimal" | "warning" | "critical";
}

export default function ChemicalReactorDesignExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [reactor, setReactor] = useState<ReactorParameters>({
		volume: 10.0, // m³
		temperature: 350, // K
		pressure: 2.0, // bar
		feedRate: 0.5, // m³/s
		concentration: 2.0, // mol/L
		reactorType: "cstr",
	});

	const [kinetics, setKinetics] = useState<ReactionKinetics>({
		activationEnergy: 65, // kJ/mol
		preExponentialFactor: 1e6, // s⁻¹
		reactionOrder: 1,
		heatOfReaction: -50, // kJ/mol (exothermic)
	});

	const [results, setResults] = useState<Results>({
		conversionRate: 0,
		productConcentration: 0,
		residenceTime: 0,
		reactionRate: 0,
		temperature: 350,
		heatGenerated: 0,
		efficiency: 0,
		status: "optimal",
	});

	// Calculate rate constant using Arrhenius equation
	const calculateRateConstant = (temperature: number) => {
		const R = 8.314; // J/mol·K
		return (
			kinetics.preExponentialFactor *
			Math.exp((-kinetics.activationEnergy * 1000) / (R * temperature))
		);
	};

	// Calculate conversion for different reactor types
	const calculateConversion = () => {
		const k = calculateRateConstant(reactor.temperature);
		const tau = reactor.volume / reactor.feedRate; // residence time
		let conversion = 0;

		switch (reactor.reactorType) {
			case "cstr": {
				// CSTR: X = k*τ*C₀^(n-1) / (1 + k*τ*C₀^(n-1))
				const denominator =
					1 + k * tau * reactor.concentration ** (kinetics.reactionOrder - 1);
				conversion =
					(k * tau * reactor.concentration ** (kinetics.reactionOrder - 1)) /
					denominator;
				break;
			}

			case "pfr":
				// PFR: For first order: X = 1 - exp(-k*τ)
				if (kinetics.reactionOrder === 1) {
					conversion = 1 - Math.exp(-k * tau);
				} else {
					// For nth order: more complex integration
					const kt =
						k * tau * reactor.concentration ** (kinetics.reactionOrder - 1);
					conversion = kt / (1 + kt);
				}
				break;

			case "batch": {
				// Batch reactor: X = 1 - exp(-k*t) for first order
				const reactionTime = tau; // treating residence time as reaction time
				if (kinetics.reactionOrder === 1) {
					conversion = 1 - Math.exp(-k * reactionTime);
				} else {
					const kt =
						k *
						reactionTime *
						reactor.concentration ** (kinetics.reactionOrder - 1);
					conversion = kt / (1 + kt);
				}
				break;
			}
		}

		return Math.min(conversion, 0.95); // Cap at 95% for realism
	};

	// Calculate reactor performance
	const calculatePerformance = () => {
		const conversion = calculateConversion();
		const productConc = reactor.concentration * conversion;
		const residenceTime = reactor.volume / reactor.feedRate;
		const reactionRate =
			calculateRateConstant(reactor.temperature) *
			(reactor.concentration * (1 - conversion)) ** kinetics.reactionOrder;

		// Heat generation (W = kJ/s)
		const molarFlowRate = reactor.feedRate * reactor.concentration * 1000; // mol/s
		const heatGenerated =
			(Math.abs(kinetics.heatOfReaction) * molarFlowRate * conversion) / 1000; // kW

		// Temperature rise due to reaction heat (simplified)
		const tempRise =
			kinetics.heatOfReaction < 0
				? (Math.abs(kinetics.heatOfReaction) * conversion) / 4.18
				: 0; // K
		const actualTemp = reactor.temperature + tempRise;

		// Efficiency based on conversion and selectivity
		const efficiency = conversion * 100 * (actualTemp < 400 ? 1 : 0.8); // Penalty for high temp

		// Status determination
		let status: "optimal" | "warning" | "critical";
		if (conversion > 0.7 && actualTemp < 400 && efficiency > 70) {
			status = "optimal";
		} else if (conversion > 0.5 && actualTemp < 450) {
			status = "warning";
		} else {
			status = "critical";
		}

		return {
			conversionRate: conversion,
			productConcentration: productConc,
			residenceTime,
			reactionRate,
			temperature: actualTemp,
			heatGenerated,
			efficiency,
			status,
		};
	};

	// Update calculations
	useEffect(() => {
		const newResults = calculatePerformance();
		setResults(newResults);
	}, [reactor, kinetics]);

	// Draw reactor schematic
	const drawReactor = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;

		// Draw reactor based on type
		if (reactor.reactorType === "cstr") {
			// CSTR - cylindrical tank with agitator
			ctx.fillStyle = "#E3F2FD";
			ctx.strokeStyle = "#1976D2";
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.ellipse(centerX, centerY - 20, 80, 60, 0, 0, 2 * Math.PI);
			ctx.fill();
			ctx.stroke();

			// Agitator
			ctx.strokeStyle = "#333";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(centerX, centerY - 80);
			ctx.lineTo(centerX, centerY + 20);
			ctx.stroke();

			// Agitator blades
			ctx.beginPath();
			ctx.moveTo(centerX - 20, centerY);
			ctx.lineTo(centerX + 20, centerY);
			ctx.moveTo(centerX - 15, centerY - 15);
			ctx.lineTo(centerX + 15, centerY + 15);
			ctx.stroke();
		} else if (reactor.reactorType === "pfr") {
			// PFR - horizontal tube
			ctx.fillStyle = "#F3E5F5";
			ctx.strokeStyle = "#7B1FA2";
			ctx.lineWidth = 3;
			ctx.fillRect(centerX - 120, centerY - 25, 240, 50);
			ctx.strokeRect(centerX - 120, centerY - 25, 240, 50);

			// Flow direction arrows
			for (let i = 0; i < 4; i++) {
				const x = centerX - 80 + i * 40;
				ctx.fillStyle = "#7B1FA2";
				ctx.beginPath();
				ctx.moveTo(x, centerY);
				ctx.lineTo(x - 8, centerY - 5);
				ctx.lineTo(x - 8, centerY + 5);
				ctx.closePath();
				ctx.fill();
			}
		} else {
			// Batch reactor - closed vessel
			ctx.fillStyle = "#FFF3E0";
			ctx.strokeStyle = "#F57C00";
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.ellipse(centerX, centerY, 70, 80, 0, 0, 2 * Math.PI);
			ctx.fill();
			ctx.stroke();

			// Heating coils
			ctx.strokeStyle = "#D84315";
			ctx.lineWidth = 2;
			for (let i = 0; i < 5; i++) {
				const y = centerY - 60 + i * 30;
				ctx.beginPath();
				ctx.ellipse(centerX, y, 85, 10, 0, 0, Math.PI);
				ctx.stroke();
			}
		}

		// Feed stream (except for batch)
		if (reactor.reactorType !== "batch") {
			ctx.strokeStyle = "#4CAF50";
			ctx.lineWidth = 4;
			ctx.beginPath();
			ctx.moveTo(50, centerY);
			ctx.lineTo(
				centerX - (reactor.reactorType === "cstr" ? 80 : 120),
				centerY,
			);
			ctx.stroke();

			// Feed arrow
			ctx.fillStyle = "#4CAF50";
			ctx.beginPath();
			ctx.moveTo(
				centerX - (reactor.reactorType === "cstr" ? 80 : 120),
				centerY,
			);
			ctx.lineTo(
				centerX - (reactor.reactorType === "cstr" ? 90 : 130),
				centerY - 8,
			);
			ctx.lineTo(
				centerX - (reactor.reactorType === "cstr" ? 90 : 130),
				centerY + 8,
			);
			ctx.closePath();
			ctx.fill();

			// Feed label
			ctx.fillStyle = "#333";
			ctx.font = "12px Arial";
			ctx.fillText("Feed", 60, centerY - 10);
			ctx.fillText(`${reactor.feedRate} m³/s`, 60, centerY + 10);
			ctx.fillText(`${reactor.concentration} mol/L`, 60, centerY + 25);
		}

		// Product stream (except for batch)
		if (reactor.reactorType !== "batch") {
			ctx.strokeStyle = "#FF9800";
			ctx.lineWidth = 4;
			ctx.beginPath();
			ctx.moveTo(
				centerX + (reactor.reactorType === "cstr" ? 80 : 120),
				centerY,
			);
			ctx.lineTo(canvas.width - 50, centerY);
			ctx.stroke();

			// Product arrow
			ctx.fillStyle = "#FF9800";
			ctx.beginPath();
			ctx.moveTo(canvas.width - 50, centerY);
			ctx.lineTo(canvas.width - 60, centerY - 8);
			ctx.lineTo(canvas.width - 60, centerY + 8);
			ctx.closePath();
			ctx.fill();

			// Product label
			ctx.fillStyle = "#333";
			ctx.font = "12px Arial";
			ctx.fillText("Product", canvas.width - 100, centerY - 10);
			ctx.fillText(
				`X = ${(results.conversionRate * 100).toFixed(1)}%`,
				canvas.width - 100,
				centerY + 10,
			);
		}

		// Reactor label
		ctx.fillStyle = "#333";
		ctx.font = "bold 16px Arial";
		const reactorName =
			reactor.reactorType === "cstr"
				? "CSTR"
				: reactor.reactorType === "pfr"
					? "PFR"
					: "Batch Reactor";
		ctx.fillText(reactorName, centerX - 30, centerY + 120);

		// Operating conditions
		ctx.font = "12px Arial";
		ctx.fillText(`T = ${reactor.temperature} K`, centerX - 60, centerY + 140);
		ctx.fillText(`P = ${reactor.pressure} bar`, centerX - 60, centerY + 155);
		ctx.fillText(`V = ${reactor.volume} m³`, centerX - 60, centerY + 170);

		// Heat effects visualization
		if (kinetics.heatOfReaction < 0) {
			// Exothermic - heat waves
			ctx.strokeStyle = "#F44336";
			ctx.lineWidth = 2;
			for (let i = 0; i < 3; i++) {
				ctx.beginPath();
				for (let x = centerX - 60; x < centerX + 60; x += 10) {
					const y = centerY - 100 - i * 15 + Math.sin((x - centerX) / 10) * 5;
					if (x === centerX - 60) {
						ctx.moveTo(x, y);
					} else {
						ctx.lineTo(x, y);
					}
				}
				ctx.stroke();
			}
		}
	};

	useEffect(() => {
		drawReactor();
	}, [reactor, results]);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-2">Chemical Reactor Design</h1>
				<p className="text-gray-600">
					Design and optimize chemical reactors with kinetics, mass balance, and
					heat transfer calculations.
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Reactor Visualization */}
				<Card>
					<CardHeader>
						<CardTitle>Reactor Schematic</CardTitle>
						<CardDescription>
							Process flow diagram with operating conditions
						</CardDescription>
					</CardHeader>
					<CardContent>
						<canvas
							ref={canvasRef}
							width={500}
							height={350}
							className="border rounded max-w-full"
						/>
					</CardContent>
				</Card>

				{/* Controls and Results */}
				<div className="space-y-6">
					{/* Reactor Configuration */}
					<Card>
						<CardHeader>
							<CardTitle>Reactor Configuration</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<label className="text-sm font-medium">Reactor Type</label>
								<div className="flex space-x-2 mt-1">
									<Button
										variant={
											reactor.reactorType === "cstr" ? "default" : "outline"
										}
										size="sm"
										onClick={() =>
											setReactor({ ...reactor, reactorType: "cstr" })
										}
									>
										CSTR
									</Button>
									<Button
										variant={
											reactor.reactorType === "pfr" ? "default" : "outline"
										}
										size="sm"
										onClick={() =>
											setReactor({ ...reactor, reactorType: "pfr" })
										}
									>
										PFR
									</Button>
									<Button
										variant={
											reactor.reactorType === "batch" ? "default" : "outline"
										}
										size="sm"
										onClick={() =>
											setReactor({ ...reactor, reactorType: "batch" })
										}
									>
										Batch
									</Button>
								</div>
							</div>

							<div>
								<label className="text-sm font-medium">
									Volume: {reactor.volume} m³
								</label>
								<Slider
									value={[reactor.volume]}
									onValueChange={([value]) =>
										setReactor({ ...reactor, volume: value })
									}
									min={1}
									max={50}
									step={1}
									className="mt-2"
								/>
							</div>

							<div>
								<label className="text-sm font-medium">
									Temperature: {reactor.temperature} K
								</label>
								<Slider
									value={[reactor.temperature]}
									onValueChange={([value]) =>
										setReactor({ ...reactor, temperature: value })
									}
									min={300}
									max={500}
									step={5}
									className="mt-2"
								/>
							</div>

							<div>
								<label className="text-sm font-medium">
									Feed Rate: {reactor.feedRate} m³/s
								</label>
								<Slider
									value={[reactor.feedRate]}
									onValueChange={([value]) =>
										setReactor({ ...reactor, feedRate: value })
									}
									min={0.1}
									max={2.0}
									step={0.1}
									className="mt-2"
								/>
							</div>

							<div>
								<label className="text-sm font-medium">
									Concentration: {reactor.concentration} mol/L
								</label>
								<Slider
									value={[reactor.concentration]}
									onValueChange={([value]) =>
										setReactor({ ...reactor, concentration: value })
									}
									min={0.5}
									max={5.0}
									step={0.1}
									className="mt-2"
								/>
							</div>
						</CardContent>
					</Card>

					{/* Reaction Kinetics */}
					<Card>
						<CardHeader>
							<CardTitle>Reaction Kinetics</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<label className="text-sm font-medium">
									Activation Energy: {kinetics.activationEnergy} kJ/mol
								</label>
								<Slider
									value={[kinetics.activationEnergy]}
									onValueChange={([value]) =>
										setKinetics({ ...kinetics, activationEnergy: value })
									}
									min={20}
									max={150}
									step={5}
									className="mt-2"
								/>
							</div>

							<div>
								<label className="text-sm font-medium">
									Pre-exponential Factor:{" "}
									{kinetics.preExponentialFactor.toExponential(1)} s⁻¹
								</label>
								<Slider
									value={[Math.log10(kinetics.preExponentialFactor)]}
									onValueChange={([value]) =>
										setKinetics({
											...kinetics,
											preExponentialFactor: 10 ** value,
										})
									}
									min={3}
									max={12}
									step={0.5}
									className="mt-2"
								/>
							</div>

							<div>
								<label className="text-sm font-medium">
									Reaction Order: {kinetics.reactionOrder}
								</label>
								<Slider
									value={[kinetics.reactionOrder]}
									onValueChange={([value]) =>
										setKinetics({ ...kinetics, reactionOrder: value })
									}
									min={0.5}
									max={3.0}
									step={0.5}
									className="mt-2"
								/>
							</div>

							<div>
								<label className="text-sm font-medium">
									Heat of Reaction: {kinetics.heatOfReaction} kJ/mol
								</label>
								<Slider
									value={[kinetics.heatOfReaction]}
									onValueChange={([value]) =>
										setKinetics({ ...kinetics, heatOfReaction: value })
									}
									min={-100}
									max={50}
									step={5}
									className="mt-2"
								/>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Performance Results */}
			<div className="mt-6">
				<Card>
					<CardHeader>
						<CardTitle>Performance Results</CardTitle>
						<div className="flex items-center space-x-2">
							<Badge
								variant={
									results.status === "optimal"
										? "default"
										: results.status === "warning"
											? "secondary"
											: "destructive"
								}
							>
								{results.status === "optimal"
									? "OPTIMAL"
									: results.status === "warning"
										? "WARNING"
										: "CRITICAL"}
							</Badge>
						</div>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div className="text-center p-3 bg-blue-50 rounded">
								<div className="text-2xl font-bold text-blue-600">
									{(results.conversionRate * 100).toFixed(1)}%
								</div>
								<div className="text-sm text-gray-600">Conversion</div>
							</div>

							<div className="text-center p-3 bg-green-50 rounded">
								<div className="text-2xl font-bold text-green-600">
									{results.productConcentration.toFixed(2)}
								</div>
								<div className="text-sm text-gray-600">
									Product Conc. (mol/L)
								</div>
							</div>

							<div className="text-center p-3 bg-orange-50 rounded">
								<div className="text-2xl font-bold text-orange-600">
									{results.residenceTime.toFixed(1)}
								</div>
								<div className="text-sm text-gray-600">Residence Time (s)</div>
							</div>

							<div className="text-center p-3 bg-purple-50 rounded">
								<div className="text-2xl font-bold text-purple-600">
									{results.efficiency.toFixed(1)}%
								</div>
								<div className="text-sm text-gray-600">Efficiency</div>
							</div>

							<div className="text-center p-3 bg-red-50 rounded">
								<div className="text-2xl font-bold text-red-600">
									{results.temperature.toFixed(0)}
								</div>
								<div className="text-sm text-gray-600">Reactor Temp. (K)</div>
							</div>

							<div className="text-center p-3 bg-indigo-50 rounded">
								<div className="text-2xl font-bold text-indigo-600">
									{results.heatGenerated.toFixed(1)}
								</div>
								<div className="text-sm text-gray-600">Heat Generated (kW)</div>
							</div>

							<div className="text-center p-3 bg-teal-50 rounded">
								<div className="text-2xl font-bold text-teal-600">
									{results.reactionRate.toExponential(2)}
								</div>
								<div className="text-sm text-gray-600">
									Reaction Rate (mol/L·s)
								</div>
							</div>

							<div className="text-center p-3 bg-yellow-50 rounded">
								<div className="text-2xl font-bold text-yellow-600">
									{calculateRateConstant(reactor.temperature).toExponential(2)}
								</div>
								<div className="text-sm text-gray-600">Rate Constant (s⁻¹)</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="mt-8 p-4 bg-gray-50 rounded-lg">
				<h3 className="font-semibold mb-2">Engineering Applications:</h3>
				<ul className="text-sm space-y-1 list-disc list-inside">
					<li>
						<strong>Process Design:</strong> Size reactors for chemical plants
						and refineries
					</li>
					<li>
						<strong>Optimization:</strong> Maximize conversion while minimizing
						costs and energy
					</li>
					<li>
						<strong>Safety Analysis:</strong> Predict temperature rise and
						runaway reaction potential
					</li>
					<li>
						<strong>Scale-up:</strong> Transfer lab-scale kinetics to industrial
						production
					</li>
					<li>
						<strong>Catalyst Selection:</strong> Compare different catalysts and
						operating conditions
					</li>
					<li>
						<strong>Environmental Impact:</strong> Minimize waste and optimize
						selectivity
					</li>
				</ul>
			</div>
		</div>
	);
}