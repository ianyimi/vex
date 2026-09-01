"use client";

import { createContext, useContext } from "react";

import { type OrganizationDoc, type UserDoc } from "~/db/constants";

export interface CurrentAuth {
  organization?: OrganizationDoc;
  user: null | UserDoc; // null → unauthenticated → no roles → deny
}
export const AuthContext = createContext<CurrentAuth>({ user: null });

export function AuthProvider(props: {
  children: React.ReactNode;
  value: {
    organization?: OrganizationDoc;
    user: null | UserDoc; // null → unauthenticated → no roles → deny
  };
}) {
  return <AuthContext.Provider value={props.value}>{props.children}</AuthContext.Provider>;
}
/** @returns the current caller `{ user, organization }` from the server layout. */
export function useAuth(): CurrentAuth {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
}
