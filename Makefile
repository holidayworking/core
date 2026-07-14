.ONESHELL:

darwin/setup: nix/install nix/darwin

nix/install:
	@curl --fail --silent --show-error --location https://install.determinate.systems/nix | sh -s -- install --prefer-upstream-nix

nix/darwin:
	. /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh \
		&& sudo nix run nix-darwin/master#darwin-rebuild -- switch --flake .#aries

nix/build:
	@./scripts/nh.sh build

nix/switch:
	@./scripts/nh.sh switch --ask

nix/clean:
	@nh clean all --ask --no-direnv

lima/build-image:
	@nix build .#packages.aarch64-linux.lima

lima/start:
	@limactl start --name=default --tty=false ./lima.yaml

lima/bootstrap:
	@ssh gemini "mkdir -p ~/.config/sops/age"
	@scp ~/.config/sops/age/keys.txt gemini:~/.config/sops/age/keys.txt
	ssh gemini bash -s <<'SSH'
	  set -euo pipefail
	  ssh-keygen -F github.com || ssh-keyscan github.com >> ~/.ssh/known_hosts
	  mkdir -p ~/src/github.com/holidayworking
	  cd ~/src/github.com/holidayworking
	  git clone git@github.com:holidayworking/core.git
	  cd core
	  sudo nixos-rebuild switch --flake ".#gemini"
	SSH
