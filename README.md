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
