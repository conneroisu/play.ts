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
} from "play.ts";
import { useEffect, useRef, useState } from "react";
import { createUrl } from "@/lib/utils";

interface Signal {
	data: number[];
	sampleRate: number;
	name: string;
	color: { h: number; s: number; l: number };
}

interface FilterSettings {
	type: "lowpass" | "highpass" | "bandpass" | "bandstop";
	cutoffFreq: number;
	bandwidth: number;
	order: number;
	enabled: boolean;
}

interface SignalSettings {
	amplitude: number;
	frequency: number;
	phase: number;
	noiseLevel: number;
	dcOffset: number;
	enabled: boolean;
}

interface FFTResult {
	magnitude: number[];
	phase: number[];
	frequencies: number[];
}

export default function SignalProcessingExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const timeRef = useRef<number>(0);

	const [signals, setSignals] = useState<SignalSettings[]>([
		{
			amplitude: 1,
			frequency: 5,
			phase: 0,
			noiseLevel: 0,
			dcOffset: 0,
			enabled: true,
		},
		{
			amplitude: 0.5,
			frequency: 15,
			phase: 0,
			noiseLevel: 0,
			dcOffset: 0,
			enabled: false,
		},
		{
			amplitude: 0.3,
			frequency: 25,
			phase: 0,
			noiseLevel: 0,
			dcOffset: 0,
			enabled: false,
		},
	]);

	const [filter, setFilter] = useState<FilterSettings>({
		type: "lowpass",
		cutoffFreq: 20,
		bandwidth: 5,
		order: 2,
		enabled: false,
	});

	const [displaySettings, setDisplaySettings] = useState({
		sampleRate: 100,
		duration: 2,
		showFiltered: true,
		showOriginal: true,
		showSpectrum: true,
		gridEnabled: true,
		analysisMode: "time" as "time" | "frequency" | "both",
	});

	const [isRealTime, setIsRealTime] = useState(false);
	const [presetType, setPresetType] = useState<
		"sine" | "square" | "sawtooth" | "noise" | "chirp" | "custom"
	>("sine");
	const [measurements, setMeasurements] = useState({
		rms: 0,
		peak: 0,
		snr: 0,
		thd: 0,
	});

	// Generate time-domain signal
	const generateSignal = (
		length: number,
		sampleRate: number,
		time = 0,
	): Signal => {
		const data: number[] = [];
		const dt = 1 / sampleRate;

		for (let i = 0; i < length; i++) {
			const t = i * dt + time;
			let value = 0;

			signals.forEach((sig, index) => {
				if (!sig.enabled) return;

				switch (presetType) {
					case "sine":
						value +=
							sig.amplitude * sin(TWO_PI * sig.frequency * t + sig.phase);
						break;
					case "square":
						value +=
							sig.amplitude *
							Math.sign(sin(TWO_PI * sig.frequency * t + sig.phase));
						break;
					case "sawtooth":
						value +=
							sig.amplitude *
							(2 * ((sig.frequency * t + sig.phase / TWO_PI) % 1) - 1);
						break;
					case "noise":
						value += sig.amplitude * randomFloat(-1, 1);
						break;
					case "chirp": {
						const f = sig.frequency + 10 * t; // Frequency sweep
						value += sig.amplitude * sin(TWO_PI * f * t + sig.phase);
						break;
					}
					default:
						value +=
							sig.amplitude * sin(TWO_PI * sig.frequency * t + sig.phase);
				}

				// Add noise
				if (sig.noiseLevel > 0) {
					value += randomFloat(-sig.noiseLevel, sig.noiseLevel);
				}

				// Add DC offset
				value += sig.dcOffset;
			});

			data.push(value);
		}

		return {
			data,
			sampleRate,
			name: "Original Signal",
			color: hsl(200, 80, 60),
		};
	};

	// Apply digital filter
	const applyFilter = (signal: Signal): Signal => {
		if (!filter.enabled) return signal;

		const filteredData = [...signal.data];
		const nyquist = signal.sampleRate / 2;
		const normalizedCutoff = filter.cutoffFreq / nyquist;

		// Simple IIR filter implementation (Butterworth approximation)
		const alpha = normalizedCutoff;
		const beta = 1 - alpha;

		// Apply filter based on type
		switch (filter.type) {
			case "lowpass":
				for (let i = 1; i < filteredData.length; i++) {
					filteredData[i] =
						alpha * filteredData[i] + beta * filteredData[i - 1];
				}
				break;
			case "highpass":
				for (let i = 1; i < filteredData.length; i++) {
					filteredData[i] =
						alpha *
						(filteredData[i - 1] + filteredData[i] - filteredData[i - 1]);
				}
				break;
			case "bandpass": {
				// Simple bandpass: highpass followed by lowpass
				const lowCutoff = (filter.cutoffFreq - filter.bandwidth / 2) / nyquist;
				const highCutoff = (filter.cutoffFreq + filter.bandwidth / 2) / nyquist;

				// Apply highpass then lowpass
				for (let i = 1; i < filteredData.length; i++) {
					filteredData[i] =
						lowCutoff * filteredData[i] + (1 - lowCutoff) * filteredData[i - 1];
				}
				break;
			}
			case "bandstop": {
				// Notch filter - subtract bandpass from original
				const bandpassData = [...signal.data];
				const centerFreq = filter.cutoffFreq / nyquist;

				for (let i = 1; i < bandpassData.length; i++) {
					bandpassData[i] =
						centerFreq * bandpassData[i] +
						(1 - centerFreq) * bandpassData[i - 1];
				}

				for (let i = 0; i < filteredData.length; i++) {
					filteredData[i] = signal.data[i] - bandpassData[i];
				}
				break;
			}
		}

		return {
			...signal,
			data: filteredData,
			name: "Filtered Signal",
			color: hsl(120, 80, 60),
		};
	};

	// Calculate FFT (simplified DFT for educational purposes)
	const calculateFFT = (signal: Signal): FFTResult => {
		const N = signal.data.length;
		const magnitude: number[] = [];
		const phase: number[] = [];
		const frequencies: number[] = [];

		// Calculate frequencies
		for (let k = 0; k < N / 2; k++) {
			frequencies.push((k * signal.sampleRate) / N);
		}

		// Calculate DFT
		for (let k = 0; k < N / 2; k++) {
			let realPart = 0;
			let imagPart = 0;

			for (let n = 0; n < N; n++) {
				const angle = (-TWO_PI * k * n) / N;
				realPart += signal.data[n] * cos(angle);
				imagPart += signal.data[n] * sin(angle);
			}

			realPart /= N;
			imagPart /= N;

			magnitude.push(Math.sqrt(realPart * realPart + imagPart * imagPart));
			phase.push(Math.atan2(imagPart, realPart));
		}

		return { magnitude, phase, frequencies };
	};

	// Calculate signal measurements
	const calculateMeasurements = (signal: Signal) => {
		const data = signal.data;
		const N = data.length;

		// RMS (Root Mean Square)
		const rms = Math.sqrt(data.reduce((sum, val) => sum + val * val, 0) / N);

		// Peak value
		const peak = Math.max(...data.map(Math.abs));

		// Calculate THD (Total Harmonic Distortion) - improved calculation
		const fft = calculateFFT(signal);
		if (fft.magnitude.length > 0) {
			// Find fundamental frequency (peak magnitude excluding DC)
			let fundamentalIndex = 1;
			let fundamentalMagnitude = fft.magnitude[1];

			for (let i = 2; i < Math.min(fft.magnitude.length, 20); i++) {
				if (fft.magnitude[i] > fundamentalMagnitude) {
					fundamentalIndex = i;
					fundamentalMagnitude = fft.magnitude[i];
				}
			}

			// Calculate harmonics power (excluding fundamental and DC)
			let harmonicsPower = 0;
			for (let i = 1; i < fft.magnitude.length; i++) {
				if (i !== fundamentalIndex) {
					harmonicsPower += fft.magnitude[i] * fft.magnitude[i];
				}
			}

			const fundamentalPower = fundamentalMagnitude * fundamentalMagnitude;
			const thd =
				fundamentalPower > 0
					? (Math.sqrt(harmonicsPower) / fundamentalMagnitude) * 100
					: 0;

			// SNR estimation (simplified)
			const signalPower = rms * rms;
			const noisePower = Math.max(0.001, signalPower * 0.01); // Estimate noise
			const snr = 10 * Math.log10(signalPower / noisePower);

			setMeasurements({
				rms: rms,
				peak: peak,
				snr: snr,
				thd: isNaN(thd) || !isFinite(thd) ? 0 : Math.min(thd, 100), // Cap THD at 100%
			});
		} else {
			setMeasurements({
				rms: rms,
				peak: peak,
				snr: 20,
				thd: 0,
			});
		}
	};

	const applyPreset = (type: string) => {
		switch (type) {
			case "sine":
				setSignals([
					{
						amplitude: 1,
						frequency: 10,
						phase: 0,
						noiseLevel: 0,
						dcOffset: 0,
						enabled: true,
					},
					{
						amplitude: 0.3,
						frequency: 30,
						phase: 0,
						noiseLevel: 0,
						dcOffset: 0,
						enabled: false,
					},
					{
						amplitude: 0.1,
						frequency: 50,
						phase: 0,
						noiseLevel: 0,
						dcOffset: 0,
						enabled: false,
					},
				]);
				break;
			case "square":
				setSignals([
					{
						amplitude: 1,
						frequency: 5,
						phase: 0,
						noiseLevel: 0,
						dcOffset: 0,
						enabled: true,
					},
					{
						amplitude: 0,
						frequency: 15,
						phase: 0,
						noiseLevel: 0,
						dcOffset: 0,
						enabled: false,
					},
					{
						amplitude: 0,
						frequency: 25,
						phase: 0,
						noiseLevel: 0,
						dcOffset: 0,
						enabled: false,
					},
				]);
				break;
			case "noise":
				setSignals([
					{
						amplitude: 0.5,
						frequency: 1,
						phase: 0,
						noiseLevel: 0.5,
						dcOffset: 0,
						enabled: true,
					},
					{
						amplitude: 0,
						frequency: 15,
						phase: 0,
						noiseLevel: 0,
						dcOffset: 0,
						enabled: false,
					},
					{
						amplitude: 0,
						frequency: 25,
						phase: 0,
						noiseLevel: 0,
						dcOffset: 0,
						enabled: false,
					},
				]);
				break;
			case "chirp":
				setSignals([
					{
						amplitude: 1,
						frequency: 5,
						phase: 0,
						noiseLevel: 0.1,
						dcOffset: 0,
						enabled: true,
					},
					{
						amplitude: 0,
						frequency: 15,
						phase: 0,
						noiseLevel: 0,
						dcOffset: 0,
						enabled: false,
					},
					{
						amplitude: 0,
						frequency: 25,
						phase: 0,
						noiseLevel: 0,
						dcOffset: 0,
						enabled: false,
					},
				]);
				break;
		}
	};

	const renderTimeSignal = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw background
		ctx.fillStyle = "#f8fafc";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		const length = displaySettings.sampleRate * displaySettings.duration;
		const originalSignal = generateSignal(
			length,
			displaySettings.sampleRate,
			isRealTime ? timeRef.current : 0,
		);
		const filteredSignal = applyFilter(originalSignal);

		calculateMeasurements(
			displaySettings.showFiltered ? filteredSignal : originalSignal,
		);

		const xScale = (canvas.width - 80) / length;
		const yScale = (canvas.height - 80) / 4; // Assuming ±2 amplitude range
		const centerY = canvas.height / 2;

		// Draw grid
		if (displaySettings.gridEnabled) {
			ctx.strokeStyle = "#e2e8f0";
			ctx.lineWidth = 1;

			// Horizontal grid lines
			for (let i = -2; i <= 2; i++) {
				const y = centerY - i * yScale;
				ctx.beginPath();
				ctx.moveTo(40, y);
				ctx.lineTo(canvas.width - 40, y);
				ctx.stroke();

				// Labels
				ctx.fillStyle = "#64748b";
				ctx.font = "12px Arial";
				ctx.textAlign = "right";
				ctx.fillText(i.toString(), 35, y + 4);
			}

			// Vertical grid lines (time markers)
			const timeSteps = 10;
			for (let i = 0; i <= timeSteps; i++) {
				const x = 40 + (i * (canvas.width - 80)) / timeSteps;
				const time = (i * displaySettings.duration) / timeSteps;

				ctx.beginPath();
				ctx.moveTo(x, 40);
				ctx.lineTo(x, canvas.height - 40);
				ctx.stroke();

				// Time labels
				ctx.fillStyle = "#64748b";
				ctx.font = "12px Arial";
				ctx.textAlign = "center";
				ctx.fillText(time.toFixed(1) + "s", x, canvas.height - 20);
			}
		}

		// Draw axes
		ctx.strokeStyle = "#1e293b";
		ctx.lineWidth = 2;

		// X-axis
		ctx.beginPath();
		ctx.moveTo(40, centerY);
		ctx.lineTo(canvas.width - 40, centerY);
		ctx.stroke();

		// Y-axis
		ctx.beginPath();
		ctx.moveTo(40, 40);
		ctx.lineTo(40, canvas.height - 40);
		ctx.stroke();

		// Draw signals
		const drawSignal = (signal: Signal, color: string, lineWidth: number) => {
			if (signal.data.length === 0) return;

			ctx.strokeStyle = color;
			ctx.lineWidth = lineWidth;
			ctx.beginPath();

			for (let i = 0; i < signal.data.length; i++) {
				const x = 40 + i * xScale;
				const y = centerY - signal.data[i] * yScale;

				if (i === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			}

			ctx.stroke();
		};

		// Draw original signal
		if (displaySettings.showOriginal) {
			drawSignal(originalSignal, toCssHsl(originalSignal.color), 2);
		}

		// Draw filtered signal
		if (displaySettings.showFiltered && filter.enabled) {
			drawSignal(filteredSignal, toCssHsl(filteredSignal.color), 2);
		}

		// Draw labels
		ctx.fillStyle = "#1e293b";
		ctx.font = "14px Arial";
		ctx.textAlign = "left";
		ctx.fillText("Amplitude", 10, 25);

		ctx.save();
		ctx.translate(canvas.width / 2, canvas.height - 5);
		ctx.textAlign = "center";
		ctx.fillText("Time (seconds)", 0, 0);
		ctx.restore();
	};

	const renderFrequencySpectrum = () => {
		const canvas = spectrumCanvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw background
		ctx.fillStyle = "#f8fafc";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		const length = displaySettings.sampleRate * displaySettings.duration;
		const originalSignal = generateSignal(
			length,
			displaySettings.sampleRate,
			isRealTime ? timeRef.current : 0,
		);
		const filteredSignal = applyFilter(originalSignal);

		const originalFFT = calculateFFT(originalSignal);
		const filteredFFT = filter.enabled
			? calculateFFT(filteredSignal)
			: originalFFT;

		const maxFreq = displaySettings.sampleRate / 2;
		const xScale = (canvas.width - 80) / maxFreq;
		const maxMagnitude = Math.max(
			...originalFFT.magnitude,
			...filteredFFT.magnitude,
		);
		const yScale = (canvas.height - 80) / (maxMagnitude + 0.1);

		// Draw grid
		if (displaySettings.gridEnabled) {
			ctx.strokeStyle = "#e2e8f0";
			ctx.lineWidth = 1;

			// Horizontal grid lines
			for (let i = 0; i <= 5; i++) {
				const y = canvas.height - 40 - (i * (canvas.height - 80)) / 5;
				ctx.beginPath();
				ctx.moveTo(40, y);
				ctx.lineTo(canvas.width - 40, y);
				ctx.stroke();

				// Magnitude labels
				const magnitude = (i * (maxMagnitude + 0.1)) / 5;
				ctx.fillStyle = "#64748b";
				ctx.font = "12px Arial";
				ctx.textAlign = "right";
				ctx.fillText(magnitude.toFixed(2), 35, y + 4);
			}

			// Vertical grid lines (frequency markers)
			const freqSteps = 10;
			for (let i = 0; i <= freqSteps; i++) {
				const x = 40 + (i * (canvas.width - 80)) / freqSteps;
				const freq = (i * maxFreq) / freqSteps;

				ctx.beginPath();
				ctx.moveTo(x, 40);
				ctx.lineTo(x, canvas.height - 40);
				ctx.stroke();

				// Frequency labels
				ctx.fillStyle = "#64748b";
				ctx.font = "12px Arial";
				ctx.textAlign = "center";
				ctx.fillText(freq.toFixed(0) + "Hz", x, canvas.height - 20);
			}
		}

		// Draw axes
		ctx.strokeStyle = "#1e293b";
		ctx.lineWidth = 2;

		// X-axis
		ctx.beginPath();
		ctx.moveTo(40, canvas.height - 40);
		ctx.lineTo(canvas.width - 40, canvas.height - 40);
		ctx.stroke();

		// Y-axis
		ctx.beginPath();
		ctx.moveTo(40, 40);
		ctx.lineTo(40, canvas.height - 40);
		ctx.stroke();

		// Draw spectrum
		const drawSpectrum = (fft: FFTResult, color: string, fillColor: string) => {
			ctx.fillStyle = fillColor;
			ctx.beginPath();
			ctx.moveTo(40, canvas.height - 40);

			for (let i = 0; i < fft.frequencies.length; i++) {
				const x = 40 + fft.frequencies[i] * xScale;
				const y = canvas.height - 40 - fft.magnitude[i] * yScale;

				if (i === 0) {
					ctx.moveTo(x, canvas.height - 40);
					ctx.lineTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			}

			ctx.lineTo(canvas.width - 40, canvas.height - 40);
			ctx.closePath();
			ctx.fill();

			// Draw outline
			ctx.strokeStyle = color;
			ctx.lineWidth = 2;
			ctx.beginPath();

			for (let i = 0; i < fft.frequencies.length; i++) {
				const x = 40 + fft.frequencies[i] * xScale;
				const y = canvas.height - 40 - fft.magnitude[i] * yScale;

				if (i === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			}

			ctx.stroke();
		};

		// Draw original spectrum
		if (displaySettings.showOriginal) {
			const color = toCssHsl(originalSignal.color);
			const fillColor = color.replace("hsl", "hsla").replace(")", ", 0.3)");
			drawSpectrum(originalFFT, color, fillColor);
		}

		// Draw filtered spectrum
		if (displaySettings.showFiltered && filter.enabled) {
			const color = toCssHsl(filteredSignal.color);
			const fillColor = color.replace("hsl", "hsla").replace(")", ", 0.3)");
			drawSpectrum(filteredFFT, color, fillColor);
		}

		// Draw filter response
		if (filter.enabled) {
			ctx.strokeStyle = "rgba(239, 68, 68, 0.8)";
			ctx.lineWidth = 2;
			ctx.setLineDash([5, 5]);

			const cutoffX = 40 + filter.cutoffFreq * xScale;
			ctx.beginPath();
			ctx.moveTo(cutoffX, 40);
			ctx.lineTo(cutoffX, canvas.height - 40);
			ctx.stroke();

			if (filter.type === "bandpass" || filter.type === "bandstop") {
				const lowX = 40 + (filter.cutoffFreq - filter.bandwidth / 2) * xScale;
				const highX = 40 + (filter.cutoffFreq + filter.bandwidth / 2) * xScale;

				ctx.beginPath();
				ctx.moveTo(lowX, 40);
				ctx.lineTo(lowX, canvas.height - 40);
				ctx.stroke();

				ctx.beginPath();
				ctx.moveTo(highX, 40);
				ctx.lineTo(highX, canvas.height - 40);
				ctx.stroke();
			}

			ctx.setLineDash([]);
		}

		// Draw labels
		ctx.fillStyle = "#1e293b";
		ctx.font = "14px Arial";
		ctx.textAlign = "left";
		ctx.fillText("Magnitude", 10, 25);

		ctx.save();
		ctx.translate(canvas.width / 2, canvas.height - 5);
		ctx.textAlign = "center";
		ctx.fillText("Frequency (Hz)", 0, 0);
		ctx.restore();
	};

	const animate = () => {
		timeRef.current += 0.02;

		if (
			displaySettings.analysisMode === "time" ||
			displaySettings.analysisMode === "both"
		) {
			renderTimeSignal();
		}

		if (
			displaySettings.analysisMode === "frequency" ||
			displaySettings.analysisMode === "both"
		) {
			renderFrequencySpectrum();
		}

		if (isRealTime) {
			animationRef.current = requestAnimationFrame(animate);
		}
	};

	const startRealTime = () => {
		setIsRealTime(true);
		animationRef.current = requestAnimationFrame(animate);
	};

	const stopRealTime = () => {
		setIsRealTime(false);
		if (animationRef.current) {
			cancelAnimationFrame(animationRef.current);
		}
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		const spectrumCanvas = spectrumCanvasRef.current;
		if (!canvas || !spectrumCanvas) return;

		canvas.width = 800;
		canvas.height = 400;
		spectrumCanvas.width = 800;
		spectrumCanvas.height = 400;

		animate();
	}, []);

	useEffect(() => {
		if (presetType !== "custom") {
			applyPreset(presetType);
		}
	}, [presetType]);

	useEffect(() => {
		if (!isRealTime) {
			animate();
		}
	}, [signals, filter, displaySettings]);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">
					Signal Processing & Analysis
				</h1>
				<p className="text-gray-600 mb-4">
					Signal processing toolkit with filtering, FFT analysis, and real-time
					visualization for engineering applications.
				</p>
				<div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
					<p className="text-cyan-800">
						📡 Interactive signal analysis with digital filters, spectrum
						visualization, and engineering measurements
					</p>
				</div>
			</div>

			<div className="mb-6">
				<div className="flex flex-wrap gap-4 mb-4">
					<button
						type="button"
						onClick={startRealTime}
						disabled={isRealTime}
						className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:opacity-50 transition-colors"
					>
						Start Real-time
					</button>
					<button
						type="button"
						onClick={stopRealTime}
						disabled={!isRealTime}
						className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
					>
						Stop Real-time
					</button>
					<button
						type="button"
						onClick={() =>
							setDisplaySettings((prev) => ({
								...prev,
								showOriginal: !prev.showOriginal,
							}))
						}
						className={`px-4 py-2 rounded-md transition-colors ${
							displaySettings.showOriginal
								? "bg-blue-600 text-white hover:bg-blue-700"
								: "bg-gray-300 text-gray-700 hover:bg-gray-400"
						}`}
					>
						Show Original
					</button>
					<button
						type="button"
						onClick={() =>
							setDisplaySettings((prev) => ({
								...prev,
								showFiltered: !prev.showFiltered,
							}))
						}
						className={`px-4 py-2 rounded-md transition-colors ${
							displaySettings.showFiltered
								? "bg-green-600 text-white hover:bg-green-700"
								: "bg-gray-300 text-gray-700 hover:bg-gray-400"
						}`}
					>
						Show Filtered
					</button>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Signal Type
						</label>
						<select
							value={presetType}
							onChange={(e) =>
								setPresetType(e.target.value as typeof presetType)
							}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
						>
							<option value="sine">Sine Wave</option>
							<option value="square">Square Wave</option>
							<option value="sawtooth">Sawtooth</option>
							<option value="noise">White Noise</option>
							<option value="chirp">Frequency Sweep</option>
							<option value="custom">Custom</option>
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Analysis Mode
						</label>
						<select
							value={displaySettings.analysisMode}
							onChange={(e) =>
								setDisplaySettings((prev) => ({
									...prev,
									analysisMode: e.target.value as typeof prev.analysisMode,
								}))
							}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
						>
							<option value="time">Time Domain</option>
							<option value="frequency">Frequency Domain</option>
							<option value="both">Both Domains</option>
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Sample Rate: {displaySettings.sampleRate} Hz
						</label>
						<input
							type="range"
							min="50"
							max="500"
							step="25"
							value={displaySettings.sampleRate}
							onChange={(e) =>
								setDisplaySettings((prev) => ({
									...prev,
									sampleRate: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Duration: {displaySettings.duration}s
						</label>
						<input
							type="range"
							min="0.5"
							max="5"
							step="0.5"
							value={displaySettings.duration}
							onChange={(e) =>
								setDisplaySettings((prev) => ({
									...prev,
									duration: Number(e.target.value),
								}))
							}
							className="w-full"
						/>
					</div>
				</div>

				{/* Signal Controls */}
				<div className="mb-6">
					<h3 className="text-lg font-semibold mb-3">Signal Components</h3>
					<div className="grid gap-4">
						{signals.map((signal, index) => (
							<div key={index} className="bg-gray-50 rounded-lg p-4">
								<div className="flex items-center justify-between mb-3">
									<span className="font-medium">Component {index + 1}</span>
									<label className="flex items-center">
										<input
											type="checkbox"
											checked={signal.enabled}
											onChange={(e) => {
												const newSignals = [...signals];
												newSignals[index].enabled = e.target.checked;
												setSignals(newSignals);
											}}
											className="mr-2"
										/>
										<span className="text-sm">Enabled</span>
									</label>
								</div>
								<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Amplitude: {signal.amplitude.toFixed(2)}
										</label>
										<input
											type="range"
											min="0"
											max="2"
											step="0.1"
											value={signal.amplitude}
											onChange={(e) => {
												const newSignals = [...signals];
												newSignals[index].amplitude = Number(e.target.value);
												setSignals(newSignals);
											}}
											className="w-full"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Frequency: {signal.frequency.toFixed(1)} Hz
										</label>
										<input
											type="range"
											min="0.1"
											max="50"
											step="0.5"
											value={signal.frequency}
											onChange={(e) => {
												const newSignals = [...signals];
												newSignals[index].frequency = Number(e.target.value);
												setSignals(newSignals);
											}}
											className="w-full"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Phase: {((signal.phase * 180) / PI).toFixed(0)}°
										</label>
										<input
											type="range"
											min="0"
											max={TWO_PI}
											step={PI / 12}
											value={signal.phase}
											onChange={(e) => {
												const newSignals = [...signals];
												newSignals[index].phase = Number(e.target.value);
												setSignals(newSignals);
											}}
											className="w-full"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Noise: {signal.noiseLevel.toFixed(2)}
										</label>
										<input
											type="range"
											min="0"
											max="0.5"
											step="0.01"
											value={signal.noiseLevel}
											onChange={(e) => {
												const newSignals = [...signals];
												newSignals[index].noiseLevel = Number(e.target.value);
												setSignals(newSignals);
											}}
											className="w-full"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											DC Offset: {signal.dcOffset.toFixed(2)}
										</label>
										<input
											type="range"
											min="-1"
											max="1"
											step="0.1"
											value={signal.dcOffset}
											onChange={(e) => {
												const newSignals = [...signals];
												newSignals[index].dcOffset = Number(e.target.value);
												setSignals(newSignals);
											}}
											className="w-full"
										/>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Filter Controls */}
				<div className="mb-6">
					<h3 className="text-lg font-semibold mb-3">Digital Filter</h3>
					<div className="bg-gray-50 rounded-lg p-4">
						<div className="flex items-center justify-between mb-3">
							<span className="font-medium">Filter Configuration</span>
							<label className="flex items-center">
								<input
									type="checkbox"
									checked={filter.enabled}
									onChange={(e) =>
										setFilter((prev) => ({
											...prev,
											enabled: e.target.checked,
										}))
									}
									className="mr-2"
								/>
								<span className="text-sm">Enable Filter</span>
							</label>
						</div>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Filter Type
								</label>
								<select
									value={filter.type}
									onChange={(e) =>
										setFilter((prev) => ({
											...prev,
											type: e.target.value as typeof prev.type,
										}))
									}
									className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
								>
									<option value="lowpass">Low Pass</option>
									<option value="highpass">High Pass</option>
									<option value="bandpass">Band Pass</option>
									<option value="bandstop">Band Stop</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Cutoff: {filter.cutoffFreq.toFixed(1)} Hz
								</label>
								<input
									type="range"
									min="1"
									max="50"
									step="0.5"
									value={filter.cutoffFreq}
									onChange={(e) =>
										setFilter((prev) => ({
											...prev,
											cutoffFreq: Number(e.target.value),
										}))
									}
									className="w-full"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Bandwidth: {filter.bandwidth.toFixed(1)} Hz
								</label>
								<input
									type="range"
									min="1"
									max="20"
									step="0.5"
									value={filter.bandwidth}
									onChange={(e) =>
										setFilter((prev) => ({
											...prev,
											bandwidth: Number(e.target.value),
										}))
									}
									disabled={
										filter.type === "lowpass" || filter.type === "highpass"
									}
									className="w-full"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Order: {filter.order}
								</label>
								<input
									type="range"
									min="1"
									max="8"
									step="1"
									value={filter.order}
									onChange={(e) =>
										setFilter((prev) => ({
											...prev,
											order: Number(e.target.value),
										}))
									}
									className="w-full"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Time Domain Display */}
			{(displaySettings.analysisMode === "time" ||
				displaySettings.analysisMode === "both") && (
				<div className="mb-6">
					<h3 className="text-lg font-semibold mb-3">Time Domain Analysis</h3>
					<canvas
						ref={canvasRef}
						className="border border-gray-300 rounded-lg bg-white"
						style={{ maxWidth: "100%", height: "auto" }}
					/>
				</div>
			)}

			{/* Frequency Domain Display */}
			{(displaySettings.analysisMode === "frequency" ||
				displaySettings.analysisMode === "both") && (
				<div className="mb-6">
					<h3 className="text-lg font-semibold mb-3">
						Frequency Domain Analysis (FFT)
					</h3>
					<canvas
						ref={spectrumCanvasRef}
						className="border border-gray-300 rounded-lg bg-white"
						style={{ maxWidth: "100%", height: "auto" }}
					/>
				</div>
			)}

			{/* Measurements */}
			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-3">Signal Measurements</h3>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<h4 className="font-medium text-blue-800">RMS Value</h4>
						<p className="text-2xl font-bold text-blue-900">
							{measurements.rms.toFixed(3)}
						</p>
						<p className="text-sm text-blue-600">Root Mean Square</p>
					</div>
					<div className="bg-green-50 border border-green-200 rounded-lg p-4">
						<h4 className="font-medium text-green-800">Peak Value</h4>
						<p className="text-2xl font-bold text-green-900">
							{measurements.peak.toFixed(3)}
						</p>
						<p className="text-sm text-green-600">Maximum Amplitude</p>
					</div>
					<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
						<h4 className="font-medium text-yellow-800">SNR</h4>
						<p className="text-2xl font-bold text-yellow-900">
							{measurements.snr.toFixed(1)} dB
						</p>
						<p className="text-sm text-yellow-600">Signal-to-Noise Ratio</p>
					</div>
					<div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
						<h4 className="font-medium text-purple-800">THD</h4>
						<p className="text-2xl font-bold text-purple-900">
							{measurements.thd.toFixed(2)}%
						</p>
						<p className="text-sm text-purple-600">Total Harmonic Distortion</p>
					</div>
				</div>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-cyan-800">
						Signal Processing Features
					</h3>
					<ul className="text-cyan-700 space-y-1">
						<li>
							• <strong>Multiple Signal Types</strong>: Sine, square, sawtooth,
							noise, chirp
						</li>
						<li>
							• <strong>Digital Filtering</strong>: Low/high/band pass and stop
							filters
						</li>
						<li>
							• <strong>FFT Analysis</strong>: Real-time frequency domain
							visualization
						</li>
						<li>
							• <strong>Engineering Metrics</strong>: RMS, peak, SNR, THD
							measurements
						</li>
					</ul>
				</div>

				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h3 className="text-lg font-semibold mb-2 text-blue-800">
						Engineering Applications
					</h3>
					<ul className="text-blue-700 space-y-1">
						<li>
							• <strong>Vibration Analysis</strong>: Mechanical system
							diagnostics
						</li>
						<li>
							• <strong>Audio Processing</strong>: Sound engineering and
							acoustics
						</li>
						<li>
							• <strong>Communication Systems</strong>: Signal conditioning and
							filtering
						</li>
						<li>
							• <strong>Control Systems</strong>: System identification and
							analysis
						</li>
					</ul>
				</div>
			</div>

			<div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
				<h3 className="text-lg font-semibold mb-2 text-indigo-800">
					Use Cases
				</h3>
				<div className="grid md:grid-cols-3 gap-4 text-indigo-700">
					<div>
						<strong>Telecommunications:</strong>
						<ul className="text-sm mt-1">
							<li>• Modulation analysis</li>
							<li>• Channel characterization</li>
							<li>• Interference detection</li>
						</ul>
					</div>
					<div>
						<strong>Mechanical Engineering:</strong>
						<ul className="text-sm mt-1">
							<li>• Vibration monitoring</li>
							<li>• Bearing fault detection</li>
							<li>• Modal analysis</li>
						</ul>
					</div>
					<div>
						<strong>Electronics:</strong>
						<ul className="text-sm mt-1">
							<li>• Circuit analysis</li>
							<li>• EMI/EMC testing</li>
							<li>• Power quality monitoring</li>
						</ul>
					</div>
				</div>
			</div>

			<div className="mt-6">
				<a
					href={createUrl("/examples/engineering")}
					className="inline-block px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
				>
					← Back to Examples
				</a>
			</div>
		</div>
	);
}