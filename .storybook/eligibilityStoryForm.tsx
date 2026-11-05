import type { ReactNode } from 'react';
import type { EligibilitySectionsProps } from '../src/components/eligibility/EligibilitySections';
import SectionStoryForm from './forms/SectionStoryForm';
import ComponentFixture from './fixtures/ComponentFixture';
import type { TemplateCapability } from '../src/dev/storybook/globalTemplate';

/** Supply authored definitions as detached inputs, without running section participation rules. */
export default function EligibilityStoryForm({ initialValues = {}, capability = 'standard', children }: {
  initialValues?: Record<string, any>;
  capability?: TemplateCapability;
  children: (props: EligibilitySectionsProps) => ReactNode;
}) {
  return <ComponentFixture capability={capability}>{fixture => {
    const page = fixture.site.configuration.pages.find(page => page.key === 'eligibility')!;
    return <SectionStoryForm initialValues={initialValues} fields={page.fields.filter(field => field.included).map(field => field.definition)} sections={page.sections.map(section => section.definition.value)}>
      {props => children({ ...props, collection: fixture.fieldCollections.children,
        applicantLabels: fixture.client.applicantLabels,
        childNotice: fixture.client.applicantExperience?.childEligibility?.mode === 'notice-only' ? fixture.client.applicantExperience.childEligibility.note : undefined,
        eligibleStatesOnly: fixture.client.applicantExperience?.eligibleStatesOnly,
        sectionNotes: fixture.content.pages.eligibility?.sectionNotes,
      })}
    </SectionStoryForm>;
  }}</ComponentFixture>;
}
