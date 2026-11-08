---
"@vexcms/core": patch
"@vexcms/better-auth": patch
---

`defineServerConfig` now throws `VexAuthConfigError` when `access.userRolesField` is
client-writable through the registered auth adapter's user collection. A role field that
end users can set through sign-up or profile update is a privilege escalation, and it now
fails at `vex dev` instead of shipping.

**`VexAuthAdapter` gains an optional `clientWritableUserFields`.** `betterAuthAdapter()`
fills it from the merged user table's fields (including `user.additionalFields`) where
`input !== false`. Any other adapter that wants this check opts in the same way;
omitting the property skips the check entirely.

**Upgrade note.** If `access.userRolesField` names a field your auth provider lets end
users set directly, `vex dev` and anything importing your server config now fails
immediately with `VexAuthConfigError` naming the field, the adapter and the fix — add
`input: false` to that field's definition (for Better Auth, in
`authSchema.user.additionalFields` and the matching entry passed to `betterAuth()`).
