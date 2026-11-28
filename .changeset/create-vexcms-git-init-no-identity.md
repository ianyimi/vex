---
"create-vexcms": patch
---

A failed `git init` no longer fails the scaffold. On a machine without git `user.name`/`user.email`
(a fresh machine, a container, a CI runner), the initial commit failed and `create-vexcms` exited
with an error after every file was already written. It now warns and keeps the repository with
every file staged, so `git commit` is all that's left; a missing `git` warns and skips the
repository.
