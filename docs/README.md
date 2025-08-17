# play.ts Documentation Site

This is the documentation website for play.ts, built with Astro.js and deployed to GitHub Pages.

## Development

### With Nix (Recommended)

1. **Enter development environment:**
   ```bash
   nix develop
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Start development server:**
   ```bash
   bun run dev
   ```

4. **Build for production:**
   ```bash
   bun run build
   ```

### With Node.js/Bun

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Start development server:**
   ```bash
   bun run dev
   ```

## Building with Nix

### Local Build

```bash
# Build the site with Nix
nix build

# The output will be in ./result/
```

### GitHub Pages Build

```bash
# Build for GitHub Pages deployment
NODE_ENV=production bun run build:gh-pages
```

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the `main` branch. The deployment is handled by the GitHub Actions workflow in `.github/workflows/deploy.yml`.

### Manual Deployment

1. **Ensure the site builds correctly:**
   ```bash
   nix build
   ```

2. **Push to main branch:**
   ```bash
   git add .
   git commit -m "Update docs"
   git push origin main
   ```

## Project Structure

```
docs/
├── .github/workflows/    # GitHub Actions workflows
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   ├── layouts/         # Astro layouts
│   ├── pages/          # Astro pages
│   └── styles/         # CSS styles
├── astro.config.mjs    # Astro configuration
├── flake.nix          # Nix flake configuration
├── default.nix        # Nix package definition
├── bun.nix           # Bun dependencies (generated)
├── package.json      # Package configuration
└── tsconfig.json     # TypeScript configuration
```

## Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `bun install`             | Installs dependencies                            |
| `bun run dev`             | Starts local dev server at `localhost:4321`      |
| `bun run build`           | Build your production site to `./dist/`          |
| `bun run build:gh-pages`  | Build for GitHub Pages deployment               |
| `bun run preview`         | Preview your build locally, before deploying     |
| `nix develop`             | Enter Nix development environment               |
| `nix build`               | Build with Nix package manager                  |

## Key Features

- **Interactive Examples**: Real-time demonstrations of play.ts functionality
- **Search**: Command-K search interface for quick navigation
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Type Safety**: Full TypeScript integration
- **Performance**: Optimized builds with Astro's static site generation

## Examples

The documentation includes comprehensive examples organized by category:

- **Basic**: Math operations, color systems, random generation, geometry, animation
- **Visual**: Particle systems, fractals, physics simulations
- **Engineering**: Signal processing, circuit analysis, control systems

Each example includes:
- Interactive demonstrations
- Live code examples
- Real-time parameter controls
- Educational explanations

## Contributing

1. Make changes to the documentation or examples
2. Test locally with `bun run dev`
3. Build with `nix build` to ensure it works
4. Submit a pull request

The site will automatically rebuild and deploy when changes are merged to main.