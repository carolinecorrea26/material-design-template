import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent, Stack, Button, Grid } from "@mui/material";
import { z } from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import RHFTextField from "../components/form/RHFTextField";

const meta: Meta = { title: "Patterns/Form (RHF+Zod)" };
export default meta;
type Story = StoryObj;

const Schema = z.object({
  firstName: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email")
});
type Form = z.infer<typeof Schema>;

export const Basic: Story = {
  render: () => {
    const methods = useForm<Form>({
      resolver: zodResolver(Schema),
      defaultValues: { firstName: "", email: "" }
    });

    return (
      <Card>
        <CardContent>
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit((v)=>alert(JSON.stringify(v, null, 2)))} noValidate>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}><RHFTextField name="firstName" label="First Name" /></Grid>
                <Grid item xs={12} md={6}><RHFTextField name="email" label="Email" /></Grid>
                <Grid item xs={12}>
                  <Stack alignItems="flex-end">
                    <Button type="submit" variant="contained">Submit</Button>
                  </Stack>
                </Grid>
              </Grid>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    );
  }
};
