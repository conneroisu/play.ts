/**
 * Physics simulation utilities for creative coding and interactive applications.
 *
 * This module provides a comprehensive physics toolkit including force calculations,
 * particle systems, constraint solving, and physical simulation primitives.
 * All systems are designed for real-time performance in creative coding contexts
 * such as generative art, games, and interactive visualizations.
 *
 * @remarks
 * The physics system is built around several fundamental concepts:
 *
 * **Forces and Motion:**
 * - Newtonian mechanics with F = ma
 * - Common forces: gravity, friction, drag, springs
 * - Attraction and repulsion between objects
 * - Force accumulation and integration
 *
 * **Particle Systems:**
 * - Individual particles with position, velocity, acceleration
 * - Mass-based force application
 * - Lifetime management and recycling
 * - Efficient batch processing for large systems
 *
 * **Constraint Systems:**
 * - Verlet integration for stable simulations
 * - Distance constraints for cloth and rope simulation
 * - Position-based dynamics for complex structures
 *
 * **Integration Methods:**
 * - Euler integration for simple, fast simulation
 * - Verlet integration for more stable results
 * - Semi-implicit Euler for improved stability
 *
 * @example
 * Basic particle simulation:
 * ```typescript
 * import { Particle, gravity, friction, ParticleSystem } from 'play.ts';
 *
 * const system = new ParticleSystem();
 *
 * // Create particles with initial conditions
 * const particle = new Particle(100, 100, 0, 0, 1, 5000);
 * system.addParticle(particle);
 *
 * // Apply forces each frame
 * function updatePhysics(deltaTime: number) {
 *   for (const p of system.particles) {
 *     const gravityForce = gravity(p.mass);
 *     const frictionForce = friction(p.velocity, 0.02);
 *
 *     p.applyForce(gravityForce);
 *     p.applyForce(frictionForce);
 *     p.update(deltaTime);
 *   }
 * }
 * ```
 *
 * @example
 * Spring-mass system:
 * ```typescript
 * import { Particle, springForce } from 'play.ts';
 *
 * const anchor = new Particle(200, 100);  // Fixed anchor point
 * const bob = new Particle(200, 200);     // Swinging mass
 * const springLength = 80;
 * const stiffness = 0.2;
 *
 * function updateSpring(deltaTime: number) {
 *   const force = springForce(
 *     bob.position,
 *     anchor.position,
 *     springLength,
 *     stiffness
 *   );
 *
 *   bob.applyForce(force);
 *   bob.applyForce(gravity(bob.mass));
 *   bob.update(deltaTime);
 * }
 * ```
 *
 * @example
 * Attraction/repulsion system:
 * ```typescript
 * import { attraction, repulsion } from 'play.ts';
 *
 * const particles = [] as Particle[];
 *
 * function updateInteractions() {
 *   for (let i = 0; i < particles.length; i++) {
 *     for (let j = i + 1; j < particles.length; j++) {
 *       const p1 = particles[i];
 *       const p2 = particles[j];
 *
 *       // Close particles repel
 *       const distance = vec2Distance(p1.position, p2.position);
 *       if (distance < 50) {
 *         const repelForce = repulsion(p1.position, p2.position, p1.mass, p2.mass, 100);
 *         p1.applyForce(vec2Mul(repelForce, -1));
 *         p2.applyForce(repelForce);
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * @see {@link https://en.wikipedia.org/wiki/Classical_mechanics | Classical Mechanics}
 * @see {@link https://en.wikipedia.org/wiki/Verlet_integration | Verlet Integration}
 * @see {@link https://matthias-research.github.io/pages/publications/posBasedDyn.pdf | Position Based Dynamics}
 */
import type { Vector2 } from '../types/index.ts';
/**
 * Calculates gravitational force acting on an object.
 *
 * @param mass - Mass of the object (default: 1)
 * @param strength - Gravitational acceleration strength (default: 9.81 m/s²)
 * @returns Force vector pointing downward
 *
 * @remarks
 * Implements Newton's law F = ma for gravitational force. The default strength
 * of 9.81 represents Earth's gravity, but can be adjusted for different
 * environments, artistic effects, or gameplay mechanics.
 *
 * In creative coding contexts, gravity values are often scaled for visual
 * appeal rather than physical accuracy. Common creative values:
 * - `0.1-0.5`: Gentle, floating motion
 * - `1-5`: Standard game gravity
 * - `9.81`: Realistic Earth gravity
 * - `10-50`: Heavy, dramatic falling
 *
 * @example
 * Basic gravity application:
 * ```typescript
 * const particle = new Particle(100, 100);
 *
 * function update() {
 *   const gravityForce = gravity(particle.mass, 0.2); // Gentle gravity
 *   particle.applyForce(gravityForce);
 *   particle.update(deltaTime);
 * }
 * ```
 *
 * @example
 * Variable gravity for different objects:
 * ```typescript
 * const balloon = new Particle(50, 50, 0, 0, 0.1);    // Light object
 * const rock = new Particle(60, 50, 0, 0, 2.0);       // Heavy object
 *
 * // Different gravity effects
 * balloon.applyForce(gravity(balloon.mass, -0.1));     // Floats up
 * rock.applyForce(gravity(rock.mass, 2.0));            // Falls fast
 * ```
 *
 * @see {@link friction} for opposing force
 * @see {@link drag} for velocity-dependent resistance
 */
