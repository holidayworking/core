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
	@nh clean all --ask

vm/create:
	@./scripts/vm-create.sh

vm/bootstrap:
	@./scripts/vm-bootstrap.sh
