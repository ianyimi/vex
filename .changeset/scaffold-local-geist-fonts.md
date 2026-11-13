---
"create-vexcms": patch
---

`base-nextjs` (and the `marketing-site` overlay, which inherits its `package.json`) now loads
Geist via `next/font/local` from the `geist` package instead of `next/font/google`. Google
Fonts intermittently serves extensionless `/l/font?kit=…&skey=…` URLs that hang with no
timeout under Next 16.4.5 + Turbopack dev and wedge the whole dev server after a few requests
(vercel/next.js#99114). `--font-sans` and `--font-geist-mono` keep the same variable names, so
no CSS changes.
