import type { VexAccessConfig } from "../access";
import { VexAuthConfigError, type VexAuthAdapter } from "../auth/types";

/**
 * Throws when the access config's role field can be set directly by an end
 * user through the registered auth adapter's user collection, instead of
 * only by server-trusted code.
 *
 * Runs only when an auth adapter is registered and `config.access` is
 * configured — neither check has anything to compare without both.
 *
 * @param props.access - The resolved access config, when one is
 *   configured. `undefined` means no RBAC is configured, so there is no
 *   role field to protect.
 * @param props.adapter - The registered auth adapter.
 * @throws {VexAuthConfigError} When `props.access.userRolesField` is listed
 *   in `props.adapter.clientWritableUserFields` for the collection named
 *   by `props.adapter.userCollection`, and that collection matches
 *   `props.access.userCollectionSlug`.
 * @see {@link defineServerConfig} — the only caller
 */
export function assertRolesFieldNotClientWritable(props: {
  access: VexAccessConfig | undefined;
  adapter: VexAuthAdapter;
}): void {
  const { access, adapter } = props;
  if (!access) return;
  if (adapter.userCollection !== access.userCollectionSlug) return;
  if (adapter.clientWritableUserFields === undefined) return;
  if (adapter.clientWritableUserFields.includes(access.userRolesField)) {
    throw new VexAuthConfigError(
      `The access config's userRolesField "${access.userRolesField}" is ` +
        `client-writable through the "${adapter.name}" adapter's ` +
        `"${adapter.userCollection}" collection. Mark it input: false ` +
        `wherever your auth provider configures field writability, so end users ` +
        `cannot set their own role.`,
    );
  }
}
