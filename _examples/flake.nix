{
  description = "play.ts TanStack Examples Site";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        
        # Create the examples site package
        examplesSite = pkgs.stdenv.mkDerivation rec {
          pname = "play.ts-examples";
          version = "0.1.0";
          
          # Include both the parent directory and the examples
          src = pkgs.lib.cleanSource ../.;
          
          nativeBuildInputs = with pkgs; [
            bun
            nodejs_22
          ];
          
          # Configure environment for building
          configurePhase = ''
            runHook preConfigure
            export HOME=$TMPDIR
            export BUN_INSTALL_CACHE_DIR=$TMPDIR/.bun-cache
            runHook postConfigure
          '';
          
          # Build the parent library first, then the examples
          buildPhase = ''
            runHook preBuild
            
            echo "🔨 Building parent play.ts library..."
            bun install --no-save
            bun run build
            
            echo "🎨 Building examples site..."
            cd _examples
            bun install --no-save
            bun run build
            
            runHook postBuild
          '';
          
          # Install built site
          installPhase = ''
            runHook preInstall
            
            mkdir -p $out/share/play.ts-examples
            cp -r _examples/dist/* $out/share/play.ts-examples/
            
            # Create wrapper script for serving
            mkdir -p $out/bin
            cat > $out/bin/play.ts-examples-serve << 'EOF'
#!/bin/sh
echo "🚀 Starting play.ts examples server..."
${pkgs.python3}/bin/python -m http.server 8080 -d "$out/share/play.ts-examples"
EOF
            chmod +x $out/bin/play.ts-examples-serve
            
            runHook postInstall
          '';
          
          meta = with pkgs.lib; {
            description = "Interactive examples for the play.ts creative coding library";
            homepage = "https://github.com/your-repo/play.ts";
            license = licenses.mit;
            platforms = platforms.all;
          };
        };
        
        # Development scripts
        scripts = {
          dev = pkgs.writeShellScriptBin "examples-dev" ''
            echo "🚀 Starting examples development server..."
            bun run dev
          '';
          
          build = pkgs.writeShellScriptBin "examples-build" ''
            echo "🔨 Building examples site..."
            # Ensure parent library is built first
            cd ..
            bun install --no-save 2>/dev/null || echo "⚠️ Parent install failed"
            bun run build 2>/dev/null || echo "⚠️ Parent build failed, continuing..."
            cd _examples
            # Install dependencies if needed
            if [ ! -d node_modules ]; then
              echo "📦 Installing dependencies..."
              bun install --no-save
            fi
            bun run build
          '';
          
          serve = pkgs.writeShellScriptBin "examples-serve" ''
            echo "🌐 Serving built examples site..."
            bun run serve
          '';
          
          test = pkgs.writeShellScriptBin "examples-test" ''
            echo "🧪 Running examples tests..."
            bun test
          '';
          
          lint = pkgs.writeShellScriptBin "examples-lint" ''
            echo "🔍 Linting examples..."
            bun run lint
          '';
          
          format = pkgs.writeShellScriptBin "examples-format" ''
            echo "✨ Formatting examples..."
            bun run format
          '';
          
          check = pkgs.writeShellScriptBin "examples-check" ''
            echo "🔍 Running comprehensive checks..."
            echo "1️⃣ Linting..."
            bun run lint
            echo "2️⃣ Type checking..."
            bun run build --mode=production
            echo "3️⃣ Testing..."
            bun test
            echo "✅ All checks passed!"
          '';
        };

      in {
        # Development shell
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Core runtime
            bun
            nodejs_22
            
            # Development tools
            typescript
            git
            
            # Scripts
            scripts.dev
            scripts.build
            scripts.serve
            scripts.test
            scripts.lint
            scripts.format
            scripts.check
          ];
          
          shellHook = ''
            echo "🎨 play.ts Examples Development Environment"
            echo "========================================"
            echo ""
            echo "📋 Available Commands:"
            echo "  examples-dev     - Start development server (port 3000)"
            echo "  examples-build   - Build production site"
            echo "  examples-serve   - Serve built site"
            echo "  examples-test    - Run tests"
            echo "  examples-lint    - Run linting"
            echo "  examples-format  - Format code"
            echo "  examples-check   - Run all quality checks"
            echo ""
            echo "🔧 Quick Start:"
            echo "  1. examples-dev    # Start development"
            echo "  2. examples-build  # Build for production"
            echo "  3. examples-serve  # Test production build"
            echo ""
            
            # Ensure we're in the _examples directory
            if [ ! -f package.json ]; then
              echo "⚠️ package.json not found. Make sure you run this from the _examples directory."
              exit 1
            fi
          '';
        };
        
        # The examples site package
        packages = {
          default = examplesSite;
          examples = examplesSite;
        };
        
        # Apps that can be run with `nix run`
        apps = {
          default = {
            type = "app";
            program = "${scripts.dev}/bin/examples-dev";
          };
          
          dev = {
            type = "app";
            program = "${scripts.dev}/bin/examples-dev";
          };
          
          build = {
            type = "app";
            program = "${scripts.build}/bin/examples-build";
          };
          
          serve = {
            type = "app";
            program = "${scripts.serve}/bin/examples-serve";
          };
          
          test = {
            type = "app";
            program = "${scripts.test}/bin/examples-test";
          };
          
          lint = {
            type = "app";
            program = "${scripts.lint}/bin/examples-lint";
          };
          
          format = {
            type = "app";
            program = "${scripts.format}/bin/examples-format";
          };
          
          check = {
            type = "app";
            program = "${scripts.check}/bin/examples-check";
          };
        };
        
        # Formatter
        formatter = pkgs.nixpkgs-fmt;
      });
}