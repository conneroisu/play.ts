import { cos, sin } from "play.ts";
import { useEffect, useRef, useState } from "react";

export default function AsciiClockExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>(0);
	const [clockMode, setClockMode] = useState("digital");
	const [showSeconds, setShowSeconds] = useState(true);
	const [glowEffect, setGlowEffect] = useState(true);
	const [colorScheme, setColorScheme] = useState("green");
	const [timeFormat, setTimeFormat] = useState("12hour");
	const [currentTime, setCurrentTime] = useState(new Date());
	const [alarmTime, setAlarmTime] = useState("");
	const [isAlarmSet, setIsAlarmSet] = useState(false);
	const [alarmTriggered, setAlarmTriggered] = useState(false);
	const [timezone, setTimezone] = useState("local");
	const [clockStyle] = useState("retro");

	const colorSchemes = {
		green: { primary: "#00FF00", secondary: "#008800", background: "#000000" },
		blue: { primary: "#00AAFF", secondary: "#004488", background: "#000011" },
		amber: { primary: "#FFAA00", secondary: "#884400", background: "#110800" },
		red: { primary: "#FF4444", secondary: "#884444", background: "#110000" },
		white: { primary: "#FFFFFF", secondary: "#888888", background: "#000000" },
		neon: { primary: "#FF00FF", secondary: "#AA00AA", background: "#110011" },
		cyberpunk: {
			primary: "#00FFFF",
			secondary: "#008888",
			background: "#001122",
		},
	};

	const timezones = {
		local: "Local Time",
		utc: "UTC",
		est: "Eastern (EST)",
		pst: "Pacific (PST)",
		gmt: "Greenwich (GMT)",
		jst: "Japan (JST)",
		cet: "Central Europe (CET)",
	};

	// 7-segment display patterns for digits 0-9
	const sevenSegment = {
		"0": ["█████", "█   █", "█   █", "█   █", "█████"],
		"1": ["    █", "    █", "    █", "    █", "    █"],
		"2": ["█████", "    █", "█████", "█    ", "█████"],
		"3": ["█████", "    █", "█████", "    █", "█████"],
		"4": ["█   █", "█   █", "█████", "    █", "    █"],
		"5": ["█████", "█    ", "█████", "    █", "█████"],
		"6": ["█████", "█    ", "█████", "█   █", "█████"],
		"7": ["█████", "    █", "    █", "    █", "    █"],
		"8": ["█████", "█   █", "█████", "█   █", "█████"],
		"9": ["█████", "█   █", "█████", "    █", "█████"],
		":": ["     ", "  █  ", "     ", "  █  ", "     "],
		" ": ["     ", "     ", "     ", "     ", "     "],
	};

	// ASCII analog clock characters
	const clockFace = {
		center: "●",
		hour: "│",
		minute: "│",
		second: "·",
		border: "○",
		numbers: ["12", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const updateTime = () => {
			const now = new Date();
			let adjustedTime = now;

			// Apply timezone offset
			if (timezone !== "local") {
				const offsets = {
					utc: 0,
					est: -5,
					pst: -8,
					gmt: 0,
					jst: 9,
					cet: 1,
				};
				const offset = offsets[timezone as keyof typeof offsets] || 0;
				adjustedTime = new Date(now.getTime() + offset * 60 * 60 * 1000);
			}

			setCurrentTime(adjustedTime);

			// Check alarm
			if (isAlarmSet && alarmTime) {
				const timeString = formatTime(adjustedTime).substring(0, 5); // Remove seconds
				if (timeString === alarmTime && !alarmTriggered) {
					setAlarmTriggered(true);
					// Flash effect and sound (if available)
					setTimeout(() => setAlarmTriggered(false), 5000);
				}
			}
		};

		const formatTime = (time: Date) => {
			let hours = time.getHours();
			const minutes = time.getMinutes();
			const seconds = time.getSeconds();

			if (timeFormat === "12hour") {
				hours = hours % 12 || 12;
			}

			const timeString = showSeconds
				? `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
				: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

			return timeString;
		};

		const drawDigitalClock = (time: Date) => {
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Clear canvas
			ctx.fillStyle = scheme.background;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			const timeString = formatTime(time);
			const charWidth = 6;
			const charHeight = 5;
			const scale = Math.min(
				canvas.width / (timeString.length * charWidth * 8),
				canvas.height / (charHeight * 8),
			);
			const scaledCharWidth = charWidth * scale;
			const scaledCharHeight = charHeight * scale;

			const totalWidth = timeString.length * scaledCharWidth;
			const startX = (canvas.width - totalWidth) / 2;
			const startY = (canvas.height - scaledCharHeight) / 2;

			// Draw glow effect with alarm flash
			if (glowEffect || alarmTriggered) {
				const glowColor = alarmTriggered ? "#FF0000" : scheme.primary;
				const glowIntensity = alarmTriggered
					? 20 + 10 * sin(Date.now() * 0.02)
					: 10;
				ctx.shadowColor = glowColor;
				ctx.shadowBlur = glowIntensity;
			} else {
				ctx.shadowBlur = 0;
			}

			ctx.font = `${scale * 4}px "Courier New", monospace`;
			ctx.textBaseline = "top";

			for (let i = 0; i < timeString.length; i++) {
				const char = timeString[i];
				const pattern = sevenSegment[char as keyof typeof sevenSegment];

				if (pattern) {
					for (let row = 0; row < pattern.length; row++) {
						for (let col = 0; col < pattern[row].length; col++) {
							if (pattern[row][col] === "█") {
								const x = startX + i * scaledCharWidth + col * scale;
								const y = startY + row * scale;

								// Add flickering effect to seconds
								const isSecondDisplay =
									char === timeString[timeString.length - 1] ||
									char === timeString[timeString.length - 2];
								const flicker =
									isSecondDisplay && showSeconds
										? 0.8 + 0.2 * sin(Date.now() * 0.01)
										: 1;

								ctx.fillStyle =
									scheme.primary +
									Math.floor(flicker * 255)
										.toString(16)
										.padStart(2, "0");
								ctx.fillRect(x, y, scale, scale);
							}
						}
					}
				}
			}

			// Draw time zone and format info
			ctx.shadowBlur = 0;
			ctx.font = `${Math.max(12, scale)}px "Courier New", monospace`;
			ctx.fillStyle = scheme.secondary;

			const ampm =
				timeFormat === "12hour" ? (time.getHours() >= 12 ? " PM" : " AM") : "";
			const info = `${timeFormat.toUpperCase()}${ampm}`;
			ctx.fillText(info, 10, canvas.height - 30);

			const date = time.toLocaleDateString();
			ctx.fillText(
				date,
				canvas.width - ctx.measureText(date).width - 10,
				canvas.height - 30,
			);

			// Draw alarm status
			if (isAlarmSet) {
				ctx.fillStyle = alarmTriggered ? "#FF0000" : scheme.secondary;
				ctx.fillText(`🔔 Alarm: ${alarmTime}`, 10, canvas.height - 60);
			}

			// Draw timezone info
			ctx.fillStyle = scheme.secondary;
			const tzInfo = timezones[timezone as keyof typeof timezones];
			ctx.fillText(
				tzInfo,
				canvas.width - ctx.measureText(tzInfo).width - 10,
				canvas.height - 60,
			);

			// Alarm notification overlay
			if (alarmTriggered) {
				ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
				ctx.fillRect(0, 0, canvas.width, canvas.height);

				ctx.font = `${Math.max(24, scale * 6)}px "Courier New", monospace`;
				ctx.fillStyle = "#FFFFFF";
				ctx.textAlign = "center";
				const alarmText = "⏰ ALARM! ⏰";
				ctx.fillText(alarmText, canvas.width / 2, canvas.height / 4);
				ctx.textAlign = "left";
			}
		};

		const drawAnalogClock = (time: Date) => {
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Clear canvas
			ctx.fillStyle = scheme.background;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			const centerX = canvas.width / 2;
			const centerY = canvas.height / 2;
			const radius = Math.min(canvas.width, canvas.height) * 0.4;

			ctx.font = `${Math.max(12, radius * 0.1)}px "Courier New", monospace`;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";

			// Draw clock border
			ctx.strokeStyle = scheme.secondary;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
			ctx.stroke();

			// Draw hour markers and numbers
			for (let i = 0; i < 12; i++) {
				const angle = ((i * 30 - 90) * Math.PI) / 180;
				const outerX = centerX + cos(angle) * radius * 0.9;
				const outerY = centerY + sin(angle) * radius * 0.9;
				const innerX = centerX + cos(angle) * radius * 0.8;
				const innerY = centerY + sin(angle) * radius * 0.8;

				ctx.strokeStyle = scheme.primary;
				ctx.lineWidth = 3;
				ctx.beginPath();
				ctx.moveTo(innerX, innerY);
				ctx.lineTo(outerX, outerY);
				ctx.stroke();

				// Draw numbers
				const numberX = centerX + cos(angle) * radius * 0.7;
				const numberY = centerY + sin(angle) * radius * 0.7;
				ctx.fillStyle = scheme.primary;
				ctx.fillText(clockFace.numbers[i], numberX, numberY);
			}

			// Draw minute markers
			for (let i = 0; i < 60; i++) {
				if (i % 5 !== 0) {
					const angle = ((i * 6 - 90) * Math.PI) / 180;
					const outerX = centerX + cos(angle) * radius * 0.9;
					const outerY = centerY + sin(angle) * radius * 0.9;
					const innerX = centerX + cos(angle) * radius * 0.85;
					const innerY = centerY + sin(angle) * radius * 0.85;

					ctx.strokeStyle = scheme.secondary;
					ctx.lineWidth = 1;
					ctx.beginPath();
					ctx.moveTo(innerX, innerY);
					ctx.lineTo(outerX, outerY);
					ctx.stroke();
				}
			}

			const hours = time.getHours() % 12;
			const minutes = time.getMinutes();
			const seconds = time.getSeconds();

			// Draw hour hand
			const hourAngle = (((hours + minutes / 60) * 30 - 90) * Math.PI) / 180;
			const hourX = centerX + cos(hourAngle) * radius * 0.5;
			const hourY = centerY + sin(hourAngle) * radius * 0.5;

			ctx.strokeStyle = scheme.primary;
			ctx.lineWidth = 4;
			ctx.beginPath();
			ctx.moveTo(centerX, centerY);
			ctx.lineTo(hourX, hourY);
			ctx.stroke();

			// Draw minute hand
			const minuteAngle = ((minutes * 6 - 90) * Math.PI) / 180;
			const minuteX = centerX + cos(minuteAngle) * radius * 0.7;
			const minuteY = centerY + sin(minuteAngle) * radius * 0.7;

			ctx.strokeStyle = scheme.primary;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(centerX, centerY);
			ctx.lineTo(minuteX, minuteY);
			ctx.stroke();

			// Draw second hand (if enabled)
			if (showSeconds) {
				const secondAngle = ((seconds * 6 - 90) * Math.PI) / 180;
				const secondX = centerX + cos(secondAngle) * radius * 0.8;
				const secondY = centerY + sin(secondAngle) * radius * 0.8;

				ctx.strokeStyle = scheme.secondary;
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(centerX, centerY);
				ctx.lineTo(secondX, secondY);
				ctx.stroke();
			}

			// Draw center dot
			ctx.fillStyle = scheme.primary;
			ctx.beginPath();
			ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
			ctx.fill();

			// Draw digital time at bottom
			ctx.textAlign = "center";
			ctx.font = `${Math.max(16, radius * 0.15)}px "Courier New", monospace`;
			ctx.fillStyle = scheme.secondary;
			ctx.fillText(formatTime(time), centerX, centerY + radius * 1.3);
		};

		const animate = () => {
			updateTime();

			if (clockMode === "digital") {
				drawDigitalClock(currentTime);
			} else {
				drawAnalogClock(currentTime);
			}

			animationRef.current = requestAnimationFrame(animate);
		};

		const resizeCanvas = () => {
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
		};

		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);
		animate();

		return () => {
			window.removeEventListener("resize", resizeCanvas);
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [
		clockMode,
		showSeconds,
		glowEffect,
		colorScheme,
		timeFormat,
		alarmTime,
		isAlarmSet,
		alarmTriggered,
		timezone,
		clockStyle,
	]);

	const handleCanvasClick = () => {
		// Toggle between analog and digital modes
		setClockMode((prev) => (prev === "digital" ? "analog" : "digital"));
	};

	return (
		<div className="flex flex-col h-screen bg-black">
			<div className="flex-shrink-0 bg-gray-900 p-4 border-b border-gray-700">
				<h1 className="text-2xl font-bold text-blue-400 mb-4">
					🕐 ASCII Clock Display
				</h1>

				<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-sm mb-4">
					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Clock Mode</label>
						<select
							value={clockMode}
							onChange={(e) => setClockMode(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
						>
							<option value="digital">Digital</option>
							<option value="analog">Analog</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Time Format</label>
						<select
							value={timeFormat}
							onChange={(e) => setTimeFormat(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
						>
							<option value="12hour">12 Hour</option>
							<option value="24hour">24 Hour</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Color Scheme</label>
						<select
							value={colorScheme}
							onChange={(e) => setColorScheme(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
						>
							<option value="green">Matrix Green</option>
							<option value="blue">Ocean Blue</option>
							<option value="amber">Retro Amber</option>
							<option value="red">Alert Red</option>
							<option value="white">Classic White</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Show Seconds</label>
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={showSeconds}
								onChange={(e) => setShowSeconds(e.target.checked)}
								className="mr-2"
							/>
							<span className="text-blue-300">Enabled</span>
						</label>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Glow Effect</label>
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={glowEffect}
								onChange={(e) => setGlowEffect(e.target.checked)}
								className="mr-2"
							/>
							<span className="text-blue-300">Enabled</span>
						</label>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Timezone</label>
						<select
							value={timezone}
							onChange={(e) => setTimezone(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
						>
							<option value="local">Local Time</option>
							<option value="utc">UTC</option>
							<option value="est">Eastern (EST)</option>
							<option value="pst">Pacific (PST)</option>
							<option value="gmt">Greenwich (GMT)</option>
							<option value="jst">Japan (JST)</option>
							<option value="cet">Central Europe (CET)</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Set Alarm</label>
						<div className="flex gap-1">
							<input
								type="time"
								value={alarmTime}
								onChange={(e) => setAlarmTime(e.target.value)}
								className="px-1 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600 text-xs"
							/>
							<button
								onClick={() => setIsAlarmSet(!isAlarmSet)}
								className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
									isAlarmSet
										? "bg-red-600 hover:bg-red-700 text-white"
										: "bg-green-600 hover:bg-green-700 text-white"
								}`}
							>
								{isAlarmSet ? "Off" : "On"}
							</button>
						</div>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Current Time</label>
						<div className="text-blue-400 font-mono text-sm">
							{currentTime.toLocaleTimeString()}
						</div>
					</div>
				</div>

				<div className="text-blue-400 text-sm">
					<p>
						💡 <strong>Click the clock</strong> to toggle between digital and
						analog modes!
					</p>
					<p>
						⏰ <strong>Set alarms</strong> with visual and audio notifications!
					</p>
					<p>
						🌍 <strong>Switch timezones</strong> to see time around the world!
					</p>
					<p>
						Real-time ASCII clock with 7-segment display, analog visualization,
						alarms, and timezone support
					</p>
				</div>
			</div>

			<div className="flex-1 relative">
				<canvas
					ref={canvasRef}
					onClick={handleCanvasClick}
					className="absolute inset-0 w-full h-full cursor-pointer"
					style={{
						background:
							colorSchemes[colorScheme as keyof typeof colorSchemes].background,
						maxWidth: "100%",
						height: "auto",
					}}
				/>
			</div>
		</div>
	);
}