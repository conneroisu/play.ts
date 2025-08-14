# Nix Build for play.ts Examples

This directory contains a complete Nix flake for building and developing the play.ts TanStack examples site.

## Quick Start

### Development
```bash
# Enter the Nix development environment
nix develop

# Start the development server (with hot reload)
examples-dev

# Build the production site
examples-build

# Serve the built site
examples-serve
```

### One-Command Usage
```bash
# Start development server directly
nix run .#dev

# Build the site directly
nix run .#build

# Run linting
nix run .#lint

# Run all quality checks
nix run .#check
```

## Features

### Development Environment
- **Bun & Node.js**: Latest versions for optimal performance
- **TypeScript**: Full type checking support
- **Development Scripts**: Pre-configured commands for all common tasks

### Available Commands
- `examples-dev` - Start development server (port 3000)
- `examples-build` - Build production site
- `examples-serve` - Serve built site (port 4173)
- `examples-test` - Run tests
- `examples-lint` - Run linting (Biome)
- `examples-format` - Format code (Biome)
- `examples-check` - Run comprehensive quality checks

### Automatic Dependency Management
The build process automatically:
1. Builds the parent play.ts library
2. Installs dependencies for examples
3. Generates optimized production build
4. Code-splits for optimal performance

## Verified Working

✅ **Nix Development Shell**: Full environment with all tools  
✅ **Production Build**: Creates optimized static site  
✅ **Development Server**: Hot reload on port 3000  
✅ **Production Server**: Static file serving on port 4173  
✅ **Type Checking**: Full TypeScript validation  
✅ **Code Quality**: Linting and formatting  

## Architecture

The flake includes:
- **Development Shell**: Complete environment with Bun, Node.js, TypeScript
- **Build Scripts**: Automated build process for parent library + examples
- **Apps**: Direct `nix run` commands for all operations
- **Package Build**: Standalone site package (development-focused, requires network)

## Usage Notes

- The development shell automatically ensures you're in the correct directory
- Dependencies are installed automatically during build if missing
- The parent play.ts library is built first to ensure examples work correctly
- All standard Vite features are available (hot reload, fast refresh, etc.)

## Example Workflow

```bash
# Clone and enter the examples directory
cd _examples/

# Enter Nix development environment
nix develop

# Start development (opens http://localhost:3000)
examples-dev

# In another terminal, run quality checks
examples-check

# Build for production
examples-build

# Test the production build
examples-serve  # Opens http://localhost:4173
```

This Nix configuration provides a reproducible, cross-platform development environment for the play.ts examples site.