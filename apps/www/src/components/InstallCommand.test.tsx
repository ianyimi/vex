import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { act } from "react"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"

import { createCommands, InstallCommand } from "./InstallCommand"

describe("createCommands", () => {
  it("derives every manager's create command from the seeded pnpm one", () => {
    expect(createCommands("pnpm create vexcms@alpha")).toEqual({
      commands: {
        bun: "bun create vexcms@alpha",
        deno: "deno run -A npm:create-vexcms@alpha",
        npm: "npm create vexcms@alpha",
        pnpm: "pnpm create vexcms@alpha",
        yarn: "yarn create vexcms@alpha",
      },
      written: "pnpm",
    })
  })

  it("puts npm's -- before the first flag, after positional arguments", () => {
    expect(createCommands("npm create vexcms my-site --bare")?.commands.npm).toBe(
      "npm create vexcms my-site -- --bare"
    )
    expect(createCommands("npm create vexcms my-site --bare")?.commands.pnpm).toBe(
      "pnpm create vexcms my-site --bare"
    )
  })

  it("leaves anything that isn't a create command alone", () => {
    expect(createCommands("npx convex dev")).toBeNull()
  })
})

describe("InstallCommand", () => {
  // The hero is prerendered; the first client render has to match it or React
  // client-renders the whole page (#418).
  it("hydrates the prerendered row without a mismatch", async () => {
    const container = document.createElement("div")
    container.innerHTML = renderToString(<InstallCommand command="pnpm create vexcms@alpha" />)
    document.body.append(container)
    const onRecoverableError = vi.fn()
    await act(async () => {
      hydrateRoot(container, <InstallCommand command="pnpm create vexcms@alpha" />, { onRecoverableError })
    })
    expect(onRecoverableError).not.toHaveBeenCalled()
    container.remove()
  })

  it("shows and copies the chosen manager's command without resizing the row", async () => {
    Element.prototype.hasPointerCapture ??= () => false
    Element.prototype.releasePointerCapture ??= () => undefined
    Element.prototype.setPointerCapture ??= () => undefined
    const user = userEvent.setup()
    const { container } = render(<InstallCommand command="pnpm create vexcms@alpha" />)
    const visible = () => container.querySelector("code > span:not([aria-hidden])")?.textContent

    expect(visible()).toBe("pnpm create vexcms@alpha")
    expect(screen.getByRole("combobox", { name: "Package manager" }).textContent).toContain("pnpm")
    // Every manager's command is reserved in the same cell, so the row's width never changes.
    expect(container.querySelectorAll("code > span[aria-hidden]")).toHaveLength(5)

    await user.click(screen.getByRole("combobox", { name: "Package manager" }))
    await user.click(await screen.findByRole("option", { name: "deno" }))

    await waitFor(() => expect(visible()).toBe("deno run -A npm:create-vexcms@alpha"))
    expect(screen.getByRole("combobox", { name: "Package manager" }).textContent).toContain("deno")
    expect(container.querySelector('button[aria-label="Copy install command (deno)"]')).not.toBeNull()
  })
})
