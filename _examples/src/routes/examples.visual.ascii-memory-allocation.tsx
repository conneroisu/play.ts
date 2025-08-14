import { createFileRoute } from "@tanstack/react-router";
import { clamp, lerp } from "play.ts";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute(
	"/examples/visual/ascii-memory-allocation",
)({
	component: ASCIIMemoryAllocationExample,
});

interface MemoryBlock {
	id: string;
	start_address: number;
	size: number;
	type:
		| "heap"
		| "stack"
		| "code"
		| "data"
		| "free"
		| "kernel"
		| "cache"
		| "buffer";
	owner: string;
	allocated_time: number;
	access_count: number;
	fragmentation: number;
	protection: "read" | "write" | "execute" | "rw" | "rx" | "rwx";
	virtual: boolean;
	status: "allocated" | "free" | "dirty" | "swapped" | "locked" | "compressed";
}

interface MemoryProcess {
	id: string;
	name: string;
	pid: number;
	memory_usage: number;
	virtual_size: number;
	resident_size: number;
	shared_size: number;
	heap_size: number;
	stack_size: number;
	priority: number;
	cpu_usage: number;
	page_faults: number;
	blocks: MemoryBlock[];
	x: number;
	y: number;
	status: "running" | "sleeping" | "stopped" | "zombie" | "swapped";
}

interface MemoryPage {
	id: string;
	frame_number: number;
	virtual_address: number;
	physical_address: number;
	process_id: string;
	dirty: boolean;
	accessed: boolean;
	present: boolean;
	swapped: boolean;
	age: number;
	reference_bit: boolean;
}

interface GCEvent {
	id: string;
	timestamp: number;
	type: "minor" | "major" | "full" | "concurrent" | "incremental";
	collected_bytes: number;
	duration: number;
	pause_time: number;
	heap_before: number;
	heap_after: number;
	generation: number;
}

interface MemoryOperation {
	id: string;
	type:
		| "malloc"
		| "free"
		| "realloc"
		| "mmap"
		| "page_fault"
		| "swap_in"
		| "swap_out";
	address: number;
	size: number;
	process_id: string;
	timestamp: number;
	latency: number;
	success: boolean;
}

