# Tmux Workspace

Session: `project-vex`
Root: `~/Documents/Projects/vex.git/dev/`

## Pane Map

### Window 0 — `node` (dev servers)

| Pane | Target | Command | What to read here |
|------|--------|---------|-------------------|
| Left | `project-vex:0.0` | `pnpm dev` | Turbo output: tsup rebuild lines (`⚡️ Build success`), Next.js compile/errors (`✓ Compiled`), HTTP request log |
| Right | `project-vex:0.1` | `pnpm dev:vex` | Convex function errors, schema codegen (`✔ Convex functions ready`), vex CLI watcher |

### Window 1 — `nvim` (editor)

| Pane | Target | Command |
|------|--------|---------|
| Left | `project-vex:1.0` | `nvim` |
| Top-right | `project-vex:1.1` | `claude` (Claude Code session) |
| Bottom-right | `project-vex:1.2` | `zsh` (free shell) |

### Window 2 — `agents` (pi sessions)

| Pane | Target | Purpose |
|------|--------|---------|
| Left | `project-vex:2.0` | Pi agent |
| Right | `project-vex:2.1` | Pi agent (secondary) |

## Reading Live Output

**In Pi — use the `tmux_pane` tool:**
```
tmux_pane({ pane: "project-vex:0.0" })   // pnpm dev  — Next.js + all tsup watchers
tmux_pane({ pane: "project-vex:0.1" })   // pnpm dev:vex — Convex + vex CLI
```

**Via bash:**
```bash
tmux capture-pane -t project-vex:0.0 -p -S -100   # last 100 lines of pnpm dev
tmux capture-pane -t project-vex:0.1 -p -S -100   # last 100 lines of convex dev
```

## Rules

- **Never start `pnpm dev` or `pnpm dev:vex`** — they are permanently running in window 0. Starting duplicates causes port conflicts and double-build churn.
- **Never kill or restart panes in window 0** without explicit developer instruction.
- Before browsing after a code change, confirm a rebuild completed: look for `⚡️ Build success` (tsup) or `✓ Compiled` (Next.js) in `project-vex:0.0`.
- Convex query/mutation errors appear in `project-vex:0.1` — always check this pane when a Convex call fails.

## Keeping This File Current

Run `/sync-tmux-layout` any time you reorganise panes. It re-scans the session and updates this file plus the tmuxinator config in chezmoi.
