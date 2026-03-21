"use client";

import { useCallback, useState } from "react";
import type { ClientVexConfig } from "@vexcms/core";

/**
 * Hook to manage onboarding tour state.
 *
 * The actual Convex queries/mutations for persisting onboarding status
 * are in the template's `convex/vex/firstUser.ts`. This hook manages
 * the client-side state and provides the interface for the tour component.
 *
 * @param props.config - The client VEX config (to check admin.onboarding.disabled)
 * @param props.isComplete - Whether the user has completed the onboarding (from Convex query)
 * @param props.onComplete - Callback to mark onboarding complete (calls Convex mutation)
 * @param props.onReset - Callback to reset onboarding (calls Convex mutation)
 */
export function useOnboardingTour(props: {
  config: ClientVexConfig;
  isComplete: boolean;
  onComplete: () => void | Promise<void>;
  onReset: () => void | Promise<void>;
}) {
  const [forceShow, setForceShow] = useState(false);

  const disabled = props.config.admin?.onboarding?.disabled ?? false;

  const showTour = !disabled && (!props.isComplete || forceShow);

  const completeTour = useCallback(() => {
    setForceShow(false);
    props.onComplete();
  }, [props.onComplete]);

  const restartTour = useCallback(() => {
    props.onReset();
    setForceShow(true);
  }, [props.onReset]);

  return {
    showTour,
    completeTour,
    restartTour,
  };
}
