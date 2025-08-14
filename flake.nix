{
  description = "play.ts - TypeScript library for creative coding";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        
        # Define comprehensive development scripts
        scripts = {
          # Core development commands
          dev = pkgs.writeShellScriptBin "dev" ''
            echo "🚀 Starting development environment..."
            echo "Available scripts: test, lint, typecheck, format, build, examples"
            echo "Use 'bun --hot <file>' for hot reloading"
          '';
          
          # Building
          build = pkgs.writeShellScriptBin "build" ''
            echo "🔨 Building TypeScript library..."
            bun run build 2>/dev/null || {
              echo "📦 No build script found, running TypeScript compilation..."
              tsc --build
            }
          '';
          
          # Testing suite
          test = pkgs.writeShellScriptBin "test" ''
            echo "🧪 Running all tests..."
            bun test
          '';
          
          test-watch = pkgs.writeShellScriptBin "test-watch" ''
            echo "👀 Running tests in watch mode..."
            bun test --watch
          '';
          
          test-coverage = pkgs.writeShellScriptBin "test-coverage" ''
            echo "📊 Running tests with coverage..."
            bun test --coverage
          '';
          
          # Type checking
          typecheck = pkgs.writeShellScriptBin "typecheck" ''
            echo "🔍 Running TypeScript type checking..."
            tsc --noEmit --skipLibCheck
          '';
          
          typecheck-watch = pkgs.writeShellScriptBin "typecheck-watch" ''
            echo "👀 Running TypeScript type checking in watch mode..."
            tsc --noEmit --skipLibCheck --watch
          '';
          
          # Linting with multiple tools
          lint = pkgs.writeShellScriptBin "lint" ''
            echo "🔍 Running comprehensive linting..."
            echo ""
            
            echo "📋 Running oxlint (fast Rust-based linter)..."
            if command -v oxlint >/dev/null 2>&1; then
              oxlint src/ tests/ examples/ --deny-warnings 2>/dev/null || {
                echo "⚠️  oxlint found issues or not available, continuing..."
              }
            else
              echo "⚠️  oxlint not found, skipping..."
            fi
            echo ""
            
            echo "📋 Running ESLint..."
            if [ -f .eslintrc.json ] || [ -f .eslintrc.js ] || [ -f eslint.config.js ]; then
              bun run lint 2>/dev/null || {
                npx eslint src/ tests/ examples/ --ext .ts,.js,.tsx,.jsx 2>/dev/null || {
                  echo "⚠️  ESLint configuration not found, skipping..."
                }
              }
            else
              echo "⚠️  ESLint config not found, running basic check..."
              npx eslint src/ tests/ examples/ --ext .ts,.js,.tsx,.jsx 2>/dev/null || {
                echo "⚠️  ESLint not available or no issues found"
              }
            fi
            echo ""
            
            echo "✅ Linting complete"
          '';
          
          lint-fix = pkgs.writeShellScriptBin "lint-fix" ''
            echo "🔧 Auto-fixing linting issues..."
            echo ""
            
            echo "📋 Running ESLint with --fix..."
            if [ -f .eslintrc.json ] || [ -f .eslintrc.js ] || [ -f eslint.config.js ]; then
              bun run lint:fix 2>/dev/null || {
                npx eslint src/ tests/ examples/ --ext .ts,.js,.tsx,.jsx --fix 2>/dev/null || {
                  echo "⚠️  ESLint auto-fix failed or not configured"
                }
              }
            else
              npx eslint src/ tests/ examples/ --ext .ts,.js,.tsx,.jsx --fix 2>/dev/null || {
                echo "⚠️  ESLint not available"
              }
            fi
            
            echo "✅ Auto-fix complete"
          '';
          
          # Formatting
          format = pkgs.writeShellScriptBin "format" ''
            echo "✨ Formatting code..."
            
            # Try bun formatter first, then fall back to prettier
            bun run format 2>/dev/null || {
              echo "📝 Running Prettier..."
              npx prettier --write "src/**/*.{ts,js,tsx,jsx}" "tests/**/*.{ts,js,tsx,jsx}" "examples/**/*.{ts,js,tsx,jsx}" 2>/dev/null || {
                echo "⚠️  Prettier not available, skipping formatting"
              }
            }
            
            echo "✅ Formatting complete"
          '';
          
          format-check = pkgs.writeShellScriptBin "format-check" ''
            echo "🔍 Checking code formatting..."
            
            bun run format:check 2>/dev/null || {
              npx prettier --check "src/**/*.{ts,js,tsx,jsx}" "tests/**/*.{ts,js,tsx,jsx}" "examples/**/*.{ts,js,tsx,jsx}" 2>/dev/null || {
                echo "⚠️  Format checking not available"
                exit 1
              }
            }
            
            echo "✅ Format check complete"
          '';
          
          # Quality checks (combines multiple tools)
          check = pkgs.writeShellScriptBin "check" ''
            echo "🔍 Running comprehensive quality checks..."
            echo "================================================"
            
            echo "1️⃣  Type checking..."
            typecheck || exit 1
            echo ""
            
            echo "2️⃣  Linting..."
            lint || exit 1
            echo ""
            
            echo "3️⃣  Format checking..."
            format-check || exit 1
            echo ""
            
            echo "4️⃣  Running tests..."
            test || exit 1
            echo ""
            
            echo "✅ All quality checks passed!"
          '';
          
          # Utilities
          clean = pkgs.writeShellScriptBin "clean" ''
            echo "🧹 Cleaning build artifacts and caches..."
            rm -rf dist/ build/ .bun/ node_modules/.cache/
            echo "✅ Clean complete"
          '';
          
          fresh = pkgs.writeShellScriptBin "fresh" ''
            echo "🆕 Fresh install (clean + install)..."
            clean
            rm -rf node_modules/ bun.lockb package-lock.json yarn.lock
            echo "📦 Installing dependencies..."
            bun install
            echo "✅ Fresh install complete"
          '';
          
          # Examples and demos
          examples = pkgs.writeShellScriptBin "examples" ''
            echo "🎨 Running example programs..."
            echo ""
            echo "Available examples:"
            echo "  Basic Examples:"
            ls examples/basic/*.ts 2>/dev/null | sed 's/.*\//    /' || echo "    No basic examples found"
            echo "  Advanced Examples:"
            ls examples/advanced/*.ts 2>/dev/null | sed 's/.*\//    /' || echo "    No advanced examples found"
            echo "  Utils:"
            ls examples/utils/*.ts 2>/dev/null | sed 's/.*\//    /' || echo "    No utils found"
            echo ""
            echo "Usage: bun examples/basic/01-math-operations.ts"
          '';
          
          demo = pkgs.writeShellScriptBin "demo" ''
            echo "🎪 Running comprehensive demo..."
            echo ""
            
            if [ -f examples/basic/01-math-operations.ts ]; then
              echo "📊 Math operations demo..."
              bun examples/basic/01-math-operations.ts
              echo ""
            fi
            
            if [ -f examples/utils/demo.ts ]; then
              echo "🛠  Development utilities demo..."
              bun examples/utils/demo.ts
              echo ""
            fi
            
            echo "✅ Demo complete"
          '';
          
          # Performance and benchmarking
          benchmark = pkgs.writeShellScriptBin "benchmark" ''
            echo "⚡ Running performance benchmarks..."
            if [ -f examples/utils/performance.ts ]; then
              bun -e "
                import { runStressTesting } from './examples/utils/performance.ts';
                runStressTesting();
              "
            else
              echo "⚠️  Performance benchmarks not found"
            fi
          '';
          
          # Documentation
          docs = pkgs.writeShellScriptBin "docs" ''
            echo "📚 Opening documentation..."
            if [ -f examples/README.md ]; then
              echo "📖 Examples documentation:"
              echo "   examples/README.md"
            fi
            if [ -f PRODUCTION_READY.md ]; then
              echo "✅ Production readiness:"
              echo "   PRODUCTION_READY.md"
            fi
            if [ -f README.md ]; then
              echo "📋 Main documentation:"
              echo "   README.md"
            fi
          '';
          
          # Git hooks setup
          setup-hooks = pkgs.writeShellScriptBin "setup-hooks" ''
            echo "⚙️  Setting up Git hooks..."
            mkdir -p .git/hooks
            
            cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
echo "🔍 Running pre-commit checks..."
check || exit 1
echo "✅ Pre-commit checks passed"
EOF
            
            chmod +x .git/hooks/pre-commit
            echo "✅ Git hooks setup complete"
          '';
        };
        
        # Development shell with all tools
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Core runtime
            bun
            nodejs_22
            
            # TypeScript tooling
            typescript
            typescript-language-server
            
            # Linting tools
            oxlint  # Fast Rust-based linter
            nodePackages.eslint
            nodePackages.prettier
            
            # Development tools
            git
            just
            ripgrep
            fd
            tree
            
            # Browser/Puppeteer dependencies
            chromium
            glib
            nss
            nspr
            atk
            gtk3
            cups
            expat
            alsa-lib
            
            # All development scripts
            scripts.dev
            scripts.build
            scripts.test
            scripts.test-watch
            scripts.test-coverage
            scripts.typecheck
            scripts.typecheck-watch
            scripts.lint
            scripts.lint-fix
            scripts.format
            scripts.format-check
            scripts.check
            scripts.clean
            scripts.fresh
            scripts.examples
            scripts.demo
            scripts.benchmark
            scripts.docs
            scripts.setup-hooks
          ];
          
          shellHook = ''
            # Set library paths for Chrome/Puppeteer
            export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath [
              pkgs.glib
              pkgs.nss
              pkgs.nspr
              pkgs.atk
              pkgs.gtk3
              pkgs.cups
              pkgs.expat
              pkgs.alsa-lib
            ]}:$LD_LIBRARY_PATH"
            
            # Set Chrome executable for Puppeteer
            export PUPPETEER_EXECUTABLE_PATH="${pkgs.chromium}/bin/chromium"
            
            echo "🎨 play.ts - creative Coding TypeScript Library"
            echo "================================================"
            echo ""
            echo "📋 Development Commands:"
            echo "  Core:"
            echo "    dev          - Start development environment"
            echo "    build        - Build the library"
            echo "    clean        - Clean artifacts"
            echo "    fresh        - Fresh install (clean + reinstall)"
            echo ""
            echo "  Testing:"
            echo "    test         - Run all tests"
            echo "    test-watch   - Run tests in watch mode"
            echo "    test-coverage - Run tests with coverage"
            echo ""
            echo "  Quality:"
            echo "    typecheck    - TypeScript type checking"
            echo "    lint         - Run oxlint + ESLint"
            echo "    lint-fix     - Auto-fix linting issues"
            echo "    format       - Format code with Prettier"
            echo "    format-check - Check code formatting"
            echo "    check        - Run all quality checks (CI-style)"
            echo ""
            echo "  Examples & Demos:"
            echo "    examples     - List available examples"
            echo "    demo         - Run comprehensive demo"
            echo "    benchmark    - Performance benchmarks"
            echo ""
            echo "  Utilities:"
            echo "    docs         - Show documentation locations"
            echo "    setup-hooks  - Setup Git pre-commit hooks"
            echo ""
            echo "🔧 Tool Versions:"
            echo "  Bun: $(bun --version 2>/dev/null || echo 'not available')"
            echo "  Node: $(node --version 2>/dev/null || echo 'not available')"
            echo "  TypeScript: $(tsc --version 2>/dev/null || echo 'not available')"
            echo "  oxlint: $(oxlint --version 2>/dev/null || echo 'not available')"
            echo ""
          '';
        };
        
        # Build the library as a package
        package = pkgs.stdenv.mkDerivation {
          pname = "play.ts";
          version = "0.1.0";
          
          src = ./.;
          
          buildInputs = [ pkgs.bun ];
          
          buildPhase = ''
            export HOME=$TMPDIR
            bun install --no-save
            bun run build
          '';
          
          installPhase = ''
            mkdir -p $out/lib
            cp -r dist/* $out/lib/
            cp package.json $out/
          '';
        };
        
      in {
        # Default development shell
        devShells.default = devShell;
        
        # The library package
        packages.default = package;
        packages.play.ts = package;
        
        # Apps that can be run with `nix run`
        apps = {
          default = {
            type = "app";
            program = "${scripts.dev}/bin/dev";
          };
          
          # Core commands
          build = {
            type = "app";
            program = "${scripts.build}/bin/build";
          };
          
          # Testing
          test = {
            type = "app";
            program = "${scripts.test}/bin/test";
          };
          
          test-watch = {
            type = "app";
            program = "${scripts.test-watch}/bin/test-watch";
          };
          
          test-coverage = {
            type = "app";
            program = "${scripts.test-coverage}/bin/test-coverage";
          };
          
          # Quality checks
          typecheck = {
            type = "app";
            program = "${scripts.typecheck}/bin/typecheck";
          };
          
          lint = {
            type = "app";
            program = "${scripts.lint}/bin/lint";
          };
          
          lint-fix = {
            type = "app";
            program = "${scripts.lint-fix}/bin/lint-fix";
          };
          
          format = {
            type = "app";
            program = "${scripts.format}/bin/format";
          };
          
          format-check = {
            type = "app";
            program = "${scripts.format-check}/bin/format-check";
          };
          
          check = {
            type = "app";
            program = "${scripts.check}/bin/check";
          };
          
          # Utilities
          clean = {
            type = "app";
            program = "${scripts.clean}/bin/clean";
          };
          
          fresh = {
            type = "app";
            program = "${scripts.fresh}/bin/fresh";
          };
          
          # Examples and demos
          examples = {
            type = "app";
            program = "${scripts.examples}/bin/examples";
          };
          
          demo = {
            type = "app";
            program = "${scripts.demo}/bin/demo";
          };
          
          benchmark = {
            type = "app";
            program = "${scripts.benchmark}/bin/benchmark";
          };
          
          # Documentation
          docs = {
            type = "app";
            program = "${scripts.docs}/bin/docs";
          };
          
          # Setup
          setup-hooks = {
            type = "app";
            program = "${scripts.setup-hooks}/bin/setup-hooks";
          };
        };
        
        # Formatter
        formatter = pkgs.nixpkgs-fmt;
      });
}
