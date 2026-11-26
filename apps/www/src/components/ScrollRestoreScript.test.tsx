import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ScrollRestoreScript } from "./ScrollRestoreScript"

describe("ScrollRestoreScript", () => {
  it("renders nothing on a client render", () => {
    // Vitest's jsdom environment defines `window`, exercising exactly the
    // branch a client-side React commit takes in the browser too — including
    // the `next dev` case this wrapper exists for (`notFound()`'s error
    // shell, where Next/React reconciles the whole root layout from the RSC
    // payload instead of the browser parsing raw HTML). A naive client
    // component that always rendered `<script dangerouslySetInnerHTML>`
    // (the regression this guards against) would commit a REAL `<script>`
    // element here, which the DOM spec guarantees never executes when
    // inserted this way and which React's own renderer additionally warns
    // about ("Encountered a script tag while rendering React component…",
    // confirmed live on `~/components/ThemeScript.tsx` — see
    // `packages/react/src/server/ThemeScript.tsx`'s doc comment). This test
    // fails against that naive implementation and passes against the
    // `typeof window` guard.
    const { container } = render(<ScrollRestoreScript />)
    expect(container.querySelector("script")).toBeNull()
    expect(container).toBeEmptyDOMElement()
  })
})
