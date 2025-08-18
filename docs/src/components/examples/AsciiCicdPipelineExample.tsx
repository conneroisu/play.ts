import { clamp, cos, lerp, sin } from "play.ts";
import { useEffect, useRef, useState } from "react";

interface PipelineStage {
	id: string;
	name: string;
	x: number;
	y: number;
	status: "idle" | "running" | "success" | "failed" | "queued" | "skipped";
	progress: number;
	duration: number;
	elapsed_time: number;
	type: "source" | "build" | "test" | "security" | "deploy" | "monitor";
	dependencies: string[];
	artifacts: string[];
	environment?: string;
}

interface PipelineJob {
	id: string;
	commit_hash: string;
	branch: string;
	author: string;
	message: string;
	timestamp: number;
	status: "pending" | "running" | "success" | "failed" | "cancelled";
	stages: string[];
	current_stage?: string;
	total_duration: number;
	queue_position?: number;
}

interface BuildAgent {
	id: string;
	name: string;
	x: number;
	y: number;
	status: "idle" | "busy" | "offline" | "maintenance";
	current_job?: string;
	cpu_usage: number;
	memory_usage: number;
	build_count: number;
	uptime: number;
}

interface ArtifactFlow {
	id: string;
	source_stage: string;
	target_stage: string;
	artifact_name: string;
	x: number;
	y: number;
	target_x: number;
	target_y: number;
	progress: number;
	type: "docker_image" | "binary" | "test_report" | "deployment";
}

