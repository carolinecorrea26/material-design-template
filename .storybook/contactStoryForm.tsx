import type { ComponentProps, ReactNode } from 'react';
import SectionStoryForm from './forms/SectionStoryForm';
import type ContactSections from '../src/components/contact/ContactSections';
import ComponentFixture from './fixtures/ComponentFixture';

type ContactProps = ComponentProps<typeof ContactSections>;
/** No Site, coverage selection or application provider is needed to show a section. */
export default function ContactStoryForm({ children, initialValues = {}, business = false }: {
  children: (props: ContactProps) => ReactNode;
  initialValues?: Record<string, any>;
  business?: boolean;
}) {
  return <ComponentFixture>{fixture => {
    const page = fixture.site.configuration.pages.find(page => page.key === 'contact')!;
    const sections = page.sections.map(section => section.definition.value);
    const fields = page.fields.filter(field => field.included).map(field => field.definition);
    return <SectionStoryForm initialValues={initialValues} fields={fields} sections={sections}>
    {props => children({ ...props, showBusinessSection: business, hasDiOrOo: business,
      sameAsHome: props.watchedValues['business-address-same-as-home'] === true,
      showApplicantLabels: { spouse: true },
    })}
    </SectionStoryForm>;
  }}</ComponentFixture>;
}
