import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
    // jsdom, not node: config modules like progressSteps.ts read window.location
    // via getActiveClient()/resolveClientId() at import time.
    environment: "jsdom",
    setupFiles: ['./src/test/setup.ts'],
    // Bound source-projection work on developer and CI machines.
    maxWorkers: 2,
    testTimeout: 15_000,
    // Routine prototype verification: shared mechanics once, effective Site
    // assignments separately, then representative journeys and UI end states.
    // Historical migrations, analytics, HTTP servers and pricing are opt-in.
    include: [
      'src/domain/freshStartCatalog.test.ts',
      'src/domain/restoredSites.test.ts',
      'src/domain/amaGiSite.test.ts',
      'src/migration/coverageJourneyAcceptance.test.ts',
      'src/migration/coverageJourneyMatrix.test.ts',
      'src/migration/coverageJourneyExceptionMatrix.test.ts',
      'src/migration/coverageHouseholdAcceptance.test.ts',
      'src/migration/coveragePortfolioAcceptance.test.ts',
      'src/domain/clientRuntimeAccuracy.test.ts',
      'src/config/coverageQuestionRequirements.test.ts',
      'src/config/conditions/conditions.test.ts',
      'src/domain/applicationAuthority.test.ts',
      'src/domain/healthRoutingAuthority.test.ts',
      'src/domain/fieldSourceParity.test.tsx',
      'src/domain/ruleTemplates.test.ts',
      'src/pages/admin/library/libraryRequirements.test.ts',
      'src/app/RoutePage.navigation.test.tsx',
      'src/app/singlePageFlow.test.tsx',
      'src/pages/Coverage.scenarios.test.tsx',
      'src/pages/Review.coverageValidation.test.tsx',
      'src/pages/Review.workflow.test.tsx',
      'src/pages/DocuSign.test.tsx',
      'src/dev/storybook/receiptStories.test.tsx',
      'src/dev/storybook/sharedComponents.test.tsx',
      'src/dev/utils/generateFormData.test.ts',
      'src/dev/utils/prototypeJourney.test.tsx',
      'src/pages/Eligibility.validation.test.tsx',
      'src/components/docs/EmailTemplatesTable.test.tsx',
    ],
  },
});
