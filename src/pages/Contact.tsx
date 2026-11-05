import FormRoutePage from "../app/RoutePage";
import ContactSections from "../app/sections/ConfiguredContactSections";
import { useApplicationForm } from "../app/ApplicationFormContext";
import { getSelectedCategoryIds } from "../config/formFlow";
import { contactCarryForwardTransition, executeApplicationTransition } from "../config/applicationTransitions";
import { getActiveClient } from "../config/client/getActiveClient";
import { showContactBusinessSection } from "../domain/applicantExperience";

export default function Contact() {
  const { values } = useApplicationForm();
  const selectedCategories = getSelectedCategoryIds(values);
  const hasDiOrOo = selectedCategories.some(
    (cat) => cat === "DI" || cat === "OO",
  );

  const defaultValueOverrides = executeApplicationTransition(
    contactCarryForwardTransition,
    values,
    values,
  );
  const selectedProducts = Array.isArray(values.coverageSelections) ? values.coverageSelections.map(String) : [];
  if (values["business-address-same-as-home"] === true && showContactBusinessSection(getActiveClient().applicantExperience, hasDiOrOo, values["correspondence-to"], selectedProducts)) {
    // Seed the reset values too: the parent's initial reset runs after child
    // effects and must not erase the same-as-home address copied on mount.
    for (const key of ["street-address", "apt-suite", "city", "state", "zip-code"]) if (typeof values[key] === "string") defaultValueOverrides[`business-${key}`] = values[key];
  }

  return (
    <FormRoutePage
      pageId="contact"
      defaultValueOverrides={
        defaultValueOverrides as Record<string, string | boolean | string[]>
      }
    >
      {({
        control,
        errors,
        watchedValues,
        allFields,
        pageSections,
        setValue,
      }) => {
        const correspondenceTo = watchedValues["correspondence-to"];
        const showBusinessSection =
          showContactBusinessSection(getActiveClient().applicantExperience, hasDiOrOo, correspondenceTo, Array.isArray(watchedValues.coverageSelections) ? watchedValues.coverageSelections.map(String) : []);
        const sameAsHome = Boolean(
          watchedValues["business-address-same-as-home"],
        );

        return (
          <ContactSections
            control={control}
            errors={errors}
            watchedValues={watchedValues}
            allFields={allFields}
            pageSections={pageSections}
            setValue={setValue}
            showBusinessSection={showBusinessSection}
            sameAsHome={sameAsHome}
            hasDiOrOo={hasDiOrOo}
          />
        );
      }}
    </FormRoutePage>
  );
}
