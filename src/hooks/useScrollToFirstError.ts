import * as React from "react";
import type { FieldErrors, UseFormReturn, FieldValues } from "react-hook-form";

export function useScrollToFirstError<T extends FieldValues>(methods: UseFormReturn<T>) {
  React.useEffect(() => {
    const { formState } = methods;
    if (!formState.submitCount) return;
    if (!formState.errors) return;

    const first = firstErrorKey(formState.errors);
    if (!first) return;
    const el = document.querySelector(`[name="${first}"]`) as HTMLElement | null;
    if (el?.scrollIntoView) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus();
    }
  }, [methods.formState.submitCount, methods.formState.errors, methods]);

  function firstErrorKey(errors: FieldErrors): string | null {
    const walk = (obj: Record<string, unknown>, prefix = ""): string | null => {
      for (const k of Object.keys(obj)) {
        const path = prefix ? `${prefix}.${k}` : k;
        const value = obj[k];
        if (isFieldError(value)) return path;
        if (value && typeof value === "object") {
          const child = walk(value as Record<string, unknown>, path);
          if (child) return child;
        }
      }
      return null;
    };

    // Type guard for field error objects
    function isFieldError(value: unknown): boolean {
      return Boolean(
        value &&
        typeof value === "object" &&
        "message" in value
      );
    }

    return walk(errors);
  }
}