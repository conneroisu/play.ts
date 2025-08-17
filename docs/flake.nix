{
  description = "play.ts documentation site built with Astro";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    bun2nix.url = "github:baileyluTCD/bun2nix";
    bun2nix.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = { self, nixpkgs, flake-utils, bun2nix }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        packages = {
          default = self.packages.${system}.docs-site;
          
          docs-site = pkgs.callPackage ./default.nix {
            inherit (bun2nix.lib.${system}) mkBunDerivation;
          };
        };

        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            bun
            nodejs_20
            bun2nix.packages.${system}.default
          ];
          
          shellHook = ''
            echo "🚀 play.ts docs development environment"
            echo "Available commands:"
            echo "  bun run dev    - Start development server"
            echo "  bun run build  - Build for production"
            echo "  bun2nix        - Generate bun.nix"
            echo "  nix build      - Build with Nix"
          '';
        };
      }
    );
}