export declare const gravity: (mass?: number, strength?: number) => Vector2;
/**
 * Calculates kinetic friction force opposing motion.
 *
 * @param velocity - Current velocity vector of the object
 * @param coefficient - Friction coefficient (0 = no friction, 1 = high friction)
 * @returns Force vector opposing the direction of motion
 *
 * @remarks
 * Implements linear friction force that opposes velocity: F = -μv
 * This simplified model provides good visual results for creative applications
 * while being computationally efficient.
 *
 * **Friction coefficient guidelines:**
 * - `0.0`: No friction (space-like environment)
 * - `0.01-0.05`: Very low friction (ice, oil)
 * - `0.1-0.3`: Medium friction (normal surfaces)
 * - `0.5-1.0`: High friction (rough surfaces, brakes)
 *
 * Note: This uses velocity-proportional friction rather than true
 * Coulomb friction for smoother, more predictable behavior.
 *
 * @example
 * Basic friction application:
 * ```typescript
 * const particle = new Particle(100, 100, 50, 0); // Moving right
 *
 * function update() {
 *   const frictionForce = friction(particle.velocity, 0.02);
 *   particle.applyForce(frictionForce);
 *   particle.update(deltaTime);
 *   // Object will gradually slow down
 * }
 * ```
 *
 * @example
 * Surface-dependent friction:
 * ```typescript
 * const getSurfaceFriction = (position: Vector2): number => {
 *   if (position.y > waterLevel) return 0.1;      // Water
 *   if (position.x > iceStart) return 0.005;     // Ice
 *   return 0.05;                                 // Normal ground
 * };
 *
 * const frictionCoeff = getSurfaceFriction(particle.position);
 * const frictionForce = friction(particle.velocity, frictionCoeff);
 * ```
 *
 * @see {@link drag} for velocity-squared resistance
 * @see {@link gravity} for constant downward force
 */
export declare const friction: (velocity: Vector2, coefficient?: number) => Vector2;
/**
 * Calculates fluid drag force opposing motion (velocity-squared model).
 *
 * @param velocity - Current velocity vector of the object
 * @param coefficient - Drag coefficient (higher values = more resistance)
 * @returns Force vector opposing motion, proportional to speed squared
 *
 * @remarks
 * Implements quadratic drag force: F = -½ρCdAv²
 * Simplified to F = -coefficient × speed² × direction
 *
 * This creates more realistic fluid dynamics where faster objects
 * experience exponentially more resistance. Useful for:
 * - Air resistance simulation
 * - Water/fluid environments
 * - Terminal velocity effects
 * - Realistic projectile physics
 *
 * **Coefficient guidelines:**
 * - `0.001-0.005`: Light air resistance
 * - `0.01-0.05`: Moderate fluid resistance
 * - `0.1-0.5`: Heavy fluid (thick liquid)
 * - `1.0+`: Extreme resistance
 *
 * @example
 * Realistic projectile with air resistance:
 * ```typescript
 * const projectile = new Particle(0, 100, 50, -30); // Initial velocity
 *
 * function update() {
 *   projectile.applyForce(gravity(projectile.mass, 9.81));
 *   projectile.applyForce(drag(projectile.velocity, 0.002)); // Air resistance
 *   projectile.update(deltaTime);
 * }
 * ```
 *
 * @example
 * Terminal velocity demonstration:
 * ```typescript
 * const fallingObject = new Particle(100, 0, 0, 0, 1);
 *
 * function update() {
 *   const gravityForce = gravity(fallingObject.mass, 9.81);
 *   const dragForce = drag(fallingObject.velocity, 0.01);
 *
 *   fallingObject.applyForce(gravityForce);
 *   fallingObject.applyForce(dragForce);
 *   fallingObject.update(deltaTime);
 *
 *   // Object will reach terminal velocity when drag balances gravity
 * }
 * ```
 *
 * @see {@link friction} for linear velocity resistance
 * @see {@link gravity} for constant acceleration
 */
