---
"@vexcms/react": patch
---

`row()`'s `FormRow` now sizes each child's slot from its own live `admin.condition` instead of the static schema: a condition-hidden child reserves no slot and its visible siblings share the freed width, reactively re-flowing as the controlling sibling field changes. A row with every child condition-hidden still renders nothing. Previously a conditionally hidden child kept an empty reserved slot because widths were resolved before `FieldConditionGate` evaluated each child's condition deeper in the tree.
