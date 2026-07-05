# core

My development environment.

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

Retrieve the age private key from the password manager and run:

```shell
mkdir -p ~/.config/sops/age
echo "<AGE_PRIVATE_KEY>" > ~/.config/sops/age/keys.txt
chmod 600 ~/.config/sops/age/keys.txt
```

#### Step 3: Run the setup

```shell
make darwin/setup
```

### Lima Setup

#### Step 1: Build image

```shell
make lima/build-image
```

#### Step 2: Start VM

```shell
make lima/start
```

#### Step 3: Configure SSH Access

Find the VM's IP address:

```shell
lima ip addr show enp0s2
```

Note the `inet` address (e.g., `192.168.65.2`).

Add the following configuration to `~/.ssh/config` on macOS:

```config
Host gemini
  IdentityFile "~/.lima/_config/user"
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null
  Hostname <VM_IP_ADDRESS>
```

Replace `<VM_IP_ADDRESS>` with the IP address found above.

#### Step 4: Bootstrap from macOS

**Note**: The following commands should be run on the **macOS host**, not inside the VM.

```shell
make lima/bootstrap
```
