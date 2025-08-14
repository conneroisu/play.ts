# TypeScript ASCII Animation Library Development Tasks

# Show available commands
default:
    @just --list

# Install dependencies
install:
    bun install

# Start development server
dev:
    bun run dev

# Build the library
build:
    bun run build

# Run tests
test:
    bun test

# Run TypeScript type checking
typecheck:
    bun run tsc --noEmit

# Run linting
lint:
    bun run lint

# Format code
format:
    bun run format

# Clean build artifacts
clean:
    rm -rf dist/ node_modules/ .bun/

# Run example programs
examples:
    cd examples && bun run index.ts

# Run a specific example
example FILE:
    bun run src/programs/{{FILE}}

# Watch for changes and rebuild
watch:
    bun run --watch src/index.ts

# Bundle for production
bundle:
    bun build src/index.ts --outdir dist --target bun --minify

# Check project health
health: typecheck lint test
    @echo "✅ Project health check passed!"

# Setup development environment
setup: install
    @echo "🎨 ASCII Animation library setup complete!"
    @echo "Run 'just dev' to start development"