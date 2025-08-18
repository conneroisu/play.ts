import { clamp, lerp } from "play.ts";
import { useEffect, useRef, useState } from "react";

interface CPUCore {
  id: string;
  name: string;
  core_id: number;
  thread_count: number;
  frequency: number;
  utilization: number;
  temperature: number;
  cache_l1: number;
  cache_l2: number;
  cache_l3: number;
  instructions_per_cycle: number;
  pipeline_stages: PipelineStage[];
  x: number;
  y: number;
  status: "idle" | "active" | "overheating" | "throttling" | "parked";
  power_state: "C0" | "C1" | "C2" | "C3" | "C6" | "C8";
  branch_predictor_accuracy: number;
}

interface PipelineStage {
  name: string;
  instruction: string;
  progress: number;
  stalled: boolean;
  type: "fetch" | "decode" | "execute" | "memory" | "writeback";
}

interface MemoryBus {
  id: string;
  type: "DDR4" | "DDR5" | "L3_CACHE" | "L2_CACHE" | "L1_CACHE";
  bandwidth: number;
  utilization: number;
  latency: number;
  transactions: MemoryTransaction[];
}

interface MemoryTransaction {
  id: string;
  from_core: number;
  address: string;
  type: "read" | "write" | "prefetch" | "eviction";
  size: number;
  progress: number;
  priority: number;
}

interface CPUSubsystem {
  name: string;
  type: "ALU" | "FPU" | "SIMD" | "BRANCH" | "LOAD_STORE" | "DECODE";
  utilization: number;
  throughput: number;
  queue_depth: number;
}

