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

```shell
mkdir -p ~/.config/sops/age
echo "<AGE_PRIVATE_KEY>" > ~/.config/sops/age/keys.txt
chmod 600 ~/.config/sops/age/keys.txt
```

#### Step 3: Run the setup

```shell
make darwin/setup
```

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

SSH into the VM and clone the repository:

1. Run the bootstrap command with the VM's IP address:

   ```shell
   make vm/bootstrap VM_IP=<VM_IP_ADDRESS>
   ```

   Replace `<VM_IP_ADDRESS>` with the actual IP address found in Step 2.

2. The NixOS installation will complete and the VM will automatically restart.
