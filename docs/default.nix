{ pkgs, lib, bun2nix ? null, ... }:

let
  # Try to use bun2nix if available, otherwise fall back to fetching deps ourselves  
  buildInputs = with pkgs; [
    bun
    nodejs_20
    cacert  # for HTTPS requests
  ];
in

pkgs.stdenv.mkDerivation {
  pname = "play-ts-docs";
  version = "1.0.0";

  src = ./.;

  nativeBuildInputs = buildInputs;

  configurePhase = ''
    export HOME=$TMPDIR
    export SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt
    export BUN_INSTALL_CACHE_DIR=$TMPDIR/.bun-cache
    
    echo "🔧 Setting up build environment..."
  '';

  buildPhase = ''
    echo "📦 Installing dependencies with network access..."
    
    # Allow network access for dependency installation
    bun install --frozen-lockfile --no-save
    
    echo "🏗️ Building Astro site..."
    bun run build
    
    echo "✅ Build complete"
  '';

  installPhase = ''
    mkdir -p $out
    cp -r dist/* $out/
    
    # Create .nojekyll file for GitHub Pages
    touch $out/.nojekyll
    
    # Create CNAME file if needed (uncomment and modify for custom domain)
    # echo "docs.play-ts.com" > $out/CNAME
  '';

  # Allow network access during build (not usually recommended but needed for npm/bun installs)
  __noChroot = true;

  meta = with lib; {
    description = "Documentation site for play.ts - TypeScript library for creative coding";
    homepage = "https://github.com/play-ts/play.ts";
    license = licenses.mit;
    platforms = platforms.linux ++ platforms.darwin;
  };
}