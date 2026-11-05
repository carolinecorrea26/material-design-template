import type { ComponentProps, ReactNode } from 'react';
import SectionStoryForm from './forms/SectionStoryForm';
import { fieldCatalog } from '../src/config/fields';
import { pageSections } from '../src/config/pageSections/pageSections';
import type ContactSections from '../src/components/contact/ContactSections';

type ContactProps = ComponentProps<typeof ContactSections>;
/** No Site, coverage selection or application provider is needed to show a section. */
export default function ContactStoryForm({ children, initialValues = {}, business = false }: {
  children: (props: ContactProps) => ReactNode;
  initialValues?: Record<string, any>;
  business?: boolean;
}) {
  const sections = pageSections.contact ?? [];
  const fields = [...new Set(sections.flatMap(section => section.fieldIds))].map(id => fieldCatalog[id]);
  return <SectionStoryForm initialValues={initialValues} fields={fields} sections={sections}>
    {props => children({ ...props, showBusinessSection: business, hasDiOrOo: business,
      sameAsHome: props.watchedValues['business-address-same-as-home'] === true,
      showApplicantLabels: { spouse: true },
    })}
  </SectionStoryForm>;
}
