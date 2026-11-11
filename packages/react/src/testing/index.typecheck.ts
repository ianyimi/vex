import { CheckboxFieldAdmin } from "../fields/checkbox/Field";
import { checkboxFieldFixture } from "../fields/checkbox/testFixture";
import { runVexReactSuite } from "./index";

/**
 * Compile-time pin for `runVexReactSuite`'s `custom[].Component` accepting a
 * real `*FieldAdmin` export — `pnpm typecheck` IS the assertion, no test
 * runner involved.
 *
 * `FieldInputComponent` used to declare its own `collection: CollectionConfig`
 * (narrower than the real `FieldComponentProps`'s `CollectionConfig | GlobalConfig`)
 * and omitted `documentStatus`/`renderDefault` entirely. `ComponentType`
 * comparisons check `defaultProps` covariantly, so a real component's wider
 * `collection` union rejected the narrower target — every consumer wanting to
 * exercise its own field component through `custom` needed a cast.
 */
runVexReactSuite({
  includeCore: false,
  custom: [{ ...checkboxFieldFixture, Component: CheckboxFieldAdmin }],
});
