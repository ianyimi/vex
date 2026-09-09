import { createElement, type ComponentType, type ReactNode } from "react";
import { useForm } from "@tanstack/react-form";
import { describe, expect } from "vitest";
import { runRbacStateSuite } from "./rbacState";
import { testCollection } from "./harness/accessFixtures";
import { AppForm } from "../components/form/AppForm";
import { TextFieldInput } from "../components/fields/text/Input";
import { textFieldFixture } from "../components/fields/text/testFixture";

/**
 * `AppForm` narrowed to the two props this harness passes — same documented
 * AP-006 boundary cast `fieldInputContract.ts` uses, including its Step 2
 * finding: widening `AnyFormApi`'s validator-slot defaults does not unlock
 * removing this cast, because `createElement(AppForm, props)` erases ALL of
 * `AppForm`'s generics — `TFormData` included — to `unknown` before checking
 * `props`, independent of what `AnyFormApi` declares as a default. See
 * `fieldInputContract.ts` for the full write-up.
 */
const AppFormBoundary = AppForm as unknown as ComponentType<{
  form: unknown;
  children: ReactNode;
}>;

const expectedPermission: Record<string, boolean> = {
  none: true,
  anonymous: false,
  denied: false,
  allowed: true,
  scoped: false,
};

function PermissionGate(props: { permission: boolean }) {
  return createElement("div", { "data-testid": "gate" }, props.permission ? "granted" : "restricted");
}

describe("runRbacStateSuite — synthetic permission-gated component", () => {
  runRbacStateSuite({
    render: (permission) => createElement(PermissionGate, { permission }),
    assert: (utils, scenario, permission) => {
      expect(permission).toBe(expectedPermission[scenario.name]);
      expect(utils.getByTestId("gate").textContent).toBe(permission ? "granted" : "restricted");
    },
  });
});

/** Mounts `TextFieldInput` behind a real `useForm`/`AppForm` pair, same mounting mechanism as `runFieldInputContractSuite`. */
function TextFieldHarness(props: { readOnly: boolean }) {
  const form = useForm({ defaultValues: { title: textFieldFixture.valid } });
  return createElement(
    AppFormBoundary,
    { form } as { form: unknown; children: ReactNode },
    createElement(TextFieldInput, {
      name: "title",
      fieldDef: textFieldFixture.fieldDef,
      collection: testCollection,
      readOnly: props.readOnly,
    }),
  );
}

describe("runRbacStateSuite — TextFieldInput readOnly derived from usePermission", () => {
  runRbacStateSuite({
    render: (permission) => createElement(TextFieldHarness, { readOnly: !permission }),
    assert: (utils, scenario, permission) => {
      expect(!permission).toBe(!expectedPermission[scenario.name]);
      const input = utils.getByRole("textbox") as HTMLInputElement;
      expect(input.disabled).toBe(!permission);
    },
  });
});