export declare const drag: (velocity: Vector2, coefficient?: number) => Vector2;
/**
 * Calculates gravitational or electromagnetic attraction between two objects.
 *
 * @param pos1 - Position of the first object
 * @param pos2 - Position of the second object (attracts pos1 toward pos2)
 * @param mass1 - Mass of the first object (default: 1)
 * @param mass2 - Mass of the second object (default: 1)
 * @param strength - Attraction strength multiplier (default: 1)
 * @returns Force vector pointing from pos1 toward pos2
 *
 * @remarks
 * Implements inverse-square law attraction: F = G(m1×m2)/r²
 * This creates realistic gravitational or electromagnetic attraction
 * where force decreases with the square of distance.
 *
 * **Use cases:**
 * - Gravitational systems (planets, stars)
 * - Magnetic or electric attraction
 * - Flocking behavior (attraction to neighbors)
 * - UI elements drawn to targets
 * - Particle systems with attraction points
 *
 * **Strength guidelines:**
 * - `0.1-1`: Gentle attraction
 * - `10-100`: Moderate gravitational effect
 * - `1000+`: Strong attraction (black holes, magnets)
 *
 * @example
 * Planetary orbit simulation:
 * ```typescript
 * const sun = new Particle(200, 200, 0, 0, 1000);     // Massive central body
 * const planet = new Particle(300, 200, 0, 30, 1);    // Orbiting body
 *
 * function update() {
 *   const attractionForce = attraction(
 *     planet.position,
 *     sun.position,
 *     planet.mass,
 *     sun.mass,
 *     100  // Gravitational constant
 *   );
 *
 *   planet.applyForce(attractionForce);
 *   planet.update(deltaTime);
 * }
 * ```
 *
 * @example
 * Mouse attraction effect:
 * ```typescript
 * const particles = createParticles(50);
 *
 * function update(mousePos: Vector2) {
 *   particles.forEach(particle => {
 *     const attractForce = attraction(
 *       particle.position,
 *       mousePos,
 *       particle.mass,
 *       10,  // "Mass" of mouse cursor
 *       50   // Attraction strength
 *     );
 *
 *     particle.applyForce(attractForce);
 *     particle.update(deltaTime);
 *   });
 * }
 * ```
 *
 * @see {@link repulsion} for the opposite force
 * @see {@link springForce} for distance-based restoration
 */
export declare const attraction: (pos1: Vector2, pos2: Vector2, mass1?: number, mass2?: number, strength?: number) => Vector2;
/**
 * Calculates repulsive force between two objects (inverse of attraction).
 *
 * @param pos1 - Position of the first object
 * @param pos2 - Position of the second object (repels pos1 away from pos2)
 * @param mass1 - Mass of the first object (default: 1)
 * @param mass2 - Mass of the second object (default: 1)
 * @param strength - Repulsion strength multiplier (default: 1)
 * @returns Force vector pointing from pos2 toward pos1 (pushing away)
 *
 * @remarks
 * Creates repulsive forces following inverse-square law, useful for:
 * - Collision avoidance between particles
 * - Electromagnetic repulsion (like charges)
 * - Personal space in crowd simulation
 * - Explosion effects
 * - Anti-clustering behaviors
 *
 * @example
 * Particle collision avoidance:
 * ```typescript
 * const particles = createParticles(20);
 *
 * function updateRepulsion() {
 *   for (let i = 0; i < particles.length; i++) {
 *     for (let j = i + 1; j < particles.length; j++) {
 *       const p1 = particles[i];
 *       const p2 = particles[j];
 *       const distance = vec2Distance(p1.position, p2.position);
 *
 *       // Only repel when close
 *       if (distance < 30) {
 *         const repelForce = repulsion(
 *           p1.position, p2.position,
 *           p1.mass, p2.mass,
 *           200 // Strong repulsion to prevent overlap
 *         );
 *
 *         p1.applyForce(repelForce);
 *         p2.applyForce(vec2Mul(repelForce, -1)); // Equal and opposite
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * @see {@link attraction} for the opposite force
 * @see {@link springForce} for restoration to rest length
 */
