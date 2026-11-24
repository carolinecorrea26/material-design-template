import type { ReactNode } from 'react';
import type { EligibilitySectionsProps } from '../src/components/eligibility/EligibilitySections';
import SectionStoryForm from './forms/SectionStoryForm';
import ComponentFixture from './fixtures/ComponentFixture';
import type { TemplateCapability, EligibilityExampleConfiguration } from '../src/dev/storybook/globalTemplate';
import { filterEligibleStateOptions } from '../src/domain/applicantExperience';

/** Supply authored definitions as detached inputs, without running section participation rules. */
export default function EligibilityStoryForm({ initialValues = {}, capability = 'standard', eligibility, children }: {
  initialValues?: Record<string, any>;
  capability?: TemplateCapability;
  eligibility?: EligibilityExampleConfiguration;
  children: (props: EligibilitySectionsProps) => ReactNode;
}) {
  return <ComponentFixture capability={capability} eligibility={eligibility}>{fixture => {
    const page = fixture.site.configuration.pages.find(page => page.key === 'eligibility')!;
    return <SectionStoryForm initialValues={initialValues} fields={page.fields.filter(field => field.included).map(field => filterEligibleStateOptions(field.definition, fixture.client.applicantExperience))} sections={page.sections.map(section => section.definition.value)}>
      {props => children({ ...props, collection: fixture.fieldCollections.children,
        applicantLabels: fixture.client.applicantLabels,
        childMode: fixture.client.applicantExperience?.childEligibility?.mode,
        eligibleStatesOnly: fixture.client.applicantExperience?.eligibleStatesOnly,
        sectionNotes: fixture.content.pages.eligibility?.sectionNotes,
      })}
    </SectionStoryForm>;
  }}</ComponentFixture>;
}
