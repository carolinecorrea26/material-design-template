import type {
  CoverageScope,
  ProductIdentifierSet,
  ScopedIdentifierSet,
} from "../config/coverages/types";

function scopeKey(scope?: CoverageScope): string {
  return `${scope?.applicantType ?? "*"}:${scope?.applicantClassId ?? "*"}`;
}

/** Returns the default identifiers merged with the most-specific matching variant. */
export function resolveScopedIdentifiers<T extends ProductIdentifierSet>(
  identifiers: ScopedIdentifierSet<T>,
  scope: CoverageScope,
): T {
  const match = identifiers.scoped
    ?.filter(({ scope: candidate }) =>
      (!candidate?.applicantType || candidate.applicantType === scope.applicantType) &&
      (!candidate?.applicantClassId || candidate.applicantClassId === scope.applicantClassId),
    )
    .sort((a, b) => scopeKey(b.scope).replaceAll("*", "").length - scopeKey(a.scope).replaceAll("*", "").length)[0];
  const defaults: ProductIdentifierSet = {
    primary: identifiers.primary,
    dummy: identifiers.dummy,
    xml: identifiers.xml,
    pdf: identifiers.pdf,
  };
  return { ...defaults, ...match?.value } as T;
}

export function formatProductIdentifiers(
  identifiers: (ProductIdentifierSet & { scoped?: Array<{ scope?: CoverageScope; value: ProductIdentifierSet }> }) | undefined,
  classLabels: Record<string, string> = {},
): string {
  if (!identifiers) return "—";
  const variants = [
    identifiers.primary,
    identifiers.dummy && `Dummy: ${identifiers.dummy}`,
    identifiers.xml && `XML: ${identifiers.xml}`,
    identifiers.pdf && `PDF: ${identifiers.pdf}`,
  ].filter(Boolean) as string[];
  for (const scoped of identifiers.scoped ?? []) {
    const scopeLabel = scoped.scope?.applicantClassId
      ? classLabels[scoped.scope.applicantClassId] ?? scoped.scope.applicantClassId
      : scoped.scope?.applicantType ?? "Default";
    const value = [
      scoped.value.primary,
      scoped.value.dummy && `dummy ${scoped.value.dummy}`,
      scoped.value.xml && `XML ${scoped.value.xml}`,
      scoped.value.pdf && `PDF ${scoped.value.pdf}`,
    ].filter(Boolean).join(" · ");
    variants.push(`${scopeLabel}: ${value}`);
  }
  return variants.join("\n") || "—";
}
