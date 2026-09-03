.ONESHELL:

darwin/setup: nix/install nix/darwin colima/start

nix/install:
	@curl --fail --silent --show-error --location https://install.determinate.systems/nix | sh -s -- install --prefer-upstream-nix

nix/darwin:
	. /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh \
		&& sudo nix run nix-darwin/master#darwin-rebuild -- switch --flake .#aries

nix/build:
	@nh darwin build --hostname "$$(hostname)" .

nix/switch:
	@nh darwin switch --hostname "$$(hostname)" --ask .

nix/clean:
	@nh clean all --ask --no-direnv

colima/start:
	@colima start default --cpus 4 --memory 8 --vm-type vz --vz-rosetta --mount ~/:w --mount /private:w --mount-inotify=true
