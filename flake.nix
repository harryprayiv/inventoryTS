{
  # Use the unstable nixpkgs to use the latest set of node packages
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/master";

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem
    (system: let
      pkgs = import nixpkgs {
        inherit system;
      };
    in rec {
      defaultApp = flake-utils.lib.mkApp {
        type = "app";
        drv = live-server;
      };
      live-server = pkgs.nodePackages.live-server;
      typescript = pkgs.nodePackages.typescript;
    # in {
      devShells.default = pkgs.mkShell {
        buildInputs = [
          pkgs.nodejs
          # You can set the major version of Node.js to a specific one
          # pkgs.nodejs-19_x

          pkgs.nodePackages.pnpm
          # pkgs.yarn

          pkgs.nodePackages.live-server

          pkgs.nodePackages.typescript
          pkgs.nodePackages.typescript-language-server
        ];
      };
        apps = {
          live-server = {
            type = "app";
            program = "${live-server}/bin/live-server";
          };

          typescript = {
            type = "app";
            program = "${typescript}/bin/typescript";
          };
        };
    });
}
