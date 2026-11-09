import { useCallback } from "react";
import { useApplicationForm } from "./ApplicationFormContext";
import { useApplicationSession } from "./ApplicationSessionContext";

/** Explicit new entry resets the prior application before the form guard mounts.
 * Ordinary navigation/activity must never revive an expired application. */
export function useStartApplication() {
  const { resetValues } = useApplicationForm();
  const { resetApplicationSession } = useApplicationSession();
  return useCallback(() => {
    resetValues();
    resetApplicationSession();
  }, [resetValues, resetApplicationSession]);
}
