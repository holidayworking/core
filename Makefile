.ONESHELL:

darwin/setup: nix/install nix/darwin colima/start

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

colima/start:
	@colima start default --cpus 4 --memory 8 --vm-type vz --vz-rosetta --mount ~/:w --mount /private:w --mount-inotify=true

vm/create:
	@./scripts/vm-create.sh

vm/bootstrap:
	@./scripts/vm-bootstrap.sh

vm/setup:
	@./scripts/vm-setup.sh
