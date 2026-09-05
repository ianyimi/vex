import { describe, expect, it } from "vitest";

import { anonRoleDatabaseHook } from "./anonRole";

describe("anonRoleDatabaseHook", () => {
  it("stamps the given role onto an anonymous-plugin user", async () => {
    const hook = anonRoleDatabaseHook("anon");
    const result = await hook.create.before({
      email: "temp-abc123@example.com",
      isAnonymous: true,
      name: "Anonymous",
    });
    expect(result.data.roles).toEqual(["anon"]);
  });

  it("preserves every other field on the anonymous user", async () => {
    const hook = anonRoleDatabaseHook("anon");
    const result = await hook.create.before({
      email: "temp-abc123@example.com",
      isAnonymous: true,
      name: "Anonymous",
    });
    expect(result.data).toMatchObject({
      email: "temp-abc123@example.com",
      isAnonymous: true,
      name: "Anonymous",
    });
  });

  it("leaves a non-anonymous user untouched — no roles override", async () => {
    const hook = anonRoleDatabaseHook("anon");
    const user = { email: "real@example.com", isAnonymous: false, roles: ["user"] };
    const result = await hook.create.before(user);
    expect(result.data).toEqual(user);
  });

  it("leaves a user with no isAnonymous field untouched", async () => {
    const hook = anonRoleDatabaseHook("anon");
    const user = { email: "real@example.com" };
    const result = await hook.create.before(user);
    expect(result.data).toEqual(user);
    expect(result.data.roles).toBeUndefined();
  });

  it("respects the caller's chosen role string", async () => {
    const hook = anonRoleDatabaseHook("guest");
    const result = await hook.create.before({ isAnonymous: true });
    expect(result.data.roles).toEqual(["guest"]);
  });
});
