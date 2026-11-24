import { Alert, Typography } from "@mui/material";
import { Fragment, type ReactNode } from "react";
import type { FormRouteRenderProps } from "../../app/RoutePage";
import type { PageSectionComponent, PageSectionConfig } from "../../config/pageSections/types";
import FieldRenderer from "../forms/FieldRenderer";
import EligibilityFields from "../forms/EligibilityFields";
import DynamicList from "../forms/DynamicList";
import ApplicantSectionDivider from "../layout/ApplicantSectionDivider";
import FieldGrid from "../layout/FieldGrid";
import { FieldGroup } from "../layout/SectionDivider";

export type EligibilitySectionsProps = FormRouteRenderProps & {
  childMode?: 'details' | 'notice-only';
  collection?: import('../../domain/fieldCollections').ResolvedFieldCollection;
  sectionNotes?: Record<string, string | undefined>;
  applicantLabels?: import("../../config/clients/types").ClientApplicantLabels;
  eligibleStatesOnly?: boolean;
};

/** Requirements own composition and fields; adapters supply effective participation and values. */
export default function EligibilitySections({ control, errors, watchedValues, allFields, pageSections, setValue,
  childMode, collection, sectionNotes = {}, applicantLabels, eligibleStatesOnly,
}: EligibilitySectionsProps) {
  const renderComponent = (component: PageSectionComponent, section: PageSectionConfig): ReactNode => {
    const fields = (component.fieldIds ?? section.fieldIds).flatMap(id => allFields.filter(field => field.id === id));
    const children = component.components?.flatMap((child, index) => { const content = renderComponent(child, section); return content === null ? [] : [<Fragment key={`${child.type}-${index}`}>{content}</Fragment>]; });
    if (component.type === 'SectionNote') return sectionNotes[section.id] ? <Alert severity="info" sx={{ mb: 2 }}>{sectionNotes[section.id]}</Alert> : null;
    if (component.type === 'FieldGroup') return children?.length ? <FieldGroup className="FieldGroup-root">{children}</FieldGroup> : null;
    if (component.type === 'EligibilityFields') return <EligibilityFields eligibleStatesOnly={eligibleStatesOnly} form={{ control, errors, watchedValues, setValue }} fields={fields} />;
    if (component.type === 'FieldGrid') return fields.length ? <FieldGrid columns="equal">{fields.map(field => <FieldRenderer key={field.id} field={field} control={control} errors={errors} />)}</FieldGrid> : null;
    if (component.type === 'FieldRenderer') return fields.length ? <>{fields.map(field => <FieldRenderer key={field.id} field={field} control={control} errors={errors} />)}</> : null;
    if (component.type !== 'DynamicList') throw new Error(`Unsupported Eligibility component: ${component.type}`);
    if (childMode === 'notice-only') {
      if (!sectionNotes[section.id]?.trim()) throw new Error('Missing fresh-start child section notice');
      return null;
    }
    if (childMode !== 'details') throw new Error('Missing fresh-start child collection mode');
    if (!collection || collection.sectionId !== section.id) throw new Error('Missing fresh-start Eligibility collection');
    return <DynamicList control={control} name={collection.name} label={collection.label} maxItems={collection.maxItems} mapping={collection.mapping}
      renderItem={item => <Typography variant="body2">{collection.mapping.gridFields.map(id => item[collection.mapping.fieldToKey[id]] ?? '').join(' ').trim().toUpperCase()}</Typography>} />;
  };
  return <>{pageSections.map(section => {
    if (!section.composition?.length) throw new Error('Missing fresh-start Eligibility composition');
    const content = section.composition.map((component, index) => <Fragment key={`${component.type}-${index}`}>{renderComponent(component, section)}</Fragment>);
    return <div key={section.id} style={{ marginBottom: 32 }}>
      {section.applicant
        ? <ApplicantSectionDivider applicant={section.applicant} labels={applicantLabels} showLabel={section.applicant !== 'self'}>{content}</ApplicantSectionDivider>
        : content}
    </div>;
  })}</>;
}
