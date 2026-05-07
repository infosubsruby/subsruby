import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_ONBOARDING_FOUNDATION_STATE,
  readOnboardingFoundationState,
  writeOnboardingFoundationState,
  type OnboardingFoundationState,
} from "@/lib/onboardingSettingsFoundation";

export const useOnboardingFoundation = () => {
  const [state, setState] = useState<OnboardingFoundationState>(DEFAULT_ONBOARDING_FOUNDATION_STATE);

  useEffect(() => {
    setState(readOnboardingFoundationState());
  }, []);

  useEffect(() => {
    writeOnboardingFoundationState(state);
  }, [state]);

  const patch = useCallback((partial: Partial<OnboardingFoundationState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT_ONBOARDING_FOUNDATION_STATE);
  }, []);

  return {
    state,
    setState,
    patch,
    reset,
  };
};
