import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

export function usePageTransition() {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Start loading on location change
    setIsLoading(true);

    // Simulate load time of ~500ms
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return isLoading;
}
