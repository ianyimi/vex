import type { ApplyComponent, ComponentHKT } from "@vexcms/core";

/** Props an override component receives — the slot's own props plus `renderDefault` (S3). */
export type SlotOverrideProps<
  TComponent extends ComponentHKT,
  TProps,
> = TProps & {
  renderDefault: ApplyComponent<TComponent, TProps>;
};
