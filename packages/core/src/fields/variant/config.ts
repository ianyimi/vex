import { ADMIN_FIELDS } from "../constants";
import { childInterfaceType } from "../childInterfaceType";
import { VexConfigError } from "../../errors";
import { BaseFieldMeta } from "../types";
import { getDataFields, resolveFieldComponents } from "../utils";
import { classifyVariantMemberKind, VARIANT_MEMBER_KINDS, buildDefaultVariantMember } from "./utils";
import { VARIANT_DISPLAYS } from "./types";
import type {
  DiscriminatedVariantField,
  DiscriminatedVariantFieldInput,
  PrimitiveVariantField,
  PrimitiveVariantFieldInput,
  VariantField,
  VariantFieldInput,
  VariantMemberConfig,
} from "./types";
import type { AdminField, AdminDataField } from "../types";
import type { VexResourceSlug } from "../../types/generated";

function buildVariantMemberInterfaceType(props: {
  discriminator: string;
  key: string;
  fields: Record<string, AdminField>;
}): string {
  const discriminatorEntry = `${props.discriminator}: "${props.key}"`;
  const userEntries = Object.entries(getDataFields({ fields: props.fields }))
    .map(([key, field]) => `${key}${field.required ? "" : "?"}: ${childInterfaceType(field)}`)
    .join("; ");
  return userEntries ? `{ ${discriminatorEntry}; ${userEntries} }` : `{ ${discriminatorEntry} }`;
}

function buildDiscriminatedVariantInterfaceType(props: {
  variants: Record<string, VariantMemberConfig>;
  interfaceName?: string;
}): string {
  if (props.interfaceName) return props.interfaceName;
  const members = Object.values(props.variants).map((member) => member.interfaceType);
  return members.length > 0 ? members.join(" | ") : "never";
}

function buildPrimitiveVariantInterfaceType(props: {
  variants: Record<string, AdminDataField>;
  interfaceName?: string;
}): string {
  if (props.interfaceName) return props.interfaceName;
  const members = Object.values(props.variants).map((member) => childInterfaceType(member));
  return members.length > 0 ? members.join(" | ") : "never";
}

function buildDiscriminatedVariant<
  TCollectionSlug extends VexResourceSlug,
  TFieldKey extends string,
  TFieldMeta extends BaseFieldMeta,
>(
  options: DiscriminatedVariantFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>,
): DiscriminatedVariantField<TCollectionSlug, TFieldMeta> {
  const variants: Record<string, VariantMemberConfig> = {};
  for (const [key, member] of Object.entries(options.variants)) {
    if (options.discriminator in member.fields) {
      throw new VexConfigError(
        `variant(): variant "${key}" declares a field named "${options.discriminator}", which is this ` +
          `field's own discriminator key. Rename the field, or the discriminator.`,
      );
    }
    variants[key] = {
      label: member.label,
      fields: member.fields,
      interfaceType: buildVariantMemberInterfaceType({
        discriminator: options.discriminator,
        key,
        fields: member.fields,
      }),
    };
  }

  const firstKey = Object.keys(variants)[0];
  const required = options.required ?? false;
  const defaultValue =
    options.defaultValue ??
    (required && firstKey !== undefined
      ? buildDefaultVariantMember({ discriminator: options.discriminator, key: firstKey, member: variants[firstKey]! })
      : undefined);

  return {
    type: ADMIN_FIELDS.variant.type,
    interfaceType: buildDiscriminatedVariantInterfaceType({ variants, interfaceName: options.interfaceName }),
    label: options.label ?? "",
    required,
    nullable: options.nullable ?? false,
    defaultValue,
    discriminator: options.discriminator,
    variants,
    interfaceName: options.interfaceName,
    index: options.index,
    description: options.description,
    interfaceDescription: options.interfaceDescription,
    dependsOn: options.dependsOn,
    validate: options.validate,
    admin: {
      display: options.admin?.display ?? VARIANT_DISPLAYS.select,
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      enableSorting: false,
      enableHiding: true,
      placeholder: "",
      defaultCollapsed: false,
      ...options?.admin,
      components: resolveFieldComponents({ components: options?.admin?.components }),
    },
    meta: { ...options.meta } as TFieldMeta,
  };
}

function buildPrimitiveVariant<
  TCollectionSlug extends VexResourceSlug,
  TFieldKey extends string,
  TFieldMeta extends BaseFieldMeta,