export declare const repulsion: (pos1: Vector2, pos2: Vector2, mass1?: number, mass2?: number, strength?: number) => Vector2;
/**
 * Calculates spring force following Hooke's law with damping.
 *
 * @param pos1 - Position of the first object (force will be applied here)
 * @param pos2 - Position of the second object (anchor or connected object)
 * @param restLength - Natural length of the spring when at rest
 * @param stiffness - Spring stiffness constant (default: 0.1)
 * @param damping - Damping factor to reduce oscillation (default: 0.99)
 * @returns Force vector to restore spring to rest length
 *
 * @remarks
 * Implements Hooke's law: F = -k(x - x₀) where:
 * - k is the spring stiffness
 * - x is current length
 * - x₀ is rest length
 *
 * Springs are fundamental in physics simulation for:
 * - Cloth and rope simulation
 * - Soft body physics
 * - UI spring animations
 * - Hair and fur dynamics
 * - Constraint satisfaction
 *
 * **Parameter guidelines:**
 * - **Stiffness**: `0.01-0.1` (soft), `0.1-0.5` (medium), `0.5-2.0` (stiff)
 * - **Damping**: `0.95-0.99` (some oscillation), `0.8-0.95` (critically damped)
 *
 * @example
 * Simple pendulum:
 * ```typescript
 * const anchor = vec2(200, 100);  // Fixed point
 * const bob = new Particle(200, 200, 0, 0, 1);
 * const springLength = 80;
 *
 * function update() {
 *   const springForce = springForce(
 *     bob.position,
 *     anchor,
 *     springLength,
 *     0.2,   // Moderately stiff
 *     0.98   // Light damping
 *   );
 *
 *   bob.applyForce(springForce);
 *   bob.applyForce(gravity(bob.mass, 0.5));
 *   bob.update(deltaTime);
 * }
 * ```
 *
 * @example
 * Cloth simulation:
 * ```typescript
 * class ClothNode extends Particle {
 *   connections: { node: ClothNode; restLength: number }[] = [];
 * }
 *
 * function updateCloth(nodes: ClothNode[]) {
 *   nodes.forEach(node => {
 *     node.connections.forEach(({ node: other, restLength }) => {
 *       const force = springForce(
 *         node.position,
 *         other.position,
 *         restLength,
 *         0.1,   // Flexible cloth
 *         0.95   // Some damping for stability
 *       );
 *       node.applyForce(force);
 *     });
 *   });
 * }
 * ```
 *
 * @see {@link attraction} and {@link repulsion} for distance-based forces
 * @see {@link VerletConstraint} for more stable constraint solving
 */
export declare const springForce: (pos1: Vector2, pos2: Vector2, restLength: number, stiffness?: number, damping?: number) => Vector2;
export declare class Particle {
    position: Vector2;
    velocity: Vector2;
    acceleration: Vector2;
    mass: number;
    lifetime: number;
    maxLifetime: number;
    isDead: boolean;
    constructor(x?: number, y?: number, vx?: number, vy?: number, mass?: number, lifetime?: number);
    addForce(force: Vector2): void;
    update(deltaTime?: number): void;
    distanceTo(other: Particle): number;
    attractTo(other: Particle, strength?: number): void;
    repelFrom(other: Particle, strength?: number): void;
    applySpring(anchor: Vector2, restLength?: number, stiffness?: number): void;
    getAge(): number;
    getAgeRatio(): number;
}
export declare class ParticleSystem {
    particles: Particle[];
    forces: Array<(particle: Particle, index: number, particles: Particle[]) => Vector2>;
    constructor();
    addParticle(particle: Particle): void;
    addForce(force: (particle: Particle, index: number, particles: Particle[]) => Vector2): void;
    update(deltaTime?: number): void;
    getParticles(): Particle[];
    getAliveCount(): number;
    clear(): void;
}
export declare class VerletParticle {
    position: Vector2;
    oldPosition: Vector2;
    acceleration: Vector2;
    mass: number;
    pinned: boolean;
    constructor(x?: number, y?: number, mass?: number);
    addForce(force: Vector2): void;
    update(deltaTime?: number): void;
    pin(): void;
    unpin(): void;
}
export declare class VerletConstraint {
    p1: VerletParticle;
    p2: VerletParticle;
    restLength: number;
    stiffness: number;
    constructor(p1: VerletParticle, p2: VerletParticle, stiffness?: number);
    update(): void;
}
export declare class Cloth {
    particles: VerletParticle[][];
    constraints: VerletConstraint[];
    width: number;
    height: number;
    constructor(width: number, height: number, resolution?: number, stiffness?: number);
    update(): void;
    pinCorners(): void;
    addWind(force: Vector2): void;
    addGravity(strength?: number): void;
}
export declare const createOrbit: (center: Vector2, radius: number, speed: number, angle?: number) => {
    position: Vector2;
    velocity: Vector2;
};
export declare const createExplosion: (center: Vector2, count: number, minSpeed?: number, maxSpeed?: number, lifetime?: number) => Particle[];
//# sourceMappingURL=physics.d.ts.map