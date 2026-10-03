# core

My development environment.

## Hosts

| Host   | Platform               | OS    |
| ------ | ---------------------- | ----- |
| aries  | Mac mini (M6)          | macOS |
| taurus | MacBook Air (M2, 2022) | macOS |
| cancer | Amazon EC2             | NixOS |

## Setup

### macOS Setup

#### Step 1: Clone the repository

```shell
mkdir -p ~/src/github.com/holidayworking
cd ~/src/github.com/holidayworking
git clone git@github.com:holidayworking/core.git
cd core
```

#### Step 2: Place the SOPS age key

```shell
mkdir -p ~/.config/sops/age
echo "<AGE_PRIVATE_KEY>" > ~/.config/sops/age/keys.txt
chmod 600 ~/.config/sops/age/keys.txt
```

#### Step 3: Run the setup

Pass the machine's host name from the [Hosts](#hosts) table via `HOST`. The
host name is not configured yet at this point, so it cannot be detected
automatically.

```shell
make darwin/setup HOST=aries
```

### NixOS Setup (Amazon EC2)

Run these steps from a macOS host set up as above. The AMI is built with the
nix-darwin `linux-builder`, and all AWS commands use the `main` profile.

#### Step 1: Build and upload the AMI

Build the AMI, upload it to EC2, and store its ID in the SSM parameter
`/core/computing/cancer/ami-id`.

```shell
aws sso login --profile main
make nixos/build-ami
```

#### Step 2: Store the Tailscale auth key

The instance reads this key at boot to join the Tailscale network.

Generate a non-reusable, non-ephemeral key on the
[Keys](https://login.tailscale.com/admin/settings/keys) page of the Tailscale
admin console. Keys expire within 90 days, so generate a new one whenever the
instance is recreated.

```shell
aws ssm put-parameter \
  --name /core/computing/cancer/tailscale-auth-key \
  --value "<TAILSCALE_AUTH_KEY>" \
  --type SecureString \
  --overwrite \
  --profile main
```

#### Step 3: Deploy the stack

Deploy `CoreStack`, which launches the instance from the AMI.

```shell
vp exec --filter @infrastructures/aws cdk deploy CoreStack --profile main
```

#### Step 4: Place the SOPS age key

Once the instance has joined the Tailscale network, copy the age key from this
host. `cancer` is resolved by Tailscale MagicDNS. The `sops-nix` service fails
at first boot because the key is missing, so restart it to decrypt the secrets.

```shell
ssh cancer "mkdir -p ~/.config/sops/age"
scp ~/.config/sops/age/keys.txt cancer:~/.config/sops/age/keys.txt
ssh cancer "chmod 600 ~/.config/sops/age/keys.txt"
ssh cancer "systemctl --user restart sops-nix"
```

#### Step 5: Apply the configuration

Build and switch to the latest configuration on `cancer` over SSH. The build
runs on `cancer` itself.

```shell
make nix/switch TARGET_HOST=cancer
```
