---
"@vexcms/react": patch
---

List view filter builder fixes:

- **Scrolling works.** The panel used to have a scrollbar that did nothing, and conditions spilled
  past the bottom of the panel. It now scrolls normally and stops growing once it shows the OR
  button plus about 3.25 single-condition OR groups.
- **It lines up with the table.** The panel opens 8px below the Filter button, level with the
  top of the table.
- **New OR groups go on top.** The OR button is now above the groups. Each new group appears
  first, just under the button, and the existing groups move down.
- **The last condition can't be removed.** When only one condition is left, its × clears the
  condition instead of removing it, and is disabled while the condition is still empty. The
  open builder always shows at least one condition.

`DataTableResponsiveMenu` gains an optional `sideOffset` prop for the desktop popover's distance
from its trigger (default `4`).
