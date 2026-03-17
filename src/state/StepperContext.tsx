import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getClientFeatures } from "../config/clients";
import { getApplicationPages, findPageIndex } from "../utils/navigation";

type StepperState = {
  activeIndex: number;
  completed: Set<number>;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  markComplete: (index?: number) => void;
};

const StepperContext = React.createContext<StepperState | undefined>(undefined);

export function StepperProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Only consider application section pages for stepper navigation
  // Filter based on client configuration
  const appPages = React.useMemo(() => {
    const features = getClientFeatures();
    return getApplicationPages(features);
  }, []);

  const indexFromPath = React.useMemo(() => {
    const idx = findPageIndex(appPages, location.pathname);
    return idx >= 0 ? idx : 0;
  }, [location.pathname, appPages]);

  const [activeIndex, setActiveIndex] = React.useState(indexFromPath);
  const [completed, setCompleted] = React.useState<Set<number>>(new Set());

  React.useEffect(() => {
    setActiveIndex(indexFromPath);
  }, [indexFromPath]);

  const goTo = (index: number) => {
    const target = appPages[index];
    if (target) navigate(target.path);
  };

  const next = () => goTo(Math.min(activeIndex + 1, appPages.length - 1));
  const prev = () => goTo(Math.max(activeIndex - 1, 0));

  const markComplete = (index = activeIndex) => {
    setCompleted((prev) => new Set(prev).add(index));
  };

  const value: StepperState = {
    activeIndex,
    completed,
    next,
    prev,
    goTo,
    markComplete,
  };
  return (
    <StepperContext.Provider value={value}>{children}</StepperContext.Provider>
  );
}

export function useStepper() {
  const ctx = React.useContext(StepperContext);
  if (!ctx) throw new Error("useStepper must be used within StepperProvider");
  return ctx;
}
