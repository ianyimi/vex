# VexCMS setup

Set up a new VexCMS project (a type-safe headless CMS built on Convex and Next.js) in the current
folder. Run the commands yourself. Ask the user only where the skill says to.

1. Load the `vexcms-project-init` skill:

   ```bash
   npx skills use ianyimi/vex@vexcms-project-init
   ```

   It prints the skill's instructions and the folder its reference files were downloaded to.
   Follow the instructions, and read any reference file they name from that folder.

2. If `npx skills` can't reach the network, run it again outside the sandbox. If it still can't
   run, fetch https://raw.githubusercontent.com/ianyimi/vex/master/skills/vexcms-project-init/SKILL.md
   and follow it. Its reference files are under
   https://raw.githubusercontent.com/ianyimi/vex/master/skills/vexcms-project-init/references/.

3. When the project runs, tell the user they can install the skill for good with
   `npx skills add ianyimi/vex --skill vexcms-project-init -g`. Every VexCMS skill is listed at
   https://docs.vexcms.dev/guides/agent-skills/.

VexCMS docs for agents: https://docs.vexcms.dev/llms.txt (index), https://docs.vexcms.dev/llms-small.txt (compact).
