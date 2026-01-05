import React from 'react';
import {
  Stack, Typography, FormGroup, FormControlLabel, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogContentText, IconButton,
  Box, Alert, FormControl, InputLabel, Select, MenuItem, FormHelperText, Button, FormLabel
} from "@mui/material";
import { BlockOutlined, People, Person, ChildFriendly, Close as CloseIcon, Add as AddIcon } from '@mui/icons-material';
import PageHeader from "../components/layout/PageHeader";
import PageNavigation from "../components/layout/PageNavigation";
import { CollapsibleSection } from "../components/common";
import { FormProvider, useForm, Controller, useWatch } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import RHFTextField from "../components/form/RHFTextField";
import RHFRadioGroup from "../components/form/RHFRadioGroup";
import RHFSelect from "../components/form/RHFSelect";
import DateField from "../components/form/DateField";
import { EligibilitySchema, type EligibilityForm, CoverageCat } from "../validation/eligibility";
import { useAppData } from "../state/AppDataContext";
import { useStepper } from "../state/StepperContext";
import { useNavigate } from "react-router-dom";
import { useScrollToFirstError } from "../hooks/useScrollToFirstError";
import { commonStyles } from "../theme/commonStyles";
import { getClientMembershipQuestion, ACTIVE_CLIENT_ID } from "../config/clients";
import {
  SELF_COVERAGE_OPTIONS,
  SPOUSE_COVERAGE_OPTIONS,
  TITLE_OPTIONS,
  TOBACCO_PRODUCTS,
  STATE_OPTIONS
} from "../constants/eligibility";


const SELF_OPTS: CoverageCat[] = SELF_COVERAGE_OPTIONS;
const SPOUSE_OPTS: CoverageCat[] = SPOUSE_COVERAGE_OPTIONS;

