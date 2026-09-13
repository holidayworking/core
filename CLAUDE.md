<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] `vp check` only lints/formats code (Oxlint/Oxfmt). For Markdown content (e.g. `apps/zenn`, docs), also run root-level `pnpm lint` (cspell, markdownlint, textlint) and `pnpm fix` to autofix.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

## Running Commands

- If `vp` is not in PATH, use `node_modules/.bin/vp` from the repo root.
- To run a command scoped to a package: `vp exec --filter @<scope> <cmd>` (e.g., `vp exec --filter @infrastructures/aws cdk synth`).
- To update Vitest snapshots: `vp exec --filter @<scope> vp test -- --update`.

## Pull Requests

- Test Plan sections should only list manual verification steps. Omit anything already covered by CI (`vp check`, `vp test`, `cdk synth`/`cdk diff`, `nix flake check`, etc.).
- Do not include the Claude-Session remote session URL in commit messages or PR descriptions.

## Package Naming

- Avoid bare names that collide with Node.js built-ins (e.g. `constants`, `path`, `fs`). Use scoped names like `@core/<name>` instead — with `moduleResolution: "nodenext"` and `@types/node`, TypeScript resolves bare built-in names to the Node.js type declarations rather than the workspace package.
- `vp check --fix` auto-sorts imports; no need to maintain import order manually.

<!--VITE PLUS END-->

## Architecture

This monorepo mixes two toolchains:

- JS/TS workspaces managed by Vite+ (`vp`): `apps/hugo` (Hugo static site), `apps/radicast` and `apps/zenn` (a Zenn articles/books repo), `infrastructures/aws` (`@infrastructures/aws`, shared AWS CDK), `packages/constants` (`@core/constants`). `apps/radicast` also has its own `cdk.out`/`bin/` — it's a separate CDK app, not just a library.
- Nix system configuration under `nix/`: `nix/hosts` (per-machine entry points: `aries`/`taurus` are macOS/darwin desktop/laptop hosts, `leo` is an `aarch64-linux` NixOS server — `type = "server"`, so `host.isPC` is false for it), `nix/modules/{config,programs,toplevel}`, `nix/overlays`, `nix/packages`, `nix/secrets` (SOPS-encrypted; requires the age key from `~/.config/sops/age/keys.txt`, see README).

## Nix Modules

- Module function arguments follow this order: `delib, host, inputs, lib, pkgs, config, ...` (include only what's actually used).
- `delib` is the `denix` flake input's module DSL (aliased in module args, not a typo).
- Platform/role-specific modules gate on a host predicate: `options = delib.singleEnableOption host.isDarwin;` (or `host.isPC`) plus `darwin.ifEnabled` / `home.ifEnabled`. Modules that apply to every host use `darwin.always` / `home.always` directly.
- `host.isPC` comes from denix (`type = "desktop"` / `"laptop"`); `host.isDarwin` is defined by `hostPlatformSubmodule` in `flake.nix`.
- `home.ifEnabled` CAN take `imports` — denix (`lib/configurations/module.nix`) feeds the whole value, wrapped in `lib.mkIf enabled (...)`, as one definition of the `home-manager.users.<user>` submodule option; when disabled, that definition (imports included) is dropped entirely by the submodule merge, so a module imported only via a disabled `home.ifEnabled` leaves its options completely undeclared (not just defaulted). What it cannot do is receive `config`/`lib` as a function argument: denix's `wrap` calls a lambda `home.ifEnabled` with only `{ name, myconfig, cfg, parent }`, so `home.ifEnabled = { config, ... }: { ... }` fails with `function 'ifEnabled' called without required argument 'config'`. To reach `config` (e.g. `config.sops.templates`, or another module's option like `config.mcp-servers`), nest a real module inside `imports` instead: `home.ifEnabled = { imports = [ ({ config, ... }: { ... }) ]; ...; };` — see `nix/modules/programs/claude-code.nix` and `nix/modules/programs/claude.nix`. The `home.always = { cfg, ... }: { imports = [ ({ config, lib, ... }: { config = lib.mkIf cfg.enable { ... }; }) ]; }` form is only needed when the module's _options_ must stay declared even while disabled (e.g. so other modules can still reference `config.<name>` unconditionally); no module in this repo currently needs that.
- To apply Nix changes: `make nix/build` (dry build) or `make nix/switch` (build + activate), both wrapping `nh darwin` for the current host (`$(hostname)`). Initial setup only: `make darwin/setup HOST=<name>` (defaults to `aries`; hostname isn't configured yet at that point) — see README.md.
