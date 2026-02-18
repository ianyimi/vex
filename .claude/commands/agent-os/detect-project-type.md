# Detect Project Type and Adapt Standards

Automatically detect the project type and reorganize standards folders to match the project structure. This command runs automatically during project installation but can also be run manually to update standards organization.

## Important Guidelines

- **Always use AskUserQuestion tool** when asking the user anything
- **Detect first, confirm second** — Analyze the codebase then ask user to confirm
- **Update references** — Scan numbered workflow files and update folder references

## Process

### Step 1: Analyze Project Structure

Scan the project to detect its type:

**1a. Check for package managers and frameworks:**
- `package.json` → Node.js/JavaScript project
  - Check for: React, Next.js, Vue, Angular, Svelte (frontend frameworks)
  - Check for: Express, Fastify, NestJS (backend frameworks)
- `Gemfile` → Ruby/Rails project
- `requirements.txt`/`pyproject.toml` → Python/Django/Flask project
- `go.mod` → Go project
- `Cargo.toml` → Rust project
- `composer.json` → PHP/Laravel project
- `.zshrc`, `.bashrc`, `dot_*` files → Dotfiles/Shell configuration project

**1b. Analyze directory structure:**
- Presence of `src/`, `app/`, `pages/` → Web application
- Presence of `cmd/`, `internal/`, `pkg/` → Go application
- Presence of `dot_*`, `run_*`, `.chezmo*` → Chezmoi dotfiles
- Presence of shell scripts, config files → System configuration

**1c. Count file types:**
- `.ts/.tsx/.js/.jsx` files → JavaScript/TypeScript project
- `.py` files → Python project
- `.rb` files → Ruby project
- `.sh/.zsh/.bash` files → Shell script project
- `.yml/.yaml/.toml` config files → Configuration management

### Step 2: Determine Project Type

Based on analysis, classify the project:

**Web Application** (frontend + backend)
- Has web framework dependencies
- Contains UI components
- → Use folders: `frontend/`, `backend/`, `global/`, `testing/`

**Backend API**
- Has backend framework only
- No frontend UI
- → Use folders: `api/`, `database/`, `global/`, `testing/`

**CLI Tool**
- Command-line application
- No web dependencies
- → Use folders: `cli/`, `commands/`, `global/`, `testing/`

**Library/Package**
- Reusable code package
- No application entry point
- → Use folders: `api/`, `implementation/`, `global/`, `testing/`

**Dotfiles/System Configuration**
- Shell configs, dotfiles
- Chezmoi or similar
- → Use folders: `shell/`, `configs/`, `global/`, `tools/`

**Mobile Application**
- React Native, Flutter, Swift, Kotlin
- → Use folders: `mobile/`, `backend/`, `global/`, `testing/`

**Monorepo/Multi-project**
- Multiple project types
- → Use folders: `frontend/`, `backend/`, `shared/`, `global/`, `testing/`

### Step 3: Confirm with User

Use AskUserQuestion to verify the detected type:

```
I analyzed your project and detected it as: **[Detected Type]**

Based on this, I'll organize standards into these folders:
- [folder1]/
- [folder2]/
- global/
- [folder3]/

Is this correct?

Options:
1. Yes, that's correct
2. No, it's actually a [different type] project
3. Custom - let me specify the folders
```

If they choose option 2, ask what type it actually is.
If they choose option 3, ask them to specify the folder names.

### Step 4: Reorganize Standards Folders

**4a. Create new folder structure:**

Create `agent-os/standards/` with the determined folders.

**4b. Map existing standards to new folders:**

Based on project type, map generic standards to appropriate folders:

**For Web Application:**
- `frontend/` ← Keep frontend standards
- `backend/` ← Keep backend standards
- `global/` ← Keep global standards
- `testing/` ← Keep testing standards

**For Dotfiles/System Configuration:**
- `shell/` ← Map from: global/coding-style.md → shell/scripting-style.md
- `configs/` ← Map from: backend/api.md → configs/file-structure.md
- `global/` ← Keep: conventions.md, best-practices.md
- `tools/` ← Map from: frontend/components.md → tools/utilities.md

**For CLI Tool:**
- `cli/` ← Map from: frontend/components.md → cli/commands.md
- `commands/` ← Map from: backend/api.md → commands/arguments.md
- `global/` ← Keep global standards
- `testing/` ← Keep testing standards

**For Backend API:**
- `api/` ← Map from: frontend/components.md → api/endpoints.md, backend/api.md
- `database/` ← Keep: backend/models.md, backend/queries.md
- `global/` ← Keep global standards
- `testing/` ← Keep testing standards

**4c. Copy and adapt files:**

For each mapping:
1. Read the source standard file
2. If needed, adapt the content for the new context (e.g., change "component" to "command")
3. Write to the new location
4. Delete the old file if it doesn't apply

### Step 5: Update Numbered Workflow Files

Scan all numbered command files (e.g., `1-shape-spec.md`, `2-implement-spec.md`) and other commands that reference standards folders:

**Files to check:**
- `commands/agent-os/1-shape-spec.md`
- `commands/agent-os/2-implement-spec.md`
- Any command that references `agent-os/standards/frontend/`, `backend/`, etc.

**For each file:**
1. Read the file content
2. Find all references to old folder paths
3. Replace with new folder paths based on mapping
4. Write updated content back

**Example replacements for Dotfiles project:**
- `agent-os/standards/frontend/` → `agent-os/standards/shell/`
- `agent-os/standards/backend/` → `agent-os/standards/configs/`
- Keep `agent-os/standards/global/` as-is
- `agent-os/standards/testing/` → `agent-os/standards/tools/`

### Step 6: Update Standards Index

Update `agent-os/standards/index.yml` with the new folder structure:

```yaml
# Standards Index - [Project Type]

[folder1]:
  [standard1]:
    description: [description]
  [standard2]:
    description: [description]

[folder2]:
  [standard1]:
    description: [description]

global:
  best-practices:
    description: [description]
  conventions:
    description: [description]

[folder3]:
  [standard1]:
    description: [description]
```

### Step 7: Report Results

```
✓ Project type detected: [Type]

Standards reorganized:
  - [old-folder]/ → [new-folder]/ ([N] files)
  - [old-folder]/ → [new-folder]/ ([N] files)
  - global/ (unchanged)

Workflow files updated:
  - 1-shape-spec.md ✓
  - 2-implement-spec.md ✓
  - [other-command].md ✓

Standards are now organized for your [project type] project!
```

## Usage

This command is called automatically during project installation:
```bash
~/agent-os/scripts/project-install.sh
```

Or run manually to reorganize existing standards:
```bash
/detect-project-type
```

## Integration with project-install.sh

The project-install script should call this command after copying initial standards but before the user starts working. This ensures standards are organized correctly from the start.
