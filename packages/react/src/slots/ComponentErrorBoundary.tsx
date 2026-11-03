"use client";

import { Component, type ReactNode } from "react";

/**
 * Wraps one contribution — or, since decision 17, one override layer — so a throwing component
 * cannot take down the whole slot, override chain, or surrounding form (S10). Renders an inline
 * error naming the id instead of propagating, optionally alongside `fallback` (the layer beneath
 * a throwing override, per decision 17) — editing other fields, or other contributions/layers,
 * must stay possible.
 */
export class ComponentErrorBoundary extends Component<
  { id: string; fallback?: ReactNode; children: ReactNode },
  { error: Error | undefined }
> {
  state: { error: Error | undefined } = { error: undefined };

  /**
   * Captures a thrown render error so `render` can show the fallback instead.
   *
   * @param error - The error thrown by a descendant component.
   * @returns The new state, carrying the thrown error.
   */
  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  /**
   * Renders `fallback` (when given) plus an inline error naming `id` when a child threw,
   * otherwise `this.props.children`.
   *
   * @returns The fallback content, or `this.props.children` when no error occurred.
   */
  render() {
    if (this.state.error) {
      return (
        <>
          {this.props.fallback}
          <div
            role="alert"
            className="rounded-sm border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive"
          >
            Component "{this.props.id}" failed to render: {this.state.error.message}
          </div>
        </>
      );
    }
    return this.props.children;
  }
}
