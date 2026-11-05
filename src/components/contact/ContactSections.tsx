import { Typography } from "@mui/material";
import FieldRenderer from "../forms/FieldRenderer";
import type { FormRouteRenderProps } from '../../app/RoutePage';
import type { ClientApplicantLabels } from '../../config/clients/types';
import type { ApplicantSectionId } from '../../config/formSectionTitle';
import ApplicantSectionDivider from '../layout/ApplicantSectionDivider';
import ResidentialAddress from './ResidentialAddress';
import BusinessInformation from './BusinessInformation';
import SpouseContact from './SpouseContact';

export type ContactSectionsProps = Pick<FormRouteRenderProps, 'control' | 'errors' | 'watchedValues' | 'allFields' | 'pageSections' | 'setValue'> & {
  showBusinessSection: boolean;
  sameAsHome: boolean;
  hasDiOrOo: boolean;
  applicantLabels?: ClientApplicantLabels;
  showApplicantLabels?: Partial<Record<ApplicantSectionId, boolean>>;
};

/** Compose caller-selected sections. Application adapters own visibility and Site rules. */
export default function ContactSections({ control, errors, watchedValues, allFields, pageSections, setValue,
  showBusinessSection, sameAsHome, hasDiOrOo, applicantLabels, showApplicantLabels = {} }: ContactSectionsProps) {
  const fieldsFor = (id: string) => pageSections.find(section => section.id === id)?.fieldIds.flatMap(id => allFields.filter(field => field.id === id)) ?? [];
  return <>
    {pageSections.map(section => {
      if (section.id === 'contactResidentialAddress') return <ApplicantSectionDivider key={section.id} applicant="self" labels={applicantLabels} showLabel={showApplicantLabels.self ?? false}>
        <ResidentialAddress fields={fieldsFor(section.id)} control={control} errors={errors} />
        {showBusinessSection && pageSections.some(section => section.id === 'contactBusinessInfo') && <BusinessInformation fields={fieldsFor('contactBusinessInfo')} control={control} errors={errors}
          watchedValues={watchedValues} setValue={setValue} sameAsHome={sameAsHome} showEmployerDetails={hasDiOrOo} />}
      </ApplicantSectionDivider>;
      if (section.id === 'contactSpouse') return <ApplicantSectionDivider key={section.id} applicant="spouse" labels={applicantLabels} showLabel={showApplicantLabels.spouse ?? true}>
        <SpouseContact fields={fieldsFor(section.id)} control={control} errors={errors} />
      </ApplicantSectionDivider>;
      if (section.id === 'contactBusinessInfo') return null;
      const fields = <>{section.title && <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>{section.title}</Typography>}{fieldsFor(section.id).map(field => <FieldRenderer key={field.id} field={field} control={control} errors={errors} />)}</>;
      return section.applicant ? <ApplicantSectionDivider key={section.id} applicant={section.applicant} labels={applicantLabels} showLabel={showApplicantLabels[section.applicant] ?? true}>{fields}</ApplicantSectionDivider> : <div key={section.id}>{fields}</div>;
    })}
  </>;
}