export default function AsciiCicdPipelineExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>(0);
	const stagesRef = useRef<Map<string, PipelineStage>>(new Map());
	const jobsRef = useRef<PipelineJob[]>([]);
	const agentsRef = useRef<BuildAgent[]>([]);
	const artifactFlowsRef = useRef<ArtifactFlow[]>([]);
	const [isPlaying, setIsPlaying] = useState(true);
	const [speed, setSpeed] = useState(1);
	const [displayMode, setDisplayMode] = useState("stages");
	const [colorScheme, setColorScheme] = useState("devops");
	const [pipelineMode, setPipelineMode] = useState("continuous");
	const [showArtifacts, setShowArtifacts] = useState(true);
	const [triggerRate, setTriggerRate] = useState(0.3);
	const [failureRate, setFailureRate] = useState(0.1);

	const colorSchemes = {
		devops: {
			bg: "#001122",
			text: "#00CCDD",
			success: "#00AA00",
			failed: "#DD0000",
			running: "#FFAA00",
			queued: "#8888AA",
			idle: "#666666",
		},
		github: {
			bg: "#0D1117",
			text: "#F0F6FC",
			success: "#238636",
			failed: "#DA3633",
			running: "#FB8500",
			queued: "#656D76",
			idle: "#30363D",
		},
		jenkins: {
			bg: "#1E3A8A",
			text: "#FFFFFF",
			success: "#10B981",
			failed: "#EF4444",
			running: "#F59E0B",
			queued: "#6B7280",
			idle: "#374151",
		},
		gitlab: {
			bg: "#1A1A1A",
			text: "#FCA326",
			success: "#00C896",
			failed: "#E24329",
			running: "#FC6D26",
			queued: "#9E9E9E",
			idle: "#424242",
		},
	};

	useEffect(() => {
		// Initialize pipeline stages
		const stages = new Map<string, PipelineStage>();

		const stageConfigs = [
			{
				name: "Source",
				x: 10,
				y: 8,
				type: "source",
				dependencies: [],
				duration: 5,
			},
			{
				name: "Build",
				x: 25,
				y: 8,
				type: "build",
				dependencies: ["Source"],
				duration: 120,
			},
			{
				name: "Unit Tests",
				x: 40,
				y: 5,
				type: "test",
				dependencies: ["Build"],
				duration: 60,
			},
			{
				name: "Integration Tests",
				x: 40,
				y: 11,
				type: "test",
				dependencies: ["Build"],
				duration: 180,
			},
			{
				name: "Security Scan",
				x: 55,
				y: 8,
				type: "security",
				dependencies: ["Build"],
				duration: 90,
			},
			{
				name: "Deploy Staging",
				x: 70,
				y: 5,
				type: "deploy",
				dependencies: ["Unit Tests", "Security Scan"],
				duration: 45,
				environment: "staging",
			},
			{
				name: "E2E Tests",
				x: 85,
				y: 5,
				type: "test",
				dependencies: ["Deploy Staging"],
				duration: 300,
			},
			{
				name: "Deploy Prod",
				x: 70,
				y: 11,
				type: "deploy",
				dependencies: ["Integration Tests", "E2E Tests"],
				duration: 30,
				environment: "production",
			},
			{
				name: "Monitor",
				x: 85,
				y: 11,
				type: "monitor",
				dependencies: ["Deploy Prod"],
				duration: 0,
			},
		];

		stageConfigs.forEach((config) => {
			stages.set(config.name, {
				id: config.name,
				name: config.name,
				x: config.x,
				y: config.y,
				status: "idle",
				progress: 0,
				duration: config.duration,
				elapsed_time: 0,
				type: config.type as PipelineStage["type"],
				dependencies: config.dependencies,
				artifacts: [],
				environment: config.environment,
			});
		});

		stagesRef.current = stages;

		// Initialize build agents
		agentsRef.current = [
			{
				id: "agent-01",
				name: "Linux-x64-01",
				x: 5,
				y: 20,
				status: "idle",
				cpu_usage: 10,
				memory_usage: 25,
				build_count: 0,
				uptime: 0,
			},
			{
				id: "agent-02",
				name: "Linux-x64-02",
				x: 20,
				y: 20,
				status: "idle",
				cpu_usage: 8,
				memory_usage: 20,
				build_count: 0,
				uptime: 0,
			},
			{
				id: "agent-03",
				name: "Windows-01",
				x: 35,
				y: 20,
				status: "idle",
				cpu_usage: 15,
				memory_usage: 35,
				build_count: 0,
				uptime: 0,
			},
			{
				id: "agent-04",
				name: "MacOS-01",
				x: 50,
				y: 20,
				status: "idle",
				cpu_usage: 12,
				memory_usage: 30,
				build_count: 0,
				uptime: 0,
			},
		];
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const resizeCanvas = () => {
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
		};

		const generateCommit = () => {
			const authors = ["Alice", "Bob", "Charlie", "Diana", "Eve"];
			const messages = [
				"Fix authentication bug",
				"Add new feature endpoint",
				"Update dependencies",
				"Refactor service layer",
				"Improve error handling",
				"Add unit tests",
				"Update documentation",
				"Performance optimization",
			];
			const branches = [
				"main",
				"develop",
				"feature/auth",
				"feature/api",
				"hotfix/security",
			];

			return {
				id: `job-${Date.now()}`,
				commit_hash: Math.random().toString(36).substring(2, 10),
				branch: branches[Math.floor(Math.random() * branches.length)],
				author: authors[Math.floor(Math.random() * authors.length)],
				message: messages[Math.floor(Math.random() * messages.length)],
				timestamp: Date.now(),
				status: "pending" as PipelineJob["status"],
				stages: Array.from(stagesRef.current.keys()),
				total_duration: 0,
			};
		};

		const canStageRun = (
			stage: PipelineStage,
			currentJob: PipelineJob,
		): boolean => {
			if (stage.dependencies.length === 0) return true;

			return stage.dependencies.every((depName) => {
				const dep = stagesRef.current.get(depName);
				return dep && dep.status === "success";
			});
		};

		const updatePipeline = () => {
			// Generate new jobs
			if (
				pipelineMode === "continuous" &&
				Math.random() < triggerRate * speed * 0.1
			) {
				const newJob = generateCommit();
				jobsRef.current.unshift(newJob);

				// Limit job history
				if (jobsRef.current.length > 10) {
					jobsRef.current.pop();
				}
			}

			// Update build agents
			agentsRef.current.forEach((agent) => {
				agent.uptime += 1000 * speed;

				if (agent.status === "busy") {
					agent.cpu_usage = clamp(80 + (Math.random() - 0.5) * 20, 60, 100);
					agent.memory_usage = clamp(70 + (Math.random() - 0.5) * 20, 50, 90);
				} else {
					agent.cpu_usage = clamp(
						agent.cpu_usage + (Math.random() - 0.5) * 5,
						5,
						25,
					);
					agent.memory_usage = clamp(
						agent.memory_usage + (Math.random() - 0.5) * 3,
						15,
						40,
					);
				}
			});

			// Process current jobs
			jobsRef.current.forEach((job) => {
				if (job.status === "pending") {
					// Start the first stage
					const firstStage = stagesRef.current.get("Source");
					if (firstStage && firstStage.status === "idle") {
						firstStage.status = "running";
						firstStage.progress = 0;
						firstStage.elapsed_time = 0;
						job.status = "running";
						job.current_stage = firstStage.name;

						// Assign to available agent
						const availableAgent = agentsRef.current.find(
							(a) => a.status === "idle",
						);
						if (availableAgent) {
							availableAgent.status = "busy";
							availableAgent.current_job = job.id;
							availableAgent.build_count++;
						}
					}
				} else if (job.status === "running") {
					const currentStage = stagesRef.current.get(job.current_stage || "");
					if (currentStage) {
						// Update stage progress
						if (currentStage.status === "running") {
							currentStage.elapsed_time += 1000 * speed;
							currentStage.progress = Math.min(
								100,
								(currentStage.elapsed_time / (currentStage.duration * 1000)) *
									100,
							);

							// Check if stage completed
							if (currentStage.progress >= 100) {
								// Determine success/failure
								const shouldFail = Math.random() < failureRate;
								currentStage.status = shouldFail ? "failed" : "success";
								currentStage.progress = 100;

								if (shouldFail) {
									job.status = "failed";
									job.current_stage = undefined;

									// Free up agent
									const agent = agentsRef.current.find(
										(a) => a.current_job === job.id,
									);
									if (agent) {
										agent.status = "idle";
										agent.current_job = undefined;
									}
								} else {
									// Create artifact flow
									if (showArtifacts && currentStage.type === "build") {
										artifactFlowsRef.current.push({
											id: `artifact-${Date.now()}`,
											source_stage: currentStage.name,
											target_stage: "Deploy Staging",
											artifact_name: "docker-image:latest",
											x: currentStage.x,
											y: currentStage.y,
											target_x: 70,
											target_y: 5,
											progress: 0,
											type: "docker_image",
										});
									}

									// Find next stage to run
									let nextStageFound = false;
									stagesRef.current.forEach((stage, name) => {
										if (
											!nextStageFound &&
											stage.status === "idle" &&
											canStageRun(stage, job)
										) {
											stage.status = "running";
											stage.progress = 0;
											stage.elapsed_time = 0;
											job.current_stage = name;
											nextStageFound = true;
										}
									});

									// If no next stage, job is complete
									if (!nextStageFound) {
										job.status = "success";
										job.current_stage = undefined;
										job.total_duration = Date.now() - job.timestamp;

										// Free up agent
										const agent = agentsRef.current.find(
											(a) => a.current_job === job.id,
										);
										if (agent) {
											agent.status = "idle";
											agent.current_job = undefined;
										}

										// Reset all stages for next job
										setTimeout(() => {
											stagesRef.current.forEach((stage) => {
												stage.status = "idle";
												stage.progress = 0;
												stage.elapsed_time = 0;
											});
										}, 2000);
									}
								}
							}
						}
					}
				}
			});

			// Update artifact flows
			artifactFlowsRef.current.forEach((flow) => {
				flow.progress += 0.02 * speed;
				flow.x = lerp(flow.x, flow.target_x, flow.progress);
				flow.y = lerp(flow.y, flow.target_y, flow.progress);
			});

			// Remove completed artifacts
			artifactFlowsRef.current = artifactFlowsRef.current.filter(
				(f) => f.progress < 1,
			);
		};

		const drawStage = (stage: PipelineStage) => {
			const fontSize = 10;
			const x = stage.x;
			const y = stage.y;

			let stageColor =
				colorSchemes[colorScheme as keyof typeof colorSchemes].idle;
			if (stage.status === "running")
				stageColor =
					colorSchemes[colorScheme as keyof typeof colorSchemes].running;
			else if (stage.status === "success")
				stageColor =
					colorSchemes[colorScheme as keyof typeof colorSchemes].success;
			else if (stage.status === "failed")
				stageColor =
					colorSchemes[colorScheme as keyof typeof colorSchemes].failed;
			else if (stage.status === "queued")
				stageColor =
					colorSchemes[colorScheme as keyof typeof colorSchemes].queued;

			ctx.fillStyle = stageColor;

			// Stage icon based on type
			let stageIcon = "◯";
			if (stage.type === "source") stageIcon = "📁";
			else if (stage.type === "build") stageIcon = "🔨";
			else if (stage.type === "test") stageIcon = "🧪";
			else if (stage.type === "security") stageIcon = "🔒";
			else if (stage.type === "deploy") stageIcon = "🚀";
			else if (stage.type === "monitor") stageIcon = "📊";

			// Stage representation
			const stageArt = [
				"┌─────────┐",
				`│ ${stageIcon}       │`,
				"│         │",
				"│ ■■■■■■■ │",
				"└─────────┘",
			];

			stageArt.forEach((line, i) => {
				if (i === 3) {
					// Progress bar
					const progressChars = Math.floor((stage.progress / 100) * 7);
					const progressBar =
						"■".repeat(progressChars) + "□".repeat(7 - progressChars);
					ctx.fillText(`│ ${progressBar} │`, x * fontSize, (y + i) * fontSize);
				} else {
					ctx.fillText(line, x * fontSize, (y + i) * fontSize);
				}
			});

			// Stage name and info
			ctx.fillStyle =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text;
			ctx.fillText(stage.name, x * fontSize, (y - 1) * fontSize);

			if (stage.environment) {
				ctx.fillText(
					`(${stage.environment})`,
					x * fontSize,
					(y + 6) * fontSize,
				);
			}

			// Status and timing
			if (stage.status === "running") {
				ctx.fillText(
					`${(stage.elapsed_time / 1000).toFixed(0)}s / ${stage.duration}s`,
					x * fontSize,
					(y + 7) * fontSize,
				);
			} else if (stage.status === "success" || stage.status === "failed") {
				ctx.fillText(`${stage.duration}s`, x * fontSize, (y + 7) * fontSize);
			}
		};

		const drawConnections = () => {
			const fontSize = 10;
			ctx.strokeStyle =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text + "40";
			ctx.lineWidth = 1;
			ctx.setLineDash([2, 2]);

			stagesRef.current.forEach((stage) => {
				stage.dependencies.forEach((depName) => {
					const dep = stagesRef.current.get(depName);
					if (dep) {
						const x1 = (dep.x + 10) * fontSize;
						const y1 = (dep.y + 2) * fontSize;
						const x2 = stage.x * fontSize;
						const y2 = (stage.y + 2) * fontSize;

						ctx.beginPath();
						ctx.moveTo(x1, y1);
						ctx.lineTo(x2, y2);
						ctx.stroke();
					}
				});
			});

			ctx.setLineDash([]);
		};

		const drawBuildAgents = () => {
			const fontSize = 10;

			agentsRef.current.forEach((agent) => {
				let agentColor =
					colorSchemes[colorScheme as keyof typeof colorSchemes].idle;
				if (agent.status === "busy")
					agentColor =
						colorSchemes[colorScheme as keyof typeof colorSchemes].running;
				else if (agent.status === "offline")
					agentColor =
						colorSchemes[colorScheme as keyof typeof colorSchemes].failed;

				ctx.fillStyle = agentColor;

				const agentArt = ["┌───────┐", "│ AGENT │", "│ ████  │", "└───────┘"];

				agentArt.forEach((line, i) => {
					ctx.fillText(line, agent.x * fontSize, (agent.y + i) * fontSize);
				});

				ctx.fillStyle =
					colorSchemes[colorScheme as keyof typeof colorSchemes].text;
				ctx.fillText(agent.name, agent.x * fontSize, (agent.y - 1) * fontSize);
				ctx.fillText(
					`CPU: ${agent.cpu_usage}%`,
					agent.x * fontSize,
					(agent.y + 5) * fontSize,
				);
				ctx.fillText(
					`Builds: ${agent.build_count}`,
					agent.x * fontSize,
					(agent.y + 6) * fontSize,
				);
			});
		};

		const drawJobs = () => {
			const fontSize = 10;
			const startY = 27;

			ctx.fillStyle =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text;
			ctx.fillText("┌─ RECENT JOBS ─┐", 10, startY * fontSize);

			jobsRef.current.slice(0, 6).forEach((job, i) => {
				let jobColor =
					colorSchemes[colorScheme as keyof typeof colorSchemes].queued;
				if (job.status === "running")
					jobColor =
						colorSchemes[colorScheme as keyof typeof colorSchemes].running;
				else if (job.status === "success")
					jobColor =
						colorSchemes[colorScheme as keyof typeof colorSchemes].success;
				else if (job.status === "failed")
					jobColor =
						colorSchemes[colorScheme as keyof typeof colorSchemes].failed;

				ctx.fillStyle = jobColor;
				const jobY = startY + 1 + i;
				const ago = Math.floor((Date.now() - job.timestamp) / 60000);

				ctx.fillText(
					`│ ${job.commit_hash} ${job.branch} - ${job.author}`,
					10,
					jobY * fontSize,
				);
				ctx.fillText(
					`│ "${job.message}" ${ago}m ago [${job.status.toUpperCase()}]`,
					10,
					(jobY + 0.5) * fontSize,
				);

				if (job.current_stage) {
					ctx.fillText(
						`│ Current: ${job.current_stage}`,
						10,
						(jobY + 1) * fontSize,
					);
				}
			});

			ctx.fillStyle =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text;
			ctx.fillText("└───────────────┘", 10, (startY + 8) * fontSize);
		};

		const drawArtifacts = () => {
			if (!showArtifacts) return;

			const fontSize = 10;

			artifactFlowsRef.current.forEach((artifact) => {
				let artifactChar = "📦";
				if (artifact.type === "docker_image") artifactChar = "🐳";
				else if (artifact.type === "binary") artifactChar = "⚙️";
				else if (artifact.type === "test_report") artifactChar = "📋";
				else if (artifact.type === "deployment") artifactChar = "🚀";

				ctx.fillStyle =
					colorSchemes[colorScheme as keyof typeof colorSchemes].running;
				ctx.fillText(
					artifactChar,
					artifact.x * fontSize,
					artifact.y * fontSize,
				);
			});
		};

		const drawStatistics = () => {
			const currentJob = jobsRef.current.find((j) => j.status === "running");
			const successfulJobs = jobsRef.current.filter(
				(j) => j.status === "success",
			).length;
			const failedJobs = jobsRef.current.filter(
				(j) => j.status === "failed",
			).length;
			const busyAgents = agentsRef.current.filter(
				(a) => a.status === "busy",
			).length;
			const avgBuildTime =
				jobsRef.current
					.filter((j) => j.total_duration > 0)
					.reduce((sum, j) => sum + j.total_duration, 0) /
				Math.max(1, successfulJobs) /
				1000;

			ctx.fillStyle =
				colorSchemes[colorScheme as keyof typeof colorSchemes].text;
			const statsY = canvas.height - 100;

			ctx.fillText("┌─ CI/CD PIPELINE DASHBOARD ─┐", 10, statsY);
			ctx.fillText(
				`│ Mode: ${pipelineMode} | Trigger Rate: ${(triggerRate * 100).toFixed(0)}% | Failure Rate: ${(failureRate * 100).toFixed(0)}%`,
				10,
				statsY + 15,
			);
			ctx.fillText(
				`│ Jobs: ${successfulJobs} ✓ ${failedJobs} ✗ | Active Agents: ${busyAgents}/${agentsRef.current.length}`,
				10,
				statsY + 30,
			);

			if (currentJob) {
				ctx.fillText(
					`│ Current: ${currentJob.commit_hash} by ${currentJob.author} | Stage: ${currentJob.current_stage}`,
					10,
					statsY + 45,
				);
			}

			ctx.fillText(
				`│ Avg Build Time: ${avgBuildTime.toFixed(0)}s | Queue: ${jobsRef.current.filter((j) => j.status === "pending").length}`,
				10,
				statsY + 60,
			);
			ctx.fillText("└─────────────────────────────┘", 10, statsY + 75);
		};

		const animate = () => {
			if (!isPlaying) return;

			const currentScheme =
				colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Clear canvas
			ctx.fillStyle = currentScheme.bg;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			ctx.font = '10px "Courier New", monospace';
			ctx.textBaseline = "top";

			// Update system
			if (Math.random() < 0.15 * speed) {
				updatePipeline();
			}

			// Draw components
			drawConnections();
			stagesRef.current.forEach((stage) => drawStage(stage));
			drawBuildAgents();
			drawJobs();
			drawArtifacts();
			drawStatistics();

			animationRef.current = requestAnimationFrame(animate);
		};

		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);

		if (isPlaying) {
			animate();
		}

		return () => {
			window.removeEventListener("resize", resizeCanvas);
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [
		isPlaying,
		speed,
		displayMode,
		colorScheme,
		pipelineMode,
		showArtifacts,
		triggerRate,
		failureRate,
	]);

	return (
		<div className="flex flex-col h-screen bg-black">
			<div className="flex-shrink-0 bg-gray-900 p-4 border-b border-gray-700">
				<h1 className="text-2xl font-bold text-blue-400 mb-4">
					🔄 ASCII CI/CD Pipeline Monitor
				</h1>

				<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-sm mb-4">
					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Animation</label>
						<button
							onClick={() => setIsPlaying(!isPlaying)}
							className={`px-3 py-2 rounded font-medium transition-colors ${
								isPlaying
									? "bg-red-600 hover:bg-red-700 text-white"
									: "bg-green-600 hover:bg-green-700 text-white"
							}`}
						>
							{isPlaying ? "Pause" : "Play"}
						</button>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">
							Speed: {speed.toFixed(1)}x
						</label>
						<input
							type="range"
							min="0.1"
							max="3"
							step="0.1"
							value={speed}
							onChange={(e) => setSpeed(Number.parseFloat(e.target.value))}
							className="w-full"
						/>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">
							Trigger Rate: {Math.round(triggerRate * 100)}%
						</label>
						<input
							type="range"
							min="0.1"
							max="1"
							step="0.1"
							value={triggerRate}
							onChange={(e) =>
								setTriggerRate(Number.parseFloat(e.target.value))
							}
							className="w-full"
						/>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">
							Failure Rate: {Math.round(failureRate * 100)}%
						</label>
						<input
							type="range"
							min="0"
							max="0.5"
							step="0.05"
							value={failureRate}
							onChange={(e) =>
								setFailureRate(Number.parseFloat(e.target.value))
							}
							className="w-full"
						/>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Pipeline Mode</label>
						<select
							value={pipelineMode}
							onChange={(e) => setPipelineMode(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
						>
							<option value="continuous">Continuous</option>
							<option value="manual">Manual</option>
							<option value="scheduled">Scheduled</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Color Scheme</label>
						<select
							value={colorScheme}
							onChange={(e) => setColorScheme(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
						>
							<option value="devops">DevOps Blue</option>
							<option value="github">GitHub Dark</option>
							<option value="jenkins">Jenkins Blue</option>
							<option value="gitlab">GitLab Orange</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-blue-300 mb-2">Display Mode</label>
						<select
							value={displayMode}
							onChange={(e) => setDisplayMode(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
						>
							<option value="stages">Stage View</option>
							<option value="jobs">Job View</option>
							<option value="agents">Agent View</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="flex items-center text-blue-300 text-xs">
							<input
								type="checkbox"
								checked={showArtifacts}
								onChange={(e) => setShowArtifacts(e.target.checked)}
								className="mr-1"
							/>
							Artifacts
						</label>
					</div>
				</div>

				<div className="mt-4 text-blue-400 text-sm">
					<p>
						🔄 <strong>Real-time CI/CD pipeline visualization</strong> with
						multi-stage builds and deployments!
					</p>
					<p>
						🏗️ <strong>Watch builds flow through stages</strong> from source to
						production with parallel execution!
					</p>
					<p>
						📊 <strong>Monitor build agents and artifacts</strong> with
						realistic failure rates and timing!
					</p>
					<p>
						Track commits, test results, deployments, and build agent
						utilization in a DevOps dashboard
					</p>
				</div>

				<div className="mt-4">
					<a
						href="/examples/visual"
						className="text-blue-400 hover:text-blue-300 underline"
					>
						← Back to Visual Examples
					</a>
				</div>
			</div>

			<div className="flex-1 relative">
				<canvas
					ref={canvasRef}
					className="absolute inset-0 w-full h-full"
					style={{
						background:
							colorSchemes[colorScheme as keyof typeof colorSchemes].bg,
					}}
				/>
			</div>
		</div>
	);
}