>(
  options: PrimitiveVariantFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>,
): PrimitiveVariantField<TCollectionSlug, TFieldMeta> {
  const membersByKind = new Map<string, string[]>();
  const variants: Record<string, AdminDataField> = {};
  for (const [key, member] of Object.entries(options.variants)) {
    const kind = classifyVariantMemberKind({ field: member });
    if (kind === VARIANT_MEMBER_KINDS.unknown) {
      throw new VexConfigError(
        `variant(): member "${key}" (type "${member.type}") has no distinguishable runtime storage kind ` +
          `and cannot be used in a primitive variant() — give the field a "discriminator" to build an ` +
          `object union instead.`,
      );
    }
    membersByKind.set(kind, [...(membersByKind.get(kind) ?? []), key]);
    variants[key] = { ...member, required: true } as AdminDataField;
  }
  for (const [kind, members] of membersByKind) {
    if (members.length > 1) {
      throw new VexConfigError(
        `variant(): members ${members.map((m) => `"${m}"`).join(", ")} all store a "${kind}" value at ` +
          `runtime — primitive variant() members must have distinct runtime kinds so the active member ` +
          `can be recovered from the stored value alone.`,
      );
    }
  }

  const firstKey = Object.keys(variants)[0];
  const required = options.required ?? false;
  const defaultValue =
    options.defaultValue ?? (required && firstKey !== undefined ? variants[firstKey]!.defaultValue : undefined);

  return {
    type: ADMIN_FIELDS.variant.type,
    interfaceType: buildPrimitiveVariantInterfaceType({ variants, interfaceName: options.interfaceName }),
    label: options.label ?? "",
    required,
    nullable: options.nullable ?? false,
    defaultValue,
    variants,
    interfaceName: options.interfaceName,
    index: options.index,
    description: options.description,
    interfaceDescription: options.interfaceDescription,
    dependsOn: options.dependsOn,
    validate: options.validate,
    admin: {
      display: options.admin?.display ?? VARIANT_DISPLAYS.select,
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      enableSorting: false,
      enableHiding: true,
      placeholder: "",
      defaultCollapsed: false,
      ...options?.admin,
      components: resolveFieldComponents({ components: options?.admin?.components }),
    },
    meta: { ...options.meta } as TFieldMeta,
  };
}

/**
 * Creates a variant field with all defaults applied — a discriminated object
 * union (`options.discriminator` set) or a primitive union (unset).
 *
 * Discriminated: each variant's own `fields` becomes a `v.object()` keyed by
 * `discriminator` as a `v.literal()`, with no injected `id`/`blockName` keys
 * (unlike `blocks()`) — so an existing `v.union(v.object({ kind: v.literal(...) ,
 * ... }), ...)` column maps exactly. Primitive: each member is any
 * `AdminDataField`; members must resolve to distinct runtime storage kinds
 * (checked via `classifyVariantMemberKind`) and are never wrapped in
 * `v.optional()` regardless of their own `required`.
 *
 * @param options - Discriminated or primitive variant configuration.
 * @returns Resolved variant field definition with all defaults applied.
 *
 * @throws {VexConfigError} Discriminated: a variant's `fields` declares a key
 *   equal to `discriminator`.
 * @throws {VexConfigError} Primitive: a member's type has no distinguishable
 *   runtime kind (`json()`, or a nested primitive `variant()`), or two
 *   members share a kind.
 *
 * @example
 * ```ts
 * channel: variant({
 *   discriminator: "kind",
 *   variants: {
 *     email: { label: "Email", fields: { address: text({ required: true }) } },
 *     sms:   { label: "SMS",   fields: { phoneNumber: text({ required: true }) } },
 *   },
 * })
 * amount: variant({ variants: { fixed: text({ required: true }), metered: number({ required: true }) } })
 * ```
 *
 * @see {@link VariantFieldInput} for the full input type
 * @see {@link VariantField} for the resolved output type
 */
export function variant<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(
  options: DiscriminatedVariantFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>,
): DiscriminatedVariantField<TCollectionSlug, TFieldMeta>;
export function variant<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(
  options: PrimitiveVariantFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>,
): PrimitiveVariantField<TCollectionSlug, TFieldMeta>;
/**
 * Implementation signature for the `variant()` overloads declared above —
 * rejects an empty `variants` record outright (mirrors `select()`'s own
 * empty-`options` rejection for `schema.validator: "literal"`: an empty set
 * has nothing to store either way), then dispatches to
 * {@link buildDiscriminatedVariant} when `options.discriminator` is set,
 * otherwise {@link buildPrimitiveVariant}.
 *
 * @param options - {@link DiscriminatedVariantFieldInput} or {@link PrimitiveVariantFieldInput}.
 * @returns The resolved {@link VariantField}.
 */
export function variant<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(
  options: VariantFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>,
): VariantField<TCollectionSlug, TFieldMeta> {
  if (Object.keys(options.variants).length === 0) {
    throw new VexConfigError('variant(): "variants" requires at least one entry — an empty variant set has nothing to store.');
  }
  if (options.discriminator !== undefined) {
    return buildDiscriminatedVariant(options);
  }
  return buildPrimitiveVariant(options);
}
