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
  RemoteForward 47291 localhost:47291
```

Replace `<VM_IP_ADDRESS>` with the IP address found above.

#### Step 4: Bootstrap from macOS

**Note**: The following commands should be run on the **macOS host**, not inside the VM.

```shell
make lima/bootstrap
```

#### Step 5: Enable remote audio for Claude Notifier

To hear Claude Notifier sounds on macOS when using VS Code Remote-SSH against the VM, enable remote audio in the VS Code settings:

```json
"claudeNotifier.remoteAudio.enabled": true
```

Notification events are forwarded to the local `cn-daemon` through the `RemoteForward` entry configured in Step 3.

### NixOS VM Setup

#### Step 1: Create and Start VM

```shell
make vm/create
```

#### Step 2: Initial VM Configuration

1. After VM startup, log into the VM console and become the root user:

   ```shell
   sudo -i
   passwd
   ```

2. Find the VM's IP address (look for the `inet` address on `enp0s1` or similar interface):

   ```shell
   ip addr show
   ```

#### Step 3: Bootstrap from macOS

**Note**: The following commands should be run on your **macOS host**, not inside the VM.

1. Run the bootstrap command with the VM's IP address:

   ```shell
   make vm/bootstrap VM_IP=<VM_IP_ADDRESS>
   ```

   Replace `<VM_IP_ADDRESS>` with the actual IP address found in Step 2.

2. The NixOS installation will complete and the VM will automatically restart.

#### Step 4: Configure SSH Access

Add the following configuration to your `~/.ssh/config` file on macOS:

```config
Host sakura
  StrictHostKeyChecking no
  UserKnownHostsFile=/dev/null
  HostName <VM_IP_ADDRESS>
  RemoteForward 47291 localhost:47291
```

Replace:

- `<VM_IP_ADDRESS>` with the actual IP address from Step 2

#### Step 5: Final VM Setup

SSH into the VM and clone the repository:

```shell
ssh sakura
ghq get git@github.com:holidayworking/core.git
```
