import {
  clamp,
  hsl,
  randomFloat,
  toCssHsl,
  vec2,
  vec2Add,
  vec2Angle,
  vec2Distance,
  vec2Div,
  vec2Length,
  vec2Mul,
  vec2Normalize,
  vec2Sub,
} from "play.ts";
import { useEffect, useRef, useState } from "react";

interface Boid {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  acceleration: { x: number; y: number };
  maxSpeed: number;
  maxForce: number;
  size: number;
  color: { h: number; s: number; l: number };
  trail: Array<{ x: number; y: number; alpha: number }>;
}

interface FlockingSettings {
  separationRadius: number;
  alignmentRadius: number;
  cohesionRadius: number;
  separationWeight: number;
  alignmentWeight: number;
  cohesionWeight: number;
  maxSpeed: number;
  maxForce: number;
  edgeBehavior: "wrap" | "bounce" | "avoid";
}

export default function FlockingExample() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const boidsRef = useRef<Boid[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, pressed: false });

  const [isRunning, setIsRunning] = useState(false);
  const [boidCount, setBoidCount] = useState(50);
  const [showDebug, setShowDebug] = useState(false);
  const [showTrails, setShowTrails] = useState(true);
  const [predatorMode, setPredatorMode] = useState(false);
  const [settings, setSettings] = useState<FlockingSettings>({
    separationRadius: 25,
    alignmentRadius: 50,
    cohesionRadius: 50,
    separationWeight: 1.5,
    alignmentWeight: 1.0,
    cohesionWeight: 1.0,
    maxSpeed: 2,
    maxForce: 0.03,
    edgeBehavior: "wrap",
  });

  const createBoid = (x?: number, y?: number): Boid => {
    const canvas = canvasRef.current;
    if (!canvas) return createDefaultBoid();

    return {
      position: {
        x: x ?? randomFloat(0, canvas.width),
        y: y ?? randomFloat(0, canvas.height),
      },
      velocity: {
        x: randomFloat(-1, 1),
        y: randomFloat(-1, 1),
      },
      acceleration: { x: 0, y: 0 },
      maxSpeed: settings.maxSpeed,
      maxForce: settings.maxForce,
      size: randomFloat(4, 8),
      color: hsl(randomFloat(180, 240), 70, 60), // Blue-ish colors
      trail: [],
    };
  };

  const createDefaultBoid = (): Boid => ({
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    maxSpeed: 2,
    maxForce: 0.03,
    size: 6,
    color: hsl(200, 70, 60),
    trail: [],
  });

  const initializeBoids = () => {
    const boids: Boid[] = [];
    for (let i = 0; i < boidCount; i++) {
      boids.push(createBoid());
    }
    boidsRef.current = boids;
  };

  const getNeighbors = (boid: Boid, radius: number): Boid[] => {
    return boidsRef.current.filter((other) => {
      if (other === boid) return false;
      const distance = vec2Distance(boid.position, other.position);
      return distance < radius;
    });
  };

  const separate = (boid: Boid): { x: number; y: number } => {
    const neighbors = getNeighbors(boid, settings.separationRadius);
    if (neighbors.length === 0) return { x: 0, y: 0 };

    let steer = { x: 0, y: 0 };

    neighbors.forEach((neighbor) => {
      const diff = vec2Sub(boid.position, neighbor.position);
      const distance = vec2Length(diff);
      if (distance > 0) {
        const normalized = vec2Normalize(diff);
        const weighted = vec2Div(normalized, distance); // Weight by distance
        steer = vec2Add(steer, weighted);
      }
    });

    if (vec2Length(steer) > 0) {
      steer = vec2Normalize(steer);
      steer = vec2Mul(steer, boid.maxSpeed);
      steer = vec2Sub(steer, boid.velocity);
      steer = vec2Mul(steer, Math.min(vec2Length(steer), boid.maxForce));
    }

    return steer;
  };

  const align = (boid: Boid): { x: number; y: number } => {
    const neighbors = getNeighbors(boid, settings.alignmentRadius);
    if (neighbors.length === 0) return { x: 0, y: 0 };

    let averageVelocity = { x: 0, y: 0 };
    neighbors.forEach((neighbor) => {
      averageVelocity = vec2Add(averageVelocity, neighbor.velocity);
    });
    averageVelocity = vec2Div(averageVelocity, neighbors.length);

    let steer = vec2Normalize(averageVelocity);
    steer = vec2Mul(steer, boid.maxSpeed);
    steer = vec2Sub(steer, boid.velocity);
    steer = vec2Mul(steer, Math.min(vec2Length(steer), boid.maxForce));

    return steer;
  };

  const cohesion = (boid: Boid): { x: number; y: number } => {
    const neighbors = getNeighbors(boid, settings.cohesionRadius);
    if (neighbors.length === 0) return { x: 0, y: 0 };

    let centerOfMass = { x: 0, y: 0 };
    neighbors.forEach((neighbor) => {
      centerOfMass = vec2Add(centerOfMass, neighbor.position);
    });
    centerOfMass = vec2Div(centerOfMass, neighbors.length);

    return seek(boid, centerOfMass);
  };

  const seek = (
    boid: Boid,
    target: { x: number; y: number },
  ): { x: number; y: number } => {
    let desired = vec2Sub(target, boid.position);
    desired = vec2Normalize(desired);
    desired = vec2Mul(desired, boid.maxSpeed);

    let steer = vec2Sub(desired, boid.velocity);
    steer = vec2Mul(steer, Math.min(vec2Length(steer), boid.maxForce));
    return steer;
  };

  const flee = (
    boid: Boid,
    target: { x: number; y: number },
  ): { x: number; y: number } => {
    let desired = vec2Sub(boid.position, target);
    const distance = vec2Length(desired);

    if (distance < 100) {
      // Only flee if close enough
      desired = vec2Normalize(desired);
      desired = vec2Mul(desired, boid.maxSpeed);

      let steer = vec2Sub(desired, boid.velocity);
      steer = vec2Mul(steer, Math.min(vec2Length(steer), boid.maxForce * 2)); // Stronger flee force
      return steer;
    }

    return { x: 0, y: 0 };
  };

  const avoidEdges = (boid: Boid): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const margin = 50;
    let steer = { x: 0, y: 0 };

    if (boid.position.x < margin) {
      steer.x = boid.maxSpeed;
    } else if (boid.position.x > canvas.width - margin) {
      steer.x = -boid.maxSpeed;
    }

    if (boid.position.y < margin) {
      steer.y = boid.maxSpeed;
    } else if (boid.position.y > canvas.height - margin) {
      steer.y = -boid.maxSpeed;
    }

    if (vec2Length(steer) > 0) {
      steer = vec2Normalize(steer);
      steer = vec2Mul(steer, boid.maxSpeed);
      steer = vec2Sub(steer, boid.velocity);
      steer = vec2Mul(steer, Math.min(vec2Length(steer), boid.maxForce));
    }

    return steer;
  };

  const updateBoid = (boid: Boid) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Reset acceleration
    boid.acceleration = { x: 0, y: 0 };

    // Apply flocking forces
    const separation = separate(boid);
    const alignment = align(boid);
    const cohesionForce = cohesion(boid);

    // Weight the forces
    boid.acceleration = vec2Add(
      boid.acceleration,
      vec2Mul(separation, settings.separationWeight),
    );
    boid.acceleration = vec2Add(
      boid.acceleration,
      vec2Mul(alignment, settings.alignmentWeight),
    );
    boid.acceleration = vec2Add(
      boid.acceleration,
      vec2Mul(cohesionForce, settings.cohesionWeight),
    );

    // Mouse interaction
    if (mouseRef.current.pressed) {
      const mouseForce = predatorMode
        ? flee(boid, mouseRef.current)
        : seek(boid, mouseRef.current);
      boid.acceleration = vec2Add(boid.acceleration, vec2Mul(mouseForce, 2));
    }

    // Edge behavior
    if (settings.edgeBehavior === "avoid") {
      const edgeForce = avoidEdges(boid);
      boid.acceleration = vec2Add(boid.acceleration, vec2Mul(edgeForce, 2));
    }

    // Update velocity and position
    boid.velocity = vec2Add(boid.velocity, boid.acceleration);

    // Limit speed
    const speed = vec2Length(boid.velocity);
    if (speed > boid.maxSpeed) {
      boid.velocity = vec2Mul(vec2Normalize(boid.velocity), boid.maxSpeed);
    }

    boid.position = vec2Add(boid.position, boid.velocity);

    // Handle edge wrapping/bouncing
    if (settings.edgeBehavior === "wrap") {
      if (boid.position.x < 0) boid.position.x = canvas.width;
      if (boid.position.x > canvas.width) boid.position.x = 0;
      if (boid.position.y < 0) boid.position.y = canvas.height;
      if (boid.position.y > canvas.height) boid.position.y = 0;
    } else if (settings.edgeBehavior === "bounce") {
      if (boid.position.x < 0 || boid.position.x > canvas.width) {
        boid.velocity.x *= -1;
        boid.position.x = clamp(boid.position.x, 0, canvas.width);
      }
      if (boid.position.y < 0 || boid.position.y > canvas.height) {
        boid.velocity.y *= -1;
        boid.position.y = clamp(boid.position.y, 0, canvas.height);
      }
    }

    // Update trail
    if (showTrails) {
      boid.trail.push({
        x: boid.position.x,
        y: boid.position.y,
        alpha: 1.0,
      });

      // Fade trail points
      boid.trail.forEach((point) => {
        point.alpha *= 0.95;
      });

      // Remove old trail points
      boid.trail = boid.trail.filter((point) => point.alpha > 0.1);
      if (boid.trail.length > 20) {
        boid.trail.shift();
      }
    }

    // Update boid properties based on current settings
    boid.maxSpeed = settings.maxSpeed;
    boid.maxForce = settings.maxForce;
  };

  const render = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Clear with slight fade for trails
    ctx.fillStyle = "rgba(15, 23, 42, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    boidsRef.current.forEach((boid) => {
      // Draw trail
      if (showTrails && boid.trail.length > 1) {
        ctx.strokeStyle = `hsla(${boid.color.h}, ${boid.color.s}%, ${boid.color.l}%, 0.3)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(boid.trail[0].x, boid.trail[0].y);
        for (let i = 1; i < boid.trail.length; i++) {
          ctx.globalAlpha = boid.trail[i].alpha * 0.5;
          ctx.lineTo(boid.trail[i].x, boid.trail[i].y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Draw boid as triangle
      const angle = vec2Angle(boid.velocity);
      const size = boid.size;

      ctx.save();
      ctx.translate(boid.position.x, boid.position.y);
      ctx.rotate(angle);

      // Boid body
      ctx.fillStyle = toCssHsl(boid.color);
      ctx.beginPath();
      ctx.moveTo(size, 0);
      ctx.lineTo(-size, -size / 2);
      ctx.lineTo(-size / 2, 0);
      ctx.lineTo(-size, size / 2);
      ctx.closePath();
      ctx.fill();

      // Boid outline
      ctx.strokeStyle = toCssHsl({ ...boid.color, l: boid.color.l - 20 });
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();

      // Debug information
      if (showDebug) {
        // Draw perception radii
        ctx.strokeStyle = "rgba(255, 0, 0, 0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(
          boid.position.x,
          boid.position.y,
          settings.separationRadius,
          0,
          Math.PI * 2,
        );
        ctx.stroke();

        ctx.strokeStyle = "rgba(0, 255, 0, 0.2)";
        ctx.beginPath();
        ctx.arc(
          boid.position.x,
          boid.position.y,
          settings.alignmentRadius,
          0,
          Math.PI * 2,
        );
        ctx.stroke();

        ctx.strokeStyle = "rgba(0, 0, 255, 0.2)";
        ctx.beginPath();
        ctx.arc(
          boid.position.x,
          boid.position.y,
          settings.cohesionRadius,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
    });

    // Draw mouse cursor
    if (mouseRef.current.pressed) {
      ctx.fillStyle = predatorMode
        ? "rgba(220, 53, 69, 0.5)"
        : "rgba(40, 167, 69, 0.5)";
      ctx.beginPath();
      ctx.arc(
        mouseRef.current.x,
        mouseRef.current.y,
        predatorMode ? 20 : 15,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  };

  const animate = () => {
    if (!isRunning) return;

    boidsRef.current.forEach(updateBoid);
    render();
    animationRef.current = requestAnimationFrame(animate);
  };

  const startSimulation = () => {
    setIsRunning(true);
    animationRef.current = requestAnimationFrame(animate);
  };

  const stopSimulation = () => {
    setIsRunning(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const resetBoids = () => {
    initializeBoids();
    render();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 600;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseDown = () => {
      mouseRef.current.pressed = true;
    };

    const handleMouseUp = () => {
      mouseRef.current.pressed = false;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Add new boid at click position
      if (!predatorMode) {
        const newBoid = createBoid(x, y);
        boidsRef.current.push(newBoid);
        setBoidCount(boidsRef.current.length);
      }
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("click", handleClick);

    // Initialize
    initializeBoids();
    render();

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("click", handleClick);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    initializeBoids();
    if (!isRunning) render();
  }, [boidCount]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">
          Craig Reynolds Boids Flocking
        </h1>
        <p className="text-gray-600 mb-4">
          Complete emergent behavior simulation with interactive forces,
          real-time parameters, and visual debugging.
        </p>
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
          <p className="text-cyan-800">
            🐦 Watch boids flock together! Click to add boids, hold mouse to
            attract/repel
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <button
            type="button"
            onClick={startSimulation}
            disabled={isRunning}
            className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:opacity-50 transition-colors"
          >
            Start Simulation
          </button>
          <button
            type="button"
            onClick={stopSimulation}
            disabled={!isRunning}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            Stop Simulation
          </button>
          <button
            type="button"
            onClick={resetBoids}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Reset Boids
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showDebug}
                onChange={(e) => setShowDebug(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Show Debug
              </span>
            </label>
          </div>
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showTrails}
                onChange={(e) => setShowTrails(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Show Trails
              </span>
            </label>
          </div>
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={predatorMode}
                onChange={(e) => setPredatorMode(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Predator Mode
              </span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Edge Behavior
            </label>
            <select
              value={settings.edgeBehavior}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  edgeBehavior: e.target.value as typeof settings.edgeBehavior,
                }))
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="wrap">Wrap</option>
              <option value="bounce">Bounce</option>
              <option value="avoid">Avoid</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Boid Count: {boidCount}
            </label>
            <input
              type="range"
              min="10"
              max="200"
              value={boidCount}
              onChange={(e) => setBoidCount(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Speed: {settings.maxSpeed.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={settings.maxSpeed}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  maxSpeed: Number(e.target.value),
                }))
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Separation: {settings.separationWeight.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={settings.separationWeight}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  separationWeight: Number(e.target.value),
                }))
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alignment: {settings.alignmentWeight.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={settings.alignmentWeight}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  alignmentWeight: Number(e.target.value),
                }))
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cohesion: {settings.cohesionWeight.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={settings.cohesionWeight}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  cohesionWeight: Number(e.target.value),
                }))
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Separation Radius: {settings.separationRadius}
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={settings.separationRadius}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  separationRadius: Number(e.target.value),
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
          className="border border-gray-300 rounded-lg bg-slate-900 cursor-crosshair"
          style={{ maxWidth: "100%", height: "auto" }}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2 text-yellow-800">
            Flocking Rules
          </h3>
          <ul className="text-yellow-700 space-y-1">
            <li>
              • <strong>Separation</strong>: Steer to avoid crowding local
              flockmates
            </li>
            <li>
              • <strong>Alignment</strong>: Steer towards average heading of
              neighbors
            </li>
            <li>
              • <strong>Cohesion</strong>: Steer to move toward average position
              of neighbors
            </li>
            <li>
              • <strong>Emergence</strong>: Complex flocking behavior from
              simple rules
            </li>
          </ul>
        </div>

        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2 text-cyan-800">
            Interactive Features
          </h3>
          <ul className="text-cyan-700 space-y-1">
            <li>
              • <strong>Mouse Interaction</strong>: Attract or repel boids with
              mouse
            </li>
            <li>
              • <strong>Real-time Controls</strong>: Adjust flocking parameters
              live
            </li>
            <li>
              • <strong>Edge Behaviors</strong>: Wrap, bounce, or avoid
              boundaries
            </li>
            <li>
              • <strong>Debug Mode</strong>: Visualize perception radii and
              forces
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6">
        <a
          href="/examples/visual"
          className="inline-block px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
        >
          ← Back to Examples
        </a>
      </div>
    </div>
  );
}
