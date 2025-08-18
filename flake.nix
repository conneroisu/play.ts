{
  description = "play.ts - TypeScript library for creative coding";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    treefmt-nix.url = "github:numtide/treefmt-nix";
    treefmt-nix.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = {
    nixpkgs,
    flake-utils,
    treefmt-nix,
    ...
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = import nixpkgs {
        inherit system;
        overlays = [
        ];
      };

      rooted = exec:
        builtins.concatStringsSep "\n"
        [
          ''
            REPO_ROOT=$(git rev-parse --show-toplevel)
            export REPO_ROOT
          ''
          exec
        ];

      scripts = {
        dx = {
          exec = rooted ''
            $EDITOR "$REPO_ROOT"/flake.nix
          '';
          deps = [pkgs.git];
          description = "Edit flake.nix";
        };
        lint = {
          exec = rooted ''
            cd "$REPO_ROOT"
            bun run typecheck
            oxlint --fix
            biome lint --fix
            cd -
          '';
          deps = [pkgs.bun pkgs.oxlint pkgs.biome];
          description = "Lint the project using bun";
        };
        tests = {
          exec = ''
            bun test
          '';
          deps = [pkgs.pkg-config pkgs.cargo pkgs.openssl pkgs.openssl.dev];
          description = "Run tests with bun";
        };
      };

      scriptPackages =
        pkgs.lib.mapAttrs
        (
          name: script: let
            scriptType = script.type or "app";
          in
            if script != {}
            then
              if scriptType == "script"
              then pkgs.writeShellScriptBin name script.exec
              else
                pkgs.writeShellApplication {
                  inherit name;
                  bashOptions = scripts.baseOptions or ["errexit" "pipefail" "nounset"];
                  text = script.exec;
                  runtimeInputs = script.deps or [];
                }
            else null
        )
        scripts;

      shellHook = ''
        echo "🔥 Play TS Development Environment"
        export NIX_CONFIG="experimental-features = nix-command flakes"
      '';
    in {
      devShells = {
        default = pkgs.mkShell {
          env = {
            NIX_CONFIG = "cores = 4\nmax-jobs = 4";
            NODE_OPTIONS = "--max-old-space-size=4096";
          };
          packages =
            (with pkgs; [
              alejandra # Nix
              nixd
              statix
              deadnix
              just
              man
              sqlite

              flyctl
              stripe-cli
              infisical

              eslint
              sqlite-web
              oxlint
              bun
              protobuf
              openssl
              openssl.dev
              pkg-config
              docker # Docker CLI
              skopeo # Container image operations
              biome
              typescript-language-server
              vscode-langservers-extracted
              tailwindcss-language-server
              yaml-language-server
            ])
            ++ builtins.attrValues scriptPackages;
          inherit shellHook;
        };
      };

      apps =
        pkgs.lib.mapAttrs
        (name: script: {
          type = "app";
          program = "${scriptPackages.${name}}/bin/${name}";
        })
        (pkgs.lib.filterAttrs (_: script: script != {}) scripts);

      formatter = let
        treefmtModule = {
          projectRootFile = "flake.nix";
          programs = {
            alejandra.enable = true; # Nix formatter
            rustfmt.enable = true; ### Rust formatter
            biome.enable = true; ### TypeScript formatter
          };
          settings.formatter.biome = {
            command = "${pkgs.biome}/bin/biome";
            # options = ["format" "--write"];
            includes = ["*.ts" "*.tsx" "*.astro"];
          };
        };
      in
        treefmt-nix.lib.mkWrapper pkgs treefmtModule;
    });
}
