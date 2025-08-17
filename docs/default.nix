{ pkgs, lib, ... }:

pkgs.stdenv.mkDerivation {
  pname = "play-ts-docs";
  version = "1.0.0";

  src = ./.;

  nativeBuildInputs = with pkgs; [
    bun
    nodejs_20
  ];

  buildPhase = ''
    export HOME=$TMPDIR
    
    echo "🔧 Installing dependencies..."
    bun install
    
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

  meta = with lib; {
    description = "Documentation site for play.ts - TypeScript library for creative coding";
    homepage = "https://github.com/play-ts/play.ts";
    license = licenses.mit;
    platforms = platforms.linux ++ platforms.darwin;
  };
}