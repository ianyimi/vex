"use client";

import { createFormHook } from "@tanstack/react-form";
import { fieldContext, formContext } from "./formContext";
import { TextField } from "./TextField";
import { TextareaField } from "./TextareaField";
import { EmailField } from "./EmailField";
import { UrlField } from "./UrlField";
import { NumberField } from "./NumberField";
import { CheckboxField } from "./CheckboxField";
import { SelectField } from "./SelectField";
import { DateField } from "./DateField";
import { ColorField } from "./ColorField";
import { JsonField } from "./JsonField";
import { ArrayField } from "./ArrayField";
import { BlocksField } from "./BlocksField";
import { GroupField } from "./GroupField";

/**
 * The app form's `useAppForm` / `withForm` pair — registers every
 * `forms/*Field.tsx` component under `field.<Name>` inside `<form.AppField>`,
 * and every form-level component under `form.<Name>`.
 *
 * `fieldComponents` grows as steps 9–10 land each field; it starts empty so
 * this step's build is self-contained.
 *
 * @see {@link https://tanstack.com/form/latest/docs/framework/react/guides/form-composition}
 */
export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    TextareaField,
    EmailField,
    UrlField,
    NumberField,
    CheckboxField,
    SelectField,
    DateField,
    ColorField,
    JsonField,
    ArrayField,
    BlocksField,
    GroupField,
  },
  formComponents: {},
});