export default function Eligibility() {
  const { data, setEligibility } = useAppData();
  const { next, markComplete } = useStepper();
  const navigate = useNavigate();
  const [showIneligibleDialog, setShowIneligibleDialog] = React.useState(false);

  const methods = useForm<EligibilityForm>({
    resolver: zodResolver(EligibilitySchema) as any,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: data.eligibility ?? {
      isMember: undefined,
      title: "",
      firstName: "",
      middleInitial: "",
      lastName: "",
      suffix: "",
      birthday: "",
      gender: undefined,
      email: "",
      applicants: { self: false, spouse: false, child: false },
      selfCoverages: [],
      spouseIsMember: undefined,
      spouseTitle: "",
      spouseFirstName: "",
      spouseMiddleInitial: "",
      spouseLastName: "",
      spouseSuffix: "",
      spouseBirthday: "",
      spouseGender: undefined,
      spouseEmail: "",
      spouseCoverages: [],
      children: [],
      state: "",
      selfTobaccoLastUsed: "",
      selfTobaccoProducts: [],
      spouseTobaccoLastUsed: "",
      spouseTobaccoProducts: []
    }
  });
  useScrollToFirstError(methods);

  // Scroll to top when there are errors after form submission
  React.useEffect(() => {
    if (methods.formState.submitCount > 0 && Object.keys(methods.formState.errors).length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [methods.formState.submitCount, methods.formState.errors]);

  // Get client-specific membership question configuration
  const membershipQuestion = getClientMembershipQuestion();

  const watchSelf = useWatch({ control: methods.control, name: "applicants.self" });
  const watchSpouse = useWatch({ control: methods.control, name: "applicants.spouse" });
  const watchChild = useWatch({ control: methods.control, name: "applicants.child" });
  const selfCov = useWatch({ control: methods.control, name: "selfCoverages" }) as CoverageCat[] | undefined;
  const spouseCov = useWatch({ control: methods.control, name: "spouseCoverages" }) as CoverageCat[] | undefined;
  const membershipValue = useWatch({ control: methods.control, name: "isMember" });
  const selfSmoker = useWatch({ control: methods.control, name: "smokerSelf" });
  const spouseSmoker = useWatch({ control: methods.control, name: "smokerSpouse" });
  // Check if there are any spouse-related errors
  const hasSpouseErrors = Object.keys(methods.formState.errors).some(key => key.startsWith('spouse'));
  const hasChildErrors = Object.keys(methods.formState.errors).some(key => key.startsWith('children'));

  // Ensure at least one child exists when child is selected
  React.useEffect(() => {
    const currentChildren = methods.getValues("children");
    if (watchChild && (!currentChildren || currentChildren.length === 0)) {
      methods.setValue("children", [{ firstName: "", lastName: "", birthday: "", gender: undefined, militaryDischarge: undefined }]);
    }
  }, [watchChild, methods]);

  React.useEffect(() => {
    if (membershipValue === "no") {
      setShowIneligibleDialog(true);
    }
  }, [membershipValue]);

  // DevTools: Fill form with test data
  React.useEffect(() => {
    const handleFillForm = () => {
      // Basic self information - set membership based on client
      const membershipValue = ACTIVE_CLIENT_ID === 'ama' ? 'physician' : 'yes';
      
      const filledData: EligibilityForm = {
        isMember: membershipValue,
        firstName: "John",
        middleInitial: "A",
        lastName: "Doe",
        birthday: "1985-01-15",
        gender: "male",
        email: "john.doe@example.com",
        state: "New York",
        
        applicants: { self: true, spouse: true, child: true },
        selfCoverages: ["LI", "DI", "OO", "SH"],
        selfAvgIncome: "5000",
        selfHoursPerWeek: "40",
        selfMonthlyExpenses: "$5,000",
        selfRespPct: "100",
        smokerSelf: "yes",
        selfTobaccoLastUsed: "06/15/2020",
        selfTobaccoProducts: [
          "Betel nut", "Chewing tobacco", "Cigar", "Cigarettes", "E-Cigarettes",
          "Nicotine gum", "Nicotine inhaler", "Nicotine lozenge", "Nicotine patch",
          "Nasal spray", "Pipe", "Snuff"
        ],
        
        spouseIsMember: ACTIVE_CLIENT_ID !== 'ama' ? "yes" : undefined,
        spouseFirstName: "Jane",
        spouseMiddleInitial: "B",
        spouseLastName: "Doe",
        spouseBirthday: "03/22/1987",
        spouseGender: "female",
        spouseEmail: "jane.doe@example.com",
        spouseCoverages: ["LI", "DI", "SH"],
        spouseAvgIncome: "$4,500",
        spouseHoursPerWeek: "35",
        smokerSpouse: "yes",
        spouseTobaccoLastUsed: "11/08/2019",
        spouseTobaccoProducts: [
          "Betel nut", "Chewing tobacco", "Cigar", "Cigarettes", "E-Cigarettes",
          "Nicotine gum", "Nicotine inhaler", "Nicotine lozenge", "Nicotine patch",
          "Nasal spray", "Pipe", "Snuff"
        ],
        
        children: [{
          firstName: "Alex",
          lastName: "Doe",
          birthday: "08/10/2015",
          gender: "male",
          militaryDischarge: "no"
        }]
      };
      
      methods.reset(filledData);
    };

    window.addEventListener('devtools:fillform', handleFillForm);
    return () => window.removeEventListener('devtools:fillform', handleFillForm);
  }, [methods]);

  const onSubmit: SubmitHandler<EligibilityForm> = (values) => {
    // Allow submission for valid membership values
    const validMembershipValues = ['yes', 'physician', 'resident', 'student', 'retired', 'spouse'];
    if (validMembershipValues.includes(values.isMember || '')) {
      setEligibility(values);
      markComplete();
      next();
      navigate("/coverage");
    }
  };

  const covBox = (name: "selfCoverages" | "spouseCoverages", opts: CoverageCat[]) => (
    <Controller
      name={name}
      control={methods.control}
      render={({ field }) => {
        const val = (field.value as CoverageCat[]) ?? [];
        const toggle = (code: CoverageCat) =>
          field.onChange(val.includes(code) ? val.filter(c => c !== code) : [...val, code]);
        const labelFor = (c: CoverageCat) =>
          c === "LI" ? "Life and/or Accidental Death & Dismemberment (AD&D)" :
          c === "DI" ? "Disability Insurance" :
          c === "OO" ? "Office Overhead Expense Insurance" :
          "Supplemental Health Insurance";
        return (
          <Stack>
            {opts.map(opt => (
              <FormControlLabel
                key={opt}
                control={<Checkbox checked={val.includes(opt)} onChange={() => toggle(opt)} />}
                label={labelFor(opt)}
              />
            ))}
          </Stack>
        );
      }}
    />
  );

  // Helper function to render membership question based on client config
  const renderMembershipQuestion = (name: string, question: string, isRequired: boolean = true) => {
    if (!membershipQuestion) {
      // Fallback to default radio question
      return (
        <RHFRadioGroup
          name={name}
          label={question}
          options={[
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" }
          ]}
          required={isRequired}
        />
      );
    }

    if (membershipQuestion.type === 'radio') {
      return (
        <RHFRadioGroup
          name={name}
          label={question}
          options={[
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" }
          ]}
          required={isRequired}
        />
      );
    } else if (membershipQuestion.type === 'select') {
      // Use spouseOptions for spouse questions, fallback to options
      const options = name.startsWith('spouse') && membershipQuestion.spouseOptions 
        ? membershipQuestion.spouseOptions 
        : membershipQuestion.options;
      
      if (options) {
        return (
          <RHFSelect
            name={name}
            label={question}
            options={options}
            required={isRequired}
          />
        );
      }
    }

    // Fallback
    return (
      <RHFRadioGroup
        name={name}
        label={question}
        options={[
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" }
        ]}
        required={isRequired}
      />
    );
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2}>
          <PageHeader 
            title="Check Eligibility"
            notes="Please provide the following information to determine your eligibility for coverage. This program provides exclusive group rates."
          />

          {/* Page-level Error Alert */}
          {Object.keys(methods.formState.errors).length > 0 && (
            <Alert severity="error">
              Help us determine your eligibility for coverage by completing all required fields.
            </Alert>
          )}
          
          {/* Section 1: Who is this insurance for? */}
          <Box sx={commonStyles.applicantsBox(!!methods.formState.errors.applicants)}>
            <FormLabel required>
              Who is this insurance for?
            </FormLabel>
            <FormGroup>
              <Controller name="applicants.self" control={methods.control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox checked={!!field.value} onChange={(_,v)=>field.onChange(v)} />}
                    label="Myself"
                  />
                )} />
              <Controller name="applicants.spouse" control={methods.control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox checked={!!field.value} onChange={(_,v)=>field.onChange(v)} />}
                    label="Spouse"
                  />
                )} />
              <Controller name="applicants.child" control={methods.control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox checked={!!field.value} onChange={(_,v)=>field.onChange(v)} />}
                    label="Child(ren)"
                  />
                )} />
            </FormGroup>
            {methods.formState.errors.applicants?.message && (
              <FormHelperText error sx={commonStyles.formHelperText}>
                {methods.formState.errors.applicants.message}
              </FormHelperText>
            )}
          </Box>

          {/* Your Eligibility Section - Always visible */}
          <CollapsibleSection
            title="Your Eligibility"
            icon={<Person color="primary" />}
          >
            <Stack spacing={3}>
                <Alert severity="info">
                  We need to collect certain information about you even if you are applying for dependent-only coverage.
                </Alert>
                
                {renderMembershipQuestion("isMember", membershipQuestion?.primaryQuestion || "Are you an active member of a State, Local, or Specialty Bar Association?")}                <Stack 
                  direction={{ xs: 'column', md: 'row' }} 
                  spacing={2}
                >
                  <Box sx={{ width: { xs: '100%', md: '100px' } }}>
                    <RHFSelect
                      name="title"
                      label="Title"
                      options={TITLE_OPTIONS}
                    />
                  </Box>
                  <Box sx={{ flex: { xs: '1', md: '1' } }}>
                    <RHFTextField
                      name="firstName"
                      label="First Name"
                      required
                    />
                  </Box>
                  <Box sx={{ width: { xs: '100%', md: '60px' } }}>
                    <RHFTextField
                      name="middleInitial"
                      label="MI"
                      inputProps={{ maxLength: 1 }}
                    />
                  </Box>
                  <Box sx={{ flex: { xs: '1', md: '1' } }}>
                    <RHFTextField
                      name="lastName"
                      label="Last Name"
                      required
                    />
                  </Box>
                  <Box sx={{ width: { xs: '100%', md: '100px' } }}>
                    <RHFTextField
                      name="suffix"
                      label="Suffix"
                    />
                  </Box>
                </Stack>

                <DateField
                  name="birthday"
                  label="Birthday"
                  required
                  autoComplete="bday"
                />

                <RHFRadioGroup
                  name="gender"
                  label="Gender"
                  options={[
                    { label: "Male", value: "male" },
                    { label: "Female", value: "female" }
                  ]}
                  required
                />

                <RHFSelect name="state" label="State" options={STATE_OPTIONS} required />

                <RHFTextField 
                  name="email" 
                  label="Email" 
                  type="email"
                  required
                  helperText="Provide a valid email address where you can receive important updates about your application."
                  autoComplete="email"
                />
                
                {/* Coverage Options - Only show when "Myself" is selected */}
                {watchSelf && (
                  <Stack spacing={2}>
                    <Box>
                      <FormLabel required>
                        Choose the group coverage(s) you are interested in:
                      </FormLabel>
                      {covBox("selfCoverages", SELF_OPTS)}
                      {methods.formState.submitCount > 0 && selfCov?.length === 0 && (
                        <FormHelperText error sx={commonStyles.formHelperText}>
                          Please select a coverage option.
                        </FormHelperText>
                      )}
                    </Box>

                    {/* Nicotine for LI/SH */}
                    {selfCov && (selfCov.includes("LI") || selfCov.includes("SH")) && (
                        <Stack spacing={2}>
                          <RHFRadioGroup
                            name="smokerSelf"
                            label="Have you used tobacco or any nicotine substitute in any form (including nicotine patches and nicotine chewing gum)?"
                            options={[{label:"Yes",value:"yes"},{label:"No",value:"no"}]}
                            required
                          />
                          
                          {/* Tobacco use details - show if yes */}
                          {selfSmoker === "yes" && (
                            <>
                              <DateField 
                                name="selfTobaccoLastUsed"
                                label="Last Used" 
                                required
                              />
                              
                              <Controller
                                name="selfTobaccoProducts"
                                control={methods.control}
                                render={({ field, fieldState }) => (
                                  <FormControl fullWidth error={!!fieldState.error} required>
                                    <InputLabel id="self-tobacco-products-label">Product(s) Used</InputLabel>
                                    <Select
                                      {...field}
                                      labelId="self-tobacco-products-label"
                                      label="Product(s) Used"
                                      multiple
                                      value={field.value || []}
                                      renderValue={(selected) => (selected as string[]).join(', ')}
                                    >
                                      {TOBACCO_PRODUCTS.map((product) => (
                                        <MenuItem key={product} value={product}>
                                          <Checkbox checked={field.value?.includes(product) || false} />
                                          {product}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                    {fieldState.error && (
                                      <FormHelperText>{fieldState.error.message}</FormHelperText>
                                    )}
                                  </FormControl>
                                )}
                              />
                            </>
                          )}
                        </Stack>
                    )}

                    {/* DI extras */}
                    {selfCov && selfCov.includes("DI") && (
                        <Stack spacing={2}>
                          <Controller
                            name="selfAvgIncome"
                            control={methods.control}
                            render={({ field, fieldState }) => (
                              <RHFTextField
                                name={field.name}
                                label="Average Monthly Income"
                                required
                                value={field.value}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9]/g, '');
                                  const formatted = value ? `$${parseInt(value).toLocaleString()}` : '';
                                  field.onChange(formatted);
                                }}
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message || "Monthly income is asked to help determine the amount of disability coverage you may qualify for."}
                              />
                            )}
                          />
                          <RHFTextField name="selfHoursPerWeek" label="# Hours You Work/Week" required />
                        </Stack>
                    )}

                    {/* OO extras */}
                    {selfCov && selfCov.includes("OO") && (
                        <Stack spacing={2}>
                          <Controller
                            name="selfMonthlyExpenses"
                            control={methods.control}
                            render={({ field, fieldState }) => (
                              <RHFTextField
                                name={field.name}
                                label="Monthly Business Expenses"
                                required
                                value={field.value}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9]/g, '');
                                  const formatted = value ? `$${parseInt(value).toLocaleString()}` : '';
                                  field.onChange(formatted);
                                }}
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message || "Please refer to the brochure for definition"}
                              />
                            )}
                          />
                          <Controller
                            name="selfRespPct"
                            control={methods.control}
                            render={({ field, fieldState }) => (
                              <RHFTextField
                                name={field.name}
                                label="% You Are Responsible For"
                                required
                                value={field.value}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9]/g, '');
                                  if (value) {
                                    let numValue = parseInt(value);
                                    if (numValue > 100) numValue = 100;
                                    field.onChange(numValue.toString());
                                  } else {
                                    field.onChange('');
                                  }
                                }}
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message || 'If you are incorporated, a partner or a joint tenant, include only your personal share of covered overhead. "Personal share" is defined as (a) your percentage of ownership of the business, or (b) your share of the office space if a joint tenant'}
                              />
                            )}
                          />
                        </Stack>
                    )}
                  </Stack>
                )}
            </Stack>
          </CollapsibleSection>

          {/* Spouse Section */}
          <Box sx={{ display: (watchSpouse || hasSpouseErrors) ? 'block' : 'none' }}>
            <CollapsibleSection
              title="Spouse Eligibility"
              icon={<People color="primary" />}
            >
              <Stack spacing={3}>
                <Alert severity="info">
                    Domestic Partnership/Civil Union is determined by State Law and they will be referred to as "Spouse" throughout the application.
                  </Alert>
                  
                  <Stack spacing={2}>
                    {ACTIVE_CLIENT_ID !== 'ama' && renderMembershipQuestion("spouseIsMember", membershipQuestion?.spouseQuestion || "Is your Spouse also an active member of a State, Local, or Specialty Bar Association?", false)}
                    
                    {/* Spouse Name Fields */}
                    <Stack 
                      direction={{ xs: 'column', md: 'row' }} 
                      spacing={2}
                    >
                      <Box sx={{ width: { xs: '100%', md: '100px' } }}>
                        <RHFSelect
                          name="spouseTitle"
                          label="Title"
                          options={TITLE_OPTIONS}
                        />
                      </Box>
                      <Box sx={{ flex: { xs: '1', md: '1' } }}>
                        <RHFTextField name="spouseFirstName" label="First Name" required />
                      </Box>
                      <Box sx={{ width: { xs: '100%', md: '60px' } }}>
                        <RHFTextField 
                          name="spouseMiddleInitial" 
                          label="MI" 
                          inputProps={{ maxLength: 1 }}
                        />
                      </Box>
                      <Box sx={{ flex: { xs: '1', md: '1' } }}>
                        <RHFTextField name="spouseLastName" label="Last Name" required />
                      </Box>
                      <Box sx={{ width: { xs: '100%', md: '100px' } }}>
                        <RHFTextField name="spouseSuffix" label="Suffix" />
                      </Box>
                    </Stack>

                    <DateField 
                    name="spouseBirthday"
                    label="Birthday" 
                    required
                    />                    {/* Spouse Gender */}
                    <RHFRadioGroup
                      name="spouseGender"
                      label="Gender"
                      options={[{label:"Male",value:"male"},{label:"Female",value:"female"}]}
                      required
                    />

                    {/* Spouse Email */}
                    <RHFTextField
                      name="spouseEmail"
                      label="Email"
                      type="email"
                      required
                      helperText="We'll use this email to send important information about the policy."
                    />
                    
                    <Box>
                      <Typography variant="h6" sx={commonStyles.sectionHeading}>
                        Choose the group coverage(s) you are interested in: <Typography component="span" color="error">*</Typography>
                      </Typography>
                      {covBox("spouseCoverages", SPOUSE_OPTS)}
                      {methods.formState.submitCount > 0 && spouseCov?.length === 0 && (
                        <FormHelperText error sx={commonStyles.formHelperText}>
                          Please select a coverage option.
                        </FormHelperText>
                      )}
                    </Box>

                    {/* Nicotine for LI/SH */}
                    {spouseCov && (spouseCov.includes("LI") || spouseCov.includes("SH")) && (
                        <Stack spacing={2}>
                          <RHFRadioGroup
                            name="smokerSpouse"
                            label="Has your spouse used tobacco or any nicotine substitute in any form (including nicotine patches and nicotine chewing gum)?"
                            options={[{label:"Yes",value:"yes"},{label:"No",value:"no"}]}
                            required
                          />
                          
                          {/* Tobacco use details - show if yes */}
                          {spouseSmoker === "yes" && (
                            <>
                              <DateField 
                                name="spouseTobaccoLastUsed"
                                label="Last Used" 
                                required
                              />
                              
                              <Controller
                                name="spouseTobaccoProducts"
                                control={methods.control}
                                render={({ field, fieldState }) => (
                                  <FormControl fullWidth error={!!fieldState.error} required>
                                    <InputLabel id="spouse-tobacco-products-label">Product(s) Used</InputLabel>
                                    <Select
                                      {...field}
                                      labelId="spouse-tobacco-products-label"
                                      label="Product(s) Used"
                                      multiple
                                      value={field.value || []}
                                      renderValue={(selected) => (selected as string[]).join(', ')}
                                    >
                                      {TOBACCO_PRODUCTS.map((product) => (
                                        <MenuItem key={product} value={product}>
                                          <Checkbox checked={field.value?.includes(product) || false} />
                                          {product}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                    {fieldState.error && (
                                      <FormHelperText>{fieldState.error.message}</FormHelperText>
                                    )}
                                  </FormControl>
                                )}
                              />
                            </>
                          )}
                        </Stack>
                    )}

                    {/* DI extras */}
                    {spouseCov && spouseCov.includes("DI") && (
                        <Stack spacing={2}>
                          <Controller
                            name="spouseAvgIncome"
                            control={methods.control}
                            render={({ field, fieldState }) => (
                              <RHFTextField
                                name={field.name}
                                label="Average Monthly Income"
                                required
                                value={field.value}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9]/g, '');
                                  const formatted = value ? `$${parseInt(value).toLocaleString()}` : '';
                                  field.onChange(formatted);
                                }}
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message || "Monthly income is asked to help determine the amount of disability coverage you may qualify for."}
                              />
                            )}
                          />
                          <RHFTextField name="spouseHoursPerWeek" label="# Hours You Work/Week" required />
                        </Stack>
                    )}
                  </Stack>
              </Stack>
            </CollapsibleSection>
          </Box>

          {/* Child Section */}
          <Box sx={{ display: (watchChild || hasChildErrors) ? 'block' : 'none' }}>
            <CollapsibleSection
              title="Child Eligibility"
              icon={<ChildFriendly color="primary" />}
            >
              <Stack spacing={2}>
                <Alert severity="info">
                  Only unmarried children are eligible for coverage.
                </Alert>
                
                {methods.watch("children").map((_, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 2,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1
                        }}
                      >
                        <Stack spacing={2}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle1" sx={commonStyles.subsectionHeadingBold}>
                              Child Information
                            </Typography>
                            {methods.watch("children").length > 1 && (
                              <Button
                                size="small"
                                color="error"
                                onClick={() => {
                                  const currentChildren = methods.getValues("children");
                                  methods.setValue("children", currentChildren.filter((_, i) => i !== index));
                                }}
                              >
                                Remove
                              </Button>
                            )}
                          </Stack>
                          
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <Box sx={{ flex: 1 }}>
                              <RHFTextField name={`children.${index}.firstName`} label="First Name" required />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <RHFTextField name={`children.${index}.lastName`} label="Last Name" required />
                            </Box>
                          </Stack>
                          
                          <DateField 
                          name={`children.${index}.birthday`}
                          label="Birthday" 
                          required
                          />                          <RHFRadioGroup
                            name={`children.${index}.gender`}
                            label="Gender"
                            options={[{label:"Male",value:"male"},{label:"Female",value:"female"}]}
                            required
                          />
                          
                          <RHFRadioGroup
                            name={`children.${index}.militaryDischarge`}
                            label="Has this child been honorably discharged from active or reserve services in the Armed Forces?"
                            options={[{label:"Yes",value:"yes"},{label:"No",value:"no"}]}
                            required
                          />
                        </Stack>
                      </Box>
                    ))}
                    
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    const currentChildren = methods.getValues("children");
                    methods.setValue("children", [...currentChildren, { firstName: "", lastName: "", birthday: "", gender: undefined, militaryDischarge: undefined }]);
                  }}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Add Child
                </Button>
              </Stack>
            </CollapsibleSection>
          </Box>

          <PageNavigation 
            hasUnsavedChanges={() => {
              const formValues = methods.getValues();
              const hasData = formValues.firstName || formValues.lastName || formValues.email || formValues.birthday;
              return methods.formState.isDirty || !!hasData;
            }}
          />
        </Stack>
      </form>

      <Dialog
        open={showIneligibleDialog}
        onClose={() => setShowIneligibleDialog(false)}
        aria-labelledby="ineligible-dialog-title"
      >
        <DialogTitle 
          id="ineligible-dialog-title"
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            pb: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BlockOutlined color="error" />
            Ineligible for Coverage
          </Box>
          <IconButton
            edge="end"
            onClick={() => setShowIneligibleDialog(false)}
            aria-label="close"
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            We're sorry, but only members are eligible for coverage. If you need more information, please contact the Plan Administrator at the address below. To cancel this session, simply close this window.
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );

}