export default function AsciiCpuArchitectureExample() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const coresRef = useRef<CPUCore[]>([]);
  const memoryBusRef = useRef<Map<string, MemoryBus>>(new Map());
  const subsystemsRef = useRef<Map<string, CPUSubsystem>>(new Map());
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [displayMode, setDisplayMode] = useState("utilization");
  const [architectureType, setArchitectureType] = useState("x86_64");
  const [workloadType, setWorkloadType] = useState("mixed");
  const [colorScheme, setColorScheme] = useState("intel");
  const [showPipeline, setShowPipeline] = useState(true);
  const [showMemoryBus, setShowMemoryBus] = useState(true);
  const [showSubsystems, setShowSubsystems] = useState(false);
  const [thermalState, setThermalState] = useState("normal");
  const [powerManagement, setPowerManagement] = useState("balanced");

  const colorSchemes = {
    intel: {
      bg: "#001144",
      core: "#0066CC",
      active: "#00AAFF",
      hot: "#FF6600",
      critical: "#FF0000",
      text: "#FFFFFF",
      cache: "#8888CC",
    },
    amd: {
      bg: "#220000",
      core: "#CC0000",
      active: "#FF4444",
      hot: "#FF8800",
      critical: "#FF0000",
      text: "#FFFFFF",
      cache: "#CC8888",
    },
    arm: {
      bg: "#002200",
      core: "#00CC00",
      active: "#44FF44",
      hot: "#FFAA00",
      critical: "#FF4444",
      text: "#FFFFFF",
      cache: "#88CC88",
    },
    risc: {
      bg: "#220022",
      core: "#CC00CC",
      active: "#FF44FF",
      hot: "#FFAA00",
      critical: "#FF4444",
      text: "#FFFFFF",
      cache: "#CC88CC",
    },
    thermal: {
      bg: "#000000",
      core: "#0000FF",
      active: "#00FF00",
      hot: "#FFFF00",
      critical: "#FF0000",
      text: "#FFFFFF",
      cache: "#888888",
    },
  };

  useEffect(() => {
    // Initialize CPU architecture based on type
    const cores: CPUCore[] = [];
    const memoryBus = new Map<string, MemoryBus>();
    const subsystems = new Map<string, CPUSubsystem>();

    // Configure architecture
    let coreCount = 8;
    let threadsPerCore = 2;
    let baseFreq = 3.2;

    if (architectureType === "x86_64") {
      coreCount = 8;
      threadsPerCore = 2;
      baseFreq = 3.2;
    } else if (architectureType === "amd_zen") {
      coreCount = 16;
      threadsPerCore = 2;
      baseFreq = 3.8;
    } else if (architectureType === "arm_big_little") {
      coreCount = 8;
      threadsPerCore = 1;
      baseFreq = 2.8;
    } else if (architectureType === "risc_v") {
      coreCount = 4;
      threadsPerCore = 1;
      baseFreq = 2.0;
    }

    // Create CPU cores
    for (let i = 0; i < coreCount; i++) {
      const core: CPUCore = {
        id: `core-${i}`,
        name: `Core ${i}`,
        core_id: i,
        thread_count: threadsPerCore,
        frequency: baseFreq + (Math.random() - 0.5) * 0.4,
        utilization: Math.random() * 30,
        temperature: 35 + Math.random() * 15,
        cache_l1: 32, // KB
        cache_l2: 256, // KB
        cache_l3: 4096 / coreCount, // KB shared
        instructions_per_cycle: 2 + Math.random(),
        pipeline_stages: [
          {
            name: "FETCH",
            instruction: "MOV",
            progress: Math.random(),
            stalled: false,
            type: "fetch",
          },
          {
            name: "DECODE",
            instruction: "ADD",
            progress: Math.random(),
            stalled: false,
            type: "decode",
          },
          {
            name: "EXECUTE",
            instruction: "MUL",
            progress: Math.random(),
            stalled: false,
            type: "execute",
          },
          {
            name: "MEMORY",
            instruction: "LOAD",
            progress: Math.random(),
            stalled: false,
            type: "memory",
          },
          {
            name: "WRITEBACK",
            instruction: "STORE",
            progress: Math.random(),
            stalled: false,
            type: "writeback",
          },
        ],
        x: 10 + (i % 4) * 20,
        y: 5 + Math.floor(i / 4) * 12,
        status: "idle",
        power_state: "C0",
        branch_predictor_accuracy: 90 + Math.random() * 10,
      };
      cores.push(core);
    }

    // Create memory buses
    memoryBus.set("l1_data", {
      id: "l1_data",
      type: "L1_CACHE",
      bandwidth: 1000, // GB/s
      utilization: 0,
      latency: 1, // cycles
      transactions: [],
    });

    memoryBus.set("l2_unified", {
      id: "l2_unified",
      type: "L2_CACHE",
      bandwidth: 500,
      utilization: 0,
      latency: 8,
      transactions: [],
    });

    memoryBus.set("l3_shared", {
      id: "l3_shared",
      type: "L3_CACHE",
      bandwidth: 200,
      utilization: 0,
      latency: 20,
      transactions: [],
    });

    memoryBus.set("ddr_main", {
      id: "ddr_main",
      type: "DDR5",
      bandwidth: 100,
      utilization: 0,
      latency: 80,
      transactions: [],
    });

    // Create CPU subsystems
    subsystems.set("alu_integer", {
      name: "Integer ALU",
      type: "ALU",
      utilization: 0,
      throughput: 4, // ops per cycle
      queue_depth: 0,
    });

    subsystems.set("fpu_float", {
      name: "Floating Point",
      type: "FPU",
      utilization: 0,
      throughput: 2,
      queue_depth: 0,
    });

    subsystems.set("simd_vector", {
      name: "SIMD Vector",
      type: "SIMD",
      utilization: 0,
      throughput: 1,
      queue_depth: 0,
    });

    subsystems.set("branch_pred", {
      name: "Branch Predictor",
      type: "BRANCH",
      utilization: 0,
      throughput: 8,
      queue_depth: 0,
    });

    subsystems.set("load_store", {
      name: "Load/Store Unit",
      type: "LOAD_STORE",
      utilization: 0,
      throughput: 2,
      queue_depth: 0,
    });

    coresRef.current = cores;
    memoryBusRef.current = memoryBus;
    subsystemsRef.current = subsystems;
  }, [architectureType]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    const updateCPUMetrics = () => {
      const cores = coresRef.current;
      const memoryBus = memoryBusRef.current;
      const subsystems = subsystemsRef.current;
      const time = Date.now() / 1000;

      cores.forEach((core) => {
        // Apply workload patterns
        let baseUtilization = core.utilization;

        if (workloadType === "cpu_intensive") {
          baseUtilization =
            70 + 25 * Math.sin(time * 0.5 + core.core_id) + Math.random() * 10;
        } else if (workloadType === "memory_bound") {
          baseUtilization = 30 + 20 * Math.sin(time * 0.8) + Math.random() * 15;
          // Generate more memory transactions
          if (Math.random() < 0.3 && showMemoryBus) {
            memoryBus.get("l1_data")?.transactions.push({
              id: `tx-${core.core_id}-${Date.now()}`,
              from_core: core.core_id,
              address: `0x${Math.floor(Math.random() * 0xffff)
                .toString(16)
                .padStart(4, "0")}`,
              type: Math.random() < 0.7 ? "read" : "write",
              size: 64,
              progress: 0,
              priority: Math.floor(Math.random() * 4),
            });
          }
        } else if (workloadType === "floating_point") {
          baseUtilization = 50 + 40 * Math.sin(time * 1.2) + Math.random() * 10;
          subsystems.get("fpu_float")!.utilization = Math.min(
            100,
            baseUtilization + 20,
          );
        } else if (workloadType === "vector_simd") {
          baseUtilization = 40 + 30 * Math.sin(time * 0.9) + Math.random() * 15;
          subsystems.get("simd_vector")!.utilization = Math.min(
            100,
            baseUtilization + 30,
          );
        } else if (workloadType === "branch_heavy") {
          baseUtilization = 60 + 20 * Math.sin(time * 2.0) + Math.random() * 20;
          core.branch_predictor_accuracy = 85 + 10 * Math.sin(time * 0.3);
        } else {
          // Mixed workload
          baseUtilization =
            30 +
            30 * Math.sin(time * 0.4 + core.core_id * 0.5) +
            Math.random() * 20;
        }

        // Apply power management
        if (powerManagement === "performance") {
          core.frequency = Math.min(5.0, core.frequency * 1.1);
        } else if (powerManagement === "powersave") {
          core.frequency = Math.max(1.0, core.frequency * 0.9);
          baseUtilization *= 0.7;
        } else if (powerManagement === "ondemand") {
          if (baseUtilization > 70) {
            core.frequency = Math.min(4.5, core.frequency + 0.1);
          } else if (baseUtilization < 30) {
            core.frequency = Math.max(1.5, core.frequency - 0.05);
          }
        }

        core.utilization = clamp(baseUtilization, 0, 100);

        // Temperature calculation
        const thermalMultiplier =
          thermalState === "hot"
            ? 1.5
            : thermalState === "overheating"
              ? 2.0
              : 1.0;
        const baseTemp = 35;
        const tempFromLoad = (core.utilization / 100) * 40 * thermalMultiplier;
        const tempFromFreq = (core.frequency / 4.0) * 15;

        core.temperature = clamp(
          baseTemp + tempFromLoad + tempFromFreq + (Math.random() - 0.5) * 3,
          25,
          105,
        );

        // Status updates
        if (core.temperature > 95) {
          core.status = "overheating";
          core.power_state = "C6";
          core.utilization *= 0.5; // Thermal throttling
        } else if (core.temperature > 85) {
          core.status = "throttling";
          core.utilization *= 0.8;
        } else if (core.utilization > 10) {
          core.status = "active";
          core.power_state = "C0";
        } else {
          core.status = "idle";
          core.power_state = Math.random() < 0.3 ? "C1" : "C0";
        }

        // Update pipeline stages
        if (showPipeline) {
          core.pipeline_stages.forEach((stage, index) => {
            if (core.status === "active") {
              stage.progress += (0.1 + Math.random() * 0.1) * speed;
              if (stage.progress >= 1) {
                stage.progress = 0;
                // Simulate instruction rotation
                const instructions = [
                  "MOV",
                  "ADD",
                  "SUB",
                  "MUL",
                  "DIV",
                  "LOAD",
                  "STORE",
                  "JMP",
                  "CALL",
                  "RET",
                ];
                stage.instruction =
                  instructions[Math.floor(Math.random() * instructions.length)];
              }

              // Simulate pipeline stalls
              stage.stalled = Math.random() < 0.05 && stage.type === "memory";
            } else {
              stage.progress = 0;
              stage.stalled = false;
            }
          });
        }

        // Update instructions per cycle based on efficiency
        core.instructions_per_cycle = clamp(
          2 +
            core.branch_predictor_accuracy / 100 +
            (Math.random() - 0.5) * 0.5,
          0.5,
          4.0,
        );
      });

      // Update memory bus utilization
      memoryBus.forEach((bus) => {
        // Update existing transactions
        bus.transactions = bus.transactions.filter((tx) => {
          tx.progress += 0.1 * speed;
          return tx.progress < 1;
        });

        // Calculate utilization
        bus.utilization = Math.min(100, (bus.transactions.length / 10) * 100);

        // Generate new transactions based on core activity
        if (Math.random() < 0.1 * speed && showMemoryBus) {
          const activeCores = cores.filter((c) => c.status === "active");
          if (activeCores.length > 0) {
            const core =
              activeCores[Math.floor(Math.random() * activeCores.length)];
            bus.transactions.push({
              id: `tx-${bus.id}-${Date.now()}`,
              from_core: core.core_id,
              address: `0x${Math.floor(Math.random() * 0xffffff)
                .toString(16)
                .padStart(6, "0")}`,
              type:
                Math.random() < 0.6
                  ? "read"
                  : Math.random() < 0.8
                    ? "write"
                    : "prefetch",
              size: 64 * (1 + Math.floor(Math.random() * 4)),
              progress: 0,
              priority: Math.floor(Math.random() * 4),
            });
          }
        }
      });

      // Update subsystem utilization
      subsystems.forEach((subsystem) => {
        const activeCores = cores.filter((c) => c.status === "active");
        const avgUtilization =
          activeCores.reduce((sum, c) => sum + c.utilization, 0) /
          Math.max(1, activeCores.length);

        if (subsystem.type === "ALU") {
          subsystem.utilization = avgUtilization * 0.8;
        } else if (subsystem.type === "FPU") {
          subsystem.utilization =
            workloadType === "floating_point"
              ? avgUtilization
              : avgUtilization * 0.3;
        } else if (subsystem.type === "SIMD") {
          subsystem.utilization =
            workloadType === "vector_simd"
              ? avgUtilization
              : avgUtilization * 0.2;
        } else if (subsystem.type === "BRANCH") {
          subsystem.utilization =
            workloadType === "branch_heavy"
              ? avgUtilization
              : avgUtilization * 0.4;
        } else if (subsystem.type === "LOAD_STORE") {
          subsystem.utilization =
            workloadType === "memory_bound"
              ? avgUtilization * 1.2
              : avgUtilization * 0.6;
        }

        subsystem.utilization = clamp(subsystem.utilization, 0, 100);
        subsystem.queue_depth = Math.floor(subsystem.utilization / 25);
      });
    };

    const getCoreStatusColor = (core: CPUCore, scheme: any) => {
      if (core.status === "overheating") return scheme.critical;
      if (core.status === "throttling") return scheme.hot;
      if (core.status === "active") return scheme.active;
      return scheme.core;
    };

    const drawCore = (core: CPUCore, fontSize: number) => {
      const x = core.x * fontSize;
      const y = core.y * fontSize;
      const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

      // Core box
      ctx.fillStyle = getCoreStatusColor(core, scheme);
      const coreArt = [
        "┌─────────┐",
        "│ ███████ │",
        "│ ███ ███ │",
        "│ ███ ███ │",
        "└─────────┘",
      ];

      coreArt.forEach((line, i) => {
        ctx.fillText(line, x, y + i * fontSize);
      });

      // Core label
      ctx.fillStyle = scheme.text;
      ctx.fillText(core.name, x + fontSize, y - fontSize);

      // Frequency and threads
      ctx.fillText(
        `${core.frequency.toFixed(1)}GHz`,
        x + fontSize * 12,
        y - fontSize,
      );
      ctx.fillText(`${core.thread_count}T`, x + fontSize * 18, y - fontSize);

      // Power state
      ctx.fillStyle = core.power_state === "C0" ? scheme.active : scheme.core;
      ctx.fillText(core.power_state, x - fontSize * 2, y);

      // Metric display
      let value = 0;
      let unit = "%";
      let label = "";

      switch (displayMode) {
        case "utilization":
          value = core.utilization;
          label = "CPU";
          break;
        case "temperature":
          value = core.temperature;
          unit = "°C";
          label = "TMP";
          break;
        case "frequency":
          value = core.frequency;
          unit = "GHz";
          label = "FREQ";
          break;
        case "ipc":
          value = core.instructions_per_cycle;
          unit = "IPC";
          label = "PERF";
          break;
      }

      // Metric bar
      const barWidth = 8;
      const maxValue =
        displayMode === "temperature"
          ? 100
          : displayMode === "frequency"
            ? 5
            : displayMode === "ipc"
              ? 4
              : 100;
      const percentage = value / maxValue;
      const filled = Math.floor(percentage * barWidth);

      ctx.fillStyle = scheme.text + "40";
      ctx.fillText("█".repeat(barWidth), x + fontSize, y + fontSize * 5.5);

      if (filled > 0) {
        let barColor = scheme.core;
        if (displayMode === "temperature") {
          barColor =
            value > 85
              ? scheme.critical
              : value > 70
                ? scheme.hot
                : scheme.active;
        } else {
          barColor =
            percentage > 0.9
              ? scheme.critical
              : percentage > 0.7
                ? scheme.hot
                : scheme.active;
        }

        ctx.fillStyle = barColor;
        ctx.fillText("█".repeat(filled), x + fontSize, y + fontSize * 5.5);
      }

      ctx.fillStyle = scheme.text;
      ctx.fillText(
        `${label}: ${value.toFixed(displayMode === "ipc" ? 1 : 0)}${unit}`,
        x + fontSize * 10,
        y + fontSize * 5.5,
      );

      // Pipeline visualization
      if (showPipeline) {
        core.pipeline_stages.forEach((stage, i) => {
          const stageY = y + fontSize * (1 + i * 0.7);
          const stageX = x + fontSize * 12;

          ctx.fillStyle = stage.stalled
            ? scheme.critical
            : stage.progress > 0.5
              ? scheme.active
              : scheme.core;

          // Stage name
          ctx.fillText(stage.name.substr(0, 3), stageX, stageY);

          // Instruction
          ctx.fillText(stage.instruction, stageX + fontSize * 4, stageY);

          // Progress bar
          const progressWidth = 6;
          const progressFilled = Math.floor(stage.progress * progressWidth);
          ctx.fillStyle = scheme.text + "40";
          ctx.fillText(
            "─".repeat(progressWidth),
            stageX + fontSize * 8,
            stageY,
          );

          if (progressFilled > 0 && !stage.stalled) {
            ctx.fillStyle = scheme.active;
            ctx.fillText(
              "█".repeat(progressFilled),
              stageX + fontSize * 8,
              stageY,
            );
          }
        });
      }

      // Cache info
      ctx.fillStyle = scheme.cache;
      ctx.fillText(`L1:${core.cache_l1}K`, x, y + fontSize * 6.5);
      ctx.fillText(
        `L2:${core.cache_l2}K`,
        x + fontSize * 6,
        y + fontSize * 6.5,
      );
    };

    const drawMemoryBus = (fontSize: number) => {
      if (!showMemoryBus) return;

      const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];
      const buses = Array.from(memoryBusRef.current.values());

      buses.forEach((bus, index) => {
        const x = 10 * fontSize;
        const y = (35 + index * 3) * fontSize;

        // Bus label
        ctx.fillStyle = scheme.text;
        ctx.fillText(`${bus.type} Bus`, x, y);
        ctx.fillText(`${bus.bandwidth}GB/s`, x + fontSize * 10, y);
        ctx.fillText(`${bus.latency}cy`, x + fontSize * 16, y);

        // Utilization bar
        const barWidth = 12;
        const filled = Math.floor((bus.utilization / 100) * barWidth);

        ctx.fillStyle = scheme.text + "40";
        ctx.fillText("█".repeat(barWidth), x, y + fontSize);

        if (filled > 0) {
          ctx.fillStyle =
            bus.utilization > 80
              ? scheme.critical
              : bus.utilization > 60
                ? scheme.hot
                : scheme.active;
          ctx.fillText("█".repeat(filled), x, y + fontSize);
        }

        ctx.fillStyle = scheme.text;
        ctx.fillText(
          `${bus.utilization.toFixed(0)}%`,
          x + fontSize * 13,
          y + fontSize,
        );

        // Transaction count
        ctx.fillText(
          `${bus.transactions.length} tx`,
          x + fontSize * 18,
          y + fontSize,
        );
      });
    };

    const drawSubsystems = (fontSize: number) => {
      if (!showSubsystems) return;

      const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];
      const subsystems = Array.from(subsystemsRef.current.values());

      subsystems.forEach((subsystem, index) => {
        const x = 50 * fontSize;
        const y = (5 + index * 4) * fontSize;

        ctx.fillStyle = scheme.text;
        ctx.fillText(subsystem.name, x, y);
        ctx.fillText(`${subsystem.throughput} ops/cy`, x + fontSize * 12, y);

        // Utilization bar
        const barWidth = 10;
        const filled = Math.floor((subsystem.utilization / 100) * barWidth);

        ctx.fillStyle = scheme.text + "40";
        ctx.fillText("█".repeat(barWidth), x, y + fontSize);

        if (filled > 0) {
          ctx.fillStyle =
            subsystem.utilization > 80
              ? scheme.critical
              : subsystem.utilization > 60
                ? scheme.hot
                : scheme.active;
          ctx.fillText("█".repeat(filled), x, y + fontSize);
        }

        ctx.fillStyle = scheme.text;
        ctx.fillText(
          `${subsystem.utilization.toFixed(0)}%`,
          x + fontSize * 11,
          y + fontSize,
        );

        // Queue depth
        if (subsystem.queue_depth > 0) {
          ctx.fillStyle = scheme.hot;
          ctx.fillText(`Q:${subsystem.queue_depth}`, x, y + fontSize * 2);
        }
      });
    };

    const animate = () => {
      if (!isPlaying) return;

      const scheme = colorSchemes[colorScheme as keyof typeof colorSchemes];
      const fontSize = 10;

      // Clear canvas
      ctx.fillStyle = scheme.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = '10px "Courier New", monospace';
      ctx.textBaseline = "top";

      // Update metrics
      if (Math.random() < 0.1 * speed) {
        updateCPUMetrics();
      }

      // Draw CPU cores
      coresRef.current.forEach((core) => {
        drawCore(core, fontSize);
      });

      // Draw memory subsystem
      drawMemoryBus(fontSize);

      // Draw execution subsystems
      drawSubsystems(fontSize);

      // Draw statistics
      const cores = coresRef.current;
      const activeCores = cores.filter((c) => c.status === "active").length;
      const overheatingCores = cores.filter(
        (c) => c.status === "overheating",
      ).length;
      const avgUtilization =
        cores.reduce((sum, c) => sum + c.utilization, 0) / cores.length;
      const avgTemperature =
        cores.reduce((sum, c) => sum + c.temperature, 0) / cores.length;
      const avgFrequency =
        cores.reduce((sum, c) => sum + c.frequency, 0) / cores.length;
      const avgIPC =
        cores.reduce((sum, c) => sum + c.instructions_per_cycle, 0) /
        cores.length;

      ctx.fillStyle = scheme.text;
      ctx.fillText(
        `CPU Architecture: ${architectureType.toUpperCase()} | Workload: ${workloadType}`,
        10,
        canvas.height - 120,
      );
      ctx.fillText(
        `Cores: ${activeCores}/${cores.length} active | ${overheatingCores} overheating | Thermal: ${thermalState}`,
        10,
        canvas.height - 105,
      );
      ctx.fillText(
        `Average: ${avgUtilization.toFixed(1)}% utilization | ${avgTemperature.toFixed(0)}°C | ${avgFrequency.toFixed(1)}GHz`,
        10,
        canvas.height - 90,
      );
      ctx.fillText(
        `Performance: ${avgIPC.toFixed(2)} IPC | Power: ${powerManagement} | Display: ${displayMode}`,
        10,
        canvas.height - 75,
      );

      const memoryTransactions = Array.from(
        memoryBusRef.current.values(),
      ).reduce((sum, bus) => sum + bus.transactions.length, 0);
      ctx.fillText(
        `Memory: ${memoryTransactions} active transactions | Pipeline: ${showPipeline ? "visible" : "hidden"}`,
        10,
        canvas.height - 60,
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
    architectureType,
    workloadType,
    colorScheme,
    showPipeline,
    showMemoryBus,
    showSubsystems,
    thermalState,
    powerManagement,
  ]);

  return (
    <div className="flex flex-col h-screen bg-black">
      <div className="flex-shrink-0 bg-gray-900 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-blue-400">
            🔬 ASCII CPU Architecture Monitor
          </h1>
          <a
            href="/examples/visual"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to Visual Examples
          </a>
        </div>

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
            <label className="text-blue-300 mb-2">Architecture</label>
            <select
              value={architectureType}
              onChange={(e) => setArchitectureType(e.target.value)}
              className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
            >
              <option value="x86_64">x86-64 Intel</option>
              <option value="amd_zen">AMD Zen</option>
              <option value="arm_big_little">ARM Big.LITTLE</option>
              <option value="risc_v">RISC-V</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-blue-300 mb-2">Display Metric</label>
            <select
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value)}
              className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
            >
              <option value="utilization">CPU Utilization</option>
              <option value="temperature">Temperature</option>
              <option value="frequency">Frequency</option>
              <option value="ipc">Instructions/Cycle</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-blue-300 mb-2">Workload Type</label>
            <select
              value={workloadType}
              onChange={(e) => setWorkloadType(e.target.value)}
              className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
            >
              <option value="mixed">Mixed Workload</option>
              <option value="cpu_intensive">CPU Intensive</option>
              <option value="memory_bound">Memory Bound</option>
              <option value="floating_point">Floating Point</option>
              <option value="vector_simd">Vector/SIMD</option>
              <option value="branch_heavy">Branch Heavy</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-blue-300 mb-2">Color Scheme</label>
            <select
              value={colorScheme}
              onChange={(e) => setColorScheme(e.target.value)}
              className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
            >
              <option value="intel">Intel Blue</option>
              <option value="amd">AMD Red</option>
              <option value="arm">ARM Green</option>
              <option value="risc">RISC Purple</option>
              <option value="thermal">Thermal View</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-blue-300 mb-2">Thermal State</label>
            <select
              value={thermalState}
              onChange={(e) => setThermalState(e.target.value)}
              className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
            >
              <option value="normal">Normal</option>
              <option value="hot">Hot Environment</option>
              <option value="overheating">Overheating</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-blue-300 mb-2">Power Management</label>
            <select
              value={powerManagement}
              onChange={(e) => setPowerManagement(e.target.value)}
              className="px-2 py-1 bg-gray-800 text-blue-300 rounded border border-gray-600"
            >
              <option value="balanced">Balanced</option>
              <option value="performance">Performance</option>
              <option value="powersave">Power Save</option>
              <option value="ondemand">On Demand</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm mb-4">
          <label className="flex items-center text-blue-300">
            <input
              type="checkbox"
              checked={showPipeline}
              onChange={(e) => setShowPipeline(e.target.checked)}
              className="mr-2"
            />
            Show Pipeline Stages
          </label>
          <label className="flex items-center text-blue-300">
            <input
              type="checkbox"
              checked={showMemoryBus}
              onChange={(e) => setShowMemoryBus(e.target.checked)}
              className="mr-2"
            />
            Show Memory Subsystem
          </label>
          <label className="flex items-center text-blue-300">
            <input
              type="checkbox"
              checked={showSubsystems}
              onChange={(e) => setShowSubsystems(e.target.checked)}
              className="mr-2"
            />
            Show Execution Units
          </label>
        </div>

        <div className="mt-4 text-blue-400 text-sm">
          <p>
            🔬 <strong>Deep CPU architecture visualization</strong> with
            real-time pipeline stages and memory subsystem!
          </p>
          <p>
            ⚡ <strong>Multiple architectures</strong> - Intel x86-64, AMD Zen,
            ARM Big.LITTLE, and RISC-V!
          </p>
          <p>
            🌡️ <strong>Thermal and power management</strong> with frequency
            scaling, thermal throttling, and power states!
          </p>
          <p>
            Monitor instruction pipelines, cache hierarchies, execution units,
            and memory bus utilization in real-time
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
