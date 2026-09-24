import { useApplicationSession } from "./ApplicationSessionContext";

/** @deprecated Use ApplicationSessionProvider. */
export { ApplicationSessionProvider as ReviewSubmittedProvider } from "./ApplicationSessionContext";

/** @deprecated Use useApplicationSession. */
export function useReviewSubmitted() {
  const { reviewSubmitted, markReviewSubmitted } = useApplicationSession();
  return { isReviewSubmitted: reviewSubmitted, markReviewSubmitted };
}
