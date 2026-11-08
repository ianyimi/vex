import { act } from "react"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"

import { SessionButton } from "./SessionButton"

type SessionState = { data: null; isPending: boolean }

const sessionState: { current: SessionState } = {
  current: { data: null, isPending: true },
}

vi.mock("~/auth/client", () => ({
  signOut: vi.fn(),
  useSession: () => sessionState.current,
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

describe("SessionButton hydration", () => {
  // Better Auth's session store can settle before React hydrates. The server
  // only ever renders the pending control, so the first client render has to
  // match it; otherwise React throws #418 and client-renders the whole page.
  it("hydrates without a mismatch when the session resolved before hydration", async () => {
    sessionState.current = { data: null, isPending: true }
    const container = document.createElement("div")
    container.innerHTML = renderToString(<SessionButton />)
    document.body.append(container)

    sessionState.current = { data: null, isPending: false }
    const onRecoverableError = vi.fn()
    await act(async () => {
      hydrateRoot(container, <SessionButton />, { onRecoverableError })
    })

    expect(onRecoverableError).not.toHaveBeenCalled()
    expect(container.querySelector('a[href="/auth/sign-in"]')).not.toBeNull()
    container.remove()
  })
})
