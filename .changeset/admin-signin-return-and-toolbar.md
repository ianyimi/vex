---
"@vexcms/react": patch
"@vexcms/next": patch
---

Admin chrome fixes:

- **Sign in return URL.** `AdminTopNav`'s "Sign in" return URL now keeps the active saved view (`?view=`), so signing in returns you to the same list tab.
- **Sidebar trigger alignment.** The sidebar trigger icon now lines up with the content edge.
- **Toolbar alignment.** `ListViewToolbar` hides its empty wrappers (`empty:hidden`), so the first control lines up with the page title.
- **Internal references removed.** Comments and error text in `@vexcms/react` and `@vexcms/next` no longer cite internal spec/decision labels. For example, `NextAdminPage`'s missing-`authPromise` error no longer points to a spec file.
