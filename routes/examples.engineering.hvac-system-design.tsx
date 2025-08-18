import { createFileRoute, Link } from "@tanstack/react-router";
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

export const Route = createFileRoute(
	"/examples/engineering/hvac-system-design",
)({
	component: HVACSystemExample,
});

interface Room {
	id: string;
	name: string;
	width: number; // meters
	height: number; // meters
	length: number; // meters
	occupancy: number;
	lighting: number; // watts
	equipment: number; // watts
	infiltration: number; // ACH
	designTemp: number; // °C
	x: number; // position in layout
	y: number;
}

interface Duct {
	id: string;
	fromRoom: string;
	toRoom: string;
	diameter: number; // mm
	length: number; // meters
	airflow: number; // CFM
	velocity: number; // m/s
	pressureLoss: number; // Pa
}

interface HVACLoad {
	sensible: number; // watts
	latent: number; // watts
	total: number; // watts
	cfm: number; // cubic feet per minute
}

interface SystemResults {
	totalCoolingLoad: number; // kW
	totalHeatingLoad: number; // kW
	totalAirflow: number; // CFM
	energyEfficiency: number; // EER
	operatingCost: number; // $/year
	carbonFootprint: number; // kg CO2/year
}

function HVACSystemExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const [rooms, setRooms] = useState<Room[]>([
		{
			id: "lobby",
			name: "Lobby",
			width: 10,
			height: 3,
			length: 15,
			occupancy: 50,
			lighting: 2000,
			equipment: 1000,
			infiltration: 0.5,
			designTemp: 22,
			x: 50,
			y: 100,
		},
		{
			id: "office1",
			name: "Office 1",
			width: 6,
			height: 3,
			length: 8,
			occupancy: 8,
			lighting: 800,
			equipment: 1200,
			infiltration: 0.3,
			designTemp: 23,
			x: 200,
			y: 50,
		},
		{
			id: "office2",
			name: "Office 2",
			width: 6,
			height: 3,
			length: 8,
			occupancy: 8,
			lighting: 800,
			equipment: 1200,
			infiltration: 0.3,
			designTemp: 23,
			x: 200,
			y: 200,
		},
		{
			id: "conference",
			name: "Conference",
			width: 8,
			height: 3,
			length: 12,
			occupancy: 20,
			lighting: 1200,
			equipment: 2000,
			infiltration: 0.4,
			designTemp: 22,
			x: 350,
			y: 100,
		},
		{
			id: "server",
			name: "Server Room",
			width: 4,
			height: 3,
			length: 6,
			occupancy: 2,
			lighting: 400,
			equipment: 15000,
			infiltration: 0.1,
			designTemp: 18,
			x: 500,
			y: 50,
		},
	]);

	const [ducts, setDucts] = useState<Duct[]>([]);

	const [systemSettings, setSystemSettings] = useState({
		outdoorTemp: 35, // °C
		outdoorHumidity: 60, // %
		systemType: "vav", // VAV, CAV, VRF
		efficiency: 3.5, // COP/EER
		energyCost: 0.12, // $/kWh
		operatingHours: 12, // hours/day
		designMargin: 1.15, // safety factor
		minAirflow: 15, // CFM per person minimum
		maxVelocity: 6, // m/s max duct velocity
	});

	const [displaySettings, setDisplaySettings] = useState({
		showDucts: true,
		showLoads: true,
		showTemperatures: true,
		showAirflow: true,
		showVelocities: false,
		showPressure: false,
		animateAirflow: true,
		showEfficiency: true,
	});

	const [results, setResults] = useState<SystemResults | null>(null);
	const [roomLoads, setRoomLoads] = useState<Map<string, HVACLoad>>(new Map());
	const [time, setTime] = useState(0);

	// Calculate heat loads for each room
	const calculateRoomLoads = (room: Room): HVACLoad => {
		const volume = room.width * room.height * room.length; // m³
		const area = room.width * room.length; // m²

		// Sensible heat gains
		const occupancySensible = room.occupancy * 75; // 75W per person sensible
		const lightingHeat = room.lighting * 0.9; // 90% of lighting becomes heat
		const equipmentHeat = room.equipment;
		const solarGain = area * 50; // 50W/m² solar gain (simplified)
		const conductionGain = area * 20; // 20W/m² conduction gain
		const infiltrationSensible =
			(volume *
				room.infiltration *
				1.2 *
				1005 *
				(systemSettings.outdoorTemp - room.designTemp)) /
			3600;

		const sensibleHeat =
			occupancySensible +
			lightingHeat +
			equipmentHeat +
			solarGain +
			conductionGain +
			infiltrationSensible;

		// Latent heat gains
		const occupancyLatent = room.occupancy * 55; // 55W per person latent
		const infiltrationLatent =
			(volume *
				room.infiltration *
				1.2 *
				2501 *
				0.01 *
				(systemSettings.outdoorHumidity - 50)) /
			3600;

		const latentHeat = occupancyLatent + Math.max(0, infiltrationLatent);

		const totalHeat = sensibleHeat + latentHeat;

		// Calculate required airflow
		const sensibleCFM = (sensibleHeat * 3.412) / (1.08 * 10); // 10°F supply air temperature difference
		const latentCFM = (latentHeat * 3.412) / (0.68 * 15); // 15 grains moisture difference
		const occupancyCFM = room.occupancy * systemSettings.minAirflow;
		const cfm = Math.max(sensibleCFM, latentCFM, occupancyCFM);

		return {
			sensible: sensibleHeat,
			latent: latentHeat,
			total: totalHeat,
			cfm: cfm,
		};
	};

	// Calculate duct sizing and pressure losses
	const calculateDuctwork = () => {
		const newDucts: Duct[] = [];

		rooms.forEach((room, index) => {
			if (index === 0) return; // Skip main supply room

			const load = roomLoads.get(room.id);
			if (!load) return;

			// Calculate duct diameter based on airflow and max velocity
			const airflowM3s = load.cfm * 0.0004719; // Convert CFM to m³/s
			const diameter =
				Math.sqrt((4 * airflowM3s) / (PI * systemSettings.maxVelocity)) * 1000; // mm
			const roundedDiameter = Math.ceil(diameter / 50) * 50; // Round to nearest 50mm

			// Calculate actual velocity
			const actualVelocity =
				(4 * airflowM3s) / (PI * (roundedDiameter / 1000) ** 2);

			// Estimate duct length (simplified)
			const mainRoom = rooms[0];
			const length =
				Math.sqrt((room.x - mainRoom.x) ** 2 + (room.y - mainRoom.y) ** 2) / 10; // Scale factor

			// Calculate pressure loss (simplified Darcy-Weisbach)
			const friction = 0.02; // friction factor
			const density = 1.2; // kg/m³
			const pressureLoss =
				friction *
				(length / (roundedDiameter / 1000)) *
				((density * actualVelocity ** 2) / 2);

			newDucts.push({
				id: `duct_${room.id}`,
				fromRoom: "main",
				toRoom: room.id,
				diameter: roundedDiameter,
				length: length,
				airflow: load.cfm,
				velocity: actualVelocity,
				pressureLoss: pressureLoss,
			});
		});

		setDucts(newDucts);
	};

	// Calculate overall system performance
	const calculateSystemResults = (): SystemResults => {
		let totalCooling = 0;
		let totalHeating = 0;
		let totalAirflow = 0;

		roomLoads.forEach((load) => {
			totalCooling += load.total;
			totalAirflow += load.cfm;
		});

		// Add system losses and safety margin
		totalCooling *= systemSettings.designMargin;
		totalHeating = totalCooling * 0.7; // Rough heating estimate

		const totalCoolingKW = totalCooling / 1000;
		const totalHeatingKW = totalHeating / 1000;

		// Energy consumption and costs
		const coolingHours = 6 * 30 * 4; // 6 months, 30 days, 4 hours peak cooling
		const heatingHours = 4 * 30 * 8; // 4 months, 30 days, 8 hours heating

		const coolingEnergy =
			(totalCoolingKW / systemSettings.efficiency) * coolingHours;
		const heatingEnergy =
			(totalHeatingKW / (systemSettings.efficiency * 0.9)) * heatingHours;

		const annualCost =
			(coolingEnergy + heatingEnergy) * systemSettings.energyCost;

		// Carbon footprint (rough estimate)
		const carbonFootprint = (coolingEnergy + heatingEnergy) * 0.5; // kg CO2 per kWh

		return {
			totalCoolingLoad: totalCoolingKW,
			totalHeatingLoad: totalHeatingKW,
			totalAirflow: totalAirflow,
			energyEfficiency: systemSettings.efficiency,
			operatingCost: annualCost,
			carbonFootprint: carbonFootprint,
		};
	};

	const render = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw building layout
		ctx.strokeStyle = "#374151";
		ctx.lineWidth = 2;

		rooms.forEach((room) => {
			const load = roomLoads.get(room.id);

			// Room rectangle
			const width = room.width * 8;
			const height = room.length * 8;

			// Color based on cooling load
			let fillColor = "#f3f4f6";
			if (load) {
				const intensity = Math.min(load.total / 5000, 1); // Normalize to 5kW max
				const hue = lerp(240, 0, intensity); // Blue to red
				const color = hsl(hue, 80, 70);
				const rgb = hslToRgb(color);
				fillColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
			}

			ctx.fillStyle = fillColor;
			ctx.fillRect(room.x, room.y, width, height);
			ctx.strokeRect(room.x, room.y, width, height);

			// Room label and data
			ctx.fillStyle = "#1f2937";
			ctx.font = "12px Arial";
			ctx.textAlign = "center";
			ctx.fillText(room.name, room.x + width / 2, room.y + 15);

			if (load && displaySettings.showLoads) {
				ctx.font = "10px Arial";
				ctx.fillText(
					`${(load.total / 1000).toFixed(1)} kW`,
					room.x + width / 2,
					room.y + 30,
				);
				ctx.fillText(
					`${Math.round(load.cfm)} CFM`,
					room.x + width / 2,
					room.y + 45,
				);
			}

			if (displaySettings.showTemperatures) {
				ctx.fillText(
					`${room.designTemp}°C`,
					room.x + width / 2,
					room.y + height - 10,
				);
			}
		});

		// Draw ductwork
		if (displaySettings.showDucts) {
			const mainRoom = rooms[0];
			const mainX = mainRoom.x + (mainRoom.width * 8) / 2;
			const mainY = mainRoom.y + (mainRoom.length * 8) / 2;

			ducts.forEach((duct) => {
				const toRoom = rooms.find((r) => r.id === duct.toRoom);
				if (!toRoom) return;

				const toX = toRoom.x + (toRoom.width * 8) / 2;
				const toY = toRoom.y + (toRoom.length * 8) / 2;

				// Duct line thickness based on diameter
				ctx.lineWidth = Math.max(2, duct.diameter / 50);

				// Color based on velocity
				const velRatio = duct.velocity / systemSettings.maxVelocity;
				const hue = lerp(120, 0, velRatio); // Green to red
				const color = hsl(hue, 70, 50);
				const rgb = hslToRgb(color);
				ctx.strokeStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

				ctx.beginPath();
				ctx.moveTo(mainX, mainY);
				ctx.lineTo(toX, toY);
				ctx.stroke();

				// Airflow animation
				if (displaySettings.animateAirflow) {
					const progress = (time * 0.02) % 1;
					const animX = lerp(mainX, toX, progress);
					const animY = lerp(mainY, toY, progress);

					ctx.fillStyle = "rgba(59, 130, 246, 0.8)";
					ctx.beginPath();
					ctx.arc(animX, animY, 3, 0, TWO_PI);
					ctx.fill();
				}

				// Duct labels
				if (displaySettings.showVelocities) {
					const midX = (mainX + toX) / 2;
					const midY = (mainY + toY) / 2;

					ctx.fillStyle = "#1f2937";
					ctx.font = "10px Arial";
					ctx.textAlign = "center";
					ctx.fillText(`${duct.velocity.toFixed(1)} m/s`, midX, midY - 5);
					ctx.fillText(`Ø${duct.diameter}mm`, midX, midY + 10);
				}
			});
		}

		// Draw main AHU
		ctx.fillStyle = "#6b7280";
		ctx.strokeStyle = "#374151";
		ctx.lineWidth = 3;
		const mainRoom = rooms[0];
		const ahuX = mainRoom.x + 10;
		const ahuY = mainRoom.y + 10;
		ctx.fillRect(ahuX, ahuY, 40, 25);
		ctx.strokeRect(ahuX, ahuY, 40, 25);

		ctx.fillStyle = "#fff";
		ctx.font = "10px Arial";
		ctx.textAlign = "center";
		ctx.fillText("AHU", ahuX + 20, ahuY + 17);

		// Legend
		ctx.fillStyle = "#1f2937";
		ctx.font = "12px Arial";
		ctx.textAlign = "left";
		ctx.fillText("HVAC System Layout", 20, 30);

		if (displaySettings.showLoads) {
			ctx.font = "10px Arial";
			ctx.fillText(
				"Room Colors: Cooling Load (Blue = Low, Red = High)",
				20,
				50,
			);
		}

		if (displaySettings.showDucts) {
			ctx.fillText(
				"Duct Colors: Air Velocity (Green = Low, Red = High)",
				20,
				65,
			);
		}
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.width = 700;
		canvas.height = 400;

		// Calculate loads for all rooms
		const newLoads = new Map<string, HVACLoad>();
		rooms.forEach((room) => {
			newLoads.set(room.id, calculateRoomLoads(room));
		});
		setRoomLoads(newLoads);
	}, [rooms, systemSettings]);

	useEffect(() => {
		if (roomLoads.size > 0) {
			calculateDuctwork();
			setResults(calculateSystemResults());
		}
	}, [roomLoads, systemSettings]);

	useEffect(() => {
		render();
	}, [roomLoads, ducts, displaySettings, time]);

	useEffect(() => {
		if (!displaySettings.animateAirflow) return;

		const interval = setInterval(() => {
			setTime((prev) => prev + 1);
		}, 50);

		return () => clearInterval(interval);
	}, [displaySettings.animateAirflow]);

	const updateRoom = (roomId: string, field: keyof Room, value: any) => {
		setRooms((prev) =>
			prev.map((room) =>
				room.id === roomId ? { ...room, [field]: value } : room,
			),
		);
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					HVAC System Design Calculator
				</h1>
				<p className="text-gray-600 mb-4">
					HVAC load calculation, ductwork sizing, and energy analysis tool for
					building design.
				</p>
				<div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
					<p className="text-slate-800">
						🏢 Complete building HVAC analysis - heat loads, airflow, ductwork,
						and energy efficiency
					</p>
				</div>
			</div>

			{/* System Settings */}
			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-3">System Parameters</h3>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Outdoor Temp: {systemSettings.outdoorTemp}°C
						</label>
						<input
							type="range"
							min="25"
							max="45"
							step="1"
							value={systemSettings.outdoorTemp}
							onChange={(e) =>
								setSystemSettings((prev) => ({
									...prev,
									outdoorTemp: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Humidity: {systemSettings.outdoorHumidity}%
						</label>
						<input
							type="range"
							min="30"
							max="90"
							step="5"
							value={systemSettings.outdoorHumidity}
							onChange={(e) =>
								setSystemSettings((prev) => ({
									...prev,
									outdoorHumidity: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Efficiency: {systemSettings.efficiency} EER
						</label>
						<input
							type="range"
							min="2.5"
							max="5.0"
							step="0.1"
							value={systemSettings.efficiency}
							onChange={(e) =>
								setSystemSettings((prev) => ({
									...prev,
									efficiency: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Energy Cost: ${systemSettings.energyCost}/kWh
						</label>
						<input
							type="range"
							min="0.05"
							max="0.30"
							step="0.01"
							value={systemSettings.energyCost}
							onChange={(e) =>
								setSystemSettings((prev) => ({
									...prev,
									energyCost: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
				</div>
			</div>

			{/* Display Options */}
			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-3">Display Options</h3>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={displaySettings.showDucts}
							onChange={(e) =>
								setDisplaySettings((prev) => ({
									...prev,
									showDucts: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">Ductwork</span>
					</label>
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={displaySettings.showLoads}
							onChange={(e) =>
								setDisplaySettings((prev) => ({
									...prev,
									showLoads: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">
							Heat Loads
						</span>
					</label>
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={displaySettings.showVelocities}
							onChange={(e) =>
								setDisplaySettings((prev) => ({
									...prev,
									showVelocities: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">
							Velocities
						</span>
					</label>
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={displaySettings.animateAirflow}
							onChange={(e) =>
								setDisplaySettings((prev) => ({
									...prev,
									animateAirflow: e.target.checked,
								}))
							}
							className="mr-2"
						/>
						<span className="text-sm font-medium text-gray-700">
							Animate Airflow
						</span>
					</label>
				</div>
			</div>

			{/* Room Configuration */}
			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-3">Room Configuration</h3>
				<div className="space-y-4">
					{rooms.map((room, index) => (
						<div key={room.id} className="bg-gray-50 rounded-lg p-4">
							<h4 className="font-medium mb-3">{room.name}</h4>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Occupancy: {room.occupancy}
									</label>
									<input
										type="range"
										min="0"
										max="100"
										step="1"
										value={room.occupancy}
										onChange={(e) =>
											updateRoom(room.id, "occupancy", Number(e.target.value))
										}
										className="w-full"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Lighting: {room.lighting}W
									</label>
									<input
										type="range"
										min="200"
										max="5000"
										step="100"
										value={room.lighting}
										onChange={(e) =>
											updateRoom(room.id, "lighting", Number(e.target.value))
										}
										className="w-full"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Equipment: {room.equipment}W
									</label>
									<input
										type="range"
										min="500"
										max="20000"
										step="500"
										value={room.equipment}
										onChange={(e) =>
											updateRoom(room.id, "equipment", Number(e.target.value))
										}
										className="w-full"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Design Temp: {room.designTemp}°C
									</label>
									<input
										type="range"
										min="18"
										max="26"
										step="1"
										value={room.designTemp}
										onChange={(e) =>
											updateRoom(room.id, "designTemp", Number(e.target.value))
										}
										className="w-full"
									/>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Results */}
			{results && (
				<div className="mb-6">
					<h3 className="text-lg font-semibold mb-3">
						System Analysis Results
					</h3>
					<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<h4 className="font-medium text-blue-800">Total Cooling Load</h4>
							<p className="text-2xl font-bold text-blue-900">
								{results.totalCoolingLoad.toFixed(1)} kW
							</p>
							<p className="text-sm text-blue-600">
								{results.totalAirflow.toFixed(0)} CFM
							</p>
						</div>
						<div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
							<h4 className="font-medium text-orange-800">Operating Cost</h4>
							<p className="text-2xl font-bold text-orange-900">
								${results.operatingCost.toFixed(0)}
							</p>
							<p className="text-sm text-orange-600">per year</p>
						</div>
						<div className="bg-green-50 border border-green-200 rounded-lg p-4">
							<h4 className="font-medium text-green-800">Carbon Footprint</h4>
							<p className="text-2xl font-bold text-green-900">
								{(results.carbonFootprint / 1000).toFixed(1)} t
							</p>
							<p className="text-sm text-green-600">CO₂ per year</p>
						</div>
					</div>
				</div>
			)}

			{/* System Layout */}
			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-3">System Layout</h3>
				<canvas
					ref={canvasRef}
					className="border border-gray-300 rounded-lg bg-white"
					style={{ maxWidth: "100%", height: "auto" }}
				/>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-slate-800">
						HVAC Calculations
					</h3>
					<ul className="text-slate-700 space-y-1">
						<li>
							• <strong>Heat Load Analysis</strong>: ASHRAE 90.1 methodology
						</li>
						<li>
							• <strong>Duct Sizing</strong>: Equal friction method
						</li>
						<li>
							• <strong>Airflow Requirements</strong>: ASHRAE 62.1 ventilation
						</li>
						<li>
							• <strong>Energy Modeling</strong>: Annual consumption analysis
						</li>
					</ul>
				</div>

				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-blue-800">
						Design Applications
					</h3>
					<ul className="text-blue-700 space-y-1">
						<li>
							• <strong>Commercial Buildings</strong>: Office, retail,
							hospitality
						</li>
						<li>
							• <strong>System Selection</strong>: VAV, CAV, VRF comparison
						</li>
						<li>
							• <strong>Energy Efficiency</strong>: LEED compliance analysis
						</li>
						<li>
							• <strong>Cost Optimization</strong>: Lifecycle cost analysis
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6">
				<Link
					to="/examples/engineering"
					className="inline-block px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
				>
					← Back to Examples
				</Link>
			</div>
		</div>
	);
}
