import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

type ReviewSubmittedContextValue = {
  isReviewSubmitted: boolean;
  markReviewSubmitted: () => void;
};

const ReviewSubmittedContext =
  createContext<ReviewSubmittedContextValue | null>(null);

export function ReviewSubmittedProvider({ children }: { children: ReactNode }) {
  const [isReviewSubmitted, setIsReviewSubmitted] = useState(() => {
    return window.sessionStorage.getItem("reviewSubmitted") === "true";
  });

  useEffect(() => {
    function handleReviewSubmitted() {
      setIsReviewSubmitted(true);
    }

    window.addEventListener("reviewsubmitted", handleReviewSubmitted);
    return () =>
      window.removeEventListener("reviewsubmitted", handleReviewSubmitted);
  }, []);

  const value = useMemo<ReviewSubmittedContextValue>(
    () => ({
      isReviewSubmitted,
      markReviewSubmitted: () => {
        setIsReviewSubmitted(true);
        window.sessionStorage.setItem("reviewSubmitted", "true");
      },
    }),
    [isReviewSubmitted],
  );

  return (
    <ReviewSubmittedContext.Provider value={value}>
      {children}
    </ReviewSubmittedContext.Provider>
  );
}

export function useReviewSubmitted() {
  const context = useContext(ReviewSubmittedContext);

  if (!context) {
    throw new Error(
      "useReviewSubmitted must be used within a ReviewSubmittedProvider",
    );
  }

  return context;
}
