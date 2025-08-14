# Development Environment Guide

This project uses Nix Flakes to provide a comprehensive development environment with all necessary tools and scripts.

## 🚀 Quick Start

```bash
# Enter the development environment
nix develop

# Or run commands directly
nix run .#test      # Run tests
nix run .#lint      # Run linting
nix run .#examples  # List examples
```

## 📋 Available Scripts

### Core Development
- `dev` - Start development environment with tool overview
- `build` - Build the TypeScript library
- `clean` - Clean build artifacts and caches
- `fresh` - Clean install (removes node_modules and reinstalls)

### Testing Suite
- `test` - Run all tests with Bun
- `test-watch` - Run tests in watch mode
- `test-coverage` - Run tests with coverage reporting

### Code Quality
- `typecheck` - TypeScript type checking with tsc
- `typecheck-watch` - Type checking in watch mode
- `lint` - Comprehensive linting with oxlint + ESLint
- `lint-fix` - Auto-fix linting issues with ESLint
- `format` - Format code with Prettier
- `format-check` - Check code formatting without changes
- `check` - Run all quality checks (CI-style: typecheck + lint + format + test)

### Examples & Demos
- `examples` - List all available example files
- `demo` - Run comprehensive demo showcasing library features
- `benchmark` - Run performance benchmarks and stress tests

### Utilities
- `docs` - Show locations of documentation files
- `setup-hooks` - Setup Git pre-commit hooks for quality checks

## 🛠 Included Tools

### Core Runtime
- **Bun 1.2.17** - Primary JavaScript runtime and package manager
- **Node.js 22** - Alternative runtime for compatibility
- **TypeScript 5.8.3** - Type checking and compilation

### Linting & Formatting
- **oxlint 1.3.0** - Fast Rust-based linter (primary)
- **ESLint 9.30.1** - JavaScript/TypeScript linting with auto-fix
- **Prettier 3.6.2** - Code formatting with consistent style

### Development Tools
- **Git** - Version control
- **ripgrep** - Fast text search
- **fd** - Fast file finder
- **tree** - Directory structure visualization
- **hyperfine** - Command-line benchmarking tool
- **ImageMagick** - Image processing (for creative coding)
- **figlet** - ASCII art text generation

## 🔧 Usage Examples

### Development Workflow
```bash
# Enter development environment
nix develop

# Run quality checks before committing
check

# Run specific tests
test

# Auto-fix code issues
lint-fix && format

# Run examples
bun examples/basic/01-math-operations.ts
```

### CI/CD Integration
```bash
# Run all quality checks (suitable for CI)
nix run .#check

# Individual check steps
nix run .#typecheck  # Type checking
nix run .#lint       # Linting
nix run .#format-check  # Format validation
nix run .#test       # Test suite
```

### Performance Analysis
```bash
# Run benchmarks
nix run .#benchmark

# Performance demo
nix run .#demo
```

## ⚙️ Configuration Files

### ESLint (`.eslintrc.json`)
- TypeScript-focused configuration
- Strict rules for code quality
- Complexity and maintainability checks
- Relaxed rules for tests and examples

### Prettier (`.prettierrc.json`)
- Single quotes, semicolons
- 120 character line width
- 2-space indentation
- Consistent bracket and comma formatting

### Git Hooks
Set up automatic quality checks:
```bash
nix run .#setup-hooks
```

This creates a pre-commit hook that runs `check` before every commit.

## 🎯 Quality Standards

The development environment enforces these standards:

### TypeScript
- Strict type checking with `--noEmit`
- No implicit any types (warnings)
- Proper error handling

### Linting
- oxlint for fast syntax and style checking
- ESLint for TypeScript-specific rules
- Maximum complexity: 10
- Maximum function length: 50 lines
- Maximum parameters: 5

### Formatting
- Consistent code style with Prettier
- Single quotes, trailing commas avoided
- 120 character line width

### Testing
- 99.8% test success rate maintained
- Comprehensive coverage across all modules
- Performance benchmarks included

## 🔄 Development Workflow

1. **Setup**: `nix develop` (automatic dependency installation)
2. **Development**: Write code with full TypeScript support
3. **Quality**: `check` runs all quality checks
4. **Testing**: `test` or `test-watch` for continuous testing
5. **Examples**: `demo` or specific example files
6. **Performance**: `benchmark` for optimization analysis

## 🚀 Performance Features

### Development Speed
- **oxlint**: ~11ms for 72 files (149 warnings found)
- **Bun tests**: ~976ms for 420 tests
- **Hot reloading**: `bun --hot <file>` for development

### Quality Automation
- Pre-commit hooks prevent bad commits
- Automated formatting and lint fixing
- Comprehensive test coverage validation

## 📚 Additional Resources

- **Examples**: `examples/README.md` - Comprehensive learning guide
- **Production**: `PRODUCTION_READY.md` - Deployment readiness
- **Performance**: Built-in benchmarking and profiling tools

The development environment is designed to provide everything needed for productive TypeScript development with a focus on code quality, performance, and creative coding applications.