function ASCIIMemoryAllocationExample() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>(0);
	const processesRef = useRef<Map<string, MemoryProcess>>(new Map());
	const memoryBlocksRef = useRef<MemoryBlock[]>([]);
	const pagesRef = useRef<Map<number, MemoryPage>>(new Map());
	const gcEventsRef = useRef<GCEvent[]>([]);
	const operationsRef = useRef<MemoryOperation[]>([]);
	const [isPlaying, setIsPlaying] = useState(true);
	const [speed, setSpeed] = useState(1);
	const [displayMode, setDisplayMode] = useState("allocation");
	const [memorySystem, setMemorySystem] = useState("virtual");
	const [allocationStrategy, setAllocationStrategy] = useState("first_fit");
	const [colorScheme, setColorScheme] = useState("memory");
	const [showProcesses, setShowProcesses] = useState(true);
	const [showGC, setShowGC] = useState(true);
	const [showPages, setShowPages] = useState(false);
	const [gcStrategy, setGCStrategy] = useState("generational");
	const [memoryPressure, setMemoryPressure] = useState("normal");
	const [totalMemory, setTotalMemory] = useState(8192); // MB

	const colorSchemes = {
		memory: {
			bg: "#000022",
			heap: "#00AA00",
			stack: "#00AAFF",
			code: "#AA00AA",
			data: "#AAAA00",
			free: "#444444",
			kernel: "#FF4444",
			text: "#FFFFFF",
		},
		address_space: {
			bg: "#001100",
			heap: "#88FF88",
			stack: "#88AAFF",
			code: "#FF88FF",
			data: "#FFFF88",
			free: "#666666",
			kernel: "#FF8888",
			text: "#FFFFFF",
		},
		allocation: {
			bg: "#110000",
			heap: "#FF6666",
			stack: "#66AAFF",
			code: "#FF66FF",
			data: "#FFAA66",
			free: "#888888",
			kernel: "#AA6666",
			text: "#FFFFFF",
		},
		virtual: {
			bg: "#000011",
			heap: "#6666FF",
			stack: "#66FFFF",
			code: "#FF6666",
			data: "#FFFF66",
			free: "#666666",
			kernel: "#FF6666",
			text: "#FFFFFF",
		},
		gc: {
			bg: "#001122",
			heap: "#00FF88",
			stack: "#88AAFF",
			code: "#FF8888",
			data: "#FFFF88",
			free: "#555555",
			kernel: "#FF4444",
			text: "#FFFFFF",
		},
	};

	useEffect(() => {
		// Initialize memory system
		const processes = new Map<string, MemoryProcess>();
		const memoryBlocks: MemoryBlock[] = [];
		const pages = new Map<number, MemoryPage>();

		// Create system processes
		const processConfigs = [
			{ name: "kernel", pid: 0, memory: 512, type: "system" },
			{ name: "chrome", pid: 1001, memory: 1024, type: "browser" },
			{ name: "vscode", pid: 1002, memory: 512, type: "editor" },
			{ name: "node", pid: 1003, memory: 256, type: "runtime" },
			{ name: "postgres", pid: 1004, memory: 384, type: "database" },
			{ name: "nginx", pid: 1005, memory: 64, type: "server" },
			{ name: "docker", pid: 1006, memory: 128, type: "container" },
			{ name: "redis", pid: 1007, memory: 96, type: "cache" },
		];

		let currentAddress = 0x100000; // Start at 1MB

		processConfigs.forEach((config, index) => {
			const process: MemoryProcess = {
				id: config.name,
				name: config.name,
				pid: config.pid,
				memory_usage: config.memory,
				virtual_size: config.memory * 1.5,
				resident_size: config.memory * 0.8,
				shared_size: config.memory * 0.1,
				heap_size: config.memory * 0.6,
				stack_size: config.memory * 0.05,
				priority: config.type === "system" ? 0 : Math.floor(Math.random() * 20),
				cpu_usage: Math.random() * 50,
				page_faults: Math.floor(Math.random() * 1000),
				blocks: [],
				x: 10 + (index % 4) * 20,
				y: 5 + Math.floor(index / 4) * 8,
				status: "running",
			};

			// Create memory blocks for process
			const blockTypes = ["heap", "stack", "code", "data"];
			blockTypes.forEach((blockType) => {
				let blockSize = 0;
				if (blockType === "heap") blockSize = process.heap_size;
				else if (blockType === "stack") blockSize = process.stack_size;
				else if (blockType === "code") blockSize = process.memory_usage * 0.2;
				else if (blockType === "data") blockSize = process.memory_usage * 0.15;

				if (blockSize > 0) {
					const block: MemoryBlock = {
						id: `${process.name}-${blockType}`,
						start_address: currentAddress,
						size: blockSize * 1024 * 1024, // Convert to bytes
						type: blockType as any,
						owner: process.name,
						allocated_time: Date.now() - Math.random() * 10000,
						access_count: Math.floor(Math.random() * 1000),
						fragmentation: Math.random() * 0.3,
						protection:
							blockType === "code"
								? "rx"
								: blockType === "stack"
									? "rw"
									: "rwx",
						virtual: true,
						status: "allocated",
					};

					memoryBlocks.push(block);
					process.blocks.push(block);
					currentAddress += block.size;
				}
			});

			processes.set(config.name, process);
		});

		// Create free memory blocks
		const freeBlockCount = 5;
		for (let i = 0; i < freeBlockCount; i++) {
			const freeSize = 32 + Math.random() * 128; // 32-160 MB
			memoryBlocks.push({
				id: `free-${i}`,
				start_address: currentAddress,
				size: freeSize * 1024 * 1024,
				type: "free",
				owner: "system",
				allocated_time: 0,
				access_count: 0,
				fragmentation: 0,
				protection: "read",
				virtual: false,
				status: "free",
			});
			currentAddress += freeSize * 1024 * 1024;
		}

		// Create virtual memory pages
		const pageSize = 4096; // 4KB pages
		const totalPages = Math.floor((totalMemory * 1024 * 1024) / pageSize);

		for (let i = 0; i < Math.min(totalPages, 2000); i++) {
			const processOwner = Array.from(processes.values())[i % processes.size];
			pages.set(i, {
				id: `page-${i}`,
				frame_number: i,
				virtual_address: i * pageSize,
				physical_address: (i + Math.floor(Math.random() * 100)) * pageSize,
				process_id: processOwner.id,
				dirty: Math.random() < 0.3,
				accessed: Math.random() < 0.7,
				present: Math.random() < 0.9,
				swapped: Math.random() < 0.1,
				age: Math.floor(Math.random() * 1000),
				reference_bit: Math.random() < 0.5,
			});
		}

		processesRef.current = processes;
		memoryBlocksRef.current = memoryBlocks;
		pagesRef.current = pages;
	}, [memorySystem, totalMemory]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const resizeCanvas = () => {
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
		};

		const updateMemoryMetrics = () => {
			const processes = processesRef.current;
			const memoryBlocks = memoryBlocksRef.current;
			const pages = pagesRef.current;
			const gcEvents = gcEventsRef.current;
			const operations = operationsRef.current;
			const time = Date.now() / 1000;

			// Update process memory usage
			processes.forEach((process) => {
				// Apply memory pressure effects
				let memoryMultiplier = 1.0;
				if (memoryPressure === "high") {
					memoryMultiplier = 1.3 + 0.2 * Math.sin(time * 0.5);
				} else if (memoryPressure === "low") {
					memoryMultiplier = 0.7 + 0.1 * Math.sin(time * 0.3);
				} else if (memoryPressure === "oom") {
					memoryMultiplier = 1.8 + 0.3 * Math.sin(time * 2);
				}

				// Different processes have different memory patterns
				let baseMemoryChange = 0;
				if (process.name === "chrome") {
					// Browser: tab opening/closing pattern
					baseMemoryChange =
						20 * Math.sin(time * 0.4) + 10 * Math.sin(time * 1.2);
				} else if (process.name === "node") {
					// Node.js: garbage collection cycles
					baseMemoryChange =
						15 * Math.sin(time * 0.8) + (Math.random() < 0.1 ? -30 : 5);
				} else if (process.name === "postgres") {
					// Database: query and cache patterns
					baseMemoryChange =
						8 * Math.sin(time * 0.3) + (Math.random() < 0.05 ? 20 : 0);
				} else {
					// General process memory fluctuation
					baseMemoryChange =
						5 * Math.sin(time * 0.6) + (Math.random() - 0.5) * 10;
				}

				const newMemoryUsage =
					process.memory_usage + baseMemoryChange * memoryMultiplier * speed;
				process.memory_usage = clamp(newMemoryUsage, 32, totalMemory * 0.3);

				// Update derived memory metrics
				process.virtual_size =
					process.memory_usage * (1.2 + Math.random() * 0.5);
				process.resident_size =
					process.memory_usage * (0.7 + Math.random() * 0.2);
				process.heap_size = process.memory_usage * (0.5 + Math.random() * 0.3);
				process.stack_size = Math.max(4, process.memory_usage * 0.05);

				// Update page fault rate
				if (memoryPressure === "high" || memoryPressure === "oom") {
					process.page_faults += Math.floor(Math.random() * 10);
				} else {
					process.page_faults += Math.floor(Math.random() * 2);
				}

				// Update CPU usage (memory pressure affects CPU)
				if (memoryPressure === "oom") {
					process.cpu_usage = Math.min(
						100,
						process.cpu_usage + Math.random() * 20,
					);
				} else {
					process.cpu_usage = clamp(
						process.cpu_usage + (Math.random() - 0.5) * 10,
						0,
						100,
					);
				}

				// Update process status
				if (process.memory_usage > totalMemory * 0.25) {
					process.status = process.name === "kernel" ? "running" : "swapped";
				} else if (process.cpu_usage < 5) {
					process.status = "sleeping";
				} else {
					process.status = "running";
				}
			});

			// Generate memory operations
			if (Math.random() < 0.3 * speed) {
				const processes_array = Array.from(processes.values());
				const process =
					processes_array[Math.floor(Math.random() * processes_array.length)];

				const operationTypes = ["malloc", "free", "realloc", "page_fault"];
				const opType = operationTypes[
					Math.floor(Math.random() * operationTypes.length)
				] as any;

				operations.push({
					id: `op-${Date.now()}-${Math.random()}`,
					type: opType,
					address: 0x100000 + Math.floor(Math.random() * 0x10000000),
					size: 1024 + Math.floor(Math.random() * 1024 * 1024), // 1KB - 1MB
					process_id: process.id,
					timestamp: Date.now(),
					latency: 0.1 + Math.random() * 10, // 0.1-10ms
					success: Math.random() < (memoryPressure === "oom" ? 0.7 : 0.95),
				});
			}

			// Clean up old operations (keep last 50)
			operationsRef.current = operations.slice(-50);

			// Generate garbage collection events
			if (showGC && Math.random() < 0.05 * speed) {
				const gcTypes = ["minor", "major", "full", "concurrent", "incremental"];
				let gcType = gcTypes[Math.floor(Math.random() * gcTypes.length)] as any;

				// Adjust GC frequency based on strategy
				if (gcStrategy === "mark_sweep") {
					gcType = Math.random() < 0.7 ? "major" : "full";
				} else if (gcStrategy === "generational") {
					gcType = Math.random() < 0.8 ? "minor" : "major";
				} else if (gcStrategy === "concurrent") {
					gcType = "concurrent";
				}

				const heapBefore = 400 + Math.random() * 600; // MB
				const collectedBytes = heapBefore * (0.1 + Math.random() * 0.4); // 10-50% collection
				const heapAfter = heapBefore - collectedBytes;

				gcEvents.push({
					id: `gc-${Date.now()}`,
					timestamp: Date.now(),
					type: gcType,
					collected_bytes: collectedBytes * 1024 * 1024, // Convert to bytes
					duration:
						gcType === "full"
							? 50 + Math.random() * 100
							: 5 + Math.random() * 20, // ms
					pause_time:
						gcType === "concurrent"
							? 1 + Math.random() * 3
							: 10 + Math.random() * 40, // ms
					heap_before: heapBefore * 1024 * 1024,
					heap_after: heapAfter * 1024 * 1024,
					generation: gcType === "minor" ? 0 : gcType === "major" ? 1 : 2,
				});
			}

			// Clean up old GC events (keep last 20)
			gcEventsRef.current = gcEvents.slice(-20);

			// Update memory blocks with allocation/deallocation
			if (Math.random() < 0.1 * speed) {
				if (allocationStrategy === "first_fit") {
					// Find first available free block
					const freeBlocks = memoryBlocks.filter(
						(block) => block.status === "free",
					);
					if (freeBlocks.length > 0 && Math.random() < 0.5) {
						const block = freeBlocks[0];
						block.status = "allocated";
						block.type = Math.random() < 0.6 ? "heap" : "data";
						block.owner = Array.from(processes.values())[
							Math.floor(Math.random() * processes.size)
						].name;
						block.allocated_time = Date.now();
					}
				} else if (allocationStrategy === "best_fit") {
					// Find smallest suitable free block
					const freeBlocks = memoryBlocks
						.filter((block) => block.status === "free")
						.sort((a, b) => a.size - b.size);
					if (freeBlocks.length > 0 && Math.random() < 0.5) {
						const block = freeBlocks[0];
						block.status = "allocated";
						block.type = "heap";
						block.owner = Array.from(processes.values())[
							Math.floor(Math.random() * processes.size)
						].name;
						block.allocated_time = Date.now();
					}
				}

				// Occasionally free some blocks
				if (Math.random() < 0.3) {
					const allocatedBlocks = memoryBlocks.filter(
						(block) => block.status === "allocated" && block.type !== "kernel",
					);
					if (allocatedBlocks.length > 0) {
						const block =
							allocatedBlocks[
								Math.floor(Math.random() * allocatedBlocks.length)
							];
						block.status = "free";
						block.owner = "system";
					}
				}
			}

			// Update virtual memory pages
			pages.forEach((page) => {
				// Age the page
				page.age++;

				// Simulate page access
				if (Math.random() < 0.1) {
					page.accessed = true;
					page.reference_bit = true;
					page.age = 0;
				}

				// Simulate page modification
				if (page.accessed && Math.random() < 0.3) {
					page.dirty = true;
				}

				// LRU page replacement simulation
				if (
					memoryPressure === "high" &&
					page.age > 100 &&
					Math.random() < 0.05
				) {
					page.present = false;
					page.swapped = true;
				}

				// Page swap-in
				if (page.swapped && page.accessed && Math.random() < 0.8) {
					page.present = true;
					page.swapped = false;
					page.age = 0;
				}
			});

			// Update fragmentation
			memoryBlocks.forEach((block) => {
				if (block.status === "allocated") {
					block.access_count++;
					block.fragmentation = Math.min(
						0.5,
						block.fragmentation + (Math.random() - 0.5) * 0.01,
					);
				}
			});
		};

		const getBlockColor = (block: MemoryBlock, scheme: any) => {
			switch (block.type) {
				case "heap":
					return scheme.heap;
				case "stack":
					return scheme.stack;
				case "code":
					return scheme.code;
				case "data":
					return scheme.data;
				case "free":
					return scheme.free;
				case "kernel":
					return scheme.kernel;
				case "cache":
					return scheme.data;
				case "buffer":
					return scheme.stack;
				default:
					return scheme.text;
			}
		};

		const drawMemoryMap = (fontSize: number) => {
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];
			const mapWidth = 80;
			const mapHeight = 40;
			const startX = 10 * fontSize;
			const startY = 5 * fontSize;

			// Draw memory map background
			ctx.strokeStyle = scheme.text + "40";
			ctx.lineWidth = 1;
			ctx.strokeRect(startX, startY, mapWidth * fontSize, mapHeight * fontSize);

			// Draw memory blocks
			const totalMemoryBytes = totalMemory * 1024 * 1024;
			const memoryBlocks = memoryBlocksRef.current;

			memoryBlocks.forEach((block) => {
				const blockStart = (block.start_address / totalMemoryBytes) * mapWidth;
				const blockWidth = Math.max(
					1,
					(block.size / totalMemoryBytes) * mapWidth,
				);
				const blockHeight = 2;

				const x = startX + blockStart * fontSize;
				const y =
					startY +
					Math.floor(block.start_address / (totalMemoryBytes / mapHeight)) *
						2 *
						fontSize;

				ctx.fillStyle = getBlockColor(block, scheme);
				ctx.fillRect(x, y, blockWidth * fontSize, blockHeight * fontSize);

				// Show fragmentation
				if (block.fragmentation > 0.1) {
					ctx.fillStyle = scheme.text + "60";
					const fragWidth = blockWidth * block.fragmentation;
					ctx.fillRect(
						x,
						y,
						fragWidth * fontSize,
						(blockHeight * fontSize) / 2,
					);
				}
			});

			// Memory map labels
			ctx.fillStyle = scheme.text;
			ctx.fillText("Memory Map", startX, startY - fontSize);
			ctx.fillText(`0x0`, startX, startY + mapHeight * fontSize + fontSize);
			ctx.fillText(
				`${totalMemory}MB`,
				startX + mapWidth * fontSize - fontSize * 5,
				startY + mapHeight * fontSize + fontSize,
			);
		};

		const drawProcess = (process: MemoryProcess, fontSize: number) => {
			const x = process.x * fontSize;
			const y = process.y * fontSize;
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

			// Process icon
			let processIcon = "🟦";
			if (process.status === "swapped") processIcon = "💤";
			else if (process.status === "sleeping") processIcon = "😴";
			else if (process.name === "kernel") processIcon = "👑";
			else if (process.name === "chrome") processIcon = "🌐";
			else if (process.name === "node") processIcon = "⚙️";
			else if (process.name === "postgres") processIcon = "🗄️";

			ctx.fillStyle =
				process.status === "running"
					? scheme.heap
					: process.status === "swapped"
						? scheme.data
						: scheme.text;
			ctx.fillText(processIcon, x, y);

			// Process info
			ctx.fillStyle = scheme.text;
			ctx.fillText(process.name, x + fontSize, y);
			ctx.fillText(`PID:${process.pid}`, x + fontSize * 8, y);

			// Memory usage
			ctx.fillText(`${process.memory_usage.toFixed(0)}MB`, x, y + fontSize);
			ctx.fillText(
				`V:${process.virtual_size.toFixed(0)}MB`,
				x + fontSize * 6,
				y + fontSize,
			);
			ctx.fillText(
				`R:${process.resident_size.toFixed(0)}MB`,
				x + fontSize * 12,
				y + fontSize,
			);

			// Heap and stack info
			ctx.fillStyle = scheme.heap;
			ctx.fillText(`H:${process.heap_size.toFixed(0)}MB`, x, y + fontSize * 2);
			ctx.fillStyle = scheme.stack;
			ctx.fillText(
				`S:${process.stack_size.toFixed(0)}MB`,
				x + fontSize * 6,
				y + fontSize * 2,
			);

			// Page faults
			ctx.fillStyle = scheme.text;
			ctx.fillText(
				`PF:${process.page_faults}`,
				x + fontSize * 12,
				y + fontSize * 2,
			);

			// Memory usage bar
			const barWidth = 10;
			const usagePercent = process.memory_usage / (totalMemory * 0.3); // Assume max 30% per process
			const filled = Math.floor(usagePercent * barWidth);

			ctx.fillStyle = scheme.text + "40";
			ctx.fillText("█".repeat(barWidth), x, y + fontSize * 3);

			if (filled > 0) {
				ctx.fillStyle =
					usagePercent > 0.8
						? scheme.kernel
						: usagePercent > 0.6
							? scheme.data
							: scheme.heap;
				ctx.fillText(
					"█".repeat(Math.min(filled, barWidth)),
					x,
					y + fontSize * 3,
				);
			}
		};

		const drawGCEvents = (fontSize: number) => {
			if (!showGC) return;

			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];
			const events = gcEventsRef.current;

			ctx.fillStyle = scheme.text;
			ctx.fillText(
				"Garbage Collection Events:",
				10,
				canvas.height - fontSize * 12,
			);

			events.slice(-5).forEach((event, index) => {
				const y = canvas.height - fontSize * (11 - index);
				const age = (Date.now() - event.timestamp) / 1000;

				let eventColor = scheme.heap;
				if (event.type === "major") eventColor = scheme.data;
				else if (event.type === "full") eventColor = scheme.kernel;
				else if (event.type === "concurrent") eventColor = scheme.stack;

				ctx.fillStyle = eventColor;
				const typeIcon =
					event.type === "minor"
						? "🧹"
						: event.type === "major"
							? "🗑️"
							: event.type === "full"
								? "🧽"
								: "⚡";
				ctx.fillText(typeIcon, 10, y);

				ctx.fillStyle = scheme.text;
				ctx.fillText(`${event.type.toUpperCase()}`, 10 + fontSize * 2, y);
				ctx.fillText(
					`${(event.collected_bytes / 1024 / 1024).toFixed(0)}MB`,
					10 + fontSize * 8,
					y,
				);
				ctx.fillText(`${event.duration.toFixed(0)}ms`, 10 + fontSize * 13, y);
				ctx.fillText(`${age.toFixed(0)}s ago`, 10 + fontSize * 18, y);
			});
		};

		const drawMemoryOperations = (fontSize: number) => {
			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];
			const operations = operationsRef.current;

			ctx.fillStyle = scheme.text;
			ctx.fillText(
				"Recent Memory Operations:",
				canvas.width - fontSize * 25,
				canvas.height - fontSize * 8,
			);

			operations.slice(-5).forEach((op, index) => {
				const x = canvas.width - fontSize * 25;
				const y = canvas.height - fontSize * (7 - index);

				let opColor = scheme.text;
				if (op.type === "malloc") opColor = scheme.heap;
				else if (op.type === "free") opColor = scheme.free;
				else if (op.type === "realloc") opColor = scheme.data;
				else if (op.type === "page_fault") opColor = scheme.kernel;

				ctx.fillStyle = opColor;
				const opIcon =
					op.type === "malloc"
						? "➕"
						: op.type === "free"
							? "➖"
							: op.type === "realloc"
								? "🔄"
								: "⚠️";
				ctx.fillText(opIcon, x, y);

				ctx.fillStyle = op.success ? scheme.text : scheme.kernel;
				ctx.fillText(op.type.toUpperCase(), x + fontSize * 2, y);
				ctx.fillText(`${(op.size / 1024).toFixed(0)}KB`, x + fontSize * 8, y);
				ctx.fillText(`${op.latency.toFixed(1)}ms`, x + fontSize * 13, y);
			});
		};

		const drawPageTable = (fontSize: number) => {
			if (!showPages) return;

			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];
			const pages = Array.from(pagesRef.current.values()).slice(0, 100); // Show first 100 pages

			const startX = 60 * fontSize;
			const startY = 5 * fontSize;

			ctx.fillStyle = scheme.text;
			ctx.fillText(
				"Virtual Memory Pages (first 100):",
				startX,
				startY - fontSize,
			);

			pages.forEach((page, index) => {
				const x = startX + (index % 20) * fontSize;
				const y = startY + Math.floor(index / 20) * fontSize;

				let pageColor = scheme.free;
				if (!page.present) pageColor = scheme.kernel;
				else if (page.dirty) pageColor = scheme.data;
				else if (page.accessed) pageColor = scheme.heap;
				else pageColor = scheme.stack;

				ctx.fillStyle = pageColor;
				ctx.fillText(page.present ? "█" : page.swapped ? "░" : "▓", x, y);
			});

			// Page legend
			ctx.fillStyle = scheme.text;
			ctx.fillText("Legend:", startX, startY + fontSize * 6);
			ctx.fillStyle = scheme.heap;
			ctx.fillText("█ Accessed", startX, startY + fontSize * 7);
			ctx.fillStyle = scheme.data;
			ctx.fillText("█ Dirty", startX + fontSize * 10, startY + fontSize * 7);
			ctx.fillStyle = scheme.kernel;
			ctx.fillText("█ Swapped", startX, startY + fontSize * 8);
			ctx.fillStyle = scheme.free;
			ctx.fillText("▓ Free", startX + fontSize * 10, startY + fontSize * 8);
		};

		const animate = () => {
			if (!isPlaying) return;

			const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];
			const fontSize = 8;

			// Clear canvas
			ctx.fillStyle = scheme.bg;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			ctx.font = '8px "Courier New", monospace';
			ctx.textBaseline = "top";

			// Update metrics
			if (Math.random() < 0.1 * speed) {
				updateMemoryMetrics();
			}

			// Draw different views based on display mode
			if (displayMode === "allocation") {
				drawMemoryMap(fontSize);
			}

			if (showProcesses) {
				processesRef.current.forEach((process) => {
					drawProcess(process, fontSize);
				});
			}

			drawGCEvents(fontSize);
			drawMemoryOperations(fontSize);
			drawPageTable(fontSize);

			// Draw statistics
			const processes = Array.from(processesRef.current.values());
			const totalUsed = processes.reduce((sum, p) => sum + p.memory_usage, 0);
			const totalVirtual = processes.reduce(
				(sum, p) => sum + p.virtual_size,
				0,
			);
			const totalPageFaults = processes.reduce(
				(sum, p) => sum + p.page_faults,
				0,
			);
			const swappedProcesses = processes.filter(
				(p) => p.status === "swapped",
			).length;
			const freeMemory = totalMemory - totalUsed;
			const memoryUtilization = (totalUsed / totalMemory) * 100;

			const pages = Array.from(pagesRef.current.values());
			const presentPages = pages.filter((p) => p.present).length;
			const dirtyPages = pages.filter((p) => p.dirty).length;
			const swappedPages = pages.filter((p) => p.swapped).length;

			ctx.fillStyle = scheme.text;
			ctx.fillText(
				`Memory Allocation System - ${memorySystem.toUpperCase()} | Strategy: ${allocationStrategy} | GC: ${gcStrategy}`,
				10,
				canvas.height - 140,
			);
			ctx.fillText(
				`Physical: ${totalUsed.toFixed(0)}MB/${totalMemory}MB (${memoryUtilization.toFixed(1)}%) | Virtual: ${totalVirtual.toFixed(0)}MB`,
				10,
				canvas.height - 125,
			);
			ctx.fillText(
				`Processes: ${processes.length} (${swappedProcesses} swapped) | Page Faults: ${totalPageFaults} | Pressure: ${memoryPressure}`,
				10,
				canvas.height - 110,
			);
			ctx.fillText(
				`Pages: ${presentPages}/${pages.length} resident | ${dirtyPages} dirty | ${swappedPages} swapped`,
				10,
				canvas.height - 95,
			);
			ctx.fillText(
				`Free Memory: ${freeMemory.toFixed(0)}MB | Display: ${displayMode} | Operations: ${operationsRef.current.length}`,
				10,
				canvas.height - 80,
			);

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
		memorySystem,
		allocationStrategy,
		colorScheme,
		showProcesses,
		showGC,
		showPages,
		gcStrategy,
		memoryPressure,
		totalMemory,
	]);

	return (
		<div className="flex flex-col h-screen bg-black">
			<div className="flex-shrink-0 bg-gray-900 p-4 border-b border-gray-700">
				<h1 className="text-2xl font-bold text-purple-400 mb-4">
					🧠 ASCII Memory Allocation Monitor
				</h1>

				<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-sm mb-4">
					<div className="flex flex-col">
						<label className="text-purple-300 mb-2">Animation</label>
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
						<label className="text-purple-300 mb-2">
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
						<label className="text-purple-300 mb-2">Memory System</label>
						<select
							value={memorySystem}
							onChange={(e) => setMemorySystem(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-purple-300 rounded border border-gray-600"
						>
							<option value="virtual">Virtual Memory</option>
							<option value="physical">Physical Memory</option>
							<option value="paged">Paged Memory</option>
							<option value="segmented">Segmented Memory</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-purple-300 mb-2">Display Mode</label>
						<select
							value={displayMode}
							onChange={(e) => setDisplayMode(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-purple-300 rounded border border-gray-600"
						>
							<option value="allocation">Memory Map</option>
							<option value="processes">Process View</option>
							<option value="pages">Page Table</option>
							<option value="gc">GC Analysis</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-purple-300 mb-2">Allocation Strategy</label>
						<select
							value={allocationStrategy}
							onChange={(e) => setAllocationStrategy(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-purple-300 rounded border border-gray-600"
						>
							<option value="first_fit">First Fit</option>
							<option value="best_fit">Best Fit</option>
							<option value="worst_fit">Worst Fit</option>
							<option value="next_fit">Next Fit</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-purple-300 mb-2">GC Strategy</label>
						<select
							value={gcStrategy}
							onChange={(e) => setGCStrategy(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-purple-300 rounded border border-gray-600"
						>
							<option value="generational">Generational</option>
							<option value="mark_sweep">Mark & Sweep</option>
							<option value="concurrent">Concurrent</option>
							<option value="incremental">Incremental</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-purple-300 mb-2">Memory Pressure</label>
						<select
							value={memoryPressure}
							onChange={(e) => setMemoryPressure(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-purple-300 rounded border border-gray-600"
						>
							<option value="low">Low</option>
							<option value="normal">Normal</option>
							<option value="high">High</option>
							<option value="oom">Out of Memory</option>
						</select>
					</div>

					<div className="flex flex-col">
						<label className="text-purple-300 mb-2">Color Scheme</label>
						<select
							value={colorScheme}
							onChange={(e) => setColorScheme(e.target.value)}
							className="px-2 py-1 bg-gray-800 text-purple-300 rounded border border-gray-600"
						>
							<option value="memory">Memory Map</option>
							<option value="address_space">Address Space</option>
							<option value="allocation">Allocation</option>
							<option value="virtual">Virtual Memory</option>
							<option value="gc">Garbage Collection</option>
						</select>
					</div>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
					<div className="flex flex-col">
						<label className="text-purple-300 mb-2">
							Total Memory: {totalMemory}MB
						</label>
						<input
							type="range"
							min="1024"
							max="32768"
							step="1024"
							value={totalMemory}
							onChange={(e) => setTotalMemory(Number.parseInt(e.target.value))}
							className="w-full"
						/>
					</div>

					<label className="flex items-center text-purple-300">
						<input
							type="checkbox"
							checked={showProcesses}
							onChange={(e) => setShowProcesses(e.target.checked)}
							className="mr-2"
						/>
						Show Processes
					</label>
					<label className="flex items-center text-purple-300">
						<input
							type="checkbox"
							checked={showGC}
							onChange={(e) => setShowGC(e.target.checked)}
							className="mr-2"
						/>
						Show Garbage Collection
					</label>
					<label className="flex items-center text-purple-300">
						<input
							type="checkbox"
							checked={showPages}
							onChange={(e) => setShowPages(e.target.checked)}
							className="mr-2"
						/>
						Show Page Table
					</label>
				</div>

				<div className="mt-4 text-purple-400 text-sm">
					<p>
						🧠 <strong>Advanced memory allocation system</strong> with virtual
						memory, garbage collection, and page management!
					</p>
					<p>
						📊 <strong>Multiple allocation strategies</strong> - First Fit, Best
						Fit, Worst Fit with fragmentation analysis!
					</p>
					<p>
						🔄 <strong>Garbage collection monitoring</strong> with generational,
						mark-sweep, and concurrent GC strategies!
					</p>
					<p>
						Monitor heap, stack, code, data segments with real-time memory
						operations and page fault analysis
					</p>
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
