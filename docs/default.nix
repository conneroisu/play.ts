{ pkgs, lib, ... }:

pkgs.buildBunPackage {
  pname = "play-ts-docs";
  version = "1.0.0";

  src = ./.;

  bunLockFile = ./bun.lock;
  
  installPhase = ''
    bun run build
    mkdir -p $out
    cp -r dist/* $out/
    
    # Create .nojekyll file for GitHub Pages
    touch $out/.nojekyll
  '';

  meta = with lib; {
    description = "Documentation site for play.ts - TypeScript library for creative coding";
    homepage = "https://github.com/play-ts/play.ts";
    license = licenses.mit;
    platforms = platforms.linux ++ platforms.darwin;
  };
}