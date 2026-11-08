title: Form builder
labels: planned, type: feature, area: core

## Context

There's no way today to collect input from site visitors through VexCMS-managed content; a contact
form needs to be hand-built outside the admin.

## Scope

An admin-authored form builder: an editor-defined set of fields (reusing the leaf field types),
generated client-side + server-side validation from that definition, and a submissions collection
storing each response. Public submissions are rate-limited and spam-protected (no such protection
exists for anonymous `create` today; this issue adds it).

## Acceptance criteria

- [ ] An editor can define a form (fields, labels, validation) in the admin without writing code
- [ ] A published form renders on the frontend and a submission is validated and stored
- [ ] Submissions are viewable in the admin, scoped by role like any other collection

## Out of scope

Payment collection, file uploads inside form submissions, or third-party form-service integrations.
