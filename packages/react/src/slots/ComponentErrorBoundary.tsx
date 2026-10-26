"use client";

import { Component, type ReactNode } from "react";

/**
 * Wraps one contribution so a throwing third-party component cannot take down the whole slot or
 * the surrounding form (S10). Renders an inline error naming the contribution's id instead of
 * propagating — editing other fields, or other contributions in the same slot, must stay possible.
 */
export class ComponentErrorBoundary extends Component<
  { id: string; children: ReactNode },
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
   * Renders the fallback error message when a child threw, otherwise its children.
   *
   * @returns The fallback error message, or `this.props.children` when no error occurred.
   */
  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="rounded-sm border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive"
        >
          Component "{this.props.id}" failed to render:{" "}
          {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}
