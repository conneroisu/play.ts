import {
	clamp,
	cos,
	hsl,
	hslToRgb,
	lerp,
	PI,
	sin,
	TWO_PI,
	toCssHsl,
} from "play.ts";
import { useEffect, useRef, useState } from "react";

interface EnergySource {
	type: "solar" | "wind" | "hydro" | "geothermal" | "biomass";
	capacity: number; // kW
	efficiency: number; // %
	cost: number; // $/kW
	output: number; // kWh
	co2Reduction: number; // tons/year
	coordinates: { x: number; y: number };
	status: "active" | "maintenance" | "offline";
}

interface EnergyStorage {
	type: "battery" | "pumped_hydro" | "compressed_air" | "flywheel";
	capacity: number; // kWh
	chargeRate: number; // kW
	efficiency: number; // %
	currentCharge: number; // kWh
	cost: number; // $/kWh
}

interface EnergyDemand {
	residential: number; // kW
	commercial: number; // kW
	industrial: number; // kW
	peak: number; // kW
	baseLoad: number; // kW
	timeProfile: number[]; // 24-hour profile
}

interface WeatherConditions {
	solarIrradiance: number; // W/m²
	windSpeed: number; // m/s
	temperature: number; // °C
	humidity: number; // %
	cloudCover: number; // %
	season: "spring" | "summer" | "fall" | "winter";
}

interface OptimizationResults {
	totalGeneration: number;
	totalConsumption: number;
	storageLevel: number;
	gridBalance: number;
	costPerMWh: number;
	co2Savings: number;
	efficiency: number;
	reliabilityScore: number;
}

export default function RenewableEnergyOptimizerExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const chartRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number | undefined>();
	const timeRef = useRef<number>(0);

	const [energySources, setEnergySources] = useState<EnergySource[]>([
		{
			type: "solar",
			capacity: 500,
			efficiency: 22,
			cost: 1200,
			output: 850,
			co2Reduction: 425,
			coordinates: { x: 200, y: 150 },
			status: "active",
		},
		{
			type: "wind",
			capacity: 800,
			efficiency: 35,
			cost: 1500,
			output: 1400,
			co2Reduction: 700,
			coordinates: { x: 400, y: 100 },
			status: "active",
		},
		{
			type: "hydro",
			capacity: 300,
			efficiency: 85,
			cost: 2000,
			output: 600,
			co2Reduction: 300,
			coordinates: { x: 600, y: 200 },
			status: "active",
		},
		{
			type: "geothermal",
			capacity: 200,
			efficiency: 75,
			cost: 3000,
			output: 350,
			co2Reduction: 175,
			coordinates: { x: 300, y: 300 },
			status: "maintenance",
		},
	]);

	const [storage, setStorage] = useState<EnergyStorage>({
		type: "battery",
		capacity: 2000,
		chargeRate: 500,
		efficiency: 92,
		currentCharge: 1200,
		cost: 300,
	});

	const [demand, setDemand] = useState<EnergyDemand>({
		residential: 800,
		commercial: 600,
		industrial: 1200,
		peak: 3000,
		baseLoad: 1500,
		timeProfile: Array.from(
			{ length: 24 },
			(_, i) =>
				0.6 + 0.4 * sin(((i - 6) * PI) / 12) + 0.2 * sin(((i - 18) * PI) / 6),
		),
	});

	const [weather, setWeather] = useState<WeatherConditions>({
		solarIrradiance: 800,
		windSpeed: 8.5,
		temperature: 25,
		humidity: 65,
		cloudCover: 30,
		season: "summer",
	});

	const [optimization, setOptimization] = useState<OptimizationResults | null>(
		null,
	);
	const [currentHour, setCurrentHour] = useState(12);
	const [isSimulating, setIsSimulating] = useState(false);
	const [viewMode, setViewMode] = useState<"map" | "flow" | "efficiency">(
		"map",
	);

	// Calculate renewable energy generation based on weather
	const calculateGeneration = (source: EnergySource): number => {
		let output = 0;

		switch (source.type) {
			case "solar": {
				const solarFactor =
					(weather.solarIrradiance / 1000) *
					(1 - weather.cloudCover / 100) *
					sin((Math.max(0, currentHour - 6) * PI) / 12);
				output =
					source.capacity *
					(source.efficiency / 100) *
					Math.max(0, solarFactor);
				break;
			}

			case "wind": {
				// Wind power curve (simplified)
				let windFactor = 0;
				if (weather.windSpeed >= 3 && weather.windSpeed <= 25) {
					if (weather.windSpeed <= 12) {
						windFactor = (weather.windSpeed / 12) ** 3;
					} else {
						windFactor = 1;
					}
				}
				output = source.capacity * windFactor * (source.efficiency / 100);
				break;
			}

			case "hydro": {
				// Constant output with seasonal variation
				const seasonalFactor =
					weather.season === "spring"
						? 1.2
						: weather.season === "summer"
							? 0.8
							: weather.season === "fall"
								? 1.0
								: 1.1;
				output = source.capacity * (source.efficiency / 100) * seasonalFactor;
				break;
			}

			case "geothermal": {
				// Constant baseload with temperature efficiency
				const tempFactor = 1 - (weather.temperature - 15) * 0.002;
				output = source.capacity * (source.efficiency / 100) * tempFactor;
				break;
			}

			case "biomass":
				// Steady output
				output = source.capacity * (source.efficiency / 100) * 0.8;
				break;
		}

		return source.status === "active" ? output : 0;
	};

	// Optimize energy system
	const optimizeEnergySystem = (): OptimizationResults => {
		const totalGeneration = energySources.reduce(
			(sum, source) => sum + calculateGeneration(source),
			0,
		);
		const currentDemand =
			(demand.residential + demand.commercial + demand.industrial) *
			demand.timeProfile[currentHour];

		const storageLevel = (storage.currentCharge / storage.capacity) * 100;
		const gridBalance = totalGeneration - currentDemand;

		const totalCapacity = energySources.reduce(
			(sum, source) => sum + source.capacity,
			0,
		);
		const totalCost =
			energySources.reduce(
				(sum, source) => sum + source.cost * source.capacity,
				0,
			) +
			storage.cost * storage.capacity;
		const costPerMWh = totalCost / ((totalCapacity * 8760) / 1000); // Annualized

		const totalCO2Savings = energySources.reduce(
			(sum, source) => sum + source.co2Reduction,
			0,
		);
		const efficiency = (totalGeneration / totalCapacity) * 100;

		// Reliability score based on diversity and storage
		const sourceTypes = new Set(energySources.map((s) => s.type)).size;
		const reliabilityScore = Math.min(
			100,
			(sourceTypes / 5) * 40 + // Diversity factor
				(storageLevel / 100) * 30 + // Storage factor
				(efficiency / 100) * 30, // Efficiency factor
		);

		return {
			totalGeneration,
			totalConsumption: currentDemand,
			storageLevel,
			gridBalance,
			costPerMWh,
			co2Savings: totalCO2Savings,
			efficiency,
			reliabilityScore,
		};
	};

	// Get energy source color
	const getSourceColor = (type: EnergySource["type"]): string => {
		const colors = {
			solar: "#FFD700",
			wind: "#87CEEB",
			hydro: "#4682B4",
			geothermal: "#CD853F",
			biomass: "#228B22",
		};
		return colors[type];
	};

	// Draw energy system map
	const drawEnergyMap = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;

		ctx.clearRect(0, 0, width, height);

		// Draw background grid
		ctx.strokeStyle = "rgba(200, 200, 200, 0.3)";
		ctx.lineWidth = 1;
		for (let x = 0; x <= width; x += 50) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, height);
			ctx.stroke();
		}
		for (let y = 0; y <= height; y += 50) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(width, y);
			ctx.stroke();
		}

		// Draw energy sources
		energySources.forEach((source) => {
			const x = source.coordinates.x;
			const y = source.coordinates.y;
			const generation = calculateGeneration(source);
			const size = 20 + (generation / source.capacity) * 30;

			// Source circle
			ctx.fillStyle = getSourceColor(source.type);
			ctx.globalAlpha = source.status === "active" ? 1.0 : 0.5;
			ctx.beginPath();
			ctx.arc(x, y, size, 0, TWO_PI);
			ctx.fill();

			// Status indicator
			if (source.status === "maintenance") {
				ctx.strokeStyle = "#FFA500";
				ctx.lineWidth = 3;
				ctx.beginPath();
				ctx.arc(x, y, size + 5, 0, TWO_PI);
				ctx.stroke();
			} else if (source.status === "offline") {
				ctx.strokeStyle = "#FF0000";
				ctx.lineWidth = 3;
				ctx.beginPath();
				ctx.arc(x, y, size + 5, 0, TWO_PI);
				ctx.stroke();
			}

			// Energy flow animation
			if (isSimulating && source.status === "active") {
				const time = timeRef.current * 0.005;
				const flowRadius = size + 20 + 10 * sin(time + x * 0.01);
				ctx.strokeStyle = getSourceColor(source.type);
				ctx.globalAlpha = 0.3 + 0.3 * sin(time * 2 + y * 0.01);
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.arc(x, y, flowRadius, 0, TWO_PI);
				ctx.stroke();
			}

			ctx.globalAlpha = 1.0;

			// Labels
			ctx.fillStyle = "black";
			ctx.font = "12px Arial";
			ctx.textAlign = "center";
			ctx.fillText(source.type.toUpperCase(), x, y - size - 10);
			ctx.fillText(`${generation.toFixed(0)} kW`, x, y + size + 15);
		});

		// Draw power lines
		ctx.strokeStyle = "#666";
		ctx.lineWidth = 3;
		energySources.forEach((source, i) => {
			if (i < energySources.length - 1) {
				const next = energySources[i + 1];
				ctx.beginPath();
				ctx.moveTo(source.coordinates.x, source.coordinates.y);
				ctx.lineTo(next.coordinates.x, next.coordinates.y);
				ctx.stroke();
			}
		});

		// Draw storage facility
		const storageX = 100;
		const storageY = 250;
		const storageSize = 30;

		ctx.fillStyle = "#8A2BE2";
		ctx.fillRect(
			storageX - storageSize / 2,
			storageY - storageSize / 2,
			storageSize,
			storageSize,
		);

		// Storage level indicator
		const levelHeight =
			(storage.currentCharge / storage.capacity) * storageSize;
		ctx.fillStyle = "#00FF00";
		ctx.fillRect(
			storageX - storageSize / 2 + 2,
			storageY + storageSize / 2 - levelHeight - 2,
			storageSize - 4,
			levelHeight,
		);

		ctx.fillStyle = "black";
		ctx.font = "12px Arial";
		ctx.textAlign = "center";
		ctx.fillText("STORAGE", storageX, storageY - storageSize - 10);
		ctx.fillText(
			`${((storage.currentCharge / storage.capacity) * 100).toFixed(0)}%`,
			storageX,
			storageY + storageSize + 15,
		);

		// Draw demand centers
		const demandCenters = [
			{ name: "Residential", x: 500, y: 350, demand: demand.residential },
			{ name: "Commercial", x: 600, y: 320, demand: demand.commercial },
			{ name: "Industrial", x: 550, y: 280, demand: demand.industrial },
		];

		demandCenters.forEach((center) => {
			const size = 15 + (center.demand / 1000) * 10;
			ctx.fillStyle = "#FF6B35";
			ctx.beginPath();
			ctx.arc(center.x, center.y, size, 0, TWO_PI);
			ctx.fill();

			ctx.fillStyle = "black";
			ctx.font = "10px Arial";
			ctx.textAlign = "center";
			ctx.fillText(center.name, center.x, center.y - size - 5);
			ctx.fillText(`${center.demand} kW`, center.x, center.y + size + 12);
		});
	};

	// Draw energy flow chart
	const drawEnergyChart = () => {
		const canvas = chartRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;

		ctx.clearRect(0, 0, width, height);

		// Draw 24-hour demand profile
		const margin = 40;
		const chartWidth = width - 2 * margin;
		const chartHeight = height - 2 * margin;

		// Grid
		ctx.strokeStyle = "rgba(200, 200, 200, 0.5)";
		ctx.lineWidth = 1;
		for (let i = 0; i <= 24; i += 6) {
			const x = margin + (i / 24) * chartWidth;
			ctx.beginPath();
			ctx.moveTo(x, margin);
			ctx.lineTo(x, margin + chartHeight);
			ctx.stroke();
		}

		for (let i = 0; i <= 4; i++) {
			const y = margin + (i / 4) * chartHeight;
			ctx.beginPath();
			ctx.moveTo(margin, y);
			ctx.lineTo(margin + chartWidth, y);
			ctx.stroke();
		}

		// Demand curve
		ctx.strokeStyle = "#FF6B35";
		ctx.lineWidth = 3;
		ctx.beginPath();
		for (let hour = 0; hour < 24; hour++) {
			const x = margin + (hour / 24) * chartWidth;
			const demandValue =
				(demand.residential + demand.commercial + demand.industrial) *
				demand.timeProfile[hour];
			const y = margin + chartHeight - (demandValue / 3500) * chartHeight;

			if (hour === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		}
		ctx.stroke();

		// Generation curve
		ctx.strokeStyle = "#4CAF50";
		ctx.lineWidth = 3;
		ctx.beginPath();
		for (let hour = 0; hour < 24; hour++) {
			const x = margin + (hour / 24) * chartWidth;
			// Simulate generation throughout the day
			const tempHour = currentHour;
			setCurrentHour(hour);
			const totalGen = energySources.reduce(
				(sum, source) => sum + calculateGeneration(source),
				0,
			);
			setCurrentHour(tempHour);

			const y = margin + chartHeight - (totalGen / 3500) * chartHeight;

			if (hour === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		}
		ctx.stroke();

		// Current time indicator
		const currentX = margin + (currentHour / 24) * chartWidth;
		ctx.strokeStyle = "#2196F3";
		ctx.lineWidth = 2;
		ctx.setLineDash([5, 5]);
		ctx.beginPath();
		ctx.moveTo(currentX, margin);
		ctx.lineTo(currentX, margin + chartHeight);
		ctx.stroke();
		ctx.setLineDash([]);

		// Labels
		ctx.fillStyle = "black";
		ctx.font = "12px Arial";
		ctx.textAlign = "center";
		for (let i = 0; i <= 24; i += 6) {
			const x = margin + (i / 24) * chartWidth;
			ctx.fillText(`${i}:00`, x, height - 10);
		}

		// Legend
		ctx.fillStyle = "#FF6B35";
		ctx.fillRect(width - 150, 20, 15, 10);
		ctx.fillStyle = "black";
		ctx.font = "12px Arial";
		ctx.textAlign = "left";
		ctx.fillText("Demand", width - 130, 30);

		ctx.fillStyle = "#4CAF50";
		ctx.fillRect(width - 150, 40, 15, 10);
		ctx.fillText("Generation", width - 130, 50);
	};

	const draw = () => {
		if (viewMode === "map" || viewMode === "flow") {
			drawEnergyMap();
		}
		drawEnergyChart();

		if (isSimulating) {
			timeRef.current += 16;
		}
	};

	useEffect(() => {
		const animate = () => {
			draw();
			animationRef.current = requestAnimationFrame(animate);
		};
		animationRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [
		energySources,
		storage,
		demand,
		weather,
		currentHour,
		isSimulating,
		viewMode,
	]);

	useEffect(() => {
		setOptimization(optimizeEnergySystem());
	}, [energySources, storage, demand, weather, currentHour]);

	return (
		<div className="w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
			<div className="bg-white rounded-xl shadow-lg p-6 mb-6">
				<div className="flex items-center gap-3 mb-6">
					<div className="w-3 h-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
					<h1 className="text-2xl font-bold text-gray-800">
						Renewable Energy System Optimizer
					</h1>
					<div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
						Energy Engineering Tool
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Visualization */}
					<div className="lg:col-span-2">
						<div className="bg-gray-50 rounded-lg p-4 mb-4">
							<div className="flex gap-2 mb-4">
								<button
									onClick={() => setViewMode("map")}
									className={`px-3 py-1 rounded text-sm ${viewMode === "map" ? "bg-green-500 text-white" : "bg-gray-200"}`}
								>
									System Map
								</button>
								<button
									onClick={() => setIsSimulating(!isSimulating)}
									className={`px-3 py-1 rounded text-sm ${isSimulating ? "bg-blue-500 text-white" : "bg-gray-200"}`}
								>
									{isSimulating ? "Stop" : "Simulate"}
								</button>
								<div className="ml-auto text-sm text-gray-600">
									Current Time: {currentHour}:00
								</div>
							</div>

							<canvas
								ref={canvasRef}
								width={700}
								height={400}
								className="border border-gray-300 rounded-lg bg-white w-full mb-4"
							/>

							<canvas
								ref={chartRef}
								width={700}
								height={200}
								className="border border-gray-300 rounded-lg bg-white w-full"
							/>
						</div>

						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div className="bg-green-50 rounded-lg p-3 text-center">
								<div className="text-xl font-bold text-green-600">
									{optimization?.totalGeneration.toFixed(0)} kW
								</div>
								<div className="text-sm text-gray-600">Generation</div>
							</div>

							<div className="bg-orange-50 rounded-lg p-3 text-center">
								<div className="text-xl font-bold text-orange-600">
									{optimization?.totalConsumption.toFixed(0)} kW
								</div>
								<div className="text-sm text-gray-600">Demand</div>
							</div>

							<div className="bg-purple-50 rounded-lg p-3 text-center">
								<div className="text-xl font-bold text-purple-600">
									{optimization?.storageLevel.toFixed(0)}%
								</div>
								<div className="text-sm text-gray-600">Storage</div>
							</div>

							<div className="bg-blue-50 rounded-lg p-3 text-center">
								<div className="text-xl font-bold text-blue-600">
									{optimization?.efficiency.toFixed(0)}%
								</div>
								<div className="text-sm text-gray-600">Efficiency</div>
							</div>
						</div>
					</div>

					{/* Controls */}
					<div className="space-y-4">
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Weather Conditions
							</h3>

							<div className="space-y-3">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Solar Irradiance: {weather.solarIrradiance} W/m²
									</label>
									<input
										type="range"
										min="0"
										max="1200"
										step="50"
										value={weather.solarIrradiance}
										onChange={(e) =>
											setWeather((prev) => ({
												...prev,
												solarIrradiance: Number.parseInt(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Wind Speed: {weather.windSpeed.toFixed(1)} m/s
									</label>
									<input
										type="range"
										min="0"
										max="30"
										step="0.5"
										value={weather.windSpeed}
										onChange={(e) =>
											setWeather((prev) => ({
												...prev,
												windSpeed: Number.parseFloat(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Cloud Cover: {weather.cloudCover}%
									</label>
									<input
										type="range"
										min="0"
										max="100"
										step="5"
										value={weather.cloudCover}
										onChange={(e) =>
											setWeather((prev) => ({
												...prev,
												cloudCover: Number.parseInt(e.target.value),
											}))
										}
										className="w-full"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Season
									</label>
									<select
										value={weather.season}
										onChange={(e) =>
											setWeather((prev) => ({
												...prev,
												season: e.target.value as WeatherConditions["season"],
											}))
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
									>
										<option value="spring">Spring</option>
										<option value="summer">Summer</option>
										<option value="fall">Fall</option>
										<option value="winter">Winter</option>
									</select>
								</div>
							</div>
						</div>

						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Time Control
							</h3>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Hour of Day: {currentHour}:00
								</label>
								<input
									type="range"
									min="0"
									max="23"
									step="1"
									value={currentHour}
									onChange={(e) =>
										setCurrentHour(Number.parseInt(e.target.value))
									}
									className="w-full"
								/>
							</div>
						</div>

						{optimization && (
							<div className="bg-gray-50 rounded-lg p-4">
								<h3 className="text-lg font-semibold text-gray-800 mb-3">
									System Performance
								</h3>

								<div className="space-y-3 text-sm">
									<div className="flex justify-between">
										<span>Grid Balance:</span>
										<span
											className={`font-mono ${optimization.gridBalance >= 0 ? "text-green-600" : "text-red-600"}`}
										>
											{optimization.gridBalance >= 0 ? "+" : ""}
											{optimization.gridBalance.toFixed(0)} kW
										</span>
									</div>

									<div className="flex justify-between">
										<span>Cost per MWh:</span>
										<span className="font-mono">
											${optimization.costPerMWh.toFixed(2)}
										</span>
									</div>

									<div className="flex justify-between">
										<span>CO₂ Savings:</span>
										<span className="font-mono text-green-600">
											{optimization.co2Savings.toFixed(0)} tons/year
										</span>
									</div>

									<div className="flex justify-between">
										<span>Reliability Score:</span>
										<span className="font-mono">
											{optimization.reliabilityScore.toFixed(0)}/100
										</span>
									</div>

									<div className="mt-4 p-3 bg-white rounded border">
										<div className="text-xs text-gray-600 mb-1">
											System Status
										</div>
										<div
											className={`text-sm font-semibold ${optimization.reliabilityScore >= 80 ? "text-green-600" : optimization.reliabilityScore >= 60 ? "text-yellow-600" : "text-red-600"}`}
										>
											{optimization.reliabilityScore >= 80
												? "OPTIMAL"
												: optimization.reliabilityScore >= 60
													? "GOOD"
													: "NEEDS OPTIMIZATION"}
										</div>
									</div>
								</div>
							</div>
						)}

						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Energy Sources
							</h3>

							<div className="space-y-2 text-sm">
								{energySources.map((source) => (
									<div
										key={source.type}
										className="flex justify-between items-center"
									>
										<div className="flex items-center gap-2">
											<div
												className="w-3 h-3 rounded-full"
												style={{ backgroundColor: getSourceColor(source.type) }}
											/>
											<span className="capitalize">{source.type}</span>
										</div>
										<div className="text-right">
											<div>{calculateGeneration(source).toFixed(0)} kW</div>
											<div className="text-xs text-gray-500">
												{source.capacity} kW max
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				<div className="mt-6 bg-green-50 rounded-lg p-4">
					<h3 className="text-lg font-semibold text-green-800 mb-2">
						Energy Engineering Applications
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
						<div>
							<strong>System Design & Planning:</strong>
							<ul className="mt-1 space-y-1">
								<li>• Renewable energy capacity planning</li>
								<li>• Grid integration optimization</li>
								<li>• Energy storage sizing</li>
								<li>• Load forecasting and balancing</li>
							</ul>
						</div>
						<div>
							<strong>Performance & Economics:</strong>
							<ul className="mt-1 space-y-1">
								<li>• LCOE (Levelized Cost of Energy) analysis</li>
								<li>• Carbon footprint assessment</li>
								<li>• Weather impact modeling</li>
								<li>• Grid stability analysis</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}