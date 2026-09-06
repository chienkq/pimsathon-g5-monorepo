# Pimsathon G5 Monorepo

<!-- TODO: describe the project — what it does, who it's for, and why it exists. -->

> [TODO: one to three sentences describing the project]

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites

- [Node.js](https://nodejs.org/) `22.22.0` (see [.node-version](.node-version) / [.mise.toml](.mise.toml) — use [mise](https://mise.jdx.dev/) or [nvm](https://github.com/nvm-sh/nvm) to install the right version automatically)
- [pnpm](https://pnpm.io/) `11.10.0` (enable via `corepack enable` or install directly)

## Getting Started

```bash
# Clone the repo (including submodules)
git clone --recurse-submodules <repo-url>
cd pimsathon-g5-monorepo

# If you already cloned without --recurse-submodules:
git submodule update --init --recursive

# Install dependencies
pnpm install

# Start all apps in dev mode
pnpm dev
```

## Project Structure

This is a [Turborepo](https://turborepo.dev/)-managed monorepo using [pnpm workspaces](https://pnpm.io/workspaces).

```
.
├── apps/               # Deployable applications
│   ├── workflow-manager/
│   └── admin-ui/        # Git submodule → LamNP1/PiMSathonG5Tool
├── packages/           # Shared libraries, configs, and utilities
├── .gitmodules          # Git submodule definitions
├── turbo.json          # Turborepo task pipeline
├── pnpm-workspace.yaml # Workspace + dependency catalog definition
├── eslint.config.js     # Lint rules (ESLint)
├── .oxfmtrc.json        # Format rules (oxfmt)
└── .npmrc               # pnpm install/resolution behavior
```

`apps/admin-ui` is a **git submodule** pointing at a separate repo
([`LamNP1/PiMSathonG5Tool`](https://github.com/LamNP1/PiMSathonG5Tool)), not a regular workspace
package copied into this repo. Its own tooling (npm, ESLint config, etc.) is intentionally left
untouched — see [Available Scripts](#available-scripts) for what that means for the root-level
`check:*`/`fix:*` commands.

Add further apps/packages with `pnpm create` / a manual `package.json` and they'll be picked up
automatically by the workspace glob.

## Available Scripts

Run from the repo root; each fans out to every workspace package via Turborepo.

| Script              | Description                               |
| ------------------- | ----------------------------------------- |
| `pnpm dev`          | Run all apps in development mode          |
| `pnpm build`        | Build all apps and packages               |
| `pnpm start`        | Start all apps in production mode         |
| `pnpm check`        | Run format, lint, and type checks         |
| `pnpm check:format` | Check formatting only                     |
| `pnpm check:lint`   | Run lint checks only                      |
| `pnpm check:types`  | Run type checks only                      |
| `pnpm fix`          | Auto-fix formatting and lint issues       |
| `pnpm clean`        | Remove build artifacts and `node_modules` |

> **Note:** `apps/admin-ui` is a git submodule with its own script names (`lint`, `preview`, ...)
> instead of the `check:*`/`fix:*`/`start` convention above, so Turborepo skips it for those
> tasks (it's still included in `pnpm dev`/`pnpm build`/`pnpm test`, since those names match).
> Run its scripts directly with `pnpm --filter pimsathong5tool <script>` in the meantime.

## Tech Stack

- **Package manager:** [pnpm](https://pnpm.io/) with workspaces
- **Build orchestration:** [Turborepo](https://turborepo.dev/)
- **Linting:** [ESLint](https://eslint.org/)
- **Formatting:** [oxfmt](https://oxc.rs/)
- **Git hooks:** [husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/okonet/lint-staged)

## Contributing

1. Create a branch off `main`.
2. Make your changes inside the relevant `apps/*` or `packages/*` workspace.
3. Run `pnpm check` before committing — the pre-commit hook also runs `lint-staged` automatically.
4. Open a pull request.

<!-- TODO: add contribution guidelines specific to this project/team if any (code owners, review process, branch naming, etc.) -->

## License

<!-- TODO: choose and add a license (e.g. MIT, Apache-2.0, or "Proprietary — internal use only") -->

[TODO: add license]
