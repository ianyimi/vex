import { useEffect, type RefObject } from "react";

/**
 * Keeps an element's `aria-controls` from dangling once the id it points at
 * stops existing in the DOM — the case a Base UI `Accordion.Trigger` hits on
 * every collapse, since its panel fully unmounts rather than just hiding
 * (`aria-controls: open ? panelId : undefined` is Base UI's own
 * computation). React applies that removal through normal reconciliation, so
 * no cleanup is usually needed — this guards the window where some OTHER
 * write (a custom `render` prop, a future Base UI version) could leave the
 * attribute referencing an id no longer in the document, which axe's
 * `aria-valid-attr-value` flags. A `MutationObserver` on the element itself
 * catches every `aria-controls` write regardless of source and strips it the
 * instant `document.getElementById` can't resolve it — it never DERIVES or
 * reapplies a value, only removes dangling ones.
 *
 * @param ref - The element whose `aria-controls` attribute to police.
 */
export function useAriaControlsCleanup(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => {
      const id = el.getAttribute("aria-controls");
      if (id && !document.getElementById(id)) {
        el.removeAttribute("aria-controls");
      }
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(el, { attributes: true, attributeFilter: ["aria-controls"] });
    return () => observer.disconnect();
  }, [ref]);
}
