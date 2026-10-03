.ONESHELL:

darwin/setup: check/host nix/install nix/darwin

check/host:
	@if [ -z "$(HOST)" ]; then echo "HOST is required (e.g. make $(MAKECMDGOALS) HOST=aries)" >&2; exit 1; fi

nix/install:
	@curl --fail --silent --show-error --location https://artifacts.nixos.org/nix-installer | sh -s -- install --enable-flakes

nix/darwin: check/host
	. /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh \
		&& sudo nix run nix-darwin/master#darwin-rebuild -- switch --flake .#$(HOST)

nix/build:
	@./scripts/nh.sh build

nix/switch:
	@./scripts/nh.sh switch --ask

nix/clean:
	@nh clean all --ask --no-direnv

nixos/build-ami: HOST = cancer
nixos/build-ami:
	@export AWS_PROFILE=main \
		&& nix build .#nixosConfigurations.$(HOST).config.system.build.amazonImage --print-build-logs \
		&& image_ids=$$(nix run .#upload-ami -- \
			--image-info ./result/nix-support/image-info.json \
			--ebs-direct \
			--prefix $(HOST)- \
			--run-id $$(date +%Y%m%d%H%M%S)) \
		&& echo "$$image_ids" \
		&& aws ssm put-parameter \
			--name /core/computing/$(HOST)/ami-id \
			--type String \
			--value "$$(jq -r '.[keys[0]]' <<< "$$image_ids")" \
			--overwrite
