// src/components/parity/ParityBreadcrumb.tsx
import * as React from "react";
import { Breadcrumbs, Link as MLink, Typography, Stepper, Step, StepLabel, Box, useMediaQuery, useTheme, MobileStepper, Button } from "@mui/material";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";
import { Link, useLocation, useNavigate } from "react-router-dom";

type CrumbItem = { label: string; to?: string; disabled?: boolean };
type Variant = "breadcrumbs" | "stepper";

export interface ParityBreadcrumbProps {
  variant?: Variant;
  items: CrumbItem[];
  currentIndex?: number; // for stepper mode
  numericSteps?: boolean; // show 1,2,3...
}

export function ParityBreadcrumb({
  variant = "breadcrumbs",
  items,
  currentIndex = 0,
  numericSteps = true
}: ParityBreadcrumbProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (variant === "stepper") {
    // Mobile: Show compact mobile stepper with prev/next navigation
    if (isMobile) {
      const handleBack = () => {
        if (currentIndex > 0 && items[currentIndex - 1]?.to) {
          navigate(items[currentIndex - 1].to!);
        }
      };

      const handleNext = () => {
        if (currentIndex < items.length - 1 && items[currentIndex + 1]?.to) {
          navigate(items[currentIndex + 1].to!);
        }
      };

      return (
        <Box sx={{ width: '100%' }}>
          <MobileStepper
            variant="progress"
            steps={items.length}
            position="static"
            activeStep={currentIndex}
            sx={{ 
              flexGrow: 1,
              bgcolor: 'transparent',
              p: 0,
              '& .MuiMobileStepper-progress': {
                width: '100%'
              }
            }}
            nextButton={
              <Button
                size="small"
                onClick={handleNext}
                disabled={currentIndex === items.length - 1}
                sx={{ minWidth: 'auto', p: 1 }}
              >
                <KeyboardArrowRight sx={{ fontSize: 32 }} />
              </Button>
            }
            backButton={
              <Button
                size="small"
                onClick={handleBack}
                disabled={currentIndex === 0}
                sx={{ minWidth: 'auto', p: 1 }}
              >
                <KeyboardArrowLeft sx={{ fontSize: 32 }} />
              </Button>
            }
          />
          <Typography variant="body2" color="text.secondary" sx={{ display: 'block', textAlign: 'center', fontWeight: 500 }}>
            Step {currentIndex + 1} of {items.length}: {items[currentIndex]?.label}
          </Typography>
        </Box>
      );
    }

    // Desktop: Show horizontal stepper
    return (
      <Box sx={{ width: '100%', mx: 0 }}>
        <Stepper 
          activeStep={currentIndex} 
          alternativeLabel
          nonLinear
          sx={{ 
            width: '100%',
            '& .MuiStepIcon-root.Mui-completed': {
              color: 'success.main',
            }
          }}
        >
          {items.map((it, idx) => (
            <Step key={it.label} completed={idx < currentIndex}>
              <StepLabel
                sx={{
                  cursor: idx < currentIndex && it.to ? 'pointer' : 'default',
                  '& .MuiStepLabel-label': {
                    cursor: idx < currentIndex && it.to ? 'pointer' : 'default',
                  }
                }}
                onClick={() => {
                  if (idx < currentIndex && it.to) {
                    navigate(it.to);
                  }
                }}
              >
                {numericSteps ? <Box component="span" sx={{ mr: 1 }}>{idx + 1}.</Box> : null}
                {it.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
    );
  }

  // breadcrumbs
  return (
    <Breadcrumbs aria-label="breadcrumb">
      {items.map((it, idx) => {
        const isLast = idx === items.length - 1 || it.to === location.pathname;
        if (!it.to || isLast) {
          return (
            <Typography color="text.primary" key={it.label}>
              {it.label}
            </Typography>
          );
        }
        return (
          <MLink component={Link} underline="hover" color="inherit" to={it.to} key={it.label}>
            {it.label}
          </MLink>
        );
      })}
    </Breadcrumbs>
  );
}
