# core

My development environment.

## Hosts

| Host   | Platform               | OS    |
| ------ | ---------------------- | ----- |
| aries  | Mac mini (M6)          | macOS |
| taurus | MacBook Air (M2, 2022) | macOS |
| gemini | MacBook Air (M2, 2022) | NixOS |
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

### NixOS Setup

#### MacBook Air

##### Step 1: Write the installer ISO to a USB drive

Download the installer ISO from the
[nixos-apple-silicon releases](https://github.com/nix-community/nixos-apple-silicon/releases)
page and write it to a USB drive from a macOS host.

Check the disk identifier of the USB drive with `diskutil list external` and
replace `disk5` below accordingly; writing to the wrong disk destroys its data.
Writing to the raw device (`/dev/rdiskN`) is much faster than `/dev/diskN`.
Replace the ISO file name with the one you downloaded.

```shell
diskutil list external
diskutil unmountDisk /dev/disk5
sudo /bin/dd if=~/Downloads/nixos-26.11.20260723.e2587ca-aarch64-linux.iso of=/dev/rdisk5 bs=4m status=progress
sync && diskutil eject /dev/disk5
```

##### Step 2: Install the UEFI environment

On the MacBook Air itself, still booted into macOS, run the Asahi Linux
installer. It shrinks the macOS partition and installs the UEFI boot
environment (m1n1 and U-Boot) that boots the NixOS installer from the USB drive.
When asked which OS to install, choose
`UEFI environment only (m1n1 + U-Boot + ESP)`, then follow the instructions it
prints to finish the setup.

```shell
curl https://alx.sh | sh
```

##### Step 3: Boot the installer and enable SSH

Shut down the MacBook Air, plug in the USB drive, and power it on. U-Boot boots
the installer from the USB drive. If it boots the internal disk instead, press a
key to stop autoboot, run `eficonfig`, move `usb 0` to the top of the boot
order, save, and run `boot`.

On the installer's console, prepare to log in as root over SSH. The SSH server
is already running, but root has an empty password and cannot log in until one
is set.

```shell
sudo -i
nmcli device wifi connect "<SSID>" --ask
ip -4 addr show wlan0
passwd
```

The remaining steps run over SSH as root from another host on the same network.

```shell
ssh root@<IP_ADDRESS>
```

##### Step 4: Create the root partition

Create a partition in the free space, check its number (type code `8300`,
usually second to last), and format it. Never touch the first
(`iBootSystemContainer`) or last (`RecoveryOSContainer`) partition, and do not
use an automated partitioner; damaging them can make the Mac unbootable.

```shell
sgdisk /dev/nvme0n1 -n 0:0 -s
sgdisk /dev/nvme0n1 -p
mkfs.ext4 -L nixos /dev/nvme0n1p<N>
```

##### Step 5: Install a minimal system

Install a minimal system first. The `gemini` configuration uses a different
nixpkgs from the installer, so `nixos-install` would build the kernel in the
installer environment, which is generally not possible due to its memory
limitations. The minimal system uses the installer's nixpkgs, so its kernel is
copied from the installer instead.

```shell
mount /dev/disk/by-label/nixos /mnt
mkdir -p /mnt/boot
mount /dev/disk/by-partuuid/$(cat /proc/device-tree/chosen/asahi,efi-system-partition) /mnt/boot
nixos-generate-config --root /mnt
cp -r /etc/nixos/apple-silicon-support /mnt/etc/nixos/
chmod -R +w /mnt/etc/nixos/
nano /mnt/etc/nixos/configuration.nix
```

Add the following to `configuration.nix`.

```nix
imports = [
  ./hardware-configuration.nix
  ./apple-silicon-support
];

hardware.asahi.enable = true;

boot.loader.systemd-boot.enable = true;

networking.networkmanager.enable = true;
networking.networkmanager.wifi.backend = "iwd";

nix.settings.experimental-features = [ "nix-command" "flakes" ];
environment.systemPackages = [ pkgs.git ];

services.openssh.enable = true;
security.sudo.wheelNeedsPassword = false;

users.groups.hidekazu.gid = 1000;
users.users.hidekazu = {
  isNormalUser = true;
  uid = 1000;
  group = "hidekazu";
  extraGroups = [ "wheel" "networkmanager" ];
  initialPassword = "hidekazu";
  openssh.authorizedKeys.keys = [
    "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIL8Zoej4KoXnIYd9g2ocJXHyYAtNUlaSWtq84aIuAFhq"
  ];
};
```

Install the system and set the root password when prompted. Keep the root
password for console access in an emergency.

```shell
systemctl restart systemd-timesyncd
nixos-install
reboot
```

After rebooting, log in as `hidekazu` on the console.

```shell
passwd
nmcli device wifi connect "<SSID>" --ask
ip -4 addr show wlan0
```

##### Step 6: Place the SOPS age key

Copy the age key from this host before switching to the `gemini` configuration;
otherwise `sops-nix` fails and the switch fails with it.

```shell
ssh <IP_ADDRESS> "mkdir -p ~/.config/sops/age"
scp ~/.config/sops/age/keys.txt <IP_ADDRESS>:~/.config/sops/age/keys.txt
ssh <IP_ADDRESS> "chmod 600 ~/.config/sops/age/keys.txt"
```

##### Step 7: Switch to the `gemini` configuration

The `asahi-firmware` flake input is an empty directory in the repository, so
override it with the firmware the Asahi Linux installer extracted to the ESP.
Building the kernel can take a long time, so consider running this inside
`tmux` (`nix-shell -p tmux`).

```shell
ssh <IP_ADDRESS>
mkdir -p ~/src/github.com/holidayworking
cd ~/src/github.com/holidayworking
git clone https://github.com/holidayworking/core.git
cd core
sudo nixos-rebuild switch --flake .#gemini --override-input asahi-firmware path:/boot/vendorfw
```

##### Step 8: Join the Tailscale network

Authenticate in the browser using the URL it prints. After that, `gemini` is
resolved by Tailscale MagicDNS.

```shell
sudo tailscale up
```

From now on, apply configuration changes on `gemini` with `make nix/switch`.

#### Amazon EC2

Run these steps from a macOS host set up as above. The AMI is built with the
nix-darwin `linux-builder`, and all AWS commands use the `main` profile.

##### Step 1: Build and upload the AMI

Build the AMI, upload it to EC2, and store its ID in the SSM parameter
`/core/computing/cancer/ami-id`.

```shell
aws sso login --profile main
make nixos/build-ami
```

##### Step 2: Store the Tailscale auth key

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

##### Step 3: Deploy the stack

Deploy `CoreStack`, which launches the instance from the AMI.

```shell
vp exec --filter @infrastructures/aws cdk deploy CoreStack --profile main
```

##### Step 4: Place the SOPS age key

Once the instance has joined the Tailscale network, copy the age key from this
host. `cancer` is resolved by Tailscale MagicDNS. The `sops-nix` service fails
at first boot because the key is missing, so restart it to decrypt the secrets.

```shell
ssh cancer "mkdir -p ~/.config/sops/age"
scp ~/.config/sops/age/keys.txt cancer:~/.config/sops/age/keys.txt
ssh cancer "chmod 600 ~/.config/sops/age/keys.txt"
ssh cancer "systemctl --user restart sops-nix"
```

##### Step 5: Apply the configuration

Build and switch to the latest configuration on `cancer` over SSH. The build
runs on `cancer` itself.

```shell
make nix/switch TARGET_HOST=cancer
```
