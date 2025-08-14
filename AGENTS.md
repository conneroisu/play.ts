# AGENTS.md - play.ts Development Guide

## Commands
- **Build**: `bun run build` (builds JS + types)
- **Test**: `bun test` (all tests), `bun test <file>` (single test), `bun test --watch` (watch mode)
- **Lint/Type Check**: `bun run type-check` (TypeScript validation)
- **Format**: `bun run format` (Prettier formatting)
- **Dev**: `bun --hot src/index.ts` (hot reload development)

## Code Style
- **Runtime**: Bun (not Node.js) - use `bun <file>` for execution
- **Imports**: Use `.ts` extensions, relative paths from src/, type imports with `import type`
- **Exports**: Named exports preferred, use `export const` for functions
- **Types**: Strict TypeScript, explicit return types, import types from `../types/index.ts`
- **Naming**: camelCase functions, PascalCase classes/types, UPPER_CASE constants
- **Functions**: Arrow functions for utilities, regular functions for classes
- **Comments**: JSDoc for public APIs, minimal inline comments
- **Error Handling**: Return types over exceptions, validate inputs with clamp/normalize

## Architecture
- **Modules**: math.ts, color.ts, animation.ts, random.ts, geometry.ts
- **Types**: Centralized in types/index.ts (Vector2, Vector3, Matrix3x3, etc.)
- **Testing**: Bun test framework, comprehensive unit tests, describe/test structure
- **Build**: ESM modules, declaration files, tree-shakeable exports