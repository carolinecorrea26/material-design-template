import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export function usePageTransition() {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Restore intentionally slower transitions between form pages.
    setIsLoading(true);
    const isLongLoad = location.pathname === "/coverage-options";
    const delay = isLongLoad ? 6000 : 3000;

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, delay);

    previousPathRef.current = location.pathname;

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return isLoading;
}
